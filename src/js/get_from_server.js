import {Queue} from 'queue'
import {throttleFunc} from 'throttle_func'


function separateQueues(){

    var queue=new Queue()

    var getFromServer = function(par={}){
        var nfunc=()=>{}
        var {query , data={} , withResult=nfunc , noSuccess=nfunc, sec=15 , getType='json'}=par
        var {timeout=()=>{console.log('server at ' + query + ' timed out')}}=par

        if(!query){
            throw new Error('no query/host submitted to getFromServer get_from_server.js')
        }
        
        if(queue.status().queueLength===0){//if the queue has completed the last fetch, get a new one
            var pack={
                fetchPackage:par,
                timeout,
                sec 
            }

            queue.fetch(pack)
                .add((p)=>{
                    if(!p.result.ok){
                        p.control.change()//change wipes out future steps
                        noSuccess(p.result)
                    }
                    return p.result
                })
                .add((p)=>{return p.result[getType]()})
                .add((p)=>{withResult(p.result) })
                .kickStart()
        }
        else{//if not finished schedule this function at the end of the queue. 'finally' sets/resets a single callback to be executed upon completion of the queue 
            queue.finally(p=>{
                p.control.clear().finally(nfunc)//wipe out previous delayed fetch
                getFromServer(par)
            })
        }
    }
    return getFromServer
}


export var getFromServerThrottled = thresh => throttleFunc(separateQueues(),thresh)
export var getFromServerThrottledSingleton=throttleFunc(separateQueues())
export var getFromServerSingleton=separateQueues()
