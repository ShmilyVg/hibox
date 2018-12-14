//app.js
import './libs/adapter';
import {common} from "./libs/bluetooth/common";
import BlueToothState from "./modules/bluetooth/state-const";
import Protocol from "./modules/network/protocol";

App({

    onLaunch(options) {
        let records = [];
        this.setCommonBLEListener({
            commonAppReceiveDataListener: ({finalResult, state}) => {
                if (BlueToothState.QUERY_DATA_ING === state.protocolState) {
                    const {length, isEat, timestamp} = finalResult;
                    if (records.length < length) {
                        records.push({state: isEat ? 1 : 0, timestamp});
                    } else {
                        Protocol.postMedicalRecordSave({records}).then(data => {
                            //TODO 向设备回复成功
                            this.bLEManager.sendQueryDataSuccessProtocol();
                        }).catch(res => {
                            //TODO 向设备回复失败

                        }).finally(() => records = []);
                    }

                } else {
                    this.appReceiveDataListener && this.appReceiveDataListener({finalResult, state});
                }
            },
            commonAppBLEStateListener: this.appBLEStateListener
        });
        this.commonOnLaunch(options);
    },

    onHide() {
        this.commonOnHide();
    },
    globalData: {
        userInfo: {nickname: '', headUrl: '', id: 0},
        addOrEditDrugObj: {deviceId: '', compartment: 1, classify: '', drugName: '', items: []}
    },
    ...common,
});
