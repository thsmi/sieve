var sieve = null;
var gCompileTimeout = null;
var gCompile = null
var gCompileDelay = null;


var event = 
{
  onDeleteScriptResponse:  function(response)
  {

    clearInterval(gCompileTimeout);
    close();
  },
	
  onPutScriptResponse: function(response)
  {    
    // is the script renamed?
    if ((window.arguments[0]["scriptName"] != null)
        && (window.arguments[0]["scriptName"] != document.getElementById("txtName").value))
    {
      var request = new SieveDeleteScriptRequest(
    									new String(window.arguments[0]["scriptName"]));
      request.addDeleteScriptListener(event);
      request.addErrorListener(event);
    	
      sieve.addRequest(request);
		    
      return
    }
        
    clearTimeout(gCompileTimeout);
    close();
  },
	
  onError: function(response)
  {
    alert("FATAL ERROR:"+response.getMessage());
  },
  
  onGetScriptResponse: function(response)
  {		
    document.getElementById("txtName").value = response.getScriptName();
    document.getElementById("txtScript").value = response.getScriptBody();
  }
}

function onCompile()
{
  var lEvent = 
  {
    onPutScriptResponse: function(response)
    {
      document.getElementById("gbError").setAttribute('hidden','true')
       	
      // we need no handlers thus we don't care if the call succseeds
      sieve.addRequest(new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));
    },
    	
    onError: function(response)
    {
      document.getElementById("gbError").removeAttribute('hidden');
      document.getElementById("lblError").value = response.getMessage();    		

      // the server did not accept our script therfore wa can't delete it...   		
    }
  }

  var request = new SievePutScriptRequest(
                  "TMP_FILE_DELETE_ME",
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(lEvent);
  request.addErrorListener(lEvent);
  
  sieve.addRequest(request);
}

function onBtnCompile()
{
    if ( document.getElementById("btnCompile").checked == false)
    {
        gCompile = true;
        document.getElementById("btnCompile")
          .setAttribute("image","chrome://sieve/content/images/syntaxCheckOn.png");
        onCompile();
        return
    }

    clearTimeout(gCompileTimeout);
    gCompileTimeout = null;
    
    gCompile = false;
    document.getElementById("btnCompile")
      .setAttribute("image","chrome://sieve/content/images/syntaxCheckOff.png");
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
        
  var request = new SieveGetScriptRequest(
                  new String(window.arguments[0]["scriptName"]))
  request.addGetScriptListener(event);
  request.addErrorListener(event);

  sieve.addRequest(request);
}

function onAccept()
{
  var request = new SievePutScriptRequest(
                  new String(document.getElementById("txtName").value),
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(event)
  request.addErrorListener(event)

  sieve.addRequest(request)
    
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

function onBtnChangeView()
{
  var deck = document.getElementById("dkView");
  
  if (deck.selectedIndex == 0)
    document.getElementById("dkView").selectedIndex = 1;
  else
    document.getElementById("dkView").selectedIndex = 0;
  
}