var chai=require('chai')
var {expect}=chai

import {Queue} from 'queue'
import {prefixId} from 'unique_id'

var now=v=>new Date().getTime()

describe(prefixId('Queue Tests'),()=>{
    it(prefixId('add, result pipeline is strong, inital value works, finally works'),(done)=>{
        var init='initialized with this var'
        new Queue()
            .initVal( init )
            .add( (p)=>{
                expect( p.result ).to.equal( init )                
                return 42
            })
            .add( (p)=>{
                expect( p.result ).to.equal( 42 )
            })
            .add( new Promise( function( resolve ){
                setTimeout(()=>{ resolve(99) } , 30 )
            }))
            .add( (p) => { expect( p.result ).to.equal( 99 ) })
            .add({
                task: (p) => { p.done(180) }
            })
            .add( (p) => {
                expect( p.result ).to.equal( 180 )
            })
            .finally( () =>{ done() })
            .kickStart()
    })

    it(prefixId( 'inserts' ),( done )=>{
        var index=0, counter=[]
        var queue = new Queue()
            .wait(100)
            .add([
                () => { counter.push( index++ ) },
                () => { counter.push( index++ ) },
                () => { counter.push( index++ ) }
            ])
            .kickStart()

        queue
            .insert( () => { counter.push( 10 ) })
            .add(()=>{
                expect( counter ).to.deep.equal( [10,0,1,2] )
                done()
            })
    })

    it(prefixId('wait'),(done)=>{
        var start=new Date().getTime()
        new Queue()
            .wait(30)
            .add(()=>{
                expect(new Date().getTime()-start>=30).to.equal(true)
            })
            .add( () =>{ done() })
            .kickStart()
    })

    it( prefixId( 'animate' ), ( done )=>{
        var src={ val:1 }
        new Queue()
            .animate({
                src,
                dest:{ val:100 }
            })
            .add(()=>{
                expect( src.val ).to.equal( 100 )
                done()
            })
            .kickStart()
    })

    it( prefixId( 'all' ), ( done )=>{
        var one=false,two=false, start = now()
        new Queue()
            .all([
                [Queue.wait(30),()=>{one=true}],
                [Queue.wait(100),()=>{two=true}]
            ])
            .add(()=>{
                expect( one && two,'one and 2 not set' ).to.equal( true )
                expect(now() - start>=100, 'time not right').to.equal( true )
                done()
            })
            .kickStart()
    })
    it( prefixId( 'race' ), ( done )=>{
        var one=false , two = false , start = now()
        new Queue()
            .race([
                [Queue.wait(30),()=>{one=true}],
                [Queue.wait(100),()=>{two=true}]
            ])
            .add(()=>{
                expect( one && !two,'one and 2 not set' ).to.equal( true )
                expect(now() - start>=30 && now() - start<=100, 'time not right' ).to.equal( true )
                done()
            })
            .kickStart()
    })

    it( prefixId( 'listen' ), ( done )=>{
        new Queue()
            .listen( new Queue().wait(30) )
            .add( ()=>{ done() })
            .kickStart()
    })

    it( prefixId( 'subscribe' ), ( done )=>{
        var called = p =>done()
        new Queue()
            .add( ()=>{} )
            .subscribe(called)
            .kickStart()
    })

    it( prefixId( 'subscribeTask' ) , ( done )=>{
        var called = p =>{
            expect( (one && two) && !three ).to.equal( true )
        }

        var one=false , two = false , three = false
        
        var t={
            task:()=>{ two = true },
            name:'testName',
            wait:false
        }
        
        var queue = new Queue()
            .add(()=>{ one = true })
            .add(t)
            .wait(10)
            .add(()=>{ three = true })
            .add(()=>done())
        
        queue
            .subscribeTask({name:'testName',cb:called})
            .kickStart()
    })
})
