import React, {Component} from 'react'

var collectData=function(domNode){//should be a formNode
    //make a registry of form elements against which to check all dom elements. 
    var elementRegistry=new Map()//
    for(let a in domNode.elements){
        elementRegistry.set(domNode.elements[a],1)
    }

    var sections=[],data={}
    var pointer=data
    var propagate=function(node){
        for (let a in (node.children || {} )){
            var child=node.children[a]
            if(elementRegistry.has(child) && child.getAttribute){
                var name=child.getAttribute('name')
                if(name){
                     pointer[name]=child.value
                     if(child.getAttribute('type')==='checkbox'){pointer[name]=child.getAttribute('checked')}
                }
            }
            if(child.reactHandle && child.reactHandle.construct === 'Collapsible'){
                var instance = child.reactHandle.instance
                var title = instance.props.title
                pointer[title] = {open:instance.open}
                pointer = pointer[title]
                sections.push[pointer]
            }
            propagate(child)
            if(child.reactHandle && child.reactHandle.construct==='Collapsible'){
                sections.pop()
                pointer=sections[sections.length-1] || data                
            }
        }
    }
    propagate(domNode)
    return data
}


export class Form extends Component{
        constructor(props){
        super(props)
        this.formRef=React.createRef()
        this.getWithData=()=>{
            return (this.props.withData || ( ()=>console.error("called 'Go' with no withData function") ))
        }

        this.submitData=()=>{
            var data=collectData(this.formRef.current)
            this.getWithData()(data)
        }
    }
    mark(){
        this.formRef.current.reactHandle={construct:Form,instance:this}
    }
    componentDidUpdate(){ this.mark() }
    componentDidMount(){ 
        this.mark()
        this.formRef.current.onsubmit=()=>false
    }
    render(){
        return(
                <form ref={this.formRef} style={this.props.style} className={this.props.className}>
                    {this.props.children||(<span></span>)}
                </form>
        )
    }
}





var findParentForm=function(node,targetType=Form){
    var test=node
    var stop=document.querySelector('body')
    while(test!==stop){
        if(test.reactHandle && test.reactHandle.construct===targetType){return test}
        test=test.parentNode
    }
}

export class Go extends Component{
        constructor(props){
        super(props)
        this.ref=React.createRef()
        this.activateParentForm=()=>{
            findParentForm(this.ref.current).reactHandle.instance.submitData()
        }
    }
    render(){
        return(
            <div 
                ref={this.ref}
                style={this.props.style} 
                className={this.props.className}  
                onClick={this.activateParentForm}
                activateform='true'
            >
                <div >{this.props.text || 'Go'}</div>
            </div>
        )
    }
}


