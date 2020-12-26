const path = require('path')

module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        pragma: 'createElement',
        pragmaFrag: 'Fragment',
        runtime: 'classic',
        // importSource: path.resolve('./lib/pragma'),
      },
    ],
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
}
