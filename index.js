const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const axios = require('axios');
require('dotenv').config();
app.use(express.static('js'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  let page = 1;
  socket.emit('available rooms', getActiveRooms(io));
  socket.on('seen movie', (data) => {
    socket.broadcast.to(data[1]).emit('added movie', data[0]);
  });

  socket.on('entered username', (data) => {
    socket.broadcast.to(data[1]).emit('new user', data[0]);
  });

  socket.on('join room', (room) => {
    var clients = io.sockets.adapter.rooms.get(room);
    const numClients = clients ? clients.size : 0;
    if (numClients <= 1) {
      socket.join(room);
      if (numClients == 1) {
        io.to(room).emit('begin');
      } else {
        socket.emit('waiting', room);
      }
    } else {
      socket.emit('full room');
    }
  });

  socket.on('start', (room) => {
    var clients = io.sockets.adapter.rooms.get(room);
    const numClients = clients ? clients.size : 0;
    if (numClients == 2) {
      startCounter(room);
    } else {
      socket.emit('wait for friend');
    }
  });

  function startCounter(room) {
    var counter = 45;
    loadStartingMovies(room);
    interval = setInterval(function () {
      counter--;
      io.to(room).emit('counter', [counter, 'Popular movies']);
      if (counter == 0) {
        page++;
        loadStartingMovies(room);
        counter = 45;
      }
    }, 1000);
  }

  socket.on('reset', function (room) {
    clearInterval(interval);
    io.in(room).emit('done');

    page = 1;
  });

  socket.on('create room', (roomNr) => {
    socket.emit('set username');
    socket.join(roomNr);
    socket.emit('waiting', roomNr);
  });

  function loadStartingMovies(room) {
    axios
      .get(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.MOVIE_DB_API_KEY}&page=${page}`
      )
      .then((json) => {
        io.in(room).emit('fetched movies', json.data);
      });
  }
});

server.listen(process.env.PORT || 3002, () => {
  console.log('app is running');
});

function getActiveRooms(io) {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter((room) => !room[1].has(room[0]));
  // Return only the room name:
  // ==> ['room1', 'room2']
  const res = filtered.map((i) => i[0]);
  return res;
}
