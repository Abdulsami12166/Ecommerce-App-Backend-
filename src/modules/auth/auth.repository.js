const User = require('../../models/User');
const UserActivity = require('../../models/UserActivity');

const authRepository = {
  findUserByEmail: email => User.findOne({ email }),
  findUserByEmailWithPassword: email =>
    User.findOne({ email }).select(
      '+password +otpCode +otpExpiresAt +passwordResetCode +passwordResetExpiresAt +tokenVersion',
    ),
  findUserById: userId => User.findById(userId),
  createUser: payload => User.create(payload),
  saveUser: user => user.save(),
  createActivity: payload => UserActivity.create(payload),
};

module.exports = { authRepository };
