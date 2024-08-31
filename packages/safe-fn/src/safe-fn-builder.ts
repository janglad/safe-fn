import { z } from "zod";

import { err } from "./result";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnActionFn,
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInput,
} from "./types";

export type TInternals<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  TActionFn extends SafeFnActionFn<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TParent
  >,
  TThrownHandler extends AnySafeFnThrownHandler,
> = {
  parent: TParent;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  actionFn: TActionFn;
  uncaughtErrorHandler: TThrownHandler;
};

export class SafeFnBuilder<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  TActionFn extends SafeFnActionFn<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TParent
  >,
  TThrownHandler extends AnySafeFnThrownHandler,
> {
  readonly _internals: TInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TThrownHandler
  >;

  protected constructor(
    internals: TInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TActionFn,
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
    SafeFnDefaultActionFn,
    SafeFnDefaultThrowHandler
  > {
    return new SafeFnBuilder({
      parent,
      inputSchema: undefined,
      outputSchema: undefined,
      actionFn: () =>
        err({
          code: "NO_ACTION",
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
      SafeFnActionFn<
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
      SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
      TThrownHandler
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      TNewUnparsedInput,
      SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
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
      SafeFnActionFn<TInputSchema, TNewOutputSchema, TUnparsedInput, TParent>,
      TThrownHandler
    >,
    "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema,
    } as any);
  }

  action<
    TNewActionFn extends SafeFnActionFn<
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TParent
    >,
  >(
    actionFn: TNewActionFn,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewActionFn,
    TThrownHandler
  > {
    return new RunnableSafeFn({
      ...this._internals,
      actionFn,
    } as any) as any;
  }
}
