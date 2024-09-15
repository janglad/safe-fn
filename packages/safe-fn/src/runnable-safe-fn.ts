import { ok, Result, ResultAsync, safeTry } from "neverthrow";

import { actionErr, actionOk, type InferErrError } from "./result";

import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnInputParseError,
  TSafeFnOutputParseError,
} from "./types/error";
import type { TSafeFnInternals } from "./types/internals";
import type {
  TSafeFnInternalRunReturn,
  TSafeFnReturn,
  TSafeFnRunArgs,
  TSafeFnSuperInternalRunReturn,
  TSafeFnSuperInternalRunReturnData,
  TSafeFnSuperInternalRunReturnError,
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
import type { TAnySafeFnHandlerRes, TSafeFnHandlerArgs } from "./types/handler";
import type { TODO } from "./types/util";
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
    TUnparsedInput
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
      TUnparsedInput
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
    return this._run(args[0], false, false) as TSafeFnReturn<
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
          const cause = mapZodError(error.cause as any);
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
          const cause = mapZodError(error.cause as any);
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

  _run<TAsAction extends boolean, TAsProcedure extends boolean>(
    args: TSafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
    tAsProcedure: TAsProcedure,
  ): TSafeFnInternalRunReturn<
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

    type InternalOk = TSafeFnSuperInternalRunReturnData<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes,
      TAsAction
    >;
    type InternalErr = TSafeFnSuperInternalRunReturnError<
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
          } as TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>)
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

    const internalRes: TSafeFnSuperInternalRunReturn<
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
      }) as TSafeFnInternalRunReturn<
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
    ...args: TSafeFnActionArgs<TUnparsedInput>
  ): TSafeFnActionReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await (this._run(args[0], true, false) as TSafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      true
    >);

    if (res.isOk()) {
      return actionOk(res.value) as Awaited<
        TSafeFnActionReturn<
          TParent,
          TInputSchema,
          TOutputSchema,
          THandlerRes,
          TThrownHandlerRes
        >
      >;
    }
    return actionErr(res.error) as Awaited<
      TSafeFnActionReturn<
        TParent,
        TInputSchema,
        TOutputSchema,
        THandlerRes,
        TThrownHandlerRes
      >
    >;
  }
}
