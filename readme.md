# Google Books API
Written with React. Includes auto-complete in the main search box, and advanced fields in a toggleable 'Advanced' section.
 
## Build
	1. Clone repository
	2. Navigate to project directory
	3. Run npm install
	4. Run webpack --config webpack.all_config.js
	5. Run 'node server.js'
	6. tests should be available  at http://localhost:8080/tests/run_tests.htm
	7. app demo should be available  at http://localhost:8080/dist/books_demo.html

Three config files are included
* webpack.production_config.js ->Builds the app
* webpack.mocha_config.js -> Builds tests
* webpack.all_config -> Builds tests and app

	
## Usage
In your html file, include a script tag pointing to the the build file, in this case, 
```
<script src='dist/js/google_books_api_bundle.js'>
```
And then somewhere in the file
```javascript
var  Books=new  VolumesAPI()

Books.render({
	container:yourDomNode
})
```

Styles are all contained in the css/style.scss file, and are applied as a css module.
	

## Testing
Open dist/tests/run_tests.htm
Tests are run with mocha in the browser, and use the live google books api. Internet connection is required. The webpack.mocha_config.js file extends the production_config.js file to use test_entry as it's entry point. All other config settings match production settings. Import files to test as you would in production. 



## Components and modules
### Queue
See Queue.readme.md

### Form
The 'Form' component can take any dom structure to serve as it's children. When activated, it propagates through it's dom children and appends form element values to a data object to be submitted to it's 'withData' function prop. Each element must have a name attribute.
A 'Go' component is included for easy activation. Place it as a child anywhere inside your Form.

The data format submitted to withData is a simple name:value object. The Form does support nested data. To create a nested data chunk, You will need a collapsible component. This component will need to satisfy 

* places a 'reactHandle' property on it's outermost element, having the structure 
```javascript
{
	construct:'Collapsible',
	instance:theComponentInstance
}
``` 
* The collapsible component must have a boolean 'open' property to let the 'Form' component include whether the nested section is collapsed. it must also have a 'title' property to name the section. 

Example usage:

```javascript
<form withData={someFunc}>
	<input type='text' name='someName'/>
	<Collapsible title='advancedFields'>
		<input type='text' name='nestedInput'/>
	</Collapsible>
	<Go text='submit'/>
<Form/>
```
Clicking 'Go' (appears as 'submit') will call someFunc with a data object argument:

```javascript
{
	someName:'someName value',
	advancedFields:{
		open:false//reflects the component value
		nestedInput:'nestedInput Value'
	}
}
```



Form Props:
Name | Type | Required | Description
---  |---   |---       |---         
withData|function|no|form data handler. args:formData
className|string|no|css class is applied to the form element(outermost)
style|object|no|style Object applied to the form element(outermost)


Go Props:
Name | Type | Required | Description
---  |---   |---       |---         
text|string|no|display value
className|string|no|css styling
style|object|no|inline style

### SearchBox
SearchBox is a standalone auto completing input box.  Rapid keystrokes are throttled down to one request every 200 ms. Any request made while waiting for a response to a previously submitted request is placed on delay, and is submitted once the awaited response is received.  Each request placed on delay replaces the existing  delayed request, so there is only ever one delayed request waiting in the queue; 

SearchBox Props:
Name | Type | Required | Description
---  |---   |---       |---         
buildQuery|function|if not included, autocomplete will not run|describes how to build the query from the search terms. Responsible for including host. argument:input
formatResponse|function|if using autocomplete|formats the response to an array of autocomplete items. See below for return format
postChoose|function|no|Handles a choice from an auto-complete menu argument: Array index chosen from the formatResponse return value (full index, meaning  {content,value}) 
label|string|no|displays directly infront of the input box if included
searchClass|string|no|css styler for the input
labelClass|string|no|css styler for the label
emptyVal|string|no|displayed when user empties the input
formatResponse return format:

```javascript
{
	value:string to replace the input value if the user chooses the item
	content: html or JSX elements to be presented as autocomplete items. argument:server response
}
```
### Paginate
Google's Item count on every response is constructed to be 'best guess' for the purposes of speed. The accuracy of this estimate increases as the user pages through the results. For that reason, the Paginate component displays 2 pages on either side of the current page, and always includes the first page. It takes 2 argument, the result from paginator's  'build' functon (npm i paginator), and onPageChange,  a function to call when a user clicks a page. (argument is the page clicked)

### SearchResults
Every component above is modular. This component is tied to the google API.  Takes a query prop, and builds page parameters on the query when pages are clicked. Resets the pages only when it receives a new query parameter. 





