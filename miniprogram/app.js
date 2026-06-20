App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d0gdaj1eu0e92864a',
      traceUser: true
    })

    this.globalData = {
      userInfo: null,
      dailyCount: 0
    }
  }
})
