import {WXDialog} from "heheda-common-view";
import {NetworkConfig} from "../config";

let _token, _queue = {}, divideTimestamp = 0;
export default class BaseNetworkImp {

    static setToken({token}) {
        _token = token;
    }

    static request({url, data, requestWithoutLogin = false}) {
        return new Promise(function (resolve, reject) {
            const requestObj = {
                url: NetworkConfig.getPostUrl() + url,
                data,
                header: {Authorization: '+sblel%wdtkhjlu', "Cookie": `JSESSIONID=${_token}`},
                method: 'POST',
                success: res => {
                    const {data} = res;
                    console.log('协议正常', url, data);
                    if (!!data && 1 === data.code) {
                        resolve(data);
                    } else {
                        reject(res, requestObj);
                    }
                },
                fail: (res) => {
                    console.log('协议错误', url, res);
                    if (res.errMsg.indexOf("No address associated") !== -1 || res.errMsg.indexOf('已断开与互联网') !== -1 || res.errMsg.indexOf('request:fail timeout') !== -1) {
                        BaseNetworkImp._dealTimeout({url, requestObj});
                    }
                    reject(res, requestObj);
                },
            };
            if (!!_token || requestWithoutLogin) {
                wx.request(requestObj);
            } else {
                BaseNetworkImp.addProtocol({url, requestObj});
            }
        });
    }

    static addProtocol({url, requestObj}) {
        _queue[url] = requestObj;
    }

    static resendAll() {
        let requestObj;
        for (let key in _queue) {
            if (_queue.hasOwnProperty(key)) {
                requestObj = _queue[key];
                requestObj.header = {Authorization: '+sblel%wdtkhjlu', "Cookie": `JSESSIONID=${_token}`};
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
                    BaseNetworkImp.resendAll();
                }, cancelEvent: () => {
                    divideTimestamp = 0;
                    delete _queue.url;
                }
            });
        }
        divideTimestamp = now;
    }
}
