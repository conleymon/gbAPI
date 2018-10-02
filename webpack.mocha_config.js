//clone top level references
var backBone=Object.assign({} , require('./webpack.production_config.js'))

backBone.entry= ['./tests/test_entry.js']
backBone.output={
  filename: 'tests/test_build.js'
}

module.exports=backBone
