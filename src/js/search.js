import React, {Component} from 'react'
import {Queue} from 'queue'
import { SimpleDropdown } from 'simple_dropdown';
/*
*****Search for books placement if empty
*****retrieve results from the api
add prop for rendering commited results
and fill out search results component



alright, you also going to have some advanced fields, collapsible
autocomplete

to test: queries include advanced fields and are properly formatted only when include advanced is true
results display correctly
typing results are throttled correctly, with no loops


have each field  in a div with height=1.5em., overflow visible
 the input box will be covering
 
 That way, you can keep it all relative.


or maybe this doesn't have to be time dependent? 
*/
var throttleFunc=function(func,thresh=200){
    var handle='stopped'
    return function(){
        if(handle!=='stopped'){
            clearInterval(handle)
        }
        handle=setTimeout(()=>{func(...arguments);handle='stopped'},thresh)
    }
}

var host='https://www.googleapis.com/books/v1/volumes';
//host='http://localhost:8080/web/8thlight/app/package.json'

export class Search extends Component{
    constructor(props){
        super(props)
        this.searchRef=React.createRef()
        this.goRef=React.createRef()
        this.advanced={
            intitle:'Title',
            inauthor:'Author',
            inpublisher:'Publisher',
            insubject:'Subject',
        }
        for (var k in this.advanced){//include refs
            this.advanced[k]={ref:React.createRef(),display:this.advanced[k]}
        }
        this.includeAdvanced=false
        this.advancedToggleRef=React.createRef()
        this.emptyVal='Search For Books'
        this.autoComplete=this.props.autoComplete||(()=>{})
        this.commitedSearch=this.props.commitedSearch||(()=>{})
        this.getResultsQueue=new Queue()
        this.getResultThrottled=throttleFunc(this.getResults.bind(this))//throttles by time
    }
    focus(){this.searchRef.current.focus()}//access for developer

    getResults(displayParams={},e){//fetches results. if full set to true on displayparams, executes the callback supplied with the results supplied from the search
        //you'll have do to some kind of check here to see if all fields are empty
        
        //build query string
        var input=this.searchRef.current
        var value=[input.value.replace(/\s/g,'+')]
        if(this.includeAdvanced){//include advanced fields
            for(var k in this.advanced){
                input=this.advanced[k].ref.current
                value.push(k+':'+input.value.replace(/\s/g,'+'))
            }
        }
        value=value.join('+')
        var queue=this.getResultsQueue

        //attach to the queue and run. if the queue is busy, schedule for attachment after completion.
        if(queue.status().queueLength===0){//if the queue has completed the last fetch, get a new one
            queue.fetch(host+'?q='+value)
                .add((p)=>{//check result ok
                    if(!p.result.ok){
                        p.control.change().interrupt()//change wipes out future steps, interrupt stops any steps that might be working.
                    }
                    return p.result//when a raw function is submitted to the queue, it's return value is accepted as the result of the task
                })
                .add((p)=>{return p.result.json()})
                .add((p)=>{
                    console.log({displayParams})
                    if(displayParams.withResult){
                        displayParams.withResult(p.result)
                    }else{
                        console.log(p.result)
                    }
                })
                .kickStart()
        }else if(!displayParams.noLoop){//if not finished schedule this function at the end of the queue. 'finally' sets/resets a single callback to be executed upon completion o fthe queue 
            queue.finally(p=>{
                p.control.clear().finally(()=>{})//finally persists and would cause a loop above if not replaced before restarting.
                displayParams.noLoop=true
                this.getResultThrottled(displayParams,e)
            })
        }
    }
    handleDefaultText(e){
        var input=this.searchRef.current
        var value=input.value
        if(e.type==='blur' && value===''){input.value=this.emptyVal}
        if(e.type==='focus' && value===this.emptyVal){input.value=''}
    }
    componentDidMount(){
        var events=['blur','focus'] , input=this.searchRef.current , go=this.goRef.current
        events.forEach(
            (v)=>{
                input.addEventListener(v,this.handleDefaultText.bind(this))
            }
        )
        input.addEventListener('keyup',this.getResultThrottled.bind(this,{}))
        go.addEventListener('click',this.getResultThrottled.bind(this,{withResult:this.props.withResult}))
    }
    toggleAdvanced(){this.includeAdvanced=!this.includeAdvanced;this.forceUpdate()}
    getField(){

    }
    render(){
        var advanced=[]
        for(var k in this.advanced){
            advanced.push(<div>{this.advanced[k].display}<input ref={this.advanced[k].ref}/><SimpleDropdown/></div>)
        }
        return (

            <React.Fragment>
                <div><input  ref={this.searchRef} defaultValue={this.emptyVal} /><SimpleDropdown/></div>
                {advanced}
                <div onClick={this.toggleAdvanced.bind(this)}>{this.includeAdvanced?'Basic':'Advanced'}</div>
                <div ref={this.goRef}>Go</div>

            </React.Fragment>
        )
    }
}
