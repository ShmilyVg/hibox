export default class HiNavigator {
    static navigateTo({url, success, fail, complete}) {
        wx.navigateTo({url, success, fail, complete});
    }

    // 跳转至结果页面 score得分 showUnscramble是否直接显示解读 situation场景值（可选） 检测时间戳 (可选)
    static navigateToResult({score, situation = 0, showUnscramble = false, timestamp = 0, success, fail, complete}) {
        let url = `/pages/result/result?score=${score}&situation=${situation}&showUnscramble=${showUnscramble}&timestamp=${timestamp}`;
        wx.navigateTo({url, success, fail, complete});
    }

    static reLaunch({url, success, fail, complete}) {
        wx.reLaunch({url, success, fail, complete});
    }

    static navigateBack({delta, success, fail, complete}) {
        wx.navigateBack({delta, success, fail, complete});
    }

    static switchTab({url, success, fail, complete}) {
        wx.switchTab({url, success, fail, complete});
    }

    static redirectTo({url, success, fail, complete}) {
        wx.redirectTo({url, success, fail, complete})
    }

    static navigateToStrategy() {
        this.navigateTo({url: '/pages/strategy/strategy'});
    }

    static navigateToHistory() {
        this.navigateTo({url: '/pages/history/history'});
    }

    static navigateToDeviceBind() {
        this.navigateTo({url: '/pages/device-bind/device-bind'});
    }

    static navigateToDeviceUnbind() {
        this.navigateTo({url: '/pages/device-manage/device-manage'});
    }
}
