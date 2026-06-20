// 场景模板云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, category, id, page = 1, pageSize = 50 } = event

  try {
    switch (action) {
      case 'list': {
        let query = db.collection('scenarios')
        if (category) {
          query = query.where({ category })
        }
        const countResult = await query.count()
        const { data } = await query
          .orderBy('hotScore', 'desc')
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

      case 'detail': {
        const { data } = await db.collection('scenarios')
          .doc(id)
          .get()

        if (!data) {
          return { code: -1, message: '场景不存在' }
        }

        return { code: 0, data }
      }

      case 'categories': {
        const { data } = await db.collection('scenarios')
          .field({ category: true })
          .get()

        const categories = [...new Set(data.map(item => item.category))]
        return { code: 0, data: categories }
      }

      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (err) {
    console.error('[scenarios] error:', err)
    return { code: -1, message: err.message || '获取场景失败' }
  }
}
