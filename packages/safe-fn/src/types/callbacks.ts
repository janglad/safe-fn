import type { Err, Ok } from "neverthrow";
import type { AnyRunnableSafeFn, RunnableSafeFn } from "../runnable-safe-fn";
import type { AnySafeFnCatchHandlerRes } from "./error";
import type { AnySafeFnHandlerRes, SafeFnHandlerArgs } from "./handler";
import type { SafeFnReturnData, SafeFnReturnError } from "./run";
import type { SafeFnInput, SafeFnOutput } from "./schema";
import type { Prettify } from "./util";

export type InferSafeFnCallbacks<T> =
  T extends RunnableSafeFn<
    infer TParent,
    infer TInputSchema,
    infer TOutputSchema,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TCatchHandlerRes
  >
    ? SafeFnCallBacks<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    : never;

export interface SafeFnCallBacks<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> {
  onStart: SafeFnOnStart<TUnparsedInput> | undefined;
  onSuccess:
    | SafeFnOnSuccess<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes
      >
    | undefined;
  onError:
    | SafeFnOnError<
        TParent,
        TInputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
  onComplete:
    | SafeFnOnComplete<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
}
export type SafeFnOnStart<in out TUnparsedInput> = (args: {
  unsafeRawInput: Prettify<TUnparsedInput>;
}) => Promise<void>;

export interface SafeFnOnSuccessArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
> extends SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  value: SafeFnReturnData<TOutputSchema, THandlerRes>;
}

export type SafeFnOnSuccess<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
> = (
  args: SafeFnOnSuccessArgs<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes
  >,
) => Promise<void>;

// Temporary, will be fixed when I fix types in general
type ToOptionalSafeFnArgs<T> = {
  [K in keyof T]: K extends "unsafeRawInput" ? T[K] : T[K] | undefined;
};

export type SafeFnOnErrorArgs<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> =
  | SafeFnOnErrorActionArgs<
      TParent,
      TInputSchema,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes
    >
  | SafeFnOnErrorNonActionArgs<
      TParent,
      TInputSchema,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes
    >;
interface SafeFnOnErrorActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> extends ToOptionalSafeFnArgs<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: true;
  error: SafeFnReturnError<
    TParent,
    TInputSchema,
    undefined,
    THandlerRes,
    TCatchHandlerRes,
    true
  >;
}

interface SafeFnOnErrorNonActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> extends ToOptionalSafeFnArgs<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: false;
  error: SafeFnReturnError<
    TParent,
    TInputSchema,
    undefined,
    THandlerRes,
    TCatchHandlerRes,
    false
  >;
}

export type SafeFnOnError<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  args: SafeFnOnErrorArgs<
    TParent,
    TInputSchema,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes
  >,
) => Promise<void>;

export type SafeFnOnCompleteArgs<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> =
  | SafeFnOnCompleteErrorArgs<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >
  | SafeFnOnCompleteSuccessArgs<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >;

type SafeFnOnCompleteErrorArgs<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> =
  | SafeFnOnCompleteErrorActionArgs<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >
  | SafeFnOnCompleteErrorNonActionArgs<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >;

interface SafeFnOnCompleteSuccessArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
> extends SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  asAction: boolean;
  result: Ok<SafeFnReturnData<TOutputSchema, THandlerRes>, never>;
}

interface SafeFnOnCompleteErrorActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> extends ToOptionalSafeFnArgs<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: true;
  result: Err<
    never,
    SafeFnReturnError<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      true
    >
  >;
}

interface SafeFnOnCompleteErrorNonActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> extends ToOptionalSafeFnArgs<
    SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: false;
  result: Err<
    never,
    SafeFnReturnError<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      false
    >
  >;
}

export type SafeFnOnComplete<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnInput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  args: SafeFnOnCompleteArgs<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >,
) => Promise<void>;
