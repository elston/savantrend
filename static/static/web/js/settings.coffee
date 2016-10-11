'use strict'
$ ->

    allSettings = JSON.parse($('#settingsdata').html())
    allSettingsDefaults = allSettings
    if $('#settingsdefaults').length > 0
        allSettingsDefaults = JSON.parse($('#settingsdefaults').html())
    font_names_normal = JSON.parse($('#font_names_normal').html())
    font_types_normal = JSON.parse($('#font_types_normal').html())
    font_names_google = JSON.parse($('#font_names_google').html())
    font_types_google = JSON.parse($('#font_types_google').html())
    fonts_process_disabled = true

    # save settings to the server
    window.saveSettings = (value, resultmsg) ->
        saveurl = $('#settingsdata').data('saveurl')
        userid = $('#settingsdata').data('userid')
        if (saveurl)
            postdata = {'data': JSON.stringify(value), 'userid': userid}
            $.ajax saveurl,
                type: 'POST',
                dataType: 'html',
                data: postdata
                success: (data, textStatus, jqXHR) ->
                    message = $('<div class="alert alert-success success-message" style="display: none;"></div>')
                    close = $('<button type="button" class="close" data-dismiss="alert">&times</button>')
                    message.append(close)
                    message.append(resultmsg)
                    message.appendTo($('body')).fadeIn(300).delay(3000).fadeOut(500)


    window.stgroups = {
        'site': ['sitename', 'background', 'dbbackground', 'navbarbg', 'navbarbgactive', 'navbarfg', 'navbarfgactive'],
        'labels': ['label1', 'label2', 'label3', 'label4', 'label5', 'label6'],
        'kpis': [
            'FOOTFALL', 'SALES', 'TRANS', 'UNITS',
            'STAFF', '%CONV', 'ATV', 'UPT',
            'ACV', 'CTSR', 'UPC', 'SPS',
            #
            'kpinameFOOTFALL', 'kpinameSALES', 'kpinameTRANS', 'kpinameUNITS',
            'kpinameSTAFF', 'kpinameCONV', 'kpinameATV', 'kpinameUPT',
            'kpinameACV', 'kpinameCTSR', 'kpinameUPC', 'kpinameSPS',
            #
            'kpiformatFOOTFALL', 'kpiformatSALES', 'kpiformatTRANS', 'kpiformatUNITS',
            'kpiformatSTAFF', 'kpiformatCONV', 'kpiformatATV', 'kpiformatUPT',
            'kpiformatACV', 'kpiformatCTSR', 'kpiformatUPC', 'kpiformatSPS',
        ],
        'reports': [
            'performancecomparison', 'dailyretailtrendanalysis',
            'executivesummary', 'hourlyperformance',
            'performancecalendar', 'performancetrendanalysis',
            #
            'performancecomparison_header', 'dailyretailtrendanalysis_header',
            'executivesummary_header', 'hourlyperformance_header',
            'performancecalendar_header', 'performancetrendanalysis_header',
            'performancecomparison_footer', 'dailyretailtrendanalysis_footer',
            'executivesummary_footer', 'hourlyperformance_footer',
            'performancecalendar_footer', 'performancetrendanalysis_footer',
            # Date format field
            'performancecomparison_date_format',
            'dailyretailtrendanalysis_date_format',
            'executivesummary_date_format',
            'hourlyperformance_date_format',
            'performancecalendar_date_format',
            'performancetrendanalysis_date_format',
        ],
        'fonts_used': ['font_reportheader_type', 'font_filters_type',
                       'font_summary_type', 'font_tblheaders_type',
                       'font_others_type',
        ],
        'fonts_normal': [
            'fontnorm_reportheader', 'fontnorm_reportheader_size',
            'fontnorm_reportheader_weight', 'fontnorm_reportheader_style',
            #
            'fontnorm_filters', 'fontnorm_filters_size',
            'fontnorm_filters_weight', 'fontnorm_filters_style',
            #
            'fontnorm_summary', 'fontnorm_summary_size',
            'fontnorm_summary_weight', 'fontnorm_summary_style',
            #
            'fontnorm_tblheaders', 'fontnorm_tblheaders_size',
            'fontnorm_tblheaders_weight', 'fontnorm_tblheaders_style',
            #
            'fontnorm_others', 'fontnorm_others_size',
            'fontnorm_others_weight', 'fontnorm_others_style',
        ],
        'fonts_google': [
            'fontgoogle_reportheader', 'fontgoogle_reportheader_name', 'fontgoogle_reportheader_size',
            'fontgoogle_reportheader_weight', 'fontgoogle_reportheader_style',
            #
            'fontgoogle_filters', 'fontgoogle_filters_name', 'fontgoogle_filters_size',
            'fontgoogle_filters_weight', 'fontgoogle_filters_style',
            #
            'fontgoogle_summary', 'fontgoogle_summary_name', 'fontgoogle_summary_size',
            'fontgoogle_summary_weight', 'fontgoogle_summary_style',
            #
            'fontgoogle_tblheaders', 'fontgoogle_tblheaders_name', 'fontgoogle_tblheaders_size',
            'fontgoogle_tblheaders_weight', 'fontgoogle_tblheaders_style',
            #
            'fontgoogle_others', 'fontgoogle_others_name', 'fontgoogle_others_size',
            'fontgoogle_others_weight', 'fontgoogle_others_style',
        ],
        'emails': [
            'email_from', 'email_host', 'email_port', 'email_user', 'email_pass', 'email_tls', 'email_ssl',
        ]
    }

    window.setValues = (groups, isdefault) ->
        datasource = allSettings
        if isdefault  # reset
            datasource = allSettingsDefaults
            for group in groups
                # console.log("Reset for #{group}")
                for key in stgroups[group]
                    # console.log("    Reset #{key}")
                    allSettings[key] = allSettingsDefaults[key]

        if 'kpis' in groups
            # set KPI colors
            $('input[data-for=kpi]').each ->
                kname = $(this).attr('id')  # get KPI id
                $(this).val(datasource[kname])  # set widget value from settings
                $(this).parent()
                    .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                    .colorpicker('setValue', datasource[kname])

            # set KPI names
            $('input[data-for=rkpiname]').each ->
                kname = $(this).attr('id')  # get KPI id
                $(this).val(datasource[kname])  # set widget value from settings

            # set KPI formats
            $('select[data-for=kpiformat]').each ->
                kname = $(this).attr('id')  # get KPI id
                $(this).val(datasource[kname]).trigger("change")  # set widget value from settings

        if 'labels' in groups
            # set Labels
            $('input[data-for=label]').each ->
                $(this).val(datasource[$(this).attr('id')])

        if 'emails' in groups
            # set email settings
            $('input[data-for=email]').each ->
                $(this).val(datasource[$(this).attr('id')])

            $('#email_tls').prop('checked', datasource["email_tls"].toLowerCase() == 'true').trigger('change')
            $('#email_ssl').prop('checked', datasource["email_ssl"].toLowerCase() == 'true').trigger('change')

        if 'reports' in groups
            # Set Report names
            $('input[data-for=report]').each ->
                $(this).val(datasource[$(this).attr('id')])

        # Set fonts
        if 'fonts_normal' in groups
            for fonttypedesc in font_types_normal
                tfont = fonttypedesc[0]
                fonts_process_disabled = true  # to prevent processing while we set items
                # console.log("Set font #{tfont}", datasource["#{tfont}"], datasource["#{tfont}_size"])
                $("##{tfont}").fontSelector('select', datasource["#{tfont}"])
                $("##{tfont}_size").val(datasource["#{tfont}_size"]).trigger('change')
                if $("##{tfont}_weight").attr('type') == 'checkbox'
                    $("##{tfont}_weight").prop('checked', datasource["#{tfont}_weight"] == 'bold').trigger('change')
                else
                    $("##{tfont}_weight").val(datasource["#{tfont}_weight"]).trigger('change')
                $("##{tfont}_style").prop('checked', datasource["#{tfont}_style"] == 'italic').trigger('change')
                fonts_process_disabled = false  # enable processing
                changeFont(tfont)  # toggle processing

        if 'fonts_google' in groups
            for fonttypedesc in font_types_google
                tfont = fonttypedesc[0]
                fonts_process_disabled = true  # to prevent processing while we set items
                $("##{tfont}").googleFontSelector('select', datasource["#{tfont}_name"])
                $("##{tfont}_size").val(datasource["#{tfont}_size"]).trigger('change')
                fonts_process_disabled = false  # enable processing
                changeGoogleFont(tfont)  # toggle processing

        if 'fonts_used' in groups
            # font type used
            for fus in stgroups['fonts_used']
                value = datasource[fus]
                $("[name=#{fus}][value=#{value}]").prop('checked', 'checked').trigger('change')

        if 'site' in groups
            # set site name
            $('#sitename').val(datasource['sitename'])

            # set background
            $('input[data-for=bg]').val(datasource['background'])
            $('input[data-for=bg]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['background'])
            $('body').css('background-color', datasource['background'])

            # set background for dashboard
            $('input[data-for=dbbg]').val(datasource['dbbackground'])
            $('input[data-for=dbbg]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['dbbackground'])

            # set navbar background and foreground colors
            $('input[data-for=navbarbg]').val(datasource['navbarbg'])
            $('input[data-for=navbarbg]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['navbarbg'])
            $('.sitenavbar').css('background-color', datasource['navbarbg'])
            $('input[data-for=navbarfg]').val(datasource['navbarfg'])
            $('input[data-for=navbarfg]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['navbarfg'])
            $('.navbar-nav > li > a, .navbar-header a').css('color', datasource['navbarfg'])
            # active
            $('input[data-for=navbarbgactive]').val(datasource['navbarbgactive'])
            $('input[data-for=navbarbgactive]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['navbarbgactive'])
            $('.navbar-nav > li.active > a').css('background-color', datasource['navbarbgactive'])
            $('input[data-for=navbarfgactive]').val(datasource['navbarfgactive'])
            $('input[data-for=navbarfgactive]').parent()
                .colorpicker({ customClass: 'colorpicker-2x', 'component': 'input,.colorpicker-indicator', format: 'hex' })
                .colorpicker('setValue', datasource['navbarfgactive'])
            $('.navbar-nav > li.active > a').css('color', datasource['navbarfgactive'])

    # initial set
    stkeys = (k for own k of stgroups)

    selectTemplateResult = (item) ->
        if !item.id
            return item.text
        if not $(item.element).data('text')
            return item.text
        return $('<span>' + $(item.element).data('text') + '</span>')
    $('.select2').select2
        minimumResultsForSearch: Infinity,
        templateResult: selectTemplateResult,
        templateSelection: selectTemplateResult,

    $('.bswitch').bootstrapSwitch()

    # init fonts
    window.changeFont = (prefid) ->
        if fonts_process_disabled
            return false
        font = $("##{prefid}").css('font-family')
        size = $("##{prefid}_size").val()
        weight = 'normal'
        style = 'normal'
        if $("##{prefid}_weight").attr('type') == 'checkbox'
            weight = 'bold' if $("##{prefid}_weight").prop('checked')
        else
            weight = $("##{prefid}_weight").val()
        style = 'italic' if $("##{prefid}_style").prop('checked')
        $("##{prefid}_example").css('font-family', font).css('font-weight', weight).css('font-style', style).css('font-size', "#{size}px")
        # console.log("Font changed for: #{prefid}, name: #{font}, size #{size}, weight: #{weight}, style: #{style}")
        allSettings[prefid] = font
        allSettings["#{prefid}_size"] = size
        allSettings["#{prefid}_weight"] = weight
        allSettings["#{prefid}_style"] = style

    window.changeGoogleFont = (prefid) ->
        if fonts_process_disabled
            return false
        font = $("##{prefid}").googleFontSelector('selected')
        fontelements = font.split('|')
        fontfamily = fontelements[1]
        weight = fontelements[2]
        style = fontelements[3]
        size = $("##{prefid}_size").val()
        $("##{prefid}_example").css('font-family', fontfamily).css('font-weight', weight).css('font-style', style).css('font-size', "#{size}px")
        # console.log("Font changed for: #{prefid}, name: #{fontfamily}, size #{size}, weight: #{weight}, style: #{style}")
        allSettings[prefid] = fontfamily
        allSettings[prefid + '_name'] = fontelements[0]
        allSettings["#{prefid}_size"] = size
        allSettings["#{prefid}_weight"] = weight
        allSettings["#{prefid}_style"] = style

    $('.fontSelectNormal').each ->
        elemid = $(this).attr('id')
        initial = allSettings[elemid]
        $(this).fontSelector
            'hide_fallbacks' : true,
            'initial' : initial,
            'selected' : (style) ->
                changeFont(elemid)
            'fonts' : font_names_normal
        true

    $('.fontSelectGoogle').each ->
        elemid = $(this).attr('id')
        initial = allSettings[elemid + '_name']
        $(this).googleFontSelector
            'hide_fallbacks' : true,
            'initial' : initial,
            'selected' : (style) ->
                changeGoogleFont(elemid)
            'fonts' : font_names_google
        true

    # init values
    setValues(stkeys, false)

    $('.fontnormal').on 'change', 'select', () ->
        itemid = $(this).data('for')
        changeFont(itemid)
        true

    $('.fontgoogle').on 'change', 'select', () ->
        itemid = $(this).data('for')
        changeGoogleFont(itemid)
        true

    $('.fontnormal .bswitch, .fontgoogle .bswitch').on 'switchChange.bootstrapSwitch', (event, state) ->
        itemid = $(this).data('for')
        changeFont(itemid)
        true

    $('.fontchg .fonttypechange').on 'switchChange.bootstrapSwitch', (event, state) ->
        # font enable/disable radio group
        name = $(this).attr('name')
        allSettings[name] = $("[name=#{name}]:checked").val()
        # console.log(allSettings[name])

    # Logo
    window.showLogoImg = (img) ->
        canvas = $('#logocanvas').get(0)
        MAX_WIDTH = $('#logocanvas').data('maxwidth')
        MAX_HEIGHT = $('#logocanvas').data('maxheight')
        width = img.width
        height = img.height

        if (width > height)
            if (width > MAX_WIDTH)
                height *= MAX_WIDTH / width
                width = MAX_WIDTH
        else
            if (height > MAX_HEIGHT)
                width *= MAX_HEIGHT / height
                height = MAX_HEIGHT

        canvas.width = width
        canvas.height = height
        ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

    $("#logo").change ->
        uplfile = $(this).get(0).files[0]
        if (!uplfile.type.match(/image.*/))
            alert("This file is not an image!")
            return false
        reader = new FileReader()
        reader.onload = (e) ->
            img = document.createElement("img")
            img.onload = () ->
                showLogoImg(img)
                # dataurl = canvas.toDataURL("image/png")
            img.src = e.target.result
            if $('#pagebrandimg').length > 0
                $('#pagebrandimg').get(0).src = e.target.result

        reader.readAsDataURL(uplfile)
        return true

    $('#btnLogo').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # save logo
        canvas = $('#logocanvas').get(0)
        # context = canvas.getContext('2d')
        dataURL = canvas.toDataURL()
        saveSettings({'logo': dataURL}, "You have successfully saved your settings")

    $('#btnResLogo').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # reset logo
        saveSettings({'logo': ''})
        img = document.createElement("img")
        img.src = $('#curlogo').data('defaultlogo')
        if $('#pagebrandimg').length > 0
            $('#pagebrandimg').get(0).src = $('#curlogo').data('defaultlogo')
        showLogoImg(img, "You have successfully Reset your logo to the default logo")

    # Show logo on page load
    showLogoImg($('#curlogo').get(0))
    # -- end Logo

    $('#btnSiteSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # Save site settings
        data = {}
        for stid in stgroups['site']
            data[stid] = $('#' + stid).val()
            allSettings[stid] = data[stid]
        setValues(['site'], false)
        saveSettings(data, "You have successfully saved your settings")

    $('#btnSiteReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # Reset site settings
        data = {}
        setValues(['site'], true)
        for stid in stgroups['site']
            data[stid] = allSettings[stid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('#btnLabelSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # Save labels settings
        data = {}
        for labelid in stgroups['labels']
            data[labelid] = $('#' + labelid).val()
            allSettings[labelid] = data[labelid]
        saveSettings(data, "You have successfully saved your settings")

    $('#btnLabelReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # Reset label settings
        data = {}
        setValues(['labels'], true)
        for labelid in stgroups['labels']
            data[labelid] = allSettings[labelid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('#btnKpiSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # Save Kpi settings
        data = {}
        for kpiid in stgroups['kpis']
            data[kpiid] = $('input[id="' + kpiid + '"],select[id="' + kpiid + '"]').val()
            allSettings[kpiid] = data[kpiid]
        saveSettings(data, "You have successfully saved your settings")

    $('#btnKpiReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # Reset Kpi settings
        data = {}
        setValues(['kpis'], true)
        for labelid in stgroups['kpis']
            data[labelid] = allSettings[labelid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('#btnReportSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # Save Reports settings
        data = {}
        for reportid in stgroups['reports']
            data[reportid] = $('#' + reportid).val()
            allSettings[reportid] = data[reportid]
        saveSettings(data, "You have successfully saved your settings")

    $('#btnReportReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # Reset Report settings
        data = {}
        setValues(['reports'], true)
        for reportid in stgroups['reports']
            data[reportid] = allSettings[reportid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('#btnEmailSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        # Save Reports settings
        data = {}
        for reportid in stgroups['emails']
            data[reportid] = $('#' + reportid).val()
            allSettings[reportid] = data[reportid]
        data["email_tls"] = allSettings["email_tls"] = $('#email_tls').prop('checked')
        data["email_ssl"] = allSettings["email_ssl"] = $('#email_ssl').prop('checked')
        saveSettings(data, "You have successfully saved your settings")

    $('#btnEmailReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        # Reset Report settings
        data = {}
        setValues(['emails'], true)
        for reportid in stgroups['emails']
            data[reportid] = allSettings[reportid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('#btnFontSave').click ->
        if not confirm("Are you sure you want to save these settings?")
            return false
        data = {}
        # Save Normal Fonts settings
        for fontid in stgroups['fonts_normal']
            data[fontid] = allSettings[fontid]
        # Save Google Fonts settings
        for fontid in stgroups['fonts_google']
            data[fontid] = allSettings[fontid]
        # Save used fonts
        for fontid in stgroups['fonts_used']
            data[fontid] = allSettings[fontid]
        saveSettings(data, "You have successfully saved your settings")

    $('#btnFontReset').click ->
        if not confirm("Are you sure you want to reset these settings?")
            return false
        data = {}
        # Reset Normal Fonts settings
        setValues(['fonts_normal'], true)
        for fontid in stgroups['fonts_normal']
            data[fontid] = allSettings[fontid]
        # Reset Google Fonts settings
        setValues(['fonts_google'], true)
        for fontid in stgroups['fonts_google']
            data[fontid] = allSettings[fontid]
        # Reset used fonts
        setValues(['fonts_used'], true)
        for fontid in stgroups['fonts_used']
            data[fontid] = allSettings[fontid]
        saveSettings(data, "You have successfully Reset your settings to the default settings")

    $('.inprogress').addClass('hidden')
    $('.setmain').removeClass('hidden')

    formatExamples()
