<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 初始化应用设置
    this.initAppSettings()
	// 初始化自定义银行
	  try {
	    const customBanks = uni.getStorageSync('customBanks')
	    if (!customBanks) {
	      uni.setStorageSync('customBanks', [])
	    }
	  } catch (e) {
	    console.error('初始化自定义银行失败:', e)
	  }
	
  },
  
  onShow: function() {
    console.log('App Show')
  },
  
  onHide: function() {
    console.log('App Hide')
  },
  
  methods: {
    initAppSettings() {
      // 设置主题色
      uni.setStorageSync('app_theme', 'light')
      
      // 检查是否是第一次启动
      const firstLaunch = uni.getStorageSync('first_launch')
      if (!firstLaunch) {
        console.log('首次启动应用')
        uni.setStorageSync('first_launch', '1')
        
        // 可以在这里添加引导页或初始数据
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: "Helvetica Neue", Helvetica, sans-serif;
}

.container {
  padding: 20rpx;
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
}

/* 按钮样式 */
.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.success-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.danger-btn {
  background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

/* 输入框样式 */
.input {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  border: 1rpx solid #e0e0e0;
}

.input:focus {
  border-color: #667eea;
}

/* 标签样式 */
.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 500;
}

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
}

/* 统计卡片 */
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  color: white;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
}
</style>