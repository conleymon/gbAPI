

# Queue.js

## Overview
  Queue.js is a Promise-like tool with a whole lot more. It aims to allow complete control over your temporal architecture and includes a host of advantages:
* malleable task chains
* flow control: stop/start, reset , delayed or immediate queue initiation
* control of queue from inside the chain and outside (outside control not native to asynch/await)
* querying and listening 
	* queue subscriptions
	* subscriptions to specific tasks in a queue
	* queue status requests
* condition-based task flow, great for video/audio
* reusable queues
* queueline cloning  
* timeouts  (with timeout contingency functions)
* easy multi-level queue architecture (submission of a queue as a task of another queue)
* special functions like all, race and animate are built in to the chaining syntax
* task naming and search

There is no resolve and reject, no catch method, and no promises (though promises may be incorporated in a queue). There is simply a single line of results passed through with internal control of the Queue. A queue does not resolve to a final value, but preserves all the values of all it's tasks. 
			
## How It Works
  The Queue constructor is used to construct new Queue instances, to which task objects are submitted to build the queueline. Once the queue is started, it iterates over the task objects stored in the queueline, performing the tasks and storing their results upon resolution.
  
A task object takes the form:

	{	
		task:func to be executed upon reaching the queue. 
			default:()=>{}
		preCondition: func which must be satisfied before the task is executed. Return will be evaluated as truthy or falsey,
			default:()=>true
		postCondition: func which must be satisfied after the task is executed to move on to the next queue. return value will be evaluated as truthy or falsey,
			default:()=>true
		wait:boolean if false, the function will be executed and will not wait for the resolution,
			default:true if task object is submitted, false if raw function
		sec: seconds to wait before moving on,
			default:3600
		timeout: func to be called on after timeout,
			default:()=>{}		
		earlyTermination:func to be called on interrupt(),
			default:()=>{}
		getValue(previous result):override func to retrieve value after task execution to be stored as the result of that step, and passed onto the next task. useful for retrieving values after a conditional task,
			default:false
		name:'name of the step',
		comment,
			default:task.toString()
	}

All properties are optional. Extra properties permitted, only relevant properties will survive to task insertion. All arguments submitted for incorporation into the queue will be formatted as an object with the above defaults. In addition, properties initiated:false, resolved:false, evaluation:null will be appended to the task.

### Task Function Return Values
If the task is not set to wait for a callback, the returned value will be stored as the result of the task. 

### Task Arguments 
The function referenced by the task property in a task object is provided with a control package parameter of the form:
  
	{
		done:func to call to signal the completion of  the task. arguments submitted to 'done' are stored as the result of the task 
		result:the result of the previous task
		control:provides the queueInstance containing the task to which this control package was provided. All methods of the instance are available. You can control the direction of the queue from inside each task!
		evaluate: Function. Call with a value to set the evaluation property on this task.
	}

The functions referenced by timeout and earlyTermination and getValue are provided the above control package, but without the done function.

### Basic Example
Here's an example of a basic 'wait' task object generator:

	function wait(milisecs){
		var task=(p)=>{
			setTimeout(()=>{p.done("hello? I'm finished.")},milisecs)
		}
		return {task}
	}
	
	new Queue()
	.add(wait(3000))
	.add((p)=>{console.log(p.result)})
	.kickStart()

	//-> waits 3 secs, then outputs:"Hello? I'm finished."

Here is an example of queue control from within a task:

	function wait(milisecs,repeat){
		var task=(p)=>{
			if(repeat){
				p.control
					.add(wait(milisecs/2))
					.add(()=>{console.log("I said I'm finished!")})
			}
			setTimeout(()=>{p.done("hello? I'm finished.")},milisecs)
		}
		return {task}
	}	
	new Queue()
	.add(wait(3000,true))
	.add((p)=>{console.log(p.result)})
	.kickStart()

	//-> after three seconds this example will output:"Hello? I'm finished."  After 1500 seconds more, it will output "I said I'm finished!"

In the above example we add more wait  and output tasks to the end of the queue before setting our timeout! Anything is possible with p.control. All instance methods are available. You can call p.control.insert( someIntermediateTask() ) or call change() to wipe out the remaining tasks and chain up some new ones etc. 

## Methods	
  ### Basic
   initVal(*)
	
		  sets the value to be passed to the first step in the queueline
		  
   add(function || task Object || another queue || Promise || single-dimension array of any combination of preceding)

	adds one or more tasks to the end of the queueline
	behavior:
		function: Function is wrapped in a task object with wait set to false. It will be executed when reached in the queue. If the function returns an object, array or function, the return value will be interpreted as a task and inserted into the queueline (as the next step). Otherwise, if the task is not set to wait for a callback, the returned value will be stored as the result of the task. 
		object:interpreted as a task object. absent properties will be populated with default values
		Queue: resets the queue, starts it, and waits till it is completed to move on. (uses finally on the submitted Queue)
		Promise: decorates the promise in a task using Promise.finally
		Array: each index will be added in sequence to the end of the queue
		  
insert(see Add)

	inserts tasks between the current task and the next task in the queue

   change(see Add)

	wipes out the remaining steps after the current step, and adds its argument to the queue

   finally(function)		

	submits a callback function to be called on completion of the queue

###  Built-In Methods
These methods comprise a growing toolbox of chainable tasks. They add tasks to the end of the queue.

   all(Array of task Objects, 2 dimensional permitted )

	takes an array of functions || task Objects ||Queues || promises || Array of any combination of the preceding  and returns an allTask that runs the tasks simultaneously (in respective queues). The allTask does not resolve till all the steps are completed. A second dimension array will be inserted as a sequential queueline with respect to  the allTask
    
    Ex. 1
		new Queue()
			.all([
			    ()=>{console.log('this is fine')}
				wait(150),
				wait(150),
			])
			.add(()=>{console.log("I'm finished")})
		//outputs 'this is fine', waits 150 miliseconds, then outputs: "I'm finished". All tasks are run concurrently

	Ex. 2
		new Queue()
			.all([
				[()=>{console.log('this is fine too')},wait(100),wait(100)],
				wait(150),
			])
			.add(()=>{console.log("I'm finished")})
		//outputs 'this is fine too', waits 200 miliseconds then outputs: "I'm finished". The first line is run sequentially, and the second line 'wait(150)' is just outlasted 

Note: In order to include standard properties on a call to all(), wrap the above described array parameter in an object with 'actions' as it's reference

	all({
		actions:[array of tasks],
		sec:4,
		timeout:()=>{
			//do stuff on time out
		}
	})

   race(see all)

	takes an array of task and returns a race task that runs the tasks simultaneously (in respective queues). The first step to be completed resolves the race Task and advances the queue

	Ex.
		new Queue()
		.race([
			[wait(100),wait(100)],
			wait(50),
			wait(300)
		])
		.add(()=>{console.log("I'm finished")})
		//waits 50 miliseconds then outputs: "I'm finished"
		  
   animate(param object)
	
	animates any object from current to destination, using javascript driven incrementing
	parameters:{
		src:object to be animated. Any size and configuration
		dest:object containing destination values. must be congruent with src object. any value not found in corresponding address on src will not be animated
		orig:optional. object containing values to be animated from.  artificial starting point
		duration:time the animation should take
		contour:defines the curve the animation should follow. options: linear,smooth,smooth-sine,para(parabolic, abrupt end),root(abrupt beginning),boomerang
		preAnim: function to be executed before the animation begins
		postAnim function to be executed after the animation ends
		preInc: function to be executed before each animation frame
		postInc: function to be executed after each animation frame
	}
   transition(param object)
	
	animates the style of a node through css transition
	parameters: {
		node:the dom Node whose style will be animated
		style:{props to be animated}
		duration:the duration of the animation in seconds
		timing:'easings'
		synch:boolean determines whether to merge the transform with the existing transform or replace it
	}
			
   wait(miliseconds || {from:milliseconds, to:milliseconds})
	
	waits a specified duration before moving to the next step. If a range object is submitted, it will choose a random duration between the from and to values submitted on the object.

   ajax(param object)
	
	simple ajax requests
	parameters:{
		url:the url to request from
		data: object with name value pairs, a desired formNode, or a url encoded string. If a form is submitted with action specified, the form action will be used as url
		method:post or get //default post
		synch:bool //default true
	}
	Return value
	p.result= {response,status} //onload
		  
   blink(param object)
	
	oscilates a node's opacity between 1 and 0 a specified number of times at a specified rate
    parameters:{
		node:node to blink
		interval: the time each blink should take in miliseconds
		repeat:number of times to blink
		proportion: proportion of each interval the node should be visible (between 0 and 1) 				
	}		  
### InsertBuilt-Ins
each of the Built-In functions has an insert version. They take the same arguments, but insert the resulting tasks immediately after the current task.
* insertAll
* insertRace
* insertAnimate
* insertTransition
* insertWait
* insertAjax
* insertBlink 
  
### Task Generators
Each of the Built-In methods also has a generator attached to the constructor. They take the same arguments as above. They return tasks to be submitted to any queueInstance.
* Queue.all
* Queue.race
* Queue.animate
* Queue.transition
* Queue.wait
* Queue.ajax
* Queue.blink 
  
### Flow Control
   stop()

	stops the queue
   kickStart()

	starts a queue if not running
   interrupt()

	interrupts the current task, executes the earlyTermination function, if provided
  
### Queue Editing
slice(param object)

	returns a slice of the queue line (does not alter queueline)
	parameters{
		from:see find()
		to:see find()
	}
	if the returned indexes are out of order, an empty string is returned
splice(param object)

	removes the queue segment defined by 'from' and 'to'
	parameters{
		from:see find()
		to:see find()
		replacement:task || array of tasks
	}
	If the from argument stretches back to include current or past tasks, the from indes will be reset to the first future task in the queue.
	if the returned indexes are out of order, nothing is altered. 
			  
  clear()
	
	stops the queue, clears the tasks
		  
   clearResults(optional:queueline)
	
	clears the results of a queueline
	parameters: any queueline. default is the native queueline.
			 
   pop()
	
	pops off the last step in the queueline. fails if the last task is already started
		  
   delete(string name || number index)
	
	deletes the specified step from the queueline
			parameters:name or index
			
   find(string name || number index)
	
	searches for a step having the submitted name or index. returns undefined if not found
  
On slicing: copies of the queueLine are returned, and each task is a shallow copy of the original, with results cleared and individual task subscriptions cloned. So a sliced queueline can be filtered, mapped and so on, and the sliced queueline segment will run independently in a new Queue. However, the function references contained in the sliced tasks point to the original functions  which may still have closure variables that will be operated upon when reached in a new Queue. Of course, this is problem easily solved by creating Queue/queueline factories, which return new Queues/queuelines free and clear for splicing/running.

### Listening
 subscribe(function || {cb:function})

	subscribes a listener to be executed upon completion of the queue
		  
   unsubscribe(function || {cb:function})
	
	unsubscribes a listener

listen(queueInstance || {queue,start:boolean})

	listens for the end of a queue
	if start is true, the queue is kickstarted when it is reached. Start default for both types of arguments is false.
			   	  

Listen is mainly for use when building queue chains 

	someQueueInstance.listen(anotherQueueInstance) 
	//tells someQueueInstance to listen for the completion of anotherQueueInstance before moving on to the next task

while subscribe and unsubscribe are mainly for general subscription

	someQueueInstance.subscribe(myCallBack)
	//tells someQueueInstance to execute the callBack when finished.

  ### Querying
   status()

	returns an object :{
		currentTask, 
		queueLength,
		queueIndex,
		waitRunning(boolean, waiting for event trigger),
		checksRunning(boolean, waiting for condition satisfaction),
		queueLine:shallow copy of the queueLine array
	}
				
   allDone()

	returns true if all tasks in the queue have been resolved
		  
   running()

	returns true if the queue is running.

There is no 'rejected' status. A completed task is marked  'resolved' no matter the result. The next task interprets the result and decides how to proceed. Set the evaluation property on p.thisTask to describe the success or failure of the task to observers. 

### Error Handling
Because you can control everything about the queueline from the inside and the outside, error handling is once again your responsibility as a developer. You take a result and decide what to do with it. There's one simple line of tasks that you mold how and when you see fit.

### Further Examples
##### Syntax
Ex. 1 Add

	new Queue()
	  .add( task1 )
	  .add( task2 )
is quivalent to
	
	new Queue()
	  .add([task1,task2])
where task1 and task2 are either, function, task object, queue or native Promise. (they don't have to be the same type)

Ex. 2 
Remember, raw functions move on, and their return values are stored as results. Task objects automatically wait for callbacks, unless a preCondition or postCondition is set. 
	
	new Queue()
1.		.wait(1000)
	waits a second
2.		.add(()=>{alert('ok 1 second in'), return true})
	alerts 'ok 1 second in' and moves on.

3.		.add((p)=>{
		    if(p.result===true){
		      p.control.insert([task1,task2])
		    }
		  })
	Because the previous task was submitted as a raw function, it's return value was interpreted and stored as a result. p.result is therefore true on this task, and  task 1 and 2 are inserted and executed sequentially at this point. Wait is set to false for this task because it too came in as a raw function 
4.	 	.add((p)=>{if(p.result==true){
		  p.control.change(new Queue().add(otherTask))
		}})
	If the previous task had returned true, this task would have wiped out the remainder of the queue, appended new Queue().add(otherTask), and moved on down the new track. Once finished, the original 'finally' callback would have been fired. However, as written, nothing changes in the queue because the previous task did not store any result.
5.		.animate(src:node.style,dest:{opacity:0},duration:1000)
	animates a src node to opacity of 0, over the course of 1 second
6.		.add([  //the following are added sequentially as if through separate add calls
			{task:(p)=>{setTimeout(()=>{p.done('hey')},1000)}},  //wait set to true because the function was clothed in a task object. Resolves immediately.
			(p)=>{alert(p.result)},
			Queue.all([
				task4,
				task5,
				[task6,task7,task8],
				Queue.wait(3000)
			]),
			()=>{alert('done')}
		])
	this task sets up a callback that will submit string 'hey' as it's result after 1 sec

	alerts 'hey' and moves on
	
	
	Queue.all returns a task that starts task 4,5,6 and the task returned by Queue.wait concurrently, while tasks 6,7 and 8 run sequentially. The Queue will advance after the completion of the last of: task 4, or task 5 or the sequence of task 6,7 and 8, or 3 seconds elapse.
	
	alerts done, and fires the callback registered by finally.
		

### Issues
No known issues, but splice, slice, find, evaluate(on the control package) and delete are fairly experimental.

### Future Changes
* **subscribeTask(name||index,callBack)**
		will activate a callback when a specific task is completed (experimentally available now)
* **listenTask(name || index, queue)**
	    will look for a specific task on another queue and move on when that task is completed (experimentally available now)
* **jump(index||name||{steps})**
		will jump to a specific task. if steps is negative queue will jump backwards, and all task results ahead of the new queue positions will be cleared. 
*  **loop({iterations, passCondition, backTo, failure})**
	 will loop the queue iterations times if passCondition not satisfied, and execute failure if not satisfied within the specified iterations. the 'backTo' argument will specify a step to which to return 
* **alternate(iterations, passCondition, backTo)**
	When the queue is finished, will append steps in reverse and keep running. It will do this up to the specified number of iterations. If the passCondition is included and  satisfied, the loop will break and the queue will continue. 
* **continue()**
	if the queue is in a loop, or alternation, continue() will break it 
* **Queue.toPromise(function || queue || task Object)**
	Will convert the argument to a promise and return it
 
 * **equip ajax() to handle file uploads, or replace with an existing ajax utility**
 * **asynch/await-like syntax for asynch functions**
 * **portal for plugging in your your own custom task generators**
