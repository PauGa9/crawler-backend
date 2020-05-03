const MongoClient = require("mongodb").MongoClient;
const COLLECTION_NAME = 'visited_pages';

const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
const dbName = 'crawler';
const client = new MongoClient(url, { useNewUrlParser: true });

function createDB() {
    return new Promise((resolve, reject) => {
        client.connect(function(error) {
            if (error) return reject(error);
        
            const db = client.db(dbName);
            resolve(createRepository(db));
        })
    })
}

function createRepository(db) {
    return {
        findPagesByMainPage: function (mainPage) {
            const collection = db.collection(COLLECTION_NAME);
            return collection.find({"mainPage": mainPage}).toArray();
        },
        savePage: function (document) {
            const collection = db.collection(COLLECTION_NAME);
            return collection.insertOne(document);
        }
    }
}

module.exports = createDB()