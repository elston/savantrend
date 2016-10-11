'use strict'
$ ->
    initial = true
    report_name = $('#reportdata').data('reportname')

    window.getDatePickerRanges = () ->
        ranges = {}
        ranges['Today'] = [moment().format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')]
        ranges['Yesterday'] = [moment().add(-1, 'days').format('MM/DD/YYYY'), moment().add(-1, 'days').format('MM/DD/YYYY')]
        ranges['Last 7 Days'] = [moment().add(-6, 'days').format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')]
        ranges['Last 30 Days'] = [moment().add(-30, 'days').format('MM/DD/YYYY'), moment().format('MM/DD/YYYY')]
        ranges['This Month'] = [moment().startOf('month').format('MM/DD/YYYY'), moment().endOf('month').format('MM/DD/YYYY')]
        ranges['Last Month'] = [moment().subtract(1, 'months').startOf('month').format('MM/DD/YYYY'), moment().subtract(1, 'months').endOf('month').format('MM/DD/YYYY')]
        return ranges

    window.chain2site = []
    window.site2zone = []
    if $('#sitesdata').length > 0
        window.chain2site = JSON.parse($('#sitesdata').html())
    if $('#zonesdata').length > 0
        window.site2zone = JSON.parse($('#zonesdata').html())
    if $('#initial_elements').length > 0
        window.all_initials = JSON.parse($('#initial_elements').html() or '[]')

    if report_name == 'performancecomparison'
        if $('#comparison:checked').length > 0
            $('.zone-select-li').addClass('hidden')
        else
            $('.kpi-select').addClass('hidden')

    # initialize daterangepicker
    opens = 'right'
    if report_name == 'executivesummary'
        opens = 'left'
    startdate = moment().add(-1, 'days').format('MM/DD/YYYY')
    enddate = moment().format('MM/DD/YYYY')
    if all_initials['daterange']
        [startdate, enddate] = all_initials['daterange'].split(' - ')
    $('#category4').daterangepicker
        showISOWeekNumbers: true,
        autoApply: true,
        ranges: getDatePickerRanges(),
        # parentEl: $('#category4').parent(),
        locale:
            format: 'MM/DD/YYYY',
        opens: opens,
        startDate: startdate,
        endDate: enddate

    dateformat = 'mm/dd/yyyy'
    minViewMode = 'days'
    maxViewMode = 'years'
    if report_name == 'performancecalendar'
        dateformat = 'mm/yyyy'
        minViewMode = 'months'

    # initialize datepicker
    $('#seldate').datepicker
        showISOWeekNumbers: true,
        autoApply: true,
        autoclose: true,
        todayBtn: 'linked',
        container: '.seldatediv',
        todayHighlight: true,
        minViewMode: minViewMode,
        maxViewMode:maxViewMode,
        format: dateformat,
        opens: "right"
    seldate_default = new Date()
    if all_initials['date']
        seldate_default = all_initials['date']
    $('#seldate').datepicker 'update', seldate_default

    # apply styles to complex controls
    $("#category1,#category2,#category3,#catHours,#catKPI").multiselect({ includeSelectAllOption: true })
    $('.toggle-chkbox').bootstrapSwitch()

    $('#category1').change ->
        # change chain -> fill sites
        $('#category2').empty()
        $('#category3').empty()
        options = $(this).val() or []
        for chainid in options
            for site in chain2site[chainid]
                optval = {value: site[0], text: site[1]}
                if initial and site[0].toString() in all_initials['site']
                    optval['selected'] = 'selected'
                $('#category2').append($('<option>', optval))
        $('#category2').multiselect('rebuild').change()

    $('#category2').change ->
        # change site -> fill zones
        $('#category3').empty()
        options = $(this).val() or []
        for siteid in options
            for zone in site2zone[siteid]
                optval = {value: zone[0], text: zone[1]}
                if initial and zone[0].toString() in all_initials['zone']
                    optval['selected'] = 'selected'
                $('#category3').append($('<option>', optval))
        $('#category3').multiselect('rebuild')

    $('#comparison').on 'switchChange.bootstrapSwitch', (event, state) ->
        if state
            # site
            $(".zone-select-li,.for-zone,.for-site,.for-zone,.site-table,.zone-table,.dHChart").addClass("hidden")
            $(".kpi-select").removeClass("hidden")
            $('#category2').multiselect('clearSelection')
        else
            # zone
            $(".zone-select-li").removeClass("hidden")
            $(".kpi-select,.for-site,.for-zone,.site-table,.zone-table,.dHChart").addClass("hidden")
            $('#category3').multiselect('clearSelection')

    window.setKpiIndex = () ->
        $('div[data-ind]').each ->
            $(this).prepend('<span class="badge kind">' + $(this).data('ind') + '</span>')
        $('th[data-ind]').each ->
            $(this).prepend('<span class="badge dkind">' + $(this).data('ind') + '</span>')
        $('td[data-ind]').each ->
            $(this).prepend('<span class="badge kind">' + $(this).data('ind') + '</span>')
        $('.abkpi').removeClass('hidden')

    window.removeKpiIndex = () ->
        $('span.kind').remove()
        $('span.dkind').remove()
        $('.abkpi').addClass('hidden')

    $(document).on 'change', '#shkpi', () ->
        showKpi = this.checked
        if showKpi
            setKpiIndex()
        else
            removeKpiIndex()
        true

    $(document).on 'click', '.zoomin', () ->
        $('#menubar1').removeClass('in')
        $('#table1').addClass('fullscreen')
        $('.table-responsive').addClass('respFull')
        $('.zoomin').addClass('hidden')
        $('.zoomout').removeClass('hidden')
        $('.zoom').addClass('corner')
        $('.zm').addClass('hidden')

    $(document).on 'click', '.zoomout', () ->
        $('#table1').removeClass('fullscreen')
        $('.table-responsive').removeClass('respFull')
        $('.zoomin').removeClass('hidden')
        $('.zoomout').addClass('hidden')
        $('.zoom').removeClass('corner')
        $('.zm').removeClass('hidden')

    $(document).on 'click', ".fc-prev-button,.fc-next-button", () ->
        # clicking next-prev on calendar causes reload of whole report
        newDate = $("#calendar").fullCalendar('getDate')._d
        $('#seldate').datepicker('update', $("#calendar").fullCalendar('getDate')._d)
        get_report()

    window.showgraph = (chartdata) ->
        $(".dHChart").removeClass("hidden")
        reportname = $('#reportdata').data('name')
        graph1 = $('#dvCghart').highcharts
            chart:
                type: 'spline'
                # width: '100%'
            credits:
                enabled: false
            title:
                text: reportname
            xAxis:
                categories: chartdata['categories']
            series: chartdata['series']
            yAxis:
                title:
                    text: ' '
        return graph1

    window.draw_calgraph = (elem, data) ->
        graph1 = $(elem).highcharts
            chart:
                type: 'spline'
            credits:
                enabled: false
            title:
                text: data['name']
            xAxis:
                categories: data['categories']
                title:
                    text: data['xtext']
            series: data['series']
            yAxis:
                title:
                    text: ' '
        return graph1

    # --------------------------------------------------------------------------
    # Send data and display results
    window.get_params = () ->
        filter_data = {}
        $('.reportfilteritem').each ->
            name = $(this).attr('name')
            type = $(this).attr('type')
            value = $(this).val()
            if type == 'checkbox'
                value = $(this).data("bootstrap-switch").state()
            filter_data[name] = value
            if $('#shkpi').length > 0 and $('#shkpi').prop('checked')
                filter_data['showkpiid'] = 1
            return true
        return filter_data

    window.get_report_refreshed = (manual) ->
        if $('#btnRealtime').length > 0
            interval = parseInt($('#btnRealtime').data('interval'))
            if interval < 1
                return false
        get_report()

    window.get_report = (manual) ->
        # manual = true  # comment this out if you want to have auto-update silent
        if manual
            $('.inprogress').removeClass('hidden')
            $('#reportdata').addClass('hidden')
        filter_data = get_params()
        report_url = $('#reportdata').data('url')
        if !report_url
            return false
        # send query
        $.ajax report_url,
            type: 'POST'
            dataType: 'html'
            data: $.param(filter_data)
            success: (data, textStatus, jqXHR) ->
                $('#reportdata').html(data)

                $('.inprogress').addClass('hidden')
                $('#reportdata').removeClass('hidden')
                if $('#dvCghart').length > 0
                    chartdata = JSON.parse($('#chartdata').html())
                    showgraph(chartdata)

                if report_name == 'performancecalendar'
                    chart1data = JSON.parse($('#chart1data').html())
                    chart2data = JSON.parse($('#chart2data').html())
                    chart3data = JSON.parse($('#chart3data').html())
                    draw_calgraph('#chart1', chart1data)
                    draw_calgraph('#chart2', chart2data)
                    draw_calgraph('#chart3', chart3data)

                # autorefresh
                if $('#btnRealtime').length > 0
                    interval = parseInt($('#btnRealtime').data('interval'))
                    if interval > 1
                        setTimeout get_report_refreshed, interval * 1000
            error: () ->
                # autorefresh (but 5 times longer)
                if $('#btnRealtime').length > 0
                    interval = parseInt($('#btnRealtime').data('interval'))
                    if interval > 1
                        setTimeout get_report_refreshed, interval * 5 * 1000

        return false

    $('#btnshowData,#btnrefreshData').click ->
        get_report(true)

    # process modal - refresh results
    $('#btnRealtime').click ->
        interval = parseInt($('#btnRealtime').data('interval'))
        if interval > 1
            # stop
            $('#btnRealtime').data('interval', 0)
            $('#btnRealtime').val('Current Realtime')
        else
            $('#mdlRefreshInterval').modal({ backdrop: 'static', keyboard: false })
        true

    $(document).on 'click', '#refreshsave', () ->
        $('#btnRealtime').data('interval', $('#rInterval').val())
        interval = parseInt($('#btnRealtime').data('interval'))
        if interval > 1
            setTimeout get_report_refreshed, interval * 1000
            $('#btnRealtime').val('Stop Realtime')
        true

    # end modal refresher

    window.openExport = (url, format) ->
        # newWin = window.open(url, format)
        newWin = window.location = url
        return newWin

    window.exportReport = (format) ->
        report_url = $('#reportdata').data('url')
        raw_params = get_params()
        raw_params['current_time'] = moment().format('MM-DD-YYYY-HH-mm')
        params = $.param(raw_params)
        newurl = "#{report_url}?data_format=#{format}&#{params}"
        if newurl[0] == '/'
            newurl = window.location.protocol + '//' + window.location.host + newurl
        # console.log(newurl)
        if format == 'jspdf'
            # not used for now, but left for the future maybe
            makePDF()
        else if format in ['pdf', 'print', 'pushcharts']
            chartdata = []
            # See comments in backend code
            $('.reportchart').each ->
                chartdata.push($(this).highcharts().getSVG())
                true
            if chartdata.length > 0
                chartsend_data = raw_params
                chartsend_data['savechart'] = true
                chartsend_data['chartdata'] = chartdata
                chartsend_data['reporturl'] = newurl  # will be used as id for saving charts
                $.ajax report_url,
                    type: 'POST'
                    dataType: 'html'
                    data: $.param(chartsend_data)
                    success: (data, textStatus, jqXHR) ->
                        if format != 'pushcharts'
                            newWin = openExport(newurl, format)
            else
                if format != 'pushcharts'
                    newWin = openExport(newurl, format)
        else
            newWin = openExport(newurl, format)
            if format == 'print'
                newWin.print()
                # newWin.close()
        return newurl

    $("#category1,#category2,#category3,#catHours,#catKPI").each ->
        $(this).trigger('change')
        true

    if report_name != 'performancecomparison'
        get_report(true)
    else
        if $('#initial_elements').data('open')
            get_report(true)

    # ------ EMAIL functionality

    $('#btnEmailReport').click ->
        # send reports by email - open dialog
        modal = $('#mdlEmailReport').modal('show')
        $('.schedule-setup:not(.hidden)', modal).addClass('hidden')
        $('.email-setup', modal).removeClass('hidden')
        schedulerTabSwitch('emailinfo', modal)
        true

    $(document).on 'click', 'button.emailreportsend', () ->
        # SEND report by email
        modal = $(this).closest('.modal')
        report_url = $('#reportdata').data('url')
        params = get_params()
        newurl = exportReport('pushcharts')
        params['emailreport'] = 'manual'
        params['reporturl'] = newurl
        params['emailto'] = $('#emailto').val()
        params['emailcc'] = $('#emailcc').val()
        params['emailbcc'] = $('#emailbcc').val()
        params['emailsubject'] = $('#emailsubject').val()
        params['emailbody'] = $('#emailbody').val()
        params['formats'] = []
        $('.emailexport_type:checked', modal).each ->
            params['formats'].push $(this).data('format')
            true
        $('<div />').delay(3000).queue (next) ->
            $.ajax report_url,
                type: 'POST'
                dataType: 'html'
                data: $.param(params)
                success: (data, textStatus, jqXHR) ->
                    if data != 'OK'
                        alert(data)
                    else
                        $(modal).modal('hide')
                        message = $('<div class="alert alert-success success-message" style="display: none;">')
                        close = $('<button type="button" class="close" data-dismiss="alert">&times</button>')
                        message.append(close)
                        message.append("This report has been just sent by email")
                        message.appendTo($('body')).fadeIn(300).delay(3000).fadeOut(500)
                    true
            next()
        true

    # ------ END OF EMAIL functionality

    # -----------------------------------
    # see scheduler.coffee for schedule functionality
    # -----------------------------------

    # show filter
    $('.reportfilter').fadeIn(500).removeClass('hidden')

    $('[data-toggle="click"]').popover()

    window.delayinitial = () ->
        initial = false
        true
    setTimeout delayinitial, 2000
    true

    $ ->
        formatExamples()
