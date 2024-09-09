import { ok, Result, ResultAsync, safeTry } from "neverthrow";

import { actionErr, actionOk, type InferErrError } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnCatchHandlerRes,
  AnySafeFnHandlerRes,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnCallBacks,
  SafeFnHandlerArgs,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnInternalRunReturn,
  SafeFnInternals,
  SafeFnOnComplete,
  SafeFnOnError,
  SafeFnOnStart,
  SafeFnOnSuccess,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
  SafeFnSuperInternalRunReturn,
  SafeFnSuperInternalRunReturnData,
  SafeFnSuperInternalRunReturnError,
  SchemaOutputOrFallback,
  TODO,
} from "./types";
import {
  isFrameworkError,
  mapZodError,
  runCallbacks,
  safeZodAsyncParse,
  throwFrameworkErrorOrVoid,
} from "./util";

export class RunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TCtx,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> {
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _callBacks: SafeFnCallBacks<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >;

  constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: SafeFnCallBacks<
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

  createAction(): SafeFnAction<
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

  catch<TNewThrownHandlerRes extends AnySafeFnCatchHandlerRes>(
    handler: (error: unknown) => TNewThrownHandlerRes,
  ): RunnableSafeFn<
    TParent,
    TCtx,
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
      this._callBacks as unknown as SafeFnCallBacks<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TNewThrownHandlerRes
      >,
    );
  }

  onStart(onStartFn: SafeFnOnStart<TUnparsedInput>) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onStart: onStartFn,
    });
  }
  onSuccess(
    onSuccessFn: SafeFnOnSuccess<
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
    onErrorFn: SafeFnOnError<
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
    onCompleteFn: SafeFnOnComplete<
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
    ...args: SafeFnRunArgs<TUnparsedInput>
  ): SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes,
    false
  > {
    return this._run(args[0], false, false) as SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      false
    >;
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
    SchemaOutputOrFallback<TInputSchema, never>,
    SafeFnInputParseError<TInputSchema, TAsAction>
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
          const cause = mapZodError(error.cause as any);
          return {
            code: "INPUT_PARSING",
            cause,
          } as SafeFnInputParseError<TInputSchema, TAsAction>;
        }

        return {
          code: "INPUT_PARSING",
          cause: error.cause,
        } as SafeFnInputParseError<TInputSchema, TAsAction>;
      },
    );
  }

  _parseOutput<TAsAction extends boolean = false>(
    output: unknown,
    asAction: TAsAction,
  ): ResultAsync<
    SchemaOutputOrFallback<TOutputSchema, never>,
    SafeFnOutputParseError<TOutputSchema, TAsAction>
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
          const cause = mapZodError(error.cause as any);
          return {
            code: "OUTPUT_PARSING",
            cause,
          } as SafeFnOutputParseError<TOutputSchema, TAsAction>;
        }

        return {
          code: "OUTPUT_PARSING",
          cause: error.cause,
        } as SafeFnOutputParseError<TOutputSchema, TAsAction>;
      },
    );
  }

  _run<TAsAction extends boolean, TAsProcedure extends boolean>(
    args: SafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
    tAsProcedure: TAsProcedure,
  ): SafeFnInternalRunReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes,
    TAsAction,
    TAsProcedure
  > {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
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

    type InternalOk = SafeFnSuperInternalRunReturnData<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;
    type InternalErr = SafeFnSuperInternalRunReturnError<
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
        const { result: parentHandlerRes, input: parentParsedInput } =
          parent === undefined
            ? { result: undefined, input: undefined }
            : yield* parent
                ._run(args, tAsAction, true)
                .mapErr(
                  (e) =>
                    ({
                      public: e as TODO,
                      private: {
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        ctx: undefined,
                        handlerRes: undefined,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const parsedInput =
          inputSchema === undefined
            ? parentParsedInput
            : yield* _parseInput(args, tAsAction)
                .map((res) => ({
                  ...parentParsedInput,
                  ...res,
                }))
                .mapErr(
                  (e) =>
                    ({
                      public: e,
                      private: {
                        ctx: parentHandlerRes,
                        unsafeRawInput: args as TUnparsedInput,
                        input: undefined,
                        handlerRes: undefined,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const handlerRes = yield* (
          await handler({
            input: parsedInput,
            unsafeRawInput: args,
            ctx: parentHandlerRes,
          } as SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>)
        )
          .mapErr(
            (e) =>
              ({
                public: e,
                private: {
                  ctx: parentHandlerRes,
                  input: parsedInput,
                  unsafeRawInput: args as TUnparsedInput,
                  handlerRes: undefined,
                },
              }) satisfies InternalErr,
          )
          .safeUnwrap();

        const parsedOutput =
          outputSchema === undefined
            ? undefined
            : yield* _parseOutput(handlerRes, tAsAction)
                .mapErr(
                  (e) =>
                    ({
                      public: e as TODO,
                      private: {
                        ctx: parentHandlerRes,
                        input: parsedInput,
                        handlerRes,
                        unsafeRawInput: args as TUnparsedInput,
                      },
                    }) satisfies InternalErr,
                )
                .safeUnwrap();

        const res = parsedOutput === undefined ? handlerRes : parsedOutput;

        return ok({
          result: res,
          input: parsedInput,
          ctx: parentHandlerRes,
          unsafeRawInput: args as TUnparsedInput,
        });
      },
    );

    const internalRes: SafeFnSuperInternalRunReturn<
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
      const handledErr = uncaughtErrorHandler(
        error,
      ) as InferErrError<TThrownHandlerRes>;
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
    })
      .andThen((res) => {
        return res;
      })
      .map((res) => ({
        ...res,
        unsafeRawInput: args as TUnparsedInput,
      }));

    const withCallbacks = runCallbacks({
      resultAsync: internalRes,
      asAction: tAsAction,
      callbacks: _callBacks,
      hotOnStartCallback: onStartCallback,
      unsafeRawInput: args as TUnparsedInput,
    });

    return withCallbacks
      .mapErr((e) => e.public)
      .map((res) => {
        if (tAsProcedure) {
          return res;
        } else {
          return res.result;
        }
      }) as SafeFnInternalRunReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction,
      TAsProcedure
    >;
  }

  async _runAsAction(
    ...args: SafeFnActionArgs<TUnparsedInput>
  ): SafeFnActionReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await (this._run(args[0], true, false) as SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      true
    >);

    if (res.isOk()) {
      return actionOk(res.value) as Awaited<
        SafeFnActionReturn<
          TParent,
          TInputSchema,
          TOutputSchema,
          THandlerRes,
          TThrownHandlerRes
        >
      >;
    }
    return actionErr(res.error) as Awaited<
      SafeFnActionReturn<
        TParent,
        TInputSchema,
        TOutputSchema,
        THandlerRes,
        TThrownHandlerRes
      >
    >;
  }
}
