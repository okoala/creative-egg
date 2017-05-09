'use strict';

// @ts-check
module.exports = app => {
  const { STRING } = app.Sequelize;

  return app.model.define('newsletter', {
    email: STRING,
  });
};
