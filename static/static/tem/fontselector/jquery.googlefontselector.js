/**
 * Google Font Selector - jQuery plugin 0.1
 *
 * Copyright (c) 2012 Chris Dyer
 * Modified 2016 by Alexey Kolyanov
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following
 * conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING,
 * BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 */


(function( $ ) {

  var settings;

  var methods = {
    init : function(options) {

      settings = $.extend( {
        'hide_fallbacks' : false,
        'selected' : function(style) {},
        'opened' : function() {},
        'closed' : function() {},
        'initial' : '',
        'fonts' : [],
        'root': null,
      }, options);

      var root = this;
      var $root = $(this);
      root.selectedCallback = settings['selected'];
      root.openedCallback = settings['opened'];
      root.closedCallback = settings['closed'];
      root._byname = {};
      var visible = false;
      var selected = false;
      var openedClass = 'fontSelectGoogleOpen';

      var displayName = function(font) {
        var myfont = font.substr(0, font.indexOf('|'));
        if (settings['hide_fallbacks']) {
          myfont = myfont + ',';
          return myfont.substr(0, myfont.indexOf(','));
        }
        return myfont;
      }

      var select = function(font) {
        // console.log('int select', font);
        var fontelements = root._byname[font];
        // console.log('dbg int select', fontelements);
        var myfont = fontelements[0];
        root.find('span').html(myfont.replace(/["']{1}/gi,""));
        root
            .css('font-family', fontelements[1])
            .css('font-weight', fontelements[2])
            .css('font-style', fontelements[3])
            .data('fontname', fontelements[0])
            .data('fontfull', fontelements.join('|'));
        selected = font;

        root.selectedCallback(selected);
      }

      var positionUl = function() {
        var left, top;
        left = $(root).offset().left;
        top = $(root).offset().top + $(root).outerHeight();

        $(ul).css({
          'position': 'absolute',
          'left': left + 'px',
          'top': top + 'px',
          'width': $(root).outerWidth() + 'px'
        });
      }

      var closeUl = function() {
        ul.slideUp('fast', function() {
          visible = false;
        });

        $root.removeClass(openedClass);

        root.closedCallback();
      }

      var openUi = function() {
        ul.slideDown('fast', function() {
          visible = true;
        });

        $root.addClass(openedClass);

        root.openedCallback();
      }

      // Setup markup
      $root.prepend('<span>' + settings['initial'].replace(/'/g,'&#039;') + '</span>');
      var ul = $('<ul class="fontSelectGoogleUl"></ul>').appendTo('body');
      ul.hide();
      positionUl();

      for (var i = 0; i < settings['fonts'].length; i++) {
        var fontelements = settings['fonts'][i].split('|');
        root._byname[fontelements[0]] = fontelements;
        var item = $('<li>' + displayName(settings['fonts'][i]) + '</li>').appendTo(ul);
        $(item)
            .css('font-family', fontelements[1])
            .css('font-weight', fontelements[2])
            .css('font-style', fontelements[3])
            .data('fontname', fontelements[0])
            .data('fontfull', fontelements.join('|'))
      }
      settings['root'] = root;

      if (settings['initial'] != '')
        select(settings['initial']);

      ul.find('li').click(function() {

        if (!visible)
          return;

        positionUl();
        closeUl();
        // console.log('select', $(this).data('fontname'));
        select($(this).data('fontname'));
      });

      $root.click(function(event) {

        if (visible)
          return;

        event.stopPropagation();

        positionUl();
        openUi();
      });

      $('html').click(function() {
        if (visible)
        {
          closeUl();
        }
      })
    },
    selected : function() {
      return this.data('fontfull');
    },
    select : function(font) {
      var fontelements = settings['root']._byname[font];
      var myfont = fontelements[0];
      this.find('span').html(myfont.replace(/["']{1}/gi,""));
      // fontelements = font.split('|');
      this
          .css('font-family', fontelements[1])
          .css('font-weight', fontelements[2])
          .css('font-style', fontelements[3])
          .data('fontname', fontelements[0])
          .data('fontfull', fontelements.join('|'));
      selected = font;
    }
  };

  $.fn.googleFontSelector = function(method) {
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googleFontSelector' );
    }
  }
}) ( jQuery );
