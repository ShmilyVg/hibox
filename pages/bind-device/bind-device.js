// pages/bind-device/bind-device.js
import Toast from "../../view/toast";
import Login from "../../modules/network/login";
import UserInfo from "../../modules/network/userInfo";
import HiNavigator from "../../navigator/hi-navigator";
import Protocol from "../../modules/network/protocol";

Page({

    data: {},

    onLoad: function (options) {

    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#3E3E3E',
        });
    },

    onGotUserInfo(e) {
        wx.getNetworkType({
            success: function (res) {
                if (res.networkType === 'none') {
                    Toast.showLoading('网络异常，请重试');
                }
            }
        });
        const {
            detail: {
                userInfo,
                encryptedData,
                iv
            }
        } = e;
        if (!!userInfo) {
            Toast.showLoading();
            Login.doRegister({
                    userInfo,
                    encryptedData,
                    iv
                })
                .then(() => UserInfo.get())
                .then(({
                    userInfo
                }) => !this.setData({
                    userInfo
                }))
                .catch(() => setTimeout(Toast.warn, 0, '获取信息失败')).finally(function () {

                    Toast.hiddenLoading();
                    HiNavigator.navigateToConnectDevice();
                });
        }
    },

    clickBarCode() {
        wx.scanCode({
            onlyFromCamera: true,
            scanType: ['barCode'],
            success(res) {
                console.log('一维码数字',res.result);
                Protocol.getDrugCode({code:res.result}).then(data=>{
                    console.log('一维码返回：',data);
                    // data.result.description
                })
            }
        })
    }
})