import DrugRuler from "./drug-ruler";
import Toast from "../../../view/toast";
import HiNavigator from "../../../navigator/hi-navigator";
import Protocol from "../../../modules/network/protocol";
import {ConnectState, ProtocolState} from "../../../modules/bluetooth/bluetooth-state";
import WXDialog from "../../../view/dialog";
import * as tools from "../../../utils/tools";

Page({
    divideNumber: 30,
    data: {
        number: 3,
        piece: 1,
        list: [],
        numberArray: [],
        selectedItemIndex: 0,
        ruler: tools.getRulerTime(),
        foodRuler: [{
            content: '饭前服用',
            selected: true,
            id: 'before',
        }, {
            content: '饭中服用',
            selected: false,
            id: 'middle',
        }, {
            content: '饭后服用',
            selected: false,
            id: 'after',
        },]
    },
    bleConnectingAction: false,//点击设置按钮时，蓝牙正在重连阶段
    getHiMinutes(divideNumber) {
        let minuteOriginLength = 60;
        return new Array(minuteOriginLength / divideNumber).fill(0).map((item, index) => `0${index * divideNumber}`.slice(-2));
    },
    onFoodSelectedEvent(e) {
        console.log(e);
        const {currentTarget: {dataset: {id}}} = e;
        this.setData({
            foodRuler: this.data.foodRuler.map(item => ({...item, selected: item.id === id}))
        })
    },
    onLoad(options) {
        DrugRuler.setDiviceNumber(this.divideNumber);
        let number = 3, piece = 2, list;
        const {items, compartment, deviceId = '', useType} = getApp().globalData.addOrEditDrugObj;
        const pieceArray = this.getPieceArray(99);
        if (!!items && !!items.length) {
            number = items.length;
            piece = parseFloat(items[0].number);
            for (let i = 0, len = pieceArray.length; i < len; i++) {
                if (piece.toFixed(1) === pieceArray[i].value.toFixed(1)) {
                    piece = i + 1;//这里是因为页面中减了1，所以在这里要先加1
                    break;
                }
            }
            list = DrugRuler.convertServerListToLocalList({items});
        }
        const id = useType || this.data.foodRuler[0].id;
        this.setData(
            {
                ...options,
                number,
                piece,//这是用量的索引
                compartment,
                deviceId,
                code: options.code,
                list: list || DrugRuler.getList({ruler: this.data.ruler, number, piece}),
                numberArray: this.getArray(9),
                pieceArray: this.getPieceArray(99),
                hourAndMinuteArray: [new Array(24).fill(0).map((item, index) => `0${index}`.slice(-2)),
                    this.getHiMinutes(this.divideNumber)],
                foodRuler: this.data.foodRuler.map(item => ({...item, selected: item.id === id}))
            }
        );

        getApp().setBLEListener({
            bleStateListener: ({state}) => {
                console.log('设置时间，state=', state);
                switch (state.connectState) {
                    case ConnectState.UNAVAILABLE:
                    case ConnectState.UNBIND:
                    case ConnectState.DISCONNECT:
                        Toast.hiddenLoading();
                        setTimeout(Toast.warn, 0, '药盒断连请重试');
                        break;
                    case ConnectState.CONNECTED:
                        if (state.protocolState === ProtocolState.TIMESTAMP) {
                            if (this.bleConnectingAction) {
                                this.bleConnectingAction = false;
                                this.nextStep();
                            }
                        }
                        break;
                }
            },
            receiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.SEND_ALERT_TIME_RESULT === state.protocolState) {
                    if (finalResult.isSetSingleAlertItemSuccess) {
                        if (!!this.dataForBLE.length) {
                            this.sendDataToBLE();
                        } else {
                            const temp = this.data.foodRuler.filter(item => item.selected);
                            Protocol.postMedicalRemindConfig({
                                ...DrugRuler.getConvertToServerData({...this.data}),
                                useType: temp.pop().id
                            })
                                .then(() =>
                                    setTimeout(() => {
                                        Toast.success(`${this.data.compartment || 1}号仓设置成功`, 1500);
                                        setTimeout(() => HiNavigator.switchToIndexPage({refresh: true}), 2000);
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
        const {detail: {value}} = e;
        const {list, selectedItemIndex, hourAndMinuteArray} = this.data;
        const finalItemExpectPiece = DrugRuler.getFinalItemExpectPiece(`${hourAndMinuteArray[0][value[0]]}:${hourAndMinuteArray[1][value[1]]}`);
        let isOk = true;
        list.forEach((item, index) => {
            if (index !== selectedItemIndex && Math.abs(item.timestamp - finalItemExpectPiece.timestamp) < 1800) {
                isOk = false;
            }
        });
        if (isOk) {
            list[selectedItemIndex] = {...list[selectedItemIndex], ...finalItemExpectPiece};
        } else {
            WXDialog.showDialog({content: '建议两次服药时间间隔≥30分钟'});
        }
        this.setData({list: list.sort(DrugRuler.sortFun)});
    },

    pieceAllChooseEvent(e) {
        const piece = this.getChooseNumberTypeValue(e);
        const {list} = this.data;
        list.forEach(item => item.piece = piece);
        this.setData({list, piece});
    },
    getPieceValue({pieceIndex}) {
        return this.data.pieceArray[pieceIndex - 1].value;
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
    getPieceArray(length) {
        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(i + 0.25);
            array.push(i + 0.5);
            array.push(i + 0.75);
        }
        return array.concat(this.getArray(length)).sort((item1, item2) => item1 - item2).map((item, index) => ({
            key: index,
            value: item
        }));
    },
    nextStep() {
        // Toast.showLoading();
        Toast.hiddenLoading();
        if (this.data.code == 0) {
            delete (this.data['code']);
        }
        const {connectState, protocolState} = getApp().getLatestBLEState();
        console.log('设置时间，点击nextStep:protocolState类型', typeof protocolState);
        switch (connectState) {
            case ConnectState.CONNECTED:
                if (!!protocolState && protocolState !== ProtocolState.UNKNOWN) {
                    Toast.showLoading('正在设置...');
                    this.dataForBLE = DrugRuler.getConvertToBLEList({...this.data});
                    this.sendDataToBLE();
                } else if (!this.bleConnectingAction) {
                    this.bleConnectingAction = true;
                    Toast.showLoading('正在设置...');
                }
                break;
            default :
                if (!this.bleConnectingAction) {
                    this.bleConnectingAction = true;
                    Toast.showLoading('正在设置...');
                }
                break;
        }
    },

    sendDataToBLE() {
        const singleAlertData = this.dataForBLE.pop();
        DrugRuler.sendAlertTimeDataToBLE({singleAlertData}).catch(() => {
            Toast.warn('设置失败请重试');
        });
    },

    threePoint() {
        wx.navigateTo({
            url: '../../use-instructions/use-instructions'
        })
    }
});
