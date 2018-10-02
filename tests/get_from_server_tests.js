var chai=require('chai')
var {expect}=chai

import {Queue} from 'queue'
import {prefixId} from 'unique_id'
import {getFromServerThrottled} from 'get_from_server'

var getFetch = function(success,content){
    return ()=>{
        var resp= new Response(
            JSON.stringify({val:"one"}),
            {
                status:success,
                statusText:'ready',
                headers:{'content-type':content}
            }

        )
        return new Promise(
            function(resolve){
                setTimeout(()=>{
                    resolve(resp)
                },30)
            }
        )
    }    
}

var nativeFetch=fetch

describe(prefixId('Get from server'),()=>{
    after(()=>{
        fetch=nativeFetch
    })
    
    var doTest=function(success, content , withResult , noSuccess){
            fetch=getFetch(success,content)
    
            var fetcher=getFromServerThrottled(100)
        
            var pack={
                query:'http://www.google.com',
                withResult,
                noSuccess,
            }
        
            var handle = setInterval(()=>{
                fetcher(pack)
            }, 50)
        
            setTimeout(function(){
                clearInterval(handle)
            },600)        
    }

    it( prefixId('success/failure'),(done)=>{
        new Queue()
            .add({
                task:(p)=>{
                    var called=0
                    var withResult = function(result){
                        expect(result.val).to.equal('one')
                        expect(called).to.equal(0)
                        called++
                        p.done()
                    }
                
                    var noSuccess = function(){
                        expect(1,'fetch should have been successful').to.equal(2)
                    }
                
                    doTest(200,'application/json; charset=utf-8' , withResult , noSuccess)            
                },
                sec:5
            })
            
            .add({
                task:(p)=>{
                    var called=0
                    var withResult = function(){
                        expect(1,'fetch should have been unsuccessful').to.equal(2)
                    }
                
                    var noSuccess = function(){
                        expect(called).to.equal(0)
                        called++
                        p.done()
                    }
                    doTest(404,'application/json; charset=utf-8' , withResult , noSuccess)
                },
                sec:5
            })
            .add(()=>{done()})
            .kickStart()    
    })
})
