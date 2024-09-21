import type {
  InferActionErrError,
  InferActionOkData,
  ResultAsyncToActionResult,
} from "../result";
import type { TSafeFnReturn, TSafeFnRunArgs } from "../types/run";
import type { TSafeFnOutput, TSafeFnUnparsedInput } from "./schema";

/*
################################
||                            ||
||           Infer            ||
||                            ||
################################
*/

/**
 * Type params:
 * - `T`: The action created through `createAction()`
 *
 * Return type:
 * - The awaited return type of the action, this is an `ActionResult<T,E>`
 */
export type InferSafeFnActionReturn<T extends TAnySafeFnAction> = Awaited<
  ReturnType<T>
>;
/**
 * Type params:
 * - `T`: The action created through `createAction()`
 *
 * Return type:
 * - The input necessary to run the action.
 */
export type InferSafeFnActionArgs<T extends TAnySafeFnAction> =
  Parameters<T>[0];

/**
 * Type params:
 * - `T`: The action created through `createAction()`
 *
 * Return type:
 * - The `.value` type of the returned `ActionResult` assuming it's ok
 */
export type InferSafeFnActionOkData<T extends TAnySafeFnAction> =
  InferActionOkData<InferSafeFnActionReturn<T>>;

/**
 * Type params:
 * - `T`: The action created through `createAction()`
 *
 * Return type:
 * - The `.error` type of the returned `ActionResult` assuming it's not ok
 */
export type InferSafeFnActionError<T extends TAnySafeFnAction> =
  InferActionErrError<InferSafeFnActionReturn<T>>;

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

export type TAnySafeFnAction = TSafeFnAction<any, any, any, any, any>;

export type TSafeFnActionArgs<T extends TSafeFnUnparsedInput> =
  TSafeFnRunArgs<T>;

export type TSafeFnActionReturn<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TOutputSchema extends TSafeFnOutput,
> = Promise<
  ResultAsyncToActionResult<
    TSafeFnReturn<TData, TRunErr, TActionErr, TOutputSchema, true>
  >
>;
export type TSafeFnAction<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> = (
  ...args: TSafeFnActionArgs<TUnparsedInput>
) => TSafeFnActionReturn<TData, TRunErr, TActionErr, TOutputSchema>;
