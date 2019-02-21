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
            success(res) {
                if (res.networkType == 'none') {
                    wx.showModal({
                        title: '',
                        content: '网络异常，请重试',
                        showCancel: false,
                        confirmText: '确定',
                    })
                } else {
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
                }
            }
        })

    },

})
