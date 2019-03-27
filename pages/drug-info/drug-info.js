// pages/drug-info/drug-info.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";
import * as tools from "../../utils/tools";

let pageDebug = false;

Page({
    data: {
    },
    onLoad() {
        this.data.ruler = tools.getRulerTime();
        if (pageDebug) {
            Protocol.getDrugCode({code: '6920312611029'}).then(data => {
                let items = data.result.items;
                let itemsTop = [], itemsBottom = [];
                items.map(item => {
                    if (item.imgUrl) {
                        itemsTop.push(this.handleItem(true, item));
                    } else {
                        itemsBottom.push(this.handleItem(false, item));
                    }
                });
                this.setData({
                    data: data.result,
                    itemsTop: itemsTop,
                    itemsBottom: itemsBottom
                })
            })
        } else {
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
        }
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
        item.content = item.content === item.contentShort ? item.contentLong : item.contentShort;
        item.arrIsNor = !item.arrIsNor;
        return item;
    }

})
