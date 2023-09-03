import Loki from 'lokijs';

const getStorage = () => {
    const db = new Loki('storage.db');
    return db.getCollection('users') || db.addCollection('users')
};

export default getStorage;

