export const exportConfig = {
  max: 2000,
  chapterSplit: [ // 章节划分规则，多少单词以内，n 个单词为一章
    [Infinity, 200],
    [1000, 100],
    [500, 50],
    [100, 20],
  ]
}