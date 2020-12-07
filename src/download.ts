import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import parallelLimit, { Task } from 'run-parallel-limit';

interface Player {
    uuid: string;
    playername: string;
}

async function download(src: string, dest: string, skipExists: boolean) {
    const infoDataPath = `${src}/data/info.json`;
    const playerDataPath = `${src}/data/players.json`;
    const infoData = await axios({
        url: infoDataPath,
    });
    const playersData = await axios({
        url: playerDataPath,
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
            const uuidPath = path.join(dest, 'data/by-uuid', `${e.uuid}.json`);
            const namePath = path.join(dest, 'data/by-name', `${e.playername}.json`);
            if (skipExists && (fs.existsSync(uuidPath) && fs.existsSync(namePath))) {
                console.error(`[${i + 1} / ${players.length}] 玩家 ${e.playername} 的数据已经下载过了，跳过`);
                setTimeout(() => {
                    callback();
                }, 100);
                return;
            }
            console.error(`[${i + 1} / ${players.length}] 正在下载玩家 ${e.playername} 的数据`);
            // eslint-disable-next-line no-await-in-loop
            const content = await axios({
                url: `${src}/data/${e.uuid}/stats.json`,
            });
            fs.writeJSONSync(uuidPath, content.data, {
                spaces: 4,
                encoding: 'utf8',
            });
            fs.writeJSONSync(namePath, content.data, {
                spaces: 4,
                encoding: 'utf8',
            });
            callback();
        };
    }
    parallelLimit(tasks, 6);
}

export default download;
