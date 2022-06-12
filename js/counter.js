let intervalID;
function disp() {
    document.getElementById("dat").innerHTML = "40";
}
function reset2() {
    const url = "http://" + window.location.host + "/api/reset";
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.log(error);
        });

}
function reset() {
    let check = confirm('現在のカウンターをリセットします。よろしいですか？');
    if (check) reset2();
}
function get_log() {
    var target = document.getElementById("logtable");
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
}
let old_rcnt = 0;
let now_nomal_rcnt = 0;
//rcnt hakugei rush now_medal all_rcnt
const intervalFunc = function getdata() {
    const url = "http://" + window.location.host + "/api/get_data";
    //console.log(url);
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            //console.log(data);
            document.getElementById("rcnt").innerHTML = data.rcnt;
            document.getElementById("hakugei").innerHTML = data.hakugei;
            document.getElementById("rush").innerHTML = data.rush;
            document.getElementById("now_medal").innerHTML = data.m_out - data.m_in;
            document.getElementById("all_rcnt").innerHTML = data.all_rcnt;
            document.getElementById("hakugei_ritsu").innerHTML = "1/" + String(Math.trunc(now_nomal_rcnt / data.hakugei));
            document.getElementById("rush_ritsu").innerHTML = "1/" + String(Math.trunc(now_nomal_rcnt / data.rush));
            console.log(old_rcnt != data.rcnt)
            if (old_rcnt != data.rcnt) {
                reload_slotdata();
            }
            old_rcnt = data.rcnt;
        })
        .catch(error => {
            console.log(error);
        });
}
intervalID = setInterval(intervalFunc, 1200);

//過去情報id
let old_dataid = 0;
function reload_slotdata() {
    let log_table = document.getElementById("logtable");
    const url = "http://" + window.location.host + "/api/get_slotlog";
    const slot_status = ["通常", "白鯨戦", "ゼロからっしゅ"]

    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(response => {
            let is_first = true;
            //console.log(response.data.length)
            old_dataid = response.data.id
            now_nomal_rcnt = 0;

            //過去データを消す
            while (log_table.firstChild) {
                log_table.removeChild(log_table.firstChild);
            }
            //新しいデータを作る
            for (const logdata_row of response.data) {
                if (logdata_row.slot_status == 0) {
                    now_nomal_rcnt += logdata_row.rcnt;
                }
                if (is_first) {
                    is_first = false;
                    continue;
                }
                let tr = document.createElement("tr");
                let td = document.createElement("td");
                let span_el = document.createElement("span");
                //slot status
                span_el.setAttribute("class", "uk-hidden@m");
                span_el.appendChild(document.createTextNode("状態:"));
                td.appendChild(span_el);
                td.appendChild(document.createTextNode(slot_status[logdata_row.slot_status]));
                tr.appendChild(td);
                log_table.appendChild(tr);

                //rcnt
                td = document.createElement("td");
                span_el = document.createElement("span");
                span_el.setAttribute("class", "uk-hidden@m");
                span_el.appendChild(document.createTextNode("回転数:"));
                td.appendChild(span_el);
                td.appendChild(document.createTextNode(logdata_row.rcnt));
                tr.appendChild(td);
                log_table.appendChild(tr);

                //all_rcnt
                td = document.createElement("td");
                span_el = document.createElement("span");
                span_el.setAttribute("class", "uk-hidden@m");
                span_el.appendChild(document.createTextNode("総回転数:"));
                td.appendChild(span_el);
                td.appendChild(document.createTextNode(logdata_row.all_rcnt));
                tr.appendChild(td);
                log_table.appendChild(tr);

                //now_medal
                td = document.createElement("td");
                span_el = document.createElement("span");
                span_el.setAttribute("class", "uk-hidden@m");
                span_el.appendChild(document.createTextNode("区間差枚数:"));
                td.appendChild(span_el);
                td.appendChild(document.createTextNode(logdata_row.now_medal));
                tr.appendChild(td);
                log_table.appendChild(tr);

                //out_medal - in_medal
                td = document.createElement("td");
                span_el = document.createElement("span");
                span_el.setAttribute("class", "uk-hidden@m");
                span_el.appendChild(document.createTextNode("総差枚数:"));
                td.appendChild(span_el);
                td.appendChild(document.createTextNode(logdata_row.m_out - logdata_row.m_in));
                tr.appendChild(td);
                log_table.appendChild(tr);
            }
        })
        .catch(error => {
            console.log(error);
        });
    //console.log(log_table);



}
/*(id,m_in,m_out,rcnt,is_now,slot_status,update_at,start_datetime */