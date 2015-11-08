var dom2;

$(document).ready(function() {
  init();
  
    /*i += 1;
    $(this).find("span").text( "mouse over x " + i );
  }).mouseout(function(){
    $(this).find("span").text("mouse out ");
  })*/
  $("#divOutput").mouseover(function(ev) {
  
     switch (ev.target.nodeName)
   {
     case "INPUT":
       case  "TEXTAREA" :
       $("[draggable=true]").attr("draggable","false");
     break;
     
    default:
      $("[draggable=false]").attr("draggable","true"); 
   }     
     
    $("#draggable").val(ev.target.nodeName)});
  
  var toolbarLeft = $('#toolbar').offset().left;
  
  $(window).scroll(function(){
      $('#toolbar').css('left', toolbarLeft -$(window).scrollLeft());
  }) ;
  
  $("#CapabilityOverlay")
      .click(function() { $('#Capabilities').hide(); }); 
      
});

function setSieveScript(script,capabilities)
{
  if (capabilities)
    SieveLexer.capabilities(capabilities);
    // reset environemnt
  init();
  
  if (!script)
    script =$('#txtScript').val();
   else
    $('#txtScript').val(script);
    
    dom2.script(script);
  
  $("#txtOutput")
    .val(dom2.script());
    
  $("#divOutput")
    .empty()
    .append(dom2.html())  
}

function getSieveScript()
{
  return dom2.script();
}

function require()
{
  var requires = {};
  
  dom2.root().require(requires);
  
  for (var i in requires)
    alert(i);  
}

function showCapabilities() {

  $("#Capabilities input:checkbox").removeAttr('checked');
  
  var capabilities = SieveLexer.capabilities();  
  $( "#Capabilities input:checkbox" ).each(function() {
     if (capabilities[$(this).val()])
     $(this).prop("checked",true);
  });
   $('#Capabilities').show();
}

function selectAllCapabilities() {
    $( "#Capabilities input:checkbox" ).each(function() {
     $(this).prop("checked",true);
  });
}

function setCapabilities()
{
  $('#Capabilities').hide();
  
  var capabilities = {};
  
  $( "#Capabilities input:checked" ).each(function() {
    capabilities[$(this).val()] = true;
  });
  
  SieveLexer.capabilities(capabilities);  
  setSieveScript();
}

function compact()
{
  alert(dom2.compact());
}
function debug(obj)
{
  //var logger = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

  var str = "";
  for (tempVar in obj)
    str += tempVar+"\n";
  
  alert(str);
  //logger.logStringMessage(str);
}

  function createMenuItem(action,flavour, docShell)
  {    
    var elm2 = (new SieveEditableBoxUI(docShell));
  elm2.drag(new SieveCreateDragHandler());
  elm2.drag().flavour(flavour); 
    elm2._elmType = action;
  
    return elm2.html()
                  .addClass("sivMenuItem")
                    .append($(document.createTextNode(action.split('/')[1]))) 
  }

  function init()
  {
    // Yes it's a global object
    dom2 = new SieveDocument(SieveLexer,SieveDesigner);
  
  var docShell = dom2;
  
    var elm = $("#sivActions").empty();
    
  elm.append($("<div/>").text("Actions"));
    
  //  alert(SieveLexer.capabilities());
    for (var key in SieveLexer.types["action"])
     if (SieveLexer.types["action"][key].onCapable(SieveLexer.capabilities()))
         elm.append(createMenuItem(key,"sieve/action",docShell));

  elm.append($("<div/>").text("Tests"))
    
    for (var key in SieveLexer.types["test"])
    if (SieveLexer.types["test"][key].onCapable(SieveLexer.capabilities()))
      if (key != "test/boolean")
          elm.append(createMenuItem(key,"sieve/test",docShell).get(0));

    
  elm.append($("<div/>").text("Operators"))
    
    for (var key in SieveLexer.types["operator"])
    if (SieveLexer.types["operator"][key].onCapable(SieveLexer.capabilities()))
        elm.append(createMenuItem(key,"sieve/operator",docShell).get(0));
    
  elm
    .append($(document.createElement('div'))
      .addClass("spacer"))
      .append($(new SieveTrashBoxUI(docShell).html())
      .attr('id','trash'));
  }

  function errorhandler(msg, url, line)
  {
  //alert(msg+"\n"+url+"\n"+line);
    showInfoMessage(msg,"");
  }
  
  window.onerror = errorhandler;
  
  function showInfoMessage(message, content)
  {
    $("#infobarsubject > span").text(message);
  $("#infobarmessage > span").text(content);
    $("#infobar").toggle(); 
  }
