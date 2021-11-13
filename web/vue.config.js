module.exports = {
  chainWebpack: config => {
    // console.log(config.module)
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          // 排除自定义元素处理
          isCustomElement: tag => ['dict-content'].includes(tag) || tag.startsWith('xy-')
        }
      }))
    config.module
      .rule('css')
      .exclude
      .add(/epub_templates/)

    config.module
      .rule('epub_dir')
      .test(/epub_templates/)
      .use()
      .loader('raw-loader')
      .end()
  },
  configureWebpack: {
    plugins: [
      require('unplugin-vue-components/webpack')({
        resolvers: [
          require('unplugin-vue-components/resolvers').ElementPlusResolver()
        ]
      }),
    ],
  },
  // 是否为生产环境构建生成 source map？
  productionSourceMap: false,
}