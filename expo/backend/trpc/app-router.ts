import { createTRPCRouter } from "./create-context";
import { pricesRouter } from "./routes/prices";

export const appRouter = createTRPCRouter({
  prices: pricesRouter,
});

export type AppRouter = typeof appRouter;
