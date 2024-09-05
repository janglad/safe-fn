---
"safe-fn": patch
---

## Changes

- Type `unparsedInput` as `never` when there is no input

## Fixes

- Fix bug when typing merged unparsed inputs where one is unknown
- Fix bug when typing merged parsed input when one schema is not defined
- Prettify user facing types where needed (and missing before)
- Fix bug in Generator typing when no error is yielded
- Fix bug where transformed errors from `action()` were not correctly typed
