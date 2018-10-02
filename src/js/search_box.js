import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'

import styles from 'style.scss'

var getFromServer=getFromServerThrottled()

export class SearchBox extends Component{
    constructor(props){
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
        this.name=()=>(this.props.name||(()=>{throw Error('no name in SearchBox component')})())
        this.emptyVal=()=>this.props.default||''

        var nullfunc=v=>v;
        nullfunc.native=true

        this.buildQuery=()=>this.props.buildQuery  

        //final result should have the format :  [{value,content},{value2,content2}] where value is a string and content is jsx content        
        this.formatResponse=()=>this.props.formatResponse||nullfunc 
        this.postChoose=()=>this.props.postChoose||(()=>{})

        this.autoData=null//autocomplete server responses go here  
        this.blockAutoComplete=false
    }
    getValue(){
        var value=this.searchRef.current.value
        return value===this.emptyVal()?'':value
    }
    handleDefaultText(e){//clear if focused when empty
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
    getChoices(){
        if(this.autoData===null){return(<span></span>)}
        var formattedData=this.formatResponse()(this.autoData)
        if(!formattedData){return}
        var choices=formattedData.map((v,i)=>{
           return  ( <div key={i} onMouseDown={this.makeChoice.bind(this,v)} name='autoCompleteChoice' data-choice={v.value}> {v.content} </div> )
        })
        return choices
    }
    makeChoice(choice){
        this.autoData=null
        if(choice){this.searchRef.current.value=choice.value}

        this.forceUpdate()
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
                <input  ref={this.searchRef} autoComplete={this.buildQuery()?'on':'off'} name={this.name()} id={this.props.id} defaultValue={this.emptyVal()} className={this.props.searchClass} />
                <div style={this.choiceStyle}>
                    {this.getChoices()}
                </div>
            </div>
        )
    }
}