module.exports = {
  chainWebpack: config => {
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