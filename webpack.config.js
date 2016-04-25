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
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Detect how npm is run and branch based on that
const TARGET = process.env.npm_lifecycle_event;

//---------------------------------------------
const common = {
  cache: true,
  entry: {sdmxmllib: './src'},
  output: {
    path: './lib',
    filename: '[name].js',
  },

  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js']//,
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: "Test page",
      xhtml: true
    })
  ]
};

//---------------------------------------------
// Default configuration. We will return this if
// Webpack is called outside of npm.
if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
    devServer: {
      // Enable history API fallback so HTML5 History API based routing works. This is a good default that will come in handy in more complicated setups.
      historyApiFallback: true,
      hot: true,
      inline: true,

      quiet: false,
      progress: true,
      colors: true,

      // Display only errors to reduce the amount of output.
      stats: {
        assets: true, modules: false, colors: true, version: false, hash: false, timings: true, chunks: true, chunkModules: false
      },
      // If you use Vagrant or Cloud9, set
      // host: process.env.HOST || '0.0.0.0';
      // 0.0.0.0 is available to all network devices
      // unlike default localhost
      host: process.env.HOST || "127.0.0.1",
      port: process.env.PORT || 8888

      // If you want defaults, you can use a little trick like this
      // port: process.env.PORT || 3000
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        title: "Test page",
        xhtml: true
      })
    ]
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


