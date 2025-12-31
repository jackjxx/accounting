<!-- components/emergency-skeleton.vue -->
<template>
  <view class="skeleton-container" v-if="loading">
    <!-- 列表骨架屏 -->
    <view class="skeleton-list" v-if="type === 'list'">
      <view class="skeleton-item" v-for="i in count" :key="i">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-content">
          <view class="skeleton-line" :style="{ width: widths[i % 3] }"></view>
          <view class="skeleton-line" style="width: 70%"></view>
        </view>
      </view>
    </view>
    
    <!-- 卡片骨架屏 -->
    <view class="skeleton-card" v-if="type === 'card'">
      <view class="skeleton-title"></view>
      <view class="skeleton-line" style="width: 90%"></view>
      <view class="skeleton-line" style="width: 80%"></view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    loading: Boolean,
    type: {
      type: String,
      default: 'list'
    },
    count: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      widths: ['80%', '60%', '70%']
    }
  }
}
</script>

<style scoped>
.skeleton-container {
  padding: 20rpx;
}

.skeleton-item {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
  margin-right: 20rpx;
}

.skeleton-content {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.skeleton-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.skeleton-title {
  height: 32rpx;
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  width: 40%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>