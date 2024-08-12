import type { Err, Ok, Result } from "./result";
import { err, ok } from "./result";
import { SafeFn } from "./safe-fn";

import type {
  AnyCompleteSafeFn,
  AnyRunnableSafeFn,
  AnySafeFn,
  AnySafeFnThrownHandler,
  BuilderSteps,
  InferInputSchema,
  InferOutputSchema,
  InferReturn,
  InferReturnData,
  InferReturnError,
  InferRunArgs,
  InferUnparsedInput,
  SafeFnActionFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
  TSafeFn,
} from "./types";

export { err, ok, SafeFn };
export type {
  AnyCompleteSafeFn,
  AnyRunnableSafeFn,
  AnySafeFn,
  AnySafeFnThrownHandler,
  BuilderSteps,
  Err,
  InferInputSchema,
  InferOutputSchema,
  InferReturn,
  InferReturnData,
  InferReturnError,
  InferRunArgs,
  InferUnparsedInput,
  Ok,
  Result,
  SafeFnActionFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
  TSafeFn,
};
