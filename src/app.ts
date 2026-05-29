import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middleware/error.middleware";

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      data: {
        status: "ok"
      }
    });
  });

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
