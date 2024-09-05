import * as NT from "neverthrow";

export type Result<TData, TError> = NT.Result<TData, TError>;
export type ResultAsync<TData, TError> = NT.ResultAsync<TData, TError>;
export type AnyResult = Result<any, any>;

export type Ok<TData, TError = never> = NT.Ok<TData, TError>;
export type InferOkData<T> = T extends Result<infer TData, any> ? TData : never;

export const ok = <const TData>(data: TData): Ok<TData, never> => NT.ok(data);

export type Err<TData = never, TError = unknown> = NT.Err<TData, TError>;
export type InferErrError<T> =
  T extends Result<any, infer TError> ? TError : never;

export type AnyErr = Err<never, any>;
export const err = <const TError>(error: TError): Err<never, TError> =>
  NT.err(error);

export type MergeResults<T1, T2> =
  T1 extends NT.Result<infer D1, infer E1>
    ? T2 extends NT.Result<infer D2, infer E2>
      ? NT.Result<D1 | D2, E1 | E2>
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
export type ActionResult<T, E> = ActionOk<T> | ActionErr<E>;

export type ActionOk<T> = {
  ok: true;
  value: T;
};
export const actionOk = <T>(value: T): ActionOk<T> => ({ ok: true, value });

export type ActionErr<E> = {
  ok: false;
  error: E;
};
export const actionErr = <E>(error: E): ActionErr<E> => ({ ok: false, error });

/**
 * Converts a `ResultAsync<T,E>` to a `Promise<Result<T,E>>`.
 */
export type ResultAsyncToPromiseActionResult<T> = Promise<
  T extends ResultAsync<infer D, infer E> ? ActionResult<D, E> : never
>;

export type ActionResultToResult<T> =
  T extends ActionResult<infer D, infer E> ? Result<D, E> : never;

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
