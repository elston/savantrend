'use strict'
$ ->
    # navigation
    curpage = 1
    disableEvents = false

    navigate = (element, page, sort_data) ->
        pgclass = $(element).data('pgclass')
        if not pgclass
            pgclass = $(element).closest('[data-pgclass]').data('pgclass')
        if pgclass
            pgclass = ".#{pgclass} "
        page = page or 1
        lfilters = ""
        for lfo in $(pgclass + '.list-filter')
            fname = $(lfo).attr('name')
            fvalue = $(lfo).val()
            if fvalue && fvalue != '-'
                lfilters += "&filters[]=#{fname}*#{fvalue}"
        extravars = ""
        for lfo in $(pgclass + '.pagination-parameter')
            fname = $(lfo).data('name')
            fvalue = $(lfo).data('value')
            if fvalue != '-'
                extravars += "&#{fname}=#{fvalue}"
            # console.log(fname, fvalue)
        sortfield = if sort_data then sort_data[0] else $(pgclass + '.pagination-sortfield').data('sortfield') or ''
        ascsort = if sort_data then sort_data[1] else $(pgclass + '.pagination-sortfield').data('asc')
        if "#{ascsort}" not in ['0', '1']
            ascsort = "1"
        $(pgclass + '.pagination-sortfield').data('asc', ascsort)
        $(pgclass + '.pagination-sortfield').data('sortfield', sortfield)
        source_url = $(pgclass + '.paginated_content').data('source-url')
        if not source_url
            source_url = window.location.pathname
        $.ajax source_url + "?&page="+page+lfilters+"&sort=#{sortfield}&sortasc=#{ascsort}"+extravars,
            type: 'GET'
            dataType: 'html'
            success: (data, textStatus, jqXHR) ->
                curpage = page
                $(pgclass + '.paginated_content').html(data)
                # reinitWidgets()
                # sorting styling
                hhh = $(pgclass + "[data-sort=\"#{sortfield}\"]").addClass('sortfield').html()
                if hhh
                    if "#{ascsort}" == '1'
                        hhh = hhh.replace('</span></div>', ' <i class=" glyphicon glyphicon-sort-by-attributes"></i></span></div>')
                        $(pgclass + "[data-sort='#{sortfield}']").addClass('sortasc').html(hhh)
                    else
                        hhh = hhh.replace('</span></div>', ' <i class=" glyphicon glyphicon-sort-by-attributes-alt"></i></span></div>')
                        $(pgclass + "[data-sort='#{sortfield}']").addClass('sortdesc').html(hhh)
            error: (jqXHR, textStatus, error) ->
                console.log(jqXHR)
                console.log(textStatus)
                console.log(error)
        return false

    window.navigate = navigate

    $(document).on 'click', '.listnav', () ->
        nextpage = $(this).data('page')
        if !nextpage
            return false
        navigate(this, nextpage)

    $(document).on 'change', '.list-filter', () ->
        if not disableEvents
            navigate(this, 1)

    $(document).on 'click', '.filter-reset', () ->
        disableEvents = true
        # $(".list-filter").select2('val', '-')
        pgclass = $(this).closest('[data-pgclass]').data('pgclass')
        for selobj in $(".#{pgclass} .list-filter")
            $(selobj).val('-').trigger('change')
        disableEvents = false
        navigate(this, 1)

    $(document).on 'click', '[data-sort]', () ->
        pgclass = $(this).closest('[data-pgclass]').data('pgclass')
        sortfield = $(".#{pgclass} .pagination-sortfield").data('sortfield') or ''
        mysortfield = $(this).data('sort')
        ascsort = $(".#{pgclass} .pagination-sortfield").data('asc')
        if sortfield == mysortfield
            ascsort = ascsort ^ 1
        else
            ascsort = 1
        navigate(this, null, [mysortfield, ascsort])
        
    $('.paginated_content').each ->
        navigate(this, 1)

    $('.list-filter').select2({'width': '100%'})
