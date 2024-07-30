import type { ZodTypeAny, z } from "zod";
import type {
  AnyResult,
  Err,
  InferErrError,
  InferOkData,
  Result,
} from "./result";

type TODO = any;

export type MaybePromise<T> = T | Promise<T>;

export type SafeFnInput = z.ZodTypeAny | undefined;
export type SafeFnOutput = z.ZodTypeAny | undefined;

export type SchemaInputOrFallback<
  TSchema extends SafeFnInput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.input<TSchema> : TFallback;
export type SchemaOutputOrFallback<
  TSchema extends SafeFnOutput,
  TFallback,
> = TSchema extends ZodTypeAny ? z.output<TSchema> : TFallback;

type SafeFnActionArgs<TInputSchema extends SafeFnInput, TUnparsedInput> = {
  parsedInput: SchemaOutputOrFallback<TInputSchema, never>;
  unparsedInput: SchemaInputOrFallback<TInputSchema, TUnparsedInput>;
};

type SafeFnActionReturn<TOutputSchema extends SafeFnOutput> = Result<
  SchemaOutputOrFallback<TOutputSchema, any>,
  TODO
>;

export type SafeFnActionFn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
> = (
  args: SafeFnActionArgs<TInputSchema, TUnparsedInput>,
) => MaybePromise<SafeFnActionReturn<TOutputSchema>>;

export type AnySafeFnActionFn = SafeFnActionFn<any, any, any>;

export type SafeFnReturnData<
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
> = SchemaOutputOrFallback<
  TOutputSchema,
  InferOkData<Awaited<ReturnType<TActionFn>>>
>;

export type SafeFnReturnError<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
  TThrownHandler extends AnySafeFnThrownHandler,
> =
  | InferErrError<Awaited<ReturnType<TActionFn>>>
  | InferErrError<Awaited<ReturnType<TThrownHandler>>>
  | SafeFnInputParseError<TInputSchema>
  | SafeFnOutputParseError<TOutputSchema>;

export type SafeFnInputParseError<TInputSchema extends SafeFnInput> =
  TInputSchema extends z.ZodTypeAny
    ? {
        code: "INPUT_PARSING";
        cause: z.ZodError<TInputSchema>;
      }
    : never;

export type SafeFnOutputParseError<TOutputSchema extends SafeFnOutput> =
  TOutputSchema extends z.ZodTypeAny
    ? {
        code: "OUTPUT_PARSING";
        cause: z.ZodError<TOutputSchema>;
      }
    : never;

export type SafeFnRunArgs<
  TInputSchema extends SafeFnInput,
  TActionFn extends AnySafeFnActionFn,
> = SchemaInputOrFallback<
  TInputSchema,
  Parameters<TActionFn>[0]["unparsedInput"]
>;

export type SafeFnReturn<
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TActionFn extends AnySafeFnActionFn,
  TThrownHandler extends AnySafeFnThrownHandler,
> = Result<
  SafeFnReturnData<TOutputSchema, TActionFn>,
  SafeFnReturnError<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
>;

export type AnySafeFnThrownHandler = (
  error: unknown,
) => MaybePromise<AnyResult>;

export const SafeFnDefaultThrownHandlerMessage = "Uncaught error" as const;
export type SafeFnDefaultThrowHandler = () => Err<
  typeof SafeFnDefaultThrownHandlerMessage
>;
export const SafeFnDefaultActionMessage = "No action provided" as const;
export type SafeFnDefaultActionFn = () => Err<
  typeof SafeFnDefaultActionMessage
>;
