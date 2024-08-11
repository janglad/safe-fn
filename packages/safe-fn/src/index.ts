import { type Err, type Ok, type Result, err, ok } from "./result";
import { SafeFn } from "./safe-fn";

import type {
  AnyRunnableSafeFn,
  AnySafeFn,
  AnySafeFnThrownHandler,
  BuilderSteps,
  InferInputSchema,
  InferOutputSchema,
  InferRunArgs,
  InferUnparsedInput,
  SafeFnActionFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
  TSafeFn,
} from "./types";

export { SafeFn };
export type {
  AnyRunnableSafeFn,
  AnySafeFn,
  AnySafeFnThrownHandler,
  BuilderSteps,
  Err,
  InferInputSchema,
  InferOutputSchema,
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
  err,
  ok,
};
