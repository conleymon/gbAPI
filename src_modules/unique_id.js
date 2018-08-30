//global
var id=0
export var getId=()=>id++
export var prefixId=(string)=>id++ +'_'+string
export var postfixId=(string)=>string+'_'+id++

//instance
export var GetIDGenerator=function(){
    var id=0
    this.getId=()=>id++
    this.prefixId=(string)=>id++ +'_'+string
    this.postfixId=(string)=>string+'_'+id++
}  
