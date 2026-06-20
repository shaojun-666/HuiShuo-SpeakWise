Component({
  properties: {
    analysis: { type: String, value: '' },
    strategy: { type: String, value: '' },
    script: { type: String, value: '' },
    rawContent: { type: String, value: '' }
  },

  methods: {
    onCopy() {
      this.triggerEvent('copy', { content: this.properties.rawContent })
    },
    onSave() {
      this.triggerEvent('save', { content: this.properties.rawContent })
    },
    onRetry() {
      this.triggerEvent('retry', {})
    }
  }
})
