//index.js
import Protocol from "../../modules/network/protocol";
import * as config from "../../utils/config";
import toast from "../../view/toast";
import HiNavigator from "../../navigator/hi-navigator";
import {
    ConnectState
} from "../../modules/bluetooth/bluetooth-state";
import DrugRuler from "../add-drug/number/drug-ruler";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        popupShow: false,
        isConnect: false,
        animationData: {},
        animationData1: {},
        connectState: {
            text: '正在努力的连接药盒...',
            color: '#65FF0A',
            pointAnimation: true
        },
        lowBattery: false
    },

    onLoad: function () {
        wx.showNavigationBarLoading();
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


        let globalBattery = getApp().globalData.globalBattery;
        console.log('全局电量：', globalBattery);
        if (globalBattery === 1) {
            getApp().onBatteryInfoListener = ({battery}) => {
                if (battery) {
                    this.setData({
                        lowBattery: true
                    })
                }
            }
        } else {
            if (globalBattery === 2) {
                that.setData({
                    lowBattery: true
                })
            } else if (globalBattery === 3) {
                that.setData({
                    lowBattery: false
                })
            }
            setTimeout(function () {
                getApp().globalData.globalBattery = 0;
            }, 5000);
        }
    },

    onShow() {
        let that = this;

        getApp().setBLEListener({
            bleStateListener: ({state}) => {
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
                    connectState: {
                        text: '请开启手机蓝牙',
                        color: '#FF8000',
                        pointAnimation: false
                    },
                    isConnect: false
                });
                break;
            case ConnectState.DISCONNECT:
                that.setData({
                    connectState: {
                        text: '连接失败，点击重试',
                        color: '#FF8000',
                        pointAnimation: false
                    },
                    isConnect: false
                });
                break;
            case ConnectState.CONNECTING:
                that.setData({
                    connectState: {
                        text: '正在努力的连接药盒...',
                        color: '#65FF0A',
                        pointAnimation: true
                    },
                    isConnect: false
                });
                break;
            case ConnectState.CONNECTED:
                that.setData({
                    connectState: {
                        text: '药盒已连接',
                        color: '#65FF0A',
                        pointAnimation: false
                    },
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
            wx.hideNavigationBarLoading();
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
            wx.showActionSheet({
                itemList: ['扫码添加', '手动添加'],
                itemColor: '#698B89',
                success(res) {
                    if (res.tapIndex === 0) {
                        const value = wx.getStorageSync('verySixScanFunction');
                        console.log('verySixScanFunction====>', value);
                        if (wx.getStorageSync('verySixScanFunction')) {
                            // 直接扫描一维码
                            wx.scanCode({
                                onlyFromCamera: true,
                                scanType: ['barCode'],
                                success(res) {
                                    console.log('一维码数字', res.result);
                                    Protocol.getDrugCode({code: res.result}).then(data => {
                                        console.log('一维码返回：', data);
                                        if (data.result.drugName) {
                                            // 是可用一维码
                                            console.log('是可用一维码');
                                            getApp().globalData.addOrEditDrugObj.compartment = index + 1;
                                            HiNavigator.navigateToDrugInfo({
                                                compartment: index + 1,
                                                drugInfo: data
                                            });
                                        } else {
                                            // 非可用一维码
                                            console.log('非可用一维码');
                                            HiNavigator.navigateToScanErr({
                                                index: index + 1,
                                                code:res.result
                                            })
                                        }
                                    })
                                }
                            })
                        } else {
                            // 进入预备扫描界面
                            HiNavigator.navigateToScanCode({
                                compartment: index + 1
                            })
                        }
                    } else if (res.tapIndex === 1) {
                        HiNavigator.navigateToAddDrug({
                            compartment: index + 1
                        });
                    }
                }
            });

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
                                urls: [image]
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
                            id: item.id,
                            image_url: image
                        }).then(data => {
                            that.getBaseInfo();
                            toast.hiddenLoading();
                        })
                    },
                    fail: function (e) {
                        toast.hiddenLoading();
                        toast.warn('上传失败');
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
        if (item.drug_code) {
            getApp().globalData.addOrEditDrugObj = {
                deviceId: '',
                compartment: item.compartment,
                classify: 'scan',
                drugName: item.drug_name,
                items: item.items
            };
            HiNavigator.navigateToDrugNumberPage({
                drugName: item.drug_name,
                step: 2,
                count: 3,
                code: item.drug_code
            });
        } else {
            HiNavigator.navigateToEditDrugPage({
                deviceId: item.device_id,
                compartment: item.compartment,
                classify: item.drug_classify,
                drugName: item.drug_name,
                items: item.items,
                step: 1,
                count: 2
            });
        }
    },

    toView() {
        let item = this.data.box[this.data.choseIndex];

        if (item.items) {
            getApp().globalData.addOrEditDrugObj = {
                deviceId: '',
                compartment: item.compartment,
                classify: 'scan',
                drugName: item.drug_name,
                items: item.items
            };
        } else {
            getApp().globalData.addOrEditDrugObj = {deviceId, compartment: item.compartment};
        }

        Protocol.getDrugCode({code: item.drug_code}).then(data => {
            HiNavigator.navigateToDrugInfo({
                drugInfo: data
            });
        })
    },

    noTakeBtnClick() {
        this.hidePopupView();
        let compartment = this.data.box[this.data.choseIndex].compartment;
        if (getApp().getLatestBLEState().connectState === ConnectState.CONNECTED) {
            DrugRuler.sendAlertTimeDataToBLE({
                singleAlertData: DrugRuler.getConvertToBLEEmptyList({
                    compartment
                })
            });
            Protocol.medicalRemindRemove({
                compartment
            }).then(data => {
                this.getBaseInfo();
            })
        } else {
            toast.warn('请先连接药盒');
        }
    },

    reSend() {
        getApp().getBLEManager().connect();
        let state = getApp().getLatestBLEState();
        if (state.connectState === ConnectState.CONNECTED) {
            return;
        }
        if (state.connectState === ConnectState.UNAVAILABLE) {
            this.setData({
                connectState: {
                    text: '请开启手机蓝牙',
                    color: '#65FF0A',
                    pointAnimation: false
                },
                isConnect: false
            });
        } else {
            this.setData({
                connectState: {
                    text: '正在努力的连接药盒...',
                    color: '#65FF0A',
                    pointAnimation: true
                },
                isConnect: false
            });
        }
    }
})
