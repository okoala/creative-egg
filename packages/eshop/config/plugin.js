'use strict';

// had enabled by egg
exports.static = true;

exports.passportGithub = {
  enable: true,
  package: 'egg-passport-github',
};

exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};
