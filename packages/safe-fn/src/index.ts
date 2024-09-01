import type { Err, Ok, Result } from "./result";
import { err, ok } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";

import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  InferInputSchema,
  InferOutputSchema,
  InferReturn,
  InferReturnData,
  InferReturnError,
  InferRunArgs,
  InferUnparsedInput,
  SafeFnHandlerFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
} from "./types";

export { err, ok, SafeFnBuilder as SafeFn };
export type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
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
  SafeFnHandlerFn as SafeFnActionFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
};
