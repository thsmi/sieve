
// setflag <variablename: string> <list-of-flags: string-list>

SieveSetFlag.isSetFlag
  = function(token)
{ 
 if (token.indexOf("setflag") == 0)
    return true;
 
 return false;
}

function SieveSetFlag(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("deadcode");
  this.whiteSpace[1] = SieveLexer.createByName("deadcode");
                
  this.flaglist = SieveLexer.createByName("stringlist",this.id+"_1");
}

SieveSetFlag.prototype.init
    = function (data)
{  
  data = data.slice("setflag".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace[0].init(data);
      
  data = this.flaglist.init(data)

  data = this.whiteSpace[1].init(data);
    
  // ... and finally remove the semicolon;
  if (data.charAt(0) != ";")
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);
}

SieveSetFlag.prototype.getID
    = function ()
{
  return this.id;
}

SieveSetFlag.prototype.toString
    = function ()
{
  return "setflag"
    + this.whiteSpace[0].toString()
    + this.flaglist
    + this.whiteSpace[1].toString()        
    + ";";
}

SieveSetFlag.prototype.toXUL
    = function ()
{
  return "Set Flag";
}

/******************************************************************************/

//addflag <variablename: string> <list-of-flags: string-list>

SieveAddFlag.isAddFlag
  = function(token)
{ 
 if (token.indexOf("addflag") == 0)
    return true;
 
 return false;
}

function SieveAddFlag(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
                
  this.flaglist = new SieveStringList(this.id+"_1");
}

SieveAddFlag.prototype.init
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("addflag".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace[0].init(data);
  
  data = this.flaglist.init(data)

  data = this.whiteSpace[1].init(data);
    
  // ... and finally remove the semicolon;
  if (data.charAt(0) != ";")
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);
}

SieveAddFlag.prototype.getID
    = function ()
{
  return this.id;
}

SieveAddFlag.prototype.toString
    = function ()
{
  return "addflag"
    + this.whiteSpace[0].toString()
    + this.flaglist
    + this.whiteSpace[1].toString()        
    + ";";
}

SieveAddFlag.prototype.toXUL
    = function ()
{
  return "Add Flag";
}

/******************************************************************************/

//removeflag <variablename: string> <list-of-flags: string-list>

SieveRemoveFlag.isRemoveFlag
  = function(token)
{ 
 if (token.indexOf("removeflag") == 0)
    return true;
 
 return false;
}

function SieveRemoveFlag(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
                
  this.flaglist = new SieveStringList(this.id+"_1");
}

SieveRemoveFlag.prototype.init
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("removeflag".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace[0].init(data);
      
  data = this.flaglist.init(data)

  data = this.whiteSpace[1].init(data);
    
  // ... and finally remove the semicolon;
  if (data.charAt(0) != ";")
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);
}

SieveRemoveFlag.prototype.getID
    = function ()
{
  return this.id;
}

SieveRemoveFlag.prototype.toString
    = function ()
{
  return "removeflag"
    + this.whiteSpace[0].toString()
    + this.flaglist
    + this.whiteSpace[1].toString()        
    + ";";
}

SieveRemoveFlag.prototype.toXUL
    = function ()
{
  return "Remove Flag";
}

/******************************************************************************/

//hasflag [MATCH-TYPE] <variable-list: string-list> <list-of-flags: string-list>

// REGISTER 



SieveHasFlag.isHasFlag
  = function(token)
{ 
 if (token.indexOf("hasflag") == 0)
    return true;
 
 return false;
}
 

    
function SieveHasFlag(id)
{
  this.id = id;
//  this.data  = new Object();
  this.whiteSpace     = new Array();
  this.whiteSpace[0]  = new SieveDeadCode(this.id+"_0");
  this.matchType      = null;
  this.whiteSpace[1]  = new SieveDeadCode(this.id+"_2");
  this.flagList       = new SieveStringList(this.id+"_3");
  this.whiteSpace[2]  = new SieveDeadCode(this.id+"_4");
}

SieveHasFlag.prototype.init
    = function (data)
{
  data = data.slice("hasflag".length);
  
  this.whiteSpace[0].init(data)
  
  if (isSieveMatchType(data))
  {
    this.matchType = new SieveMatchType(this.id+"_1");
    data = this.matchType.init(data);
    
    data = this.whiteSpace[1].init(data);    
  }
  
  data = this.flagList.init(data);
  data = this.whiteSpace[2].init(data);
      
  return data;
}    

SieveHasFlag.prototype.getID
    = function ()
{
  return this.id;
}

SieveHasFlag.prototype.toString
    = function ()
{
  return "hasflag"
    + this.whiteSpace[0].toString()
    + ((this.matchType != null)?this.matchType[0].toString():"")
    + ((this.matchType != null)?this.whiteSpace[1].toString():"")
    + this.flagList.toString()
    + this.whiteSpace[2].toString();
}

SieveHasFlag.prototype.toXUL
    = function ()
{
  return "hasflag Test - to be impelented";
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register IMAP Flags";

with (SieveLexer)
{
  register("action","action/addflag",
      function(token) {return SieveAddFlag.isAddFlag(token)}, 
      function(id) {return new SieveAddFlag(id)});
      
  register("action","action/removeflag",
      function(token) {return SieveRemoveFlag.isRemoveFlag(token)}, 
      function(id) {return new SieveRemoveFlag(id)});  
      
  register("action","action/setflag",
      function(token) {return SieveSetFlag.isSetFlag(token)},
      function(id) {return new SieveSetFlag(id)});
      
  register("test","test/hasflag",
      function(token) {return SieveHasFlag.isHasFlag(token)},
      function(id) {return new SieveHasFlag(id)});  
}