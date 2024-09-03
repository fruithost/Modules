import Archiver from 'archiver';
import FS from 'fs';

const exclude = [ 'modules.packages' ];

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
        }).on('error', error => {
            console.error('[ERROR]', error);
        }).on('warning', warning => {
            console.warn('[WARNING]', warning);
        }).pipe(stream);

        archive.finalize();
    }
});