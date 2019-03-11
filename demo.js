var mongoose = require('mongoose');
var async = require('async');
var alarmMongoose = require('./model/alarm')
var mongoBaseUrl = 'mongodb://localhost:27017/Device_';
var alarmModel;
var alarmConnection;
async.series([
    function (callback) {
         alarmConnection = alarmMongoose.createConnection(mongoBaseUrl + '123456789');
        console.log('Connnected to ' + mongoBaseUrl + '123456789');
        //var alarmSchema = alarmMongoose.createSchema(alarmObject);
         alarmModel = alarmMongoose.createModel(alarmConnection, 'AlarmModel');
        
        callback();
    },
    function (callback) { 
        alarmMongoose.createNewLog(alarmModel, {
            source : 'Khanh',
            type : 'type',
        });
        callback();
     }
], function (err) {
    if (err) console.log(err);
    alarmConnection.close();
});