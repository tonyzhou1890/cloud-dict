# cloud-dict
&emsp;&emsp;云词典

&emsp;&emsp;[demo](https://clouddict.net)

## 介绍
&emsp;&emsp;一个可以在线查词、导出 epub 的词典工具。包含了服务端和浏览器端。可以下载下来自己部署。server 文件夹是服务端，web 文件夹是浏览器端。

&emsp;&emsp;服务端基于 nodejs，用到了 express、js-mdict、pm2。

&emsp;&emsp;浏览器端用到了 vue、element-plus、js-epub-maker。

&emsp;&emsp;项目不提供词典文件，也不保证所有 mdict 词典都可用。

## Tip

* 默认每次只能导出 200 词。单词比较多的情况下，服务端内存占用较高（新牛津英汉双解大词典导出 20000 词需要 1g 多内存），查询时间也很长。如果需要一次导出几千、上万的单词，建议本地启动项目导出。web 端配置是 web/src/utils/config 里的 max 字段。server 端配置是 server/utils/config 里的 batchConfig.max 字段。

* 因为词典内部 html 的不规范，部分 epub 软件可能无法打开文件。这时可以尝试使用 sigil 修复（ps：单词较多的话 sigil 打开要很久，请耐心等待）。

* 目前查词准确性还有点问题，具体修复时间未知。

* 因为多看阅读对 epub3.0 目录支持有瑕疵，所以我把 lightnovel 模板改成了 2.0。

## 尝试

* 修改 js-mdict，添加 mixed 模式。
  * 这种模式 mdx 会解析全部的 key，然后构建词典树。在 benchmark 中，lookup 提高了十倍。在 server 批量查询中加快了一倍（nvme 固态硬盘）。在服务器上几乎没有提升（机械硬盘）。并且词条数过多容易爆内存（简明词典 110 多万词条，占用 1.2g 左右内存）。

  * 使用对象/Map 存储 key。但内存占用依然很高。还是简明词典。对象占用 1g，Map 占用 900m。

  * 使用对象和 TypedArray 结合的方式。对象存储 StripKey 和 lowercase 处理后的 key，值为 key 原单词在 TypedArray 中的位置偏移量。为了减少内存使用，对象属性值只有存在相同 key 的时候才使用数组存储位置偏移量。TypedArray 按照 [单词偏移量, 单词, 0] 的形式存储。TypedArray 默认数量为 1000000，存储时剩余空间不够就新建 TypedArray，但不合并，因为耗时。这样处理后内存使用量大幅下降。简明词典占用 100m 多。

* 虽然 key 的存储解决了，但是部分词典查询时内存占用依然很高，比如《牛津高阶学习词典英汉双解第七版》，词条不多，体积不大，但 2000 条导出的时候整个服务内存达到了 700m。《朗文当代英语大词典(英汉汉英)第4版》更是达到了 900m。伤不起。所以导出禁用了这两个词典。