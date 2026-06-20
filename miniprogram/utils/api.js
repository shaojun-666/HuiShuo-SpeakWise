/**
 * 云函数调用封装
 */

// 调用云函数
function call(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({ name, data }).then(res => {
      const r = res.result || {}
      if (r.code === 0) return resolve(r.data)
      reject(r.message || r.error || '请求失败')
    }).catch(err => {
      reject(err.errMsg || err.message || '网络错误')
    })
  })
}

// AI对话
function chat(data) {
  return call('chat', data)
}

// 获取场景模板列表
function getScenarios(category = '') {
  return call('scenarios', { action: 'list', category })
}

// 获取场景详情
function getScenarioDetail(id) {
  return call('scenarios', { action: 'detail', id })
}

// 获取历史记录
function getHistory(page = 1, pageSize = 20) {
  return call('user', { action: 'history', page, pageSize })
}

// 保存话术
function saveItem(content) {
  return call('user', { action: 'save', content })
}

// 取消保存
function unsaveItem(id) {
  return call('user', { action: 'unsave', id })
}

// 获取收藏列表
function getSavedItems() {
  return call('user', { action: 'saved' })
}

// 提交反馈
function submitFeedback(data) {
  return call('user', { action: 'feedback', ...data })
}

module.exports = {
  call,
  chat,
  getScenarios,
  getScenarioDetail,
  getHistory,
  saveItem,
  unsaveItem,
  getSavedItems,
  submitFeedback
}
