'use strict'
$ ->
    if $('.scheduler_main').length > 0
        # Scheduler page
        $('.row.inprogress').addClass('hidden')
        $('.scheduler_main').removeClass('hidden')

        $(document).on 'click', '.open-report', () ->
            urlparams = $(this).data('urlparams')
            urlparams['open_report'] = true
            # urlparams = JSON.parse(urlparams)
            report_url = urlparams['reporturl']
            delete urlparams['reporturl']
            getparams = $.param urlparams
            report_url = "#{report_url}?#{getparams}"
            window.location = report_url
            true

        $(document).on 'click', '.schedit', () ->
            # modal = $('#mdlEmailReport').modal('show')
            # scheduleid = $(this).closest('tr').data('id')
            detailsurl = $(this).closest('tr').data('detailsurl')
            $.ajax detailsurl,
                type: 'GET'
                dataType: 'html'
                data: {}
                success: (data, textStatus, jqXHR) ->
                    if data != 'OK'
                        modal = $(data).modal('show')
                        ScheduleReportOpen(modal)
            # $('.emailreportscheduledelete').removeClass('hidden')
            # # set initial data
            # $('#scheduleinfo_data').data('scheduleid', scheduleid)
            true

        $(document).on 'click', '.emailreportscheduledelete', () ->
            if not confirm('Are you sure you want to delete this item?')
                return false
            modal = $(this).closest('.modal')
            scheduleid = $('#scheduleinfo_data', modal).data('scheduleid')
            post_url = $('#scheduleinfo_data', modal).data('taskposturl') or ''
            # post_url = post_url.replace('000000', scheduleid)
            params = {'delete_schreport': true}
            $.ajax post_url,
                type: 'POST'
                dataType: 'html'
                data: $.param(params)
                success: (data, textStatus, jqXHR) ->
                    if data != 'OK'
                        alert(data)
                    else
                        $(modal).modal('hide')
                        message = $('<div class="alert alert-success success-message" style="display: none;"></div>')
                        close = $('<button type="button" class="close" data-dismiss="alert">&times</button>')
                        message.append(close)
                        message.append("This report has been deleted")
                        message.appendTo($('body>div.container')).fadeIn(300).delay(3000).fadeOut(500)
                        if navigate?
                            navigate($('.paginated_content'))
                    true
            true

        window.get_params = () ->
            # for edit only
            filter_data = {}
            return filter_data

    $('#delallreports').click ->
        if confirm('Are you sure you want to delete all reports?')
            deleteurl = $(this).data('deleteurl')
            $.ajax deleteurl,
                type: 'POST'
                dataType: 'html'
                data: $.param({delete_all_reports: true})
                success: (data, textStatus, jqXHR) ->
                    if data != 'OK'
                        alert(data)
                    else
                        window.location = window.location
            return true
        return false


    if $('.reportfilter,.scheduler_main').length > 0
        # Reports/Scheduler page

        window.schedulerTabSwitch = (target, modal) ->
            $('.nav.schedule-setup li', modal).removeClass('active')
            $('.nav.schedule-setup a', modal).each ->
                etarg = $(this).data('target')
                $(".#{etarg}", modal).hide()
                true
            $(".#{target}", modal).show()
            $('.nav.schedule-setup a[data-target="' + target + '"]', modal).parent().addClass('active')
            true

        window.ScheduleReportOpen = (modal) ->
            # modal = $('#mdlEmailReport').modal('show')
            $('.schedule-setup', modal).removeClass('hidden')
            $('.email-setup:not(.hidden)', modal).addClass('hidden')
            schedulerTabSwitch('emailinfo', modal)
            # initialize datepicker
            $('#firstday', modal).datepicker
                showISOWeekNumbers: true,
                autoApply: true,
                autoclose: true,
                todayBtn: 'linked',
                # container: '.seldatediv',
                todayHighlight: true,
                minViewMode: 'days',
                maxViewMode: 'years',
                format: 'mm/dd/yyyy',
                opens: "right"
            # seldate_default = new Date()
            # $('#firstday', modal).datepicker 'update', seldate_default
            $('#deliveryhour', modal).select2 {minimumResultsForSearch: Infinity}
            $('#deliveryhourmin', modal).select2 {minimumResultsForSearch: Infinity}
            true
        
        $('#btnScheduleReport').click ->
            # setup regular report generation
            modal = $('#mdlEmailReport').modal('show')
            ScheduleReportOpen(modal)
            true

        $(document).on 'change', '.modal .sch-period input:radio', () ->
            modal = $(this).closest('.modal')
            period = $(this).data('period')
            $('.sch-period-details:not(.hidden)').addClass('hidden')
            $('.sch-period-' + period).removeClass('hidden')

        $(document).on 'click', 'button.emailreportschedule', () ->
            # POST schedule settings
            modal = $(this).closest('.modal')
            scheduleid = $('#scheduleinfo_data', modal).data('scheduleid')
            post_url = $('#scheduleinfo_data', modal).data('taskposturl') or ''
            # post_url = post_url.replace('000000', scheduleid)
            params = get_params()
            params['schedule_id'] = scheduleid
            params['report_id'] = $('#scheduleinfo_data', modal).data('reportid')
            params['emailto'] = $('#emailto', modal).val()
            params['emailcc'] = $('#emailcc', modal).val()
            params['emailbcc'] = $('#emailbcc', modal).val()
            params['emailsubject'] = $('#emailsubject', modal).val()
            params['emailbody'] = $('#emailbody', modal).val()
            params['formats'] = []
            $('.emailexport_type:checked', modal).each ->
                params['formats'].push $(this).data('format')
                true
            params['dayoffset'] = $('#dayoffset', modal).val()
            params['firstday'] = $('#firstday', modal).val()
            params['deliveryhour'] = $('#deliveryhour', modal).val()
            params['deliveryhourmin'] = $('#deliveryhourmin', modal).val()
            params['schperiod'] = $('.sch-period input:radio:checked', modal).data('period')
            params['schperioddaily'] = []
            $('.schperioddaily:checked', modal).each ->
                params['schperioddaily'].push $(this).data('day')
                true
            $.ajax post_url,
                type: 'POST'
                dataType: 'html'
                data: $.param(params)
                success: (data, textStatus, jqXHR) ->
                    if data != 'OK'
                        alert(data)
                    else
                        $(modal).modal('hide')
                        message = $('<div class="alert alert-success success-message" style="display: none;"></div>')
                        close = $('<button type="button" class="close" data-dismiss="alert">&times</button>')
                        message.append(close)
                        message.append("This report has been scheduled")
                        message.appendTo($('body')).fadeIn(300).delay(3000).fadeOut(500)
                        if navigate?
                            navigate($('.paginated_content'))
                    true
            true

        $(document).on 'click', '.nav.schedule-setup a', () ->
            target = $(this).data('target')
            modal = $(this).closest('.modal')
            schedulerTabSwitch(target, modal)
            false

    true
