import { createServer } from "node:http";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { get, set, clear, connectRedis, disconnectRedis } from "./cache/cache";

const argv = yargs(hideBin(process.argv))
  .option("port", {
    type: "number",
    describe: "Port for the caching proxy",
  })
  .option("origin", {
    type: "string",
    describe: "Origin server URL",
  })
  .option("clear-cache", {
    type: "boolean",
    default: false,
    describe: "Clear the cache",
  })
  .check((argv) => {
    if (!argv["clear-cache"] && (!argv.port || !argv.origin)) {
      throw new Error(
        "--port and --origin are required unless --clear-cache is used",
      );
    }
    return true;
  })
  .parseSync();

const origin = argv.origin;

const headersToKeep = ["content-type", "etag", "vary"];

function createCacheKey(method: string, url: URL): string {
  return `${method}:${url.href}`;
}

const server = createServer(async (req, res) => {
  const myURL = new URL(req.url ?? "/", origin);
  const identifier = createCacheKey(req.method ?? "GET", myURL);

  const cached = await get(identifier);

  if (cached) {
    console.log("Cache Hit");

    res.statusCode = cached.status;

    for (const [key, value] of Object.entries(cached.headers)) {
      res.setHeader(key, value);
    }

    res.setHeader("X-Cache", "HIT");
    res.end(cached.body);

    return;
  }

  console.log("Cache Miss");
  const response = await fetch(myURL);

  const headers: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    if (headersToKeep.includes(key)) {
      headers[key] = value;
      res.setHeader(key, value);
    }
  });

  const body = await response.text();

  res.statusCode = response.status;
  res.setHeader("X-Cache", "MISS");

  const cachedResponse = {
    status: response.status,
    headers,
    body,
  };

  await set(identifier, cachedResponse);

  res.end(body);
});

async function start() {
  await connectRedis();

  if (argv["clear-cache"]) {
    await clear();
    console.log("Cache cleared");
    await disconnectRedis();
    return;
  }

  server.listen(argv.port, () => {
    console.log(`Server is running on port ${argv.port}`);
  });
}

start();
