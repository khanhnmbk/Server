var mongoose = require('mongoose');
var async = require('async');
var alarmMongoose = require('./model/alarm')
var mongoBaseUrl = 'mongodb://localhost:27017/Device_';
var fs = require('fs');

var databasePath = '../Server/Database';

fs.readdir(databasePath , function(err , dirs) {
    if (err) console.log(err);
    else console.log(dirs);
})