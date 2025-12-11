// Simple Netlify Function to test DB connectivity using DATABASE_URL.
// It runs a trivial SELECT 1 and returns the result.

const { Client } = require("pg");

exports.handler = async () => {
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

  try {
    await client.connect();
    const { rows } = await client.query("SELECT 1 as ok");
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result: rows[0] }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
