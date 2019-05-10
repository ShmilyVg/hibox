import * as mta from "mta-wechat-analysis";

export function initAnalysisOnApp() {
    mta.App.init({
        "appID": "500670811",
        "eventID": "500670812",
        "autoReport": true,
        "statParam": true,
        "ignoreParams": [],
        "statPullDownFresh": true,
        "statShareApp": true,
        "statReachBottom": true
    });
}
