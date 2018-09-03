export var makeSpy=function(p={}){
    //unpack
    var {spyFunc, spiedFunc,context=null,done}=p
    
    //if spiedFunc is a string, retrieve function from context
    var spyFuncStringRef=false
    if(typeof spiedFunc==='string' && context!=null){
        spyFuncStringRef=spiedFunc
        spiedFunc=context[spiedFunc]
    }

    //make spyfunction
    var currentHolder=(spiedFunc||function(){}).bind(context)

    var returnFunction = function(){
        spyFunc(...arguments)
        currentHolder(...arguments)
        if(done){done();}
    }

    //set if spiedfunc is String, return if spiedfunc is function 
    if(spyFuncStringRef){
        context[spyFuncStringRef]=returnFunction
    }else{ return returnFunction}

}
