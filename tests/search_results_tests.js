var chai=require('chai')
var {expect}=chai
import React,{ Component } from 'react'
import ReactDom from 'react-dom'
import {prefixId} from 'unique_id'
import {Queue} from 'queue'
import {makeSpy} from 'make_spy'
import {SearchResults} from 'search_results'
var equal=require('deep-equal')

var searchQuery='https://www.googleapis.com/books/v1/volumes?q=hemmingway+'
var secondSearchQuery = 'https://www.googleapis.com/books/v1/volumes?q=winston+churchill+'

var qs = (v , node) => (node || document) . querySelector(v)
var comparison=[]

var testWrapper
var search

var render = (query = searchQuery) => ReactDom.render(<TestSearch query = {query}/> , qs('#testStage'))
var update = (query = searchQuery) => testWrapper.setState({query})


class TestSearch extends Component{
    constructor( props ){
        super( props ) 
        this.ref = React.createRef()
        this.state = this.props
    }
    render(){
        return (<SearchResults ref = {this.ref} {...this.state}/>)
    }
}

describe(prefixId('Search Tests'),()=>{

    var advance = {go:() =>{}}

    before((done)=>{

        testWrapper = render()
        new Queue()
            .add({
                preCondition:()=>testWrapper.ref.current.ref.current,
                task:()=>{
                    search=testWrapper.ref.current                      
                }
            })  
            .add(()=>{
                makeSpy({
                    spyFunc:function(result,page){
                        comparison.push({
                            query:this.query,
                            page,
                            result
                        })
                    },
                    spiedFunc:'resolve',
                    context:search
                })
            })
            .add( () => done() )
            .kickStart()  
    })


    it( prefixId( 'Loads results based on query. Number of results matches "resultsPerPage". Clicking a page number  triggers secondary fetch with appropriate results index parameters. Resets to page one when query changes.'),(done)=>{
        var mouseDown=new MouseEvent('mousedown' , {bubbles:true})
        new Queue()
            .add({
                task:(p)=>{
                    update()
                },
                wait:false
            })
            .add({
                preCondition:()=>qs( 'div [name=page_3]' , search.ref.current),
                task:(p)=>{
                    var page3 = qs( 'div [name=page_3]' , search.ref.current)
                    page3.dispatchEvent( mouseDown )
                },
                wait:false
            })
            
            .add({
                preCondition:()=>{return search.status==='ready'},
                task:(p)=>{
                    update(secondSearchQuery)
                },
                wait:false
            })

            .add({
                preCondition:()=>{return search.status === 'ready'},
                task:(p)=>{
                    update()
                },
                wait:false
            })
            .wait(500)
            .add({
                preCondition:()=>{return search.status === 'ready'},
                task:() => {
                    expect( comparison[0].result.items.length, '1_items length' ).to.equal( search.resultsPerPage )

                    var matchPercent = getMatchPercent(comparison[0].result.items , comparison[1].result.items)
                    expect( matchPercent, '2 second page items should not equal the first page').to.satisfy((v)=>{return v<=.1})
                    expect( comparison[0].query , '3 query should be the same between page changes' ).to.equal( comparison[1].query )                    
                    expect( comparison[1].page , '4 and you should be on the third page').to.equal( 3 )

                    var matchPercent = getMatchPercent(comparison[0].result.items , comparison[2].result.items)
                    expect( matchPercent, '5 make sure the query and results change when new query is submitted').to.satisfy((v)=>{return v<=.1})
                    expect( comparison[2].page , '6 first page after query change ').to.equal( 0 )

                    var matchPercent = getMatchPercent(comparison[0].result.items , comparison[3].result.items)
                    expect( matchPercent, '7 same query and pagenumber should fetching matching items').to.satisfy((v)=>{return v>=.9})
                }
            })
            .add( () => done() )
            .kickStart()

    }).timeout(7000)
})

var getMatchPercent=function(comp1,comp2){
    var match=0, num=comp1.length
    var checkRegistry={}
    comp1.forEach((v)=>{
        checkRegistry[v.id]=1
    })
    comp2.forEach((v)=>{
        if(checkRegistry[v.id]){match++}
    })
    return match/num
}



















/*
*/
