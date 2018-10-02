export var makeSpy=function(p={}){
    var {spyFunc, spiedFunc,context=null,done}=p
    
    //if spiedFunc is a string, retrieve function from context
    var spyFuncStringRef=false
    if(typeof spiedFunc==='string' && context!=null){
        spyFuncStringRef=spiedFunc
        spiedFunc=context[spiedFunc]
    }

    var existingFunc=(spiedFunc||function(){}).bind(context)

    var returnFunction = function(){
        spyFunc.call( context, ...arguments )
        existingFunc(...arguments)
        if(done){done();}
    }.bind(context)

    //set if spiedfunc is String, return if spiedfunc is function 
    if(spyFuncStringRef){
        context[spyFuncStringRef] = returnFunction
    }else{ return returnFunction }
}
