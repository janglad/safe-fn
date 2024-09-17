import { type Err, type Result } from "neverthrow";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { TInferSafeFnParent } from "./internals";
import type { InferSafeFnOkData } from "./run";
import type {
  InferInputSchema,
  InferUnparsedInput,
  TSafeFnInput,
  TSafeFnOutput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./schema";
import type {
  TIsUnknown,
  TMaybePromise,
  TOrFallback,
  TPrettify,
  TUnionIfNotT,
} from "./util";

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

/**
 * Convenience type for any handler result.
 */
export type TAnySafeFnHandlerRes = Result<any, any>;

/**
 * Default handler function. Overridden by `handler()`
 */
export type TSafeFnDefaultHandlerFn = () => Result<
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
export interface TSafeFnHandlerArgs<
  in out TInputSchema extends TSafeFnInput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> {
  input: TPrettify<TSchemaOutputOrFallback<TInputSchema, undefined>>;
  // Prettify<unknown> results in {}
  /**
   * The raw input passed to the handler function.
   *
   *  **WARNING**: this can have excess values that are not in the type when you use this SafeFn as a parent for another SafeFn.
   */
  unsafeRawInput: TUnionIfNotT<
    TUnparsedInput,
    InferUnparsedInput<TParent>,
    never
  > extends infer Merged
    ? TIsUnknown<Merged> extends true
      ? unknown
      : TPrettify<Merged>
    : never;

  ctx: TOrFallback<InferSafeFnOkData<TParent, false>, undefined>;
  ctxInput: TCtxInput<TParent>;
}

/**
 * Type used to constrain the return type of the handler function.
 * @param TOutputSchema a Zod schema or undefined
 * @returns the output type expected for the handler function. If the schema is undefined, this is `any`. Otherwise this is the input (`z.infer<typeof outputSchema`) of the output schema.
 */
export type TSafeFnHandlerReturn<TOutputSchema extends TSafeFnOutput> = Result<
  TSchemaInputOrFallback<TOutputSchema, any>,
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
type TSafeFnRegularHandlerFn<
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: TPrettify<TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => TMaybePromise<TSafeFnHandlerReturn<TOutputSchema>>;

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TOutputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 *
 * @returns the type of a safe handler function for a safe function passed to `safeHandler()`. See `SafeFnHandlerArgs` and `SafeFnHandlerReturn` for more information.
 */
type TSafeFnAsyncGeneratorHandlerFn<
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> = (
  args: TPrettify<TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
) => AsyncGenerator<
  Err<never, unknown>,
  Result<TSchemaInputOrFallback<TOutputSchema, any>, any>
>;

interface TCtx<in out TParent extends AnyRunnableSafeFn | undefined> {
  value: TOrFallback<InferSafeFnOkData<TParent, false>, undefined>;
  input: TCtxInput<TParent>;
}

export type TCtxInput<TParent extends AnyRunnableSafeFn | undefined> =
  TIsAny<TParent> extends true
    ? any
    : TParent extends AnyRunnableSafeFn
      ? [
          ...TCtxInput<TInferSafeFnParent<TParent>>,

          TSchemaOutputOrFallback<InferInputSchema<TParent>, undefined>,
        ]
      : [];

type TIsAny<T> = 0 extends 1 & T ? true : false;
