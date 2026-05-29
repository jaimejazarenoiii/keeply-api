import mongoose from "mongoose";

export async function connectDatabase(mongoUri: string): Promise<typeof mongoose> {
  mongoose.connection.on("error", (error: Error) => {
    console.error("MongoDB connection error", error);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return mongoose.connect(mongoUri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
