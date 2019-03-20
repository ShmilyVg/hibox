// pages/drug-info/drug-info.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {
        ruler: {
            1: ['08:00'],
            2: ['08:00', '21:00'],
            3: ["08:00", "13:00", "21:00"],
            4: ["08:00", "13:00", "18:00", "21:00"],
            5: ["08:00", "12:00", "15:00", "18:00", "21:00"],
            6: ["08:00", "11:00", "14:00", "17:00", "19:00", "21:00"],
            7: ["08:00", "10:30", "13:00", "15:30", "17:00", "19:30", "21:00"],
            8: ["08:00", "10:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
            9: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "21:00"],
        }
    },

    onLoad: function (options) {
        // Protocol.getDrugCode({code: '6920312611029'}).then(data => {
        //     let items = data.result.items;
        //     let itemsTop = [], itemsBottom = [];
        //     items.map(item => {
        //         if (item.imgUrl) {
        //             itemsTop.push(this.handleItem(true, item));
        //         } else {
        //             itemsBottom.push(this.handleItem(false, item));
        //         }
        //     });
        //     this.setData({
        //         data: data.result,
        //         itemsTop: itemsTop,
        //         itemsBottom: itemsBottom
        //     })
        // })

        let drugInfo = getApp().globalData.drugInfo;
        let items = drugInfo.result.items;
        let itemsTop = [], itemsBottom = [];
        items.map(item => {
            if (item.imgUrl) {
                itemsTop.push(this.handleItem(true, item));
            } else {
                itemsBottom.push(this.handleItem(false, item));
            }
        });
        this.setData({
            data: drugInfo.result,
            itemsTop: itemsTop,
            itemsBottom: itemsBottom
        });

        console.log('addOrEditDrugObj=', getApp().globalData.addOrEditDrugObj);
    },

    handleItem(isTop, item) {
        let num = isTop ? 72 : 36;
        if (item.content.length > num) {
            item.showArr = true;
            item.contentLong = item.content;
            item.contentShort = item.content.substring(0, num) + '...';
            item.content = item.contentShort;
        } else {
            item.showArr = false;
        }
        item.arrIsNor = true;
        return item;
    },

    drugRemind() {
        if (this.data.data.cycle != null) {
            let times = this.data.ruler[this.data.data.cycle];
            let value = [];
            for (let i = 0; i < times.length; i++) {
                value[i] = {number: this.data.data.dosage, remind_time: times[i]}
            }

            getApp().globalData.addOrEditDrugObj.items = value;
        }


        HiNavigator.navigateToDrugNumberPage({
            drugName: this.data.data.drugName,
            step: 2,
            count: 3,
            code: this.data.data.code
        });
    },

    clickTopArr(e) {
        let index = e.currentTarget.dataset.index;
        this.data.itemsTop[index] = this.handleClick(index, this.data.itemsTop);
        this.setData({
            itemsTop: this.data.itemsTop
        })
    },

    clickBottomArr(e) {
        let index = e.currentTarget.dataset.index;
        this.data.itemsBottom[index] = this.handleClick(index, this.data.itemsBottom);
        this.setData({
            itemsBottom: this.data.itemsBottom
        })
    },

    handleClick(index, items) {
        let item = items[index];
        if (item.content === item.contentShort) {
            item.content = item.contentLong;
        } else {
            item.content = item.contentShort;
        }
        item.arrIsNor = !item.arrIsNor;
        return item;
    }

})
