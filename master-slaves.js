const cluster = require('cluster'),
  http = require('http'),
  url = require('url'),
  querystring = require('querystring');

let configs = [{
  server_port: 3001,
  server_id: 1
}, {
  server_port: 3002,
  server_id: 2
}, {
  server_port: 3003,
  server_id: 3
}, {
  server_port: 3004,
  server_id: 4
}];


if(cluster.isMaster) {
  // run workers
  for(var i = 0; i < configs.length; i++) {
    cluster.fork(configs[i]);
  }

  http.createServer(function(req, res) {
    let parsedUrl = url.parse(req.url),
      getParams = querystring.parse(parsedUrl.query);

    if (parsedUrl.pathname === "/server" && getParams.id) {
      let worker = cluster.workers[getParams.id];
      if (!worker) {
        res.end(`\r\nserver with id: ${getParams.id} not exists`);
        return;
      }

      // setup once event to worker to respond on message
      worker.once("message", function (stats) {
        res.write("server: " + worker.id.toString() + "\r\n");
        res.write("status: " + stats + "\r\n");
        res.end("\r\nrun");
      });
      // send message to worker
      worker.send("stats");
    } else {
      res.end("\r\nrun");
    }
  }).listen(3000, function () {
    console.log("listening 3000...");
  });
}


if(cluster.isWorker) {
  let env = process.env;

  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("Hello from " + env.server_id);
  }).listen(env.server_port);

  // setup event on message from server
  process.on("message", (msg) => {
    // response to server
    process.send("ok " + env.server_id);
  });
}
