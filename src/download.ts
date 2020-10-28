import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

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
    fs.mkdirpSync(path.join(dest, 'data'));
    fs.writeJSONSync(path.join(dest, 'info.json'), infoData.data, {
        spaces: 4,
        encoding: 'utf8',
    });
    fs.writeJSONSync(path.join(dest, 'players.json'), playersData.data, {
        spaces: 4,
        encoding: 'utf8',
    });
    const players: Player[] = playersData.data;
    // eslint-disable-next-line no-restricted-syntax
    for (const e of players) {
        console.log(`正在下载玩家 ${e.playername} 的数据`);
        // eslint-disable-next-line no-await-in-loop
        const content = await axios({
            url: `${src}/data/${e.uuid}/stats.json`,
        });
        fs.writeJSONSync(path.join(dest, 'data', `${e.playername}.json`), content.data, {
            spaces: 4,
            encoding: 'utf8',
        });
    }
}

export default download;
