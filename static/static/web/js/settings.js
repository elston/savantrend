// Generated by CoffeeScript 1.10.0
(function() {
  'use strict';
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    hasProp = {}.hasOwnProperty;

  $(function() {
    var allSettings, allSettingsDefaults, font_names_google, font_names_normal, font_types_google, font_types_normal, fonts_process_disabled, k, selectTemplateResult, stkeys;
    allSettings = JSON.parse($('#settingsdata').html());
    allSettingsDefaults = allSettings;
    if ($('#settingsdefaults').length > 0) {
      allSettingsDefaults = JSON.parse($('#settingsdefaults').html());
    }
    font_names_normal = JSON.parse($('#font_names_normal').html());
    font_types_normal = JSON.parse($('#font_types_normal').html());
    font_names_google = JSON.parse($('#font_names_google').html());
    font_types_google = JSON.parse($('#font_types_google').html());
    fonts_process_disabled = true;
    window.saveSettings = function(value, resultmsg) {
      var postdata, saveurl, userid;
      saveurl = $('#settingsdata').data('saveurl');
      userid = $('#settingsdata').data('userid');
      if (saveurl) {
        postdata = {
          'data': JSON.stringify(value),
          'userid': userid
        };
        return $.ajax(saveurl, {
          type: 'POST',
          dataType: 'html',
          data: postdata,
          success: function(data, textStatus, jqXHR) {
            var close, message;
            message = $('<div class="alert alert-success success-message" style="display: none;"></div>');
            close = $('<button type="button" class="close" data-dismiss="alert">&times</button>');
            message.append(close);
            message.append(resultmsg);
            return message.appendTo($('body')).fadeIn(300).delay(3000).fadeOut(500);
          }
        });
      }
    };
    window.stgroups = {
      'site': ['sitename', 'background', 'dbbackground', 'navbarbg', 'navbarbgactive', 'navbarfg', 'navbarfgactive'],
      'labels': ['label1', 'label2', 'label3', 'label4', 'label5', 'label6'],
      'kpis': ['FOOTFALL', 'SALES', 'TRANS', 'UNITS', 'STAFF', '%CONV', 'ATV', 'UPT', 'ACV', 'CTSR', 'UPC', 'SPS', 'kpinameFOOTFALL', 'kpinameSALES', 'kpinameTRANS', 'kpinameUNITS', 'kpinameSTAFF', 'kpinameCONV', 'kpinameATV', 'kpinameUPT', 'kpinameACV', 'kpinameCTSR', 'kpinameUPC', 'kpinameSPS', 'kpiformatFOOTFALL', 'kpiformatSALES', 'kpiformatTRANS', 'kpiformatUNITS', 'kpiformatSTAFF', 'kpiformatCONV', 'kpiformatATV', 'kpiformatUPT', 'kpiformatACV', 'kpiformatCTSR', 'kpiformatUPC', 'kpiformatSPS'],
      // 'reports': ['performancecomparison', 'dailyretailtrendanalysis', 'executivesummary', 'hourlyperformance', 'performancecalendar', 'performancetrendanalysis', 'performancecomparison_header', 'dailyretailtrendanalysis_header', 'executivesummary_header', 'hourlyperformance_header', 'performancecalendar_header', 'performancetrendanalysis_header', 'performancecomparison_footer', 'dailyretailtrendanalysis_footer', 'executivesummary_footer', 'hourlyperformance_footer', 'performancecalendar_footer', 'performancetrendanalysis_footer', 'performancecomparison_date_format', 'dailyretailtrendanalysis_date_format', 'executivesummary_date_format', 'hourlyperformance_date_format', 'performancecalendar_date_format', 'performancetrendanalysis_date_format'],
      'reports': ["performancecomparison", "dailyretailtrendanalysis", "executivesummary", "hourlyperformance", "performancecalendar", "performancetrendanalysis", "performancecomparison_header", "dailyretailtrendanalysis_header", "executivesummary_header", "hourlyperformance_header", "performancecalendar_header", "performancetrendanalysis_header", "performancecomparison_footer", "dailyretailtrendanalysis_footer", "executivesummary_footer", "hourlyperformance_footer", "performancecalendar_footer", "performancetrendanalysis_footer", "performancecomparison_date_format", "dailyretailtrendanalysis_date_format", "executivesummary_date_format", "hourlyperformance_date_format", "performancecalendar_date_format", "performancetrendanalysis_date_format", "performancecomparison_footer_date_format", "dailyretailtrendanalysis_footer_date_format", "executivesummary_footer_date_format", "hourlyperformance_footer_date_format", "performancecalendar_footer_date_format", "performancetrendanalysis_footer_date_format"],
      'fonts_used': ['font_reportheader_type', 'font_filters_type', 'font_summary_type', 'font_tblheaders_type', 'font_others_type'],
      'fonts_normal': ['fontnorm_reportheader', 'fontnorm_reportheader_size', 'fontnorm_reportheader_weight', 'fontnorm_reportheader_style', 'fontnorm_filters', 'fontnorm_filters_size', 'fontnorm_filters_weight', 'fontnorm_filters_style', 'fontnorm_summary', 'fontnorm_summary_size', 'fontnorm_summary_weight', 'fontnorm_summary_style', 'fontnorm_tblheaders', 'fontnorm_tblheaders_size', 'fontnorm_tblheaders_weight', 'fontnorm_tblheaders_style', 'fontnorm_others', 'fontnorm_others_size', 'fontnorm_others_weight', 'fontnorm_others_style'],
      'fonts_google': ['fontgoogle_reportheader', 'fontgoogle_reportheader_name', 'fontgoogle_reportheader_size', 'fontgoogle_reportheader_weight', 'fontgoogle_reportheader_style', 'fontgoogle_filters', 'fontgoogle_filters_name', 'fontgoogle_filters_size', 'fontgoogle_filters_weight', 'fontgoogle_filters_style', 'fontgoogle_summary', 'fontgoogle_summary_name', 'fontgoogle_summary_size', 'fontgoogle_summary_weight', 'fontgoogle_summary_style', 'fontgoogle_tblheaders', 'fontgoogle_tblheaders_name', 'fontgoogle_tblheaders_size', 'fontgoogle_tblheaders_weight', 'fontgoogle_tblheaders_style', 'fontgoogle_others', 'fontgoogle_others_name', 'fontgoogle_others_size', 'fontgoogle_others_weight', 'fontgoogle_others_style'],
      'emails': ['email_from', 'email_host', 'email_port', 'email_user', 'email_pass', 'email_tls', 'email_ssl']
    };
    window.setValues = function(groups, isdefault) {
      var datasource, fonttypedesc, fus, group, i, j, key, l, len, len1, len2, len3, len4, m, n, ref, ref1, tfont, value;
      datasource = allSettings;
      if (isdefault) {
        datasource = allSettingsDefaults;
        for (i = 0, len = groups.length; i < len; i++) {
          group = groups[i];
          ref = stgroups[group];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            key = ref[j];
            allSettings[key] = allSettingsDefaults[key];
          }
        }
      }
      if (indexOf.call(groups, 'kpis') >= 0) {
        $('input[data-for=kpi]').each(function() {
          var kname;
          kname = $(this).attr('id');
          $(this).val(datasource[kname]);
          return $(this).parent().colorpicker({
            customClass: 'colorpicker-2x',
            'component': 'input,.colorpicker-indicator',
            format: 'hex'
          }).colorpicker('setValue', datasource[kname]);
        });
        $('input[data-for=rkpiname]').each(function() {
          var kname;
          kname = $(this).attr('id');
          return $(this).val(datasource[kname]);
        });
        $('select[data-for=kpiformat]').each(function() {
          var kname;
          kname = $(this).attr('id');
          return $(this).val(datasource[kname]).trigger("change");
        });
      }
      if (indexOf.call(groups, 'labels') >= 0) {
        $('input[data-for=label]').each(function() {
          return $(this).val(datasource[$(this).attr('id')]);
        });
      }
      if (indexOf.call(groups, 'emails') >= 0) {
        $('input[data-for=email]').each(function() {
          return $(this).val(datasource[$(this).attr('id')]);
        });
        $('#email_tls').prop('checked', datasource["email_tls"].toLowerCase() === 'true').trigger('change');
        $('#email_ssl').prop('checked', datasource["email_ssl"].toLowerCase() === 'true').trigger('change');
      }
      if (indexOf.call(groups, 'reports') >= 0) {
        $('input[data-for=report]').each(function() {
          return $(this).val(datasource[$(this).attr('id')]);
        });
      }
      if (indexOf.call(groups, 'fonts_normal') >= 0) {
        for (l = 0, len2 = font_types_normal.length; l < len2; l++) {
          fonttypedesc = font_types_normal[l];
          tfont = fonttypedesc[0];
          fonts_process_disabled = true;
          $("#" + tfont).fontSelector('select', datasource["" + tfont]);
          $("#" + tfont + "_size").val(datasource[tfont + "_size"]).trigger('change');
          if ($("#" + tfont + "_weight").attr('type') === 'checkbox') {
            $("#" + tfont + "_weight").prop('checked', datasource[tfont + "_weight"] === 'bold').trigger('change');
          } else {
            $("#" + tfont + "_weight").val(datasource[tfont + "_weight"]).trigger('change');
          }
          $("#" + tfont + "_style").prop('checked', datasource[tfont + "_style"] === 'italic').trigger('change');
          fonts_process_disabled = false;
          changeFont(tfont);
        }
      }
      if (indexOf.call(groups, 'fonts_google') >= 0) {
        for (m = 0, len3 = font_types_google.length; m < len3; m++) {
          fonttypedesc = font_types_google[m];
          tfont = fonttypedesc[0];
          fonts_process_disabled = true;
          $("#" + tfont).googleFontSelector('select', datasource[tfont + "_name"]);
          $("#" + tfont + "_size").val(datasource[tfont + "_size"]).trigger('change');
          fonts_process_disabled = false;
          changeGoogleFont(tfont);
        }
      }
      if (indexOf.call(groups, 'fonts_used') >= 0) {
        ref1 = stgroups['fonts_used'];
        for (n = 0, len4 = ref1.length; n < len4; n++) {
          fus = ref1[n];
          value = datasource[fus];
          $("[name=" + fus + "][value=" + value + "]").prop('checked', 'checked').trigger('change');
        }
      }
      if (indexOf.call(groups, 'site') >= 0) {
        $('#sitename').val(datasource['sitename']);
        $('input[data-for=bg]').val(datasource['background']);
        $('input[data-for=bg]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['background']);
        $('body').css('background-color', datasource['background']);
        $('input[data-for=dbbg]').val(datasource['dbbackground']);
        $('input[data-for=dbbg]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['dbbackground']);
        $('input[data-for=navbarbg]').val(datasource['navbarbg']);
        $('input[data-for=navbarbg]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['navbarbg']);
        $('.sitenavbar').css('background-color', datasource['navbarbg']);
        $('input[data-for=navbarfg]').val(datasource['navbarfg']);
        $('input[data-for=navbarfg]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['navbarfg']);
        $('.navbar-nav > li > a, .navbar-header a').css('color', datasource['navbarfg']);
        $('input[data-for=navbarbgactive]').val(datasource['navbarbgactive']);
        $('input[data-for=navbarbgactive]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['navbarbgactive']);
        $('.navbar-nav > li.active > a').css('background-color', datasource['navbarbgactive']);
        $('input[data-for=navbarfgactive]').val(datasource['navbarfgactive']);
        $('input[data-for=navbarfgactive]').parent().colorpicker({
          customClass: 'colorpicker-2x',
          'component': 'input,.colorpicker-indicator',
          format: 'hex'
        }).colorpicker('setValue', datasource['navbarfgactive']);
        return $('.navbar-nav > li.active > a').css('color', datasource['navbarfgactive']);
      }
    };
    stkeys = (function() {
      var results;
      results = [];
      for (k in stgroups) {
        if (!hasProp.call(stgroups, k)) continue;
        results.push(k);
      }
      return results;
    })();
    selectTemplateResult = function(item) {
      if (!item.id) {
        return item.text;
      }
      if (!$(item.element).data('text')) {
        return item.text;
      }
      return $('<span>' + $(item.element).data('text') + '</span>');
    };
    $('.select2').select2({
      minimumResultsForSearch: Infinity,
      templateResult: selectTemplateResult,
      templateSelection: selectTemplateResult
    });
    $('.bswitch').bootstrapSwitch();
    window.changeFont = function(prefid) {
      var font, size, style, weight;
      if (fonts_process_disabled) {
        return false;
      }
      font = $("#" + prefid).css('font-family');
      size = $("#" + prefid + "_size").val();
      weight = 'normal';
      style = 'normal';
      if ($("#" + prefid + "_weight").attr('type') === 'checkbox') {
        if ($("#" + prefid + "_weight").prop('checked')) {
          weight = 'bold';
        }
      } else {
        weight = $("#" + prefid + "_weight").val();
      }
      if ($("#" + prefid + "_style").prop('checked')) {
        style = 'italic';
      }
      $("#" + prefid + "_example").css('font-family', font).css('font-weight', weight).css('font-style', style).css('font-size', size + "px");
      allSettings[prefid] = font;
      allSettings[prefid + "_size"] = size;
      allSettings[prefid + "_weight"] = weight;
      return allSettings[prefid + "_style"] = style;
    };
    window.changeGoogleFont = function(prefid) {
      var font, fontelements, fontfamily, size, style, weight;
      if (fonts_process_disabled) {
        return false;
      }
      font = $("#" + prefid).googleFontSelector('selected');
      fontelements = font.split('|');
      fontfamily = fontelements[1];
      weight = fontelements[2];
      style = fontelements[3];
      size = $("#" + prefid + "_size").val();
      $("#" + prefid + "_example").css('font-family', fontfamily).css('font-weight', weight).css('font-style', style).css('font-size', size + "px");
      allSettings[prefid] = fontfamily;
      allSettings[prefid + '_name'] = fontelements[0];
      allSettings[prefid + "_size"] = size;
      allSettings[prefid + "_weight"] = weight;
      return allSettings[prefid + "_style"] = style;
    };
    $('.fontSelectNormal').each(function() {
      var elemid, initial;
      elemid = $(this).attr('id');
      initial = allSettings[elemid];
      $(this).fontSelector({
        'hide_fallbacks': true,
        'initial': initial,
        'selected': function(style) {
          return changeFont(elemid);
        },
        'fonts': font_names_normal
      });
      return true;
    });
    $('.fontSelectGoogle').each(function() {
      var elemid, initial;
      elemid = $(this).attr('id');
      initial = allSettings[elemid + '_name'];
      $(this).googleFontSelector({
        'hide_fallbacks': true,
        'initial': initial,
        'selected': function(style) {
          return changeGoogleFont(elemid);
        },
        'fonts': font_names_google
      });
      return true;
    });
    setValues(stkeys, false);
    $('.fontnormal').on('change', 'select', function() {
      var itemid;
      itemid = $(this).data('for');
      changeFont(itemid);
      return true;
    });
    $('.fontgoogle').on('change', 'select', function() {
      var itemid;
      itemid = $(this).data('for');
      changeGoogleFont(itemid);
      return true;
    });
    $('.fontnormal .bswitch, .fontgoogle .bswitch').on('switchChange.bootstrapSwitch', function(event, state) {
      var itemid;
      itemid = $(this).data('for');
      changeFont(itemid);
      return true;
    });
    $('.fontchg .fonttypechange').on('switchChange.bootstrapSwitch', function(event, state) {
      var name;
      name = $(this).attr('name');
      return allSettings[name] = $("[name=" + name + "]:checked").val();
    });
    window.showLogoImg = function(img) {
      var MAX_HEIGHT, MAX_WIDTH, canvas, ctx, height, width;
      canvas = $('#logocanvas').get(0);
      MAX_WIDTH = $('#logocanvas').data('maxwidth');
      MAX_HEIGHT = $('#logocanvas').data('maxheight');
      width = img.width;
      height = img.height;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d");
      return ctx.drawImage(img, 0, 0, width, height);
    };
    $("#logo").change(function() {
      var reader, uplfile;
      uplfile = $(this).get(0).files[0];
      if (!uplfile.type.match(/image.*/)) {
        alert("This file is not an image!");
        return false;
      }
      reader = new FileReader();
      reader.onload = function(e) {
        var img;
        img = document.createElement("img");
        img.onload = function() {
          return showLogoImg(img);
        };
        img.src = e.target.result;
        if ($('#pagebrandimg').length > 0) {
          return $('#pagebrandimg').get(0).src = e.target.result;
        }
      };
      reader.readAsDataURL(uplfile);
      return true;
    });
    $('#btnLogo').click(function() {
      var canvas, dataURL;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      canvas = $('#logocanvas').get(0);
      dataURL = canvas.toDataURL();
      return saveSettings({
        'logo': dataURL
      }, "You have successfully saved your settings");
    });
    $('#btnResLogo').click(function() {
      var img;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      saveSettings({
        'logo': ''
      });
      img = document.createElement("img");
      img.src = $('#curlogo').data('defaultlogo');
      if ($('#pagebrandimg').length > 0) {
        $('#pagebrandimg').get(0).src = $('#curlogo').data('defaultlogo');
      }
      return showLogoImg(img, "You have successfully Reset your logo to the default logo");
    });
    showLogoImg($('#curlogo').get(0));
    $('#btnSiteSave').click(function() {
      var data, i, len, ref, stid;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['site'];
      for (i = 0, len = ref.length; i < len; i++) {
        stid = ref[i];
        data[stid] = $('#' + stid).val();
        allSettings[stid] = data[stid];
      }
      setValues(['site'], false);
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnSiteReset').click(function() {
      var data, i, len, ref, stid;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['site'], true);
      ref = stgroups['site'];
      for (i = 0, len = ref.length; i < len; i++) {
        stid = ref[i];
        data[stid] = allSettings[stid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('#btnLabelSave').click(function() {
      var data, i, labelid, len, ref;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['labels'];
      for (i = 0, len = ref.length; i < len; i++) {
        labelid = ref[i];
        data[labelid] = $('#' + labelid).val();
        allSettings[labelid] = data[labelid];
      }
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnLabelReset').click(function() {
      var data, i, labelid, len, ref;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['labels'], true);
      ref = stgroups['labels'];
      for (i = 0, len = ref.length; i < len; i++) {
        labelid = ref[i];
        data[labelid] = allSettings[labelid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('#btnKpiSave').click(function() {
      var data, i, kpiid, len, ref;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['kpis'];
      for (i = 0, len = ref.length; i < len; i++) {
        kpiid = ref[i];
        data[kpiid] = $('input[id="' + kpiid + '"],select[id="' + kpiid + '"]').val();
        allSettings[kpiid] = data[kpiid];
      }
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnKpiReset').click(function() {
      var data, i, labelid, len, ref;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['kpis'], true);
      ref = stgroups['kpis'];
      for (i = 0, len = ref.length; i < len; i++) {
        labelid = ref[i];
        data[labelid] = allSettings[labelid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('#btnReportSave').click(function() {
      var data, i, len, ref, reportid;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['reports'];
      for (i = 0, len = ref.length; i < len; i++) {
        reportid = ref[i];
        data[reportid] = $('#' + reportid).val();
        allSettings[reportid] = data[reportid];
      }
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnReportReset').click(function() {
      var data, i, len, ref, reportid;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['reports'], true);
      ref = stgroups['reports'];
      for (i = 0, len = ref.length; i < len; i++) {
        reportid = ref[i];
        data[reportid] = allSettings[reportid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('#btnEmailSave').click(function() {
      var data, i, len, ref, reportid;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['emails'];
      for (i = 0, len = ref.length; i < len; i++) {
        reportid = ref[i];
        data[reportid] = $('#' + reportid).val();
        allSettings[reportid] = data[reportid];
      }
      data["email_tls"] = allSettings["email_tls"] = $('#email_tls').prop('checked');
      data["email_ssl"] = allSettings["email_ssl"] = $('#email_ssl').prop('checked');
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnEmailReset').click(function() {
      var data, i, len, ref, reportid;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['emails'], true);
      ref = stgroups['emails'];
      for (i = 0, len = ref.length; i < len; i++) {
        reportid = ref[i];
        data[reportid] = allSettings[reportid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('#btnFontSave').click(function() {
      var data, fontid, i, j, l, len, len1, len2, ref, ref1, ref2;
      if (!confirm("Are you sure you want to save these settings?")) {
        return false;
      }
      data = {};
      ref = stgroups['fonts_normal'];
      for (i = 0, len = ref.length; i < len; i++) {
        fontid = ref[i];
        data[fontid] = allSettings[fontid];
      }
      ref1 = stgroups['fonts_google'];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        fontid = ref1[j];
        data[fontid] = allSettings[fontid];
      }
      ref2 = stgroups['fonts_used'];
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        fontid = ref2[l];
        data[fontid] = allSettings[fontid];
      }
      return saveSettings(data, "You have successfully saved your settings");
    });
    $('#btnFontReset').click(function() {
      var data, fontid, i, j, l, len, len1, len2, ref, ref1, ref2;
      if (!confirm("Are you sure you want to reset these settings?")) {
        return false;
      }
      data = {};
      setValues(['fonts_normal'], true);
      ref = stgroups['fonts_normal'];
      for (i = 0, len = ref.length; i < len; i++) {
        fontid = ref[i];
        data[fontid] = allSettings[fontid];
      }
      setValues(['fonts_google'], true);
      ref1 = stgroups['fonts_google'];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        fontid = ref1[j];
        data[fontid] = allSettings[fontid];
      }
      setValues(['fonts_used'], true);
      ref2 = stgroups['fonts_used'];
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        fontid = ref2[l];
        data[fontid] = allSettings[fontid];
      }
      return saveSettings(data, "You have successfully Reset your settings to the default settings");
    });
    $('.inprogress').addClass('hidden');
    $('.setmain').removeClass('hidden');
    return formatExamples();
  });

}).call(this);
