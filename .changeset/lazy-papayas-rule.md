---
"safe-fn": patch
---

- Add new types to infer result, ok/err data from action
- Fix bug in not exporting `ok()`/`err()` properly
- Add `createAction()` and add `AnyCompleteSafeFn` to easily use as server action
- Fix `Result` type union by typing `data` and `cause` as `undefined` instead of `never`
- Don't catch framework errors (currently only filtering Next `redirect()` and `notFound()`)
