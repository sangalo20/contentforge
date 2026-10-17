# Why We Replaced One Giant Prompt With Seven Small Agents

Every week, the Storage Moguls team takes a two-hour YouTube interview with a self-storage operator and turns it into a blog post. That same interview must also become a cover image and a LinkedIn carousel. We built ContentForge to automate this exact workflow.

The first version of our tool relied on a single prompt. We asked one giant set of instructions to write the draft, fact-check the claims, edit the tone, and design the final assets. It executed the work fast. 

It also failed consistently. The single prompt buried the lede. The model hallucinated statistics. When the model received an update, our brand colors drifted. Asking one prompt to handle all these competing priorities simply does not work. 

We stopped using one prompt and split the job across a mesh of seven small agents.

## Building a Task-Specific Agent Mesh

Specialization solves the accuracy problem. We broke the content generation process into distinct tasks and assigned a specific agent to each one.

Odin serves as the orchestrator. This agent directs the workflow and manages the handoffs between the other pieces of the system.

Oscar focuses strictly on writing. This agent takes the raw source material and drafts the long-form text.

Huginn handles the research. This agent checks every single claim made in the draft and inserts the correct citations.

Heimdall operates as our editorial gate. This agent reviews the text to fix the tone and verify fidelity to the original transcript. Heimdall enforces a strict standard. If a draft loses more than half of the original text, Heimdall rejects it outright.

Hermes generates the cover images for the final posts.

Loki writes the social media copy. This agent is also responsible for filling the text slots in our LinkedIn carousels.

Mimir acts as a scout. This agent searches our Source Vault for material we have already banked to support the new content.

## Matching the Model to the Operational Need

The first major lesson from this build is how to select models. We assign models based entirely on the role they need to play. Brand loyalty is irrelevant. 

Judgment matters heavily for orchestration, writing, and editing. Odin, Oscar, and Heimdall run on Gemini 3.1 Pro because those tasks require it.

Research, social copy generation, and scouting require a different approach. Huginn, Loki, and Mimir make many small calls in rapid succession. We run these three agents on Gemini 3.8 Flash.

## Protecting the User Interface From Failures

Preview endpoints flake. An operator-first system must handle those failures gracefully behind the scenes. 

We built strict failovers into the system. If Loki attempts a task and fails, the agent retries twice. If both retries fail, the system automatically fails over to the Pro model to complete the job.

Sometimes a stream dies halfway through generation. When this happens, Loki replays the entire sequence using a reset event. The user interface never shows a half-written slide to the operator. The screen only updates when the complete data is ready.

## Forcing Code to Own the Visual Design

Models struggle with visual consistency over time. Our third lesson was removing design responsibilities from the AI entirely. The model fills slots. Hard code owns the design.

Loki returns data in a strict JSON format. The response includes exactly three text elements per carousel slide. Loki generates a title, a body, and a kicker. The model has no instructions regarding layout, spacing, or visual aesthetics.

A deterministic renderer takes that JSON data and creates a 1080 by 1350 PDF. This renderer uses fixed brand templates to place the text. The AI model never touches a hex color. This strict separation is the only way to ensure the output stays exactly on-brand after every model upgrade.

## The Human Operates the Review Queue

Through all of it, humans do not write. The architecture changes the human role from writer to reviewer.

Every draft, every cover image, and every carousel goes into a review queue. The assets sit there until a person reviews the work and approves it for publication. The human is the final reviewer. That principle defines the entire design of the system.