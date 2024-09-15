import type { Result, ResultAsync } from "neverthrow";
import type {
  InferActionErrError,
  InferActionOkData,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
} from "../result";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type {
  AnySafeFnCatchHandlerRes,
  SafeFnInputParseError,
  SafeFnOutputParseError,
} from "../types/error";
import type { AnySafeFnHandlerRes } from "../types/handler";
import type {
  SafeFnInput,
  SafeFnOutput,
  SchemaInputOrFallback,
  SchemaOutputOrFallback,
} from "../types/schema";
import type { DistributeUnion, TODO, TToTuple } from "../types/util";

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

/**
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerRes the return of the handler function
 * @returns the data type of the return value of the safe function after successful execution. If the output schema is undefined, this is inferred from the return type of the handler function. Otherwise, this is the output (`z.output<typeof outputSchema`) of the outputSchema.
 * Note that this is wrapped in a `Result` type.
 */
export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
> =
  THandlerRes extends Result<infer TData, any>
    ? [TData] extends [never]
      ? never
      : SchemaOutputOrFallback<TOutputSchema, TData>
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
export type SafeFnReturnError<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> =
  | InferErrError<THandlerRes>
  | InferErrError<TCatchHandlerRes>
  | SafeFnInputParseError<TInputSchema, TAsAction>
  | (THandlerRes extends Result<never, any>
      ? never
      : SafeFnOutputParseError<TOutputSchema, TAsAction>)
  | (TParent extends AnyRunnableSafeFn
      ? InferSafeFnErrError<TParent, TAsAction>
      : never);

/**
 * @param TUnparsedInput the unparsed input of the safe function
 * @param THandlerFn
 * @returns the input necessary to `run()` the safe function. If an input schema is provided, this is the parsed input (`z.output<typeof inputSchema>`).
 * Otherwise, this is the unparsed input of the handler function (can be typed through `unparsedInput<>()`).
 * Note this is an array and can be spread into the args.
 */

export type SafeFnRunArgs<TUnparsedInput> = TToTuple<TUnparsedInput>;

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
export type SafeFnReturn<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> = ResultAsync<
  SafeFnReturnData<TOutputSchema, THandlerRes>,
  DistributeUnion<
    SafeFnReturnError<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >
>;

export type SafeFnInternalRunReturn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
  TAsProcedure extends boolean,
> =
  SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TCatchHandlerRes,
    TAsAction
  > extends infer HandlerRes
    ? TAsProcedure extends true
      ? ResultAsync<
          {
            result: InferAsyncOkData<HandlerRes>;
            input: SchemaOutputOrFallback<TInputSchema, undefined>;
            ctx: TParent extends AnyRunnableSafeFn
              ? InferSafeFnOkData<TParent, TAsAction>
              : undefined;
          },
          InferAsyncErrError<HandlerRes>
        >
      : HandlerRes
    : never;

export type SafeFnSuperInternalRunReturn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> =
  SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TCatchHandlerRes,
    TAsAction
  > extends infer HandlerRes
    ? ResultAsync<
        {
          result: InferAsyncOkData<HandlerRes>;
          input: SchemaOutputOrFallback<TInputSchema, undefined>;
          ctx: TParent extends AnyRunnableSafeFn
            ? InferSafeFnOkData<TParent, TAsAction>
            : undefined;
          unsafeRawInput: TUnparsedInput;
        },
        {
          public: InferAsyncErrError<HandlerRes>;
          private: {
            input: SchemaInputOrFallback<TInputSchema, undefined> | undefined;
            ctx:
              | (TParent extends AnyRunnableSafeFn
                  ? InferSafeFnOkData<TParent, TAsAction>
                  : undefined)
              | undefined;
            unsafeRawInput: TUnparsedInput;
          };
        }
      >
    : never;

export interface SafeFnSuperInternalRunReturnData<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  result: InferAsyncOkData<
    SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  input: SchemaOutputOrFallback<TInputSchema, undefined>;
  ctx: TParent extends AnyRunnableSafeFn
    ? InferSafeFnOkData<TParent, TAsAction>
    : undefined;
  unsafeRawInput: TUnparsedInput;
}

export interface SafeFnSuperInternalRunReturnError<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  in out TAsAction extends boolean,
> {
  public: InferAsyncErrError<
    SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      TAsAction
    >
  >;
  private: {
    input: SchemaInputOrFallback<TInputSchema, undefined> | undefined;
    ctx:
      | (TParent extends AnyRunnableSafeFn
          ? InferSafeFnOkData<TParent, TAsAction>
          : undefined)
      | undefined;
    unsafeRawInput: TUnparsedInput;
    handlerRes: TODO;
  };
}
