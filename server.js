const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./swagger");
const authRoutes = require("./routes/auth.routes");
const listingRoutes = require("./routes/listing.routes");
const adminRoutes = require("./routes/admin.routes");
const nearbyListingRoutes = require("./routes/nearbyListing.routes");
dotenv.config();
const cookieParser = require("cookie-parser");
const app = express();

// ==========================
// Middlewares
// ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());

// ==========================
// Swagger Docs Route
// ==========================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listingNearby", nearbyListingRoutes);

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