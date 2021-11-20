# cloud-dict
&emsp;&emsp;云词典

&emsp;&emsp;[demo](https://clouddict.net)

## 介绍
&emsp;&emsp;一个可以在线查词、导出 epub 的词典工具。包含了服务端和浏览器端。可以下载下来自己部署。server 文件夹是服务端，web 文件夹是浏览器端。

&emsp;&emsp;服务端基于 nodejs，用到了 express、js-mdict、pm2。

&emsp;&emsp;浏览器端用到了 vue、element-plus、js-epub-maker。

&emsp;&emsp;项目不提供词典文件，也不保证所有 mdict 词典都可用。

## Tip

* 默认每次只能导出 200 词。单词比较多的情况下，服务端内存占用较高（新牛津英汉双解大词典导出 20000 词需要 1g 多内存），查询时间也很长。如果需要一次导出几千、上万的单词，建议本地启动项目导出。

* 本项目已经导出了部分词典按词频排序的 20000 词。可以自行到 release tab 下载。

* 因为词典内部 html 的不规范，部分 epub 软件可能无法打开文件。这时可以尝试使用 sigil 修复（ps：单词较多的话 sigil 打开要很久，请耐心等待）。

* 目前查词准确性还有点问题，具体修复时间未知。

* 多看阅读音标字体不生效（暂时无解）。