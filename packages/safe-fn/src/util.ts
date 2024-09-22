import { ResultAsync, err, ok } from "neverthrow";
import { z } from "zod";
import type { TSafeFnCallBacks } from "./types/callbacks";
import type { AnyCtxInput } from "./types/handler";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnParseErrorCause,
  TSafeFnUnparsedInput,
} from "./types/schema";

import type { TSafeFnInternalRunReturn } from "./types/run";
import type { TODO } from "./types/util";

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
  TData,
  TRunErr,
  TCtx,
  TCtxInput extends AnyCtxInput,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnOutput,
  TUnparsedInput extends TSafeFnUnparsedInput,
  TAsAction extends boolean,
  TRes extends TSafeFnInternalRunReturn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  > = TSafeFnInternalRunReturn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >,
>(args: {
  resultAsync: TRes;
  callbacks: TSafeFnCallBacks<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;
  hotOnStartCallback: ResultAsync<void, void> | undefined;
}): TRes => {
  const exec = async () => {
    const res = await args.resultAsync;

    const callbackPromises: ResultAsync<void, void>[] = [];
    if (args.hotOnStartCallback !== undefined) {
      callbackPromises.push(args.hotOnStartCallback);
    }

    if (res.isOk() && args.callbacks.onSuccess !== undefined) {
      const onSuccessPromise = ResultAsync.fromThrowable(
        args.callbacks.onSuccess,
        throwFrameworkErrorOrVoid,
      )({
        unsafeRawInput: res.value.unsafeRawInput as TODO,
        input: res.value.input,
        ctx: res.value.ctx as TODO,
        ctxInput: res.value.ctxInput,
        value: res.value.value,
      });
      callbackPromises.push(onSuccessPromise);
    } else if (res.isErr() && args.callbacks.onError !== undefined) {
      const onErrorPromise = ResultAsync.fromThrowable(
        args.callbacks.onError,
        throwFrameworkErrorOrVoid,
      )({
        error: res.error.public,
        ctx: res.error.private.ctx,
        ctxInput: res.error.private.ctxInput,
        input: res.error.private.input,
        unsafeRawInput: res.error.private.unsafeRawInput as TODO,
      } as TODO);
      callbackPromises.push(onErrorPromise);
    }

    if (args.callbacks.onComplete !== undefined) {
      const onCompletePromise = ResultAsync.fromThrowable(
        args.callbacks.onComplete,
        throwFrameworkErrorOrVoid,
      )({
        result: res.match(
          (value) => ok(value.value),
          (error) => err(error.public),
        ) as TODO,
        ctx: res.match(
          (value) => value.ctx,
          (err) => err.private.ctx,
        ) as TODO,
        input: res.match(
          (value) => value.input,
          (err) => err.private.input,
        ) as TODO,
        unsafeRawInput: res.match(
          (value) => value.unsafeRawInput,
          (err) => err.private.unsafeRawInput,
        ) as TODO,
        ctxInput: res.match(
          (value) => value.ctxInput,
          (err) => err.private.ctxInput,
        ) as TODO,
      });
      callbackPromises.push(onCompletePromise);
    }
    await ResultAsync.combineWithAllErrors(callbackPromises);
    return res;
  };

  return ResultAsync.fromSafePromise(exec()).andThen(
    (res) => res,
  ) as unknown as TRes;
};

type SafeZodAsyncParseReturn<T extends z.ZodTypeAny> = ResultAsync<
  z.input<T>,
  | {
      code: "PARSING_UNHANDLED";
      cause: unknown;
    }
  | {
      code: "PARSING";
      cause: z.ZodError<z.input<T>>;
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

export const mapZodError = <T>(
  err: z.ZodError<T>,
): {
  formattedError: z.ZodFormattedError<T>;
  flattenedError: z.typeToFlattenedError<T>;
} => {
  return {
    formattedError: err.format(),
    flattenedError: err.flatten(),
  } satisfies TSafeFnParseErrorCause<TODO>;
};
