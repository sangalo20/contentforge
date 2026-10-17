// Brand Studio image generation (Vertex AI Imagen). The art direction lives
// server-side per brand so generated backgrounds land inside that brand's
// visual language; the client only supplies the conceptual subject. Calls the
// Vertex REST API directly with ADC credentials (same auth story as
// Firestore) — no extra SDK dependency.
const express = require('express');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const router = express.Router();

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const MAX_PROMPT_CHARS = 2000;

// Per-brand art direction. `artistic` seeds full-bleed backgrounds;
// `centerpiece` seeds diagram-like focal art. Brand ids match the frontend
// registry (frontend/src/brand-studio/brands.js).
const BRAND_STYLES = {
  storagemoguls: {
    artistic: 'Premium editorial abstract art, deep midnight navy and electric blue. Soft architectural gradients, subtle paper grain, institutional print feel, atmospheric depth, generous negative space, elegant and restrained, no text, 8k resolution.',
    centerpiece: 'Minimalist architectural line illustration, self-storage facility forms, clean isometric vectors on a deep navy background, thin glowing electric blue lines, editorial diagram style, high contrast, no text.',
  },
  successfulidiots: {
    artistic: 'Bold neo-brutalist pop art background, saturated yellow with hard black offset shadows and graph-paper grid texture, punchy and irreverent, flat shapes, screen-print feel, no text.',
    centerpiece: 'Bold flat illustration, sticker-style object with a hard black border and offset shadow on a plain background, playful pop-art energy, high contrast, no text.',
  },
  joedowns: {
    artistic: 'Near-black navy technical background, glowing electric blue particle sphere and faint engineering grid, premium and precise, cinematic depth, subtle light rays, no text, 8k resolution.',
    centerpiece: 'Minimalist technical diagram, wireframe node graph on a near-black navy background, thin glowing electric blue lines, numbered waypoints, clean vectors, no text.',
  },
  storpro: {
    artistic: 'Warm optimistic orange light over deep steel blue, corrugated metal texture, 60-degree angular shapes, clean industrial-premium feel, soft gradients, no text, 8k resolution.',
    centerpiece: 'Clean isometric illustration of a premium modern storage facility, deep blue and warm orange palette, rounded corners, crisp vectors, no text.',
  },
  belrose: {
    artistic: 'Institutional financial editorial abstract, deep navy with a restrained warm orange accent, elegant fluid gradients, quiet confidence, premium print feel, no text, 8k resolution.',
    centerpiece: 'Minimalist architectural line drawing, commercial real estate forms, thin orange lines on deep navy, blueprint elegance, no text.',
  },
  default: {
    artistic: 'Premium abstract background, deep navy and soft blue gradients, atmospheric depth, elegant and restrained, no text, 8k resolution.',
    centerpiece: 'Minimalist line illustration, clean vectors on a dark background, thin glowing accent lines, no text.',
  },
};

router.post('/api/brand-studio/generate-image', async (req, res) => {
  const { prompt, aspectRatio, type, brandId } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A prompt is required' });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(400).json({ error: `Prompt must be at most ${MAX_PROMPT_CHARS} characters` });
  }
  if (aspectRatio !== undefined && !ASPECT_RATIOS.includes(aspectRatio)) {
    return res.status(400).json({ error: 'Unsupported aspect ratio' });
  }

  // Same project as Firestore by default; override with GOOGLE_CLOUD_PROJECT
  // if Vertex AI runs elsewhere.
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
  if (!project) {
    return res.status(503).json({ error: 'Image generation is not configured. Set GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT.' });
  }
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const model = process.env.IMAGEN_MODEL || 'imagen-3.0-generate-002';

  const styles = BRAND_STYLES[brandId] || BRAND_STYLES.default;
  const stylePrefix = type === 'centerpiece' ? styles.centerpiece : styles.artistic;
  const fullPrompt = `${stylePrefix} Conceptual subject: ${prompt.trim()}`;

  try {
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;
    const { data } = await axios.post(url, {
      instances: [{ prompt: fullPrompt }],
      parameters: { sampleCount: 1, aspectRatio: aspectRatio || '1:1', outputMimeType: 'image/jpeg' },
    }, { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 });

    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return res.status(502).json({ error: 'No image returned by the model' });
    res.json({ image: `data:image/jpeg;base64,${b64}` });
  } catch (err) {
    console.error('brand-studio generate-image failed:', err?.response?.data?.error?.message || err.message);
    res.status(502).json({ error: 'Image generation failed' });
  }
});

module.exports = router;
