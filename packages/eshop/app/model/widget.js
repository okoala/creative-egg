'use strict';

module.exports = app => {
  const { STRING, BOOLEAN } = app.Sequelize;

  return app.model.define(
    'user',
    {
      id: STRING(20),
      name: STRING(50),
      category: STRING(50),
      body: STRING,
      css: STRING,
      icon: STRING(20),
      istemmplate: BOOLEAN,
    },
    {
      classMethods: {
        * addWorkflow() {},
      },
    }
  );
};
