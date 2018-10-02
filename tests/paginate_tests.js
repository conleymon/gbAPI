var chai=require('chai')
var {expect}=chai

import {prefixId} from 'unique_id'
import React, {Component} from 'react'
import ReactDom from 'react-dom'

import styles from 'style.scss'

import {Paginate} from 'paginate'
import Paginator from 'paginator'
import {Queue} from 'queue'


var qs=(v,node)=>(node||document).querySelector(v)

describe(prefixId('paginate'),()=>{
    var pageDiv
    var resultsPerPage=10, pagesShown=20
    var paginator = new Paginator( resultsPerPage , pagesShown )
    var pageStatus
    var makePages=(totalResults=0,page=0)=>{
        pageStatus=paginator.build(totalResults,page)
    }

    makePages(1000,30)
    var currentPage
    var pageChange=(page)=>{
        expect(page).to.equal(currentPage)
    }

    before((done)=>{
        new Queue()
            .add(
                ReactDom.render(<Paginate {...pageStatus} onPageChange={pageChange}/> , qs('#testStage'))
            )
            .add((p)=>{
                pageDiv=p.result
                done()
            })
            .kickStart()
    })

    it( prefixId('first page always shows, onpageChange is activated with the activated page as an argument') , ( done ) => {
        currentPage= 31
        var pageHandle = qs( '[name=page_'+ currentPage +']' )
        pageHandle
        var mouseDown = new MouseEvent( 'mousedown' )
        new Queue()
            .add( ()=>{ pageHandle.dispatchEvent( mouseDown ) } )
            .add( ()=>{
                expect( !!qs('[name=page_1]')).to.equal(true)
            } )
            .wait(500)
            .add( ()=>done() )
            .kickStart()        
    })
})
