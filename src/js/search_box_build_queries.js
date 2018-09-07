import React, {Component} from 'react'
import {constants} from 'app_constants'
import styles from 'style.scss'
var {host}=constants

export var buildQuery=function(input){
    return {query:host+'?q='+input.value.replace(/\s/g,'+')}
}

export var formatResponse=function(response){
    return (response.items || []).map((v)=>{
        var info=v.volumeInfo
        return {
            value:info.title,
            content:(
                <div className={styles.autocomplete_listing}>
                    <div>{info.title}</div>
                    <div>{info.subtitle}</div>
                    <div>{(info.authors||[]).join(', ')}</div>
                </div>
            )
        }
    })
}
