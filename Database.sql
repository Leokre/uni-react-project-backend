DROP TABLE IF EXISTS GroupUserSession ;

DROP TABLE IF EXISTS Messages ;
DROP TABLE IF EXISTS Sessions ;
DROP TABLE IF EXISTS Gruppen ;
DROP TABLE IF EXISTS Users ;

DROP TRIGGER IF EXISTS Archivieren_Insert;
DROP PROCEDURE IF EXISTS changeRole;

CREATE TABLE IF NOT EXISTS Users (
  idUser INT NOT NULL AUTO_INCREMENT,
  Username VARCHAR(45) NOT NULL UNIQUE,
  Password VARCHAR(45) NULL,
  SchnellAntwort VARCHAR(255) NULL,
  PRIMARY KEY (idUser)
 
 
    );

CREATE TABLE IF NOT EXISTS Sessions (
  idSession INT NOT NULL AUTO_INCREMENT,
  SessionName VARCHAR(45) NOT NULL,
  SessionHost INT NULL,
  SessionThema VARCHAR(45) NOT NULL,
  InvitationCode VARCHAR(255) NULL,
  PRIMARY KEY (idSession),
  
  CONSTRAINT SessionHost       FOREIGN KEY (SessionHost)        REFERENCES Users (idUser)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    );


CREATE TABLE IF NOT EXISTS Messages (
  MessageID INT NOT NULL AUTO_INCREMENT,
  MessTimestamp TIMESTAMP NULL,
  idUser INT NOT NULL,
  SessionID INT NULL,
  GruppenID INT NULL,
  Message Varchar(255) NOT NULL,
  PRIMARY KEY (MessageID),
  CONSTRAINT idUser
    FOREIGN KEY (idUser)   REFERENCES Users (idUser)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT Sessionid   FOREIGN KEY (SessionID)
    REFERENCES Sessions (idSession)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);



CREATE TABLE IF NOT EXISTS Gruppen ( 
GruppenID INT NOT NULL PRIMARY KEY,
Name VARCHAR(40) NULL



);

CREATE TABLE IF NOT EXISTS GroupUserSession (
  GruppenID INT NOT NULL,
  SessionID INT NOT NULL,
  UserID INT NOT NULL,
  Berechtigung INT NULL,
  PRIMARY KEY (GruppenID, UserID, SessionID),
 CONSTRAINT fk_UserID  FOREIGN KEY (UserID)      REFERENCES Users (idUser)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_SessionID FOREIGN KEY (SessionID)   REFERENCES Sessions (idSession)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    /*,
  CONSTRAINT fk_GruppenID FOREIGN KEY (GruppenID)   REFERENCES Gruppen (GruppenID)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION*/
    );
    
    
    Drop Trigger if exists Archivieren_Insert;

DELIMITER $$
create TRIGGER  Archivieren_Insert after insert on Sessions
    for each row
    begin
     if new.idSession then
    
     INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,new.idSession,new.SessionHost,2);
        end if;

    end$$

    

         

    Create  procedure changeRole (Session_Param int,   User_Param Int  , ZielUser Int   )
 BEGIN
        Declare speicher int ;
		Declare rolle int ;
        Declare groupID int ;
		DECLARE cur1 CURSOR FOR SELECT Berechtigung,GruppenID from GroupUserSession WHERE UserID =  ZielUser  AND  SessionID = Session_Param;
        
    select distinct Berechtigung into speicher  from GroupUserSession 
               where UserID = User_Param and 
               SessionID = Session_Param;
               
               if speicher <> 2 then 
               SIGNAL SQLSTATE '02000' SET MESSAGE_TEXT = 'NEED_HOST_ACCESS';
               
               
               elseif speicher = 2 then 
         
               OPEN cur1;
               read_loop: LOOP
               FETCH cur1 INTO rolle,groupID;
               if rolle = 0 then 
                     update GroupUserSession set  Berechtigung = 1 where   UserID =  ZielUser  and  SessionID = Session_Param and GruppenID = groupID;
                     
                     elseif rolle = 1 then  
                     update GroupUserSession set  Berechtigung = 0 where   UserID =  ZielUser  and  SessionID = Session_Param and GruppenID = groupID;
                     end if ;
               
               END LOOP;
               
               end if ;
                 
               
       end$$
           DELIMITER ;
      
    

    

    
    


    INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User1','Password1','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User2','Password2','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User3','Password3','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User4','Password4','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User5','Password5','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User6','Password6','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');
	INSERT INTO USERS(Username,Password,SchnellAntwort) VALUES('User7','Password7','Komme 5 Minuten später;Komme 10 Minuten später;SchnellAntwort3;SchnellAntwort4;SchnellAntwort5');

	INSERT INTO SESSIONS(SessionName,SessionHost,SessionThema) VALUES('TestSession1',1,'TestThema1');
	INSERT INTO SESSIONS(SessionName,SessionHost,SessionThema) VALUES('TestSession2',2,'TestThema2');
	INSERT INTO SESSIONS(SessionName,SessionHost,SessionThema) VALUES('TestSession3',3,'TestThema3');
    
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,2,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,1,3,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(2,1,4,0);
   
   INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,3,0);
   INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,4,0);
   INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,1,1,2);
   INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(2,1,1,2);
       /* 

    
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,2,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,3,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,5,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,4,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,2,6,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,1,7,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,2,3,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,2,4,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(0,2,5,0);
    
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,1,2,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,1,3,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,1,5,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(2,1,4,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(2,2,6,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(2,1,7,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,2,3,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,2,4,0);
    INSERT INTO GroupUserSession(GruppenID,SessionID,UserID,Berechtigung) VALUES(1,2,5,0);
    
    INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('2021-04-05 21:15:06', 5, 1, 1, 'Message 1');
    INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('2021-04-05 22:15:06', 2, 1, 1, 'Message 2');
    INSERT INTO Messages(MessTimestamp,idUser,SessionID,GruppenID,Message) VALUES('2021-04-05 20:15:06', 3, 1, 1, 'Message 0');

*/


commit ;