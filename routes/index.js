// npm packages
var express = require('express');
var request = require('request');
var rssReader = require('feed-read');
var sql = require("mssql");
var schedule = require('node-schedule');

var router = express.Router();

// Auth tokens
/* FB token */var token = "EAAChhckSKB8BAFZB5VZAYZApZBjCLUTcA18KYlcN9wMJX1IazFvvfbUFm83fi9vOjQz6b2k9ut8OpcCA3515JBsTPwbrMgSOWVvkUL1ubpO7UxFk4ZCGnRg7kZC8orqJAnm4qKGK44xYZBxK9xs5EriQYe9rJpgaw0Nci361M0RTgZDZD";
var wit_token = "UW24HYCHY6YHI7RAIVF3X4NGJSNQTGHG";

// Endpoints
var google_news_endpoint = "https://news.google.com/news?output=rss";
var wit_endpoint = "https://api.wit.ai/message?v=28/10/2017&q=";

// Chron job scheduler 
var j = schedule.scheduleJob('0 0 9 29 * *', function() {
  console.log('Good luck with your pay run!');
  // senderID is not defined...
  //sendTextMessage(senderID, "Good luck with your pay run!");
});

/* GET home page */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET webhook */
router.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'thex3bot_token') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

/* POST webhook */
router.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
        	receivedMessage(event);
      	} else if (event.postback) {
          receivedPostback(event); 
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Point to database 
var dbConfig = {
	user: "sa",
	password: "P@ssw0rd1",
	server: "DEMO-V9P3\\X3PEOPLE",
	database: "x3people",
	port: 1433 //defaults to 1433
};

// Returns company names in a list format and replies result to sender
function getCPY(senderID) {
	var conn = new sql.Connection(dbConfig);

	conn.connect().then(function () {
	    var req = new sql.Request(conn);
	    req.query("SELECT CPYNAM_0 AS CPYNAM_0 FROM SEED.COMPANY").then(function (recordset) {
	        console.log(recordset);
			for (i = 0; i <= recordset.length; i++) {
			    sendTextMessage(senderID, String(recordset[i].CPYNAM_0));
			    //sendSMS(String(recordset[i].CPYNAM_0));	
			}
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

// Returns number of companies and replies result to sender
function getNumCPY(senderID) {
	var conn = new sql.Connection(dbConfig);

	conn.connect().then(function () {
	    var req = new sql.Request(conn);
	    req.query("SELECT count(*) AS CPYNAM_0 FROM SEED.COMPANY").then(function (recordset) {
	        console.log(recordset);
			sendTextMessage(senderID, String(recordset[0].CPYNAM_0));
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

/* GET Google news article */
function getArticles(callback) {
  rssReader(google_news_endpoint, function(err, articles) {
    if (err) {
      callback(err)
    } else {
      if (articles.length > 0) {
        callback(null, articles)
      } else {
        callback("no articles received")
      }
    }
  });
}

/* POST Google news article with generic template */
function sendArticle(sender, article) {
	var messageData = {
		attachment:{
			type:"template",
			payload:{
				template_type:"generic",
				elements:[
				{
					title:article.title,
					subtitle:article.published.toString(),
					item_url:article.link
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json:{
			recipient: {id:sender},
			message: messageData,
		}
	}, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	      var recipientId = body.recipient_id;
	      var messageId = body.message_id;

	      console.log("Successfully sent generic message with id %s to recipient %s", 
	        messageId, recipientId);
	    } else {
	      console.error("Unable to send message.");
	      console.error(response);
	      console.error(error);
	    }
	});  
}

/* GET Wit.AI intent */
function callWitAI(query, callback) {
	query = encodeURIComponent(query);
	request ({
		uri: wit_endpoint + query,
		qs: { access_token: wit_token },
		method: 'GET'
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("Successfully got %s", response.body);
			try {
				body = JSON.parse(response.body);
				intent = body.entities.intent[0].value; // [0] (first value) is the most confident value
				callback(null, intent);
			} catch (e) {
				callback(e);
			}
		} else {
			console.log(response.statusCode);
			console.error("Unable to send message. %s", error);
			callback(error);
		}
	});
}

/* The text message sent by Sender is received and handled here */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  var normalizedText = messageText.toLowerCase().replace(/ /g,'');

  if (normalizedText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, handle wit.ai's intent 
    switch (normalizedText) {
		case '/generic':
			sendGenericMessage(senderID);
			break;
		case '/news':
			getArticles(function(err, articles) {
				sendArticle(senderID, articles[0]);
			});
			break;
		// case 'cpy':
		// 	getCPY(senderID);
		// 	break;
		// case 'howmanycpy':
		// 	getNumCPY(senderID);
		// 	break;
		default:
		callWitAI(messageText, function(err, intent) {
			handleIntent(intent, senderID);
		});
		break;
		// sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    //sendTextMessage(senderID, "Message with attachment received");
  }
}

/* Wit.AI intent is handled here */
function handleIntent(intent, sender) {
	switch (intent) {
		case "joke": 
			sendTextMessage(sender, "I'm here to work - jokes are for the weekend... :)");
			break;
		case "greeting":
			sendTextMessage(sender, "Hi!");
			break;
		case "identification":
			sendTextMessage(sender, "I am a robot :| 'nuff said...");
			break;
		default:
			sendTextMessage(sender, "Sorry, I don't understand - could you be more specific please?");
	}
}

/* Sample code for oculus rift template */

// function sendGenericMessage(recipientId) {
//   var messageData = {
//     recipient: {
//       id: recipientId
//     },
//     message: {
//       attachment: {
//         type: "template",
//         payload: {
//           template_type: "generic",
//           elements: [{
//             title: "rift",
//             subtitle: "Next-generation virtual reality",
//             item_url: "https://www.oculus.com/en-us/rift/",               
//             image_url: "http://messengerdemo.parseapp.com/img/rift.png",
//             buttons: [{
//               type: "web_url",
//               url: "https://www.oculus.com/en-us/rift/",
//               title: "Open Web URL"
//             }, {
//               type: "postback",
//               title: "Call Postback",
//               payload: "Payload for first bubble",
//             }],
//           }, {
//             title: "touch",
//             subtitle: "Your Hands, Now in VR",
//             item_url: "https://www.oculus.com/en-us/touch/",               
//             image_url: "http://messengerdemo.parseapp.com/img/touch.png",
//             buttons: [{
//               type: "web_url",
//               url: "https://www.oculus.com/en-us/touch/",
//               title: "Open Web URL"
//             }, {
//               type: "postback",
//               title: "Call Postback",
//               payload: "Payload for second bubble",
//             }]
//           }]
//         }
//       }
//     }
//   };  

//   callSendAPI(messageData);
// }

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

module.exports = router;
