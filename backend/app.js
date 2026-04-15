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
    // validasi file
    if (!req.file) {
        return res.status(400).send("File tidak ada / salah upload");
      }

    // upload ke S3
    const params = {
      Bucket: "cleancity-bucket-uts",
      Key: Date.now() + "-" + req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    // simpan ke postgres
    await pool.query(
      "INSERT INTO reports (lokasi, deskripsi, foto) VALUES ($1, $2, $3)",
      [
        req.body.lokasi,
        req.body.deskripsi,
        uploadResult.Location
      ]
    );

    res.json({
      message: "Data berhasil disimpan",
      fileUrl: uploadResult.Location
    });

  } catch (err) {
    console.log("ERROR DETAIL:", err);
    res.status(500).send(err.message);
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