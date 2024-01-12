import { createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageMongoDB } from 'rxdb/plugins/storage-mongodb';

class Storage {
    db: RxDatabase

    constructor(storage_filename?: string) {

    }

    public async init() {
        this.db = await createRxDatabase({
            name: 'storage',
            storage: getRxStorageMongoDB({
                connection: `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@localhost:27017`
            })
        })

        await this.db.addCollections({
            users: {
                schema: UserSchema
            }
        });
    }
}

const UserSchema = {
    title: 'users',
    version: 0,
    primaryKey: 'group_id',
    type: 'object',
    properties: {
        group_id: {
            type: 'number'
        },
        consumer_id: {
            type: 'array',
            uniqueItems: true,
            items: {
                type: 'number'
            }
        }
    }
};



export default Storage;