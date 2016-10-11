/**
  * This script is used in "Add site" and "Add zone" admin pages.
  * forms.SiteAdminForm put data to help_text of hidden custom field called "dictionary".
  * fomrs.ZoneAdminForm put data to help_text of hidden custom field called "dictionary".
  * On client select ("onselect") hides all options that do not belong to
  * selected client
  */

var $ = django.jQuery;

function getDict(){
    // for django 1.9
    // var el = $('input#id_dictionary').siblings('p.help');
    
    // for django 1.8 bootstrapped
    var el = $('input#id_dictionary').siblings('span.help-block');

    if (!el || el.length === 0){
        return {};
    }
    var obj = $.parseJSON(el.html());
    return obj;
}


function siteAdd(obj){
    // inititally hide all chain options 
    $('select#id_chain option').each(function(){ $(this).hide(); });

     $(document).on('change', '#id_client', function() {
        var clientId = $(this).val();
        var chains = obj[clientId] || [];

        $('select#id_chain option').each(function(){
            var value = $(this).val();
            if (!isInt(value)){
                return;
            }

            value = parseInt(value);
            
            if (arrayContains(value, chains)){
                $(this).show();
            } else {
                $(this).hide();
            }
            
        });
    });
}

function zoneAdd(obj){
    // inititally hide all site options 
    $('select#id_site option').each(function(){ $(this).hide(); });

     $(document).on('change', '#id_client', function() {
        var clientId = $(this).val();
        var sites = obj[clientId] || [];

        $('select#id_site option').each(function(){
            var value = $(this).val();
            if (!isInt(value)){
                return;
            }

            value = parseInt(value);
            
            if (arrayContains(value, sites)){
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
}


function arrayContains(value, arr){
    var i = arr.length;
    while (i--) {
        if (arr[i] === value) {
            return true;
        }
    }
    return false;
}


function isInt(value){
    var er = /^[0-9]+$/;
    return ( er.test(value) ) ? true : false;
}