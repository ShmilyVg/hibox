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

module.exports = {
    createDateAndTime,
    deleteLineBreak
}