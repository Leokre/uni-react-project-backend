const express = require('express')
const app = express()
const port = process.env.PORT || 5000
port2 = 5001
const cors = require("cors")
const crypto = require("crypto");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser")




//Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors())
app.use(cookieParser())

const db = require("./Database")
const jwt = require("jsonwebtoken")
const jwtKey = "CHANGEMEIMNOTSECURE"
//const frontEnd = "http://192.168.178.29"
const frontEnd = "http://localhost:3000"
const defaultQuickReplies = "Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5"
var cookie = require('cookie')
var chatRooms =[]

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", frontEnd);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});



function authenticateToken(req,res,next){

  if(req == null || req.cookies == undefined) return 
  const token = req.cookies['accessToken']
  //console.log("Token: " + token)

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
  
  db.query(
    "SELECT * FROM USERS WHERE USERNAME='" + username + "';",
    async (err, result) => {
      if(err){
        res.send({err:err});
      }else{
        if(result.length < 1) res.json({auth: false, msg: "UserNamePasswordError"})
          const validPassword = await bcrypt.compare(password, result[0].Password);

        if(!validPassword) res.json({auth: false, msg: "UserNamePasswordError"})
          const user = {name: username, id: result[0].idUser}
          const accessToken = jwt.sign(user,jwtKey)

          res.status(202)
              .cookie("accessToken", accessToken,{sameSite: 'strict',
          path: '/',
          expires: new Date(new Date().getTime() + 604800 * 1000),
          httpOnly: true}).send({auth: true, msg: "CookieInitializing"})
        
      }   
    }
  )
})

app.get("/Logout",(req,res)=>{
  res.cookie("accessToken", "None",{sameSite: 'strict',
  path: '/',
  expires: new Date(0),
        httpOnly: true}).send("LOGOUT_SUCCESS")
})


const genInvCode = () =>{
  return crypto.randomBytes(32).toString('base64')
}

app.post("/getInvCode",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + " AND Berechtigung > 0 ;")
  if(!results[0][0])res.send({msg:"NEED_ADMIN_ACCESS"})

  results = await db.promise().query("Select InvitationCode FROM Sessions WHERE idSession =" + sessionID + "")
  res.send(results[0][0])
  


})

app.post("/Session/changeRole",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID
  const targetID = req.body.userID

  await db.promise().query("CALL changeRole(" + sessionID + "," + userID + "," + targetID + ")").then(function (result) {
    res.status(201).send({msg:"UPDATE_SUCCESS"})
  })
  .catch(next);
  


})


app.post("/genInvCode",authenticateToken,async(req,res,next)=>{
  const userID = req.user.id
  const sessionID = req.body.sessionID

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + " AND Berechtigung > 0 ;")
  if(!results[0][0])res.send({msg:"NEED_ADMIN_ACCESS"})
  
  let invCode= genInvCode()
  db.promise().query("UPDATE Sessions SET InvitationCode='" + invCode + "' WHERE idSession=" + sessionID + "").then(function (result) {
    res.status(201).send({msg:"UPDATE_SUCCESS",InvitationCode: invCode})
  })
  .catch(next);
})


app.post("/addSession",authenticateToken,(req,res,next)=>{
const sessName = req.body.sessionName
const sessTopic = req.body.sessionTopic



if(!sessName) return res.status(201).send({msg: "NO_SESSION_NAME"}) 
if(!sessTopic)return res.status(201).send({msg: "NO_SESSION_TOPIC"})

const userID = req.user.id

console.log("InvCode: " + genInvCode())


  var key = genInvCode();
  // then save the key with the new user in the database
  db.promise().query("INSERT INTO Sessions(SessionName,SessionThema,SessionHost,InvitationCode) VALUES('" + sessName + "','" + sessTopic +"'," + userID + ",'" + key + "')").then(function (result) {
    res.status(201).send({msg: "SESSION_CREATE_SUCCESS"})
  })
  .catch(next);
  





})

app.get("/getUserSessions",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  console.log("getUserSessions triggered" + " userID: " + userID)
  var results = await db.promise().query("SELECT DISTINCT SessionID,SessionName,SessionThema,Berechtigung FROM Sessions NATURAL JOIN GroupUserSession WHERE idSession=SessionID AND UserID= " + userID + "")
 

  console.log(results[0])
  
   res.send(results[0])

  
})


app.post("/setQuickReplies",authenticateToken,(req,res,next)=>{
  console.log("setQuickReplies triggered!")
  console.log(req.body)
  const quickReplies = req.body.quickReplies
  
  if(!quickReplies)res.status(201).send({msg: "ERR_INPUT_EMPTY"})
  
  const userID = req.user.id
  /*
  console.log("UserID: " +userID)
  console.log("sessName: " +sessName)
  console.log("sessTopic: " +sessTopic)
  */
  db.promise().query("UPDATE USERS SET SchnellAntwort='" + quickReplies + "' WHERE idUser=" + userID + "").then(function (result) {
    res.status(201).send("UPDATE_SUCCESS")
  })
  .catch(next);
  
  })

  app.get("/getQuickReplies",authenticateToken,(req,res,next)=>{

    const userID = req.user.id
    /*
    console.log("UserID: " +userID)
    console.log("sessName: " +sessName)
    console.log("sessTopic: " +sessTopic)
    */
    db.promise().query("SELECT SchnellAntwort FROM USERS WHERE idUser=" + userID ).then(function (result) {
      const str = result[0][0].SchnellAntwort
      const replies = str.split(';')
      res.send(replies)
    })
    .catch(next);
    
    })






app.post("/Session/addUser",authenticateToken,async (req,res,next)=>{

  console.log("Session/addUser triggered")
  const inviteCode = req.body.inviteCode
  const userID = req.user.id
  const groupID = 0
  const rights = 0
  console.log("inviteCode: " + inviteCode)
  if(!inviteCode)res.status(201).send("NO_INVITE_CODE")
  

  var sessionID = undefined
 




  
  
    

    await db.promise().query("SELECT * FROM SESSIONS WHERE InvitationCode='" + inviteCode + "';").then(function (result) {
      sessionID = result[0][0].idSession
      console.log("sessionID: " + sessionID)
    })
    .catch(next);


  if(!sessionID) res.send("WRONG_INVITE_CODE")


 

  db.query(
    "INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + groupID + "," + sessionID + "," + userID + "," + rights + ");",
    (err, result) => {
      if(err){
        res.send({err:err});
      }else{
        
          res.json({auth: false, msg: "INSERTION_SUCCESSFUL"})
       
      }
      
    }
  )

  
  })
  
app.post("/Session/removeUser",authenticateToken,async(req,res,next)=>{
const sessionID = req.body.sessionID
const userID = req.body.targetID

console.log("sessionID: " + sessionID)
console.log("targetID: " + userID)
console.log("req.user.id: " + req.user.id)

await db.promise().query("SELECT * FROM SESSIONS WHERE idSession='" + sessionID + "' and SessionHost= " + req.user.id + ";").then(function (result) {
  if(result.length > 0){
    db.promise().query("DELETE FROM GroupUserSession WHERE SessionID =" + sessionID + " and UserID = " + userID + ";").then(res.send({msg:"DELETE_SUCCESS"}))
  }else{
    res.send({msg:"YOU ARE NOT THE HOST OF THAT SESSION"})
  }
})
.catch(next);





})
 

  //Get all Users in Session
app.post("/Session/getUsers",authenticateToken,async (req,res) =>{
  const sessID = req.body.sessionID
  const userID = req.user.id

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + ";")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION")
  results = await db.promise().query("Select SessionID, GruppenID,Berechtigung,UserID,Username FROM GroupUserSession NATURAL JOIN Users WHERE SessionID =" + sessID + " and UserID =idUser ORDER BY GruppenID")
  res.send(results[0])
})

app.get("/Session/Group/getUsers",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const groupID = req.groupID
  const sessID = req.body.sessionID

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= (" + groupID + " OR " + 0 +") OR Berechtigung > 0) ;")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")

  results = await db.promise().query("Select SessionID, GruppenID,Berechtigung,UserID,Username FROM GroupUserSession NATURAL JOIN Users WHERE SessionID =" + req.body.sessionID + " and UserID =idUser and GruppenID = " + groupID + " ORDER BY Username")
  res.send(results[0])
})

app.post("/addUser",async (req,res,next) =>{
 // const {username,password} = req.body
  const user = req.body.username
  const salt = await bcrypt.genSalt(10)
  var pass = ""
  var rng = false
  const clearpass = crypto.randomBytes(32).toString('base64')
  if(req.body.password){
    pass  = await bcrypt.hash(req.body.password, salt)
  }else{
    pass  = await bcrypt.hash(clearpass, salt)
    rng = true
  }

    if(user && rng){
      db.promise().query("INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('" + user + "','" + pass +"','" + defaultQuickReplies + "')").then(function (result) {
        res.status(201).send({msg:"USER_CREATED",pass:clearpass})
      })
      .catch(next);
    }

    if(user && pass){
        db.promise().query("INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('" + user + "','" + pass +"','" + defaultQuickReplies + "')").then(function (result) {
          res.status(201).send("USER_CREATED")
        })
        .catch(next);

    }
    

    //res.send("User: " + username + " Password: " + password)
 
  

})

async function sendMessage(msg,usID,seID,gID){
  const message = msg
  const userID = usID
  const sessID = seID
  const groupID = gID
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

 var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0) ;")
 if(!results[0][0])return"ERR_USER_NOT_IN_SESSION/GROUP"

 if(!message)return"ERR_NO_MESSAGE"

        db.promise().query("INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('" + now + "', " + userID + ", " + sessID + ", " + groupID + ", '" + message + "')").then(function (result) {
          return"MESSAGE_SENT"
        }) 
}

app.post("/Session/sendMessage",authenticateToken,async (req,res,next) =>{
  
   const message = req.body.message
   const userID = req.user.id
   const sessID = req.body.sessionID
   const groupID = req.body.groupID
   const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0) ;")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")


  if(!message)res.send("ERR_NO_MESSAGE")
   
   
        
         db.promise().query("INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('" + now + "', " + userID + ", " + sessID + ", " + groupID + ", '" + message + "')").then(function (result) {
           res.status(201).send("MESSAGE_SENT")
         })
         .catch(next);
 

 })


 app.post("/Session/getMessageLog",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  const groupID = req.body.groupID
  console.log("getMessageLog triggered")
  console.log("userID: " + userID)
  console.log("sessID: " + sessID)
  console.log("groupID: " + groupID)

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0);")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")


  results = await db.promise().query("Select Username,Message,MessTimestamp,MessageID from Messages NATURAL JOIN Users WHERE SessionID = " + sessID + " AND GruppenID = " + groupID + " AND idUser = idUser ORDER BY MessTimestamp;")
  res.send(results[0])

  
})

app.post("/Session/getUserGroups",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("getUserGroups triggered" + " userID: " + userID  + " sessID: " + sessID )
  var results = await db.promise().query("SELECT DISTINCT SessionID,GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID= " + userID + ";")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")

  console.log(results[0])

   res.send(results[0])

  
})

app.post("/Session/getOtherUserGroups",authenticateToken,async (req,res) =>{
  const userID = req.body.userID
  const sessID = req.body.sessionID
  console.log("getOtherUserGroups triggered" + " userID: " + userID  + " sessID: " + sessID )
  var results = await db.promise().query("SELECT DISTINCT SessionID,GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID= " + userID + " ;")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")
  console.log(results[0])
  results[0].forEach(element =>{
    console.log("Element: " + element.GruppenID)
    if(element.GruppenID == 0){
      const index = results[0].indexOf(element)
      if(index > -1) return results[0].splice(index, 1)
    }
  })
   res.send(results[0])

  
})

app.post("/Session/getGroups",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("getGroups triggered" + " sessID: " + sessID )
  var results = await db.promise().query("SELECT DISTINCT GruppenID from GroupUserSession WHERE SessionID= " + sessID + ";")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")

  console.log(results[0])
  results[0].forEach(element =>{
    console.log("Element: " + element.GruppenID)
    if(element.GruppenID == 0){
      const index = results[0].indexOf(element)
      if(index > -1) return results[0].splice(index, 1)
    }
  })
   res.send(results[0])

  
})



app.post("/Session/addGroup",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("addGroup triggered" + " sessID: " + sessID )
  var results = await db.promise().query("SELECT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID = " + userID + " AND Berechtigung >0;")
  if(!results[0][0])res.send({msg: "ERR_NO_ADMIN_PERMISSION"})

  var results = await db.promise().query("SELECT DISTINCT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " ORDER BY GruppenID DESC;")
   let newGroupID = results[0][0].GruppenID+1

   db.promise().query("INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + newGroupID + "," + sessID + "," + userID + "," + 2 + ")").then(function (result) {
    res.status(201).send({msg: "GROUP_CREATE_SUCCESS", id: newGroupID})
  })
  .catch(next);
  
})

app.post("/Session/deleteGroup",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  const groupID = req.body.groupID
  console.log("deleteGroup triggered" + " sessID: " + sessID +"groupID: " + groupID)
  var results = await db.promise().query("SELECT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID = " + userID + " AND Berechtigung >0;")
  if(!results[0][0])res.send({msg: "ERR_NO_ADMIN_PERMISSION"})

   
   db.promise().query("DELETE FROM GroupUserSession WHERE GruppenID = " + groupID +";").then(function (result) {
    res.status(201).send({msg: "DELETE_GROUP_SUCCESS"})
  })
  
})

app.post("/Session/sendInfoRequest",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  console.log("sendInfoRequest triggered" + " sessID: " + sessID )
  var results = await db.promise().query("SELECT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID = " + userID + " AND Berechtigung >0;")
  if(!results[0][0])res.send({msg: "ERR_NO_HOST_PERMISSION"})

   results = await db.promise().query("INSERT INTO GroupUserSession;")

  console.log(results[0])
  
   res.send(results[0])

  
})


app.use(function (err, req, res, next) {
  res.send(err.code)
})

var chatServer = require('http').createServer(app);
var io = require('socket.io')(chatServer);


chatServer.listen(port2,()=>{
  console.log("chatServer running on Port: " + port2)
})






async function addUser(socket,userID,sessID,groupID){
  console.log("addUser triggered")
  console.log("userID: " + userID)
  console.log("sessID: " + sessID)
  console.log("groupID: " + groupID)
  await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= (" + groupID + " OR " + 0 + ") OR Berechtigung > 0);")
  .then((results)=>{
    if(!results[0][0])return-1

    socket.currentRoom = (sessID+"GG"+groupID)
    socket.join(socket.currentRoom)
    return socket.currentRoom

  })
}




app.post("/Session/setUserGroups",authenticateToken,async(req,res,next)=>{
  const sessionID = req.body.sessionID
  const userID = req.body.targetID
  const groups = JSON.parse(req.body.groups)
  console.log("groups")
  console.log(groups)
  var role = 0
  console.log("sessionID: " + sessionID)
  console.log("targetID: " + userID)
  console.log("req.user.id: " + req.user.id)
  
  db.promise().query("DELETE FROM GroupUserSession WHERE SessionID = " + sessionID + " AND UserID=" + userID +" AND GruppenID <> 0").then(function (result) {
      
  })
  .catch(next);
  groups.forEach(element =>{
    console.log("element:")
    console.log(element)
    db.promise().query("SELECT Berechtigung FROM GroupUserSession WHERE SessionID = " + sessionID + " AND UserID=" + userID + " AND GruppenID = 0").then(function (result) {
      console.log("setusergorupseee")
      console.log(result[0][0].Berechtigung)
      role=result[0][0].Berechtigung
      db.promise().query("INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + element + "," + sessionID + "," + userID + "," + role + ")").then(function (result) {  
      })
      .catch(next);
    })
    .catch(next);
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

  sendMessage(data.msg,userID,sessionID,groupID);
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

    sendMessage(data.msg,userID,sessionID,groupID);
  } 


  
  });
  


  socket.on('joinChat',function (data){
    console.log("JOINCHAT TRIGGERED")
    console.log(data)
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
  console.log(`Example app listening at http://localhost:${port}`)
})