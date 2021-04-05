const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require("cors")
const cookieParser = require("cookie-parser")


/*    TODO
1. Password encryption
2. Change JWT key





6. Move defaultPassword to backend
7. Make /Session/addUser asynchronous
8. (Change visiblity of session members depending on current User)

*/







//Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors())
app.use(cookieParser())

const db = require("./Database")
const jwt = require("jsonwebtoken")
const jwtKey = "CHANGEMEIMNOTSECURE"
const frontEnd = "http://localhost:3000"
const defaultQuickReplies = "Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5"


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", frontEnd);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});



function authenticateToken(req,res,next){
  //const authHeader = req.headers['authorization']
  const token = req.cookies['accessToken']
  console.log("Token: " + token)
 // if(token == null) return res.sendStatus(401)
  if(token == null) return res.send("NO_TOKEN")
  jwt.verify(token, jwtKey,(err,user)=>{
    //if(err) return res.sendStatus(403)
    if(err) return res.send("WRONG_TOKEN")
    req.user = user
    next()
  })
  
}



app.get("/checkAuth",authenticateToken,(req,res)=>{

res.json({auth:true,user:req.user})
})

app.post("/Login", (req,res) => {
  const {username,password} = req.body
  db.query(
    "SELECT * FROM USERS WHERE USERNAME='" + username + "';",
    (err, result) => {
      if(err){
        res.send({err:err});
      }else{
        if(result.length > 0){
            
          if(password === result[0].Password){
            const user = {name: username, id: result[0].idUser}
            const accessToken = jwt.sign(user,jwtKey)
            //res.json({auth:true,user,accessToken: accessToken})
            res.status(202)
               .cookie("accessToken", accessToken,{sameSite: 'strict',
            path: '/',
            expires: new Date(new Date().getTime() + 100000000 * 1000),
                  httpOnly: true}).send("cookie being initialized")
          }else{
            res.json({auth: false, msg: "UserNamePasswordError"})
          }
          
        }else{
          res.json({auth: false, msg: "UserNamePasswordError"})
        }
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




app.post("/addSession",authenticateToken,(req,res,next)=>{
const sessName = req.body.sessionName
const sessTopic = req.body.sessionTopic

if(!sessName)res.status(201).send({msg: "NO_SESSION_NAME"})
if(!sessTopic)res.status(201).send({msg: "NO_SESSION_TOPIC"})

const userID = req.user.id
/*
console.log("UserID: " +userID)
console.log("sessName: " +sessName)
console.log("sessTopic: " +sessTopic)
*/
db.promise().query("INSERT INTO Sessions(SessionName,SessionThema,SessionHost) VALUES('" + sessName + "','" + sessTopic +"'," + userID + ")").then(function (result) {
  res.status(201).send({msg: "Created Session"})
})
.catch(next);

})

app.post("/setQuickReplies",authenticateToken,(req,res,next)=>{
  console.log(req.body)
  const quickReplies = req.body.quickReplies
  
  if(!quickReplies)res.status(201).send({msg: "QUICK REPLIES EMPTY"})
  
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
  const sessName = req.body.sessionName
  const user = req.body.targetName
  const groupID = req.body.groupID
  const rights = req.body.authority
  if(!sessName)res.status(201).send("NO_SESSION_NAME")
  if(!user)res.status(201).send("NO_USER")
  if(!groupID)res.status(201).send("NO_GROUP_SET")
  if(!rights)rights = 0
  
  var userID = undefined
  var sessionID = undefined
 
  console.log("User: " + user)
  console.log("sessName: " + sessName)
  console.log("groupID: " + groupID)
  console.log("rights: " + rights)


  
    await db.promise().query("SELECT * FROM USERS WHERE USERNAME='" + user + "';").then(function (result) {
      userID = result[0][0].idUser
      console.log("userID: " + userID)
    })
    .catch(next);
    

    await db.promise().query("SELECT * FROM SESSIONS WHERE SessionName='" + sessName + "' and SessionHost= " + req.user.id + ";").then(function (result) {
      sessionID = result[0][0].idSession
      console.log("sessionID: " + sessionID)
    })
    .catch(next);
  

  

  if(!userID || !sessionID)res.status(201).send("WRONG_USER_SESSNAME")

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
app.get("/Session/getUsers",authenticateToken,async (req,res) =>{
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

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0) ;")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")

  results = await db.promise().query("Select SessionID, GruppenID,Berechtigung,UserID,Username FROM GroupUserSession NATURAL JOIN Users WHERE SessionID =" + req.body.sessionID + " and UserID =idUser and GruppenID = " + groupID + " ORDER BY Username")
  res.send(results[0])
})

app.post("/addUser",async (req,res,next) =>{
 // const {username,password} = req.body
  const user = req.body.username
  var pass = req.body.password
  
 
  
  
    if(user && pass){
        db.promise().query("INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('" + user + "','" + pass +"','" + defaultQuickReplies + "')").then(function (result) {
          res.status(201).send("USER_CREATED")
        })
        .catch(next);

    }
    if(username && !password){
      db.promise().query("INSERT INTO USERS(Username,defaultQuickReplies) VALUES('" + user + "','" + defaultQuickReplies + "')").then(function (result) {
        res.status(201).send("USER_CREATED")
      })
      .catch(next);
    }

    //res.send("User: " + username + " Password: " + password)
 
  

})

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


 app.get("/Session/getMessageLog",authenticateToken,async (req,res) =>{
  const userID = req.user.id
  const sessID = req.body.sessionID
  const groupID = req.body.groupID

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0);")
  if(!results[0][0])res.send("ERR_USER_NOT_IN_SESSION/GROUP")


  results = await db.promise().query("Select Username,Message,MessTimestamp from Messages NATURAL JOIN Users WHERE SessionID = " + sessID + " AND GruppenID = " + groupID + " AND idUser = idUser ORDER BY MessTimestamp;")
  res.send(results[0])

  
})

app.use(function (err, req, res, next) {
  res.send(err.code)
})




app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})