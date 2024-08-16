import { useRef, useState, useTransition } from "react";
import {
  type AnyCompleteSafeFn,
  type InferCompleteFnReturn,
  type InferCompleteFnRunArgs,
} from "safe-fn";

interface UseServerActionReturn<TAction extends AnyCompleteSafeFn> {
  isPending: boolean;
  isSuccess: boolean;
  result: InferCompleteFnReturn<TAction> | undefined;
  execute: TAction;
}

export const useServerAction = <TAction extends AnyCompleteSafeFn>(
  action: TAction,
): UseServerActionReturn<TAction> => {
  type ActionReturn = InferCompleteFnReturn<TAction>;
  type ActionArgs = InferCompleteFnRunArgs<TAction>;

  const [result, setResult] = useState<ActionReturn | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const resolveRef = useRef<((args: ActionReturn) => void) | undefined>(
    undefined,
  );
  const _execute = async (args: ActionArgs): Promise<void> => {
    const res = (await action(args)) as ActionReturn;
    setResult(res);
    resolveRef.current?.(res);
    setIsExecuting(false);
  };

  const execute = async (args: ActionArgs): Promise<ActionReturn> => {
    return new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        _execute(args).catch((e: unknown) => {
          // TODO: handle error
          throw e;
        });
      });
    }) as Promise<ActionReturn>;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    isSuccess: !!result?.data,
    execute,
  } as UseServerActionReturn<TAction>;
};
