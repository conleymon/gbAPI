import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'
import {Paginate} from 'paginate'
import Paginator from 'paginator'
import styles from 'style.scss'

var getFromServer=getFromServerThrottled()//returns a function that will reschedule for calling every 200 milliseconds, until time ellapses without a new call


export class SearchResults extends Component{
    constructor(props){
        super(props)
        this.query=''
        this.resultsPerPage=20
        this.pagesShown=5
        this.paginator = new Paginator(this.resultsPerPage,this.pagesShown)
        this.makePages=(totalResults=0,page=0)=>{
            this.pageStatus=this.paginator.build(totalResults,page)
        }
        this.makePages()
        this.result=null
        this.status='ready'  //fetching, ready  
        this.changePage=(page)=>{
            if(this.status!=='ready'){return}
            this.makePages(this.pageStatus.total_results,page)
            this.getResult()
        }
        
    }
    buildQuery(){//for now handles pages. takes the page requested and calculates tbe start index and adds it to the query
        return this.query
            +'&startIndex='+(this.resultsPerPage*this.pageStatus.current_page)
            +"&maxResults="+(this.resultsPerPage)
    }
    getResult(){
        console.log(this.buildQuery())
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
    moreInfo(link){
        this.infoWindow=window.open(link,'infoWindow')
    }
    getImage(v){
        var v=v.volumeInfo
        var src=''
        if(v.imageLinks && v.imageLinks.smallThumbnail){
            src=v.imageLinks.smallThumbnail
        }
        return <img src={src} style={{width:'100%'}}/>
    }
    formatItem(v){
        var volume=v.volumeInfo

        return(
            <div  className={styles.results_listing}>
                <div >
                    {this.getImage(v)}
                </div>
                <div >
                    <div><em>{volume.title?volume.title:'Unknown'}</em></div>
                    <div>Authors: {volume.authors?volume.authors.join(', '):'Unknown'}</div>
                    <div>Publisher: {volume.publisher?volume.publisher :'Unknown'}</div>
                </div>
                <div  onClick={this.moreInfo.bind(this, volume.infoLink)}>More Info</div>
            </div>
        )
    }

    render(){
        //you can check here if the state is different from the props
        var content
        if(this.status==='fetching'){content= (<span>Getting Results</span>)}
        else if(this.pageStatus.total_results===0){content= (<span>No Results</span>)}
        else{
            content=(
                <React.Fragment>
                    {(this.result.items || []).map(this.formatItem.bind(this))}
                    <Paginate
                        {...this.pageStatus}
                        onPageChange={this.changePage}
                    />
                </React.Fragment>
            )

        }

        return(
            <div style={this.props.style} className={this.props.className}>
                {content}
            </div>

        )

    }
}
