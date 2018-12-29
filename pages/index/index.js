//index.js
import Protocol from "../../modules/network/protocol";
import * as config from "../../utils/config";
import toast from "../../view/toast";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState, ProtocolState} from "../../modules/bluetooth/bluetooth-state";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        popupShow: false,
        isConnect: false,
        animationData: {},
        animationData1: {},
        connectState: {text: '正在努力的连接药盒...', color: '#65FF0A', pointAnimation: true},
    },

    onLoad: function () {
        let that = this;

        wx.getStorage({
            key: 'userInfo',
            success(res) {
                that.setData({
                    userInfo: res.data
                })
            }
        });


        getApp().onDeviceBindInfoListener = ({deviceId}) => {
            deviceId && this.getBaseInfo();
        };
    },

    onShow() {
        let that = this;

        getApp().setBLEListener({
            bleStateListener: function ({state}) {
                that.setConnectState(state, that);
            }
        });

        if (getApp().globalData.refreshIndexPage) {
            this.getBaseInfo();
            getApp().globalData.refreshIndexPage = false
        }


        let state = getApp().getLatestBLEState();
        this.setConnectState(state, that);
    },

    setConnectState(state, that) {
        switch (state.connectState) {
            case ConnectState.UNAVAILABLE:
                that.setData({
                    connectState: {text: '请开启手机蓝牙', color: '#FF8000', pointAnimation: false},
                    isConnect: false
                });
                break;
            case ConnectState.DISCONNECT:
                that.setData({
                    connectState: {text: '连接失败，点击重试', color: '#FF8000', pointAnimation: false},
                    isConnect: false
                });
                break;
            case ConnectState.CONNECTING:
                that.setData({
                    connectState: {text: '正在努力的连接药盒...', color: '#65FF0A', pointAnimation: true},
                    isConnect: false
                });
                break;
            case ConnectState.CONNECTED:
                that.setData({
                    connectState: {text: '药盒已连接', color: '#65FF0A', pointAnimation: false},
                    isConnect: true
                });
                break;
        }
    },

    getBaseInfo() {
        Protocol.getMedicalRemindInfo().then(data => {
            this.setData({
                box: data.result
            })
        });

        Protocol.getMedicalRemindList().then(data => {
            this.setData({
                list: data.result
            })
        })
    },

    clickTopAdd(e) {
        if (!this.data.isConnect) {
            return;
        }
        let index = this.getIndexNum(e);
        if (this.data.box[index]) {
            this.setData({
                choseIndex: index,
                popupShow: true,
            });
        } else {
            HiNavigator.navigateToAddDrug({compartment: index + 1});
        }
    },

    clickPhoto(e) {
        let index = this.getIndexNum(e);
        let that = this;
        let listText = ['now', 'future'];
        let item = that.data.list[listText[index[0]]][index[1]];
        let image = item.image_url;
        if (typeof (image) === "undefined") {
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
                        Protocol.getMedicalRemindImage({
                            id: item.id, image_url: image
                        }).then(data => {
                            that.getBaseInfo();
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

    toSet() {
        HiNavigator.navigateSearchDevicePage();
    },

    getIndexNum(e) {
        return e.currentTarget.dataset.index
    },

    hidePopupView() {
        this.setData({
            popupShow: false,
        })
    },

    popupHideClick() {
        this.hidePopupView();
    },

    reviseBtnClick() {
        this.hidePopupView();
        let item = this.data.box[this.data.choseIndex];
        HiNavigator.navigateToEditDrugPage({
            deviceId: item.device_id,
            compartment: item.compartment,
            classify: item.drug_classify,
            drugName: item.drug_name,
            items: item.items,
            step: 1,
            count: 2
        });
    },

    noTakeBtnClick() {
        this.hidePopupView();
        let compartment = this.data.box[this.data.choseIndex].compartment;
        Protocol.medicalRemindRemove({compartment}).then(data => {
            this.getBaseInfo();
        })
    },

    reSend() {
        getApp().getBLEManager().connect();
        let state = getApp().getLatestBLEState();
        if (state.connectState === ConnectState.CONNECTED) {
            return;
        }
        if (state.connectState === ConnectState.UNAVAILABLE) {
            this.setData({
                connectState: {text: '请开启手机蓝牙', color: '#65FF0A', pointAnimation: false},
                isConnect: false
            });
        } else {
            this.setData({
                connectState: {text: '正在连接...', color: '#65FF0A', pointAnimation: true},
                isConnect: false
            });
        }
    }
})
