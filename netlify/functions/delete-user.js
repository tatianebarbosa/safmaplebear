/**
 * Netlify Function: delete-user
 * Remove um usuário da tabela "users".
 * Espera query param ou body JSON com { id }.
 *
 * Env vars:
 *  - DATABASE_URL (obrigatória)
 *  - API_TOKEN (opcional; se definido, exige Authorization: Bearer <token>)
 */

const { Client } = require("pg");

const requireAuth = (event) => {
  const token = process.env.API_TOKEN;
  if (!token) return;
  const auth = event.headers.authorization || "";
  const incoming = auth.replace(/^[Bb]earer\s+/i, "").trim();
  if (incoming !== token) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    requireAuth(event);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "DATABASE_URL not set" }),
      };
    }

    let id = event.queryStringParameters?.id;
    if (!id) {
      const body = JSON.parse(event.body || "{}");
      id = body.id;
    }
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "id is required" }) };
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    await client.query("DELETE FROM users WHERE id = $1", [id]);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, deleted: id }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    const status = error.statusCode || 500;
    return {
      statusCode: status,
      body: JSON.stringify({ error: error.message || "Internal error" }),
    };
  }
};
