import type { AnyRunnableSafeFn, TRunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";
import type { TSafeFnHandlerArgs, TSafeFnHandlerReturn } from "./handler";
import type { TSafeFnInput, TSafeFnUnparsedInput } from "./schema";
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
  in out TCtx,
  in out TCtxInput extends unknown[],
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerReturn extends TSafeFnHandlerReturn<TOutputSchema>,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: TPrettify<
      TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
    >,
  ) => TMaybePromise<THandlerReturn>;
  uncaughtErrorHandler: (error: unknown) => TThrownHandlerRes;
}

export type TInferSafeFnParent<T> =
  T extends TRunnableSafeFn<
    infer TParent,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TParent
    : never;
