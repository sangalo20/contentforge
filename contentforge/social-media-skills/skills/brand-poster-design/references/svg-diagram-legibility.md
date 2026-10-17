# SVG concept-diagram / flow legibility (Joe rejected a muddy one, June 2026)

The "concept diagram / flow" visual vocabulary (drawn nodes, arrows, chains —
distinct from a bar/data-viz chart) is powerful for abstract ideas (e.g.
"a prompt vs a system"). But it FAILS silently if you don't engineer the read.
Joe rejected the first SI Ep030 IG node-diagram: *"the idea behind the visual is
good… but the visual itself is not well done, it's not clear… the system
illustration should be better."* The CONCEPT was right; the execution was muddy.

## The 4 clarity failures that made it muddy (diagnose every diagram for these)
1. **Arrowheads buried INSIDE the nodes.** Connectors drawn node-center to
   node-center put the marker-end under the next circle, so it looks like a
   circle with a bite taken out, not a clean connector.
2. **Zig-zag / wandering path.** A route that goes right→down→right→up→right
   reads as a tangle. The eye can't follow it and "forward progress" is lost.
3. **The point (growth / compounding) is illegible.** Nodes that grow get hidden
   by the chaotic path; the "it builds on itself" message disappears.
4. **No cue for a cycle.** If the idea is "it feeds itself / compounds," a plain
   chain doesn't show it — you need an explicit loop.

## The fixes that made it land (apply as defaults for any node/flow diagram)
- **Put arrows in the GAPS between nodes, never overlapping them.** Draw each
  connector from the right edge of node N to the left edge of node N+1, leaving a
  clear gap, with the `marker-end` arrowhead landing in open space. (Concretely:
  line `x1 = nodeN.cx + nodeN.r + pad` → `x2 = nodeN+1.cx − nodeN+1.r − pad`.)
- **One clean axis of motion.** Lay the chain straight left-to-right on a single
  baseline (`cy` constant). No zig-zag. Forward direction must be unmistakable.
- **Make the metaphor's MEANING the visible variable.** If the idea is
  compounding, the nodes should grow steadily (r: 26→36→46→58→72). The size ramp
  IS the message — keep it monotonic and obvious.
- **Show a cycle with an explicit feedback loop.** A dashed curved `<path>`
  arcing from the last node back over the top to the first, in a SECOND accent
  color (e.g. SI yellow `#FDBF00` for the loop vs green `#16A34A` for the forward
  chain), with a tiny `FEEDS ITSELF` label. This literally draws "it compounds."
- **Contrast the two halves hard.** "Dead-end" side = one node + a dotted line
  that dies into a grey word ("stops."). "System" side = the growing looped
  chain. The visual difference should be readable in one glance, before any text.
- Keep arrowheads SMALL (`markerWidth ~7`, `refX` tuned so the tip sits at the
  line end) — oversized markers re-create failure #1.

## Process note
Same as any poster: build the generator, render, then VISION-QA the diagram
specifically asking "do arrows sit between nodes? is the flow one clean
direction? is the growth/loop legible?" — don't trust that a hand-authored SVG
reads the way you intended. It took one rebuild pass here. Pair loud copy with
the sticker-pop family and quiet copy with the dossier; the diagram family suits
a clean conceptual reframe (see SKILL.md "Match visual STYLE to the copy").

*Source: SI Ep030 Idea-1 IG "prompt vs system" node-diagram, rebuilt after Joe's
clarity rejection, June 2026. Companion: design-principles-checklist.md.*
