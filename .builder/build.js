import Archiver from 'archiver';
import FS from 'fs';
import OS from 'os';

const exclude = [ 'modules.packages' ];

let modules = [];
let count = 0;

FS.readdirSync('../').forEach(file => {
    /* Ignoring hidden files */
    if(file.substr(0, 1) === '.') {
        return;
    }

    /* Ignoring other files */
    if(!exclude.indexOf(file)) {
        return;
    }

    /* Only use Directorys */
    if(FS.statSync('../' + file).isDirectory()) {
        ++count;
        console.log('[INFO] Found Module:', file);

        const archive= Archiver('zip', {
            zlib: {
                level: 9
            },
            comment: 'Automatic packed by ModulePacker | fruithost'
        });

        const stream          = FS.createWriteStream('../modules.packages/' + file + '.zip');

        archive.directory('../' + file, true).on('finish', () => {
            console.info('[INFO] Packed: ', file, '~> modules.packages/' + file + '.zip');
            modules.push(file);
        }).on('error', error => {
            console.error('[ERROR]', error);
        }).on('warning', warning => {
            console.warn('[WARNING]', warning);
        }).pipe(stream);

        archive.finalize();
    }
});

let _watcher = setInterval(() => {
    if(modules.length == count) {
        clearInterval(_watcher);
        console.info('[INFO] Update modules.list');
        modules.sort();

        FS.writeFile('../modules.list', modules.join(OS.EOL), error => {
            if (error) {
                console.error('[ERROR]', error);
            } else {
                console.info('[INFO] modules.list updated with ', modules.length, ' Modules');
            }
        });
    }
});