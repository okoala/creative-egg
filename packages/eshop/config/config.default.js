'use strict';

module.exports = appInfo => {
  const config = {};

  // should change to your own
  config.keys = appInfo.name + '_1494293463489_5662';

  // config/config.default.js
  config.passportWeibo = {
    key: 'your oauth key',
    secret: 'your oauth secret',
  };

  config.sequelize = {
    dialect: 'mysql', // support: mysql, mariadb, postgres, mssql
    database: 'test',
    host: 'localhost',
    port: '3306',
    username: 'root',
    password: 'root',
  };

  return config;
};
