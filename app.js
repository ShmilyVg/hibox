//app.js
import './libs/adapter';
import {common} from "./libs/bluetooth/common";

App({
    onLaunch(options) {
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
