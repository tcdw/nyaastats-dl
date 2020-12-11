import fs from 'fs-extra';
import path from 'path';
import quickSort from './utils/quick-sort';
import { vehicle, advancements } from './data/key';

interface PlayerData {
    name: string;
    timeLived: string;
}

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
        const vehicleList = Object.keys(vehicle);
        vehicleList.forEach((f) => {
            const vehicleKey = `stats:${vehicle[f]}`;
            const value: number | undefined = content.stats[`${statsPrefix}${f}`];
            const valueLegacy: number | undefined = content.stats[`${statsPrefixLegacy}${toCamelCase(f)}`];
            if (typeof value !== 'undefined') {
                // 读取 1.13+ 键值
                count(data, vehicleKey, Math.floor(fixOverflow(value) / 100));
            } else if (typeof valueLegacy !== 'undefined') {
                // 读取 1.12 键值
                count(data, vehicleKey, Math.floor(fixOverflow(valueLegacy) / 100));
            }
        });

        // 录入玩家单项数据
        playerDatas.push({
            name: content.data.playername,
            timeLived: content.data.time_lived,
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

    // 排序：在线时间最长
    quickSort(playerDatas, 'timeLived', true);
    fs.writeFileSync(path.join(src, 'top', 'time_lived.txt'), toSingleTable(playerDatas, 'timeLived'), { encoding: 'utf8' });

    // 排序：在线时间最长
    quickSort(playerDatas, 'timeLived', true);
    fs.writeFileSync(path.join(src, 'top', 'time_lived.txt'), toSingleTable(playerDatas, 'timeLived'), { encoding: 'utf8' });
}

export default combine;
