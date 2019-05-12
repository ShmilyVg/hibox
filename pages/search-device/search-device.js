// pages/search-device/search-device.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState, ProtocolState} from "../../modules/bluetooth/bluetooth-state";
import Toast from "../../view/toast";
import DrugRuler from "../add-drug/number/drug-ruler";
import {WXDialog} from "heheda-common-view";
import {SoftwareVersion} from "../../utils/config";

Page({

    data: {
        num: 10,
        isSearching: false,
        SoftwareVersion: SoftwareVersion
    },
    isFind: false,
    onLoad: function (options) {
        const otaVersion = getApp().otaVersion;
        this.setData({
            otaVersion: `固件版本：2019.04.${otaVersion}`
        });
        getApp().setBLEListener({
            bleStateListener: ({state}) => {
                if (state.protocolState === ProtocolState.FIND_DEVICE) {
                    Toast.success('已找到药盒');
                    this.isFind = true;
                }
            }
        });
    },
    onHide() {
        this.clearFindDevice();
    },
    clearFindDevice() {
        this.setData({
            num: 10,
            isSearching: false
        });
        clearInterval(this.timer);
        this.isFind = false;
    },
    timer: 0,
    startSearch() {
        if (this.data.isSearching) {
            return;
        }

        if (getApp().getLatestBLEState().connectState === ConnectState.CONNECTED) {
            this.setData({
                isSearching: true
            });
            getApp().getBLEManager().sendFindDeviceProtocol()
            this.timer = setInterval(() => {
                this.setData({
                    num: --this.data.num
                });
                if (this.data.num <= 0 || this.isFind) {
                    this.clearFindDevice();
                }
            }, 1000);
        } else {
            Toast.warn('药盒未连接')
        }
    },

    deleteDevice() {
        if (getApp().getLatestBLEState().connectState === ConnectState.CONNECTED) {
            this.showDeleteModel('删除药盒后，药盒和手机都不再提醒');
        } else {
            this.showDeleteModel('药盒未连接，继续删除可能会丢失未同步的服药记录，并且药盒提醒无法删除');
        }
    },

    showDeleteModel(content) {
        wx.showModal({
            title: '小贴士',
            content: content,
            showCancel: true,
            cancelText: '取消',
            confirmText: '确定删除',
            confirmColor: '#64D6B5',
            success: (res) => {
                if (res.confirm) {
                    this.postDeleteDevice();
                }
            },
            fail: () => {
            },
            complete: () => {
            }
        })
    },

    postDeleteDevice() {
        Toast.showLoading();
        const compartmentCount = 4;
        let error = false;
        for (let i = 1; i <= compartmentCount; i++) {
            if (getApp().getLatestBLEState().connectState === ConnectState.CONNECTED) {
                DrugRuler.sendAlertTimeDataToBLE({
                    singleAlertData: DrugRuler.getConvertToBLEEmptyList({
                        compartment: i
                    })
                }).then(() => {
                    if (i >= compartmentCount) {
                        Protocol.postDeviceUnbind().then(data => {
                            if (data.code === 1) {
                                getApp().getBLEManager().clearConnectedBLE().finally(function () {
                                    Toast.hiddenLoading();
                                    HiNavigator.reLaunchToBindDevicePage({});
                                });
                            }
                        }).catch(Toast.hiddenLoading);
                    }
                }).catch(() => {
                    if (!error) {
                        error = true;
                        Toast.hiddenLoading();
                        WXDialog.showDialog({content: '解绑失败，请重试'});
                    }
                });
            } else {
                Protocol.postDeviceUnbind().then(data => {
                    if (data.code === 1) {
                        getApp().getBLEManager().clearConnectedBLE().finally(function () {
                            Toast.hiddenLoading();
                            HiNavigator.reLaunchToBindDevicePage({});
                        });
                    }
                }).catch(Toast.hiddenLoading);
                break;
            }
        }


    }
})
