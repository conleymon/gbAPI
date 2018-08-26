import React, {Component} from 'react'

/*
*****Search for books placement if empty
retrieve results from the api
put them in the consolefor now
autocomplete
*/
export class Search extends Component{
    constructor(props){
        super(props)
        this.searchRef=React.createRef()
        this.goRef=React.createRef()
        this.emptyVal='Search For Books'
        this.autoComplete=this.props.autoComplete||(()=>{})
        this.commitedSearch=this.props.commitedSearch||(()=>{})
    }
    focus(){this.searchRef.current.focus()}//access for developer

    getResults(e,displayParams){//fetches results. if full set to true on displayparams, executes the callback supplied with the results supplied from the search
        var input=this.searchRef.current
        var value=input.value

    }
    handleDefaultText(e){
        var input=this.searchRef.current
        var value=input.value
        if(e.type==='blur' && value===''){input.value=this.emptyVal}
        if(e.type==='focus' && value===this.emptyVal){input.value=''}
    }
    displayResults(){//fetches 

    }
    componentDidMount(){
        var events=['blur','focus'] , input=this.searchRef.current , go=this.goRef.current
        events.forEach(
            (v)=>{
                input.addEventListener(v,this.handleDefaultText.bind(this))
            }
        )
        input.addEventListener('keyup',this.getResults.bind(this))
        go.addEventListener('click',this.getResults.bind(this,{full:true}))
    }
    render(){
        return (
            <React.Fragment>
                <input  ref={this.searchRef} defaultValue={this.emptyVal} />
                <div ref={this.goRef}>Go</div>
            </React.Fragment>
        )
    }
}
