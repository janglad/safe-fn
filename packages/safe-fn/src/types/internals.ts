import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./error";
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
  in out THandlerReturn extends TSafeFnHandlerReturn<TOutputSchema>,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: TPrettify<TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
  ) => TMaybePromise<THandlerReturn>;
  uncaughtErrorHandler: (error: unknown) => TThrownHandlerRes;
}

export type TInferSafeFnParent<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["parent"]
  : never;
