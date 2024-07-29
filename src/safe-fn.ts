import type { z } from "zod";
import type {
  AnySafeFnActionFn,
  SafeFnActionFn,
  SafeFnInput,
  SafeFnReturnData,
  SafeFnRunArgs,
} from "./types";

export class SafeFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TActionFn extends SafeFnActionFn<TInputSchema, TOutputSchema>,
> {
  readonly _inputSchema: TInputSchema;
  readonly _outputSchema: TOutputSchema;
  readonly _actionFn: TActionFn;

  private constructor(args: {
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    actionFn: TActionFn;
  }) {
    this._inputSchema = args.inputSchema;
    this._outputSchema = args.outputSchema;
    this._actionFn = args.actionFn;
  }

  // ******************************
  // *****       Build      *******
  // ******************************
  static new(): SafeFn<undefined, undefined, AnySafeFnActionFn> {
    return new SafeFn({
      inputSchema: undefined,
      outputSchema: undefined,
      actionFn: () => {},
    });
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): SafeFn<
    TNewInputSchema,
    TOutputSchema,
    SafeFnActionFn<TNewInputSchema, TOutputSchema>
  > {
    return new SafeFn({
      inputSchema: schema,
      outputSchema: this._outputSchema,
      // Input redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
    });
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): SafeFn<
    TInputSchema,
    TNewOutputSchema,
    SafeFnActionFn<TInputSchema, TNewOutputSchema>
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: schema,
      // Output redefined so action args no longer match.
      // TODO: This situation should be prevented by omit args on SafeFn class in the future.
      // @ts-expect-error
      actionFn: this._actionFn,
    });
  }

  action<TNewActionFn extends SafeFnActionFn<TInputSchema, TOutputSchema>>(
    actionFn: TNewActionFn,
  ): SafeFn<TInputSchema, TOutputSchema, TNewActionFn> {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn,
    });
  }

  // ******************************
  // *****       Run      *********
  // ******************************

  // TODO: implement more than success type
  async run(
    args: SafeFnRunArgs<TInputSchema, TActionFn>,
  ): Promise<SafeFnReturnData<TOutputSchema, TActionFn>> {
    return await this._actionFn(args);
  }

  // ******************************
  // *****    Internal    *********
  // ******************************
}
