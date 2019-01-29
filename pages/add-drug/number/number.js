import DrugRuler from "./drug-ruler";
import Toast from "../../../view/toast";
import HiNavigator from "../../../navigator/hi-navigator";
import Protocol from "../../../modules/network/protocol";
import {ConnectState, ProtocolState} from "../../../modules/bluetooth/bluetooth-state";

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

    getHiMinutes(divideNumber) {
        let minuteOriginLength = 60;
        return new Array(minuteOriginLength / divideNumber).fill(0).map((item, index) => `0${index * divideNumber}`.slice(-2));
    },
    onLoad(options) {
        let number = 3, piece = 1, list;
        const {items, compartment, deviceId = ''} = getApp().globalData.addOrEditDrugObj;
        if (!!items && !!items.length) {
            number = items.length;
            piece = items[0].number;
            list = DrugRuler.convertServerListToLocalList({items});
        }
        this.setData(
            {
                ...options,
                number,
                piece,
                compartment,
                deviceId,
                list: list || DrugRuler.getList({ruler: this.data.ruler, number, piece}),
                numberArray: this.getArray(9),
                pieceArray: this.getArray(99),
                hourAndMinuteArray: [new Array(24).fill(0).map((item, index) => `0${index}`.slice(-2)),
                    this.getHiMinutes(10)],
            }
        );

        getApp().setBLEListener({
            bleStateListener: ({state}) => {
                switch (state.connectState) {
                    case ConnectState.UNAVAILABLE:
                    case ConnectState.UNBIND:
                    case ConnectState.DISCONNECT:
                        Toast.hiddenLoading();
                        setTimeout(Toast.warn, 0, '药盒断连请重试');
                        break;
                }
            },
            receiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.SEND_ALERT_TIME_RESULT === state.protocolState) {
                    if (finalResult.isSetSingleAlertItemSuccess) {
                        if (!!this.dataForBLE.length) {
                            this.sendDataToBLE();
                        } else {
                            Protocol.postMedicalRemindConfig({...DrugRuler.getConvertToServerData({...this.data})})
                                .then(() =>
                                    setTimeout(() => {
                                        Toast.success(`${this.data.compartment || 1}号仓设置成功`);
                                        setTimeout(() => HiNavigator.switchToIndexPage({refresh: true}), 2500);
                                    })
                                )
                                .catch(() => setTimeout(Toast.warn, 0, '设置失败请重试'))
                                .finally(() => Toast.hiddenLoading());
                        }
                    } else {
                        Toast.hiddenLoading();
                        setTimeout(Toast.warn, 0, '设置失败请重试');
                    }
                }
            }
        });

    },

    numberAllChooseEvent(e) {
        const number = this.getChooseNumberTypeValue(e);
        this.setData({list: DrugRuler.getList({...this.data, number}), number});
    },

    timeItemChooseEvent(e) {
        console.log(e);
        const {detail: {value}} = e;
        const {list, selectedItemIndex, hourAndMinuteArray} = this.data;
        list[selectedItemIndex] = {...list[selectedItemIndex], ...DrugRuler.getFinalItemExpectPiece(`${hourAndMinuteArray[0][value[0]]}:${hourAndMinuteArray[1][value[1]]}`)};
        this.setData({list: list.sort(DrugRuler.sortFun)});
    },

    pieceAllChooseEvent(e) {
        const piece = this.getChooseNumberTypeValue(e);
        this.setData({list: DrugRuler.getList({...this.data, piece}), piece});
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

    nextStep() {
        // Toast.showLoading();
        this.dataForBLE = DrugRuler.getConvertToBLEList({...this.data});
        this.sendDataToBLE();
    },

    sendDataToBLE() {
        const singleAlertData = this.dataForBLE.pop();
        DrugRuler.sendAlertTimeDataToBLE({singleAlertData});
    }
});
