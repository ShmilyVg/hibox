// pages/scan-code/scan-code.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";

Page({
    data: {
        isChose: false
    },

    onLoad: function (options) {
    },

    scanCode() {
        let that = this;
        if (this.data.isChose) {
            wx.setStorage({
                key: 'verySixScanFunction',
                data: true
            })
        }
        wx.scanCode({
            onlyFromCamera: true,
            scanType: ['barCode'],
            success(res) {
                console.log('一维码数字', res.result);
                Protocol.getDrugCode({code: res.result}).then(data => {
                    console.log('一维码返回：', data);
                    if (data.result.drugName) {
                        // 是可用一维码
                        console.log('是可用一维码');
                        HiNavigator.navigateToDrugInfo({
                            compartment: getApp().globalData.addOrEditDrugObj.compartment,
                            drugInfo: data
                        });
                    } else {
                        // 非可用一维码
                        console.log('非可用一维码');
                        HiNavigator.navigateToScanErr({
                            index: getApp().globalData.addOrEditDrugObj.compartment
                        })
                    }
                })
            }
        })
    },

    notShowTipPage() {
        this.setData({
            isChose: !this.data.isChose
        })
    }
})