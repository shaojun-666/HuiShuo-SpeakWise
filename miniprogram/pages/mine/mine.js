const api = require('../../utils/api')

Page({
  data: {
    userInfo: {},
    dailyCount: 0,
    stats: { total: 0, saved: 0, categories: 0 }
  },

  onShow() {
    this.loadUserData()
  },

  async loadUserData() {
    try {
      const app = getApp()
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: (res) => {
                this.setData({ userInfo: res.userInfo })
              }
            })
          }
        }
      })

      const [historyRes, savedData] = await Promise.all([
        api.getHistory(1, 100),
        api.getSavedItems().catch(() => [])
      ])

      const list = historyRes.list || []
      const categories = new Set(list.map(i => i.category).filter(Boolean))

      this.setData({
        stats: {
          total: historyRes.total || list.length,
          saved: (savedData || []).length,
          categories: categories.size
        }
      })
    } catch (err) {
      console.error('load user data error:', err)
    }
  },

  onLogin() {
    wx.getUserProfile({
      desc: '用于展示用户信息',
      success: (res) => {
        this.setData({ userInfo: res.userInfo })
      }
    })
  },

  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请描述您的建议或遇到的问题：',
      editable: true,
      placeholderText: '输入您的反馈...',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await api.submitFeedback({ comment: res.content, rating: 5, conversationId: '' })
            wx.showToast({ title: '感谢反馈', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '提交失败', icon: 'none' })
          }
        }
      }
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于会说',
      content: '会说是一款AI沟通助手小程序，帮助你应对各种沟通场景——职场、人情、社交、维权、文案。输入场景，AI给你最合适的说法和策略。',
      showCancel: false
    })
  },

  onShareAppMessage() {
    return {
      title: '会说 - AI沟通助手',
      desc: '帮你把每句话都说到位'
    }
  }
})
