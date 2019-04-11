import {ProtocolState} from "./bluetooth-state";
import HiBlueToothProtocol from "./heheda-bluetooth/hi-bluetooth-protocol";
import {HexTools} from "./heheda-bluetooth/utils/tools";


export default class HiBoxBlueToothProtocol extends HiBlueToothProtocol {
    constructor(blueToothManager) {
        super({blueToothManager, deviceIndexNum: 7});
        this.action = {
            ...this.action,
            //由手机发出的定时设置请求
            '0x30': ({singleAlertData}) => {
                return super.sendData({command: '0x30', data: singleAlertData});
            },
            //设备反馈定时设置结果
            '0x31': ({dataArray}) => {
                const isSetSingleAlertItemSuccess = HexTools.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                return {
                    state: ProtocolState.SEND_ALERT_TIME_RESULT,
                    dataAfterProtocol: {isSetSingleAlertItemSuccess}
                };
            },
            //设备返回要同步的数据
            '0x32': ({dataArray}) => {
                const length = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const isEat = HexTools.hexArrayToNum(dataArray.slice(1, 2)) === 1;
                const timestamp = HexTools.hexArrayToNum(dataArray.slice(2, 6));
                const compartment = HexTools.hexArrayToNum(dataArray.slice(6));
                return {state: ProtocolState.QUERY_DATA_ING, dataAfterProtocol: {length, isEat, timestamp, compartment}};
            },
        }
    }

    sendFindDeviceProtocol() {
        if (this.getDeviceIsBind()) {
            this.action['0x08']();
        }
    }

    /**
     * 发送定时闹钟
     */
    sendAlertTime({singleAlertData}) {
        if (this.getDeviceIsBind()) {
            return this.action['0x30']({singleAlertData: [...singleAlertData]});
        } else {
            return Promise.reject();
        }
    }
};
