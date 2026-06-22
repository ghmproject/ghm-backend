const express = require("express");
const { handleMapsGet, handleMapsPost } = require("../controllers/maps.controller");

const router = express.Router();

router.get("/", handleMapsGet);
router.post("/", handleMapsPost);

module.exports = router;
