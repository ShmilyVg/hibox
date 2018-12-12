import {PostUrl} from "../../utils/config";
import Login from "./login";
import WXDialog from "../../view/dialog";

let _token, _queue = {}, divideTimestamp = 0;
export default class Network {

    static setToken({token}) {
        _token = token;
    }

    static request({url, data, requestWithoutLogin = false}) {
        return new Promise(function (resolve, reject) {
            const requestObj = {
                url: PostUrl + url,
                data,
                header: {Authorization: '+sblel%wdtkhjlu', "Cookie": `JSESSIONID=${_token}`},
                method: 'POST',
                success: res => {
                    const {data} = res;
                    console.log('协议正常', url, data);
                    if (!!data && 1 === data.code) {
                        resolve(data);
                    } else if (data.code === 9) {
                        setTimeout(() => {
                            _queue[url] = requestObj;
                            Login.doLogin();
                        }, 2000);
                        return;
                    }
                    reject(res);
                },
                fail: (res) => {
                    console.log('协议错误', url, res);
                    if (res.errMsg.indexOf("No address associated") !== -1 || res.errMsg.indexOf('已断开与互联网') !== -1 || res.errMsg.indexOf('request:fail timeout') !== -1) {
                        Network._dealTimeout({url, requestObj});
                        return;
                    }
                    reject(res);
                },
            };
            if (!!_token || requestWithoutLogin) {
                wx.request(requestObj);
            } else {
                _queue[url] = requestObj;
            }
        });
    }

    static resendAll() {
        let requestObj;
        for (let key in _queue) {
            if (_queue.hasOwnProperty(key)) {
                requestObj = _queue[key];
                requestObj.header.Cookie = `JSESSIONID=${_token}`;
                wx.request(requestObj);
            }
        }
        _queue = {};
    }

    static _dealTimeout({url, requestObj}) {
        _queue[url] = requestObj;
        const now = Date.now();
        if (now - divideTimestamp > 2000) {
            WXDialog.showDialog({
                content: '网络异常，请重试', showCancel: true, confirmEvent: () => {
                    divideTimestamp = 0;
                    Network.resendAll();
                }, cancelEvent: () => {
                    divideTimestamp = 0;
                    delete _queue.url;
                }
            });
        }
        divideTimestamp = now;
    }
}
