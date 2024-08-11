import { startTransition, useRef, useState } from "react";
import {
  type AnyRunnableSafeFn,
  type InferReturn,
  type InferRunArgs,
} from "safe-fn";

export const useServerAction = <TAction extends AnyRunnableSafeFn>(
  action: TAction,
) => {
  type ActionReturn = InferReturn<TAction>;

  const [result, setResult] = useState<InferReturn<TAction> | undefined>(
    undefined,
  );
  const [isPending, setIsPending] = useState(false);

  const resolveRef = useRef<undefined | ((args: ActionReturn) => void)>(
    undefined,
  );

  const _execute = async (args: InferRunArgs<TAction>) => {
    setIsPending(true);
    const res = await action.run(args);
    setResult(res);
    resolveRef.current?.(res);
    setIsPending(false);
  };

  const execute = async (
    args: InferRunArgs<TAction>,
  ): Promise<ActionReturn> => {
    return new Promise((resolve) => {
      startTransition(() => {
        resolveRef.current = resolve;
        _execute(args);
      });
    });
  };

  return {
    result,
    isPending,
    execute,
  };
};
