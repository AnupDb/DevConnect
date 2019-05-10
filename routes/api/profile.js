const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator/check");
const request = require("request");
const config = require("config");

router.route("/me").get(auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.userId }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }
    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Server Error");
  }
});

//create or update user profile
router
  .route("/")
  .post(
    [
      auth,
      [
        check("status", "Status is required")
          .not()
          .isEmpty(),
        check("skills", "Skills is required")
          .not()
          .isEmpty()
      ]
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
      } = req.body;

      const profileFields = {};
      profileFields.user = req.user.userId;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.loaction = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;
      if (skills) {
        profileFields.skills = skills.split(",").map(skill => skill.trim());
      }

      //Build social
      profileFields.social = {};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;
      if (facebook) profileFields.social.facebook = facebook;

      try {
        let profile = await Profile.findOne({ user: req.user.userId });

        if (profile) {
          profile = await Profile.findOneAndUpdate(
            { user: req.user.userId },
            { $set: profileFields },
            { new: true }
          );

          return res.json(profile);
        }

        let newProfile = new Profile(profileFields);
        await newProfile.save();
        res.json(newProfile);
        console.log("Profile created");
      } catch (e) {
        console.error(e.message);
        res.status(500).send("Server Error");
      }
    }
  )
  .get(async (req, res) => {
    try {
      const profiles = await Profile.find({}).populate("user", [
        "name",
        "avatar"
      ]);
      res.json(profiles);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  });

router.get("/user/:user_id", async (req, res) => {
  try {
    const profiles = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    if (!profiles) return res.status(400).json({ msg: "Profile not found" });

    res.json(profiles);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    //remove profile and post
    await Profile.findOneAndRemove({ user: req.user.userId });

    await User.findByIdAndRemove({ _id: req.user.userId });

    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});
//Add experience

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "title is required")
        .not()
        .isEmpty(),

      check("company", "company is required")
        .not()
        .isEmpty(),

      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.userId },
        { $push: { experience: newExp } },
        { new: true }
      );
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      { $pull: { experience: { _id: req.params.exp_id } } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//Add education

router.put(
  "/education",
  [
    auth,
    [
      check("school", "school is required")
        .not()
        .isEmpty(),

      check("degree", "degree is required")
        .not()
        .isEmpty(),

      check("from", "From date is required")
        .not()
        .isEmpty(),
      check("fieldofstudy", "field of study is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.userId },
        { $push: { education: newEdu } },
        { new: true }
      );
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      { $pull: { education: { _id: req.params.edu_id } } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//Get user repos from Github
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    request(options, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        console.error(error);
        return res.status(400).json({ msg: "No Github profile found" });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
