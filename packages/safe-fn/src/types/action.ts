import type { Result } from "neverthrow";
import type {
  InferActionErrError,
  InferActionOkData,
  ResultAsyncToActionResult,
} from "../result";
import type { TSafeFnReturn, TSafeFnRunArgs } from "../types/run";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";
import type { TAnySafeFnHandlerRes } from "./handler";
import type { TSafeFnOutput, TSafeFnUnparsedInput } from "./schema";
import type { AnyObject } from "./util";

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

export type TAnySafeFnAction = TSafeFnAction<any, any, any, any, any, any, any>;

export type TSafeFnActionArgs<T extends TSafeFnUnparsedInput> =
  TSafeFnRunArgs<T>;

export type TSafeFnActionReturn<
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> = Promise<
  ResultAsyncToActionResult<
    TSafeFnReturn<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TCatchHandlerRes,
      true
    >
  >
>;
export type TSafeFnAction<
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> = (
  ...args: TSafeFnActionArgs<TUnparsedInput>
) => TSafeFnActionReturn<
  TParentMergedHandlerErrs,
  TMergedInputSchemaInput,
  TOutputSchema,
  TMergedParentOutputSchemaInput,
  THandlerRes,
  TCatchHandlerRes
>;
