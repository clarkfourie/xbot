// ensure TCP/IP network configurations in SQL configuration management is enabled
// firewall port rules must be made

var sql = require('mssql');

var dbConfig = {
	user: "sa",
	password: "P@ssw0rd1",
	server: "DEMO-V9P3\\X3PEOPLE",
	database: "x3people",
	port: 1433 //defaults to 1433
};

function getCPY(senderID) {
	var conn = new sql.Connection(dbConfig);
	
	conn.connect().then(function () {
	    var req = new sql.Request(conn);
	    req.query("SELECT CPYNAM_0 AS CPYNAM_0 FROM SEED.COMPANY").then(function (recordset) {
	        console.log(recordset);
			// for (i = 0; i <= recordset.length; i++) {
			//     sendTextMessage(senderID, String(recordset[i].CPYNAM_0));
			//     sendSMS(String(recordset[i].CPYNAM_0));	
			// }
           // conn.close();
        })
        .catch(function (err) {
            console.log(err);
           //conn.close();
        });        
    })
    .catch(function (err) {
        console.log(err);
    });
}  

getCPY();
