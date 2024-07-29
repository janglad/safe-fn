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

export const Ok = <TData>(data: TData): Result<TData, never> => ({
  success: true,
  data,
  error: undefined as never,
});

export const Err = <TError>(error: TError): Result<never, TError> => ({
  success: false,
  error,
  data: undefined as never,
});
