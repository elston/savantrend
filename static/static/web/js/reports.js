// Generated by CoffeeScript 1.10.0
(function() {
  'use strict';
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $(function() {
    var dateformat, enddate, initial, maxViewMode, minViewMode, opens, ref, report_name, seldate_default, startdate;
    initial = true;
    report_name = $('#reportdata').data('reportname');
    window.getDatePickerRanges = function() {
      var ranges;
      ranges = {};
      ranges['Today'] = [moment().format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')];
      ranges['Yesterday'] = [moment().add(-1, 'days').format('MM/DD/YYYY'), moment().add(-1, 'days').format('MM/DD/YYYY')];
      ranges['Last 7 Days'] = [moment().add(-6, 'days').format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')];
      ranges['Last 30 Days'] = [moment().add(-30, 'days').format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')];
      ranges['This Month'] = [moment().startOf('month').format('MM/DD/YYYY'), moment().endOf('month').format('MM/DD/YYYY')];
      ranges['Last Month'] = [moment().subtract(1, 'months').startOf('month').format('MM/DD/YYYY'), moment().subtract(1, 'months').endOf('month').format('MM/DD/YYYY')];
      return ranges;
    };
    window.chain2site = [];
    window.site2zone = [];
    if ($('#sitesdata').length > 0) {
      window.chain2site = JSON.parse($('#sitesdata').html());
    }
    if ($('#zonesdata').length > 0) {
      window.site2zone = JSON.parse($('#zonesdata').html());
    }
    if ($('#initial_elements').length > 0) {
      window.all_initials = JSON.parse($('#initial_elements').html() || '[]');
    }
    if (report_name === 'performancecomparison') {
      if ($('#comparison:checked').length > 0) {
        $('.zone-select-li').addClass('hidden');
      } else {
        $('.kpi-select').addClass('hidden');
      }
    }
    opens = 'right';
    if (report_name === 'executivesummary') {
      opens = 'left';
    }
    startdate = moment().add(-1, 'days').format('MM/DD/YYYY');
    enddate = moment().format('MM/DD/YYYY');
    if (all_initials['daterange']) {
      ref = all_initials['daterange'].split(' - '), startdate = ref[0], enddate = ref[1];
    }
    $('#category4').daterangepicker({
      showISOWeekNumbers: true,
      autoApply: true,
      ranges: getDatePickerRanges(),
      locale: {
        format: 'MM/DD/YYYY'
      },
      opens: opens,
      startDate: startdate,
      endDate: enddate
    });
    dateformat = 'mm/dd/yyyy';
    minViewMode = 'days';
    maxViewMode = 'years';
    if (report_name === 'performancecalendar') {
      dateformat = 'mm/yyyy';
      minViewMode = 'months';
    }
    $('#seldate').datepicker({
      showISOWeekNumbers: true,
      autoApply: true,
      autoclose: true,
      todayBtn: 'linked',
      container: '.seldatediv',
      todayHighlight: true,
      minViewMode: minViewMode,
      maxViewMode: maxViewMode,
      format: dateformat,
      opens: "right"
    });
    seldate_default = new Date();
    if (all_initials['date']) {
      seldate_default = all_initials['date'];
    }
    $('#seldate').datepicker('update', seldate_default);
    $("#category1,#category2,#category3,#catHours,#catKPI").multiselect({
      includeSelectAllOption: true
    });
    $('.toggle-chkbox').bootstrapSwitch();
    $('#category1').change(function() {
      var chainid, i, j, len, len1, options, optval, ref1, ref2, site;
      $('#category2').empty();
      $('#category3').empty();
      options = $(this).val() || [];
      for (i = 0, len = options.length; i < len; i++) {
        chainid = options[i];
        ref1 = chain2site[chainid];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          site = ref1[j];
          optval = {
            value: site[0],
            text: site[1]
          };
          if (initial && (ref2 = site[0].toString(), indexOf.call(all_initials['site'], ref2) >= 0)) {
            optval['selected'] = 'selected';
          }
          $('#category2').append($('<option>', optval));
        }
      }
      return $('#category2').multiselect('rebuild').change();
    });
    $('#category2').change(function() {
      var i, j, len, len1, options, optval, ref1, ref2, siteid, zone;
      $('#category3').empty();
      options = $(this).val() || [];
      for (i = 0, len = options.length; i < len; i++) {
        siteid = options[i];
        ref1 = site2zone[siteid];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          zone = ref1[j];
          optval = {
            value: zone[0],
            text: zone[1]
          };
          if (initial && (ref2 = zone[0].toString(), indexOf.call(all_initials['zone'], ref2) >= 0)) {
            optval['selected'] = 'selected';
          }
          $('#category3').append($('<option>', optval));
        }
      }
      return $('#category3').multiselect('rebuild');
    });
    $('#comparison').on('switchChange.bootstrapSwitch', function(event, state) {
      if (state) {
        $(".zone-select-li,.for-zone,.for-site,.for-zone,.site-table,.zone-table,.dHChart").addClass("hidden");
        $(".kpi-select").removeClass("hidden");
        return $('#category2').multiselect('clearSelection');
      } else {
        $(".zone-select-li").removeClass("hidden");
        $(".kpi-select,.for-site,.for-zone,.site-table,.zone-table,.dHChart").addClass("hidden");
        return $('#category3').multiselect('clearSelection');
      }
    });
    window.setKpiIndex = function() {
      $('div[data-ind]').each(function() {
        return $(this).prepend('<span class="badge kind">' + $(this).data('ind') + '</span>');
      });
      $('th[data-ind]').each(function() {
        return $(this).prepend('<span class="badge dkind">' + $(this).data('ind') + '</span>');
      });
      $('td[data-ind]').each(function() {
        return $(this).prepend('<span class="badge kind">' + $(this).data('ind') + '</span>');
      });
      return $('.abkpi').removeClass('hidden');
    };
    window.removeKpiIndex = function() {
      $('span.kind').remove();
      $('span.dkind').remove();
      return $('.abkpi').addClass('hidden');
    };
    $(document).on('change', '#shkpi', function() {
      var showKpi;
      showKpi = this.checked;
      if (showKpi) {
        setKpiIndex();
      } else {
        removeKpiIndex();
      }
      return true;
    });
    $(document).on('click', '.zoomin', function() {
      $('#menubar1').removeClass('in');
      $('#table1').addClass('fullscreen');
      $('.table-responsive').addClass('respFull');
      $('.zoomin').addClass('hidden');
      $('.zoomout').removeClass('hidden');
      $('.zoom').addClass('corner');
      return $('.zm').addClass('hidden');
    });
    $(document).on('click', '.zoomout', function() {
      $('#table1').removeClass('fullscreen');
      $('.table-responsive').removeClass('respFull');
      $('.zoomin').removeClass('hidden');
      $('.zoomout').addClass('hidden');
      $('.zoom').removeClass('corner');
      return $('.zm').removeClass('hidden');
    });
    $(document).on('click', ".fc-prev-button,.fc-next-button", function() {
      var newDate;
      newDate = $("#calendar").fullCalendar('getDate')._d;
      $('#seldate').datepicker('update', $("#calendar").fullCalendar('getDate')._d);
      return get_report();
    });
    window.showgraph = function(chartdata) {
      var graph1, reportname;
      $(".dHChart").removeClass("hidden");
      reportname = $('#reportdata').data('name');
      graph1 = $('#dvCghart').highcharts({
        chart: {
          type: 'spline'
        },
        credits: {
          enabled: false
        },
        title: {
          text: reportname
        },
        xAxis: {
          categories: chartdata['categories']
        },
        series: chartdata['series'],
        yAxis: {
          title: {
            text: ' '
          }
        }
      });
      return graph1;
    };
    window.draw_calgraph = function(elem, data) {
      var graph1;
      graph1 = $(elem).highcharts({
        chart: {
          type: 'spline'
        },
        credits: {
          enabled: false
        },
        title: {
          text: data['name']
        },
        xAxis: {
          categories: data['categories'],
          title: {
            text: data['xtext']
          }
        },
        series: data['series'],
        yAxis: {
          title: {
            text: ' '
          }
        }
      });
      return graph1;
    };
    window.get_params = function() {
      var filter_data;
      filter_data = {};
      $('.reportfilteritem').each(function() {
        var name, type, value;
        name = $(this).attr('name');
        type = $(this).attr('type');
        value = $(this).val();
        if (type === 'checkbox') {
          value = $(this).data("bootstrap-switch").state();
        }
        filter_data[name] = value;
        if ($('#shkpi').length > 0 && $('#shkpi').prop('checked')) {
          filter_data['showkpiid'] = 1;
        }
        return true;
      });
      return filter_data;
    };
    window.get_report_refreshed = function(manual) {
      var interval;
      if ($('#btnRealtime').length > 0) {
        interval = parseInt($('#btnRealtime').data('interval'));
        if (interval < 1) {
          return false;
        }
      }
      return get_report();
    };
    window.get_report = function(manual) {
      var filter_data, report_url;
      if (manual) {
        $('.inprogress').removeClass('hidden');
        $('#reportdata').addClass('hidden');
      }
      filter_data = get_params();
      report_url = $('#reportdata').data('url');
      if (!report_url) {
        return false;
      }
      $.ajax(report_url, {
        type: 'POST',
        dataType: 'html',
        data: $.param(filter_data),
        success: function(data, textStatus, jqXHR) {
          var chart1data, chart2data, chart3data, chartdata, interval;
          $('#reportdata').html(data);
          $('.inprogress').addClass('hidden');
          $('#reportdata').removeClass('hidden');
          if ($('#dvCghart').length > 0) {
            chartdata = JSON.parse($('#chartdata').html());
            showgraph(chartdata);
          }
          if (report_name === 'performancecalendar') {
            chart1data = JSON.parse($('#chart1data').html());
            chart2data = JSON.parse($('#chart2data').html());
            chart3data = JSON.parse($('#chart3data').html());
            draw_calgraph('#chart1', chart1data);
            draw_calgraph('#chart2', chart2data);
            draw_calgraph('#chart3', chart3data);
          }
          if ($('#btnRealtime').length > 0) {
            interval = parseInt($('#btnRealtime').data('interval'));
            if (interval > 1) {
              return setTimeout(get_report_refreshed, interval * 1000);
            }
          }
        },
        error: function() {
          var interval;
          if ($('#btnRealtime').length > 0) {
            interval = parseInt($('#btnRealtime').data('interval'));
            if (interval > 1) {
              return setTimeout(get_report_refreshed, interval * 5 * 1000);
            }
          }
        }
      });
      return false;
    };
    $('#btnshowData,#btnrefreshData').click(function() {
      return get_report(true);
    });
    $('#btnRealtime').click(function() {
      var interval;
      interval = parseInt($('#btnRealtime').data('interval'));
      if (interval > 1) {
        $('#btnRealtime').data('interval', 0);
        $('#btnRealtime').val('Current Realtime');
      } else {
        $('#mdlRefreshInterval').modal({
          backdrop: 'static',
          keyboard: false
        });
      }
      return true;
    });
    $(document).on('click', '#refreshsave', function() {
      var interval;
      $('#btnRealtime').data('interval', $('#rInterval').val());
      interval = parseInt($('#btnRealtime').data('interval'));
      if (interval > 1) {
        setTimeout(get_report_refreshed, interval * 1000);
        $('#btnRealtime').val('Stop Realtime');
      }
      return true;
    });
    window.openExport = function(url, format) {
      var newWin;
      newWin = window.location = url;
      return newWin;
    };
    window.exportReport = function(format) {
      var chartdata, chartsend_data, newWin, newurl, params, raw_params, report_url;
      report_url = $('#reportdata').data('url');
      raw_params = get_params();
      raw_params['current_time'] = moment().format('MM-DD-YYYY-HH-mm');
      params = $.param(raw_params);
      newurl = report_url + "?data_format=" + format + "&" + params;
      if (newurl[0] === '/') {
        newurl = window.location.protocol + '//' + window.location.host + newurl;
      }
      if (format === 'jspdf') {
        makePDF();
      } else if (format === 'pdf' || format === 'print' || format === 'pushcharts') {
        chartdata = [];
        $('.reportchart').each(function() {
          chartdata.push($(this).highcharts().getSVG());
          return true;
        });
        if (chartdata.length > 0) {
          chartsend_data = raw_params;
          chartsend_data['savechart'] = true;
          chartsend_data['chartdata'] = chartdata;
          chartsend_data['reporturl'] = newurl;
          $.ajax(report_url, {
            type: 'POST',
            dataType: 'html',
            data: $.param(chartsend_data),
            success: function(data, textStatus, jqXHR) {
              var newWin;
              if (format !== 'pushcharts') {
                return newWin = openExport(newurl, format);
              }
            }
          });
        } else {
          if (format !== 'pushcharts') {
            newWin = openExport(newurl, format);
          }
        }
      } else {
        newWin = openExport(newurl, format);
        if (format === 'print') {
          newWin.print();
        }
      }
      return newurl;
    };
    $("#category1,#category2,#category3,#catHours,#catKPI").each(function() {
      $(this).trigger('change');
      return true;
    });
    if (report_name !== 'performancecomparison') {
      get_report(true);
    } else {
      if ($('#initial_elements').data('open')) {
        get_report(true);
      }
    }
    $('#btnEmailReport').click(function() {
      var modal;
      modal = $('#mdlEmailReport').modal('show');
      $('.schedule-setup:not(.hidden)', modal).addClass('hidden');
      $('.email-setup', modal).removeClass('hidden');
      schedulerTabSwitch('emailinfo', modal);
      return true;
    });
    $(document).on('click', 'button.emailreportsend', function() {
      var modal, newurl, params, report_url;
      modal = $(this).closest('.modal');
      report_url = $('#reportdata').data('url');
      params = get_params();
      newurl = exportReport('pushcharts');
      params['emailreport'] = 'manual';
      params['reporturl'] = newurl;
      params['emailto'] = $('#emailto').val();
      params['emailcc'] = $('#emailcc').val();
      params['emailbcc'] = $('#emailbcc').val();
      params['emailsubject'] = $('#emailsubject').val();
      params['emailbody'] = $('#emailbody').val();
      params['emaildateformat'] = $('#emaildateformat').val();      
      params['formats'] = [];
      $('.emailexport_type:checked', modal).each(function() {
        params['formats'].push($(this).data('format'));
        return true;
      });
      $('<div />').delay(3000).queue(function(next) {
        $.ajax(report_url, {
          type: 'POST',
          dataType: 'html',
          data: $.param(params),
          success: function(data, textStatus, jqXHR) {
            var close, message;
            if (data !== 'OK') {
              alert(data);
            } else {
              $(modal).modal('hide');
              message = $('<div class="alert alert-success success-message" style="display: none;">');
              close = $('<button type="button" class="close" data-dismiss="alert">&times</button>');
              message.append(close);
              message.append("This report has been just sent by email");
              message.appendTo($('body')).fadeIn(300).delay(3000).fadeOut(500);
            }
            return true;
          }
        });
        return next();
      });
      return true;
    });
    $('.reportfilter').fadeIn(500).removeClass('hidden');
    $('[data-toggle="click"]').popover();
    window.delayinitial = function() {
      initial = false;
      return true;
    };
    setTimeout(delayinitial, 2000);
    true;
    return $(function() {
      return formatExamples();
    });
  });

}).call(this);
