import BaseNetworkImp from "./base/base-network-imp";

import {WXDialog} from "heheda-common-view";

let _needRegister = false;
export default class Login {
    static doLogin() {
        return new Promise((resolve, reject) =>
            this._wxLogin().then(res => {
                    const token = wx.getStorageSync('token');
                    return BaseNetworkImp.request({
                        url: 'account/login',
                        data: {js_code: res.code, token},
                        requestWithoutLogin: true
                    })
                }
            ).then(data => {
                this._setToken({data});
                resolve();
            }).catch(res => {
                console.log('login failed', res);
                if (res.data) {
                    const {data: {code}} = res;
                    if (code === 2) {
                        console.log('未注册，请先注册');
                        _needRegister = true;
                    }
                    reject(res);
                    return;
                }
                reject(res);
                WXDialog.showDialog({title: '糟糕', content: '抱歉，目前小程序无法登录，请稍后重试'});
            })
        );
    }

    static doRegister({userInfo, encryptedData, iv}) {
        return new Promise((resolve, reject) =>
            _needRegister ? this._wxLogin().then(res => {
                const {code} = res;
                return BaseNetworkImp.request({
                    url: 'account/register',
                    data: {code, encrypted_data: encryptedData, iv},
                    requestWithoutLogin: true
                })
            }).then(data => {
                this._setToken({data});
                resolve();
            }).catch(res => {
                console.log('register failed:', res);
                reject(res);
            }) : resolve()
        )

    }

    static _wxLogin() {
        return new Promise((resolve) =>
            wx.login({
                success: resolve, fail: res => {
                    WXDialog.showDialog({title: '糟糕', content: '抱歉，目前小程序无法登录，请稍后重试'});
                    console.log('wx login failed', res);
                }
            })
        );
    }

    static _setToken({data: {result: {jsessionid}}}) {
        BaseNetworkImp.setToken({token: jsessionid});
        wx.setStorage({
            key: 'token',
            data: jsessionid,
        });
    }

}
