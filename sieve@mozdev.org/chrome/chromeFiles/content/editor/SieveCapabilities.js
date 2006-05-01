function onLoad()
{
    if ( window.arguments[0]["implementation"] != null )
        document.getElementById("lblImplementation").value = window.arguments[0]["implementation"];
        
    if ( window.arguments[0]["extensions"] != null )
        document.getElementById("lblExtensions").value = window.arguments[0]["extensions"];
        
    if ( window.arguments[0]["sasl"] != null )
        document.getElementById("lblSASL").value = window.arguments[0]["sasl"];
}