// pages/scan-err/scan-err.js
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {},

    onLoad: function (options) {
        this.data.index = options.index
    },

    handAdd() {
        console.log('compartment=====',this.data.index);
        HiNavigator.navigateToAddDrug({compartment: this.data.index})
    }
})