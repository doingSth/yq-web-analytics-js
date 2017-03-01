/*global Buffer*/
var express = require("express"),
    http = require("http"),
    app = express();

var config = { db: "mongodb://localhost/mtperf" },
    mongoose = require('mongoose');

var DataSchema = new mongoose.Schema({
    app: String,
    uuid: Number,
    page: String,
    ci: Number,
    ip: String,
    ua: String,
    data: String
});

var LogData = mongoose.model('Data', DataSchema);

app.get("/_mta.gif", function (request, response) {
    var imgHex = '47494638396101000100800000dbdfef00000021f90401000000002c00000000010001000002024401003b',
        imgBinary = new Buffer(imgHex, 'hex');

    response.writeHead(200, {'Content-Type': 'image/gif' });
    response.end(imgBinary, 'binary');

    // Do MySQL/Redis/MongoDB logging
    var data = new LogData({
        app: request.query.app,
        uuid: request.query.uuid,
        page: request.query.pg,
        ci: request.query.ci,
        ip: request.ip,
        ua: request.get('User-Agent'),
        data: JSON.stringify(request.query)
    });

    console.log(data);
    mongoose.connect(config.db);
    data.save(function (error, obj) {
    });

});

app.get("*", function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain' });
    response.end('');
});

http.createServer(app).listen(8888);
