export default class HiNavigator {

    static navigateToAddDrug({deviceId = '', compartment}) {
        getApp().globalData.addOrEditDrugObj = {deviceId, compartment};
        this.navigateTo({url: '/pages/add-drug/choose-type/choose-type'});
    }

    static navigateToEditDrugPage({deviceId, compartment, classify, drugName, items, step, count}) {
        console.log(arguments[0]);
        getApp().globalData.addOrEditDrugObj = {deviceId, compartment, classify, drugName, items};
        this.navigateTo({url: `/pages/add-drug/input-drug/input-drug?classify=${classify}&step=${step}&count=${count}`});
    }

    /**
     * 跳转到次数和用量
     * @param classify 药品类型
     * @param drugName 药品名称
     * @param step 当前是第几步
     * @param count 当前总共的步数
     */
    static navigateToDrugNumberPage({classify, drugName, step, count}) {
        this.navigateTo({url: `/pages/add-drug/number/number?classify=${classify}&drugName=${drugName}&step=${parseInt(step) + 1}&count=${count}`})
    }

    static switchToIndexPage({refresh = false}) {
        getApp().globalData.refreshIndexPage = refresh;
        this.switchTab({url: '/pages/index/index'});
    }

    static navigateSearchDevicePage() {
        this.navigateTo({url: `/pages/search-device/search-device`})
    }

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

}
