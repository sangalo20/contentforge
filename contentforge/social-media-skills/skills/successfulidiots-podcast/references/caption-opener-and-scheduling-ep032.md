# Caption openers, host-context, and SI scheduling facts (Joe, SI Ep032, July 2026)

Three durable lessons from the Ep032 session. The first two are copy-craft (they
belong to the same family as the GO-DEEPER and plain-language rules in SKILL.md);
the third is a verified routing fact.

## 1. The caption OPENER must be the DEEPER POINT, not a paraphrase of the setup
Idea 9's rejected opener: *"You already know the boundaries you should keep. You
just can't keep them when someone's asking to your face."* Joe: *"this is just a
big paraphrase of what was already said. I thought we agreed on giving the deeper
point not just verbatim... What lesson could be learnt from this? What problem are
they solving? What new solution is this?"*

Run the anecdote through those THREE questions and open on the ANSWER:
- Idea 9's real lesson = Peter's *"I love that AI can't judge me, so I tell it my
  actual weaknesses."*
- Deeper point = **you can't fix a flaw you won't admit; you won't admit your real
  ones to a person; something that can't judge you is the first place you can.**
- The delegation / family-calendar / day-off details become the EXAMPLE, not the point.

This is the GO-DEEPER rule applied specifically at the OPENER, where a tidy
restatement of the setup FEELS finished but teaches nothing new. Gate: read line 1
and ask "is this the lesson / the problem / the new solution — or am I just
re-saying what they said?"

## 2. Phrase the idea as ONE forward step-by-step motion (no doubled negatives)
Rejected: *"You can't fix a flaw you won't admit to."* — reader holds two negatives
("can't" + "won't") and doubles back.
Joe's fix: **"You can't fix a flaw until you accept it's a flaw."** His words:
*"See how that is easier to comprehend, takes you step by step?"*
The working shape walks forward: there's a flaw → you accept it's a flaw → now you
can fix it. One negative, then forward motion. When a line makes the reader unwind
two negatives or reorder clauses to parse it, rewrite as a single forward chain.
Grammar: the negative goes on the FIRST verb ("You **can't** fix a flaw until you
accept it's a flaw"), not "you can fix... until."

## 3. NAME THE HOST IN CONTEXT the first time — "Peter" cold means nothing
Repeat offense Joe re-flagged: dropping *"Peter asked five experts..."* /
*"Peter spent years in marketing..."* with no introduction. Brand-account posts
are read by strangers. First mention introduces him as WHAT HE IS —
*"My co-host Peter Swain..."* / *"Peter, my co-host, spent years in marketing..."* /
*"Peter, who I co-host the show with..."*; later refs can be bare "Peter." Applies
to captions AND promo-clip captions. Grammar sibling from the same pass: a
non-parsing opener — "…are not the same sentence" (singular subject + wrong noun)
→ "…sound like the same thing. They aren't."

## 4. SI scheduling: only LinkedIn + Facebook get the posters (verified live)
`getBrandSettings` → SI `networksData` = **facebook + linkedin + tiktok ONLY**
(no Instagram, no X/Twitter). So:
- Deliverable per idea = long-form (LI=FB verbatim) + poster → one Metricool post
  to **LinkedIn + Facebook**.
- **TikTok** needs a VIDEO; static posters can't ride it → leave TikTok off
  image-only posts (no `tiktokData` block).
- The **X short-form has no home on SI** and there's no Instagram → don't package
  X/IG as if they'll post; keep X short-forms in the captions file for reuse, and
  surface the gap to Joe rather than silently dropping the copy.

### End-to-end scheduling flow that WORKED this session
1. Re-auth: `hermes mcp login metricool` (browser approve — the saved refresh
   token had expired ~44h earlier; `invalid_grant` on a warm bridge call before
   re-auth = dead refresh token, not a retry situation).
2. Cloudinary upload every poster (`cloud_name=dhi6klgd0`, creds in
   `_scripts/upload_jd_posters.py`) → `secure_url`.
3. Create via `mc_bridge.mcall("createScheduledPost", {blogId:"6374077",
   date:ISO+"-04:00", info:json.dumps({providers:[{network:"linkedin"},
   {network:"facebook"}], media:[cloudUrl], text, publicationDate:{dateTime,
   timezone:"America/New_York"}, linkedinData:{}, facebookData:{type:"POST"},
   draft:true, autoPublish:false})})`. Run the schedule script with
   `sys.path.insert(0, "C:/Users/somea/BrandAssets/_scripts")` so `mc_bridge`
   imports from any cwd.
4. Verify with `getScheduledPosts` (brandId string, dates with offset) that each
   `media[0]` is a real `.png`, not `.html`.
5. A transient `invalid_grant` RIGHT AFTER the create burst = 179s token rotation;
   the creates already returned real IDs → DON'T recreate, just re-read to confirm.
6. Cadence Joe wanted: promo first (Fri 11am), 2 ideas/day at 11am + 4pm ET,
   Sunday = launch post ONLY ("the new episode is live", reusing the promo poster).
   All drafts for his approval; set Metricool back to `enabled:false` when done.
