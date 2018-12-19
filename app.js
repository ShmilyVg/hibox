//app.js
import './libs/adapter';
import {common} from "./libs/bluetooth/app/common";
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
                    console.log('同步数据',length, records);
                    if (records.length < length) {
                        records.push({state: isEat ? 1 : 0, timestamp});
                    } else {
                        Protocol.postMedicalRecordSave({records}).then(data => {
                            console.log('同步数据成功');
                        }).catch(res => {
                            console.log(res, '同步数据失败');
                        }).finally(() => records = [] && this.bLEManager.sendQueryDataSuccessProtocol());
                    }
                } else {
                    this.appReceiveDataListener && this.appReceiveDataListener({finalResult, state});
                }
            },
            commonAppBLEStateListener: ({state}) => {
                this.appBLEStateListener && this.appBLEStateListener({state});
            }
        });
        this.commonOnLaunch({options, bLEManager: new HiBoxBlueToothManager()});

        Protocol.getDeviceBindInfo().then(data => {
            if (!data.result.length) {
                HiNavigator.reLaunchToBindDevicePage();
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
