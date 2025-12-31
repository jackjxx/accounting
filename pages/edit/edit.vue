<template>
  <view class="container">
    <view class="card">
      <view class="card-title">
        <uni-icons type="compose" size="24" color="#667eea"></uni-icons>
        <text>{{ isEdit ? '编辑记录' : '添加记录' }}</text>
      </view>
      
      <scroll-view class="form-content" scroll-y>
        <view class="form-item">
          <text class="label">人名 *</text>
          <input 
            v-model="form.person_name" 
            placeholder="请输入人名" 
            class="input"
          />
        </view>
        
        <view class="form-item">
          <text class="label">银行类别 *</text>
          <picker 
            :range="bankTypes" 
            @change="onBankChange"
            class="picker"
          >
            <view class="picker-content">
              {{ form.bank_type || '请选择银行' }}
              <uni-icons type="arrowdown" size="16" color="#999"></uni-icons>
            </view>
          </picker>
        </view>
        
        <view class="form-row">
          <view class="form-item" style="flex: 1;">
            <text class="label">实付金额 *</text>
            <view class="input-group">
              <input 
                v-model="form.actual_amount" 
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
                v-model="form.discount_amount" 
                type="digit" 
                placeholder="0.00" 
                class="input"
              />
              <text class="unit">元</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">交易时间 *</text>
          <view class="time-inputs">
            <picker 
              mode="date" 
              :value="datePart" 
              @change="onDateChange"
              class="time-picker"
            >
              <view class="picker-content">
                {{ datePart || '选择日期' }}
                <uni-icons type="calendar" size="16" color="#999"></uni-icons>
              </view>
            </picker>
            
            <picker 
              mode="time" 
              :value="timePart" 
              @change="onTimeChange"
              class="time-picker"
            >
              <view class="picker-content">
                {{ timePart || '选择时间' }}
                <uni-icons type="time" size="16" color="#999"></uni-icons>
              </view>
            </picker>
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">备注</text>
          <textarea 
            v-model="form.remark" 
            placeholder="可选备注信息" 
            class="textarea"
            maxlength="200"
          />
          <text class="char-count">{{ form.remark ? form.remark.length : 0 }}/200</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-buttons">
      <button class="cancel-btn" @tap="goBack">取消</button>
      <button 
        class="primary-btn" 
        @tap="saveTransaction"
        :disabled="!formValid"
      >
        {{ isEdit ? '保存修改' : '添加记录' }}
      </button>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      isEdit: false,
      id: '',
      form: {
        person_name: '',
        bank_type: '',
        actual_amount: '',
        discount_amount: '0',
        transaction_time: '',
        remark: ''
      },
      datePart: '',
      timePart: '',
      bankTypes: [
        "中国工商银行", "中国建设银行", "中国农业银行", "中国银行",
        "招商银行", "交通银行", "邮储银行", "光大银行",
        "浦发银行", "中信银行", "华夏银行", "平安银行",
        "广发银行", "兴业银行", "民生银行", "云闪付",
        "数字人民币", "支付宝", "微信支付", "现金", "其他"
      ]
    }
  },
  
  computed: {
    formValid() {
      return this.form.person_name && 
             this.form.bank_type && 
             this.form.actual_amount && 
             this.datePart
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.isEdit = true
      this.id = options.id
      this.loadTransaction()
    } else if (options.copy) {
      // 复制模式
      try {
        const copyData = JSON.parse(decodeURIComponent(options.copy))
        this.form = {
          person_name: copyData.person_name,
          bank_type: copyData.bank_type,
          actual_amount: copyData.actual_amount.toString(),
          discount_amount: copyData.discount_amount.toString(),
          transaction_time: copyData.transaction_time,
          remark: copyData.remark || ''
        }
        this.splitDateTime()
      } catch (error) {
        console.error('解析复制数据失败:', error)
      }
    }
    
    // 如果没有设置时间，使用当前时间
    if (!this.datePart) {
      const now = new Date()
      this.datePart = this.formatDate(now)
      this.timePart = this.formatTime(now)
      this.updateTransactionTime()
    }
  },
  
  methods: {
    ...mapActions(['fetchTransactions', 'addTransaction']),
    
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    },
    
    async loadTransaction() {
      try {
        await this.fetchTransactions()
        const transactions = this.$store.state.transactions
        const transaction = transactions.find(t => t.id === this.id)
        
        if (transaction) {
          this.form = {
            person_name: transaction.person_name,
            bank_type: transaction.bank_type,
            actual_amount: transaction.actual_amount.toString(),
            discount_amount: transaction.discount_amount.toString(),
            transaction_time: transaction.transaction_time,
            remark: transaction.remark || ''
          }
          this.splitDateTime()
        } else {
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
    
    splitDateTime() {
      if (this.form.transaction_time) {
        const [date, time] = this.form.transaction_time.split(' ')
        this.datePart = date
        this.timePart = time || '00:00'
      }
    },
    
    updateTransactionTime() {
      if (this.datePart && this.timePart) {
        this.form.transaction_time = `${this.datePart} ${this.timePart}`
      }
    },
    
    onBankChange(e) {
      const index = e.detail.value
      if (index >= 0 && index < this.bankTypes.length) {
        this.form.bank_type = this.bankTypes[index]
      }
    },
    
    onDateChange(e) {
      this.datePart = e.detail.value
      this.updateTransactionTime()
    },
    
    onTimeChange(e) {
      this.timePart = e.detail.value
      this.updateTransactionTime()
    },
    
    async saveTransaction() {
      if (!this.formValid) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      // 验证金额
      const amount = parseFloat(this.form.actual_amount)
      const discount = parseFloat(this.form.discount_amount) || 0
      
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
      
      // 准备数据
      const transactionData = {
        ...this.form,
        actual_amount: amount,
        discount_amount: discount
      }
      
      if (this.isEdit) {
        transactionData.id = this.id
        // 编辑模式下需要调用更新方法
        // 这里简化处理，先删除再添加
        uni.showToast({
          title: '编辑功能开发中',
          icon: 'none'
        })
        return
      }
      
      try {
        await this.addTransaction(transactionData)
        uni.showToast({
          title: '添加成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)
        
      } catch (error) {
        console.error('保存失败:', error)
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    },
    
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  padding-bottom: 120rpx;
}

.form-content {
  max-height: 80vh;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.label::after {
  content: "*";
  color: #f44336;
  margin-left: 4rpx;
}

.input {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 26rpx;
  border: 1rpx solid #e0e0e0;
}

.input-group {
  display: flex;
  align-items: center;
}

.unit {
  margin-left: 20rpx;
  color: #666;
  font-size: 26rpx;
}

.picker {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.picker-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 26rpx;
  color: #333;
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
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.textarea {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 26rpx;
  min-height: 150rpx;
  border: 1rpx solid #e0e0e0;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 10rpx;
}

.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: white;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20rpx;
}

.cancel-btn {
  flex: 1;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
</style>