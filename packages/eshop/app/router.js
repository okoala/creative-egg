'use strict';

module.exports = app => {
  app.get('/', 'view.home');
  app.get('/contact', 'view.contact');
  app.get('/download/read', 'download.read');
  app.get('/*', 'view.spa');
};
