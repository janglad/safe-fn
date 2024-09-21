import type { Result, ResultAsync } from "neverthrow";
import type { z } from "zod";
import type {
  InferActionErrError,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
} from "../result";
import type { TAnyRunnableSafeFn, TRunnableSafeFn } from "../runnable-safe-fn";
import type { AnyCtxInput, TAnySafeFnHandlerRes } from "../types/handler";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnParseError,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "../types/schema";
import type {
  AnyObject,
  TIntersectIfNotT,
  TODO,
  TPrettify,
} from "../types/util";
import type { TSafeFnActionReturn } from "./action";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";

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
    any,
    any,
    any,
    any,
    any,
    infer TParentMergedHandlerErrs,
    any,
    infer TMergedInputSchemaInput,
    infer TOutputSchema,
    infer TMergedParentOutputSchemaInput,
    any,
    infer THandlerRes,
    infer TThrownHandlerRes,
    any
  >
    ? TAsAction extends true
      ? TSafeFnActionReturn<
          TParentMergedHandlerErrs,
          TMergedInputSchemaInput,
          TOutputSchema,
          TMergedParentOutputSchemaInput,
          THandlerRes,
          TThrownHandlerRes
        >
      : TSafeFnReturn<
          TParentMergedHandlerErrs,
          TMergedInputSchemaInput,
          TOutputSchema,
          TMergedParentOutputSchemaInput,
          THandlerRes,
          TThrownHandlerRes,
          false
        >
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
    any,
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
    infer THandlerRes,
    any,
    any
  >
    ? TSafeFnReturnData<TOutputSchema, THandlerRes>
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

export type TSafeFnReturnData<
  TOutputSchema extends TSafeFnOutput,
  THandlerRes extends TAnySafeFnHandlerRes,
> =
  THandlerRes extends Result<infer TData, any>
    ? [TData] extends [never]
      ? never
      : TSchemaOutputOrFallback<TOutputSchema, TData>
    : never;

export type TSafeFnReturnError<
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnOutput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  THandlerRes extends TAnySafeFnHandlerRes,
  TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> =
  | InferErrError<THandlerRes>
  | InferErrError<TCatchHandlerRes>
  | TInputSchemaError<TMergedInputSchemaInput, TAsAction>
  | TOutputSchemaError<
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TAsAction
    >
  | InferErrError<TParentMergedHandlerErrs>;

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

type TOutputSchemaError<
  TOutputSchema extends TSafeFnOutput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  THandlerRes extends TAnySafeFnHandlerRes,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? THandlerRes extends Result<never, any>
    ? TMergedParentOutputSchemaInput extends AnyObject
      ? {
          code: "OUTPUT_PARSING";
          cause: TSafeFnParseError<
            TPrettify<TMergedParentOutputSchemaInput>,
            TAsAction
          >;
        }
      : // Handler can't return, no parents have output schemas
        never
    : {
        code: "OUTPUT_PARSING";
        cause: TSafeFnParseError<
          TPrettify<
            TIntersectIfNotT<
              z.input<TOutputSchema>,
              TMergedParentOutputSchemaInput,
              undefined
            >
          >,
          TAsAction
        >;
      }
  : TMergedParentOutputSchemaInput extends AnyObject
    ? {
        code: "OUTPUT_PARSING";
        cause: TSafeFnParseError<
          TPrettify<TMergedParentOutputSchemaInput>,
          TAsAction
        >;
      }
    : // No output schema, parents have no output schemas
      never;
type TInputSchemaError<
  TMergedInputSchemaInput extends AnyObject | undefined,
  TAsAction extends boolean,
> = TMergedInputSchemaInput extends AnyObject
  ? {
      code: "INPUT_PARSING";
      cause: TSafeFnParseError<TPrettify<TMergedInputSchemaInput>, TAsAction>;
    }
  : never;

export type TSafeFnRunArgs<T extends TSafeFnUnparsedInput> = T;

export interface TSafeFnReturn<
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> extends ResultAsync<
    TSafeFnReturnData<TOutputSchema, THandlerRes>,
    TSafeFnReturnError<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  > {}

export interface TSafeFnInternalRunReturn<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> extends ResultAsync<
    TSafeFnInternalRunReturnData<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >,
    TSafeFnInternalRunReturnError<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  > {}

export interface TSafeFnInternalRunReturnData<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  value: InferAsyncOkData<
    TSafeFnReturn<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  input: TSchemaOutputOrFallback<TInputSchema, undefined>;
  ctx: TCtx;
  ctxInput: TCtxInput;
  unsafeRawInput: TUnparsedInput;
}

export interface TSafeFnInternalRunReturnError<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  public: InferAsyncErrError<
    TSafeFnReturn<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  private: {
    input: TSchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx: TCtx;
    ctxInput: TCtxInput | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
