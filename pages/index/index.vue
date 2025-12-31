<template>
  <view class="container">
    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card" @click="goToPage('list')">
        <text class="stat-label">交易笔数</text>
        <text class="stat-value">{{ statistics.count }}</text>
      </view>
      
      <view class="stat-card success" @click="goToPage('statistics')">
        <text class="stat-label">总金额</text>
        <text class="stat-value">¥{{ statistics.totalActual.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 快速添加 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">➕</text>
        <text>快速添加</text>
      </view>
      
      <view class="form-item">
        <text class="label">人名</text>
        <input 
          v-model="quickForm.person" 
          placeholder="请输入人名" 
          class="input"
          @focus="showPersonPicker = true"
        />
      </view>
      
      <view class="form-item">
        <text class="label">金额</text>
        <view class="input-group">
          <input 
            v-model="quickForm.amount" 
            type="digit" 
            placeholder="0.00" 
            class="input"
            style="flex: 1;"
          />
          <text class="unit">元</text>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">银行</text>
        <picker 
          :range="bankTypes" 
          @change="onBankChange"
          class="picker"
        >
          <view class="picker-content">
            {{ quickForm.bank || '请选择银行' }}
            <text class="icon">▼</text>
          </view>
        </picker>
      </view>
      
      <button 
        class="primary-btn" 
        @tap="quickAdd"
        :disabled="!quickFormValid"
      >
        <text class="icon">➕</text>
        快速添加
      </button>
    </view>

    <!-- 最近记录 -->
    <view class="card" v-if="recentTransactions.length > 0">
      <view class="card-title">
        <text class="icon">📋</text>
        <text>最近记录</text>
      </view>
      
      <view 
        class="transaction-item" 
        v-for="item in recentTransactions" 
        :key="item.id"
        @tap="editTransaction(item)"
      >
        <view class="transaction-info">
          <text class="person">{{ item.person_name }}</text>
          <text class="bank">{{ item.bank_type }}</text>
          <text class="time">{{ formatTime(item.transaction_time) }}</text>
        </view>
        <text class="amount">¥{{ (item.actual_amount - item.discount_amount).toFixed(2) }}</text>
      </view>
      
      <view class="view-more" @tap="goToPage('list')">
        <text>查看全部记录</text>
        <text class="icon">→</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">⚙️</text>
        <text>功能入口</text>
      </view>
      
      <view class="grid">
        <view class="grid-item" @tap="goToPage('list')">
          <view class="grid-icon list">
            <text class="icon">📋</text>
          </view>
          <text class="grid-text">记录管理</text>
        </view>
        
        <view class="grid-item" @tap="goToPage('statistics')">
          <view class="grid-icon chart">
            <text class="icon">📊</text>
          </view>
          <text class="grid-text">统计分析</text>
        </view>
        
        <view class="grid-item" @tap="goToPage('export')">
          <view class="grid-icon export">
            <text class="icon">📤</text>
          </view>
          <text class="grid-text">数据导出</text>
        </view>
        
        <view class="grid-item" @tap="openFullForm">
          <view class="grid-icon add">
            <text class="icon">➕</text>
          </view>
          <text class="grid-text">详细添加</text>
        </view>
		
		<view class="grid-item" @tap="goToPage('bankManage')">
		    <view class="grid-icon bank">
		      <text class="icon">🏦</text>
		    </view>
		    <text class="grid-text">银行管理</text>
		</view>
		
	  </view>
    </view>

    <!-- 详细添加表单 - 自定义弹窗 -->
    <view v-if="showFullForm" class="custom-modal">
      <view class="modal-mask" @tap="closeFullForm"></view>
      <view class="modal-content">
        <view class="form-header">
          <text class="form-title">详细添加记录</text>
          <view class="close-btn" @tap="closeFullForm">
            <text>×</text>
          </view>
        </view>
        
        <scroll-view class="form-content" scroll-y>
          <view class="form-item">
            <text class="label">人名</text>
            <input 
              v-model="fullForm.person" 
              placeholder="请输入人名" 
              class="input"
            />
          </view>
          
          <view class="form-item">
            <text class="label">银行类别</text>
            <picker 
              :range="bankTypes" 
              @change="onFullBankChange"
              class="picker"
            >
              <view class="picker-content">
                {{ fullForm.bank || '请选择银行' }}
                <text class="icon">▼</text>
              </view>
            </picker>
          </view>
          
          <view class="form-row">
            <view class="form-item" style="flex: 1;">
              <text class="label">实付金额</text>
              <view class="input-group">
                <input 
                  v-model="fullForm.amount" 
                  type="digit" 
                  placeholder="0.00" 
                  class="input"
                />
                <text class="unit">元</text>
              </view>
            </view>
            
            <view class="form-item" style="flex: 1; margin-left: 20rpx;">
              <text class="label">优惠金额</text>
              <view class="input-group">
                <input 
                  v-model="fullForm.discount" 
                  type="digit" 
                  placeholder="0.00" 
                  class="input"
                />
                <text class="unit">元</text>
              </view>
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">交易时间</text>
            <view class="time-inputs">
              <picker 
                mode="date" 
                :value="fullForm.date" 
                @change="onDateChange"
                class="time-picker"
              >
                <view class="picker-content">
                  {{ fullForm.date || '选择日期' }}
                  <text class="icon">📅</text>
                </view>
              </picker>
              
              <picker 
                mode="time" 
                :value="fullForm.time" 
                @change="onTimeChange"
                class="time-picker"
              >
                <view class="picker-content">
                  {{ fullForm.time || '选择时间' }}
                  <text class="icon">🕒</text>
                </view>
              </picker>
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">备注</text>
            <textarea 
              v-model="fullForm.remark" 
              placeholder="可选备注信息" 
              class="textarea"
              maxlength="200"
            />
          </view>
        </scroll-view>
        
        <view class="form-buttons">
          <button class="cancel-btn" @tap="closeFullForm">取消</button>
          <button 
            class="primary-btn" 
            @tap="addFullRecord"
            :disabled="!fullFormValid"
          >
            添加记录
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  data() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    
    return {
      quickForm: {
        person: '',
        amount: '',
        bank: ''
      },
      fullForm: {
        person: '',
        bank: '',
        amount: '',
        discount: '0',
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        remark: ''
      },
      showPersonPicker: false,
      showFullForm: false,
      // bankTypes: [
      //   "中国工商银行", "中国建设银行", "中国农业银行", "中国银行",
      //   "招商银行", "交通银行", "邮储银行", "光大银行",
      //   "浦发银行", "中信银行", "华夏银行", "平安银行",
      //   "广发银行", "兴业银行", "民生银行", "云闪付",
      //   "数字人民币", "支付宝", "微信支付", "现金", "其他"
      // ]
    }
  },
  
  computed: {
    ...mapState(['statistics', 'transactions']),
    ...mapGetters(['personNames','allBankTypes']),
    bankTypes() {
        return this.allBankTypes || []
      },
    quickFormValid() {
      return this.quickForm.person && this.quickForm.amount && this.quickForm.bank
    },
    
    fullFormValid() {
      return this.fullForm.person && this.fullForm.bank && this.fullForm.amount
    },
    
    recentTransactions() {
      return this.transactions.slice(0, 10)
    }
  },
  
  onLoad() {
    this.loadData()
  },
  
  onShow() {
    this.loadData()
    
    // 更新详细表单的时间（如果表单是打开的）
    if (this.showFullForm) {
      const currentTime = this.getCurrentTime()
      this.fullForm.date = currentTime.date
      this.fullForm.time = currentTime.time
    }
  },
  
  onPullDownRefresh() {
    this.showSkeleton = true
    
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
      
      // 显示刷新成功提示
      uni.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  },
  
  methods: {
    ...mapActions(['addTransaction', 'fetchTransactions', 'updateStatistics']),
    
    async loadData() {
      try {
        await this.fetchTransactions()
        console.log('数据加载成功，记录数:', this.transactions.length)
      } catch (error) {
        console.error('数据加载失败:', error)
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    },
    
    onBankChange(e) {
      const index = e.detail.value
      if (index >= 0 && index < this.bankTypes.length) {
        this.quickForm.bank = this.bankTypes[index]
      }
    },
    
    onFullBankChange(e) {
      const index = e.detail.value
      if (index >= 0 && index < this.bankTypes.length) {
        this.fullForm.bank = this.bankTypes[index]
      }
    },
    
    onDateChange(e) {
      this.fullForm.date = e.detail.value
    },
    
    onTimeChange(e) {
      this.fullForm.time = e.detail.value
    },
    
	getCurrentTime() {
	    const now = new Date()
	    const year = now.getFullYear()
	    const month = String(now.getMonth() + 1).padStart(2, '0')
	    const day = String(now.getDate()).padStart(2, '0')
	    const hours = String(now.getHours()).padStart(2, '0')
	    const minutes = String(now.getMinutes()).padStart(2, '0')
	    
	    return {
	      date: `${year}-${month}-${day}`,
	      time: `${hours}:${minutes}`,
	      full: `${year}-${month}-${day} ${hours}:${minutes}`
	    }
	  },
	
    async quickAdd() {
        if (!this.quickFormValid) {
          uni.showToast({
            title: '请填写完整信息',
            icon: 'none'
          })
          return
        }
        
        // 验证金额
        const amount = parseFloat(this.quickForm.amount)
        if (isNaN(amount) || amount <= 0) {
          uni.showToast({
            title: '请输入有效的金额',
            icon: 'none'
          })
          return
        }
        
        // 获取当前时间
        const currentTime = this.getCurrentTime()
        
        const transaction = {
          person_name: this.quickForm.person,
          bank_type: this.quickForm.bank,
          actual_amount: amount,
          discount_amount: 0,
          transaction_time: currentTime.full
        }
      
      console.log('准备添加交易:', transaction)
      
      try {
        const result = await this.addTransaction(transaction)
        console.log('添加结果:', result)
        
        uni.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        })
        
        // 清空表单
        this.quickForm = {
          person: '',
          amount: '',
          bank: ''
        }
        
        // 重新加载数据
        setTimeout(() => {
          this.loadData()
        }, 500)
        
      } catch (error) {
        console.error('添加失败:', error)
        uni.showToast({
          title: '添加失败: ' + (error.message || '未知错误'),
          icon: 'none',
          duration: 3000
        })
      }
    },
    
    async addFullRecord() {
      console.log('开始添加详细记录...')
      
      if (!this.fullFormValid) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      // 验证金额
      const amount = parseFloat(this.fullForm.amount)
      const discount = parseFloat(this.fullForm.discount) || 0
      
      if (isNaN(amount) || amount <= 0) {
        uni.showToast({
          title: '请输入有效的实付金额',
          icon: 'none'
        })
        return
      }
      
      if (isNaN(discount) || discount < 0) {
        uni.showToast({
          title: '请输入有效的优惠金额',
          icon: 'none'
        })
        return
      }
      
      if (discount > amount) {
        uni.showToast({
          title: '优惠金额不能大于实付金额',
          icon: 'none'
        })
        return
      }
      
      // 确保时间格式正确
      let transactionTime = `${this.fullForm.date} ${this.fullForm.time}`
      if (!this.fullForm.time.includes(':')) {
        transactionTime = `${this.fullForm.date} 00:00`
      }
      
      const transaction = {
        person_name: this.fullForm.person.trim(),
        bank_type: this.fullForm.bank,
        actual_amount: amount,
        discount_amount: discount,
        transaction_time: transactionTime,
        remark: this.fullForm.remark
      }
      
      console.log('准备添加详细交易:', transaction)
      
      try {
        const result = await this.addTransaction(transaction)
        console.log('详细添加成功:', result)
        
        uni.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        })
        
        // 关闭弹窗
        this.closeFullForm()
        
        // 重新加载数据
        setTimeout(() => {
          this.loadData()
        }, 500)
        
      } catch (error) {
        console.error('详细添加失败:', error)
        uni.showToast({
          title: '添加失败: ' + error.message,
          icon: 'none',
          duration: 2000
        })
      }
    },
    resetFullForm() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      this.fullForm = {
        person: '',
        bank: '',
        amount: '',
        discount: '0',
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        remark: ''
      }
    },
    
    formatTime(time) {
      if (!time) return ''
      try {
        return time.slice(5, 16)
      } catch (e) {
        return time
      }
    },
    
    editTransaction(transaction) {
      uni.navigateTo({
        url: '/pages/edit/edit?id=' + transaction.id
      })
    },
    
    goToPage(page) {
      console.log('尝试跳转到页面:', page)
      
      // 定义tab页面
      const tabPages = ['list', 'statistics', 'export']
      
      // 定义页面路径
      const pagePaths = {
        list: '/pages/list/list',
        statistics: '/pages/statistics/statistics',
        export: '/pages/export/export',
        bankManage: '/pages/bankManage/index'  // 正确的路径
      }
      
      console.log('页面路径:', pagePaths[page])
      
      if (pagePaths[page]) {
        if (tabPages.includes(page)) {
          // 这些是tab页面
          uni.switchTab({
            url: pagePaths[page],
            success: () => {
              console.log('跳转到tab页面成功')
            },
            fail: (err) => {
              console.error('跳转到tab页面失败:', err)
            }
          })
        } else {
          // bankManage是普通页面
          uni.navigateTo({
            url: pagePaths[page],
            success: () => {
              console.log('跳转到普通页面成功')
            },
            fail: (err) => {
              console.error('跳转到普通页面失败:', err)
              // 显示具体错误
              uni.showToast({
                title: `跳转失败: ${err.errMsg || '未知错误'}`,
                icon: 'none'
              })
            }
          })
        }
      } else {
        console.error('页面不存在:', page)
        uni.showToast({
          title: '页面不存在',
          icon: 'none'
        })
      }
    },
    openFullForm() {
        // 每次打开时都重新设置当前时间
        const currentTime = this.getCurrentTime()
        this.fullForm.date = currentTime.date
        this.fullForm.time = currentTime.time
        
        this.showFullForm = true
      },
      
      resetFullForm() {
        const currentTime = this.getCurrentTime()
        
        this.fullForm = {
          person: '',
          bank: '',
          amount: '',
          discount: '0',
          date: currentTime.date,
          time: currentTime.time,
          remark: ''
        }
      },

    
    closeFullForm() {
      this.showFullForm = false
      this.resetFullForm()
    }
  }
}
</script>

<style scoped>
.grid-icon.bank {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
}	

.container {
  padding: 20rpx;
  padding-bottom: 100rpx;
}

.stats-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  color: white;
}

.stat-card.success {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
}

.stat-card:first-child {
  margin-right: 15rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  align-items: center;
}

.card-title .icon {
  margin-right: 10rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.input {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  border: 1rpx solid #e0e0e0;
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
}

.unit {
  margin-left: 20rpx;
  color: #666;
  font-size: 28rpx;
}

.picker {
  background: #f8f9fa;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
}

.picker-content {
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  width: 100%;
  margin-top: 10rpx;
}

.primary-btn:disabled {
  opacity: 0.5;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  flex: 1;
}

.person {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.bank, .time {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 5rpx;
}

.amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #4CAF50;
}

.view-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  color: #667eea;
  font-size: 28rpx;
  border-top: 1rpx solid #eee;
  margin-top: 10rpx;
}

.view-more .icon {
  margin-left: 10rpx;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.grid-item {
  width: 48%;
  text-align: center;
  margin-bottom: 30rpx;
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15rpx;
  font-size: 32rpx;
}

.grid-icon.list {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.grid-icon.chart {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.grid-icon.export {
  background: linear-gradient(135deg, #ff9800 0%, #ef6c00 100%);
  color: white;
}

.grid-icon.add {
  background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
  color: white;
}

.grid-text {
  font-size: 26rpx;
  color: #333;
}

/* 自定义弹窗样式 */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}

.form-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
}

.form-content {
  padding: 30rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.form-row {
  display: flex;
}

.time-inputs {
  display: flex;
  gap: 20rpx;
}

.time-picker {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
}

.textarea {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  min-height: 150rpx;
  border: 1rpx solid #e0e0e0;
  width: 100%;
}

.form-buttons {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
  border-top: 1rpx solid #eee;
}

.cancel-btn {
  flex: 1;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

/* 图标样式 */
.icon {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>