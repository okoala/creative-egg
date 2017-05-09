'use strict';

// @ts-check
module.exports = app => {
  const { STRING } = app.Sequelize;

  return app.model.define('contact', {
    id: STRING(20),
    firstname: STRING(40),
    lastname: STRING(40),
    email: STRING,
    body: STRING,
    phone: STRING,
    language: STRING(2),
  });
};
