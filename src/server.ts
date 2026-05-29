import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  await connectDatabase(env.mongoUri);

  app.listen(env.port, () => {
    console.log(`Keeply API listening on port ${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start Keeply API", error);
  process.exit(1);
});
