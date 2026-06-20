const api = require('../../utils/api')

const CATEGORY_NAMES = {
  workplace: '职场沟通', guanxi: '人情世故',
  social: '日常社交', consumer: '消费维权',
  copywriting: '社交文案'
}

Page({
  data: {
    scenario: {},
    formFields: [],
    extraContext: '',
    submitting: false,
    showResult: false,
    analysisParts: [],
    strategyParts: [],
    scriptParts: [],
    scriptVariants: [],
    rawResponse: '',
    categoryNames: CATEGORY_NAMES,
    thinkingExpanded: false,
    hasStructured: false,
    isSaved: false,
    // 调整弹窗
    showAdjustModal: false,
    adjustIndex: -1,
    adjustInput: '',
    adjustLoading: false,
    adjustResult: '',
    // 重新生成输入
    showRegenInput: false,
    regenInput: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadScenario(options.id)
    }
  },

  async loadScenario(id) {
    wx.showLoading({ title: '加载中...' })
    try {
      const scenario = await api.getScenarioDetail(id)
      const fields = (scenario.variables || []).map(v => ({
        label: this.getFieldLabel(v),
        placeholder: this.getFieldPlaceholder(v),
        value: '',
        key: v
      }))

      this.setData({
        scenario,
        formFields: fields
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  getFieldLabel(key) {
    const labels = {
      currentSalary: '当前薪资', expectedSalary: '期望薪资',
      tenure: '工作年限', achievements: '主要成就',
      colleagueName: '同事姓名', taskDescription: '工作任务描述',
      days: '请假天数', realReason: '真实原因',
      projectName: '项目名称', problem: '遇到的问题',
      impact: '可能的影响', reason: '原因',
      relationship: '关系', position: '岗位名称',
      strengths: '核心优势', experience: '相关经验',
      situation: '具体情况', deptName: '部门名称',
      task: '任务内容', status: '现状',
      philosophy: '管理理念', workContent: '工作内容',
      results: '取得的成果', difficulties: '遇到的困难',
      relation: '关系', occasion: '场合',
      amount: '金额', friendName: '朋友姓名',
      money: '金额', person: '对方',
      thing: '事情', status: '对方情况',
      erson: '对方', '帮了什么忙': '帮了什么忙',
      arrangement: '安排', gift: '礼物',
      leaderRelation: '与领导关系', myTraits: '自身特点',
      theirTraits: '对方特点', howLong: '认识多久',
      platform: '平台名称', product: '产品名称',
      problem: '问题描述', sellerResponse: '商家回应',
      location: '位置', currentRent: '当前租金',
      marketPrice: '市场价格', reasons: '理由',
      restaurantName: '餐厅名称', foreignObject: '异物',
      shopName: '店铺名', serviceType: '服务类型',
      response: '对方回应', clause: '合同条款',
      trackingNumber: '快递单号', value: '物品价值',
      shop: '商家', harassment: '骚扰方式',
      destination: '目的地', photoCount: '照片数',
      highlight: '最难忘的', style: '风格',
      time: '使用时长', experience: '使用感受',
      pros: '优点', cons: '缺点',
      partner: '对方', story: '你们的故事',
      a: '选项数量', content: '内容',
      audience: '目标受众', comment: '评论内容',
      companyName: '公司名称', role: '角色',
      skills: '核心技能', achievement: '最大成就',
      introducer: '介绍人', attitude: '态度',
      groupType: '群类型', topic: '话题',
      atmosphere: '氛围', '做错了什么': '你做错了什么'
    }
    return labels[key] || key
  },

  getFieldPlaceholder(key) {
    const placeholders = {
      currentSalary: '例如：8000', expectedSalary: '例如：10000',
      tenure: '例如：2年', achievements: '例如：主导了XX项目，业绩提升30%',
      colleagueName: '例如：小王', taskDescription: '具体是什么事情',
      days: '例如：3', realReason: '不想说什么原因',
      projectName: '项目叫什么', problem: '出了什么问题',
      impact: '会有什么后果', reason: '主要原因是什么',
      relationship: '例如：关系不错/一般', position: '应聘的岗位',
      strengths: '你擅长什么', experience: '相关经历',
      situation: '详细描述', deptName: '例如：技术部',
      task: '需要配合什么', status: '对方现在的态度',
      philosophy: '你的管理理念', workContent: '做了什么',
      results: '做出的成果', difficulties: '遇到的困难',
      money: '例如：5000', person: '对方是谁',
      thing: '什么事', arrangement: '具体安排',
      gift: '想送什么', myTraits: '你是什么性格',
      theirTraits: '对方看起来怎样', howLong: '认识多久',
      product: '什么产品', platform: '哪个平台',
      location: '哪个城市哪个小区', currentRent: '现在房租',
      marketPrice: '同户型租金', restaurantName: '餐厅名',
      foreignObject: '吃出了什么', shopName: '店名',
      serviceType: '什么服务', clause: '有什么条款',
      value: '多少钱', destination: '去了哪里',
      photoCount: '例如：50张', highlight: '最深刻的',
      style: '例如：文艺/搞笑/简约', partner: '对方怎么称呼',
      story: '你们怎么认识的', content: '视频内容描述',
      audience: '例如：年轻女性/学生党', skills: '例如：Python、项目管理',
      achievement: '最骄傲的成就', introducer: '是谁介绍的'
    }
    return placeholders[key] || '请输入'
  },

  onFieldInput(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const key = `formFields[${index}].value`
    this.setData({ [key]: value })
  },

  onExtraContextInput(e) {
    this.setData({ extraContext: e.detail.value })
  },

  async onSubmit() {
    const { formFields, extraContext, scenario } = this.data

    const values = formFields
      .filter(f => f.value && f.value.trim())
      .map(f => `${f.label}：${f.value.trim()}`)
      .join('；')
    const fullContent = `【场景】${scenario.title}${values ? '\n' + values : ''}${extraContext ? '\n【补充】' + extraContext : ''}`

    this.setData({ submitting: true, isSaved: false })

    try {
      const result = await api.chat({
        content: fullContent,
        category: scenario.category || 'general',
        contextInfo: extraContext
      })

      this.setResultData(result)
    } catch (err) {
      wx.showToast({ title: err || '生成失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // 统一处理返回数据
  setResultData(result) {
    if (!result) {
      this.setData({
        showResult: true,
        analysisParts: [],
        strategyParts: [],
        scriptParts: ['暂无返回结果'],
        scriptVariants: [],
        rawResponse: ''
      })
      return
    }

    if (result.variants && result.variants.length > 0) {
      // 新版多方案格式
      this.setData({
        showResult: true,
        hasStructured: result.analysis !== undefined,
        analysisParts: result.analysis ? result.analysis.split('\n').filter(l => l.trim()) : [],
        strategyParts: result.strategy ? result.strategy.split('\n').filter(l => l.trim()) : [],
        scriptParts: result.script ? result.script.split('\n').filter(l => l.trim()) : [],
        scriptVariants: result.variants,
        rawResponse: result.response
      })
    } else if (result.analysis !== undefined) {
      // 旧结构化格式（兼容）
      this.setData({
        showResult: true,
        hasStructured: true,
        analysisParts: result.analysis ? result.analysis.split('\n').filter(l => l.trim()) : [],
        strategyParts: result.strategy ? result.strategy.split('\n').filter(l => l.trim()) : [],
        scriptParts: result.script ? result.script.split('\n').filter(l => l.trim()) : [],
        scriptVariants: this.extractVariants(result.script || ''),
        rawResponse: result.response
      })
    } else {
      this.parseAndDisplay(result.response)
    }
  },

  // 从script文本中提取多方案（前端备用解析）
  extractVariants(scriptText) {
    const variants = []
    const lines = (scriptText || '').split('\n')
    let current = null
    const headerRegex = /^【方案[一二三四五六七八1-8][:：]\s*(.+)】/

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const match = trimmed.match(headerRegex)
      if (match) {
        if (current) variants.push(current)
        current = { title: match[1].trim(), content: '' }
      } else if (current) {
        current.content += trimmed + '\n'
      }
    }
    if (current) variants.push(current)

    return variants.map(v => ({ title: v.title, content: v.content.trim() }))
  },

  parseAndDisplay(response) {
    const text = (response || '').trim()
    if (!text) {
      this.setData({
        showResult: true,
        analysisParts: [],
        strategyParts: [],
        scriptParts: ['暂无返回结果'],
        scriptVariants: [],
        rawResponse: ''
      })
      return
    }
    let analysis = '', strategy = '', script = ''

    const lines = text.split('\n')
    let currentSection = ''
    const sections = { analysis: [], strategy: [], script: [] }

    for (const line of lines) {
      if (/【?思考过程】?|【?局势分析】?|【?内容定位】?|【?法律依据】?/.test(line)) {
        currentSection = 'analysis'; continue
      } else if (/【?策略建议】?|【?文案方案】?|【?优化建议】?/.test(line)) {
        currentSection = 'strategy'; continue
      } else if (/【?具体话术】?|【?话术方案】?/.test(line)) {
        currentSection = 'script'; continue
      }

      if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim())
      }
    }

    const hasAnySection = sections.analysis.length || sections.strategy.length || sections.script.length
    const scriptText = sections.script.join('\n')

    if (!hasAnySection) {
      // 完全无分段时，整段当作话术方案输出，不造假分析/策略
      this.setData({
        showResult: true,
        analysisParts: [],
        strategyParts: [],
        scriptParts: [text],
        scriptVariants: this.extractVariants(text),
        rawResponse: text
      })
    } else {
      this.setData({
        showResult: true,
        analysisParts: sections.analysis,
        strategyParts: sections.strategy,
        scriptParts: sections.script,
        scriptVariants: this.extractVariants(scriptText),
        rawResponse: text
      })
    }
  },

  // 复制指定方案
  onCopyScript(e) {
    const { index } = e.currentTarget.dataset
    const variant = this.data.scriptVariants[index]
    if (variant) {
      wx.setClipboardData({
        data: `${variant.title}\n${variant.content}`,
        success: () => wx.showToast({ title: '已复制', icon: 'success' })
      })
    }
  },

  // 显示调整弹窗
  onShowAdjust(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      showAdjustModal: true,
      adjustIndex: index,
      adjustInput: '',
      adjustResult: ''
    })
  },

  // 关闭调整弹窗
  onCloseAdjust() {
    this.setData({
      showAdjustModal: false,
      adjustIndex: -1,
      adjustInput: '',
      adjustLoading: false,
      adjustResult: ''
    })
  },

  // 调整输入
  onAdjustInput(e) {
    this.setData({ adjustInput: e.detail.value })
  },

  // 提交调整
  async onSubmitAdjust() {
    const { adjustInput, adjustIndex, scriptVariants, formFields, extraContext, scenario } = this.data
    if (!adjustInput.trim()) {
      wx.showToast({ title: '请输入调整方向', icon: 'none' })
      return
    }

    const variant = scriptVariants[adjustIndex]
    if (!variant) return

    const values = formFields
      .filter(f => f.value && f.value.trim())
      .map(f => `${f.label}：${f.value.trim()}`)
      .join('；')
    const fullContent = `【场景】${scenario.title}${values ? '\n' + values : ''}${extraContext ? '\n【补充】' + extraContext : ''}`

    this.setData({ adjustLoading: true })

    try {
      const result = await api.chat({
        content: fullContent,
        category: scenario.category || 'general',
        contextInfo: extraContext,
        adjustment: adjustInput.trim(),
        currentVariant: `${variant.title}\n${variant.content}`,
        variantIndex: adjustIndex
      })

      if (result.adjusted) {
        // 替换对应方案
        const key = `scriptVariants[${adjustIndex}]`
        this.setData({
          [key]: { title: '已调整', content: result.response },
          adjustResult: result.response,
          adjustLoading: false
        })
        wx.showToast({ title: '调整完成', icon: 'success' })
        this.onCloseAdjust()
      }
    } catch (err) {
      wx.showToast({ title: err || '调整失败', icon: 'none' })
      this.setData({ adjustLoading: false })
    }
  },

  // 显示/隐藏重新生成输入
  onToggleRegenInput() {
    this.setData({ showRegenInput: !this.data.showRegenInput })
  },

  // 重新生成输入
  onRegenInput(e) {
    this.setData({ regenInput: e.detail.value })
  },

  // 执行重新生成
  async onRegenerate() {
    const { formFields, extraContext, scenario, regenInput } = this.data

    const values = formFields
      .filter(f => f.value && f.value.trim())
      .map(f => `${f.label}：${f.value.trim()}`)
      .join('；')
    let fullContent = `【场景】${scenario.title}${values ? '\n' + values : ''}${extraContext ? '\n【补充】' + extraContext : ''}`
    if (regenInput.trim()) {
      fullContent += `\n【调整要求】${regenInput.trim()}`
    }

    this.setData({
      submitting: true,
      showRegenInput: false,
      regenInput: ''
    })

    try {
      const result = await api.chat({
        content: fullContent,
        category: scenario.category || 'general',
        contextInfo: extraContext,
        skipCache: true
      })

      this.setResultData(result)
    } catch (err) {
      wx.showToast({ title: err || '生成失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  onCopy() {
    const { rawResponse, scenario } = this.data
    const text = `【${scenario.title}】沟通方案\n\n${rawResponse}`
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  async onSave() {
    const { rawResponse, scenario } = this.data
    try {
      await api.saveItem({
        title: scenario.title,
        content: rawResponse,
        category: scenario.category
      })
      this.setData({ isSaved: true })
      wx.showToast({ title: '收藏成功', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '收藏失败', icon: 'none' })
    }
  },

  onRetry() {
    this.setData({ showResult: false }, () => {
      this.onSubmit()
    })
  },

  toggleThinking() {
    this.setData({ thinkingExpanded: !this.data.thinkingExpanded })
  }
})
