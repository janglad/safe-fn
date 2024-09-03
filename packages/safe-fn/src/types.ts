import type { z, ZodFormattedError, ZodTypeAny } from "zod";
import type {
  Err,
  InferErrError,
  InferOkData,
  Result,
  ResultAsync,
  ResultAsyncToPromiseActionResult,
} from "./result";
import type { RunnableSafeFn } from "./runnable-safe-fn";

//TODO: organize and update JSDoc

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
    input: SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>,
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

export type AnyRunnableSafeFn = RunnableSafeFn<any, any, any, any, any, any>;

/*
################################
||                            ||
||            Util            ||
||                            ||
################################
*/
type TODO = any;
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DistributeUnion<T> = T extends any ? T : never;

type TOrFallback<T, TFallback, TFilter = never> = [T] extends [TFilter]
  ? TFallback
  : T;
type MaybePromise<T> = T | Promise<T>;

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

export type InferInputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["inputSchema"]
  : never;
export type InferOutputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["outputSchema"]
  : never;
export type InferUnparsedInput<T> =
  T extends RunnableSafeFn<any, any, any, infer TUnparsed, any, any>
    ? TUnparsed
    : never;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type SchemaInputOrFallback<
  TSchema extends SafeFnInput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.input<TSchema> : TFallback;
/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type SchemaOutputOrFallback<
  TSchema extends SafeFnOutput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.output<TSchema> : TFallback;

/*
################################
||                            ||
||           Error            ||
||                            ||
################################
*/

/**
 * Convenience type for any thrown handler result.
 */
export type AnySafeFnThrownHandlerRes = Result<never, any>;

/**
 * @param TSchema a Zod schema or undefined
 * @param TAsAction indicates weather the error will be returned in an error.
 * These types need to be differentiated as `Error` classes can not be sent over the wire in server actions.
 */
export type ParseError<
  TSchema extends z.ZodTypeAny,
  TAsAction extends boolean,
> = TAsAction extends true
  ? {
      formattedError: ZodFormattedError<z.input<TSchema>>;
      flattenedError: z.typeToFlattenedError<z.input<TSchema>>;
    }
  : z.ZodError<z.input<TSchema>>;

/**
 * Convenience type for any thrown handler function.
 */
export type AnySafeFnThrownHandler = (
  error: unknown,
) => AnySafeFnThrownHandlerRes;

/**
 * Default throw handler function. Overridden by `error()`
 */
export type SafeFnDefaultThrowHandler = (
  error: unknown,
) => SafeFnDefaultThrownHandlerErr;

export type SafeFnDefaultThrownHandlerErr = Err<
  never,
  {
    code: "UNCAUGHT_ERROR";
    cause: unknown;
  }
>;

export type SafeFnInputParseError<
  TInputSchema extends SafeFnInput,
  TAsAction extends boolean,
> = TInputSchema extends z.ZodTypeAny
  ? {
      code: "INPUT_PARSING";
      cause: ParseError<TInputSchema, TAsAction>;
    }
  : never;

export type SafeFnOutputParseError<
  TOutputSchema extends SafeFnOutput,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? {
      code: "OUTPUT_PARSING";
      cause: ParseError<TOutputSchema, TAsAction>;
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
  // TODO: look at if empty object is good fit here
  // Used to be never, chosen as to not collapse types that join
  parsedInput: Prettify<
    SchemaOutputOrFallback<TInputSchema, {}> &
      SchemaOutputOrFallback<InferInputSchema<TParent>, {}>
  >;
  unparsedInput: Prettify<TUnparsedInput & InferUnparsedInput<TParent>>;
  // TODO: look at if empty object is good fit here
  ctx: TOrFallback<InferOkData<Awaited<ReturnType<TParent["run"]>>>, {}>;
};

type SafeFnHandlerArgsNoParent<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, {}>;
  unparsedInput: TUnparsedInput;
  ctx: undefined;
};

/**
 * Type used to constrain the return type of the handler function.
 * @param TOutputSchema a Zod schema or undefined
 * @returns the output type of the handler function. If the schema is undefined, this is `any`. Otherwise this needs to be the input (`z.infer<typeof outputSchema`) of the output schema.
 */
export type SafeFnHandlerReturn<TOutputSchema extends SafeFnOutput> =
  MaybePromise<Result<SchemaInputOrFallback<TOutputSchema, any>, any>>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a handler function for a safe function. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
export type SafeFnRegularHandlerFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => SafeFnHandlerReturn<TOutputSchema>;

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

export type InferRunArgs<T extends AnyRunnableSafeFn> = Parameters<T["run"]>[0];
export type InferReturn<T extends AnyRunnableSafeFn> = Prettify<
  Awaited<ReturnType<T["run"]>>
>;
export type InferReturnData<T extends AnyRunnableSafeFn> = InferOkData<
  InferReturn<T>
>;
export type InferReturnError<T extends AnyRunnableSafeFn> = InferErrError<
  InferReturn<T>
>;

/**
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerFn the handler function of the safe function
 * @returns the data type of the return value of the safe function after successful execution. If the output schema is undefined, this is inferred from the return type of the handler function. Otherwise, this is the output (`z.output<typeof outputSchema`) of the outputSchema.
 * Note that this is wrapped in a `Result` type.
 */
export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
> = SchemaOutputOrFallback<TOutputSchema, InferOkData<THandlerRes>>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerFn the handler function of the safe function
 * @param TThrownHandler the thrown handler of the safe function
 * @returns the error type of the return value of the safe function after unsuccessful execution. This is a union of all possible error types that can be thrown by the safe function consisting off:
 * - A union of all `Err` returns of the handler function
 * - A union of all `Err` returns of the uncaught error handler
 * - A `SafeFnInputParseError` if the input schema is defined and the input could not be parsed
 * - A `SafeFnOutputParseError` if the output schema is defined and the output could not be parsed
 * Note that this is wrapped in a `Result` type.
 */
export type SafeFnReturnError<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnThrownHandlerRes,
  TAsAction extends boolean = false,
> =
  | InferErrError<THandlerRes>
  | InferErrError<TThrownHandlerRes>
  | SafeFnInputParseError<TInputSchema, TAsAction>
  | SafeFnOutputParseError<TOutputSchema, TAsAction>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param THandlerFn the handler function of the safe function
 * @returns the input necessary to `run()` the safe function. If an input schema is provided, this is the parsed input (`z.output<typeof inputSchema>`).
 * Otherwise, this is the unparsed input of the handler function (can be typed through `unparsedInput<>()`).
 */
export type SafeFnRunArgs<
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn | undefined,
> = TParent extends AnyRunnableSafeFn
  ? Prettify<
      TUnparsedInput & InferRunArgs<TParent>
      // SchemaInputOrFallback<TParentInputSchema, TParentUnparsedInput>
    >
  : TUnparsedInput;
/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param THandlerFn the handler function of the safe function
 * @param TThrownHandler the thrown handler of the safe function
 * @returns the return value of the safe function after execution. This is a `Result` type that can either be an `Ok` or an `Err`.
 * 
 * @example
 * ```ts
  const safeFn = SafeFn.new()
  .input(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  )
  .output(
    z.object({
      fullName: z.string(),
    }),
  )
  .error((error) => {
    return err({
      code: "CAUGHT_ERROR",
      error,
    });
  })
  .handler(async ({ parsedInput }) => {
    const isProfane = await isProfaneName(parsedInput.firstName);
    if (isProfane) {
      return err({
        code: "PROFANE_NAME",
        message: "Name is profane",
      });
    }

    const fullName = `${parsedInput.firstName} ${parsedInput.lastName}`;
    return ok({ fullName });
  });
 * ```

  can either return 

  ```ts
  {
    success: true,
    data: {
      fullName: "John Doe"
    }
  }
  ```

  or return an error (with success: false). This error is typed as a union of `SafeFnInputParseError`, `SafeFnOutputParseError`, and the error types returned by the handler function and the thrown handler.
  In this case this results in `error.code` being one of `"CAUGHT_ERROR"`, `"PROFANE_NAME"`, `"INPUT_PARSING"`, `"OUTPUT_PARSING"`.
 */
export type SafeFnReturn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnThrownHandlerRes,
  TAsAction extends boolean = false,
> = ResultAsync<
  SafeFnReturnData<TOutputSchema, Awaited<THandlerRes>>,
  DistributeUnion<
    SafeFnReturnError<
      TInputSchema,
      TOutputSchema,
      Awaited<THandlerRes>,
      TThrownHandlerRes,
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

export type InferSafeFnActionReturn<T extends AnySafeFnAction> = Awaited<
  ReturnType<T>
>;
export type InferSafeFnActionArgs<T extends AnySafeFnAction> = Parameters<T>[0];
export type InferSafeFnActionOkData<T extends AnySafeFnAction> = InferOkData<
  InferSafeFnActionReturn<T>
>;
export type InferSafeFnActionError<T extends AnySafeFnAction> = InferErrError<
  InferSafeFnActionReturn<T>
>;

// Note: these are identical to run right now but will change in the future
export type SafeFnActionArgs<
  TUnparsedInput,
  TParent extends AnyRunnableSafeFn | undefined,
> = SafeFnRunArgs<TUnparsedInput, TParent>;

export type SafeFnActionReturn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnThrownHandlerRes,
> = ResultAsyncToPromiseActionResult<
  SafeFnReturn<TInputSchema, TOutputSchema, THandlerRes, TThrownHandlerRes>
>;
export type SafeFnAction<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnThrownHandlerRes,
> = (
  args: SafeFnActionArgs<TUnparsedInput, TParent>,
) => SafeFnActionReturn<
  TInputSchema,
  TOutputSchema,
  THandlerRes,
  TThrownHandlerRes
>;
