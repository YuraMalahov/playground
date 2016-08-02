var cluster = require('cluster'),
  os = require('os'),
  http = require('http');

if (cluster.isMaster) {
  var i = 0;
    
  for (var cpuCount = os.cpus().length; i < cpuCount; i++) {
    cluster.fork({"server_number": i});
  }

  cluster.on('exit', function (worker) {
    console.log('Worker %d died :(', worker.id);
    cluster.fork({"server_number": ++i});
  });
} else {
  var env = process.env;

  var server = http.createServer(function (req, res) {
    res.end("Hello from server #" + env.server_number);
  });

  server.listen(8787, function () {
    console.log("listen 8787...");
  });
}
