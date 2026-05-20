const {

  toggleFeaturedListing,

  getFeaturedListings,

} = require(
  "../models/featured.model"
);


// =========================================
// TOGGLE FEATURED
// =========================================
const toggleFeaturedController =
  async (req, res) => {

    try {

      const {
        mealId,
      } = req.params;

      const {

        isFeatured,

        featuredUntil,

      } = req.body;


      const listing =
        await toggleFeaturedListing({

          mealId,

          isFeatured,

          featuredUntil,
        });


      return res.status(200).json({

        success: true,

        message:
          isFeatured
            ? "Listing featured successfully"
            : "Listing removed from featured",

        data: listing,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Internal server error",
      });
    }
  };


// =========================================
// GET FEATURED LISTINGS
// =========================================
const getFeaturedListingsController =
  async (req, res) => {

    try {

      const {
        search,
      } = req.query;


      const listings =
        await getFeaturedListings(
          search
        );


      return res.status(200).json({

        success: true,

        count:
          listings.length,

        data: listings,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Internal server error",
      });
    }
  };


module.exports = {

  toggleFeaturedController,

  getFeaturedListingsController,
};