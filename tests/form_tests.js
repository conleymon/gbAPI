var chai=require('chai')
var {expect}=chai
import React,{ Component } from 'react'
import ReactDom from 'react-dom'
import {prefixId} from 'unique_id'
import {constants} from 'app_constants'
import {Queue} from 'queue'
import {makeSpy} from 'make_spy'

import {formatResponse,buildQuery} from 'search_box_build_queries'
import {Form, Go} from 'form'
import {SearchBox} from 'search_box'
import { Collapsible } from 'collapsible_vertical_regular'
var host=constants.host


var qs=(thing)=>document.querySelector(thing)
var nfunc=()=>{}

var author='Hotchner'
var title='Hemmingway'
var publisher='Open Road'



describe(prefixId('Search Form'),()=>{

    var stage, props, box ,  nativeFetch=fetch, withData=(query)=>{}

    before(()=>{
        stage=document.querySelector('#testStage')
    })

    beforeEach((done)=>{
        ReactDom.render(<React.Fragment><div></div></React.Fragment>,stage)
        box=ReactDom.render(
            <Form withData={withData}>
                <SearchBox name='main' default='some search terms'/>
                <Collapsible title='advanced'> 
                    <SearchBox name='author' default={author}/>
                    <SearchBox name='title' default={title}/>
                    <SearchBox name='publisher' default={publisher}/>
                    <Collapsible title='nested'> 
                        <SearchBox name='one_more_test' default='filled'/>
                    </Collapsible>
                    <SearchBox name='after_collapsible' default='after'/>

                </Collapsible>
                <Go />
            </Form>
        ,stage
        )

        new Queue()
            .add({
                preCondition:()=>box.formRef.current,
                task:()=>{done()}
            })
            .kickStart()
    })

    afterEach(()=>{
        fetch=nativeFetch
    })
    it(prefixId('collects data correctly on clicking "go", including open/close status of nested sections'),()=>{
        var mouseDown=new MouseEvent('mousedown',{ bubbles: true })
        
        var go=box.formRef.current.querySelector('div[activateForm=true]')
        var toggleButton=box.formRef.current.querySelector("div[togglecomponent=true]")

        var expectation={
            main:'some search terms',
            advanced:{open:true, author, title, publisher, nested:{
                    open:true,
                    one_more_test:'filled'
                }
            },
            after_collapsible:'after'
        }

        box.getWithData=()=>{
            return query=>{
                expect(query).to.deep.include(expectation)
            }
        }

        go.dispatchEvent(mouseDown)
        
        toggleButton.dispatchEvent(mouseDown)
        expectation.advanced.open=false
        go.dispatchEvent(mouseDown)


    })
})

