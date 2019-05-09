// pages/scan-err/scan-err.js
import HiNavigator from "../../navigator/hi-navigator";
import Protocol from "../../modules/network/protocol";

Page({

    data: {},

    onLoad: function (options) {
        this.data.index = options.index;
        this.data.code = options.code;
        Protocol.getDrugCreateDrugInstruction({code: options.code}).then();
    },

    handAdd() {
        console.log('compartment=====', this.data.index);
        HiNavigator.navigateToAddDrug({compartment: this.data.index})
    },

    toUpload() {
        wx.navigateTo({
            url: '../upload-instruction/upload-instruction' + '?code=' + this.data.code,
        })
    }
})