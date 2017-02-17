'use strict';
var webpack = require('webpack');

module.exports = {
  node: {fs: 'empty' },
  context: __dirname + '/src',
  entry: ['./main.js'],
  output: {
    path: __dirname + '/dist',
    filename: 'meta.dev.js',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
