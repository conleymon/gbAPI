var chai=require('chai')
var {expect}=chai
import {SearchBox} from 'search_box'
import React,{ Component } from 'react'
import ReactDom from 'react-dom'
import {prefixId} from 'unique_id'
import {constants} from 'app_constants'
import {Queue} from 'queue'
import { formatResponse , buildQuery } from 'search_box_build_queries'
import {makeSpy} from 'make_spy'
var host=constants.host


var qs=(thing)=>document.querySelector(thing)
var nfunc=()=>{}

var author='hemmingway'

describe(prefixId('SearchBox component'),()=>{
    var stage, props, box ,  nativeFetch=fetch

    before(()=>{
        stage=document.querySelector('#testStage')
    })

    beforeEach((done)=>{
        ReactDom.render(<React.Fragment><div></div></React.Fragment>,stage)
        box=ReactDom.render(<SearchBox buildQuery={buildQuery} formatResponse={formatResponse}  name='testcomponent'/>,stage)

        new Queue()
            .add({
                preCondition:()=>box.searchRef.current,
                task:()=>{done()}
            })
            .kickStart()
    })

    afterEach(()=>{
        fetch=nativeFetch
    })

    after((done)=>{
        ReactDom.render(<React.Fragment><div></div></React.Fragment>,stage,()=>{done()})
    })

    it(prefixId('mounts with empty value'),()=>{
        var input=qs('#testStage input')
        expect(input.value).to.equal(box.emptyVal())
    })

    it(prefixId('clears and restores default message properly'),(done)=>{
        var input=qs('#testStage input')

        var eventFired=false 
        var handled=()=>{ eventFired=true }
        box.handleDefaultText = makeSpy({spyFunc : handled  ,  spiedFunc : box.handleDefaultText  ,  context : box })

        //reattach listeners to spy
        box.componentDidMount()

        var queue=new Queue()
        var addSegment=function(action,expectedValue){
            queue.add(()=>{ 
                    input[action]() 
            })
            queue.add({
                preCondition:()=>eventFired,
                task:()=>{
                    expect(input.value).to.equal(expectedValue);
                    eventFired=false
                }
            })
        }

        // blur and focus with no terms
        addSegment('focus','')
        addSegment('blur',box.emptyVal())

        // blur and focus with valid terms
        queue.add(()=>{input.value=author})
        addSegment('focus' , author)
        addSegment('blur' , author)
        
        queue
            .add(()=>{done()})
            .kickStart()
    })
    it(prefixId('keyup fetches results and renders. Choice populates field and activates postChoice callback'),(done)=>{
        var firstResult,choiceData
        var postChoose=(choice)=>{
            expect(choice.value).to.deep.equal(choiceData)
            done();done=nfunc
        }
        ReactDom.render(<React.Fragment><div></div></React.Fragment>,stage)
        box=ReactDom.render(<SearchBox postChoose={postChoose} buildQuery={buildQuery} formatResponse={formatResponse} name='testComponent'/>,stage)

        var input=qs('#testStage input')
        
        input.value=author
        var keyup=new KeyboardEvent('keyup')

        var nativeComponentDidUpdate=(
            box.componentDidUpdate||
            (()=>{box.componentDidUpdate=function(){}; return box.componentDidUpdate})()
        ).bind(box) 

        var pass=0
        box.componentDidUpdate=function(){
            firstResult=input.parentNode.querySelector('[name=autoCompleteChoice]')
            if(firstResult !== null){ 
                choiceData=firstResult.dataset.choice
                expect(pass++).to.equal(0)   
                firstResult.dispatchEvent(new MouseEvent('mousedown',{ bubbles: true })
            )}
            else{
                expect(input.value).to.equal(choiceData)
                expect(pass).to.equal(1)
            }           
        }.bind(box)
        input.dispatchEvent(keyup)
    }).timeout(7000)

    it(prefixId('rapid keyup events throttle down to 1 request'),(done)=>{
        var input=qs('#testStage input')
        input.value=author
        var keyup=new KeyboardEvent('keyup')
        var autoNum=0

        fetch=(url,body)=>{
            expect(autoNum).to.equal(10)
            makeSpy({
                spyFunc:function(){}, 
                spiedFunc:'componentDidUpdate',
                context:box,
                done
            })
            return nativeFetch(url,body)
        }

        input.value=author

        var wrappedAutoComplete=box.autoComplete.bind(box)
        box.autoComplete=function(br=false){
            autoNum++
            wrappedAutoComplete(true)
        }

        var i=11
        var queue=new Queue()
        while(--i){
            queue
                .add(()=>{input.dispatchEvent(keyup)})
                .wait(30)
        }
        queue.kickStart()
    })
})

