import fs from 'fs-extra';
import path from 'path';

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

function count(map: Map<string, number>, key: string) {
    return map.set(key, filter(map.get(key)) + 1);
}

function combine(src: string, year: number = 2020) {
    const advancementData = fs.readJSONSync(path.resolve(__dirname, '../data/advancement-data.json'), { encoding: 'utf8' });
    const advancements = Object.keys(advancementData);
    const dataPaths = fs.readdirSync(path.join(src, 'data/by-uuid'));
    const data: Map<string, number> = new Map();
    dataPaths.forEach((e, i) => {
        process.stderr.write('\r');
        process.stderr.write(`[${i + 1} / ${dataPaths.length}] 正在处理 ...`);
        const content = fs.readJSONSync(path.join(src, 'data/by-uuid', e), { encoding: 'utf8' });
        const timeStart = new Date(content.data.time_start);
        const timeLast = new Date(content.data.time_last);

        // 每年份加入的玩家数量
        // yearly_registered_$YEAR $VALUE
        const yearKey = `yearly_registered_${timeStart.getFullYear()}`;
        count(data, yearKey);

        // 该年份每月加入的玩家数量
        // yearly_registered_$YEAR_$MONTH  $VALUE
        if (timeStart.getFullYear() === year) {
            const addedKey = `monthly_registered_${year}_${pad(timeStart.getMonth() + 1, 2)}`;
            count(data, addedKey);
        }

        // 该年份每月增加的熊孩子数量
        // yearly_registered_$YEAR_$MONTH  $VALUE
        if (timeLast.getFullYear() === year) {
            const bannedKey = `monthly_banned_${year}_${pad(timeLast.getMonth() + 1, 2)}`;
            if (content.data.banned) {
                count(data, bannedKey);
            }
        }

        // 进度 (advancement) 完成人数
        // advancement_$NAME  $AMOUNT
        advancements.forEach((e) => {
            if (typeof content.advancements[e] !== 'undefined' && content.advancements[e].done) {
                const advKey = `advancements_${e}`;
                count(data, advKey);
            }
        });
    });
    const dataAsc: Map<string, number> = new Map([...data.entries()].sort());
    fs.writeFileSync(path.join(src, 'results.txt'), '', { encoding: 'utf8' });
    dataAsc.forEach((v, k) => {
        const line = `${k}\t${v}\n`;
        fs.appendFileSync(path.join(src, 'results.txt'), line, { encoding: 'utf8' });
    });
}

export default combine;
