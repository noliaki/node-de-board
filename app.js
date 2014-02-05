var
  io = require('socket.io').listen(8081),
  fs = require('fs'),

  connectedUser = {},

  imgData = "";

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

// enable all transports (optional if you want flashsocket support, please note that some hosting
// providers do not allow you to create servers that listen on a port different than 80 or their
// default port)
io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

io.sockets.on("connection", function(socket) {

  socket.emit("setData", connectedUser);

  socket.on("addUser", function( data ){
    connectedUser[this.id] = data;
    this.broadcast.emit("addUser", data);
  });

  socket.on("checkName", function( data ){
    var
    available = true,
    key = "";

    for(key in connectedUser){
      if( connectedUser[key] === data ){
        available = false;
        break;
      }
    }
    this.emit("checkName", available);
  });

  socket.on("mousemove", function( data ){
    io.sockets.emit("mousemove", data);
  });

  socket.on("drawCircle", function( data ){
    io.sockets.emit("drawCircle", data);
  });

  socket.on("drawLine", function( data ){
    io.sockets.emit("drawLine", data);
  });

  socket.on("inputText", function( data ){
    io.sockets.emit("inputText", data);
  });

  socket.on("chat", function( data ){
    io.sockets.emit("chat", data);
  });

  socket.on("disconnect", function( data ){
    io.sockets.emit("disConnect", connectedUser[this.id]);
    connectedUser[this.id] = null;
    delete connectedUser[this.id];
  });

  socket.on("saveImage", function( data ){
    imgData = data;
    console.log( imgData );
  });
});

process.on('uncaughtException', function(err) {
  console.log(err);
});