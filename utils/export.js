// 导出工具类
export default {
  // 导出为CSV
  exportToCSV(data, fileName = '账目统计') {
    // 构建CSV内容
    let csvContent = '人名,银行类别,实付金额,优惠金额,实际支付,交易时间\n'
    
    data.forEach(item => {
      const actualPayment = item.actual_amount - item.discount_amount
      const row = [
        `"${item.person_name || ''}"`,
        `"${item.bank_type || ''}"`,
        item.actual_amount,
        item.discount_amount,
        actualPayment,
        `"${item.transaction_time || ''}"`
      ].join(',')
      
      csvContent += row + '\n'
    })
    
    // 根据不同平台处理导出
    if (uni.getSystemInfoSync().platform === 'android' || 
        uni.getSystemInfoSync().platform === 'ios') {
      // App平台
      this.exportForApp(csvContent, fileName)
    } else {
      // H5平台
      this.exportForH5(csvContent, fileName)
    }
  },
  
  // App平台导出
  exportForApp(csvContent, fileName) {
    const filePath = plus.io.convertLocalFileSystemURL(`_downloads/${fileName}.csv`)
    
    // 创建文件
    plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
      fs.root.getFile(`${fileName}.csv`, { create: true }, (fileEntry) => {
        fileEntry.createWriter((writer) => {
          writer.onwriteend = (e) => {
            uni.showModal({
              title: '导出成功',
              content: `文件已保存到：${filePath}`,
              showCancel: false
            })
          }
          
          writer.onerror = (e) => {
            uni.showToast({
              title: '导出失败',
              icon: 'none'
            })
          }
          
          const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
          writer.write(blob)
        }, (error) => {
          console.error('创建写入器失败:', error)
        })
      }, (error) => {
        console.error('创建文件失败:', error)
      })
    }, (error) => {
      console.error('请求文件系统失败:', error)
    })
  },
  
  // H5平台导出
  exportForH5(csvContent, fileName) {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}_${this.getCurrentDate()}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  },
  
  // 导出为JSON
  exportToJSON(data, fileName = '账目统计') {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    
    if (uni.getSystemInfoSync().platform === 'h5') {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}_${this.getCurrentDate()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      uni.showModal({
        title: '导出JSON',
        content: 'App端JSON导出功能待实现',
        showCancel: false
      })
    }
  },
  
  // 获取当前日期
  getCurrentDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}${month}${day}_${hours}${minutes}`
  },
  
  // 导出统计信息
  exportStatistics(stats, grouped, fileName = '统计信息') {
    let csvContent = '统计项目,数值\n'
    csvContent += `交易笔数,${stats.count}\n`
    csvContent += `总实付金额,${stats.totalAmount.toFixed(2)}\n`
    csvContent += `总优惠金额,${stats.totalDiscount.toFixed(2)}\n`
    csvContent += `总实际支付,${stats.totalActual.toFixed(2)}\n\n`
    
    csvContent += '按人统计\n'
    csvContent += '人名,交易笔数,总实付金额,总优惠金额,总实际支付\n'
    
    Object.entries(grouped).forEach(([person, data]) => {
      csvContent += `${person},${data.count},${data.totalAmount.toFixed(2)},${data.totalDiscount.toFixed(2)},${data.totalActual.toFixed(2)}\n`
    })
    
    this.exportToCSV([{ csvContent }], `${fileName}_统计`)
  }
}