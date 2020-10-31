import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import parallelLimit, { Task } from 'run-parallel-limit';

interface Player {
    uuid: string;
    playername: string;
}

async function download(src: string, dest: string) {
    const infoData = await axios({
        url: `${src}/data/info.json`,
    });
    const playersData = await axios({
        url: `${src}/data/players.json`,
    });
    fs.mkdirpSync(path.join(dest, 'data/by-uuid'));
    fs.mkdirpSync(path.join(dest, 'data/by-name'));
    fs.writeJSONSync(path.join(dest, 'info.json'), infoData.data, {
        spaces: 4,
        encoding: 'utf8',
    });
    fs.writeJSONSync(path.join(dest, 'players.json'), playersData.data, {
        spaces: 4,
        encoding: 'utf8',
    });
    const players: Player[] = playersData.data;
    const tasks: Task<Function>[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < players.length; i++) {
        tasks[i] = async (callback: Function) => {
            const e = players[i];
            console.error(`[${i + 1} / ${players.length}] 正在下载玩家 ${e.playername} 的数据`);
            // eslint-disable-next-line no-await-in-loop
            const content = await axios({
                url: `${src}/data/${e.uuid}/stats.json`,
            });
            fs.writeJSONSync(path.join(dest, 'data/by-uuid', `${e.uuid}.json`), content.data, {
                spaces: 4,
                encoding: 'utf8',
            });
            fs.writeJSONSync(path.join(dest, 'data/by-name', `${e.playername}.json`), content.data, {
                spaces: 4,
                encoding: 'utf8',
            });
            callback();
        };
    }
    parallelLimit(tasks, 6);
}

export default download;
