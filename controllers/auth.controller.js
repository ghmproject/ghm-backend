const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  countUsers,
  createUser,
  updateMagicToken,
  findUserByToken,
  removeMagicToken,
} = require("../models/auth.model");
const sendMagicEmail = require("../utils/sendMail");

// =====================================
// SEND MAGIC LINK
// =====================================
const sendMagicLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Generate name from email
    const generatedName = email
      .split("@")[0]
      .replace(/[0-9]/g, "")
      .replace(/[._-]/g, " ");

    // Find existing user
    let user = await findUserByEmail(email);

    // Total users
    const usersCount = await countUsers();

    // Create new user
    if (!user) {
      user = await createUser({
        email,

        name: generatedName,

        role: usersCount === 0 ? "ADMIN" : "USER",
      });
    }

    // Generate token
    const magicToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // Save token
    await updateMagicToken(user.id, magicToken);

    // Magic link
    const magicLink = `http://localhost:5000/api/auth/verify?token=${magicToken}`;

    // Send email
    await sendMagicEmail(email, magicLink);

    return res.status(200).json({
      success: true,
      message: "Magic link sent successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
// VERIFY MAGIC LINK
// =====================================
const verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token missing",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await findUserByToken(decoded.id, token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Auth token
    const authToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // Set cookie
    res.cookie("ghm_token", authToken, {
      httpOnly: true,

      secure: false,

      sameSite: "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Remove magic token
    await removeMagicToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      role: user.role,
      accessToken: authToken,
    });
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// =====================================
// LOGOUT
// =====================================
const logout = async (req, res) => {
  res.clearCookie("ghm_token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  sendMagicLink,
  verifyMagicLink,
  logout,
};
