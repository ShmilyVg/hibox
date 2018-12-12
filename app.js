//app.js
import './libs/adapter';
import Login from "./modules/network/login";

App({
    onLaunch() {
        Login.doLogin();
    },
    globalData: {
        userInfo: {nickname: '', headUrl: '', id: 0},
    }
});
