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
	this.getObjectBodies=function(obj,names,exclude={}){
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
  	var arrlen=arr.length;
  	var arrtemp=[];
    var i=0;
  	while(i<arrlen){
  	  var t=typeof arr[i];if(t=='number'||t=='string'||t=='boolean'||t==='undefined'||arr[i]==null){return uniquifyFallBack();}
  		if(arr[i].hasOwnProperty('$$unique_h')){return uniquifyFallBack();}
  		i++;
    }
    i=0;
    while(i<arrlen){
      if(!arr[i].hasOwnProperty('$$unique_h')){
        arrtemp.push(arr[i]);
        arr[i].$$unique_h=0;
      }
      i++;
    }	  
    i=0;
  	while(i<arrlen){
  		delete arr[i].$$unique_h;
  		i++;
    }
  	return arrtemp;
  }
	this.deepClone=function(obj,p={}){
	  if(!obj ||!(obj!==null && typeof obj==='object')){return obj}
		var {stopProp={},duplicate=true}=p,registry=new Map()
		var clone=obj.constructor===Array?obj.slice():{}
		registry.set(obj.clone)
		function propagate(obj,clone){
		  for (var a in obj){
			  if(stopProp[a]!==undefined){if(stopProp[a]===1){clone[a]=obj[a]};continue;}
				
				var type=typeof obj[a]
				if(obj[a]!==null && type==='object'){
					if(registry.has(obj[a])){clone[a]=registry.get(obj[a])}
  	      else{
  					clone[a]=obj[a].constructor===Array?obj[a].slice():{}
  				  registry.set(obj[a],clone[a])
  					propagate(obj[a],clone[a])
				  }
				}
			  else{clone[a]=obj[a]}
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
      return letter.toUpperCase();
		})
  }
	this.getHighestZ=function(node){
		if(!node.children.length){return 1}
		mark=-99999999
		var markHighest=v=>{if(v.style && v.style.zindex>mark){mark=v.style.zIndex}}
		Array.prototype.slice.call(node.children).forEach(markHighest)
		return mark
	}

}

/////////////////////////
////////polyfills////////
/////////////////////////

/////////////////////////
////////object.assign////
/////////////////////////
if (typeof Object.assign != 'function') {
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { 
      'use strict';
      if (target == null) { 
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { 
          for (var nextKey in nextSource) {
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
if(!window){var window}
if(window && !window.utils){
  window.utils={}
	Helpers.call(window.utils)
}
if(!module){var module={}}
if(!module.exports){module.exports={}}
module.exports.Helpers=Helpers
