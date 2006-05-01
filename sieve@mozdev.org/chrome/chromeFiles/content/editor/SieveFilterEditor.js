var sieve = null;
var gCompileTimeout = null;
var gCompile = null
var gCompileDelay = null;


var event = 
{
	onDeleteScriptResponse:  function(response)
	{
		if (response.hasError())
	        alert(response.getMessage());

        clearInterval(gCompileTimeout);
        close();
	},
	
    onPutScriptResponse: function(response)
	{
	    if (response.hasError())
	    {
	        alert(response.getMessage());
	        return
	    }
    
        // is the script renamed?
        if ((window.arguments[0]["scriptName"] != null)
            && (window.arguments[0]["scriptName"] != document.getElementById("txtName").value))
        {
		    sieve.addRequest(
		        new SieveDeleteScriptRequest(
		            new String(window.arguments[0]["scriptName"]),event));
		    
		    return
        }
        
        clearTimeout(gCompileTimeout);
        close();
	},
		
	onGetScriptResponse: function(response)
	{
	
	    if (response.hasError())
		{
		    alert("unknown error");
			close();
	    }
		
	    document.getElementById("txtName").value = response.getScriptName();
		document.getElementById("txtScript").value = response.getScriptBody();
		
	   	//compileInterval = setInterval("onCompile()",4000);
	}
}

function onCompile()
{
    var lEvent = 
    {
    	onDeleteScriptResponse:  function(response)
	    {
	        // ignore everything
    	},
	
        onPutScriptResponse: function(response)
	    {
	    
	        if (response.hasError())
	        {
	            document.getElementById("gbError").removeAttribute('hidden');
       	        document.getElementById("lblError").value = response.getMessage();
       	    }
       	    else
  	            document.getElementById("gbError").setAttribute('hidden','true')
       	        
            sieve.addRequest(
                new SieveDeleteScriptRequest(
	                "TMP_FILE_DELETE_ME",lEvent));
    	}
    }


    sieve.addRequest(
        new SievePutScriptRequest(
            "TMP_FILE_DELETE_ME",
            new String(document.getElementById("txtScript").value),lEvent));
}

function onBtnCompile()
{
    if ( document.getElementById("btnCompile").checked == false)
    {
        gCompile = true;
        onCompile()
        return
    }

    clearTimeout(gCompileTimeout);
    gCompileTimeout = null;
    
    gCompile = false;
    document.getElementById("gbError").setAttribute('hidden','true')    
}

function onInput()
{
    // on every keypress we reset the timeout
    if (gCompileTimeout != null)
    {
        clearTimeout(gCompileTimeout);
        gCompileTimeout = null;
    }
            
    if (gCompile)
       	gCompileTimeout = setTimeout("onCompile()",gCompileDelay);
}

function onLoad()
{
    // script laden
    sieve = window.arguments[0]["sieve"];
    gCompile = window.arguments[0]["compile"];        
    gCompileDelay = window.arguments[0]["compileDelay"];
    
    document.getElementById("btnCompile").checked = gCompile;
    
    if ( window.arguments[0]["scriptName"] == null )
        return
        
	sieve.addRequest(
	    new SieveGetScriptRequest(
	        new String(window.arguments[0]["scriptName"]), event));		        
}

function onAccept()
{
    sieve.addRequest(
        new SievePutScriptRequest(
            new String(document.getElementById("txtName").value),
            new String(document.getElementById("txtScript").value),event));
    
    return false;
}

function onCancel()
{
    close();
}

function onImport()
{
    var filePicker   = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.init(window, "Import Sieve Script", filePicker.modeOpen);

    // If the user selected a style sheet
    if(filePicker.show() != filePicker.returnOK)
        return
        
    var inputStream      = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

    inputStream.init(filePicker.file, 0x01, 00444, null);
    scriptableStream.init(inputStream);

    document.getElementById("txtScript").value = scriptableStream.read(scriptableStream.available());

    scriptableStream.close();
    inputStream.close();
}

function onExport()
{
    var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                            .createInstance(Components.interfaces.nsIFilePicker);

    filePicker.defaultExtension = ".sieve";
    filePicker.defaultString    = document.getElementById("txtName").value+".sieve";

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

    var result = filePicker.show();
    
    if ((result != filePicker.returnOK) && (result != filePicker.returnReplace))
        return
        
    var file = filePicker.file;
    
    if(file.exists() == false)
        file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 00444);

    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                            .createInstance(Components.interfaces.nsIFileOutputStream);
                            
    outputStream.init(file, 0x04 | 0x08 | 0x20, 00444, null);

    var data = document.getElementById("txtScript").value;
    outputStream.write(data, data.length);
    outputStream.close();
}

function onCut() { goDoCommand("cmd_cut"); }

function onCopy() { goDoCommand("cmd_copy"); }

function onPaste() { goDoCommand("cmd_paste"); }