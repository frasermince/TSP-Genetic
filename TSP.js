var fs = require('fs');
var readline = require('readline');
var assert = require('assert');
var locationArray = [];


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

function Genome(){
	this.sequence = [];
	this.total = 0;
	this.fitnessVal = 0;
};
Genome.prototype.evaluation = function(){
	var previous = null;
	var total = this.total;
	this.sequence.forEach(function(location){
		if(previous){
			total += distance(previous, location);
		}
		previous = location;
	});
	this.total = total;
	return this.total;
};
Genome.prototype.fitness = function(avg){
	this.fitnessVal = this.total/avg;
	return this.fitnessVal;
};
Genome.prototype.initialize = function(){
	var locations = locationArray.slice(0);
	while(locations.length > 0){
		var index = Math.floor(Math.random() * (locations.length - 1));
		this.sequence.push(locations.splice(index, 1)[0]);
	}
};
Genome.prototype.setN = function(n, value){
	this.sequence[n] = value;
};
Genome.prototype.contains = function(start, end, value, size){
	for(var i = start; i != end; i = ++i % size){
		if(this.sequence[i] == value){
			return true;
		}
	}
	return false;
};
Genome.prototype.mutate = function(){

}


function GenomeSet() {
	this.genomes = [],
	this.size = 10,
	this.averageEval = 0
};
GenomeSet.prototype.initialize = function(){
	for(var i = 0; i < this.size; i++){
		var temp = new Genome();
		temp.initialize();
		this.genomes.push(temp);
		// console.log(this.genomes);
	}
};
GenomeSet.prototype.crossover = function(first, second){
	var startingPoint = Math.floor(Math.random() * (first.sequence.length - 1));
	var endingPoint = null;
	while(endingPoint == startingPoint || endingPoint == null){
		endingPoint = Math.floor(Math.random() * (first.sequence.length - 1));
	}
	var newGenome = new Genome();
	var offset = 0;
	for(var i = startingPoint; i != endingPoint; i = ++i % first.sequence.length){
		newGenome.setN(i, first.sequence[i]);
	}
	for(var i = endingPoint; i != startingPoint; i = ++i % first.sequence.length){
		while(newGenome.contains(startingPoint, endingPoint, second.sequence[(i + offset)  % second.sequence.length], first.sequence.length)){
			offset++;
		}
		newGenome.setN(i, second.sequence[(i+offset) % second.sequence.length]);
	}
	return newGenome;
};
GenomeSet.prototype.evaluation = function(){
	var sum = 0;
	this.genomes.forEach(function(genome){
		sum += genome.evaluation();
	});
	this.averageEval = sum/this.size;
};
GenomeSet.prototype.breed = function(){
	var intermediatePop = [];
	var previous = null;
	var averageEval = this.averageEval;
	this.genomes.forEach(function(genome){
		var likelihood = genome.fitness(averageEval);
		var certain = Math.floor(likelihood);
		for(var i = 0; i < certain; i++){
			intermediatePop.push(genome);
		}
		if(Math.random() < likelihood - certain){
			intermediatePop.push(genome);
		}
	});
	this.genomes = [];
	genomes = this.genomes;
	crossover = this.crossover;
	intermediatePop.forEach(function(genome){
		if(previous){
			genomes.push(crossover(previous, genome));
		}
		previous = genome;
	});
	console.log('new set ', this.genomes);
};
GenomeSet.prototype.generationShift = function(){
	this.evaluation();
	this.breed();
};




var read = readline.createInterface({
	input: fs.createReadStream(process.argv[2]),
	output: process.stdout,
    terminal: false
});

function main(){
	var expression = /(^\d+).+\((.+)\,(.+)\)/
	read.on('line', function(line){
		var output = expression.exec(line);
	    locationArray.push({id: output[1], lat: output[2], lon: output[3]});
	});
	read.on('close', function(){
		var g = new GenomeSet();
		g.initialize();
		g.generationShift();
	});
}
main();