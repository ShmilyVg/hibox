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
        }).catch(() => {
            console.log('sendOneProtocol fail', this.index);
        })
    },

    getFriends() {
        return this.commonRequest({url: 'test/friends', data: {name: '我是呵呵哒', age: 12}});
    },

    dealRequestFailed({url, data}) {
        return this.request({url, data}).catch((res) => {
            console.log('请求失败', res);
            if (res.code === 9) {
                return this.doLogin().finally(() => {
                    return this.dealRequestFailed({url, data});
                });
            } else {
                return Promise.reject();
            }
        })
    },

    count: 5,
    index: 1,


    commonRequest({url, data}) {
        return this.dealRequestFailed({url, data});
    },


    request({url, data}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (++this.index < 5) {
                    reject({code: 9, url, data});
                } else {
                    resolve({result: {friends: [{name: '小伙子'}], count: this.count, index: this.index}});
                }
            }, 500);
        })
    },
    doLogin() {
        return new Promise((resolve, reject) => {
            console.log('开始重新登录');
            setTimeout(() => {
                reject();
            }, 1000);
        });
    }
});
