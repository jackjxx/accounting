<template>
  <view class="container">
    <!-- 筛选条件 -->
    <view class="card">
      <view class="card-title">
        <uni-icons type="search" size="24" color="#667eea"></uni-icons>
        <text>筛选条件</text>
      </view>
      
      <view class="filter-section">
        <!-- 时间筛选 -->
        <view class="filter-item">
          <text class="filter-label">时间范围</text>
          <view class="date-inputs">
            <picker mode="date" :value="filter.startDate" @change="onStartDateChange">
              <view class="date-input">{{ filter.startDate || '开始日期' }}</view>
            </picker>
            <text class="date-separator">至</text>
            <picker mode="date" :value="filter.endDate" @change="onEndDateChange">
              <view class="date-input">{{ filter.endDate || '结束日期' }}</view>
            </picker>
          </view>
        </view>
        
        <!-- 人名筛选 -->
        <view class="filter-item">
          <text class="filter-label">筛选人名</text>
          <picker :range="personNames" @change="onPersonChange">
            <view class="person-picker">
              {{ filter.person || '全部人员' }}
              <uni-icons type="arrowdown" size="16"></uni-icons>
            </view>
          </picker>
        </view>
        
        <!-- 银行筛选 -->
        <view class="filter-item">
          <text class="filter-label">筛选银行</text>
          <picker :range="bankTypes" @change="onBankFilterChange">
            <view class="bank-picker">
              {{ filter.bank || '全部银行' }}
              <uni-icons type="arrowdown" size="16"></uni-icons>
            </view>
          </picker>
        </view>
      </view>
      
      <view class="filter-buttons">
        <button class="filter-btn" @tap="resetFilter">重置</button>
        <button class="primary-btn" @tap="applyFilter">应用筛选</button>
      </view>
    </view>
    
    <!-- 统计摘要 -->
    <view class="stats-summary" v-if="filteredTransactions.length > 0">
      <text class="summary-text">
        共 {{ filteredTransactions.length }} 条记录，总金额 ¥{{ totalFilteredAmount.toFixed(2) }}
      </text>
    </view>
    
    <!-- 记录列表 -->
    <view class="card">
      <view class="list-header">
        <text class="list-title">交易记录</text>
        <view class="list-actions">
          <uni-icons type="trash" size="24" color="#f44336" @tap="showDeleteAll"></uni-icons>
          <uni-icons type="refresh" size="24" color="#667eea" @tap="loadData"></uni-icons>
        </view>
      </view>
      
      <view v-if="filteredTransactions.length === 0" class="empty-state">
        <uni-icons type="list" size="80" color="#ccc"></uni-icons>
        <text class="empty-text">暂无记录</text>
        <text class="empty-hint">点击下方按钮添加记录</text>
        <button class="primary-btn" @tap="goToAdd">添加记录</button>
      </view>
      
      <scroll-view 
        v-else 
        class="list-container" 
        scroll-y 
        :style="{height: scrollHeight + 'px'}"
        @scrolltolower="loadMore"
      >
        <view 
          class="list-item" 
          v-for="item in filteredTransactions" 
          :key="item.id"
          @tap="viewDetail(item)"
        >
          <view class="item-left">
            <view class="person-badge" :style="{backgroundColor: getColorByPerson(item.person_name)}">
              {{ item.person_name.charAt(0) }}
            </view>
            <view class="item-info">
              <text class="person-name">{{ item.person_name }}</text>
              <text class="item-details">{{ item.bank_type }} · {{ formatTime(item.transaction_time) }}</text>
              <text v-if="item.remark" class="item-remark">{{ item.remark }}</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-amount">¥{{ (item.actual_amount - item.discount_amount).toFixed(2) }}</text>
            <text v-if="item.discount_amount > 0" class="item-discount">优惠 ¥{{ item.discount_amount }}</text>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view v-if="loadingMore" class="load-more">
          <uni-icons type="spinner-cycle" size="24" color="#667eea" :class="{spin: loadingMore}"></uni-icons>
          <text>加载中...</text>
        </view>
        
        <view v-if="!hasMore && filteredTransactions.length > 10" class="no-more">
          <text>没有更多记录了</text>
        </view>
      </scroll-view>
    </view>
    
</view>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
	  showSkeleton: true,
	  firstLoad: true,
      filter: {
        startDate: '',
        endDate: '',
        person: '',
        bank: ''
      },
      filteredTransactions: [],
      pageSize: 20,
      currentPage: 1,
      loadingMore: false,
      hasMore: true,
      scrollHeight: 500,
      bankTypes: [
        "中国工商银行", "中国建设银行", "中国农业银行", "中国银行",
        "招商银行", "交通银行", "邮储银行", "光大银行",
        "浦发银行", "中信银行", "华夏银行", "平安银行",
        "广发银行", "兴业银行", "民生银行", "云闪付",
        "数字人民币", "支付宝", "微信支付", "现金", "其他"
      ],
      colors: [
        '#667eea', '#764ba2', '#4CAF50', '#FF9800', 
        '#F44336', '#9C27B0', '#2196F3', '#00BCD4',
        '#8BC34A', '#FFC107', '#795548', '#607D8B'
      ]
    }
  },
  
  computed: {
    ...mapState(['transactions']),
    ...mapGetters(['personNames']),
    
    totalFilteredAmount() {
      return this.filteredTransactions.reduce((total, item) => {
        return total + (item.actual_amount - item.discount_amount)
      }, 0)
    }
  },
  
  onLoad() {
    this.loadData()
    this.calculateScrollHeight()
  },
  
  onShow() {
    this.loadData()
  },
  
  onReady() {
    this.calculateScrollHeight()
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
    ...mapActions(['fetchTransactions', 'deleteTransaction', 'clearAllTransactions']),
    
    calculateScrollHeight() {
      const systemInfo = uni.getSystemInfoSync()
      this.scrollHeight = systemInfo.windowHeight - 450
    },
    
    async loadData() {
      try {
        await this.fetchTransactions()
		// 首次加载显示骨架屏
		if (this.firstLoad) {
		  setTimeout(() => {
			this.showSkeleton = false
			this.firstLoad = false
		  }, 800)
		} else {
		  this.showSkeleton = false
		}
        this.applyFilter()
      } catch (error) {
		this.showSkeleton = false
        console.error('数据加载失败:', error)
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    },
    
    async loadMore() {
      if (this.loadingMore || !this.hasMore) return
      
      this.loadingMore = true
      
      try {
        // 真实分页数据
        const start = this.currentPage * this.pageSize
        const end = start + this.pageSize
        
        // 如果当前已经显示的数据足够，不重复加载
        if (this.displayedTransactions.length >= end) {
          this.loadingMore = false
          return
        }
        
        // 加载下一页数据
        const newData = this.filteredTransactions.slice(start, end)
        
        if (newData.length > 0) {
          // 使用 Vue.set 或 concat 确保响应式
          this.displayedTransactions = [...this.displayedTransactions, ...newData]
          this.currentPage++
        }
        
        this.hasMore = end < this.filteredTransactions.length
        
      } finally {
        this.loadingMore = false
      }
    },
    onStartDateChange(e) {
      this.filter.startDate = e.detail.value
    },
    
    onEndDateChange(e) {
      this.filter.endDate = e.detail.value
    },
    
    onPersonChange(e) {
      this.filter.person = this.personNames[e.detail.value] || ''
    },
    
    onBankFilterChange(e) {
      this.filter.bank = this.bankTypes[e.detail.value] || ''
    },
    
    applyFilter() {
      let result = [...this.transactions]
      
      // 时间筛选
      if (this.filter.startDate && this.filter.endDate) {
        result = result.filter(item => {
          const itemTime = new Date(item.transaction_time).getTime()
          const startTime = new Date(this.filter.startDate).getTime()
          const endTime = new Date(this.filter.endDate + ' 23:59:59').getTime()
          return itemTime >= startTime && itemTime <= endTime
        })
      }
      
      // 人名筛选
      if (this.filter.person) {
        result = result.filter(item => item.person_name === this.filter.person)
      }
      
      // 银行筛选
      if (this.filter.bank) {
        result = result.filter(item => item.bank_type === this.filter.bank)
      }
      
      // 按时间倒序排序
      result.sort((a, b) => {
        return new Date(b.transaction_time) - new Date(a.transaction_time)
      })
      
      this.filteredTransactions = result
      this.currentPage = 1
      this.hasMore = result.length > this.pageSize
    },
    
    resetFilter() {
      this.filter = {
        startDate: '',
        endDate: '',
        person: '',
        bank: ''
      }
      this.filteredTransactions = [...this.transactions]
      this.currentPage = 1
      this.hasMore = this.filteredTransactions.length > this.pageSize
    },
    
    formatTime(time) {
      if (!time) return ''
      try {
        return time.slice(5, 16)
      } catch (e) {
        return time
      }
    },
    
    getColorByPerson(personName) {
      if (!personName) return '#667eea'
      // 根据人名字符串生成一个颜色
      let hash = 0
      for (let i = 0; i < personName.length; i++) {
        hash = personName.charCodeAt(i) + ((hash << 5) - hash)
      }
      return this.colors[Math.abs(hash) % this.colors.length]
    },
    
    viewDetail(item) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${item.id}`
      })
    },
    
    
   
    showDeleteAll() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有记录吗？此操作不可撤销！',
        success: async (res) => {
          if (res.confirm) {
            try {
              await this.clearAllTransactions()
              uni.showToast({
                title: '已清空所有记录'
              })
              this.applyFilter()
            } catch (error) {
              uni.showToast({
                title: '清空失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    goToAdd() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding-bottom: 100rpx;
}

.stats-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  padding: 20rpx;
  margin: 20rpx 0;
  text-align: center;
}

.summary-text {
  color: white;
  font-size: 28rpx;
  font-weight: 500;
}

.filter-section {
  margin-bottom: 30rpx;
}

.filter-item {
  margin-bottom: 25rpx;
}

.filter-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.date-input {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  text-align: center;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid #e0e0e0;
}

.date-separator {
  color: #999;
  font-size: 26rpx;
}

.person-picker,
.bank-picker {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-buttons {
  display: flex;
  gap: 20rpx;
}

.filter-btn {
  flex: 1;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.list-actions {
  display: flex;
  gap: 20rpx;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin: 20rpx 0;
}

.empty-hint {
  display: block;
  font-size: 26rpx;
  color: #ccc;
  margin-bottom: 30rpx;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.list-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.person-badge {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.item-info {
  flex: 1;
}

.person-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.item-details {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 5rpx;
}

.item-remark {
  display: block;
  font-size: 22rpx;
  color: #ff9800;
  margin-top: 5rpx;
  font-style: italic;
}

.item-right {
  text-align: right;
}

.item-amount {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #4CAF50;
}

.item-discount {
  display: block;
  font-size: 22rpx;
  color: #ff9800;
  margin-top: 5rpx;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx;
  color: #667eea;
  font-size: 26rpx;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
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
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-content.bottom {
  bottom: 0;
  left: 0;
  right: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.action-sheet {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
}

.action-header {
  padding: 40rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.action-list {
  padding: 20rpx 0;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item text {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 0;
  padding: 30rpx;
  font-size: 28rpx;
  width: 100%;
  text-align: center;
}
</style>