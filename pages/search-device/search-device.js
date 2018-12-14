// pages/search-device/search-device.js
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
    },

    deleteDevice() {

    }
})