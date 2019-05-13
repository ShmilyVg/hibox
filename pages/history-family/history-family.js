// pages/history-family/history-family.js
import Toast from "../../view/toast";
import Protocol from "../../modules/network/protocol";
import * as tools from "../../utils/tools";

Page({

    data: {
        listText: ['now', 'future'],
        allList: [],
        page: 1,
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC']
    },
    onLoad(options) {
        this.data.memberId = options.memberId;
        this.getMedicalRecordList({})
    },

    frontItemTime: {date: '', time: ''},
    getMedicalRecordList({page = 1}) {
        Toast.showLoading();
        Protocol.MedicalRecordList({page, memberId: parseInt(this.data.memberId)}).then(data => {
            if (data.code === -1) {
                return;
            }
            let list = data.result;

            if (list.length) {
                let allList = list.sort(function (item1, item2) {
                    const divideTime = item2.time - item1.time;
                    if (divideTime !== 0) {
                        return divideTime;
                    } else {
                        return item1.compartment - item2.compartment;
                    }

                }).map(item => {
                    const {id, device_id: deviceId, drug_name: drug_name, number, compartment, state, image_url} = item;
                    const {date, time} = tools.createDateAndTime(item.time);
                    const isShowTime = !(this.frontItemTime.date === date && this.frontItemTime.time === time);
                    this.frontItemTime.date = date;
                    this.frontItemTime.time = time;
                    return {date, time, isShowTime, id, deviceId, drug_name, number, compartment, state, image_url};
                });
                console.log(allList);

                allList = this.data.allList.concat(allList);
                this.setData({
                    allList: allList
                })
            } else {
                this.data.page--;
            }
        }).finally(() => {
            Toast.hiddenLoading();
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom() {
        console.log('getMedicalRecordList', this.data.page + 1);
        this.getMedicalRecordList({page: ++this.data.page});
    },

})