//app.js
import './libs/adapter';
import {common} from "./libs/bluetooth/common";
import BlueToothState from "./modules/bluetooth/state-const";
import Protocol from "./modules/network/protocol";

App({
    appReceiveDataListener: null,
    appBLEStateListener: null,

    onLaunch(options) {
        this.setCommonBLEListener({
            appReceiveDataListener: ({finalResult, state}) => {
                if (BlueToothState.QUERY_EAT_DRUG_STATE === state.protocolState) {
                    const {isEat, timestamp} = finalResult;
                    Protocol.postMedicalRecordSave({isEat, timestamp}).then(data => {
                        //TODO 向设备回复成功

                    }).catch(res => {
                        //TODO 向设备回复失败

                    });
                }
            },
            appBLEStateListener: this.appBLEStateListener
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
