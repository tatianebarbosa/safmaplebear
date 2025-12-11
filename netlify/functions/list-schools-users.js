/**
 * Netlify Function: list-schools-users
 * Retorna escolas com seus usuários e limites a partir do PostgreSQL (Neon).
 *
 * Env vars necessárias:
 *  - DATABASE_URL (já configurada no Netlify)
 *  - API_TOKEN (opcional; se definido, exige header Authorization: Bearer <token>)
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
  try {
    requireAuth(event);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "DATABASE_URL not set" }),
      };
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const schoolsQuery = `
      SELECT
        s.id,
        s.name,
        COALESCE(s.license_limit, 0) AS license_limit,
        s.city,
        s.state,
        s.cluster,
        s.contact_email,
        s.status
      FROM schools s
      ORDER BY s.name;
    `;

    const usersQuery = `
      SELECT
        u.id,
        u.school_id,
        u.email,
        u.name,
        COALESCE(u.has_canva, false) AS has_canva,
        COALESCE(u.is_compliant, true) AS is_compliant
      FROM users u;
    `;

    const limitsQuery = `
      SELECT
        school_id,
        "limit" AS limit
      FROM school_limits
      ORDER BY updated_at DESC;
    `;

    const [schoolsRes, usersRes, limitsRes] = await Promise.all([
      client.query(schoolsQuery),
      client.query(usersQuery),
      client.query(limitsQuery),
    ]);

    const limitsBySchool = new Map();
    for (const row of limitsRes.rows) {
      if (!limitsBySchool.has(row.school_id)) {
        limitsBySchool.set(row.school_id, row.limit);
      }
    }

    const usersBySchool = new Map();
    for (const user of usersRes.rows) {
      const arr = usersBySchool.get(user.school_id) || [];
      arr.push({
        id: user.id,
        email: user.email,
        name: user.name,
        hasCanva: user.has_canva,
        isCompliant: user.is_compliant,
      });
      usersBySchool.set(user.school_id, arr);
    }

    const schools = schoolsRes.rows.map((s) => {
      const users = usersBySchool.get(s.id) || [];
      const usedLicenses = users.filter((u) => u.hasCanva).length;
      const totalLicenses = limitsBySchool.get(s.id) ?? s.license_limit ?? 0;
      return {
        id: s.id,
        name: s.name,
        city: s.city,
        state: s.state,
        cluster: s.cluster,
        contactEmail: s.contact_email,
        status: s.status,
        totalLicenses,
        usedLicenses,
        users,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ schools }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    const status = error.statusCode || 500;
    return {
      statusCode: status,
      body: JSON.stringify({ error: error.message || "Internal error" }),
    };
  }
};
