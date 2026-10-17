# Cover Image Lifecycle

**Audience:** Engineers and operators.  
**Purpose:** Explain the full cover image journey from generation through publish, and the design reasoning behind it.

---

## Overview

```
User opens ImageChatModal
        │
        ▼
Odin (SSE stream) ─── ideates, proposes concepts ──► User approves
        │
        ▼ delegate_to_hermes tool call
HermesAgent ──► xAI Grok API ──► temporary URL (xai-tmp-imgen-...)
        │
        ▼ {type: "image", url} SSE event
Browser shows preview
        │
        ▼ User clicks "Approve & Use Image"
PUT /api/library/:id/cover
        │
        ├─► Download bytes from Grok URL (must be done promptly — URL is temporary)
        ├─► Upload to Firebase Storage: content-pipeline/covers/<id>.jpg
        └─► Update Firestore: coverImage { storagePath, contentType, source, url }
                                                                │
                                                                ▼
                                               Library card shows cover image
                                               Item viewer shows cover preview
                                                                │
                                                                ▼ (later) Publish
                                               POST /api/publish
                                                        │
                                                        ├─► Download from Firebase Storage
                                                        ├─► Upload to Sanity as asset
                                                        └─► Set mainImage ref on Sanity doc
```

---

## Why Firebase Storage, not Sanity-at-approval?

Grok image URLs (`https://imgen.x.ai/xai-tmp-imgen-...`) are **temporary**. If we stored the URL and uploaded to Sanity later, the URL would be dead. We must capture the bytes immediately.

The original design uploaded directly to Sanity at approval time. This required a Sanity **Editor token** even for the approve step — a token not needed for any other in-app operation. It also tightly coupled cover saving to Sanity availability.

The current design stores bytes in Firebase Storage (which firebase-admin accesses via Application Default Credentials — no separate token required). The Sanity write token is only exercised during the publish step, which is the natural moment to need it.

---

## The proxy route

The `coverImage.url` stored in Firestore points to the backend proxy:

```
http://localhost:3005/api/library/<id>/cover/image?t=<timestamp>
```

The proxy (`GET /api/library/:id/cover/image`) reads the `storagePath` from Firestore and streams the bytes from Firebase Storage. This means:

- No Firebase Storage public access is needed.
- The browser renders the image like any other `<img src="...">`.
- The `?t=<timestamp>` cache-buster ensures re-approved images invalidate the browser cache.

---

## Branded covers from the Brand Studio

AI photos are not the only cover source. From the item viewer's **Create Visual** menu, "Blog Cover" deep-links to `/brand-studio?template=blogcover&item=<id>&title=…` — the studio opens prefilled with the article's title, and its export bar gains a **Set as Article Cover** button. That button renders the canvas to PNG client-side (html-to-image, 2× pixel ratio) and sends it as a base64 data URL:

```
PUT /api/library/:id/cover
{ "imageData": "data:image/png;base64,..." }
```

The route accepts either `imageUrl` (the Hermes/Grok path above) or `imageData` (png/jpeg/webp data URL, 10MB cap; the JSON body limit is raised to 12mb in `server.js` for this). Inline bytes skip the SSRF fetcher — there is no URL to fetch — and store with `source: "brand-studio"`. From Storage onward the lifecycle is identical: same proxy URL, same publish-to-Sanity upload.

---

## Regenerating a cover

To replace a cover image:
1. Open the library item.
2. Click **Generate Cover Image** to reopen the Odin chat.
3. Generate a new image and approve it.
4. `PUT /api/library/:id/cover` overwrites the existing Storage file at the same path (`content-pipeline/covers/<id>.jpg`) and updates Firestore with the new metadata and a fresh proxy URL.

---

## What happens at publish

When `POST /api/publish` runs:

1. The backend reads `coverImage.storagePath` from the Firestore doc.
2. Downloads the bytes with `getStorage().bucket(...).file(storagePath).download()`.
3. Calls `sanityClient.assets.upload('image', buffer, ...)` — this is where the Sanity Editor token is needed.
4. Sets `sanityDoc.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }`.

If the Sanity upload fails (e.g. read-only token), `POST /api/publish` returns `502` with a clear error message before any Sanity document is written. Fix the token and re-publish.

---

## Items without a cover

If `coverImage` is absent (null or missing `storagePath`), publish proceeds without `mainImage`. The Sanity document is created but has no cover. The library card shows the workspace mesh-gradient placeholder instead of a photo.
