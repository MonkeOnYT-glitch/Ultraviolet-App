import { join } from "node:path";
import { hostname } from "node:os";
import { createServer } from "node:http";
import express from "express";
import wisp from "wisp-server-node";

import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const app = express();

// Middleware to set headers for Express-served files
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *;");
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
});

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
    // --- THE BRUTE FORCE HEADER FIX ---
    // We set these here to catch EVERY request, including the proxy traffic
    try {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        
        // This is the most important line for your "Refused" error:
        res.setHeader("X-Frame-Options", "ALLOWALL");
        
        // This tells the browser your GitHub site is allowed to embed this
        res.setHeader("Content-Security-Policy", "frame-ancestors *;");
        
        // These allow the proxy to load internal assets (images/scripts)
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    } catch (e) {
        console.error("Header injection failed, but continuing...");
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

// Port configuration for Koyeb
let port = parseInt(process.env.PORT || "8000");

server.listen({ port }, () => {
    const address = server.address();
    console.log(`MONKE VAULT SERVER ONLINE`);
    console.log(`Listening on http://localhost:${address.port}`);
});

// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("Shutting down server...");
    server.close();
    process.exit(0);
}
