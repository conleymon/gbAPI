import React, {Component} from 'react'
import ReactDom from 'react-dom'
import { SearchBox } from 'search_box'
import { buildQuery , formatResponse } from 'search_box_build_queries'
import { Form, Go } from 'form'
import { Collapsible } from 'collapsible_vertical_regular'
import { SearchResults } from 'search_results';
import { constants } from 'app_constants';



import styles from 'style.scss'

var getClasses=function(){
    var classes=Array.prototype.slice.call(arguments)
    classes=classes.map(v=>styles[v]).join(' ')
    return classes
}

var{ host } = constants


class SearchComponent extends Component{
    constructor(props){
        super(props)
        this.formRef=React.createRef()
        this.resultsRef=React.createRef()
        this.query=''
        this.withData=(data)=>{
            var query=[]
            var root=host+'?q='+data.main.replace(/\s/g, '+')
            if(data.Advanced.open){
                var advanced= data.Advanced
                for(let a in advanced){
                    if(a==='open'){continue}
                    if(advanced[a]!==''){query.push('in'+a+':'+advanced[a])}
                }
            }
            this.query=root +'+'+ query.join(' ').replace(/\s/g,'+')
            this.forceUpdate()        
        }    
    }
    render(){
        return(
            <div   className={getClasses('appContainer','cover')}>
                <Form  ref={this.formRef}className={styles.form} withData={this.withData}>
                    <div  className={styles.fields}>
                        <SearchBox
                            name='main'
                            default='Search' 
                            searchClass={styles.main_search_box} 
                            buildQuery={buildQuery}
                            formatResponse={formatResponse}
                            postChoose={()=>{this.formRef.current.submitData()}}
                        />
                        <Collapsible className={styles.appComponent} open={false} className={styles.collapsible} title='Advanced'>
                            <div>Title: <SearchBox name='title' /></div>
                            <div>Author: <SearchBox name='author' /></div>
                            <div>Publisher: <SearchBox name='publisher' /></div>
                        </Collapsible>
                    </div>
                    <Go  className={styles.go}>go</Go>
                </Form>
                <SearchResults query={this.query}  className={styles.results}/>
            </div>
        )
    }
}

window.VolumesAPI=function(p={}){
    var {container}=p
    if(container){this.container=container}
    this.container=document.querySelector('body')
    this.detailsContainment='contained'
    this.readerContainment='contained'

    this.render=function(p={}){
        var {container}=p
        if(container){this.container=container}
        ReactDom.render(<SearchComponent/>,this.container)
    }
}
