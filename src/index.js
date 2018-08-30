import React, {Component} from 'react'
import ReactDom from 'react-dom'

import {Search} from 'search'
import {SearchResults} from 'search_results'
import {SearchContainer} from 'search_container'


class SearchComponent extends Component{
    constructor(props){
        super(props)
        this.searchResultsRef=React.createRef()
        this.resultsData=[]
    }
    displayResults(data){//should come in with results from search

        this.resultsData=data.items?data.items:[data]
        this.forceUpdate()
    }
    render(){
        return (
            <SearchContainer>
                <Search withResult={this.displayResults.bind(this)}/>
                <SearchResults 
                    data={this.resultsData} 
                    ref={this.searchResultsRef}
                    {...this.props}
                />
            </SearchContainer>
        )
    }
}
class VolumeDetails extends Component{
    constructor(props){
        super(props)
    }
    render(){
        return(<span>some data</span>)
    }
}
/*
simply speaking, you'll render the details and the reader the same way
but if allowed to render to the body, you'll append an element to the body, rendered in react, positioned absolutely, covering and with index set to be in front of anything else.

*/

window.VolumesAPI=function(){
    this.container=document.querySelector('body')
    this.detailsContainment='contained'
    this.readerContainment='contained'

    this.detailsPane=document.createElement('div')

    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
        ReactDom.render(<SearchComponent showDetails={this.showDetails.bind(this)}/>,this.container)
    }
    this.showDetails=function(data){
        console.log({data})
        var useContainer=this.detailsContainment==='fullCoverage'?document.body:this.container
        var style={zIndex:getHighestZ(useContainer)}
        ReactDom.render(<VolumeDetails data={data} style={style}/>, this.detailsPane)
        useContainer.appendChild(this.detailsPane)
    }
    this.hideDetails=function(){
       (document.body.contains(this.detailsPane)?document.body:this.container).removeChild(this.detailsPane) 
    }
}
var getHighestZ=function(node){
    if(!node.children.length){return 1}
    var mark=-99999999
    var markHighest=v=>{
        if(v.style && v.style.zindex>mark){
            mark=v.style.zIndex
        }
    }
    Array.prototype.slice.call(node.children).forEach(markHighest)
    return mark
}
