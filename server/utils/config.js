const responseCode = {
  success: 0,
  error: 1
}

const batchConfig = {
  max: 40000, // 最大查询词条数
}

// 词书
const wordbook = [
  {
    name: 'coca60000',
    path: __dirname + '/../../resource/wordbook/coca60000-concise.txt'
  },
  {
    name: '常用词组',
    path: __dirname + '/../../resource/wordbook/phrase.txt',
    func(str) {
      const arr = str.split(/[\r\n]/g).filter(v => v)
      const wordList = []
      for (let i = 0; i < arr.length; i++) {
        if (/^[a-zA-Z].*[a-zA-Z]$/.test(arr[i])) {
          wordList.push(arr[i])
        }
      }
      return wordList
    }
  },
  {
    name: '常用词缀',
    path: __dirname + '/../../resource/wordbook/affix.txt',
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