var request = require('request');

var wit_token = "UW24HYCHY6YHI7RAIVF3X4NGJSNQTGHG";
var wit_endpoint = "https://api.wit.ai/message?v=28/10/2017&q=";

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
				// intent = body["entities"]["Intent"][0]["value"]; // [0] (first value) is the most confident value
				intent = body.entities.intent[0].value; 
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

callWitAI("who are you?", function(err, intent) {
	console.log(intent);
});
