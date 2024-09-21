import { ok, type Result, ResultAsync, safeTry } from "neverthrow";

import {
  actionErr,
  actionOk,
  type InferAsyncErrError,
  type InferErrError,
  type InferOkData,
} from "./result";

import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnDefaultCatchHandlerErrError,
} from "./types/catch-handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  TSafeFnInternalRunReturn,
  TSafeFnInternalRunReturnData,
  TSafeFnInternalRunReturnError,
  TSafeFnReturn,
  TSafeFnReturnData,
  TSafeFnRunArgs,
} from "./types/run";
import type {
  TSafeFnInput,
  TSafeFnInputParseError,
  TSafeFnOutputParseError,
  TSafeFnUnparsedInput,
  TSchemaOutputOrFallback,
} from "./types/schema";

import type {
  TSafeFnAction,
  TSafeFnActionArgs,
  TSafeFnActionReturn,
} from "./types/action";
import type {
  TSafeFnCallBacks,
  TSafeFnOnComplete,
  TSafeFnOnError,
  TSafeFnOnStart,
  TSafeFnOnSuccess,
} from "./types/callbacks";
import type { AnyCtxInput, TSafeFnHandlerReturn } from "./types/handler";
import type { AnyObject, TODO } from "./types/util";
import {
  isFrameworkError,
  mapZodError,
  runCallbacks,
  safeZodAsyncParse,
  throwFrameworkErrorOrVoid,
} from "./util";

export type TInferSafeFnOkData2<T> =
  T extends TRunnableSafeFn<
    infer TData,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TData
    : never;

export type TInferSafeFnRunErr<T> =
  T extends TRunnableSafeFn<
    any,
    infer TRunErr,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TRunErr
    : never;

export type TInferSafeFnActionErr<T> =
  T extends TRunnableSafeFn<
    any,
    any,
    infer TActionErr,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? TActionErr
    : never;

export interface TAnyRunnableSafeFn
  extends TRunnableSafeFn<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  > {}

type AnyRunnableSafeFn = RunnableSafeFn<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type TRunnableSafeFnPickArgs =
  | "catch"
  | "onStart"
  | "onSuccess"
  | "onError"
  | "onComplete"
  | "run"
  | "createAction";

export type TRunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TSafeFnHandlerReturn<TOutputSchema>,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> = Pick<
  RunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    TPickArgs
  >,
  TPickArgs
>;

export class RunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out THandlerRes extends TSafeFnHandlerReturn<TOutputSchema>,
  in out TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> {
  readonly _internals: TSafeFnInternals<
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >;

  readonly _callBacks: TSafeFnCallBacks<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  constructor(
    internals: TSafeFnInternals<
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
    callBacks: TSafeFnCallBacks<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
  }

  createAction(): TSafeFnAction<
    TData,
    TRunErr,
    TActionErr,
    TOutputSchema,
    TUnparsedInput
  > {
    // TODO: strip stack traces etc here
    return this._runAsAction.bind(this);
  }

  /*
################################
||                            ||
||          Builder           ||
||                            ||
################################
*/

  catch<TNewThrownHandlerRes extends TAnySafeFnCatchHandlerRes>(
    handler: (error: unknown) => TNewThrownHandlerRes,
  ): TRunnableSafeFn<
    TData,
    | Exclude<TRunErr, TSafeFnDefaultCatchHandlerErrError>
    | InferErrError<TNewThrownHandlerRes>,
    | Exclude<TActionErr, TSafeFnDefaultCatchHandlerErrError>
    | InferErrError<TNewThrownHandlerRes>,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TNewThrownHandlerRes,
    Exclude<TPickArgs, "catch">
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      } as TODO,
      this._callBacks as TODO,
    ) as TODO;
  }

  onStart(
    onStartFn: TSafeFnOnStart<TUnparsedInput>,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    Exclude<TPickArgs, "onStart">
  > {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onStart: onStartFn,
    }) as TODO;
  }
  onSuccess(
    onSuccessFn: TSafeFnOnSuccess<
      TData,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    Exclude<TPickArgs, "onSuccess">
  > {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onSuccess: onSuccessFn,
    }) as TODO;
  }
  onError(
    onErrorFn: TSafeFnOnError<
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    Exclude<TPickArgs, "onError">
  > {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onError: onErrorFn,
    }) as TODO;
  }
  onComplete(
    onCompleteFn: TSafeFnOnComplete<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    Exclude<TPickArgs, "onComplete">
  > {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onComplete: onCompleteFn,
    }) as TODO;
  }

  /*
################################
||                            ||
||            Run             ||
||                            ||
################################
  */
  run(
    ...args: TSafeFnRunArgs<TUnparsedInput>
  ): TSafeFnReturn<TData, TRunErr, TActionErr, TOutputSchema, false> {
    return this._run(args[0], false)
      .map((res) => res.value)
      .mapErr((e) => e.public);
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  _parseInput<TAsAction extends boolean = false>(
    input: unknown,
    asAction: TAsAction,
  ): ResultAsync<
    TSchemaOutputOrFallback<TInputSchema, never>,
    TSafeFnInputParseError<TInputSchema, TAsAction>
  > {
    if (this._internals.inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    return safeZodAsyncParse(this._internals.inputSchema, input).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        if (asAction) {
          const cause = mapZodError(error.cause);
          return {
            code: "INPUT_PARSING",
            cause,
          } as TSafeFnInputParseError<TInputSchema, TAsAction>;
        }

        return {
          code: "INPUT_PARSING",
          cause: error.cause,
        } as TSafeFnInputParseError<TInputSchema, TAsAction>;
      },
    );
  }

  _parseOutput<TAsAction extends boolean = false>(
    output: unknown,
    asAction: TAsAction,
  ): ResultAsync<
    TSchemaOutputOrFallback<TOutputSchema, never>,
    TSafeFnOutputParseError<TOutputSchema, TAsAction>
  > {
    if (this._internals.outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    return safeZodAsyncParse(this._internals.outputSchema, output).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        if (asAction) {
          const cause = mapZodError(error.cause);
          return {
            code: "OUTPUT_PARSING",
            cause,
          } as TSafeFnOutputParseError<TOutputSchema, TAsAction>;
        }

        return {
          code: "OUTPUT_PARSING",
          cause: error.cause,
        } as TSafeFnOutputParseError<TOutputSchema, TAsAction>;
      },
    );
  }

  _run<TAsAction extends boolean>(
    args: TSafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
  ): TSafeFnInternalRunReturn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TAsAction
  > {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const parent = this._internals.parent as AnyRunnableSafeFn | undefined;
    const uncaughtErrorHandler = this._internals.uncaughtErrorHandler;
    const _parseOutput = this._parseOutput.bind(this);
    const _parseInput = this._parseInput.bind(this);
    const _callBacks = this._callBacks;
    const onStartCallback: ResultAsync<void, void> | undefined =
      _callBacks.onStart === undefined
        ? undefined
        : ResultAsync.fromThrowable(
            _callBacks.onStart,
            throwFrameworkErrorOrVoid,
          )({
            unsafeRawInput: args as TODO,
          });

    type InternalOk = TSafeFnInternalRunReturnData<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TAsAction
    >;
    type InternalErr = TSafeFnInternalRunReturnError<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TAsAction
    >;

    const safeTryPromise: Promise<Result<InternalOk, InternalErr>> = safeTry(
      async function* () {
        const parentRes: any | undefined =
          parent === undefined
            ? undefined
            : yield* parent
                ._run(args, tAsAction)
                .map((res) => ({
                  ...res,
                  ctxInput: [...res.ctxInput, res.input],
                }))
                .mapErr(
                  (e) =>
                    ({
                      public: e.public as InferAsyncErrError<
                        TSafeFnReturn<
                          TData,
                          TRunErr,
                          TActionErr,
                          TOutputSchema,
                          TAsAction
                        >
                      >,
                      private: {
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        ctx: undefined,
                        ctxInput:
                          e.private.ctxInput === undefined
                            ? []
                            : [...e.private.ctxInput, e.private.input],
                        handlerRes: undefined,
                      } as TODO,
                    }) satisfies InternalErr,
                )
                .safeUnwrap() as TODO;

        const parsedInput: TSchemaOutputOrFallback<TInputSchema, undefined> =
          inputSchema === undefined
            ? (undefined as TSchemaOutputOrFallback<TInputSchema, undefined>)
            : yield* _parseInput(args, tAsAction)
                .mapErr(
                  (e) =>
                    ({
                      public: e as TODO,
                      private: {
                        ctx: parentRes?.value,
                        ctxInput: parentRes?.ctxInput || [],
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        handlerRes: undefined,
                      } as TODO,
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const handlerRes: InferOkData<THandlerRes> = yield* (
          await (async () => {
            const res = await handler({
              input: parsedInput,
              unsafeRawInput: args as TODO,
              ctx: parentRes?.value,
              ctxInput: parentRes?.ctxInput || [],
            } as TODO);
            if (!res) {
              // This should never happen, will cause Typescript to error out.
              throw new Error("Handler did not return a result");
            }
            return res;
          })()
        )
          .mapErr(
            (e) =>
              ({
                public: e,
                private: {
                  ctx: parentRes?.value,
                  ctxInput: parentRes?.ctxInput || [],
                  input: parsedInput,
                  unsafeRawInput: args as TUnparsedInput,
                  handlerRes: undefined,
                },
              }) as TODO satisfies InternalErr,
          )
          .safeUnwrap();

        const parsedOutput: TSchemaOutputOrFallback<TOutputSchema, undefined> =
          outputSchema === undefined
            ? (undefined as TSchemaOutputOrFallback<TOutputSchema, undefined>)
            : yield* _parseOutput(handlerRes, tAsAction)
                .mapErr(
                  (e) =>
                    ({
                      public: e as any,
                      private: {
                        ctx: parentRes?.value,
                        ctxInput: parentRes?.ctxInput || [],
                        input: parsedInput,
                        handlerRes,
                        unsafeRawInput: args as TUnparsedInput,
                      },
                    }) as TODO satisfies InternalErr,
                )
                .safeUnwrap();

        const value: TSafeFnReturnData<TData, TOutputSchema> =
          parsedOutput === undefined
            ? (handlerRes as TSafeFnReturnData<TData, TOutputSchema>)
            : (parsedOutput as TSafeFnReturnData<TData, TOutputSchema>);
        return ok({
          value,
          input: parsedInput,
          ctx: parentRes?.value,
          ctxInput: (parentRes?.ctxInput as TODO) || [],
          unsafeRawInput: args as TUnparsedInput,
        } satisfies InternalOk);
      },
    ) as TODO;

    const internalRes: TSafeFnInternalRunReturn<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TAsAction
    > = ResultAsync.fromPromise(safeTryPromise, (error) => {
      if (isFrameworkError(error)) {
        throw error;
      }
      const handledErr = uncaughtErrorHandler(error);
      if (handledErr.isOk()) {
        throw new Error("uncaught error handler returned ok");
      }
      return {
        public: handledErr.error,
        private: {
          unsafeRawInput: args as TUnparsedInput,
          input: undefined,
          ctx: undefined,
          ctxInput: undefined,
          handlerRes: undefined,
        },
      };
    }).andThen((res) => {
      return res;
    }) as TODO;

    const withCallbacks = runCallbacks({
      resultAsync: internalRes as TODO,
      asAction: tAsAction,
      callbacks: _callBacks,
      hotOnStartCallback: onStartCallback,
    });

    return withCallbacks;
  }

  async _runAsAction(
    ...args: TSafeFnActionArgs<TUnparsedInput>
  ): TSafeFnActionReturn<TData, TRunErr, TActionErr, TOutputSchema> {
    const res = await this._run(args[0], true)
      .map((res) => res.value)
      .mapErr((e) => e.public);

    if (res.isOk()) {
      return actionOk(res.value);
    }
    return actionErr(res.error);
  }
}
