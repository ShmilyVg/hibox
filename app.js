//app.js
import "./utils/config";
import {ConnectState, ProtocolState} from "./modules/bluetooth/bluetooth-state";
import Protocol from "./modules/network/protocol";
import HiBoxBlueToothManager from "./modules/bluetooth/hi-box-bluetooth-manager";
import HiNavigator from "./navigator/hi-navigator";
import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";
import {Protocol as CommonProtocol} from "modules/network/network/index";
import {common} from "./modules/bluetooth/heheda-bluetooth/app/common";
import {initAnalysisOnApp} from "./modules/analysis/mta";

App({
    onDeviceBindInfoListener: null,
    onBatteryInfoListener: null,
    isOTAUpdate: false,
    otaUrl: {},
    isGreen: false,
    onLaunch(options) {
        let records = [], count = 0;
        this.otaVersion = -1;
        initAnalysisOnApp();
        this.setCommonBLEListener({
            commonAppSignPowerListener: (hiDevices) => {
                this.appBLESignPowerListener && this.appBLESignPowerListener(hiDevices);
            },
            commonAppReceiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.QUERY_DATA_ING === state.protocolState) {
                    const {length, isEat, timestamp, compartment} = finalResult;
                    if (records.length < length) {
                        records.push({state: isEat ? 1 : 0, timestamp, compartment});
                        count++;
                        if (records.length === length) {
                            Protocol.postMedicalRecordSave({records}).then(data => {
                                console.log('同步数据成功2');
                                this.bLEManager.sendQueryDataSuccessProtocol({isSuccess: true});
                            }).catch(res => {
                                this.queryDataFinish();
                                console.log(res, '同步数据失败');
                            }).finally(() => records = []);
                        }
                        console.log('同步数据的数组', records);
                    } else if (!length) {
                        if (count === 0) {
                            this.isQueryEmptySuccess = true;
                        }
                        count = 0;
                        this.queryDataFinish();
                        setTimeout(() => {
                            console.log('硬件传来的固件版本号', this.otaVersion);
                            if (this.otaVersion !== -1) {
                                // HiNavigator.relaunchToUpdatePage({
                                //     binUrl: this.isGreen ? 'https://backend.stage.hipee.cn/hipee-resource/public/f1a07a5d2d8c43b49d59711e4439c35b.bin' ://green.bin
                                //         'https://backend.stage.hipee.cn/hipee-resource/public/b6830a279b4d434aae2474a4219172eb.bin',//yellow.bin,
                                //     datUrl: this.isGreen ? 'https://backend.stage.hipee.cn/hipee-resource/public/cf7cb6959fe641119317ee030dcc8edd.dat' ://green.dat
                                //         'https://backend.stage.hipee.cn/hipee-resource/public/629cf2aa3860471a8a896c142a401c92.dat',//yellow.dat
                                // });
                                CommonProtocol.postBlueToothUpdate({
                                    deviceId: this.bLEManager.getDeviceMacAddress(),
                                    version: this.otaVersion
                                }).then(data => {
                                    const {update: isUpdate, zip} = data.result;
                                    if (zip) {
                                        const {bin: binArray, dat: datArray} = zip;
                                        if (isUpdate && binArray && binArray.length && datArray && datArray.length) {
                                            const {url: binUrl, md5: binMd5} = binArray[0];
                                            const {url: datUrl, md5: datMd5} = datArray[0];
                                            HiNavigator.relaunchToUpdatePage({binUrl, datUrl});
                                        } else {
                                            console.log('无需升级');
                                        }
                                    }
                                })

                            }
                        })
                        // this.bLEManager.sendQueryDataSuccessProtocol({isSuccess: true});
                    } else {
                        console.log('同步数据溢出', records);
                        count = 0;
                    }

                } else if (ProtocolState.TIMESTAMP === state.protocolState) {
                    this.otaVersion = finalResult.version;
                    Protocol.postDeviceElectricity({electricity: finalResult.battery / 100});
                    if (finalResult.battery < 21) {
                        this.onBatteryInfoListener && this.onBatteryInfoListener({battery: true});
                        this.globalData.globalBattery = 2
                    } else {
                        this.onBatteryInfoListener && this.onBatteryInfoListener({battery: false});
                        this.globalData.globalBattery = 3
                    }
                } else {
                    this.appReceiveDataListener && this.appReceiveDataListener({finalResult, state});
                }
            },
            commonAppBLEStateListener: ({state}) => {
                switch (state.connectState) {
                    case ConnectState.UNBIND:
                    case ConnectState.UNAVAILABLE:
                    case ConnectState.DISCONNECT:
                    case ConnectState.NOT_SUPPORT:
                        records = [];
                        this.isQuery = false;
                        this.isQueryDataFinish = false;
                        break;
                }
                if (state.protocolState === ProtocolState.QUERY_DATA_FINISH) {
                    this.isQueryDataFinish = true;
                    this.isQuery = false;
                }
                this.appBLEStateListener && this.appBLEStateListener({state});
            }
        });
        this.commonOnLaunch({options, bLEManager: new HiBoxBlueToothManager()});

        this.appLoginListener = ({loginState}) => {
            wx.getSystemInfo({
                success: systemInfo => {
                    Protocol.postSystemInfo({systemInfo});
                }
            });
            if (loginState === this.NOT_REGISTER) {
                this.bLEManager.clearConnectedBLE();
                HiNavigator.reLaunchToBindDevicePage();
            }
        };
    },
    queryDataFinish() {
        this._updateBLEState({
            state: {
                connectState: CommonConnectState.CONNECTED,
                protocolState: CommonProtocolState.QUERY_DATA_FINISH
            }
        });
    },
    onShow(options) {
        let showOtherPeopleReport =  options.path === "pages/report/report";
        if (!this.isOTAUpdate) {
            this.commonOnShow({options});
            Protocol.getDeviceBindInfo().then(data => {
                if (data.result) {
                    const {mac} = data.result;
                    console.log('getDeviceBindInfo?mac=', mac);
                    this.bLEManager.setBindMarkStorage();
                    this.bLEManager.connect({macId: mac});
                    this.onDeviceBindInfoListener && this.onDeviceBindInfoListener({deviceId: mac});
                } else {
                    this.bLEManager.clearConnectedBLE();
                    if (!showOtherPeopleReport) {
                        HiNavigator.reLaunchToBindDevicePage();
                    }
                }
            })
        }
    },

    onHide() {
        if (!this.isOTAUpdate) {
            this.commonOnHide();
            this.isAppOnHide = true;
            this.isQueryEmptySuccess = false;
        }
    },
    globalData: {
        refreshIndexPage: false,
        userInfo: {nickname: '', headUrl: '', id: 0},
        addOrEditDrugObj: {deviceId: '', compartment: 1, classify: '', drugName: '', items: []},
        globalBattery: 1 //1为默认，2为低电量，3为高电量
    },
    ...common,
});
