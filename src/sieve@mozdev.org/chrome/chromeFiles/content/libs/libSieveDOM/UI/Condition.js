/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

function SieveIfUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm)
}

SieveIfUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveIfUI.prototype.onValidate
   = function ()
{
  return true;
}

SieveIfUI.prototype.initSummary
    = function ()
{
  
  /* 1. Condition mit test wird gedroppt
  
    <condition, expression>
    IF
      condition
        <expression>    
        expression
        <expression>
        block
          action
          action
    <condition, expression>
    (ELSE IF
      condition
        <expression>
        expression
        <expression>
        block
          action
          action
    <condition, expression>)
    (ELSE
      <action>
      block)
      <action>
  
  
  expression = operator test
  
  conditon expression
  
  <droptarget 1>
  IF <condition>
  <droptarget 2>
  ELSE IF <condition>
  <droptarget 3>
  ELSE <condition>
  <droptarget 4>
  
  1,2,3 akzeptiert conditions mit test
  
  wenn auf 4 eine Kondition ohne test gedroppt wird,
  wird der inhalt dem ELSE zugewiesen,
  
  wenn auf 4 eine Kondition MIT test gedroppt wird,
  wird sie vor dem Else eingefügt.
  */
  
  var elm = $(document.createElement("div"))
              .append(new SieveDropBoxUI(this.getId()/*,this.getSieve().children(0)*/).getWidget())
              .append($(document.createElement("div"))
                .text("IF")
                .append(this.getSieve().children(0).toWidget()));
     
  for (var i=1; i<this.getSieve().children().length;i++)
  {
    if (this.getSieve().children(i).hasCondition())
      elm
        .append(new SieveDropBoxUI(this.getId()/*,this.getSieve().children(i)*/).getWidget())
        .append($(document.createElement("div"))
          .text("ELSE IF"));
    else
      elm
        .append(new SieveDropBoxUI(this.getId()/*,this.getSieve().children(i)*/).getWidget())
        .append($(document.createElement("div"))
          .text("ELSE"));
        
    elm.append(this.getSieve().children(i).toWidget());
  }
  
  elm.append(new SieveDropBoxUI(this.getId()).getWidget());
  
  return elm;
              
  
  // wird ein test gedroppt wird er in eine kondition verwandelt
  // wird eine action gedroppt wird sie in eine condition verwandelt if (false)
  // ... ist es die letze action, dann gibt es ein else bzw. wird dem else hinzugefüt
  
  /*return $(document.createElement("div"))
           .text("Implement me");*/
   
  // Implement a drag over element...
  // ... when dragging over the if element, new droptargets apear
  // ... would bemuch nicer
           
  //Todo descice automativally between ELSE IF and IF
  
  // das IF sollte zu dem conditon container gehören...
  // ... das else hierbleibern...
          
  /*
   * {IF : CONDITION}      <- akzeptiert tests
   *   {BODY}              <- akzeptiert nur actions
   * ELSE {IF : CONDITION} <- akzeptiert tests und actions
   *   {BODY}              <- wenn hier tests gedroppt werden
   * ELSE                  <- akzeptiert nur test und actions
   *   {BODY}              <- wenn akzeptiert nur actions
   *   
   * wird ein test auf ein Else gedroppt so wird der Condition container 
   * {IF : CONDITION} angelegt...
   * 
   * ELSE ist nur sichtbaerwenn BODY daten enthält
   * das ELSE droptarget ist immer sichtbar
   * 
   * Werden alle conditions entfernt, dann wird das element mit dem Else verschmolzen
   * 
   * Unsortieren der Conditions wird derzeit nicht unterstützt
   */ 
  /*IF
    <condition accepts="actions & tests & operators>
  ELSE IF
    <condition accepts="action test opperators>
  ELSE
    <condition>
  */
  
}

SieveIfUI.prototype.initEditor
    = function ()
{
  var elm = $(document.createElement("div"))
              .append($(document.createElement("div"))
                .text("IF"));
                
  if (this.getSieve().children(0).toWidget)
    elm.append(this.getSieve().children(0).toWidget());         
     
  for (var i=1; i<this.getSieve().children().length;i++)
  {
    if (this.getSieve().children(i).hasCondition())
      elm.append($(document.createElement("div"))
        .text("ELSE IF"));
    else
      elm.append($(document.createElement("div"))
        .text("ELSE"));
        
    if (this.getSieve().children(i).toWidget)
      elm.append(this.getSieve().children(i).toWidget());
  }
  
  return elm;
}

SieveIfUI.prototype.onDragEnter
    = function (event)
{   
  this.showEditor();
}

SieveIfUI.prototype.onDragExit
    = function (event)
{      
  this.showSummary();
}
      

SieveIfUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;
  
  var _this = this;
        
  // Invoke parent method, to get a drag Box 
  return $(SieveEditableDragBoxUI.prototype.getWidget.call(this))
    //.bind("dragexit",function(e) { return _this.onDragExit(e)})
    //.bind("dragenter",function(e) { return _this.onDragEnter(e)})      
}
