// ==============================
// CREATE POST
// ==============================

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const {
  createCommunityPost,
  getAllCommunityPosts,
  getCommunityPostById,
  getLikedPostIdsForUser,
  getAuthorEngagementForViewer,
  sortPostsByEngagement,
  updateCommunityPost,
  toggleLike,
  getPostWithComments,
  addPostComment,
  toggleCommentLike,
  updatePostComment,
  deletePostComment,
} = require("../models/community.model");
const { resolveAuthUserId } = require("../utils/resolveAuthUser");

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
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }

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
// UPDATE POST
// ==============================

const updatePost = async (req, res) => {
  try {
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }
    const { id } = req.params;
    const { title, category, body, imageUrl: bodyImageUrl, clearImage } = req.body;

    const hasTitle = title !== undefined && title !== null && String(title).trim() !== "";
    const hasCategory = category !== undefined && category !== null && String(category).trim() !== "";
    const hasBody = body !== undefined && body !== null && String(body).trim() !== "";
    const hasFile = Boolean(req.file?.buffer);
    const wantsClearImage =
      clearImage === true ||
      clearImage === "true" ||
      clearImage === "1";

    if (!hasTitle && !hasCategory && !hasBody && !hasFile && !wantsClearImage && !bodyImageUrl) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const data = {};

    if (hasTitle) {
      data.title = String(title).trim();
    }

    if (hasCategory) {
      const normalizedCategory = normalizeCategory(category);
      if (!normalizedCategory) {
        return res.status(400).json({
          success: false,
          message: "Invalid category. Use Finds, Tips, or Price checks",
        });
      }
      data.category = normalizedCategory;
    }

    if (hasBody) {
      data.body = String(body).trim();
    }

    if (hasFile) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "GHMProject/community" },
          (error, uploadResult) => {
            if (uploadResult) {
              resolve(uploadResult);
            } else {
              reject(error);
            }
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      data.imageUrl = result.secure_url;
    } else if (bodyImageUrl?.trim()) {
      data.imageUrl = String(bodyImageUrl).trim();
    } else if (wantsClearImage) {
      data.imageUrl = null;
    }

    const post = await updateCommunityPost(id, userId, data);

    if (post === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update post",
    });
  }
};

// ==============================
// GET ALL POSTS
// ==============================

const getPosts = async (req, res) => {
  try {
    let posts = await getAllCommunityPosts();
    const userId = req.user ? await resolveAuthUserId(req.user) : null;

    if (userId) {
      const engagementScores = await getAuthorEngagementForViewer(userId);
      posts = sortPostsByEngagement(posts, engagementScores);
    }

    let likedIds = new Set();
    if (userId) {
      likedIds = await getLikedPostIdsForUser(
        userId,
        posts.map((post) => post.id),
      );
    }

    const data = posts.map((post) => ({
      ...post,
      likedByMe: likedIds.has(post.id),
    }));

    return res.status(200).json({
      success: true,
      data,
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

    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }

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
    const viewerId = req.user ? await resolveAuthUserId(req.user) : null;

    const post = await getPostWithComments(postId, viewerId);

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
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to comment",
      });
    }
    const { postId } = req.params;
    const { body, parentCommentId } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment body is required",
      });
    }

    const comment = await addPostComment(
      postId,
      userId,
      String(body).trim(),
      parentCommentId ? String(parentCommentId) : null,
    );

    if (comment === "invalid_parent") {
      return res.status(400).json({
        success: false,
        message: "Invalid reply target",
      });
    }

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

const updateComment = async (req, res) => {
  try {
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }
    const { commentId } = req.params;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment body is required",
      });
    }

    const comment = await updatePostComment(
      commentId,
      userId,
      String(body).trim(),
    );

    if (comment === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update comment",
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }
    const { commentId } = req.params;

    const result = await toggleCommentLike(commentId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to like comment",
    });
  }
};

const removeComment = async (req, res) => {
  try {
    const userId = await resolveAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to continue",
      });
    }
    const { commentId } = req.params;

    const result = await deletePostComment(commentId, userId);

    if (result === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      postId: result.postId,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
    });
  }
};

module.exports = {
  createPost,
  updatePost,
  getPosts,
  getSinglePost,
  likePost,
  getPostForComment,
  createComment,
  likeComment,
  updateComment,
  removeComment,
};