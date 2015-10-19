#!/usr/bin/env node

require('babel/register')(require('../babelConfig'));
require('source-map-support').install();
require('./sardine.jsx');
