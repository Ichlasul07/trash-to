const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { Pool } = require("pg");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// S3 config
const s3 = new AWS.S3({
  region: "ap-southeast-1",
});

// PostgreSQL connection
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

// API upload + insert DB
app.post("/report", upload.single("foto"), async (req, res) => {
  try {
    // Upload ke S3
    const params = {
      Bucket: "your-bucket-name",
      Key: Date.now() + "-" + req.file.originalname,
      Body: req.file.buffer,
    };

    const uploadResult = await s3.upload(params).promise();

    // Simpan ke PostgreSQL
    await pool.query(
      "INSERT INTO reports (lokasi, deskripsi, foto) VALUES ($1, $2, $3)",
      [req.body.lokasi, req.body.deskripsi, uploadResult.Location]
    );

    res.send("Data berhasil disimpan");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// WAJIB pakai 0.0.0.0
app.listen(3000, "0.0.0.0", () => {
  console.log("Server jalan");
});

app.get("/", (req, res) => {
    res.send("🚀 CleanCity API is running!");
  });