import type { Result } from "neverthrow";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { TSafeFnHandlerArgs, TSafeFnHandlerReturn } from "./handler";
import type { TSafeFnInput } from "./schema";
import type { TMaybePromise, TPrettify } from "./util";
/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/
export interface TSafeFnInternals<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput,
> {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: TPrettify<TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
  ) => TMaybePromise<TSafeFnHandlerReturn<TOutputSchema>>;
  uncaughtErrorHandler: (error: unknown) => Result<never, unknown>;
}
