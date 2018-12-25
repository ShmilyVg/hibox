// pages/history/history.js
import Protocol from "../../modules/network/protocol";
import * as tools from "../../utils/tools";
import toast from "../../view/toast";
import * as config from "../../utils/config";
import {ProtocolState, ConnectState} from "../../modules/bluetooth/bluetooth-state";

const app = getApp();
Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        listText: ['now', 'future'],
        allList: [],
        queryState: '记录待同步',
        isConnect: false,
        connectState: {'text': '记录同步中...', color: '#65FF0A'},
        page: 1,
        isQuery: false
    },

    onLoad() {
        this.getMedicalRecordList({});
    },

    onShow: function () {
        if (!!app.isAppOnHide) {
            this.queryStart();
            app.isAppOnHide = false;
        }
        !!app.isQueryDataFinish && this.queryFinish();
        app.setBLEListener({
            bleStateListener: ({state}) => {
                if (ConnectState.DISCONNECT === state.connectState || ConnectState.UNAVAILABLE === state.connectState || ConnectState.NOT_SUPPORT === state.connectState || ConnectState.UNBIND === state.connectState) {
                    this.setData({
                        connectState: {'text': '药盒未连接...', color: '#FF8000'},
                        isConnect: false
                    });
                } else {
                    switch (state.protocolState) {
                        case ProtocolState.QUERY_DATA_ING:
                            this.setData({
                                connectState: {'text': '记录同步中...', color: '#65FF0A'},
                                isConnect: false
                            });
                            break;
                        case ProtocolState.QUERY_DATA_FINISH:
                            this.queryFinish();
                            break;
                    }
                }
            }
        });
    },

    queryStart() {
        this.setData({
            connectState: {'text': '记录同步中...', color: '#65FF0A'},
            isConnect: false
        });
    },

    queryFinish() {
        if (!this.data.isQuery) {
            this.setData({
                connectState: {'text': '记录同步完成', color: '#65FF0A'},
                isConnect: false
            });
            setTimeout(() => {
                this.getMedicalRecordList({page: 1, recorded: true});
                this.setData({
                    isConnect: true
                });
            }, 3000);
            this.data.isQuery = true;
        }

    },
    getMedicalRecordList({page = 1, recorded = false}) {
        Protocol.MedicalRecordList({page}).then(data => {
            let list = data.result;
            let frontItemTime = {date: '', time: ''};

            if (list.length) {
                let allList = list.sort(function (item1, item2) {
                    return item2.time - item1.time;
                }).map(item => {
                    const {id, device_id: deviceId, drug_name: drug_name, number, compartment, state, image_url} = item;
                    const {date, time} = tools.createDateAndTime(item.time);
                    const isShowTime = !(frontItemTime.date === date && frontItemTime.time === time);
                    frontItemTime.date = date;
                    frontItemTime.time = time;
                    return {date, time, isShowTime, id, deviceId, drug_name, number, compartment, state, image_url};
                });

                if (!recorded) {
                    allList = this.data.allList.concat(allList);
                }
                this.setData({
                    allList: allList
                })
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
        list.map(item => {
            if (time === item.time) {
                ids.push(item.id);
                if (state === 0) {
                    state = 1;
                } else if (state === 1) {
                    state = 0;
                }
                item.state = state;
            }
        });

        Protocol.MedicalRecordUpdate({ids, state}).then(data => {
            if (data.code === 1) {
                this.setData({
                    allList: list
                });
            }
        })
    },

    onHide: function () {
        app.setBLEListener({bleStateListener: null});
    },

    onReachBottom() {
        this.getMedicalRecordList({page: ++this.data.page});
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
