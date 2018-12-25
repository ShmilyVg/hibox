//app.js
import "./utils/config";
import {common} from "heheda-bluetooth";
import {ProtocolState} from "./modules/bluetooth/bluetooth-state";
import Protocol from "./modules/network/protocol";
import HiBoxBlueToothManager from "./modules/bluetooth/hi-box-bluetooth-manager";
import HiNavigator from "./navigator/hi-navigator";

App({
    onDeviceBindInfoListener: null,
    onLaunch(options) {
        let records = [];
        this.setCommonBLEListener({
            commonAppReceiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.QUERY_DATA_ING === state.protocolState) {
                    const {length, isEat, timestamp} = finalResult;
                    if (records.length < length) {
                        records.push({state: isEat ? 1 : 0, timestamp});
                        if (records.length === length) {
                            Protocol.postMedicalRecordSave({records}).then(data => {
                                console.log('同步数据成功');
                                this.bLEManager.sendQueryDataSuccessProtocol();
                            }).catch(res => {
                                console.log(res, '同步数据失败');
                            }).finally(() => records = []);
                        }
                    } else {
                        this.bLEManager.sendQueryDataSuccessProtocol();
                    }
                    console.log('同步数据的数组', records);

                } else {
                    this.appReceiveDataListener && this.appReceiveDataListener({finalResult, state});
                }
            },
            commonAppBLEStateListener: ({state}) => {
                this.appBLEStateListener && this.appBLEStateListener({state});
            }
        });
        this.commonOnLaunch({options, bLEManager: new HiBoxBlueToothManager()});

        this.appLoginListener = ({loginState}) => {
            if (loginState === this.NOT_REGISTER) {
                this.bLEManager.clearConnectedBLE();
                HiNavigator.reLaunchToBindDevicePage();
            }
        };

        Protocol.getDeviceBindInfo().then(data => {
            const {device_id: deviceId, mac} = data.result;
            if (!data.result) {
                this.bLEManager.clearConnectedBLE();
                HiNavigator.reLaunchToBindDevicePage();
            } else {
                this.bLEManager.setBindMarkStorage();
                this.bLEManager.connect({macId: mac});
            }
            this.onDeviceBindInfoListener && this.onDeviceBindInfoListener({deviceId, mac});

        })
    },

    onShow(options) {
        this.commonOnShow({options});
    },

    onHide() {
        this.commonOnHide();
    },
    globalData: {
        refreshIndexPage: false,
        userInfo: {nickname: '', headUrl: '', id: 0},
        addOrEditDrugObj: {deviceId: '', compartment: 1, classify: '', drugName: '', items: []}
    },
    ...common,
});
