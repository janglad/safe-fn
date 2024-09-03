# @safe-fn/safe-fn

## 0.1.3

### Patch Changes

- 7b2cb2b: Fix [#7](https://github.com/janglad/safe-fn/issues/7) where `UnparsedInput` type if not properly merged.
- 92bb8e5: Features

  - Implement NeverThrow instead of own Result type
  - Add separate typing for running as a server action, in which case Zod errors are stripped from stack traces etc.
  - move Zod to peer dependency

- 687640d: Clean up internal workings

  - set up Knip
  - Move safe-fn to separate builder and runnable classes
  - clean up types

## 0.1.2

### Patch Changes

- 3572d25: - Add new types to infer result, ok/err data from action
  - Fix bug in not exporting `ok()`/`err()` properly
  - Add `createAction()` and add `AnyCompleteSafeFn` to easily use as server action
  - Add types for inferring result and argument for completeSafeFns
  - Fix `Result` type union by typing `data` and `cause` as `undefined` instead of `never`
  - Don't catch framework errors (currently only filtering Next `redirect()` and `notFound()`)

## 0.1.1

### Patch Changes

- 2b72e15: Renames `Ok()` and `Err()` to `ok()` and `err()` to avoid overlap with types. Exports `ok()`, `err()`, `Ok`, `Err`, `Result` to be available to users.

## 0.1.0

### Minor Changes

- e8aa13b: Set up CI/CD

  - Set up Changesets
  - Add CI scripts to check types/tests/build when opening PR
  - Add script to run changesets upon merge to main. Will open automated PR, and publish upon merge.
  - Fix internal package names and versioning.

## 0.1.0

### Minor Changes

- 4124147: Very first changeset!
