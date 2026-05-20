// ==============================
// CREATE POST
// ==============================

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const {
  createCommunityPost,
  getAllCommunityPosts,
  getCommunityPostById,
  toggleLike,
  getPostWithComments,
  addPostComment,
} = require("../models/community.model");

const normalizeCategory = (value) => {
  const raw = String(value).trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");

  const map = {
    finds: "FINDS",
    tips: "TIPS",
    price_checks: "PRICE_CHECKS",
  };

  if (map[key]) {
    return map[key];
  }

  const upper = raw.toUpperCase();
  if (upper === "FINDS" || upper === "TIPS" || upper === "PRICE_CHECKS") {
    return upper;
  }

  return null;
};

const createPost = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      title,
      category,
      body,
      imageUrl: bodyImageUrl,
    } = req.body;

    if (!title || !category || !body) {
      return res.status(400).json({
        success: false,
        message: "Title, category and comment are required",
      });
    }

    const normalizedCategory = normalizeCategory(category);

    if (!normalizedCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Use Finds, Tips, or Price checks",
      });
    }

    // Image is optional: upload only when the client sends a file.
    let imageUrl = bodyImageUrl?.trim() || null;

    if (req.file?.buffer) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "GHMProject/community" },
          (error, uploadResult) => {
            if (uploadResult) {
              resolve(uploadResult);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      imageUrl = result.secure_url;
    }

    const post = await createCommunityPost({
      userId,
      title: String(title).trim(),
      category: normalizedCategory,
      body: String(body).trim(),
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
};

// ==============================
// GET ALL POSTS
// ==============================

const getPosts = async (req, res) => {
  try {
    const posts = await getAllCommunityPosts();

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
};

// ==============================
// GET SINGLE POST
// ==============================

const getSinglePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await getCommunityPostById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch post",
    });
  }
};

const likePost = async (req, res) => {

  try {

    const userId = req.user.id;

    const { postId } = req.params;

    const result = await toggleLike(
      postId,
      userId
    );

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to like post",
    });

  }

};

// ==============================
// GET POST TITLE + COMMENTS (comment screen)
// ==============================

const getPostForComment = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await getPostWithComments(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch post comments",
    });
  }
};

// ==============================
// ADD COMMENT
// ==============================

const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment body is required",
      });
    }

    const comment = await addPostComment(
      postId,
      userId,
      String(body).trim()
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully",
      data: comment,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to post comment",
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getSinglePost,
  likePost,
  getPostForComment,
  createComment,
};