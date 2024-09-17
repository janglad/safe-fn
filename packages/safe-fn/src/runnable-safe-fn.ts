import { ok, Result, ResultAsync, safeTry } from "neverthrow";

import {
  actionErr,
  actionOk,
  type InferAsyncErrError,
  type InferOkData,
} from "./result";

import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnInputParseError,
  TSafeFnOutputParseError,
} from "./types/error";
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
import type { TSafeFnInput, TSchemaOutputOrFallback } from "./types/schema";

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
import type {
  TAnySafeFnHandlerRes,
  TCtx,
  TCtxInput,
  TSafeFnHandlerArgs,
} from "./types/handler";
import {
  isFrameworkError,
  mapZodError,
  runCallbacks,
  safeZodAsyncParse,
  throwFrameworkErrorOrVoid,
} from "./util";

export type AnyRunnableSafeFn =
  | RunnableSafeFn<any, any, any, any, any, any>
  | RunnableSafeFn<any, any, any, never, any, any>;
export class RunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends TSafeFnInput,
  TOutputSchema extends TSafeFnInput,
  TUnparsedInput,
  THandlerRes extends TAnySafeFnHandlerRes,
  TThrownHandlerRes extends TAnySafeFnCatchHandlerRes,
> {
  readonly _internals: TSafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TThrownHandlerRes
  >;

  readonly _callBacks: TSafeFnCallBacks<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >;

  constructor(
    internals: TSafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TThrownHandlerRes
    >,
    callBacks: TSafeFnCallBacks<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
  }

  createAction(): TSafeFnAction<
    TParent,
    TInputSchema,
    TOutputSchema,
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
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TNewThrownHandlerRes
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      },
      this._callBacks as unknown as TSafeFnCallBacks<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TNewThrownHandlerRes
      >,
    );
  }

  onStart(onStartFn: TSafeFnOnStart<TUnparsedInput>) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onStart: onStartFn,
    });
  }
  onSuccess(
    onSuccessFn: TSafeFnOnSuccess<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >,
  ) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onSuccess: onSuccessFn,
    });
  }
  onError(
    onErrorFn: TSafeFnOnError<
      TParent,
      TInputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onError: onErrorFn,
    });
  }
  onComplete(
    onCompleteFn: TSafeFnOnComplete<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
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
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes,
    false
  > {
    return this._run(args[0], false)
      .map((res) => res.result)
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
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    TAsAction
  > {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const internals = this._internals;
    const parent = this._internals.parent;
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
            unsafeRawInput: args as TUnparsedInput,
          });

    type InternalOk = TSafeFnInternalRunReturnData<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;
    type InternalErr = TSafeFnInternalRunReturnError<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;

    const safeTryPromise: Promise<Result<InternalOk, InternalErr>> = safeTry(
      async function* () {
        const parentRes:
          | TInferSafeFnInternalRunReturnData<TParent, TAsAction>
          | undefined =
          internals.parent === undefined
            ? undefined
            : ((yield* internals.parent
                ._run(args, tAsAction)
                .mapErr(
                  (e) =>
                    ({
                      public: e.public as InferAsyncErrError<
                        TSafeFnReturn<
                          TParent,
                          TInputSchema,
                          TOutputSchema,
                          THandlerRes,
                          TThrownHandlerRes,
                          TAsAction
                        >
                      >,
                      private: {
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        ctx: undefined,
                        handlerRes: undefined,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap()) as TInferSafeFnInternalRunReturnData<
                TParent,
                TAsAction
              >);

        const ctx =
          parentRes === undefined
            ? {
                value: undefined,
                input: [],
              }
            : {
                value: parentRes.result,
                input: [...parentRes.ctx.input, parentRes.input],
              };

        const parsedInput: TSchemaOutputOrFallback<TInputSchema, undefined> =
          inputSchema === undefined
            ? (undefined as TSchemaOutputOrFallback<TInputSchema, undefined>)
            : yield* _parseInput(args, tAsAction)
                .mapErr(
                  (e) =>
                    ({
                      public: e,
                      private: {
                        ctx: {
                          value: ctx.value,
                          input: ctx.input as TCtxInput<TParent>,
                        } satisfies TCtx<TParent>,
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        handlerRes: undefined,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const handlerRes: InferOkData<THandlerRes> = yield* (
          await (async () => {
            const res = await handler({
              input: parsedInput as any,
              unsafeRawInput: args as any,
              ctx,
            } as TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>);
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
                  ctx: {
                    value: ctx.value,
                    input: ctx.input as TCtxInput<TParent>,
                  } satisfies TCtx<TParent>,
                  input: parsedInput,
                  unsafeRawInput: args as TUnparsedInput,
                  handlerRes: undefined,
                },
              }) satisfies InternalErr,
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
                        ctx: {
                          value: ctx.value,
                          input: ctx.input as TCtxInput<TParent>,
                        } satisfies TCtx<TParent>,
                        input: parsedInput,
                        handlerRes,
                        unsafeRawInput: args as TUnparsedInput,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const result: TSafeFnReturnData<TOutputSchema, THandlerRes> =
          parsedOutput === undefined
            ? (handlerRes as TSafeFnReturnData<TOutputSchema, THandlerRes>)
            : (parsedOutput as TSafeFnReturnData<TOutputSchema, THandlerRes>);
        return ok({
          result,
          input: parsedInput,
          ctx: {
            value: ctx.value,
            input: ctx.input as TCtxInput<TParent>,
          },
          unsafeRawInput: args as TUnparsedInput,
        } satisfies InternalOk);
      },
    );

    const internalRes: TSafeFnInternalRunReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
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
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await this._run(args[0], true)
      .map((res) => res.result)
      .mapErr((e) => e.public);

    if (res.isOk()) {
      return actionOk(res.value);
    }
    return actionErr(res.error);
  }
}
