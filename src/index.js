import React, {Component} from 'react'
import ReactDom from 'react-dom'
import {SearchBox} from 'search_box'
import {buildQuery, formatResponse} from 'search_box_build_queries'
import {Form, Go} from 'Form'
import {Collapsible} from 'collapsible_flex_item'
import { SearchResults } from './js/search_results';
import { constants } from 'app_constants';

var{ host } = constants




class SearchComponent extends Component{
    constructor(props){
        super(props)
        this.resultsRef=React.createRef()
        this.query=''
        this.withData=(data)=>{
            //build query 
            var query=[]
            var root=host+'?q='+data.main.replace(/\s/g, '+')
            if(data.advanced.open){
                var advanced= data.advanced
                for(let a in advanced){
                    if(a==='open'){continue}// migth have to add a meta-information space later. i don't like having no distinction between form element values and meta data
                    if(advanced[a]!==''){query.push(a+':'+advanced[a])}
                }
            }
            this.query=root + query.join(' ').replace(/\s/g,'+')

            //and submit it to Search results.
            this.forceUpdate()        
        }    
    }
    render(){
        return(
            <React.Fragment>
                <Form withData={this.withData}>
                    <SearchBox name='main' buildQuery={buildQuery} formatResponse={formatResponse}/>
                    <Collapsible title='advanced'>
                        <SearchBox name='title' default='Hemmingway'/>
                        <SearchBox name='author'/>
                        <SearchBox name='publisher'/>
                    </Collapsible>
                    <Go/>
                </Form>
                <SearchResults ref={this.resultsRef} query={this.query}/>
            </React.Fragment>
        )
    }
}

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

window.VolumesAPI=function(){
    this.container=document.querySelector('body')
    this.detailsContainment='contained'
    this.readerContainment='contained'

    this.detailsPane=document.createElement('div')

    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
//        ReactDom.render(<SearchComponent showDetails={this.showDetails.bind(this)}/>,this.container)
        ReactDom.render(<SearchComponent/>,this.container
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
