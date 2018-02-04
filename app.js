var http = require("http");
var express = require("express");
var consolidate = require("consolidate"); //1
var _ = require("underscore");
var bodyParser = require('body-parser');
//File that contains our endpoints
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/places");

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
  var placeSchema = new mongoose.Schema({
    "type": "",
    "name": "",
    "description": "",
    "phone": "",
    "email": "",
    "address": "",
    "location": {
      "type": "",
      "coordinates": [
        0,
        0
      ]
    }
  });
  var place = mongoose.model("place", placeSchema, "markers");
  var userId
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() { //a connection with the mongodb is established here.
    console.log("Connected to Database");
    var code = 01
    app.get('/', function(req, res) {

      res.render('index.html', {
        code: code
      });
    });
    io.on('connection', function(socket) { //Listen on the 'connection' event for incoming sockets
      console.log('A user just connected'+ socket.id);


      socket.on('join', function(data) {
         userId = data //Listen to any join event from connected users
        socket.join(userId); //User joins a unique room/channel that's named after the userId
        console.log("User joined " + "map");
      });

      //console.log(db.collection("markers").count())
      db.collection("markers").find({}, {}, function(err, docs) {
        docs.each(function(err, doc) {
          if (doc) {
            code = doc
            socket.emit("newmarker", code)
          }
        });
      });
      socket.on("savemarker", function(newmarker) {

        var data = JSON.parse(newmarker)
        console.log("Saving "+data.name);
        var newPlace = new place({
          "type": data.type,
          "name": data.name,
          "description": data.description,
          "phone": data.phone,
          "email": data.email,
          "address": data.address,
          "location": data.location
        })

        newPlace.save(function(error) {
          if (error) {
            console.error(error);
          }
        })
        socket.emit("newmarker", data)
      })
      socket.on('disconnect', function() {
        socket.leave(userId);
        console.log('user left' +socket.id);
      });
    });
  });
});
/* 1. Not all the template engines work uniformly with express, hence this library in js, (consolidate), is used to make the template engines work uniformly. Altough it doesn't have any
modules of its own and any template engine to be used should be seprately installed!*/
