'use strict';

// @ts-check
module.exports = app => {
  const { STRING } = app.Sequelize;

  app.model.define('superUser', {
    name: STRING,
    login: STRING,
    password: STRING,
    rules: STRING,
  });

  app.model.define('setting', {
    currency: STRING,
    currency_entity: STRING,
    emailcontactform: STRING,
    emailorderform: STRING,
    emailreply: STRING,
    emailsender: STRING,
    emailuserform: STRING,
    url: STRING,
    templates: STRING,
    templatesposts: STRING,
    templatesproducts: STRING,
    posts: STRING,
    navigations: STRING,
    deliverytypes: STRING,
    paymenttype: STRING,
    defaultorderstatus: STRING,
    users: STRING,
    languages: STRING,

    oauth2_github_key: STRING,
    oauth2_github_secret: STRING,
  });

  return app;
};
