const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

const {
  createLeague,
  getAllLeagues,
  joinPublicLeague,
  joinPrivateLeague
} = require("../controllers/leagueController");

router.post("/create", protect, createLeague);
router.get("/all-leagues", getAllLeagues);
router.post("/join-public", protect, joinPublicLeague);
router.post("/join-private", protect, joinPrivateLeague);

module.exports = router;
