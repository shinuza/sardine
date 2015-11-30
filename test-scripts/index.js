#!/usr/bin/env node

require('babel/register')(require('../package.json').babel);
require('source-map-support').install();
require('./index.jsx');
