import type { z, ZodFormattedError, ZodTypeAny } from "zod";
import type {
  Err,
  InferActionErrError,
  InferActionOkData,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
  InferOkData,
  Result,
  ResultAsync,
  ResultAsyncToPromiseActionResult,
} from "./result";
import type { RunnableSafeFn } from "./runnable-safe-fn";

/*
################################
||                            ||
||         Internals          ||
||                            ||
################################
*/
export type SafeFnInternals<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
> = {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
  ) => SafeFnHandlerReturn<TOutputSchema>;
  uncaughtErrorHandler: (error: unknown) => Result<never, unknown>;
};

/*
################################
||                            ||
||       RunnableSafeFn       ||
||                            ||
################################
*/

// Never union is kinda dirty but needed for now.
export type AnyRunnableSafeFn =
  | RunnableSafeFn<any, any, any, any, any, any>
  | RunnableSafeFn<any, any, any, never, any, any>;

/*
################################
||                            ||
||            Util            ||
||                            ||
################################
*/
export type TODO = any;
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type IsUnknown<T> = unknown extends T ? true : false;
type DistributeUnion<T> = T extends any ? T : never;

type TOrFallback<T, TFallback, TFilter = never> = [T] extends [TFilter]
  ? TFallback
  : T;
type MaybePromise<T> = T | Promise<T>;

/**
 * Return `A` & `B` if `A` is not `T` and `B` is not `T`, otherwise return `A` or `B` depending on if they are `T`.
 */
export type UnionIfNotT<A, B, T> = [A] extends [T]
  ? [B] extends [T]
    ? T
    : B
  : [B] extends [T]
    ? A
    : A & B;

/*
################################
||                            ||
||           Schema           ||
||                            ||
################################
*/

/**
 * A Zod schema that is used to parse the input of the safe function, or undefined.
 */
export type SafeFnInput = z.ZodTypeAny | undefined;
/**
 * A Zod schema that is used to parse the output of the `handler()` and return the final value on `run()`, or undefined.
 */
export type SafeFnOutput = z.ZodTypeAny | undefined;

/**
 * Infer the input schema of a runnable safe function.
 * @param T the runnable safe function
 * @returns the input schema of the safe function
 */
export type InferInputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["inputSchema"]
  : never;

/**
 * Infer the output schema of a runnable safe function.
 * @param T the runnable safe function
 * @returns the output schema of the safe function
 */
export type InferOutputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["outputSchema"]
  : never;

/**
 * Infer the unparsed input of a runnable safe function.
 * @param T the runnable safe function
 * @returns the unparsed input of the safe function
 */
export type InferUnparsedInput<T> =
  T extends RunnableSafeFn<any, any, any, infer TUnparsed, any, any>
    ? TUnparsed
    : never;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type SchemaInputOrFallback<TSchema extends SafeFnInput, TFallback> = [
  TSchema,
] extends [never]
  ? TFallback
  : TSchema extends ZodTypeAny
    ? z.input<TSchema>
    : TFallback;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type SchemaOutputOrFallback<TSchema extends SafeFnOutput, TFallback> = [
  TSchema,
] extends [never]
  ? TFallback
  : TSchema extends ZodTypeAny
    ? z.output<TSchema>
    : TFallback;

/**
 * Convert a type to a tuple.
 * @param T the type to convert
 * @returns an empty tuple if the type is `never`, otherwise the type itself
 */
type TToTuple<T> = [T] extends [never] ? [] : [T];

/*
################################
||                            ||
||           Error            ||
||                            ||
################################
*/

/**
 * Convenience type for any catch handler result.
 */
export type AnySafeFnCatchHandlerRes = Result<never, any>;

/**
 * Convenience type for any catch handler function.
 */
export type AnySafeFnCatchHandler = (
  error: unknown,
) => AnySafeFnCatchHandlerRes;

/**
 * Default catch handler function. Overridden by `catch()`
 */
export type SafeFnDefaultCatchHandler = (
  error: unknown,
) => SafeFnDefaultCatchHandlerErr;

export type SafeFnDefaultCatchHandlerErr = Err<
  never,
  {
    code: "UNCAUGHT_ERROR";
    cause: "An uncaught error occurred. You can implement a custom error handler by using `catch()`";
  }
>;

/**
 * @param TSchema a Zod schema or undefined
 * @param TAsAction indicates weather the error will be returned in an error.
 * These types need to be differentiated by `TAsAction` as `Error` classes can not be sent over the wire in server actions.
 */
export type SafeFnParseError<
  TSchema extends z.ZodTypeAny,
  TAsAction extends boolean,
> = TAsAction extends true
  ? {
      formattedError: ZodFormattedError<z.input<TSchema>>;
      flattenedError: z.typeToFlattenedError<z.input<TSchema>>;
    }
  : z.ZodError<z.input<TSchema>>;

export type SafeFnInputParseError<
  TInputSchema extends SafeFnInput,
  TAsAction extends boolean,
> = TInputSchema extends z.ZodTypeAny
  ? {
      code: "INPUT_PARSING";
      cause: SafeFnParseError<TInputSchema, TAsAction>;
    }
  : never;

export type SafeFnOutputParseError<
  TOutputSchema extends SafeFnOutput,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? {
      code: "OUTPUT_PARSING";
      cause: SafeFnParseError<TOutputSchema, TAsAction>;
    }
  : never;

/*
################################
||                            ||
||           Handler          ||
||                            ||
################################
*/

/**
 * Convenience type for any handler result.
 */
export type AnySafeFnHandlerRes = MaybePromise<Result<any, any>>;

/**
 * Default handler function. Overridden by `handler()`
 */
export type SafeFnDefaultHandlerFn = () => Result<
  never,
  {
    code: "NO_HANDLER";
  }
>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the type of the arguments available in the passed handler function.
 */
export type SafeFnHandlerArgs<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  TParent,
> = TParent extends AnyRunnableSafeFn
  ? SafeFnHandlerArgsWParent<TInputSchema, TUnparsedInput, TParent>
  : SafeFnHandlerArgsNoParent<TInputSchema, TUnparsedInput>;

type SafeFnHandlerArgsWParent<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn,
> = {
  parsedInput: Prettify<
    UnionIfNotT<
      SchemaOutputOrFallback<TInputSchema, undefined>,
      SchemaOutputOrFallback<InferInputSchema<TParent>, undefined>,
      undefined
    >
  >;
  // Prettify<unknown> results in {}
  unparsedInput: UnionIfNotT<
    TUnparsedInput,
    InferUnparsedInput<TParent>,
    never
  > extends infer Merged
    ? IsUnknown<Merged> extends true
      ? unknown
      : Prettify<Merged>
    : never;

  ctx: TOrFallback<InferSafeFnOkData<TParent>, undefined>;
};

type SafeFnHandlerArgsNoParent<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, undefined>;
  unparsedInput: TUnparsedInput;
  ctx: undefined;
};

/**
 * Type used to constrain the return type of the handler function.
 * @param TOutputSchema a Zod schema or undefined
 * @returns the output type expected for the handler function. If the schema is undefined, this is `any`. Otherwise this is the input (`z.infer<typeof outputSchema`) of the output schema.
 */
export type SafeFnHandlerReturn<TOutputSchema extends SafeFnOutput> =
  MaybePromise<Result<SchemaInputOrFallback<TOutputSchema, any>, any>>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a handler function for a safe function passed to `handler()`. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
export type SafeFnRegularHandlerFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => SafeFnHandlerReturn<TOutputSchema>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a safe handler function for a safe function passed to `safeHandler()`. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
export type SafeFnAsyncGeneratorHandlerFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => AsyncGenerator<
  Err<never, unknown>,
  Result<SchemaInputOrFallback<TOutputSchema, any>, any>
>;

/* 
################################
||                            ||
||            Run             ||
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
 * @returns the type of the return `AsyncResult` value of the safe function after calling run();
 */
export type InferSafeFnReturn<T extends AnyRunnableSafeFn> = ReturnType<
  T["run"]
>;

/**
 * @param T the runnable safe function
 * @returns the `.value` type of the returned `AsyncResult` assuming it's an `AsyncOk`.
 */
export type InferSafeFnOkData<T extends AnyRunnableSafeFn> = InferAsyncOkData<
  InferSafeFnReturn<T>
>;

/**
 * @param T the runnable safe function
 * @returns the `.error` type of the returned `AsyncResult` assuming it's an `AsyncErr`.
 */
export type InferSafeFnErrError<T extends AnyRunnableSafeFn> =
  InferAsyncErrError<InferSafeFnReturn<T>>;

/**
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerRes the return of the handler function
 * @returns the data type of the return value of the safe function after successful execution. If the output schema is undefined, this is inferred from the return type of the handler function. Otherwise, this is the output (`z.output<typeof outputSchema`) of the outputSchema.
 * Note that this is wrapped in a `Result` type.
 */
export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
> = SchemaOutputOrFallback<TOutputSchema, InferOkData<THandlerRes>>;

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
  TAsAction extends boolean = false,
> =
  | InferErrError<THandlerRes>
  | InferErrError<TCatchHandlerRes>
  | SafeFnInputParseError<TInputSchema, TAsAction>
  | SafeFnOutputParseError<TOutputSchema, TAsAction>
  | (TParent extends AnyRunnableSafeFn
      ? TAsAction extends true
        ? // TODO: this is dirty lol
          InferActionErrError<
            Awaited<ReturnType<ReturnType<TParent["createAction"]>>>
          >
        : InferSafeFnErrError<TParent>
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
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
> =
  Awaited<THandlerRes> extends Result<never, any>
    ? ResultAsync<
        never,
        DistributeUnion<
          SafeFnReturnError<
            TParent,
            TInputSchema,
            undefined,
            Awaited<THandlerRes>,
            TCatchHandlerRes,
            TAsAction
          >
        >
      >
    : ResultAsync<
        SafeFnReturnData<TOutputSchema, Awaited<THandlerRes>>,
        DistributeUnion<
          SafeFnReturnError<
            TParent,
            TInputSchema,
            TOutputSchema,
            Awaited<THandlerRes>,
            TCatchHandlerRes,
            TAsAction
          >
        >
      >;

/* 
################################
||                            ||
||           Action           ||
||                            ||
################################
*/

export type AnySafeFnAction = SafeFnAction<any, any, any, any, any, any>;

/**
 * @param T the action created through `createAction()`
 * @returns the return value of the action after execution without throwing. This is a `Promise<ActionResult<T,E>>`.
 */
export type InferSafeFnActionReturn<T extends AnySafeFnAction> = ReturnType<T>;
/**
 * @param T the action created through `createAction()`
 * @returns the input necessary to run the action.
 */
export type InferSafeFnActionArgs<T extends AnySafeFnAction> = Parameters<T>[0];

/**
 * @param T the action created through `createAction()`
 * @returns the `.value` type of the returned `ActionResult` assuming it's ok, wrapped in a `Promise`
 */
export type InferSafeFnActionOkData<T extends AnySafeFnAction> = Promise<
  InferActionOkData<Awaited<InferSafeFnActionReturn<T>>>
>;

/**
 * @param T the action created through `createAction()`
 * @returns the `.error` type of the returned `ActionResult` assuming it's not ok, wrapped in a `Promise`
 */
export type InferSafeFnActionError<T extends AnySafeFnAction> = Promise<
  InferActionErrError<Awaited<InferSafeFnActionReturn<T>>>
>;

/**
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the input necessary to run the action created through `createAction()`.
 */
export type SafeFnActionArgs<TUnparsedInput> = SafeFnRunArgs<TUnparsedInput>;

export type SafeFnActionReturn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = ResultAsyncToPromiseActionResult<
  SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TCatchHandlerRes,
    true
  >
>;
export type SafeFnAction<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  ...args: SafeFnActionArgs<TUnparsedInput>
) => SafeFnActionReturn<
  TParent,
  TInputSchema,
  TOutputSchema,
  THandlerRes,
  TCatchHandlerRes
>;
