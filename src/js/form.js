import React, {Component} from 'react'
import {Queue} from 'queue'
import { constants } from 'app_constants'
import { Collapsible } from 'collapsible_flex_item'

var {host}=constants

var collectData=function(domNode){//should be a formNode
    //make a registry of the elements in the form to check and see if the node we're visiting is a form element or not. 
    var elementRegistry=new Map()//
    for(let a in domNode.elements){
        elementRegistry.set(domNode.elements[a],1)
    }

    //we still have to propagate because we need to know whether the which fields go in what sections and which sections have been disabled or not 
    var sections=[],data={}
    var pointer=data
    var propagate=function(node){
        for (let a in (node.children || {} )){
            var child=node.children[a]
            if(elementRegistry.has(child) && child.getAttribute){
                //of course other retrieval methods would have to be added if the form is extended
                var name=child.getAttribute('name')
                if(name){
                     pointer[name]=child.value
                     if(child.getAttribute('type')==='checkbox'){pointer[name]=child.getAttribute('checked')}
                }
            }
            if(child.reactHandle && child.reactHandle.construct===Collapsible){
                var instance=child.reactHandle.instance
                var title=instance.props.title
                pointer[title]={open:instance.open}
                pointer=pointer[title]
                sections.push[pointer]
            }
            propagate(child)
            if(child.reactHandle && child.reactHandle.construct===Collapsible){
                sections.pop()
                pointer=sections[sections.length-1] || data                
            }
        }
    }
    propagate(domNode)
    return data
}
var findPapa=function(node,targetType=Form){
    var test=node
    var stop=document.querySelector('body')
    while(test!==stop){
        if(test.reactHandle && test.reactHandle.construct===targetType){return test}
        test=test.parentNode
    }
}
export class Form extends Component{//fields takes an array of an array of fields
        constructor(props){
        super(props)
        this.formRef=React.createRef()
        this.getWithQuery=()=>{ 
            return (()=>this.props.withQuery) ||
            (()=>{console.error('tried to submit a form with no callback to <Form/>')})
        }
        this.submitData=()=>{
            var data=collectData(this.formRef.current)
            this.getWithQuery()(data)
        }
    }
    makeTrace(){
        this.formRef.current.reactHandle={construct:Form,instance:this}
    }
    componentDidUpdate(){ this.makeTrace() }
    componentDidMount(){ 
        this.makeTrace()
        this.formRef.current.onsubmit=()=>false
    }
    render(){
        //the Go button can be place anywhere in the component but needs to 
        return(
            <React.Fragment>
                <form ref={this.formRef} >
                    {this.props.children||(<span></span>)}
                </form>
            </React.Fragment>
        )
    }
}

//activates finds the form node above it and activates with
export class Go extends Component{//fields takes an array of an array of fields
        constructor(props){//parent-> the parent Form instance
        super(props)
        this.ref=React.createRef()
        this.tellPapa=()=>{
            console.log(findPapa(this.ref.current))
            findPapa(this.ref.current).reactHandle.instance.submitData()
        }
    }
    render(){
        return(
            <button ref={this.ref} onClick={this.tellPapa}>Go</button>
        )
    }
}


