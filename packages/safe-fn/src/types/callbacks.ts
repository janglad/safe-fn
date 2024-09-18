import type { Err, Ok } from "neverthrow";
import type { AnyRunnableSafeFn, RunnableSafeFn } from "../runnable-safe-fn";
import type { TAnySafeFnCatchHandlerRes } from "./error";
import type { TAnySafeFnHandlerRes, TSafeFnHandlerArgs } from "./handler";
import type { TSafeFnReturnData, TSafeFnReturnError } from "./run";
import type { TSafeFnInput, TSafeFnOutput } from "./schema";
import type { AnyObject, TPrettify } from "./util";

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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput,
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
export type TSafeFnOnStart<in out TUnparsedInput> = (args: {
  unsafeRawInput: TPrettify<TUnparsedInput>;
}) => Promise<void>;

export interface TSafeFnOnSuccessArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  value: TSafeFnReturnData<TOutputSchema, THandlerRes>;
}

export type TSafeFnOnSuccess<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TOutputSchema extends TSafeFnOutput,
  in out TUnparsedInput,
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
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnOutput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnErrorActionArgs<
      TParent,
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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: true;
  error: TSafeFnReturnError<
    TParent,
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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: false;
  error: TSafeFnReturnError<
    TParent,
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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnOutput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TCatchHandlerRes extends TAnySafeFnCatchHandlerRes,
> = (
  args: TSafeFnOnErrorArgs<
    TParent,
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
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnCompleteErrorArgs<
      TParent,
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
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> =
  | TSafeFnOnCompleteErrorActionArgs<
      TParent,
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
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
> extends TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent> {
  asAction: boolean;
  result: Ok<TSafeFnReturnData<TOutputSchema, THandlerRes>, never>;
}

interface TSafeFnOnCompleteErrorActionArgs<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: true;
  result: Err<
    never,
    TSafeFnReturnError<
      TParent,
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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> extends TToOptionalSafeFnArgs<
    TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
  > {
  asAction: false;
  result: Err<
    never,
    TSafeFnReturnError<
      TParent,
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
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput,
  in out THandlerRes extends TAnySafeFnHandlerRes,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> = (
  args: TSafeFnOnCompleteArgs<
    TParent,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >,
) => Promise<void>;
