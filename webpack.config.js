const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader'
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'fish-tank.js',
    path: path.resolve(__dirname, 'dist')
  },
  performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
  }
};
