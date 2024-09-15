import { ResultAsync } from "neverthrow";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  actionResultToResult,
  type ActionResultToResult,
  type ActionResultToResultAsync,
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
  result: ActionResultToResult<InferSafeFnActionReturn<TAction>> | undefined;
  execute: (
    args: InferSafeFnActionArgs<TAction>,
  ) => ActionResultToResultAsync<InferSafeFnActionReturn<TAction>>;
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
  type ActionReturnActionResult = InferSafeFnActionReturn<TAction>;
  /** Converted `ActionResult<T,E>` -\> `Result<T,E>` to be returned to the user  */
  type ActionReturnResult = ActionResultToResult<ActionReturnActionResult>;
  type ActionReturnResultAsync = ActionResultToResultAsync<
    InferSafeFnActionReturn<TAction>
  >;

  const [result, setResult] = useState<ActionReturnResult | undefined>(
    undefined,
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();
  const isPending = isExecuting || isTransitioning;

  const resolveRef = useRef<((args: ActionReturnResult) => void) | undefined>(
    undefined,
  );
  const argsRef = useRef<ActionArgs | undefined>(undefined);

  const _execute = useCallback(
    async (args: ActionArgs): Promise<void> => {
      if (callbacks.onStart !== undefined) {
        void ResultAsync.fromThrowable(callbacks.onStart, callbackCatch)(args);
      }

      const actionResult = (await action(args)) as ActionReturnActionResult;
      const res = actionResultToResult(actionResult) as ActionReturnResult;

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
        error: result.error as InferSafeFnActionError<TAction>,
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
    (args: ActionArgs): ActionReturnResultAsync => {
      const promise = new Promise((resolve) => {
        setIsExecuting(true);
        startTransition(() => {
          resolveRef.current = resolve;
          argsRef.current = args;
          void _execute(args);
        });
      }) as Promise<ActionReturnResult>;
      return ResultAsync.fromPromise(promise, (e) => {
        console.error("Unknown error", e);
      }).andThen((res) => res) as ActionReturnResultAsync;
    },
    [_execute],
  );

  useEffect(() => {
    return () => {
      handleCallbacks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPending || resolveRef.current === undefined) {
      return;
    }

    handleCallbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  return {
    result,
    isPending,
    isSuccess: !!result?.isOk(),
    execute,
  };
};
