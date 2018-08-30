import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'
import {SimpleDropdown} from 'simple_dropdown'

var getFromServer=getFromServerThrottled()//returns a function that will reschedule for calling every 200 milliseconds, until time ellapses without a new call

export class SearchBox extends Component{
    constructor(props){//default, (buildQuery buildData) <-- return fetch ready arguments
        super(props)
        this.searchRef=React.createRef()
        this.emptyVal=this.props.default||'Enter Search Terms'
        this.buildQuery=this.props.buildQuery  // function for building the query argument for fetch
        this.buildData=this.props.buildData||(v => undefined) //functino for building the data argument for fetch

        // function for formatting the response from the server, final result should have the format :  [{value,content},{value2,content2}] where value is a string and content is jsx content
        this.formatResponse=this.props.formatResponse||(v => {console.error('no format function for auto complete in searchBox ')}) 
        this.postChoose=this.props.postChoose||(()=>{})
        this.autoData=null//autocomplete server responses go here. formatResponse and get choices unpack it.  
    }
    getValue(){//method for parents to retrieve value
        var value=this.searchRef.current.value
        return value===this.emptyVal?'':value
    }
    handleDefaultText(e){//clear if focused when empty, put default text if blurred when empty
        var input=this.searchRef.current
        var value=input.value
        if(e.type==='blur' && value===''){input.value=this.emptyVal}
        if(e.type==='focus' && value===this.emptyVal){input.value=''}
    }
    autoComplete(){
        //   getFromServer unpacks a param object {QUERY , data , withResult=()=>{}, noSuccess=()=>{}, getType='json'}=par
        if(!this.buildQuery || !this.searchRef.current){
            return
        }
        var pack = Object.assign(
            {
                query:this.buildQuery(this.searchRef.current),
                data:this.buildData(this.searchRef.current)
            },
            { 
                withResult : (result)=>{
                    this.autoData=result
                    this.forceUpdate()
                } 
            }
        )
        getFromServer(pack) 
    }
    //each item should have format [{value,content},{value2,content2}]
    getChoices(){//should be called inside render
        if(this.autoData===null){return(<span></span>)}
        var formattedData=this.formatResponse(this.autoData)
        var choices=formattedData.map((v)=>{
           return  ( <div onClick={this.makeChoice.bind(this,v)} name='autoCompleteChoice' data-choice={v.value}> {v.content} </div> )
        })
        return choices
    }
    makeChoice(choice){
        //clear choices
        this.autoData=null
        //set the main value
        this.searchRef.current.value=choice.value
        //rerender
        this.forceUpdate()
        //call postChoose
        this.postChoose(choice)
    }
    componentDidMount(){
        var events=['blur','focus'] , input=this.searchRef.current
        events.forEach((v)=>{
            input.addEventListener(v,this.handleDefaultText.bind(this))
        })
        input.addEventListener('keyup',this.autoComplete.bind(this))
    }
    render(){
        return( 
            <div>
                <input  ref={this.searchRef} defaultValue={this.emptyVal} />
                {this.getChoices()}
            </div>
        )
    }
}