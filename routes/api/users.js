const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
// ユーザー登録をするページ

// @route       POST api/users
// @description Register user
// @access      Public
router.post(
  '/',
  [
    check('name', '名前は必須です').not().isEmpty(),
    check('email', '使用可能なemailを入力してください').isEmail(),
    check('password', '6文字以上入力してください').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: '既にこのユーザーはいます' }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        size: '200',
        rating: 'pg',
        default: 'mm',
      });

      user = new User({ name, email, avatar, password });

      // Encrypt password(パスワード暗号化)
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken ユーザーがフロントエンドですぐにログインできるようにする。そのためのトークンをここで発行する
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }
);

module.exports = router;
