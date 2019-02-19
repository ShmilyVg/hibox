// pages/drug-info/drug-info.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {},

    onLoad: function (options) {
        // Protocol.getDrugCode({code: '6943118000248'}).then(data => {
        //     this.setData({
        //         data: data.result
        //     })
        // })
        let drugInfo = getApp().globalData.drugInfo;

        this.setData({
            data: drugInfo.result
        })
    },

    drugRemind() {
        HiNavigator.navigateToDrugNumberPage({drugName: this.data.data.drugName, step: 2, count: 3,code:this.data.data.code});
    }
})