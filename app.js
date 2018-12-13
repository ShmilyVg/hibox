//app.js
import './libs/adapter';
import Login from "./modules/network/login";

App({
    onLaunch() {
        Login.doLogin();
    },
    globalData: {
        userInfo: {nickname: '', headUrl: '', id: 0},
        addOrEditDrugObj: {deviceId: '', compartment: 1, classify: '', drugName: '', items: []}
    }
});
