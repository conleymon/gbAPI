import React, {Component} from 'react'
import {getFromServerThrottled} from 'get_from_server'
import {Paginate} from 'paginate'
import Paginator from 'paginator'
import styles from 'style.scss'

var getFromServer=getFromServerThrottled()

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
        this.status='ready' 
        this.changePage=(page)=>{
            if(this.status!=='ready'){return}
            this.makePages(this.pageStatus.total_results,page)
            this.getResult()
        }        
        this.ref=React.createRef()
    }

    buildQuery(){
        var start=this.pageStatus.current_page-1
        if(start<0){start=0}
        return this.query
            +'&startIndex='+(this.resultsPerPage*start)
            +"&maxResults="+(this.resultsPerPage)
    }

    getResult(){
        var page=this.pageStatus.current_page
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
    resolve(result, page){ 
        this.status='ready'
        if(!result.status && result.items && result.items instanceof Array){           
            this.result=result       
            this.makePages(result.totalItems,this.pageStatus.current_page)//revise total pages based on results.
        }
        else if(page===0){
            this.result=null
            this.makePages()
        }
        this.forceUpdate()
    }
    componentDidUpdate(){
        if(this.props.query!==this.query){
            this.makePages()
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
    formatItem( v , i ){
        var volume=v.volumeInfo

        return(
            <div key={i} className={styles.results_listing}>
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
            <div ref={this.ref} style={this.props.style} className={this.props.className}>
                {content}
            </div>
        )
    }
}
