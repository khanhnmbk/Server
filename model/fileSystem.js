var fs = require('fs');
var path = require('path');

var rootDir = 'C:\\Users\\UX410\\Documents\\NodeJS\\LVTN2018\\Server';
var databaseDir = path.resolve(rootDir,'Database');

fs.readdir(path.resolve(rootDir,'Database'), function (err , dirs) { 
    var result ='';
    for (var dir of dirs) {
        if (dir == 'Khanh') {
            result = dir;
            break;
        }
    }
    if (result) {
        fs.mkdir(path.resolve(rootDir,'Database','Truc'),function (err) { 
            if (err) throw err;
         });
    }
});


module.exports.createUserDir = function (user) {
    fs.readdir(path.resolve(rootDir,'Database'), function (err , dirs) { 
        var result ='';
        for (var dir of dirs) {
            if (dir == user) {
                result = dir;
                break;
            }
        }
        if (!result) {
            fs.mkdir(path.resolve(rootDir,'Database',user),function (err) { 
                if (err) throw err;
             });
        }
    });
}



