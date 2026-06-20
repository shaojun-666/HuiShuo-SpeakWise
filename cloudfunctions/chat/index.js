const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 缓存有效期7天

const RESTRICTION = '限制：只回答与沟通技巧、社交、职场、人情世故、消费维权、文案写作相关的问题。如果用户提问完全无关（如写诗、写代码、翻译、数学计算、知识问答等），请礼貌拒绝，并引导用户回到沟通场景。'

const SYSTEM_PROMPTS = {
  workplace: `你是中国职场沟通专家，熟悉上下级关系和面子文化。
输出严格按以下三部分：

【局势分析】分析场景的关系、利益、风险。
【策略建议】提供合适的应对方向和策略。
【具体话术】给出可直接使用的话术，详细可操作。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`,

  guanxi: `你是中国人情世故专家，熟悉送礼、随礼、求人办事等场景。
输出严格按以下三部分：

【局势分析】分析关系亲疏、场合规矩。
【策略建议】提供合适的处理方式，考虑各地风俗差异。
【具体话术】可直接使用的说话模板，注意"得体"，涉及金额给合理范围。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`,

  social: `你是社交沟通专家，擅长各种人际交往场景。
输出严格按以下三部分：

【局势分析】分析社交场合关键因素。
【策略建议】提供合适的应对方向，考虑内向/外向不同方案，注重边界感。
【具体话术】可直接使用的说法，自然真诚避免套路。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`,

  consumer: `你是消费者维权专家，熟悉《消费者权益保护法》等法规。
输出严格按以下三部分：

【局势分析】分析消费纠纷关键问题，引用相关法规。
【策略建议】从温和到正式的递进策略，强调保留证据。
【具体话术】针对不同阶段的话术模板，法律引用准确但通俗。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`,

  copywriting: `你是社交媒体文案专家，熟悉朋友圈、小红书、抖音等平台。
输出严格按以下三部分：

【局势分析】分析目标受众和平台特点。
【策略建议】提供文案方向和优化建议。
【具体话术】不同风格的文案选项，含配图建议和话题标签。朋友圈偏生活化、小红书偏种草、抖音偏短平快。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`,

  general: `你是资深沟通专家，精通各种人际沟通场景。
输出严格按以下三部分：

【局势分析】分析场景关键因素。
【策略建议】提供合适的应对策略。
【具体话术】可直接使用的说话模板，具体可操作。涉及敏感内容礼貌拒绝。

要求：话术为核心，各部分自然连贯，不要出现"话术1""话术2""策略一""策略二"等编号。输出简洁不加多余符号。
${RESTRICTION}`
}

// 去掉AI回复中的markdown符号，保持排版干净
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
}

// 将AI回复拆分为结构化区块
function parseSections(text) {
  const sections = { analysis: '', strategy: '', script: '' }
  const clean = stripMarkdown(text)

  // 找标题行，映射到key
  const headerRules = [
    { match: /思考过程|局势分析|内容定位|法律依据/i, key: 'analysis' },
    { match: /策略建议|文案方案|优化建议|应对策略/i, key: 'strategy' },
    { match: /具体话术|话术方案|话术模板|可以直接使用的话术/i, key: 'script' }
  ]

  const lines = clean.split('\n')
  let currentKey = 'script' // 默认归入话术

  for (const line of lines) {
    if (line.trim().length === 0) continue
    let matched = false
    for (const rule of headerRules) {
      if (rule.match.test(line)) {
        currentKey = rule.key
        matched = true
        break
      }
    }
    if (!matched) {
      sections[currentKey] += line.trim() + '\n'
    }
  }

  // 去掉首尾空行
  for (const k of Object.keys(sections)) {
    sections[k] = sections[k].trim()
  }

  // 如果analysis和strategy都为空，全部放script
  if (!sections.analysis && !sections.strategy && sections.script) {
    sections.script = clean.trim()
  }

  return sections
}

// 生成缓存key（基于system prompt + 用户输入）
function makeCacheKey(systemPrompt, userMessage) {
  return crypto.createHash('md5').update(systemPrompt + '|||' + userMessage).digest('hex')
}

// 查缓存
async function getCached(key) {
  try {
    const res = await db.collection('response_cache').where({ cacheKey: key }).get()
    if (res.data.length === 0) return null
    const cached = res.data[0]
    if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
      await db.collection('response_cache').doc(cached._id).remove()
      return null
    }
    return cached.response
  } catch {
    return null
  }
}

// 写入缓存
async function setCache(key, category, content, contextInfo, response) {
  try {
    const countRes = await db.collection('response_cache').count()
    if (countRes.total >= 500) {
      const oldest = await db.collection('response_cache').orderBy('createdAt', 'asc').limit(50).get()
      const tasks = oldest.data.map(item => db.collection('response_cache').doc(item._id).remove())
      await Promise.all(tasks)
    }
    await db.collection('response_cache').add({
      data: {
        cacheKey: key,
        category,
        userInput: content,
        contextInfo,
        response,
        createdAt: Date.now()
      }
    })
  } catch (err) {
    console.error('[cache] set error:', err)
  }
}

// 调用通义千问 Qwen-Plus（DashScope OpenAI 兼容接口）
function callQwen(messages) {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) {
    throw new Error('AI_API_KEY 未配置，请在云函数环境变量中设置（可填 DeepSeek 或 Qwen 等兼容 API 的 Key）')
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'qwen-plus',
      messages,
      temperature: 0.8,
      max_tokens: 2000,
      stream: false
    })

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 60000
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.choices && result.choices[0]) {
            resolve(result.choices[0].message.content)
          } else {
            reject(result.error?.message || 'AI返回格式异常')
          }
        } catch (e) {
          reject('解析AI响应失败')
        }
      })
    })

    req.on('error', (e) => reject('AI服务请求失败: ' + e.message))
    req.on('timeout', () => { req.destroy(); reject('AI服务超时') })
    req.write(data)
    req.end()
  })
}

exports.main = async (event, context) => {
  const { content, category = 'general', contextInfo = '', skipCache = false } = event
  const wxContext = cloud.getWXContext()

  if (!content || content.trim().length === 0) {
    return { code: -1, message: '请输入您遇到的沟通场景' }
  }

  if (content.length > 2000) {
    return { code: -1, message: '描述内容过长，请精简到2000字以内' }
  }

  try {
    const systemPrompt = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.general
    const userMessage = `场景：${content}\n背景：${contextInfo || '无'}`

    if (!skipCache) {
      const cacheKey = makeCacheKey(systemPrompt, userMessage)
      const cachedResponse = await getCached(cacheKey)
      if (cachedResponse) {
        const parsed = parseSections(cachedResponse)
        return { code: 0, data: { response: cachedResponse, analysis: parsed.analysis, strategy: parsed.strategy, script: parsed.script, cached: true } }
      }
    }

    console.log('[chat] start AI call, category:', category, 'content length:', content.length, 'API_KEY set:', !!process.env.AI_API_KEY)
    const responseText = await callQwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ])
    console.log('[chat] AI call succeeded, response length:', responseText.length)

    const cacheKey = makeCacheKey(systemPrompt, userMessage)
    setCache(cacheKey, category, content, contextInfo, responseText)

    try {
      await db.collection('conversations').add({
        data: {
          _openid: wxContext.OPENID,
          category,
          userInput: content,
          contextInfo,
          aiResponse: responseText,
          createdAt: db.serverDate()
        }
      })
    } catch (saveErr) {
      console.error('[chat] save conversation error:', saveErr.message)
    }

    const parsed = parseSections(responseText)

    return {
      code: 0,
      data: {
        response: responseText,
        analysis: parsed.analysis,
        strategy: parsed.strategy,
        script: parsed.script,
        cached: false
      }
    }
  } catch (err) {
    console.error('[chat] error:', err)
    return { code: -1, message: err.message || 'AI 服务暂时不可用，请稍后再试' }
  }
}
