import type { z } from "zod";
import type { TRunnableSafeFn } from "../runnable-safe-fn";
import type { AnyObject, TIntersectIfNotT } from "./util";

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
export type InferInputSchema<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    infer TInputSchema,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TInputSchema
    : never;

/**
 * Infer the output schema of a runnable safe function.
 * @param T the runnable safe function
 * @returns the output schema of the safe function
 */
export type InferOutputSchema<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    any,
    any,
    any,
    any,
    any
  >
    ? TOutputSchema
    : never;

/**
 * Infer the unparsed input of a runnable safe function.
 * @param T the runnable safe function
 * @returns the unparsed input of the safe function
 */
export type InferUnparsedInputTuple<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    infer TUnparsed,
    any,
    any,
    any
  >
    ? TUnparsed
    : never;

export type InferMergedInputSchemaInput<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    infer MergedInputSchemaInput,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? MergedInputSchemaInput
    : never;

export type InferMergedParentOutputSchemaInput<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    infer MergedOutputSchemaInput,
    any,
    any,
    any,
    any
  >
    ? TIntersectIfNotT<
        TSchemaInputOrFallback<TOutputSchema, undefined>,
        MergedOutputSchemaInput,
        undefined
      >
    : never;

export type TInferCtxInput<T> =
  T extends TRunnableSafeFn<
    any,
    infer TCtxInput,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TCtxInput
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

export type TSafeFnUnparsedInput = [unknown] | [];

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type TSchemaInputOrFallback<
  TSchema extends TSafeFnInput,
  TFallback,
> = TSchema extends z.ZodTypeAny ? z.input<TSchema> : TFallback;

/**
 * @param TSchema a Zod schema or undefined
 * @param TFallback the fallback type if the schema is undefined
 * @returns the output type of the schema if it is defined, otherwise `TFallback`
 */
export type TSchemaOutputOrFallback<
  TSchema extends TSafeFnOutput,
  TFallback,
> = TSchema extends z.ZodTypeAny ? z.output<TSchema> : TFallback;

export type TSafeFnParseError<
  TSchemaInput extends AnyObject,
  TAsAction extends boolean,
> = TAsAction extends true
  ? {
      formattedError: z.ZodFormattedError<TSchemaInput>;
      flattenedError: z.typeToFlattenedError<TSchemaInput>;
    }
  : z.ZodError<TSchemaInput>;

export type TSafeFnInputParseError<
  TInputSchema extends TSafeFnInput,
  TAsAction extends boolean,
> = TInputSchema extends z.ZodTypeAny
  ? {
      code: "INPUT_PARSING";
      cause: TSafeFnParseError<z.input<TInputSchema>, TAsAction>;
    }
  : never;

export type TSafeFnOutputParseError<
  TOutputSchema extends TSafeFnOutput,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? {
      code: "OUTPUT_PARSING";
      cause: TSafeFnParseError<z.input<TOutputSchema>, TAsAction>;
    }
  : never;
