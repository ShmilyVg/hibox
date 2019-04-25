// pages/report/report.js
Page({

    data: {},
    onLoad(options) {
        let data = options;
        let num = [{
            num: options.actual,
            text: '实际服用',
            color: '#30826C'
        }, {
            num: options.forget,
            text: '忘记服用',
            color: '#FF9252'
        }];
        data.num = num;
        this.setData({...options});
    },
})