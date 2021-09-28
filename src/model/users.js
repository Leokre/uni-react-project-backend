const db = require("../config/Database")
const defaultQuickReplies = "Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5"

exports.getUserSessions = async function(userID){

    var results = await db.promise().query("SELECT DISTINCT SessionID,SessionName,SessionThema,Berechtigung FROM Sessions NATURAL JOIN GroupUserSession WHERE idSession=SessionID AND UserID= " + userID + "").catch((err)=>{return err})
    return results[0]
  
    
  }

exports.setQuickReplies = async function(userID,quickReplies){

  
  if(!quickReplies) return{msg: "ERR_INPUT_EMPTY"}

  var results = await db.promise().query("UPDATE USERS SET SchnellAntwort='" + quickReplies + "' WHERE idUser=" + userID + "").catch((err)=>{return err})
  return "UPDATE_SUCCESS"
  
  }


exports.getQuickReplies = async function(userID){

    var results = await db.promise().query("SELECT SchnellAntwort FROM USERS WHERE idUser=" + userID ).catch((err)=>{return err})
    const str = results[0][0].SchnellAntwort
    const replies = str.split(';')
    return replies
    
  }

exports.insertUser = async function(username,password){

    var results = await db.promise().query("INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('" + username + "','" + password +"','" + defaultQuickReplies + "')").catch((err)=>{return err})
    return "USER_CREATED"
  
  }

exports.getUserByName = async function(username){

  var results = await db.promise().query("SELECT * FROM USERS WHERE USERNAME='" + username + "';").catch((err)=>{return err})
  return results[0]
  
}