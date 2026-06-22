const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const swaggerSpec = require("./swagger");
const authRoutes = require("./routes/auth.routes");
const listingRoutes = require("./routes/listing.routes");
const adminRoutes = require("./routes/admin.routes");
const nearbyListingRoutes = require("./routes/nearbyListing.routes");
const reportRoutes = require("./routes/report.routes");
const voteRoutes = require("./routes/vote.routes");
const communityRoutes = require("./routes/community.routes");
const commentRoutes = require("./routes/comment.routes");
const featuredRoutes = require("./routes/featured.routes");
const rankingSystemRoutes = require("./routes/rankingSystem.routes");
const profileRoutes = require("./routes/profile.routes");
const privacyPolicyRoutes = require("./routes/privacyPolicy.routes");
const mapsRoutes = require("./routes/maps.routes");
const app = express();

const corsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o && !o.includes("/api/"))
    .filter(Boolean),
];

// ==========================
// Middlewares
// ==========================
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());

// ==========================
// Swagger Docs Route
// ==========================
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listingNearby", nearbyListingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin/featured", featuredRoutes);
app.use("/api/ranking", rankingSystemRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/privacy-policy", privacyPolicyRoutes);
app.use("/api/maps", mapsRoutes);
// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================
// Global Error Handler
// ==========================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
