---
"safe-fn": patch
---

- Add new types to infer result, ok/err data from action
- Fix bug in not exporting `ok()`/`err()` properly
- Add `createAction()` and add `AnyCompleteSafeFn` to easily use as server action
