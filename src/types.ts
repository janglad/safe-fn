import type { ZodTypeAny, z } from "zod";
import type {
  AnyResult,
  Err,
  InferErrError,
  InferOkData,
  Result,
} from "./result";
import type { AnySafeFn, SafeFn } from "./safe-fn";

/*
################################
||                            ||
||            Util            ||
||                            ||
################################
*/

type TODO = any;
type TOrFallback<T, TFallback, TFilter = never> = [T] extends [TFilter]
  ? TFallback
  : T;
export type MaybePromise<T> = T | Promise<T>;
export type InferInputSchema<T> =
  T extends SafeFn<any, infer T, any, any, any, any> ? T : never;
export type InferOutputSchema<T> =
  T extends SafeFn<any, any, infer T, any, any, any> ? T : never;
export type InferUnparsedInput<T> =
  T extends SafeFn<any, any, any, infer T, any, any> ? T : never;
export type InferRunArgs<T> = T extends AnySafeFn
  ? Parameters<T["run"]>[0]
  : never;

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
 * A Zod schema that is used to parse the output of the `action()` and return the final value on `run()`, or undefined.
 */
export type SafeFnOutput = z.ZodTypeAny | undefined;

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

export type AnySafeFnThrownHandler = (
  error: unknown,
) => MaybePromise<AnyResult>;

export type SafeFnDefaultThrowHandler = (error: unknown) => Err<{
  code: "UNCAUGHT_ERROR";
  error: unknown;
}>;

export type SafeFnDefaultActionFn = () => Err<{
  code: "NO_ACTION";
}>;

/*
################################
||                            ||
||           Action           ||
||                            ||
################################
*/

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 */
type SafeFnActionArgs<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  TParent extends AnySafeFn | undefined,
> = TParent extends AnySafeFn
  ? SafeFnActionArgsWParent<TInputSchema, TUnparsedInput, TParent>
  : SafeFnaActionArgsNoParent<TInputSchema, TUnparsedInput>;

type SafeFnActionArgsWParent<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  TParent extends AnySafeFn,
> = {
  // TODO: look at if empty object is good fit here
  // Used to be never, chosen as to not collapse types that join
  parsedInput: SchemaOutputOrFallback<TInputSchema, {}> &
    SchemaOutputOrFallback<InferInputSchema<TParent>, {}>;
  unparsedInput: SchemaInputOrFallback<TInputSchema, TUnparsedInput> &
    SchemaInputOrFallback<
      InferInputSchema<TParent>,
      InferUnparsedInput<TParent>
    >;
  // TODO: look at if empty object is good fit here
  ctx: TOrFallback<InferOkData<Awaited<ReturnType<TParent["run"]>>>, {}>;
};

type SafeFnaActionArgsNoParent<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, {}>;
  unparsedInput: SchemaInputOrFallback<TInputSchema, TUnparsedInput>;
  ctx: undefined;
};

/**
 * @param TOutputSchema a Zod schema or undefined
 * @returns the output type of the action function. If the schema is undefined, this is `any`. Otherwise this needs to be the input (`z.infer<typeof outputSchema`) of the output schema.
 */
type SafeFnActionReturn<TOutputSchema extends SafeFnOutput> = Result<
  SchemaOutputOrFallback<TOutputSchema, any>,
  any
>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of an action function for a safe function. See `SafeFnActionArgs` and `SafeFnActionReturn` for more information.
 */
export type SafeFnActionFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  TParent extends AnySafeFn | undefined,
> = (
  args: SafeFnActionArgs<TInputSchema, TUnparsedInput, TParent>,
) => MaybePromise<SafeFnActionReturn<TOutputSchema>>;

export type AnySafeFnActionFn = SafeFnActionFn<any, any, any, any>;

/* 
################################
||                            ||
||            Run             ||
||                            ||
################################
*/
/**
 * @param TOutputSchema a Zod schema or undefined
 * @param TActionFn the action function of the safe function
 * @returns the data type of the return value of the safe function after successful execution. If the output schema is undefined, this is inferred from the return type of the action function. Otherwise, this is the output (`z.output<typeof outputSchema`) of the outputSchema.
 * Note that this is wrapped in a `Result` type.
 */
export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
> = SchemaOutputOrFallback<
  TOutputSchema,
  InferOkData<Awaited<ReturnType<TActionFn>>>
>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TActionFn the action function of the safe function
 * @param TThrownHandler the thrown handler of the safe function
 * @returns the error type of the return value of the safe function after unsuccessful execution. This is a union of all possible error types that can be thrown by the safe function consisting off:
 * - A union of all `Err()` returns of the action function
 * - A union of all `Err()` returns of the uncaught error handler
 * - A `SafeFnInputParseError` if the input schema is defined and the input could not be parsed
 * - A `SafeFnOutputParseError` if the output schema is defined and the output could not be parsed
 * Note that this is wrapped in a `Result` type.
 */

export type SafeFnReturnError<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
  TThrownHandler extends AnySafeFnThrownHandler,
> =
  | InferErrError<Awaited<ReturnType<TActionFn>>>
  | InferErrError<Awaited<ReturnType<TThrownHandler>>>
  | SafeFnInputParseError<TInputSchema>
  | SafeFnOutputParseError<TOutputSchema>;

export type SafeFnInputParseError<TInputSchema extends SafeFnInput> =
  TInputSchema extends z.ZodTypeAny
    ? {
        code: "INPUT_PARSING";
        cause: z.ZodError<TInputSchema>;
      }
    : never;

export type SafeFnOutputParseError<TOutputSchema extends SafeFnOutput> =
  TOutputSchema extends z.ZodTypeAny
    ? {
        code: "OUTPUT_PARSING";
        cause: z.ZodError<TOutputSchema>;
      }
    : never;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TActionFn the action function of the safe function
 * @returns the input necessary to `run()` the safe function. If an input schema is provided, this is the parsed input (`z.output<typeof inputSchema>`).
 * Otherwise, this is the unparsed input of the action function (can be typed through `unparsedInput<>()`).
 */
export type SafeFnRunArgs<
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  TParent extends AnySafeFn | undefined,
> = TParent extends AnySafeFn
  ? SchemaInputOrFallback<TInputSchema, TUnparsedInput> & InferRunArgs<TParent>
  : SchemaInputOrFallback<TInputSchema, TUnparsedInput>;
/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TActionFn the action function of the safe function
 * @param TThrownHandler the thrown handler of the safe function
 * @returns the return value of the safe function after execution. This is a `Result` type that can either be an `Ok()` or an `Err()`.
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
    return Err({
      code: "CAUGHT_ERROR",
      error,
    });
  })
  .action(async ({ parsedInput }) => {
    const isProfane = await isProfaneName(parsedInput.firstName);
    if (isProfane) {
      return Err({
        code: "PROFANE_NAME",
        message: "Name is profane",
      });
    }

    const fullName = `${parsedInput.firstName} ${parsedInput.lastName}`;
    return Ok({ fullName });
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

  or return an error (with success: false). This error is typed as a union of `SafeFnInputParseError`, `SafeFnOutputParseError`, and the error types returned by the action function and the thrown handler.
  In this case this results in `error.code` being one of `"CAUGHT_ERROR"`, `"PROFANE_NAME"`, `"INPUT_PARSING"`, `"OUTPUT_PARSING"`.
 */
export type SafeFnReturn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TActionFn extends SafeFnActionFn<any, any, any, any>,
  TThrownHandler extends AnySafeFnThrownHandler,
> = Result<
  SafeFnReturnData<TOutputSchema, TActionFn>,
  SafeFnReturnError<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
>;
