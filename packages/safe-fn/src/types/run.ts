import type { Result, ResultAsync } from "neverthrow";
import type {
  InferActionErrError,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
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
    any,
    any,
    infer TUnparsedInput,
    any,
    any,
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
    infer TActionErr,
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    any,
    any,
    any,
    any,
    any
  >
    ? TAsAction extends true
      ? TSafeFnActionReturn<TData, TRunErr, TActionErr, TOutputSchema>
      : TSafeFnReturn<TData, TRunErr, TActionErr, TOutputSchema, false>
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
    any,
    any,
    infer TOutputSchema,
    any,
    any,
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

export type TSafeFnReturnError<
  TRunErr,
  TActionErr,
  TOutputSchema extends TSafeFnOutput,
  TAsAction extends boolean,
> = TAsAction extends true
  ? TSafeFnActionError<TActionErr, TOutputSchema>
  : TSafeFnRunError<TRunErr, TOutputSchema>;

export type TSafeFnRunError<TRunErr, TOutputSchema> = TRunErr;
export type TSafeFnActionError<TActionErr, TOutputSchema> = TActionErr;

export type TBuildMergedHandlersErrs<T extends TAnyRunnableSafeFn> = Result<
  never,
  Thing<T>
>;

type Thing<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    infer TParentMergedHandlerErrs,
    any,
    any,
    any,
    any,
    any,
    infer THandlerRes,
    infer TThrownHandlerRes,
    any
  >
    ?
        | InferErrError<THandlerRes>
        | InferErrError<TThrownHandlerRes>
        | InferErrError<TParentMergedHandlerErrs>
    : never;

export type TSafeFnRunArgs<T extends TSafeFnUnparsedInput> = T;

export interface TSafeFnReturn<
  in out TData,
  in out TRunError,
  in out TActionError,
  in out TOutputSchema extends TSafeFnOutput,
  in out TAsAction extends boolean,
> extends ResultAsync<
    TSafeFnReturnData<TData, TOutputSchema>,
    TSafeFnReturnError<TRunError, TActionError, TOutputSchema, TAsAction>
  > {}

export interface TSafeFnInternalRunReturn<
  in out TData,
  in out TRunError,
  in out TActionError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out TAsAction extends boolean,
> extends ResultAsync<
    TSafeFnInternalRunReturnData<
      TData,
      TRunError,
      TActionError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TAsAction
    >,
    TSafeFnInternalRunReturnError<
      TData,
      TRunError,
      TActionError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TAsAction
    >
  > {}

export interface TSafeFnInternalRunReturnData<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out TAsAction extends boolean,
> {
  value: InferAsyncOkData<
    TSafeFnReturn<TData, TRunErr, TActionErr, TOutputSchema, TAsAction>
  >;
  input: TSchemaOutputOrFallback<TInputSchema, undefined>;
  ctx: TCtx;
  ctxInput: TCtxInput;
  unsafeRawInput: TUnparsedInput;
}

export interface TSafeFnInternalRunReturnError<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out TAsAction extends boolean,
> {
  public: InferAsyncErrError<
    TSafeFnReturn<TData, TRunErr, TActionErr, TOutputSchema, TAsAction>
  >;
  private: {
    input: TSchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx: TCtx;
    ctxInput: TCtxInput | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
