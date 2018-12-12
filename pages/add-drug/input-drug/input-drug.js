// pages/add-drug/input-drug/input-drug.js
import HiNavigator from "../../../navigator/hi-navigator";
import Toast from "../../../view/toast";
import Protocol from "../../../modules/network/protocol";

Page({

    data: {
        drugs: [],
        name: ''
    },
    onLoad(options) {
        const {type, step, count} = options;
        this.setData({type, step, count});

        Protocol.getDrugItems({type}).then(data => {
            const {result: drugs} = data;
            this.setData({drugs});
        });
    },

    nameChooseEvent(e) {
        const {currentTarget: {dataset: {index}}} = e;
        const obj = this.getAfterClearSelectedObj();
        obj[`drugs[${index}].selected`] = true;
        obj['name'] = this.data.drugs[index].name;
        this.setData(obj);
    },

    lostFocusEvent(e) {
        console.log(e);
        const value = e.detail.value.trim();
        !!value && (this.data.name = value);
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
        if (!!this.data.name) {
            HiNavigator.navigateToDrugNumberPage({...this.data});
        } else {
            this.setData({name: ''});
            Toast.warn('请输入药名');
        }
    }
});
