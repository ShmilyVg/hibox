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
