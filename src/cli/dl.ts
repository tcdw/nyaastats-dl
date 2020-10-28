import minimist from 'minimist';
import download from '../download';

const helpContent = `Usage: nyaastats-dl [OPTIONS]
Options:
-h              Display this help information and exit
-s site         (Required) NyaaStats site URL
-o dir          Output directory
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

download(args.s, args.o);
