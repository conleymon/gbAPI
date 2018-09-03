import {Queue} from 'queue'
import {throttleFunc} from 'throttle_func'

var queue= new Queue()

export function getFromServer(par={}){
    var nfunc=()=>{}
    var {query , data={} , withResult=nfunc , noSuccess=nfunc, getType='json'}=par
    if(!query){
        throw new Error('no query/host submitted to getFromServer get_from_server.js')
    }
    if(queue.status().queueLength===0){//if the queue has completed the last fetch, get a new one
        queue.fetch(query,data)
            .add((p)=>{//check result ok
                if(!p.result.ok){
                    p.control.change()//change wipes out future steps
                    noSuccess(p.result)
                }
                return p.result//when a raw function is submitted to the queue, it's return value is accepted as the result of the task
            })
            .add((p)=>{return p.result[getType]()})//should be a promise
            .add((p)=>{ withResult(p.result) })
            .kickStart()
    }else{//if not finished schedule this function at the end of the queue. 'finally' sets/resets a single callback to be executed upon completion o fthe queue 
        queue.finally(p=>{
            p.control.clear().finally(nfunc)//finally persists and would cause a loop above if not replaced before restarting.
            getFromServer(par)
        })
    }
}
export var getFromServerThrottled=thresh=>throttleFunc(getFromServer,thresh)
export var getFromServerThrottledSingleton=throttleFunc(getFromServer)
