import * as NT from "neverthrow";

export type Result<TData, TError> = NT.Result<TData, TError>;
export type ResultAsync<TData, TError> = NT.ResultAsync<TData, TError>;
export type AnyResult = Result<any, any>;

export type Ok<TData, TError = never> = NT.Ok<TData, TError>;
export type InferOkData<T> = T extends Ok<infer TData, any> ? TData : never;

export const ok = <const TData>(data: TData): Ok<TData, never> => NT.ok(data);

export type Err<TData = never, TError = unknown> = NT.Err<TData, TError>;
export type InferErrError<T> =
  T extends Err<any, infer TError> ? TError : never;

export type AnyErr = Err<never, any>;
export const err = <const TError>(error: TError): Err<never, TError> =>
  NT.err(error);
