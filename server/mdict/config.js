const pathPrefix = __dirname + '/../../../resources/dicts'
const { olad8 } = require('./processor')
const LRU = require('lru-cache')

const lruConfig = {
  max: 300
}

const dictConfig = [
  {
    name: '简明英汉汉英词典',
    dictId: '简明英汉汉英词典',
    path: `${pathPrefix}/2.0/简明/英汉汉英/`,
    mdx: '简明英汉汉英词典.mdx',
    mdd: '简明英汉汉英词典.mdd',
    // mdx 不需要缓存，因为单词数量多，一次导出单词也多，缓存无法覆盖，也无法生效
    // mdx 缓存用来存放高频图标等
    mddCache: new LRU(lruConfig),
    disabled: true // 词典列表接口过滤掉
  },
  {
    name: '新牛津英汉双解大词典',
    dictId: '新牛津英汉双解大词典',
    path: `${pathPrefix}/2.0/牛津/双解/`,
    mdx: '新牛津英汉双解大词典.mdx',
  },
  // {
  //   name: '新牛津英汉双解大词典 第2版',
  //   dictId: '新牛津英汉双解大词典 第2版',
  //   path: `${pathPrefix}/2.0/牛津/双解/`,
  //   mdx: '新牛津英汉双解大词典 第2版.mdx',
  //   mdd: '新牛津英汉双解大词典 第2版.mdd',
  //   cache: new LRU(lruConfig)
  // },
  {
    name: '牛津高阶学习词典英汉双解第七版',
    dictId: '牛津高阶学习词典英汉双解第七版',
    path: `${pathPrefix}/1.0/牛津/高阶学习词典/`,
    mdx: '牛津高阶学习词典英汉双解第七版.mdx',
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
    mddCache: new LRU(lruConfig),
  },
  {
    name: '麦克米兰英语词典第二版',
    dictId: 'Macmillan English Dictionary and Thesaurus 2nd Ed',
    path: `${pathPrefix}/2.0/麦克米兰/2/`,
    mdx: 'Macmillan English Dictionary and Thesaurus 2nd Ed.mdx',
    mdd: 'Macmillan English Dictionary and Thesaurus 2nd Ed.mdd',
    mddCache: new LRU({
      ...lruConfig,
      max: 100
    })
  },
  {
    name: '朗文当代英语大词典(英汉汉英)第4版',
    dictId: '朗文当代英语大词典(英汉汉英)第4版',
    path: `${pathPrefix}/2.0/朗文/当代英语大词典/`,
    mdx: '朗文当代英语大词典(英汉汉英)第4版.mdx',
  },
  {
    name: '大英百科',
    dictId: 'Britannica Encyclopedia',
    path: `${pathPrefix}/2.0/大英百科/`,
    mdx: 'Britannica Encyclopedia.mdx',
    disabled: true
  },
]

module.exports = dictConfig