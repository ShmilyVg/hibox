import HiBlueToothProtocol from "../../libs/bluetooth/hi-bluetooth-protocol";
import {HexTools} from "../../libs/bluetooth/utils/tools";
import {ProtocolState} from "../../modules/bluetooth/bluetooth-state";

export default class HiBoxBlueToothProtocol extends HiBlueToothProtocol {
    constructor(blueToothManager) {
        super({blueToothManager, deviceIndexNum: 7});
        this.action = {
            ...this.action,
            //由手机发出的定时设置请求
            '0x74': ({singleAlertData}) => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x74', data: singleAlertData})});
            },
            //设备反馈定时设置结果
            '0x7d': ({dataArray}) => {
                const isSetSingleAlertItemSuccess = HexTools.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                return {
                    state: ProtocolState.SEND_ALERT_TIME_RESULT,
                    dataAfterProtocol: {isSetSingleAlertItemSuccess}
                };
            },
            //由手机发出的查找设备请求
            '0x72': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x72'})});
            },
        }
    }

    sendFindDeviceProtocol() {
        if (this.getDeviceIsBind()) {
            this.action['0x72']();
        }
    }

    /**
     * 发送定时闹钟
     */
    sendAlertTime({singleAlertData}) {
        if (this.getDeviceIsBind()) {
            this.action['0x74']({singleAlertData: [...singleAlertData]});
        }
    }
};
