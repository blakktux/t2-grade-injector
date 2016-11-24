// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
    	try {
	    	var frame = document.getElementsByTagName('iframe')[0].contentWindow.document;
	    	var table = frame.getElementById('gbForm:gradingTable');
	    	var columns = table.getElementsByClassName('gbHeader');

	    	if( columns[4].children[0].value == "Edit Comments >>") {
	    		alert("Please navigate to the edit comments page.");
	    		return;
	    	}

	    	if (frame.getElementById('gbForm:pager_pageSize').value != "0") {
	    		alert("Make sure you've selected 'Show all' under # of students to view");
	    		return;
	    	}

	    	frame.getElementById('gbForm:pager_pageSize')
	    		.insertAdjacentHTML('afterend', "<input id=\"csvfileinput\" type=\"file\" style=\"display:none;\" />");

	    	var upload = frame.getElementById('csvfileinput');
	    	upload.addEventListener("change", function(event) {
	    		var filechoose = event.target;
	    		var filepath = filechoose.value.split('.');
	    		if (filepath.length < 2 || filepath[filepath.length - 1] != "csv") {
	    			alert("Wrong file type");
	    			return;
	    		}
	    		var file = filechoose.files && filechoose.files[0];
	    		var fileReader = new FileReader();

	            fileReader.onload = function (e) {
	                var text = e.target.result;
	                //do something with text
	                data = CSVToArray( text, ',');

	                //Headed w/ row desc
	                if (data[0][0] == "Student ID") {
	                	data.splice(0, 1);
	                }

                    var fails = [];

	                data.forEach(function(datarow) {
	                	var row = frame.evaluate('//tr[child::td[div[text()="' + datarow[0] + '"]]]',
	                		frame, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0);

	                	if (row) {
	                		row.children[3].innerHTML = row.children[3].innerHTML.replace(/value="[0-9]*"/, "value=\"" + datarow[1] + "\"");
	                		if (datarow.length >= 3) {
	                			row.children[4].innerHTML = row.children[4].innerHTML.replace(/rows="4">.*<\/textarea>/, "rows=\"4\">" + datarow[2] + "</textarea>");
	                	    }
                        } else {
	                		if (datarow[0] != "") {
	                			fails.push(datarow[0]);
	                			console.log("Error " + datarow[0])
	                		}
	                	}
	                });

                    if (fails.length > 0) {
                        var outstring = "The following students failed to import:";
                        fails.forEach(function(name) {
                            outstring = outstring + " " + name
                        });
                        alert(outstring);
                    } else {
                        alert("All students grades imported sucessfully");
                    }
		    	};
		    	fileReader.readAsText(file);
		    }, false);

	    	upload.click();
            upload.remove();
    	} catch (error) {
			alert("Unable to find anchor elements. Are you on the right page?");
			console.log(error);
    	}
	}
  }
);

function CSVToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
	    (
	        // Delimiters.
	        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

	        // Quoted fields.
	        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

	        // Standard fields.
	        "([^\"\\" + strDelimiter + "\\r\\n]*))"
	    ),
	    "gi"
	    );


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

	    // Get the delimiter that was found.
	    var strMatchedDelimiter = arrMatches[ 1 ];

	    // Check to see if the given delimiter has a length
	    // (is not the start of string) and if it matches
	    // field delimiter. If id does not, then we know
	    // that this delimiter is a row delimiter.
	    if (
	        strMatchedDelimiter.length &&
	        strMatchedDelimiter !== strDelimiter
	        ){

	        // Since we have reached a new row of data,
	        // add an empty row to our data array.
	        arrData.push( [] );

	    }

	    var strMatchedValue;

	    // Now that we have our delimiter out of the way,
	    // let's check to see which kind of value we
	    // captured (quoted or unquoted).
	    if (arrMatches[ 2 ]){

	        // We found a quoted value. When we capture
	        // this value, unescape any double quotes.
	        strMatchedValue = arrMatches[ 2 ].replace(
	            new RegExp( "\"\"", "g" ),
	            "\""
	            );

	    } else {

	        // We found a non-quoted value.
	        strMatchedValue = arrMatches[ 3 ];

	    }


	    // Now that we have our value string, let's add
	    // it to the data array.
	    arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}
