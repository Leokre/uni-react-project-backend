const db = require("../config/Database")




const checkPermission = async function(userID,sessionID){
    var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + " AND GruppenID=0 ;")
    if(!results[0][0]) return -1
    return results[0][0].Berechtigung
}

exports.getInvCode = async function(userID=null,sessionID=null){

     if (await checkPermission(userID,sessionID)<1) return {msg:"NEED_ADMIN_ACCESS"}
    
    
    
    var results = await db.promise().query("Select InvitationCode FROM Sessions WHERE idSession =" + sessionID + "")
    return results[0][0] 
    

}


exports.setInvCode = async function(userID,sessionID,invCode){
  
   if (await checkPermission(userID,sessionID)<1) return {msg:"NEED_ADMIN_ACCESS"}

  
  
    var results = await db.promise().query("UPDATE Sessions SET InvitationCode='" + invCode + "' WHERE idSession=" + sessionID + "").catch((err)=>{return err})
    return {msg:"UPDATE_SUCCESS",InvitationCode: invCode}   
    
        
  }

exports.changeRole = async function(userID,sessionID,targetID){

  if (await checkPermission(userID,sessionID)<1) return {msg:"NEED_ADMIN_ACCESS"}
  
  var results = await db.promise().query("CALL changeRole(" + sessionID + "," + userID + "," + targetID + ")").catch((err)=>{return err})
  return {msg:"UPDATE_SUCCESS"}

}


exports.addSession = async function(userID,sessName,sessTopic,invCode){

  if(!sessName) return {msg: "NO_SESSION_NAME"}
  if(!sessTopic)return {msg: "NO_SESSION_TOPIC"}
  
  
  var results = await db.promise().query("INSERT INTO Sessions(SessionName,SessionThema,SessionHost,InvitationCode) VALUES('" + sessName + "','" + sessTopic +"'," + userID + ",'" + invCode + "')").catch((err)=>{return err})
  return {msg: "SESSION_CREATE_SUCCESS"}
    
  }


exports.addUser = async function(userID,inviteCode){
  const groupID = 0
  const rights = 0
  var sessionID = undefined

  if(!inviteCode) return "NO_INVITE_CODE"
  
  var results = await db.promise().query("SELECT * FROM SESSIONS WHERE InvitationCode='" + inviteCode + "';").catch((err)=>{return err})
  sessionID = results[0][0].idSession

  if(!sessionID) return "WRONG_INVITE_CODE"

  var results = await db.promise().query("INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + groupID + "," + sessionID + "," + userID + "," + rights + ");").catch((err)=>{return err})
  return {auth: false, msg: "INSERTION_SUCCESSFUL"}


}


exports.removeUser = async function(userID,targetID,sessionID){

  if (await checkPermission(userID,sessionID)<1) return {msg:"NEED_ADMIN_ACCESS"}
  
  
  var results = await db.promise().query("SELECT * FROM SESSIONS WHERE idSession='" + sessionID + "' and SessionHost= " + userID + ";").catch((err)=>{return err})
  if(!results) return {msg:"YOU ARE NOT THE HOST OF THAT SESSION"}
  


  var results = await db.promise().query("DELETE FROM GroupUserSession WHERE SessionID =" + sessionID + " and UserID = " + targetID + ";").catch((err)=>{return err})
  return {msg:"DELETE_SUCCESS"}


}


exports.getUsers = async function(userID,sessionID){

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + ";").catch((err)=>{return err})
  if(!results[0][0]) return "ERR_USER_NOT_IN_SESSION"
  
  results = await db.promise().query("Select SessionID, GruppenID,Berechtigung,UserID,Username FROM GroupUserSession NATURAL JOIN Users WHERE SessionID =" + sessionID + " and UserID =idUser ORDER BY GruppenID").catch((err)=>{return err})
  return(results[0])
  
}

exports.getUsersInGroup = async function(userID,sessionID,groupID){

  var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + " AND (GruppenID= (" + groupID + " OR " + 0 +") OR Berechtigung > 0) ;").catch((err)=>{return err})
  if(!results[0][0]) return "ERR_USER_NOT_IN_SESSION"
  
  results = await db.promise().query("Select SessionID, GruppenID,Berechtigung,UserID,Username FROM GroupUserSession NATURAL JOIN Users WHERE SessionID =" + sessionID + " and UserID =idUser and GruppenID = " + groupID + " ORDER BY Username").catch((err)=>{return err})
  return(results[0])
  
}


exports.getGroups = async function(sessID,userID){
  if(userID)  var q = "SELECT DISTINCT SessionID,GruppenID from GroupUserSession WHERE SessionID= " + sessID + " AND UserID= " + userID + ";"
  if(!userID) var q = "SELECT DISTINCT SessionID,GruppenID from GroupUserSession WHERE SessionID= " + sessID + ";"

  var results = await db.promise().query(q).catch((err)=>{return err})
  if(!results[0][0]) return ("ERR_USER_NOT_IN_SESSION/GROUP")
  
  return results[0]

}


exports.addGroup = async function(userID,sessID){

  if (await checkPermission(userID,sessID)<1) return {msg:"NEED_ADMIN_ACCESS"}
  
  var results = await db.promise().query("SELECT DISTINCT GruppenID from GroupUserSession WHERE SessionID= " + sessID + " ORDER BY GruppenID DESC;").catch((err)=>{return err})
  let newGroupID = results[0][0].GruppenID+1

  

  var results = await db.promise().query("INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES (" + newGroupID + "," + sessID + "," + userID + "," + 2 + ")").catch((err)=>{return err})
  return {msg: "GROUP_CREATE_SUCCESS", id: newGroupID}

}


exports.deleteGroup = async function(userID,sessID,groupID){

  if (await checkPermission(userID,sessID)<1) return {msg:"NEED_ADMIN_ACCESS"}
  
  var results = await db.promise().query("DELETE FROM GroupUserSession WHERE GruppenID = " + groupID +";").catch((err)=>{return err})
  return {msg: "DELETE_GROUP_SUCCESS"}

}