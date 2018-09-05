import React, {Component} from 'react'

export class Paginate extends Component{
    /*
        now in this case, all of your variables are there. you're going to show the selected page
        2 pre and post pages, assuming the props allow

    */
    constructor(props){
        super(props)
    }
    changePage(page){
        if(page!==this.props.current_page){
            this.props.onPageChange(page)
        }
    }
    getNumbers(){
        var pages=[],
            start=this.props.first_page, 
            end=this.props.last_page
        var page=start

        while(page<=end){
            pages.push(<div onClick={this.changePage.bind(this,page)} style={{color:page===this.props.current_page?'red':'black'}}>{page}</div>)
            page++
        }
        if(start!==1){
            pages.unshift.call(pages,<div onClick={this.changePage.bind(this,1)} style={{color:page===this.props.current_page?'red':'black'}}>{1}</div>,' ... ')
        }
        return pages
    }
    render(){
        var p=this.props
        return(
            <div> {this.getNumbers()}</div>
        )
    }
}
