Component({
  properties: {
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    categoryName: { type: String, value: '' },
    fieldCount: { type: Number, value: 0 },
    hot: { type: Boolean, value: false },
    id: { type: String, value: '' }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.id })
    }
  }
})
