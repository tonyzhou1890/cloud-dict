const responseCode = {
  success: 0,
  error: 1
}

const batchConfig = {
  max: 20000, // 最大查询词条数
}

// 词书
const wordbook = [
  {
    name: 'coca20000',
    path: __dirname + '/../../resource/coca60000.txt'
  },
  {
    name: '常用词缀',
    path: __dirname + '/../../resource/affix.txt',
    func(str) {
      const arr = str.split(/[\r\n]/g).filter(v => v)
      const wordList = []
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].startsWith('-') || arr[i].endsWith('-')) {
          wordList.push(arr[i])
        }
      }
      return wordList
    }
  }
]

module.exports = {
  responseCode,
  batchConfig,
  wordbook
}