const CATEGORY_NAMES = {
  workplace: '职场沟通', guanxi: '人情世故',
  social: '日常社交', consumer: '消费维权',
  copywriting: '社交文案'
}

Page({
  data: {
    userInput: '',
    aiResponse: '',
    category: ''
  },

  onLoad() {
    const item = wx.getStorageSync('historyDetail') || {}
    this.setData({
      userInput: item.userInput || '',
      aiResponse: item.aiResponse || '',
      category: CATEGORY_NAMES[item.category] || item.category || ''
    })
    wx.removeStorageSync('historyDetail')
  },

  onCopy() {
    const { userInput, aiResponse } = this.data
    wx.setClipboardData({
      data: `${userInput}\n\n${aiResponse}`,
      success: () => wx.showToast({ title: '已复制' })
    })
  },

  onChatAgain() {
    wx.setStorageSync('chatContext', { message: this.data.userInput })
    wx.switchTab({ url: '/pages/chat/chat' })
  }
})
