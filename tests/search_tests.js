var chai=require('chai')
var {expect}=chai
import {Search} from 'search'
import React,{ Component } from 'react'
import ReactDom from 'react-dom'
import {prefixId} from 'unique_id'
import {constants} from 'app_constants'
import {Queue} from 'queue'
import {formatResponse,buildQuery} from 'search_box_build_queries'
import {makeSpy} from 'make_spy'

var host=constants.host


var qs=(thing)=>document.querySelector(thing)
var nfunc=()=>{}

var author='Hotchner'
var title='Hemmingway'
var publisher='Open Road'

var basic={
    category:'basic',
    toggle:'open',
    fields:[
        {label:'general'},
        {label:'two'}    
    ]
}

var advanced={
    category:'advanced',
    fields:[
        {label:'author'},
        {label:'title'}
    ]
}

var sections=[basic,advanced]
/*
to test:
advanced toggles
assembles queries correctly
activates withQuery with correct query

*/

describe(prefixId('Search (coordinator of boxes)'),()=>{

    var stage, props, box ,  nativeFetch=fetch, withQuery=(query)=>{console.log('withquery called')}

    before(()=>{
        stage=document.querySelector('#testStage')
    })

    beforeEach((done)=>{
        ReactDom.render(<React.Fragment><div></div></React.Fragment>,stage)
        box=ReactDom.render(<Search sections={sections} withQuery={withQuery}/>,stage)

        //I think there might be some asynchronicity in reactDom global render that's messing with the test. so queue it up.
        new Queue()
            .add({
                preCondition:()=>box.mounted,
                task:()=>{done()}
            })
            .kickStart()
    })

    afterEach(()=>{
        fetch=nativeFetch
    })
    it(prefixId('mounts'),()=>{

    })
/*
    it(prefixId('toggles correctly'),(done)=>{
        var nativeDidMount=box.componentDidUpdate//store as reference
        var click = new MouseEvent('click',{bubbles:true})
        var queue = new Queue()

        var getCount= function(){
            var count=0
            for(var k in box.advanced){
                console.log(box.advanced[k].ref.current)
                if(box.advanced[k].ref.current){ count++ }
            }
            return count
        }
        var addTestSegment=function(expectedValue){
            var task=(p)=>{
                makeSpy({//replaces componentDidUpdate with spy that 
                    spyFunc:()=>{
                        expect(getCount()===0).to.equal(expectedValue)
                        p.done()//advances the queue, not mocha
                    },
                    spiedFunc:'componentDidUpdate',
                    context:box
                })        
                box.componentDidMount()//reattach listeners to spy (only effect)
                box.advancedToggleRef.current.dispatchEvent(click)
            }

            queue
                .add({task})
                .add(()=>{
                    box.componentDidUpdate=nativeDidUpdate//reset for the makespy function on the next run 
                })
            
        }

        addTestSegment(false) //should open to basic. after toggling, getcount===0 (rendered advanced fields) should be false
        addTestSegment(true)  //another toggle should close it. count===0 should be true
        
        queue  //add task to finish test and start the queue
            .add(()=>{done()})
            .kickStart()

    })
*/
})

