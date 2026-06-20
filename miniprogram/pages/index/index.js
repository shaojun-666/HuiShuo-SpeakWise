const api = require('../../utils/api')

const CATEGORY_NAMES = {
  workplace: '职场沟通',
  guanxi: '人情世故',
  social: '日常社交',
  consumer: '消费维权',
  copywriting: '社交文案'
}

Page({
  data: {
    scenarios: [],
    loading: true,
    activeCategory: '',
    categoryNames: CATEGORY_NAMES
  },

  onLoad() {
    this.loadScenarios()
  },

  onPullDownRefresh() {
    this.loadScenarios().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadScenarios() {
    this.setData({ loading: true })
    try {
      const res = await api.getScenarios(this.data.activeCategory)
      this.setData({
        scenarios: res.list || [],
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category }, () => {
      this.loadScenarios()
    })
  },

  onScenarioTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/scenario-detail/scenario-detail?id=${id}`
    })
  },

  onSearchTap() {
    wx.switchTab({
      url: '/pages/chat/chat'
    })
  },

  onFreeChat() {
    wx.switchTab({
      url: '/pages/chat/chat'
    })
  }
})
