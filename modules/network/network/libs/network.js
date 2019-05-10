import BaseNetworkImp from "./base/base-network-imp";
import Login from "./login";

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
