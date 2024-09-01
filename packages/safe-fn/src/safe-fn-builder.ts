import { z } from "zod";

import { err } from "./result";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnDefaultHandlerFn,
  SafeFnDefaultThrowHandler,
  SafeFnHandlerFn,
  SafeFnInput,
  SafeFnInternals,
} from "./types";

export class SafeFnBuilder<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerFn extends SafeFnHandlerFn<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TParent
  >,
  TThrownHandler extends AnySafeFnThrownHandler,
> {
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerFn,
    TThrownHandler
  >;

  protected constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerFn,
      TThrownHandler
    >,
  ) {
    this._internals = internals;
  }

  /*
################################
||                            ||
||          Builder           ||
||                            ||
################################
*/
  static new<TNewParent extends AnyRunnableSafeFn | undefined = undefined>(
    parent?: TNewParent,
  ): SafeFnBuilder<
    TNewParent,
    undefined,
    undefined,
    unknown,
    SafeFnDefaultHandlerFn,
    SafeFnDefaultThrowHandler
  > {
    return new SafeFnBuilder({
      parent,
      inputSchema: undefined,
      outputSchema: undefined,
      handler: () =>
        err({
          code: "NO_HANDLER",
        } as const),
      uncaughtErrorHandler: (error: unknown) =>
        err({
          code: "UNCAUGHT_ERROR",
          cause: error,
        } as const),
    }) as any;
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TNewInputSchema,
      TOutputSchema,
      TUnparsedInput,
      SafeFnHandlerFn<
        TNewInputSchema,
        TOutputSchema,
        z.input<TNewInputSchema>,
        TParent
      >,
      TThrownHandler
    >,
    "input" | "unparsedInput"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      inputSchema: schema,
    } as any);
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      TNewUnparsedInput,
      SafeFnHandlerFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
      TThrownHandler
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      TNewUnparsedInput,
      SafeFnHandlerFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
      TThrownHandler
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TNewOutputSchema,
      TUnparsedInput,
      SafeFnHandlerFn<TInputSchema, TNewOutputSchema, TUnparsedInput, TParent>,
      TThrownHandler
    >,
    "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema,
    } as any);
  }

  handler<
    TNewHandlerFn extends SafeFnHandlerFn<
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TParent
    >,
  >(
    handlerFn: TNewHandlerFn,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewHandlerFn,
    TThrownHandler
  > {
    return new RunnableSafeFn({
      ...this._internals,
      handler: handlerFn,
    } as any) as any;
  }
}
