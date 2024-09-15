import { ResultAsync, err, ok } from "neverthrow";
import { z } from "zod";
import type { AnyRunnableSafeFn } from "./runnable-safe-fn";
import type {
  SafeFnCallBacks,
  SafeFnOnCompleteArgs,
  SafeFnOnErrorArgs,
  SafeFnOnSuccessArgs,
} from "./types/callbacks";
import type { AnySafeFnHandlerRes } from "./types/handler";
import type { SafeFnSuperInternalRunReturn } from "./types/run";
import type { SafeFnInput, SafeFnOutput } from "./types/schema";

import type { AnySafeFnCatchHandlerRes, SafeFnParseError } from "./types/error";

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
  TRes extends SafeFnSuperInternalRunReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    NoInfer<TAsAction>
  > = SafeFnSuperInternalRunReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes,
    NoInfer<TAsAction>
  >,
>(args: {
  resultAsync: TRes;
  asAction: TAsAction;
  unsafeRawInput: TUnparsedInput;
  callbacks: SafeFnCallBacks<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes
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
    } else if (res.isErr() && args.callbacks.onError !== undefined) {
      const onErrorPromise = ResultAsync.fromThrowable(
        args.callbacks.onError,
        throwFrameworkErrorOrVoid,
      )({
        asAction: args.asAction as any,
        error: res.error.public as any,
        ctx: res.error.private.ctx,
        input: res.error.private.input,
        unsafeRawInput: args.unsafeRawInput,
      } as SafeFnOnErrorArgs<
        TParent,
        TInputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >);
      callbackPromises.push(onErrorPromise);
    }

    if (args.callbacks.onComplete !== undefined) {
      const onCompletePromise = ResultAsync.fromThrowable(
        args.callbacks.onComplete,
        throwFrameworkErrorOrVoid,
      )({
        asAction: args.asAction,
        result: res.match(
          (value) => ok(value.result),
          (error) => err(error.public),
        ),
        ctx: res.match(
          (value) => value.ctx,
          (err) => err.private.ctx,
        ),
        input: res.match(
          (value) => value.input,
          (err) => err.private.input,
        ),
        unsafeRawInput: args.unsafeRawInput,
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
