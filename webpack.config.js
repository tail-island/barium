const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    'web': './src/web.js',
    'vs-sample': './src/vsSample.js'
  },
  output: {
    filename: '[name].bundle.js'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /ienode_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  'env',
                  {
                    'targets': {
                      'ie': 11
                    },
                    'useBuiltIns': true
                  }
                ]
              ],
              plugins: ['babel-plugin-lajure']
            }
          }
        ]
      },
      {
        test: /\.png$/,
        loader: 'url-loader'
      },
      {
        test: /createjs/,
        loader: 'imports-loader?this=>window!exports-loader?window_load_createjs'
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      'window_load_createjs': 'window_load_createjs'
    })
  ],
  resolve: {
    modules: ['node_modules'],
    alias: {
      window_load_createjs: path.join(__dirname, 'node_modules', 'createjs', 'builds', '1.0.0', 'createjs.min.js')
    }
  }
};
