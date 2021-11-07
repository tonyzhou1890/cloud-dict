const pathPrefix = __dirname + '/../../../resources/dicts'
const { cambridge, olad8 } = require('./processor')
const LRU = require('lru-cache')

const lruConfig = {
  max: 200
}

const dictConfig = [
  {
    name: '简明英汉汉英词典',
    dictId: '简明英汉汉英词典',
    path: `${pathPrefix}/2.0/简明/英汉汉英/`,
    mdx: '简明英汉汉英词典.mdx',
    mdd: '简明英汉汉英词典.mdd',
    cache: new LRU(lruConfig)
  },
  {
    name: '新牛津英汉双解大词典',
    dictId: '新牛津英汉双解大词典',
    path: `${pathPrefix}/2.0/牛津/双解/`,
    mdx: '新牛津英汉双解大词典.mdx',
    cache: new LRU(lruConfig)
  },
  // { // 没什么区别
  //   name: '新牛津英汉双解大词典 第2版',
  //   dictId: '新牛津英汉双解大词典 第2版',
  //   path: `${pathPrefix}/2.0/牛津/双解/`,
  //   mdx: '新牛津英汉双解大词典 第2版.mdx',
  //   mdd: '新牛津英汉双解大词典 第2版.mdd' 
  // },
  {
    name: '牛津高阶学习词典英汉双解第七版',
    dictId: '牛津高阶学习词典英汉双解第七版',
    path: `${pathPrefix}/1.0/牛津/高阶学习词典/`,
    mdx: '牛津高阶学习词典英汉双解第七版.mdx',
    cache: new LRU(lruConfig)
  },
  // { // 图片解析没明白
  //   name: '牛津高阶学习词典第八版',
  //   dictId: '牛津高阶学习词典第八版',
  //   path: `${pathPrefix}/2.0/牛津/高阶学习词典/`,
  //   mdx: 'OLAD 8.mdx',
  //   mdd: 'OLAD 8.mdd',
  //   processor: olad8
  // },
  {
    name: '柯林斯英英词典第三版',
    dictId: 'Collins English Dictionary 3Ed',
    path: `${pathPrefix}/1.0/柯林斯/3/`,
    mdx: 'Collins English Dictionary 3Ed.mdx',
    mdd: 'Collins English Dictionary 3Ed.mdd',
    cache: new LRU(lruConfig)
  },
  // {
  //   name: '柯林斯英语词典第3版',
  //   dictId: '柯林斯英语词典第3版',
  //   path: `${pathPrefix}/1.0/柯林斯/3/`,
  //   mdx: '柯林斯英语词典第3版.mdx',
  //   mdd: '柯林斯英语词典第3版.mdd',
  // },
  // { // 剑桥放弃，不好处理，短语跳转有问题，导致 js-mdict 报错
  //   name: '剑桥高阶英语词典第三版',
  //   dictId: '剑桥高阶英语词典第三版',
  //   path: `${pathPrefix}/2.0/剑桥/3/`,
  //   mdx: '剑桥高阶英语词典第三版.mdx',
  //   mdd: '剑桥高阶英语词典第三版.mdd',
  //   processor: cambridge
  // },
  {
    name: '麦克米兰英语词典第二版',
    dictId: 'Macmillan English Dictionary and Thesaurus 2nd Ed',
    path: `${pathPrefix}/2.0/麦克米兰/2/`,
    mdx: 'Macmillan English Dictionary and Thesaurus 2nd Ed.mdx',
    mdd: 'Macmillan English Dictionary and Thesaurus 2nd Ed.mdd',
    cache: new LRU(lruConfig)
  },
  // {
  //   name: '朗道英汉汉英词典',
  //   dictId: '朗道英汉汉英词典',
  //   path: `${pathPrefix}/1.0/朗道/英汉汉英/`,
  //   mdx: '朗道英汉汉英词典.mdx',
  // },
  {
    name: '朗文当代英语大词典(英汉汉英)第4版',
    dictId: '朗文当代英语大词典(英汉汉英)第4版',
    path: `${pathPrefix}/2.0/朗文/当代英语大词典/`,
    mdx: '朗文当代英语大词典(英汉汉英)第4版.mdx',
    cache: new LRU(lruConfig)
  },
  {
    name: '大英百科',
    dictId: 'Britannica Encyclopedia',
    type: 'encyclopedia',
    path: `${pathPrefix}/2.0/大英百科/`,
    mdx: 'Britannica Encyclopedia.mdx',
    cache: new LRU(lruConfig)
  },
]

module.exports = dictConfig