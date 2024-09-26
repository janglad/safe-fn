# @safe-fn/safe-fn

## 0.4.2

### Patch Changes

- 51dd313: Fix type issues with the hook (related to distribution)

## 0.4.1

### Patch Changes

- ad1a948: - add `mapErr()` function
- c86e7ff: - removes asAction, all errors are now stripped by default
- 5e691c4: - Use child `.catch()` handler if parent didn't define one
- b78293b: - Rename some Infer types, see docs.

## 0.4.0

### Minor Changes

- 4fcaeff: - Force upgrade to Neverthrow@8 due to types not being compataible
  - Fix hook typings

## 0.3.0

### Minor Changes

- 9fbfa68: .

## 0.2.1

### Patch Changes

- 172faf3: Temporary fix for [#15](https://github.com/janglad/safe-fn/issues/15). By default errors are now not passed along but logged.
- 382bb1a: ## Changes

  - Type `unparsedInput` as `never` when there is no input

  ## Fixes

  - Fix bug when typing merged unparsed inputs where one is unknown
  - Fix bug when typing merged parsed input when one schema is not defined
  - Prettify user facing types where needed (and missing before)
  - Fix bug in Generator typing when no error is yielded
  - Fix bug where transformed errors from `action()` were not correctly typed

- 3194b4a: Add callbacks (onError, onStart, onComplete, onSuccess)
- 2bcb820: - Fix bad inference when not yielding an error in an async generator `safeHandler`
- c8f8132: - Add InferActionErrError and InferActionOkData types
  - Add InferAsyncOkData and InferAsyncErrError types
  - Rename some types for clarity
  - Improve type docs
- f55152a: Fix errors not being typed when coming from parent
  Fix parse errors not being typed correct when parent has them
- cf9893e: IDK a lot lol. Nobody reads this anyway.

## 0.2.0

### Minor Changes

- 9b6b0d0: Implements `safeHandler`, a function that takes in an async generator similar to Neverthrow's own `safeTry` enabling an ergonomic way to deal with return early upon error.

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
