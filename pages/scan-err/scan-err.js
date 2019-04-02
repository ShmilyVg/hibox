// pages/scan-err/scan-err.js
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {},

    onLoad: function (options) {
        this.data.index = options.index;
        this.data.code = options.code;
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