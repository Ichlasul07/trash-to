const { Pool } = require('pg');

const pool = new Pool({
  host: "cleancity-db.co5u2ms8krcs.us-east-1.rds.amazonaws.com",
  user: "postgres",
  password: "Killua07",
  database: "cleancity",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;