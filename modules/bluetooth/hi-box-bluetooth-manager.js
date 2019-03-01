import {HiBlueToothManager} from "heheda-bluetooth";
import HiBoxBlueToothProtocol from "./hi-box-bluetooth-protocol";

export default class HiBoxBlueToothManager extends HiBlueToothManager{
    constructor() {
        super();
        this.bluetoothProtocol = new HiBoxBlueToothProtocol(this);
        this.setUUIDs({services: ['0000FE95-0000-1000-8000-00805F9B34FB']});//设置主Services方式如 this.setUUIDs({services: ['xxxx']})  xxxx为UUID全称，可设置多个
    }
    sendAlertTimeOperationProtocol({singleAlertData}) {
        this.bluetoothProtocol.sendAlertTime({singleAlertData});
    }

    sendQueryDataSuccessProtocol({isSuccess}) {
        this.bluetoothProtocol.sendQueryDataSuccessProtocol(arguments[0]);
    }

    sendFindDeviceProtocol() {
        this.bluetoothProtocol.sendFindDeviceProtocol();
    }
}
