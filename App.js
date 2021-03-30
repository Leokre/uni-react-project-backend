const express = require('express')
const app = express()
const port = process.env.PORT || 5000

//Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const session = require("express-session")
const db = require("./Database")
const jwt = require("jsonwebtoken")
const jwtKey = "CHANGEMEIMNOTSECURE"
const frontEnd = "http://localhost:3000"

/*    TODO
1. Password encryption
2. Change JWT key
3. User tokens
4. sendMessage
5. getChatLog
6. ...







*/



app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  next();
});


app.use(session({
secret: jwtKey,
resave: false,
saveUninitialized: false



}));




app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", frontEnd);
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
  });

app.get('/', (req, res) => {
  res.send('Index!')
})

app.get('/yeet', (req, res) => {
    res.send('YEET!')
  })

//Add User
app.post("/addUser",(req,res,next) =>{
  const {username,password} = req.body


  
    if(username && password){
        db.promise().query("INSERT INTO USERS(Username,Password) VALUES('" + username + "','" + password +"')").then(function (result) {
          res.status(201).send({msg: "Created User"})
        })
        .catch(next);
        
        
      
    }

    //res.send("User: " + username + " Password: " + password)
 
  

})
app.use(function (err, req, res, next) {
  res.send(err.code)
})

//Get all Users
app.get("/getUsers",async (req,res) =>{
  const results = await db.promise().query('Select * FROM USERS')
  res.send(results)
})

const verifyJWT = (req,res,next) => {
  const authHeader = req.headers["x-access-token"]
  const token = authHeader && authHeader.split(' ')[1]
  if(!token){
    res.send("NOTOKEN")
  }else{
    jwt.verify(token,jwtKey,(err,decoded) => {
      if(err){
        res.send("AUTHFAILED")
      }else{
        req.userId = decoded.id
        next()
      }
    })
  }
}

app.get("/checkAuth", verifyJWT ,(req,res)=>{
  res.send("AUTHENTICATED")
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
            const id = result.id
            const token = jwt.sign({id},jwtKey,{expiresIn: 300})
            //req.session.user = result
            //res.json({auth: true, token: token, result: result})
            res.status(202)
               .cookie(true, token, result,{sameSite: 'strict',
            path: '/',
            expires: new Date(new Date().getTime() + 100 * 1000),
                  httpOnly: true}).send("cookie being initialized")
            //res.send({message: "SUCCESS" + "    Username: " + username + " Password: " + password});
            //res.send()
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


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})