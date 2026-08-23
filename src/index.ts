import { createServer } from "node:http";
console.log(process.argv);
const origin = "https://dummyjson.com";
const cache = new Map<string, CachedResponse>();
const headersToKeep = ["content-type", "etag", "vary"];
type CachedResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

function createCacheKey(method: string, url: URL): string {
  return `${method}:${url.href}`;
}

const server = createServer(async (req, res) => {
  const myURL = new URL(req.url ?? "/", origin);
  const key = createCacheKey(req.method ?? "GET", myURL);

  const cached = cache.get(key);

  //to be understood
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
  //

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

  const cachedResponse: CachedResponse = {
    status: response.status,
    headers,
    body,
  };

  cache.set(key, cachedResponse);

  console.log(key);
  console.log(cachedResponse);
  res.end(body);
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
