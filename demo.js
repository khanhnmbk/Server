var fs = require('fs');
var path = require('path');

var userFolder = 'C:\\Users\\UX410\\Documents\\NodeJS\\LVTN2018\\Server\\Database\\nmkhanhbk@gmail.com';

fs.readdir(userFolder, function (err, files) {
    arrConfig = [];
    if (err) throw err;
    files.forEach(function (file) {
        if (path.extname(file) == '.json') {
            fs.readFile(path.resolve(userFolder, file), function (err,data) {
                //console.log(JSON.parse(data));
                arrConfig.push(JSON.parse(data));
                console.log(arrConfig[0].PLCs[0].name);
            });
        }
    });

    
    
});