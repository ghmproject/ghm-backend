const prisma =
  require("../config/prisma");


// =========================================
// TOGGLE FEATURED LISTING
// =========================================
const toggleFeaturedListing =
  async ({

    mealId,

    isFeatured,

    featuredUntil,

  }) => {

    return await prisma.meal.update({

      where: {

        id:
          Number(mealId),
      },

      data: {

        isFeatured,

        featuredUntil:
          isFeatured
            ? new Date(featuredUntil)
            : null,
      },
    });
  };


// =========================================
// GET FEATURED LISTINGS
// =========================================
const getFeaturedListings =
  async (search) => {

    return await prisma.meal.findMany({

      where: {

        isFeatured: true,

        status: "APPROVED",

        isHidden: false,

        ...(search && {

          OR: [

            {

              dishName: {

                contains: search,

                mode: "insensitive",
              },
            },

            {

              restaurant: {

                name: {

                  contains: search,

                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      },

      include: {

        restaurant: true,
      },

      orderBy: {

        createdAt: "desc",
      },
    });
  };


module.exports = {

  toggleFeaturedListing,

  getFeaturedListings,
};