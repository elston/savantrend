'use strict'
$ ->

    getCanvas = (form, width) ->
        form.width((width*1.33333) - 80).css('max-width', 'none')
        return html2canvas(form, {imageTimeout: 2000, removeContainer: true})
    
    window.makePDFimg = () ->
        form = $('#reportdata')
        pdfname = form.data('reportname')
        cache_width = form.width()
        a2 = [1190.55, 1683.78]
        a3 = [841.89, 1190.55]
        a4 = [ 595.28,  841.89]
        letter = [612, 792]
        $('body').scrollTop(0)

        getCanvas(form, a2[0]).then (canvas) ->
            img = canvas.toDataURL("image/png")
            doc = new jsPDF {orientation: 'p', unit:'px', format:'a2'}
            doc.addImage(img, 'PNG', 20, 20)
            doc.save(pdfname + '.pdf')
            form.width(cache_width)
            return doc

    window.makePDFimg2 = () ->
        form = $('#reportdata')
        pdfname = form.data('reportname')
        doc = new jsPDF('p','pt','a4')
        doc.addHTML(form, () ->
            doc.save(pdfname + '.pdf')
        )
        return doc

    window.makePDFimg3 = () ->
        form = $('#reportdata')
        pdfname = form.data('reportname')
        doc = new jsPDF()
        doc.fromHTML(form.get(0))
        return doc

    window.makePDFxepOnline = () ->
        # this approach is small and works pretty well,
        # but it sends the page to the third-party server and customer does not like this
        form = $('#reportdata')
        pdfname = form.data('reportname')
        xepOnline.Formatter.Format 'reportdata', 
            pageWidth:'279mm',
            pageHeight:'216mm',
            pageMarginRight: '50px',
            pageMarginLeft: '10px',
            render:'download',
            filename: pdfname

        return true

    # default
    window.makePDF = makePDFxepOnline;
