---
"safe-fn": patch
---

Features

- Implement NeverThrow instead of own Result type
- Add separate typing for running as a server action, in which case Zod errors are stripped from stack traces etc.
- move Zod to peer dependency
