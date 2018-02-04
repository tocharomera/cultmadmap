var http = require("http");
var express = require("express");
var consolidate = require("consolidate"); //1
var _ = require("underscore");
var bodyParser = require('body-parser');

var routes = require('./routes'); //File that contains our endpoints
var mongoClient = require("mongodb").MongoClient;

var app = express();
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(bodyParser.json({
  limit: '5mb'
}));

app.set('views', 'views'); //Set the folder-name from where you serve the html page.
app.use(express.static('./public')); //setting the folder name (public) where all the static files like css, js, images etc are made available

app.set('view engine', 'html');
app.engine('html', consolidate.underscore); //Use underscore to parse templates when we do res.render

var server = http.Server(app);
var portNumber = 8000; //for locahost:8000
var io = require('socket.io')(server); //Creating a new socket.io instance by passing the HTTP server object
var id = 0;
var coordinates = 0
server.listen(portNumber, function() { //Runs the server on port 8000
  console.log('Server listening at port ' + portNumber);
  var coord = "00"
  var userId
  var url = 'mongodb://localhost:27017/places'; //Db name
  mongoClient.connect(url, function(err, database) { //a connection with the mongodb is established here.
    console.log("Connected to Database");
    db = database
    app.get('/', function(req, res) {
      io.on('connection', function(socket) { //Listen on the 'connection' event for incoming sockets
        console.log('A user just connected');
        socket.on('join', function(data) { //Listen to any join event from connected users
          socket.join(data.userId); //User joins a unique room/channel that's named after the userId
          console.log("User joined room: " + data.userId);
        });
  
      //console.log(db.collection("markers").count())
      db.collection("markers").find({},{}, function(err, docs) {
        docs.each(function(err, doc) {
          if (doc) {
            id = doc.id
            coordinates = doc.location.coordinates
            console.log(coordinates+",end");
            socket.emit("newmarker", {coordinates: coordinates+",end"})
          }
        });
      });
      });
      res.render('index.html', {

        userId: id,
        coord: coordinates

      });
    });




  });
});

/* 1. Not all the template engines work uniformly with express, hence this library in js, (consolidate), is used to make the template engines work uniformly. Altough it doesn't have any
modules of its own and any template engine to be used should be seprately installed!*/
