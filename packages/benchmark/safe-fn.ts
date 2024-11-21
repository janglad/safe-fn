import { createSafeFn } from "safe-fn";
import { Bench } from "tinybench";

import { ok } from "neverthrow";
import { z } from "zod";

const schema = z.unknown();

const handlerFn = async (args: any) => ok(args);

const rootSafeFn = createSafeFn()
  .input(schema)
  .output(schema)
  .handler(handlerFn);

const addSafeFn = (root: any) => {
  return createSafeFn()
    .use(root)
    .input(schema)
    .output(schema)
    .handler(handlerFn);
};

const getSafeFnWithNMiddlewares = (n: number) => {
  let safeFn: any = rootSafeFn;
  for (let i = 0; i < n; i++) {
    safeFn = addSafeFn(safeFn);
  }
  return safeFn;
};

const with10 = getSafeFnWithNMiddlewares(10);
const with100 = getSafeFnWithNMiddlewares(100);
const with1000 = getSafeFnWithNMiddlewares(1000);
console.log("Done with this");
export const safeFnAsyncBench = new Bench({
  name: "Safe FN Middleware",
})
  .add("with1", async () => {
    const res = await rootSafeFn.run({});
  })
  .add("with10", async () => {
    const res = await with10.run({});
  })
  .add("with100", async () => {
    const res = await with100.run({});
  })
  .add("with1000", async () => {
    const res = await with1000.run({});
  });
