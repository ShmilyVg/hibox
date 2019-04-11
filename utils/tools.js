function createDateAndTime(timeStamp) {
    let date = new Date(timeStamp);
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let dateT = date.getFullYear() + '年' + (month < 10 ? ('0' + month) : month) + '月' + (day < 10 ? ('0' + day) : day) + '日';
    let time = (hour < 10 ? ('0' + hour) : hour) + ':' + (minute < 10 ? ('0' + minute) : minute);
    return {date: dateT, time: time, day: day, month: month};
}

function deleteLineBreak(str){
    return str.replace(/[\r\n]/g,"");
}

function getRulerTime(){
    return {
        1: ['08:00'],
        2: ['08:00', '21:00'],
        3: ["08:00", "13:00", "21:00"],
        4: ["08:00", "13:00", "18:00", "21:00"],
        5: ["08:00", "12:00", "15:00", "18:00", "21:00"],
        6: ["08:00", "11:00", "14:00", "17:00", "19:00", "21:00"],
        7: ["08:00", "10:30", "13:00", "15:30", "17:00", "19:30", "21:00"],
        8: ["08:00", "10:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
        9: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "21:00"],
    }
}

module.exports = {
    createDateAndTime,
    deleteLineBreak,
    getRulerTime
}