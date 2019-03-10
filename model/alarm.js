var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise; //Error if not declared

var AlarmSchema = new Schema ({
    source : String,
    value : Number,
    message : String,
    type : String,
    state: String,
    timestamp : {type : Date , default : Date.now},
} , {collection: 'alarm'});

var alarmSchema = module.exports.alarmSchema = AlarmSchema;

module.exports.createConnection = function (connectionUrl) { 
    return mongoose.createConnection(connectionUrl)
}

module.exports.createModel = function (connection , modelName , schema) { 
    return connection.model(modelName , schema)
}

module.exports.addNewAlarm = function (connection , modelName , schema) { 
    return connection.model(modelName , schema)
}