import {
  actionResultToResult,
  type ActionErr,
  type ActionOk,
  type ActionResult,
  type ActionResultToResult,
  type InferActionErrError,
  type InferActionOkData,
} from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";

import type {
  AnyRunnableSafeFn,
  AnySafeFnAction,
  AnySafeFnCatchHandler,
  InferInputSchema,
  InferOutputSchema,
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
  InferSafeFnArgs,
  InferSafeFnErrError,
  InferSafeFnOkData,
  InferSafeFnReturn,
  InferUnparsedInput,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnAsyncGeneratorHandlerFn,
  SafeFnRegularHandlerFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
} from "./types";

export { actionResultToResult, SafeFnBuilder as SafeFn };
export type {
  ActionErr,
  ActionOk,
  ActionResult,
  ActionResultToResult,
  AnyRunnableSafeFn,
  AnySafeFnAction,
  AnySafeFnCatchHandler,
  InferActionErrError,
  InferActionOkData,
  InferInputSchema,
  InferOutputSchema,
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
  InferSafeFnArgs,
  InferSafeFnErrError,
  InferSafeFnOkData,
  InferSafeFnReturn,
  InferUnparsedInput,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnAsyncGeneratorHandlerFn,
  SafeFnRegularHandlerFn,
  SafeFnReturn,
  SafeFnReturnData,
  SafeFnReturnError,
  SafeFnRunArgs,
};
