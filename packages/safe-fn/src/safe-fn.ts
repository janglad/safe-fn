import { z } from "zod";
import { SafeFnInternals } from "./internals";
import { type Result } from "./result";
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
  TOmit extends BuilderSteps | "",
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
  ): TSafeFn<
    TNewParent,
    undefined,
    undefined,
    unknown,
    SafeFnDefaultActionFn,
    SafeFnDefaultThrowHandler,
    "run"
  > {
    const internals = SafeFnInternals.new(parent);
    return new SafeFnBuilder(internals);
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
    return new SafeFnBuilder(this._internals.input(schema)) as any;
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
    return new SafeFnBuilder(this._internals.unparsedInput()) as any;
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
    return new SafeFnBuilder(this._internals.output(schema)) as any;
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
    return new SafeFnBuilder(this._internals.error(handler)) as any;
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
    return new SafeFnBuilder(this._internals.action(actionFn)) as any;
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
    return this._internals.run(args);
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
    return this._internals._parseInput(input);
  }

  async _parseOutput(
    output: unknown,
  ): Promise<
    Result<
      SchemaOutputOrFallback<TOutputSchema, never>,
      SafeFnOutputParseError<TOutputSchema>
    >
  > {
    return this._internals._parseOutput(output);
  }
}
