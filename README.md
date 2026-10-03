# review-now

Interactive code review for **Codex and Claude Code**. Review PR branches or local changes, validate findings, and walk through fixes one at a time.

The default review combines general correctness, security, and frontend analysis. The frontend reviewer supports any UI stack: React/Next.js, Vue/Nuxt, Angular, Svelte/SvelteKit, Solid, Qwik, Astro, web components, plain HTML/CSS/JS, server templates, native/mobile, and desktop/hybrid UIs. It checks behavior, accessibility, responsive layout, rendering, performance, security, compatibility, and localization, using the project's installed framework versions. Unknown stacks receive the shared checks rather than being skipped.

## Install for Codex

Use the [Skills CLI](https://github.com/vercel-labs/skills). The command is **`npx skills`** (plural).

```bash
# Install both skills into the current project
npx skills add mehdiit/review-now --agent codex --skill review-now review-now-frontend

# Install globally instead
npx skills add mehdiit/review-now --agent codex --skill review-now review-now-frontend --global

# Inspect available skills without installing
npx skills add mehdiit/review-now --list
```

The GitHub commands work once this change is pushed to the repository. To install the current local checkout now, run this from the project where you want to use it:

```bash
npx skills add /path/to/review-now --agent codex --skill review-now review-now-frontend
```

On Windows, use the checkout path, for example `D:\TT\review-now`. Add `--copy` if you prefer copied files over symlinks. Each skill is self-contained and includes its reviewer instructions; installing just `review-now` still includes all three reviewers. The focused frontend skill works independently.

Codex skill packaging follows the [official skill format](https://learn.chatgpt.com/docs/build-skills): a `SKILL.md` entrypoint, bundled references/scripts, and `agents/openai.yaml` UI metadata. Reload the Codex session if newly installed skills are not visible.

### Use in Codex

```text
$review-now pr feature/user-auth main
$review-now uncommitted
$review-now-frontend Review the UI changes in my working tree.
```

The two former Claude slash-command workflows are modes of `$review-now`. You can also ask in ordinary language to review a branch or local changes. Request a report or JSON output to skip the interactive walkthrough.

When permitted and available, Codex delegates independent read-only review passes. As each reviewer finishes, Codex asks it for its total findings and priority breakdown, then reconciles that count with its structured result before validating and deduplicating findings. It shows the resulting total and a table with stable finding codes, priorities, locations, summaries, and statuses. It then walks through each finding with a code excerpt and a keyboard- and mouse-accessible radio selector for **Skip / Fix / Show solution**, waiting for your choice before advancing. Show solution previews the change and returns to the same selector without editing. You can also ask questions, request a custom fix, or stop the walkthrough. The final summary repeats the table with updated statuses and totals.

Reviews begin read-only. Fixes require authorization. PR fixes are committed only when the user explicitly chooses apply-and-commit or has already authorized commits; local fixes remain uncommitted unless requested. Unrelated edits and staged changes are preserved. No pushes or externally posted comments are implied.

### Optional native Codex agents

`npx skills add` installs skills and bundled agent assets; it does **not** register standalone native Codex agents. Reviews work without this extra setup by passing the bundled instructions to available subagents.

For Codex versions supporting [standalone custom agent TOML files](https://learn.chatgpt.com/docs/agent-configuration/subagents), register the three native reviewers using the installed main skill's script (Node.js 20+):

```bash
# Project installation: run from the project receiving the agents
node .agents/skills/review-now/scripts/install-agents.mjs --dry-run
node .agents/skills/review-now/scripts/install-agents.mjs

# Or run from this source checkout and select another project
node skills/review-now/scripts/install-agents.mjs --project /path/to/project

# Global agent installation; honors CODEX_HOME when set
node skills/review-now/scripts/install-agents.mjs --global
```

For a globally installed skill, use the script under your Codex skills directory (typically `~/.codex/skills/review-now/scripts/install-agents.mjs`; check the Skills CLI installation output).

The installer copies `review_now_general.toml`, `review_now_security.toml`, and `review_now_frontend.toml` into project `.codex/agents/` or global `$CODEX_HOME/agents/` (default `~/.codex/agents/`). It inherits your model configuration, uses a read-only sandbox, leaves `config.toml` alone, skips identical files, and refuses to overwrite differing files. Back up or move an older differing role before updating it. Restart Codex to load newly registered agents. Older clients can use the bundled prompt fallback.

## Install for Claude Code

The original plugin, commands, and agent metadata remain available:

```bash
claude plugin marketplace add benyaminsalimi/review-now
claude plugin install review-now@review-now-marketplace
```

```text
/review-now:pr feature/user-auth main
/review-now:uncommitted
```

Claude PR mode retains its existing automatic commit behavior after selecting a fix. Both clients now share the expanded frontend reviewer.

## Review rules and findings

A root `REVIEW_GUIDELINES.md` replaces the default review strategy with your custom rules. Scoped `AGENTS.md` instructions apply to files in their directory and descendants. Findings should describe actual defects, not unsupported assumptions or framework modernization preferences.

| Priority | Meaning |
| --- | --- |
| P0 | Universal release or operation blocker |
| P1 | Urgent, serious defect |
| P2 | Normal actionable defect |
| P3 | Minor concrete defect |

The final Codex verdict uses unresolved findings: **REQUEST CHANGES** for P0/P1, **NEEDS DISCUSSION** for P2 with confidence greater than 0.85, otherwise **APPROVE**. Incomplete reviews disclose limitations and withhold approval. A supported older Angular API is not automatically a bug.

## Development

```bash
npm run build
npm run check
npm test
```

Edit canonical reviewer prompts in `agents/*.md`, then run the build to regenerate self-contained Codex references and native TOML assets. Commit generated resources so Git-based installation needs no build or dependencies. The npm manifest is private and provides maintenance commands; installation uses the public Skills CLI, not a separately published review-now npm package.

```text
.claude-plugin/                  Claude plugin and marketplace manifests
commands/pr.md                  Claude PR review workflow
commands/uncommitted.md         Claude local review workflow
agents/*-review.md              Canonical reviewer prompts (Claude metadata)
skills/review-now/
  SKILL.md                      Codex PR/local review workflow
  agents/openai.yaml            Codex UI metadata
  references/                   Self-contained mode and reviewer instructions
  assets/agents/*.toml           Standalone native Codex agent definitions
  scripts/install-agents.mjs     Optional native agent installer
skills/review-now-frontend/      Independent frontend review skill
scripts/build-skills.mjs         Generates Codex resources from canonical prompts
tests/install-agents.test.mjs    Installer behavior checks
```

## License and acknowledgements

MIT; see [LICENSE](LICENSE).

Review guidance was inspired by [Anthropic's security review](https://github.com/anthropics/claude-code-security-review), [OpenAI Codex](https://github.com/openai/codex), and [Angular's official context](https://angular.dev/assets/context/llms-full.txt). The frontend guidance now applies shared UI checks and stack-specific review instead of assuming Angular.
