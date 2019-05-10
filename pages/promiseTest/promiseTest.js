// pages/promiseTest/promiseTest.js
Page({

    /**
     * 页面的初始数据
     */
    data: {},


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.getFriends().then((res) => {
            console.log('sendOneProtocol success', res);
        }).catch((res) => {
            console.log('sendOneProtocol fail', res, this.index);
        })
    },

    getFriends() {
        return this.commonRequest({url: 'test/friends', data: {name: '我是呵呵哒', age: 12}});
    },

    getMoney() {
        return this.commonRequest({url: 'test/money', data: {num: 99999}});
    },
    dealRequestFailed({url, data, resolve, reject}) {
        return this.request({url, data}).then(resolve).catch((res) => {
            console.log('请求失败', res);
            if (res.code === 9) {
                return this.doLogin().catch(res => {
                    console.log('登录失败', res);
                }).finally(() => {
                    return this.dealRequestFailed({url, data, resolve, reject});
                });
            } else {
                console.log('返回失败结果', res);
                return reject(res);
            }
        })
    },

    count: 5,
    index: 0,


    commonRequest({url, data}) {
        return new Promise((resolve, reject) => {
            this.dealRequestFailed({url, data, resolve, reject});
        });
    },


    request({url, data}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (++this.index < 5) {
                    reject({code: 9, url, data});
                } else {
                    console.log('成功了啊');
                    resolve({result: {friends: [{name: '小伙子'}], count: this.count, index: this.index}});
                }
            }, 500);
        })
    },
    doLogin() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('开始重新登录', this.index);
                if (this.index >= 4) {
                    resolve();
                } else {
                    reject();
                }
            }, 1000);
        });
    }
});
