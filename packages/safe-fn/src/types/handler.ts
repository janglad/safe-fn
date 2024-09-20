import type { Result } from "neverthrow";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./schema";
import type { FirstTupleElOrUndefined, TPrettify } from "./util";

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

export interface TSafeFnHandlerArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> {
  input: TPrettify<TSchemaOutputOrFallback<TInputSchema, undefined>>;
  /**
   * The raw input passed to the handler function.
   *
   *  **WARNING**: this can have excess values that are not in the type when you use this SafeFn as a parent for another SafeFn.
   */
  unsafeRawInput: TPrettify<FirstTupleElOrUndefined<TUnparsedInput>>;
  ctx: TCtx;
  ctxInput: TCtxInput;
}

export type TSafeFnHandlerReturn<TOutputSchema extends TSafeFnOutput> = Result<
  TSchemaInputOrFallback<TOutputSchema, any>,
  any
>;

export type AnyCtxInput = any[];
