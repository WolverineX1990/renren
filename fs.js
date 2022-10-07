var fs = require('fs');

function appendFile(file, data) {
    return new Promise(function(resolve, reject) {
        fs.appendFile(file, data, 'utf8', function(err) {  
            if (err) reject(err);
            resolve(); 
        });
    });
}

module.exports = appendFile;
 