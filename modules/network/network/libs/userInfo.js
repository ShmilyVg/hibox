import CommonProtocol from "./protocol";

export default class UserInfo {
    static get() {
        return new Promise((resolve, reject) => {
            const globalData = getApp().globalData;
            let localUserInfoInMemory = globalData.userInfo;
            if (!!localUserInfoInMemory && !!localUserInfoInMemory.id) {
                resolve({userInfo: localUserInfoInMemory});
                return;
            }
            wx.getStorage({
                key: 'userInfo', success: res => {
                    resolve({userInfo: globalData.userInfo = {...res.data}});
                }, fail: () => {
                    this._postGetUserInfo({resolve, reject});
                }
            });
        });
    }

    static set({nickname, portraitUrl, id}) {
        const globalData = getApp().globalData;
        globalData.userInfo = {nickname, headUrl: portraitUrl, id};
        wx.setStorage({key: 'userInfo', data: globalData.userInfo});
    }

    static _postGetUserInfo({resolve, reject}) {
        CommonProtocol.getAccountInfo().then(data => {
            if (!!data.result) {
                this.set({...data.result});
                resolve({userInfo: getApp().globalData.userInfo});
            } else {
                reject({errMsg: 'data result is empty!'});
            }
        }).catch(reject);
    }
}
