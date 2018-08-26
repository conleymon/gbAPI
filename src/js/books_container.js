import React, {Component} from 'react'

export class BooksContainer extends Component{
    constructor(props){
        super(props)
    }
    render(){
        return (
            <div>
                {this.props.children}            
            </div>
        )
    }
}
