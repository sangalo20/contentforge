// --- EMAIL (Resend) ---
// Optional transactional email. When RESEND_API_KEY + EMAIL_FROM are set,
// events such as @mentions also send an email. If not configured (e.g. local
// dev), email sending is skipped silently so nothing else breaks.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ContentForge <onboarding@resend.dev>';
// Base URL for links in outbound email. Default to the user-facing custom
// domain, NOT the bare Cloud Run URL — recipients should always land on
// contentforge.storagemoguls.ai. Override with APP_BASE_URL (e.g. local dev).
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://contentforge.storagemoguls.ai';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Send a transactional email via Resend. Never throws.
async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${to}`);
    return;
  }
  if (!to) return;
  try {
    const axios = require('axios');
    await axios.post(
      'https://api.resend.com/emails',
      { from: EMAIL_FROM, to: [to], subject, html, text },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Failed to send email:', err.response?.data || err.message);
  }
}

// HTML body for a "you were mentioned" email.
function mentionEmailHtml({ authorName, itemTitle, body, link }) {
  const safeAuthor = escapeHtml(authorName);
  const safeTitle = escapeHtml(itemTitle);
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const button = link
    ? `<a href="${escapeHtml(link)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">View comment</a>`
    : '';
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;">
    <h2 style="font-size:18px;margin:0 0 16px;">${safeAuthor} mentioned you</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">On <strong>${safeTitle}</strong> in ContentForge:</p>
    <blockquote style="margin:0 0 20px;padding:12px 16px;background:#f1f5f9;border-left:3px solid #2563eb;border-radius:6px;font-size:14px;color:#334155;">${safeBody}</blockquote>
    ${button}
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">You received this because you were tagged in a comment in ContentForge.</p>
  </div>`;
}

// HTML body for an account link email (invite / password reset).
function authLinkEmailHtml({ heading, intro, buttonLabel, link }) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;">
    <h2 style="font-size:18px;margin:0 0 12px;">${escapeHtml(heading)}</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">${escapeHtml(intro)}</p>
    <a href="${escapeHtml(link)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(buttonLabel)}</a>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">If the button doesn't work, copy and paste this link:<br><span style="word-break:break-all;color:#64748b;">${escapeHtml(link)}</span></p>
  </div>`;
}

module.exports = {
  RESEND_API_KEY,
  APP_BASE_URL,
  escapeHtml,
  sendEmail,
  mentionEmailHtml,
  authLinkEmailHtml,
};
