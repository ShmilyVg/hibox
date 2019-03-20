import {HiBlueToothManager} from "heheda-bluetooth";
import HiBoxBlueToothProtocol from "./hi-box-bluetooth-protocol";

export default class HiBoxBlueToothManager extends HiBlueToothManager {
    constructor() {
        super();
        this.bluetoothProtocol = new HiBoxBlueToothProtocol(this);
        this.setUUIDs({services: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9F']});//设置主Services方式如 this.setUUIDs({services: ['xxxx']})  xxxx为UUID全称，可设置多个
    }

    sendAlertTimeOperationProtocol({singleAlertData}) {
        return this.bluetoothProtocol.sendAlertTime({singleAlertData});
    }

    sendQueryDataSuccessProtocol({isSuccess}) {
        this.bluetoothProtocol.sendQueryDataSuccessProtocol(arguments[0]);
    }

    sendFindDeviceProtocol() {
        this.bluetoothProtocol.sendFindDeviceProtocol();
    }
}
