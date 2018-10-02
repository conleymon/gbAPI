var chai=require('chai')
var {expect}=chai

import {prefixId} from 'unique_id'
import {throttleFunc} from 'throttle_func'

describe(prefixId('Throttle Function'), ()=>{
    it(prefixId('Throttle_func: threshhold respected, arguments passed through') , ( done ) => {
        var called=0
    
        var desiredFunction = function( var1 , var2 ){
            expect( var1 ).to.equal( 'one' )
            expect( var2 ).to.equal( 'two' )
            expect( called ).to.equal( 0 )
            called++
            done()
        }
    
        var throttled = throttleFunc( desiredFunction , 200 )
        
        var handle = setInterval(throttled.bind(null , 'one' , 'two'), 50)
    
        setTimeout(function(){
            clearInterval(handle)
        },600)
    })
})
