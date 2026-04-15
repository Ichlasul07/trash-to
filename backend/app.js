const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { Pool } = require("pg");

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   AWS S3 CONFIG
========================= */
const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

/* =========================
   POSTGRES CONFIG
========================= */
const pool = new Pool({
  host: "cleancity-db.co5u2ms8krcs.us-east-1.rds.amazonaws.com",
  user: "postgres",
  password: "Killua07", // ⚠️ ganti kalau beda
  database: "cleancity",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("🚀 CleanCity API is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});


/* =========================
   UPLOAD REPORT + S3 + DB
========================= */
app.post("/report", upload.single("foto"), async (req, res) => {
    try {
      const params = {
        Bucket: "cleancity-bucket-uts",
        Key: Date.now() + "-" + req.file.originalname,
        Body: req.file.buffer,
      };
  
      const uploadResult = await s3.upload(params).promise();
  
      await pool.query(
        "INSERT INTO reports (lokasi, deskripsi, foto) VALUES ($1, $2, $3)",
        [req.body.lokasi, req.body.deskripsi, uploadResult.Location]
      );
  
      return res.json({
        message: "Data berhasil disimpan",
        fileUrl: uploadResult.Location
      });
  
    } catch (err) {
      console.error("ERROR REPORT:", err);
      return res.status(500).json({
        message: "Upload gagal",
        error: err.message
      });
    }
  });

const cors = require("cors");
app.use(cors());

/* =========================
   START SERVER
========================= */
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Server jalan di port 3000");
});