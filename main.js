import Vue from 'vue'
import App from './App'
import store from './store'

Vue.config.productionTip = false
Vue.prototype.$store = store
// Vue.prototype.$cache = EmergencyCache

// 全局方法 - 格式化金额
Vue.prototype.$formatCurrency = (amount) => {
  return '¥' + parseFloat(amount || 0).toFixed(2)
}
if (process.env.NODE_ENV === 'production') {
  Vue.config.devtools = false
  Vue.config.performance = false
}
// 全局方法 - 格式化日期
Vue.prototype.$formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  } catch (e) {
    return dateStr
  }
}

// 全局方法 - 格式化时间
Vue.prototype.$formatTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return dateStr
  }
}

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount()