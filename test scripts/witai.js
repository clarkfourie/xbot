
var request = require('request');

var wit_token = "UW24HYCHY6YHI7RAIVF3X4NGJSNQTGHG";
var wit_endpoint = "https://api.wit.ai/message?v=28/10/2017&q=";

/* GET Wit.AI intent */
function callWitAI(query, callback) {
	var callbackStrArr = {}; // array containing multiple callback strings
	query = encodeURIComponent(query);
	request ({
		uri: wit_endpoint + query,
		qs: { access_token: wit_token },
		method: 'GET'
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("Successfully got %s", JSON.stringify(JSON.parse(response.body), null, 2));
			try {

				body = JSON.parse(response.body); // parse body to JSON
				
				if (typeof body.entities.intent !== 'undefined') {						/* INTENT */
					callbackStrArr.intent = body.entities.intent[0].value;
				} else {
					callbackStrArr.intent = '-1';
				}				
				if (typeof body.entities.number !== 'undefined') {						/* NUMBER */
					callbackStrArr.number = body.entities.number[0].value;	
				} else {
					callbackStrArr.number = '-1';
				}
				if (typeof body.entities.datetime !== 'undefined') {					/* DATETIME */
					callbackStrArr.datetime = body.entities.datetime[0].value;	
				} else {
					callbackStrArr.datetime = '-1';
				}

				callback(null, callbackStrArr);

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

callWitAI("local news", function(err, resultStrArr) {

	if (err) {
		console.log(err);
	} else {
		console.log(resultStrArr.intent);
		console.log(resultStrArr.number);	
		console.log(resultStrArr.datetime);
	}

});