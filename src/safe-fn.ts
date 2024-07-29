import type { z } from "zod";
import type { SafeFnInput } from "./types";

export class SafeFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
> {
  readonly _inputSchema: TInputSchema;
  readonly _outputSchema: TOutputSchema;

  private constructor(args: {
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
  }) {
    this._inputSchema = args.inputSchema;
    this._outputSchema = args.outputSchema;
  }

  static new(): SafeFn<undefined, undefined> {
    return new SafeFn({
      inputSchema: undefined,
      outputSchema: undefined,
    });
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): SafeFn<TNewInputSchema, TOutputSchema> {
    return new SafeFn({
      inputSchema: schema,
      outputSchema: this._outputSchema,
    });
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): SafeFn<TInputSchema, TNewOutputSchema> {
    return new SafeFn({
      inputSchema: this._inputSchema,
      outputSchema: schema,
    });
  }
}
