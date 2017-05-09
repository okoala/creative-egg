'use strict';

// @ts-check
module.exports = app => {
  const { STRING, BOOLEAN } = app.Sequelize;

  return app.model.define('user', {
    id: STRING(20),
    idgithub: STRING(30),
    ip: STRING(80),
    name: STRING(50),
    firstname: STRING(50),
    lastname: STRING(50),
    phone: STRING(20),
    email: STRING(30),
    gender: STRING(20),
    isblocked: BOOLEAN,
  });
};
