var cluster = require('cluster'),
  os = require('os'),
  http = require('http');

if (cluster.isMaster) {
  for (var i = 0, cpuCount = os.cpus().length; i < cpuCount; i++) {
    cluster.fork({"server_number": i});
  }
} else {
  var env = process.env;
    
  var server = http.createServer(function (req, res) {
    res.end("Hello from server #" + env.server_number);
  });

  server.listen(8787, function () {
    console.log("listen 8787...");
  });
}
