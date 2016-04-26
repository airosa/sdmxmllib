/*
 * Refer to the following great tutorials from Pete Hunt:
 *
 * http://survivejs.com/webpack/introduction !!!
 *
 * https://github.com/petehunt/react-howto
 * https://github.com/petehunt/webpack-howto
 *
 */
const webpack = require('webpack');
const merge = require('webpack-merge');

// Detect how npm is run and branch based on that
const TARGET = process.env.npm_lifecycle_event;

//---------------------------------------------
const common = {
  cache: true,
  entry: {
    sdmxmllib: './src/sdmxmllib.js'
  },
  output: {
    path: './lib',
    filename: '[name].js',
  },

  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js']//,
  }
};

//---------------------------------------------
// Default configuration. We will return this if
// Webpack is called outside of npm.
if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
  });
}

//---------------------------------------------
if(TARGET === 'build') {
  module.exports = merge(common, {
    plugins: [
      new webpack.DefinePlugin({
        'process.env':{
          'NODE_ENV': JSON.stringify('production')
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress:{
          warnings: false
        }
      })
    ]
  });
}


