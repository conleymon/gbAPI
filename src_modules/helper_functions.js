function Helpers(){
  this.OA=function(){return Object.assign(...arguments)}
  this.now=function(){return new Date().getTime()}
  this.gi= function(str){return document.getElementById(str)}
  this.qs= function(str){return document.querySelector(str)}
  this.qsa= function(str){return document.querySelectorAll(str)}
  this.getProportion=function(range,value,rev){
    var ret=(value-Math.min(range[0],range[1]))/Math.abs(range[1]-range[0])
    return rev?1-ret:ret
  }
  this.getMouseRelation=function(elem,ev){
    //window.scrollx
  	//multiple touch relations are not yet implemented, but full spec should return an array of mouse relations
  	// for mouse events this array will be of length one, for multiple touches, there should be a relation for each touch
  	var dimen=elem.getBoundingClientRect(elem)
  	var rel={}
  	var contacts=ev.type.indexOf('touch')==-1?{x:ev.clientX,y:ev.clientY}:{x:ev.touches[0].clientX,y:ev.touches[0].clientY}
  	rel.xprop=this.getProportion([dimen.left,dimen.right],contacts.x-window.scrollX)
  	rel.yprop=this.getProportion([dimen.top,dimen.bottom],contacts.y-window.scrollY)
  	return [rel];
  	
  }
	this.arrayWrap=function(thing){
	  if(Object.prototype.toString.call(thing)!=='[object Array]'){
		  return [thing]
	  }else{return thing} 
	}
	this.getObjectBodies=function(obj,names,exclude={}){//takes an object and returns the selected properties in an array
	  var elemBodies=[]
		var elemNames=names==='all'?Object.keys(obj):this.arrayWrap(names)
		for(var i=0,len=elemNames.length;i<len;i++){
  	  if(exclude.funcs &&typeof obj[elemNames[i]]==='function'){continue}
		  if(obj[elemNames[i]]){elemBodies.push(obj[elemNames[i]])}
		}
		return elemBodies	  
	}
	this.makeContainer=function(thing){
	  if(thing===undefined){return thing}
	  //takes an object and returns a new object with the values as keys 
	  var newthing={}
		for(var k in thing){
		  newthing[thing[k]]=1;
		}
		return newthing
	} 


  this.uniquifyFallBack=function (arr) {
    var temp=[]
  	var arrlen=arr.length;
  	var i=0;
    while(i<arrlen){
  	  if(temp.indexOf(arr[i])==-1){
  		  temp.push(arr[i]);
  		}
    	i++;
    }
    return temp;
  }
  
  this.uniquify=function(arr){
    // for large arrays this function takes three passes to avoid nested loops, but depends on free propertynamespace for testing. Falls back on uniquify.
  	var arrlen=arr.length;
  	var arrtemp=[];
  	//run one loop to determine if the propertyname is free, and there are no primitives
    var i=0;
  	while(i<arrlen){
  	  var t=typeof arr[i];if(t=='number'||t=='string'||t=='boolean'||t==='undefined'||arr[i]==null){return uniquifyFallBack();}
  		if(arr[i].hasOwnProperty('$$unique_h')){return uniquifyFallBack();}
  		i++;
    }
  	//if propertyname is free, run another loop setting the propertyname for each object in the array, and passing only the elements whose objects do not already contain it 
    i=0;
    while(i<arrlen){
      if(!arr[i].hasOwnProperty('$$unique_h')){
        arrtemp.push(arr[i]);
        arr[i].$$unique_h=0;
      }
      i++;
    }	  
  	//clean up the random property marker 
    i=0;
  	while(i<arrlen){
  		delete arr[i].$$unique_h;
  		i++;
    }
  	return arrtemp;
  }
	this.deepClone=function(obj,p={}){//preserves circular references. Function references point to the original
	  if(!obj ||!(obj!==null && typeof obj==='object')){return obj}//null,undefined,
		var {stopProp={},duplicate=true}=p,registry=new Map()
		var clone=obj.constructor===Array?obj.slice():{}
		registry.set(obj.clone)
		function propagate(obj,clone){
		  for (var a in obj){
			  if(stopProp[a]!==undefined){if(stopProp[a]===1){clone[a]=obj[a]};continue;}
				
				var type=typeof obj[a]
				if(obj[a]!==null && type==='object'){
				  //have I seen you before?
					//if so there should be an object in the regitry associatedwith you. let me use that.
					if(registry.has(obj[a])){clone[a]=registry.get(obj[a])}
					//othrewise, create new clone address, and store in registry in association with this object
  	      else{
  					clone[a]=obj[a].constructor===Array?obj[a].slice():{}
  				  registry.set(obj[a],clone[a])
  					propagate(obj[a],clone[a])
				  }
				}
			  else{clone[a]=obj[a]}//primitive
			}
		}
		propagate(obj,clone)
		return clone
	}
  ////colors
  this.shadeColor=function(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  }
	this.camelize=function(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      //return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
      return letter.toUpperCase();
    })//.replace(/\s+/g, '');
  }//might have use for the javasceript naming conventions commented out here
	this.getHighestZ=function(node){
		if(!node.children.length){return 1}
		mark=-99999999
		var markHighest=v=>{if(v.style && v.style.zindex>mark){mark=v.style.zIndex}}
		Array.prototype.slice.call(node.children).forEach(markHighest)
		return mark
	}
  this.getApproxDistance=(function(){//returns a function that takes x and y as width and height, and returns the pythagorean distance from the origin to their vector sum
	//(later may also take points {x1,y1}, {x2,y2} and extrapolate their distance and carry on from there)
      //make memo table, much less expensive than sqrt
			var runs=1
      var multipleTable={}
      var x=1,y=0,inc=.002//inc sets the number of values in the table//migth have to test against binary problems
			var roundVal=runs/inc 
      for(var i=0;y<runs+inc;y+=inc){
        var actual=Math.pow(Math.pow(x,2)+Math.pow(y,2),.5)
      	var sum=x+y
      	var multiple=actual/sum
      	var use=Math.round(roundVal*y)/roundVal
      	multipleTable[use]=multiple
      }
      return function(p){//h and w take the same place as x and y. 
			  var{h,w,x,y,height,width,p1,p2}=p//p1 and p2 can be instituted later if need be. 
      	var x=Math.abs(x||w||width||p2.x-p1.x),y=Math.abs(y||h||height||p2.y-p1.y)
      	var div=(x===0&&y===0)?1:(x>y)?y/x:x/y
      	var handle=Math.round(div*roundVal)/roundVal
				if(multipleTable[handle]===undefined){console.error('no value found in the multiple table. might be a binary error in number representation. helper functions.js getApproxDistance');}
        var multiple=multipleTable[handle]
      	return (x+y)*multiple
      }
  })()

}

/////////////////////////
////////polyfills////////
/////////////////////////

/////////////////////////
////////object.assign////
/////////////////////////
if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}
//////////end object.assign

/*
//a few funcs for easy access on the window
window.gi= function(str){return document.getElementById(str)}
window.qs= function(str){return document.querySelector(str);console.log('caller',arguments.caller)}
window.getMouseRelation=function(elem,ev){
  //window.scrollx
	//multiple touch relations are not yet implemented, but full spec should return an array of mouse relations
	// for mouse events this array will be of length one, for multiple touches, there should be a relation for each touch
	var dimen=elem.getBoundingClientRect(elem)
	var rel={}
	var contacts=ev.type.indexOf('touch')==-1?{x:ev.clientX,y:ev.clientY}:{x:ev.touches[0].clientX,y:ev.touches[0].clientY}
	rel.xprop=getProportion([dimen.left,dimen.right],contacts.x-window.scrollX)
	rel.yprop=getProportion([dimen.top,dimen.bottom],contacts.y-window.scrollY)
	return [rel];
	
}

*/
if(!window){var window}
if(window && !window.utils){
  window.utils={}
	Helpers.call(window.utils)
}
if(!module){var module={}}
if(!module.exports){module.exports={}}
module.exports.Helpers=Helpers
