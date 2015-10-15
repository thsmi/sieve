    $('.account').click(function() {
       $( this ).parent().toggleClass("collapsed");
    });
    
    $(".demo-avatar-dropdown i:first-child").click(function() {
      //$(".mdl-layout__drawer").hide();
      
      //$(".mdl-layout__header").css("margin-left:0px;").css("width:100%");
      $("body").addClass("sidebar-hidden");
      
    });;
    
    $(".mdl-layout__drawer-button").click(function() {
      $("body").removeClass("sidebar-hidden");
       //$(".mdl-layout__header").css("margin-left:0px;").css("width:100%");
       //$(".mdl-layout__drawer").show();
    });
    
    $("#sivEditor").height($(".mdl-layout__content").height());
    $(window).resize(function() {
      $("#sivEditor").height($(".mdl-layout__content").height());
    });
    
 
    /*var x = document.getElementsByClassName("account")
    for (var i = 0; i < x.length; i++)  {
       console.dir(x[i].parentNode.getElementsByClassName("scripts"));
        x[i].parentNode.getElementsByClassName("scripts")[0].style.display="none";
    }*/