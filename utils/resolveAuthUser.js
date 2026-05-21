const prisma = require("../config/prisma");
const { findUserByEmail, createUser } = require("../models/auth.model");

/**
 * Resolve a real `users.id` from JWT payload (id + optional email).
 * Recreates user by email if JWT id is stale after DB reset.
 */
const resolveAuthUserId = async (authPayload) => {
  if (!authPayload) return null;

  const id = Number(authPayload.id);
  if (Number.isFinite(id) && id > 0) {
    const byId = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  const email =
    typeof authPayload.email === "string"
      ? authPayload.email.trim().toLowerCase()
      : null;

  if (!email) return null;

  let user = await findUserByEmail(email);

  if (!user) {
    const generatedName = email
      .split("@")[0]
      .replace(/[0-9]/g, "")
      .replace(/[._-]/g, " ");

    user = await createUser({
      email,
      name: generatedName || "User",
      role: "USER",
    });
  }

  return user.id;
};

module.exports = { resolveAuthUserId };
