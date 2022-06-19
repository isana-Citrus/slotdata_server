const http = require("http");
var fs = require('fs');
const sleep = require("./sleep")
var path = require('path');
var config = require('./config');
var server = http.createServer();


const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./db/slotdata.db");
sqlite_setup(db);
//data_insert();
//data_update();
server.on('request', async function (req, res) {
    let filePath = '.' + req.url;
    if (filePath == './') {
        filePath = './index.html';
    }
    //拡張子からコンテンツタイプを取得
    const extname = String(path.extname(filePath)).toLowerCase();
    var contentType = mimeTypes[extname] || 'application/octet-stream';
    //console.log('request ', req.url);
    //console.log(`file path ${filePath}`)
    if (req.url.startsWith("/api/get_data")) {//api/get_dataレスポンス設定(Jsonを返す)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(now_status));
        res.end();
    } else if (req.url.startsWith("/api/get_slotlog")) {//ログ取得
        const slotlog = await get_slotdata_log(250);
        let logdata = { data: [], old_data: [], nomal_rcnt: 0 }
        let nomal_rcnt = 0;
        let match_rcnt = 99999999999;
        for (const log of slotlog) {
            if (match_rcnt > log.all_rcnt) {
                logdata.data.push(log);
                //console.log(`match:${match_rcnt} all:${log.all_rcnt}`)
                match_rcnt = log.all_rcnt;
                if (log.slot_status == 0) {
                    nomal_rcnt += Number(log.rcnt);
                }
            } else {
                match_rcnt = 0;
                logdata.old_data.push(log);
                //console.log(`match:${match_rcnt} all:${log.all_rcnt}`)
            }
        }
        //console.log(nomal_rcnt)
        logdata.nomal_rcnt = nomal_rcnt;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(logdata));
        res.end();
    } else if (req.url.startsWith("/api/reset")) {
        await reset_data();//データをしょきか 
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ status: "reset" }));
        res.end();
    } else {
        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    fs.readFile('./404.html', function (error, content) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    });
                }
                else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                }
            }
            else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

// サーバを待ち受け状態にする
// 第1引数: ポート番号
// 第2引数: IPアドレス
server.listen(config.port);

console.log(config.port);

//シリアル通信
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline');

(() => { console.log("testfunc") })
const parser = new Readline.ReadlineParser()
let port;
SerialPort.SerialPort.list().then(ports => {
    let port_path = "COM3";
    console.log("-----------------------")
    ports.forEach(function (port) {
        console.log(port.path);
        console.log(port.pnpId);
        console.log(port.manufacturer);
        if (port.manufacturer !== undefined) {
            if (port.manufacturer.startsWith("Arduino")) {
                port_path = port.path;
                console.log("[ select ]")
            };
        }
        console.log("-----------------------")
    });
    console.log(`${port_path} select`)
    port = new SerialPort.SerialPort({ path: port_path, baudRate: 9600 }, (e) => { if (e !== null) { console.log(e); serialport_list(); } else { console.log("serial port ok") } })
    port.pipe(parser)
});

async function serialport_list() {
    const SerialPort = require('serialport');
    // Promise approach
    console.log("=======portlist========")
    SerialPort.SerialPort.list().then(ports => {
        ports.forEach(function (port) {
            console.log(port.path);
            console.log(port.pnpId);
            console.log(port.manufacturer);
            console.log("-----------------------")
        });
    }).then(() => {
        console.log("=========end===========");
        //process.exit(1);
    });
}
//スロットデータ処理
let r_cnt = 0;
let farst_data = false;
const default_data = {
    rcnt: 0,
    m_in: 0,
    m_out: 0,
    now_medal: 0,
    all_rcnt: 0,
    slot_status: 0,//0:通常 1:白鯨 2:ラッシュ
    hakugei: 0,
    rush: 0,
}
let now_status = default_data;
//SerialPort.list()
let now_port = String(11111);
parser.on('data', async (line) => {
    //console.log(now_status);
    try {
        //console.log(`COM3> ${line}`)
        if (!farst_data) {//最初に処理する
            const get_data = await data_get();
            if (get_data) {
                now_status = get_data;
            } else {//起動時重複インサート防止
                await sleep(Math.floor(Math.random() * 100) + 1);
                if (!await data_get()) {
                    await data_insert(now_status);
                }
            }
            /*
            r_cnt = await setting_get("rcnt");
            if (r_cnt === false) { r_cnt = 0 }
            now_medal = await setting_get("now_medal");
            if (now_medal === false) { now_medal = 0; }*/
            farst_data = true
        }
        if (String(line).startsWith("m_in")) { now_status.m_in += 1; now_status.now_medal -= 1; }
        if (String(line).startsWith("m_out")) {
            now_status.m_out += 1; now_status.now_medal += 1;
            //await log_set(r_cnt, 0, 1, now_port);
        }
        if (String(line).startsWith("rcnt")) {
            now_status.rcnt += 1;
            now_status.all_rcnt += 1;
            try {
                console.log(`回転数:${now_status.rcnt} メダルIN:${now_status.m_in} メダルOUT:${now_status.m_out} 現在メダル:${now_status.now_medal}`)
                now_port = String(line).slice(6, -1);
                await data_update(now_status);
            }
            catch { }
            /*await setting_set("rcnt", r_cnt);
            await setting_set("now_medal", now_medal);*/
            await at_check();//AT初あたりから終わりまでを監視
        }
        if (String(line).startsWith("port")) {
            console.log(String(line).slice(6, -1))
            now_port = String(line).slice(6, -1);
            await log_set(r_cnt, 0, 0, String(line).slice(6, -1));
            //await at_check();//AT初あたりから終わりまでを監視
        }
    }
    catch (e) { console.log(e) }
})
let at_now = false;
let hakugei_now = false;
let hakugei_end_rcnt = 0;
//slot data を次のやつにする
async function nextdata(next_status = 0) {
    if (next_status != 1) {
        now_status.rcnt -= 4;
    }
    await data_update(now_status);
    await go_next_data();
    now_status.now_medal = 0;
    if (next_status != 1) {
        now_status.rcnt = 4;
    } else {
        now_status.rcnt = 1;
    }
    now_status.slot_status = next_status;
    await data_insert(now_status);
}
async function reset_data() {
    await data_update(now_status);
    await go_next_data();
    now_status = {
        rcnt: 0,
        m_in: 0,
        m_out: 0,
        now_medal: 0,
        all_rcnt: 0,
        slot_status: 0,//0:通常 1:白鯨 2:ラッシュ
        hakugei: 0,
        rush: 0,
    };
    console.log(now_status);
    data_insert(now_status);
}
async function at_check() {
    console.log("port " + now_port);
    if (!at_now && !hakugei_now) {//ゼロカラッシュ&白鯨戦に入っていない
        if (now_port.slice(1, 2) == "0") {
            console.log("白鯨戦突入");
            await nextdata(1);
            now_status.hakugei += 1;
            hakugei_now = true;
        } else if (now_port.slice(0, 1) == "0") {
            console.log("ラッシュダイレクト突入")
            now_status.rush = Number(now_status.rush) + 1;
            await nextdata(2);
            //now_status.rush += 1;
            at_now = true;
        }
    } else if (!at_now && hakugei_now) {//白鯨戦中
        if (now_port.slice(1, 2) == "0") {
            hakugei_end_rcnt = now_status.rcnt;
            console.log("白鯨戦中")
        } else {
            console.log(`白鯨戦終了チェック${now_status.rcnt - hakugei_end_rcnt}/3`);
            if (now_status.rcnt - hakugei_end_rcnt >= 4) {
                hakugei_now = false;
                console.log("白鯨戦敗退")
                await nextdata(0);
            } else if (now_port.slice(0, 1) == "0") {
                console.log("白鯨戦勝利");
                now_status.rush = Number(now_status.rush) + 1;
                await nextdata(2);
                hakugei_now = false;
                at_now = true;
            }
        }

    } else if (at_now && !hakugei_now) {
        console.log("ゼロカラッシュ準備中")
        if (now_port.slice(1, 2) == "0") {
            console.log("ゼロカラッシュ突入")
            hakugei_now = true;
        }
    } else if (at_now && hakugei_now) {
        console.log("ゼロカラッシュ中");
        if (now_port.slice(1, 2) == "0") {
            hakugei_end_rcnt = now_status.rcnt;
        } else {
            console.log(`ラッシュ継続チェック${now_status.rcnt - hakugei_end_rcnt}/3`);
            if (now_status.rcnt - hakugei_end_rcnt >= 4) {
                hakugei_now = false;
                at_now = false;
                console.log("ラッシュ終了")
                await nextdata(0);
            }

        }
    } else {
        console.log(`status異常 at:${at_now} hakugei:${hakugei_now}`)
        await log_set(now_status.rcnt, 0, 0, "00000");
        await log_set(now_status.rcnt, 0, 0, String(line).slice(6, -1));
        await log_set(now_status.rcnt, 0, 0, "00000");

    }

}


////////////////////////////////////////////////////////////////
///////////////////////SQL DB FUNCTION//////////////////////////
////////////////////////////////////////////////////////////////
function sqlite_setup(db) {
    let sql1 = 'create table if not exists setting(name,setval,PRIMARY KEY ("name"))';
    let sql2 = 'create table if not exists log(id INTEGER PRIMARY KEY AUTOINCREMENT'
    sql2 += ",m_in,m_out,rcnt,port,datetime default (datetime(current_timestamp,'localtime')))"
    let sql3 = 'create table if not exists slotdata(id INTEGER PRIMARY KEY AUTOINCREMENT'
    sql3 += ",m_in,m_out,now_medal,rcnt,is_now,slot_status,all_rcnt,update_at,hakugei,rush,start_datetime default (datetime(current_timestamp,'localtime')))"
    console.log(sql2)
    db.serialize(() => {
        db.run(sql1);
        db.run(sql2);
        db.run(sql3);
    })
}
async function get_slotdata_log(limit = 20) {
    sql = `select * from slotdata order by id desc limit ${limit}`
    return await db_all(sql);
}
async function data_insert(data = defalut_data) {
    sql = `insert into slotdata(m_in,m_out,now_medal,rcnt,slot_status,all_rcnt,hakugei,rush,is_now,update_at) values`
    sql += `(${data.m_in},${data.m_out},${data.now_medal}, ${data.rcnt},${data.slot_status},${data.all_rcnt},${data.hakugei},${data.rush}, true, datetime(current_timestamp, 'localtime'))`
    console.log(sql)
    try { await db_run(sql); } catch (e) { console.log(e); }
}
async function data_update(data = defalut_data) {
    sql = `update slotdata set `
    sql += `m_in = ${data.m_in} , m_out = ${data.m_out} , now_medal = ${data.now_medal}, `
    sql += `rcnt = ${data.rcnt} , slot_status = ${data.slot_status} , `
    sql += `all_rcnt = ${data.all_rcnt} , hakugei = ${data.hakugei} , `
    sql += `rush = ${data.rush} , update_at = datetime(current_timestamp, 'localtime') `
    sql += `where is_now = true; `
    console.log(sql)
    try { await db_run(sql); } catch (e) { console.log(e); }

}
async function data_get() {
    sql = "select * from slotdata where is_now = true limit 1";
    console.log(sql)
    let res = await db_get(sql);
    if (res === undefined) { return false; } else { return res; }
}
async function go_next_data() {
    sql = "update slotdata set is_now = false where is_now = true";
    console.log(sql)
    try { await db_run(sql); } catch (e) { console.log(e); }
}
///////////////////////array setting///////////////////////////
async function setting_array_get(setname) {
    const sql = 'select setval FROM setting WHERE name = "' + setname + '"'
    let res = await db_get(sql);
    if (res) {
        return res.setval.split(",")
    } else {
        return []
    }
}
/**
 * @param {Array} setarray
 */
async function setting_array_set(setname, setarray) {
    let setstr = ""
    setarray.forEach(id => {
        setstr += id + ","
    })
    setstr = setstr.replace(/,$/, '');
    setstr = '"' + setstr + '"'
    const sql = 'insert or replace into setting(name,setval) values("' + setname + '",' + setstr + ')'
    await db_run(sql);
}
/////////////////////////log/////////////////////////////
async function log_set(sr_cnt, medal_in = 0, medal_out = 0, slot_port) {
    medal_in = String(medal_in)
    medal_out = String(medal_out)
    sr_cnt = String(sr_cnt)
    let sql = 'insert into log(m_in,m_out,rcnt,port) '
    sql += `values(${medal_in}, ${medal_out}, ${sr_cnt}, "${slot_port}")`

    try { await db_run(sql); } catch (e) { console.log(e); }
}
///////////////////////setting///////////////////////////
async function setting_set(setname, setval) {
    if (typeof (setval) === "string") {
        setval = '"' + setval + '"'
    }
    const sql = 'insert or replace into setting(name,setval) values("' + setname + '",' + setval + ')'
    await db_run(sql);
}
async function setting_get(setname) {
    const sql = 'select setval FROM setting WHERE name = "' + setname + '"'
    let res = await db_get(sql);
    /*if (!pos) {//nullならデフォルトを設定しよう
        await position_set(guild, 5);
        return 5;
    }*/
    if (res === undefined) {
        return false;
    } else {
        return res.setval
    }

}
async function setting_delete(setname) {
    const sql = 'DELETE FROM setting WHERE name = "' + setname + '"'
    await db_run(sql);
}
function db_get(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}
function db_all(sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

function db_run(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}
//////////////////////////////////////////////////
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};