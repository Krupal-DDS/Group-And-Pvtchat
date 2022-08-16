const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const Groups = require("./model/group");
const PvtMsgs = require("./model/pvtMsg");
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  userLeave,
  formatMessage,
  joinPvt,
} = require("./utils/user");
const { response } = require("express");
const { time } = require("console");
// const main = require('./public/js/main');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static file
app.use(express.static(path.join(__dirname, "public")));

const uri =
  "mongodb+srv://test01:Test1234@cluster0.qqmbkuu.mongodb.net/Wishchat?retryWrites=true&w=majority";
//Store Message in Database
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log("connect to Database");
    }

    //for create token
    let getToken = (sender, receiver) => {
      let key = [sender, receiver].sort().join("_");
      return key;
    };

    const NewUser = "Wishchat Admin";
    //connect the socket
    io.on("connection", (socket) => {
      console.log("connect to socket....");
      socket.on("joinRoom", async ({ username, room, userId, roomId }) => {
        const user = userJoin(socket.id, username, room, userId, roomId);
        if (user.room) {
          newUser = { username: username, userId: userId };
          const group = await Groups.find({ GroupName: user.room });
          if (group.length == 0) {
            await new Groups({
              socketId: socket.id,
              GroupName: room,
              Groups: roomId,
              Users: newUser,
            })
              .save()
              .then(() => {
                console.log("Data stored");
              })
              .catch((error) => {
                console.log(error.message);
              });
          } else {
            const allUser = group[0].Users;
            const find = allUser.find((User) => User.username == user.username);
            if (find) {
              console.log("User Is Already Exits");
              const OldMsgs = group[0].messages;
              if (OldMsgs.length > 0) {
                allSender = OldMsgs.map((sender) => sender.sender);
                allMessages = OldMsgs.map((sender) => sender.message);
                for (let i = 0; i < allMessages.length; i++) {
                  socket.emit(
                    "message",
                    formatMessage(allSender[i], allMessages[i])
                  );
                }
              }
            } else {
              Groups.findOneAndUpdate(
                { GroupName: user.room },
                {
                  $push: { Users: { username: user.username, userId: userId } },
                },
                (error, response) => {
                  if (error) {
                    console.log(error.message);
                  } else {
                    console.log("User is Added In Group");
                  }
                }
              );
            }
          }
          console.log("into chat");
          socket.join(user.room);

          //Welcome
          socket.emit(
            "message",
            formatMessage(
              NewUser,
              `Hello! ${user.username} welcome to Wishchat`
            )
          );

          //broadcast
          socket.broadcast
            .to(user.room)
            .emit(
              "message",
              formatMessage(NewUser, `${user.username} is connect to chat`)
            );

          //Send Users and Room details
          const data = await Groups.find();
          const found = await Groups.find({ GroupName: user.room });
          const rooms = data.map((roomName) => roomName.GroupName);
          io.to(user.room).emit("roomUsers", {
            rooms: rooms,
            users: found[0].Users.map((data) => data),
          });
        }
      });

      //Join in private chat
      socket.on("joinpvt", async ({ receiver, sender }) => {
        console.log('innnnnnnnnnnn');
        const user = joinPvt(sender);
        if (receiver !== sender) {
          socket.emit(
            "message",
            formatMessage(
              NewUser,
              `${user?.username} is Connected The Private Chat`
            )
          );
        }
        io.emit("pvtuser", {
          user: receiver,
        });
        let token = getToken(sender, receiver);
        const findtoken = await PvtMsgs.findOne({ token: token });
        if (findtoken) {
          console.log("token is already created");
        } else {
          let data = {
            token: token,
            messages: [],
          };
          await new PvtMsgs(data).save().then(() => {
            console.log("Sender Is Store In DB");
          });
        }
      });
      

      //Listen chat Message
      socket.on("chatMessage", (setMsg) => {
        const user = getCurrentUser(socket.id);
        console.log(user, ".......user");

        let Msg = {
          sender: setMsg.sender,
          message: setMsg.message,
        };
        Groups.findOneAndUpdate(
          { GroupName: setMsg.room },
          { $push: { messages: Msg } },
          (error, response) => {
            if (error) {
              console.log(error.message);
            } else {
              io.to(setMsg?.room).emit(
                "message",
                formatMessage(setMsg.sender, setMsg.message)
              );
            }
          }
        );
      });


      // For the private message
      socket.on("PvtMessage", (setMsg) => {
        console.log(setMsg, ".......pvtmessage");
        const user = getCurrentUser(socket.id);

        let data = {
          sender: setMsg.sender,
          receiver: setMsg.receiver,
          message: setMsg.message,
        };
        token = getToken(data.sender, data.receiver);
        PvtMsgs.findOneAndUpdate(
          { token: token },
          { $push: { messages: data } },
          (error, response) => {
            if (error) {
              throw error;
            } else {
              console.log("Message Saved");
              io.emit("message", formatMessage(setMsg.sender, setMsg));
            }
          }
        );

      });

      //disconnect
      socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if (user) {
          io.to(user.room).emit(
            "message",
            formatMessage(NewUser, `${user.username} is Disconnect the Chat`)
          );

          io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      });
    });
  }
);

server.listen(8001, () => {
  console.log("connected to server");
});
  