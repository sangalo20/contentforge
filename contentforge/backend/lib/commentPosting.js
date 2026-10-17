// Comment creation with @mention fan-out (bell + email), extracted from
// routes/comments.js so the app route and /api/v1 share one implementation.
const { db, FieldValue, getAuth, COMMENTS_COLLECTION } = require('./firebase');
const { createNotification } = require('./notifications');
const { sendEmail, mentionEmailHtml, APP_BASE_URL } = require('./email');

// A posting failure the caller maps to an HTTP status (message is user-safe).
class CommentError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Post a comment on a library item the caller already loaded and
// access-checked. `mentions` are uids. Returns { id, comment }.
async function postComment({ user, itemId, item, text, mentions = [] }) {
  if (!text || !String(text).trim()) {
    throw new CommentError(400, 'Comment text is required');
  }
  if (String(text).length > 5000) {
    throw new CommentError(400, 'Comment is too long');
  }
  const clean = String(text).trim();
  const workspaceId = item.workspaceId || null;

  const authorName = user.email ? user.email.split('@')[0] : (user.apiKey?.name || 'Someone');
  const cleanMentions = Array.from(new Set(
    (Array.isArray(mentions) ? mentions : [])
      .filter(uid => typeof uid === 'string' && uid && uid !== user.uid)
  ));

  const commentData = {
    itemId,
    workspaceId,
    authorUid: user.uid,
    authorEmail: user.email || '',
    authorName,
    text: clean,
    mentions: cleanMentions,
    reactions: {},
    createdAt: FieldValue.serverTimestamp(),
  };
  const ref = await db.collection(COMMENTS_COLLECTION).add(commentData);

  // In-app notifications are awaited (a cheap Firestore write); the emails
  // are fire-and-forget — SMTP latency must never hold up the response.
  const itemTitle = item.title || (item.titles && item.titles[0]) || 'a draft';
  const link = workspaceId
    ? `/workspace/${workspaceId}/library/item/${itemId}`
    : null;
  const absoluteLink = link ? `${APP_BASE_URL}${link}` : null;
  const snippet = clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
  await Promise.all(cleanMentions.map(uid => createNotification(uid, {
    type: 'mention',
    title: `${authorName} mentioned you on "${itemTitle}"`,
    message: snippet,
    workspaceId,
    link,
  })));
  for (const uid of cleanMentions) {
    (async () => {
      const mentioned = await getAuth().getUser(uid);
      if (!mentioned.email) return; // email not configured for this user
      await sendEmail({
        to: mentioned.email,
        subject: `${authorName} mentioned you on "${itemTitle}"`,
        text: `${authorName} mentioned you in a comment on "${itemTitle}":\n\n"${clean}"\n\n${absoluteLink || ''}`,
        html: mentionEmailHtml({ authorName, itemTitle, body: clean, link: absoluteLink }),
      });
    })().catch(err => console.error('Failed to email mentioned user:', err.message));
  }

  return { id: ref.id, comment: commentData };
}

module.exports = { CommentError, postComment };
