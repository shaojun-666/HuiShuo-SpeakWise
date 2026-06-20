// 用户管理云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    switch (action) {
      // 获取对话历史
      case 'history': {
        const { page = 1, pageSize = 20 } = event
        const countResult = await db.collection('conversations')
          .where({ _openid: openid })
          .count()
        const { data } = await db.collection('conversations')
          .where({ _openid: openid })
          .orderBy('createdAt', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()

        return {
          code: 0,
          data: {
            list: data,
            total: countResult.total,
            page,
            pageSize
          }
        }
      }

      // 收藏话术
      case 'save': {
        const { content } = event
        if (!content) return { code: -1, message: '内容不能为空' }

        await db.collection('savedItems').add({
          data: {
            _openid: openid,
            content,
            createdAt: db.serverDate()
          }
        })

        return { code: 0, message: '收藏成功' }
      }

      // 取消收藏
      case 'unsave': {
        const { id } = event
        await db.collection('savedItems')
          .doc(id)
          .remove()
        return { code: 0, message: '已取消收藏' }
      }

      // 获取收藏列表
      case 'saved': {
        const { data } = await db.collection('savedItems')
          .where({ _openid: openid })
          .orderBy('createdAt', 'desc')
          .get()
        return { code: 0, data }
      }

      // 提交反馈
      case 'feedback': {
        const { conversationId, rating, comment } = event
        await db.collection('feedback').add({
          data: {
            _openid: openid,
            conversationId,
            rating,
            comment,
            createdAt: db.serverDate()
          }
        })
        return { code: 0, message: '感谢您的反馈' }
      }

      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (err) {
    console.error('[user] error:', err)
    return { code: -1, message: err.message || '操作失败' }
  }
}
