/* eslint-disable camelcase */
import fs from 'fs-extra';
import path from 'path';
import { vehicle, advancements } from './data/key';

interface PlayerData {
    name: string;
    timeLived: number;
    timeLivedPerDay: number;

    // 交通方式
    boat: number;
    aviate: number;
    horse: number;
    minecart: number;
    pig: number;
    strider: number;
    climb: number;
    crouch: number;
    fly: number;
    sprint: number;
    swim: number;
    walk: number;
    fall: number;
}

const vehicleList = Object.keys(vehicle);

function toCamelCase(str: string, first = false) {
    const words = str.split('_');
    let out = '';
    words.forEach((e, i) => {
        if (!first && i === 0) {
            out += e;
            return;
        }
        out += e[0].toUpperCase() + e.substring(1);
    });
    return out;
}

function pad(e: number, len: number) {
    let str = String(e);
    while (str.length < len) {
        str = `0${str}`;
    }
    return str;
}

function filter(e: number | undefined | null) {
    if (!e) {
        return 0;
    }
    return e;
}

// https://github.com/NyaaCat/NyaaStats/blob/v2/web/src/components/player-statistic-panel.vue#L143-L151
function fixOverflow(val: number) {
    const INT_32_MAX = 2 ** 31;
    return val >= 0 ? val : val + INT_32_MAX * 2;
}

function count(map: Map<string, number>, key: string, amount = 1) {
    return map.set(key, filter(map.get(key)) + amount);
}

function toSingleTable(playerDatas: PlayerData[], key: keyof PlayerData) {
    let out = '';
    playerDatas.forEach((e) => {
        out += `${e.name}\t${e[key]}\n`;
    });
    return out;
}

function combine(src: string, year: number = new Date().getFullYear()) {
    const dataPaths = fs.readdirSync(path.join(src, 'data/by-uuid'));
    const statsPrefix = 'minecraft:custom/minecraft:';
    const statsPrefixLegacy = 'stat.';
    const data: Map<string, number> = new Map();
    const playerDatas: PlayerData[] = [];
    dataPaths.forEach((e, i) => {
        process.stderr.write('\r');
        process.stderr.write(`[${i + 1} / ${dataPaths.length}] 正在处理 ...`);
        const content = fs.readJSONSync(path.join(src, 'data/by-uuid', e), { encoding: 'utf8' });
        const timeStart = new Date(content.data.time_start);
        const timeLast = new Date(content.data.time_last);

        // 每年份加入的玩家数量
        // yearly_registered:$YEAR $VALUE
        const yearKey = `yearly_registered:${timeStart.getFullYear()}`;
        count(data, yearKey);

        // 该年份范围内的所有数据统计
        if (timeStart.getFullYear() === year) {
            // 该年份每月加入的玩家数量
            // yearly_registered:$YEAR_$MONTH  $VALUE
            const addedKey = `monthly_registered:${year}_${pad(timeStart.getMonth() + 1, 2)}`;
            count(data, addedKey);
        }

        // 该年份所有上线玩家加入年份统计
        // timelast_$YEAR_registered:$JOIN_YEAR  $VALUE
        if (timeLast.getFullYear() === year) {
            const toyearKey = `timelast_${year}_registered:${timeStart.getFullYear()}`;
            count(data, toyearKey);
        }

        // 进度 (advancement) 完成人数
        // advancement:$NAME  $AMOUNT
        advancements.forEach((f) => {
            if (typeof content.advancements[`minecraft:${f}`] !== 'undefined'
                && content.advancements[`minecraft:${f}`].done) {
                const advKey = `advancements:${f}`;
                count(data, advKey);
            }
        });

        // 出行方式总里程
        const vehicleData: {[key: string]: number} = {
            boat: 0,
            aviate: 0,
            horse: 0,
            minecart: 0,
            pig: 0,
            strider: 0,
            climb: 0,
            crouch: 0,
            fly: 0,
            sprint: 0,
            swim: 0,
            walk: 0,
            fall: 0,
        };
        vehicleList.forEach((f) => {
            const vehicleKey = `stats:${vehicle[f]}`;
            const value: number | undefined = content.stats[`${statsPrefix}${f}`];
            const valueLegacy: number | undefined = content.stats[`${statsPrefixLegacy}${toCamelCase(f)}`];
            if (typeof value !== 'undefined') {
                // 读取 1.13+ 键值
                count(data, vehicleKey, Math.floor(fixOverflow(value) / 100));
                vehicleData[f.slice(0, -7)] = fixOverflow(value);
            } else if (typeof valueLegacy !== 'undefined') {
                // 读取 1.12 键值
                count(data, vehicleKey, Math.floor(fixOverflow(valueLegacy) / 100));
                vehicleData[f.slice(0, -7)] = fixOverflow(valueLegacy);
            }
        });

        // 录入玩家单项数据
        playerDatas.push({
            name: content.data.playername,
            timeLived: content.data.time_lived,
            timeLivedPerDay: content.data.time_lived
                / ((new Date(`${year + 1}-01-01`).getTime() - content.data.time_start) / 1000 / 86400),

            boat: vehicleData.boat,
            aviate: vehicleData.aviate,
            horse: vehicleData.horse,
            minecart: vehicleData.minecart,
            pig: vehicleData.pig,
            strider: vehicleData.strider,
            climb: vehicleData.climb,
            crouch: vehicleData.crouch,
            fly: vehicleData.fly,
            sprint: vehicleData.sprint,
            swim: vehicleData.swim,
            walk: vehicleData.walk,
            fall: vehicleData.fall,
        });
    });
    process.stderr.write('\n');

    let output = '';
    // 通用数据
    const dataAsc: Map<string, number> = new Map([...data.entries()].sort());
    dataAsc.forEach((v, k) => {
        output += `${k}\t${v}\n`;
    });
    fs.writeFileSync(path.join(src, 'results.txt'), output, { encoding: 'utf8' });
    fs.mkdirpSync(path.join(src, 'top'));

    const keyList = Object.keys(playerDatas[0]);
    // 排序
    keyList.forEach((e) => {
        const keyName: any = e;
        if (e === 'name') {
            return;
        }
        const results = playerDatas.sort((a: any, b: any) => b[keyName] - a[keyName]);
        fs.writeFileSync(path.join(src, 'top', `${keyName}.txt`), toSingleTable(results, keyName), { encoding: 'utf8' });
    });
}

export default combine;
