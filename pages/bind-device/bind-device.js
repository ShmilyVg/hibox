// pages/bind-device/bind-device.js
import Toast from "../../view/toast";
import Login from "../../modules/network/login";
import UserInfo from "../../modules/network/userInfo";
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {},

    onLoad: function (options) {

    },

    onShow(){
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#3E3E3E',
        });
    },

    onGotUserInfo(e) {
        wx.getBluetoothAdapterState({
            success(res) {
                let state = res.available;
                if (res.available){
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
                } else {
                    wx.showModal({
                        title: 'TIPS',
                        showCancel: false,
                        content: '请开启手机蓝牙',
                        confirmText: '我知道了',
                        confirmColor: '#67D5B8',
                    });
                }
            },fail(res){
                wx.showModal({
                    title: 'TIPS',
                    showCancel: false,
                    content: '请开启手机蓝牙',
                    confirmText: '我知道了',
                    confirmColor: '#67D5B8',
                });
            }
        })   
    }
})
