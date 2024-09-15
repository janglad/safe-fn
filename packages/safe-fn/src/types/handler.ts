import type { Err, Result } from "neverthrow";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { InferSafeFnOkData } from "./run";
import type {
  InferInputSchema,
  InferUnparsedInput,
  SafeFnInput,
  SafeFnOutput,
  SchemaInputOrFallback,
  SchemaOutputOrFallback,
} from "./schema";
import type {
  IsUnknown,
  MaybePromise,
  Prettify,
  TOrFallback,
  UnionIfNotT,
} from "./util";

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
