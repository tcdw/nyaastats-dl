import fs from 'fs-extra';
import path from 'path';

function combine(src: string) {
    const dataPaths = fs.readdirSync(path.join(src, 'data/by-uuid'));
    const outDir = path.join(src, 'all.txt');
    dataPaths.forEach((e) => {
        const content = fs.readJSONSync(path.join(src, 'data/by-uuid', e), { encoding: 'utf8' });
        fs.appendFileSync(path.join(src, 'all.txt'), JSON.stringify(content), { encoding: 'utf8' });
    });
}

export default combine;
