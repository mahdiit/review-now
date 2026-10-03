---
name: review-now-frontend
description: Review frontend changes in any UI stack for behavior, accessibility, responsive layout, performance, security, rendering, and compatibility regressions. Use for focused UI code reviews across web, native, and desktop frontends.
---

# Frontend Review

Read [references/frontend-review.md](references/frontend-review.md) and apply its checks for the detected stack and installed versions. No companion skill or native agent registration is required.

Honor the user's scope and applicable project instructions. Review only the requested snapshot: for a branch review, resolve source/base commits and read files from those commits; for local changes, distinguish staged, unstaged, and untracked content and line numbers. With no specified target, review local changes; request clarification if an intended branch/file scope cannot be resolved. A broader audit of existing UI is allowed when explicitly requested; distinguish existing defects from regressions.

Keep the review read-only. Use runtime/browser/device tools when available and relevant, and disclose missing coverage. Return actionable findings with evidence and version-appropriate recommendations. Use the JSON schema in the reference when delegated or when JSON is requested; otherwise present concise findings and verification limitations. Do not apply fixes or post findings externally without authorization.
