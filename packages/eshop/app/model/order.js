'use strict';

// @ts-check
module.exports = app => {
  const { STRING, INTEGER, BOOLEAN, DATE } = app.Sequelize;

  app.model.define('orderItem', {
    id: STRING(20),
    price: INTEGER,
    name: STRING(50),
    reference: STRING(20),
    pictures: STRING,
    count: INTEGER,
  });

  app.model.define('order', {
    id: STRING(20),
    iduser: STRING(20),
    status: STRING(100),
    delivery: STRING(50),
    payment: STRING(50),
    firstname: STRING(40),
    lastname: STRING(40),
    email: STRING,
    phone: STRING,
    message: STRING(500),
    note: STRING(500),
    language: STRING(2),
    reference: STRING(10),
    trackingcode: STRING(50),
    price: INTEGER,
    count: INTEGER,
    products: STRING,

    company: STRING(40),
    companyid: STRING(15),
    companyvat: STRING(30),

    billingstreet: STRING(30),
    billingnumber: STRING(15),
    billingzip: STRING,
    billingcity: STRING(30),
    billingcountry: STRING(30),

    deliveryfirstname: STRING(30),
    deliverylastname: STRING(30),
    ideliverystreetd: STRING(30),
    deliverynumber: STRING(15),
    deliveryzip: STRING,
    deliverycity: STRING(30),
    deliverycountry: STRING(30),
    deliveryphone: STRING,

    ispaid: BOOLEAN,
    iscompany: BOOLEAN,
    isemail: BOOLEAN,
    iscompleted: BOOLEAN,
    isnewsletter: BOOLEAN,

    datecreated: DATE,
  });

  return app;
};
