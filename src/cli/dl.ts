import minimist from 'minimist';
import download from '../download';

const helpContent = `Usage: nyaastats-dl [OPTIONS]
Options:
-h              Display this help information and exit
-s site         (Required) NyaaStats site URL
-o dir          Output directory
-t              Skip downloaded data
`;

const args = minimist(process.argv.slice(2));

if (args.h || args.help) {
    process.stdout.write(helpContent);
    process.exit(0);
}
if (!args.s) {
    process.stdout.write(helpContent);
    process.exit(1);
}

(async () => {
    try {
        await download(args.s, args.o, args.t);
    } catch (e) {
        console.error(`无法完成下载：${e}`);
        process.exit(1);
    }
})();
