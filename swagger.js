const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "GHM API",
      version: "1.0.0",
      description:
        "GHM Backend API Documentation. Use **Authorize** with JWT from GET /api/auth/verify (`accessToken`).",
    },

    servers: [
      {
        url: "http://localhost:5000",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Session JWT (`accessToken` from GET /api/auth/verify). Paste token only — Swagger adds Bearer.",
        },
      },
    },
  },

  apis: ["./routes/*.js", "./server.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;
