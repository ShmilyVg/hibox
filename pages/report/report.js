// pages/report/report.js
import Protocol from "../../modules/network/protocol";

Page({

    data: {},
    onLoad(options) {
        if (options.readStatus == 0) {
            Protocol.postMedicalRecordUpdataWeekly();
        }
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