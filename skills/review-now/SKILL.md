---
name: review-now
description: Review pull-request branches or staged, unstaged, and untracked changes for correctness, security, and frontend regressions, with an interactive walkthrough of validated findings. Use when asked to review a PR or local changes.
---

# Review Now

Review changes, validate actionable findings, then walk through them with the user. Remain read-only until fixes are authorized; requesting a review alone does not authorize edits, commits, pushes, or posting comments.

## Select and gather the review

- `$review-now pr <source-branch> <target-branch>`: read [references/pr.md](references/pr.md).
- `$review-now uncommitted`: read [references/uncommitted.md](references/uncommitted.md).
- Infer the mode from an explicit PR/branch or local-changes request. With no specified target, use uncommitted changes. Ask for missing branch names when PR mode cannot be resolved.

Resolve all bundled paths relative to this skill directory, even when installed globally or copied into another repository. Do not look for the source repository's `agents/` or `commands/` directories in the project being reviewed.

## Review and validate

1. Read applicable repository instructions, scoped `AGENTS.md`, and root `REVIEW_GUIDELINES.md` if present. Apply nested rules only to their subtree. Custom review guidelines replace the default review strategy unless the user asks to combine them; still honor the evidence/output contract below.
2. Without custom guidelines, use [references/general-review.md](references/general-review.md) and [references/security-review.md](references/security-review.md). For any UI-affecting changes, also use [references/frontend-review.md](references/frontend-review.md); it covers any framework, plain HTML/CSS/JS, server-rendered pages, and native/desktop UIs.
3. If delegation is permitted and subagent tools are available, dispatch independent, read-only reviews in parallel within the available limit. Use native roles `review_now_general`, `review_now_security`, and `review_now_frontend` if registered. Otherwise pass the complete relevant bundled instructions to available general-purpose subagents. Supply the resolved source/base snapshots, diff, file list, applicable rules, and exact locations for contextual reads. Inherit available models; do not request Claude's Task tool, Sonnet, Haiku, or unavailable tools.
4. If delegation is unavailable or disallowed, perform the same review passes sequentially yourself. Do not require agent installation or configuration changes to complete a review. Optional standalone Codex agent files and an installer are bundled under `assets/agents/` and `scripts/install-agents.mjs`; use them only when the user requests native agent setup.
5. Parse the structured findings, deduplicate the same underlying defect even if reviewers use different categories or nearby line numbers, and retain the strongest evidence. Validate each finding against the actual reviewed snapshot, callers, installed framework version, and applicable guidelines. Reject speculative or pre-existing problems; prioritize by impact rather than style preferences. Do not create one subagent per trivial finding.

## Findings overview

Once review and validation finish, start the default interactive walkthrough immediately; do not end with a report and merely offer to walk through it later. The reviewer references' JSON-only contract applies to delegated reviewer results or internal collection, not the main agent's user-facing walkthrough. If the user explicitly requests a report or JSON only, honor that format and omit the menu.

Sort validated, deduplicated findings by priority (P0 first), then file and line. Assign stable finding codes `F001`, `F002`, and so on; retain these codes across turns and after fixes. Show **Total findings: N**, priority counts, and a Markdown table containing every validated finding before presenting the first finding:

| Code | Priority | Location | Summary | Status |
| --- | --- | --- | --- | --- |
| F001 | P1 | src/example.ts:42 | Brief description of the concrete defect | Pending |

Replace the example with real findings. Link locations when supported. Count only validated, deduplicated findings; do not include rejected reports. For zero findings, show total 0 and verification limitations, then finish without a menu.

## Walkthrough and fixes

1. Present only the current finding in detail: **Finding i of N - Fxxx**, priority, file/line, category, confidence, trigger, impact, and recommendation. Include a short fenced code excerpt from the reviewed snapshot showing the relevant defect (or deleted code for deletion-only findings); use the correct language and explain the location. Never invent code or expose secrets.
2. Show this action menu for the current finding:
   - **Skip**: leave this finding unresolved and move to the next.
   - **Show solution**: display the proposed code change without editing files.
   - **Fix**: apply the fix for this finding and run relevant checks.
3. Ask for the current finding's choice and wait. Use `request_user_input_async` when available, with the finding code in the question and the three options above. Use another user-input tool only when permitted in the current mode and suitable for the choice; never call a Plan-only tool in Default mode or an optional-only tool for required fix authorization. Without a suitable tool, end the turn with the menu and ask the user to choose. Do not treat an unanswered asynchronous question as permission to continue, mark the finding skipped, or finish the walkthrough. Never assume a preselected option or silence authorizes a fix.
4. **Show solution** keeps the current finding pending: show an exact proposed diff or before/after code and explain how it addresses the trigger. Present the same menu again and wait; showing a solution neither applies it nor advances to another finding.
5. **Fix** authorizes edits for the current finding only. Apply and verify as described below, report the result, then advance. If the fix fails or verification leaves the defect unresolved, keep it pending, explain the issue, and return to its menu instead of claiming it is fixed. **Skip** marks it skipped and advances without editing.
6. Repeat the detail and menu for each remaining finding. Preserve codes, current position, choices, and verification results across turns. Honor free-text questions or custom-fix requests while staying on the current finding; return to its menu afterward. If the user explicitly asks to skip all or stop, retain the remaining findings as pending and provide the summary. Prior explicit authorization to fix all findings allows applying them sequentially without asking again.

After fix authorization, make a minimal change to the correct reviewed source, preserve unrelated edits, and run relevant existing checks. In PR mode, commit each fix only if the user selected an explicitly described "apply and commit" action or has already authorized commits. Stage only the fix; never include unrelated staged changes. Uncommitted mode leaves fixes uncommitted unless requested. Revalidate remaining findings after edits and compute the final verdict from unresolved findings.

## Final summary

After all findings have been handled or the user explicitly stops, repeat the full findings table with the same codes, locations, concise summaries, and updated statuses. Show total findings, priority counts, and counts by status (Fixed, Skipped, Pending, Resolved by another fix). These status counts must sum to the original validated total. Revalidated findings resolved by another fix keep their code and receive that status rather than disappearing or being counted as separately fixed. Skipped and pending findings remain unresolved.

Include the reviewed scope/snapshots, files inspected, verification performed, and limitations. Verdict: `REQUEST CHANGES` for unresolved P0/P1; `NEEDS DISCUSSION` for unresolved P2 with confidence greater than 0.85; otherwise `APPROVE`. If review coverage is incomplete, say so and withhold approval. If there are no changes or no findings, report that without inventing a walkthrough or claiming tests passed.
