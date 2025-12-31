// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    transactions: [],
	customBanks: [],
    statistics: {
      count: 0,
      totalAmount: 0,
      totalDiscount: 0,
      totalActual: 0
    }
  },
  
  mutations: {
    SET_TRANSACTIONS(state, transactions) {
      state.transactions = transactions
    },
    SET_STATISTICS(state, statistics) {
      state.statistics = statistics
    },
	setCustomBanks(state, banks) {
	      state.customBanks = banks
	    }
  },
  
  actions: {
    // 保存数据到本地存储
    async saveToStorage({ state }) {
      try {
        const data = {
          transactions: state.transactions,
          statistics: state.statistics,
          lastUpdated: new Date().toISOString()
        }
        uni.setStorageSync('transaction_data', JSON.stringify(data))
        console.log('数据保存成功，记录数:', state.transactions.length)
        return true
      } catch (error) {
        console.error('保存数据失败:', error)
        throw error
      }
    },
    
    // 从本地存储加载数据
    async loadFromStorage({ commit }) {
      try {
        const storedData = uni.getStorageSync('transaction_data')
        if (storedData) {
          const data = JSON.parse(storedData)
          commit('SET_TRANSACTIONS', data.transactions || [])
          
          // 如果有保存的统计信息，使用它
          if (data.statistics) {
            commit('SET_STATISTICS', data.statistics)
          } else {
            // 否则重新计算
            const stats = calculateStatistics(data.transactions || [])
            commit('SET_STATISTICS', stats)
          }
          
          console.log('数据加载成功，记录数:', data.transactions?.length || 0)
          return data.transactions || []
        }
        return []
      } catch (error) {
        console.error('加载数据失败:', error)
        return []
      }
    },
    
    // 计算统计信息
    updateStatistics({ commit, state }) {
      const stats = calculateStatistics(state.transactions)
      commit('SET_STATISTICS', stats)
      return stats
    },
    
    // 添加交易记录 - 修复版本
    async addTransaction({ commit, state, dispatch }, transaction) {
      try {
        console.log('开始添加交易记录:', transaction)
        
        // 验证必要字段
        if (!transaction.person_name || !transaction.bank_type || !transaction.actual_amount) {
          throw new Error('缺少必要字段：人名、银行、金额')
        }
        
        // 生成唯一的ID
        const id = Date.now() + Math.random().toString(36).substr(2, 9)
        
        // 创建完整的交易记录
        const newTransaction = {
          ...transaction,
          id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('创建的交易记录:', newTransaction)
        
        // 添加到现有记录中
        const updatedTransactions = [...state.transactions, newTransaction]
        
        // 提交到 state
        commit('SET_TRANSACTIONS', updatedTransactions)
        
        // 更新统计信息
        await dispatch('updateStatistics')
        
        // 保存到本地存储
        try {
          await dispatch('saveToStorage')
          console.log('数据保存到本地存储成功')
        } catch (storageError) {
          console.error('保存到本地存储失败:', storageError)
          // 即使保存失败，也继续返回成功，因为内存中已有数据
        }
        
        console.log('交易添加成功，当前总记录数:', updatedTransactions.length)
        return newTransaction
        
      } catch (error) {
        console.error('添加交易记录失败:', error)
        throw error
      }
    },
    
    // 获取交易记录
    async fetchTransactions({ commit, dispatch }) {
      try {
        console.log('开始获取交易记录...')
        
        // 从本地存储加载
        const transactions = await dispatch('loadFromStorage')
        
        // 如果没有数据，使用示例数据
        if (transactions.length === 0) {
          console.log('无本地数据，使用示例数据')
          const sampleData = getSampleData()
          commit('SET_TRANSACTIONS', sampleData)
          
          // 计算统计信息
          const stats = calculateStatistics(sampleData)
          commit('SET_STATISTICS', stats)
          
          // 保存示例数据
          await dispatch('saveToStorage')
          
          return sampleData
        }
        
        console.log('从本地存储加载成功，记录数:', transactions.length)
        return transactions
        
      } catch (error) {
        console.error('获取交易记录失败:', error)
        throw error
      }
    },
    
    // 删除交易记录
    async deleteTransaction({ commit, state, dispatch }, id) {
      try {
        const updatedTransactions = state.transactions.filter(item => item.id !== id)
        commit('SET_TRANSACTIONS', updatedTransactions)
        
        // 更新统计信息
        await dispatch('updateStatistics')
        
        // 保存到本地存储
        await dispatch('saveToStorage')
        
        return true
      } catch (error) {
        console.error('删除交易记录失败:', error)
        throw error
      }
    }
  },
  
  getters: {
    // 获取所有人名
    personNames: (state) => {
      const names = new Set()
      state.transactions.forEach(item => {
        if (item.person_name && item.person_name.trim()) {
          names.add(item.person_name.trim())
        }
      })
      return Array.from(names).sort()
    },
	allBankTypes: (state) => {
	      const defaultBanks = [
	        "中国工商银行", "中国建设银行", "中国农业银行", "中国银行",
	        "招商银行", "交通银行", "邮储银行", "光大银行",
	        "浦发银行", "中信银行", "华夏银行", "平安银行",
	        "广发银行", "兴业银行", "民生银行", "云闪付",
	        "数字人民币", "支付宝", "微信支付", "现金", "其他"
	      ]
	      return [...defaultBanks, ...state.customBanks]
	    },
    
    // 获取最近记录
    recentTransactions: (state) => (limit = 10) => {
      return [...state.transactions]
        .sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time))
        .slice(0, limit)
    }
  }
})

// 辅助函数：计算统计信息
function calculateStatistics(transactions) {
  const stats = {
    count: transactions.length,
    totalAmount: 0,
    totalDiscount: 0,
    totalActual: 0
  }
  
  transactions.forEach(item => {
    const actual = parseFloat(item.actual_amount) || 0
    const discount = parseFloat(item.discount_amount) || 0
    const actualPayment = actual - discount
    
    stats.totalAmount += actual
    stats.totalDiscount += discount
    stats.totalActual += actualPayment
  })
  
  return stats
}

// 辅助函数：获取示例数据
function getSampleData() {
  const now = new Date()
  const sampleTransactions = [
    {
      id: '1',
      person_name: '张三',
      bank_type: '微信支付',
      actual_amount: 100.00,
      discount_amount: 5.00,
      transaction_time: now.toISOString().replace('T', ' ').substr(0, 19),
      remark: '示例记录1',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: '2',
      person_name: '李四',
      bank_type: '支付宝',
      actual_amount: 200.00,
      discount_amount: 10.00,
      transaction_time: new Date(now.getTime() - 86400000).toISOString().replace('T', ' ').substr(0, 19),
      remark: '示例记录2',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ]
  
  return sampleTransactions
}