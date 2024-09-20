/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

import type { Result } from "neverthrow";

/**
 * Convenience type for any catch handler result.
 */
export type TAnySafeFnCatchHandlerRes = Result<never, any>;

/**
 * Convenience type for any catch handler function.
 */
export type TAnySafeFnCatchHandler = (
  error: unknown,
) => TAnySafeFnCatchHandlerRes;

/**
 * Default catch handler function. Overridden by `catch()`
 */
export type TSafeFnDefaultCatchHandler = (
  error: unknown,
) => TSafeFnDefaultCatchHandlerErr;

export type TSafeFnDefaultCatchHandlerErr = Result<
  never,
  TSafeFnDefaultCatchHandlerErrError
>;

export interface TSafeFnDefaultCatchHandlerErrError {
  code: "UNCAUGHT_ERROR";
  cause: "An uncaught error occurred. You can implement a custom error handler by using `catch()`";
}
