// --- REVIEW WORKFLOW ---------------------------------------------------------
// Finalized content (articles and social pieces) can be submitted to users with
// the reviewer/admin role. Lifecycle: draft -> finalized -> in_review ->
// approved (or back to draft on "request changes"). The review record lives on
// the item (articles) or on the social sub-doc; reviewers are notified via the
// bell + email, same plumbing as @mentions. Also serves the cross-workspace
// "needs your attention" list.
const express = require('express');
const { db, FieldValue, getAuth, COMMENTS_COLLECTION } = require('../lib/firebase');
const { canAccessWorkspace, canReviewWorkspace } = require('../lib/authz');
const { requireItemWorkspaceAccess } = require('../lib/guards');
const {
  VALID_DECISIONS,
  canManageActiveReview,
  canWithdraw,
  canDecide,
  statusAfterDecision,
} = require('../lib/reviewLifecycle');
const {
  parseReviewBody,
  resolveReviewTarget,
  reviewPieceLabel,
  reviewLinkFor,
  itemTitleOf,
} = require('../lib/reviewTargets');
const { getWorkspaces } = require('../lib/workspacesStore');
const { createNotification } = require('../lib/notifications');
const { sendEmail, mentionEmailHtml, APP_BASE_URL } = require('../lib/email');
const { ReviewSubmitError, submitReview } = require('../lib/reviewSubmission');
const { log: logger } = require('../logger');

const router = express.Router();

// Cross-workspace to-do list for the signed-in user: reviews where they're
// tagged and waiting, and their own pieces sent back with changes requested.
// Powers the "needs your attention" strip on the home page, so a reviewer in
// several workspaces sees everything pending the moment they log in.
router.get('/api/attention', async (req, res) => {
  try {
    const toMillis = (ts) => (ts && typeof ts.toMillis === 'function') ? ts.toMillis() : (ts?._seconds ? ts._seconds * 1000 : null);
    const workspaces = getWorkspaces().filter(w => !w.deletedAt && canAccessWorkspace(req.user, w.id));
    const wsById = Object.fromEntries(workspaces.map(w => [w.id, w]));

    const snap = await db.collection('content_pipeline_library').get();
    const entries = [];

    snap.forEach(doc => {
      const d = doc.data();
      const wid = d.workspaceId;
      const ws = wsById[wid];
      if (!ws) return;
      const title = itemTitleOf(d);

      const consider = (kind, channel, status, review, link) => {
        if (!review) return;
        if (status === 'in_review'
            && (review.reviewers || []).includes(req.user.uid)
            && canReviewWorkspace(req.user, wid)) {
          entries.push({
            type: 'review_requested',
            workspaceId: wid, workspaceName: ws.name, workspaceTheme: ws.theme || '#2563eb',
            itemId: doc.id, kind, channel, title, link,
            requestedByEmail: review.requestedByEmail || null,
            note: review.note || null,
            at: toMillis(review.requestedAt),
          });
        } else if (status === 'draft'
            && review.decision === 'request_changes'
            && review.requestedBy === req.user.uid) {
          entries.push({
            type: 'changes_requested',
            workspaceId: wid, workspaceName: ws.name, workspaceTheme: ws.theme || '#2563eb',
            itemId: doc.id, kind, channel, title, link,
            decidedByEmail: review.decidedByEmail || null,
            comment: review.comment || null,
            at: toMillis(review.decidedAt),
          });
        }
      };

      // Original-idea items have no article to review — only their socials count.
      if (d.sourceType !== 'original') {
        consider('article', null, d.status || 'draft', d.review, `/workspace/${wid}/library/item/${doc.id}`);
      }
      for (const [key, val] of Object.entries(d.socials || {})) {
        if (!val || typeof val !== 'object') continue;
        let channel, kind;
        if (key.endsWith('_carousel')) { channel = key.slice(0, -'_carousel'.length); kind = 'carousel'; }
        else if (key.endsWith('_poster')) { channel = key.slice(0, -'_poster'.length); kind = 'poster'; }
        else { channel = key; kind = 'text'; }
        if (!['linkedin', 'x'].includes(channel)) continue;
        consider(kind, channel, val.status || 'approved', val.review,
          `/workspace/${wid}/library/item/${doc.id}/social/${channel}?kind=${kind}`);
      }
    });

    entries.sort((a, b) => (b.at || 0) - (a.at || 0));

    // Per-workspace counts so the home cards can wear a badge.
    const countsByWorkspace = {};
    for (const e of entries) {
      countsByWorkspace[e.workspaceId] = (countsByWorkspace[e.workspaceId] || 0) + 1;
    }

    res.json({ entries, countsByWorkspace });
  } catch (error) {
    console.error('Error building attention list:', error);
    res.status(500).json({ error: 'Failed to load your attention list' });
  }
});

// Submit finalized content for review, tagging specific reviewers. The
// submission itself lives in lib/reviewSubmission.js (shared with /api/v1).
router.post('/api/reviews/submit', async (req, res) => {
  try {
    const parsed = parseReviewBody(req, res);
    if (!parsed) return;
    const { itemId, kind, channel } = parsed;
    const { reviewers, note } = req.body || {};

    const result = await submitReview({ user: req.user, itemId, kind, channel, reviewers, note });
    res.json({ status: 'success', reviewStatus: result.reviewStatus, reviewers: result.reviewers, note: result.note });
  } catch (error) {
    if (error instanceof ReviewSubmitError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error submitting for review:', error);
    res.status(500).json({ error: 'Failed to submit for review' });
  }
});

// Withdraw an active review: back to finalized, keeping the review record.
// Tagged reviewers get a bell notification (no email) so stale requests don't
// linger in their queue.
router.post('/api/reviews/withdraw', async (req, res) => {
  try {
    const parsed = parseReviewBody(req, res);
    if (!parsed) return;
    const { itemId, kind, channel } = parsed;

    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const item = doc.data();
    const workspaceId = item.workspaceId || null;

    const target = resolveReviewTarget(item, kind, channel);
    if (!target) {
      return res.status(404).json({ error: `No ${kind} content found.` });
    }
    if (!canWithdraw(target.status)) {
      return res.status(409).json({ error: 'This content is not awaiting review.' });
    }
    if (!canManageActiveReview(target.review, req.user)) {
      return res.status(403).json({ error: 'Only the requester or an admin can withdraw a review.' });
    }

    const review = {
      ...target.review,
      withdrawnBy: req.user.uid,
      withdrawnAt: FieldValue.serverTimestamp(),
    };
    const update = kind === 'article'
      ? { status: 'finalized', review, updatedAt: FieldValue.serverTimestamp() }
      : {
          [`socials.${target.socialKey}.status`]: 'finalized',
          [`socials.${target.socialKey}.review`]: review,
        };
    await db.collection('content_pipeline_library').doc(itemId).update(update);

    const requesterName = req.user.email ? req.user.email.split('@')[0] : 'Someone';
    const itemTitle = itemTitleOf(item);
    const piece = reviewPieceLabel(kind, channel);
    const link = reviewLinkFor(workspaceId, itemId, kind, channel);
    await Promise.all((target.review?.reviewers || []).map(uid =>
      createNotification(uid, {
        type: 'review',
        title: `${requesterName} withdrew the review request on "${itemTitle}"`,
        message: piece,
        workspaceId,
        link,
      }).catch(() => {})
    ));

    logger.event('review.withdrawn', { itemId, kind, channel: channel || null, workspaceId });
    res.json({ status: 'success', reviewStatus: 'finalized' });
  } catch (error) {
    console.error('Error withdrawing review:', error);
    res.status(500).json({ error: 'Failed to withdraw the review' });
  }
});

// Reviewer decision: approve (-> approved) or request changes (-> draft, with a
// required comment that is also posted to the item's comment thread).
router.post('/api/reviews/decide', async (req, res) => {
  try {
    const parsed = parseReviewBody(req, res);
    if (!parsed) return;
    const { itemId, kind, channel } = parsed;
    const { decision, comment } = req.body || {};
    if (!VALID_DECISIONS.includes(decision)) {
      return res.status(400).json({ error: 'decision must be approve or request_changes' });
    }
    const cleanComment = (comment || '').trim();
    if (decision === 'request_changes' && !cleanComment) {
      return res.status(400).json({ error: 'A comment explaining the requested changes is required.' });
    }

    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const item = doc.data();
    const workspaceId = item.workspaceId || null;
    if (!canReviewWorkspace(req.user, workspaceId)) {
      return res.status(403).json({ error: 'You are not a reviewer for this workspace' });
    }

    const target = resolveReviewTarget(item, kind, channel);
    if (!target) {
      return res.status(404).json({ error: `No ${kind} content found to review.` });
    }
    if (!canDecide(target.status)) {
      return res.status(409).json({ error: 'This content is not awaiting review.' });
    }

    const newStatus = statusAfterDecision(decision);
    const decidedReview = {
      ...target.review,
      decision,
      decidedBy: req.user.uid,
      decidedByEmail: req.user.email || '',
      decidedAt: FieldValue.serverTimestamp(),
      comment: cleanComment || null,
    };
    const update = kind === 'article'
      ? { status: newStatus, review: decidedReview, updatedAt: FieldValue.serverTimestamp() }
      : {
          [`socials.${target.socialKey}.status`]: newStatus,
          [`socials.${target.socialKey}.review`]: decidedReview,
        };
    await db.collection('content_pipeline_library').doc(itemId).update(update);

    const reviewerName = req.user.email ? req.user.email.split('@')[0] : 'A reviewer';
    const itemTitle = itemTitleOf(item);
    const piece = reviewPieceLabel(kind, channel);
    const link = reviewLinkFor(workspaceId, itemId, kind, channel);

    // Keep the decision on the record: post it into the item's comment thread.
    if (cleanComment) {
      await db.collection(COMMENTS_COLLECTION).add({
        itemId,
        workspaceId,
        authorUid: req.user.uid,
        authorEmail: req.user.email || '',
        authorName: reviewerName,
        text: `[Review — ${decision === 'approve' ? 'approved' : 'changes requested'} on the ${piece}] ${cleanComment}`,
        mentions: [],
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Notify the requester (unless they decided their own request).
    const requesterUid = target.review.requestedBy;
    if (requesterUid && requesterUid !== req.user.uid) {
      const title = decision === 'approve'
        ? `${reviewerName} approved the ${piece} on "${itemTitle}"`
        : `${reviewerName} requested changes on the ${piece} for "${itemTitle}"`;
      await createNotification(requesterUid, {
        type: 'review',
        title,
        message: cleanComment || '',
        workspaceId,
        link,
      });
      try {
        const requester = await getAuth().getUser(requesterUid);
        if (requester.email) {
          const absoluteLink = link ? `${APP_BASE_URL}${link}` : null;
          await sendEmail({
            to: requester.email,
            subject: title,
            text: `${title}${cleanComment ? `\n\n"${cleanComment}"` : ''}\n\n${absoluteLink || ''}`,
            html: mentionEmailHtml({ authorName: reviewerName, itemTitle, body: cleanComment || title, link: absoluteLink }),
          });
        }
      } catch (err) {
        console.error('Failed to email review requester:', err.message);
      }
    }

    logger.event('review.decided', {
      itemId, kind, channel: channel || null, workspaceId,
      decision, newStatus,
    });
    res.json({ status: 'success', reviewStatus: newStatus });
  } catch (error) {
    console.error('Error deciding review:', error);
    res.status(500).json({ error: 'Failed to record the review decision' });
  }
});

module.exports = router;
