import Network from "./network";

export default class Protocol {

    // /**
    //  * 示例
    //  * @param friendId
    //  */
    // static postExample({friendId}) {
    //     return Network.request({url: 'user/friend/example', data: {friendId}});
    // }

    static getAccountInfo() {
        return Network.request({url: 'account/info'});
    }

    static getHistoryList({userId = 123}) {
        return Network.request({url: 'user/history', data: {userId}});
    }

    static getAnalysisSituation() {
        return Network.request({url: 'analysis/situation'})
    }

    static getAnalysisFetch({dataValue, situation}) {
        return Network.request({url: 'analysis/fetch', data: {dataValue, situation}})
    }

    static getBreathDataAdd({dataValue, situation}) {
        return Network.request({url: 'breathData/add', data: {dataValue, situation}});
    }

    static getBreathDataList({page, pageSize = 15}){
        return Network.request({url: 'breathData/list', data: {page, pageSize}})
    }

    static getAnalysisNotes(){
        return Network.request({url: 'analysis/notes'})
    }

    static getDeviceBindList(){
        return Network.request({url: 'device/bindList'})
    }

    static postDeviceBind({deviceId}){
        return Network.request({url: 'device/bind', data: {deviceId}});
    }

    static postDeviceUnbind({deviceId}){
        return Network.request({url: 'device/unbind', data: {deviceId}});
    }

}
