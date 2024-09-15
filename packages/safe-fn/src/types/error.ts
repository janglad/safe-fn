import type { Err, Result } from "neverthrow";
import type { z } from "zod";
import type { SafeFnInput, SafeFnOutput } from "./schema";

/**
 * Convenience type for any catch handler result.
 */
export type AnySafeFnCatchHandlerRes = Result<never, any>;

/**
 * Convenience type for any catch handler function.
 */
export type AnySafeFnCatchHandler = (
  error: unknown,
) => AnySafeFnCatchHandlerRes;

/**
 * Default catch handler function. Overridden by `catch()`
 */
export type SafeFnDefaultCatchHandler = (
  error: unknown,
) => SafeFnDefaultCatchHandlerErr;

export type SafeFnDefaultCatchHandlerErr = Err<
  never,
  {
    code: "UNCAUGHT_ERROR";
    cause: "An uncaught error occurred. You can implement a custom error handler by using `catch()`";
  }
>;

/**
 * @param TSchema a Zod schema or undefined
 * @param TAsAction indicates weather the error will be returned in an error.
 * These types need to be differentiated by `TAsAction` as `Error` classes can not be sent over the wire in server actions.
 */
export type SafeFnParseError<
  TSchema extends z.ZodTypeAny,
  TAsAction extends boolean,
> = TAsAction extends true
  ? {
      formattedError: z.ZodFormattedError<z.input<TSchema>>;
      flattenedError: z.typeToFlattenedError<z.input<TSchema>>;
    }
  : z.ZodError<z.input<TSchema>>;

export type SafeFnInputParseError<
  TInputSchema extends SafeFnInput,
  TAsAction extends boolean,
> = TInputSchema extends z.ZodTypeAny
  ? {
      code: "INPUT_PARSING";
      cause: SafeFnParseError<TInputSchema, TAsAction>;
    }
  : never;

export type SafeFnOutputParseError<
  TOutputSchema extends SafeFnOutput,
  TAsAction extends boolean,
> = TOutputSchema extends z.ZodTypeAny
  ? {
      code: "OUTPUT_PARSING";
      cause: SafeFnParseError<TOutputSchema, TAsAction>;
    }
  : never;
