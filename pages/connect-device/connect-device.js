// pages/connect-device/connect-device.js
Page({

    data: {
        backgroundColor: '#3E3E3E',
        isFlicker: false,
        index: 1,
        showContent: [
            {
                title: '将药盒靠近手机',
                content: '正在努力的寻找药盒…',
                backgroundColor: '#3E3E3E',
                navigationColor: '#3E3E3E'
            },
            {
                title: '药盒找到啦！',
                content: '短按药盒按钮',
                backgroundColor: 'linear-gradient(#66DABF, #008290)',
                navigationColor: '#66DABF'
            }
        ]
    },

    onLoad: function (options) {
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: this.data.showContent[this.data.index].navigationColor,
        });
        this.flickerHandle();
    },

    flickerHandle(){
        let num = 0;
        let timer = setInterval(() => {
            this.setData({
                isFlicker: !this.data.isFlicker
            });
            ++num;
            if (num === 6) {
                clearTimeout(timer);
            }
        }, 1000);
    }
})