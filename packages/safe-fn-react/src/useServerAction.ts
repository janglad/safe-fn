import { ResultAsync } from "neverthrow";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  actionResultToResult,
  type ActionResultPromiseToResultAsync,
  type ActionResultToResult,
  type AnySafeFnAction,
  type InferSafeFnActionArgs,
  type InferSafeFnActionError,
  type InferSafeFnActionOkData,
  type InferSafeFnActionReturn,
} from "safe-fn";
import type { UserServerActionCallbacks } from "./types";

type UseServerActionReturn<TAction extends AnySafeFnAction> = {
  isPending: boolean;
  isSuccess: boolean;
  result:
    | ActionResultToResult<Awaited<InferSafeFnActionReturn<TAction>>>
    | undefined;
  execute: (
    args: InferSafeFnActionArgs<TAction>,
  ) => ActionResultPromiseToResultAsync<InferSafeFnActionReturn<TAction>>;
};

const callbackCatch = (e: unknown): void => {
  console.error(e);
};

export const useServerAction = <TAction extends AnySafeFnAction>(
  action: TAction,
  callbacks: UserServerActionCallbacks<TAction>,
): UseServerActionReturn<TAction> => {
  type ActionArgs = InferSafeFnActionArgs<TAction>;
  /** Original `ActionResult<T,E>` */
  type ActionActionResult = Awaited<InferSafeFnActionReturn<TAction>>;
  /** Converted `ActionResult<T,E>` -\> `Result<T,E>` to be returned to the user  */
  type ActionResult = ActionResultToResult<ActionActionResult>;
  type ActionResultAsync = ActionResultPromiseToResultAsync<
    InferSafeFnActionReturn<TAction>
  >;

  const [result, setResult] = useState<ActionResult | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();
  const isPending = isExecuting || isTransitioning;

  const resolveRef = useRef<((args: ActionResult) => void) | undefined>(
    undefined,
  );
  const argsRef = useRef<ActionArgs | undefined>(undefined);

  const _execute = useCallback(
    async (args: ActionArgs): Promise<void> => {
      if (callbacks.onStart !== undefined) {
        void ResultAsync.fromThrowable(callbacks.onStart, callbackCatch)(args);
      }

      const actionResult = (await action(args)) as ActionActionResult;
      const res = actionResultToResult(actionResult) as ActionResult;

      setResult(res);
      resolveRef.current?.(res);
      setIsExecuting(false);
    },
    [action, callbacks],
  );

  const handleCallbacks = useCallback(() => {
    if (argsRef.current === undefined) {
      return;
    }
    if (
      result !== undefined &&
      result.isOk() &&
      callbacks.onSuccess !== undefined
    ) {
      void ResultAsync.fromThrowable(
        callbacks.onSuccess,
        callbackCatch,
      )({
        unsafeRawInput: argsRef.current,
        value: result.value as Awaited<InferSafeFnActionOkData<TAction>>,
      });
    } else if (
      result !== undefined &&
      result.isErr() &&
      callbacks.onError !== undefined
    ) {
      void ResultAsync.fromThrowable(
        callbacks.onError,
        callbackCatch,
      )({
        unsafeRawInput: argsRef.current,
        error: result.error as Awaited<InferSafeFnActionError<TAction>>,
      });
    }

    if (callbacks.onComplete !== undefined) {
      void ResultAsync.fromThrowable(
        callbacks.onComplete,
        callbackCatch,
      )({
        unsafeRawInput: argsRef.current,
        result: result as Awaited<InferSafeFnActionReturn<TAction>> | undefined,
      });
    }

    resolveRef.current = undefined;
  }, [result, callbacks]);

  const execute = useCallback(
    (args: ActionArgs): ActionResultAsync => {
      const promise = new Promise((resolve) => {
        setIsExecuting(true);
        startTransition(() => {
          resolveRef.current = resolve;
          argsRef.current = args;
          void _execute(args);
        });
      }) as Promise<ActionResult>;
      return ResultAsync.fromPromise(promise, (e) => {
        console.error("Unknown error", e);
      }).andThen((res) => res) as ActionResultAsync;
    },
    [_execute],
  );

  useEffect(() => {
    return () => {
      handleCallbacks();
    };
  }, []);

  useEffect(() => {
    if (isPending || resolveRef.current === undefined) {
      return;
    }

    handleCallbacks();
  }, [isPending]);

  return {
    result,
    isPending,
    isSuccess: !!result?.isOk(),
    execute,
  };
};
