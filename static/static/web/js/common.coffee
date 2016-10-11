'use strict'

formatDate = (text, time) ->
    if not time
        time = new Date()
    if typeof time != 'string'
        time = time.toISOString()
    if not text
        text = ''
    return $.ajax
        url: '/format-date/'
        type: 'POST',
        data: JSON.stringify
            'time': time
            'text': text
        contentType: 'application/json; charset=utf-8'
        dataType: 'json'

formatExamples = () ->
    $('*[data-date-format-example-for]').each ->
        that = $(this)
        target = $('#' + that.data('date-format-example-for'))
        errorClass = that.data('date-format-example-error-class')
        errorTarget = $('#' + that.data('date-format-example-error-target'))
        if errorTarget.length == 0
            errorTarget = that
        handler = () ->
            formatDate($(this).val()).then(
                _.throttle(
                    (data) ->
                        that.html(JSON.parse(data))
                        if errorClass
                            errorTarget.removeClass(errorClass)

                    400
                ),
                (jqXHR, textStatus, errorThrown) ->
                    that.html('Invalid date format.')
                    if errorClass
                        errorTarget.addClass(errorClass)

            )
        target.on('keyup change', handler)
        handler.bind(target)()
    return null

window.formatExamples = formatExamples
