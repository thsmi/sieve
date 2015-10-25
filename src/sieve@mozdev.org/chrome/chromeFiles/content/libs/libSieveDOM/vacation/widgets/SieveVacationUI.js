

function SieveVacationUI(elm)
{
  SieveActionDialogBoxUI.call(this,elm);
}

SieveVacationUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
SieveVacationUI.prototype.constructor = SieveVacationUI;


SieveVacationUI.prototype.onEnvelopeChanged
   = function ()
{
    // Update the CC fields...
    var addresses = $("#sivCcGroup input[type='text']");    
    var cc = "";
   
    addresses.each(function( index ) {
      cc += (cc.length?", ": "" ) +$(this).val();
    })
      
    $('#vacationCcDesc').text(cc);
      
    // Update the From Field
    if ( $("input[type='radio'][name='from']:checked").val() == "true")  
      $('#vacationFromDesc').text($("#sivVacationFrom").val());
    else
      $('#vacationFromDesc').text("Address of the sieve script owner");
      
    if ( $("input[type='radio'][name='subject']:checked").val() == "true")
       $('#vacationSubjectDesc').text($("#sivVacationSubject").val());
    else
      $('#vacationSubjectDesc').text("Server's default Subject");
   	
}

SieveVacationUI.prototype.onLoad
    = function ()    
{
  var that = this;
  
  $('div.dialogTab > div').click(function(){
  	
  	$('div.dialogTab > div').removeClass('tab-active');
    $('.tab-content > div').removeClass('tab-active');

    $(this).addClass('tab-active');
        
    var id = $(this).attr('tab-content');
    $("#"+id).addClass('tab-active');
  })
    
	 
  $("#vacationEnvelopeEdit").click( function() { 
    $("#sivEditMain").hide();
    $("#vacationEnvelopePage").show();
  });
  
  $("#vacationEnvelopeBack").click( function() {
  	 
  	that.onEnvelopeChanged();
  	 
  	$("#sivEditMain").show();
    $("#vacationEnvelopePage").hide();
    
           
  });
	
  var state = this.getSieve().state;
		
  $('input:radio[name="days"][value="'+!!state["days"]+'"]').prop('checked', true);
  $('input:radio[name="subject"][value="'+!!state["subject"]+'"]').prop('checked', true);
  $('input:radio[name="from"][value="'+!!state["from"]+'"]').prop('checked', true);
  $('input:radio[name="addresses"][value="'+!!state["addresses"]+'"]').prop('checked', true);
  $('input:radio[name="mime"][value="'+!!state["mime"]+'"]').prop('checked', true);
  $('input:radio[name="handle"][value="'+!!state["handle"]+'"]').prop('checked', true);
  
  // In case the user focuses into a textfield the radio button should be changed...
  $("#sivVacationFrom").focus( function() { $('input:radio[name="from"][value="true"]').prop('checked', true) });
  $("#sivVacationSubject").focus( function() { $('input:radio[name="subject"][value="true"]').prop('checked', true) });
  $("#sivVacationDays").focus( function() { $('input:radio[name="days"][value="true"]').prop('checked', true) });
  $("#sivVacationHandle").focus( function() { $('input:radio[name="handle"][value="true"]').prop('checked', true) });
  
  $("#sivVacationReason").val(this.getSieve().reason.value());
  
  
  if (state["subject"])
    $("#sivVacationSubject").val(this.getSieve().subject.subject.value());
 
  if (state["days"])
    $("#sivVacationDays").val(this.getSieve().days.days.value());
  
  if (state["from"])
    $("#sivVacationFrom").val(this.getSieve().from.from.value());

  if (state["handle"])
    $("#sivVacationHandle").val(this.getSieve().handle.handle.value());  
  
  // addresses or cc need some special care
    
  // we need this function because javascript uses block scope..
  function addItem(value) {       
    var elm = $(".sivCcTemplate").children().first().clone();
      
    $("#sivCcClone").before(elm);
      
    elm.find(":text").val(value);
    elm.find("button").click(function() { elm.remove() })         
  }
    
  $("#sivCcClone").click(function() { addItem(""); });
  
  if (state["addresses"]) {
  	
  	var items = this.getSieve().addresses.addresses;
  	
  	for (var i=0; i<items.size(); i++) 
  	  addItem(items.item(i));
  }
  
  // trigger reloading the envelope fields...
  this.onEnvelopeChanged();  
}

SieveVacationUI.prototype.onSave
    = function () {

  var state = {}
  
  //$("#myform input[type='radio']:checked").val();

  // Update the states...
  state["subject"] = ( $("input[type='radio'][name='subject']:checked").val() == "true");
  state["days"] = ( $("input[type='radio'][name='days']:checked").val() == "true");
  state["from"] = ( $("input[type='radio'][name='from']:checked").val() == "true");  
  state["mime"] =  ( $("input[type='radio'][name='mime']:checked").val() == "true");
  state["handle"] = ( $("input[type='radio'][name='handle']:checked").val() == "true");
  
  var addresses = $("#sivCcGroup input[type='text']");
  state["addresses"] = !!addresses.length;
  
  // TODO Catch exceptions...
  // ... then update the fields...
  
  var sieve = this.getSieve();
  
  try {
    if (state["subject"])
      sieve.subject.subject.value($("#sivVacationSubject").val());
 
    if (state["days"])
      sieve.days.days.value($("#sivVacationDays").val());
  
    if (state["from"])
      sieve.from.from.value($("#sivVacationFrom").val());

    if (state["handle"])
      sieve.handle.handle.value($("#sivVacationHandle").val());

    if (state["addresses"]) {
      sieve.addresses.addresses.clear();
      
      addresses.each(function( index ) {
      	sieve.addresses.addresses.append($(this).val());
      }) 
    }
    
    this.getSieve().reason.value($("#sivVacationReason").val());
  }
  catch (ex) {
  	alert(ex);
  	return false;
  }
    
  this.getSieve().state = state;
  return true;
}

SieveVacationUI.prototype.getTemplate
    = function () 
{
  return "./vacation/widgets/SieveVacationUI.html"    	
}

  
SieveVacationUI.prototype.getSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .html(" vacation> "
                 /*+ this.getSieve().matchType.matchType()+ " " 
                 + $('<div/>').text(this.getSieve().keyList.toScript()).html()+"</em>"*/);
}

if (!SieveDesigner)
  throw "Could not register Body Extension";

SieveDesigner.register("action/vacation", SieveVacationUI);
