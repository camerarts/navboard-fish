App({
  globalData: {
    userInfo: null
  },
  onLaunch() {
    // Check for updates
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function (res) {
      // Request complete
    })
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: 'Update Available',
        content: 'A new version is ready. Restart?',
        success: function (res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  }
})