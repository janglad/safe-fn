import type { ZodTypeAny, z } from "zod";

type MaybePromise<T> = T | Promise<T>;

export type SafeFnInput = z.ZodTypeAny | undefined;
export type SafeFnOutput = z.ZodTypeAny | undefined;

export type SchemaInputOrFallback<
  TSchema extends SafeFnInput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.input<TSchema> : TFallback;
export type SchemaOutputOrFallback<
  TSchema extends SafeFnOutput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.output<TSchema> : TFallback;

type SafeFnActionArgs<TInputSchema extends SafeFnInput> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, never>;
  unparsedInput: SchemaInputOrFallback<TInputSchema, unknown>;
};

type SafeFnActionReturn<TOutputSchema extends SafeFnOutput> =
  SchemaOutputOrFallback<TOutputSchema, any>;

export type SafeFnActionFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
> = (
  args: SafeFnActionArgs<TInputSchema>,
) => MaybePromise<SafeFnActionReturn<TOutputSchema>>;

export type AnySafeFnActionFn = SafeFnActionFn<any, any>;
