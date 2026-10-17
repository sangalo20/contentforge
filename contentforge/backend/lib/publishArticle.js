// Publish an approved article to its workspace's Sanity site: markdown ->
// portable text, cover upload, createOrReplace, then mark the item published.
// Extracted from routes/publish.js so the legacy route and /api/v1 share one
// implementation. Callers gate on admin; the review gate lives here.
const { createClient } = require('@sanity/client');
const { marked } = require('marked');
const { htmlToPortableText } = require('@portabletext/html');
const { JSDOM } = require('jsdom');
const { db, FieldValue, getStorage, STORAGE_BUCKET } = require('./firebase');
const { getWorkspaces } = require('./workspacesStore');
const { sanityConnectionFor, slugForTitle } = require('./sanityConnections');
const { log: logger } = require('../logger');

// A publish failure the caller maps to an HTTP status (message is user-safe).
class PublishError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Publish one library item. Returns { sanityId, title }. Throws PublishError
// for expected failures (missing item/connection, review gate, cover upload).
async function publishLibraryItem(libraryId) {
  // 1. Fetch from Firestore
  const doc = await db.collection('content_pipeline_library').doc(libraryId).get();
  if (!doc.exists) throw new PublishError(404, 'Draft not found');
  const data = doc.data();

  // 2. Resolve the workspace's Sanity connection
  const wsCfg = getWorkspaces().find(w => w.id === data.workspaceId);
  const config = sanityConnectionFor(wsCfg, data.workspaceId);
  if (!config) {
    throw new PublishError(400,
      'This workspace has no Sanity connection. Pick one in Config → AI Engine & Integrations.');
  }

  // Review gate: where the workspace requires review, only reviewer-approved
  // articles may publish (republishing an already-published item stays allowed).
  if (wsCfg?.requireReview && !['approved', 'published'].includes(data.status)) {
    throw new PublishError(403,
      'This workspace requires reviewer approval before publishing. Submit the draft for review first.');
  }

  // 3. Initialize Sanity Client
  const sanityClient = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    useCdn: false,
    apiVersion: '2024-01-08',
    token: config.token
  });

  // Parse title and categories from draft text
  let cleanDraft = data.draft;
  let extractedTitle = data.titles && data.titles.length > 0 ? data.titles[0] : 'Generated Draft';
  let extractedCategories = ['Investing', 'Operations'];

  if (config.schemaType === 'post') {
    // Extract Title from markdown heading
    const titleMatch = cleanDraft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m);
    if (titleMatch) {
      extractedTitle = titleMatch[1].replace(/(\*\*|\*)/g, '').trim();
      cleanDraft = cleanDraft.replace(titleMatch[0], '').trim();
    }

    // Extract Categories
    const catRegex = /(?:^|\n)\s*(?:\*\*)?Categories:?(?:\*\*)?\s*((?:.+)(?:\n\s*-\s*.+)*)(?:\n|$)/i;
    const catMatch = cleanDraft.match(catRegex);
    if (catMatch) {
      const catString = catMatch[1];
      if (catString.includes('-')) {
        extractedCategories = catString.split('\n').map(c => c.replace('-', '').trim()).filter(c => c);
      } else {
        extractedCategories = catString.split(',').map(c => c.trim()).filter(c => c);
      }
      cleanDraft = cleanDraft.replace(catRegex, '\n').trim();
    }
  }

  const DOMParser = new JSDOM().window.DOMParser;
  const parser = new DOMParser();

  const html = marked.parse(cleanDraft);
  const portableText = htmlToPortableText(html, {
    parseHtml: (htmlStr) => parser.parseFromString(htmlStr, 'text/html')
  });

  // 5. Extract a Title and Summary
  const title = extractedTitle;
  const slug = slugForTitle(title); // shared with internal-link URL derivation

  // Create Document Object for Sanity
  const sanityDoc = {
    _type: config.schemaType,
    _id: `cp-${libraryId}`, // Publishes directly instead of as a draft
    title: title,
    slug: { _type: 'slug', current: slug },
    publishedAt: new Date().toISOString(),
    summary: data.draft.substring(0, 150) + '...',
  };

  if (config.schemaType === 'post') {
    sanityDoc.body = portableText;

    // Calculate read time (avg 200 words per minute)
    const wordCount = data.draft.split(/\s+/).length;
    sanityDoc.readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Fetch an existing author or create a dummy one
    try {
      const existingAuthor = await sanityClient.fetch(`*[_type == "author"][0]`);
      let authorId = existingAuthor?._id;

      if (!authorId) {
        const newAuthor = await sanityClient.create({
          _type: 'author',
          name: 'Content Pipeline',
          slug: { _type: 'slug', current: 'content-pipeline' }
        });
        authorId = newAuthor._id;
      }
      sanityDoc.author = { _type: 'reference', _ref: authorId };
    } catch (err) {
      console.warn('Could not fetch/create author:', err);
    }

    // Add dynamically extracted categories
    sanityDoc.categories = extractedCategories;

  } else if (config.schemaType === 'newsletterIssue') {
    sanityDoc.content = portableText;

    // Fetch the latest issue number to increment, or default to 1
    try {
      const latestIssue = await sanityClient.fetch(`*[_type == "newsletterIssue"] | order(issueNumber desc)[0]`);
      sanityDoc.issueNumber = latestIssue && latestIssue.issueNumber ? latestIssue.issueNumber + 1 : 1;
    } catch (err) {
      sanityDoc.issueNumber = 1;
    }
  }

  // Attach the cover image — upload the app-owned image to Sanity at publish time
  if (data.coverImage && data.coverImage.storagePath) {
    try {
      const [coverBuffer] = await getStorage()
        .bucket(STORAGE_BUCKET)
        .file(data.coverImage.storagePath)
        .download();
      const coverContentType = data.coverImage.contentType || 'image/jpeg';
      const coverExt = coverContentType.includes('png') ? 'png' : 'jpg';
      const asset = await sanityClient.assets.upload('image', coverBuffer, {
        filename: `cover-${libraryId}.${coverExt}`,
        contentType: coverContentType
      });
      sanityDoc.mainImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id }
      };
    } catch (err) {
      console.error('Failed to upload cover image to Sanity:', err);
      throw new PublishError(502, `Failed to upload cover image to Sanity: ${err.message || err}`);
    }
  }

  // 6. Push to Sanity
  const response = await sanityClient.createOrReplace(sanityDoc);

  // 7. Update Firestore status
  await db.collection('content_pipeline_library').doc(libraryId).update({
    status: 'published',
    sanityId: response._id,
    updatedAt: FieldValue.serverTimestamp()
  });

  logger.event('article.published', {
    itemId: libraryId,
    workspaceId: data.workspaceId || null,
    sanityId: response._id,
  });
  return { sanityId: response._id, title };
}

module.exports = { PublishError, publishLibraryItem };
