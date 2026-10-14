<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep ProspectAI's mock opportunity content in the feature data module and browser-only preview state in the feature provider; this keeps prototype screens cohesive without suggesting any live integration.
- Keep the shared product navigation in the TanStack root shell and separate content into route files; this preserves direct links and unique page metadata.
- Keep reusable mock profiles, attention, workflow and action state in the feature provider, with static examples in feature data; this makes future service replacement straightforward without implying live execution.
