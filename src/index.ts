import { createServer } from "node:http";

const origin = "https://dummyjson.com";

const server = createServer((req, res) => {
  console.log(req.method);
  console.log(req.url);

  const myURL = new URL(req.url ?? "/", origin);
  console.log(myURL.href);
  console.log(myURL.origin);
  console.log(myURL.pathname);

  res.end("Hello from caching proxy");
});
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
