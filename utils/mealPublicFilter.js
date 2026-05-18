/**
 * Meals visible in public listing APIs (approved and not auto-hidden by reports).
 */
const publicApprovedMealWhere = {
  status: "APPROVED",
  isHidden: false,
};

module.exports = {
  publicApprovedMealWhere,
};
