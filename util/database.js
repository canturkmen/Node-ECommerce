const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    "mongodb+srv://CanTurkmen:38ys2TOM7L6TuYs3@cluster0.t76i6e6.mongodb.net/shop?retryWrites=true&w=majority"
  )
    .then((client) => {
      _db = client.db();
      callback(_db);
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
