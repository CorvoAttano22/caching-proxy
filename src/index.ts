import {createServer} from "node:http";

const server = createServer((req, res) => {
    res.end("Hello from caching proxy")
});

server.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})