// be/src/config/db.js
const { Pool } = require('pg');

function makeConfig() {
  // Nếu có DATABASE_URL thì ưu tiên dùng (Heroku/Render)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    };
  }
  // Ngược lại dùng bộ biến rời trong .env (local)
  return {
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    // Quan trọng: ÉP về string để tránh lỗi "password must be a string"
    password: String(process.env.DB_PASSWORD ?? ''),
    port:     Number(process.env.DB_PORT || 5432),
    ssl: false,
  };
}

const pool = new Pool(makeConfig());

pool.on('error', (err) => {
  console.error('[pg] unexpected idle client error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
