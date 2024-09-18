import { Err, type Result, type ResultAsync } from "neverthrow";
import type { z } from "zod";
import type {
  InferActionErrError,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
} from "../result";
import type {
  TAnyRunnableSafeFn,
  TRunnableSafeFn,
  TRunnableSafeFnPickArgs,
} from "../runnable-safe-fn";
import type { TAnySafeFnHandlerRes } from "../types/handler";
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
 * @param T the runnable safe function
 * @returns the type of the arguments of the safe function passed to `run()`
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
    infer TUnparsedInput,
    any,
    any,
    any
  >
    ? TSafeFnRunArgs<TUnparsedInput>
    : never;

/**
 * @param T the runnable safe function
 * @param TAsAction true === `createAction()()`, false -> `run()`
 * @returns the type of the return `AsyncResult` or `Promise<ActionResult>` value of the safe function after calling run();
 */
export type InferSafeFnReturn<T, TAsAction extends boolean> =
  T extends TRunnableSafeFn<
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
      : ReturnType<T["run"]>
    : never;

export type TInferSafeFnInternalRunReturnData<T, TAsAction extends boolean> =
  T extends TRunnableSafeFn<
    infer TCtx,
    infer TCtxInput,
    infer TParentMergedHandlerErrs,
    infer TInputSchema,
    infer TMergedInputSchemaInput,
    infer TOutputSchema,
    infer TMergedParentOutputSchemaInput,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TThrownHandlerRes,
    TRunnableSafeFnPickArgs
  >
    ? TSafeFnInternalRunReturnData<
        TCtx,
        TCtxInput,
        TParentMergedHandlerErrs,
        TInputSchema,
        TMergedInputSchemaInput,
        TOutputSchema,
        TMergedParentOutputSchemaInput,
        TUnparsedInput,
        THandlerRes,
        TThrownHandlerRes,
        TAsAction
      >
    : never;

/**
 * @param T the runnable safe function
 * @returns the `.value` type of the returned `AsyncResult` assuming it's an `AsyncOk`.
 */
export type InferSafeFnOkData<T> =
  T extends TRunnableSafeFn<
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
 * @param T the runnable safe function
 * @returns the `.error` type of the returned `AsyncResult` assuming it's an `AsyncErr`.
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

/**
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerRes the return of the handler function
 * @returns the data type of the return value of the safe function after successful execution. If the output schema is undefined, this is inferred from the return type of the handler function. Otherwise, this is the output (`z.output<typeof outputSchema`) of the outputSchema.
 * Note that this is wrapped in a `Result` type.
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

/**
 * @param TParent the parent safe function or undefined
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerRes the return of the handler function
 * @param TCatchHandlerRes the return of the catch handler
 * @param TAsAction indicates weather the function is run as an action (full error is not typed if true as it's not sent over the wire)
 * @returns the error type of the return value of the safe function after unsuccessful execution. This is a union of all possible error types that can be catch by the safe function consisting off:
 * - A union of all `Err` returns of the handler function
 * - A union of all `Err` returns of the uncaught error handler
 * - A `SafeFnInputParseError` if the input schema is defined and the input could not be parsed
 * - A `SafeFnOutputParseError` if the output schema is defined and the output could not be parsed
 */
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

export type TBuildMergedHandlersErrs<T extends TAnyRunnableSafeFn> = Err<
  never,
  Thing<T>
>;

export type Thing<T> =
  T extends TRunnableSafeFn<
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

type TInferMergedHandlersErr<T> =
  T extends TRunnableSafeFn<
    any,
    infer TCtxInput,
    infer TParentMergedHandlerErrs,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TParentMergedHandlerErrs
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

/**
 * @param TUnparsedInput the unparsed input of the safe function
 * @param THandlerFn
 * @returns the input necessary to `run()` the safe function. If an input schema is provided, this is the parsed input (`z.output<typeof inputSchema>`).
 * Otherwise, this is the unparsed input of the handler function (can be typed through `unparsedInput<>()`).
 * Note this is an array and can be spread into the args.
 */

export type TSafeFnRunArgs<T extends TSafeFnUnparsedInput> = T;

/**
 * @param TParent the parent safe function or undefined
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerRes the return of the handler function
 * @param TCatchHandlerRes the return of the catch handler
 * @param TAsAction indicates weather the function is run as an action (full error is not typed if true as it's not sent over the wire)
 * @returns the returned value of the safe function after execution without throwing. This is a `ResultAsync` type that can either be an `Ok` or an `Err`.
 *
 */
export type TSafeFnReturn<
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> = ResultAsync<
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
>;

export type TSafeFnInternalRunReturn<
  in out TCtx,
  in out TCtxInput extends unknown[],
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> = ResultAsync<
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
>;

export interface TSafeFnInternalRunReturnData<
  in out TCtx,
  in out TCtxInput extends unknown[],
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
  in out TCtxInput extends unknown[],
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
