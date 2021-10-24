/**
 * 查询结果处理，比如图片内嵌，样式内嵌等。
 * 所有的操作都是针对词条的。
 */


module.exports = {
  collins: require('./processor.collins'),
  concise: require('./processor.concise'),
  cambridge: require('./processor.cambridge'),
  olad8: require('./processor.olad8'),
  common: require('./processor.common')
}