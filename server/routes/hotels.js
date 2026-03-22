const express = require("express");

const { getAllHotelsRaw, getHotelRawById } = require("../services/hotelService");
const { adaptHotel } = require("../utils/hotelAdapter");

const router = express.Router();

router.get("/", (_req, res) => {
  const rawHotels = getAllHotelsRaw();
  const hotels = rawHotels.map(adaptHotel);
  res.json({ hotels });
});

router.get("/:id", (req, res) => {
  const raw = getHotelRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: "Hotel not found" });
  res.json({ hotel: adaptHotel(raw) });
});

module.exports = router;

