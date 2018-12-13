Page({

    data: {
        number: 3,
        piece: 1,
        list: [],
        numberArray: [],
        selectedItemIndex: 0,
        ruler: {
            1: ['08:00'],
            2: ['08:00', '23:00'],
            3: ["08:00", "15:00", "23:00"],
            4: ["08:00", "13:00", "18:00", "23:00"],
            5: ["08:00", "11:00", "15:00", "19:00", "23:00"],
            6: ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"],
            7: ["08:00", "10:30", "13:00", "15:30", "18:00", "20:30", "23:00"],
            8: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "23:00"],
            9: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "23:00"],
        }
    },
    onLoad(options) {
        let {number, piece} = options;
        number = parseInt(number) || 1;
        piece = parseInt(piece) || 1;
        this.setData(
            {
                ...options,
                number,
                piece,
                list: this.getList({ruler: this.data.ruler, number, piece}),
                numberArray: this.getArray(9),
                pieceArray: this.getArray(99)
            }
        );
    },

    numberAllChooseEvent(e) {
        const number = this.getChooseNumberTypeValue(e);
        this.setData({list: this.getList({...this.data, number}), number});
    },

    timeItemChooseEvent(e) {
        console.log(e);
        const {detail: {value}} = e;
        const data = this.data;
        const obj = {};
        obj[`list[${data.selectedItemIndex}]`] = {...data.list[data.selectedItemIndex], ...this.getFinalItemExpectPiece(value)};
        this.setData(obj);
    },

    pieceAllChooseEvent(e) {
        const piece = this.getChooseNumberTypeValue(e);
        this.setData({list: this.getList({...this.data, piece}), piece});
    },

    pieceItemChooseEvent(e) {
        const piece = this.getChooseNumberTypeValue(e);
        const obj = {};
        obj[`list[${this.data.selectedItemIndex}].piece`] = piece;
        this.setData(obj);
    },

    clickItemEvent(e) {
        const {currentTarget: {dataset: {index}}} = e;
        this.setData({
            selectedItemIndex: parseInt(index) || 0
        })
    },

    getList({ruler, number, piece}) {
        return ruler[number].map(item => {
            return {...this.getFinalItemExpectPiece(item), piece};
        });
    },

    onUnload() {

    },

    getChooseNumberTypeValue(e) {
        const {detail: {value}} = e;
        return (parseInt(value) || 0) + 1;
    },
    getArray(length) {
        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(i + 1);
        }
        return array;
    },

    getDayPart(hour) {
        let part = 'night';
        if (hour < 12) {
            part = 'morning';
        } else if (hour < 18) {
            part = 'afternoon';
        }
        return part;
    },

    getFinalItemExpectPiece(hourAndMinute) {
        const hour = parseInt(hourAndMinute.slice(0, 2));
        const minute = parseInt(hourAndMinute.slice(-2));
        return {timestamp: hour * 3600 + minute * 60, time: hourAndMinute, dayPart: this.getDayPart(hour)};
    },
    nextStep() {
        console.log(this.getConvertList());
    },

    getConvertList() {
        const {list: {length}, drugNumber} = this.data;
        return this.data.list.sort(function (item1, item2) {
            return item1.timestamp - item2.timestamp;
        }).map((item, timeIndex) => {
            return {drugNumber: parseInt(drugNumber) || 1, length, timeIndex, timestamp: item.timestamp,};
        })
    }
});

