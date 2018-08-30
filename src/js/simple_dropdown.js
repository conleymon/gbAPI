import React, {Component} from 'react'
import {Queue} from 'queue'

export class SimpleDropdown extends Component{
    constructor(props){//onclick, renderprop,parent
        super(props)
    }
    render(){
        if(!(this.props.render && this.props.data)){return(<span>suggestions</span>)}
        return this.props.render.call(this)
    }
}