var chai=require('chai')
var {expect}=chai

import React, {Component} from 'react'
import ReactDom from 'react-dom'

import {Collapsible} from 'collapsible_vertical_regular'

import{prefixId} from 'unique_id'
import {makeSpy} from 'make_spy'
import {Queue} from 'queue'

var qs=(v,node)=>(node||document).querySelector(v)
describe( prefixId('Collapsible Vertical'), ()=>{
    var col, wrapper, button
    
    before((done)=>{
        new Queue()
            .add(()=>{
               return ReactDom.render(
                    <Collapsible>
                        <div>{'heres some stuff'}</div>
                    </Collapsible>
                ,qs('#testStage'))
            })
            .add((p)=>{

                col = p.result
                wrapper = col.ref.current
                button = qs('[togglecomponent=true]',wrapper)
            })
            .add(()=>{
                done()
            })
            .kickStart()        
    })
    it(prefixId('places ReactHandle, opens/closes and sets internal toggle status correctly'), (done)=>{
        new Queue()
            .add({
                task:(p)=>{
                    var mouseDown = new MouseEvent( 'mousedown' ,{bubbles:true})
                    makeSpy({
                        spyFunc:function(){
                            expect(col.ref.current.reactHandle.construct).to.equal('Collapsible')
                            expect(col.open).to.equal(false)
                            expect(col.contentStyle.display).to.equal('none')
                            p.done()
                        },
                        spiedFunc:'componentDidUpdate',
                        context:col
                    })
                    button.dispatchEvent( mouseDown )
                }
            })
            .add(()=>{done()})
            .kickStart()
    })
})