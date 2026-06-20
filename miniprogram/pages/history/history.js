const api = require('../../utils/api')

const CATEGORY_NAMES = {
  workplace: '职场沟通', guanxi: '人情世故',
  social: '日常社交', consumer: '消费维权',
  copywriting: '社交文案'
}

Page({
  data: {
    activeTab: 'history',
    historyList: [],
    savedList: [],
    loading: true,
    categoryNames: CATEGORY_NAMES
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      if (this.data.activeTab === 'history') {
        const res = await api.getHistory()
        this.setData({ historyList: res.list || [] })
      } else {
        const data = await api.getSavedItems()
        this.setData({ savedList: data || [] })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    this.setData({ loading: false })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab }, () => {
      this.loadData()
    })
  },

  onHistoryTap(e) {
    const { content, title } = e.currentTarget.dataset
    wx.showModal({
      title: '查看详情',
      content: content.substring(0, 500),
      confirmText: '复制全部',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: content,
            success: () => wx.showToast({ title: '已复制' })
          })
        }
      }
    })
  },

  async onDeleteSaved(e) {
    const { id } = e.currentTarget.dataset
    try {
      await api.unsaveItem(id)
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  onSavedTap(e) {
    const item = e.currentTarget.dataset.item || {}
    const content = item.content || {}
    const text = content.content || item.content || ''
    wx.showModal({
      title: content.title || '收藏内容',
      content: text.substring(0, 500),
      confirmText: '复制全部',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: text,
            success: () => wx.showToast({ title: '已复制' })
          })
        }
      }
    })
  },

  formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    if (diff < 86400000) return '今天'
    if (diff < 172800000) return '昨天'
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
})
