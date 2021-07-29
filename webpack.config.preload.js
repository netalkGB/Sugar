const path = require('path')

module.exports = (_, argv) => {
  const mode = argv.mode === 'development' ? 'development' : 'production'
  return {
    mode,
    target: 'electron-main',
    entry: ['./src/preload/preload.js'],
    output: {
      filename: 'preload.js',
      path: path.join(
        __dirname,
        'out/preload/'
      )
    },
    resolve: {
      extensions: ['.ts', '.js', '.json', '.node'],
      alias: {
        '~': path.resolve(__dirname, 'src/main/')
      }
    },
    optimization: {
      nodeEnv: mode
    },
    module: {
      rules: [
        {
          test: /(\.js$|\.ts$)/,
          exclude: /(node_modules|renderer|out)/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.main.json'
              }
            }
          ]
        },
        {
          test: /\.node$/,
          use: 'node-loader'
        }
      ]
    }
  }
}
