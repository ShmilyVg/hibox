// pages/history/history.js
import Protocol from "../../modules/network/protocol";
import * as tools from "../../utils/tools";
import Toast from "../../view/toast";
import * as config from "../../utils/config";
import {ProtocolState, ConnectState} from "../../modules/bluetooth/bluetooth-state";
import HiNavigator from "../../navigator/hi-navigator";

const app = getApp();
Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        listText: ['now', 'future'],
        allList: [],
        queryState: '记录待同步',
        isConnect: true,
        connectState: {'text': '记录同步中...', color: '#65FF0A'},
        page: 1,
        reportImage: '../../images/history/report-new.png'
    },

    onLoad() {
        this.getMedicalRecordList({});
        // this.initReport(this);
    },

    initReport(that) {
        Protocol.getMedicalRecordWeekly().then(data => {
            let image = that.data.reportImage;
            if (data.result.status == 1) {
                image = '../../images/history/report.png'
            }
            that.setData({
                report: data.result,
                reportImage: image
            })
        });
    },

    toReport() {
        HiNavigator.navigateToReportPage(this.data.report);
    },

    onShow: function () {
        this.setData({
            isConnect: true
        });
        if (!!app.isAppOnHide) {
            //this.queryStart();
            app.isAppOnHide = false;
        }
        console.log('记录同步是否完成', app.isQueryDataFinish, app.isQuery);
        !!app.isQueryDataFinish && this.queryFinish();
        app.setBLEListener({
            bleStateListener: ({state}) => {
                console.log('1111', state);
                if (ConnectState.UNAVAILABLE === state.connectState || ConnectState.DISCONNECT === state.connectState || ConnectState.UNAVAILABLE === state.connectState || ConnectState.NOT_SUPPORT === state.connectState || ConnectState.UNBIND === state.connectState) {
                    this.setData({
                        isConnect: true
                    });
                    this.initReport(this);
                } else {
                    switch (state.protocolState) {
                        case ProtocolState.QUERY_DATA_ING:
                            this.queryStart();
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
            connectState: {'text': '药盒正在上传服药记录...', color: '#65FF0A'},
            isConnect: false
        });
    },

    queryFinish() {
        if (!app.isQuery) {
            !getApp().isQueryEmptySuccess && Toast.success('上传成功', 3000);
            this.setData({
                isConnect: true
            });
            setTimeout(() => {
                !getApp().isQueryEmptySuccess && this.getMedicalRecordList({page: 1, recorded: true});
                this.setData({
                    isConnect: true
                });
            }, 3000);
            app.isQuery = true;
        }
        this.initReport(this);
    },

    frontItemTime: {date: '', time: ''},
    getMedicalRecordList({page = 1, recorded = false}) {
        Toast.showLoading();
        Protocol.MedicalRecordList({page}).then(data => {
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

                if (!recorded) {
                    allList = this.data.allList.concat(allList);
                } else {
                    this.data.page = 1;
                }
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

    stateBtnClick(e) {
        let list = this.data.allList;
        let index = e.target.dataset.index;
        let time = list[index].time;
        let ids = [];
        let state = list[index].state;
        list.map(item => {
            if (time === item.time) {
                ids.push(item.id);
                /*if (state == 0) {
                    state = 1;
                } else if (state == 1) {
                    state = 0;
                }*/
                item.state = (item.state === 1 ? 0 : 1);
            }
        });

        state = (state === 1 ? 0 : 1);

        Protocol.MedicalRecordUpdate({ids, state}).then(data => {
            if (data.code === 1) {
                this.setData({
                    allList: list
                });
            }
            console.log('record state : ' + state)
        })
    },

    onHide: function () {
        app.setBLEListener({bleStateListener: null});
    },

    onReachBottom() {
        console.log('getMedicalRecordList', this.data.page + 1)
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
                Toast.showLoading();
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
                            Toast.hiddenLoading();
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
