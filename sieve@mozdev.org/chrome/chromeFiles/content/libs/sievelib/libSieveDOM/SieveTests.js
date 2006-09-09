

/******************************************************************************/
function isSieveTest (data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();

  if (token.indexOf("not") == 0)
    return true;
  else if (isSieveBooleanTest(token))
    return true;
  else if (token.indexOf("address") == 0)
    return true;
  else if (token.indexOf("anyof") == 0)
    return true;
  else if (token.indexOf("envelope") == 0)
    return true;
  else if (token.indexOf("exists") == 0)
    return true;
  else if (token.indexOf("header") == 0)
    return true;
  else if (token.indexOf("size") == 0)
    return true;
  else if (token.indexOf("hasflag") == 0)
    return true;
    
  return false
}

function SieveTestParser(data)
{
  this.data = data;
}

SieveTestParser.prototype.extract
    = function ()
{
  var element = null;
  var token = this.data.substr(0,10).toLowerCase();
  
  
  if (token.indexOf("not") == 0)
    element = new SieveNotTest();
  else if (isSieveBooleanTest(token))
    element = new SieveBooleanTest();
  else if (token.indexOf("address") == 0)
    element = new SieveAddressTest();
  else if (token.indexOf("anyof") == 0)
    element = new SieveAnyOfTest();
  else if (token.indexOf("envelope") == 0)
    element = new SieveEnvelopeTest();
  else if (token.indexOf("exists") == 0)
    element = new SieveExistsTest();
  else if (token.indexOf("header") == 0)
    element = new SieveHeaderTest();
  else if (token.indexOf("size") == 0)
    element = new SieveSizeTest();
  else if (token.indexOf("hasflag") == 0)
    element = new SieveHasFlagTest();
  else
    throw " :... - Sieve Test expected";
          
  this.data = element.parse(this.data);
  
  return element;
}    

SieveTestParser.prototype.getData
   = function()
{
  return this.data; 
}

function isSieveBooleanTest(data)
{   
  data = data.toLowerCase();
  if (data.indexOf("true") == 0)
    return true;
  if (data.indexOf("false") == 0)
    return true;
  
  return false;
}

/******************************************************************************/

// anyof (not exists ["From", "Date"],
//                   header :contains "from" "fool@example.edu")
//  test-list = "(" test *("," test) ")"

function isSieveTestList(data)
{
  if (data.charAt(0) == "(")
    return true;
    
  return false;
}


function SieveTestList(size)
{  
  this.elements = new Array();
}

SieveTestList.prototype.parse
    = function (data)
{  
  // remove the (
  data = data.slice(1);
		
  while (true)
  {
    if (data.charAt(0) == ")")
      return data.slice(1);
      
    if (data.charAt(0) == ",")
    {      
      data = data.slice(1);
      continue;
    }
            
    var element = new Array("","","");
    
    if (isSieveDeadCode(data))
    {
      element[0] = new SieveDeadCode();
      data = element[0].parse(data);
    }
    
    if (isSieveTest(data) == false)
      throw "Test expression expected";
    
    var parser = new SieveTestParser(data);
    element[1] = parser.extract();
    data = parser.getData();
    
    if (isSieveDeadCode(data))
    {
      element[2] = new SieveDeadCode();
      data = element[2].parse(data);
    }
        
    this.elements.push(element);
  }
  
}

SieveTestList.prototype.toString
    = function ()
{          
  var result = "(";
  var separator = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {
    result = result
             + separator
             + this.elements[i][0].toString()
             + this.elements[i][1].toString()
             + this.elements[i][2].toString();
             
    separator = ",";
  }
  result += ")";
  
  return result;   
}

SieveTestList.prototype.toXUL
    = function ()
{
  var result = "";
  for (var i = 0; i<this.elements.length; i++)
  {    
    result += this.elements[i][1].toXUL();
    result += "<html:br />";
  }
  return result;
}


/*****************************************************************************/

function SieveAllOfTest(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
  
  this.testList = new SieveTestList(this.id+"_1");
}

SieveAllOfTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  
  data = data.slice("allof".length);
  
  data = this.whiteSpace[0].parse(data);
  
  data = this.testList.parse(data);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveAllOfTest.prototype.toString
    = function ()
{
  return "allof"
    + this.whiteSpace[0].toString()
    + this.testList.toString()
    + this.whiteSpace[1].toString();
}

SieveAllOfTest.prototype.toXUL
    = function ()
{
  return "all of the following conditions match"
    + this.testList.toXUL();
}
/******************************************************************************/

function SieveNotTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
  
  this.test = null;
}

SieveNotTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  
  data = data.slice("not".length);
  
  data = this.whiteSpace[0].parse(data);
  
  var parser = new SieveTestParser(data);
  this.test = parser.extract()
  data = parser.getData();
  
  // TODO implement to all tests an setNot
  // this.test.invertLogic(true);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveNotTest.prototype.toString
    = function ()
{
  return "not"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString();
}

SieveNotTest.prototype.toXUL
    = function ()
{
  return " not "+this.test.toXUL();
}

/******************************************************************************/

//<envelope> [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE] 
//  <envelope-part: string-list> <key-list: string-list>
function SieveEnvelopeTest() 
{
  // first line with deadcode
  this.options = new Array(null,null,null);
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode());
  this.envelopeList = new SieveStringList();
  this.keyList = new SieveStringList();
}

SieveEnvelopeTest.prototype.parse
    = function (data)
{
  data = data.slice("envelope".length);
  data = this.whiteSpace[0].parse(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart();
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator();
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType();
    else
      break;
    
    data = this.options[i].parse(data);
    data = this.whiteSpace[i+1].parse(data);
  }
  
  data = this.envelopeList.parse(data);
  
  data = this.whiteSpace[4].parse(data);
  
  data = this.keyList.parse(data);
    
  data = this.whiteSpace[5].parse(data);
  
  return data;
}    

SieveEnvelopeTest.prototype.toString
    = function ()
{
  return "envelope"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.envelopeList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveEnvelopeTest.prototype.toXUL
    = function ()
{
  return "envelope - to be implented";
}

/******************************************************************************/


//address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
//             <header-list: string-list> <key-list: string-list>
             
function SieveAddressTest(id)
{
  this.id = id;  
  this.options = new Array(null,null,null);
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_3"),
                new SieveDeadCode(this.id+"_4"),
                new SieveDeadCode(this.id+"_5"),
                new SieveDeadCode(this.id+"_6"),
                new SieveDeadCode(this.id+"_7"),
                new SieveDeadCode(this.id+"_8"));
  this.headerList = new SieveStringList(this.id+"_9");
  this.keyList = new SieveStringList(this.id+"_10");
}

SieveAddressTest.prototype.parse
    = function (data)
{
  data = data.slice("address".length);
  data = this.whiteSpace[0].parse(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart(this.id+"_"+i);
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator(this.id+"_"+i);
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType(this.id+"_"+i);
    else
      break;
    
    data = this.options[i].parse(data);
    data = this.whiteSpace[i+1].parse(data);
  }
  
  data = this.headerList.parse(data);
  
  data = this.whiteSpace[4].parse(data);
  
  data = this.keyList.parse(data);
    
  data = this.whiteSpace[5].parse(data);
  
  return data;
}    

SieveAddressTest.prototype.getID
    = function ()
{
  return this.id;
}

SieveAddressTest.prototype.toString
    = function ()
{
  return "address"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.headerList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveAddressTest.prototype.toXUL
    = function ()
{
  return "address - to be implemented";
}

