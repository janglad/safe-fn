import { err, ok, Result, ResultAsync } from "neverthrow";

export type InferOkData<T> = T extends Result<infer TData, any> ? TData : never;
export type InferAsyncOkData<T> =
  T extends ResultAsync<infer TData, any> ? TData : never;

export type InferErrError<T> =
  T extends Result<any, infer TError> ? TError : never;
export type InferAsyncErrError<T> =
  T extends ResultAsync<any, infer TError> ? TError : never;

export type MergeResults<T1, T2> =
  T1 extends Result<infer D1, infer E1>
    ? T2 extends Result<infer D2, infer E2>
      ? Result<D1 | D2, E1 | E2>
      : never
    : never;

export type ResultToResultAsync<T extends Result<unknown, unknown>> =
  T extends Result<infer D, infer E> ? ResultAsync<D, E> : never;

export type MergeResultAsync<T1, T2> =
  T1 extends ResultAsync<infer D1, infer E1>
    ? T2 extends ResultAsync<infer D2, infer E2>
      ? ResultAsync<D1 | D2, E1 | E2>
      : never
    : never;

// These are needed for the `createAction()` method to work.
// neverthrow results can not be sent over the wire in server actions.

/**
 * The return type of a function returned by `createAction()`. This is needed as NeverThrow `Result`s can not be sent over the wire in server actions.
 *
 * Can be converted to a `Result` using `actionResultToResult()`
 */
export type ActionResult<T, E> = ActionOk<T> | ActionErr<E>;

export type ActionOk<T> = {
  ok: true;
  value: T;
};
export const actionOk = <T>(value: T): ActionOk<T> => ({ ok: true, value });
export type InferActionOkData<T> =
  T extends ActionOk<infer TData> ? TData : never;

export type ActionErr<E> = {
  ok: false;
  error: E;
};
export const actionErr = <E>(error: E): ActionErr<E> => ({ ok: false, error });
export type InferActionErrError<T> =
  T extends ActionErr<infer TError> ? TError : never;
/**
 * Converts a `ResultAsync<T,E>` to a `Promise<ActionResult<T,E>>`.
 */
export type ResultAsyncToPromiseActionResult<T> = Promise<
  T extends ResultAsync<infer D, infer E> ? ActionResult<D, E> : never
>;

export type ActionResultPromiseToResultAsync<T> =
  T extends Promise<ActionResult<infer D, infer E>> ? ResultAsync<D, E> : never;

export type ActionResultToResult<T> =
  T extends ActionResult<infer D, infer E> ? Result<D, E> : never;

/**
 * Converts an `ActionResult<T,E>` to a `Result<T,E>`.
 */
export const actionResultToResult = <
  R extends ActionResult<any, any>,
  T = R extends ActionResult<infer T, any> ? T : never,
  E = R extends ActionResult<any, infer E> ? E : never,
>(
  actionResult: R,
): Result<T, E> => {
  if (actionResult.ok) {
    return ok(actionResult.value);
  }
  return err(actionResult.error);
};
