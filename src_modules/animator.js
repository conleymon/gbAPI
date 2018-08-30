var ObjectAnimator=function(p={}){
  var{animation,conductor=window.conductor}=p
  var regexes={
    realNumber:/-*\d+(\.+\d+)?/g,
    numberMarker:/@@\d+/g
  }
  this.synchTransInc=false
  this.orig={};this.dest={};this.src={}
  this.fOrig={}//f stands for formatted
  this.fDest={}
  this.contour='smooth';
  this.duration=500
  this.restoreDuration=()=>this.duration=500
  this.starttime=new Date().getTime();
  this.desttime=new Date().getTime()+1000;
  this.offsettime=0//only during pause
  this.interval=30
  this.animHandle='';
  this.runningAnchor=false//general activity. all statuses:preanim, preinc,inc,postinc and postanim, running =true
  this.running=()=>this.runningAnchor
  this.conductor=conductor	
  this.preInc=[];this.postInc=[];this.preAnim=[];this.postAnim=[]

  this.registerConductor=function(conductor){
    this.conductor=conductor
    return this
  }
	
  this.animate=function(){// call preanimation callbacks, set starttime & desttime, roll
    this.runningAnchor=true
    for(var i=0;i<this.preAnim.length;i++){this.preAnim[i]()}
    this.starttime=this.now()
    this.desttime=this.starttime+this.duration
    this.startRoll()
    return this
  }

  this.stop=function(p={}){
    var {pause=false,runPostAnim=true,jumpToDest=false}=p
    clearTimeout(this.animHandle)//stop timeout,
    if(pause){this.offsettime=this.now();runPostAnim=false}
    if(jumpToDest){
      for(var i=0;i<this.preInc.length;i++){this.preInc[i]()}//run preInc calbacks
      this.inc(this.fDest,this.src,this.fOrig,1)//assign to dest, 
      for(var i=0;i<this.postInc.length;i++){this.postInc[i]()}//run postInc calbacks
    }
    if(runPostAnim){
      for(var i=0;i<this.postAnim.length;i++){this.postAnim[i]()}//run postanimation calbacks
    }
    this.runningAnchor=false
    return this
  }

	//////untested code

	this.pause=function(){this.stop({pause:true})}//untested, not in spec

  this.unPause=function(){//untested, not in spec
    var duration=this.now()-this.offsettime
    this.starttime+=duration
    this.desttime+=duration
    this.offsettime=0
    this.runningAnchor=true
    this.startRoll()
    return this
  }
	//////end untested code
  this.startRoll=function(){
    if(this.conductor){this.conductor.register({anim:this})}else{this.roll();}
  }

  this.roll=function(){//self perpetuation, always delayed one iteration
    if(this.running()){
      /*
      requestAnimationFrame(()=>{
        this.iterate()
        this.roll()
      })
      /*/
      this.animHandle=setTimeout(()=>{
        this.iterate()
        this.roll();//continue
      },Math.min(this.interval,this.desttime-this.now()))
      //*/
    }
  }

  this.iterate=function(){
    //preInc
    var perc=this.getProportion([this.starttime,this.desttime],this.now())
    if(perc>=1){this.stop({jumpToDest:true});return}
    for(var i=0,len=this.preInc.length;i<len;i++){this.preInc[i]()}//run preInc calbacks    
    var prog=this.mapProgress(perc);	  
    this.inc(this.fDest,this.src,this.fOrig,prog)//inc only does the setting of variables
    for(var i=0,len=this.postInc.length;i<len;i++){this.postInc[i]()}//run postInc calbacks
    return this    
  }

  this.update=function(){//callable from outside, immediate update
    this.iterate()
    return this
  }

  this.inc=function(dest,src,orig,perc){
    var propagate=(dest,src,orig)=>{
      for (var a in dest){
        if(dest[a].keeper===undefined){
        propagate(dest[a],src[a],orig[a])
      }
      else{//dest prop is primitive. increment
        //this is the anchor (hard coded animation)	
        var finalValues=dest[a].val.map((n,i)=>{
          var ret= perc===1?
          dest[a].val[i]:
          orig[a].val[i]+(dest[a].val[i]-orig[a].val[i])*perc
          return dest[a].round?Math.round(ret):ret
        })//increment each value in the val array
        var units=dest[a].units,counter=0
        //repackage values for the src
        var setval=units===''?finalValues[0]:units.replace(regexes.numberMarker,()=>{return finalValues[counter++]})//if there is some string context, insert the numbers
        if(a==='transform' &&this.synchTransInc){
          var holder=this.synchTransform({orig:src[a],dest:setval})
          setval=holder.dest
        }
        src[a]=setval
        }
      }
    }    
    propagate(dest,src,orig)
  }

  this.mapProgress=function (perc){
    if(!perc){console.error('no percent animator.js, mapprogress()')}
    if(this.contour=='linear'){return perc}
    if(this.contour=='smooth-sine'){
      return (Math.sin(-Math.PI/2 +perc*Math.PI)+1)/2}
    if(this.contour=='smooth'){
      var x=-1.57+(3.14*perc)
      return (Math.sin(x+(Math.cos(x)))/2)+.5;
    }
    if(this.contour=='para'){
      return perc*perc;
    }
    if(this.contour=='root'){
      return Math.sqrt(perc);
    }
    if(this.contour=='cubed'){
      return (Math.pow(-1+2*perc,3)+1)/2;
    }
    if(this.contour=='boomerang'){
      return perc+(Math.sin((-Math.PI/2)+(2*Math.PI*perc))+1)/2
    }
  }
	
  this.loadAnimation=function(p){//src,dest,orig,duration,preInc,postInc,preAnim,postAnim , assumes p is writable
    //sets orig, dest and src for a new animation
    //orig should only be submitted if src is not reflective of the current object status, like a style sheet (getcomputedstyle would fetch an appropriate orig parameter)
    if(p.conductor){this.registerConductor(p.conductor)}
    this.preInc=[];this.postInc=[];this.preAnim=[];this.postAnim=[];this.fDest={};this.fOrig={};this.synchTransInc=false
    var err=this.validateAnimation(p);if(!err.status){console.error(err.message);return;}
    clearTimeout(this.animHandle)
    if(!p.orig){p.orig=p.src}
    Object.assign(this,p)
    this.preInc=this.arrayWrap(this.preInc)
    this.postInc=this.arrayWrap(this.postInc)
    this.preAnim=this.arrayWrap(this.preAnim)
    this.postAnim=this.arrayWrap(this.postAnim)
    this.prepareAnimation(this.orig,this.dest,this.src,this.fOrig,this.fDest,p.stopProp)
    return this
  }

	this.safeParams={stopProp:1,synchTransInc:1}

  this.validateAnimation=function(p){
    var valid=new this.Valid();
    if(!p){valid.e('(no params)')}
    if(!p.src){valid.e('(no src)')}
    if(!p.dest){valid.e('(no dest)')}
    
    for(var k in p){
      if(this.safeParams[k]){continue}
      if(!this[k]){delete p[k];console.log('invalid parameter:'+k)}//conductor should be removed
    }
    return valid
  }

  this.prepareAnimation=function(orig,dest,src,fOrig,fDest,stopProp){
    if(!stopProp){var stopProp={}}
    //stopProp should be a number of further propagation steps. 0 means don't even copy the value. 1 copy and move on, 2 copy and enter one level. 
    //but right now, it is only equipped for 0 or 1 
    var propagate=(orig,dest,src,fOrig,fDest,stopProp)=>{
      
      for (var a in dest){
        //if props missing move right along
        if(src[a]===undefined){continue;}
        if(orig[a]===undefined){continue;}
        //if this destination address is not primative, enter
        if(dest[a]!==null && typeof dest[a]==='object'){
          if(orig[a]!==null && typeof orig[a]==='object'){
            if(src[a]!==null && typeof src[a]==='object'){
              if(stopProp[a]!==undefined){if(stopProp[a]===1){src[a]=dest[a]};continue}
              if(dest[a].constructor===Array){fOrig[a]=[];fDest[a]=[]}else{fOrig[a]={};fDest[a]={}}
              propagate(orig[a],dest[a],src[a],fOrig[a],fDest[a],stopProp)
            }else{continue;}//src prop not enterable
          }else{continue;}//origprop not enterable
        }
        else{//dest prop is primitive.
          if(orig[a]===undefined){continue;}//missing prop
          if(dest[a]===orig[a]){continue;}//values are the same
          var useOrig=orig[a],useDest=dest[a]
          if(a==='transform'){
            var synched=this.synchTransform({orig:orig[a],dest:dest[a],synchTransInc:this.synchTransInc})
            useOrig=synched.orig;
            useDest=synched.dest
          }
          var destVal=this.splitUnits(useDest);if(destVal==null){continue;}
          var origVal=this.splitUnits(useOrig);if(origVal==null){continue;}
          fDest[a]={}
          fOrig[a]={}
          Object.assign(fDest[a],destVal)
          Object.assign(fOrig[a],origVal)
        }
      }
    }
    propagate(orig,dest,src,fOrig,fDest,stopProp)
  }
  
  this.synchTransform=ObjectAnimator.synchTransform
  
  this.splitUnits=function(elem,propName){
    //return {val,units,keeper} or null if not animatable 
    var round=false
    if(typeof elem==='number'){return {val:[elem],units:'',keeper:true,round}}
    if(typeof elem==='string'){
    if(colours[elem]){elem=rgbaString(hexToRGBA(colours[elem]));round=true;}
    if(elem.match(/^#[a-zA-Z0-9]{3,6}$/)){elem=rgbaString(hexToRGBA(elem));round=true}
    if(elem.indexOf('rgb')>-1){elem=makeSureRGBA(elem);round=true}
    var val=elem.match(regexes.realNumber)//if there is a number, increment it
    var counter=0
    return val===null?val:{
      val:val.map((v)=>{return Number(v)}),
      units:elem.replace(regexes.realNumber,()=>{return '@@'+ counter++}),keeper:true,round}
    }    
    return null
  }

  this.Valid=function(){
    this.status=true;this.message='';
    this.e=function(message){this.status=false,this.message+='('+message+')'}
  }

  this.now=function(){
    return new Date().getTime();
  }

  this.getProportion=function(range,value){
    return (value-Math.min(range[0],range[1]))/Math.abs(range[1]-range[0])
  }

  this.arrayWrap=function(thing){
	  if(Object.prototype.toString.call(thing)!=='[object Array]'){
		  return [thing]
	  }else{return thing} 
	}

  this.anim=function(anim){
    this.loadAnimation(anim)
    this.animate()
    return this
  }

  this.getShortHand=function(){
    return function(p={}){
      return new ObjectAnimator().loadAnimation(p).animate()
    }	
  }

  if(animation){
    if(animation.dest){this.loadAnimation(animation)}
    if(animation.conductor){this.registerConductor(animation.conductor)}
  }

  if(conductor){this.registerConductor(conductor)}
}

if(!window.anim){
  window.anim=function(p={}){
    return new ObjectAnimator().loadAnimation(p).animate()
  }
}

ObjectAnimator.setConductor=function(conductor){
  ObjectAnimator.prototype.conductor=conductor
}

ObjectAnimator.removeConductor=function(conductor){
  ObjectAnimator.prototype.conductor=undefined
}

ObjectAnimator.synchTransform=function(p={}){//orig and dest should be strings
  var{orig,dest,synchTransInc=false}=p,origArray=[],destArray=[],origU=new Map(),destU=new Map(),origVal
  var breakOrig=orig.match(/[a-zA-Z]+\([^\)]*\)/g),breakDest=dest.match(/[a-zA-Z]+\([^\)]*\)/g)
  if(breakOrig){breakOrig.forEach((val,i)=>{val=val.replace(/\s/g,'');origU.set(val.split('(')[0],val)})}
  else{breakOrig=[]}		
  if(breakDest){breakDest.forEach((val,i)=>{val=val.replace(/\s/g,'');destU.set(val.split('(')[0],val)})}		
  else{breakDest=[]}
  if(!synchTransInc){
    origU.forEach((v,k)=>{
      destArray.push(destU.has(k)?destU.get(k):origU.get(k))
      origArray.push(origU.get(k))
      destU.delete(k)
    })
  }
  destU.forEach((v,k)=>{
    destArray.push(destU.get(k))
    origArray.push(origU.has(k)?origU.get(k):transformDefaultTable[k])			
  })
  return{orig:origArray.join(' '),dest:destArray.join(' ')}
}

var transformDefaultTable={
  translate:'translate(0,0)',	
  translate3d:'translate3d(0,0,0)',	
  translateX:'translateX(0)',	
  translateY:'translateY(0)',	
  translateZ:'translateZ(0)',
  scale:'scale(1,1)',
  scale3d:'scale3d(1,1,1)',
  scaleX:'scaleX(1)',
  scaleY:'scaleY(1)',
  scaleZ:'scaleZ(1)',
  rotate:'rotate(0deg)',
  rotate3d:'rotate3d(0,0,0,0deg)',
  rotateX:'rotateX(0deg)',
  rotateY:'rotateY(0deg)',
  rotateZ:'rotateZ(0deg)',
  skew:'skew(0deg,0deg)',
  skewX:'skewX(0deg)',
  skewY:'skewY(0deg)',
  perspective:'perspective(1000000px)',
}


var colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

var hexToRGBA=function (hex) {
    "use strict";
    if (hex.charAt(0) === '#') {
      hex = hex.substr(1);
    }
    if ((hex.length < 2) || (hex.length > 6)) {
      return false;
    }
    var values = hex.split(''),
      r,
      g,
      b;

    if (hex.length === 2) {
      r = parseInt(values[0].toString() + values[1].toString(), 16);
      g = r;
      b = r;
    } else if (hex.length === 3) {
      r = parseInt(values[0].toString() + values[0].toString(), 16);
      g = parseInt(values[1].toString() + values[1].toString(), 16);
      b = parseInt(values[2].toString() + values[2].toString(), 16);
    } else if (hex.length === 6) {
      r = parseInt(values[0].toString() + values[1].toString(), 16);
      g = parseInt(values[2].toString() + values[3].toString(), 16);
      b = parseInt(values[4].toString() + values[5].toString(), 16);
    } else {
      return false;
    }
		return{r, g, b, a:1}
    //return [r, g, b];		
  }
var makeSureRGBA=function(rgba){
  if(rgba.indexOf('rgba')>-1){return rgba}
	//rgb(255,255,255)
	rgba=rgba.replace('rgb','rgba')
	rgba=rgba.replace('rgbaa','rgba')
	var holder=rgba.split(')')
	return holder[0]+',1)'
}
var rgbaString=function(rgba){
	if(typeof rgba==='object'){
	  return'rgba('+rgba['r']+','+rgba['g']+','+rgba['b']+','+rgba['a']+')'
	}
	if(rgba.constructor===Array){
	  return 'rgba('+rgba.join(',')+')'
	}
}

export {ObjectAnimator}