import BaseNetworkImp from "./base/base-network-imp";
import Login from "./login";

function dealRequestFailed({url, data, resolve, reject}) {
    return BaseNetworkImp.request({url, data}).then(resolve).catch((res) => {
        console.log('请求失败', res);
        if (res.code === 9) {
            return Login.doLogin().catch(res => {
                console.log('登录失败', res);
            }).finally(() => {
                return this.dealRequestFailed({url, data, resolve, reject});
            });
        } else {
            console.log('返回失败结果', res);
            return reject(res);
        }
    })
}

export default class Network {

    static request({url, data, requestWithoutLogin = false}) {
        const args = arguments[0];
        return new Promise(function (resolve, reject) {
            BaseNetworkImp.request(args).then(resolve).catch((res, requestObj) => {
                const {data} = res;
                if (!!data && data.code === 9) {
                    setTimeout(() => {
                        BaseNetworkImp.addProtocol({url, requestObj});
                        Login.doLogin();
                    }, 2000);
                    return;
                }
                reject(res);
            });
        });

    }

}
