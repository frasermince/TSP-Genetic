var fs = require('fs');
var readline = require('readline');

var read = readline.createInterface({
	input: fs.createReadStream(process.argv[2]),
	output: process.stdout,
    terminal: false
});

function main(){
	var locationArray = [];
	var expression = /(^\d+).+\((.+)\,(.+)\)/
	read.on('line', function(line){
		var output = expression.exec(line);
	    locationArray.push({id: output[1], lat: output[2], lon:output[3]});
	});
}
main();