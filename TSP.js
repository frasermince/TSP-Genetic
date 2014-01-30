var fs = require('fs');
var readline = require('readline');
var locationArray = [];

var genome = {
	sequence: [],
	total:  0,
	evaluation: function(){
		var previous = null;
		this.sequence.forEach(function(location){
			if(previous){
				this.total += distance(previous, location);
			}
			previous = location;
		});
	},
	fitness: function(avg){
		return total/avg;
	},
	initialize: function(){
		locations = locationArray.slice(0);
		while(locations.length > 0){
			var index = Math.floor(Math.random() * (locations.length - 1));
			this.sequence.push(locations.splice(index, 1));
		}
	}
}

Number.prototype.toRad = function() {
   return this * Math.PI / 180;
}

function distance(one, two){
	var lat1 = parseFloat(one.lat),
	lat2 = parseFloat(two.lat),
	lon1 = parseFloat(one.lon),
	lon2 = parseFloat(two.lon);
	var R = 6371;
	var x1 = lat2-lat1;
	var x2 = lon2-lon1;
	var dLat = x1.toRad();
	var dLon = x2.toRad();
	var lat1 = lat1.toRad();
	var lat2 = lat2.toRad();

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d;
}

var read = readline.createInterface({
	input: fs.createReadStream(process.argv[2]),
	output: process.stdout,
    terminal: false
});

function main(){
	var expression = /(^\d+).+\((.+)\,(.+)\)/
	read.on('line', function(line){
		var output = expression.exec(line);
	    locationArray.push({id: output[1], lat: output[2], lon:output[3]});
	});
	read.on('close', function(){
		var myGenome = Object.create( genome );
	});
}
main();