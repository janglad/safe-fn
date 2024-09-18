import type { z } from "zod";
import type { AnyRunnableSafeFn, RunnableSafeFn } from "../runnable-safe-fn";

/*
################################
||                            ||
||           Infer            ||
||                            ||
################################
*/
/**
 * Infer the input schema of a runnable safe function.
 * @param T the runnable safe function
 * @returns the input schema of the safe function
 */
export type InferInputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["inputSchema"]
  : never;

/**
 * Infer the output schema of a runnable safe function.
 * @param T the runnable safe function
 * @returns the output schema of the safe function
 */
export type InferOutputSchema<T> = T extends AnyRunnableSafeFn
  ? T["_internals"]["outputSchema"]
  : never;

/**
 * Infer the unparsed input of a runnable safe function.
 * @param T the runnable safe function
 * @returns the unparsed input of the safe function
 */
export type InferUnparsedInput<T> =
  T extends RunnableSafeFn<any, any, any, any, any, infer TUnparsed, any, any>
    ? TUnparsed
    : never;

export type InferMergedInputSchemaInput<T> = T extends
  | RunnableSafeFn<
      any,
      any,
      infer MergedInputSchemaInput,
      any,
      any,
      any,
      any,
      any
    >
  | RunnableSafeFn<
      any,
      any,
      infer MergedInputSchemaInput,
      any,
      any,
      never,
      any,
      any
    >
  ? MergedInputSchemaInput
  : never;

export type InferMergedOutputSchemaInput<T> = T extends
  | RunnableSafeFn<
      any,
      any,
      any,
      any,
      infer MergedOutputSchemaInput,
      any,
      any,
      any
    >
  | RunnableSafeFn<
      any,
      any,
      any,
      any,
      infer MergedOutputSchemaInput,
      never,
      any,
      any
    >
  ? MergedOutputSchemaInput
  : never;

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/
/**
 * A Zod schema that is used to parse the input of the safe function, or undefined.
 */
export type TSafeFnInput = z.ZodTypeAny | undefined;
/**
 * A Zod schema that is used to parse the output of the `handler()` and return the final value on `run()`, or undefined.
 */
export type TSafeFnOutput = z.ZodTypeAny | undefined;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type TSchemaInputOrFallback<TSchema extends TSafeFnInput, TFallback> = [
  TSchema,
] extends [never]
  ? TFallback
  : TSchema extends z.ZodTypeAny
    ? z.input<TSchema>
    : TFallback;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type TSchemaOutputOrFallback<
  TSchema extends TSafeFnOutput,
  TFallback,
> = [TSchema] extends [never]
  ? TFallback
  : TSchema extends z.ZodTypeAny
    ? z.output<TSchema>
    : TFallback;
