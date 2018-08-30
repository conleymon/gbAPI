export var throttleFunc=function(func,thresh=200){
    var handle='stopped'
    return function(){
        if(handle!=='stopped'){
            clearInterval(handle)
        }
        handle=setTimeout(()=>{func(...arguments);handle='stopped'},thresh)
    }
}
