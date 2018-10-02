import React ,{Component} from 'react'

export class Collapsible extends Component{
    constructor(props){
        super(props)
        this.open=this.props.open!==undefined?this.props.open:true
        this.contentStyle={
            transition:'height 1s ease-in-out'
        }
        this.ref=React.createRef()
    }
    getContentStyle(){
        return Object.assign(this.contentStyle,
            {display:this.open?'block':'none'}
        )
    }
    toggle(){
        this.open=!this.open
        this.forceUpdate()
    }
    mark(){
        if(!this.ref.current){return}
        this.ref.current.reactHandle={construct:'Collapsible',instance:this}
    }

    componentDidMount(){
        this.mark()
    }

    componentDidUpdate(){
        this.mark()
    }

    render(){
        this.contentStyle=this.getContentStyle()
        return (
            <span ref={this.ref} className={this.props.className}>
                <div  togglecomponent='true' onMouseDown={this.toggle.bind(this)} className={this.props.className}>
                    {this.props.title}
                </div>
                <div ref={this.content} style={Object.assign({},this.contentStyle)}>
                    {this.props.children}
                </div>
            </span>
                
        )
    }
}