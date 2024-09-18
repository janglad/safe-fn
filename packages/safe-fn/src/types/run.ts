import { type Result, type ResultAsync } from "neverthrow";
import { z } from "zod";
import type {
  InferActionErrError,
  InferActionOkData,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
} from "../result";
import type { AnyRunnableSafeFn, RunnableSafeFn } from "../runnable-safe-fn";
import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnParseErrorNoZod,
} from "../types/error";
import type { TAnySafeFnHandlerRes, TCtxInput, TIsAny } from "../types/handler";
import type {
  InferInputSchema,
  InferOutputSchema,
  TSafeFnInput,
  TSafeFnOutput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "../types/schema";
import type {
  TIsNever,
  TODO,
  TPrettify,
  TToTuple,
  TUnionIfNotT,
} from "../types/util";

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
export type InferSafeFnArgs<T extends AnyRunnableSafeFn> = Parameters<
  T["run"]
>[0];

/**
 * @param T the runnable safe function
 * @param TAsAction true === `createAction()()`, false -> `run()`
 * @returns the type of the return `AsyncResult` or `Promise<ActionResult>` value of the safe function after calling run();
 */
export type InferSafeFnReturn<
  T,
  TAsAction extends boolean,
> = T extends AnyRunnableSafeFn
  ? TAsAction extends true
    ? ReturnType<T["_runAsAction"]>
    : ReturnType<T["run"]>
  : never;

export type TInferSafeFnInternalRunReturnData<T, TAsAction extends boolean> =
  T extends RunnableSafeFn<
    infer TParent,
    infer TInputSchema,
    infer TOutputSchema,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TThrownHandlerRes
  >
    ? TSafeFnInternalRunReturnData<
        TParent,
        TInputSchema,
        TOutputSchema,
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
export type InferSafeFnOkData<
  T,
  TAsAction extends boolean,
> = TAsAction extends true
  ? InferActionOkData<Awaited<InferSafeFnReturn<T, true>>>
  : InferAsyncOkData<InferSafeFnReturn<T, false>>;

/**
 * @param T the runnable safe function
 * @returns the `.error` type of the returned `AsyncResult` assuming it's an `AsyncErr`.
 */
export type InferSafeFnErrError<
  T extends AnyRunnableSafeFn,
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
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnOutput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> =
  | InferErrError<THandlerRes>
  | InferErrError<TCatchHandlerRes>
  | TInputSchemaError<TParent, TInputSchema, TAsAction>
  | TOutputSchemaError<TParent, TOutputSchema, THandlerRes, TAsAction>
  | ParentHandlerCatchErrs<TParent>;

type ParentHandlerCatchErrs<TParent extends AnyRunnableSafeFn | undefined> =
  TParent extends
    | RunnableSafeFn<
        infer TParentParent,
        any,
        any,
        any,
        infer THandlerRes,
        infer TThrownHandlerRes
      >
    | RunnableSafeFn<
        infer TParentParent,
        any,
        any,
        never,
        infer THandlerRes,
        infer TThrownHandlerRes
      >
    ?
        | InferErrError<THandlerRes>
        | InferErrError<TThrownHandlerRes>
        | (TParentParent extends AnyRunnableSafeFn
            ? ParentHandlerCatchErrs<TParentParent>
            : never)
    : never;

type TOutputSchemaError<
  TParent extends AnyRunnableSafeFn | undefined,
  TOutputSchema extends TSafeFnOutput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TAsAction extends boolean,
> =
  TIsAny<TParent> extends true
    ? any
    : BuildMergedOutputSchemaInput<TParent> extends infer TMergedParent
      ? TIsNever<TMergedParent> extends true
        ? THandlerRes extends Result<never, any>
          ? never
          : TOutputSchema extends z.ZodTypeAny
            ? {
                code: "OUTPUT_PARSING";
                cause: TSafeFnParseErrorNoZod<
                  z.input<TOutputSchema>,
                  TAsAction
                >;
              }
            : never
        : THandlerRes extends Result<never, any>
          ? {
              code: "OUTPUT_PARSING";
              cause: TSafeFnParseErrorNoZod<
                TPrettify<TMergedParent>,
                TAsAction
              >;
            }
          : TOutputSchema extends z.ZodTypeAny
            ? {
                code: "OUTPUT_PARSING";
                cause: TSafeFnParseErrorNoZod<
                  TPrettify<TMergedParent & z.input<TOutputSchema>>,
                  TAsAction
                >;
              }
            : {
                code: "OUTPUT_PARSING";
                cause: TSafeFnParseErrorNoZod<
                  TPrettify<TMergedParent>,
                  TAsAction
                >;
              }
      : never;

type TInputSchemaError<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends TSafeFnInput,
  TAsAction extends boolean,
> =
  BuildMergedInputSchemaInput<TParent> extends infer TMergedParent
    ? TIsNever<TMergedParent> extends true
      ? TInputSchema extends z.ZodTypeAny
        ? {
            code: "INPUT_PARSING";
            cause: TSafeFnParseErrorNoZod<z.input<TInputSchema>, TAsAction>;
          }
        : never
      : TInputSchema extends z.ZodTypeAny
        ? {
            code: "INPUT_PARSING";
            cause: TSafeFnParseErrorNoZod<
              TPrettify<TMergedParent & z.input<TInputSchema>>,
              TAsAction
            >;
          }
        : {
            code: "INPUT_PARSING";
            cause: TSafeFnParseErrorNoZod<TPrettify<TMergedParent>, TAsAction>;
          }
    : never;

type BuildMergedInputSchemaInput<
  TParent extends AnyRunnableSafeFn | undefined,
> =
  TIsAny<TParent> extends true
    ? any
    : TParent extends AnyRunnableSafeFn
      ? InferInputSchema<TParent> extends infer TParentInput extends
          z.ZodTypeAny
        ? TUnionIfNotT<
            z.input<TParentInput>,
            BuildMergedInputSchemaInput<TParent["_internals"]["parent"]>,
            never
          >
        : BuildMergedInputSchemaInput<TParent["_internals"]["parent"]>
      : never;

type BuildMergedOutputSchemaInput<
  TParent extends AnyRunnableSafeFn | undefined,
> = TParent extends AnyRunnableSafeFn
  ? InferOutputSchema<TParent> extends infer TParentOutput extends z.ZodTypeAny
    ? TUnionIfNotT<
        z.input<TParentOutput>,
        BuildMergedOutputSchemaInput<TParent["_internals"]["parent"]>,
        never
      >
    : BuildMergedOutputSchemaInput<TParent["_internals"]["parent"]>
  : never;

/**
 * @param TUnparsedInput the unparsed input of the safe function
 * @param THandlerFn
 * @returns the input necessary to `run()` the safe function. If an input schema is provided, this is the parsed input (`z.output<typeof inputSchema>`).
 * Otherwise, this is the unparsed input of the handler function (can be typed through `unparsedInput<>()`).
 * Note this is an array and can be spread into the args.
 */

export type TSafeFnRunArgs<TUnparsedInput> = TToTuple<TUnparsedInput>;

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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> = ResultAsync<
  TSafeFnReturnData<TOutputSchema, THandlerRes>,
  TSafeFnReturnError<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TCatchHandlerRes,
    TAsAction
  >
>;

export type TSafeFnInternalRunReturn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnOutput,
  TUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> = ResultAsync<
  TSafeFnInternalRunReturnData<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    TAsAction
  >,
  TSafeFnInternalRunReturnError<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    TAsAction
  >
>;

export interface TSafeFnInternalRunReturnData<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  value: InferAsyncOkData<
    TSafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  input: TSchemaOutputOrFallback<TInputSchema, undefined>;
  // ctx: TParent extends AnyRunnableSafeFn
  //   ? InferSafeFnOkData<TParent, TAsAction>
  //   : undefined;
  ctx: TODO;
  ctxInput: TCtxInput<TParent>;
  unsafeRawInput: TUnparsedInput;
}

export interface TSafeFnInternalRunReturnError<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  public: InferAsyncErrError<
    TSafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  private: {
    input: TSchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx:
      | (TParent extends AnyRunnableSafeFn
          ? InferSafeFnOkData<TParent, TAsAction>
          : undefined)
      | undefined;
    ctxInput: TCtxInput<TParent> | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
