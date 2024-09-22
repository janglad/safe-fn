import {
  actionResultToResult,
  type ActionErr,
  type ActionOk,
  type ActionResult,
  type ActionResultToResult,
  type ActionResultToResultAsync,
  type InferActionErrError,
  type InferActionOkData,
} from "./result";
import { createSafeFn } from "./safe-fn-builder";

import type { TAnyRunnableSafeFn } from "./runnable-safe-fn";

import type {
  InferSafeFnActionArgs,
  InferSafeFnActionReturn,
  InferSafeFnActionReturnData,
  InferSafeFnActionReturnError,
  TAnySafeFnAction,
} from "./types/action";
import type {
  InferSafeFnArgs,
  InferSafeFnReturn,
  InferSafeFnReturnData,
  InferSafeFnReturnError,
} from "./types/run";
import type {
  InferInputSchema,
  InferOutputSchema,
  InferUnparsedInputTuple,
} from "./types/schema";

export { actionResultToResult, createSafeFn };
export type {
  ActionErr,
  ActionOk,
  ActionResult,
  ActionResultToResult,
  ActionResultToResultAsync,
  TAnyRunnableSafeFn as AnyRunnableSafeFn,
  TAnySafeFnAction as AnySafeFnAction,
  InferActionErrError,
  InferActionOkData,
  InferInputSchema,
  InferOutputSchema,
  InferSafeFnActionArgs,
  InferSafeFnActionReturn,
  InferSafeFnActionReturnData,
  InferSafeFnActionReturnError,
  InferSafeFnArgs,
  InferSafeFnReturn,
  InferSafeFnReturnData,
  InferSafeFnReturnError,
  InferUnparsedInputTuple,
};
