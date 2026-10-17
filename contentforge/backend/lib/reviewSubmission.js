// Review submission, extracted from routes/reviews.js so the app route and
// /api/v1 share one implementation: eligibility checks, the review record
// write, and reviewer notifications (bell + email).
const { db, FieldValue, getAuth, USERS_COLLECTION } = require('./firebase');
const { canAccessWorkspace, canReviewWorkspace } = require('./authz');
const { isActiveReview, canStartReview, canManageActiveReview } = require('./reviewLifecycle');
const { resolveReviewTarget, reviewPieceLabel, reviewLinkFor, itemTitleOf } = require('./reviewTargets');
const { createNotification } = require('./notifications');
const { sendEmail, mentionEmailHtml, APP_BASE_URL } = require('./email');
const { log: logger } = require('../logger');

// A submission failure the caller maps to an HTTP status (message is user-safe).
class ReviewSubmitError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Submit finalized content for review, tagging specific reviewers. `kind` and
// `channel` are already normalized (see reviewTargets.parseReviewBody).
// Returns { reviewStatus, reviewers, note, isUpdate }.
async function submitReview({ user, itemId, kind, channel, reviewers, note }) {
  if (!Array.isArray(reviewers) || reviewers.length === 0) {
    throw new ReviewSubmitError(400, 'Pick at least one reviewer.');
  }

  const doc = await db.collection('content_pipeline_library').doc(itemId).get();
  if (!doc.exists) throw new ReviewSubmitError(404, 'Item not found');
  const item = doc.data();
  const workspaceId = item.workspaceId || null;
  if (workspaceId && !canAccessWorkspace(user, workspaceId)) {
    throw new ReviewSubmitError(403, 'You do not have access to this workspace');
  }

  const target = resolveReviewTarget(item, kind, channel);
  if (!target) {
    throw new ReviewSubmitError(404, `No ${kind} content found to review.`);
  }
  // Submitting while already in_review UPDATES the active review (add/remove
  // reviewers, change the note); only newly tagged reviewers are notified.
  const isUpdate = isActiveReview(target.status);
  if (!isUpdate && !canStartReview(target.status)) {
    throw new ReviewSubmitError(422, 'Finalize the content before submitting it for review.');
  }
  if (isUpdate && !canManageActiveReview(target.review, user)) {
    throw new ReviewSubmitError(403, 'Only the requester or an admin can change an active review.');
  }

  // Every tagged reviewer must hold a reviewer grant covering this workspace.
  const cleanReviewers = Array.from(new Set(reviewers.filter(u => typeof u === 'string' && u)));
  const reviewerDocs = await Promise.all(
    cleanReviewers.map(uid => db.collection(USERS_COLLECTION).doc(uid).get())
  );
  for (const d of reviewerDocs) {
    const u = d.exists ? d.data() : null;
    if (!u || !canReviewWorkspace(u, workspaceId)) {
      throw new ReviewSubmitError(400, 'One of the selected users is not an eligible reviewer for this workspace.');
    }
  }

  const prevReviewers = isUpdate ? (target.review?.reviewers || []) : [];
  const review = {
    reviewers: cleanReviewers,
    note: (note || '').trim() || null,
    requestedBy: isUpdate ? (target.review?.requestedBy || user.uid) : user.uid,
    requestedByEmail: isUpdate ? (target.review?.requestedByEmail || user.email || '') : (user.email || ''),
    requestedAt: isUpdate && target.review?.requestedAt ? target.review.requestedAt : FieldValue.serverTimestamp(),
    decision: null,
    decidedBy: null,
    decidedAt: null,
    comment: null,
  };
  const update = kind === 'article'
    ? { status: 'in_review', review, updatedAt: FieldValue.serverTimestamp() }
    : {
        [`socials.${target.socialKey}.status`]: 'in_review',
        [`socials.${target.socialKey}.review`]: review,
      };
  await db.collection('content_pipeline_library').doc(itemId).update(update);

  // Notify tagged reviewers (bell + email) — on an update, only the newly
  // added ones; people already on the review are not re-notified.
  const notifyUids = cleanReviewers.filter(uid => !prevReviewers.includes(uid));
  const requesterName = user.email ? user.email.split('@')[0] : (user.apiKey?.name || 'Someone');
  const itemTitle = itemTitleOf(item);
  const piece = reviewPieceLabel(kind, channel);
  const link = reviewLinkFor(workspaceId, itemId, kind, channel);
  const absoluteLink = link ? `${APP_BASE_URL}${link}` : null;
  const message = review.note ? `${piece} — "${review.note}"` : piece;
  await Promise.all(notifyUids.map(async (uid) => {
    await createNotification(uid, {
      type: 'review',
      title: `${requesterName} requested your review on "${itemTitle}"`,
      message,
      workspaceId,
      link,
    });
    try {
      const reviewer = await getAuth().getUser(uid);
      if (reviewer.email) {
        await sendEmail({
          to: reviewer.email,
          subject: `Review requested: "${itemTitle}"`,
          text: `${requesterName} requested your review on the ${piece} for "${itemTitle}".${review.note ? `\n\nNote: "${review.note}"` : ''}\n\n${absoluteLink || ''}`,
          html: mentionEmailHtml({
            authorName: requesterName,
            itemTitle,
            body: review.note || `Please review the ${piece}.`,
            link: absoluteLink,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to email reviewer:', err.message);
    }
  }));

  logger.event(isUpdate ? 'review.updated' : 'review.submitted', {
    itemId, kind, channel: channel || null, workspaceId,
    reviewers: cleanReviewers.length,
  });
  return { reviewStatus: 'in_review', reviewers: cleanReviewers, note: review.note, isUpdate };
}

module.exports = { ReviewSubmitError, submitReview };
