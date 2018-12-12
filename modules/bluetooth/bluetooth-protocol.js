import BlueToothState from "./state-const";

const commandIndex = 4, dataStartIndex = 5;

const deviceIndexNum = 6;
export default class BlueToothProtocol {

    constructor(blueToothManager) {
        this.setFilter(true);//过滤
        this.action = {
            //由设备发出的时间戳请求
            '0x70': () => {
                const now = Date.now() / 1000;
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x71', data: now})});
                return {state: BlueToothState.TIMESTAMP};
            },
            //由设备发出的预热请求
            '0x72': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x73'})});
                return {state: BlueToothState.PRE_HOT_START};
            },
            //由设备发出的吹气请求
            '0x74': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x75'})});
                return {state: BlueToothState.PRE_HOT_FINISH_AND_START_BREATH};
            },
            //由设备发出的重新吹气请求
            '0x76': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x77'})});
                return {state: BlueToothState.BREATH_RESTART};
            },
            //由设备发出的显示结果请求
            '0x78': ({dataArray}) => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x79'})});
                const timestamp = BlueToothProtocol.hexArrayToNum(dataArray.slice(0, 4));
                const result = BlueToothProtocol.hexArrayToNum(dataArray.slice(-2));
                return {state: BlueToothState.BREATH_FINISH_AND_SUCCESS, dataAfterProtocol: {result, timestamp}};
            },
            // //由App发出的串号请求
            // '0x7a': () => {
            //     blueToothManager.sendData({buffer: this.createBuffer({command: '0x7a'})});
            //     return {state: BlueToothState.DEVICE_ID_REQUIRE};
            // },
            // //由设备发出的串号反馈
            // '0x7b': ({dataArray}) => {
            //     const deviceId = BlueToothProtocol.hexArrayToNum(dataArray);
            //     return {state: BlueToothState.DEVICE_ID_GET_SUCCESS, dataAfterProtocol: {deviceId}};
            // },
            //由手机发出的连接请求
            '0x7a': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x7a'})});
                return {state: BlueToothState.SEND_CONNECTED_REQUIRED};
            },
            //由设备发出的连接反馈 1接受 0不接受 后面的是
            '0x7b': ({dataArray}) => {
                const isConnected = BlueToothProtocol.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                const deviceId = BlueToothProtocol.hexArrayToNum(dataArray.slice(1));
                //由手机回复的连接成功
                isConnected && this.startCommunication();
                return {state: BlueToothState.GET_CONNECTED_RESULT_SUCCESS, dataAfterProtocol: {isConnected, deviceId}};
            },
            '0x7c': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x7c'})});
                return {state: BlueToothState.CONNECTED_AND_BIND};
            }
        }
    }

    // requireDeviceId() {
    //     this.action['0x7a']();
    // }

    requireDeviceBind() {
        !this.getDeviceIsBind() && this.action['0x7a']();
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
        let commandHex = `0x${BlueToothProtocol.numToHex(command)}`;
        console.log('命令字', commandHex);
        let dataLength = receiveArray[2] - 2;
        let dataArray;
        if (dataLength > 0) {
            const endIndex = dataStartIndex + dataLength;
            dataArray = receiveArray.slice(dataStartIndex, endIndex + 1);
        }
        const action = this.action[commandHex];
        if (!this._filtra && action) {
            return action({dataArray});
        } else {
            console.log('协议中包含了unknown状态或过滤信息');
            return {state: BlueToothState.UNKNOWN};
        }
    }


    createBuffer({command, data}) {
        const dataBody = this.createDataBody({command, data});
        return new Uint8Array(dataBody).buffer;
    }

    createDataBody({command = '', data}) {
        const dataPart = BlueToothProtocol.numToHexArray(data);
        const lowLength = BlueToothProtocol.hexToNum((dataPart.length + 2).toString(16));
        const array = [170, 0, lowLength, deviceIndexNum, BlueToothProtocol.hexToNum(command), ...dataPart];
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


