import HiBlueToothManager from "./hi-bluetooth-manager";

export default class HiBoxBlueToothManager extends HiBlueToothManager{
    constructor() {
        super();
        this.setUUIDs({services: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E']});//设置主Services方式如 this.setUUIDs({services: ['xxxx']})  xxxx为UUID全称，可设置多个
    }
    sendAlertTimeOperationProtocol({singleAlertData}) {
        this.bluetoothProtocol.sendAlertTime({singleAlertData});
    }

    sendQueryDataRequiredProtocol() {
        this.bluetoothProtocol.sendQueryDataRequiredProtocol();
    }

    sendQueryDataSuccessProtocol() {
        this.bluetoothProtocol.sendQueryDataSuccessProtocol();
    }

    sendFindDeviceProtocol() {
        this.bluetoothProtocol.sendFindDeviceProtocol();
    }
}
