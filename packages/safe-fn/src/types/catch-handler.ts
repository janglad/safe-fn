import type { Err } from "neverthrow";

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

/**
 * Convenience type for any catch handler result.
 */
export type TAnySafeFnCatchHandlerRes = Err<never, any>;

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

export interface TSafeFnDefaultCatchHandlerErr
  extends Err<
    never,
    {
      code: "UNCAUGHT_ERROR";
      cause: "An uncaught error occurred. You can implement a custom error handler by using `catch()`";
    }
  > {}
