//app.js
import './libs/adapter';
import {common, NOT_REGISTER} from "./libs/bluetooth/app/common";
import {ProtocolState} from "./modules/bluetooth/bluetooth-state";
import Protocol from "./modules/network/protocol";
import HiBoxBlueToothManager from "./modules/bluetooth/hi-box-bluetooth-manager";
import HiNavigator from "./navigator/hi-navigator";

App({

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
            if (loginState === NOT_REGISTER) {
                //TODO 未注册情况
            }
        };
        Protocol.getDeviceBindInfo().then(data => {
            if (!data.result) {
                this.bLEManager.clearConnectedBLE();
                HiNavigator.reLaunchToBindDevicePage();
            } else {
                this.bLEManager.setBindMarkStorage();
                this.bLEManager.connect({macId: data.result.mac});
                HiNavigator.switchToIndexPage({});
            }
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
