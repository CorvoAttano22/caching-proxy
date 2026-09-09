import { createServer } from "node:http";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { get, set, connectRedis } from "./cache/cache";

const argv = yargs(hideBin(process.argv))
  .option("port", {
    type: "number",
    demandOption: true,
    describe: "Port for the caching proxy",
  })
  .option("origin", {
    type: "string",
    demandOption: true,
    describe: "Origin server URL",
  })
  .parseSync();

const origin = argv.origin;

const headersToKeep = ["content-type", "etag", "vary"];

function createCacheKey(method: string, url: URL): string {
  return `${method}:${url.href}`;
}

const server = createServer(async (req, res) => {
  const myURL = new URL(req.url ?? "/", origin);
  const key = createCacheKey(req.method ?? "GET", myURL);

  const cached = get(key);

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

  set(key, cachedResponse);

  console.log(key);
  console.log(cachedResponse);

  res.end(body);
});

async function start() {
  await connectRedis();
  server.listen(argv.port, () => {
    console.log(`Server is running on port ${argv.port}`);
  });
}

start();