import { ResultAsync, err, ok } from "neverthrow";
import { z } from "zod";
import type {
  AnyRunnableSafeFn,
  AnySafeFnCatchHandlerRes,
  AnySafeFnHandlerRes,
  SafeFnCallBacks,
  SafeFnInput,
  SafeFnInternalRunReturn,
  SafeFnOnCompleteArgs,
  SafeFnOnErrorArgs,
  SafeFnOnSuccessArgs,
  SafeFnOutput,
  SafeFnParseError,
} from "./types";

const NEXT_JS_ERROR_MESSAGES = ["NEXT_REDIRECT", "NEXT_NOT_FOUND"];

export const isFrameworkError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (NEXT_JS_ERROR_MESSAGES.includes(error.message)) {
    return true;
  }

  return false;
};

export const throwFrameworkErrorOrVoid = (error: unknown): void => {
  if (isFrameworkError(error)) {
    throw error;
  }
};

export const runCallbacks = <
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
  TAsAction extends boolean,
  TRes extends SafeFnInternalRunReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    NoInfer<TAsAction>,
    true
  > = SafeFnInternalRunReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    NoInfer<TAsAction>,
    true
  >,
>(
  resultAsync: TRes,
  asAction: TAsAction,
  callbacks: SafeFnCallBacks<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes
  >,
  hotOnStartCallback: ResultAsync<void, void> | undefined,
): TRes => {
  const exec = async () => {
    const res = await resultAsync;
    const callbackPromises: ResultAsync<void, void>[] = [];
    if (hotOnStartCallback !== undefined) {
      callbackPromises.push(hotOnStartCallback);
    }

    if (res.isOk() && callbacks.onSuccess !== undefined) {
      const onSuccessPromise = ResultAsync.fromThrowable(
        callbacks.onSuccess,
        throwFrameworkErrorOrVoid,
      )({
        unsafeRawInput: res.value.unsafeRawInput,
        input: res.value.input,
        ctx: res.value.ctx,
        value: res.value.result,
      } as SafeFnOnSuccessArgs<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes
      >);
      callbackPromises.push(onSuccessPromise);
    } else if (res.isErr() && callbacks.onError !== undefined) {
      const onErrorPromise = ResultAsync.fromThrowable(
        callbacks.onError,
        throwFrameworkErrorOrVoid,
      )({
        asAction,
        error: res.error,
      } as SafeFnOnErrorArgs<
        TParent,
        TInputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >);
      callbackPromises.push(onErrorPromise);
    }

    if (callbacks.onComplete !== undefined) {
      const onCompletePromise = ResultAsync.fromThrowable(
        callbacks.onComplete,
        throwFrameworkErrorOrVoid,
      )({
        // TODO: fix this, only returns if result is ok
        asAction,
        result: res.map((res) => res.result),
        ctx: res.map((res) => res.ctx).unwrapOr(undefined),
        input: res.map((res) => res.input).unwrapOr(undefined),
        unsafeRawInput: res
          .map((res) => res.unsafeRawInput)
          .unwrapOr(undefined),
      } as SafeFnOnCompleteArgs<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >);
      callbackPromises.push(onCompletePromise);
    }
    await ResultAsync.combineWithAllErrors(callbackPromises);
    return res;
  };

  return ResultAsync.fromSafePromise(exec()).andThen((res) => res) as any;
};

type SafeZodAsyncParseReturn<T extends z.ZodTypeAny> = ResultAsync<
  z.input<T>,
  | {
      code: "PARSING_UNHANDLED";
      cause: unknown;
    }
  | {
      code: "PARSING";
      cause: z.SafeParseReturnType<z.input<T>, z.output<T>>["error"];
    }
>;

export const safeZodAsyncParse = <T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): SafeZodAsyncParseReturn<T> => {
  return ResultAsync.fromThrowable(
    schema.safeParseAsync as (
      input: unknown,
    ) => Promise<z.SafeParseReturnType<z.input<T>, z.output<T>>>,
    (error) => {
      return {
        code: "PARSING_UNHANDLED",
        cause: error,
      } as const;
    },
  )(input).andThen((res) => {
    if (res.success) {
      return ok(res.data);
    }

    return err({
      code: "PARSING",
      cause: res.error,
    } as const);
  });
};

export const mapZodError = <T extends z.ZodError>(err: T) => {
  return {
    formattedError: err.format(),
    flattenedError: err.flatten(),
  } satisfies SafeFnParseError<any, true>;
};
