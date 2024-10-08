import { ok, type Result, ResultAsync, safeTry } from "neverthrow";

import { actionErr, actionOk, type InferErrError } from "./result";

import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnDefaultCatchHandlerErrError,
} from "./types/catch-handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  TSafeFnInternalRunReturn,
  TSafeFnInternalRunReturnData,
  TSafeFnInternalRunReturnError,
  TSafeFnReturnData,
  TSafeFnReturnError,
  TSafeFnRunArgs,
  TSafeFnRunReturn,
} from "./types/run";
import type {
  TSafeFnInput,
  TSafeFnInputParseErrorNoZod,
  TSafeFnOutputParseErrorNoZod,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./types/schema";

import { SafeFnBuilder } from "./safe-fn-builder";
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
import type { AnyCtxInput } from "./types/handler";
import type { AnyObject, TODO } from "./types/util";
import {
  isFrameworkError,
  mapZodError,
  runCallbacks,
  safeZodAsyncParse,
  throwFrameworkErrorOrVoid,
} from "./util";

export interface TAnyRunnableSafeFn
  extends TRunnableSafeFn<any, any, any, any, any, any, any, any, any, any> {}

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
  any
>;

export type TRunnableSafeFnPickArgs =
  | "catch"
  | "onStart"
  | "onSuccess"
  | "onError"
  | "onComplete"
  | "run"
  | "createAction"
  | "mapErr";

export type TRunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> = Pick<
  RunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    TPickArgs
  >,
  TPickArgs
>;

export class RunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> {
  readonly _internals: TSafeFnInternals<
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _callBacks: TSafeFnCallBacks<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _mapErrHandler: ((e: any) => TRunErr) | undefined;

  constructor(
    internals: TSafeFnInternals<
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: TSafeFnCallBacks<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    mapErrHandler: ((e: TRunErr) => TRunErr) | undefined,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
    this._mapErrHandler = mapErrHandler;
  }

  createAction(): TSafeFnAction<TData, TRunErr, TOutputSchema, TUnparsedInput> {
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
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "catch">
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      } as TODO,
      this._callBacks as TODO,
      this._mapErrHandler,
    ) as TODO;
  }

  mapErr<TNewErrError>(
    handler: (error: TRunErr) => TNewErrError,
  ): TRunnableSafeFn<
    TData,
    TNewErrError,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "mapErr">
  > {
    return new RunnableSafeFn(
      this._internals,
      this._callBacks,
      handler as TODO,
    ) as TODO;
  }

  onStart(
    onStartFn: TSafeFnOnStart<TUnparsedInput>,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onStart">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onStart: onStartFn,
      },
      this._mapErrHandler,
    ) as TODO;
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
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onSuccess">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onSuccess: onSuccessFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }
  onError(
    onErrorFn: TSafeFnOnError<
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onError">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onError: onErrorFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }
  onComplete(
    onCompleteFn: TSafeFnOnComplete<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onComplete">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onComplete: onCompleteFn,
      },
      this._mapErrHandler,
    ) as TODO;
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
  ): TSafeFnRunReturn<TData, TRunErr, TOutputSchema> {
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

  _parseInput(
    input: unknown,
  ): ResultAsync<
    TSchemaOutputOrFallback<TInputSchema, never>,
    TSafeFnInputParseErrorNoZod<TSchemaInputOrFallback<TInputSchema, never>>
  > {
    if (this._internals.inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    return safeZodAsyncParse(this._internals.inputSchema, input).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        const cause = mapZodError(error.cause);
        return {
          code: "INPUT_PARSING",
          cause,
        } as TSafeFnInputParseErrorNoZod<
          TSchemaInputOrFallback<TInputSchema, never>
        >;
      },
    );
  }

  _parseOutput(
    output: unknown,
  ): ResultAsync<
    TSchemaOutputOrFallback<TOutputSchema, never>,
    TSafeFnOutputParseErrorNoZod<TSchemaInputOrFallback<TOutputSchema, never>>
  > {
    if (this._internals.outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    return safeZodAsyncParse(this._internals.outputSchema, output).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        const cause = mapZodError(error.cause);
        return {
          code: "OUTPUT_PARSING",
          cause,
        } as TSafeFnOutputParseErrorNoZod<
          TSchemaInputOrFallback<TOutputSchema, never>
        >;
      },
    );
  }

  _run(
    args: TSafeFnRunArgs<TUnparsedInput>[0],
    asProcedure: boolean,
  ): TSafeFnInternalRunReturn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
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
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >;
    type InternalErr = TSafeFnInternalRunReturnError<
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >;

    const safeTryPromise: Promise<Result<InternalOk, InternalErr>> = safeTry(
      async function* () {
        const parentRes: any | undefined =
          parent === undefined
            ? undefined
            : yield* parent
                ._run(args, true)
                .map((res) => ({
                  ...res,
                  ctxInput: [...res.ctxInput, res.input],
                }))
                .mapErr(
                  (e) =>
                    ({
                      public: e.public as TSafeFnReturnError<
                        TRunErr,
                        TOutputSchema
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
            : yield* _parseInput(args)
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

        const handlerRes: TData = yield* (
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
            : yield* _parseOutput(handlerRes)
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
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    > = ResultAsync.fromPromise(safeTryPromise, (error) => {
      if (isFrameworkError(error)) {
        throw error;
      }

      const handledErr = uncaughtErrorHandler(error);
      if (handledErr.isOk()) {
        throw new Error("uncaught error handler returned ok");
      }
      if (
        asProcedure &&
        uncaughtErrorHandler === SafeFnBuilder.safeFnDefaultUncaughtErrorHandler
      ) {
        throw error;
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
    })
      .andThen((res) => {
        return res;
      })
      .mapErr((e) => {
        if (this._mapErrHandler !== undefined) {
          return {
            private: e.private,
            public: this._mapErrHandler(e.public),
          };
        }
        return e;
      }) as TODO;

    const withCallbacks = runCallbacks({
      resultAsync: internalRes as TODO,
      callbacks: _callBacks,
      hotOnStartCallback: onStartCallback,
    });

    return withCallbacks;
  }

  async _runAsAction(
    ...args: TSafeFnActionArgs<TUnparsedInput>
  ): TSafeFnActionReturn<TData, TRunErr, TOutputSchema> {
    const res = await this._run(args[0], false)
      .map((res) => res.value)
      .mapErr((e) => e.public);

    if (res.isOk()) {
      return actionOk(res.value);
    }
    return actionErr(res.error);
  }
}
