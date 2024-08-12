import { z } from "zod";
import { err, ok, type Err, type Result } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  BuilderSteps,
  SafeFnActionFn,
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
  SchemaOutputOrFallback,
  TSafeFn,
} from "./types";

export class SafeFn<
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
  TOmit extends BuilderSteps | "",
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
  ): TSafeFn<
    TNewParent,
    undefined,
    undefined,
    unknown,
    SafeFnDefaultActionFn,
    SafeFnDefaultThrowHandler,
    "run"
  > {
    return new SafeFn({
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
  ): TSafeFn<
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
    TThrownHandler,
    TOmit | "input" | "unparsedInput"
  > {
    return new SafeFn({
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
  unparsedInput<TNewUnparsedInput>(): TSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TNewUnparsedInput,
    SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
    TThrownHandler,
    TOmit | "input" | "unparsedInput"
  > {
    return new SafeFn({
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
  ): TSafeFn<
    TParent,
    TInputSchema,
    TNewOutputSchema,
    TUnparsedInput,
    SafeFnActionFn<TInputSchema, TNewOutputSchema, TUnparsedInput, TParent>,
    TThrownHandler,
    TOmit | "output"
  > {
    return new SafeFn({
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
  ): TSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TNewThrownHandler,
    TOmit | "error"
  > {
    return new SafeFn({
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
  ): TSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewActionFn,
    TThrownHandler,
    Exclude<TOmit, "run"> | "input" | "output" | "unparsedInput" | "action"
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn: actionFn as any,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
      parent: this._parent,
    }) as any;
  }

  createAction(): (
    args: SafeFnRunArgs<TInputSchema, TUnparsedInput, TParent>,
  ) => Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
  > {
    // TODO: strip stack traces etc here
    return this.run.bind(this);
  }

  /*
################################
||                            ||
||            Run             ||
||                            ||
################################
  */
  async run(
    args: SafeFnRunArgs<TInputSchema, TUnparsedInput, TParent>,
  ): Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
  > {
    try {
      let ctx: any;

      if (this._parent !== undefined) {
        const parentRes = await this._parent.run(args);
        if (!parentRes.success) {
          return parentRes as any;
        }
        ctx = parentRes.data;
      }

      let parsedInput: typeof args.parsedInput = undefined;
      if (this._inputSchema !== undefined) {
        const parseRes = await this._parseInput(args);
        if (!parseRes.success) {
          return parseRes;
        } else {
          parsedInput = parseRes.data;
        }
      }
      const actionRes = await this._actionFn({
        parsedInput,
        unparsedInput: args,
        // TODO: pass context when functions are set up
        ctx,
      } as any);

      if (!actionRes.success) {
        return actionRes;
      }

      if (this._outputSchema !== undefined) {
        return await this._parseOutput(actionRes.data);
      }

      return actionRes;
    } catch (error) {
      return await this._uncaughtErrorHandler(error);
    }
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  async _parseInput(
    input: unknown,
  ): Promise<
    Result<
      SchemaOutputOrFallback<TInputSchema, never>,
      SafeFnInputParseError<TInputSchema>
    >
  > {
    if (this._inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    const res = await this._inputSchema.safeParseAsync(input);

    if (res.success) {
      return ok(res.data);
    }

    return err({
      code: "INPUT_PARSING",
      cause: res.error,
    }) as Err<SafeFnInputParseError<TInputSchema>>;
  }

  async _parseOutput(
    output: unknown,
  ): Promise<
    Result<
      SchemaOutputOrFallback<TOutputSchema, never>,
      SafeFnOutputParseError<TOutputSchema>
    >
  > {
    if (this._outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    const res = await this._outputSchema.safeParseAsync(output);

    if (res.success) {
      return ok(res.data);
    }

    return err({
      code: "OUTPUT_PARSING",
      cause: res.error,
    }) as Err<SafeFnOutputParseError<TOutputSchema>>;
  }
}
