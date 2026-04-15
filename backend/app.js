const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const mysql = require("mysql2");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  region: "ap-southeast-1",
});

const db = mysql.createConnection({
  host: "RDS_ENDPOINT",
  user: "admin",
  password: "password",
  database: "cleancity",
});

app.post("/report", upload.single("foto"), (req, res) => {
  const params = {
    Bucket: "your-bucket-name",
    Key: Date.now() + "-" + req.file.originalname,
    Body: req.file.buffer,
  };

  s3.upload(params, (err, data) => {
    if (err) return res.send(err);

    db.query(
      "INSERT INTO reports (lokasi, deskripsi, foto) VALUES (?, ?, ?)",
      [req.body.lokasi, req.body.deskripsi, data.Location],
      () => res.send("OK")
    );
  });
});

app.listen(3000, () => console.log("Server jalan"));