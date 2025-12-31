<template>
  <view class="container">
    <view class="card">
      <view class="card-title">
        <uni-icons type="person" size="24" color="#667eea"></uni-icons>
        <text>交易详情</text>
      </view>
      
      <!-- 交易信息展示 -->
      <view class="detail-content">
        <view class="detail-item">
          <text class="detail-label">人名</text>
          <text class="detail-value">{{ transaction.person_name }}</text>
        </view>
        
        <view class="detail-item">
          <text class="detail-label">银行类别</text>
          <text class="detail-value">{{ transaction.bank_type }}</text>
        </view>
        
        <view class="detail-item">
          <text class="detail-label">实付金额</text>
          <text class="detail-value amount">¥{{ transaction.actual_amount.toFixed(2) }}</text>
        </view>
        
        <view class="detail-item" v-if="transaction.discount_amount > 0">
          <text class="detail-label">优惠金额</text>
          <text class="detail-value discount">-¥{{ transaction.discount_amount.toFixed(2) }}</text>
        </view>
        
        <view class="detail-item">
          <text class="detail-label">实际支付</text>
          <text class="detail-value total-amount">
            ¥{{ (transaction.actual_amount - transaction.discount_amount).toFixed(2) }}
          </text>
        </view>
        
        <view class="detail-item">
          <text class="detail-label">交易时间</text>
          <text class="detail-value">{{ formatTime(transaction.transaction_time) }}</text>
        </view>
        
        <view class="detail-item" v-if="transaction.remark">
          <text class="detail-label">备注</text>
          <text class="detail-value remark">{{ transaction.remark }}</text>
        </view>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="edit-btn" @tap="goToEdit">编辑记录</button>
      <button class="delete-btn" @tap="deleteRecord">删除记录</button>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      transactionId: '',
      transaction: {}
    }
  },
  
  onLoad(options) {
    this.transactionId = options.id
    this.loadTransaction()
  },
  
  methods: {
    ...mapActions(['fetchTransactions', 'deleteTransaction']),
    
    async loadTransaction() {
      try {
        await this.fetchTransactions()
        const transactions = this.$store.state.transactions
        this.transaction = transactions.find(t => t.id === this.transactionId) || {}
        
        if (!this.transaction.id) {
          uni.showToast({
            title: '记录不存在',
            icon: 'none'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },
    
    formatTime(time) {
      if (!time) return ''
      try {
        return time.replace(' ', '  ')
      } catch (e) {
        return time
      }
    },
    
    goToEdit() {
      uni.navigateTo({
        url: `/pages/edit/edit?id=${this.transactionId}`
      })
    },
    
    deleteRecord() {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除 ${this.transaction.person_name} 的这条记录吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await this.deleteTransaction(this.transactionId)
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              })
              
              setTimeout(() => {
                uni.navigateBack()
              }, 1000)
            } catch (error) {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  padding-bottom: 180rpx;
}

.detail-content {
  padding: 20rpx 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
}

.amount {
  color: #f44336;
  font-weight: 600;
}

.discount {
  color: #4CAF50;
  font-weight: 600;
}

.total-amount {
  color: #667eea;
  font-weight: bold;
  font-size: 32rpx;
}

.remark {
  color: #999;
  font-style: italic;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: white;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20rpx;
}

.edit-btn {
  flex: 1;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.delete-btn {
  flex: 1;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
</style>