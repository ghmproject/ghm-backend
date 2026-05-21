const { updateUserName } = require("../models/profile.model");

const updateProfileName = async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await updateUserName(req.user.id, name);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { updateProfileName };
