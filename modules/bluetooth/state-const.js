import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";

export default class BlueToothState {
    static UNBIND = 'unbind';
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;
    static CONNECTED_AND_BIND = 'connected_and_bind';
    static TIMESTAMP = 'timestamp';//开始预热状态
    static GET_CONNECTED_RESULT_SUCCESS = 'get_connected_result_success';//设备返回连接结果
    static SEND_CONNECTED_REQUIRED = 'send_connected_required';//手机发送连接请求
    static UNKNOWN = 'unknown';//未知状态
}
