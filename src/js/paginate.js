import React, {Component} from 'react'
import styles from 'style.scss'

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
            pages.push(<div onClick={this.changePage.bind(this,page)} className={styles[this.props.current_page===page?'currentPageNum':'pageNum']}>{page}</div>)
            page++
        }
        if(start!==1){
            pages.unshift.call(pages,<div onClick={this.changePage.bind(this,1)} className={styles.pageNum}>{1}</div>,' ... ')
        }
        return pages
    }
    //paginate, pageNum, currentPageNum
    render(){
        var p=this.props
        return(
            <div className={styles.paginate}> {this.getNumbers()}</div>
        )
    }
}
