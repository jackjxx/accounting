<template>
  <view class="container">
    <!-- 添加银行 -->
    <view class="card">
      <view class="card-title">
        <uni-icons type="plus" size="24" color="#667eea"></uni-icons>
        <text>添加新银行</text>
      </view>
      
      <view class="form-item">
        <text class="label">银行名称</text>
        <input 
          v-model="newBank" 
          placeholder="请输入银行名称" 
          class="input"
          maxlength="20"
        />
      </view>
      
      <button 
        class="primary-btn" 
        @tap="addBank"
        :disabled="!newBank.trim()"
      >
        添加银行
      </button>
    </view>

    <!-- 银行列表 -->
    <view class="card">
      <view class="card-title">
        <uni-icons type="list" size="24" color="#667eea"></uni-icons>
        <text>银行列表 ({{ customBanks.length + defaultBanks.length }})</text>
      </view>
      
      <!-- 默认银行 -->
      <view v-if="defaultBanks.length > 0">
        <view class="section-title">系统默认</view>
        <view 
          class="bank-item" 
          v-for="bank in defaultBanks" 
          :key="bank"
        >
          <text class="bank-name">{{ bank }}</text>
          <text class="bank-tag">系统</text>
        </view>
      </view>
      
      <!-- 自定义银行 -->
      <view v-if="customBanks.length > 0">
        <view class="section-title">自定义银行 ({{ customBanks.length }})</view>
        <view 
          class="bank-item" 
          v-for="(bank, index) in customBanks" 
          :key="bank"
        >
          <text class="bank-name">{{ bank }}</text>
          <view class="bank-actions">
            <uni-icons 
              type="compose" 
              size="20" 
              color="#ff9800" 
              @tap="editBank(index)"
            ></uni-icons>
            <uni-icons 
              type="trash" 
              size="20" 
              color="#f44336" 
              @tap="deleteBank(index)"
            ></uni-icons>
          </view>
        </view>
      </view>
      
      <view v-if="customBanks.length === 0 && defaultBanks.length === 0" class="empty-state">
        <uni-icons type="bank" size="80" color="#ccc"></uni-icons>
        <text class="empty-text">暂无银行数据</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      newBank: '',
      editingIndex: -1,
      editingBank: '',
      defaultBanks: [
        "中国工商银行", "中国建设银行", "中国农业银行", "中国银行",
        "招商银行", "交通银行", "邮储银行", "光大银行",
        "浦发银行", "中信银行", "华夏银行", "平安银行",
        "广发银行", "兴业银行", "民生银行", "云闪付",
        "数字人民币", "支付宝", "微信支付", "现金", "其他"
      ]
    }
  },
  
  computed: {
    customBanks() {
      return this.$store.state.customBanks || []
    },
    
    allBanks() {
      return [...this.defaultBanks, ...this.customBanks]
    }
  },
  
  onShow() {
    this.loadCustomBanks()
  },
  
  methods: {
    loadCustomBanks() {
      // 从本地存储加载自定义银行
      try {
        const customBanks = uni.getStorageSync('customBanks') || []
        this.$store.commit('setCustomBanks', customBanks)
      } catch (error) {
        console.error('加载自定义银行失败:', error)
      }
    },
    
    saveCustomBanks() {
      try {
        uni.setStorageSync('customBanks', this.customBanks)
        this.$store.commit('setCustomBanks', this.customBanks)
      } catch (error) {
        console.error('保存自定义银行失败:', error)
      }
    },
    
    addBank() {
      if (!this.newBank.trim()) {
        uni.showToast({
          title: '请输入银行名称',
          icon: 'none'
        })
        return
      }
      
      const bankName = this.newBank.trim()
      
      // 检查是否已存在
      if (this.allBanks.includes(bankName)) {
        uni.showToast({
          title: '该银行已存在',
          icon: 'none'
        })
        return
      }
      
      // 添加到自定义银行列表
      const customBanks = [...this.customBanks, bankName]
      this.$store.commit('setCustomBanks', customBanks)
      this.saveCustomBanks()
      
      this.newBank = ''
      
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
    },
    
    editBank(index) {
      uni.showModal({
        title: '编辑银行',
        content: '请输入新的银行名称',
        editable: true,
        placeholderText: this.customBanks[index],
        success: (res) => {
          if (res.confirm && res.content) {
            const newName = res.content.trim()
            if (newName && !this.allBanks.includes(newName)) {
              const updatedBanks = [...this.customBanks]
              updatedBanks[index] = newName
              this.$store.commit('setCustomBanks', updatedBanks)
              this.saveCustomBanks()
              
              uni.showToast({
                title: '修改成功',
                icon: 'success'
              })
            } else if (this.allBanks.includes(newName)) {
              uni.showToast({
                title: '该银行已存在',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    deleteBank(index) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${this.customBanks[index]}"吗？`,
        success: (res) => {
          if (res.confirm) {
            const updatedBanks = this.customBanks.filter((_, i) => i !== index)
            this.$store.commit('setCustomBanks', updatedBanks)
            this.saveCustomBanks()
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
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
  padding-bottom: 100rpx;
}

.section-title {
  font-size: 26rpx;
  color: #666;
  margin: 30rpx 0 15rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #eee;
}

.bank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.bank-item:last-child {
  border-bottom: none;
}

.bank-name {
  font-size: 28rpx;
  color: #333;
}

.bank-tag {
  font-size: 22rpx;
  color: #999;
  background: #f0f0f0;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.bank-actions {
  display: flex;
  gap: 20rpx;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}
</style>