import { z } from "zod";
import { Err, Ok, type Result } from "./result";
import type {
  AnySafeFnThrownHandler,
  SafeFnActionFn,
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
  SchemaOutputOrFallback,
} from "./types";

export type AnySafeFn = SafeFn<any, any, any, any, any, any>;

export class SafeFn<
  TParent extends AnySafeFn | undefined,
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
  static new<TNewParent extends AnySafeFn | undefined = undefined>(
    parent?: TNewParent,
  ): SafeFn<
    TNewParent,
    undefined,
    undefined,
    unknown,
    SafeFnDefaultActionFn,
    SafeFnDefaultThrowHandler
  > {
    return new SafeFn({
      parent,
      inputSchema: undefined,
      outputSchema: undefined,
      actionFn: () =>
        Err({
          code: "NO_ACTION",
        } as const),
      uncaughtErrorHandler: (error: unknown) =>
        Err({
          code: "UNCAUGHT_ERROR",
          error,
        } as const),
    });
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): SafeFn<
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
    return new SafeFn({
      inputSchema: schema,
      outputSchema: this._outputSchema,
      // Input redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
    });
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): SafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TNewUnparsedInput,
    SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput, TParent>,
    TThrownHandler
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      // Input redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
    });
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): SafeFn<
    TParent,
    TInputSchema,
    TNewOutputSchema,
    TUnparsedInput,
    SafeFnActionFn<TInputSchema, TNewOutputSchema, TUnparsedInput, TParent>,
    TThrownHandler
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: schema,
      // Output redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
    });
  }

  error<TNewThrownHandler extends AnySafeFnThrownHandler>(
    handler: TNewThrownHandler,
  ): SafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TNewThrownHandler
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn: this._actionFn,
      uncaughtErrorHandler: handler,
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
  ): SafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewActionFn,
    TThrownHandler
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn,
      uncaughtErrorHandler: this._uncaughtErrorHandler,
    });
  }

  /*
################################
||                            ||
||            Run             ||
||                            ||
################################
  */
  async run(
    args: SafeFnRunArgs<TInputSchema, TActionFn>,
  ): Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
  > {
    try {
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
        ctx: undefined as any,
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
      return Ok(res.data);
    }

    return Err({
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
      return Ok(res.data);
    }

    return Err({
      code: "OUTPUT_PARSING",
      cause: res.error,
    }) as Err<SafeFnOutputParseError<TOutputSchema>>;
  }
}
