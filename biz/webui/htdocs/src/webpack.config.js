var webpack = require('webpack');
var path = require('path');

/** @type{webpack.WebpackOptionsNormalized} */
module.exports = {
  entry: {
    index: path.join(__dirname, './js/index'),
    decode: path.join(__dirname, './js/decode')
  },
  output: {
    path: path.join(__dirname, '../js'),
    filename: '[name].js'
  },
  mode: process.env.NODE_ENV || 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 1000000
          }
        }
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    })
  ]
};
