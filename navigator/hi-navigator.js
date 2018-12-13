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

    /**
     * 跳转到次数和用量
     * @param type 药品类型
     * @param name 药品名称
     * @param step 当前是第几步
     * @param count 当前总共的步数
     * @param drugNumber 药盒的第几个格子
     * @param drugDayCount 一天吃几次药
     * @param drugPiece 一次吃几片
     */
    static navigateToDrugNumberPage({type, name, step, count, drugNumber, drugDayCount = 3, drugPiece = 1}) {
        this.navigateTo({url: `/pages/add-drug/number/number?type=${type}&name=${name}&step=${step}&count=${count}&number=${drugDayCount}&piece=${drugPiece}`})
    }
}
