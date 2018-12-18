// pages/history/history.js
import Protocol from "../../modules/network/protocol";
import * as tools from "../../utils/tools";
import toast from "../../view/toast";
import * as config from "../../utils/config";
import {ProtocolState} from "../../modules/bluetooth/bluetooth-state";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        listText: ['now', 'future'],
        allList: [],
        queryState: '记录待同步',
        isConnect: true,
        page: 1
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.getMedicalRecordList({});
    },
    getMedicalRecordList({page = 1, recorded = false}) {
        Protocol.MedicalRecordList({page}).then(data => {
            let list = data.result;
            let frontItemTime = {date: '', time: ''};

            if (list.length) {
                let allList = [];
                if (recorded) {
                    allList = list;
                } else {
                    allList = this.data.allList.concat(list);
                }
                this.setData({
                    allList: allList.sort(function (item1, item2) {
                        return item1.time - item2.time;
                    }).map(item => {
                        const {id, device_id: deviceId, drug_name: drug_name, number, compartment, state, image_url} = item;
                        const {date, time} = tools.createDateAndTime(item.time);
                        const isShowTime = !(frontItemTime.date === date && frontItemTime.time === time);
                        frontItemTime.date = date;
                        frontItemTime.time = time;
                        return {date, time, isShowTime, id, deviceId, drug_name, number, compartment, state, image_url};
                    })
                });
            } else {
                this.data.page--;
            }
        }).finally(() => wx.stopPullDownRefresh());
    },


    stateBtnClick(e) {
        let list = this.data.allList;
        let index = e.target.dataset.index;
        let time = list[index].time;
        let ids = [];
        let state = list[index].state;
        for (let i in list){
            if (time === list[i].time){
                ids.push(list[i].id);
                if(state === 0){
                    state = 1;
                }else if(state === 1){
                    state = 0;
                }
                list[i].state = state;
            }
        }
        this.setData({
            allList : list
        })

        Protocol.MedicalRecordUpdate({ids,state}).then(data => {

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
                    // case ProtocolState.QUERY_DATA_START:
                    //
                    //     break;
                    case ProtocolState.QUERY_DATA_ING:
                        this.setData({queryState: '同步中...'});
                        break;
                    case ProtocolState.QUERY_DATA_FINISH:
                        this.setData({queryState: '同步完成'});
                        /*setTimeout(function(){
                            this.getMedicalRecordList({page = 1, recorded = true});
                        },3000);*/
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

    },

    clickPhoto(e) {
        let index = e.currentTarget.dataset.index;
        let that = this;
        let item = that.data.allList[index[1]];
        let image = item.image_url;
        if (typeof (image) == "undefined") {
            that.chooseImage(that, item);
        } else {
            wx.showActionSheet({
                itemList: ['查看', '修改'],
                success(res) {
                    switch (res.tapIndex) {
                        case 0:
                            wx.previewImage({
                                urls: [image] // 需要预览的图片http链接列表
                            });
                            break;
                        case 1:
                            that.chooseImage(that, item);
                            break;
                    }
                },
                fail(res) {
                    console.log(res.errMsg)
                }
            })
        }
    },

    chooseImage(that, item) {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                toast.showLoading();
                let path = res.tempFilePaths[0];
                wx.uploadFile({
                    url: config.UploadUrl,
                    filePath: path,
                    name: path,
                    success: function (res) {
                        let data = res.data;
                        let image = JSON.parse(data).result.path;
                        Protocol.postMedicalRecordImage({
                            id: item.id, image_url: image
                        }).then(data => {
                            that.getMedicalRecordList({recorded: true});
                            toast.hiddenLoading();
                        })
                    },
                    fail: function (e) {
                    },
                    complete: function (e) {
                    }
                })
            }
        })
    },

})