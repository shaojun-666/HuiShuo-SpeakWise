const api = require('../../utils/api')

Page({
  data: {
    messages: [],
    inputValue: '',
    canSend: false,
    sending: false,
    scrollToId: '',
    thinkingStates: {},
    savedStates: {}
  },

  onShow() {
    const ctx = wx.getStorageSync('chatContext')
    if (ctx && ctx.message) {
      this.setData({ inputValue: ctx.message, canSend: true })
      wx.removeStorageSync('chatContext')
    }
  },

  onInput(e) {
    const val = e.detail.value
    this.setData({
      inputValue: val,
      canSend: val.trim().length > 0
    })
  },

  async onSend() {
    const content = this.data.inputValue.trim()
    if (!content || this.data.sending) return

    // 添加用户消息
    const userMsg = { role: 'user', parts: [content] }
    this.setData({
      messages: [...this.data.messages, userMsg],
      inputValue: '',
      sending: true
    })
    this.scrollToBottom()

    try {
      const result = await api.chat({
        content,
        category: 'general'
      })

      let aiMsg
      if (result.script) {
        aiMsg = {
          role: 'ai',
          parts: this.splitResponse(result.response || ''),
          hasStructured: true,
          analysis: result.analysis || '',
          strategy: result.strategy || '',
          script: result.script || result.response || ''
        }
      } else {
        aiMsg = {
          role: 'ai',
          parts: this.splitResponse(result.response || '好的，请稍等，我正在思考...'),
          hasStructured: false
        }
      }

      this.setData({
        messages: [...this.data.messages, aiMsg],
        sending: false
      })
      this.scrollToBottom()
    } catch (err) {
      this.setData({ sending: false })
      wx.showToast({ title: err || '请求失败', icon: 'none' })
    }
  },

  // 按空行分割AI回复
  splitResponse(text) {
    return text.split('\n\n').filter(p => p.trim())
  },

  onSuggestion(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputValue: text, canSend: true })
  },

  toggleThinking(e) {
    const index = e.currentTarget.dataset.index
    if (index === undefined) return
    const key = `thinkingStates[${index}]`
    this.setData({ [key]: !this.data.thinkingStates[index] })
  },

  onCopyMsg(e) {
    const { index } = e.currentTarget.dataset
    const msg = this.data.messages[index]
    if (msg) {
      wx.setClipboardData({
        data: msg.parts.join('\n'),
        success: () => wx.showToast({ title: '已复制', icon: 'success' })
      })
    }
  },

  async onSaveMsg(e) {
    const { index } = e.currentTarget.dataset
    const msg = this.data.messages[index]
    if (msg) {
      try {
        await api.saveItem({ title: '自由对话', content: msg.parts.join('\n'), category: '' })
        this.setData({ [`savedStates[${index}]`]: true })
        wx.showToast({ title: '收藏成功', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: '收藏失败', icon: 'none' })
      }
    }
  },

  scrollToBottom() {
    const len = this.data.messages.length
    if (len > 0) {
      this.setData({ scrollToId: `msg-${len - 1}` })
    }
  }
})
