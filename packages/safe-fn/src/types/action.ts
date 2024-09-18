import type { Result } from "neverthrow";
import type {
  InferActionErrError,
  InferActionOkData,
  ResultAsyncToActionResult,
} from "../result";
import type { TSafeFnReturn, TSafeFnRunArgs } from "../types/run";
import type { TAnySafeFnCatchHandlerRes } from "./error";
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
 * @param T the action created through `createAction()`
 * @returns the return value of the action after execution without throwing. This is a `ActionResult<T,E>`.
 */
export type InferSafeFnActionReturn<T extends TAnySafeFnAction> = Awaited<
  ReturnType<T>
>;
/**
 * @param T the action created through `createAction()`
 * @returns the input necessary to run the action.
 */
export type InferSafeFnActionArgs<T extends TAnySafeFnAction> =
  Parameters<T>[0];

/**
 * @param T the action created through `createAction()`
 * @returns the `.value` type of the returned `ActionResult` assuming it's ok
 */
export type InferSafeFnActionOkData<T extends TAnySafeFnAction> =
  InferActionOkData<InferSafeFnActionReturn<T>>;

/**
 * @param T the action created through `createAction()`
 * @returns the `.error` type of the returned `ActionResult` assuming it's not ok
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

/**
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the input necessary to run the action created through `createAction()`.
 */
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
