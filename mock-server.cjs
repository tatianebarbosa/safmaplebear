#!/usr/bin/env node

/**
 * Mock Server para Desenvolvimento Local
 * Simula as respostas da API de autenticação
 */

const http = require("http");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3333;
const SECRET_KEY = "dev-secret-key-2025";

// Credenciais válidas
const VALID_CREDENTIALS = [
  { username: "admin", password: "admin2025", role: "admin" },
  { username: "saf@seb.com.br", password: "saf2025", role: "user" },
  { username: "coordenador@sebsa.com.br", password: "coord2025", role: "user" },
];

// Middleware para CORS
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

// In-memory data for users and audit
let users = VALID_CREDENTIALS.map((u, i) => ({
  id: `${Date.now()}-${i}`,
  username: u.username,
  password: u.password,
  role: u.role,
}));
let audit = [];

// Servidor
const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Preflight CORS
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Helper to read body
  const readBody = (cb) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => cb(body));
  };

  // Auth login
  if (req.method === "POST" && req.url === "/api/auth/login") {
    readBody((body) => {
      try {
        const { username, password } = JSON.parse(body);
        const user = users.find(
          (u) =>
            (u.username === username ||
              u.username === username.toLowerCase()) &&
            u.password === password
        );
        if (!user) {
          res.writeHead(401);
          res.end(
            JSON.stringify({ success: false, message: "Credenciais inválidas" })
          );
          return;
        }
        const token = jwt.sign(
          { id: user.username, username: user.username, role: user.role },
          SECRET_KEY,
          { expiresIn: "7d" }
        );
        // log
        audit.unshift({
          id: `${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: user.username,
          action: "login",
          detail: "user logged in",
        });
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role },
          })
        );
      } catch (err) {
        res.writeHead(400);
        res.end(
          JSON.stringify({
            success: false,
            message: "Erro ao processar solicitação",
          })
        );
      }
    });
    return;
  }

  // List users
  if (req.method === "GET" && req.url === "/api/users") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
        })),
      })
    );
    return;
  }

  // Create user
  if (req.method === "POST" && req.url === "/api/users") {
    readBody((body) => {
      try {
        const { username, password, role } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              success: false,
              message: "username and password required",
            })
          );
          return;
        }
        if (
          users.some((u) => u.username.toLowerCase() === username.toLowerCase())
        ) {
          res.writeHead(409);
          res.end(JSON.stringify({ success: false, message: "user exists" }));
          return;
        }
        const newUser = {
          id: `${Date.now()}`,
          username,
          password,
          role: role || "user",
        };
        users.push(newUser);
        audit.unshift({
          id: `${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: "system",
          action: "create_user",
          detail: `created ${username}`,
        });
        res.writeHead(201);
        res.end(
          JSON.stringify({
            success: true,
            user: {
              id: newUser.id,
              username: newUser.username,
              role: newUser.role,
            },
          })
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "invalid body" }));
      }
    });
    return;
  }

  // Delete user
  if (req.method === "DELETE" && req.url.startsWith("/api/users/")) {
    const id = req.url.split("/").pop();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, message: "not found" }));
      return;
    }
    const removed = users.splice(idx, 1)[0];
    audit.unshift({
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "system",
      action: "delete_user",
      detail: `deleted ${removed.username}`,
    });
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Change password
  if (
    req.method === "PUT" &&
    req.url.startsWith("/api/users/") &&
    req.url.endsWith("/password")
  ) {
    const id = req.url.split("/")[3];
    readBody((body) => {
      try {
        const { newPassword } = JSON.parse(body);
        const user = users.find((u) => u.id === id);
        if (!user) {
          res.writeHead(404);
          res.end(JSON.stringify({ success: false, message: "not found" }));
          return;
        }
        user.password = newPassword;
        audit.unshift({
          id: `${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: "system",
          action: "change_password",
          detail: `changed password for ${user.username}`,
        });
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "invalid body" }));
      }
    });
    return;
  }

  // Get audit
  if (req.method === "GET" && req.url === "/api/audit") {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, audit }));
    return;
  }

  // default
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, message: "Rota não encontrada" }));
});

server.listen(PORT, () => {
  console.log(`🚀 Mock Server rodando em http://localhost:${PORT}`);
  console.log("\n📚 Credenciais disponíveis:");
  console.log("  - admin / admin2025");
  console.log("  - saf@seb.com.br / saf2025");
  console.log("  - coordenador@sebsa.com.br / coord2025");
});
