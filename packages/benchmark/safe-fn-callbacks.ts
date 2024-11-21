import { createSafeFn } from "safe-fn";
import { Bench } from "tinybench";

import { ok } from "neverthrow";
import { z } from "zod";

const schema = z.unknown();

const handlerFn = async (args: any) => ok(args);

const callbackFn = async (args: any) => {};

const rootSafeFn = createSafeFn()
  .input(schema)
  .output(schema)
  .handler(handlerFn)
  .onComplete(callbackFn)
  .onError(callbackFn)
  .onSuccess(callbackFn)
  .onStart(callbackFn);

const addSafeFn = (root: any) => {
  return createSafeFn()
    .use(root)
    .input(schema)
    .output(schema)
    .handler(handlerFn)
    .onComplete(callbackFn)
    .onError(callbackFn)
    .onSuccess(callbackFn)
    .onStart(callbackFn);
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

export const safeFnAsyncWithCallbacksBench = new Bench({
  name: "Safe FN Middleware With Callbacks",
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
