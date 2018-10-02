import React, {Component} from 'react'
import styles from 'style.scss'

export class Paginate extends Component{
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
            pages.push(<div key={page} name={'page_'+page} onMouseDown={this.changePage.bind(this,page)} className={styles[this.props.current_page===page?'currentPageNum':'pageNum']}>{page}</div>)
            page++
        }
        if(start!==1){
            pages.unshift.call(pages,<div key={1} name={'page_'+1} onMouseDown={this.changePage.bind(this,1)} className={styles.pageNum}>{1}</div>,' ... ')
        }
        return pages
    }
    render(){
        var p=this.props
        return(
            <div name='pageNumbers' className={styles.paginate}> {this.getNumbers()}</div>
        )
    }
}
