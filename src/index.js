import React, {Component} from 'react'
import ReactDom from 'react-dom'

import {Search} from 'search'
import {SearchResults} from 'search_results'
import {BooksContainer} from 'books_container'


class Books extends Component{
    constructor(props){
        super(props)
    }
    render(){
        return (
            <BooksContainer>
                <Search/>
                <SearchResults/>
            </BooksContainer>
        )
    }
}

window.BooksAPI=function(){
    this.container=document.querySelector('body')
    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
        ReactDom.render(<Books/>,this.container)
    }
}
