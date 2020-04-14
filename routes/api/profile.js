const express = require('express');
const request = require('postman-request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route       GET api/profle/me
// @description GET current users profile
// @access      Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']); // Profileの中のuserを取得
    // Profileがないかどうか確認する
    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'このユーザーのプロフィールがありません' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

// @route       Post api/profle
// @description Create or update user profile
// @access      Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    //エラーチェック
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
      linkedin,
    } = req.body;

    // プロファイルオブジェクトをビルドする
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.company = company;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // ソーシャルオブジェクトをいビルドする
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      // プロファイルを探し、あれば更新する
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // なければプロファイルを作成する
      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }
);

// @route       Get api/profle
// @description Get all profiles
// @access      Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

// @route       Get api/profle/user/:user_id
// @description Get profile by user ID
// @access      Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    //プロファイルがあるかどうか確認
    if (!profile)
      return res.status(400).json({ msg: 'プロフィールがありません' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.name == 'CastError') {
      return res.status(400).json({ msg: 'プロフィールがありません' });
    }

    res.status(500).send('サーバーエラー');
  }
});

// @route       DELETE api/profle
// @description Delete profile, user posts
// @access      Private
router.delete('/', auth, async (req, res) => {
  try {
    // todo: ユーザーの投稿削除

    // プロファイル削除
    await Profile.findOneAndRemove({ user: req.user.id }); // プライベートであるため
    // ユーザー削除
    await User.findOneAndRemove({ _id: req.user.id }); // プライベートであるため

    res.json({ msg: 'ユーザーが削除されました' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

// @route       PUT api/profle/education
// @description Add profile education
// @access      Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Filed of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }
);

// @route       DELETE api/profle/education/:edu_id
// @description Delete education from profile
// @access      Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // ログインしているユーザーがindexを受け取る
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

// @route       PUT api/profle/experience
// @description Add profile experince
// @access      Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }
);

// @route       DELETE api/profle/experience/:exp_id
// @description Delete experience from profile
// @access      Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // ログインしているユーザーがindexを受け取る
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send('サーバーエラー');
  }
});

// @route       GET api/profle/github/:username
// @description Get user repositry from Github
// @access      Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc$client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'Githubページが見つかりません' });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('サーバーエラー');
  }
});

module.exports = router;
