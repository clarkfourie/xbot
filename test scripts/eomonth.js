
function eomonth(dateStr) {
	var rslt = new Date(dateStr.substring(0,4), dateStr.substring(5,7), 1);
	return rslt.toISOString().substring(0,10);
}

console.log(eomonth('2015-11-01'));

// console.log('2015-11-01'.substring(8,10));


// .substring(0,4)
// .substring(5,7)
// .substring(8,10)