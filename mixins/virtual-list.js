export default {
  data() {
    return {
      virtualList: {
        startIndex: 0,
        endIndex: 50, // 初始显示数量
        itemHeight: 120, // 预估每项高度
        buffer: 5 // 缓冲数量
      }
    }
  },
  computed: {
    visibleData() {
      return this.listData.slice(
        this.virtualList.startIndex, 
        this.virtualList.endIndex
      )
    }
  },
  methods: {
    onScroll(e) {
      const scrollTop = e.detail.scrollTop
      const startIndex = Math.floor(scrollTop / this.virtualList.itemHeight)
      const endIndex = startIndex + this.virtualList.visibleCount + this.virtualList.buffer
      
      this.virtualList.startIndex = Math.max(0, startIndex - this.virtualList.buffer)
      this.virtualList.endIndex = Math.min(this.listData.length, endIndex)
    }
  }
}