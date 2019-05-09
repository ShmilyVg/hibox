// pages/add-drug/input-drug/input-drug.js
import HiNavigator from "../../../navigator/hi-navigator";
import Toast from "../../../view/toast";
import Protocol from "../../../modules/network/protocol";

Page({

    data: {
        drugs: [],
        drugName: ''
    },
    onLoad(options) {
        const {classify, step, count} = options;
        this.setData({classify, step, count, drugName: getApp().globalData.addOrEditDrugObj.drugName || ''});

        if (classify) {
            Protocol.getDrugItems({classify}).then(data => {
                const {result: drugs} = data;
                const drugName = this.data.drugName;
                this.setData({drugs: drugs.map(item => ({...item, selected: item.name === drugName}))});
            });
        }
    },

    onShow() {
        this.setData({
            drugName: getApp().globalData.addOrEditDrugObj.drugName || ''
        })
    },

    nameChooseEvent(e) {
        const {currentTarget: {dataset: {index}}} = e;
        const obj = this.getAfterClearSelectedObj();
        obj[`drugs[${index}].selected`] = true;
        obj['drugName'] = this.data.drugs[index].name;
        getApp().globalData.addOrEditDrugObj.drugName = this.data.drugs[index].name;
        this.setData(obj);
    },

    lostFocusEvent(e) {
        console.log(e);
        const value = e.detail.value.trim();
        !!value && (this.data.drugName = value);
    },

    startInputEvent() {
        this.setData(this.getAfterClearSelectedObj());
    },

    getAfterClearSelectedObj() {
        let obj = {};
        this.data.drugs.forEach((item, index) => item.selected && (obj[`drugs[${index}].selected`] = false));
        return obj;
    },

    nextStep() {
        if (!!this.data.drugName) {
            HiNavigator.navigateToDrugNumberPage({...this.data});
        } else {
            this.setData({drugName: ''});
            Toast.warn('请输入药名');
        }
    },

    toSearch() {
        HiNavigator.navigateSearchDrugPage()
    }

});
