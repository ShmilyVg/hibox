// pages/search-device/search-device.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState, ProtocolState} from "../../modules/bluetooth/bluetooth-state";
import Toast from "../../view/toast";

Page({

    data: {
        num: 10,
        isSearching: false
    },
    onLoad: function (options) {
        let state = getApp().getLatestBLEState();
        this.setData({
            latestBLEState: state
        });
        this.isFind = false;
        getApp().setBLEListener({
            bleStateListener: ({state}) => {
                if (state.protocolState === ProtocolState.FIND_DEVICE) {
                    Toast.success('已找到药盒');
                    this.isFind = true;
                }
            }
        });
    },

    startSearch() {
        if (this.data.isSearching) {
            return;
        }

        if (this.data.latestBLEState.connectState === ConnectState.CONNECTED) {
            this.setData({
                isSearching: true
            });
            getApp().getBLEManager().sendFindDeviceProtocol()
            let timer = setInterval(() => {
                this.setData({
                    num: --this.data.num
                });
                if (this.data.num <= 0 || this.isFind) {
                    this.setData({
                        num: 10,
                        isSearching: false
                    });
                    clearInterval(timer);
                    this.isFind = false;
                }
            }, 1000);
        } else {
            Toast.warn('药盒未连接')
        }
    },

    deleteDevice() {
        if (this.data.latestBLEState.connectState === ConnectState.CONNECTED) {
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
            confirmColor: '#64D6B5',
            success: (res) => {
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
