import { ok, Result, ResultAsync, safeTry } from "neverthrow";

import type { ZodTypeAny } from "zod";
import { actionErr, actionOk, type InferErrError } from "./result";
import type {
  AnySafeFnCatchHandlerRes,
  AnySafeFnHandlerRes,
  ErrorObj,
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
  TCtx,
  TInputSchema extends SafeFnInput,
  TMergedInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TParentErr extends ErrorObj | undefined,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
> {
  readonly _internals: SafeFnInternals<
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _callBacks: SafeFnCallBacks<
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TParentErr,
    TThrownHandlerRes
  >;

  constructor(
    internals: SafeFnInternals<
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: SafeFnCallBacks<
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
      TThrownHandlerRes
    >,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
  }

  createAction(): SafeFnAction<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TParentErr,
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
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TParentErr,
    TNewThrownHandlerRes
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      },
      this._callBacks as unknown as SafeFnCallBacks<
        TCtx,
        TInputSchema,
        TMergedInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TParentErr,
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
      TCtx,
      TMergedInputSchema,
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
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
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
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
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
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TParentErr,
    TThrownHandlerRes,
    false
  > {
    return this._run(args[0], false, false) as SafeFnReturn<
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TParentErr,
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
    TOutputSchema extends ZodTypeAny
      ? SafeFnOutputParseError<TOutputSchema, TAsAction>
      : never
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
          };
        }

        return {
          code: "OUTPUT_PARSING",
          cause: error.cause,
        } as any;
      },
    );
  }

  _run<TAsAction extends boolean, TAsProcedure extends boolean>(
    args: SafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
    tAsProcedure: TAsProcedure,
  ): SafeFnInternalRunReturn<
    TCtx,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TParentErr,
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
      TCtx,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
      TThrownHandlerRes,
      TAsAction
    >;
    type InternalErr = SafeFnSuperInternalRunReturnError<
      TCtx,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
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
                  (e: TODO) =>
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
          } as SafeFnHandlerArgs<TCtx, TMergedInputSchema, TUnparsedInput>)
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
      TCtx,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
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
      })) as TODO;

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
      TCtx,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TParentErr,
      TThrownHandlerRes,
      TAsAction,
      TAsProcedure
    >;
  }

  async _runAsAction(
    ...args: SafeFnActionArgs<TUnparsedInput>
  ): SafeFnActionReturn<
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TParentErr,
    TThrownHandlerRes
  > {
    const res = await (this._run(args[0], true, false) as SafeFnReturn<
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TParentErr,
      TThrownHandlerRes,
      true
    >);

    if (res.isOk()) {
      return actionOk(res.value) as Awaited<
        SafeFnActionReturn<
          TInputSchema,
          TOutputSchema,
          THandlerRes,
          TParentErr,
          TThrownHandlerRes
        >
      >;
    }
    return actionErr(res.error) as Awaited<
      SafeFnActionReturn<
        TInputSchema,
        TOutputSchema,
        THandlerRes,
        TParentErr,
        TThrownHandlerRes
      >
    >;
  }
}
