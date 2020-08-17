import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import proxy from 'http-proxy-middleware';
import SourceMapSupport from 'source-map-support';

import render from './render.jsx';

const app = express();

SourceMapSupport.install();
dotenv.config();

const enableHMR = (process.env.ENABLE_HMR || 'true') === 'true';

if (enableHMR && (process.env.NODE_ENV !== 'production')) {
  console.log('Adding dev middleware, enabling HMR');
  /* eslint "global-require": "off" */
  /* eslint "import/no-extraneous-dependencies": "off" */
  const webpack = require('webpack');
  const devMiddleware = require('webpack-dev-middleware');
  const hotMiddleware = require('webpack-hot-middleware');

  const config = require('../webpack.config.js')[0];
  config.entry.app.push('webpack-hot-middleware/client');
  config.plugins = config.plugins || [];
  config.plugins.push(new webpack.HotModuleReplacementPlugin());

  const compiler = webpack(config);
  app.use(devMiddleware(compiler));
  app.use(hotMiddleware(compiler));
}

app.use(express.static('public'));
app.use(cors());


const apiProxyTarget = process.env.API_PROXY_TARGET;
if (apiProxyTarget) {
  app.use('/graphql', proxy({ target: apiProxyTarget, changeOrigin: true }));
  app.use('/auth', proxy({ target: apiProxyTarget, changeOrigin: true }));
  app.use('/sign_s3', proxy({ target: apiProxyTarget, changeOrigin: true }));
}

if (!process.env.UI_API_ENDPOINT) {
  process.env.UI_API_ENDPOINT = 'http://localhost:3000/graphql';
}

if (!process.env.UI_SERVER_API_ENDPOINT) {
  process.env.UI_SERVER_API_ENDPOINT = process.env.UI_API_ENDPOINT;
}

if (!process.env.UI_S3_ENDPOINT) {
  process.env.UI_S3_ENDPOINT = 'http://localhost:3000/sign_s3';
}

if (!process.env.UI_SERVER_S3_ENDPOINT) {
  process.env.UI_SERVER_S3_ENDPOINT = process.env.UI_S3_ENDPOINT;
}

if (!process.env.UI_AUTH_ENDPOINT) {
  process.env.UI_AUTH_ENDPOINT = 'http://localhost:3000/auth';
}


app.get('/env.js', (req, res) => {
  const env = {
    UI_API_ENDPOINT: process.env.UI_API_ENDPOINT,
    UI_S3_ENDPOINT: process.env.UI_S3_ENDPOINT,
    UI_AUTH_ENDPOINT: process.env.UI_AUTH_ENDPOINT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  };
  // This line is not mentioned in the book, but it is necessary to
  // eliminate a content-type related error in Firefox console.
  res.set('Content-Type', 'application/javascript');
  res.send(`window.ENV = ${JSON.stringify(env)}`);
});

app.get('*', (req, res, next) => {
  render(req, res, next);
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`UI started on port ${port}`);
});

if (module.hot) {
  module.hot.accept('./render.jsx');
}
