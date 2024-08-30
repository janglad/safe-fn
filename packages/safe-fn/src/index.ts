import type { Err, Ok, Result } from "./result";
import { err, ok } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";

import type {
  AnyCompleteSafeFn,
  AnyRunnableSafeFn,
  AnySafeFnBuilder,
  AnySafeFnThrownHandler,
  InferCompleteFnReturn,
  InferCompleteFnReturnData,
  InferCompleteFnReturnError,
  InferCompleteFnRunArgs,
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
} from "./types";

export { err, ok, SafeFnBuilder as SafeFn };
export type {
  AnyCompleteSafeFn,
  AnyRunnableSafeFn,
  AnySafeFnBuilder as AnySafeFn,
  AnySafeFnThrownHandler,
  Err,
  InferCompleteFnReturn,
  InferCompleteFnReturnData,
  InferCompleteFnReturnError,
  InferCompleteFnRunArgs,
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
};
