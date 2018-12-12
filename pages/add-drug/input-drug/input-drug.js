// pages/add-drug/input-drug/input-drug.js
import HiNavigator from "../../../navigator/hi-navigator";
import Toast from "../../../view/toast";
import Protocol from "../../../modules/network/protocol";

Page({

    data: {
        stepStr: '',
        name: '',
        drugs: []
    },
    onLoad(options) {
        const {type, step, count} = options;
        this.setData({
            type,
            step,
            count,
            stepStr: `${step}/${count}`
        });

        Protocol.getDrugItems({type}).then(data => {
            const {result: drugs} = data;
            this.setData({drugs});
        });
    },
    inputDrugNameEvent(e) {
        console.log(e);
        const value = e.detail.value.trim();
        !!value && (this.data.name = value);
    },

    nextStep() {
        if (!!this.data.name) {
            HiNavigator.navigateToDrugNumberPage({...this.data});
        } else {
            Toast.warn('请输入药名');
        }
    }
});
