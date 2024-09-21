import type { Result } from "neverthrow";
import type { TRunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";
import type {
  AnyCtxInput,
  TAnySafeFnHandlerRes,
  TSafeFnHandlerArgs,
} from "./handler";
import type { TSafeFnReturnData, TSafeFnReturnError } from "./run";
import type {
  TSafeFnInput,
  TSafeFnOutput,
  TSafeFnUnparsedInput,
} from "./schema";
import type { AnyObject, FirstTupleElOrUndefined, TPrettify } from "./util";

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
    infer TParentMergedHandlerErrs,
    infer TInputSchema,
    infer TMergedInputSchemaInput,
    infer TOutputSchema,
    infer TMergedParentOutputSchemaInput,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TCatchHandlerRes,
    any
  >
    ? TSafeFnCallBacks<
        TCtx,
        TCtxInput,
        TParentMergedHandlerErrs,
        TInputSchema,
        TMergedInputSchemaInput,
        TOutputSchema,
        TMergedParentOutputSchemaInput,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    : never;

export interface TSafeFnCallBacks<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> {
  onStart: TSafeFnOnStart<TUnparsedInput> | undefined;
  onSuccess:
    | TSafeFnOnSuccess<
        TCtx,
        TCtxInput,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes
      >
    | undefined;
  onError:
    | TSafeFnOnError<
        TCtx,
        TCtxInput,
        TParentMergedHandlerErrs,
        TInputSchema,
        TMergedInputSchemaInput,
        TOutputSchema,
        TMergedParentOutputSchemaInput,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
  onComplete:
    | TSafeFnOnComplete<
        TCtx,
        TCtxInput,
        TParentMergedHandlerErrs,
        TInputSchema,
        TMergedInputSchemaInput,
        TOutputSchema,
        TMergedParentOutputSchemaInput,
        TUnparsedInput,
        THandlerRes,
        TCatchHandlerRes
      >
    | undefined;
}
export type TSafeFnOnStart<in out TUnparsedInput extends TSafeFnUnparsedInput> =
  (args: {
    unsafeRawInput: TPrettify<FirstTupleElOrUndefined<TUnparsedInput>>;
  }) => Promise<void>;

export interface TSafeFnOnSuccessArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput> {
  value: TSafeFnReturnData<TOutputSchema, THandlerRes>;
}

export type TSafeFnOnSuccess<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> = (
  args: TSafeFnOnSuccessArgs<
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes
  >,
) => Promise<void>;

// Temporary, will be fixed when I fix types in general
type TToOptionalSafeFnArgs<T> = {
  [K in keyof T]: K extends "unsafeRawInput" ? T[K] : T[K] | undefined;
};

export type TSafeFnOnErrorArgs<
  TCtx,
  TCtxInput extends AnyCtxInput,
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnOutput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnErrorActionArgs<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes
    >
  | TSafeFnOnErrorNonActionArgs<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TCatchHandlerRes
    >;
interface TSafeFnOnErrorActionArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: true;
  error: TSafeFnReturnError<
    TParentMergedHandlerErrs,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    THandlerRes,
    TCatchHandlerRes,
    true
  >;
}

interface TSafeFnOnErrorNonActionArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: false;
  error: TSafeFnReturnError<
    TParentMergedHandlerErrs,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    THandlerRes,
    TCatchHandlerRes,
    false
  >;
}

export type TSafeFnOnError<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> = (
  args: TSafeFnOnErrorArgs<
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TCatchHandlerRes
  >,
) => Promise<void>;

export type TSafeFnOnCompleteArgs<
  TCtx,
  TCtxInput extends AnyCtxInput,
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnCompleteErrorArgs<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >
  | TSafeFnOnCompleteSuccessArgs<
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >;

type TSafeFnOnCompleteErrorArgs<
  TCtx,
  TCtxInput extends AnyCtxInput,
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnCompleteErrorActionArgs<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >
  | TSafeFnOnCompleteErrorNonActionArgs<
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >;

interface TSafeFnOnCompleteSuccessArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput> {
  asAction: boolean;
  result: Result<TSafeFnReturnData<TOutputSchema, THandlerRes>, never>;
}

interface TSafeFnOnCompleteErrorActionArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: true;
  result: Result<
    never,
    TSafeFnReturnError<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TThrownHandlerRes,
      true
    >
  >;
}

interface TSafeFnOnCompleteErrorNonActionArgs<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
  > {
  asAction: false;
  result: Result<
    never,
    TSafeFnReturnError<
      TParentMergedHandlerErrs,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      THandlerRes,
      TThrownHandlerRes,
      false
    >
  >;
}

export type TSafeFnOnComplete<
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> = (
  args: TSafeFnOnCompleteArgs<
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >,
) => Promise<void>;
