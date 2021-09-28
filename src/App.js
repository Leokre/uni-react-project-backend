const express = require('express')
const app = express()
const port = process.env.PORT || 5000
port2 = 5001
const cors = require("cors")
const crypto = require("crypto");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser")
const mSessions = require("./model/sessions.js")
const mMessages = require("./model/messages.js")
const mUsers = require("./model/users.js")


//Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors())
app.use(cookieParser())

const db = require("./config/Database")
const jwt = require("jsonwebtoken")
const jwtKey = "CHANGEMEIMNOTSECURE"
const frontEnd = "http://localhost:3000"
const defaultQuickReplies = "Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5"
var cookie = require('cookie')
var chatRooms =[]

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", frontEnd);
  res.header("Access-Control-Allow-Credentials", "true");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



function generateToken(username,userID){
  const user = {name: username, id: userID}
  const accessToken = jwt.sign(user,jwtKey)
  return accessToken
}

function authenticateToken(req,res,next){

  if(req == null || req.cookies == undefined) return 
  const token = req.cookies['accessToken']

  if(token == null || req.cookies == undefined) return res.send("NO_TOKEN")
  jwt.verify(token, jwtKey,(err,user)=>{
    if(err) return res.send("WRONG_TOKEN")
    req.user = user
    next()
  })
  
}






app.get("/checkAuth",authenticateToken,(req,res)=>{

res.json({auth:true,user:req.user})
})



app.post("/Login", async (req,res) => {
  const {username,password} = req.body
  
  var result = await mUsers.getUserByName(username)

  if(result.length < 1) return res.json({auth: false, msg: "UserNamePasswordError"})
  const validPassword = await bcrypt.compare(password, result[0].Password);

  if(!validPassword) return res.json({auth: false, msg: "UserNamePasswordError"})
  const accessToken = generateToken(username,result[0].idUser)

  res.status(202)
      .cookie("accessToken", accessToken,{sameSite: 'strict',
  path: '/',
  expires: new Date(new Date().getTime() + 604800 * 1000),
  httpOnly: true}).send({auth: true, msg: "CookieInitializing"})
      
})

app.get("/Logout",(req,res)=>{
  res.cookie("accessToken", "None",
  {
  sameSite: 'strict',
  path: '/',
  expires: new Date(0),
  httpOnly: true
  }).send("LOGOUT_SUCCESS")
})


const genInvCode = () =>{
  return crypto.randomBytes(32).toString('base64')
}

app.post("/getInvCode",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID

  
  res.send(await mSessions.getInvCode(userID,sessionID))


})

app.post("/Session/changeRole",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID
  const targetID = req.body.userID


  res.send(await mSessions.changeRole(userID,sessionID,targetID))
 
  


})


app.post("/genInvCode",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID
  let invCode= genInvCode()

  res.send(await mSessions.setInvCode(userID,sessionID,invCode))

})


app.post("/addSession",authenticateToken,async (req,res,next)=>{
  const userID = req.user.id
  const sessName = req.body.sessionName
  const sessTopic = req.body.sessionTopic
  const invCode = genInvCode();

  res.send(await mSessions.addSession(userID,sessName,sessTopic,invCode))

})

app.get("/getUserSessions",authenticateToken,async (req,res) =>{
  const userID = req.user.id

  res.send(await mUsers.getUserSessions(userID))
  
})


app.post("/setQuickReplies",authenticateToken,async (req,res,next)=>{
  const userID = req.user.id
  const quickReplies = req.body.quickReplies
  
  res.send(await mUsers.setQuickReplies(userID,quickReplies))
  
  })

  app.get("/getQuickReplies",authenticateToken,async (req,res,next)=>{
    const userID = req.user.id

    res.send(await mUsers.getQuickReplies(userID))
    
    })






app.post("/Session/addUser",authenticateToken,async (req,res,next)=>{

  const inviteCode = req.body.inviteCode
  const userID = req.user.id
  
  res.send(await mSessions.addUser(userID,inviteCode))

  
  })
  
app.post("/Session/removeUser",authenticateToken,async(req,res,next)=>{
const sessionID = req.body.sessionID
const userID = req.user.id
const targetID = req.body.targetID

res.send(await mSessions.removeUser(userID,targetID,sessionID))

})
 

 
app.post("/Session/getUsers",authenticateToken,async (req,res) =>{
  const sessID = req.body.sessionID
  const userID = req.user.id
  res.send(await mSessions.getUsers(userID,sessID))


})

app.get("/Session/Group/getUsers",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const groupID = req.groupID
  const sessID = req.body.sessionID

  res.send(await mSessions.getUsers(sessID,userID,groupID))

 
})

app.post("/addUser",async (req,res,next) =>{
  const user = req.body.username
  const salt = await bcrypt.genSalt(10)
  var pass = ""
  var rng = false
  const clearpass = await crypto.randomBytes(32).toString('base64')

  if(!user) return res.send("NO_USERNAME")

  if(req.body.password){
    pass  = await bcrypt.hash(req.body.password, salt)
  }else{
    pass  = await bcrypt.hash(clearpass, salt)
    rng = true
  }
    
  if(rng){

    if(await mUsers.insertUser(user,pass) == "USER_CREATED"){
      res.status(201).send({msg:"USER_CREATED",pass:clearpass})
    }
    
  }

  else if(pass){
    if(await mUsers.insertUser(user,pass) == "USER_CREATED"){
      res.status(201).send("USER_CREATED")
    }

  }
    

})






 app.post("/Session/getMessageLog",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  const groupID = req.body.groupID

  res.send(await mMessages.getMessageLog(userID,sessID,groupID))

  
})

app.post("/Session/getUserGroups",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID

  res.send(await mSessions.getGroups(sessID,userID))

  
})

app.post("/Session/getOtherUserGroups",authenticateToken,async (req,res) =>{
  const userID = req.body.userID
  const sessID = req.body.sessionID
  console.log("getOtherUserGroups triggered" + " userID: " + userID  + " sessID: " + sessID )
  var results = await mSessions.getGroups(sessID,userID)

  console.log(results)
  results.forEach(element =>{
    console.log("Element: " + element.GruppenID)
    if(element.GruppenID == 0){
      const index = results.indexOf(element)
      if(index > -1) return results.splice(index, 1)
    }
  })
   res.send(results)

  
})

app.post("/Session/getGroups",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("getGroups triggered" + " sessID: " + sessID )
  var results = await mSessions.getGroups(sessID,userID)

  console.log(results)
  results.forEach(element =>{
    console.log("Element: " + element.GruppenID)
    if(element.GruppenID == 0){
      const index = results.indexOf(element)
      if(index > -1) return results.splice(index, 1)
    }
  })
   res.send(results)

  
})



app.post("/Session/addGroup",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("addGroup triggered" + " sessID: " + sessID )

  res.send(await mSessions.addGroup(userID,sessID))

  
})

app.post("/Session/deleteGroup",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  const groupID = req.body.groupID


  res.send(await mSessions.deleteGroup(userID,sessID,groupID))

  
})

/* app.post("/Session/sendInfoRequest",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("sendInfoRequest triggered" + " sessID: " + sessID )
  var results = await db.promise().query("SELECT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID = " + userID + " AND Berechtigung >0;")
  if(!results[0][0]) return res.send({msg: "ERR_NO_HOST_PERMISSION"})

   results = await db.promise().query("INSERT INTO GroupUserSession;")

  console.log(results[0])
  
   res.send(results[0])

  
}) */


app.use(function (err, req, res, next) {
  res.send(err.code)
})

var chatServer = require('http').createServer(app);
var io = require('socket.io')(chatServer);


chatServer.listen(port2,()=>{
  console.log("chatServer running on Port: " + port2)
})






async function addUser(socket,userID,sessID,groupID){

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= (" + groupID + " OR " + 0 + ") OR Berechtigung > 0);").catch((err)=>{return err})
  if(!results[0][0]) return -1

  socket.currentRoom = (sessID+"GG"+groupID)
  socket.join(socket.currentRoom)
  return socket.currentRoom
 
}




app.post("/Session/setUserGroups",authenticateToken,async(req,res,next)=>{
  const sessionID = req.body.sessionID
  const userID = req.body.targetID
  const groups = JSON.parse(req.body.groups)
  var role = 0

  
  var result = await db.promise().query("DELETE FROM GroupUserSession WHERE SessionID = " + sessionID + " AND UserID=" + userID +" AND GruppenID <> 0").catch((err)=>{res.send(err)})

  groups.forEach(async element =>{
    result = await db.promise().query("SELECT Berechtigung FROM GroupUserSession WHERE SessionID = " + sessionID + " AND UserID=" + userID + " AND GruppenID = 0").catch((err)=>{res.send(err)})
    role=result[0][0].Berechtigung
    result = await db.promise().query("INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + element + "," + sessionID + "," + userID + "," + role + ")").catch((err)=>{res.send(err)})
      
  })
})

io.on('connection',function (socket) {
    console.log("User connecting")

  if(!socket.handshake.headers.cookie) return -1
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  var currUser;
  var token = cookies.accessToken

  jwt.verify(token, jwtKey,(err,user)=>{
    if(err) return res.send("WRONG_TOKEN")
    currUser = user
  })
  if(currUser == undefined) return res.send("NO_TOKEN")


  var addedUser = false;
  socket.username = currUser.name;
  socket.userID = currUser.id;
  addedUser = true;
      

  socket.emit('login');
  console.log("User connected")    
 

  
  socket.on('newMessage', function (data) {
    const username = socket.username
    const userID = socket.userID
    const sessionID = socket.currentRoom.split('GG')[0]
    const groupID = socket.currentRoom.split('GG')[1]
  
  io.to(socket.currentRoom).emit('newMessage', {
    username: username,
    message: data.msg,
    time: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });

  mMessages.sendMessage(data.msg,userID,sessionID,groupID);
  });


  socket.on('infoRequest', function (data) {
    const username = socket.username
    const userID = socket.userID
    const sessionID = socket.currentRoom.split('GG')[0]
    const groupID = socket.currentRoom.split('GG')[1]
  

  var rooms = io.sockets.adapter.sids[socket.id]; for(var room in rooms) 
  {
    room.emit('newMessage', {
    username: username,
    message: data.msg,
    time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })

    mMessages.sendMessage(data.msg,userID,sessionID,groupID);
  } 


  
  });
  


  socket.on('joinChat',function (data){
    var rooms = io.sockets.adapter.sids[socket.id]; for(var room in rooms) {socket.leave(room)} 

    addUser(socket,socket.userID,data.sessID,data.groupID)

  })

  socket.on('getCurrentRoom',function (data){
    socket.emit('serverMessage',"UserID :" + socket.userID +" | socket.currentRoom = " + socket.currentRoom)
    console.log(socket.rooms)
  })

  
  
  
  socket.on('disconnect', function () {
  if (addedUser) {
    
    socket.broadcast.emit('user left', socket.username);
  }
  });
  });


app.listen(port,'0.0.0.0', () => {
  console.log(`Backend listening at http://localhost:${port}`)
})