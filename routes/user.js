const express = require("express");

const userController = require("../controllers/user");

const router = express.Router();

// GET /user/status
router.get("/status", userController.getStatus);

module.exports = router;