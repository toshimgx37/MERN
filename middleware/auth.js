const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res
      .status(401)
      .json({ msg: 'トークンがありません。承認が拒否されました' });
  }

  //トークンがない場合は、トークンがあるか確認する
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'そのトークンは無効です' });
  }
};
