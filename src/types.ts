import type { ZodTypeAny, z } from "zod";
import type { Result } from "./result";

type TODO = any;

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

type SafeFnActionArgs<TInputSchema extends SafeFnInput, TUnparsedInput> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, never>;
  unparsedInput: SchemaInputOrFallback<TInputSchema, TUnparsedInput>;
};

type SafeFnActionReturn<TOutputSchema extends SafeFnOutput> = Result<
  SchemaOutputOrFallback<TOutputSchema, any>,
  TODO
>;

export type SafeFnActionFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
> = (
  args: SafeFnActionArgs<TInputSchema, TUnparsedInput>,
) => MaybePromise<SafeFnActionReturn<TOutputSchema>>;

export type AnySafeFnActionFn = SafeFnActionFn<any, any, any>;

export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
> = SchemaOutputOrFallback<
  TOutputSchema,
  Awaited<ReturnType<TActionFn>>["data"]
>;

export type SafeFnRunArgs<
  TInputSchema extends SafeFnInput,
  TActionFn extends AnySafeFnActionFn,
> = SchemaInputOrFallback<
  TInputSchema,
  Parameters<TActionFn>[0]["unparsedInput"]
>;

export type SafeFnReturn<
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
> = Result<SafeFnReturnData<TOutputSchema, TActionFn>, TODO>;
