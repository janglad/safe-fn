export type Result<TData, TError> =
  | {
      success: true;
      data: TData;
      error: never;
    }
  | {
      success: false;
      error: TError;
      data: never;
    };

export type Ok<TData> = Result<TData, never>;
export const Ok = <TData>(data: TData): Ok<TData> => ({
  success: true,
  data,
  error: undefined as never,
});

export type Err<TError> = Result<never, TError>;
export type AnyErr = Err<any>;
export const Err = <TError>(error: TError): Err<TError> => ({
  success: false,
  error,
  data: undefined as never,
});
