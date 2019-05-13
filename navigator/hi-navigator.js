import CommonNavigator from "heheda-navigator";

export default class HiNavigator extends CommonNavigator {

    static navigateToAddDrug({deviceId = '', compartment}) {
        getApp().globalData.addOrEditDrugObj = {deviceId, compartment};
        this.navigateTo({url: '/pages/add-drug/choose-type/choose-type'});
    }

    static navigateToScanCode({deviceId = '', compartment}) {
        getApp().globalData.addOrEditDrugObj = {deviceId, compartment};
        this.navigateTo({url: '/pages/scan-code/scan-code'});
    }

    static navigateToDrugInfo({drugInfo, compartment, deviceId = ''}) {
        getApp().globalData.drugInfo = drugInfo;
        this.navigateTo({url: '/pages/drug-info/drug-info'});
    }

    static navigateToScanErr({index, code}) {
        this.navigateTo({
            url: `/pages/scan-err/scan-err?index=${index}&code=${code}`
        })
    }

    static navigateToEditDrugPage({deviceId, compartment, classify, drugName, items, step, count, useType}) {
        getApp().globalData.addOrEditDrugObj = {deviceId, compartment, classify, drugName, items, useType};
        this.navigateTo({url: `/pages/add-drug/input-drug/input-drug?classify=${classify}&step=${step}&count=${count}`});
    }

    /**
     * 跳转到次数和用量
     * @param classify 药品类型
     * @param drugName 药品名称
     * @param step 当前是第几步
     * @param count 当前总共的步数
     */
    static navigateToDrugNumberPage({classify = 'scan', drugName, step, count, code = 0}) {
        this.navigateTo({url: `/pages/add-drug/number/number?classify=${classify}&drugName=${drugName}&step=${parseInt(step) + 1}&count=${count}&code=${code}`})
    }

    static navigateToConnectDevice() {
        this.reLaunch({url: '/pages/connect-device/connect-device'});
    }

    static switchToIndexPage({refresh = false}) {
        getApp().globalData.refreshIndexPage = refresh;
        this.switchTab({url: '/pages/index/index'});
    }

    static navigateSearchDevicePage() {
        this.navigateTo({url: `/pages/search-device/search-device`})
    }

    static navigateSearchDrugPage() {
        this.navigateTo({
            url: `/pages/search-drug/search-drug`
        })
    }

    static reLaunchToBindDevicePage() {
        const pages = getCurrentPages();
        let currentPagePath = '',len = pages.length;
        if (len) {
            currentPagePath = pages[len - 1].route;
        }
        currentPagePath !== 'pages/bind-device/bind-device' && this.reLaunch({url: '/pages/bind-device/bind-device'});
    }

    static relaunchToUpdatePage({binUrl, datUrl}) {
        getApp().otaUrl = arguments[0];
        this.reLaunch({url: '/pages/update/update'});
    }

    static navigateToReportPage({actual, forget, avatar, year, day, status}) {
        this.navigateTo({url: `/pages/report/report?actual=${actual}&forget=${forget}&avatar=${avatar}&year=${year}&day=${day}&readStatus=${status}`});
    }
}
