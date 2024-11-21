import { safeFnAsyncBench } from "./safe-fn";
import { safeFnAsyncGenBench } from "./safe-fn-gen";
import { zsaBench } from "./zsa";

const runBench = async () => {
  await safeFnAsyncBench.run();
  console.log(safeFnAsyncBench.name);
  console.table(safeFnAsyncBench.table());
  await safeFnAsyncGenBench.run();
  console.log(safeFnAsyncGenBench.name);
  console.table(safeFnAsyncGenBench.table());
  await zsaBench.run();
  console.log(zsaBench.name);
  console.table(zsaBench.table());
};

runBench();
