"use strict";

const http = require("http"),
    path = require("path"),
    crypto = require('crypto'),
    express = require("express"),
    logger = require("morgan"),
    bodyParser = require("body-parser"),
    MongoClient = require('mongodb').MongoClient,
    RedisClient = require("redis");

var app = express(),
    redis = RedisClient.createClient(),
    mongodb;

MongoClient.connect('mongodb://localhost:27017/test_app', function(err, db) {
    console.log("Connected correctly to mongoDB");
    mongodb = db;
});

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (request, response) {
    response.set('Content-Type', 'application/json');
});
app.use(function (request, response, next) {
    let token = request.get('X-Auth');
    if (token) {
        let key = 'users:token:' + token;
        redis.get(key, function (error, user) {
            if (error) {
                console.log(error);
            }
            user = user ? JSON.parse(user) : null;
            if (user && new Date(user.tokenExpire) < new Date()) {
                redis.del(key);
                user = null;
            }
            request.currentUser = user;
            next();
        });
    } else {
        request.currentUser = null;
        next();
    }
});
app.use(function (request, response, next) {
    let isSecurePath = -1 !== ['/secure'].indexOf(request.path);

    if (!request.currentUser && isSecurePath) {
        response.status(403).send({error: 'Permission deny'}).end();
    }

    next();
});

app.get("/", function (request, response) {
    response.end('hi!');
});

app.get("/secure", function (request, response) {
    console.log(request.currentUser);
    response.end('cool!');
});

app.post("/user", function (request, response) {
    let user = request.body;

    mongodb.collection('users')
        .find({email: user.email}, {}, {limit: 1}).toArray()
        .then(function (users) {
            if (users.length) {
                throw new Error('User already exists');
            }
            return createHash(user.password);
        })
        .then(function (hash) {
            user.password = hash;
            return mongodb.collection('users').insertOne(user);
        })
        .then(function (result) {
            return mongodb.collection('users')
                .find({email: user.email}, {email: 1}, {limit: 1})
                .toArray();
        })
        .then(function (result) {
            if (!result.length) {
                throw new Error('Database error');
            }
            response.json(result[0]);
            response.end();
        })
        .catch(function (error) {
            response.json({error: error.message});
            response.end();
        });
});

app.post("/login", function (request, response) {
    let user = request.body;
    
    createHash(user.password)
        .then(function (hash) {
            return mongodb.collection('users')
                .find({email: user.email, password: hash}, {}, {limit: 1})
                .toArray();
        })
        .then(function (users) {
            if (!users.length) {
                throw new Error('Wrong credentials');
            }

            let date = new Date();
            createHash(users[0].email + users[0].password + date * 1)
                .then(function (token) {
                    //set expire date +1 day
                    date.setDate(date.getDate() + 1);
                    users[0].tokenExpire = date.toISOString();
                    redis.set('users:token:' + token, JSON.stringify(users[0]));
                    response.json({
                        token: token,
                        expire: date.toISOString()
                    });
                    response.end();
                })
                .catch(function (error) {
                    throw error;
                });
        })
        .catch(function (error) {
            response.json({error: error.message});
            response.end();
        });
});

app.use(function (request, response) {
    response.status(404).render("404");
});

http.createServer(app).listen(3000, function() {
    console.log("Guestbook app started on port 3000.");
});

var createHash = function (data) {
    let hash = crypto.createHash('sha256');

    hash.write(data);
    hash.end();

    return new Promise(function (resolve, reject) {
        hash.on('readable', function () {
            let res = hash.read();
            if (res) {
                resolve(res.toString('hex'));
            }
        });
    });
};
