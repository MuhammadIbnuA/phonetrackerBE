import { app } from "./app.js";
import { env } from "./config/env.js";

if (process.env.VERCEL !== "1") {
  app.listen(env.PORT, () => {
    console.log(`Backend listening on port ${env.PORT}`);
  });
}

export default app;
