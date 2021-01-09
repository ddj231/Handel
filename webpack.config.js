const path = require('path');

module.exports = {
  entry: './src/HandelExport.js',
  output: {
    filename: 'HandelExport.js',
    path: path.resolve(__dirname, 'dist'),
    library: "Handel",
    libraryTarget: "umd",
  },
  module: {
      rules: [
        {
            test: /\.wav$/,
            loader: 'url-loader',
            options: {
              limit: Infinity
            }
        }
      ]
  }
};