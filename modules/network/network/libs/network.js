import BaseNetworkImp from "./base/base-network-imp";
import Login from "./login";

const count = 3;
let reLoginIndex = 0;

function dealRequestFailed({url, data, requestWithoutLogin, resolve, reject}) {
    BaseNetworkImp.request({url, data, requestWithoutLogin}).then(resolve).catch((errorResult) => {
        console.log('请求失败', errorResult);
        const {data: resultData} = errorResult;
        if (!!resultData && resultData.code === 9) {
            BaseNetworkImp.setToken({token: ''});
            if (reLoginIndex++ < count) {
                return Login.doLogin().then(() => {
                    reLoginIndex = 0;
                }).catch(res => {
                    console.log('重新登录失败', res);
                }).finally(() => {
                    return this.dealRequestFailed({url, data, requestWithoutLogin, resolve, reject});
                });
            } else {
                reLoginIndex = 0;
                return reject(errorResult);
            }
        } else {
            console.log('返回失败结果', errorResult);
            return reject(errorResult);
        }
    });
}

export default class Network {

    static request({url, data, requestWithoutLogin = false}) {
        return new Promise((resolve, reject) => {
            dealRequestFailed({url, data, requestWithoutLogin, resolve, reject});
        });
        // return new Promise(function (resolve, reject) {
        //     BaseNetworkImp.request(args).then(resolve).catch((res, requestObj) => {
        //         const {data} = res;
        //         if (!!data && data.code === 9) {
        //             setTimeout(() => {
        //                 BaseNetworkImp.addProtocol({url, requestObj});
        //                 Login.doLogin();
        //             }, 2000);
        //             return;
        //         }
        //         reject(res);
        //     });
        // });

    }

}
