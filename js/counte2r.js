var intervalID;
function disp() {
    document.getElementById("dat").innerHTML = "40";
};
function reset2() {
    var url = "http://" + window.location.host + "/api/reset";
    fetch(url)
        .then(function (response) {
            return response.json()
        })
        .then(function (response) {
            console.log(response)
        })
        .catch(function (error) {
            console.log(error)
        })

}
function reset() {
    var check = confirm('現在のカウンターをリセットします。よろしいですか？')
    if (check) reset2()
}
function get_log() {
    var target = document.getElementById("logtable")
    while (target.firstChild) {
        target.removeChild(target.firstChild)
    }
}
var old_rcnt = 0
var now_nomal_rcnt = 0
//rcnt hakugei rush now_medal all_rcnt
var intervalFunc = function getdata() {
    var url = "http://" + window.location.host + "/api/get_data"
    //console.log(url)
    var xhr = new XMLHttpRequest();
/*
    //fetch(url)
    //.then(function (response) {
    //    return response.json()
    //})
    //.then(function (response) {
    //    var is_first = true
    //    */
    xhr.open("get",url)
    xhr.send();
    xhr.addEventListener('readystatechange', function() {
    if( xhr.readyState === 4 && xhr.status === 200) {
        var data = JSON.parse(xhr.response);
    //fetch(url)
        //.then(function (response) {
       //    return response.json()
        //})
        //.then(function (data) {
            //console.log(data)
            document.getElementById("rcnt").innerHTML = data.rcnt
            document.getElementById("hakugei").innerHTML = data.hakugei
            document.getElementById("rush").innerHTML = data.rush
            document.getElementById("now_medal").innerHTML = data.m_out - data.m_in
            document.getElementById("all_rcnt").innerHTML = data.all_rcnt
            document.getElementById("hakugei_ritsu").innerHTML = "1/" + String(Math.trunc(now_nomal_rcnt / data.hakugei))
            document.getElementById("rush_ritsu").innerHTML = "1/" + String(Math.trunc(now_nomal_rcnt / data.rush))
            console.log(old_rcnt != data.rcnt)
            if (old_rcnt != data.rcnt) {
                reload_slotdata()
            }
            old_rcnt = data.rcnt
        }})
        //.catch(function (error) {
        //    console.log(error)
        //})
}
intervalID = setInterval(intervalFunc, 1200)

//過去情報id
var old_dataid = 0
function reload_slotdata() {
    var log_table = document.getElementById("logtable")
    var url = "http://" + window.location.host + "/api/get_slotlog"
    var slot_status = ["通常", "白鯨戦", "ゼロからっしゅ"]
    var xhr = new XMLHttpRequest();
/*
    //fetch(url)
    //.then(function (response) {
    //    return response.json()
    //})
    //.then(function (response) {
    //    var is_first = true
    //    */
    xhr.open("get",url)
    xhr.send();
    xhr.addEventListener('readystatechange', function() {
    if( xhr.readyState === 4 && xhr.status === 200) {
        var response = JSON.parse(xhr.response);
    //console.log(response.data.length)
    old_dataid = response.data.id
    now_nomal_rcnt = 0
    //過去データを消す
    while (log_table.firstChild) {
        log_table.removeChild(log_table.firstChild)
    }
    //新しいデータを作る
    var is_first=true
    for (var i=0;i<response.data.length;i++){
        var logdata_row = response.data[i]
    //for (var logdata_row of response.data) {
        if (logdata_row.slot_status == 0) {
            now_nomal_rcnt += logdata_row.rcnt
        }
        if (is_first) {
            is_first = false
            continue
        }
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        var span_el = document.createElement("span")
        //slot status
        span_el.setAttribute("class", "uk-hidden@m")
        span_el.appendChild(document.createTextNode("状態:"))
        td.appendChild(span_el)
        td.appendChild(document.createTextNode(slot_status[logdata_row.slot_status]))
        tr.appendChild(td)
        log_table.appendChild(tr)
        //rcnt
        td = document.createElement("td")
        span_el = document.createElement("span")
        span_el.setAttribute("class", "uk-hidden@m")
        span_el.appendChild(document.createTextNode("回転数:"))
        td.appendChild(span_el)
        td.appendChild(document.createTextNode(logdata_row.rcnt))
        tr.appendChild(td)
        log_table.appendChild(tr)
        //all_rcnt
        td = document.createElement("td")
        span_el = document.createElement("span")
        span_el.setAttribute("class", "uk-hidden@m")
        span_el.appendChild(document.createTextNode("総回転数:"))
        td.appendChild(span_el)
        td.appendChild(document.createTextNode(logdata_row.all_rcnt))
        tr.appendChild(td)
        log_table.appendChild(tr)
        //now_medal
        td = document.createElement("td")
        span_el = document.createElement("span")
        span_el.setAttribute("class", "uk-hidden@m")
        span_el.appendChild(document.createTextNode("区間差枚数:"))
        td.appendChild(span_el)
        td.appendChild(document.createTextNode(logdata_row.now_medal))
        tr.appendChild(td)
        log_table.appendChild(tr)
        //out_medal - in_medal
        td = document.createElement("td")
        span_el = document.createElement("span")
        span_el.setAttribute("class", "uk-hidden@m")
        span_el.appendChild(document.createTextNode("総差枚数:"))
        td.appendChild(span_el)
        td.appendChild(document.createTextNode(logdata_row.m_out - logdata_row.m_in))
        tr.appendChild(td)
        log_table.appendChild(tr)
    }
}
    }
    )
    
    //catch(function (error) {
    //   console.log(error)
    
    
//cole.log(log_table)
}
/*(id,m_in,m_out,rcnt,is_now,slot_status,update_at,start_datetime */