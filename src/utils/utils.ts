const serializeToQuery = (data: object) => {
    let query = new URLSearchParams();
    // TODO: inspect stringify behaviour on primitive data types + test
    // Object.entries(data).forEach((entry) => query += `&${entry[0]}=${JSON.stringify(entry[1])}`);
    Object.entries(data).forEach((entry) => query.set(entry[0], typeof entry[1] === 'string'? entry[1] : JSON.stringify(entry[1])));
    return query;
}

class PostFormData extends FormData {
    constructor(obj: object) {
        super();
        Object.entries(obj).forEach(([key, value]) => {
            this.append(key, value);
        })
    }
}

export {serializeToQuery, PostFormData};