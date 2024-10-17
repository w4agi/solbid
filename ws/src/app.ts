import { WebSocketServer } from "ws";
import http from "http"
import { handleConnection } from "./connectionHandler";

function main() {
  const server = createHttpServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", handleConnection);

  const PORT = process.env.PORT ?? 8080;
  server.listen(PORT, () => {
    console.log(`WS server is running on port ${PORT}`);
  });
}

function createHttpServer() {
  return http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("ws is up");
  });
}

main();
