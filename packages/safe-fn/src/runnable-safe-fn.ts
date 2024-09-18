import { ok, Result, ResultAsync, safeTry } from "neverthrow";

import {
  actionErr,
  actionOk,
  type InferAsyncErrError,
  type InferOkData,
} from "./result";

import type { TAnySafeFnCatchHandlerRes } from "./types/catch-handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  TInferSafeFnInternalRunReturnData,
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
import type { TSafeFnHandlerReturn } from "./types/handler";
import type { AnyObject, TODO } from "./types/util";
import {
  isFrameworkError,
  mapZodError,
  runCallbacks,
  safeZodAsyncParse,
  throwFrameworkErrorOrVoid,
} from "./util";

export type AnyRunnableSafeFn = TRunnableSafeFn<
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
  "run"
>;

type InferRunnableSafeFn<T> =
  T extends TRunnableSafeFn<
    infer TParent,
    infer TCtx,
    infer TCtxInput,
    infer TParentMergedHandlerErrs,
    infer TInputSchema,
    infer TMergedInputSchemaInput,
    infer TOutputSchema,
    infer TMergedParentOutputSchemaInput,
    infer TUnparsedInput,
    infer THandlerRes,
    infer TThrownHandlerRes,
    infer TPickArgs
  >
    ? RunnableSafeFn<
        TParent,
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
      >
    : never;

export type TRunnableSafeFnPickArgs =
  | "catch"
  | "onStart"
  | "onSuccess"
  | "onError"
  | "onComplete"
  | "run"
  | "createAction";

export type TRunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TCtx,
  TCtxInput extends unknown[],
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
  THandlerRes extends TSafeFnHandlerReturn<TOutputSchema>,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
  TPickArgs extends TRunnableSafeFnPickArgs,
> = Pick<
  RunnableSafeFn<
    TParent,
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
  TParent extends AnyRunnableSafeFn | undefined,
  TCtx,
  TCtxInput extends unknown[],
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
  THandlerRes extends TSafeFnHandlerReturn<TOutputSchema>,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
  TPickArgs extends TRunnableSafeFnPickArgs,
> {
  readonly _internals: TSafeFnInternals<
    TParent,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >;

  readonly _callBacks: TSafeFnCallBacks<
    TParent,
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

  constructor(
    internals: TSafeFnInternals<
      TParent,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
    callBacks: TSafeFnCallBacks<
      TParent,
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
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
  }

  createAction(): TSafeFnAction<
    TParentMergedHandlerErrs,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
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
    TParent,
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
    TParent,
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
    });
  }
  onSuccess(
    onSuccessFn: TSafeFnOnSuccess<
      TParent,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >,
  ): TRunnableSafeFn<
    TParent,
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
    });
  }
  onError(
    onErrorFn: TSafeFnOnError<
      TParent,
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
  ): TRunnableSafeFn<
    TParent,
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
    });
  }
  onComplete(
    onCompleteFn: TSafeFnOnComplete<
      TParent,
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
  ): TRunnableSafeFn<
    TParent,
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
    });
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
  ): TSafeFnReturn<
    TParentMergedHandlerErrs,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    THandlerRes,
    TThrownHandlerRes,
    false
  > {
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
    TParent,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    TAsAction
  > {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const parent = this._internals
      .parent as unknown as InferRunnableSafeFn<TParent>;
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
      TParent,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;
    type InternalErr = TSafeFnInternalRunReturnError<
      TParent,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;

    type ParentRes =
      | TInferSafeFnInternalRunReturnData<TParent, TAsAction>
      | undefined;

    const safeTryPromise: Promise<Result<InternalOk, InternalErr>> = safeTry(
      async function* () {
        const parentRes:
          | TInferSafeFnInternalRunReturnData<TParent, TAsAction>
          | undefined =
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
                          TParentMergedHandlerErrs,
                          TMergedInputSchemaInput,
                          TOutputSchema,
                          TMergedParentOutputSchemaInput,
                          THandlerRes,
                          TThrownHandlerRes,
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

        const value: TSafeFnReturnData<TOutputSchema, THandlerRes> =
          parsedOutput === undefined
            ? (handlerRes as TSafeFnReturnData<TOutputSchema, THandlerRes>)
            : (parsedOutput as TSafeFnReturnData<TOutputSchema, THandlerRes>);
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
      TParent,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
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
    });

    const withCallbacks = runCallbacks({
      resultAsync: internalRes,
      asAction: tAsAction,
      callbacks: _callBacks,
      hotOnStartCallback: onStartCallback,
    });

    return withCallbacks;
  }

  async _runAsAction(
    ...args: TSafeFnActionArgs<TUnparsedInput>
  ): TSafeFnActionReturn<
    TParentMergedHandlerErrs,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await this._run(args[0], true)
      .map((res) => res.value)
      .mapErr((e) => e.public);

    if (res.isOk()) {
      return actionOk(res.value);
    }
    return actionErr(res.error);
  }
}
