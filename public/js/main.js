const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const roomList = document.getElementById("rooms");
const temp = document.querySelector("#rooms li");

//Get Username and Room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const socket = io();

//create a random Id
var userId = Math.random().toString(36).slice(2);
var roomId = Math.random().toString(36).slice(2);

//JOIn in room
socket.emit("joinRoom", { username, room, userId, roomId });

//Get room and Users
socket.on("roomUsers", ({ rooms, users }) => {
  outputRoomName(rooms);
  outputUsers(users);
});

//get private User
socket.on("pvtuser", ({ user }) => {
  console.log(user, "...................");
  outputPvtUser(user);
  outputPvtRoom();
  tempToken();
});

//Message event
socket.on("message", (message) => {
  outputMessage(message);
  scrollBottom();
});

//Pvt message
socket.on("pvtmsg", (message) => {
  pvtmessage(message);
  scrollBottom();
});

//scroll down for new messages
scrollBottom = () => {
  chatMessage.scrollTop = chatMessage.scrollHeight;
};


let PvtChat = false;

//Message Submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //Get Message as text
  const msg = e.target.elements.msg.value;

  let time = new Date().toLocaleString("en-us", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  let setMsg = {
    sender: username,
    message: msg,
    time: time,
  };

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  //Emit Message to Serve
  socket.emit("chatMessage", setMsg);

  //clear the message write area
  e.target.elements.msg.value = "";
});


//Private messages
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //Get Message as text
  const msg = e.target.elements.msg.value;

  let time = new Date().toLocaleString("en-us", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  let setMsg = {
    sender: username,
    message: msg,
    time: time,
  };

  if (!setMsg) {
    return false;
  }

  //Emit Message to Serve
  socket.emit("pvtMessage", setMsg);

  //clear the message write area
  e.target.elements.msg.value = "";
});

//Output Message to Dom
outputMessage = (message) => {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class ="text"> ${message.text} </p>`;
  chatMessage.appendChild(div);
};


//Pvt Message Chat
pvtmessage = (message) => {
  const div = document.createElement("div");
  div.classList.add("pvtmsg");

  div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class ="text"> ${message.text} </p>`;
  pvtchat.appendChild(div);
};


//Add room name to DOM
let outputRoomName = (rooms) => {
  roomList.innerHTML = "";
  rooms.forEach((elements) => {
    const li = document.createElement("li");
    li.innerHTML = elements;
    li.addEventListener("click", (e) => {
      let room = elements;
      socket.emit("joinRoom", { username, room, userId, roomId });
    });
    roomList.appendChild(li);
  });
};


//Private room
let outputPvtRoom = () => {
  roomList.innerHTML = "";
  const li = document.createElement("li");
  li.innerHTML = "Pvt-Room";
  roomList.appendChild(li);
};


//Get all Users name
let outputUsers = (users) => {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    li.addEventListener("click", (e) => {
      if (username !== user.username) {
        localStorage.setItem("sender", username);
        localStorage.setItem("receiver", user.username);
        PvtChat = true;
        socket.emit("joinpvt", { receiver: user.username, sender: username });
        // window.location.href = "./pvtchat.html";
      }
    });
    userList.appendChild(li);
  });
};


//Output private userlist
let outputPvtUser = (user) => {
  userList.innerHTML = "";
  const li = document.createElement("li");
  li.innerText = user;
  userList.appendChild(li);
};


