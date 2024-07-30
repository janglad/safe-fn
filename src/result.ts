export type Result<TData, TError> = Ok<TData> | Err<TError>;
export type AnyResult = Result<any, any>;

export type Ok<TData> = {
  success: true;
  data: TData;
  error: never;
};
export const Ok = <TData>(data: TData): Ok<TData> => ({
  success: true,
  data,
  error: undefined as never,
});

export type Err<TError> = {
  success: false;
  error: TError;
  data: never;
};
export type AnyErr = Err<any>;
export const Err = <TError>(error: TError): Err<TError> => ({
  success: false,
  error,
  data: undefined as never,
});
