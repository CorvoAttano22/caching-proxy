import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379",
});

redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export async function connectRedis() {
  await redis.connect();
  console.log("Connected to Redis");
}

type CachedResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

//used "identifier" instead of "key" to not get confused with key>value in headers
export async function get(identifier: string): Promise<CachedResponse | null> {
  const value = await redis.get(identifier);

  if (!value) {
    return null
  }

  return JSON.parse(value)
}

export async function set(identifier: string, value: CachedResponse) {
  await redis.set(identifier, JSON.stringify(value));
}

export async function clear() {
  await redis.flushDb();
}

export async function disconnectRedis() {
  await redis.quit();
}