import {ConnectState, ProtocolState} from "./state-const";

const commandIndex = 4, dataStartIndex = 5;

const deviceIndexNum = 7;
export default class HiBlueToothProtocol {

    constructor(blueToothManager) {
        this.setFilter(true);//过滤
        this._blueToothManager = blueToothManager;
        this.action = {
            //由设备发出的时间戳请求
            '0x70': () => {
                const now = Date.now() / 1000;
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x71', data: [now]})});
                return {state: ProtocolState.TIMESTAMP};
            },
            //App请求同步数据
            '0x77': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x77'})});
                blueToothManager.updateBLEStateImmediately(this.getOtherStateWithConnectedState({protocolState: ProtocolState.QUERY_DATA_START}));
            },
            //设备返回要同步的数据
            '0x75': ({dataArray}) => {
                const length = HiBlueToothProtocol.hexArrayToNum(dataArray.slice(0, 1));
                const isEat = HiBlueToothProtocol.hexArrayToNum(dataArray.slice(1, 2)) === 1;
                const timestamp = HiBlueToothProtocol.hexArrayToNum(dataArray.slice(2));
                return {state: ProtocolState.QUERY_DATA_ING, dataAfterProtocol: {length, isEat, timestamp}};
            },
            //App传给设备同步数据的结果
            '0x78': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x78'})});
                blueToothManager.updateBLEStateImmediately(this.getOtherStateWithConnectedState({protocolState: ProtocolState.QUERY_DATA_FINISH}));
            },
            //由设备发出的电量和版本号
            // '0x76': ({dataArray}) => {
            //
            //     return {state: BlueToothState.BREATH_RESTART};
            // },
            //由手机发出的连接请求
            '0x7a': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x7a'})});
            },
            //由设备发出的连接反馈 1接受 0不接受 后面的是
            '0x7b': ({dataArray}) => {
                const isConnected = HiBlueToothProtocol.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                const deviceId = HiBlueToothProtocol.hexArrayToNum(dataArray.slice(1));
                //由手机回复的连接成功
                isConnected && this.startCommunication();
                return {
                    state: ProtocolState.GET_CONNECTED_RESULT_SUCCESS,
                    dataAfterProtocol: {isConnected, deviceId}
                };
            },
            //App发送同步数据
            '0x7c': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x7c'})});
                this.sendQueryDataRequiredProtocol();
            },
        }
    }

    // requireDeviceId() {
    //     this.action['0x7a']();
    // }

    requireDeviceBind() {
        !this.getDeviceIsBind() && this.action['0x7a']();
    }

    sendQueryDataRequiredProtocol() {
        if (this.getDeviceIsBind()) {
            setTimeout(() => {
                this.action['0x77']();
            }, 4000);
        }
    }

    sendQueryDataSuccessProtocol() {
        if (this.getDeviceIsBind()) {
            this.action['0x78']();
        }
    }

    startCommunication() {
        this.action['0x7c']();
    }

    setFilter(filter) {
        this._filtra = filter;
    }

    getDeviceIsBind() {
        console.log('获取设备是否被绑定', !!wx.getStorageSync('isBindDevice'));
        return !!wx.getStorageSync('isBindDevice');
    }

    setBindMarkStorage() {
        wx.setStorageSync('isBindDevice', 1);
    }

    clearBindMarkStorage() {
        wx.removeStorageSync('isBindDevice');
    }

    receive({receiveBuffer}) {
        const receiveArray = [...new Uint8Array(receiveBuffer)];
        let command = receiveArray[commandIndex];
        let commandHex = `0x${HiBlueToothProtocol.numToHex(command)}`;
        console.log('命令字', commandHex);
        let dataLength = receiveArray[2] - 2;
        let dataArray;
        if (dataLength > 0) {
            const endIndex = dataStartIndex + dataLength;
            dataArray = receiveArray.slice(dataStartIndex, endIndex + 1);
        }
        const action = this.action[commandHex];
        if (!this._filtra && action) {
            const {state: protocolState, dataAfterProtocol} = action({dataArray});
            return this.getOtherStateWithConnectedState({protocolState, dataAfterProtocol});
        } else {
            console.log('协议中包含了unknown状态或过滤信息');
            return this.getOtherStateWithConnectedState({protocolState: ProtocolState.UNKNOWN});
        }
    }

    getOtherStateWithConnectedState({protocolState, dataAfterProtocol}) {
        return {
            ...this._blueToothManager.getState({connectState: ConnectState.CONNECTED, protocolState}),
            dataAfterProtocol
        };
    }

    createBuffer({command, data}) {
        const dataBody = this.createDataBody({command, data});
        return new Uint8Array(dataBody).buffer;
    }

    createDataBody({command = '', data = []}) {
        const dataPart = data.map(item => HiBlueToothProtocol.numToHexArray(item));
        const lowLength = HiBlueToothProtocol.hexToNum((dataPart.length + 2).toString(16));
        const array = [170, 0, lowLength, deviceIndexNum, HiBlueToothProtocol.hexToNum(command), ...dataPart];
        let count = 0;
        array.forEach(item => count += item);
        count = ~count + 1;
        array.push(count);
        return array;
    }

    static hexToNum(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`);
    }

    static numToHex(num = 0) {
        return ('00' + num.toString(16)).slice(-2);
    }

    /**
     *
     * @param num
     * @returns {*} 一个字节代表16位
     */
    static numToHexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }
        let str = num.toString(16);
        console.log(str);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(parseInt(`0x${str.substr(i, 2)}`));
        }
        return array;
    }

    /**
     * hex数组转为num
     * @param array 按高低八位来排列的数组
     */
    static hexArrayToNum(array) {
        let count = 0, divideNum = array.length - 1;
        array.forEach((item, index) => count += item << (divideNum - index) * 4);
        return count;
    }
}
