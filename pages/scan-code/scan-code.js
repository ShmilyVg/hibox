// pages/scan-code/scan-code.js
import Protocol from "../../modules/network/protocol";

Page({
    data: {
        isChose: false
    },

    onLoad: function (options) {

    },

    scanCode() {
        if (this.data.isChose){
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
                    // data.result.description
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