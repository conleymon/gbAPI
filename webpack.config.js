var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    name: 'client',
    target: 'web',
    resolve: {
      modules: [
        './node_modules',
        './src',
        './src/css'],
      extensions: [ '.tsx', '.ts', '.js', '.jsx','css','scss' ]
    },
    entry: ['./src/index.js','./src/css/style.scss'],//,'./src/css/style.css'],
    output: {
      filename: 'dist/js/google_books_api_bundle.js'
    },
    plugins:[new ExtractTextPlugin({ 
      filename: 'dist/css/bundle.css',
      allChunks: true,
    })],			 

//    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          use:[
            {
              loader:'babel-loader',
              options: {
                presets: ['react','env']
              }
            },
          ],
          exclude: /node_modules/
        },
        {
          test: /\.s?css$/,
          exclude: [/node_modules/],
//*
          loaders:['style-loader','css-loader','postcss-loader','sass-loader'],
/*/
          use: ExtractTextPlugin.extract(
            { 
              fallback:'style-loader',
              use:['css-loader',{
                loader: 'postcss-loader', // Run post css actions
                options: {
                  plugins: function () { // post css plugins, can be exported to postcss.config.js
                    return [
                      //require('autoprefixer')
                    ];
                  }
                }
              },'sass-loader']
            }
          )
//*/
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          loader: 'url-loader',
          options:{
            limit:10000
          }
        }
      ]
    },
    watch:true,
    //mode:'development'
  }
  