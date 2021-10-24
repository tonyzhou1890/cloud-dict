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
  }
}