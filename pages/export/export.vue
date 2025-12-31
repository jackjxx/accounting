<template>
  <view class="container">
    <!-- 导出选项 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">📤</text>
        <text>导出选项</text>
      </view>
      
      <view class="export-options">
        <view class="option-item" @tap="selectExportType('excel')">
          <view class="option-icon" :class="{selected: exportType === 'excel'}">
            <text class="icon">📊</text>
          </view>
          <view class="option-info">
            <text class="option-title">导出为Excel</text>
            <text class="option-desc">适合在电脑上查看和编辑</text>
          </view>
        </view>
        
        <view class="option-item" @tap="selectExportType('csv')">
          <view class="option-icon" :class="{selected: exportType === 'csv'}">
            <text class="icon">📄</text>
          </view>
          <view class="option-info">
            <text class="option-title">导出为CSV</text>
            <text class="option-desc">通用格式，适合导入其他软件</text>
          </view>
        </view>
        
        <view class="option-item" @tap="selectExportType('json')">
          <view class="option-icon" :class="{selected: exportType === 'json'}">
            <text class="icon">📋</text>
          </view>
          <view class="option-info">
            <text class="option-title">导出为JSON</text>
            <text class="option-desc">适合数据备份和迁移</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 导出范围 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">📅</text>
        <text>导出范围</text>
      </view>
      
      <view class="export-range">
        <view class="range-options">
          <view 
            class="range-option" 
            :class="{active: exportRange === 'all'}"
            @tap="exportRange = 'all'"
          >
            <text>全部数据</text>
          </view>
          
          <view 
            class="range-option" 
            :class="{active: exportRange === 'current'}"
            @tap="exportRange = 'current'"
          >
            <text>当前筛选</text>
          </view>
          
          <view 
            class="range-option" 
            :class="{active: exportRange === 'custom'}"
            @tap="exportRange = 'custom'"
          >
            <text>自定义</text>
          </view>
        </view>
        
        <!-- 自定义时间范围 -->
        <view v-if="exportRange === 'custom'" class="custom-range">
          <view class="date-item">
            <text class="date-label">开始时间</text>
            <picker mode="date" :value="customDate.start" @change="onCustomStartDateChange">
              <view class="date-picker">
                {{ customDate.start || '选择日期' }}
              </view>
            </picker>
          </view>
          
          <view class="date-item">
            <text class="date-label">结束时间</text>
            <picker mode="date" :value="customDate.end" @change="onCustomEndDateChange">
              <view class="date-picker">
                {{ customDate.end || '选择日期' }}
              </view>
            </picker>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 数据预览 -->
    <view class="card" v-if="previewData.length > 0">
      <view class="card-title">
        <text class="icon">👁️</text>
        <text>数据预览</text>
        <text class="preview-count">(共 {{ previewData.length }} 条记录)</text>
      </view>
      
      <scroll-view class="preview-container" scroll-y :style="{height: '400rpx'}">
        <view class="preview-table">
          <view class="preview-header">
            <text class="header-cell" style="width: 25%;">人名</text>
            <text class="header-cell" style="width: 25%;">银行</text>
            <text class="header-cell" style="width: 25%;">金额</text>
            <text class="header-cell" style="width: 25%;">时间</text>
          </view>
          
          <view 
            class="preview-row" 
            v-for="(item, index) in previewData.slice(0, 10)" 
            :key="index"
          >
            <text class="row-cell" style="width: 25%;">{{ item.person_name }}</text>
            <text class="row-cell" style="width: 25%;">{{ item.bank_type }}</text>
            <text class="row-cell" style="width: 25%;">¥{{ (item.actual_amount - item.discount_amount).toFixed(2) }}</text>
            <text class="row-cell" style="width: 25%;">{{ formatTime(item.transaction_time) }}</text>
          </view>
        </view>
      </scroll-view>
      
      <text v-if="previewData.length > 10" class="preview-more">
        ...还有 {{ previewData.length - 10 }} 条记录未显示
      </text>
    </view>
    
    <!-- 导出设置 -->
    <view class="card">
      <view class="card-title">
        <text class="icon">⚙️</text>
        <text>导出设置</text>
      </view>
      
      <view class="export-settings">
        <view class="setting-item">
          <text class="setting-label">包含备注信息</text>
          <switch :checked="settings.includeRemark" @change="onIncludeRemarkChange" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">包含统计信息</text>
          <switch :checked="settings.includeStats" @change="onIncludeStatsChange" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">文件名前缀</text>
          <input 
            v-model="settings.fileNamePrefix" 
            placeholder="账目统计" 
            class="file-input"
          />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">自动添加日期</text>
          <switch :checked="settings.autoDate" @change="onAutoDateChange" />
        </view>
      </view>
    </view>
    
    <!-- 导出按钮 -->
    <view class="export-btn-container">
      <button 
        class="export-btn" 
        :disabled="!canExport"
        @tap="startExport"
      >
        <text class="icon">📤</text>
        <text>{{ exportButtonText }}</text>
      </button>
    </view>
    
    <!-- 导出进度弹窗（自定义） -->
    <view v-if="showProgressPopup" class="custom-modal">
      <view class="modal-mask" @tap="closeProgressPopup"></view>
      <view class="modal-content center">
        <view class="progress-content">
          <text class="progress-icon">⏳</text>
          <text class="progress-text">{{ progressMessage }}</text>
          <view class="progress-bar" v-if="exportProgress > 0">
            <view 
              class="progress-fill" 
              :style="{width: exportProgress + '%'}"
            ></view>
          </view>
          <text v-if="exportProgress > 0" class="progress-percent">{{ exportProgress }}%</text>
        </view>
      </view>
    </view>
    
    <!-- 导出结果弹窗（自定义） -->
    <view v-if="showResultPopup" class="custom-modal">
      <view class="modal-mask" @tap="closeResultPopup"></view>
      <view class="modal-content center">
        <view class="result-content">
          <text class="result-icon" :class="{success: exportResult.success, error: !exportResult.success}">
            {{ exportResult.success ? '✅' : '❌' }}
          </text>
          <text class="result-title">{{ exportResult.title }}</text>
          <text class="result-message">{{ exportResult.message }}</text>
          <view class="result-buttons">
            <button class="cancel-btn" @tap="closeResultPopup">关闭</button>
 <!--           <button 
              v-if="exportResult.success && exportResult.filePath" 
              class="primary-btn"
              @tap="openExportedFile"
            >
              查看详情
            </button> -->
			  <button 
			    v-if="exportResult.success && exportResult.filePath" 
			    class="primary-btn"
			    @tap="openExportedFile"
			  >
			    打开文件
			  </button>
			  
<!-- 			  添加打开文件位置按钮
			  <button 
			    v-if="exportResult.success && (exportResult.filePath || exportResult.savedInDoc || exportResult.savedInDownloads)"
			    class="secondary-btn"
			    @tap="openFileLocation"
			  >
			    打开文件位置
			  </button> -->
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
	  isFromStatistics: false, // 标记是否从统计页面跳转过来
      exportType: 'csv', // 默认改为csv，因为实现更简单
      exportRange: 'all',
      customDate: {
        start: '',
        end: ''
      },
      previewData: [],
      settings: {
        includeRemark: true,
        includeStats: true,
        fileNamePrefix: '账目统计',
        autoDate: true
      },
      isExporting: false,
      exportProgress: 0,
      progressMessage: '',
      
      // 弹窗控制
      showProgressPopup: false,
      showResultPopup: false,
      
      exportResult: {
        success: false,
        title: '',
        message: '',
        filePath: ''
      }
    }
  },
  
  computed: {
    ...mapState(['transactions']),
    
    canExport() {
      return this.previewData.length > 0 && !this.isExporting
    },
    
    exportButtonText() {
      if (this.isExporting) {
        return `导出中 ${this.exportProgress}%`
      }
      return `导出 ${this.previewData.length} 条记录`
    }
  },
  
  onLoad(options) {
    this.loadPreviewData()
    
    // 检查是否需要自动选择"当前筛选"
    const autoSelect = uni.getStorageSync('autoSelectCurrentFilter')
    const statsData = uni.getStorageSync('exportStatisticsParams')
    
    if (autoSelect && statsData && statsData.filterType === 'statistics') {
      this.isFromStatistics = true
      this.exportRange = 'current'
      this.customDate = {
        start: statsData.timeRange.start,
        end: statsData.timeRange.end
      }
      
      // 加载预览数据
      this.loadPreviewData()
      
      // 清除标记
      setTimeout(() => {
        uni.removeStorageSync('autoSelectCurrentFilter')
        // 可以选择不清除exportStatisticsParams，以便用户手动选择时还能使用
      }, 1000)
      
      // 显示提示
      setTimeout(() => {
        uni.showToast({
          title: '已应用统计页面的筛选条件',
          icon: 'none',
          duration: 2000
        })
      }, 800)
    }
    
    // 监听事件总线（备选方案）
    uni.$on('statisticsFilterApplied', (timeRange) => {
      console.log('收到统计筛选事件', timeRange)
      this.isFromStatistics = true
      this.exportRange = 'current'
      this.customDate = timeRange
      this.loadPreviewData()
    })
  },
  onUnload() {
    // 清理事件监听
    uni.$off('statisticsFilterApplied')
  },
  
  watch: {
    exportRange() {
      this.loadPreviewData()
    },
    
    customDate: {
      deep: true,
      handler() {
        if (this.exportRange === 'custom') {
          this.loadPreviewData()
        }
      }
    }
  },
  
  methods: {
    selectExportType(type) {
      this.exportType = type
    },
    
    onCustomStartDateChange(e) {
      this.customDate.start = e.detail.value
    },
    
    onCustomEndDateChange(e) {
      this.customDate.end = e.detail.value
    },
    
    onIncludeRemarkChange(e) {
      this.settings.includeRemark = e.detail.value
    },
    
    onIncludeStatsChange(e) {
      this.settings.includeStats = e.detail.value
    },
    
    onAutoDateChange(e) {
      this.settings.autoDate = e.detail.value
    },
    
    loadPreviewData() {
      let result = [...this.transactions]
      
      switch (this.exportRange) {
        case 'all':
          // 使用全部数据
          break
          
        case 'current':
          // 如果是从统计页面来的，使用统计页面的筛选条件
          const statsData = uni.getStorageSync('exportStatisticsParams')
          if (statsData && statsData.filterType === 'statistics') {
            if (statsData.timeRange.start && statsData.timeRange.end) {
              result = result.filter(item => {
                const itemTime = new Date(item.transaction_time).getTime()
                const startTime = new Date(statsData.timeRange.start).getTime()
                const endTime = new Date(statsData.timeRange.end + ' 23:59:59').getTime()
                return itemTime >= startTime && itemTime <= endTime
              })
            }
          }
          break
          
        case 'custom':
          if (this.customDate.start && this.customDate.end) {
            result = result.filter(item => {
              const itemTime = new Date(item.transaction_time).getTime()
              const startTime = new Date(this.customDate.start).getTime()
              const endTime = new Date(this.customDate.end + ' 23:59:59').getTime()
              return itemTime >= startTime && itemTime <= endTime
            })
          }
          break
      }
      
      this.previewData = result
    },
    
    formatTime(time) {
      if (!time) return ''
      try {
        return time.slice(5, 16)
      } catch (e) {
        return time
      }
    },
    
    async startExport() {
      if (!this.canExport) return
      
      this.isExporting = true
      this.exportProgress = 0
      this.progressMessage = '准备导出数据...'
      this.showProgressPopup = true
      
      try {
        // 生成文件名
        let fileName = this.settings.fileNamePrefix
        if (this.settings.autoDate) {
          const now = new Date()
          const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
          fileName += `_${dateStr}`
        }
        fileName += `.${this.exportType}`
        
        // 开始导出过程
        await this.exportData(fileName)
        
      } catch (error) {
        console.error('导出失败:', error)
        this.showExportResult(false, '导出失败', error.message || '未知错误')
        
      } finally {
        this.isExporting = false
        this.exportProgress = 0
        this.closeProgressPopup()
      }
    },
    

	async exportData(fileName) {
	  try {
	    // 构建CSV内容
	    let csvContent = '\uFEFF' // UTF-8 BOM
	    csvContent += '人名,银行类别,实付金额,优惠金额,实际支付,交易时间'
	    if (this.settings.includeRemark) {
	      csvContent += ',备注'
	    }
	    csvContent += '\n'
	    
	    const totalRows = this.previewData.length
	    let rowCount = 0
	    
	    for (const item of this.previewData) {
	      const actualPayment = item.actual_amount - item.discount_amount
	      
	      // 构建CSV行
	      const row = [
	        `"${(item.person_name || '').replace(/"/g, '""')}"`,
	        `"${(item.bank_type || '').replace(/"/g, '""')}"`,
	        item.actual_amount,
	        item.discount_amount,
	        actualPayment,
	        `"${(item.transaction_time || '').replace(/"/g, '""')}"`
	      ].join(',')
	      
	      csvContent += row + (this.settings.includeRemark ? `,"${(item.remark || '').replace(/"/g, '""')}"` : '') + '\n'
	      
	      rowCount++
	      this.exportProgress = Math.floor((rowCount / totalRows) * 100)
	      this.progressMessage = `正在处理 ${rowCount}/${totalRows} 条记录...`
	      
	      // 每50条记录让出控制权，避免界面卡顿
	      if (rowCount % 50 === 0) {
	        await new Promise(resolve => setTimeout(resolve, 0))
	      }
	    }
	    
	    console.log('CSV内容构建完成，大小:', csvContent.length, '字节')
	    
	    // 使用简单导出方法
	    await this.simpleExport(csvContent, fileName)
	    
	    this.showExportResult(true, '导出成功', `文件 ${fileName} 已保存`)
	    
	  } catch (error) {
	    console.error('导出失败:', error)
	    
	    // 显示错误结果
	    this.showExportResult(false, '导出失败', error.message || '未知错误')
	  }
	},

	// 完全重写 exportForAppSimple 方法，避免使用下载器
	exportForAppSimple(content, fileName) {
	  return new Promise((resolve, reject) => {
	    console.log('使用文件系统导出:', fileName)
	    
	    // 首先尝试保存到下载目录
	    this.saveToAppDoc(content, fileName, plus.io.PUBLIC_DOWNLOADS)
	      .then((fileUrl) => {
	        console.log('成功保存到下载目录:', fileUrl)
	        
	        // 保存文件信息
	        uni.setStorageSync('last_export_file', {
	          fileName: fileName,
	          filePath: fileUrl,
	          savedInDownloads: true,
	          savedInDoc: false,
	          fileSize: content.length,
	          recordCount: this.previewData.length,
	          exportTime: new Date().toLocaleString('zh-CN'),
	          exportType: this.exportType,
	          directory: '_downloads'
	        })
	        
	        // 提示用户
	        uni.showModal({
	          title: '导出成功',
	          content: `文件已保存到下载目录\n文件名：${fileName}\n记录数：${this.previewData.length}条`,
	          showCancel: true,
	          confirmText: '打开文件',
	          cancelText: '稍后查看',
	          success: (res) => {
	            if (res.confirm) {
	              setTimeout(() => {
	                plus.runtime.openFile(fileUrl, {
	                  error: (e) => {
	                    console.log('直接打开文件失败:', e)
	                    // 即使打不开，文件也已保存成功
	                  }
	                })
	              }, 300)
	            }
	          }
	        })
	        
	        resolve(fileUrl)
	      })
	      .catch((downloadError) => {
	        console.error('保存到下载目录失败:', downloadError)
	        
	        // 备用：保存到应用私有文档目录
	        this.saveToAppDoc(content, fileName, plus.io.PRIVATE_DOC)
	          .then((docFileUrl) => {
	            console.log('成功保存到应用文档目录:', docFileUrl)
	            
	            uni.setStorageSync('last_export_file', {
	              fileName: fileName,
	              filePath: docFileUrl,
	              savedInDownloads: false,
	              savedInDoc: true,
	              fileSize: content.length,
	              recordCount: this.previewData.length,
	              exportTime: new Date().toLocaleString('zh-CN'),
	              exportType: this.exportType,
	              directory: '_doc'
	            })
	            
	            uni.showModal({
	              title: '导出成功',
	              content: `文件已保存到应用文档目录\n文件名：${fileName}\n记录数：${this.previewData.length}条`,
	              showCancel: true,
	              confirmText: '打开文件',
	              cancelText: '稍后查看',
	              success: (res) => {
	                if (res.confirm) {
	                  plus.runtime.openFile(docFileUrl)
	                }
	              }
	            })
	            
	            resolve(docFileUrl)
	          })
	          .catch((docError) => {
	            console.error('保存到应用文档目录也失败:', docError)
	            
	            // 最后的备用方案：复制到剪贴板
	            uni.setClipboardData({
	              data: content,
	              success: () => {
	                uni.showModal({
	                  title: '导出完成',
	                  content: '无法保存文件到设备，数据已复制到剪贴板',
	                  showCancel: false,
	                  success: () => {
	                    reject(new Error('所有保存方式都失败，数据已复制到剪贴板'))
	                  }
	                })
	              },
	              fail: (clipboardError) => {
	                reject(new Error(`所有保存方式都失败: ${clipboardError}`))
	              }
	            })
	          })
	      })
	  })
	},
	
	// 修改 saveToAppDoc 方法，使其更通用
	saveToAppDoc(content, fileName, directory = plus.io.PRIVATE_DOC) {
	  return new Promise((resolve, reject) => {
	    console.log(`保存文件到目录: ${directory}, 文件名: ${fileName}`)
	    
	    plus.io.requestFileSystem(directory, (fs) => {
	      fs.root.getFile(fileName, { create: true }, (fileEntry) => {
	        fileEntry.createWriter((writer) => {
	          writer.onwriteend = (e) => {
	            console.log('文件写入完成')
	            const fileUrl = fileEntry.toLocalURL()
	            console.log('文件URL:', fileUrl)
	            resolve(fileUrl)
	          }
	          
	          writer.onerror = (e) => {
	            console.error('文件写入错误:', e)
	            reject(new Error('文件写入失败'))
	          }
	          
	          // 开始写入
	          writer.write(content)
	        }, (error) => {
	          console.error('创建Writer失败:', error)
	          reject(error)
	        })
	      }, (error) => {
	        console.error('创建文件失败:', error)
	        reject(error)
	      })
	    }, (error) => {
	      console.error('请求文件系统失败:', error)
	      reject(error)
	    })
	  })
	},
	
	// 修改 simpleExport 方法，让它直接使用新的方法
	async simpleExport(content, fileName) {
	  try {
	    // #ifdef APP-PLUS
	    console.log('App端简单导出')
	    return await this.exportForAppSimple(content, fileName)
	    // #endif
	    
	    // #ifdef MP-WEIXIN
	    console.log('小程序端导出')
	    return await this.exportForMiniProgram(content, fileName)
	    // #endif
	    
	    // #ifdef H5
	    console.log('H5端导出')
	    return await this.exportForH5(content, fileName)
	    // #endif
	    
	  } catch (error) {
	    console.error('导出失败:', error)
	    throw error
	  }
	},
	
	// 添加小程序端的导出方法
	exportForMiniProgram(content, fileName) {
	  return new Promise((resolve, reject) => {
	    try {
	      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
	      const fs = wx.getFileSystemManager()
	      
	      fs.writeFileSync({
	        filePath: filePath,
	        data: content,
	        encoding: 'utf8'
	      })
	      
	      console.log('小程序文件保存成功:', filePath)
	      
	      uni.setStorageSync('last_export_file', {
	        fileName: fileName,
	        filePath: filePath,
	        contentLength: content.length,
	        recordCount: this.previewData.length,
	        exportTime: new Date().toLocaleString('zh-CN'),
	        exportType: this.exportType,
	        platform: 'miniprogram'
	      })
	      
	      // 提示用户
	      uni.showModal({
	        title: '导出成功',
	        content: `文件已保存\n文件名：${fileName}\n记录数：${this.previewData.length}条`,
	        showCancel: true,
	        confirmText: '预览文件',
	        cancelText: '知道了',
	        success: (res) => {
	          if (res.confirm) {
	            wx.openDocument({
	              filePath: filePath,
	              fileType: 'csv',
	              success: () => {
	                console.log('预览文件成功')
	              },
	              fail: (error) => {
	                console.error('预览文件失败:', error)
	              }
	            })
	          }
	        }
	      })
	      
	      resolve(filePath)
	    } catch (error) {
	      console.error('小程序导出失败:', error)
	      reject(error)
	    }
	  })
	},
	
	// 添加H5端的导出方法
	exportForH5(content, fileName) {
	  return new Promise((resolve, reject) => {
	    try {
	      const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
	      const link = document.createElement('a')
	      link.href = URL.createObjectURL(blob)
	      link.download = fileName
	      link.style.display = 'none'
	      document.body.appendChild(link)
	      link.click()
	      document.body.removeChild(link)
	      URL.revokeObjectURL(link.href)
	      
	      console.log('H5文件下载已触发')
	      
	      uni.setStorageSync('last_export_info', {
	        fileName: fileName,
	        contentLength: content.length,
	        recordCount: this.previewData.length,
	        exportTime: new Date().toLocaleString('zh-CN'),
	        exportType: this.exportType,
	        savedByDownload: true,
	        platform: 'h5'
	      })
	      
	      // 提示用户
	      setTimeout(() => {
	        uni.showModal({
	          title: '导出完成',
	          content: '文件下载已开始，请检查浏览器下载记录',
	          showCancel: false
	        })
	      }, 500)
	      
	      resolve('h5_download')
	    } catch (error) {
	      console.error('H5导出失败:', error)
	      reject(error)
	    }
	  })
	},
	saveToAppDoc(content, fileName) {
	  return new Promise((resolve, reject) => {
		const filePath = '_doc/' + fileName
		
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
		  fs.root.getFile(fileName, { create: true }, (fileEntry) => {
			fileEntry.createWriter((writer) => {
			  writer.onwriteend = () => {
				const fileUrl = fileEntry.toLocalURL()
				
				uni.setStorageSync('last_export_file', {
				  fileName: fileName,
				  filePath: fileUrl,
				  savedInDownloads: false,
				  savedInDoc: true,
				  fileSize: content.length,
				  recordCount: this.previewData.length,
				  exportTime: new Date().toLocaleString('zh-CN'),
				  exportType: this.exportType,
				  canOpenLocation: true,
				  directory: '_doc'
				})
				
				resolve(fileUrl)
			  }
			  
			  writer.onerror = reject
			  writer.write(content)
			}, reject)
		  }, reject)
		}, reject)
	  })
	},
	async saveFile(content, fileName) {
      try {
        // 在 uni-app 中，我们可以使用 uni.saveFile 来保存文件
        // 首先将内容转换为 Blob（如果需要）
        
        // 创建一个临时文件路径
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
        
        // 写入文件
        const fs = wx.getFileSystemManager()
        fs.writeFileSync({
          filePath: filePath,
          data: content,
          encoding: 'utf8'
        })
        
        console.log('文件保存成功:', filePath)
        
        // 保存文件信息到本地存储
        uni.setStorageSync('last_export_file', {
          fileName: fileName,
          filePath: filePath,
          contentLength: content.length,
          recordCount: this.previewData.length,
          exportTime: new Date().toLocaleString('zh-CN'),
          exportType: this.exportType
        })
        
        // 在 H5 环境中，我们可以使用下载链接
        // #ifdef H5
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
        URL.revokeObjectURL(link.href)
        // #endif
        
        return filePath
        
      } catch (error) {
        console.error('保存文件失败:', error)
        
        // 如果上述方法失败，使用复制到剪贴板的方式
        uni.setClipboardData({
          data: content,
          success: () => {
            console.log('数据已复制到剪切板')
            // 保存文件信息到本地存储
            uni.setStorageSync('last_export_info', {
              fileName: fileName,
              contentLength: content.length,
              recordCount: this.previewData.length,
              exportTime: new Date().toLocaleString('zh-CN'),
              exportType: this.exportType,
              savedToClipboard: true
            })
          }
        })
        
        return null
      }
    },

    openFileLocation() {
      const exportInfo = uni.getStorageSync('last_export_file')
      
      if (!exportInfo) {
        uni.showToast({
          title: '未找到文件信息',
          icon: 'none'
        })
        return
      }
      
      // #ifdef APP-PLUS
      this.openFileLocationInApp(exportInfo)
      // #endif
      
      // #ifdef MP-WEIXIN
      this.openFileLocationInMiniProgram(exportInfo)
      // #endif
      
      // #ifdef H5
      this.openFileLocationInH5(exportInfo)
      // #endif
    },
    
    // App端打开文件位置
    openFileLocationInApp(exportInfo) {
      console.log('打开App端文件位置:', exportInfo)
      
      // 尝试使用不同的方法打开文件位置
      if (exportInfo.filePath) {
        // 方法1: 使用文件路径打开文件管理器
        const directory = exportInfo.filePath.substring(0, exportInfo.filePath.lastIndexOf('/'))
        
        plus.runtime.openFile(directory, {
          error: (e) => {
            console.log('打开目录失败，尝试其他方法:', e)
            
            // 方法2: 根据保存位置打开不同目录
            if (exportInfo.savedInDownloads) {
              // 打开下载目录
              plus.runtime.openFile('_downloads', {
                error: (e2) => {
                  console.error('打开下载目录失败:', e2)
                  uni.showModal({
                    title: '提示',
                    content: `文件保存在下载目录\n路径: ${exportInfo.filePath}\n\n您可以在文件管理器中找到`,
                    showCancel: false
                  })
                },
                success: () => {
                  console.log('成功打开下载目录')
                }
              })
            } else if (exportInfo.savedInDoc) {
              // 打开应用文档目录
              plus.runtime.openFile('_doc', {
                error: (e2) => {
                  console.error('打开文档目录失败:', e2)
                  uni.showModal({
                    title: '提示',
                    content: `文件保存在应用文档目录\n路径: ${exportInfo.filePath}`,
                    showCancel: false
                  })
                }
              })
            } else {
              // 默认提示
              uni.showModal({
                title: '文件位置',
                content: `文件路径: ${exportInfo.filePath}\n\n您可以通过文件管理器访问此位置`,
                showCancel: false
              })
            }
          },
          success: () => {
            console.log('成功打开文件位置')
          }
        })
      } else if (exportInfo.savedByDownloader) {
        // 使用下载管理器保存的文件
        plus.runtime.openFile('_downloads', {
          error: (e) => {
            uni.showModal({
              title: '提示',
              content: '文件保存在下载目录，请到文件管理器查看',
              showCancel: false
            })
          }
        })
      } else {
        uni.showModal({
          title: '文件信息',
          content: `文件名: ${exportInfo.fileName}\n保存时间: ${exportInfo.exportTime}\n\n文件已保存到设备存储中`,
          showCancel: false
        })
      }
    },
    
    // 小程序端打开文件位置
    openFileLocationInMiniProgram(exportInfo) {
      wx.showModal({
        title: '文件信息',
        content: `文件已保存\n路径: ${exportInfo.filePath}\n\n小程序端无法直接打开文件位置，请到手机文件管理器中查看`,
        showCancel: false
      })
      
      // 可以尝试分享文件让用户保存到其他位置
      if (exportInfo.filePath) {
        setTimeout(() => {
          wx.showActionSheet({
            itemList: ['分享文件'],
            success: (res) => {
              if (res.tapIndex === 0) {
                wx.shareFileMessage({
                  filePath: exportInfo.filePath,
                  success: () => {
                    console.log('分享成功')
                  }
                })
              }
            }
          })
        }, 1000)
      }
    },
    
    // H5端打开文件位置
    openFileLocationInH5(exportInfo) {
      if (exportInfo.savedByDownload) {
        uni.showModal({
          title: '下载完成',
          content: '文件已开始下载，请检查浏览器的下载目录',
          showCancel: false
        })
      } else {
        uni.showModal({
          title: '导出完成',
          content: '文件已保存，请查看下载记录',
          showCancel: false
        })
      }
    },
    
    showExportResult(success, title, message, filePath = '') {
      this.exportResult = {
        success,
        title,
        message,
        filePath: filePath || (success ? '数据已复制到剪贴板' : '')
      }
      
      // this.showResultPopup = true
    },
    
    closeProgressPopup() {
      this.showProgressPopup = false
    },
    
    closeResultPopup() {
      this.showResultPopup = false
    },
	openExportedFile() {
	  const exportInfo = uni.getStorageSync('last_export_file') || uni.getStorageSync('last_export_info')
	  
	  if (!exportInfo) {
		uni.showToast({
		  title: '未找到导出文件',
		  icon: 'none'
		})
		return
	  }
	  
	  if (exportInfo.savedByDownload) {
		uni.showModal({
		  title: '导出完成',
		  content: `文件已开始下载\n文件名：${exportInfo.fileName}\n记录数：${exportInfo.recordCount}`,
		  showCancel: false
		})
		return
	  }
	  
	  // #ifdef MP-WEIXIN
	  if (exportInfo.filePath) {
		// 小程序端可以预览文件
		wx.openDocument({
		  filePath: exportInfo.filePath,
		  fileType: 'csv',
		  success: (res) => {
			console.log('打开文档成功')
		  },
		  fail: (error) => {
			console.error('打开文档失败:', error)
			
			// 如果打不开，尝试分享
			wx.shareFileMessage({
			  filePath: exportInfo.filePath,
			  success: () => {
				console.log('分享文件成功')
			  },
			  fail: (shareError) => {
				console.error('分享文件失败:', shareError)
				uni.showModal({
				  title: '文件信息',
				  content: `文件路径：${exportInfo.filePath}\n\n你可以通过微信的文件管理找到此文件`,
				  showCancel: false
				})
			  }
			})
		  }
		})
	  }
	  // #endif
	  
	  // #ifdef APP-PLUS
	  if (exportInfo.filePath) {
		plus.runtime.openFile(exportInfo.filePath, {
		  error: (e) => {
			console.error('打开文件失败:', e)
			uni.showModal({
			  title: '导出成功',
			  content: `文件已保存到：${exportInfo.filePath}\n\n请到文件管理中查看`,
			  showCancel: false
			})
		  }
		})
	  }
	  // #endif
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

.export-options {
  margin-bottom: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.option-item:last-child {
  border-bottom: none;
}

.option-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 28rpx;
}

.option-icon.selected {
  background: #667eea;
  color: white;
}

.option-info {
  flex: 1;
}

.option-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.option-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 5rpx;
}

.export-range {
  margin-bottom: 20rpx;
}

.range-options {
  display: flex;
  margin-bottom: 30rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  overflow: hidden;
}

.range-option {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  font-size: 26rpx;
  color: #666;
}

.range-option.active {
  background: #667eea;
  color: white;
}

.custom-range {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
}

.date-item {
  margin-bottom: 15rpx;
}

.date-item:last-child {
  margin-bottom: 0;
}

.date-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.date-picker {
  background: white;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid #e0e0e0;
}

.preview-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 10rpx;
}

.preview-container {
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  overflow: hidden;
}

.preview-table {
  background: white;
}

.preview-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1rpx solid #eee;
}

.header-cell {
  padding: 15rpx 10rpx;
  font-size: 22rpx;
  color: #666;
  text-align: center;
  border-right: 1rpx solid #eee;
}

.header-cell:last-child {
  border-right: none;
}

.preview-row {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}

.preview-row:last-child {
  border-bottom: none;
}

.row-cell {
  padding: 15rpx 10rpx;
  font-size: 22rpx;
  color: #333;
  text-align: center;
  border-right: 1rpx solid #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-cell:last-child {
  border-right: none;
}

.preview-more {
  display: block;
  text-align: center;
  padding: 15rpx;
  font-size: 22rpx;
  color: #999;
}

.export-settings {
  margin-bottom: 20rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 26rpx;
  color: #333;
}

.file-input {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid #e0e0e0;
  width: 200rpx;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-btn:disabled {
  opacity: 0.5;
}

.export-btn .icon {
  margin-right: 10rpx;
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
  border-radius: 20rpx;
  overflow: hidden;
  animation: popupShow 0.3s ease;
}

.modal-content.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400rpx;
}

@keyframes popupShow {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.progress-content {
  padding: 60rpx 40rpx;
  text-align: center;
}

.progress-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 20rpx;
}

.progress-text {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin: 20rpx 0;
}

.progress-bar {
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
  margin: 20rpx 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 22rpx;
  color: #667eea;
  font-weight: bold;
}

.result-content {
  padding: 60rpx 40rpx;
  text-align: center;
}

.result-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 20rpx;
}

.result-icon.success {
  color: #4CAF50;
}

.result-icon.error {
  color: #F44336;
}

.result-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin: 15rpx 0;
}

.result-message {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 30rpx;
  line-height: 1.5;
}

.result-buttons {
  display: flex;
  gap: 20rpx;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 50rpx;
  padding: 15rpx 30rpx;
  font-size: 26rpx;
  flex: 1;
}

.primary-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 15rpx 30rpx;
  font-size: 26rpx;
  flex: 1;
}
</style>