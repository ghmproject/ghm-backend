const express = require("express");

const {
  getPrivacyPolicyController,
  updatePrivacyPolicyController,
} = require("../controllers/privacyPolicy.controller");

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

router.get("/", getPrivacyPolicyController);

router.put("/", authMiddleware, adminMiddleware, updatePrivacyPolicyController);

module.exports = router;
