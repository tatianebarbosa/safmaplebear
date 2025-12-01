#!/usr/bin/env node

/**
 * Mock Server para Desenvolvimento Local
 * Simula as respostas da API de autenticação
 */

import http from "http";
import jwt from "jsonwebtoken";

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

// Servidor
const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Preflight CORS
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rota: POST /api/auth/login
  if (req.method === "POST" && req.url === "/api/auth/login") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);

        // Validar credenciais
        const user = VALID_CREDENTIALS.find(
          (u) =>
            (u.username === username ||
              u.username === username.toLowerCase()) &&
            u.password === password
        );

        if (!user) {
          res.writeHead(401);
          res.end(
            JSON.stringify({
              success: false,
              message: "Credenciais inválidas",
            })
          );
          return;
        }

        // Gerar token JWT
        const token = jwt.sign(
          { id: user.username, username: user.username, role: user.role },
          SECRET_KEY,
          { expiresIn: "7d" }
        );

        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            token,
            user: {
              id: user.username,
              username: user.username,
              role: user.role,
            },
          })
        );
      } catch (error) {
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

  // Rota padrão
  res.writeHead(404);
  res.end(
    JSON.stringify({
      success: false,
      message: "Rota não encontrada",
    })
  );
});

server.listen(PORT, () => {
  console.log(`🚀 Mock Server rodando em http://localhost:${PORT}`);
  console.log("\n📚 Credenciais disponíveis:");
  console.log("  - admin / admin2025");
  console.log("  - saf@seb.com.br / saf2025");
  console.log("  - coordenador@sebsa.com.br / coord2025");
});
