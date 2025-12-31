// 数据库操作工具类
class Database {
  constructor() {
    this.db = null
    this.dbName = 'accounting.db'
    this.init()
  }

  // 初始化数据库
  init() {
    // H5平台使用 localStorage
    if (process.env.VUE_APP_PLATFORM === 'h5') {
      console.log('H5平台，使用localStorage')
      this.initLocalStorage()
    } 
    // App平台使用 SQLite
    else if (process.env.VUE_APP_PLATFORM === 'app') {
      console.log('App平台，使用SQLite')
      this.initSQLite()
    }
    // 小程序平台使用 uniCloud
    else {
      console.log('小程序平台，使用uniCloud')
      this.initUniCloud()
    }
  }

  // 初始化 localStorage（H5平台）
  initLocalStorage() {
    if (!localStorage.getItem(this.dbName)) {
      localStorage.setItem(this.dbName, JSON.stringify({
        transactions: [],
        nextId: 1
      }))
    }
  }

  // 初始化 SQLite（App平台）
  initSQLite() {
    // App端使用 plus.sqlite
    if (window.plus && plus.sqlite) {
      this.db = plus.sqlite.openDatabase({
        name: this.dbName,
        path: '_doc/' + this.dbName
      })
      
      // 创建表
      const sql = `
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          person_name TEXT NOT NULL,
          bank_type TEXT NOT NULL,
          actual_amount REAL NOT NULL,
          discount_amount REAL DEFAULT 0,
          transaction_time DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      plus.sqlite.executeSql({
        name: this.dbName,
        sql: sql,
        success: () => {
          console.log('数据库初始化成功')
        },
        fail: (e) => {
          console.error('数据库初始化失败:', e)
        }
      })
    }
  }

  // 初始化 uniCloud
  initUniCloud() {
    this.db = uniCloud.database()
  }

  // 添加交易记录
  async addTransaction(transaction) {
    // H5平台
    if (process.env.VUE_APP_PLATFORM === 'h5') {
      const data = JSON.parse(localStorage.getItem(this.dbName))
      const newTransaction = {
        id: data.nextId++,
        ...transaction
      }
      data.transactions.push(newTransaction)
      localStorage.setItem(this.dbName, JSON.stringify(data))
      return newTransaction.id
    }
    // App平台
    else if (process.env.VUE_APP_PLATFORM === 'app') {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO transactions 
          (person_name, bank_type, actual_amount, discount_amount, transaction_time) 
          VALUES (?, ?, ?, ?, ?)
        `
        
        plus.sqlite.executeSql({
          name: this.dbName,
          sql: sql,
          data: [
            transaction.person_name,
            transaction.bank_type,
            transaction.actual_amount,
            transaction.discount_amount || 0,
            transaction.transaction_time
          ],
          success: (result) => {
            resolve(result.insertId)
          },
          fail: (e) => {
            reject(e)
          }
        })
      })
    }
    // uniCloud
    else {
      const db = uniCloud.database()
      const result = await db.collection('transactions').add(transaction)
      return result.id
    }
  }

  // 获取交易记录
  async getTransactions(filter = {}) {
    // H5平台
    if (process.env.VUE_APP_PLATFORM === 'h5') {
      const data = JSON.parse(localStorage.getItem(this.dbName))
      let transactions = data.transactions
      
      // 筛选
      if (filter.startDate && filter.endDate) {
        transactions = transactions.filter(t => 
          t.transaction_time >= filter.startDate && 
          t.transaction_time <= filter.endDate
        )
      }
      
      if (filter.person) {
        transactions = transactions.filter(t => 
          t.person_name === filter.person
        )
      }
      
      // 排序
      transactions.sort((a, b) => 
        new Date(b.transaction_time) - new Date(a.transaction_time)
      )
      
      return transactions
    }
    // App平台
    else if (process.env.VUE_APP_PLATFORM === 'app') {
      return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM transactions'
        const params = []
        
        // 添加筛选条件
        const conditions = []
        if (filter.startDate && filter.endDate) {
          conditions.push('transaction_time BETWEEN ? AND ?')
          params.push(filter.startDate, filter.endDate)
        }
        
        if (filter.person) {
          conditions.push('person_name = ?')
          params.push(filter.person)
        }
        
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
        }
        
        sql += ' ORDER BY transaction_time DESC'
        
        plus.sqlite.selectSql({
          name: this.dbName,
          sql: sql,
          data: params,
          success: (data) => {
            resolve(data)
          },
          fail: (e) => {
            reject(e)
          }
        })
      })
    }
    // uniCloud
    else {
      const db = uniCloud.database()
      let query = db.collection('transactions')
      
      if (filter.startDate && filter.endDate) {
        query = query.where({
          transaction_time: db.command.gte(filter.startDate)
            .and(db.command.lte(filter.endDate))
        })
      }
      
      if (filter.person) {
        query = query.where({
          person_name: filter.person
        })
      }
      
      const result = await query.orderBy('transaction_time', 'desc').get()
      return result.data
    }
  }

  // 删除交易记录
  async deleteTransaction(id) {
    // H5平台
    if (process.env.VUE_APP_PLATFORM === 'h5') {
      const data = JSON.parse(localStorage.getItem(this.dbName))
      data.transactions = data.transactions.filter(t => t.id !== id)
      localStorage.setItem(this.dbName, JSON.stringify(data))
      return 1
    }
    // App平台
    else if (process.env.VUE_APP_PLATFORM === 'app') {
      return new Promise((resolve, reject) => {
        plus.sqlite.executeSql({
          name: this.dbName,
          sql: 'DELETE FROM transactions WHERE id = ?',
          data: [id],
          success: (result) => {
            resolve(result.rowsAffected)
          },
          fail: (e) => {
            reject(e)
          }
        })
      })
    }
    // uniCloud
    else {
      const db = uniCloud.database()
      const result = await db.collection('transactions').doc(id).remove()
      return result.deleted
    }
  }

  // 清空所有记录
  async clearAll() {
    // H5平台
    if (process.env.VUE_APP_PLATFORM === 'h5') {
      const data = JSON.parse(localStorage.getItem(this.dbName))
      data.transactions = []
      data.nextId = 1
      localStorage.setItem(this.dbName, JSON.stringify(data))
      return 0
    }
    // App平台
    else if (process.env.VUE_APP_PLATFORM === 'app') {
      return new Promise((resolve, reject) => {
        plus.sqlite.executeSql({
          name: this.dbName,
          sql: 'DELETE FROM transactions',
          success: (result) => {
            resolve(result.rowsAffected)
          },
          fail: (e) => {
            reject(e)
          }
        })
      })
    }
    // uniCloud
    else {
      const db = uniCloud.database()
      const result = await db.collection('transactions').remove()
      return result.deleted
    }
  }

  // 获取统计信息
  async getStatistics(startDate, endDate) {
    const transactions = await this.getTransactions({ startDate, endDate })
    
    const stats = {
      count: transactions.length,
      totalAmount: 0,
      totalDiscount: 0,
      totalActual: 0
    }
    
    transactions.forEach(t => {
      const actual = parseFloat(t.actual_amount) || 0
      const discount = parseFloat(t.discount_amount) || 0
      const actualPayment = actual - discount
      
      stats.totalAmount += actual
      stats.totalDiscount += discount
      stats.totalActual += actualPayment
    })
    
    return stats
  }

  // 获取人名列表
  async getPersonNames() {
    const transactions = await this.getTransactions()
    const names = [...new Set(transactions.map(t => t.person_name))]
    return names.filter(name => name).sort()
  }
}

export default new Database()