import type { TAnyRunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";
import type {
  AnyCtxInput,
  TSafeFnHandlerArgs,
  TSafeFnHandlerReturn,
} from "./handler";
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
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> {
  parent: TAnyRunnableSafeFn | undefined;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (
    input: TPrettify<
      TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
    >,
  ) => TMaybePromise<TSafeFnHandlerReturn<TOutputSchema>>;
  uncaughtErrorHandler: (error: unknown) => TThrownHandlerRes;
}
