const axios = require('axios')
const moment = require('moment-timezone')

// 命令行参数
const args = process.argv.slice(2)
// console.log(args[0]);

const api = {
    queryUser: 'https://health.tripaway.cn/staffs/queryUser',
    login: "https://health.tripaway.cn/login",
    addTempRecord: "https://health.tripaway.cn/tempRecord/add",
    addHealthCard: "https://health.tripaway.cn/healthCard/add"
}

const userInfo = {
    name: args[0],
    passwd: args[1],
    signName: args[2]
}

// 日期格式化函数
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

// queryUser获取用户信息以及Cookie参数：route
function queryUser() {
    return axios({
        method: 'get',
        url: api.queryUser,
        params: {
            staffName: userInfo.name,
            staffId: '',
            passwd: userInfo.passwd
        }
    }).then((res) => {
        return {
            data: res.data,
            headers: res.headers
        }
    })
}

function Login(Cookie) {
    return axios({
        method: 'post',
        url: api.login,
        headers: {
            "Cookie": Cookie
        },
        params: {
            'username': `health_${userInfo.name}@&${userInfo.passwd}@&@&@&@&`
        }
    }).then((res) => {
        // 取得并返回JSESSIONID
        return res.headers['set-cookie'][res.headers['set-cookie'].length - 1].split(";")[0] + '; ' + Cookie
    }).catch((err) => {
        console.log(err);
    })
}

function addTempRecord(tempCard, Cookie) {
    return axios({
        method: 'post',
        url: api.addTempRecord,
        headers: {
            "Cookie": Cookie
        },
        data: tempCard
    }).then((res) => {
        // console.log(res.data);
        return res.data
    }).catch((err) => {
        console.log(err);
    })
}

function addHealthCard(healthCard, Cookie) {
    return axios({
        method: 'post',
        url: api.addHealthCard,
        headers: {
            "Cookie": Cookie
        },
        data: healthCard
    }).then((res) => {
        // console.log(res.data);
        return res.data
    }).catch((err) => {
        console.log(err);
    })

}

async function Main() {
    // 获取route
    console.log("Getting route...");
    let headers_data = await queryUser()
    console.log("Done.\n");

    let tempCookie = `healthLastLoginTime=${headers_data.data[0].passwd}` +
        `; healthLastLoginName1=${encodeURI(headers_data.data[0].loginName)}` +
        `; ${headers_data.headers['set-cookie'][0].split(";")[0]}`

    // 获取JSESSIONID拼接完整Cookie
    console.log("Getting Full Cookie...");
    let Cookie = await Login(tempCookie)
    console.log("Done.\n");
    // console.log("Cookie: \n", Cookie, "\n");

    // 当前时间
    // 随机体温
    let temperature = (Math.random() * (36.8 - 36.2) + 36.2).toFixed(1).toString()
    // 体温表
    let tempCard = {
        field1: "腋温",
        recordTimeStr: moment(new Date()).tz('Asia/Shanghai').format("yyyy-MM-DD HH:mm"),
        remark: "健康，无以下状况,",
        temp: temperature
    }
    // 提交
    console.log("Submit TemperatureRecord...");
    let addTempResult = await addTempRecord(tempCard, Cookie)
    console.log("Done...");
    // 提交结果
    console.log("addTempResult： ", addTempResult.data);

    let healthCard = {
        cardTemp: temperature,
        familyHealth: "",
        healthDesc: "",
        isFamilyHealth: "健康",
        isHealth: "健康",
        isTouched: "无",
        signDate: moment(new Date()).tz('Asia/Shanghai').format("yyyy年MM月DD日"),
        signName: userInfo.signName,
        type: "new"
    }

    let addHealthResult = await addHealthCard(healthCard, Cookie)
    console.log("addHealthResult: ", addHealthResult);

}

Main()