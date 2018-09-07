import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'

import styles from 'style.scss'

var getFromServer=getFromServerThrottled()//returns a function that will reschedule for calling every 200 milliseconds, until time ellapses without a new call

export class SearchBox extends Component{
    constructor(props){//label, default, buildQuery formatResponse, postChoose <-- return fetch ready arguments
        super(props)
        this.searchRef=React.createRef()
        this.boxStyle={
            position:'relative',
            overflow:'visible'
        }
        this.choiceStyle={
            position:'absolute',
            top:'100%',
            zIndex:2,
        }

        this.label=()=>this.props.label||''
        this.name=()=>this.props.name||(()=>{throw error('no name in SearchBox component')})
        this.emptyVal=()=>this.props.default||''

        var nullfunc=v=>v;
        nullfunc.native=true

        this.buildQuery=()=>this.props.buildQuery  // function for building the query argument for fetch
        // function for formatting the response from the server, final result should have the format :  [{value,content},{value2,content2}] where value is a string and content is jsx content
        
        this.formatResponse=()=>this.props.formatResponse||nullfunc 
        this.postChoose=()=>this.props.postChoose||(()=>{})

        this.autoData=null//autocomplete server responses go here. formatResponse and get choices unpack it.  
        this.blockAutoComplete=false
    }
    getValue(){//method for parents to retrieve value
        var value=this.searchRef.current.value
        return value===this.emptyVal()?'':value
    }
    handleDefaultText(e){//clear if focused when empty, put default text if blurred when empty
        var input=this.searchRef.current
        var value=input.value
        if(e.type==='blur' && value===''){
            input.value=this.emptyVal()
        }
        if(e.type==='focus' && value===this.emptyVal()){input.value=''}
    }
    autoComplete(){
        //   getFromServer unpacks a param object {query , data , withResult=()=>{}, noSuccess=()=>{}, getType='json'}=par
        if(!this.buildQuery() || !this.searchRef.current){
            return
        }
        var pack = Object.assign(
            this.buildQuery()(this.searchRef.current),
            { 
                withResult : (result)=>{
                    if(!this.blockAutoComplete){
                        this.autoData=result
                        this.forceUpdate()    
                    }
                } 
            }
        )
        getFromServer(pack) 
    }
    //each item should have format [{value,content},{value2,content2}]
    getChoices(){//should be called inside render
        if(this.autoData===null){return(<span></span>)}
        var formattedData=this.formatResponse()(this.autoData)
        if(!formattedData){return}
        var choices=formattedData.map((v)=>{
           return  ( <div onMouseDown={this.makeChoice.bind(this,v)} name='autoCompleteChoice' data-choice={v.value}> {v.content} </div> )
        })
        return choices
    }
    makeChoice(choice){
        //clear choices
        this.autoData=null
        //set the main value
        if(choice){this.searchRef.current.value=choice.value}
        //rerender
        this.forceUpdate()
        //call postChoose
        this.postChoose()(choice)
    }
    componentDidMount(){
        var events=['blur','focus'] , input=this.searchRef.current
        events.forEach((v)=>{
            input.addEventListener(v,this.handleDefaultText.bind(this))
            input.addEventListener(v,()=>{this.autoData=null;this.forceUpdate()})
        })
        input.addEventListener('keyup',
            (e)=>{
                if(e.key==='Enter'){
                    this.makeChoice();
                    this.blockAutoComplete=true
                    return
                }
                this.blockAutoComplete=false
                this.autoComplete()
            }
        )
    }
    render(){
        return( 
            <div style={this.boxStyle}>
                <div className={this.props.labelClass}>{this.props.label||''}</div>
                <input  ref={this.searchRef} autoComplete={this.buildQuery()?'on':'off'}name={this.name()} id={this.props.id} defaultValue={this.emptyVal()} className={this.props.searchClass} />
                <div style={this.choiceStyle}>
                    {this.getChoices()}
                </div>
            </div>
        )
    }
}