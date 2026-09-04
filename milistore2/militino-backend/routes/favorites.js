const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");

// GET /api/favorites.php
router.get("/favorites.php", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT product_id FROM favorites WHERE user_id = ?").all(req.user.id);
  res.json(rows.map(r => r.product_id));
});

// POST /api/favorites/add.php  { productId }
router.post("/favorites/add.php", requireAuth, (req, res) => {
  const { productId } = req.body;
  try {
    db.prepare("INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)").run(req.user.id, productId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: "Não foi possível favoritar este produto." });
  }
});

// DELETE /api/favorites/remove.php  { productId }
router.delete("/favorites/remove.php", requireAuth, (req, res) => {
  const { productId } = req.body;
  db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(req.user.id, productId);
  res.json({ success: true });
});

module.exports = router;
