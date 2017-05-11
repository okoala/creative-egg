'use strict';

// const glimpse = require('./index');
// glimpse.init();

const express = require('express');
const app = express();

app.get('/', function(req, res) {
  res.send('hi world');
});

app.listen(8000, function() {
  console.log('Calculator Web ~ 8000');
});
