import React, {Component} from 'react'
import ReactDom from 'react-dom'

import {Search} from 'search'
import {SearchResults} from 'search_results'
import {BooksContainer} from 'books_container'


class Books extends Component{
    constructor(props){
        super(props)
        this.searchResultsRef=React.createRef()
        this.resultsData=[]
    }
    displayResults(data){//should come in with results from search
        this.resultsData=data.items
        this.forceUpdate()
    }
    render(){
        console.log(this.resultsData)
        return (
            <BooksContainer>
                <Search withResult={this.displayResults.bind(this)}/>
                <SearchResults data={this.resultsData} ref={this.searchResultsRef}/>
            </BooksContainer>
        )
    }
}
class VolumeDetails extends component{
    constructor(props){
        super(props)
    }
    render(){
        return(<span>{this.props.data}</span>)
    }
}
/*
simply speaking, you'll render the details and the reader the same way
but if allowed to render to the body, you'll append an element to the body, rendered in react, positioned absolutely, covering and with index set to be in front of anything else.

*/

window.BooksAPI=function(){
    this.container=document.querySelector('body')
    this.detailsContainment='contained'
    this.readerContainment='contained'

    this.detailsPane=document.createElement('div')

    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
        ReactDom.render(<Books/>,this.container)
    }
    this.showDetails=function(data){
        ReactDom.render(<VolumeDetails data={data}/>, this.detailsPane)
        (this.detailsContainment==='fullcoverage'?document.body:this.container).appendChild(this.detailsPane)
    }
    this.hideDetails=function(){
       (document.body.contains(this.detailsPane)?document.body:this.container).removeChild(this.detailsPane) 
    }
}
