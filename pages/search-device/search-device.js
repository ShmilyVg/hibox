// pages/search-device/search-device.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState} from "../../modules/bluetooth/bluetooth-state";

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
        if (state.connectState === ConnectState.CONNECTED){
            getApp().getBLEManager().sendFindDeviceProtocol();
            this.setData({
                isSearching: true
            });
            let timer = setInterval(() => {
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
        }
    },

    deleteDevice() {
        Protocol.postDeviceUnbind().then(data => {
            getApp().getBLEManager().clearConnectedBLE().finally(function () {
                HiNavigator.reLaunchToBindDevicePage({});
            });
        })
    }
})
