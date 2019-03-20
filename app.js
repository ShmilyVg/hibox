//app.js
import "./utils/config";
import {common} from "heheda-bluetooth";
import {ConnectState, ProtocolState} from "./modules/bluetooth/bluetooth-state";
import Protocol from "./modules/network/protocol";
import HiBoxBlueToothManager from "./modules/bluetooth/hi-box-bluetooth-manager";
import HiNavigator from "./navigator/hi-navigator";
import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";

App({
    onDeviceBindInfoListener: null,
    onBatteryInfoListener: null,
    onLaunch(options) {
        let records = [], count = 0;
        this.setCommonBLEListener({
            commonAppReceiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.QUERY_DATA_ING === state.protocolState) {
                    const {length, isEat, timestamp} = finalResult;
                    if (records.length < length) {
                        records.push({state: isEat ? 1 : 0, timestamp});
                        count++;
                        if (records.length === length) {
                            Protocol.postMedicalRecordSave({records}).then(data => {
                                console.log('同步数据成功');
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
                        // this.bLEManager.sendQueryDataSuccessProtocol({isSuccess: true});
                    } else {
                        console.log('同步数据溢出', records);
                        count = 0;
                    }

                } else if (ProtocolState.TIMESTAMP === state.protocolState) {
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
            // if (loginState === this.NOT_REGISTER) {
            //     this.bLEManager.clearConnectedBLE();
            //     HiNavigator.reLaunchToBindDevicePage();
            // }
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
        this.commonOnShow({options});
        // Protocol.getDeviceBindInfo().then(data => {
        //     if (data.result) {
        //         const {device_id: deviceId, mac} = data.result;
        //         this.bLEManager.setBindMarkStorage();
        //         this.bLEManager.connect({macId: mac});
        //         this.onDeviceBindInfoListener && this.onDeviceBindInfoListener({deviceId});
        //     } else {
        //         this.bLEManager.clearConnectedBLE();
        //         HiNavigator.reLaunchToBindDevicePage();
        //     }
        // })
    },

    onHide() {
        this.commonOnHide();
        this.isAppOnHide = true;
        this.isQueryEmptySuccess = false;
    },
    globalData: {
        refreshIndexPage: false,
        userInfo: {nickname: '', headUrl: '', id: 0},
        addOrEditDrugObj: {deviceId: '', compartment: 1, classify: '', drugName: '', items: []},
        globalBattery: 1 //1为默认，2为低电量，3为高电量
    },
    ...common,
});
