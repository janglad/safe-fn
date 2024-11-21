import { Bench } from "tinybench";
import { z } from "zod";

import { createServerAction, createServerActionProcedure } from "zsa";

const schema = z.unknown();

const rootProcedure = createServerActionProcedure()
  .input(schema)
  .output(schema)
  .handler((e) => e);

const bareAction = createServerAction()
  .input(schema)
  .output(schema)
  .handler((e) => e);

const getProcedureWithNMiddlewares = (n: number) => {
  let procedure: any = rootProcedure;
  for (let i = 1; i < n; i++) {
    procedure = createServerActionProcedure(procedure)
      .input(schema)
      .output(schema)
      .handler((e) => e);
  }
  return procedure
    .createServerAction()
    .input(schema)
    .output(schema)
    .handler((e) => e);
};

const with10 = getProcedureWithNMiddlewares(10);
const with100 = getProcedureWithNMiddlewares(100);
const with1000 = getProcedureWithNMiddlewares(1000);

export const zsaBench = new Bench({
  name: "ZSA",
})
  .add("with1", async () => {
    const res = await bareAction({});
  })
  .add("with10", async () => {
    const res = await with10({});
  })
  .add("with100", async () => {
    const res = await with100({});
  })
  .add("with1000", async () => {
    const res = await with1000({});
  });
