type Result<TData, TError> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: TError;
    };

const Ok = <TData>(data: TData): Result<TData, never> => ({
  success: true,
  data,
});

const Err = <TError>(error: TError): Result<never, TError> => ({
  success: false,
  error,
});
