script.js

function generateParticles(options, id) {

"use strict"

// ----------------------------------------------------
// Handle different instances and global window.particleEngine //
//-----------------------------------------------------
if (typeof window.particleEngine === "undefined") { 

    window.particleEngine = {};
    
} else if (typeof window.particleEngine["animation"+id] !== "undefined") {

    window.cancelAnimationFrame(window.particleEngine["animation"+id]);

}

var requestAnimationFrame = window.requestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);

    };


// ----------------------------------------------------
// Generate canvas element //
//-----------------------------------------------------

var container = document.getElementById(id);
if (container === null) return console.error("Container is Null");


var canvas = document.createElement("canvas");
    canvas.id = "particles_" + id;

container.innerHTML = "";
container.appendChild(canvas);

var ctx = canvas.getContext("2d");

// ----------------------------------------------------
// Define local variables //
//-----------------------------------------------------

var maximumPossibleDistance;
var centerX;
var centerY;

var mousePositionX;
var mousePositionY;
var mouseElement;
var isRunning;

var lines = 0;
var objects = [];

var emitterPositions = []


var options = options;



// ----------------------------------------------------
// Init function //
//-----------------------------------------------------
var initAnimation = function(){

    
    canvas.width = container.clientWidth ;
    canvas.height = container.clientHeight ;
    
    maximumPossibleDistance = Math.round(Math.sqrt((canvas.width * canvas.width) + (canvas.height * canvas.height)));  
    
    centerX = Math.floor( canvas.width / 2 );
    centerY = Math.floor( canvas.height / 2 );
    
    objects.length = 0;
    clearCanvas();
	createScene();
   

};

window.addEventListener("resize", function(){initAnimation();}, false);

// ----------------------------------------------------
// Helper functions //
//-----------------------------------------------------

var getRandomBetween = function(a, b) {
   
    return Math.floor(Math.random() * ( b - a + 1)) + a;

};


var getRandomDecimalBetween = function(a, b) {
   
    var b = b*100;
    var a = a*100;
    
    var randomNumber = getRandomBetween(a, b);
    var finalNumber = randomNumber/100;
    
    return finalNumber;

};



var hitTest = function(object1, object2) {


    if ((object1.positionX < object2.positionX + object2.size) && (object1.positionX + object2.size > object2.positionX) &&
        (object1.positionY < object2.positionY + object2.size) && (object1.positionY > object2.positionY)) {

        return true;


    } else {

        return false;

    }


};

// Get distance between particles by using Pythagorean theorem

var getDistance = function(element1, element2) {


    var difX = Math.round(Math.abs(element1.positionX - element2.positionX));
    var difY = Math.round(Math.abs(element1.positionY - element2.positionY));

    return Math.round(Math.sqrt((difX * difX) + (difY * difY)));


};



// ----------------------------------------------------
// Particle constructor function //
//-----------------------------------------------------
function Particle(positionX, positionY) {

    this.positionX = positionX;
    this.positionY = positionY;
    this.initialPositionX = positionX;
    this.initialPositionY = positionY;
   
}

// ----------------------------------------------------
// Mouse Object constructor function //
//-----------------------------------------------------
function Mouse(positionX, positionY, size, red, green, blue, opacity) {

    this.positionX = mousePositionX;
    this.positionY = mousePositionY;
    this.size = size;

    this.red = red;
    this.green = green;
    this.blue = blue;
    this.opacity = opacity;


    this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + ",+" + this.opacity + ")";

}


Particle.prototype.doActions = function(){

    for (var x=0; x<this.actions.length; x++) {
    
    
        var action = this.actions[x];
        this[action]();
    
    
    }

};



Particle.prototype.animateTo = function(newX, newY) {

    var step;
	var duration = this.duration;

    var animatePosition = function(newPosition, currentPosition) {

        if (newPosition > currentPosition) {

            step = (newPosition - currentPosition) / duration;
            newPosition = currentPosition + step;

        } else {

            step = (currentPosition - newPosition) / duration;
            newPosition = currentPosition - step;

        }

        return newPosition;

    };

    this.positionX = animatePosition(newX, this.positionX);
    this.positionY = animatePosition(newY, this.positionY);



    // generate new vector

    if (this.timer == this.duration) {

        this.calculateVector();
        this.timer = 0;

    } else {

        this.timer++;

    }


};

Particle.prototype.updateColor = function() {

    this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.opacity + ")";

};

// ----------------------------------------------------
// Fading //
//-----------------------------------------------------
// helper function do not use without facade
Particle.prototype.fadeTo = function(value){
	
    if ( this.opacity < value ) {
	
		
		this.opacity = this.opacity + 0.02;	
        
        if (this.opacity > 1) this.opacity = 1;
		
		
		
	} else if ( this.opacity > value ) {
	
		
		this.opacity = this.opacity - 0.02;	

    }
	

};

// Facade fadeIn
Particle.prototype.fadeIn = function(){
 
    
    
    this.active = true;
	
    if (this.actions.indexOf("fadeIn") == -1) {
	
		this.actions.push("fadeIn");

	}
    
    
 	// Fade in to initial opacity
    this.fadeTo(this.initialOpacity);
    
    // remove fading action if opacty reach initial
    if ((this.initialOpacity - this.opacity) < 0)  this.actions.splice(this.actions.indexOf("fadeIn"),1);
	
	
   
  

};

// Facade FadeOut
Particle.prototype.fadeOut = function(){
 
	
    
    if (this.actions.indexOf("fadeOut") == -1) {
	
		this.actions.push("fadeOut");

	}
	
	// 0.05 is safe value to prevent negative opacity 
    if (this.opacity < 0.05) {

		this.opacity = 0;
      
   
        // deactivate particle, remove from particles array
		
		this.active = false;
        this.actions.splice(this.actions.indexOf("fadeOut"),1)
	
		
	}
    
    
    this.fadeTo(0);

};

Particle.prototype.init = function(){

	this.initOpacity();
	this.initSize();
	
	
	this.red = options.red;
	this.green = options.green; 
	this.blue = options.blue;
	
	this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.opacity + ")"
	
	this.duration = getRandomBetween(options.durationMin, options.durationMax);
    this.limit = options.moveLimit;
    this.timer = 0;

   
	this.lifeTime = getRandomBetween(options.lifeTimeMin,options.lifeTimeMax)
  
	this.actions = []; // container for temporary effects
	
    this.calculateVector();
	
	objects.push(this);
	this.active = true;


}

Particle.prototype.initOpacity = function(){

	if ( options.randomOpacity ) {
	
		this.opacity = getRandomDecimalBetween( options.particleMinimumOpacity, options.particleMaximumOpacity );
	
	} else {
	
		this.opacity = options.opacity;
	
	}
	
	 this.initialOpacity = this.opacity;

};

Particle.prototype.initSize = function(){

	if ( options.randomSize ) {
	
		this.size = getRandomBetween( options.minimumSize, options.maximumSize );
	
	} else {
	
		this.size = options.initialSize;
	
	}

};




Particle.prototype.calculateVector = function() {


    var distance;
    var newPosition = {};
    var particle = this;

    var getCoordinates = function() {

		
		// limit coordinates to look for (distance limit)
		
		var minPX = particle.positionX - particle.limit;
		var maxPX = particle.positionX + particle.limit;
		
		if (maxPX > canvas.width) maxPX = canvas.width;
		if (minPX < 0) minPX = 0;
				
		var minPY = particle.positionY - particle.limit;
		var maxPY = particle.positionY + particle.limit 
		
		if (maxPY > canvas.height) maxPY = canvas.height;
		if (minPY < 0) minPY = 0;
		
		newPosition.positionX = getRandomBetween(minPX, maxPX);
        newPosition.positionY = getRandomBetween(minPY, maxPY);

        distance = getDistance(particle, newPosition);

    };

    while ((typeof distance === "undefined") || (distance > this.limit)) {

        getCoordinates();

    }


    this.vectorX = newPosition.positionX;
    this.vectorY = newPosition.positionY;


};


Particle.prototype.testInteraction = function() {

    if (!options.drawConnections) return;
    
    var closestElement;
    var distanceToClosestElement = maximumPossibleDistance;

    for (var x = 0; x < objects.length; x++) {

        var testedObject = objects[x];
        var distance = getDistance(this, testedObject);


        if ((distance < distanceToClosestElement) && (testedObject !== this)) {

            distanceToClosestElement = distance;
            closestElement = testedObject;

        }
        
        // Hittest

       /* if (hitTest(this, testedObject)) {

            var winner = true;

            if (this.size > testedObject.size) {

                var objToDelete = testedObject
                var objToSave = this


            } else if (this.size < testedObject.size) {

                var objToDelete = this
                var objToSave = testedObject

            } else {

                winner = false

            }


            if (winner) {

                var index = objects.indexOf(objToDelete)
                objects.splice(index, 1)
                objToSave.size++;



                if (objToSave.opacity <= 1) objToSave.opacity += 0.1;

                objToSave.updateColor();
            }

        }*/
        
        // Hittest end



    }

    if (closestElement) {

        ctx.beginPath();
        ctx.moveTo(this.positionX + this.size / 2, this.positionY + this.size / 2);
        ctx.lineTo(closestElement.positionX + closestElement.size * 0.5, closestElement.positionY + closestElement.size * 0.5);
        ctx.strokeStyle = "rgba(" + options.connectionRed + ","+ options.connectionGreen +","+ options.connectionBlue +"," + options.connectionOpacity + ")";
        ctx.stroke();
        lines++;
    }

};

Mouse.prototype.testInteraction = function() {  

    if (options.mouseInteractionDistance === 0) return;
        
    var closestElements = [];
    var distanceToClosestElement = maximumPossibleDistance;

    for (var x = 0; x < objects.length; x++) {

        var testedObject = objects[x];
        var distance = getDistance(this, testedObject);


        if ((distance < options.mouseInteractionDistance) && (testedObject !== this)) {

            
            closestElements.push(objects[x]);

        }
        
    }

    
    for (var x = 0; x < closestElements.length; x++) {
       
       
        if (options.drawMouseConnections) {
        
            var element = closestElements[x];
            ctx.beginPath();
            ctx.moveTo(this.positionX, this.positionY);
            ctx.lineTo(element.positionX + element.size * 0.5, element.positionY + element.size * 0.5);
            ctx.strokeStyle = "rgba(" + options.mouseConnectionRed + ","+ options.mouseConnectionGreen +","+ options.mouseConnectionBlue +"," + options.mouseConnectionOpacity + ")";
            ctx.stroke();
            lines++ ;
        
        }
        
       if (options.mouseInteraction) {
            
            if (options.mouseInteractionType == "gravity") {
				
				closestElements[x].vectorX = this.positionX;
            	closestElements[x].vectorY = this.positionY;
				
			} else if (options.mouseInteractionType == "initial"){

		
				closestElements[x].vectorX = closestElements[x].initialPositionX;
				closestElements[x].vectorY = closestElements[x].initialPositionY;
				
			}
     
    	}
        
        
    }
};

Particle.prototype.updateLifeTime = function() {
    
    this.lifeTime--;
	
	if ( this.lifeTime < 0 )  {
      
        this.fadeOut()
       

	}

};


Particle.prototype.updateAnimation = function() {

    // calculate changes
    this.animateTo(this.vectorX, this.vectorY);
    this.testInteraction();
   // if (options.sparkling) this.sparkling();
   
   
    
    // draw particle
	this.updateColor();
    ctx.fillStyle = this.color;
   
    if (options.particleType == "square") {
        
        
        ctx.fillRect(this.positionX, this.positionY, this.size, this.size);
    
    } else if (options.particleType == "text") {
    
        ctx.font = "50px Verdana"
        ctx.fillText(options.particleText,this.positionX, this.positionY)

    }
   

};



Mouse.prototype.updateAnimation = function() {
    
    
    this.positionX = mousePositionX;
    this.positionY = mousePositionY;

    this.testInteraction();
    

};


// ----------------------------------------------------
// Emitters //
//-----------------------------------------------------


var createTextEmitter = function(config){


  	ctx.fillStyle = "#fff";
    ctx.font = "150px Verdana";
    ctx.fillText( config.text, config.positionX, config.positionY );
    
    // scan all pixels and generate possible positions array
	
	var particleData = ctx.getImageData( 0 ,0 , canvas.width, canvas.height ) 
    var data = particleData.data; 
    
    
    var x = 0;
    var y = 0;
    
    for (var i=0; i<data.length; i+=4) {
        
           x++;
         
         if (x == canvas.width) {
         
            x = 0;
            y++;
    
         }
   
         // if pixel isnt't empty (standard transparent) then push position into emitter 
         if (data[i] === 255) {
          
             emitterPositions.push([x,y])

         }   
   
    }

};

var createTextEmitterParticles = function(config){

	
	
	for (var x=0; x<config.particlesNumber; x++) {
	 
		// do not create particle if there is no avalaible emitter position
		if ( emitterPositions.length < 2 ) return;
		
		var randomNumber = getRandomBetween(1,emitterPositions.length-1);
		var position = emitterPositions[randomNumber];

		var particle = new Particle(position[0], position[1]);
		particle.init();
	
		emitterPositions.splice(randomNumber,1); 
	
	 
	 }


};


var createRandomEmitter = function(config){

	for (var x = 0; x < config.particlesNumber; x++) {

        var randomX = Math.floor((Math.random() * canvas.width) + 1);
        var randomY = Math.floor((Math.random() * canvas.height) + 1);

        var particle = new Particle(randomX, randomY );
        particle.init()
		
	}

};


var createPointEmitter = function(config){

	for (var x = 0; x < config.particlesNumber; x++) {

        var particle = new Particle(config.positionX, config.positionY );
        particle.init()
		
	}

};


var addEmitter = function(type, config){

	if (type === "text") {
	
		createTextEmitter(config)
		createTextEmitterParticles(config)
	
	} else if (type === "point") {
	
		createPointEmitter(config)
	
	
	} else if (type === "random") {
		
		
		createRandomEmitter(config)

	}

};


var createScene = function() {

    // create mouse particle
    mouseElement = new Mouse(0, 0, options.initialSize, 255, 255, 255);
 	
	if (options.emitterType === "text") {
	
		addEmitter("text",{
		
			positionX:			centerX,
			positionY:			centerY,
			particlesNumber:	options.particlesNumber,
			text:				options.emitterShape
		
		
			});
	
	} else if (options.emitterType === "point") {
	
	
		addEmitter("point",{
			
			positionX:			centerX,
			positionY:			centerY,
			particlesNumber:	options.particlesNumber

			});
	
	
	} else if (options.emitterType === "random") {
	
	
		addEmitter("random",{
			
			positionX:			centerX,
			positionY:			centerY,
			particlesNumber:	options.particlesNumber

			});

	}
	
	
};

  

var updatePosition = function() {

    // loop backwards to avoid length issues when delete particle
    for (var x = objects.length - 1; x >= 0; x--) {
		
       	var particle = objects[x];

        if ( options.lifeTime ) particle.updateLifeTime();
         particle.doActions();
        
        if (particle.active) {
		
            particle.updateAnimation();

            
        } else {
        
            particle.lifeTime = getRandomBetween(options.lifeTimeMin,options.lifeTimeMax);
            particle.positionX = particle.initialPositionX;
            particle.positionY = particle.initialPositionY;
            
            particle.calculateVector();
            particle.timer = 0;
            
            
           
            particle.fadeIn();
        
        
        
        
        }
        
      
	

    }
    
    // handle mouse 
    mouseElement.updateAnimation();
	
	
	//if ( options.emitterMode ) updateEmitter();
    
    
    

};


canvas.onmousemove = function(e){
   
    mousePositionX = e.clientX - container.offsetLeft + window.pageXOffset;
    mousePositionY = e.clientY - container.offsetTop + window.pageYOffset;
    

};




var clearCanvas = function() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);


};

var stopAnimation = function(){


  window.cancelAnimationFrame(window.particleEngine["animation"+id]);
  isRunning = false;

};

// ----------------------------------------------------
// Create background //
//-----------------------------------------------------

var createBackgroundGradient = function(){

    var finalValue = "";
    var fallbackColor;
    
    for ( var property in options.backgroundColors) {
    
         if (typeof fallbackColor == "undefined" ) fallbackColor = options.backgroundColors[property].color;
         
         // loop only throught own propeties
         if (options.backgroundColors.hasOwnProperty(property)) {
            
            // generate CSS code
          
            finalValue += "radial-gradient(circle at " + 
			
				options.backgroundColors[property].positionX + "% " + 
				options.backgroundColors[property].positionY + "%, #" + 
				options.backgroundColors[property].color + 
				
				", transparent 100%),"  
  
          }

    }
    
    // remove last comma ","
    finalValue = finalValue.slice(0,-1)
    
    
    
     canvas.style.background = "#" + fallbackColor;
    canvas.style.backgroundImage = finalValue;
    

}

var createBackgroundImage = function(){

   
   
    container.style.backgroundImage = "url(img/wallpaper.jpg)";
    container.style.backgroundPosition = "center center";
    container.style.backgroundSize = "cover";

    

}



// ----------------------------------------------------
// FPS //
//-----------------------------------------------------
var lastCalledTime;
var fps;
var averageFps;
var averageFpsTemp = 0;
var averageFpsCounter = 0;


function requestStatistics() {

    if (!lastCalledTime) {

        lastCalledTime = Date.now();
        fps = 0;
        return;

    }
    
    

    var delta = (new Date().getTime() - lastCalledTime) / 1000;
    lastCalledTime = Date.now();
    fps = Math.floor(1 / delta);
    
    averageFpsTemp = averageFpsTemp + fps;
    averageFpsCounter++;
    
    if ( averageFpsCounter === 5) {
     
        
        averageFps = Math.floor(averageFpsTemp / 5) ;
        averageFpsCounter = 0;  
        averageFpsTemp = 0; 
    }
    
    if (!averageFps) {
        
        return;
    
    } else if (averageFps < 10) {
      /*  stopAnimation(); 
      averageFps = undefined; 
       $("#fpsError").fadeIn();*/
    
    }
    
    
    var activeParticles = objects.length
    
    ctx.fillStyle = "#fff";
    ctx.font = "11px Verdana";
    ctx.fillText("FPS: " + fps + " lines: " + lines + " Active particles: " + activeParticles + " Average FPS: " + averageFps , 10, canvas.height-20);
    lines = 0;
    
    
    
   
}



// ----------------------------------------------------
// Init! //
//-----------------------------------------------------

var loop = function() {

    clearCanvas();
    updatePosition();
    
   
    
    window.particleEngine["animation"+id] = requestAnimationFrame(loop);
    isRunning = true;
    if (options.showStatistics) requestStatistics();

};

if (options.backgroundMode === "gradient") { 

    createBackgroundGradient();

} else if (options.backgroundMode === "image") {

    createBackgroundImage();

}

initAnimation();
loop();



}

options = {

    particleType:"square",
    particleText:"☆",
	emitterShape:"⚡",
	emitterType:"text",
    particlesNumber: 1000,
    initialSize: 3,
    randomSize: true,
    minimumSize:1,
    maximumSize:2,
    moveLimit: 150,
    durationMin: 10,
    durationMax: 500,
    
    lifeTime:true,
    lifeTimeMin:100,
    lifeTimeMax:160,
    
    // particles color
    red:220,
    green:245,
    blue:0,
    opacity:1,
    randomOpacity: true,
    particleMinimumOpacity:0.1,
    particleMaximumOpacity:0.9,
    sparkling:false,
    
    // connections between particles
    drawConnections: false,
    connectionRed:255,
    connectionGreen:255,
    connectionBlue:255,
    connectionOpacity:0.1,
    
    // mouse connections
    mouseInteraction:true,
    mouseInteractionType:"initial",
	
	
    drawMouseConnections:false,
    mouseInteractionDistance:300,
    mouseConnectionRed:255,
    mouseConnectionGreen:255,
    mouseConnectionBlue:255,
    mouseConnectionOpacity:0.1,
    
    showStatistics: true,
	backgroundMode:"gradient",
    backgroundImage:"img/wallpaper.jpg",
	
    
    // Use object with property names, to easy identify values in color picker

	backgroundColors: {

		"color1": {positionX:59,positionY:39,color:"001f47"},
		"color2": {positionX:80,positionY:14,color:"363235"},
		"color3": {positionX:27,positionY:82,color:"404040"}

	}
    
}

generateParticles(options,"animation")
