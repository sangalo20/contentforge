# ContentForge Codelab

Source: [`contentforge-heimdall-guard.md`](contentforge-heimdall-guard.md), authored in Google Codelabs (`claat`) Markdown. The main exercise is an offline, test-first code change in Odin's Heimdall quality gate; the deployed UI walkthrough is optional.

## Facilitator preparation

- Ensure participants can clone the public repository and install Odin's Python dependencies plus pytest. The primary code exercise uses mocked LiteLLM responses and requires no cloud or model credentials.
- Optional product walkthrough: provide a reachable ContentForge deployment, workshop accounts, and the workspace/profile names; verify draft generation, QA report, social generation, and Social Library access.
- If the optional live demo is used, confirm model quotas and external services in advance. Do not put app URLs, account passwords, API keys, or other secrets in the codelab source.

## Preview

Install `claat` with Go if it is not already available:

```bash
go install github.com/googlecodelabs/tools/claat@latest
```

The upstream `googlecodelabs/tools` repository is archived. The exporter has been validated against this codelab source, but treat `claat` as a pinned authoring/export tool rather than a service to depend on for hosting.

From the repository root, export the codelab and start the local preview server:

```bash
claat export codelab/contentforge-heimdall-guard.md
claat serve
```

Open the local URL printed by `claat serve` and check every step, code block, and link. Exported HTML is generated output; commit the Markdown source, not the export directory.

## Publishing
The codelab is published automatically by [`.github/workflows/codelab-pages.yml`](../.github/workflows/codelab-pages.yml): every push to `main` that touches `codelab/` runs `claat export` and deploys the result to GitHub Pages. The Markdown here is the only source; nothing generated is committed.

One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The published URL is printed in the workflow's `deploy` job.

