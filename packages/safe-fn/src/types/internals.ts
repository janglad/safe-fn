import type { Result } from "neverthrow";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { SafeFnHandlerArgs, SafeFnHandlerReturn } from "./handler";
import type { SafeFnInput } from "./schema";
import type { MaybePromise, Prettify } from "./util";

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
