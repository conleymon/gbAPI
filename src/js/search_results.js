import React, {Component} from 'react'

export class SearchResults extends Component{
    constructor(props){
        super(props)
    }
    render(){
        console.log({props:this.props})
        var data=this.props.data||[]
        var formatItem=(v)=>{
            var volume=v.volumeInfo
            return(
                <div>
                    <div>{volume.title}</div>
                    <div>{volume.authors.join(', ')}</div>
                    <div onClick={this.props.showDetails||(()=>{})}>More Info</div>
                </div>
            )
        }
        //console.log({data:data.map(formatItem)})
        return data.map(formatItem)
    }
}
