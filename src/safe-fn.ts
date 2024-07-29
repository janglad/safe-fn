import type { z } from "zod";
import type { SafeFnInput } from "./types";

export class SafeFn<TInputSchema extends SafeFnInput, SafeFnOutput> {
  readonly _inputSchema: TInputSchema;
  readonly _outputSchema: SafeFnOutput;

  private constructor(args: {
    inputSchema: TInputSchema;
    outputSchema: SafeFnOutput;
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
  ): SafeFn<TNewInputSchema, SafeFnOutput> {
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
