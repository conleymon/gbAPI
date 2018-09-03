/*
  *these items are intended for a flexbox. 
  *they set themsleves with margin 
  *they animate their collapse by animating the flex grow  and min width values 
  *props
    orientation 'vertical',horizontal
    reverse
    title default expand collapse
    if no orientation is present it will look on the parents getcomputed style for the flexDirection prop and orient itself based on that

*/
import {Queue} from 'queue'
import {ObjectAnimator} from'animator'
import React, {Component} from 'react'
import ReactDOM from 'react-dom'
var animator=new ObjectAnimator()
var verticalizeText=function(text=''){
    return (<div>{text.split('').map((v)=>{return (<div>{v}</div>)})}</div>)
}
var queue=new Queue()

export class Collapsible extends Component{
    constructor(props){//title, ,orientation(vertical means collapses vertically or hor.), reverse
        super(props)
        this.open=this.props.open!==undefined?this.props.open:true
        this.wrapperStyle={flexGrow:this.open?(
                this.props.grow!==undefined?this.props.grow:1
            ):0
        }
        this.contentStyle={flexGrow:1,opacity:1}
        this.buttonStyle={flexDirection:'row'}
        this.wrapper=React.createRef()
        this.content=React.createRef()

        this.getWrapperClass=()=>this.props.wrapperClass || 'appComponent'
    }
    determineWidthAndHeight(direction){
        if(!direction){var direction=this.getDirection()}
        var width='auto',height='auto'
        if(!this.open){
            var direction=this.getDirection()
            if(direction.indexOf('row')!=-1){width=0}else{height=0}
        }
        return {width,height}
    }

    toggle(){
        this.open=!this.open
        var direction=this.getDirection() 
        var widthAndHeight=this.determineWidthAndHeight(direction)
        var flexGrow=this.open?(
            this.props.grow!==undefined?this.props.grow:1
        ):0

        var opacity=this.open?1:0

        queue.interrupt().clear()
            .add(()=>{
                this.contentStyle.opacity=opacity
                this.forceUpdate()
            })
            .wait(300)
            .add(()=>{
                this.wrapperStyle.flexGrow=flexGrow
                Object.assign(this.contentStyle,{flexGrow},widthAndHeight)
                this.forceUpdate()
            })

        //if opening, reverse the queue
        if(this.open){
            var line=queue.slice().reverse()
            queue.clear().add(line)
        }
        queue.kickStart()
    }
    getDirection(){
        var direction=!this.props.orientation && this.wrapper.current?
            getComputedStyle(this.wrapper.current.parentNode).flexDirection:
            (this.props.orientation==='vertical'?'column':'row')

        direction+=this.props.reverse?'-reverse':''
        return direction
    }
    componentDidMount(){//can't really know the orientation till the first render
        var widthAndHeight=this.determineWidthAndHeight()
        Object.assign(this.contentStyle,widthAndHeight)
        this.forceUpdate()
    }
    componentDidUpdate(){
        this.wrapper.current.reactHandle={construct:Collapsible,instance:this}
    }
    render(){
        var direction=this.getDirection()

        var title=this.props.title||(this.open?'collapse':'expand')
        title=direction.indexOf('row')!=-1?verticalizeText(title):title

        this.wrapperStyle.flexDirection=direction
        this.buttonStyle.flexDirection=direction==='row'?'column':'row'

        return(
        <div ref={this.wrapper}  className={this.getWrapperClass()} style={Object.assign({},this.wrapperStyle)}>
            <div onClick={this.toggle.bind(this)} togglecomponent='true' style={Object.assign({},this.buttonStyle)}>
                {title}
            </div>
            <div ref={this.content} style={Object.assign({},this.contentStyle)}>
                {this.props.children}
            </div>
        </div>

        )

    }
}
