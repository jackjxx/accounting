<template>
  <view class="container">
    <!-- 时间筛选 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">📅</text>
        <text>统计时间范围</text>
      </view>
      
      <view class="date-range">
        <view class="date-item">
          <text class="date-label">开始时间</text>
          <picker mode="date" :value="timeRange.startDate" @change="onStartDateChange">
            <view class="date-picker">
              {{ timeRange.startDate || '选择开始日期' }}
              <text class="icon">📅</text>
            </view>
          </picker>
        </view>
        
        <view class="date-item">
          <text class="date-label">结束时间</text>
          <picker mode="date" :value="timeRange.endDate" @change="onEndDateChange">
            <view class="date-picker">
              {{ timeRange.endDate || '选择结束日期' }}
              <text class="icon">📅</text>
            </view>
          </picker>
        </view>
      </view>
      
      <button class="primary-btn" @tap="loadStatistics">查询统计</button>
    </view>
    
    <!-- 总体统计 -->
    <view class="card" v-if="overallStats.count > 0">
      <view class="card-title">
        <text class="icon">📊</text>
        <text>总体统计</text>
      </view>
      
      <view class="overall-stats">
        <view class="stat-item">
          <text class="stat-label">交易笔数</text>
          <text class="stat-value">{{ overallStats.count }}</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-label">总实付金额</text>
          <text class="stat-value">¥{{ overallStats.totalAmount.toFixed(2) }}</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-label">总优惠金额</text>
          <text class="stat-value">¥{{ overallStats.totalDiscount.toFixed(2) }}</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-label">实际支付</text>
          <text class="stat-value">¥{{ overallStats.totalActual.toFixed(2) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 按人统计 -->
    <view class="card" v-if="personStats.length > 0">
      <view class="card-title">
        <text class="icon">👥</text>
        <text>按人统计</text>
      </view>
      
      <view class="person-stats">
        <view 
          class="person-item" 
          v-for="(stat, index) in sortedPersonStats" 
          :key="stat.person"
          @tap="viewPersonDetail(stat.person)"
        >
          <view class="person-rank" :class="{first: index === 0, second: index === 1, third: index === 2}">
            {{ index + 1 }}
          </view>
          
          <view class="person-info">
            <text class="person-name">{{ stat.person }}</text>
            <text class="person-detail">{{ stat.count }} 笔记录</text>
          </view>
          
          <view class="person-amount">
            <text class="amount">¥{{ stat.totalActual.toFixed(2) }}</text>
            <text class="percentage">{{ ((stat.totalActual / overallStats.totalActual) * 100).toFixed(1) }}%</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 按银行统计 -->
    <view class="card" v-if="bankStats.length > 0">
      <view class="card-title">
        <text class="icon">🏦</text>
        <text>按银行统计</text>
      </view>
      
      <view class="bank-stats">
        <view 
          class="bank-item" 
          v-for="stat in bankStats" 
          :key="stat.bank"
        >
          <view class="bank-info">
            <text class="bank-name">{{ stat.bank }}</text>
            <text class="bank-detail">{{ stat.count }} 笔交易</text>
          </view>
          
          <view class="bank-amount">
            <text class="amount">¥{{ stat.totalActual.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 时间趋势 -->
    <view class="card" v-if="timeTrends.length > 0">
      <view class="card-title">
        <text class="icon">📈</text>
        <text>时间趋势</text>
      </view>
      
      <view class="time-trends">
        <view 
          class="trend-item" 
          v-for="trend in timeTrends" 
          :key="trend.date"
        >
          <text class="trend-date">{{ trend.date }}</text>
          <view class="trend-bar">
            <view 
              class="bar-fill" 
              :style="{width: trend.percentage + '%'}"
            ></view>
          </view>
          <text class="trend-amount">¥{{ trend.amount.toFixed(2) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 无数据提示 -->
    <view v-if="overallStats.count === 0" class="empty-state">
      <text class="icon">📊</text>
      <text class="empty-text">暂无统计数据</text>
      <text class="empty-hint">请选择时间范围并查询</text>
    </view>
    
    <!-- 导出按钮 -->
    <view class="export-btn-container" v-if="overallStats.count > 0">
      <button class="export-btn" @tap="exportStatistics">
        <text class="icon">📤</text>
        <text>导出统计报告</text>
      </button>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return {
      timeRange: {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(now)
      },
      overallStats: {
        count: 0,
        totalAmount: 0,
        totalDiscount: 0,
        totalActual: 0
      },
      personStats: [],
      bankStats: [],
      timeTrends: [],
      loading: false,
	  showSkeleton: true,
	  firstLoad: true
    }
  },
  
  computed: {
    ...mapState(['transactions']),
    
    sortedPersonStats() {
      return [...this.personStats].sort((a, b) => b.totalActual - a.totalActual).slice(0, 10)
    }
  },
  
  onLoad() {
    this.loadStatistics(),
	this.loadData()
  },
  
  methods: {
    ...mapActions(['fetchTransactions']),
    
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
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
	    
	    // this.applyFilter()
	  } catch (error) {
	    this.showSkeleton = false
	    console.error('数据加载失败:', error)
	  }
	},
    
	onStartDateChange(e) {
      this.timeRange.startDate = e.detail.value
    },
    
    onEndDateChange(e) {
      this.timeRange.endDate = e.detail.value
    },
    
    async loadStatistics() {
      if (this.loading) return
      
      this.loading = true
      
      try {
        // 加载数据
        await this.fetchTransactions()
        
        // 筛选数据
        let filteredData = [...this.transactions]
        
        if (this.timeRange.startDate && this.timeRange.endDate) {
          filteredData = filteredData.filter(item => {
            const itemTime = new Date(item.transaction_time).getTime()
            const startTime = new Date(this.timeRange.startDate).getTime()
            const endTime = new Date(this.timeRange.endDate + ' 23:59:59').getTime()
            return itemTime >= startTime && itemTime <= endTime
          })
        }
        
        // 计算总体统计
        this.calculateOverallStats(filteredData)
        
        // 计算按人统计
        this.calculatePersonStats(filteredData)
        
        // 计算按银行统计
        this.calculateBankStats(filteredData)
        
        // 计算时间趋势
        this.calculateTimeTrends(filteredData)
        
      } catch (error) {
        console.error('统计加载失败:', error)
        uni.showToast({
          title: '统计加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    calculateOverallStats(data) {
      const stats = {
        count: data.length,
        totalAmount: 0,
        totalDiscount: 0,
        totalActual: 0
      }
      
      data.forEach(item => {
        const actual = parseFloat(item.actual_amount) || 0
        const discount = parseFloat(item.discount_amount) || 0
        const actualPayment = actual - discount
        
        stats.totalAmount += actual
        stats.totalDiscount += discount
        stats.totalActual += actualPayment
      })
      
      this.overallStats = stats
    },
    
    calculatePersonStats(data) {
      const personMap = {}
      
      data.forEach(item => {
        const person = item.person_name
        const actual = parseFloat(item.actual_amount) || 0
        const discount = parseFloat(item.discount_amount) || 0
        const actualPayment = actual - discount
        
        if (!personMap[person]) {
          personMap[person] = {
            person: person,
            count: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalActual: 0
          }
        }
        
        personMap[person].count++
        personMap[person].totalAmount += actual
        personMap[person].totalDiscount += discount
        personMap[person].totalActual += actualPayment
      })
      
      this.personStats = Object.values(personMap)
    },
    
    calculateBankStats(data) {
      const bankMap = {}
      
      data.forEach(item => {
        const bank = item.bank_type
        const actual = parseFloat(item.actual_amount) || 0
        const discount = parseFloat(item.discount_amount) || 0
        const actualPayment = actual - discount
        
        if (!bankMap[bank]) {
          bankMap[bank] = {
            bank: bank,
            count: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalActual: 0
          }
        }
        
        bankMap[bank].count++
        bankMap[bank].totalAmount += actual
        bankMap[bank].totalDiscount += discount
        bankMap[bank].totalActual += actualPayment
      })
      
      this.bankStats = Object.values(bankMap).sort((a, b) => b.totalActual - a.totalActual)
    },
    
    calculateTimeTrends(data) {
      const trends = {}
      
      data.forEach(item => {
        const date = item.transaction_time.split(' ')[0] // 获取日期部分
        
        if (!trends[date]) {
          trends[date] = {
            date: date,
            count: 0,
            amount: 0
          }
        }
        
        trends[date].count++
        trends[date].amount += (item.actual_amount - item.discount_amount)
      })
      
      // 转换为数组并排序
      let trendArray = Object.values(trends)
      
      // 计算百分比（基于最大金额）
      const maxAmount = Math.max(...trendArray.map(t => t.amount))
      trendArray.forEach(trend => {
        trend.percentage = (trend.amount / maxAmount) * 100
      })
      
      // 按日期排序（最近的在前面）
      trendArray.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      this.timeTrends = trendArray.slice(0, 7) // 只显示最近7天
    },
    
    viewPersonDetail(person) {
      // 这里可以跳转到个人详情页面
      uni.showToast({
        title: `查看 ${person} 的详情`,
        icon: 'none'
      })
    },
    exportStatistics() {
      // 收集当前筛选条件
      const exportParams = {
        filterType: 'statistics',
        timeRange: {
          start: this.timeRange.startDate,
          end: this.timeRange.endDate
        },
        statisticsData: {
          personStats: this.personStats,
          bankStats: this.bankStats,
          timeTrends: this.timeTrends
        },
      }
      
      // 保存筛选条件到本地存储
      uni.setStorageSync('exportStatisticsParams', exportParams)
      
      // 设置一个标记，表示需要自动选择"当前筛选"
      uni.setStorageSync('autoSelectCurrentFilter', true)
      
      // 跳转到tabbar页面必须使用switchTab
      uni.switchTab({
        url: '/pages/export/export',
        success: () => {
          console.log('跳转到导出页面成功')
          // 可以添加一个延时来确保页面加载完成
          setTimeout(() => {
            // 通过事件总线通知导出页面
            uni.$emit('statisticsFilterApplied', exportParams.timeRange)
          }, 300)
        },
        fail: (error) => {
          console.error('跳转失败:', error)
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  padding-bottom: 120rpx;
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

.date-range {
  margin-bottom: 30rpx;
}

.date-item {
  margin-bottom: 20rpx;
}

.date-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.date-picker {
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

.overall-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.stat-item {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 25rpx;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.stat-value {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.person-item,
.bank-item,
.trend-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.person-item:last-child,
.bank-item:last-child,
.trend-item:last-child {
  border-bottom: none;
}

.person-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: bold;
  color: #666;
  margin-right: 20rpx;
}

.person-rank.first {
  background: #ffd700;
  color: #333;
}

.person-rank.second {
  background: #c0c0c0;
  color: #333;
}

.person-rank.third {
  background: #cd7f32;
  color: #333;
}

.person-info,
.bank-info {
  flex: 1;
}

.person-name,
.bank-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.person-detail,
.bank-detail {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 5rpx;
}

.person-amount,
.bank-amount {
  text-align: right;
}

.amount {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #4CAF50;
}

.percentage {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-top: 5rpx;
}

.trend-date {
  width: 120rpx;
  font-size: 24rpx;
  color: #666;
}

.trend-bar {
  flex: 1;
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 12rpx;
  overflow: hidden;
  margin: 0 20rpx;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
}

.trend-amount {
  width: 120rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #333;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
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
}

.export-btn-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: white;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.export-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-btn .icon {
  margin-right: 10rpx;
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
</style>