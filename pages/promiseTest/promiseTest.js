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
        this.sendOneProtocol().then((res) => {
            console.log('sendOneProtocol success', res);
        }).catch(() => {
            console.log('sendOneProtocol fail');
        })
    },


    sendOneProtocol() {
        return this.request().catch((res) => {
            console.log(res);
            return this.doLogin().catch(() => {
                return this.request().catch((res) => {
                    return this.doLogin();
                });
            });
        })
    },

    dealRequestFailed() {
        return this.request().catch((res) => {
            if (res.code === 9) {
                return this.doLogin().then(() => {
                    return this.dealRequestFailed();
                }).catch(() => {
                    setTimeout();
                });
            }else{
                Promise.reject();
            }
        })
    },

    count: 5,
    index: 1,
    request() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (++index < 5) {
                    reject({error: {}, url: 'test/promise', args: {name: '我是呵呵哒', age: 12}});
                } else {
                    resolve({result: {isSuccess: true, count: this.count, index: this.index}});
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
