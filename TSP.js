var fs = require('fs');
var readline = require('readline');
var assert = require('assert');
var locationArray = [];


Number.prototype.toRad = function() {
   return this * Math.PI / 180;
}

function distance(one, two){
	var lat1 = parseFloat(locationArray[one].lat),
	lat2 = parseFloat(locationArray[two].lat),
	lon1 = parseFloat(locationArray[one].lon),
	lon2 = parseFloat(locationArray[two].lon);
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
	assert(this.total > 0);
	return this.total;
};
Genome.prototype.fitness = function(avg){
	this.fitnessVal = avg/this.total;
	return this.fitnessVal;
};
Genome.prototype.initialize = function(){
	var locations = locationArray.map(function(value, index){
		return index
	});
	this.sequence.push(locations.shift());
	while(locations.length > 0){
		var index = Math.floor(Math.random() * (locations.length - 1));
		this.sequence.push(locations.splice(index, 1)[0]);
	}
};
Genome.prototype.setN = function(n, value){
	this.sequence[n] = value;
};
Genome.prototype.contains = function(start, end, value, size){
	if(this.sequence[0] == value){
		return true;
	}
	for(var i = start; i != end; i = ++i % size){
		if(this.sequence[i] == value){
			return true;
		}
	}
	return false;
};
Genome.prototype.mutate = function(){
	var startingPoint = null;
	while(startingPoint == 0 || startingPoint == null)
		startingPoint = Math.floor(Math.random() * (this.sequence.length - 1));
	var endingPoint = null;
	while(endingPoint == startingPoint || endingPoint == null || endingPoint == 0){
		endingPoint = Math.floor(Math.random() * (this.sequence.length - 1));
	}
	var swap = this.sequence[startingPoint];
	this.sequence[startingPoint] = this.sequence[endingPoint];
	this.sequence[endingPoint] = swap;
}


function GenomeSet() {
	this.genomes = [],
	this.size = 15,
	this.averageEval = 0
};

GenomeSet.prototype.convergence = function(){
	if(this.genomes.length == 1)
		return true;
	return false;
};

GenomeSet.prototype.convergenceSet = function(){
	return this.genomes[0];
};
GenomeSet.prototype.initialize = function(){
	for(var i = 0; i < this.size; i++){
		var temp = new Genome();
		temp.initialize();
		this.genomes.push(temp);
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
		assert(first.sequence[i] != 0 || i == 0);
	}
	var originalValue = null;
	var breakCase = null;
	var displaced;
	var displacedIndex;
	newGenome.setN(0, 0);
	var begin = true;
	for(var i = endingPoint; i != startingPoint; i = ++i  % first.sequence.length){
		originalValue = second.sequence[(i + offset)  % second.sequence.length];
		while(newGenome.contains(startingPoint, endingPoint, second.sequence[(i + offset) % second.sequence.length], second.sequence.length) && ((i + offset) % second.sequence.length != endingPoint || begin)){
			begin = false;
			offset++;
			breakCase = originalValue;
		}
		if(i != 0){
			if(second.sequence[(i+offset) % second.sequence.length] == 0){
				var displacedIndex = i;
			}
			newGenome.setN(i, second.sequence[(i+offset) % second.sequence.length]);
			assert(i != 0);
		}
		else{
			displaced = second.sequence[(i+offset) % second.sequence.length];
			offset--;
		}
	}
	if(displaced != 0 && displacedIndex)
		newGenome.setN(displacedIndex, displaced);
	// for(var i = 0; i < newGenome.sequence.length; i++){//TURNOFF
	// 	for(var j = 0; j < newGenome.sequence.length; j++){
	// 		if(i != j){
	// 			assert(newGenome.sequence[i] != newGenome.sequence[j]);
	// 		}
	// 	}
	// }
	if(Math.random < .05){
		newGenome.mutate();
	}
	return newGenome;
};
GenomeSet.prototype.evaluation = function(){
	var sum = 0;
	this.genomes.forEach(function(genome){
		sum += genome.evaluation();
	});
	this.averageEval = sum/this.genomes.length;
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
	var genomes = this.genomes;
	crossover = this.crossover;
	intermediatePop.forEach(function(genome){
		if(previous){
			// for(var i = 0; i < 2; i++)
			genomes.push(crossover(previous, genome));
		}
		previous = genome;
	});
	this.genomes = genomes;
};
GenomeSet.prototype.generationShift = function(){
	this.evaluation();
	this.breed();
};
GenomeSet.prototype.catMut = function(){
	for(var i = 0; i < this.size; i++){
		var newGenome = new Genome(); 
		for(var j = 0; j < this.genomes[i].sequence.length; j++){
			newGenome.setN(j, this.genomes[i].sequence[j]);
			this.genomes.push(newGenome);
		}
		if (i != 0){
			while(Math.random() < .7){
				var startingPoint;
				while(startingPoint == 0 || startingPoint == null)
					startingPoint = Math.floor(Math.random() * (this.genomes[i].sequence.length - 1));
				var endingPoint = null;
				while(endingPoint == startingPoint || endingPoint == null || endingPoint == 0){
					endingPoint = Math.floor(Math.random() * (this.genomes[i].sequence.length - 1));
				}
				var swap = this.genomes[i].sequence[startingPoint];
				this.genomes[i].sequence[startingPoint] = this.genomes[i].sequence[endingPoint];
				this.genomes[i].sequence[endingPoint] = swap;
			}
		}
	}
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
	    locationArray.push({id: output[1], lat: output[2], lon: output[3]});
	});
	read.on('close', function(){
		var g = new GenomeSet();
		g.initialize();
		var convergenceCount = 0;
		while(true){
			g.generationShift();
			if(g.convergence()){
				convergenceCount++
				if(convergenceCount == 3){
					break;
				}
				else{
					g.catMut();
				}
			}
		}
		g.evaluation();
		var solution = g.convergenceSet();
		// console.log(solution.total);
		for(var i = 0; i < solution.sequence.length; i++){
			console.log(locationArray[solution.sequence[i]].id);
		}
	});
}
main();