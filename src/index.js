import React, {Component} from 'react'
import ReactDom from 'react-dom'

import {Search} from 'search'
import {SearchResults} from 'search_results'
import {SearchContainer} from 'search_container'





/*
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
                <Search withQuery={this.displayResults.bind(this)}/>
                <SearchResults 
                    data={this.resultsData} 
                    ref={this.searchResultsRef}
                    {...this.props}
                />
            </SearchContainer>
        )
    }
}
*/
class VolumeDetails extends Component{
    constructor(props){
        super(props)
    }
    render(){
        return(
            <React.Fragment>
            {this.props.children}
            </React.Fragment>
        )
    }
}
/*
simply speaking, you'll render the details and the reader the same way
but if allowed to render to the body, you'll append an element to the body, rendered in react, positioned absolutely, covering and with index set to be in front of anything else.

*/
class Element1 extends Component{
    constructor(props){
        super(props)
        this.rendered=true
    }
    render(){
        return (
            <div>1</div>
        )
    }
}


class Element2 extends Component{
    constructor(props){
        super(props)
        this.rendered=true
    }

    render(){
        return (
            <div>2</div>
        )
    }
}

var counter=0
class SearchComponent extends Component{
    constructor(props){
        super(props)
    }
    getRef(){
        this[counter++]=React.createRef()
        return this[counter++]
    }
    showRefs(){
        console.log(this[0].rendered)
    }
    render(){
        return (
            <div>
                {this.props.children.map((v)=>{
//                    v.props.ref=this.getRef()
                    console.log(v.ref)
                    v.ref=React.createRef()
                    return v
                })}
                <div onClick={this.showRefs.bind(this)}>do it</div>
            </div>)
    }
}
           
window.VolumesAPI=function(){
    this.container=document.querySelector('body')
    this.detailsContainment='contained'
    this.readerContainment='contained'

    this.detailsPane=document.createElement('div')

    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
//        ReactDom.render(<SearchComponent showDetails={this.showDetails.bind(this)}/>,this.container)
        ReactDom.render(
        <SearchComponent showDetails={this.showDetails.bind(this)}>
                <Element1/>
                <Element2/>
        </SearchComponent>
        ,this.container
    )
    }
    this.showDetails=function(data){
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
