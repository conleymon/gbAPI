var chai=require('chai')
var {expect}=chai
import {prefixId} from 'unique_id'
import {ObjectAnimator} from 'animator.js'
import {Queue} from 'queue'

describe(prefixId('Animator functions'),()=>{
    var dest , src , preAnim , postAnim , preInc , postInc, animator=new ObjectAnimator()

    beforeEach(()=>{
        src={
            one:{
                two:{
                    three:{val:-100},
                    val:-100
                },
                val:-100
            },
            val:-100
        }
        dest={
            one:{
                two:{
                    three:{val:3},
                    val:2
                },
                val:1
            },
            val:0
        }
    })

    it( prefixId( 'animates deeply to target values' ),( done )=>{
        postAnim=function(){
            expect(src,"final values don't match").to.deep.equal(dest)
            done()
        }
        animator.anim({src,dest,postAnim})
    })

    it(prefixId(' executes callBacks when expected'),(done)=>{
        var before=false, during1=0,during2=0, after=false, seqFuncMessage='functions are out of order or not called'
        
        preAnim=()=>{
            expect([before,during1,during2,after],seqFuncMessage+' preanim').to.deep.equal([false,0,0,false])
            before=true
        }
        
        preInc=()=>{
            expect(during1,'inc funcs are out of order pre').to.equal(during2)
            during1++
        }
        postInc=()=>{
            expect(during1>=during2,'inc funcs are out of order post').to.equal(true)
            during2++
        }

        postAnim=function(){
            expect([before,after],seqFuncMessage+' postanim').to.deep.equal([true,false])
            expect(during1,'inc funcs are out of order postANIM').to.equal(during2)
            expect(src,"final values don't match").to.deep.equal(dest)
            after=true
            done()
        }
        
        animator.anim({src,dest,preAnim,preInc,postInc,postAnim})
    })
    
    describe(prefixId('animates colors rgb, hex and color names'),()=>{
        var incCalled=false, firstRed, firstBlue

        beforeEach(()=>{
            var incCalled=false, firstRed, firstBlue            
        })

        var getNumbers=(col)=>{
            var col=col.split('(')[1]
            col = col.split( ',' ).map( v => Number(v) )
            return col
        }

        var doTest=(srcColor,destColor,done)=>{
            src.color=srcColor
            dest.color=destColor
            postAnim=()=>{
                var col=getNumbers(src.color)
                expect( firstRed>col[0] ).to.equal( true )
                expect( firstBlue<col[2] ).to.equal( true )
                done()
            }
    
            postInc=()=>{
                if(incCalled){return}
                incCalled = true
                var col=getNumbers(src.color)
                firstRed=col[0]
                firstBlue=col[2]
            }

            animator.anim({
                src,
                dest,
                postAnim,
                postInc
            })
        }

        var srcRepsRed={
            red_name:'red',
            red_rgb:'rgb(255,0,0)',
            red_rgba:'rgba(255,0,0,.5)',
            red_hex:'#ff0000'
        }

        var srcRepsBlue={
            blue_name:'blue',
            blue_rgb:'rgb(0,0,255)',
            blue_rgba:'rgba(0,0,255,.5)',
            blue_hex:'#0000ff'
        }
        
        for(var r in srcRepsRed){
            for(var b in srcRepsBlue){
                it(prefixId(r+' to '+b),(done)=>{
                    doTest(srcRepsRed[r] , srcRepsBlue[b] , done)
                })                    
            }
        }
    })
    it(prefixId('animates transforms independently, preserves src order'),(done)=>{
        src.transform='translateX(20%) translateY(100%) rotateY(0deg)'
        dest.transform='rotateY(90deg) translateY(20%) '
        var dest2={transform:'translateX(100%)'}
        var animator2=new ObjectAnimator()

        var getTask=function(animator,dest){
            return {
                task:(p)=>{
                    animator.anim({
                        src,
                        dest,
                        synchTransInc:true,
                        postAnim:()=>{p.done()}
                    })
                }
            }
        }

        new Queue().all([
                getTask(animator,dest),
                getTask(animator2,dest2)
            ])
            .add(()=>{
                expect(src.transform).to.equal('translateX(100%) translateY(20%) rotateY(90deg)')
                done()
            })
            .kickStart()
    })
    it(prefixId('animates only variables on dest'),(done)=>{
        dest={otherVars:[1,2,3]}
        src.otherVars=[0,0,0]
        postAnim=()=>{
            expect(src.otherVars).to.deep.equal([1,2,3])
            expect(src.one.val).to.equal(-100)
            expect(src.one.two.val).to.equal(-100)
            expect(src.one.two.three.val).to.equal(-100)
            done()
        }
        animator.anim({src,dest,postAnim})
    })
    it(prefixId('stop works'), (done)=>{
        var last=src.one.two.three.val
        preInc=()=>{last=src.one.two.three.val}
        postAnim=()=>{
            expect(last<3).to.equal(true)
            done()
        }
        animator.anim({src , dest , preInc, postAnim , duration:1000})
        setTimeout(()=>{
            animator.stop()
        },500)
    })
})
