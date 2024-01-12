import { createRxDatabase, toTypedRxJsonSchema, type ExtractDocumentTypeFromTypedRxJsonSchema, type RxCollection, type RxDatabase, type RxDocument, type RxJsonSchema } from 'rxdb';
import { getRxStorageMongoDB } from 'rxdb/plugins/storage-mongodb';

class Storage {
    db: UserDatabase

    constructor(storage_filename?: string) {

    }

    public async init() {
        this.db = await createRxDatabase<UserCollections>({
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

const NTUserSchema = {
    title: 'users',
    version: 0,
    primaryKey: 'group_id',
    type: 'object',
    properties: {
        group_id: {
            type: 'number'
        },
        consumer_ids: {
            type: 'array',
            uniqueItems: true,
            items: {
                type: 'number'
            }
        }
    }
} as const;

const TUserSchema = toTypedRxJsonSchema(NTUserSchema);
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof TUserSchema>
export const UserSchema: RxJsonSchema<UserDocType> = NTUserSchema

export type UserDocument = RxDocument<UserDocType>
export type UserCollection = RxCollection<UserDocType>
export type UserCollections = { users: UserCollection }
export type UserDatabase = RxDatabase<UserCollections>

export default Storage;