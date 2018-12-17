// pages/history/history.js
import Protocol from "../../modules/network/protocol";
import BlueToothProtocol from "../../modules/bluetooth/base/bluetooth-protocol";
import * as tools from "../../utils/tools";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        listText: ['now', 'future'],
        allList: [],
        queryState: '记录待同步',
        stateBtn: '',
        page: 1
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.getMedicalRecordList({});
    },
    getMedicalRecordList({page = 1}) {
        Protocol.MedicalRecordList({page}).then(data => {
            let list = data.result;
            let frontItemTime = {date: '', time: ''};

            console.log(list);
            if (list.length) {
                this.setData({
                    allList: this.data.allList.concat(list).sort(function (item1, item2) {
                        return item1.time - item2.time;
                    }).map(item => {
                        const {id, device_id: deviceId, drug_name: drug_name, number, compartment,state} = item;
                        const {date, time} = tools.createDateAndTime(item.time);
                        const isShowTime = !(frontItemTime.date === date && frontItemTime.time === time);
                        frontItemTime.date = date;
                        frontItemTime.time = time;
                        if(item.state == 1){
                            this.setData({
                                stateBtn:'已服用'
                            })
                        }else{
                            this.setData({
                                stateBtn:'未服用'
                            })
                        }
                        return {date, time, isShowTime, id, deviceId, drug_name, number, compartment,state};
                    })
                });
            } else {
                this.data.page--;
            }
        }).finally(() => wx.stopPullDownRefresh());
    },

    stateBtnClick(){
        Protocol.MedicalRecordList({state}).then(data => {
            //let state = data.state;
            //console.log(state)
        })
    },


    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        getApp().setBLEListener({
            bleStateListener: ({state}) => {
                switch (state.protocolState) {
                    // case BlueToothProtocol.QUERY_DATA_START:
                    //
                    //     break;
                    case BlueToothProtocol.QUERY_DATA_ING:
                        this.setData({queryState: '同步中...'});
                        break;
                    case BlueToothProtocol.QUERY_DATA_FINISH:
                        this.setData({queryState: '同步完成'});
                        break;
                }
            }
        });

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        getApp().setBLEListener({bleStateListener: null});
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    }
})