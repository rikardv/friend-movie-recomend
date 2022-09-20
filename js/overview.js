var socket = io();
var form = document.getElementById('form');
var input = document.getElementById('input');
let myItems = [];
let incomingItems = [];
let shouldSee = [];
let activeRoom = -1;
let joinedUser = undefined;

socket.on('done', function () {
  document.getElementById('myside').style.display = 'none';
  document.getElementById('friendside').style.width = '100%';
});

socket.on('counter', function (data) {
  document.getElementById('start').style.display = 'none';
  document.getElementById('category').textContent = data[1];
  var timer = document.getElementById('timer');
  timer.textContent = 'Showing new movies in: ' + data[0];

  if (data[0] < 10) {
    timer.style.color = '#FF9494';
  } else {
    timer.style.color = 'white';
  }
});

socket.on('available rooms', function (rooms) {
  rooms.forEach((element) => {
    var btn = document.createElement('button');
    btn.className = 'button-37';
    btn.textContent = element;
    btn.onclick = () => joinRoom(element);
    available.appendChild(btn);
  });
});

function joinRoom(e) {
  socket.emit('join room', e);
  hideStartView();
  activeRoom = e;
}

function initialLoad() {
  var element = document.getElementById('rootelement');
  element.style.display = 'none';
  shouldSeeMovies.innerHTML = '';
}

function requestMore() {
  socket.emit('request more movies', activeRoom);
}

socket.on('waiting', function (roomNr) {
  var element = document.getElementById('startview');
  element.style.display = 'none';
  var waiting = document.createElement('div');
  waiting.textContent = 'Tell your friend to join room: ' + roomNr;

  document.body.appendChild(waiting);
});

socket.on('full room', function () {
  var waiting = document.createElement('div');
  var btn = document.getElementById('joinbtn');
  btn.style.display = 'none';
  waiting.textContent = 'The room is full';
  document.body.appendChild(waiting);
});

socket.on('added movie', function (movie) {
  incomingItems.push(movie.id);
  countMatches(incomingItems, myItems);
  if (
    !shouldSee.some((obj) => obj.id === movie.id) &&
    !myItems.includes(movie.id)
  ) {
    shouldSee.push(movie);
  }
  var element = document.getElementById('nrselected');
  element.textContent =
    joinedUser + ' has reviewed : ' + incomingItems.length + ' movies.';
  renderShouldSee();
});

function setTitle(e) {
  myItems.push(e.id);
  countMatches(incomingItems, myItems);
  shouldSee = shouldSee.filter(function (obj) {
    return obj.id !== e.id;
  });
  renderShouldSee();
  var elemt = document.getElementById('mynrselected');
  elemt.textContent = 'You have reviewed: ' + myItems.length + ' movies.';
  var elem = document.getElementById(e.id);
  elem.style.display = 'none';
  socket.emit('seen movie', [e, activeRoom]);
}

function handleUnseen(e) {
  var elem = document.getElementById(e.id);
  elem.style.display = 'none';
}

function countMatches(array1, array2) {
  let compare = (a1, a2) => array1.reduce((a, c) => a + array2.includes(c), 0);

  var maxLength = Math.max(array1.length, array2.length);
  var diff = maxLength > 0 ? compare(array1, array2) / maxLength : 0;
  var elmt = document.getElementById('matches');
  elmt.textContent = ' ' + diff * 100 + '%' + ' movies in common.';
  if (diff > 0.3) {
    elmt.style.color = '#4BB543';
  } else {
    elmt.style.color = '#FF9494';
  }
}

socket.on('new user', function (user) {
  joinedUser = user;
  matches.textContent = user + ' has joined you!';
});

socket.on('begin', function () {
  if (!joinedUser) {
    let person = prompt('Enter your name', '');
    socket.emit('entered username', [person, activeRoom]);
  }

  displayRootView();
  hideStartView();
  4;
});

socket.on('fetched movies', function (json) {
  //   displayRootView();
  //   hideStartView();
  messages.innerHTML = '';
  json.results.forEach((element) => {
    var item = createMovieElement(element);
    var seenbtn = document.createElement('button');
    var thumbicon = document.createElement('i');
    thumbicon.className = 'fa fa-thumbs-up';
    var crossicon = document.createElement('i');
    crossicon.className = 'fa fa-times';
    seenbtn.onclick = () => setTitle(element);
    seenbtn.className = 'button-37';
    seenbtn.appendChild(thumbicon);
    var unseenbtn = document.createElement('button');
    unseenbtn.onclick = () => handleUnseen(element);
    unseenbtn.className = 'button-37';
    unseenbtn.style.backgroundColor = '#374151';
    unseenbtn.appendChild(crossicon);
    item.appendChild(seenbtn);
    item.appendChild(unseenbtn);
    messages.appendChild(item);
  });
});

function renderShouldSee() {
  shouldSeeMovies.innerHTML = '';
  var usertext = document.createElement('h3');
  usertext.style.width = '100%';
  usertext.textContent = joinedUser + ' recommend that you see these movies';
  shouldSeeMovies.appendChild(usertext);
  shouldSee.forEach((element) => {
    var item = createMovieElement(element);
    shouldSeeMovies.appendChild(item);
  });
}

function createRoom() {
  var roomNr = Math.floor(Math.random() * 100);
  socket.emit('create room', roomNr);
  activeRoom = roomNr;
}

function hideStartView() {
  var element = document.getElementById('startview');
  element.style.display = 'none';
}

function displayRootView() {
  var element = document.getElementById('rootelement');
  element.style.display = 'block';
}

function createMovieElement(element) {
  var item = document.createElement('div');
  item.className = 'movie';
  item.id = element.id;
  var p = document.createElement('p');
  p.textContent = element.original_title;
  var image = document.createElement('img');
  image.src = 'http://image.tmdb.org/t/p/w500' + element.poster_path;
  item.appendChild(p);
  item.appendChild(image);

  return item;
}

function startTimer() {
  document.getElementById('movie-header-title').textContent =
    'Have I seen and liked any of these movies?';
  socket.emit('start', activeRoom);
}

function quit() {
  socket.emit('reset', activeRoom);
}
