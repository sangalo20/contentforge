// Publish an approved article to the workspace's Sanity site. The publish
// logic lives in lib/publishArticle.js (shared with /api/v1); this route is
// the browser-facing entry point.
const express = require('express');
const { requireAdmin } = require('../lib/guards');
const { PublishError, publishLibraryItem } = require('../lib/publishArticle');

const router = express.Router();

// POST publish draft to Sanity
router.post('/api/publish', requireAdmin, async (req, res) => {
  try {
    const { libraryId } = req.body;
    if (!libraryId) return res.status(400).json({ error: 'libraryId is required' });

    const { sanityId } = await publishLibraryItem(libraryId);
    res.json({ success: true, message: 'Draft published to Sanity successfully!', sanityId });
  } catch (error) {
    if (error instanceof PublishError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error publishing to Sanity:', error);
    res.status(500).json({ error: error.message || 'Failed to publish draft' });
  }
});

module.exports = router;
