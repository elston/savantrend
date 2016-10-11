'use strict'
$ ->
    csrftoken = Cookies.get('csrftoken')
    csrfSafeMethod = (method) ->
        # these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method))

    $.ajaxSetup
        beforeSend: (xhr, settings) ->
            if (!csrfSafeMethod(settings.type) && !this.crossDomain)
                xhr.setRequestHeader("X-CSRFToken", csrftoken)