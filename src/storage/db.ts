import Loki from 'lokijs';
import { setTimeout } from 'timers/promises';
import type { UserPref } from 'types/telegram.types';

export default class Storage {
    db: Loki;

    constructor(storage_filename?: string) {
        this.db = new Loki(storage_filename || 'storage.db', {
            autoload: true,
            autosave: true,
            autosaveInterval: 10000
        })
    }

    get(): Collection<UserPref> {
        return this.db.getCollection('users') || this.db.addCollection('users', {indices: ['group_id'], autoupdate: true});
    }

    async save() {
        /*
        Loki.saveDatabase method uses async fs.writeFile operation, while being synchronous itself
        Promise-based timeout prevents Loki.saveDatabase being finished before actually writing database to file system
        */
        await setTimeout(1000, this.db.saveDatabase(err => console.log(err ? `Loki.saveDatabase error: ${err}` : 'Loki.saveDatabase success')));
    }
}