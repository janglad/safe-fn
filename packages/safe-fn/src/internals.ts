import { z } from "zod";
import { err } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnActionFn,
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInput,
} from "./types";

export class SafeFnInternals<
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
  readonly _parent: TParent;
  readonly _inputSchema: TInputSchema;
  readonly _outputSchema: TOutputSchema;
  readonly _actionFn: TActionFn;
  readonly _uncaughtErrorHandler: TThrownHandler;

  protected constructor(args: {
    parent?: TParent;
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    actionFn: TActionFn;
    uncaughtErrorHandler: TThrownHandler;
  }) {
    this._parent = args.parent as TParent;
    this._inputSchema = args.inputSchema;
    this._outputSchema = args.outputSchema;
    this._actionFn = args.actionFn;
    this._uncaughtErrorHandler = args.uncaughtErrorHandler;
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
  ): SafeFnInternals<
    TNewParent,
    undefined,
    undefined,
    unknown,
    SafeFnDefaultActionFn,
    SafeFnDefaultThrowHandler
  > {
    return new SafeFnInternals({
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
    });
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): SafeFnInternals<
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
  > {
    return new SafeFnInternals({
      inputSchema: schema,
      outputSchema: this._outputSchema,
      // Input redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
      parent: this._parent,
    });
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TNewUnparsedInput,
    SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
    TThrownHandler
  > {
    return new SafeFnInternals({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      // Input redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
      parent: this._parent,
    });
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): SafeFnInternals<
    TParent,
    TInputSchema,
    TNewOutputSchema,
    TUnparsedInput,
    SafeFnActionFn<TInputSchema, TNewOutputSchema, TUnparsedInput, TParent>,
    TThrownHandler
  > {
    return new SafeFnInternals({
      inputSchema: this._inputSchema,
      outputSchema: schema,
      // Output redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
      parent: this._parent,
    });
  }

  error<TNewThrownHandler extends AnySafeFnThrownHandler>(
    handler: TNewThrownHandler,
  ): SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TNewThrownHandler
  > {
    return new SafeFnInternals({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn: this._actionFn as any,
      uncaughtErrorHandler: handler,
      parent: this._parent,
    });
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
  ): SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewActionFn,
    TThrownHandler
  > {
    return new SafeFnInternals({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn: actionFn as any,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
      parent: this._parent,
    }) as any;
  }
}
