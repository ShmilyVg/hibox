// pages/report/report.js
Page({

    data: {},
    onLoad(options) {
        let num = [];

        num = [{num: 21, text: '实际服用', color: '#30826C'}, {num: 2, text: '忘记服用', color: '#FF9252'}];
        this.setData({
            num: num,
            text:'xxxxxxxxxxxxxxxxx'
        })
    },
})