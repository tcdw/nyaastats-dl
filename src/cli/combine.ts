import minimist from 'minimist';
import combine from '../combine';

const helpContent = `Usage: nyaastats-combine [OPTIONS]
Options:
-h              Display this help information and exit
-i dir          Input directory
-y year[=2020]  Year
`;

const args = minimist(process.argv.slice(2));

if (args.h || args.help) {
    process.stdout.write(helpContent);
    process.exit(0);
}
if (!args.i) {
    process.stdout.write(helpContent);
    process.exit(1);
}

(async () => {
    try {
        combine(args.i);
    } catch (e) {
        console.error(`无法完成操作：${e}`);
        process.exit(1);
    }
})();
