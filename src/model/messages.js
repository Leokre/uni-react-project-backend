const db = require("../config/Database")


const checkPermission = async function(userID,sessionID,groupID){
    var results = await db.promise().query("SELECT Berechtigung from GroupUserSession WHERE UserID= " + userID + " AND SessionID= " + sessionID + " AND (GruppenID= " + groupID + " OR Berechtigung > 0) ;").catch((err)=>{return err})
    if(!results[0][0]) return -1
    return results[0][0].Berechtigung
}



exports.sendMessage = async function(message,userID,sessID,groupID){
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
        if(!message) return "ERR_NO_MESSAGE"

        if (await checkPermission(userID,sessID,groupID)<0) return {msg:"ERR_USER_NOT_IN_SESSION/GROUP"}

    
        var results = await db.promise().query("INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('" + now + "', " + userID + ", " + sessID + ", " + groupID + ", '" + message + "')").catch((err)=>{return err})
        return"MESSAGE_SENT"
    }


exports.getMessageLog = async function(userID,sessID,groupID){    
    
    if (await checkPermission(userID,sessID,groupID)<0) return {msg:"ERR_USER_NOT_IN_SESSION/GROUP"}
    
    
    var results = await db.promise().query("Select Username,Message,MessTimestamp,MessageID from Messages NATURAL JOIN Users WHERE SessionID = " + sessID + " AND GruppenID = " + groupID + " AND idUser = idUser ORDER BY MessTimestamp;")
    return results[0]
    
    
    }
  