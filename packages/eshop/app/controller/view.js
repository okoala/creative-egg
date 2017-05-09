'use strict';

module.exports = app => {
  class ViewController extends app.Controller {
    * index() {
      this.ctx.body = 'hi, egg';
    }

    * contact() {
      this.ctx.body = 'contact!';
    }
  }

  return ViewController;
};
