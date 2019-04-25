// pages/report/report.js
Page({

    data: {},
    onLoad(options) {
        options.num = [{
            num: options.actual,
            text: '实际服用',
            color: '#30826C'
        }, {
            num: options.forget,
            text: '忘记服用',
            color: '#FF9252'
        }];
        this.setData({...options});
    },
})