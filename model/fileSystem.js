var fs = require('fs');
var path = require('path');

var rootDir = '../Server';
//var databaseDir = path.resolve(rootDir,'Database');

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
                if (err) console.log(err);
                else {
                    fs.mkdir(path.resolve(rootDir,'Database',user, 'Parameters'),function (err) { 
                        if (err) console.log(err);
                        else console.log('Create folder successfully: Parameters');
                    });
                    fs.mkdir(path.resolve(rootDir,'Database',user, 'Publish'),function (err) { 
                        if (err) console.log(err);
                        else console.log('Create folder successfully: Publish');
                    });
                    fs.mkdir(path.resolve(rootDir,'Database',user, 'Config'),function (err) { 
                        if (err) console.log(err);
                        else console.log('Create folder successfully: Config');
                    });
                }
            });
            
        }
    });
}



