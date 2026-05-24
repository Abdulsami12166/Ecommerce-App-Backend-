const User = require('../../models/User');

const usersRepository = {
  findUserById: userId => User.findById(userId),
  saveUser: user => user.save(),
};

module.exports = { usersRepository };
