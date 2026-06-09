import { createMiddleware } from "hono/factory";
import { error } from "../utils/response";

export const authMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("x-rpc-api-key");
  const validKey = process.env.RPC_API_KEY;

  if (!apiKey || apiKey !== validKey) {
    return c.json(error("UNAUTHORIZED", "Invalid or missing API key"), 401);
  }

  await next();
});
