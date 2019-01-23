// pages/bind-device/bind-device.js
import Toast from "../../view/toast";
import Login from "../../modules/network/login";
import UserInfo from "../../modules/network/userInfo";
import HiNavigator from "../../navigator/hi-navigator";

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
})