import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";

export default class BlueToothState {
    static UNBIND = 'unbind';
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;
    static CONNECTED_AND_BIND = 'connected_and_bind';
    static TIMESTAMP = 'timestamp';//开始预热状态
    static PRE_HOT_START = 'pre_hot_start';//开始预热状态
    static PRE_HOT_FINISH_AND_START_BREATH = 'pre_hot_finish_and_start_breath';//预热完成开始吹气
    static BREATH_FINISH_AND_SUCCESS = 'breath_finish_and_success';//吹气完成返回结果
    static BREATH_RESTART = 'breath_restart';//重新吹气
    static GET_CONNECTED_RESULT_SUCCESS = 'get_connected_result_success';//设备返回连接结果
    static SEND_CONNECTED_REQUIRED = 'send_connected_required';//手机发送连接请求
    static UNKNOWN = 'unknown';//未知状态
}
