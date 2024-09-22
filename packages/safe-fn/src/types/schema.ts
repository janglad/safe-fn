import { z } from "zod";
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
 Type params: 
 - `T`: the SafeFn

 Returned type: 
 - the input schema of the SafeFn
 */
export type InferInputSchema<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    infer TInputSchema,
    any,
    any,
    any,
    any,
    any
  >
    ? TInputSchema
    : never;

/**
 * Type params:
 * - `T`: the SafeFn
 *
 * Returned type:
 * - the output schema of the SafeFn
 */
export type InferOutputSchema<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    any,
    any,
    any
  >
    ? TOutputSchema
    : never;

/**
 * Type params:
 * - `T`: the SafeFn
 *
 * Returned type:
 * - the unparsed input of the SafeFn
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
    any,
    infer TUnparsed,
    any
  >
    ? TUnparsed
    : never;

export type TInferMergedInputSchemaInput<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    infer MergedInputSchemaInput,
    any,
    any,
    any,
    any
  >
    ? MergedInputSchemaInput
    : never;

export type TInferMergedParentOutputSchemaInput<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    any,
    infer TOutputSchema,
    infer MergedOutputSchemaInput,
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
    any,
    any,
    infer TCtxInput,
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

export type TSafeFnInput = z.ZodTypeAny | undefined;

export type TSafeFnOutput = z.ZodTypeAny | undefined;

export type TSafeFnUnparsedInput = [unknown] | [];

export type TSchemaInputOrFallback<
  TSchema extends TSafeFnInput,
  TFallback,
> = TSchema extends z.ZodTypeAny ? z.input<TSchema> : TFallback;

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

export interface TSafeFnInputParseRunError<TSchemaInput> {
  code: "INPUT_PARSING";
  cause: z.ZodError<TSchemaInput>;
}

export interface TSafeFnInputParseActionError<TSchemaInput> {
  code: "INPUT_PARSING";
  cause: {
    formattedError: z.ZodFormattedError<TSchemaInput>;
    flattenedError: z.typeToFlattenedError<TSchemaInput>;
  };
}

export interface TSafeFnOutputParseRunError<TSchemaInput> {
  code: "OUTPUT_PARSING";
  cause: z.ZodError<TSchemaInput>;
}

export interface TSafeFnOutputParseActionError<TSchemaInput> {
  code: "OUTPUT_PARSING";
  cause: {
    formattedError: z.ZodFormattedError<TSchemaInput>;
    flattenedError: z.typeToFlattenedError<TSchemaInput>;
  };
}

export type TSafeFnOutputParseError<
  TOutputSchema extends TSafeFnOutput,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? {
      code: "OUTPUT_PARSING";
      cause: TSafeFnParseError<z.input<TOutputSchema>, TAsAction>;
    }
  : never;
