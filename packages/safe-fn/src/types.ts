import type { Err, Ok, Result, ResultAsync } from "neverthrow";
import type { z, ZodFormattedError, ZodTypeAny } from "zod";
import type {
  InferActionErrError,
  InferActionOkData,
  InferAsyncErrError,
  InferAsyncOkData,
  InferErrError,
  ResultAsyncToActionResult,
} from "./result";
import type { RunnableSafeFn } from "./runnable-safe-fn";

/*
################################
||                            ||
||         Internals          ||
||                            ||
################################
*/
export interface SafeFnInternals<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
> {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
  ) => MaybePromise<SafeFnHandlerReturn<TOutputSchema>>;
  uncaughtErrorHandler: (error: unknown) => Result<never, unknown>;
}

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
export type MaybePromise<T> = T | Promise<T>;

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
export interface SafeFnHandlerArgs<
  in out TInputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> {
  input: Prettify<
    UnionIfNotT<
      SchemaOutputOrFallback<TInputSchema, undefined>,
      SchemaOutputOrFallback<InferInputSchema<TParent>, undefined>,
      undefined
    >
  >;
  // Prettify<unknown> results in {}
  /**
   * The raw input passed to the handler function.
   *
   *  **WARNING**: this can have excess values that are not in the type when you use this SafeFn as a parent for another SafeFn.
   */
  unsafeRawInput: UnionIfNotT<
    TUnparsedInput,
    InferUnparsedInput<TParent>,
    never
  > extends infer Merged
    ? IsUnknown<Merged> extends true
      ? unknown
      : Prettify<Merged>
    : never;

  ctx: TOrFallback<InferSafeFnOkData<TParent, false>, undefined>;
}

/**
 * Type used to constrain the return type of the handler function.
 * @param TOutputSchema a Zod schema or undefined
 * @returns the output type expected for the handler function. If the schema is undefined, this is `any`. Otherwise this is the input (`z.infer<typeof outputSchema`) of the output schema.
 */
export type SafeFnHandlerReturn<TOutputSchema extends SafeFnOutput> = Result<
  SchemaInputOrFallback<TOutputSchema, any>,
  any
>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a handler function for a safe function passed to `handler()`. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
export type SafeFnRegularHandlerFn<
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => MaybePromise<SafeFnHandlerReturn<TOutputSchema>>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a safe handler function for a safe function passed to `safeHandler()`. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
export type SafeFnAsyncGeneratorHandlerFn<
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
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
 * @returns the return value of the action after execution without throwing. This is a `ActionResult<T,E>`.
 */
export type InferSafeFnActionReturn<T extends AnySafeFnAction> = Awaited<
  ReturnType<T>
>;
/**
 * @param T the action created through `createAction()`
 * @returns the input necessary to run the action.
 */
export type InferSafeFnActionArgs<T extends AnySafeFnAction> = Parameters<T>[0];

/**
 * @param T the action created through `createAction()`
 * @returns the `.value` type of the returned `ActionResult` assuming it's ok
 */
export type InferSafeFnActionOkData<T extends AnySafeFnAction> =
  InferActionOkData<InferSafeFnActionReturn<T>>;

/**
 * @param T the action created through `createAction()`
 * @returns the `.error` type of the returned `ActionResult` assuming it's not ok
 */
export type InferSafeFnActionError<T extends AnySafeFnAction> =
  InferActionErrError<InferSafeFnActionReturn<T>>;

/**
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the input necessary to run the action created through `createAction()`.
 */
export type SafeFnActionArgs<TUnparsedInput> = SafeFnRunArgs<TUnparsedInput>;

export type SafeFnActionReturn<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = Promise<
  ResultAsyncToActionResult<
    SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      true
    >
  >
>;
export type SafeFnAction<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  ...args: SafeFnActionArgs<TUnparsedInput>
) => SafeFnActionReturn<
  TParent,
  TInputSchema,
  TOutputSchema,
  THandlerRes,
  TCatchHandlerRes
>;

/* 
################################
||                            ||
||         Callbacks          ||
||                            ||
################################
*/

// TODO: issue with approach of passing TParent is really starting to show here. Redo this.

export type InferSafeFnCallbacks<T> =
  T extends RunnableSafeFn<
    infer TParent,
    infer TInputSchema,
    infer TOutputSchema,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TCatchHandlerRes
  >
    ? SafeFnCallBacks<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    : never;

export interface SafeFnCallBacks<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> {
  onStart: SafeFnOnStart<TUnparsedInput> | undefined;
  onSuccess:
    | SafeFnOnSuccess<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes
      >
    | undefined;
  onError:
    | SafeFnOnError<
        TParent,
        TInputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
  onComplete:
    | SafeFnOnComplete<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
}
export type SafeFnOnStart<in out TUnparsedInput> = (args: {
  unsafeRawInput: Prettify<TUnparsedInput>;
}) => Promise<void>;

export interface SafeFnOnSuccessArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
> extends Prettify<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> & {
      value: SafeFnReturnData<TOutputSchema, THandlerRes>;
    }
  > {}

export type SafeFnOnSuccess<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
> = (
  args: SafeFnOnSuccessArgs<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes
  >,
) => Promise<void>;

// Temporary, will be fixed when I fix types in general
type ToOptionalSafeFnArgs<T> = {
  [K in keyof T]: K extends "unsafeRawInput" ? T[K] : T[K] | undefined;
};

export type SafeFnOnErrorArgs<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = Prettify<
  ToOptionalSafeFnArgs<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > &
    (
      | {
          asAction: true;
          error: SafeFnReturnError<
            TParent,
            TInputSchema,
            undefined,
            THandlerRes,
            TCatchHandlerRes,
            true
          >;
        }
      | {
          asAction: false;
          error: SafeFnReturnError<
            TParent,
            TInputSchema,
            undefined,
            THandlerRes,
            TCatchHandlerRes,
            false
          >;
        }
    )
>;

export type SafeFnOnError<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  args: SafeFnOnErrorArgs<
    TParent,
    TInputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes
  >,
) => Promise<void>;

export type SafeFnOnCompleteArgs<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> = Prettify<
  | ({
      asAction: true;
      result: Err<
        never,
        SafeFnReturnError<
          TParent,
          TInputSchema,
          undefined,
          THandlerRes,
          TThrownHandlerRes,
          true
        >
      >;
    } & ToOptionalSafeFnArgs<
      SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
    >)
  | ({
      asAction: false;
      result: Err<
        never,
        SafeFnReturnError<
          TParent,
          TInputSchema,
          undefined,
          THandlerRes,
          TThrownHandlerRes,
          false
        >
      >;
    } & ToOptionalSafeFnArgs<
      SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
    >)
  | ({
      asAction: boolean;
      result: Ok<SafeFnReturnData<TOutputSchema, THandlerRes>, never>;
    } & SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>)
>;

export type SafeFnOnComplete<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  args: SafeFnOnCompleteArgs<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >,
) => Promise<void>;
