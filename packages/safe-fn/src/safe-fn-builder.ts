import { z } from "zod";
import { SafeFnInternals } from "./internals";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnActionFn,
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInput,
} from "./types";

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
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TThrownHandler
  >;

  protected constructor(
    internals: SafeFnInternals<
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
    const internals = SafeFnInternals.new(parent);
    return new SafeFnBuilder(internals);
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
    return new SafeFnBuilder(this._internals.input(schema));
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
    return new SafeFnBuilder(this._internals.unparsedInput());
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
    return new SafeFnBuilder(this._internals.output(schema));
  }

  error<TNewThrownHandler extends AnySafeFnThrownHandler>(
    handler: TNewThrownHandler,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TActionFn,
      TNewThrownHandler
    >,
    "error"
  > {
    return new SafeFnBuilder(this._internals.error(handler));
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
    return new RunnableSafeFn(this._internals.action(actionFn));
  }
}
