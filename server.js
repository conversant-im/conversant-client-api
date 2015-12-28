var connect = require('connect');
var serveStatic = require('serve-static');
var https = require('https');
var fs = require('fs');

//connect().use(serveStatic(__dirname)).listen(9999);
var options = {
    key:    fs.readFileSync('ssl/server.key'),
    cert:   fs.readFileSync('ssl/server.crt')//,
//    ca:     fs.readFileSync('ssl/ca.crt')
};
var app = connect().use(serveStatic(__dirname));
https.createServer(options,app).listen(9999);

