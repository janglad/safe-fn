import type { ResultAsync } from "neverthrow";
import type {
  InferActionErrError,
  InferAsyncErrError,
  InferAsyncOkData,
} from "../result";
import type { TAnyRunnableSafeFn, TRunnableSafeFn } from "../runnable-safe-fn";
import type { AnyCtxInput } from "../types/handler";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "../types/schema";
import type { TODO } from "../types/util";
import type { TSafeFnActionReturn } from "./action";

/*
################################
||                            ||
||           Infer            ||
||                            ||
################################
*/
/**
 * Type params:
 * - `T`: The runnable safe function
 *
 * Return type:
 * - The type of the arguments of the safe function passed to `run()`
 */
export type InferSafeFnArgs<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    infer TUnparsedInput,
    any
  >
    ? TSafeFnRunArgs<TUnparsedInput>
    : never;

/**
 * Type params:
 * - `T`: The runnable safe function
 * - `TAsAction`: Indicates whether the function is run as an action (`.createAction()()`) or not (`run()`)
 *
 * Return type:
 * - The return type. `ResultAsync` if `TAsAction` is `false`, `Promise<ActionResult>` if `TAsAction` is `true`.
 */
export type InferSafeFnReturn<T, TAsAction extends boolean> =
  T extends TRunnableSafeFn<
    infer TData,
    infer TRunErr,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    any,
    any,
    any
  >
    ? TAsAction extends true
      ? TSafeFnActionReturn<TData, TRunErr, TOutputSchema>
      : TSafeFnRunReturn<TData, TRunErr, TOutputSchema>
    : never;

/**
 * Type params:
 * - `T`: The runnable safe function
 *
 * Return type:
 * - The type of the `.value` of the return type of the safe function after successful execution.
 */
export type InferSafeFnOkData<T> =
  T extends TRunnableSafeFn<
    infer TData,
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    any,
    any,
    any
  >
    ? TSafeFnReturnData<TData, TOutputSchema>
    : never;

/**
 * Type params:
 * - `T`: The runnable safe function
 * - `TAsAction`: Indicates whether the function is run as an action (`.createAction()()`) or not (`run()`)
 *
 * Return type:
 * - The type of the `.error` of the return type of the safe function after unsuccessful execution.
 */
export type InferSafeFnErrError<
  T extends TAnyRunnableSafeFn,
  TAsAction extends boolean,
> = TAsAction extends true
  ? InferActionErrError<Awaited<InferSafeFnReturn<T, true>>>
  : InferAsyncErrError<InferSafeFnReturn<T, false>>;

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

export type TSafeFnReturnData<TData, TOutputSchema extends TSafeFnOutput> = [
  TData,
] extends [never]
  ? never
  : TSchemaOutputOrFallback<TOutputSchema, TData>;

export type TSafeFnRunError<TRunErr, TOutputSchema> = TRunErr;

export type TSafeFnRunArgs<T extends TSafeFnUnparsedInput> = T;

export interface TSafeFnReturn<
  in out TData,
  in out TRunError,
  in out TOutputSchema extends TSafeFnOutput,
> extends ResultAsync<
    TSafeFnReturnData<TData, TOutputSchema>,
    TSafeFnReturnError<TRunError, TOutputSchema>
  > {}

export type TSafeFnReturnError<TRunError, TOutputSchema> = TSafeFnRunError<
  TRunError,
  TOutputSchema
>;

export interface TSafeFnRunReturn<
  in out TData,
  in out TRunError,
  in out TOutputSchema extends TSafeFnOutput,
> extends ResultAsync<
    TSafeFnReturnData<TData, TOutputSchema>,
    TSafeFnRunError<TRunError, TOutputSchema>
  > {}

export interface TSafeFnInternalRunReturn<
  in out TData,
  in out TRunError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
> extends ResultAsync<
    TSafeFnInternalRunReturnData<
      TData,
      TRunError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    TSafeFnInternalRunReturnError<
      TData,
      TRunError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >
  > {}

export interface TSafeFnInternalRunReturnData<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
> {
  value: InferAsyncOkData<TSafeFnReturn<TData, TRunErr, TOutputSchema>>;
  input: TSchemaOutputOrFallback<TInputSchema, undefined>;
  ctx: TCtx;
  ctxInput: TCtxInput;
  unsafeRawInput: TUnparsedInput;
}

export interface TSafeFnInternalRunReturnError<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
> {
  public: InferAsyncErrError<TSafeFnReturn<TData, TRunErr, TOutputSchema>>;
  private: {
    input: TSchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx: TCtx;
    ctxInput: TCtxInput | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
