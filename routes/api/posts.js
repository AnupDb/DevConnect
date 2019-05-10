const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Post = require("../../models/Post");


router.post(
  "/",
  [
    auth,
    [
      check("text", "text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.userId).select("-password");

      const newPost = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.userId
      };

      const post = await Post.create(newPost);
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).exec();
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.json(post);
  } catch (error) {
    if (error.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status("401").json({ msg: "Post not found" });
    }
    if (post.user.toString() !== req.user.userId) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await Post.findOneAndDelete(req.params.id);
    return res.json({ msg: "Post removed" });
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});
//Adding like feature

router.put("/like/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (
      post.likes.filter(like => like.user.toString() == req.user.userId)
        .length > 0
    )
      return res.status(400).json({ msg: "Post already liked" });

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { likes: { user: req.user.userId } } },
      { new: true }
    );
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});
//Adding unlike feature
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (
      post.likes.filter(like => like.user.toString() == req.user.userId)
        .length == 0
    )
      return res.status(400).json({ msg: "Post has not been liked" });

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: { user: req.user.userId } } },
      { new: true }
    );
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

router.post(
  "/comment/:id",
  [
    auth,
    [
      check("text", "text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.userId).select("-password");

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.userId
      };
      let post = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $push: { comments: newComment }
        },
        { new: true }
      );

      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

//Delete comment
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    console.log(comment);
    if (comment.user.toString() !== req.user.userId) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: comment } },
      { new: true }
    );

    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
