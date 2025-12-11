/**
 * Netlify Function: upsert-user
 * Cria ou atualiza um usuário na tabela "users".
 * Espera JSON: { id?, school_id, email, name, has_canva?, is_compliant? }
 * Se id vier vazio/nulo, cria novo; se id vier, faz update.
 *
 * Env vars:
 *  - DATABASE_URL (obrigatória)
 *  - API_TOKEN (opcional; se definido, exige Authorization: Bearer <token>)
 */

const { Client } = require("pg");
const { randomUUID } = require("crypto");

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
  if (event.httpMethod !== "POST") {
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

    const payload = JSON.parse(event.body || "{}");
    const {
      id,
      school_id,
      email,
      name,
      has_canva = false,
      is_compliant = true,
    } = payload;

    if (!school_id || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "school_id and email are required" }),
      };
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    let userId = id && String(id).trim() ? id : randomUUID();

    const query = `
      INSERT INTO users (id, school_id, email, name, has_canva, is_compliant)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        school_id = EXCLUDED.school_id,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        has_canva = EXCLUDED.has_canva,
        is_compliant = EXCLUDED.is_compliant
      RETURNING id, school_id, email, name, has_canva, is_compliant;
    `;

    const { rows } = await client.query(query, [
      userId,
      school_id,
      email,
      name || "",
      has_canva,
      is_compliant,
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ user: rows[0] }),
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
