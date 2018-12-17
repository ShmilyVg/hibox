import SimpleBlueToothImp from "../../../libs/bluetooth/simple-bluetooth-imp";
import BlueToothProtocol from "./bluetooth-protocol";
import BlueToothState from "../state-const";

export default class HiBlueToothManager extends SimpleBlueToothImp {

    constructor() {
        super();
        this.bluetoothProtocol = new BlueToothProtocol(this);
        this.latestState = BlueToothState.UNBIND;
    }

    /**
     * 发送数据细节的封装
     * 这里根据你自己的业务自行实现
     * @param buffer
     */
    sendData({buffer}) {
        if (buffer && buffer.byteLength) {
            super.sendData({buffer}).then(res => {
                console.log('writeBLECharacteristicValue success成功', res.errMsg);
                const dataView = new DataView(buffer, 0);
                const byteLength = buffer.byteLength;
                for (let i = 0; i < byteLength; i++) {
                    console.log(dataView.getUint8(i));
                }
            }).catch(res => console.log(res));
        } else {
            console.log('发送的buffer是空');
        }
    }

    getLatestState() {
        if (this.getBindMarkStorage()) {
            return this.latestState;
        }
        return this.latestState = BlueToothState.UNBIND;
    }

    clearConnectedBLE() {
        this.bluetoothProtocol.clearBindMarkStorage();
        return super.clearConnectedBLE();
    }

    getBindMarkStorage() {
        return this.bluetoothProtocol.getDeviceIsBind();
    }

    setBindMarkStorage() {
        this.bluetoothProtocol.setBindMarkStorage();
    }

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    closeAll() {
        return super.closeAll();
    }

    setFilter(filter) {
        this.bluetoothProtocol.setFilter(filter);
    }

    startProtocol() {
        setTimeout(() => {
            this.setFilter(false);
            this.getBindMarkStorage() ? this.bluetoothProtocol.startCommunication() : this.bluetoothProtocol.requireDeviceBind();
        }, 2000);
    }

    /**
     * 处理从蓝牙设备接收到的数据的具体实现
     * 这里会将处理后的数据，作为参数传递给setBLEListener的receiveDataListener监听函数。
     * @param receiveBuffer ArrayBuffer类型 接收到的数据的最原始对象，该参数为从微信的onBLECharacteristicValueChange函数的回调参数
     * @returns {*}
     */
    dealReceiveData({receiveBuffer}) {
        const {dataAfterProtocol, state} = this.bluetoothProtocol.receive({receiveBuffer});
        if (BlueToothProtocol.UNKNOWN === state.protocolState) {
            return {filter: true};
        }
        super.updateBLEStateImmediately({state});
        HiBlueToothManager.logReceiveData({receiveBuffer});
        return {finalResult: dataAfterProtocol, state};
    }

    /**
     * 打印接收到的数据
     * @param receiveBuffer
     */
    static logReceiveData({receiveBuffer}) {
        const byteLength = receiveBuffer.byteLength;
        // const buffer = new ArrayBuffer(byteLength);
        const dataView = new DataView(receiveBuffer, 0);
        for (let k = 0; k < byteLength; k++) {
            console.log(`接收到的数据索引：${k} 值：${dataView.getUint8(k)}`);
        }
    }
};
