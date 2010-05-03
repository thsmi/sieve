/*
 * This file defines the structure for all atomar sieve elements like
 *   - Strings
 *   - Numbers
 *   - Tests
 *   - Actions
 */
 

function SieveObject()
{
}

SieveObject.prototype.init
  = function (data)
{
  return data;
}

SieveObject.prototype.toString
  = function ()
{
  return "";
}

SieveObject.prototype.toXUL
  = function ()
{
  return "";  
}

/******************************************************************************/
function isSieveSemicolon(data)
{
  if (data.charAt(0) != ";")
    return false;
  
  return true;
}

 

/*******************************************************************************
    CLASSNAME: 
      SieveTestParser implements SieveParser
    
    CONSTUCTOR:
      public SieveTestParser(String data)

    PUBLIC FUNCTIONS:      
      public static boolean isTest(String data, int index)
      public static void registerTest(String id, String classname)
      public Object extract() throws Exception
      public String getData()

    MEMBER VARIABLES: 
      private String data;

    DESCRIPTION: 
      This Wrapper class converts a Sting into a SieveTest Object. The function
      isTest() probes wether a String contains a SieveTest Object or not. This
      Object can be extracted by calling the extract(). After calling extract,
      you can retrive the data String via getData(). This will return the String
      passed to the constructor minus the extracted Object(s).
      
      !!! All SieveTest have to register via registerTest() !!!
                   
      
*******************************************************************************/



/******************************************************************************/

/******************************************************************************/

function SieveNumber(id)
{
  this.id = id
  this.number = "1";
  this.unit = null;
}

SieveNumber.isNumber
  = function (data,index)
{
  if (index == null)
    index = 0;
    
  if (isNaN(data.charAt(index)))
    return false;
  
  return true;
}

SieveNumber.prototype.init
    = function(data)
{
  var i
  
  for (i=0; i<data.length; i++)
  {
    if (SieveNumber.isNumber(data,i))
      continue;
    
    break;
  }

  this.number = data.slice(0,i);  
  data = data.slice(i); 
  
  var ch = data.charAt(0).toUpperCase();

  if ((ch == 'K') ||  (ch == 'M') || (ch == 'G'))
  {
    this.unit = data.slice(0,1);
    data = data.slice(1);
  }
  
  return data;
}

SieveNumber.prototype.getID
    = function ()
{
  return this.id;
}

SieveNumber.prototype.toString
    = function ()
{
  return this.number
    +((this.unit==null)?"":this.unit);
}

SieveNumber.prototype.toXUL
    = function ()
{
  return "<html:div class='SieveNumber'>"
    + "  <html:input type='text' value='"+this.number+"' />"
    + "  <html:select>"
    + "    <html:option "+((this.unit.toUpperCase()=="K")?"selected='true'":"")+">"
    + "      Kilobytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="M")?"selected='true'":"")+">"
    + "      Megabytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="G")?"selected='true'":"")+">"
    + "      Gigabytes" 
    + "    </html:option>"
    + "  </html:select>"
    + "</html:div>";
}

/******************************************************************************/
