import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'
import ReactPaginate from 'react-paginate'
import Paginator from 'paginator'

/* *gibberish decision: whether or not google's rejection is because the search terms were gibberish (there really are no results) or the page number was exceeded
*/
var getFromServer=getFromServerThrottled()//returns a function that will reschedule for calling every 200 milliseconds, until time ellapses without a new call

export class SearchResults extends Component{
    constructor(props){
        super(props)
        this.query=''
        this.resultsPerPage=20
        this.pagesShown=10
        this.paginator = new Paginator(this.resultsPerPage,this.pagesShown)
        this.makePages=(totalResults=0,page=0)=>{
            this.pageStatus=this.paginator.build(totalResults,page)
        }
        this.makePages()
        this.result=null
        this.status='ready'  //fetching, ready  
        this.changePage=(page)=>{
            if(this.status!=='ready'){return}
            this.makePages(this.pageStatus.total_results,page.selected)
            this.getResult()
        }
        

        /*

        on instantiation, there is no result
        you have to get a result on update, so as not to interfere with the initial render.
        onmount, 

        paginator and paginate...

        paginate should be rendered with different props when the query changes


        stateVars:
        query
        pagenumber
        status
        on receiving a new query prop, if it is different, the page will be reset to 1. otherwise, the component should not update

        changes in 
            the query prop
                resets the page to 0
            the page
                only resets the page
        
        cause the fetching status to take into effect
        */
        
    }
    buildQuery(){//for now handles pages. takes the page requested and calculates tbe start index and adds it to the query
        return this.query
            +'&startIndex='+(this.resultsPerPage*this.pageStatus.current_page)
            +"&maxResults="+(this.resultsPerPage)
    }
    getResult(){
        var page=this.pageStatus.page_number //store the pagenumber for the gibberish decision*
        var pack={
            query:this.buildQuery(),
            withResult:(result)=>{
                this.resolve.call(this, result, page)
            },
            noSuccess:(result)=>{
                this.resolve.call(this, result, page)                
            }
        }
        this.status='fetching'
        getFromServer(pack)
        this.forceUpdate()        
    }
    resolve(result, page){// resolve is called with the same page setting  
        this.status='ready'
        /*
        cases
            successful terms and pagenumber
            gibberish terms, and there really are no results (fail or no result with page=0 request)
            pagenumber exeeded
        */
        if(!result.status && result.items && result.items instanceof Array){//if successful, the result should be extracted
            this.result=result       
            this.makePages(result.totalItems,this.pageStatus.current_page)//revise total pages based on results. (freezing requests during fetch is not decided at the time of this comment.)
        }
        else if(page===0){//if the search terms were gibberish
            this.result=null
            this.makePages()
        }
        //all other cases should do nothing
        this.forceUpdate()
    }
    componentDidUpdate(){//the only thing the outside should be responsible for is the query
        if(this.props.query!==this.query){
            this.makePages()//resets pages and num results to 0
            this.query=this.props.query
            this.status='fetching'
            this.forceUpdate()
            this.getResult()
        }
    }
    formatItem(v){
        var volume=v.volumeInfo
        return(
            <div>
                <div>{volume.title}</div>
                <div>{volume.authors.join(', ')}</div>
                <div onClick={this.props.showDetails||(()=>{})}>More Info</div>
            </div>
        )
    }

    render(){
        //you can check here if the state is different from the props
        if(this.status==='fetching'){return (<span>Getting Results</span>)}
        if(this.pageStatus.total_results===0){return (<span>No Results</span>)}
        var ps =this.pageStatus
        return (
            <React.Fragment>
                <ReactPaginate
                    pageCount={ps.total_pages}
                    pageRangeDisplayed={this.pagesShown}
                    MarginPagesDisplayed={4}
                    forcePage={ps.current_page}
                    onPageChange={this.changePage}
                >

                </ReactPaginate>
                {(this.result.items || []).map(this.formatItem.bind(this))}
            </React.Fragment>
        )

    }
}
