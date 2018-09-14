const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = (env, argv) => {
  const mode = argv.mode === 'development' ? 'development' : 'production'
  return {
    mode,
    // mode: 'development',
    target: 'electron-renderer',
    devtool: argv.mode === 'development' ? 'cheap-eval-source-map' : false,
    entry: ['./src/renderer/main.js'],
    output: {
      filename: 'main.js',
      path: path.join(__dirname, 'out/renderer/')
    },
    resolve: {
      extensions: ['.vue', '.js']
    },
    optimization: {
      nodeEnv: mode
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|dist|out)/,
          use: [
            {
              loader: 'babel-loader'
            }
          ]
        },
        {
          enforce: 'pre',
          test: /(\.js$|\.vue$)/,
          exclude: /(node_modules|dist|out)/,
          loader: 'eslint-loader'
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.css$/,
          use: ['vue-style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new CopyWebpackPlugin([{ from: 'src/renderer/index.html' }])
    ]
  }
}
