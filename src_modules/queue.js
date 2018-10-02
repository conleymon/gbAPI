/*
Copyright Conley Johnson 2018
License:MIT

interrupt and stop should be tested. It may hang the queue upon restart
interrupt().add(...) may need kickstart

*/
if(module &&module.exports){
  var ObjectAnimator=require('animator').ObjectAnimator
}
//import {ObjectAnimator} from 'animator'

var clearResults=(p={})=>{
  if(p.constructor===Array){p={l:p}}
  var{l=[]}=p//l stands for line as in queueLine, but any array fitting the queueLine format
  l=arrayWrap(l)
  var len=l.length
  for(var index=0;index<len;index++){
    if(l[index].result!==undefined){delete l[index].result}
    l[index].resolved=false
    l[index].initiated=false
    l[index].evaluation=null
  }
  return l
}

var  arrayWrap=function(thing){
  if(Object.prototype.toString.call(thing)!=='[object Array]'){
    return [thing]
  }else{return thing} 
}

var format=(p)=>{
  p=p?p:()=>{}//if undefined, set with a function	
  return clearResults(
  arrayWrap(p).map((val)=>{
    if(val.constructor===Promise){val=Queue.promise(val)}
    if(typeof val==='object' && val.task && !val.preCondition && !val.postCondition  && val.wait!==false){val.wait=true}//if a task is submitted in an object, without conditions and without wait, set wait to true. Otherwise, a function can be submitted raw
    if(val.constructor===Queue){val=Queue.queue(val);}
    if(typeof val==='function'){val={task:val}}
    var{task=()=>{},preCondition=()=>true,postCondition=()=>true,wait=false,name=undefined, comment='',sec=3600,timeout=()=>{},earlyTermination=()=>{},getValue=false,getValueFromTask=false,queue=false}=val				
    return {task,preCondition,postCondition,wait,name,comment:task.toString(),sec,timeout,earlyTermination,getValue,getValueFromTask,initiated:false,resolved:false,queue,subscriptions:new Map(),evaluation:null}
    //wait means, wait for a restart from the task. getvalue is an override function for retrieving the value to store after the promise is done. if not set, the argument provided by done is used
    })
  )		
}

//formfunctions
function formToObject(form){
  var obj={};
  var elemarray
  if(typeof form==='string'||typeof form==='number'){elemArray=document.getElementById(form).elements;}
  else{elemarray=form.elements}
  var elemlen=elemarray.length;
  var checknum//for trying to convert strings to numbers
  for (var i = 0; i < elemlen; i++) {
    var n=elemarray[i].name.replace(/\[\]/g,'');
    if(n==''){n=elemarray[i].id}
    obj[n]=elemarray[i].value;
    checknum=Number(obj[n]);if(!isNaN(checknum)){obj[n]=checknum}
    if(elemarray[i].type=='checkbox'){
      obj[n]=elemarray[i].checked;
    }
    if(elemarray[i].type=='select-multiple'){
      obj[n]=getMultipleSelectValues(elemarray[i]);
    }
  }
  return obj;
}

function getMultipleSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;
  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];
    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  result=result.map(cSTFV)
  return result;
}

function cSTFV(val){//convert strings to functional values
  if(val==='true'){return true}
  if(val==='false'){return false}
  var v=Number(val);
  if(!isNaN(val)){return v}else{return val}		
}
//end form functions

function Queue(){
  var queueLine=[];//where the tasks and conditions are stored
  var queueMap=new Map()//taskobj->name,index
  //queueMap is for quick searches
  var queueIndex=0;//iteratorguide for the queue
  var queueLength=0;//number of tasks queued up
  var queueHandle=false;//the handle for the timeouts
  var timeoutHandle=false//each 
  var checkSpeed=175;//interval for conditional checks
  var checksRunning=false,waitRunning=false;
  var terminated=false//stopped callback has been called, and it is locked, unless explicitly opened by calling a modifier (like add, or splice) or calling start({unterminate:true})
  var callBack=()=>{}
  var initialValue=undefined
  var subscriptions=new Map()
  var repeat=false
  
  this.running=(p={})=>{if(p.detail){return{checksRunning,waitRunning}};return checksRunning||waitRunning}

  this.setCheckSpeed=(speed)=>{checkSpeed=speed;return this}

  this.finally=(cb)=>{
    callBack=cb;
    if(!more() && queueLength>0 && queueLine[queueIndex].resolved){
      cb(this.status(true))
    };
    return this
  }

  this.initVal=(v)=>{initialValue=v;return this}

  this.status=function(control=false){
    return {
      currentTask:queueLine[queueIndex],
      queueLength,
      queueIndex,
      waitRunning,
      checksRunning,
      queueLine:queueLine.slice(),
      control:control?this:null
    }
  }

  this.currentVal=function(){
    return queueLength>0 &&queueLine[queueIndex]?queueLine[queueIndex].result:initialValue
  }

  this.lastVal=function(){
    return queueLength>0 &&queueLine[queueLength-1]?queueLine[queueLength-1].result:initialValue
  }

  this.add=function(p={},insert){ //takes single value or an array, and each task(exposed or wrapped in an array) is either a function or a task object
    var actions=this.format(p)
    if(!insert){queueLine.push.apply(queueLine,actions)}
    else{queueLine.splice(queueIndex+1,0,...actions);}		
    bookKeep()    
    return this
  }

  this.insert=function(p={}){ //takes single value or an array, and each task(exposed or wrapped in an array) is either a function or a task object
    return this.add(p,true)
  }

  this.repeat=(p={})=>{
    repeat=true  
  }

  this.clear=function(){this.stop({clear:true});queueIndex=0;queueLine.length=0;bookKeep();return this}

  this.stop=function(p={}){
    //wait bool, clear bool, terminate bool
    clearTimeout(queueHandle);
    checksRunning=false;waitRunning=false;
    if(p.wait && !p.clear ){ waitRunning=true;}else{ 
      clearTimeout(timeoutHandle)
    }
    if(p.terminate){
      terminated=true;clearTimeout(timeoutHandle);
      callBack(this.status(true))
      this.publish()
    }
    return this
  }

  this.kickStart=(p={})=>{
    if(this.running()){return}
    this.start()
    return this
  }

  this.start=(p={})=>{
    if(terminated && !p.unterminate){/*console.error('this queue has been terminated. to restart, restart({unterminate:true}) queue.js start()')*/}else{terminated=false}	 
    if(p.indexMatch){if(p.indexMatch!==queueIndex){/*console.log('tried to restart:'+p.indexMatch+'. current index:'+queueIndex);*/return this}}
    if(p.initialValue!==undefined){initialValue=p.initialValue}//only matters when starting from 0
    if(p.callBack){this.finally(p.callBack)}
    clearTimeout(queueHandle);clearTimeout(timeoutHandle);listen();
    return this	  
  }

  var listen=()=>{
    checksRunning=true;waitRunning=true
    var q=queueLine[queueIndex];
    if(!q.initiated){
      if(q.preCondition()){
        var result=q.task(getControlPackage())		
        if(result instanceof Promise){ this.insert(result)}//should route through Queue.promise, where then->(result)=>p.done(result) will be attached
        if(!q.wait){
          q.result=result
        }
        q.initiated=true
      }
      if(q.wait){
        this.stop({wait:true});return;//advance will be triggered at the end of the task. generally postCondition return true, but thats up to the developer
      }
    }
    if(q.initiated){
      if(q.postCondition()){ if(q.getValue){q.result=q.getValue(getControlPackage({includeDone:false}))};q.resolved=true; this.moveOn();return   }
    }
    queueHandle=setTimeout(()=>{listen();},checkSpeed);
  }

  var getControlPackage=(p={})=>{
    var {includeDone=true}=p
    var ret= {
      control:this,
      done:function(indexMatch,result){
        if(queueLine[indexMatch]===undefined){/*console.log('index '+indexMatch+' no longer exists in queue. queue.js listen()');*/return}
        queueLine[indexMatch].result=result;
        if(!waitRunning){return}						
        setTimeout(()=>{this.start({indexMatch})},0)//set timeout is to take it out of the call stack
      }.bind(this,queueIndex),
      result:getPreviousResult(),
      evaluate:function(task,val){task.evaluation=val}.bind(this,queueLine[queueIndex]),
    }
    if(!includeDone){delete ret.done}
    return ret
  }

  var finished=()=>{return queueIndex>=queueLength-1 && terminated}

  var more=()=>{return queueLine[queueIndex+1]}

  this.moveOn=()=>{//move to the next step if it exists. if not, terminate/ should be the only way to advance
    this.publishTask({task:queueLine[queueIndex]})
    if(!more() && !repeat){this.stop({terminate:true});return false}
    if(!repeat){queueIndex++}
    else{
      clearResults([queueLine[queueIndex]])
    }
    repeat=false
    this.start()
    startTimeout()
    return true
  }

  var startTimeout=()=>{
    clearTimeout(timeoutHandle)
    timeoutHandle=setTimeout(()=>{
      queueLine[queueIndex].timeout( getControlPackage({includeDone:false}) )
      this.moveOn()//going to have to make this explicitly the devs responsibility or take this control off the table. 
    },queueLine[queueIndex].sec*1000)	
  }
  var getPreviousResult=()=>{
    if(queueLine[queueIndex].getValueFromTask){
      var look=queueLine[queueIndex].getValueFromTask
      if(typeof look==='string'){
        for(let m=0;m<queueLength;m++){
          if(queueLine[m].name===look){return queueLine[m].result}
        }
      }
      else if(typeof look==='number' && Math.abs(look)>=m){return queueLine[queueIndex-Math.abs(look)].result}
    }
    return queueIndex>0?queueLine[queueIndex-1].result:initialValue
  }

  this.change=(p={})=>{
    queueLine.splice(queueIndex+1);
    return this.add(p)//add will bookkeep
  }

  this.interrupt=(p={})=>{//only performs the earlyTermination func..you have to then stop or moveon
    var{and}=p
    if(queueLine[queueIndex]){queueLine[queueIndex].earlyTermination(getControlPackage({includeDone:false}))}
    if(and ==='stop'){this.stop()}else{this.moveOn()}
    return this
  }

  this.splice=(p={})=>{//splices queueLine, but uses search  to find the indexes
    var{replacement=[]}=p
    var {from,to}=getIndexes(p)//{action, index}
    if(from.index<queueIndex+1){console.log('from index'+from.index+' includes past/current tasks in the queue. setting from index to very next task index.')}
    from.index=queueIndex+1
    if((from.index>to.index)){
      console.error('indexes off->queue.js->splice()',{from,to});
    }else{
      var remove=to.index-from.index+1//plus 1 is to make it inclusive of the last element
      queueLine.splice.apply(queueLine,[from.index,remove].concat(this.format(replacement)))
      bookKeep()																										
    }
    return this
  }

  this.delete=function(p={}){
    var found=this.find(p)
    if(found.index<queueIndex+1){console.error('task is past or current. Cannot be deleted');return this}
    if(found){queueLine.splice(found.index,1);bookKeep()}
    return this
  }

  this.pop=()=>{
    if(queueIndex===queueLength-1){console.error('tried to pop last task, which has already been initiated queue.js->pop');return this}
    queueLine.pop();bookKeep();return this
  }

  this.slice=function(p={}){//returns a new array with new shallow action object clones. setting their properties will not alter the action objects they were cloned from
    //however,performing methods on the sliced action objects will operate on the originals
    //and in fact some of the functions submitted will operate on important closure variables
    var {from,to}=p.from||p.to?getIndexes(p):{from:{index:0}}//if none submitted, splice the whole queueline 
    if((to && from.index>to.index) || !from){
      console.error('indexes off->queue.js->get()',{from,to});return[]
    }else{ //
      var args=to?[from.index,to.index]:[from.index]
      if(args.indexOf(undefined)!==-1){console.error(new Error('unable to find criteria'),from,to);return []}
      var ret=clearResults(queueLine.slice.apply(queueLine,args).map((val)=>{return Object.assign({},val)}))
      ret.forEach((val)=>{
        var newMap=new Map()
        val.subscriptions.forEach( (v,k)=>{newMap.set(k,v)} )
        val.subscriptions=newMap
  		})
      return ret
    }		
  }

  var getIndexes=(p={})=>{
    return{from:this.find(p.from),to:this.find(p.to)}
  }

  this.find=function(p={}){
    return queueMap.get(p.name||p.index||p.taskObj||p.task)
    //you could actually extend this to search by any criteria in the queueline
  }

  var bookKeep=()=>{//stores keys by name, index,task[the function to execute], action[the action package submitted] 
    //tears map down and rebuilds because queueLine indexes shift
    //modifying the queueLine calls bookKeep. renders containing loops order 5*A*N where A is the number of outer iterations and N is the number of tasks in the queue 
    queueMap.clear();queueLength=queueLine.length
    for(var index=0;index<queueLength;index++){
      var action=queueLine[index]
      var pack={action,index},task=action.task,name=action.name//take out the name and task for setting in map
      if(this.find({name})){console.error('duplicate names queue.js bookKeep',name,index)}
      if(this.find({taskObj:pack})){console.error('duplicate taskObjects. second dup. will be skipped. queue.js bookKeep',name,index)}
      if(this.find({task})){console.error('duplicate tasks, only the last inserted can be returned through find queue.js bookKeep',name,index)}
      if(name!==undefined){queueMap.set(name,pack)}
      queueMap.set(index,pack)
      queueMap.set(action,pack)//duplicate packs??
      queueMap.set(task,pack)//duplicate functions should be allowed.
    }
    if(!this.allDone()){terminated=false}
  }

  this.clearResults=()=>{
    clearResults(queueLine);return this
  }

  this.reset=()=>{queueIndex=0;this.clearResults();return this}

  this.format=(p)=>{return format(p)}

  this.allDone=()=>{return queueLine.every((val)=>{val.resolved})}

  this.subscribe=(p={})=>{
    var{cb}=p
    if(typeof p==='function'){cb=p}
    if(!cb){console.error('queue.js subscribe(func||{cb:func})->no function')}
    subscriptions.set(cb,1)
    return this
  }

  this.unsubscribe=(p)=>{
    var{cb}=p
    if(typeof p==='function'){cb=p}
    subscriptions.delete(cb)
    return this
  }

  this.publish=function(){//publishes that the entire queue is finished
    subscriptions.forEach((v,k)=>{
      k(this.status())
    })
    subscriptions.clear()
  }

  this.subscribeTask=(p)=>{
    var{name,index,cb}=p
    if(!cb){console.error('queue.js subscribeTask({name||index,cb})->no function to attach:',p);return this}
    var task=this.find(p)
    if(!task){console.error('queue.js subscribeTask()->unable to find task:',p);return this}
    task=task.action
    if(task.resolved){cb(task);return this}
    task.subscriptions.set(cb,1)
    return this
  }

  this.unsubscribeTask=(p)=>{
    var{name,index,cb,check=false}=p
    if(!cb){console.error('queue.js subscribeTask({name||index,cb})->no function to unattach:',p);return this}
    var task=this.find(p)
    if(!task){console.error('queue.js subscribeTask()->unable to find task:',p);return this}
    task=task.action
    if(check){console.log('task',task,'has callback'+cb.toString(),task.subscriptions.has(cb))}
    task.subscriptions.delete(cb,1)
    return this
  }

  this.publishTask=function(p={}){
    var{task}=p;if(!task){return this}
    var subscriptions=task.subscriptions
    subscriptions.forEach((v,k)=>{
      k(task)
    })
    subscriptions.clear()	  
    return this
  }
	
  this.all=(p)=>{this.add(Queue.all(p));return this}
  this.insertAll=(p)=>{this.insert(Queue.all(p));return this}
  
  this.race=(p)=>{this.add(Queue.race(p));return this}
  this.insertRace=(p)=>{this.insert(Queue.race(p));return this}
  
  this.wait=(p)=>{this.add(Queue.wait(p));return this}
  this.insertWait=(p)=>{this.insert(Queue.wait(p));return this}
  
  this.animate=(p)=>{this.add(Queue.animate(p));return this}
  this.insertAnimate=(p)=>{this.insert(Queue.animate(p));return this}
  
  this.transition=(p)=>{this.add(Queue.transition(p));return this}
  this.insertTransition=(p)=>{this.insert(Queue.transition(p));return this}
  
  this.blink=(p)=>{this.add(Queue.blink(p));return this}
  this.insertBlink=(p)=>{this.insert(Queue.blink(p));return this}
  
  this.listen=(p)=>{this.add(Queue.listen(p));return this}
  this.insertListen=(p)=>{this.insert(Queue.listen(p));return this}
  
  this.listenTask=(p)=>{this.add(Queue.listenTask(p));return this}
  this.insertListenTask=(p)=>{this.insert(Queue.listenTask(p));return this}
  
  this.ajax=(p)=>{this.add(Queue.ajax(p));return this}
  this.insertAjax=(p)=>{this.insert(Queue.ajax(p));return this}

  this.fetch=(p)=>{this.add(Queue.fetch(p));return this}
  this.insertFetch=(p)=>{this.insert(Queue.fetch(p));return this}

  this.loadIFrame=(p)=>{this.add(Queue.loadIFrame(p));return this}
  this.insertLoadIFrame=(p)=>{this.insert(Queue.loadIFrame(p));return this}


}

Queue.wait=(time)=>{//time in ms
  if(typeof time==='object' &&time.from &&time.to){ var time=Math.random()*(time.to-time.from)}
  var task=(p)=>{setTimeout(()=>{p.done(p.result);},time)}//pass previous result through					 
  return {task}
}

Queue.queue=function(p={}){//starts another Queue instance and hooks up the call back 
  var{queue}=p
  if(p.constructor===Queue){queue=p}
  var task=function(p){
    queue.clearResults().reset().finally(p.done).kickStart();
  }
  return Object.assign({task,wait:true,queue},p)
}


Queue.promiseWrap=function(p={}){//creates a promise, hooks this queue up to that promise (through finally) and returns the promise
  var{toDo}=p//async function, queue, promise
  if(!toDo ||!toDo.constructor){console.log('wrong argument in promiseWrap queue.js argument submitted:',p);return}
  var resolve=function(res){
    if(toDo.constructor===Queue){
      this.finally(res)
    }
    /*
    tasks need a queue to activate them.
    you might wrap an asynchronous function in a promise
      hmm, queue should take asynchronous functions...
    and other another promise?
    */
  }
  return new Promise(resolve)
}

Queue.promise=function(p={}){//wraps a queue in a task which does then->p.done 
  var{promise}=p
  if(p instanceof Promise){promise=p}
  var task=function(par){//executed when reached in the queue. 
    promise.then((result)=>{par.done(result)} , (result)=>{par.done(result)})
  }
  return Object.assign({task,promise,wait:true},p)
}

//takes (query,data)  ,  ({query,data})  ,  ({taskParams, fetchPackage:{query,data}})
Queue.fetch=function(pack={},data={}){
  //format to {taskParams, fetchPackage:{query,data}} 
  if(!pack.fetchPackage){
    pack={
      fetchPackage:{
        query : typeof pack==='string' ? pack : pack.query,
        data : pack.data ? pack.data : data
      }
    }  
  }

  //check format a little bit
  if(!pack.fetchPackage.query){console.error('invalid fetchPackage subimtted to fetch in Queue', pack)}//use the package if it doesn't contain designated package for the fetch function


  pack.task=(p)=>{
    var prom=fetch(pack.fetchPackage.query,pack.fetchPackage.data)
    return prom instanceof Promise ? prom:new Promise(function(resolve){setTimeout(()=>{resolve()},0)
    })
  }//Queue promise will extract the promise result and pass it down the queue
  
  pack.wait=false//because you're returning a promise.
  return pack
}
Queue.ajax=function(p={}) {
  var{url='', data={},synch=true,method='POST'}=p
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  var task=function(par={}){	
    var params
    if(data.nodeName && data.nodeName.toLowerCase()==='form'){
      if(data.action){url=data.action};
      params=formToObject(data)
    }
    params = typeof data == 'string' ? data : Object.keys(data).map(
      function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
    ).join('&');
    
    xhr.addEventListener('readystatechange',()=>{console.log(xhr.status)})
    xhr.addEventListener( 'load', function() {
      par.done({response:xhr.responseText,status:xhr.status})
    })
    xhr.open(method, url,synch);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(params);
  }
  return Object.assign({task,wait:true,xhr},p)
}

Queue.loadIFrame=function(p={}){
  var{url,IFrame,src}=p
  if(!url){url=src}
  var task=(par={})=>{
    IFrame.addEventListener('load',function(){par.done(IFrame)})
    IFrame.src=url
  }
  return Object.assign({task},p)
}

Queue.listen=function(p={}){
  var{queue,start=false}=p
  if(p.constructor===Queue){queue=p}
  var task=(p)=>{
    if(queue.allDone()){p.done();return}
    queue.subscribe({cb:p.done})
    if(start){queue.kickStart()}
  }
  return Object.assign({task,wait:true},p)
}

Queue.listenTask=function(p={}){
  var{queue=new Queue(),name='null12345',index,start=false}=p
  var task=(p)=>{
    var t=queue.find({name,index})
    if(!t){console.error('queue.js Queue.listenTask({queue,name,index,start}) task not found for listening')}
    if(t && t.resolved){p.done(t.result);return}
    queue.subscribeTask({name,index,cb:p.done})
    if(start){queue.kickStart()}
  }
  return Object.assign({task,wait:true},p)
}

Queue.race=function(p){
  return Queue.all(p,true)
}

Queue.all=function(p={},race){  
  var stalls=[]
  var queue,useP=p.constructor===Array//is p the raw data or part of a package
  var actions=(useP?p:p.actions).map((val)=>{return format(val)})
  if(actions.length===0){return{}}
  var doneHolder={done:()=>{}}//place holder for the allTask resolution function
  var check=()=>{return stalls.every(val=>val.resolved)}
  var retrieve=function(i,result){//result is a status() request submitted by the finally call after each stall queue finishes. So an allTask returns an array of all the final status requests of all it's tasks.
    stalls[i].result=result
    stalls[i].resolved=true	  
    if(race){doneHolder.done(result);check=()=>{return false}}
    if(check()){
      doneHolder.done(stalls.map(val=>val.result))
    }
  }
  actions.forEach(function(val,i){
    queue=new Queue().add(val).finally(retrieve.bind(null,i))//queues should call back with the status report
    stalls[i]={queue,result:undefined,resolved:false}    
  })
  var earlyTermination=()=>{stalls.forEach((val)=>{if(val.queue){val.queue.interrupt({and:'stop'})}})}
  var task=(p)=>{
    doneHolder.done=p.done
    stalls.forEach((val)=>{val.queue.start()})
  }
  return Object.assign({task,earlyTermination},useP?{}:p)
}

Queue.transition=function(par={}){
  var {node,style,duration=1,timing='ease-in-out',synch=true,contours={}}=par
  var task=(p)=>{
    //hook up the function
    var evFunc=function(){
      node.removeEventListener('transitionend',evFunc)
      p.done()
    }
    node.addEventListener('transitionend',evFunc)
    //set the transition
    if(synch&&style.transform){
      var {dest}=Queue.synchTransform({orig:node.style.transform,dest:style.transform})
      style.transform=dest
    }
    var transProps=[]
    for(let k in style){
      transProps.push(k+' '+duration+'s '+timing)
    }
    Object.assign(node.style,{transition:transProps.join(', ')},style)
    //set the style
  }
  return Object.assign({task,wait:true},par)
}

Queue.animate=function(par={}){
  if(!ObjectAnimator){console.error('You need the animator dependency to use this method.');return ()=>{}}
  var animation=new ObjectAnimator()//if the conductor is on the window, it will be used. otherwise, either the animator will run on it's own, or a dev will need to store a conductor somewhere then use " var animation=new ObjectAnimator({conductor})"
  var task=(p)=>{
    par.postAnim=()=>{p.done()}
    animation.loadAnimation(par).animate()
  }
  return Object.assign({task,wait:true,earlyTermination:()=>{animation.stop()},animation},par)
}

Queue.blink=function(p={}){
  var{node,repeat=1,interval=500,proportion=.5}=p
  var tasks=[]
  for(let i=0;i<repeat;i++){
    tasks.push(
      ()=>{node.style.opacity=0},
      Queue.wait(interval*(1-proportion)),
      ()=>{node.style.opacity=1},
      Queue.wait(interval*proportion)			
    )
  }
  tasks.pop()//no need to wait after the last blink
  return tasks	
}

Queue.synchTransform=function(p={}){//orig and dest should be strings
  var{orig,dest}=p,origArray=[],destArray=[],origU=new Map(),destU=new Map(),origVal
  var breakOrig=orig.match(/[a-zA-Z]+\([^\)]*\)/g),breakDest=dest.match(/[a-zA-Z]+\([^\)]*\)/g)
  if(breakOrig){breakOrig.forEach((val,i)=>{val=val.replace(/\s/g,'');origU.set(val.split('(')[0],val)})}
  else{breakOrig=[]}		
  if(breakDest){breakDest.forEach((val,i)=>{val=val.replace(/\s/g,'');destU.set(val.split('(')[0],val)})}		
  else{breakDest=[]}
  origU.forEach((v,k)=>{
    destArray.push(destU.has(k)?destU.get(k):origU.get(k))
    origArray.push(origU.get(k))
    destU.delete(k)
  })
  destU.forEach((v,k)=>{
    destArray.push(destU.get(k))
    origArray.push(origU.has(k)?origU.get(k):transformDefaultTable[k])			
  })
  return{orig:origArray.join(' '),dest:destArray.join(' ')}
}


//if(window.wait===undefined){window.wait=Queue.wait}
//if(window.animate===undefined){window.animate=Queue.animate}
//if(window.transition===undefined){window.transition=Queue.transition}

var transformDefaultTable={
  //matrices and perspective must be set already to animate
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
}
export {Queue}
