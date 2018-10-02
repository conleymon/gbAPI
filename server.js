var http = require('http');
var fs = require('fs');
var url = require('url');
var mime = require('mime-types');
http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    try{
        fs.readFile('.'+q.pathname, function(err, data) {
            var mimetype=mime.lookup(q.pathname)
            if(!err){    
                res.writeHead(200, {'Content-Type': mimetype});
                res.write(data);
                res.end();
            }else{
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write('file not found');
                res.end();
            }
        });
	}catch(e){
        console.log(e.message)
	}
}).listen(8080);