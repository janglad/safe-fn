import type { Result } from "neverthrow";
import type { TRunnableSafeFn } from "../runnable-safe-fn";
import type { AnyCtxInput, TSafeFnHandlerArgs } from "./handler";
import type {
  TSafeFnActionError,
  TSafeFnReturnData,
  TSafeFnRunError,
} from "./run";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnUnparsedInput,
} from "./schema";
import type { FirstTupleElOrUndefined, TPrettify } from "./util";

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/
export type TInferSafeFnCallbacks<T> =
  T extends TRunnableSafeFn<
    infer TData,
    infer TRunErr,
    infer TActionErr,
    infer TCtx,
    infer TCtxInput,
    infer TInputSchema,
    any,
    infer TOutputSchema,
    any,
    infer TUnparsedInput,
    any,
    any,
    any
  >
    ? TSafeFnCallBacks<
        TData,
        TRunErr,
        TActionErr,
        TCtx,
        TCtxInput,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput
      >
    : never;

export interface TSafeFnCallBacks<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> {
  onStart: TSafeFnOnStart<TUnparsedInput> | undefined;
  onSuccess:
    | TSafeFnOnSuccess<
        TData,
        TCtx,
        TCtxInput,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput
      >
    | undefined;
  onError:
    | TSafeFnOnError<
        TRunErr,
        TActionErr,
        TCtx,
        TCtxInput,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput
      >
    | undefined;
  onComplete:
    | TSafeFnOnComplete<
        TData,
        TRunErr,
        TActionErr,
        TCtx,
        TCtxInput,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput
      >
    | undefined;
}
export type TSafeFnOnStart<in out TUnparsedInput extends TSafeFnUnparsedInput> =
  (args: {
    unsafeRawInput: TPrettify<FirstTupleElOrUndefined<TUnparsedInput>>;
  }) => Promise<void>;

interface TSafeFnOnSuccessArgs<
  in out TData,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput> {
  value: TSafeFnReturnData<TData, TOutputSchema>;
}

export type TSafeFnOnSuccess<
  in out TData,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> = (
  args: TSafeFnOnSuccessArgs<
    TData,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >,
) => Promise<void>;

// Temporary, will be fixed when I fix types in general
type TToOptionalSafeFnArgs<T> = {
  [K in keyof T]: K extends "unsafeRawInput" ? T[K] : T[K] | undefined;
};

type TSafeFnOnErrorArgs<
  TRunError,
  TActionError,
  TCtx,
  TCtxInput extends AnyCtxInput,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnOutput,
  TUnparsedInput extends TSafeFnUnparsedInput,
> =
  | TSafeFnOnErrorActionArgs<
      TActionError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >
  | TSafeFnOnErrorNonActionArgs<
      TRunError,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >;
interface TSafeFnOnErrorActionArgs<
  in out TActionError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: true;
  error: TSafeFnActionError<TActionError, TOutputSchema>;
}

interface TSafeFnOnErrorNonActionArgs<
  in out TRunError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: false;
  error: TSafeFnRunError<TRunError, TOutputSchema>;
}

export type TSafeFnOnError<
  in out TRunError,
  in out TActionError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> = (
  args: TSafeFnOnErrorArgs<
    TRunError,
    TActionError,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >,
) => Promise<void>;

type TSafeFnOnCompleteArgs<
  TData,
  TRunErr,
  TActionErr,
  TCtx,
  TCtxInput extends AnyCtxInput,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnInput,
  TUnparsedInput extends TSafeFnUnparsedInput,
> =
  | TSafeFnOnCompleteErrorArgs<
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >
  | TSafeFnOnCompleteSuccessArgs<
      TData,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >;

type TSafeFnOnCompleteErrorArgs<
  TRunErr,
  TActionErr,
  TCtx,
  TCtxInput extends AnyCtxInput,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnInput,
  TUnparsedInput extends TSafeFnUnparsedInput,
> =
  | TSafeFnOnCompleteErrorActionArgs<
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >
  | TSafeFnOnCompleteErrorNonActionArgs<
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >;

interface TSafeFnOnCompleteSuccessArgs<
  in out TData,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput> {
  asAction: boolean;
  result: Result<TSafeFnReturnData<TData, TOutputSchema>, never>;
}

interface TSafeFnOnCompleteErrorActionArgs<
  in out TActionError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: true;
  result: Result<never, TSafeFnActionError<TActionError, TOutputSchema>>;
}

interface TSafeFnOnCompleteErrorNonActionArgs<
  in out TRunError,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: false;
  result: Result<never, TSafeFnRunError<TRunError, TOutputSchema>>;
}

export type TSafeFnOnComplete<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
> = (
  args: TSafeFnOnCompleteArgs<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >,
) => Promise<void>;
