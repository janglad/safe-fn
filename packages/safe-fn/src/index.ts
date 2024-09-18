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

import type { AnyRunnableSafeFn } from "./runnable-safe-fn";

import type {
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
  TAnySafeFnAction,
} from "./types/action";
import type {
  InferSafeFnArgs,
  InferSafeFnErrError,
  InferSafeFnOkData,
  InferSafeFnReturn,
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
  AnyRunnableSafeFn,
  TAnySafeFnAction as AnySafeFnAction,
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
  InferUnparsedInputTuple,
};
