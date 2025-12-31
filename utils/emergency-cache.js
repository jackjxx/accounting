// 创建紧急缓存管理
// utils/emergency-cache.js
const EmergencyCache = {
  // 简单缓存实现
  cache: new Map(),
  
  set(key, value, ttl = 60000) { // 默认缓存1分钟
    this.cache.set(key, {
      value,
      expire: Date.now() + ttl
    })
    
    // 自动清理过期缓存
    this.cleanup()
  },
  
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expire) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  },
  
  delete(key) {
    this.cache.delete(key)
  },
  
  clear() {
    this.cache.clear()
  },
  
  cleanup() {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expire) {
        this.cache.delete(key)
      }
    }
  }
}
