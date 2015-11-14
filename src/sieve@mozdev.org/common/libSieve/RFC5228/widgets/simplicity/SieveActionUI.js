function SieveActionBox(item)
{
  this._item = item;
}

SieveActionBox.prototype.html
  = function ()
{
  <select>
    <option>enumerate all actions here</option>
    <option>enumerate all actions here</option>
  </select>
  
  if selected update details
  
  
}


if (!SieveDesigner)
  throw "Could not register Action Widgets";

  
SieveDesigner.register(SieveDiscard, SieveDiscardUI);
SieveDesigner.register(SieveKeep, SieveKeepUI);
SieveDesigner.register(SieveStop, SieveStopUI);

SieveDesigner.register(SieveFileInto, SieveFileIntoUI);
SieveDesigner.register(SieveRedirect,SieveRedirectUI);