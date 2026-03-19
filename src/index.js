import { join } from "node:path";
import { hostname } from "node:os";
import { createServer } from "node:http";
import express from "express";
import wisp from "wisp-server-node";

import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const app = express();
app.use(express.static("./public"));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

app.use((req, res) => {
	res.status(404);
	res.sendFile("./public/404.html");
});

const server = createServer();

server.on("request", (req, res) => {
	// RELAXED HEADERS TO ALLOW IFRAME EMBEDDING
	res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
	res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
	res.setHeader("X-Frame-Options", "ALLOWALL");
	res.setHeader("Content-Security-Policy", "frame-ancestors *");
	app(req, res);
});

server.on("upgrade", (req, socket, head) => {
	if (req.url.endsWith("/wisp/")) {
		wisp.routeRequest(req, socket, head);
		return;
	} 
	socket.end();
});

let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8000; // Updated to your Port 8000

server.on("listening", () => {
	const address = server.address();
	console.log(`Listening on http://localhost:${address.port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	server.close();
	process.exit(0);
}

server.listen({ port });
