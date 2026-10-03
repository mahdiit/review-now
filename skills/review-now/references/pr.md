# Pull-request / branch review

Resolve source and target names as Git refs, not shell code. Quote arguments, reject option-like inputs, and use `--` / `--end-of-options` where supported. Do not interpolate arbitrary user text into executable shell snippets.

1. Check repository status and resolve the refs. For a remote PR request, fetch the explicitly named branches from the repository's actual remote (do not assume `origin`). For an explicitly local branch comparison, use local refs without fetching. If network access fails, disclose it and use existing refs only when an offline/stale-ref review is acceptable to the user.
2. Resolve source and target to immutable commit IDs (`git rev-parse --verify --end-of-options <ref>^{commit}`), then compute `git merge-base <target-sha> <source-sha>`. Stop with a clear explanation if refs or a merge base cannot be resolved.
3. Gather `git diff --no-ext-diff --no-textconv <base-sha> <source-sha> --`, `git diff --name-status -z <base-sha> <source-sha> --`, and `git log --oneline <target-sha>..<source-sha> --`. Compare source changes from the merge base, not unrelated target-branch changes. An empty diff means there is nothing to review.
4. Read changed files, scoped instructions, and relevant context from the **source commit**, for example `git show <source-sha>:<path>`. Read baseline context from the base commit. Never substitute working-tree files from another branch for the reviewed snapshot. Handle additions, deletions, renames, binaries, submodules, and truncated/large diffs explicitly; disclose omitted coverage.
5. Review without switching branches or overwriting the user's working tree. If fixes are requested and the current checkout is not the reviewed source or contains unrelated work, use an isolated worktree or another non-destructive source checkout permitted by the environment. Verify that the source has not moved since review before applying or committing fixes; otherwise regather and revalidate. Never reset/stash/discard user changes automatically.

The source and target names remain useful for the summary, but immutable IDs determine all reads and validation during this review.
