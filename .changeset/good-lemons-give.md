---
"safe-fn": minor
---

- About a ~10x performance increase for single `safe-fn` instances
- About a ~17x performance increase when testing a `safe-fn` with 10 parents

Other changes:

- Parse input as soon as possible, both helps with performance but also makes more sense. This way the parent handlers don't get hit when there would be an input error in the end anyway.
