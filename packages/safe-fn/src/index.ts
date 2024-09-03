import type { Err, Ok, Result } from "./result";
import {
  type ActionResult,
  type ActionResultToResult,
  actionResultToResult,
  err,
  ok,
} from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";

import type {
  AnyRunnableSafeFn,
  AnySafeFnAction,
  AnySafeFnThrownHandler,
  InferInputSchema,
  InferOutputSchema,
  InferReturn,
  InferReturnData,
  InferReturnError,
  InferRunArgs,
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
  InferUnparsedInput,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnHandlerFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
} from "./types";

export { actionResultToResult, err, ok, SafeFnBuilder as SafeFn };
export type {
  ActionResult,
  ActionResultToResult,
  AnyRunnableSafeFn,
  AnySafeFnAction,
  AnySafeFnThrownHandler,
  Err,
  InferInputSchema,
  InferOutputSchema,
  InferReturn,
  InferReturnData,
  InferReturnError,
  InferRunArgs,
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
  InferUnparsedInput,
  Ok,
  Result,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnHandlerFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
};
