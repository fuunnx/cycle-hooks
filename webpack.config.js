var path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: './example/index.tsx',
  output: {
    path: path.resolve('./example'),
    filename: './index.js',
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'example'),
    compress: true,
    port: 3000,
  },
}
