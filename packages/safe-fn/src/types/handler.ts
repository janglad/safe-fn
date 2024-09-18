import { type Result } from "neverthrow";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { InferSafeFnOkData } from "./run";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./schema";
import type { FirstTupleElOrUndefined, TOrFallback, TPrettify } from "./util";

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

// export type TCtxInput<TParent extends AnyRunnableSafeFn | undefined> =
//   TIsAny<TParent> extends true
//     ? any[]
//     : TParent extends AnyRunnableSafeFn
//       ? [
//           ...TCtxInput<TInferSafeFnParent<TParent>>,
//           TSchemaOutputOrFallback<InferInputSchema<TParent>, undefined>,
//         ]
//       : [];

/**
 * @param TInputSchema a Zod schema or undefined
 * @param TUnparsedInput the unparsed input type. This is inferred from TInputSchema. When none is provided, this is `never` by default or overridden by using `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the type of the arguments available in the passed handler function.
 */
export interface TSafeFnHandlerArgs<
  in out TCtxInput extends unknown[],
  in out TInputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TParent extends AnyRunnableSafeFn | undefined,
> {
  input: TPrettify<TSchemaOutputOrFallback<TInputSchema, undefined>>;
  /**
   * The raw input passed to the handler function.
   *
   *  **WARNING**: this can have excess values that are not in the type when you use this SafeFn as a parent for another SafeFn.
   */
  unsafeRawInput: TPrettify<FirstTupleElOrUndefined<TUnparsedInput>>;
  ctx: TOrFallback<InferSafeFnOkData<TParent, false>, undefined>;
  ctxInput: TCtxInput;
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
