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
  TUnparsedInput,
  TActionFn extends SafeFnActionFn<TInputSchema, TOutputSchema, TUnparsedInput>,
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

  static new(): SafeFn<undefined, undefined, unknown, AnySafeFnActionFn> {
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
    TUnparsedInput,
    SafeFnActionFn<TNewInputSchema, TOutputSchema, z.input<TNewInputSchema>>
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

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): SafeFn<
    TInputSchema,
    TOutputSchema,
    TNewUnparsedInput,
    SafeFnActionFn<TInputSchema, TOutputSchema, TNewUnparsedInput>
  > {
    return new SafeFn({
      inputSchema: this._inputSchema,
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
    TUnparsedInput,
    SafeFnActionFn<TInputSchema, TNewOutputSchema, TUnparsedInput>
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

  action<
    TNewActionFn extends SafeFnActionFn<
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  >(
    actionFn: TNewActionFn,
  ): SafeFn<TInputSchema, TOutputSchema, TUnparsedInput, TNewActionFn> {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: this._outputSchema,
      actionFn,
    });
  }

  // TODO: implement more than success type
  async run(
    args: SafeFnRunArgs<TInputSchema, TActionFn>,
  ): Promise<SafeFnReturnData<TOutputSchema, TActionFn>> {
    return await this._actionFn(args);
  }
}
