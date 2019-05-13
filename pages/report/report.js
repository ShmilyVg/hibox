// pages/report/report.js
import Protocol from "../../modules/network/protocol";

Page({
    data: {},
    onLoad(options) {
        if ('memberId' in options) {
            Protocol.getMedicalRecordWeekly({memberId: options.memberId}).then(data => {
                this.handleData(data.result);
            });
        } else {
            // if (!options.readStatus) {
                Protocol.postMedicalRecordUpdataWeekly();
            // }
            this.handleData(options);
        }
    },

    handleData(obj) {
        obj.num = [{
            num: obj.actual,
            text: '实际服用',
            color: '#30826C'
        }, {
            num: obj.forget,
            text: '忘记服用',
            color: '#FF9252'
        }];
        delete obj.actual;
        delete obj.forget;
        this.setData({...obj});
    }
})