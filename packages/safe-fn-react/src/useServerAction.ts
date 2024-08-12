import { useRef, useState, useTransition } from "react";
import { type AnyCompleteSafeFn } from "safe-fn";

export const useServerAction = <TAction extends AnyCompleteSafeFn>(
  action: TAction,
) => {
  type ActionReturn = Awaited<ReturnType<TAction>>;
  type ActionArgs = Parameters<TAction>[0];

  const [result, setResult] = useState<ActionReturn | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const resolveRef = useRef<undefined | ((args: ActionReturn) => void)>(
    undefined,
  );

  const _execute = async (args: ActionArgs) => {
    const res = await action(args);
    setResult(res);
    resolveRef.current?.(res);
    setIsExecuting(false);
  };

  const execute = async (args: ActionArgs): Promise<ActionReturn> => {
    return new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        _execute(args);
      });
    }) as Promise<ActionReturn>;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    execute,
  };
};
