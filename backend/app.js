const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { Pool } = require("pg");
const cors = require("cors"); // ✅ HARUS DI ATAS

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: "*"
}));

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
  password: "Killua07",
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

app.get("/reports", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM reports ORDER BY id DESC");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal ambil data" });
    }
  });

/* =========================
   UPLOAD REPORT + S3 + DB
========================= */
app.post("/report", upload.single("foto"), async (req, res) => {
  try {
    // ⚠️ safety check biar tidak crash
    if (!req.file) {
      return res.status(400).json({
        message: "File foto tidak ditemukan"
      });
    }

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

/* =========================
   START SERVER
========================= */
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Server jalan di port 3000");
});

app.put("/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
  
      await pool.query(
        "UPDATE reports SET status = 'done' WHERE id = $1",
        [id]
      );
  
      res.json({ message: "Status berhasil diupdate" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal update status" });
    }
  });

  app.delete("/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      await pool.query("DELETE FROM reports WHERE id = $1", [id]);
  
      res.json({ message: "Data berhasil dihapus" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal hapus data" });
    }
  });

  app.put("/reports/:id", upload.single("foto"), async (req, res) => {
    try {
      const { id } = req.params;
  
      let fotoUrl = null;
  
      if (req.file) {
        const uploadResult = await s3.upload({
          Bucket: "cleancity-bucket-uts",
          Key: Date.now() + "-" + req.file.originalname,
          Body: req.file.buffer,
          ACL: "public-read"
        }).promise();
  
        fotoUrl = uploadResult.Location;
      }
  
      if (fotoUrl) {
        await pool.query(
          "UPDATE reports SET lokasi=$1, deskripsi=$2, foto=$3 WHERE id=$4",
          [req.body.lokasi, req.body.deskripsi, fotoUrl, id]
        );
      } else {
        await pool.query(
          "UPDATE reports SET lokasi=$1, deskripsi=$2 WHERE id=$3",
          [req.body.lokasi, req.body.deskripsi, id]
        );
      }
  
      res.json({ message: "Data berhasil diupdate" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal update data" });
    }
  });