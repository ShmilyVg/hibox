// pages/search-device/search-device.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState} from "../../modules/bluetooth/bluetooth-state";
import Toast from "../../view/toast";

Page({

    data: {
        num: 10,
        isSearching: false
    },
    onLoad: function (options) {
    },

    startSearch() {
        if (this.data.isSearching) {
            return;
        }

        let state = getApp().getLatestBLEState();
        if (state.connectState === ConnectState.CONNECTED) {

            this.setData({
                isSearching: true
            });
            let timer = setInterval(() => {
                this.data.num > 1 && getApp().getBLEManager().sendFindDeviceProtocol();
                this.setData({
                    num: --this.data.num
                });
                if (this.data.num <= 0) {
                    this.setData({
                        num: 10,
                        isSearching: false
                    });
                    clearInterval(timer);
                }
            }, 1000);
        } else {
            Toast.warn('药盒未连接')
        }
    },

    deleteDevice() {
        let state = getApp().getLatestBLEState();
        if (state.connectState === ConnectState.CONNECTED) {
            this.showDeleteModel('删除药盒后，药盒和手机都不再提醒');
        } else {
            this.showDeleteModel('药盒未连接，继续删除可能会丢失未同步的服药记录，并且药盒提醒无法删除');
        }
    },

    showDeleteModel(content) {
        wx.showModal({
            title: '小贴士',
            content: content,
            showCancel: true,
            cancelText: '取消',
            confirmText: '确定删除',
            success(res) {
                if (res.confirm) {
                    this.postDeleteDevice();
                }
            },
            fail: () => {
            },
            complete: () => {
            }
        })
    },

    postDeleteDevice() {
        Toast.showLoading();
        Protocol.postDeviceUnbind().then(data => {
            Toast.hiddenLoading();
            if (data.code === 1) {
                getApp().getBLEManager().clearConnectedBLE().finally(function () {
                    HiNavigator.reLaunchToBindDevicePage({});
                });
            }
        })
    }
})
