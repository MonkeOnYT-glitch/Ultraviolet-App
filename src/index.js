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
    // FORCE-OPEN THE HEADERS
    try {
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        res.setHeader("X-Frame-Options", "ALLOWALL");
        res.setHeader("Content-Security-Policy", "frame-ancestors *");
        res.setHeader("Access-Control-Allow-Origin", "*");
    } catch (err) {
        console.error("Header Error:", err);
    }
	app(req, res);
});

server.on("upgrade", (req, socket, head) => {
	if (req.url.endsWith("/wisp/")) {
		wisp.routeRequest(req, socket, head);
		return;
	} 
	socket.end();
});

// Force Port 8000 for Koyeb
let port = parseInt(process.env.PORT || "8000");

server.listen({ port }, () => {
	const address = server.address();
	console.log(`MONKE VAULT ONLINE: http://localhost:${address.port}`);
});

process.on("SIGINT", () => { server.close(); process.exit(0); });
process.on("SIGTERM", () => { server.close(); process.exit(0); });
