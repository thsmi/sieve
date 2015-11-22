/* global $: false */
/* global console */
/* global window */
/* global document */
/* global net */
/* global SieveAccount */
/* global SieveSession */
/* global SieveGetScriptRequest */
/* global SieveListScriptRequest */


"use strict";

$('.account').click(function() {
       $( this ).parent().toggleClass("collapsed");
    });
    
    $(".demo-avatar-dropdown i:first-child").click(function() {
      //$(".mdl-layout__drawer").hide();
      
      //$(".mdl-layout__header").css("margin-left:0px;").css("width:100%");
      $("body").addClass("sidebar-hidden");
      
    });
    
    $(".mdl-layout__drawer-button").click(function() {
      $("body").removeClass("sidebar-hidden");
       //$(".mdl-layout__header").css("margin-left:0px;").css("width:100%");
       //$(".mdl-layout__drawer").show();
    });
    
    $("#sivEditor").height($(".mdl-layout__content").height());
    $(window).resize(function() {
      $("#sivEditor").height($(".mdl-layout__content").height());
    });
    
 var editor = new net.tschmid.sieve.editor.text.Client("sivEditor");
    
  var account = new SieveAccount();
  
  var session = (new SieveSession(account, "sid2"));      
    
  //var sieve = new Sieve();  
  //sieve.connect( "imap.1und1.com", 2000, true);
  
  function addScript(account, script, active) {
  	
    var item = $("#templates-script").children().first().clone();

    item.find(".script-name").text(script);
    //item.find(".script-active").text()
    
    // Add actions...
    item.find(".script-edit").click(function () { 
      getScript(script);
    });
    
    $("#account-"+account)
      .find(".scripts")
      .append(item);
      
      
  }  
  
  //<div id="accounts" 
  //     account-templates="#templates-account" />
  
  //<div id=""
  //     script-templates="#templates-script"
  
  function addAccount(name) {
  	var item = $("#templates-account").children().first().clone();
  	
  	item.find(".account-name").text(name);
  	
  	item.attr("id", "account-"+name);
  	
  	$("#accounts").append(item);
  	
  	item
  	  .find(".account")
  	  .click(function() {
  	  	
  	  	if (session.isDisconnected()) {
  	  	  session.connect();
  	  	  return;
  	  	}
  	  	
  	  	$("#account-test").toggleClass("collapsed", true);
  	  	session.disconnect();
                
        // TODO toggle between connected and disconnected...
      });
  	
  }
   
    
  

  
  var listener = {
    onListScriptResponse : function(response)
    {
      console.dir(response.getScripts());
      var items = "";
      
    $("#account-test")
      .find(".scripts").empty();
      
      response.getScripts().forEach(
        function (item) { 
              addScript("test", item.script, item.active);}
      );
        
      $("#account-test").toggleClass("collapsed", false);
      //$("#result").val(items);
    },    
    
    onChannelCreated : function () {
      
      var request = new SieveListScriptRequest();
      request.addListScriptListener(this);
      request.addErrorListener(this);
  
      session.sieve.addRequest(request);    
    },
    
    onGetScriptResponse
    : function(response)
{
	console.log(response.getScriptBody());
	
	editor.setScript(response.getScriptBody());	
}
    
  };
  

function getScript(script)
{
  var request = new SieveGetScriptRequest(script);
  request.addGetScriptListener(listener);
  request.addErrorListener(listener);
  
  session.sieve.addRequest(request);
}  
  
    
  session.addListener(listener);
  
  //$("#connect").click(function() {  });
  //$("#disconnect").click(function() { session.disconnect(); });
  

$( document ).ready(function() {
    console.log( "ready!" );
    
    addAccount("test");
});