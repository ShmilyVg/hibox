export default class HiNavigator {
    static navigateTo({url, success, fail, complete}) {
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

    static navigateToInputDrugPage({type, step, count}) {
        this.navigateTo({url: `/pages/add-drug/input-drug/input-drug?type=${type}&step=${step}&count=${count}`});
    }

    static navigateToDrugNumberPage({type, name, step, count}) {
        this.navigateTo({url: `/pages/add-drug/number/number?type=${type}&name=${name}&step=${step}&count=${count}`})
    }
}
