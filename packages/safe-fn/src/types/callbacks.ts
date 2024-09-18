import type { Err, Ok, Result } from "neverthrow";
import type { AnyRunnableSafeFn, RunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./catch-handler";
import type { TAnySafeFnHandlerRes, TSafeFnHandlerArgs } from "./handler";
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
  T extends RunnableSafeFn<
    infer TParent,
    infer TParentMergedHandlerErrs,
    infer TInputSchema,
    infer TMergedInputSchemaInput,
    infer TOutputSchema,
    infer TMergedParentOutputSchemaInput,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TCatchHandlerRes
  >
    ? TSafeFnCallBacks<
        TParent,
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
  in out TParent extends AnyRunnableSafeFn | undefined,
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
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes
      >
    | undefined;
  onError:
    | TSafeFnOnError<
        TParent,
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
        TParent,
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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  value: TSafeFnReturnData<TOutputSchema, THandlerRes>;
}

export type TSafeFnOnSuccess<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> = (
  args: TSafeFnOnSuccessArgs<
    TParent,
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
  TParent extends AnyRunnableSafeFn | undefined,
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
      TParent,
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
      TParent,
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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
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
  in out TParent extends AnyRunnableSafeFn | undefined,
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
    TParent,
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
  TParent extends AnyRunnableSafeFn | undefined,
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
      TParent,
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
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >;

type TSafeFnOnCompleteErrorArgs<
  TParent extends AnyRunnableSafeFn | undefined,
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
      TParent,
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
      TParent,
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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnInput,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  asAction: boolean;
  result: Ok<TSafeFnReturnData<TOutputSchema, THandlerRes>, never>;
}

interface TSafeFnOnCompleteErrorActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: true;
  result: Err<
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
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: false;
  result: Err<
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
  in out TParent extends AnyRunnableSafeFn | undefined,
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
    TParent,
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
