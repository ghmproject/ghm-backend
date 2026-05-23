const {
  getPrivacyPolicy,
  upsertPrivacyPolicy,
} = require("../models/privacyPolicy.model");

const getPrivacyPolicyController = async (req, res) => {
  try {
    const policy = await getPrivacyPolicy();

    return res.status(200).json({
      success: true,
      content: policy?.content ?? null,
      updatedAt: policy?.updatedAt ?? null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updatePrivacyPolicyController = async (req, res) => {
  try {
    const content = String(req.body.content ?? "").trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Privacy policy content is required",
      });
    }

    const policy = await upsertPrivacyPolicy(content);

    return res.status(200).json({
      success: true,
      message: "Privacy policy updated",
      content: policy.content,
      updatedAt: policy.updatedAt,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getPrivacyPolicyController,
  updatePrivacyPolicyController,
};
