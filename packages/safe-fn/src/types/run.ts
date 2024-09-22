import type { ResultAsync } from "neverthrow";
import type { InferAsyncErrError } from "../result";
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
export type InferSafeFnRunArgs<T> =
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
 *
 * Return type:
 * - The return typ, a `ResultAsync`
 */
export type InferSafeFnRunReturn<T> =
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
    ? TSafeFnRunReturn<TData, TRunErr, TOutputSchema>
    : never;

/**
 * Type params:
 * - `T`: The runnable safe function
 *
 * Return type:
 * - The type of the `.value` of the return type of the safe function after successful execution.
 */
export type InferSafeFnReturnData<T> =
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

export type InferSafeFnReturnError<T> =
  T extends TRunnableSafeFn<
    any,
    infer TRunErr,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TRunErr
    : never;

/**
 * Type params:
 * - `T`: The runnable safe function
 *
 * Return type:
 * - The type of the `.error` of the return type of the safe function after unsuccessful execution.
 */
export type InferSafeFnError<T extends TAnyRunnableSafeFn> = InferAsyncErrError<
  InferSafeFnRunReturn<T>
>;

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

export type TSafeFnReturnError<TRunErr, TOutputSchema> = TRunErr;

export type TSafeFnRunArgs<T extends TSafeFnUnparsedInput> = T;

export interface TSafeFnRunReturn<
  in out TData,
  in out TRunError,
  in out TOutputSchema extends TSafeFnOutput,
> extends ResultAsync<
    TSafeFnReturnData<TData, TOutputSchema>,
    TSafeFnReturnError<TRunError, TOutputSchema>
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
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    TSafeFnInternalRunReturnError<
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
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
> {
  value: TSafeFnReturnData<TData, TOutputSchema>;
  input: TSchemaOutputOrFallback<TInputSchema, undefined>;
  ctx: TCtx;
  ctxInput: TCtxInput;
  unsafeRawInput: TUnparsedInput;
}

export interface TSafeFnInternalRunReturnError<
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
> {
  public: TSafeFnReturnError<TRunErr, TOutputSchema>;
  private: {
    input: TSchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx: TCtx;
    ctxInput: TCtxInput | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
