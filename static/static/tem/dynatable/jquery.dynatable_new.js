(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * jQuery Dynatable plugin 0.3.2
 *
 * Copyright (c) 2014 Steve Schwartz (JangoSteve)
 *
 * Dual licensed under the AGPL and Proprietary licenses:
 *   http://www.dynatable.com/license/
 *
 * Date: Tue Jan 02 2014
 */

var Dom = require('./models/dom');
var DomColumns = require('./models/dom/columns');
var Records = require('./models/records');
var RecordsCount = require('./models/records/count');
var ProcessingIndicator = require('./models/processing_indicator');
var State = require('./models/state');
var Sorts = require('./models/sorts');
var SortsHeaders = require('./models/sorts/headers');
var Queries = require('./models/queries');
var InputsSearch = require('./models/inputs_search');
var PaginationPage = require('./models/pagination/page');
var PaginationPerPage = require('./models/pagination/per_page');
var PaginationLinks = require('./models/pagination/links');

var utility = require('./utils');

var defaultRowWriter = require('./writers/row');
var defaultCellWriter = require('./writers/cell');
var defaultAttributeWriter = require('./writers/attribute');
var defaultAttributeReader = require('./readers/attribute');

(function($) {
  var defaults,
      mergeSettings,
      dt,
      build,
      processAll,
      Module,
      _modules;

  //-----------------------------------------------------------------
  // Cached plugin global defaults
  //-----------------------------------------------------------------

  defaults = {
    features: {
      paginate: true,
      sort: true,
      pushState: true,
      search: true,
      recordCount: true,
      perPageSelect: true
    },
    table: {
      defaultColumnIdStyle: 'camelCase',
      columns: null,
      headRowSelector: 'thead tr', // or e.g. tr:first-child
      bodyRowSelector: 'tbody tr',
      headRowClass: null,
      copyHeaderAlignment: true,
      copyHeaderClass: false
    },
    inputs: {
      queries: null,
      sorts: null,
      multisort: ['ctrlKey', 'shiftKey', 'metaKey'],
      page: null,
      queryEvent: 'blur change',
      recordCountTarget: null,
      recordCountPlacement: 'append',
      paginationLinkTarget: null,
      paginationLinkPlacement: 'append',
      paginationClass: 'dynatable-pagination-links',
      paginationLinkClass: 'dynatable-page-link',
      paginationPrevClass: 'dynatable-page-prev',
      paginationNextClass: 'dynatable-page-next',
      paginationActiveClass: 'dynatable-active-page',
      paginationDisabledClass: 'dynatable-disabled-page',
      paginationPrev: 'Previous',
      paginationNext: 'Next',
      paginationGap: [1,2,2,1],
      searchTarget: null,
      searchPlacement: 'prepend',
      searchText: 'Search: ',
      perPageTarget: null,
      perPagePlacement: 'prepend',
      perPageText: 'Show: ',
      pageText: 'Pages: ',
      recordCountPageBoundTemplate: '{pageLowerBound} to {pageUpperBound} of',
      recordCountPageUnboundedTemplate: '{recordsShown} of',
      recordCountTotalTemplate: '{recordsQueryCount} {collectionName}',
      recordCountFilteredTemplate: ' (filtered from {recordsTotal} total records)',
      recordCountText: 'Showing',
      recordCountTextTemplate: '{text} {pageTemplate} {totalTemplate} {filteredTemplate}',
      recordCountTemplate: '<span id="dynatable-record-count-{elementId}" class="dynatable-record-count">{textTemplate}</span>',
      processingText: 'Processing...'
    },
    dataset: {
      ajax: false,
      ajaxUrl: null,
      ajaxCache: null,
      ajaxOnLoad: false,
      ajaxMethod: 'GET',
      ajaxDataType: 'json',
      totalRecordCount: null,
      queries: {},
      queryRecordCount: null,
      page: null,
      perPageDefault: 10,
      perPageOptions: [10,20,50,100],
      sorts: {},
      sortsKeys: [],
      sortTypes: {},
      records: null
    },
    writers: {
      _rowWriter: defaultRowWriter,
      _cellWriter: defaultCellWriter,
      _attributeWriter: defaultAttributeWriter
    },
    readers: {
      _rowReader: null,
      _attributeReader: defaultAttributeReader
    },
    params: {
      dynatable: 'dynatable',
      queries: 'queries',
      sorts: 'sorts',
      page: 'page',
      perPage: 'perPage',
      offset: 'offset',
      records: 'records',
      record: null,
      queryRecordCount: 'queryRecordCount',
      totalRecordCount: 'totalRecordCount'
    }
  };

  //-----------------------------------------------------------------
  // Each dynatable instance inherits from this,
  // set properties specific to instance
  //-----------------------------------------------------------------

  dt = {
    init: function(element, options) {
      this.settings = mergeSettings(options);
      this.element = element;
      this.$element = $(element);

      // All the setup that doesn't require element or options
      build.call(this);

      return this;
    },

    process: function(skipPushState) {
      processAll.call(this, skipPushState);
    }
  };

  //-----------------------------------------------------------------
  // Modules
  //-----------------------------------------------------------------

  var Module = {
    initOnLoad: function() { return true; },
    init: function() {}
  };

  defaults.modules = [
    Dom,
    DomColumns,
    Records,
    RecordsCount,
    ProcessingIndicator,
    State,
    Sorts,
    SortsHeaders,
    Queries,
    InputsSearch,
    PaginationPage,
    PaginationPerPage,
    PaginationLinks
  ];

  function loadModule(obj) {
    var module = obj(dt, utility);
    if(typeof _modules === 'undefined') _modules = {};
    _modules[module.prototype.constructor.name] = module;
    module.prototype = Module;
  }

  for(var i = 0; i < defaults.modules.length; i ++) {
    var module = defaults.modules[i];
    loadModule(module);
  }

  //-----------------------------------------------------------------
  // Cached plugin global functions
  //-----------------------------------------------------------------

  mergeSettings = function(options) {
    var newOptions = $.extend(true, {}, defaults, options);

    // TODO: figure out a better way to do this.
    // Doing `extend(true)` causes any elements that are arrays
    // to merge the default and options arrays instead of overriding the defaults.
    if (options) {
      if (options.inputs) {
        if (options.inputs.multisort) {
          newOptions.inputs.multisort = options.inputs.multisort;
        }
        if (options.inputs.paginationGap) {
          newOptions.inputs.paginationGap = options.inputs.paginationGap;
        }
      }
      if (options.dataset && options.dataset.perPageOptions) {
        newOptions.dataset.perPageOptions = options.dataset.perPageOptions;
      }
    }

    return newOptions;
  };

  build = function() {
    this.$element.trigger('dynatable:preinit', this);

    for(module in _modules) {
      var moduleInstance = this[utility.textTransform.camelCase(module)] = new _modules[module](this, this.settings);
      if(moduleInstance.initOnLoad()) moduleInstance.init();
    }

    this.$element.trigger('dynatable:init', this);

    if (!this.settings.dataset.ajax || (this.settings.dataset.ajax && this.settings.dataset.ajaxOnLoad) || this.settings.features.paginate || (this.settings.features.sort && !$.isEmptyObject(this.settings.dataset.sorts))) {
      this.process();
    }
  };

  processAll = function(skipPushState) {
    var data = {};

    this.$element.trigger('dynatable:beforeProcess', data);

    if (!$.isEmptyObject(this.settings.dataset.queries)) { data[this.settings.params.queries] = this.settings.dataset.queries; }
    // TODO: Wrap this in a try/rescue block to hide the processing indicator and indicate something went wrong if error
    this.processingIndicator.show();

    if (this.settings.features.sort && !$.isEmptyObject(this.settings.dataset.sorts)) { data[this.settings.params.sorts] = this.settings.dataset.sorts; }
    if (this.settings.features.paginate && this.settings.dataset.page) {
      var page = this.settings.dataset.page,
          perPage = this.settings.dataset.perPage;
      data[this.settings.params.page] = page;
      data[this.settings.params.perPage] = perPage;
      data[this.settings.params.offset] = (page - 1) * perPage;
    }
    if (this.settings.dataset.ajaxData) { $.extend(data, this.settings.dataset.ajaxData); }

    // If ajax, sends query to ajaxUrl with queries and sorts serialized and appended in ajax data
    // otherwise, executes queries and sorts on in-page data
    if (this.settings.dataset.ajax) {
      var _this = this;
      var options = {
        type: _this.settings.dataset.ajaxMethod,
        dataType: _this.settings.dataset.ajaxDataType,
        data: data,
        error: function(xhr, error) {
          _this.$element.trigger('dynatable:ajax:error', {xhr: xhr, error : error});
        },
        success: function(response) {
          _this.$element.trigger('dynatable:ajax:success', response);
          // Merge ajax results and meta-data into dynatables cached data
          _this.records.updateFromJson(response);
          // update table with new records
          _this.dom.update();

          if (!skipPushState && _this.state.initOnLoad()) {
            _this.state.push(data);
          }
        },
        complete: function() {
          _this.processingIndicator.hide();
        }
      };
      // Do not pass url to `ajax` options if blank
      if (this.settings.dataset.ajaxUrl) {
        options.url = this.settings.dataset.ajaxUrl;

      // If ajaxUrl is blank, then we're using the current page URL,
      // we need to strip out any query, sort, or page data controlled by dynatable
      // that may have been in URL when page loaded, so that it doesn't conflict with
      // what's passed in with the data ajax parameter
      } else {
        options.url = utility.refreshQueryString(window.location.href, {}, this.settings);
      }
      if (this.settings.dataset.ajaxCache !== null) { options.cache = this.settings.dataset.ajaxCache; }

      $.ajax(options);
    } else {
      this.records.resetOriginal();
      this.queries.run();
      if (this.settings.features.sort) {
        this.records.sort();
      }
      if (this.settings.features.paginate) {
        this.records.paginate();
      }
      this.dom.update();
      this.processingIndicator.hide();

      if (!skipPushState && this.state.initOnLoad()) {
        this.state.push(data);
      }
    }

    this.$element.addClass('dynatable-loaded');
    this.$element.trigger('dynatable:afterProcess', data);
  };

  dt.utility = utility;

  //-----------------------------------------------------------------
  // Build the dynatable plugin
  //-----------------------------------------------------------------

  // Object.create support test, and fallback for browsers without it
  if ( typeof Object.create !== "function" ) {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  //-----------------------------------------------------------------
  // Global dynatable plugin setting defaults
  //-----------------------------------------------------------------

  $.dynatableSetup = function(options) {
    defaults = mergeSettings(options);
  };

  // Create dynatable plugin based on a defined object
  $.dynatable = function( object ) {
    $.fn['dynatable'] = function( options ) {
      return this.each(function() {
        if ( ! $.data( this, 'dynatable' ) ) {
          $.data( this, 'dynatable', Object.create(object).init(this, options) );
        }
      });
    };
  };

  $.dynatable(dt);

  module.exports = $.dynatable;

})(jQuery);


},{"./models/dom":3,"./models/dom/columns":2,"./models/inputs_search":4,"./models/pagination/links":5,"./models/pagination/page":6,"./models/pagination/per_page":7,"./models/processing_indicator":8,"./models/queries":9,"./models/records":11,"./models/records/count":10,"./models/sorts":13,"./models/sorts/headers":12,"./models/state":14,"./readers/attribute":15,"./utils":16,"./writers/attribute":17,"./writers/cell":18,"./writers/row":19}],2:[function(require,module,exports){
module.exports = function(dt, utility) {
  function DomColumns(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return obj.$element.is('table');
    };

    this.init = function() {
      settings.table.columns = [];
      this.getFromTable();
    };

    // initialize table[columns] array
    this.getFromTable = function() {
      var $columns = obj.$element.find(settings.table.headRowSelector).children('th,td');
      if ($columns.length) {
        $columns.each(function(index){
          _this.add($(this), index, true);
        });
      } else {
        return $.error("Couldn't find any columns headers in '" + settings.table.headRowSelector + " th,td'. If your header row is different, specify the selector in the table: headRowSelector option.");
      }
    };

    this.add = function($column, position, skipAppend, skipUpdate) {
      var columns = settings.table.columns,
      label = $column.text(),
      id = $column.data('dynatable-column') || utility.normalizeText(label, settings.table.defaultColumnIdStyle),
        dataSorts = $column.data('dynatable-sorts'),
        sorts = dataSorts ? $.map(dataSorts.split(','), function(text) { return $.trim(text); }) : [id];

      // If the column id is blank, generate an id for it
      if ( !id ) {
        this.generate($column);
        id = $column.data('dynatable-column');
      }
      // Add column data to plugin instance
      columns.splice(position, 0, {
        index: position,
        label: label,
        id: id,
        attributeWriter: settings.writers[id] || settings.writers._attributeWriter,
        attributeReader: settings.readers[id] || settings.readers._attributeReader,
        sorts: sorts,
        hidden: $column.css('display') === 'none',
        textAlign: settings.table.copyHeaderAlignment && $column.css('text-align'),
        cssClass: settings.table.copyHeaderClass && $column.attr('class')
      });

      // Modify header cell
      $column
        .attr('data-dynatable-column', id)
        .addClass('dynatable-head');
      if (settings.table.headRowClass) { $column.addClass(settings.table.headRowClass); }

      // Append column header to table
      if (!skipAppend) {
        var domPosition = position + 1,
          $sibling = obj.$element.find(settings.table.headRowSelector)
            .children('th:nth-child(' + domPosition + '),td:nth-child(' + domPosition + ')').first(),
                columnsAfter = columns.slice(position + 1, columns.length);

                if ($sibling.length) {
                  $sibling.before($column);
                  // sibling column doesn't yet exist (maybe this is the last column in the header row)
                } else {
                  obj.$element.find(settings.table.headRowSelector).append($column);
                }

                obj.sortsHeaders.attachOne($column.get());

                // increment the index of all columns after this one that was just inserted
                if (columnsAfter.length) {
                  for (var i = 0, len = columnsAfter.length; i < len; i++) {
                    columnsAfter[i].index += 1;
                  }
                }

                if (!skipUpdate) {
                  obj.dom.update();
                }
      }

      return dt;
    };

    this.remove = function(columnIndexOrId) {
      var columns = settings.table.columns,
      length = columns.length;

      if (typeof(columnIndexOrId) === "number") {
        var column = columns[columnIndexOrId];
        this.removeFromTable(column.id);
        this.removeFromArray(columnIndexOrId);
      } else {
        // Traverse columns array in reverse order so that subsequent indices
        // don't get messed up when we delete an item from the array in an iteration
        for (var i = columns.length - 1; i >= 0; i--) {
          var column = columns[i];

          if (column.id === columnIndexOrId) {
            this.removeFromTable(columnIndexOrId);
            this.removeFromArray(i);
          }
        }
      }

      obj.dom.update();
    };

    this.removeFromTable = function(columnId) {
      obj.$element.find(settings.table.headRowSelector).children('[data-dynatable-column="' + columnId + '"]').first()
        .remove();
    };

    this.removeFromArray = function(index) {
      var columns = settings.table.columns,
      adjustColumns;
      columns.splice(index, 1);
      adjustColumns = columns.slice(index, columns.length);
      for (var i = 0, len = adjustColumns.length; i < len; i++) {
        adjustColumns[i].index -= 1;
      }
    };

    this.generate = function($cell) {
      var cell = $cell === undefined ? $('<th></th>') : $cell;
      return this.attachGeneratedAttributes(cell);
    };

    this.attachGeneratedAttributes = function($cell) {
      // Use increment to create unique column name that is the same each time the page is reloaded,
      // in order to avoid errors with mismatched attribute names when loading cached `dataset.records` array
      var increment = obj.$element.find(settings.table.headRowSelector).children('th[data-dynatable-generated]').length;
      return $cell
        .attr('data-dynatable-column', 'dynatable-generated-' + increment) //+ utility.randomHash(),
        .attr('data-dynatable-no-sort', 'true')
          .attr('data-dynatable-generated', increment);
    };
  };

  return DomColumns;
}


},{}],3:[function(require,module,exports){
module.exports = function(dt, utility) {
  function Dom(obj, settings) {
    var _this = this;

    // update table contents with new records array
    // from query (whether ajax or not)
    this.update = function() {
      var rows = '',
          columns = settings.table.columns,
          rowWriter = settings.writers._rowWriter,
          cellWriter = settings.writers._cellWriter;

      obj.$element.trigger('dynatable:beforeUpdate', rows);

      // loop through records
      for (var i = 0, len = settings.dataset.records.length; i < len; i++) {
        var record = settings.dataset.records[i],
            tr = rowWriter(i, record, columns, cellWriter);
        rows += tr;
      }

      // Appended dynatable interactive elements
      if (settings.features.recordCount) {
        $('#dynatable-record-count-' + obj.element.id).replaceWith(obj.recordsCount.create());
      }
      if (settings.features.paginate) {
        $('#dynatable-pagination-links-' + obj.element.id).replaceWith(obj.paginationLinks.create());
        if (settings.features.perPageSelect) {
          $('#dynatable-per-page-' + obj.element.id).val(parseInt(settings.dataset.perPage));
        }
      }

      // Sort headers functionality
      if (settings.features.sort && columns) {
        obj.sortsHeaders.removeAllArrows();
        for (var i = 0, len = columns.length; i < len; i++) {
          var column = columns[i],
              sortedByColumn = utility.allMatch(settings.dataset.sorts, column.sorts, function(sorts, sort) { return sort in sorts; }),
              value = settings.dataset.sorts[column.sorts[0]];

          if (sortedByColumn) {
            obj.$element.find('[data-dynatable-column="' + column.id + '"]').find('.dynatable-sort-header').each(function(){
              if (value == 1) {
                obj.sortsHeaders.appendArrowUp($(this));
              } else {
                obj.sortsHeaders.appendArrowDown($(this));
              }
            });
          }
        }
      }

      // Query search functionality
      if (settings.inputs.queries || settings.features.search) {
        var allQueries = settings.inputs.queries || $();
        if (settings.features.search) {
          allQueries = allQueries.add('#dynatable-query-search-' + obj.element.id);
        }

        allQueries.each(function() {
          var $this = $(this),
              q = settings.dataset.queries[$this.data('dynatable-query')];
          $this.val(q || '');
        });
      }

      obj.$element.find(settings.table.bodyRowSelector).remove();
      obj.$element.append(rows);

      obj.$element.trigger('dynatable:afterUpdate', rows);
    };
  };
  
  return Dom;
}


},{}],4:[function(require,module,exports){
module.exports = function(dt, utility) {
  function InputsSearch(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return settings.features.search;
    };

    this.init = function() {
      this.attach();
    };

    this.create = function() {
      var $search = $('<input />', {
            type: 'search',
            id: 'dynatable-query-search-' + obj.element.id,
            'data-dynatable-query': 'search',
            value: settings.dataset.queries.search
          }),
          $searchSpan = $('<div class="pull-right"></div>', {
            id: 'dynatable-search-' + obj.element.id,
            'class': 'dynatable-search',
            text: settings.inputs.searchText
          }).append($search);

      $search
        .bind(settings.inputs.queryEvent, function() {
          obj.queries.runSearch($(this).val());
        })
        .bind('keypress', function(e) {
          if (e.which == 13) {
            obj.queries.runSearch($(this).val());
            e.preventDefault();
          }
        });
      return $searchSpan;
    };

    this.attach = function() {
      var $target = settings.inputs.searchTarget ? $(settings.inputs.searchTarget) : obj.$element;
      $target[settings.inputs.searchPlacement](this.create());
    };
  };

  return InputsSearch;
}


},{}],5:[function(require,module,exports){
module.exports = function(dt, utility) {
  // pagination links which update dataset.page attribute
  function PaginationLinks(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return settings.features.paginate;
    };

    this.init = function() {
      this.attach();
    };

    this.create = function() {
      var pageLinks = '<ul id="' + 'dynatable-pagination-links-' + obj.element.id + '" class="' + settings.inputs.paginationClass + '">',
          pageLinkClass = settings.inputs.paginationLinkClass,
          activePageClass = settings.inputs.paginationActiveClass,
          disabledPageClass = settings.inputs.paginationDisabledClass,
          pages = Math.ceil(settings.dataset.queryRecordCount / settings.dataset.perPage),
          page = settings.dataset.page,
          breaks = [
            settings.inputs.paginationGap[0],
            settings.dataset.page - settings.inputs.paginationGap[1],
            settings.dataset.page + settings.inputs.paginationGap[2],
            (pages + 1) - settings.inputs.paginationGap[3]
          ];

      pageLinks += '<li><span>' + settings.inputs.pageText + '</span></li>';

      for (var i = 1; i <= pages; i++) {
        if ( (i > breaks[0] && i < breaks[1]) || (i > breaks[2] && i < breaks[3])) {
          // skip to next iteration in loop
          continue;
        } else {
          var li = obj.paginationLinks.buildLink(i, i, pageLinkClass, page == i, activePageClass),
              breakIndex,
              nextBreak;

          // If i is not between one of the following
          // (1 + (settings.paginationGap[0]))
          // (page - settings.paginationGap[1])
          // (page + settings.paginationGap[2])
          // (pages - settings.paginationGap[3])
          breakIndex = $.inArray(i, breaks);
          nextBreak = breaks[breakIndex + 1];
          if (breakIndex > 0 && i !== 1 && nextBreak && nextBreak > (i + 1)) {
            var ellip = '<li><span class="dynatable-page-break">&hellip;</span></li>';
            li = breakIndex < 2 ? ellip + li : li + ellip;
          }

          if (settings.inputs.paginationPrev && i === 1) {
            var prevLi = obj.paginationLinks.buildLink(page - 1, settings.inputs.paginationPrev, pageLinkClass + ' ' + settings.inputs.paginationPrevClass, page === 1, disabledPageClass);
            li = prevLi + li;
          }
          if (settings.inputs.paginationNext && i === pages) {
            var nextLi = obj.paginationLinks.buildLink(page + 1, settings.inputs.paginationNext, pageLinkClass + ' ' + settings.inputs.paginationNextClass, page === pages, disabledPageClass);
            li += nextLi;
          }

          pageLinks += li;
        }
      }

      pageLinks += '</ul>';

      // only bind page handler to non-active and non-disabled page links
      var selector = '#dynatable-pagination-links-' + obj.element.id + ' a.' + pageLinkClass + ':not(.' + activePageClass + ',.' + disabledPageClass + ')';
      // kill any existing delegated-bindings so they don't stack up
      $(document).undelegate(selector, 'click.dynatable');
      $(document).delegate(selector, 'click.dynatable', function(e) {
        $this = $(this);
        $this.closest(settings.inputs.paginationClass).find('.' + activePageClass).removeClass(activePageClass);
        $this.addClass(activePageClass);

        obj.paginationPage.set($this.data('dynatable-page'));
        obj.process();
        e.preventDefault();
      });

      return pageLinks;
    };

    this.buildLink = function(page, label, linkClass, conditional, conditionalClass) {
      var link = '<a data-dynatable-page=' + page + ' class="' + linkClass,
          li = '<li';

      if (conditional) {
        link += ' ' + conditionalClass;
        li += ' class="' + conditionalClass + '"';
      }

      link += '">' + label + '</a>';
      li += '>' + link + '</li>';

      return li;
    };

    this.attach = function() {
      // append page links *after* delegate-event-binding so it doesn't need to
      // find and select all page links to bind event
      var $target = settings.inputs.paginationLinkTarget ? $(settings.inputs.paginationLinkTarget) : obj.$element;
      $target[settings.inputs.paginationLinkPlacement](obj.paginationLinks.create());
    };
  };

  return PaginationLinks;
}

},{}],6:[function(require,module,exports){
module.exports = function(dt, utility) {
  // provide a public function for selecting page
  function PaginationPage(obj, settings) {
    this.initOnLoad = function() {
      return settings.features.paginate;
    };

    this.init = function() {
      var pageUrl = window.location.search.match(new RegExp(settings.params.page + '=([^&]*)'));
      // If page is present in URL parameters and pushState is enabled
      // (meaning that it'd be possible for dynatable to have put the
      // page parameter in the URL)
      if (pageUrl && settings.features.pushState) {
        this.set(pageUrl[1]);
      } else {
        this.set(1);
      }
    };

    this.set = function(page) {
      var newPage = parseInt(page, 10);
      settings.dataset.page = newPage;
      obj.$element.trigger('dynatable:page:set', newPage);
    }
  };

  return PaginationPage;
}


},{}],7:[function(require,module,exports){
module.exports = function(dt, utility) {
  function PaginationPerPage(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return settings.features.paginate;
    };

    this.init = function() {
      var perPageUrl = window.location.search.match(new RegExp(settings.params.perPage + '=([^&]*)'));

      // If perPage is present in URL parameters and pushState is enabled
      // (meaning that it'd be possible for dynatable to have put the
      // perPage parameter in the URL)
      if (perPageUrl && settings.features.pushState) {
        // Don't reset page to 1 on init, since it might override page
        // set on init from URL
        this.set(perPageUrl[1], true);
      } else {
        this.set(settings.dataset.perPageDefault, true);
      }

      if (settings.features.perPageSelect) {
        this.attach();
      }
    };

    this.create = function() {
      var $select = $('<select>', {
            id: 'dynatable-per-page-' + obj.element.id,
            'class': 'dynatable-per-page-select'
          });

      for (var i = 0, len = settings.dataset.perPageOptions.length; i < len; i++) {
        var number = settings.dataset.perPageOptions[i],
            selected = settings.dataset.perPage == number ? 'selected="selected"' : '';
        $select.append('<option value="' + number + '" ' + selected + '>' + number + '</option>');
      }

      $select.bind('change', function(e) {
        _this.set($(this).val());
        obj.process();
      });

      return $('<span />', {
        'class': 'dynatable-per-page'
      }).append("<span class='dynatable-per-page-label'>" + settings.inputs.perPageText + "</span>").append($select);
    };

    this.attach = function() {
      var $target = settings.inputs.perPageTarget ? $(settings.inputs.perPageTarget) : obj.$element;
      $target[settings.inputs.perPagePlacement](this.create());
    };

    this.set = function(number, skipResetPage) {
      var newPerPage = parseInt(number);
      if (!skipResetPage) { obj.paginationPage.set(1); }
      settings.dataset.perPage = newPerPage;
      obj.$element.trigger('dynatable:perPage:set', newPerPage);
    };
  };

  return PaginationPerPage;
}


},{}],8:[function(require,module,exports){
module.exports = function(dt, utility) {
  function ProcessingIndicator(obj, settings) {
    this.init = function() {
      this.attach();
    };

    this.create = function() {
      var $processing = $('<div></div>', {
            html: '<span>' + settings.inputs.processingText + '</span>',
            id: 'dynatable-processing-' + obj.element.id,
            'class': 'dynatable-processing',
            style: 'position: absolute; display: none;'
          });

      return $processing;
    };

    this.position = function() {
      var $processing = $('#dynatable-processing-' + obj.element.id),
          $span = $processing.children('span'),
          spanHeight = $span.outerHeight(),
          spanWidth = $span.outerWidth(),
          $covered = obj.$element,
          offset = $covered.offset(),
          height = $covered.outerHeight(), width = $covered.outerWidth();

      $processing
        .offset({left: offset.left, top: offset.top})
        .width(width)
        .height(height)
      $span
        .offset({left: offset.left + ( (width - spanWidth) / 2 ), top: offset.top + ( (height - spanHeight) / 2 )});

      return $processing;
    };

    this.attach = function() {
      obj.$element.before(this.create());
    };

    this.show = function() {
      $('#dynatable-processing-' + obj.element.id).show();
      this.position();
    };

    this.hide = function() {
      $('#dynatable-processing-' + obj.element.id).hide();
    };
  };

  return ProcessingIndicator;
}


},{}],9:[function(require,module,exports){
module.exports = function(dt, utility) {
  function Queries(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return settings.inputs.queries || settings.features.search;
    };

    this.init = function() {
      var queriesUrl = window.location.search.match(new RegExp(settings.params.queries + '[^&=]*=[^&]*', 'g'));

      settings.dataset.queries = queriesUrl ? utility.deserialize(queriesUrl)[settings.params.queries] : {};
      if (settings.dataset.queries === "") { settings.dataset.queries = {}; }

      if (settings.inputs.queries) {
        this.setupInputs();
      }
    };

    this.add = function(name, value) {
      // reset to first page since query will change records
      if (settings.features.paginate) {
        settings.dataset.page = 1;
      }
      settings.dataset.queries[name] = value;
      obj.$element.trigger('dynatable:queries:added', [name, value]);
      return dt;
    };

    this.remove = function(name) {
      delete settings.dataset.queries[name];
      obj.$element.trigger('dynatable:queries:removed', name);
      return dt;
    };

    this.run = function() {
      for (query in settings.dataset.queries) {
        if (settings.dataset.queries.hasOwnProperty(query)) {
          var value = settings.dataset.queries[query];
          if (_this.functions[query] === undefined) {
            // Try to lazily evaluate query from column names if not explicitly defined
            var queryColumn = utility.findObjectInArray(settings.table.columns, {id: query});
            if (queryColumn) {
              _this.functions[query] = function(record, queryValue) {
                return record[query] == queryValue;
              };
            } else {
              $.error("Query named '" + query + "' called, but not defined in queries.functions");
              continue; // to skip to next query
            }
          }
          // collect all records that return true for query
          settings.dataset.records = $.map(settings.dataset.records, function(record) {
            return _this.functions[query](record, value) ? record : null;
          });
        }
      }
      settings.dataset.queryRecordCount = obj.records.count();
    };

    // Shortcut for performing simple query from built-in search
    this.runSearch = function(q) {
      var origQueries = $.extend({}, settings.dataset.queries);
      if (q) {
        this.add('search', q);
      } else {
        this.remove('search');
      }
      if (!utility.objectsEqual(settings.dataset.queries, origQueries)) {
        obj.process();
      }
    };

    this.setupInputs = function() {
      settings.inputs.queries.each(function() {
        var $this = $(this),
            event = $this.data('dynatable-query-event') || settings.inputs.queryEvent,
            query = $this.data('dynatable-query') || $this.attr('name') || this.id,
            queryFunction = function(e) {
              var q = $(this).val();
              if (q === "") { q = undefined; }
              if (q === settings.dataset.queries[query]) { return false; }
              if (q) {
                _this.add(query, q);
              } else {
                _this.remove(query);
              }
              obj.process();
              e.preventDefault();
            };

        $this
          .attr('data-dynatable-query', query)
          .bind(event, queryFunction)
          .bind('keypress', function(e) {
            if (e.which == 13) {
              queryFunction.call(this, e);
            }
          });

        if (settings.dataset.queries[query]) { $this.val(decodeURIComponent(settings.dataset.queries[query])); }
      });
    };

    // Query functions for in-page querying
    // each function should take a record and a value as input
    // and output true of false as to whether the record is a match or not
    this.functions = {
      search: function(record, queryValue) {
        var contains = false;
        // Loop through each attribute of record
        for (attr in record) {
          if (record.hasOwnProperty(attr)) {
            var attrValue = record[attr];
            if (typeof(attrValue) === "string" && attrValue.toLowerCase().indexOf(queryValue.toLowerCase()) !== -1) {
              contains = true;
              // Don't need to keep searching attributes once found
              break;
            } else {
              continue;
            }
          }
        }
        return contains;
      }
    };
  };

  return Queries;
}


},{}],10:[function(require,module,exports){
module.exports = function(dt, utility) {
  function RecordsCount(obj, settings) {
    this.initOnLoad = function() {
      return settings.features.recordCount;
    };

    this.init = function() {
      this.attach();
    };

    this.create = function() {
      var pageTemplate = '',
          filteredTemplate = '',
          options = {
            elementId: obj.element.id,
            recordsShown: obj.records.count(),
            recordsQueryCount: settings.dataset.queryRecordCount,
            recordsTotal: settings.dataset.totalRecordCount,
            collectionName: settings.params.records === "_root" ? "records" : settings.params.records,
            text: settings.inputs.recordCountText
          };

      if (settings.features.paginate) {

        // If currently displayed records are a subset (page) of the entire collection
        if (options.recordsShown < options.recordsQueryCount) {
          var bounds = obj.records.pageBounds();
          options.pageLowerBound = bounds[0] + 1;
          options.pageUpperBound = bounds[1];
          pageTemplate = settings.inputs.recordCountPageBoundTemplate;

        // Else if currently displayed records are the entire collection
        } else if (options.recordsShown === options.recordsQueryCount) {
          pageTemplate = settings.inputs.recordCountPageUnboundedTemplate;
        }
      }

      // If collection for table is queried subset of collection
      if (options.recordsQueryCount < options.recordsTotal) {
        filteredTemplate = settings.inputs.recordCountFilteredTemplate;
      }

      // Populate templates with options
      options.pageTemplate = utility.template(pageTemplate, options);
      options.filteredTemplate = utility.template(filteredTemplate, options);
      options.totalTemplate = utility.template(settings.inputs.recordCountTotalTemplate, options);
      options.textTemplate = utility.template(settings.inputs.recordCountTextTemplate, options);

      return utility.template(settings.inputs.recordCountTemplate, options);
    };

    this.attach = function() {
      var $target = settings.inputs.recordCountTarget ? $(settings.inputs.recordCountTarget) : obj.$element;
      $target[settings.inputs.recordCountPlacement](this.create());
    };
  };

  return RecordsCount;
}


},{}],11:[function(require,module,exports){
module.exports = function(dt, utility) {
  function Records(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return !settings.dataset.ajax;
    };

    this.init = function() {
      if (settings.dataset.records === null) {
        settings.dataset.records = this.getFromTable();

        if (!settings.dataset.queryRecordCount) {
          settings.dataset.queryRecordCount = this.count();
        }

        if (!settings.dataset.totalRecordCount){
          settings.dataset.totalRecordCount = settings.dataset.queryRecordCount;
        }
      }

      // Create cache of original full recordset (unpaginated and unqueried)
      settings.dataset.originalRecords = $.extend(true, [], settings.dataset.records);
    };

    // merge ajax response json with cached data including
    // meta-data and records
    this.updateFromJson = function(data) {
      var records;
      if (settings.params.records === "_root") {
        records = data;
      } else if (settings.params.records in data) {
        records = data[settings.params.records];
      }
      if (settings.params.record) {
        var len = records.length - 1;
        for (var i = 0; i < len; i++) {
          records[i] = records[i][settings.params.record];
        }
      }
      if (settings.params.queryRecordCount in data) {
        settings.dataset.queryRecordCount = data[settings.params.queryRecordCount];
      }
      if (settings.params.totalRecordCount in data) {
        settings.dataset.totalRecordCount = data[settings.params.totalRecordCount];
      }
      settings.dataset.records = records;
    };

    // For really advanced sorting,
    // see http://james.padolsey.com/javascript/sorting-elements-with-jquery/
    this.sort = function() {
      var sort = [].sort,
          sorts = settings.dataset.sorts,
          sortsKeys = settings.dataset.sortsKeys,
          sortTypes = settings.dataset.sortTypes;

      var sortFunction = function(a, b) {
        var comparison;
        if ($.isEmptyObject(sorts)) {
          comparison = obj.sorts.functions['originalPlacement'](a, b);
        } else {
          for (var i = 0, len = sortsKeys.length; i < len; i++) {
            var attr = sortsKeys[i],
                direction = sorts[attr],
                sortType = sortTypes[attr] || obj.sorts.guessType(a, b, attr);
            comparison = obj.sorts.functions[sortType](a, b, attr, direction);
            // Don't need to sort any further unless this sort is a tie between a and b,
            // so break the for loop unless tied
            if (comparison !== 0) { break; }
          }
        }
        return comparison;
      }

      return sort.call(settings.dataset.records, sortFunction);
    };

    this.paginate = function() {
      var bounds = this.pageBounds(),
          first = bounds[0], last = bounds[1];
      settings.dataset.records = settings.dataset.records.slice(first, last);
    };

    this.resetOriginal = function() {
      settings.dataset.records = settings.dataset.originalRecords || [];
    };

    this.pageBounds = function() {
      var page = settings.dataset.page || 1,
          first = (page - 1) * settings.dataset.perPage,
          last = Math.min(first + settings.dataset.perPage, settings.dataset.queryRecordCount);
      return [first,last];
    };

    // get initial recordset to populate table
    // if ajax, call ajaxUrl
    // otherwise, initialize from in-table records
    this.getFromTable = function() {
      var records = [],
          columns = settings.table.columns,
          tableRecords = obj.$element.find(settings.table.bodyRowSelector);

      tableRecords.each(function(index){
        var record = {};
        record['dynatable-original-index'] = index;
        $(this).find('th,td').each(function(index) {
          if (columns[index] === undefined) {
            // Header cell didn't exist for this column, so let's generate and append
            // a new header cell with a randomly generated name (so we can store and
            // retrieve the contents of this column for each record)
            obj.domColumns.add(obj.domColumns.generate(), columns.length, false, true); // don't skipAppend, do skipUpdate
          }
          var value = columns[index].attributeReader(this, record),
              attr = columns[index].id;

          // If value from table is HTML, let's get and cache the text equivalent for
          // the default string sorting, since it rarely makes sense for sort headers
          // to sort based on HTML tags.
          if (typeof(value) === "string" && value.match(/\s*\<.+\>/)) {
            if (! record['dynatable-sortable-text']) {
              record['dynatable-sortable-text'] = {};
            }
            record['dynatable-sortable-text'][attr] = $.trim($('<div></div>').html(value).text());
          }

          record[attr] = value;
        });
        // Allow configuration function which alters record based on attributes of
        // table row (e.g. from html5 data- attributes)
        if (typeof(settings.readers._rowReader) === "function") {
          settings.readers._rowReader(index, this, record);
        }
        records.push(record);
      });
      return records; // 1st row is header
    };

    // count records from table
    this.count = function() {
      return settings.dataset.records.length;
    };
  };

  return Records;
}


},{}],12:[function(require,module,exports){
module.exports = function(dt, utility) {
  // turn table headers into links which add sort to sorts array
  function SortsHeaders(obj, settings) {
    var _this = this;

    this.initOnLoad = function() {
      return settings.features.sort;
    };

    this.init = function() {
      this.attach();
    };

    this.create = function(cell) {
      var $cell = $(cell),
          $link = $('<a></a>', {
            'class': 'dynatable-sort-header',
            href: '#',
            html: $cell.html()
          }),
          id = $cell.data('dynatable-column'),
          column = utility.findObjectInArray(settings.table.columns, {id: id});

      $link.bind('click', function(e) {
        _this.toggleSort(e, $link, column);
        obj.process();

        e.preventDefault();
      });

      if (this.sortedByColumn($link, column)) {
        if (this.sortedByColumnValue(column) == 1) {
          this.appendArrowUp($link);
        } else {
          this.appendArrowDown($link);
        }
      }

      return $link;
    };

    this.removeAll = function() {
      obj.$element.find(settings.table.headRowSelector).children('th,td').each(function(){
        _this.removeAllArrows();
        _this.removeOne(this);
      });
    };

    this.removeOne = function(cell) {
      var $cell = $(cell),
          $link = $cell.find('.dynatable-sort-header');
      if ($link.length) {
        var html = $link.html();
        $link.remove();
        $cell.html($cell.html() + html);
      }
    };

    this.attach = function() {
      obj.$element.find(settings.table.headRowSelector).children('th,td').each(function(){
        _this.attachOne(this);
      });
    };

    this.attachOne = function(cell) {
      var $cell = $(cell);
      if (!$cell.data('dynatable-no-sort')) {
        $cell.html(this.create(cell));
      }
    };

    this.appendArrowUp = function($link) {
      this.removeArrow($link);
      $link.append("<span class='dynatable-arrow'> &#9650;</span>");
    };

    this.appendArrowDown = function($link) {
      this.removeArrow($link);
      $link.append("<span class='dynatable-arrow'> &#9660;</span>");
    };

    this.removeArrow = function($link) {
      // Not sure why `parent()` is needed, the arrow should be inside the link from `append()` above
      $link.find('.dynatable-arrow').remove();
    };

    this.removeAllArrows = function() {
      obj.$element.find('.dynatable-arrow').remove();
    };

    this.toggleSort = function(e, $link, column) {
      var sortedByColumn = this.sortedByColumn($link, column),
          value = this.sortedByColumnValue(column);
      // Clear existing sorts unless this is a multisort event
      if (!settings.inputs.multisort || !utility.anyMatch(e, settings.inputs.multisort, function(evt, key) { return e[key]; })) {
        this.removeAllArrows();
        obj.sorts.clear();
      }

      // If sorts for this column are already set
      if (sortedByColumn) {
        // If ascending, then make descending
        if (value == 1) {
          for (var i = 0, len = column.sorts.length; i < len; i++) {
            obj.sorts.add(column.sorts[i], -1);
          }
          this.appendArrowDown($link);
        // If descending, remove sort
        } else {
          for (var i = 0, len = column.sorts.length; i < len; i++) {
            obj.sorts.remove(column.sorts[i]);
          }
          this.removeArrow($link);
        }
      // Otherwise, if not already set, set to ascending
      } else {
        for (var i = 0, len = column.sorts.length; i < len; i++) {
          obj.sorts.add(column.sorts[i], 1);
        }
        this.appendArrowUp($link);
      }
    };

    this.sortedByColumn = function($link, column) {
      return utility.allMatch(settings.dataset.sorts, column.sorts, function(sorts, sort) { return sort in sorts; });
    };

    this.sortedByColumnValue = function(column) {
      return settings.dataset.sorts[column.sorts[0]];
    };
  };

  return SortsHeaders;
}


},{}],13:[function(require,module,exports){
module.exports = function(dt, utility) {
  function Sorts(obj, settings) {
    this.initOnLoad = function() {
      return settings.features.sort;
    };

    this.init = function() {
      var sortsUrl = window.location.search.match(new RegExp(settings.params.sorts + '[^&=]*=[^&]*', 'g'));
      if (sortsUrl) {
        settings.dataset.sorts = utility.deserialize(sortsUrl)[settings.params.sorts];
      }
      if (!settings.dataset.sortsKeys.length) {
        settings.dataset.sortsKeys = utility.keysFromObject(settings.dataset.sorts);
      }
    };

    this.add = function(attr, direction) {
      var sortsKeys = settings.dataset.sortsKeys,
          index = $.inArray(attr, sortsKeys);
      settings.dataset.sorts[attr] = direction;
      obj.$element.trigger('dynatable:sorts:added', [attr, direction]);
      if (index === -1) { sortsKeys.push(attr); }
      return dt;
    };

    this.remove = function(attr) {
      var sortsKeys = settings.dataset.sortsKeys,
          index = $.inArray(attr, sortsKeys);
      delete settings.dataset.sorts[attr];
      obj.$element.trigger('dynatable:sorts:removed', attr);
      if (index !== -1) { sortsKeys.splice(index, 1); }
      return dt;
    };

    this.clear = function() {
      settings.dataset.sorts = {};
      settings.dataset.sortsKeys.length = 0;
      obj.$element.trigger('dynatable:sorts:cleared');
    };

    // Try to intelligently guess which sort function to use
    // based on the type of attribute values.
    // Consider using something more robust than `typeof` (http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/)
    this.guessType = function(a, b, attr) {
      var types = {
            string: 'string',
            number: 'number',
            'boolean': 'number',
            object: 'number' // dates and null values are also objects, this works...
          },
          attrType = a[attr] ? typeof(a[attr]) : typeof(b[attr]),
          type = types[attrType] || 'number';
      return type;
    };

    // Built-in sort functions
    // (the most common use-cases I could think of)
    this.functions = {
      number: function(a, b, attr, direction) {
        return a[attr] === b[attr] ? 0 : (direction > 0 ? a[attr] - b[attr] : b[attr] - a[attr]);
      },
      string: function(a, b, attr, direction) {
        var aAttr = (a['dynatable-sortable-text'] && a['dynatable-sortable-text'][attr]) ? a['dynatable-sortable-text'][attr] : a[attr],
            bAttr = (b['dynatable-sortable-text'] && b['dynatable-sortable-text'][attr]) ? b['dynatable-sortable-text'][attr] : b[attr],
            comparison;
        aAttr = aAttr.toLowerCase();
        bAttr = bAttr.toLowerCase();
        comparison = aAttr === bAttr ? 0 : (direction > 0 ? aAttr > bAttr : bAttr > aAttr);
        // force false boolean value to -1, true to 1, and tie to 0
        return comparison === false ? -1 : (comparison - 0);
      },
      originalPlacement: function(a, b) {
        return a['dynatable-original-index'] - b['dynatable-original-index'];
      }
    };
  };

  return Sorts;
}

},{}],14:[function(require,module,exports){
module.exports = function(dt, utility) {
  function State(obj, settings) {
    this.initOnLoad = function() {
      // Check if pushState option is true, and if browser supports it
      return settings.features.pushState && history.pushState;
    };

    this.init = function() {
      window.onpopstate = function(event) {
        if (event.state && event.state.dynatable) {
          obj.state.pop(event);
        }
      }
    };

    this.push = function(data) {
      var urlString = window.location.search,
          urlOptions,
          path,
          params,
          hash,
          newParams,
          cacheStr,
          cache,
          // replaceState on initial load, then pushState after that
          firstPush = !(window.history.state && window.history.state.dynatable),
          pushFunction = firstPush ? 'replaceState' : 'pushState';

      if (urlString && /^\?/.test(urlString)) { urlString = urlString.substring(1); }
      $.extend(urlOptions, data);

      params = utility.refreshQueryString(urlString, data, settings);
      if (params) { params = '?' + params; }
      hash = window.location.hash;
      path = window.location.pathname;

      obj.$element.trigger('dynatable:push', data);

      cache = { dynatable: { dataset: settings.dataset } };
      if (!firstPush) { cache.dynatable.scrollTop = $(window).scrollTop(); }
      cacheStr = JSON.stringify(cache);

      // Mozilla has a 640k char limit on what can be stored in pushState.
      // See "limit" in https://developer.mozilla.org/en/DOM/Manipulating_the_browser_history#The_pushState().C2.A0method
      // and "dataStr.length" in http://wine.git.sourceforge.net/git/gitweb.cgi?p=wine/wine-gecko;a=patch;h=43a11bdddc5fc1ff102278a120be66a7b90afe28
      //
      // Likewise, other browsers may have varying (undocumented) limits.
      // Also, Firefox's limit can be changed in about:config as browser.history.maxStateObjectSize
      // Since we don't know what the actual limit will be in any given situation, we'll just try caching and rescue
      // any exceptions by retrying pushState without caching the records.
      //
      // I have absolutely no idea why perPageOptions suddenly becomes an array-like object instead of an array,
      // but just recently, this started throwing an error if I don't convert it:
      // 'Uncaught Error: DATA_CLONE_ERR: DOM Exception 25'
      cache.dynatable.dataset.perPageOptions = $.makeArray(cache.dynatable.dataset.perPageOptions);

      try {
        window.history[pushFunction](cache, "Dynatable state", path + params + hash);
      } catch(error) {
        // Make cached records = null, so that `pop` will rerun process to retrieve records
        cache.dynatable.dataset.records = null;
        window.history[pushFunction](cache, "Dynatable state", path + params + hash);
      }
    };

    this.pop = function(event) {
      var data = event.state.dynatable;
      settings.dataset = data.dataset;

      if (data.scrollTop) { $(window).scrollTop(data.scrollTop); }

      // If dataset.records is cached from pushState
      if ( data.dataset.records ) {
        obj.dom.update();
      } else {
        obj.process(true);
      }
    };
  };

  return State;
}


},{}],15:[function(require,module,exports){
module.exports = defaultAttributeReader;

function defaultAttributeReader(cell, record) {
  return $(cell).html();
};

},{}],16:[function(require,module,exports){
module.exports = exports = {
  normalizeText: function(text, style) {
    text = this.textTransform[style](text);
    return text;
  },
  textTransform: {
    trimDash: function(text) {
      return text.replace(/^\s+|\s+$/g, "").replace(/\s+/g, "-");
    },
    camelCase: function(text) {
      text = this.trimDash(text);
      return text
        .replace(/(\-[a-zA-Z])/g, function($1){return $1.toUpperCase().replace('-','');})
        .replace(/([A-Z])([A-Z]+)/g, function($1,$2,$3){return $2 + $3.toLowerCase();})
        .replace(/^[A-Z]/, function($1){return $1.toLowerCase();});
    },
    dashed: function(text) {
      text = this.trimDash(text);
      return this.lowercase(text);
    },
    underscore: function(text) {
      text = this.trimDash(text);
      return this.lowercase(text.replace(/(-)/g, '_'));
    },
    lowercase: function(text) {
      return text.replace(/([A-Z])/g, function($1){return $1.toLowerCase();});
    }
  },
  // Deserialize params in URL to object
  // see http://stackoverflow.com/questions/1131630/javascript-jquery-param-inverse-function/3401265#3401265
  deserialize: function(query) {
    if (!query) return {};
    // modified to accept an array of partial URL strings
    if (typeof(query) === "object") { query = query.join('&'); }

    var hash = {},
        vars = query.split("&");

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("="),
          k = decodeURIComponent(pair[0]),
          v, m;

      if (!pair[1]) { continue };
      v = decodeURIComponent(pair[1].replace(/\+/g, ' '));

      // modified to parse multi-level parameters (e.g. "hi[there][dude]=whatsup" => hi: {there: {dude: "whatsup"}})
      while (m = k.match(/([^&=]+)\[([^&=]+)\]$/)) {
        var origV = v;
        k = m[1];
        v = {};

        // If nested param ends in '][', then the regex above erroneously included half of a trailing '[]',
        // which indicates the end-value is part of an array
        if (m[2].substr(m[2].length-2) == '][') { // must use substr for IE to understand it
          v[m[2].substr(0,m[2].length-2)] = [origV];
        } else {
          v[m[2]] = origV;
        }
      }

      // If it is the first entry with this name
      if (typeof hash[k] === "undefined") {
        if (k.substr(k.length-2) != '[]') { // not end with []. cannot use negative index as IE doesn't understand it
          hash[k] = v;
        } else {
          hash[k] = [v];
        }
      // If subsequent entry with this name and not array
      } else if (typeof hash[k] === "string") {
        hash[k] = v;  // replace it
      // modified to add support for objects
      } else if (typeof hash[k] === "object") {
        hash[k] = $.extend({}, hash[k], v);
      // If subsequent entry with this name and is array
      } else {
        hash[k].push(v);
      }
    }
    return hash;
  },
  refreshQueryString: function(urlString, data, settings) {
    var _this = this,
        queryString = urlString.split('?'),
        path = queryString.shift(),
        urlOptions;

    urlOptions = this.deserialize(urlString);

    // Loop through each dynatable param and update the URL with it
    for (attr in settings.params) {
      if (settings.params.hasOwnProperty(attr)) {
        var label = settings.params[attr];
        // Skip over parameters matching attributes for disabled features (i.e. leave them untouched),
        // because if the feature is turned off, then parameter name is a coincidence and it's unrelated to dynatable.
        if (
          (!settings.features.sort && attr == "sorts") ||
            (!settings.features.paginate && _this.anyMatch(attr, ["page", "perPage", "offset"], function(attr, param) { return attr == param; }))
        ) {
          continue;
        }

        // Delete page and offset from url params if on page 1 (default)
        if ((attr === "page" || attr === "offset") && data["page"] === 1) {
          if (urlOptions[label]) {
            delete urlOptions[label];
          }
          continue;
        }

        // Delete perPage from url params if default perPage value
        if (attr === "perPage" && data[label] == settings.dataset.perPageDefault) {
          if (urlOptions[label]) {
            delete urlOptions[label];
          }
          continue;
        }

        // For queries, we're going to handle each possible query parameter individually here instead of
        // handling the entire queries object below, since we need to make sure that this is a query controlled by dynatable.
        if (attr == "queries" && data[label]) {
          var queries = settings.inputs.queries || [],
              inputQueries = $.makeArray(queries.map(function() { return $(this).attr('name') }));

          if (settings.features.search) { inputQueries.push('search'); }

          for (var i = 0, len = inputQueries.length; i < len; i++) {
            var attr = inputQueries[i];
            if (data[label][attr]) {
              if (typeof urlOptions[label] === 'undefined') { urlOptions[label] = {}; }
              urlOptions[label][attr] = data[label][attr];
            } else {
              if (urlOptions && urlOptions[label] && urlOptions[label][attr]) { delete urlOptions[label][attr]; }
            }
          }
          continue;
        }

        // If we haven't returned true by now, then we actually want to update the parameter in the URL
        if (data[label]) {
          urlOptions[label] = data[label];
        } else {
          delete urlOptions[label];
        }
      }
    }
    return $.param(urlOptions);
  },
  // Get array of keys from object
  // see http://stackoverflow.com/questions/208016/how-to-list-the-properties-of-a-javascript-object/208020#208020
  keysFromObject: function(obj){
    var keys = [];
    for (var key in obj){
      keys.push(key);
    }
    return keys;
  },
  // Find an object in an array of objects by attributes.
  // E.g. find object with {id: 'hi', name: 'there'} in an array of objects
  findObjectInArray: function(array, objectAttr) {
    var _this = this,
        foundObject;
    for (var i = 0, len = array.length; i < len; i++) {
      var item = array[i];
      // For each object in array, test to make sure all attributes in objectAttr match
      if (_this.allMatch(item, objectAttr, function(item, key, value) { return item[key] == value; })) {
        foundObject = item;
        break;
      }
    }
    return foundObject;
  },
  // Return true if supplied test function passes for ALL items in an array
  allMatch: function(item, arrayOrObject, test) {
    // start off with true result by default
    var match = true,
        isArray = $.isArray(arrayOrObject);
    // Loop through all items in array
    $.each(arrayOrObject, function(key, value) {
      var result = isArray ? test(item, value) : test(item, key, value);
      // If a single item tests false, go ahead and break the array by returning false
      // and return false as result,
      // otherwise, continue with next iteration in loop
      // (if we make it through all iterations without overriding match with false,
      // then we can return the true result we started with by default)
      if (!result) { return match = false; }
    });
    return match;
  },
  // Return true if supplied test function passes for ANY items in an array
  anyMatch: function(item, arrayOrObject, test) {
    var match = false,
        isArray = $.isArray(arrayOrObject);

    $.each(arrayOrObject, function(key, value) {
      var result = isArray ? test(item, value) : test(item, key, value);
      if (result) {
        // As soon as a match is found, set match to true, and return false to stop the `$.each` loop
        match = true;
        return false;
      }
    });
    return match;
  },
  // Return true if two objects are equal
  // (i.e. have the same attributes and attribute values)
  objectsEqual: function(a, b) {
    for (attr in a) {
      if (a.hasOwnProperty(attr)) {
        if (!b.hasOwnProperty(attr) || a[attr] !== b[attr]) {
          return false;
        }
      }
    }
    for (attr in b) {
      if (b.hasOwnProperty(attr) && !a.hasOwnProperty(attr)) {
        return false;
      }
    }
    return true;
  },
  // Taken from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/105074#105074
  randomHash: function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  },
  // Adapted from http://stackoverflow.com/questions/377961/efficient-javascript-string-replacement/378001#378001
  template: function(str, data) {
    return str.replace(/{(\w*)}/g, function(match, key) {
      return data.hasOwnProperty(key) ? data[key] : "";
    });
  }
};

},{}],17:[function(require,module,exports){
module.exports = defaultAttributeWriter;

function defaultAttributeWriter(record) {
  // `this` is the column object in settings.columns
  // TODO: automatically convert common types, such as arrays and objects, to string
  return record[this.id];
};

},{}],18:[function(require,module,exports){
module.exports = defaultCellWriter;

function defaultCellWriter(column, record) {
  var html = column.attributeWriter(record),
      td = '<td';

  if (column.hidden || column.textAlign) {
    td += ' style="';

    // keep cells for hidden column headers hidden
    if (column.hidden) {
      td += 'display: none;';
    }

    // keep cells aligned as their column headers are aligned
    if (column.textAlign) {
      td += 'text-align: ' + column.textAlign + ';';
    }

    td += '"';
  }

  if (column.cssClass) {
    td += ' class="' + column.cssClass + '"';
  }

  return td + '>' + html + '</td>';
};

},{}],19:[function(require,module,exports){
module.exports = defaultRowWriter;

function defaultRowWriter(rowIndex, record, columns, cellWriter) {
  var tr = '';

  // grab the record's attribute for each column
  for (var i = 0, len = columns.length; i < len; i++) {
    tr += cellWriter(columns[i], record);
  }

  return '<tr>' + tr + '</tr>';
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbW9kZWxzL2RvbS9jb2x1bW5zLmpzIiwic3JjL21vZGVscy9kb20vaW5kZXguanMiLCJzcmMvbW9kZWxzL2lucHV0c19zZWFyY2guanMiLCJzcmMvbW9kZWxzL3BhZ2luYXRpb24vbGlua3MuanMiLCJzcmMvbW9kZWxzL3BhZ2luYXRpb24vcGFnZS5qcyIsInNyYy9tb2RlbHMvcGFnaW5hdGlvbi9wZXJfcGFnZS5qcyIsInNyYy9tb2RlbHMvcHJvY2Vzc2luZ19pbmRpY2F0b3IuanMiLCJzcmMvbW9kZWxzL3F1ZXJpZXMuanMiLCJzcmMvbW9kZWxzL3JlY29yZHMvY291bnQuanMiLCJzcmMvbW9kZWxzL3JlY29yZHMvaW5kZXguanMiLCJzcmMvbW9kZWxzL3NvcnRzL2hlYWRlcnMuanMiLCJzcmMvbW9kZWxzL3NvcnRzL2luZGV4LmpzIiwic3JjL21vZGVscy9zdGF0ZS5qcyIsInNyYy9yZWFkZXJzL2F0dHJpYnV0ZS5qcyIsInNyYy91dGlscy9pbmRleC5qcyIsInNyYy93cml0ZXJzL2F0dHJpYnV0ZS5qcyIsInNyYy93cml0ZXJzL2NlbGwuanMiLCJzcmMvd3JpdGVycy9yb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogalF1ZXJ5IER5bmF0YWJsZSBwbHVnaW4gMC4zLjJcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgU3RldmUgU2Nod2FydHogKEphbmdvU3RldmUpXG4gKlxuICogRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgQUdQTCBhbmQgUHJvcHJpZXRhcnkgbGljZW5zZXM6XG4gKiAgIGh0dHA6Ly93d3cuZHluYXRhYmxlLmNvbS9saWNlbnNlL1xuICpcbiAqIERhdGU6IFR1ZSBKYW4gMDIgMjAxNFxuICovXG5cbnZhciBEb20gPSByZXF1aXJlKCcuL21vZGVscy9kb20nKTtcbnZhciBEb21Db2x1bW5zID0gcmVxdWlyZSgnLi9tb2RlbHMvZG9tL2NvbHVtbnMnKTtcbnZhciBSZWNvcmRzID0gcmVxdWlyZSgnLi9tb2RlbHMvcmVjb3JkcycpO1xudmFyIFJlY29yZHNDb3VudCA9IHJlcXVpcmUoJy4vbW9kZWxzL3JlY29yZHMvY291bnQnKTtcbnZhciBQcm9jZXNzaW5nSW5kaWNhdG9yID0gcmVxdWlyZSgnLi9tb2RlbHMvcHJvY2Vzc2luZ19pbmRpY2F0b3InKTtcbnZhciBTdGF0ZSA9IHJlcXVpcmUoJy4vbW9kZWxzL3N0YXRlJyk7XG52YXIgU29ydHMgPSByZXF1aXJlKCcuL21vZGVscy9zb3J0cycpO1xudmFyIFNvcnRzSGVhZGVycyA9IHJlcXVpcmUoJy4vbW9kZWxzL3NvcnRzL2hlYWRlcnMnKTtcbnZhciBRdWVyaWVzID0gcmVxdWlyZSgnLi9tb2RlbHMvcXVlcmllcycpO1xudmFyIElucHV0c1NlYXJjaCA9IHJlcXVpcmUoJy4vbW9kZWxzL2lucHV0c19zZWFyY2gnKTtcbnZhciBQYWdpbmF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vbW9kZWxzL3BhZ2luYXRpb24vcGFnZScpO1xudmFyIFBhZ2luYXRpb25QZXJQYWdlID0gcmVxdWlyZSgnLi9tb2RlbHMvcGFnaW5hdGlvbi9wZXJfcGFnZScpO1xudmFyIFBhZ2luYXRpb25MaW5rcyA9IHJlcXVpcmUoJy4vbW9kZWxzL3BhZ2luYXRpb24vbGlua3MnKTtcblxudmFyIHV0aWxpdHkgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBkZWZhdWx0Um93V3JpdGVyID0gcmVxdWlyZSgnLi93cml0ZXJzL3JvdycpO1xudmFyIGRlZmF1bHRDZWxsV3JpdGVyID0gcmVxdWlyZSgnLi93cml0ZXJzL2NlbGwnKTtcbnZhciBkZWZhdWx0QXR0cmlidXRlV3JpdGVyID0gcmVxdWlyZSgnLi93cml0ZXJzL2F0dHJpYnV0ZScpO1xudmFyIGRlZmF1bHRBdHRyaWJ1dGVSZWFkZXIgPSByZXF1aXJlKCcuL3JlYWRlcnMvYXR0cmlidXRlJyk7XG5cbihmdW5jdGlvbigkKSB7XG4gIHZhciBkZWZhdWx0cyxcbiAgICAgIG1lcmdlU2V0dGluZ3MsXG4gICAgICBkdCxcbiAgICAgIGJ1aWxkLFxuICAgICAgcHJvY2Vzc0FsbCxcbiAgICAgIE1vZHVsZSxcbiAgICAgIF9tb2R1bGVzO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gQ2FjaGVkIHBsdWdpbiBnbG9iYWwgZGVmYXVsdHNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGRlZmF1bHRzID0ge1xuICAgIGZlYXR1cmVzOiB7XG4gICAgICBwYWdpbmF0ZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IHRydWUsXG4gICAgICBwdXNoU3RhdGU6IHRydWUsXG4gICAgICBzZWFyY2g6IHRydWUsXG4gICAgICByZWNvcmRDb3VudDogdHJ1ZSxcbiAgICAgIHBlclBhZ2VTZWxlY3Q6IHRydWVcbiAgICB9LFxuICAgIHRhYmxlOiB7XG4gICAgICBkZWZhdWx0Q29sdW1uSWRTdHlsZTogJ2NhbWVsQ2FzZScsXG4gICAgICBjb2x1bW5zOiBudWxsLFxuICAgICAgaGVhZFJvd1NlbGVjdG9yOiAndGhlYWQgdHInLCAvLyBvciBlLmcuIHRyOmZpcnN0LWNoaWxkXG4gICAgICBib2R5Um93U2VsZWN0b3I6ICd0Ym9keSB0cicsXG4gICAgICBoZWFkUm93Q2xhc3M6IG51bGwsXG4gICAgICBjb3B5SGVhZGVyQWxpZ25tZW50OiB0cnVlLFxuICAgICAgY29weUhlYWRlckNsYXNzOiBmYWxzZVxuICAgIH0sXG4gICAgaW5wdXRzOiB7XG4gICAgICBxdWVyaWVzOiBudWxsLFxuICAgICAgc29ydHM6IG51bGwsXG4gICAgICBtdWx0aXNvcnQ6IFsnY3RybEtleScsICdzaGlmdEtleScsICdtZXRhS2V5J10sXG4gICAgICBwYWdlOiBudWxsLFxuICAgICAgcXVlcnlFdmVudDogJ2JsdXIgY2hhbmdlJyxcbiAgICAgIHJlY29yZENvdW50VGFyZ2V0OiBudWxsLFxuICAgICAgcmVjb3JkQ291bnRQbGFjZW1lbnQ6ICdhcHBlbmQnLFxuICAgICAgcGFnaW5hdGlvbkxpbmtUYXJnZXQ6IG51bGwsXG4gICAgICBwYWdpbmF0aW9uTGlua1BsYWNlbWVudDogJ2FwcGVuZCcsXG4gICAgICBwYWdpbmF0aW9uQ2xhc3M6ICdkeW5hdGFibGUtcGFnaW5hdGlvbi1saW5rcycsXG4gICAgICBwYWdpbmF0aW9uTGlua0NsYXNzOiAnZHluYXRhYmxlLXBhZ2UtbGluaycsXG4gICAgICBwYWdpbmF0aW9uUHJldkNsYXNzOiAnZHluYXRhYmxlLXBhZ2UtcHJldicsXG4gICAgICBwYWdpbmF0aW9uTmV4dENsYXNzOiAnZHluYXRhYmxlLXBhZ2UtbmV4dCcsXG4gICAgICBwYWdpbmF0aW9uQWN0aXZlQ2xhc3M6ICdkeW5hdGFibGUtYWN0aXZlLXBhZ2UnLFxuICAgICAgcGFnaW5hdGlvbkRpc2FibGVkQ2xhc3M6ICdkeW5hdGFibGUtZGlzYWJsZWQtcGFnZScsXG4gICAgICBwYWdpbmF0aW9uUHJldjogJ1ByZXZpb3VzJyxcbiAgICAgIHBhZ2luYXRpb25OZXh0OiAnTmV4dCcsXG4gICAgICBwYWdpbmF0aW9uR2FwOiBbMSwyLDIsMV0sXG4gICAgICBzZWFyY2hUYXJnZXQ6IG51bGwsXG4gICAgICBzZWFyY2hQbGFjZW1lbnQ6ICdwcmVwZW5kJyxcbiAgICAgIHNlYXJjaFRleHQ6ICdTZWFyY2g6ICcsXG4gICAgICBwZXJQYWdlVGFyZ2V0OiBudWxsLFxuICAgICAgcGVyUGFnZVBsYWNlbWVudDogJ3ByZXBlbmQnLFxuICAgICAgcGVyUGFnZVRleHQ6ICdTaG93OiAnLFxuICAgICAgcGFnZVRleHQ6ICdQYWdlczogJyxcbiAgICAgIHJlY29yZENvdW50UGFnZUJvdW5kVGVtcGxhdGU6ICd7cGFnZUxvd2VyQm91bmR9IHRvIHtwYWdlVXBwZXJCb3VuZH0gb2YnLFxuICAgICAgcmVjb3JkQ291bnRQYWdlVW5ib3VuZGVkVGVtcGxhdGU6ICd7cmVjb3Jkc1Nob3dufSBvZicsXG4gICAgICByZWNvcmRDb3VudFRvdGFsVGVtcGxhdGU6ICd7cmVjb3Jkc1F1ZXJ5Q291bnR9IHtjb2xsZWN0aW9uTmFtZX0nLFxuICAgICAgcmVjb3JkQ291bnRGaWx0ZXJlZFRlbXBsYXRlOiAnIChmaWx0ZXJlZCBmcm9tIHtyZWNvcmRzVG90YWx9IHRvdGFsIHJlY29yZHMpJyxcbiAgICAgIHJlY29yZENvdW50VGV4dDogJ1Nob3dpbmcnLFxuICAgICAgcmVjb3JkQ291bnRUZXh0VGVtcGxhdGU6ICd7dGV4dH0ge3BhZ2VUZW1wbGF0ZX0ge3RvdGFsVGVtcGxhdGV9IHtmaWx0ZXJlZFRlbXBsYXRlfScsXG4gICAgICByZWNvcmRDb3VudFRlbXBsYXRlOiAnPHNwYW4gaWQ9XCJkeW5hdGFibGUtcmVjb3JkLWNvdW50LXtlbGVtZW50SWR9XCIgY2xhc3M9XCJkeW5hdGFibGUtcmVjb3JkLWNvdW50XCI+e3RleHRUZW1wbGF0ZX08L3NwYW4+JyxcbiAgICAgIHByb2Nlc3NpbmdUZXh0OiAnUHJvY2Vzc2luZy4uLidcbiAgICB9LFxuICAgIGRhdGFzZXQ6IHtcbiAgICAgIGFqYXg6IGZhbHNlLFxuICAgICAgYWpheFVybDogbnVsbCxcbiAgICAgIGFqYXhDYWNoZTogbnVsbCxcbiAgICAgIGFqYXhPbkxvYWQ6IGZhbHNlLFxuICAgICAgYWpheE1ldGhvZDogJ0dFVCcsXG4gICAgICBhamF4RGF0YVR5cGU6ICdqc29uJyxcbiAgICAgIHRvdGFsUmVjb3JkQ291bnQ6IG51bGwsXG4gICAgICBxdWVyaWVzOiB7fSxcbiAgICAgIHF1ZXJ5UmVjb3JkQ291bnQ6IG51bGwsXG4gICAgICBwYWdlOiBudWxsLFxuICAgICAgcGVyUGFnZURlZmF1bHQ6IDEwLFxuICAgICAgcGVyUGFnZU9wdGlvbnM6IFsxMCwyMCw1MCwxMDBdLFxuICAgICAgc29ydHM6IHt9LFxuICAgICAgc29ydHNLZXlzOiBbXSxcbiAgICAgIHNvcnRUeXBlczoge30sXG4gICAgICByZWNvcmRzOiBudWxsXG4gICAgfSxcbiAgICB3cml0ZXJzOiB7XG4gICAgICBfcm93V3JpdGVyOiBkZWZhdWx0Um93V3JpdGVyLFxuICAgICAgX2NlbGxXcml0ZXI6IGRlZmF1bHRDZWxsV3JpdGVyLFxuICAgICAgX2F0dHJpYnV0ZVdyaXRlcjogZGVmYXVsdEF0dHJpYnV0ZVdyaXRlclxuICAgIH0sXG4gICAgcmVhZGVyczoge1xuICAgICAgX3Jvd1JlYWRlcjogbnVsbCxcbiAgICAgIF9hdHRyaWJ1dGVSZWFkZXI6IGRlZmF1bHRBdHRyaWJ1dGVSZWFkZXJcbiAgICB9LFxuICAgIHBhcmFtczoge1xuICAgICAgZHluYXRhYmxlOiAnZHluYXRhYmxlJyxcbiAgICAgIHF1ZXJpZXM6ICdxdWVyaWVzJyxcbiAgICAgIHNvcnRzOiAnc29ydHMnLFxuICAgICAgcGFnZTogJ3BhZ2UnLFxuICAgICAgcGVyUGFnZTogJ3BlclBhZ2UnLFxuICAgICAgb2Zmc2V0OiAnb2Zmc2V0JyxcbiAgICAgIHJlY29yZHM6ICdyZWNvcmRzJyxcbiAgICAgIHJlY29yZDogbnVsbCxcbiAgICAgIHF1ZXJ5UmVjb3JkQ291bnQ6ICdxdWVyeVJlY29yZENvdW50JyxcbiAgICAgIHRvdGFsUmVjb3JkQ291bnQ6ICd0b3RhbFJlY29yZENvdW50J1xuICAgIH1cbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEVhY2ggZHluYXRhYmxlIGluc3RhbmNlIGluaGVyaXRzIGZyb20gdGhpcyxcbiAgLy8gc2V0IHByb3BlcnRpZXMgc3BlY2lmaWMgdG8gaW5zdGFuY2VcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGR0ID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBtZXJnZVNldHRpbmdzKG9wdGlvbnMpO1xuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuXG4gICAgICAvLyBBbGwgdGhlIHNldHVwIHRoYXQgZG9lc24ndCByZXF1aXJlIGVsZW1lbnQgb3Igb3B0aW9uc1xuICAgICAgYnVpbGQuY2FsbCh0aGlzKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKHNraXBQdXNoU3RhdGUpIHtcbiAgICAgIHByb2Nlc3NBbGwuY2FsbCh0aGlzLCBza2lwUHVzaFN0YXRlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBNb2R1bGVzXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICB2YXIgTW9kdWxlID0ge1xuICAgIGluaXRPbkxvYWQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICBpbml0OiBmdW5jdGlvbigpIHt9XG4gIH07XG5cbiAgZGVmYXVsdHMubW9kdWxlcyA9IFtcbiAgICBEb20sXG4gICAgRG9tQ29sdW1ucyxcbiAgICBSZWNvcmRzLFxuICAgIFJlY29yZHNDb3VudCxcbiAgICBQcm9jZXNzaW5nSW5kaWNhdG9yLFxuICAgIFN0YXRlLFxuICAgIFNvcnRzLFxuICAgIFNvcnRzSGVhZGVycyxcbiAgICBRdWVyaWVzLFxuICAgIElucHV0c1NlYXJjaCxcbiAgICBQYWdpbmF0aW9uUGFnZSxcbiAgICBQYWdpbmF0aW9uUGVyUGFnZSxcbiAgICBQYWdpbmF0aW9uTGlua3NcbiAgXTtcblxuICBmdW5jdGlvbiBsb2FkTW9kdWxlKG9iaikge1xuICAgIHZhciBtb2R1bGUgPSBvYmooZHQsIHV0aWxpdHkpO1xuICAgIGlmKHR5cGVvZiBfbW9kdWxlcyA9PT0gJ3VuZGVmaW5lZCcpIF9tb2R1bGVzID0ge307XG4gICAgX21vZHVsZXNbbW9kdWxlLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5uYW1lXSA9IG1vZHVsZTtcbiAgICBtb2R1bGUucHJvdG90eXBlID0gTW9kdWxlO1xuICB9XG5cbiAgZm9yKHZhciBpID0gMDsgaSA8IGRlZmF1bHRzLm1vZHVsZXMubGVuZ3RoOyBpICsrKSB7XG4gICAgdmFyIG1vZHVsZSA9IGRlZmF1bHRzLm1vZHVsZXNbaV07XG4gICAgbG9hZE1vZHVsZShtb2R1bGUpO1xuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBDYWNoZWQgcGx1Z2luIGdsb2JhbCBmdW5jdGlvbnNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIG1lcmdlU2V0dGluZ3MgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIG5ld09wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgLy8gVE9ETzogZmlndXJlIG91dCBhIGJldHRlciB3YXkgdG8gZG8gdGhpcy5cbiAgICAvLyBEb2luZyBgZXh0ZW5kKHRydWUpYCBjYXVzZXMgYW55IGVsZW1lbnRzIHRoYXQgYXJlIGFycmF5c1xuICAgIC8vIHRvIG1lcmdlIHRoZSBkZWZhdWx0IGFuZCBvcHRpb25zIGFycmF5cyBpbnN0ZWFkIG9mIG92ZXJyaWRpbmcgdGhlIGRlZmF1bHRzLlxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucy5pbnB1dHMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW5wdXRzLm11bHRpc29ydCkge1xuICAgICAgICAgIG5ld09wdGlvbnMuaW5wdXRzLm11bHRpc29ydCA9IG9wdGlvbnMuaW5wdXRzLm11bHRpc29ydDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dHMucGFnaW5hdGlvbkdhcCkge1xuICAgICAgICAgIG5ld09wdGlvbnMuaW5wdXRzLnBhZ2luYXRpb25HYXAgPSBvcHRpb25zLmlucHV0cy5wYWdpbmF0aW9uR2FwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5kYXRhc2V0ICYmIG9wdGlvbnMuZGF0YXNldC5wZXJQYWdlT3B0aW9ucykge1xuICAgICAgICBuZXdPcHRpb25zLmRhdGFzZXQucGVyUGFnZU9wdGlvbnMgPSBvcHRpb25zLmRhdGFzZXQucGVyUGFnZU9wdGlvbnM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09wdGlvbnM7XG4gIH07XG5cbiAgYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2R5bmF0YWJsZTpwcmVpbml0JywgdGhpcyk7XG5cbiAgICBmb3IobW9kdWxlIGluIF9tb2R1bGVzKSB7XG4gICAgICB2YXIgbW9kdWxlSW5zdGFuY2UgPSB0aGlzW3V0aWxpdHkudGV4dFRyYW5zZm9ybS5jYW1lbENhc2UobW9kdWxlKV0gPSBuZXcgX21vZHVsZXNbbW9kdWxlXSh0aGlzLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIGlmKG1vZHVsZUluc3RhbmNlLmluaXRPbkxvYWQoKSkgbW9kdWxlSW5zdGFuY2UuaW5pdCgpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZHluYXRhYmxlOmluaXQnLCB0aGlzKTtcblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5kYXRhc2V0LmFqYXggfHwgKHRoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4ICYmIHRoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4T25Mb2FkKSB8fCB0aGlzLnNldHRpbmdzLmZlYXR1cmVzLnBhZ2luYXRlIHx8ICh0aGlzLnNldHRpbmdzLmZlYXR1cmVzLnNvcnQgJiYgISQuaXNFbXB0eU9iamVjdCh0aGlzLnNldHRpbmdzLmRhdGFzZXQuc29ydHMpKSkge1xuICAgICAgdGhpcy5wcm9jZXNzKCk7XG4gICAgfVxuICB9O1xuXG4gIHByb2Nlc3NBbGwgPSBmdW5jdGlvbihza2lwUHVzaFN0YXRlKSB7XG4gICAgdmFyIGRhdGEgPSB7fTtcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZHluYXRhYmxlOmJlZm9yZVByb2Nlc3MnLCBkYXRhKTtcblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHRoaXMuc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzKSkgeyBkYXRhW3RoaXMuc2V0dGluZ3MucGFyYW1zLnF1ZXJpZXNdID0gdGhpcy5zZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXM7IH1cbiAgICAvLyBUT0RPOiBXcmFwIHRoaXMgaW4gYSB0cnkvcmVzY3VlIGJsb2NrIHRvIGhpZGUgdGhlIHByb2Nlc3NpbmcgaW5kaWNhdG9yIGFuZCBpbmRpY2F0ZSBzb21ldGhpbmcgd2VudCB3cm9uZyBpZiBlcnJvclxuICAgIHRoaXMucHJvY2Vzc2luZ0luZGljYXRvci5zaG93KCk7XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5mZWF0dXJlcy5zb3J0ICYmICEkLmlzRW1wdHlPYmplY3QodGhpcy5zZXR0aW5ncy5kYXRhc2V0LnNvcnRzKSkgeyBkYXRhW3RoaXMuc2V0dGluZ3MucGFyYW1zLnNvcnRzXSA9IHRoaXMuc2V0dGluZ3MuZGF0YXNldC5zb3J0czsgfVxuICAgIGlmICh0aGlzLnNldHRpbmdzLmZlYXR1cmVzLnBhZ2luYXRlICYmIHRoaXMuc2V0dGluZ3MuZGF0YXNldC5wYWdlKSB7XG4gICAgICB2YXIgcGFnZSA9IHRoaXMuc2V0dGluZ3MuZGF0YXNldC5wYWdlLFxuICAgICAgICAgIHBlclBhZ2UgPSB0aGlzLnNldHRpbmdzLmRhdGFzZXQucGVyUGFnZTtcbiAgICAgIGRhdGFbdGhpcy5zZXR0aW5ncy5wYXJhbXMucGFnZV0gPSBwYWdlO1xuICAgICAgZGF0YVt0aGlzLnNldHRpbmdzLnBhcmFtcy5wZXJQYWdlXSA9IHBlclBhZ2U7XG4gICAgICBkYXRhW3RoaXMuc2V0dGluZ3MucGFyYW1zLm9mZnNldF0gPSAocGFnZSAtIDEpICogcGVyUGFnZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4RGF0YSkgeyAkLmV4dGVuZChkYXRhLCB0aGlzLnNldHRpbmdzLmRhdGFzZXQuYWpheERhdGEpOyB9XG5cbiAgICAvLyBJZiBhamF4LCBzZW5kcyBxdWVyeSB0byBhamF4VXJsIHdpdGggcXVlcmllcyBhbmQgc29ydHMgc2VyaWFsaXplZCBhbmQgYXBwZW5kZWQgaW4gYWpheCBkYXRhXG4gICAgLy8gb3RoZXJ3aXNlLCBleGVjdXRlcyBxdWVyaWVzIGFuZCBzb3J0cyBvbiBpbi1wYWdlIGRhdGFcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5kYXRhc2V0LmFqYXgpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgdHlwZTogX3RoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4TWV0aG9kLFxuICAgICAgICBkYXRhVHlwZTogX3RoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4RGF0YVR5cGUsXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIGVycm9yKSB7XG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignZHluYXRhYmxlOmFqYXg6ZXJyb3InLCB7eGhyOiB4aHIsIGVycm9yIDogZXJyb3J9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6YWpheDpzdWNjZXNzJywgcmVzcG9uc2UpO1xuICAgICAgICAgIC8vIE1lcmdlIGFqYXggcmVzdWx0cyBhbmQgbWV0YS1kYXRhIGludG8gZHluYXRhYmxlcyBjYWNoZWQgZGF0YVxuICAgICAgICAgIF90aGlzLnJlY29yZHMudXBkYXRlRnJvbUpzb24ocmVzcG9uc2UpO1xuICAgICAgICAgIC8vIHVwZGF0ZSB0YWJsZSB3aXRoIG5ldyByZWNvcmRzXG4gICAgICAgICAgX3RoaXMuZG9tLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgaWYgKCFza2lwUHVzaFN0YXRlICYmIF90aGlzLnN0YXRlLmluaXRPbkxvYWQoKSkge1xuICAgICAgICAgICAgX3RoaXMuc3RhdGUucHVzaChkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5wcm9jZXNzaW5nSW5kaWNhdG9yLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vIERvIG5vdCBwYXNzIHVybCB0byBgYWpheGAgb3B0aW9ucyBpZiBibGFua1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZGF0YXNldC5hamF4VXJsKSB7XG4gICAgICAgIG9wdGlvbnMudXJsID0gdGhpcy5zZXR0aW5ncy5kYXRhc2V0LmFqYXhVcmw7XG5cbiAgICAgIC8vIElmIGFqYXhVcmwgaXMgYmxhbmssIHRoZW4gd2UncmUgdXNpbmcgdGhlIGN1cnJlbnQgcGFnZSBVUkwsXG4gICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBhbnkgcXVlcnksIHNvcnQsIG9yIHBhZ2UgZGF0YSBjb250cm9sbGVkIGJ5IGR5bmF0YWJsZVxuICAgICAgLy8gdGhhdCBtYXkgaGF2ZSBiZWVuIGluIFVSTCB3aGVuIHBhZ2UgbG9hZGVkLCBzbyB0aGF0IGl0IGRvZXNuJ3QgY29uZmxpY3Qgd2l0aFxuICAgICAgLy8gd2hhdCdzIHBhc3NlZCBpbiB3aXRoIHRoZSBkYXRhIGFqYXggcGFyYW1ldGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLnVybCA9IHV0aWxpdHkucmVmcmVzaFF1ZXJ5U3RyaW5nKHdpbmRvdy5sb2NhdGlvbi5ocmVmLCB7fSwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5kYXRhc2V0LmFqYXhDYWNoZSAhPT0gbnVsbCkgeyBvcHRpb25zLmNhY2hlID0gdGhpcy5zZXR0aW5ncy5kYXRhc2V0LmFqYXhDYWNoZTsgfVxuXG4gICAgICAkLmFqYXgob3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVjb3Jkcy5yZXNldE9yaWdpbmFsKCk7XG4gICAgICB0aGlzLnF1ZXJpZXMucnVuKCk7XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5mZWF0dXJlcy5zb3J0KSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zb3J0KCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5mZWF0dXJlcy5wYWdpbmF0ZSkge1xuICAgICAgICB0aGlzLnJlY29yZHMucGFnaW5hdGUoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZG9tLnVwZGF0ZSgpO1xuICAgICAgdGhpcy5wcm9jZXNzaW5nSW5kaWNhdG9yLmhpZGUoKTtcblxuICAgICAgaWYgKCFza2lwUHVzaFN0YXRlICYmIHRoaXMuc3RhdGUuaW5pdE9uTG9hZCgpKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucHVzaChkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdkeW5hdGFibGUtbG9hZGVkJyk7XG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6YWZ0ZXJQcm9jZXNzJywgZGF0YSk7XG4gIH07XG5cbiAgZHQudXRpbGl0eSA9IHV0aWxpdHk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBCdWlsZCB0aGUgZHluYXRhYmxlIHBsdWdpblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gT2JqZWN0LmNyZWF0ZSBzdXBwb3J0IHRlc3QsIGFuZCBmYWxsYmFjayBmb3IgYnJvd3NlcnMgd2l0aG91dCBpdFxuICBpZiAoIHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSBcImZ1bmN0aW9uXCIgKSB7XG4gICAgT2JqZWN0LmNyZWF0ZSA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICBmdW5jdGlvbiBGKCkge31cbiAgICAgIEYucHJvdG90eXBlID0gbztcbiAgICAgIHJldHVybiBuZXcgRigpO1xuICAgIH07XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEdsb2JhbCBkeW5hdGFibGUgcGx1Z2luIHNldHRpbmcgZGVmYXVsdHNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICQuZHluYXRhYmxlU2V0dXAgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgZGVmYXVsdHMgPSBtZXJnZVNldHRpbmdzKG9wdGlvbnMpO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBkeW5hdGFibGUgcGx1Z2luIGJhc2VkIG9uIGEgZGVmaW5lZCBvYmplY3RcbiAgJC5keW5hdGFibGUgPSBmdW5jdGlvbiggb2JqZWN0ICkge1xuICAgICQuZm5bJ2R5bmF0YWJsZSddID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoICEgJC5kYXRhKCB0aGlzLCAnZHluYXRhYmxlJyApICkge1xuICAgICAgICAgICQuZGF0YSggdGhpcywgJ2R5bmF0YWJsZScsIE9iamVjdC5jcmVhdGUob2JqZWN0KS5pbml0KHRoaXMsIG9wdGlvbnMpICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgJC5keW5hdGFibGUoZHQpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gJC5keW5hdGFibGU7XG5cbn0pKGpRdWVyeSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZHQsIHV0aWxpdHkpIHtcbiAgZnVuY3Rpb24gRG9tQ29sdW1ucyhvYmosIHNldHRpbmdzKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuaW5pdE9uTG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG9iai4kZWxlbWVudC5pcygndGFibGUnKTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZXR0aW5ncy50YWJsZS5jb2x1bW5zID0gW107XG4gICAgICB0aGlzLmdldEZyb21UYWJsZSgpO1xuICAgIH07XG5cbiAgICAvLyBpbml0aWFsaXplIHRhYmxlW2NvbHVtbnNdIGFycmF5XG4gICAgdGhpcy5nZXRGcm9tVGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkY29sdW1ucyA9IG9iai4kZWxlbWVudC5maW5kKHNldHRpbmdzLnRhYmxlLmhlYWRSb3dTZWxlY3RvcikuY2hpbGRyZW4oJ3RoLHRkJyk7XG4gICAgICBpZiAoJGNvbHVtbnMubGVuZ3RoKSB7XG4gICAgICAgICRjb2x1bW5zLmVhY2goZnVuY3Rpb24oaW5kZXgpe1xuICAgICAgICAgIF90aGlzLmFkZCgkKHRoaXMpLCBpbmRleCwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICQuZXJyb3IoXCJDb3VsZG4ndCBmaW5kIGFueSBjb2x1bW5zIGhlYWRlcnMgaW4gJ1wiICsgc2V0dGluZ3MudGFibGUuaGVhZFJvd1NlbGVjdG9yICsgXCIgdGgsdGQnLiBJZiB5b3VyIGhlYWRlciByb3cgaXMgZGlmZmVyZW50LCBzcGVjaWZ5IHRoZSBzZWxlY3RvciBpbiB0aGUgdGFibGU6IGhlYWRSb3dTZWxlY3RvciBvcHRpb24uXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKCRjb2x1bW4sIHBvc2l0aW9uLCBza2lwQXBwZW5kLCBza2lwVXBkYXRlKSB7XG4gICAgICB2YXIgY29sdW1ucyA9IHNldHRpbmdzLnRhYmxlLmNvbHVtbnMsXG4gICAgICBsYWJlbCA9ICRjb2x1bW4udGV4dCgpLFxuICAgICAgaWQgPSAkY29sdW1uLmRhdGEoJ2R5bmF0YWJsZS1jb2x1bW4nKSB8fCB1dGlsaXR5Lm5vcm1hbGl6ZVRleHQobGFiZWwsIHNldHRpbmdzLnRhYmxlLmRlZmF1bHRDb2x1bW5JZFN0eWxlKSxcbiAgICAgICAgZGF0YVNvcnRzID0gJGNvbHVtbi5kYXRhKCdkeW5hdGFibGUtc29ydHMnKSxcbiAgICAgICAgc29ydHMgPSBkYXRhU29ydHMgPyAkLm1hcChkYXRhU29ydHMuc3BsaXQoJywnKSwgZnVuY3Rpb24odGV4dCkgeyByZXR1cm4gJC50cmltKHRleHQpOyB9KSA6IFtpZF07XG5cbiAgICAgIC8vIElmIHRoZSBjb2x1bW4gaWQgaXMgYmxhbmssIGdlbmVyYXRlIGFuIGlkIGZvciBpdFxuICAgICAgaWYgKCAhaWQgKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGUoJGNvbHVtbik7XG4gICAgICAgIGlkID0gJGNvbHVtbi5kYXRhKCdkeW5hdGFibGUtY29sdW1uJyk7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29sdW1uIGRhdGEgdG8gcGx1Z2luIGluc3RhbmNlXG4gICAgICBjb2x1bW5zLnNwbGljZShwb3NpdGlvbiwgMCwge1xuICAgICAgICBpbmRleDogcG9zaXRpb24sXG4gICAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBhdHRyaWJ1dGVXcml0ZXI6IHNldHRpbmdzLndyaXRlcnNbaWRdIHx8IHNldHRpbmdzLndyaXRlcnMuX2F0dHJpYnV0ZVdyaXRlcixcbiAgICAgICAgYXR0cmlidXRlUmVhZGVyOiBzZXR0aW5ncy5yZWFkZXJzW2lkXSB8fCBzZXR0aW5ncy5yZWFkZXJzLl9hdHRyaWJ1dGVSZWFkZXIsXG4gICAgICAgIHNvcnRzOiBzb3J0cyxcbiAgICAgICAgaGlkZGVuOiAkY29sdW1uLmNzcygnZGlzcGxheScpID09PSAnbm9uZScsXG4gICAgICAgIHRleHRBbGlnbjogc2V0dGluZ3MudGFibGUuY29weUhlYWRlckFsaWdubWVudCAmJiAkY29sdW1uLmNzcygndGV4dC1hbGlnbicpLFxuICAgICAgICBjc3NDbGFzczogc2V0dGluZ3MudGFibGUuY29weUhlYWRlckNsYXNzICYmICRjb2x1bW4uYXR0cignY2xhc3MnKVxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1vZGlmeSBoZWFkZXIgY2VsbFxuICAgICAgJGNvbHVtblxuICAgICAgICAuYXR0cignZGF0YS1keW5hdGFibGUtY29sdW1uJywgaWQpXG4gICAgICAgIC5hZGRDbGFzcygnZHluYXRhYmxlLWhlYWQnKTtcbiAgICAgIGlmIChzZXR0aW5ncy50YWJsZS5oZWFkUm93Q2xhc3MpIHsgJGNvbHVtbi5hZGRDbGFzcyhzZXR0aW5ncy50YWJsZS5oZWFkUm93Q2xhc3MpOyB9XG5cbiAgICAgIC8vIEFwcGVuZCBjb2x1bW4gaGVhZGVyIHRvIHRhYmxlXG4gICAgICBpZiAoIXNraXBBcHBlbmQpIHtcbiAgICAgICAgdmFyIGRvbVBvc2l0aW9uID0gcG9zaXRpb24gKyAxLFxuICAgICAgICAgICRzaWJsaW5nID0gb2JqLiRlbGVtZW50LmZpbmQoc2V0dGluZ3MudGFibGUuaGVhZFJvd1NlbGVjdG9yKVxuICAgICAgICAgICAgLmNoaWxkcmVuKCd0aDpudGgtY2hpbGQoJyArIGRvbVBvc2l0aW9uICsgJyksdGQ6bnRoLWNoaWxkKCcgKyBkb21Qb3NpdGlvbiArICcpJykuZmlyc3QoKSxcbiAgICAgICAgICAgICAgICBjb2x1bW5zQWZ0ZXIgPSBjb2x1bW5zLnNsaWNlKHBvc2l0aW9uICsgMSwgY29sdW1ucy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRzaWJsaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgJHNpYmxpbmcuYmVmb3JlKCRjb2x1bW4pO1xuICAgICAgICAgICAgICAgICAgLy8gc2libGluZyBjb2x1bW4gZG9lc24ndCB5ZXQgZXhpc3QgKG1heWJlIHRoaXMgaXMgdGhlIGxhc3QgY29sdW1uIGluIHRoZSBoZWFkZXIgcm93KVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBvYmouJGVsZW1lbnQuZmluZChzZXR0aW5ncy50YWJsZS5oZWFkUm93U2VsZWN0b3IpLmFwcGVuZCgkY29sdW1uKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvYmouc29ydHNIZWFkZXJzLmF0dGFjaE9uZSgkY29sdW1uLmdldCgpKTtcblxuICAgICAgICAgICAgICAgIC8vIGluY3JlbWVudCB0aGUgaW5kZXggb2YgYWxsIGNvbHVtbnMgYWZ0ZXIgdGhpcyBvbmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICAgICAgICAgICAgICAgIGlmIChjb2x1bW5zQWZ0ZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29sdW1uc0FmdGVyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbnNBZnRlcltpXS5pbmRleCArPSAxO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghc2tpcFVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgb2JqLmRvbS51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkdDtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihjb2x1bW5JbmRleE9ySWQpIHtcbiAgICAgIHZhciBjb2x1bW5zID0gc2V0dGluZ3MudGFibGUuY29sdW1ucyxcbiAgICAgIGxlbmd0aCA9IGNvbHVtbnMubGVuZ3RoO1xuXG4gICAgICBpZiAodHlwZW9mKGNvbHVtbkluZGV4T3JJZCkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdmFyIGNvbHVtbiA9IGNvbHVtbnNbY29sdW1uSW5kZXhPcklkXTtcbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tVGFibGUoY29sdW1uLmlkKTtcbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQXJyYXkoY29sdW1uSW5kZXhPcklkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRyYXZlcnNlIGNvbHVtbnMgYXJyYXkgaW4gcmV2ZXJzZSBvcmRlciBzbyB0aGF0IHN1YnNlcXVlbnQgaW5kaWNlc1xuICAgICAgICAvLyBkb24ndCBnZXQgbWVzc2VkIHVwIHdoZW4gd2UgZGVsZXRlIGFuIGl0ZW0gZnJvbSB0aGUgYXJyYXkgaW4gYW4gaXRlcmF0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSBjb2x1bW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IGNvbHVtbnNbaV07XG5cbiAgICAgICAgICBpZiAoY29sdW1uLmlkID09PSBjb2x1bW5JbmRleE9ySWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRnJvbVRhYmxlKGNvbHVtbkluZGV4T3JJZCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUZyb21BcnJheShpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb2JqLmRvbS51cGRhdGUoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVGcm9tVGFibGUgPSBmdW5jdGlvbihjb2x1bW5JZCkge1xuICAgICAgb2JqLiRlbGVtZW50LmZpbmQoc2V0dGluZ3MudGFibGUuaGVhZFJvd1NlbGVjdG9yKS5jaGlsZHJlbignW2RhdGEtZHluYXRhYmxlLWNvbHVtbj1cIicgKyBjb2x1bW5JZCArICdcIl0nKS5maXJzdCgpXG4gICAgICAgIC5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVGcm9tQXJyYXkgPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgdmFyIGNvbHVtbnMgPSBzZXR0aW5ncy50YWJsZS5jb2x1bW5zLFxuICAgICAgYWRqdXN0Q29sdW1ucztcbiAgICAgIGNvbHVtbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGFkanVzdENvbHVtbnMgPSBjb2x1bW5zLnNsaWNlKGluZGV4LCBjb2x1bW5zLmxlbmd0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYWRqdXN0Q29sdW1ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBhZGp1c3RDb2x1bW5zW2ldLmluZGV4IC09IDE7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuZ2VuZXJhdGUgPSBmdW5jdGlvbigkY2VsbCkge1xuICAgICAgdmFyIGNlbGwgPSAkY2VsbCA9PT0gdW5kZWZpbmVkID8gJCgnPHRoPjwvdGg+JykgOiAkY2VsbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaEdlbmVyYXRlZEF0dHJpYnV0ZXMoY2VsbCk7XG4gICAgfTtcblxuICAgIHRoaXMuYXR0YWNoR2VuZXJhdGVkQXR0cmlidXRlcyA9IGZ1bmN0aW9uKCRjZWxsKSB7XG4gICAgICAvLyBVc2UgaW5jcmVtZW50IHRvIGNyZWF0ZSB1bmlxdWUgY29sdW1uIG5hbWUgdGhhdCBpcyB0aGUgc2FtZSBlYWNoIHRpbWUgdGhlIHBhZ2UgaXMgcmVsb2FkZWQsXG4gICAgICAvLyBpbiBvcmRlciB0byBhdm9pZCBlcnJvcnMgd2l0aCBtaXNtYXRjaGVkIGF0dHJpYnV0ZSBuYW1lcyB3aGVuIGxvYWRpbmcgY2FjaGVkIGBkYXRhc2V0LnJlY29yZHNgIGFycmF5XG4gICAgICB2YXIgaW5jcmVtZW50ID0gb2JqLiRlbGVtZW50LmZpbmQoc2V0dGluZ3MudGFibGUuaGVhZFJvd1NlbGVjdG9yKS5jaGlsZHJlbigndGhbZGF0YS1keW5hdGFibGUtZ2VuZXJhdGVkXScpLmxlbmd0aDtcbiAgICAgIHJldHVybiAkY2VsbFxuICAgICAgICAuYXR0cignZGF0YS1keW5hdGFibGUtY29sdW1uJywgJ2R5bmF0YWJsZS1nZW5lcmF0ZWQtJyArIGluY3JlbWVudCkgLy8rIHV0aWxpdHkucmFuZG9tSGFzaCgpLFxuICAgICAgICAuYXR0cignZGF0YS1keW5hdGFibGUtbm8tc29ydCcsICd0cnVlJylcbiAgICAgICAgICAuYXR0cignZGF0YS1keW5hdGFibGUtZ2VuZXJhdGVkJywgaW5jcmVtZW50KTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBEb21Db2x1bW5zO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIGZ1bmN0aW9uIERvbShvYmosIHNldHRpbmdzKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIHVwZGF0ZSB0YWJsZSBjb250ZW50cyB3aXRoIG5ldyByZWNvcmRzIGFycmF5XG4gICAgLy8gZnJvbSBxdWVyeSAod2hldGhlciBhamF4IG9yIG5vdClcbiAgICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvd3MgPSAnJyxcbiAgICAgICAgICBjb2x1bW5zID0gc2V0dGluZ3MudGFibGUuY29sdW1ucyxcbiAgICAgICAgICByb3dXcml0ZXIgPSBzZXR0aW5ncy53cml0ZXJzLl9yb3dXcml0ZXIsXG4gICAgICAgICAgY2VsbFdyaXRlciA9IHNldHRpbmdzLndyaXRlcnMuX2NlbGxXcml0ZXI7XG5cbiAgICAgIG9iai4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6YmVmb3JlVXBkYXRlJywgcm93cyk7XG5cbiAgICAgIC8vIGxvb3AgdGhyb3VnaCByZWNvcmRzXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciByZWNvcmQgPSBzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHNbaV0sXG4gICAgICAgICAgICB0ciA9IHJvd1dyaXRlcihpLCByZWNvcmQsIGNvbHVtbnMsIGNlbGxXcml0ZXIpO1xuICAgICAgICByb3dzICs9IHRyO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBlbmRlZCBkeW5hdGFibGUgaW50ZXJhY3RpdmUgZWxlbWVudHNcbiAgICAgIGlmIChzZXR0aW5ncy5mZWF0dXJlcy5yZWNvcmRDb3VudCkge1xuICAgICAgICAkKCcjZHluYXRhYmxlLXJlY29yZC1jb3VudC0nICsgb2JqLmVsZW1lbnQuaWQpLnJlcGxhY2VXaXRoKG9iai5yZWNvcmRzQ291bnQuY3JlYXRlKCkpO1xuICAgICAgfVxuICAgICAgaWYgKHNldHRpbmdzLmZlYXR1cmVzLnBhZ2luYXRlKSB7XG4gICAgICAgICQoJyNkeW5hdGFibGUtcGFnaW5hdGlvbi1saW5rcy0nICsgb2JqLmVsZW1lbnQuaWQpLnJlcGxhY2VXaXRoKG9iai5wYWdpbmF0aW9uTGlua3MuY3JlYXRlKCkpO1xuICAgICAgICBpZiAoc2V0dGluZ3MuZmVhdHVyZXMucGVyUGFnZVNlbGVjdCkge1xuICAgICAgICAgICQoJyNkeW5hdGFibGUtcGVyLXBhZ2UtJyArIG9iai5lbGVtZW50LmlkKS52YWwocGFyc2VJbnQoc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU29ydCBoZWFkZXJzIGZ1bmN0aW9uYWxpdHlcbiAgICAgIGlmIChzZXR0aW5ncy5mZWF0dXJlcy5zb3J0ICYmIGNvbHVtbnMpIHtcbiAgICAgICAgb2JqLnNvcnRzSGVhZGVycy5yZW1vdmVBbGxBcnJvd3MoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbHVtbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICB2YXIgY29sdW1uID0gY29sdW1uc1tpXSxcbiAgICAgICAgICAgICAgc29ydGVkQnlDb2x1bW4gPSB1dGlsaXR5LmFsbE1hdGNoKHNldHRpbmdzLmRhdGFzZXQuc29ydHMsIGNvbHVtbi5zb3J0cywgZnVuY3Rpb24oc29ydHMsIHNvcnQpIHsgcmV0dXJuIHNvcnQgaW4gc29ydHM7IH0pLFxuICAgICAgICAgICAgICB2YWx1ZSA9IHNldHRpbmdzLmRhdGFzZXQuc29ydHNbY29sdW1uLnNvcnRzWzBdXTtcblxuICAgICAgICAgIGlmIChzb3J0ZWRCeUNvbHVtbikge1xuICAgICAgICAgICAgb2JqLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWR5bmF0YWJsZS1jb2x1bW49XCInICsgY29sdW1uLmlkICsgJ1wiXScpLmZpbmQoJy5keW5hdGFibGUtc29ydC1oZWFkZXInKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgb2JqLnNvcnRzSGVhZGVycy5hcHBlbmRBcnJvd1VwKCQodGhpcykpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iai5zb3J0c0hlYWRlcnMuYXBwZW5kQXJyb3dEb3duKCQodGhpcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUXVlcnkgc2VhcmNoIGZ1bmN0aW9uYWxpdHlcbiAgICAgIGlmIChzZXR0aW5ncy5pbnB1dHMucXVlcmllcyB8fCBzZXR0aW5ncy5mZWF0dXJlcy5zZWFyY2gpIHtcbiAgICAgICAgdmFyIGFsbFF1ZXJpZXMgPSBzZXR0aW5ncy5pbnB1dHMucXVlcmllcyB8fCAkKCk7XG4gICAgICAgIGlmIChzZXR0aW5ncy5mZWF0dXJlcy5zZWFyY2gpIHtcbiAgICAgICAgICBhbGxRdWVyaWVzID0gYWxsUXVlcmllcy5hZGQoJyNkeW5hdGFibGUtcXVlcnktc2VhcmNoLScgKyBvYmouZWxlbWVudC5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICBhbGxRdWVyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgcSA9IHNldHRpbmdzLmRhdGFzZXQucXVlcmllc1skdGhpcy5kYXRhKCdkeW5hdGFibGUtcXVlcnknKV07XG4gICAgICAgICAgJHRoaXMudmFsKHEgfHwgJycpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgb2JqLiRlbGVtZW50LmZpbmQoc2V0dGluZ3MudGFibGUuYm9keVJvd1NlbGVjdG9yKS5yZW1vdmUoKTtcbiAgICAgIG9iai4kZWxlbWVudC5hcHBlbmQocm93cyk7XG5cbiAgICAgIG9iai4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6YWZ0ZXJVcGRhdGUnLCByb3dzKTtcbiAgICB9O1xuICB9O1xuICBcbiAgcmV0dXJuIERvbTtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkdCwgdXRpbGl0eSkge1xuICBmdW5jdGlvbiBJbnB1dHNTZWFyY2gob2JqLCBzZXR0aW5ncykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmluaXRPbkxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncy5mZWF0dXJlcy5zZWFyY2g7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9O1xuXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkc2VhcmNoID0gJCgnPGlucHV0IC8+Jywge1xuICAgICAgICAgICAgdHlwZTogJ3NlYXJjaCcsXG4gICAgICAgICAgICBpZDogJ2R5bmF0YWJsZS1xdWVyeS1zZWFyY2gtJyArIG9iai5lbGVtZW50LmlkLFxuICAgICAgICAgICAgJ2RhdGEtZHluYXRhYmxlLXF1ZXJ5JzogJ3NlYXJjaCcsXG4gICAgICAgICAgICB2YWx1ZTogc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzLnNlYXJjaFxuICAgICAgICAgIH0pLFxuICAgICAgICAgICRzZWFyY2hTcGFuID0gJCgnPGRpdiBjbGFzcz1cInB1bGwtcmlnaHRcIj48L2Rpdj4nLCB7XG4gICAgICAgICAgICBpZDogJ2R5bmF0YWJsZS1zZWFyY2gtJyArIG9iai5lbGVtZW50LmlkLFxuICAgICAgICAgICAgJ2NsYXNzJzogJ2R5bmF0YWJsZS1zZWFyY2gnLFxuICAgICAgICAgICAgdGV4dDogc2V0dGluZ3MuaW5wdXRzLnNlYXJjaFRleHRcbiAgICAgICAgICB9KS5hcHBlbmQoJHNlYXJjaCk7XG5cbiAgICAgICRzZWFyY2hcbiAgICAgICAgLmJpbmQoc2V0dGluZ3MuaW5wdXRzLnF1ZXJ5RXZlbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG9iai5xdWVyaWVzLnJ1blNlYXJjaCgkKHRoaXMpLnZhbCgpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmJpbmQoJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGlmIChlLndoaWNoID09IDEzKSB7XG4gICAgICAgICAgICBvYmoucXVlcmllcy5ydW5TZWFyY2goJCh0aGlzKS52YWwoKSk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIHJldHVybiAkc2VhcmNoU3BhbjtcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gc2V0dGluZ3MuaW5wdXRzLnNlYXJjaFRhcmdldCA/ICQoc2V0dGluZ3MuaW5wdXRzLnNlYXJjaFRhcmdldCkgOiBvYmouJGVsZW1lbnQ7XG4gICAgICAkdGFyZ2V0W3NldHRpbmdzLmlucHV0cy5zZWFyY2hQbGFjZW1lbnRdKHRoaXMuY3JlYXRlKCkpO1xuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIElucHV0c1NlYXJjaDtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkdCwgdXRpbGl0eSkge1xuICAvLyBwYWdpbmF0aW9uIGxpbmtzIHdoaWNoIHVwZGF0ZSBkYXRhc2V0LnBhZ2UgYXR0cmlidXRlXG4gIGZ1bmN0aW9uIFBhZ2luYXRpb25MaW5rcyhvYmosIHNldHRpbmdzKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuaW5pdE9uTG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNldHRpbmdzLmZlYXR1cmVzLnBhZ2luYXRlO1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuYXR0YWNoKCk7XG4gICAgfTtcblxuICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGFnZUxpbmtzID0gJzx1bCBpZD1cIicgKyAnZHluYXRhYmxlLXBhZ2luYXRpb24tbGlua3MtJyArIG9iai5lbGVtZW50LmlkICsgJ1wiIGNsYXNzPVwiJyArIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uQ2xhc3MgKyAnXCI+JyxcbiAgICAgICAgICBwYWdlTGlua0NsYXNzID0gc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25MaW5rQ2xhc3MsXG4gICAgICAgICAgYWN0aXZlUGFnZUNsYXNzID0gc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25BY3RpdmVDbGFzcyxcbiAgICAgICAgICBkaXNhYmxlZFBhZ2VDbGFzcyA9IHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uRGlzYWJsZWRDbGFzcyxcbiAgICAgICAgICBwYWdlcyA9IE1hdGguY2VpbChzZXR0aW5ncy5kYXRhc2V0LnF1ZXJ5UmVjb3JkQ291bnQgLyBzZXR0aW5ncy5kYXRhc2V0LnBlclBhZ2UpLFxuICAgICAgICAgIHBhZ2UgPSBzZXR0aW5ncy5kYXRhc2V0LnBhZ2UsXG4gICAgICAgICAgYnJlYWtzID0gW1xuICAgICAgICAgICAgc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25HYXBbMF0sXG4gICAgICAgICAgICBzZXR0aW5ncy5kYXRhc2V0LnBhZ2UgLSBzZXR0aW5ncy5pbnB1dHMucGFnaW5hdGlvbkdhcFsxXSxcbiAgICAgICAgICAgIHNldHRpbmdzLmRhdGFzZXQucGFnZSArIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uR2FwWzJdLFxuICAgICAgICAgICAgKHBhZ2VzICsgMSkgLSBzZXR0aW5ncy5pbnB1dHMucGFnaW5hdGlvbkdhcFszXVxuICAgICAgICAgIF07XG5cbiAgICAgIHBhZ2VMaW5rcyArPSAnPGxpPjxzcGFuPicgKyBzZXR0aW5ncy5pbnB1dHMucGFnZVRleHQgKyAnPC9zcGFuPjwvbGk+JztcblxuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gcGFnZXM7IGkrKykge1xuICAgICAgICBpZiAoIChpID4gYnJlYWtzWzBdICYmIGkgPCBicmVha3NbMV0pIHx8IChpID4gYnJlYWtzWzJdICYmIGkgPCBicmVha3NbM10pKSB7XG4gICAgICAgICAgLy8gc2tpcCB0byBuZXh0IGl0ZXJhdGlvbiBpbiBsb29wXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGxpID0gb2JqLnBhZ2luYXRpb25MaW5rcy5idWlsZExpbmsoaSwgaSwgcGFnZUxpbmtDbGFzcywgcGFnZSA9PSBpLCBhY3RpdmVQYWdlQ2xhc3MpLFxuICAgICAgICAgICAgICBicmVha0luZGV4LFxuICAgICAgICAgICAgICBuZXh0QnJlYWs7XG5cbiAgICAgICAgICAvLyBJZiBpIGlzIG5vdCBiZXR3ZWVuIG9uZSBvZiB0aGUgZm9sbG93aW5nXG4gICAgICAgICAgLy8gKDEgKyAoc2V0dGluZ3MucGFnaW5hdGlvbkdhcFswXSkpXG4gICAgICAgICAgLy8gKHBhZ2UgLSBzZXR0aW5ncy5wYWdpbmF0aW9uR2FwWzFdKVxuICAgICAgICAgIC8vIChwYWdlICsgc2V0dGluZ3MucGFnaW5hdGlvbkdhcFsyXSlcbiAgICAgICAgICAvLyAocGFnZXMgLSBzZXR0aW5ncy5wYWdpbmF0aW9uR2FwWzNdKVxuICAgICAgICAgIGJyZWFrSW5kZXggPSAkLmluQXJyYXkoaSwgYnJlYWtzKTtcbiAgICAgICAgICBuZXh0QnJlYWsgPSBicmVha3NbYnJlYWtJbmRleCArIDFdO1xuICAgICAgICAgIGlmIChicmVha0luZGV4ID4gMCAmJiBpICE9PSAxICYmIG5leHRCcmVhayAmJiBuZXh0QnJlYWsgPiAoaSArIDEpKSB7XG4gICAgICAgICAgICB2YXIgZWxsaXAgPSAnPGxpPjxzcGFuIGNsYXNzPVwiZHluYXRhYmxlLXBhZ2UtYnJlYWtcIj4maGVsbGlwOzwvc3Bhbj48L2xpPic7XG4gICAgICAgICAgICBsaSA9IGJyZWFrSW5kZXggPCAyID8gZWxsaXAgKyBsaSA6IGxpICsgZWxsaXA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uUHJldiAmJiBpID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgcHJldkxpID0gb2JqLnBhZ2luYXRpb25MaW5rcy5idWlsZExpbmsocGFnZSAtIDEsIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uUHJldiwgcGFnZUxpbmtDbGFzcyArICcgJyArIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uUHJldkNsYXNzLCBwYWdlID09PSAxLCBkaXNhYmxlZFBhZ2VDbGFzcyk7XG4gICAgICAgICAgICBsaSA9IHByZXZMaSArIGxpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25OZXh0ICYmIGkgPT09IHBhZ2VzKSB7XG4gICAgICAgICAgICB2YXIgbmV4dExpID0gb2JqLnBhZ2luYXRpb25MaW5rcy5idWlsZExpbmsocGFnZSArIDEsIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uTmV4dCwgcGFnZUxpbmtDbGFzcyArICcgJyArIHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uTmV4dENsYXNzLCBwYWdlID09PSBwYWdlcywgZGlzYWJsZWRQYWdlQ2xhc3MpO1xuICAgICAgICAgICAgbGkgKz0gbmV4dExpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhZ2VMaW5rcyArPSBsaTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwYWdlTGlua3MgKz0gJzwvdWw+JztcblxuICAgICAgLy8gb25seSBiaW5kIHBhZ2UgaGFuZGxlciB0byBub24tYWN0aXZlIGFuZCBub24tZGlzYWJsZWQgcGFnZSBsaW5rc1xuICAgICAgdmFyIHNlbGVjdG9yID0gJyNkeW5hdGFibGUtcGFnaW5hdGlvbi1saW5rcy0nICsgb2JqLmVsZW1lbnQuaWQgKyAnIGEuJyArIHBhZ2VMaW5rQ2xhc3MgKyAnOm5vdCguJyArIGFjdGl2ZVBhZ2VDbGFzcyArICcsLicgKyBkaXNhYmxlZFBhZ2VDbGFzcyArICcpJztcbiAgICAgIC8vIGtpbGwgYW55IGV4aXN0aW5nIGRlbGVnYXRlZC1iaW5kaW5ncyBzbyB0aGV5IGRvbid0IHN0YWNrIHVwXG4gICAgICAkKGRvY3VtZW50KS51bmRlbGVnYXRlKHNlbGVjdG9yLCAnY2xpY2suZHluYXRhYmxlJyk7XG4gICAgICAkKGRvY3VtZW50KS5kZWxlZ2F0ZShzZWxlY3RvciwgJ2NsaWNrLmR5bmF0YWJsZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAkdGhpcy5jbG9zZXN0KHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uQ2xhc3MpLmZpbmQoJy4nICsgYWN0aXZlUGFnZUNsYXNzKS5yZW1vdmVDbGFzcyhhY3RpdmVQYWdlQ2xhc3MpO1xuICAgICAgICAkdGhpcy5hZGRDbGFzcyhhY3RpdmVQYWdlQ2xhc3MpO1xuXG4gICAgICAgIG9iai5wYWdpbmF0aW9uUGFnZS5zZXQoJHRoaXMuZGF0YSgnZHluYXRhYmxlLXBhZ2UnKSk7XG4gICAgICAgIG9iai5wcm9jZXNzKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcGFnZUxpbmtzO1xuICAgIH07XG5cbiAgICB0aGlzLmJ1aWxkTGluayA9IGZ1bmN0aW9uKHBhZ2UsIGxhYmVsLCBsaW5rQ2xhc3MsIGNvbmRpdGlvbmFsLCBjb25kaXRpb25hbENsYXNzKSB7XG4gICAgICB2YXIgbGluayA9ICc8YSBkYXRhLWR5bmF0YWJsZS1wYWdlPScgKyBwYWdlICsgJyBjbGFzcz1cIicgKyBsaW5rQ2xhc3MsXG4gICAgICAgICAgbGkgPSAnPGxpJztcblxuICAgICAgaWYgKGNvbmRpdGlvbmFsKSB7XG4gICAgICAgIGxpbmsgKz0gJyAnICsgY29uZGl0aW9uYWxDbGFzcztcbiAgICAgICAgbGkgKz0gJyBjbGFzcz1cIicgKyBjb25kaXRpb25hbENsYXNzICsgJ1wiJztcbiAgICAgIH1cblxuICAgICAgbGluayArPSAnXCI+JyArIGxhYmVsICsgJzwvYT4nO1xuICAgICAgbGkgKz0gJz4nICsgbGluayArICc8L2xpPic7XG5cbiAgICAgIHJldHVybiBsaTtcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGFwcGVuZCBwYWdlIGxpbmtzICphZnRlciogZGVsZWdhdGUtZXZlbnQtYmluZGluZyBzbyBpdCBkb2Vzbid0IG5lZWQgdG9cbiAgICAgIC8vIGZpbmQgYW5kIHNlbGVjdCBhbGwgcGFnZSBsaW5rcyB0byBiaW5kIGV2ZW50XG4gICAgICB2YXIgJHRhcmdldCA9IHNldHRpbmdzLmlucHV0cy5wYWdpbmF0aW9uTGlua1RhcmdldCA/ICQoc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25MaW5rVGFyZ2V0KSA6IG9iai4kZWxlbWVudDtcbiAgICAgICR0YXJnZXRbc2V0dGluZ3MuaW5wdXRzLnBhZ2luYXRpb25MaW5rUGxhY2VtZW50XShvYmoucGFnaW5hdGlvbkxpbmtzLmNyZWF0ZSgpKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBQYWdpbmF0aW9uTGlua3M7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIC8vIHByb3ZpZGUgYSBwdWJsaWMgZnVuY3Rpb24gZm9yIHNlbGVjdGluZyBwYWdlXG4gIGZ1bmN0aW9uIFBhZ2luYXRpb25QYWdlKG9iaiwgc2V0dGluZ3MpIHtcbiAgICB0aGlzLmluaXRPbkxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncy5mZWF0dXJlcy5wYWdpbmF0ZTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGFnZVVybCA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gubWF0Y2gobmV3IFJlZ0V4cChzZXR0aW5ncy5wYXJhbXMucGFnZSArICc9KFteJl0qKScpKTtcbiAgICAgIC8vIElmIHBhZ2UgaXMgcHJlc2VudCBpbiBVUkwgcGFyYW1ldGVycyBhbmQgcHVzaFN0YXRlIGlzIGVuYWJsZWRcbiAgICAgIC8vIChtZWFuaW5nIHRoYXQgaXQnZCBiZSBwb3NzaWJsZSBmb3IgZHluYXRhYmxlIHRvIGhhdmUgcHV0IHRoZVxuICAgICAgLy8gcGFnZSBwYXJhbWV0ZXIgaW4gdGhlIFVSTClcbiAgICAgIGlmIChwYWdlVXJsICYmIHNldHRpbmdzLmZlYXR1cmVzLnB1c2hTdGF0ZSkge1xuICAgICAgICB0aGlzLnNldChwYWdlVXJsWzFdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0KDEpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICAgIHZhciBuZXdQYWdlID0gcGFyc2VJbnQocGFnZSwgMTApO1xuICAgICAgc2V0dGluZ3MuZGF0YXNldC5wYWdlID0gbmV3UGFnZTtcbiAgICAgIG9iai4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6cGFnZTpzZXQnLCBuZXdQYWdlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFBhZ2luYXRpb25QYWdlO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIGZ1bmN0aW9uIFBhZ2luYXRpb25QZXJQYWdlKG9iaiwgc2V0dGluZ3MpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5pbml0T25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZmVhdHVyZXMucGFnaW5hdGU7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBlclBhZ2VVcmwgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLm1hdGNoKG5ldyBSZWdFeHAoc2V0dGluZ3MucGFyYW1zLnBlclBhZ2UgKyAnPShbXiZdKiknKSk7XG5cbiAgICAgIC8vIElmIHBlclBhZ2UgaXMgcHJlc2VudCBpbiBVUkwgcGFyYW1ldGVycyBhbmQgcHVzaFN0YXRlIGlzIGVuYWJsZWRcbiAgICAgIC8vIChtZWFuaW5nIHRoYXQgaXQnZCBiZSBwb3NzaWJsZSBmb3IgZHluYXRhYmxlIHRvIGhhdmUgcHV0IHRoZVxuICAgICAgLy8gcGVyUGFnZSBwYXJhbWV0ZXIgaW4gdGhlIFVSTClcbiAgICAgIGlmIChwZXJQYWdlVXJsICYmIHNldHRpbmdzLmZlYXR1cmVzLnB1c2hTdGF0ZSkge1xuICAgICAgICAvLyBEb24ndCByZXNldCBwYWdlIHRvIDEgb24gaW5pdCwgc2luY2UgaXQgbWlnaHQgb3ZlcnJpZGUgcGFnZVxuICAgICAgICAvLyBzZXQgb24gaW5pdCBmcm9tIFVSTFxuICAgICAgICB0aGlzLnNldChwZXJQYWdlVXJsWzFdLCB0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0KHNldHRpbmdzLmRhdGFzZXQucGVyUGFnZURlZmF1bHQsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0dGluZ3MuZmVhdHVyZXMucGVyUGFnZVNlbGVjdCkge1xuICAgICAgICB0aGlzLmF0dGFjaCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRzZWxlY3QgPSAkKCc8c2VsZWN0PicsIHtcbiAgICAgICAgICAgIGlkOiAnZHluYXRhYmxlLXBlci1wYWdlLScgKyBvYmouZWxlbWVudC5pZCxcbiAgICAgICAgICAgICdjbGFzcyc6ICdkeW5hdGFibGUtcGVyLXBhZ2Utc2VsZWN0J1xuICAgICAgICAgIH0pO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlT3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgbnVtYmVyID0gc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlT3B0aW9uc1tpXSxcbiAgICAgICAgICAgIHNlbGVjdGVkID0gc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlID09IG51bWJlciA/ICdzZWxlY3RlZD1cInNlbGVjdGVkXCInIDogJyc7XG4gICAgICAgICRzZWxlY3QuYXBwZW5kKCc8b3B0aW9uIHZhbHVlPVwiJyArIG51bWJlciArICdcIiAnICsgc2VsZWN0ZWQgKyAnPicgKyBudW1iZXIgKyAnPC9vcHRpb24+Jyk7XG4gICAgICB9XG5cbiAgICAgICRzZWxlY3QuYmluZCgnY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy5zZXQoJCh0aGlzKS52YWwoKSk7XG4gICAgICAgIG9iai5wcm9jZXNzKCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuICQoJzxzcGFuIC8+Jywge1xuICAgICAgICAnY2xhc3MnOiAnZHluYXRhYmxlLXBlci1wYWdlJ1xuICAgICAgfSkuYXBwZW5kKFwiPHNwYW4gY2xhc3M9J2R5bmF0YWJsZS1wZXItcGFnZS1sYWJlbCc+XCIgKyBzZXR0aW5ncy5pbnB1dHMucGVyUGFnZVRleHQgKyBcIjwvc3Bhbj5cIikuYXBwZW5kKCRzZWxlY3QpO1xuICAgIH07XG5cbiAgICB0aGlzLmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICR0YXJnZXQgPSBzZXR0aW5ncy5pbnB1dHMucGVyUGFnZVRhcmdldCA/ICQoc2V0dGluZ3MuaW5wdXRzLnBlclBhZ2VUYXJnZXQpIDogb2JqLiRlbGVtZW50O1xuICAgICAgJHRhcmdldFtzZXR0aW5ncy5pbnB1dHMucGVyUGFnZVBsYWNlbWVudF0odGhpcy5jcmVhdGUoKSk7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24obnVtYmVyLCBza2lwUmVzZXRQYWdlKSB7XG4gICAgICB2YXIgbmV3UGVyUGFnZSA9IHBhcnNlSW50KG51bWJlcik7XG4gICAgICBpZiAoIXNraXBSZXNldFBhZ2UpIHsgb2JqLnBhZ2luYXRpb25QYWdlLnNldCgxKTsgfVxuICAgICAgc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlID0gbmV3UGVyUGFnZTtcbiAgICAgIG9iai4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6cGVyUGFnZTpzZXQnLCBuZXdQZXJQYWdlKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBQYWdpbmF0aW9uUGVyUGFnZTtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkdCwgdXRpbGl0eSkge1xuICBmdW5jdGlvbiBQcm9jZXNzaW5nSW5kaWNhdG9yKG9iaiwgc2V0dGluZ3MpIHtcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuYXR0YWNoKCk7XG4gICAgfTtcblxuICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHByb2Nlc3NpbmcgPSAkKCc8ZGl2PjwvZGl2PicsIHtcbiAgICAgICAgICAgIGh0bWw6ICc8c3Bhbj4nICsgc2V0dGluZ3MuaW5wdXRzLnByb2Nlc3NpbmdUZXh0ICsgJzwvc3Bhbj4nLFxuICAgICAgICAgICAgaWQ6ICdkeW5hdGFibGUtcHJvY2Vzc2luZy0nICsgb2JqLmVsZW1lbnQuaWQsXG4gICAgICAgICAgICAnY2xhc3MnOiAnZHluYXRhYmxlLXByb2Nlc3NpbmcnLFxuICAgICAgICAgICAgc3R5bGU6ICdwb3NpdGlvbjogYWJzb2x1dGU7IGRpc3BsYXk6IG5vbmU7J1xuICAgICAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gJHByb2Nlc3Npbmc7XG4gICAgfTtcblxuICAgIHRoaXMucG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkcHJvY2Vzc2luZyA9ICQoJyNkeW5hdGFibGUtcHJvY2Vzc2luZy0nICsgb2JqLmVsZW1lbnQuaWQpLFxuICAgICAgICAgICRzcGFuID0gJHByb2Nlc3NpbmcuY2hpbGRyZW4oJ3NwYW4nKSxcbiAgICAgICAgICBzcGFuSGVpZ2h0ID0gJHNwYW4ub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICBzcGFuV2lkdGggPSAkc3Bhbi5vdXRlcldpZHRoKCksXG4gICAgICAgICAgJGNvdmVyZWQgPSBvYmouJGVsZW1lbnQsXG4gICAgICAgICAgb2Zmc2V0ID0gJGNvdmVyZWQub2Zmc2V0KCksXG4gICAgICAgICAgaGVpZ2h0ID0gJGNvdmVyZWQub3V0ZXJIZWlnaHQoKSwgd2lkdGggPSAkY292ZXJlZC5vdXRlcldpZHRoKCk7XG5cbiAgICAgICRwcm9jZXNzaW5nXG4gICAgICAgIC5vZmZzZXQoe2xlZnQ6IG9mZnNldC5sZWZ0LCB0b3A6IG9mZnNldC50b3B9KVxuICAgICAgICAud2lkdGgod2lkdGgpXG4gICAgICAgIC5oZWlnaHQoaGVpZ2h0KVxuICAgICAgJHNwYW5cbiAgICAgICAgLm9mZnNldCh7bGVmdDogb2Zmc2V0LmxlZnQgKyAoICh3aWR0aCAtIHNwYW5XaWR0aCkgLyAyICksIHRvcDogb2Zmc2V0LnRvcCArICggKGhlaWdodCAtIHNwYW5IZWlnaHQpIC8gMiApfSk7XG5cbiAgICAgIHJldHVybiAkcHJvY2Vzc2luZztcbiAgICB9O1xuXG4gICAgdGhpcy5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIG9iai4kZWxlbWVudC5iZWZvcmUodGhpcy5jcmVhdGUoKSk7XG4gICAgfTtcblxuICAgIHRoaXMuc2hvdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI2R5bmF0YWJsZS1wcm9jZXNzaW5nLScgKyBvYmouZWxlbWVudC5pZCkuc2hvdygpO1xuICAgICAgdGhpcy5wb3NpdGlvbigpO1xuICAgIH07XG5cbiAgICB0aGlzLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNkeW5hdGFibGUtcHJvY2Vzc2luZy0nICsgb2JqLmVsZW1lbnQuaWQpLmhpZGUoKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBQcm9jZXNzaW5nSW5kaWNhdG9yO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIGZ1bmN0aW9uIFF1ZXJpZXMob2JqLCBzZXR0aW5ncykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmluaXRPbkxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncy5pbnB1dHMucXVlcmllcyB8fCBzZXR0aW5ncy5mZWF0dXJlcy5zZWFyY2g7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHF1ZXJpZXNVcmwgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLm1hdGNoKG5ldyBSZWdFeHAoc2V0dGluZ3MucGFyYW1zLnF1ZXJpZXMgKyAnW14mPV0qPVteJl0qJywgJ2cnKSk7XG5cbiAgICAgIHNldHRpbmdzLmRhdGFzZXQucXVlcmllcyA9IHF1ZXJpZXNVcmwgPyB1dGlsaXR5LmRlc2VyaWFsaXplKHF1ZXJpZXNVcmwpW3NldHRpbmdzLnBhcmFtcy5xdWVyaWVzXSA6IHt9O1xuICAgICAgaWYgKHNldHRpbmdzLmRhdGFzZXQucXVlcmllcyA9PT0gXCJcIikgeyBzZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXMgPSB7fTsgfVxuXG4gICAgICBpZiAoc2V0dGluZ3MuaW5wdXRzLnF1ZXJpZXMpIHtcbiAgICAgICAgdGhpcy5zZXR1cElucHV0cygpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAvLyByZXNldCB0byBmaXJzdCBwYWdlIHNpbmNlIHF1ZXJ5IHdpbGwgY2hhbmdlIHJlY29yZHNcbiAgICAgIGlmIChzZXR0aW5ncy5mZWF0dXJlcy5wYWdpbmF0ZSkge1xuICAgICAgICBzZXR0aW5ncy5kYXRhc2V0LnBhZ2UgPSAxO1xuICAgICAgfVxuICAgICAgc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzW25hbWVdID0gdmFsdWU7XG4gICAgICBvYmouJGVsZW1lbnQudHJpZ2dlcignZHluYXRhYmxlOnF1ZXJpZXM6YWRkZWQnLCBbbmFtZSwgdmFsdWVdKTtcbiAgICAgIHJldHVybiBkdDtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBkZWxldGUgc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzW25hbWVdO1xuICAgICAgb2JqLiRlbGVtZW50LnRyaWdnZXIoJ2R5bmF0YWJsZTpxdWVyaWVzOnJlbW92ZWQnLCBuYW1lKTtcbiAgICAgIHJldHVybiBkdDtcbiAgICB9O1xuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIGZvciAocXVlcnkgaW4gc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXMuaGFzT3duUHJvcGVydHkocXVlcnkpKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gc2V0dGluZ3MuZGF0YXNldC5xdWVyaWVzW3F1ZXJ5XTtcbiAgICAgICAgICBpZiAoX3RoaXMuZnVuY3Rpb25zW3F1ZXJ5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gbGF6aWx5IGV2YWx1YXRlIHF1ZXJ5IGZyb20gY29sdW1uIG5hbWVzIGlmIG5vdCBleHBsaWNpdGx5IGRlZmluZWRcbiAgICAgICAgICAgIHZhciBxdWVyeUNvbHVtbiA9IHV0aWxpdHkuZmluZE9iamVjdEluQXJyYXkoc2V0dGluZ3MudGFibGUuY29sdW1ucywge2lkOiBxdWVyeX0pO1xuICAgICAgICAgICAgaWYgKHF1ZXJ5Q29sdW1uKSB7XG4gICAgICAgICAgICAgIF90aGlzLmZ1bmN0aW9uc1txdWVyeV0gPSBmdW5jdGlvbihyZWNvcmQsIHF1ZXJ5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkW3F1ZXJ5XSA9PSBxdWVyeVZhbHVlO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgJC5lcnJvcihcIlF1ZXJ5IG5hbWVkICdcIiArIHF1ZXJ5ICsgXCInIGNhbGxlZCwgYnV0IG5vdCBkZWZpbmVkIGluIHF1ZXJpZXMuZnVuY3Rpb25zXCIpO1xuICAgICAgICAgICAgICBjb250aW51ZTsgLy8gdG8gc2tpcCB0byBuZXh0IHF1ZXJ5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGNvbGxlY3QgYWxsIHJlY29yZHMgdGhhdCByZXR1cm4gdHJ1ZSBmb3IgcXVlcnlcbiAgICAgICAgICBzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHMgPSAkLm1hcChzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHMsIGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmZ1bmN0aW9uc1txdWVyeV0ocmVjb3JkLCB2YWx1ZSkgPyByZWNvcmQgOiBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZXR0aW5ncy5kYXRhc2V0LnF1ZXJ5UmVjb3JkQ291bnQgPSBvYmoucmVjb3Jkcy5jb3VudCgpO1xuICAgIH07XG5cbiAgICAvLyBTaG9ydGN1dCBmb3IgcGVyZm9ybWluZyBzaW1wbGUgcXVlcnkgZnJvbSBidWlsdC1pbiBzZWFyY2hcbiAgICB0aGlzLnJ1blNlYXJjaCA9IGZ1bmN0aW9uKHEpIHtcbiAgICAgIHZhciBvcmlnUXVlcmllcyA9ICQuZXh0ZW5kKHt9LCBzZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXMpO1xuICAgICAgaWYgKHEpIHtcbiAgICAgICAgdGhpcy5hZGQoJ3NlYXJjaCcsIHEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZW1vdmUoJ3NlYXJjaCcpO1xuICAgICAgfVxuICAgICAgaWYgKCF1dGlsaXR5Lm9iamVjdHNFcXVhbChzZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXMsIG9yaWdRdWVyaWVzKSkge1xuICAgICAgICBvYmoucHJvY2VzcygpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnNldHVwSW5wdXRzID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZXR0aW5ncy5pbnB1dHMucXVlcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgZXZlbnQgPSAkdGhpcy5kYXRhKCdkeW5hdGFibGUtcXVlcnktZXZlbnQnKSB8fCBzZXR0aW5ncy5pbnB1dHMucXVlcnlFdmVudCxcbiAgICAgICAgICAgIHF1ZXJ5ID0gJHRoaXMuZGF0YSgnZHluYXRhYmxlLXF1ZXJ5JykgfHwgJHRoaXMuYXR0cignbmFtZScpIHx8IHRoaXMuaWQsXG4gICAgICAgICAgICBxdWVyeUZ1bmN0aW9uID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICB2YXIgcSA9ICQodGhpcykudmFsKCk7XG4gICAgICAgICAgICAgIGlmIChxID09PSBcIlwiKSB7IHEgPSB1bmRlZmluZWQ7IH1cbiAgICAgICAgICAgICAgaWYgKHEgPT09IHNldHRpbmdzLmRhdGFzZXQucXVlcmllc1txdWVyeV0pIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgICAgICAgIGlmIChxKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYWRkKHF1ZXJ5LCBxKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmUocXVlcnkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9iai5wcm9jZXNzKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgJHRoaXNcbiAgICAgICAgICAuYXR0cignZGF0YS1keW5hdGFibGUtcXVlcnknLCBxdWVyeSlcbiAgICAgICAgICAuYmluZChldmVudCwgcXVlcnlGdW5jdGlvbilcbiAgICAgICAgICAuYmluZCgna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS53aGljaCA9PSAxMykge1xuICAgICAgICAgICAgICBxdWVyeUZ1bmN0aW9uLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLmRhdGFzZXQucXVlcmllc1txdWVyeV0pIHsgJHRoaXMudmFsKGRlY29kZVVSSUNvbXBvbmVudChzZXR0aW5ncy5kYXRhc2V0LnF1ZXJpZXNbcXVlcnldKSk7IH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBRdWVyeSBmdW5jdGlvbnMgZm9yIGluLXBhZ2UgcXVlcnlpbmdcbiAgICAvLyBlYWNoIGZ1bmN0aW9uIHNob3VsZCB0YWtlIGEgcmVjb3JkIGFuZCBhIHZhbHVlIGFzIGlucHV0XG4gICAgLy8gYW5kIG91dHB1dCB0cnVlIG9mIGZhbHNlIGFzIHRvIHdoZXRoZXIgdGhlIHJlY29yZCBpcyBhIG1hdGNoIG9yIG5vdFxuICAgIHRoaXMuZnVuY3Rpb25zID0ge1xuICAgICAgc2VhcmNoOiBmdW5jdGlvbihyZWNvcmQsIHF1ZXJ5VmFsdWUpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5zID0gZmFsc2U7XG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBlYWNoIGF0dHJpYnV0ZSBvZiByZWNvcmRcbiAgICAgICAgZm9yIChhdHRyIGluIHJlY29yZCkge1xuICAgICAgICAgIGlmIChyZWNvcmQuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSByZWNvcmRbYXR0cl07XG4gICAgICAgICAgICBpZiAodHlwZW9mKGF0dHJWYWx1ZSkgPT09IFwic3RyaW5nXCIgJiYgYXR0clZhbHVlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeVZhbHVlLnRvTG93ZXJDYXNlKCkpICE9PSAtMSkge1xuICAgICAgICAgICAgICBjb250YWlucyA9IHRydWU7XG4gICAgICAgICAgICAgIC8vIERvbid0IG5lZWQgdG8ga2VlcCBzZWFyY2hpbmcgYXR0cmlidXRlcyBvbmNlIGZvdW5kXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250YWlucztcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBRdWVyaWVzO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIGZ1bmN0aW9uIFJlY29yZHNDb3VudChvYmosIHNldHRpbmdzKSB7XG4gICAgdGhpcy5pbml0T25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZmVhdHVyZXMucmVjb3JkQ291bnQ7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9O1xuXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwYWdlVGVtcGxhdGUgPSAnJyxcbiAgICAgICAgICBmaWx0ZXJlZFRlbXBsYXRlID0gJycsXG4gICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnRJZDogb2JqLmVsZW1lbnQuaWQsXG4gICAgICAgICAgICByZWNvcmRzU2hvd246IG9iai5yZWNvcmRzLmNvdW50KCksXG4gICAgICAgICAgICByZWNvcmRzUXVlcnlDb3VudDogc2V0dGluZ3MuZGF0YXNldC5xdWVyeVJlY29yZENvdW50LFxuICAgICAgICAgICAgcmVjb3Jkc1RvdGFsOiBzZXR0aW5ncy5kYXRhc2V0LnRvdGFsUmVjb3JkQ291bnQsXG4gICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTogc2V0dGluZ3MucGFyYW1zLnJlY29yZHMgPT09IFwiX3Jvb3RcIiA/IFwicmVjb3Jkc1wiIDogc2V0dGluZ3MucGFyYW1zLnJlY29yZHMsXG4gICAgICAgICAgICB0ZXh0OiBzZXR0aW5ncy5pbnB1dHMucmVjb3JkQ291bnRUZXh0XG4gICAgICAgICAgfTtcblxuICAgICAgaWYgKHNldHRpbmdzLmZlYXR1cmVzLnBhZ2luYXRlKSB7XG5cbiAgICAgICAgLy8gSWYgY3VycmVudGx5IGRpc3BsYXllZCByZWNvcmRzIGFyZSBhIHN1YnNldCAocGFnZSkgb2YgdGhlIGVudGlyZSBjb2xsZWN0aW9uXG4gICAgICAgIGlmIChvcHRpb25zLnJlY29yZHNTaG93biA8IG9wdGlvbnMucmVjb3Jkc1F1ZXJ5Q291bnQpIHtcbiAgICAgICAgICB2YXIgYm91bmRzID0gb2JqLnJlY29yZHMucGFnZUJvdW5kcygpO1xuICAgICAgICAgIG9wdGlvbnMucGFnZUxvd2VyQm91bmQgPSBib3VuZHNbMF0gKyAxO1xuICAgICAgICAgIG9wdGlvbnMucGFnZVVwcGVyQm91bmQgPSBib3VuZHNbMV07XG4gICAgICAgICAgcGFnZVRlbXBsYXRlID0gc2V0dGluZ3MuaW5wdXRzLnJlY29yZENvdW50UGFnZUJvdW5kVGVtcGxhdGU7XG5cbiAgICAgICAgLy8gRWxzZSBpZiBjdXJyZW50bHkgZGlzcGxheWVkIHJlY29yZHMgYXJlIHRoZSBlbnRpcmUgY29sbGVjdGlvblxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmVjb3Jkc1Nob3duID09PSBvcHRpb25zLnJlY29yZHNRdWVyeUNvdW50KSB7XG4gICAgICAgICAgcGFnZVRlbXBsYXRlID0gc2V0dGluZ3MuaW5wdXRzLnJlY29yZENvdW50UGFnZVVuYm91bmRlZFRlbXBsYXRlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGNvbGxlY3Rpb24gZm9yIHRhYmxlIGlzIHF1ZXJpZWQgc3Vic2V0IG9mIGNvbGxlY3Rpb25cbiAgICAgIGlmIChvcHRpb25zLnJlY29yZHNRdWVyeUNvdW50IDwgb3B0aW9ucy5yZWNvcmRzVG90YWwpIHtcbiAgICAgICAgZmlsdGVyZWRUZW1wbGF0ZSA9IHNldHRpbmdzLmlucHV0cy5yZWNvcmRDb3VudEZpbHRlcmVkVGVtcGxhdGU7XG4gICAgICB9XG5cbiAgICAgIC8vIFBvcHVsYXRlIHRlbXBsYXRlcyB3aXRoIG9wdGlvbnNcbiAgICAgIG9wdGlvbnMucGFnZVRlbXBsYXRlID0gdXRpbGl0eS50ZW1wbGF0ZShwYWdlVGVtcGxhdGUsIG9wdGlvbnMpO1xuICAgICAgb3B0aW9ucy5maWx0ZXJlZFRlbXBsYXRlID0gdXRpbGl0eS50ZW1wbGF0ZShmaWx0ZXJlZFRlbXBsYXRlLCBvcHRpb25zKTtcbiAgICAgIG9wdGlvbnMudG90YWxUZW1wbGF0ZSA9IHV0aWxpdHkudGVtcGxhdGUoc2V0dGluZ3MuaW5wdXRzLnJlY29yZENvdW50VG90YWxUZW1wbGF0ZSwgb3B0aW9ucyk7XG4gICAgICBvcHRpb25zLnRleHRUZW1wbGF0ZSA9IHV0aWxpdHkudGVtcGxhdGUoc2V0dGluZ3MuaW5wdXRzLnJlY29yZENvdW50VGV4dFRlbXBsYXRlLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuIHV0aWxpdHkudGVtcGxhdGUoc2V0dGluZ3MuaW5wdXRzLnJlY29yZENvdW50VGVtcGxhdGUsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB0aGlzLmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICR0YXJnZXQgPSBzZXR0aW5ncy5pbnB1dHMucmVjb3JkQ291bnRUYXJnZXQgPyAkKHNldHRpbmdzLmlucHV0cy5yZWNvcmRDb3VudFRhcmdldCkgOiBvYmouJGVsZW1lbnQ7XG4gICAgICAkdGFyZ2V0W3NldHRpbmdzLmlucHV0cy5yZWNvcmRDb3VudFBsYWNlbWVudF0odGhpcy5jcmVhdGUoKSk7XG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4gUmVjb3Jkc0NvdW50O1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIGZ1bmN0aW9uIFJlY29yZHMob2JqLCBzZXR0aW5ncykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmluaXRPbkxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhc2V0dGluZ3MuZGF0YXNldC5hamF4O1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHMgPT09IG51bGwpIHtcbiAgICAgICAgc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzID0gdGhpcy5nZXRGcm9tVGFibGUoKTtcblxuICAgICAgICBpZiAoIXNldHRpbmdzLmRhdGFzZXQucXVlcnlSZWNvcmRDb3VudCkge1xuICAgICAgICAgIHNldHRpbmdzLmRhdGFzZXQucXVlcnlSZWNvcmRDb3VudCA9IHRoaXMuY291bnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2V0dGluZ3MuZGF0YXNldC50b3RhbFJlY29yZENvdW50KXtcbiAgICAgICAgICBzZXR0aW5ncy5kYXRhc2V0LnRvdGFsUmVjb3JkQ291bnQgPSBzZXR0aW5ncy5kYXRhc2V0LnF1ZXJ5UmVjb3JkQ291bnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGNhY2hlIG9mIG9yaWdpbmFsIGZ1bGwgcmVjb3Jkc2V0ICh1bnBhZ2luYXRlZCBhbmQgdW5xdWVyaWVkKVxuICAgICAgc2V0dGluZ3MuZGF0YXNldC5vcmlnaW5hbFJlY29yZHMgPSAkLmV4dGVuZCh0cnVlLCBbXSwgc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzKTtcbiAgICB9O1xuXG4gICAgLy8gbWVyZ2UgYWpheCByZXNwb25zZSBqc29uIHdpdGggY2FjaGVkIGRhdGEgaW5jbHVkaW5nXG4gICAgLy8gbWV0YS1kYXRhIGFuZCByZWNvcmRzXG4gICAgdGhpcy51cGRhdGVGcm9tSnNvbiA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciByZWNvcmRzO1xuICAgICAgaWYgKHNldHRpbmdzLnBhcmFtcy5yZWNvcmRzID09PSBcIl9yb290XCIpIHtcbiAgICAgICAgcmVjb3JkcyA9IGRhdGE7XG4gICAgICB9IGVsc2UgaWYgKHNldHRpbmdzLnBhcmFtcy5yZWNvcmRzIGluIGRhdGEpIHtcbiAgICAgICAgcmVjb3JkcyA9IGRhdGFbc2V0dGluZ3MucGFyYW1zLnJlY29yZHNdO1xuICAgICAgfVxuICAgICAgaWYgKHNldHRpbmdzLnBhcmFtcy5yZWNvcmQpIHtcbiAgICAgICAgdmFyIGxlbiA9IHJlY29yZHMubGVuZ3RoIC0gMTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIHJlY29yZHNbaV0gPSByZWNvcmRzW2ldW3NldHRpbmdzLnBhcmFtcy5yZWNvcmRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2V0dGluZ3MucGFyYW1zLnF1ZXJ5UmVjb3JkQ291bnQgaW4gZGF0YSkge1xuICAgICAgICBzZXR0aW5ncy5kYXRhc2V0LnF1ZXJ5UmVjb3JkQ291bnQgPSBkYXRhW3NldHRpbmdzLnBhcmFtcy5xdWVyeVJlY29yZENvdW50XTtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0aW5ncy5wYXJhbXMudG90YWxSZWNvcmRDb3VudCBpbiBkYXRhKSB7XG4gICAgICAgIHNldHRpbmdzLmRhdGFzZXQudG90YWxSZWNvcmRDb3VudCA9IGRhdGFbc2V0dGluZ3MucGFyYW1zLnRvdGFsUmVjb3JkQ291bnRdO1xuICAgICAgfVxuICAgICAgc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzID0gcmVjb3JkcztcbiAgICB9O1xuXG4gICAgLy8gRm9yIHJlYWxseSBhZHZhbmNlZCBzb3J0aW5nLFxuICAgIC8vIHNlZSBodHRwOi8vamFtZXMucGFkb2xzZXkuY29tL2phdmFzY3JpcHQvc29ydGluZy1lbGVtZW50cy13aXRoLWpxdWVyeS9cbiAgICB0aGlzLnNvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzb3J0ID0gW10uc29ydCxcbiAgICAgICAgICBzb3J0cyA9IHNldHRpbmdzLmRhdGFzZXQuc29ydHMsXG4gICAgICAgICAgc29ydHNLZXlzID0gc2V0dGluZ3MuZGF0YXNldC5zb3J0c0tleXMsXG4gICAgICAgICAgc29ydFR5cGVzID0gc2V0dGluZ3MuZGF0YXNldC5zb3J0VHlwZXM7XG5cbiAgICAgIHZhciBzb3J0RnVuY3Rpb24gPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHZhciBjb21wYXJpc29uO1xuICAgICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KHNvcnRzKSkge1xuICAgICAgICAgIGNvbXBhcmlzb24gPSBvYmouc29ydHMuZnVuY3Rpb25zWydvcmlnaW5hbFBsYWNlbWVudCddKGEsIGIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzb3J0c0tleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gc29ydHNLZXlzW2ldLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IHNvcnRzW2F0dHJdLFxuICAgICAgICAgICAgICAgIHNvcnRUeXBlID0gc29ydFR5cGVzW2F0dHJdIHx8IG9iai5zb3J0cy5ndWVzc1R5cGUoYSwgYiwgYXR0cik7XG4gICAgICAgICAgICBjb21wYXJpc29uID0gb2JqLnNvcnRzLmZ1bmN0aW9uc1tzb3J0VHlwZV0oYSwgYiwgYXR0ciwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIC8vIERvbid0IG5lZWQgdG8gc29ydCBhbnkgZnVydGhlciB1bmxlc3MgdGhpcyBzb3J0IGlzIGEgdGllIGJldHdlZW4gYSBhbmQgYixcbiAgICAgICAgICAgIC8vIHNvIGJyZWFrIHRoZSBmb3IgbG9vcCB1bmxlc3MgdGllZFxuICAgICAgICAgICAgaWYgKGNvbXBhcmlzb24gIT09IDApIHsgYnJlYWs7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmlzb247XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzb3J0LmNhbGwoc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzLCBzb3J0RnVuY3Rpb24pO1xuICAgIH07XG5cbiAgICB0aGlzLnBhZ2luYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5wYWdlQm91bmRzKCksXG4gICAgICAgICAgZmlyc3QgPSBib3VuZHNbMF0sIGxhc3QgPSBib3VuZHNbMV07XG4gICAgICBzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHMgPSBzZXR0aW5ncy5kYXRhc2V0LnJlY29yZHMuc2xpY2UoZmlyc3QsIGxhc3QpO1xuICAgIH07XG5cbiAgICB0aGlzLnJlc2V0T3JpZ2luYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNldHRpbmdzLmRhdGFzZXQucmVjb3JkcyA9IHNldHRpbmdzLmRhdGFzZXQub3JpZ2luYWxSZWNvcmRzIHx8IFtdO1xuICAgIH07XG5cbiAgICB0aGlzLnBhZ2VCb3VuZHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwYWdlID0gc2V0dGluZ3MuZGF0YXNldC5wYWdlIHx8IDEsXG4gICAgICAgICAgZmlyc3QgPSAocGFnZSAtIDEpICogc2V0dGluZ3MuZGF0YXNldC5wZXJQYWdlLFxuICAgICAgICAgIGxhc3QgPSBNYXRoLm1pbihmaXJzdCArIHNldHRpbmdzLmRhdGFzZXQucGVyUGFnZSwgc2V0dGluZ3MuZGF0YXNldC5xdWVyeVJlY29yZENvdW50KTtcbiAgICAgIHJldHVybiBbZmlyc3QsbGFzdF07XG4gICAgfTtcblxuICAgIC8vIGdldCBpbml0aWFsIHJlY29yZHNldCB0byBwb3B1bGF0ZSB0YWJsZVxuICAgIC8vIGlmIGFqYXgsIGNhbGwgYWpheFVybFxuICAgIC8vIG90aGVyd2lzZSwgaW5pdGlhbGl6ZSBmcm9tIGluLXRhYmxlIHJlY29yZHNcbiAgICB0aGlzLmdldEZyb21UYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlY29yZHMgPSBbXSxcbiAgICAgICAgICBjb2x1bW5zID0gc2V0dGluZ3MudGFibGUuY29sdW1ucyxcbiAgICAgICAgICB0YWJsZVJlY29yZHMgPSBvYmouJGVsZW1lbnQuZmluZChzZXR0aW5ncy50YWJsZS5ib2R5Um93U2VsZWN0b3IpO1xuXG4gICAgICB0YWJsZVJlY29yZHMuZWFjaChmdW5jdGlvbihpbmRleCl7XG4gICAgICAgIHZhciByZWNvcmQgPSB7fTtcbiAgICAgICAgcmVjb3JkWydkeW5hdGFibGUtb3JpZ2luYWwtaW5kZXgnXSA9IGluZGV4O1xuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RoLHRkJykuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgIGlmIChjb2x1bW5zW2luZGV4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBIZWFkZXIgY2VsbCBkaWRuJ3QgZXhpc3QgZm9yIHRoaXMgY29sdW1uLCBzbyBsZXQncyBnZW5lcmF0ZSBhbmQgYXBwZW5kXG4gICAgICAgICAgICAvLyBhIG5ldyBoZWFkZXIgY2VsbCB3aXRoIGEgcmFuZG9tbHkgZ2VuZXJhdGVkIG5hbWUgKHNvIHdlIGNhbiBzdG9yZSBhbmRcbiAgICAgICAgICAgIC8vIHJldHJpZXZlIHRoZSBjb250ZW50cyBvZiB0aGlzIGNvbHVtbiBmb3IgZWFjaCByZWNvcmQpXG4gICAgICAgICAgICBvYmouZG9tQ29sdW1ucy5hZGQob2JqLmRvbUNvbHVtbnMuZ2VuZXJhdGUoKSwgY29sdW1ucy5sZW5ndGgsIGZhbHNlLCB0cnVlKTsgLy8gZG9uJ3Qgc2tpcEFwcGVuZCwgZG8gc2tpcFVwZGF0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdmFsdWUgPSBjb2x1bW5zW2luZGV4XS5hdHRyaWJ1dGVSZWFkZXIodGhpcywgcmVjb3JkKSxcbiAgICAgICAgICAgICAgYXR0ciA9IGNvbHVtbnNbaW5kZXhdLmlkO1xuXG4gICAgICAgICAgLy8gSWYgdmFsdWUgZnJvbSB0YWJsZSBpcyBIVE1MLCBsZXQncyBnZXQgYW5kIGNhY2hlIHRoZSB0ZXh0IGVxdWl2YWxlbnQgZm9yXG4gICAgICAgICAgLy8gdGhlIGRlZmF1bHQgc3RyaW5nIHNvcnRpbmcsIHNpbmNlIGl0IHJhcmVseSBtYWtlcyBzZW5zZSBmb3Igc29ydCBoZWFkZXJzXG4gICAgICAgICAgLy8gdG8gc29ydCBiYXNlZCBvbiBIVE1MIHRhZ3MuXG4gICAgICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2goL1xccypcXDwuK1xcPi8pKSB7XG4gICAgICAgICAgICBpZiAoISByZWNvcmRbJ2R5bmF0YWJsZS1zb3J0YWJsZS10ZXh0J10pIHtcbiAgICAgICAgICAgICAgcmVjb3JkWydkeW5hdGFibGUtc29ydGFibGUtdGV4dCddID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWNvcmRbJ2R5bmF0YWJsZS1zb3J0YWJsZS10ZXh0J11bYXR0cl0gPSAkLnRyaW0oJCgnPGRpdj48L2Rpdj4nKS5odG1sKHZhbHVlKS50ZXh0KCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlY29yZFthdHRyXSA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gQWxsb3cgY29uZmlndXJhdGlvbiBmdW5jdGlvbiB3aGljaCBhbHRlcnMgcmVjb3JkIGJhc2VkIG9uIGF0dHJpYnV0ZXMgb2ZcbiAgICAgICAgLy8gdGFibGUgcm93IChlLmcuIGZyb20gaHRtbDUgZGF0YS0gYXR0cmlidXRlcylcbiAgICAgICAgaWYgKHR5cGVvZihzZXR0aW5ncy5yZWFkZXJzLl9yb3dSZWFkZXIpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICBzZXR0aW5ncy5yZWFkZXJzLl9yb3dSZWFkZXIoaW5kZXgsIHRoaXMsIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVjb3Jkcy5wdXNoKHJlY29yZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZWNvcmRzOyAvLyAxc3Qgcm93IGlzIGhlYWRlclxuICAgIH07XG5cbiAgICAvLyBjb3VudCByZWNvcmRzIGZyb20gdGFibGVcbiAgICB0aGlzLmNvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZGF0YXNldC5yZWNvcmRzLmxlbmd0aDtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBSZWNvcmRzO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGR0LCB1dGlsaXR5KSB7XG4gIC8vIHR1cm4gdGFibGUgaGVhZGVycyBpbnRvIGxpbmtzIHdoaWNoIGFkZCBzb3J0IHRvIHNvcnRzIGFycmF5XG4gIGZ1bmN0aW9uIFNvcnRzSGVhZGVycyhvYmosIHNldHRpbmdzKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuaW5pdE9uTG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNldHRpbmdzLmZlYXR1cmVzLnNvcnQ7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hdHRhY2goKTtcbiAgICB9O1xuXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihjZWxsKSB7XG4gICAgICB2YXIgJGNlbGwgPSAkKGNlbGwpLFxuICAgICAgICAgICRsaW5rID0gJCgnPGE+PC9hPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6ICdkeW5hdGFibGUtc29ydC1oZWFkZXInLFxuICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgICAgaHRtbDogJGNlbGwuaHRtbCgpXG4gICAgICAgICAgfSksXG4gICAgICAgICAgaWQgPSAkY2VsbC5kYXRhKCdkeW5hdGFibGUtY29sdW1uJyksXG4gICAgICAgICAgY29sdW1uID0gdXRpbGl0eS5maW5kT2JqZWN0SW5BcnJheShzZXR0aW5ncy50YWJsZS5jb2x1bW5zLCB7aWQ6IGlkfSk7XG5cbiAgICAgICRsaW5rLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy50b2dnbGVTb3J0KGUsICRsaW5rLCBjb2x1bW4pO1xuICAgICAgICBvYmoucHJvY2VzcygpO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5zb3J0ZWRCeUNvbHVtbigkbGluaywgY29sdW1uKSkge1xuICAgICAgICBpZiAodGhpcy5zb3J0ZWRCeUNvbHVtblZhbHVlKGNvbHVtbikgPT0gMSkge1xuICAgICAgICAgIHRoaXMuYXBwZW5kQXJyb3dVcCgkbGluayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5hcHBlbmRBcnJvd0Rvd24oJGxpbmspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAkbGluaztcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVBbGwgPSBmdW5jdGlvbigpIHtcbiAgICAgIG9iai4kZWxlbWVudC5maW5kKHNldHRpbmdzLnRhYmxlLmhlYWRSb3dTZWxlY3RvcikuY2hpbGRyZW4oJ3RoLHRkJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBfdGhpcy5yZW1vdmVBbGxBcnJvd3MoKTtcbiAgICAgICAgX3RoaXMucmVtb3ZlT25lKHRoaXMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMucmVtb3ZlT25lID0gZnVuY3Rpb24oY2VsbCkge1xuICAgICAgdmFyICRjZWxsID0gJChjZWxsKSxcbiAgICAgICAgICAkbGluayA9ICRjZWxsLmZpbmQoJy5keW5hdGFibGUtc29ydC1oZWFkZXInKTtcbiAgICAgIGlmICgkbGluay5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkbGluay5odG1sKCk7XG4gICAgICAgICRsaW5rLnJlbW92ZSgpO1xuICAgICAgICAkY2VsbC5odG1sKCRjZWxsLmh0bWwoKSArIGh0bWwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgb2JqLiRlbGVtZW50LmZpbmQoc2V0dGluZ3MudGFibGUuaGVhZFJvd1NlbGVjdG9yKS5jaGlsZHJlbigndGgsdGQnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIF90aGlzLmF0dGFjaE9uZSh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmF0dGFjaE9uZSA9IGZ1bmN0aW9uKGNlbGwpIHtcbiAgICAgIHZhciAkY2VsbCA9ICQoY2VsbCk7XG4gICAgICBpZiAoISRjZWxsLmRhdGEoJ2R5bmF0YWJsZS1uby1zb3J0JykpIHtcbiAgICAgICAgJGNlbGwuaHRtbCh0aGlzLmNyZWF0ZShjZWxsKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuYXBwZW5kQXJyb3dVcCA9IGZ1bmN0aW9uKCRsaW5rKSB7XG4gICAgICB0aGlzLnJlbW92ZUFycm93KCRsaW5rKTtcbiAgICAgICRsaW5rLmFwcGVuZChcIjxzcGFuIGNsYXNzPSdkeW5hdGFibGUtYXJyb3cnPiAmIzk2NTA7PC9zcGFuPlwiKTtcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBlbmRBcnJvd0Rvd24gPSBmdW5jdGlvbigkbGluaykge1xuICAgICAgdGhpcy5yZW1vdmVBcnJvdygkbGluayk7XG4gICAgICAkbGluay5hcHBlbmQoXCI8c3BhbiBjbGFzcz0nZHluYXRhYmxlLWFycm93Jz4gJiM5NjYwOzwvc3Bhbj5cIik7XG4gICAgfTtcblxuICAgIHRoaXMucmVtb3ZlQXJyb3cgPSBmdW5jdGlvbigkbGluaykge1xuICAgICAgLy8gTm90IHN1cmUgd2h5IGBwYXJlbnQoKWAgaXMgbmVlZGVkLCB0aGUgYXJyb3cgc2hvdWxkIGJlIGluc2lkZSB0aGUgbGluayBmcm9tIGBhcHBlbmQoKWAgYWJvdmVcbiAgICAgICRsaW5rLmZpbmQoJy5keW5hdGFibGUtYXJyb3cnKS5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVBbGxBcnJvd3MgPSBmdW5jdGlvbigpIHtcbiAgICAgIG9iai4kZWxlbWVudC5maW5kKCcuZHluYXRhYmxlLWFycm93JykucmVtb3ZlKCk7XG4gICAgfTtcblxuICAgIHRoaXMudG9nZ2xlU29ydCA9IGZ1bmN0aW9uKGUsICRsaW5rLCBjb2x1bW4pIHtcbiAgICAgIHZhciBzb3J0ZWRCeUNvbHVtbiA9IHRoaXMuc29ydGVkQnlDb2x1bW4oJGxpbmssIGNvbHVtbiksXG4gICAgICAgICAgdmFsdWUgPSB0aGlzLnNvcnRlZEJ5Q29sdW1uVmFsdWUoY29sdW1uKTtcbiAgICAgIC8vIENsZWFyIGV4aXN0aW5nIHNvcnRzIHVubGVzcyB0aGlzIGlzIGEgbXVsdGlzb3J0IGV2ZW50XG4gICAgICBpZiAoIXNldHRpbmdzLmlucHV0cy5tdWx0aXNvcnQgfHwgIXV0aWxpdHkuYW55TWF0Y2goZSwgc2V0dGluZ3MuaW5wdXRzLm11bHRpc29ydCwgZnVuY3Rpb24oZXZ0LCBrZXkpIHsgcmV0dXJuIGVba2V5XTsgfSkpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxBcnJvd3MoKTtcbiAgICAgICAgb2JqLnNvcnRzLmNsZWFyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHNvcnRzIGZvciB0aGlzIGNvbHVtbiBhcmUgYWxyZWFkeSBzZXRcbiAgICAgIGlmIChzb3J0ZWRCeUNvbHVtbikge1xuICAgICAgICAvLyBJZiBhc2NlbmRpbmcsIHRoZW4gbWFrZSBkZXNjZW5kaW5nXG4gICAgICAgIGlmICh2YWx1ZSA9PSAxKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbHVtbi5zb3J0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgb2JqLnNvcnRzLmFkZChjb2x1bW4uc29ydHNbaV0sIC0xKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hcHBlbmRBcnJvd0Rvd24oJGxpbmspO1xuICAgICAgICAvLyBJZiBkZXNjZW5kaW5nLCByZW1vdmUgc29ydFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2x1bW4uc29ydHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIG9iai5zb3J0cy5yZW1vdmUoY29sdW1uLnNvcnRzW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZW1vdmVBcnJvdygkbGluayk7XG4gICAgICAgIH1cbiAgICAgIC8vIE90aGVyd2lzZSwgaWYgbm90IGFscmVhZHkgc2V0LCBzZXQgdG8gYXNjZW5kaW5nXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29sdW1uLnNvcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgb2JqLnNvcnRzLmFkZChjb2x1bW4uc29ydHNbaV0sIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXBwZW5kQXJyb3dVcCgkbGluayk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuc29ydGVkQnlDb2x1bW4gPSBmdW5jdGlvbigkbGluaywgY29sdW1uKSB7XG4gICAgICByZXR1cm4gdXRpbGl0eS5hbGxNYXRjaChzZXR0aW5ncy5kYXRhc2V0LnNvcnRzLCBjb2x1bW4uc29ydHMsIGZ1bmN0aW9uKHNvcnRzLCBzb3J0KSB7IHJldHVybiBzb3J0IGluIHNvcnRzOyB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5zb3J0ZWRCeUNvbHVtblZhbHVlID0gZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZGF0YXNldC5zb3J0c1tjb2x1bW4uc29ydHNbMF1dO1xuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIFNvcnRzSGVhZGVycztcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkdCwgdXRpbGl0eSkge1xuICBmdW5jdGlvbiBTb3J0cyhvYmosIHNldHRpbmdzKSB7XG4gICAgdGhpcy5pbml0T25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZmVhdHVyZXMuc29ydDtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc29ydHNVcmwgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLm1hdGNoKG5ldyBSZWdFeHAoc2V0dGluZ3MucGFyYW1zLnNvcnRzICsgJ1teJj1dKj1bXiZdKicsICdnJykpO1xuICAgICAgaWYgKHNvcnRzVXJsKSB7XG4gICAgICAgIHNldHRpbmdzLmRhdGFzZXQuc29ydHMgPSB1dGlsaXR5LmRlc2VyaWFsaXplKHNvcnRzVXJsKVtzZXR0aW5ncy5wYXJhbXMuc29ydHNdO1xuICAgICAgfVxuICAgICAgaWYgKCFzZXR0aW5ncy5kYXRhc2V0LnNvcnRzS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgc2V0dGluZ3MuZGF0YXNldC5zb3J0c0tleXMgPSB1dGlsaXR5LmtleXNGcm9tT2JqZWN0KHNldHRpbmdzLmRhdGFzZXQuc29ydHMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGF0dHIsIGRpcmVjdGlvbikge1xuICAgICAgdmFyIHNvcnRzS2V5cyA9IHNldHRpbmdzLmRhdGFzZXQuc29ydHNLZXlzLFxuICAgICAgICAgIGluZGV4ID0gJC5pbkFycmF5KGF0dHIsIHNvcnRzS2V5cyk7XG4gICAgICBzZXR0aW5ncy5kYXRhc2V0LnNvcnRzW2F0dHJdID0gZGlyZWN0aW9uO1xuICAgICAgb2JqLiRlbGVtZW50LnRyaWdnZXIoJ2R5bmF0YWJsZTpzb3J0czphZGRlZCcsIFthdHRyLCBkaXJlY3Rpb25dKTtcbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHsgc29ydHNLZXlzLnB1c2goYXR0cik7IH1cbiAgICAgIHJldHVybiBkdDtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihhdHRyKSB7XG4gICAgICB2YXIgc29ydHNLZXlzID0gc2V0dGluZ3MuZGF0YXNldC5zb3J0c0tleXMsXG4gICAgICAgICAgaW5kZXggPSAkLmluQXJyYXkoYXR0ciwgc29ydHNLZXlzKTtcbiAgICAgIGRlbGV0ZSBzZXR0aW5ncy5kYXRhc2V0LnNvcnRzW2F0dHJdO1xuICAgICAgb2JqLiRlbGVtZW50LnRyaWdnZXIoJ2R5bmF0YWJsZTpzb3J0czpyZW1vdmVkJywgYXR0cik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7IHNvcnRzS2V5cy5zcGxpY2UoaW5kZXgsIDEpOyB9XG4gICAgICByZXR1cm4gZHQ7XG4gICAgfTtcblxuICAgIHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNldHRpbmdzLmRhdGFzZXQuc29ydHMgPSB7fTtcbiAgICAgIHNldHRpbmdzLmRhdGFzZXQuc29ydHNLZXlzLmxlbmd0aCA9IDA7XG4gICAgICBvYmouJGVsZW1lbnQudHJpZ2dlcignZHluYXRhYmxlOnNvcnRzOmNsZWFyZWQnKTtcbiAgICB9O1xuXG4gICAgLy8gVHJ5IHRvIGludGVsbGlnZW50bHkgZ3Vlc3Mgd2hpY2ggc29ydCBmdW5jdGlvbiB0byB1c2VcbiAgICAvLyBiYXNlZCBvbiB0aGUgdHlwZSBvZiBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgIC8vIENvbnNpZGVyIHVzaW5nIHNvbWV0aGluZyBtb3JlIHJvYnVzdCB0aGFuIGB0eXBlb2ZgIChodHRwOi8vamF2YXNjcmlwdHdlYmxvZy53b3JkcHJlc3MuY29tLzIwMTEvMDgvMDgvZml4aW5nLXRoZS1qYXZhc2NyaXB0LXR5cGVvZi1vcGVyYXRvci8pXG4gICAgdGhpcy5ndWVzc1R5cGUgPSBmdW5jdGlvbihhLCBiLCBhdHRyKSB7XG4gICAgICB2YXIgdHlwZXMgPSB7XG4gICAgICAgICAgICBzdHJpbmc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbnVtYmVyOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICdib29sZWFuJzogJ251bWJlcicsXG4gICAgICAgICAgICBvYmplY3Q6ICdudW1iZXInIC8vIGRhdGVzIGFuZCBudWxsIHZhbHVlcyBhcmUgYWxzbyBvYmplY3RzLCB0aGlzIHdvcmtzLi4uXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhdHRyVHlwZSA9IGFbYXR0cl0gPyB0eXBlb2YoYVthdHRyXSkgOiB0eXBlb2YoYlthdHRyXSksXG4gICAgICAgICAgdHlwZSA9IHR5cGVzW2F0dHJUeXBlXSB8fCAnbnVtYmVyJztcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH07XG5cbiAgICAvLyBCdWlsdC1pbiBzb3J0IGZ1bmN0aW9uc1xuICAgIC8vICh0aGUgbW9zdCBjb21tb24gdXNlLWNhc2VzIEkgY291bGQgdGhpbmsgb2YpXG4gICAgdGhpcy5mdW5jdGlvbnMgPSB7XG4gICAgICBudW1iZXI6IGZ1bmN0aW9uKGEsIGIsIGF0dHIsIGRpcmVjdGlvbikge1xuICAgICAgICByZXR1cm4gYVthdHRyXSA9PT0gYlthdHRyXSA/IDAgOiAoZGlyZWN0aW9uID4gMCA/IGFbYXR0cl0gLSBiW2F0dHJdIDogYlthdHRyXSAtIGFbYXR0cl0pO1xuICAgICAgfSxcbiAgICAgIHN0cmluZzogZnVuY3Rpb24oYSwgYiwgYXR0ciwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHZhciBhQXR0ciA9IChhWydkeW5hdGFibGUtc29ydGFibGUtdGV4dCddICYmIGFbJ2R5bmF0YWJsZS1zb3J0YWJsZS10ZXh0J11bYXR0cl0pID8gYVsnZHluYXRhYmxlLXNvcnRhYmxlLXRleHQnXVthdHRyXSA6IGFbYXR0cl0sXG4gICAgICAgICAgICBiQXR0ciA9IChiWydkeW5hdGFibGUtc29ydGFibGUtdGV4dCddICYmIGJbJ2R5bmF0YWJsZS1zb3J0YWJsZS10ZXh0J11bYXR0cl0pID8gYlsnZHluYXRhYmxlLXNvcnRhYmxlLXRleHQnXVthdHRyXSA6IGJbYXR0cl0sXG4gICAgICAgICAgICBjb21wYXJpc29uO1xuICAgICAgICBhQXR0ciA9IGFBdHRyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGJBdHRyID0gYkF0dHIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29tcGFyaXNvbiA9IGFBdHRyID09PSBiQXR0ciA/IDAgOiAoZGlyZWN0aW9uID4gMCA/IGFBdHRyID4gYkF0dHIgOiBiQXR0ciA+IGFBdHRyKTtcbiAgICAgICAgLy8gZm9yY2UgZmFsc2UgYm9vbGVhbiB2YWx1ZSB0byAtMSwgdHJ1ZSB0byAxLCBhbmQgdGllIHRvIDBcbiAgICAgICAgcmV0dXJuIGNvbXBhcmlzb24gPT09IGZhbHNlID8gLTEgOiAoY29tcGFyaXNvbiAtIDApO1xuICAgICAgfSxcbiAgICAgIG9yaWdpbmFsUGxhY2VtZW50OiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBhWydkeW5hdGFibGUtb3JpZ2luYWwtaW5kZXgnXSAtIGJbJ2R5bmF0YWJsZS1vcmlnaW5hbC1pbmRleCddO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIFNvcnRzO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkdCwgdXRpbGl0eSkge1xuICBmdW5jdGlvbiBTdGF0ZShvYmosIHNldHRpbmdzKSB7XG4gICAgdGhpcy5pbml0T25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBDaGVjayBpZiBwdXNoU3RhdGUgb3B0aW9uIGlzIHRydWUsIGFuZCBpZiBicm93c2VyIHN1cHBvcnRzIGl0XG4gICAgICByZXR1cm4gc2V0dGluZ3MuZmVhdHVyZXMucHVzaFN0YXRlICYmIGhpc3RvcnkucHVzaFN0YXRlO1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnN0YXRlICYmIGV2ZW50LnN0YXRlLmR5bmF0YWJsZSkge1xuICAgICAgICAgIG9iai5zdGF0ZS5wb3AoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMucHVzaCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciB1cmxTdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLFxuICAgICAgICAgIHVybE9wdGlvbnMsXG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgaGFzaCxcbiAgICAgICAgICBuZXdQYXJhbXMsXG4gICAgICAgICAgY2FjaGVTdHIsXG4gICAgICAgICAgY2FjaGUsXG4gICAgICAgICAgLy8gcmVwbGFjZVN0YXRlIG9uIGluaXRpYWwgbG9hZCwgdGhlbiBwdXNoU3RhdGUgYWZ0ZXIgdGhhdFxuICAgICAgICAgIGZpcnN0UHVzaCA9ICEod2luZG93Lmhpc3Rvcnkuc3RhdGUgJiYgd2luZG93Lmhpc3Rvcnkuc3RhdGUuZHluYXRhYmxlKSxcbiAgICAgICAgICBwdXNoRnVuY3Rpb24gPSBmaXJzdFB1c2ggPyAncmVwbGFjZVN0YXRlJyA6ICdwdXNoU3RhdGUnO1xuXG4gICAgICBpZiAodXJsU3RyaW5nICYmIC9eXFw/Ly50ZXN0KHVybFN0cmluZykpIHsgdXJsU3RyaW5nID0gdXJsU3RyaW5nLnN1YnN0cmluZygxKTsgfVxuICAgICAgJC5leHRlbmQodXJsT3B0aW9ucywgZGF0YSk7XG5cbiAgICAgIHBhcmFtcyA9IHV0aWxpdHkucmVmcmVzaFF1ZXJ5U3RyaW5nKHVybFN0cmluZywgZGF0YSwgc2V0dGluZ3MpO1xuICAgICAgaWYgKHBhcmFtcykgeyBwYXJhbXMgPSAnPycgKyBwYXJhbXM7IH1cbiAgICAgIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgIG9iai4kZWxlbWVudC50cmlnZ2VyKCdkeW5hdGFibGU6cHVzaCcsIGRhdGEpO1xuXG4gICAgICBjYWNoZSA9IHsgZHluYXRhYmxlOiB7IGRhdGFzZXQ6IHNldHRpbmdzLmRhdGFzZXQgfSB9O1xuICAgICAgaWYgKCFmaXJzdFB1c2gpIHsgY2FjaGUuZHluYXRhYmxlLnNjcm9sbFRvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTsgfVxuICAgICAgY2FjaGVTdHIgPSBKU09OLnN0cmluZ2lmeShjYWNoZSk7XG5cbiAgICAgIC8vIE1vemlsbGEgaGFzIGEgNjQwayBjaGFyIGxpbWl0IG9uIHdoYXQgY2FuIGJlIHN0b3JlZCBpbiBwdXNoU3RhdGUuXG4gICAgICAvLyBTZWUgXCJsaW1pdFwiIGluIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS9NYW5pcHVsYXRpbmdfdGhlX2Jyb3dzZXJfaGlzdG9yeSNUaGVfcHVzaFN0YXRlKCkuQzIuQTBtZXRob2RcbiAgICAgIC8vIGFuZCBcImRhdGFTdHIubGVuZ3RoXCIgaW4gaHR0cDovL3dpbmUuZ2l0LnNvdXJjZWZvcmdlLm5ldC9naXQvZ2l0d2ViLmNnaT9wPXdpbmUvd2luZS1nZWNrbzthPXBhdGNoO2g9NDNhMTFiZGRkYzVmYzFmZjEwMjI3OGExMjBiZTY2YTdiOTBhZmUyOFxuICAgICAgLy9cbiAgICAgIC8vIExpa2V3aXNlLCBvdGhlciBicm93c2VycyBtYXkgaGF2ZSB2YXJ5aW5nICh1bmRvY3VtZW50ZWQpIGxpbWl0cy5cbiAgICAgIC8vIEFsc28sIEZpcmVmb3gncyBsaW1pdCBjYW4gYmUgY2hhbmdlZCBpbiBhYm91dDpjb25maWcgYXMgYnJvd3Nlci5oaXN0b3J5Lm1heFN0YXRlT2JqZWN0U2l6ZVxuICAgICAgLy8gU2luY2Ugd2UgZG9uJ3Qga25vdyB3aGF0IHRoZSBhY3R1YWwgbGltaXQgd2lsbCBiZSBpbiBhbnkgZ2l2ZW4gc2l0dWF0aW9uLCB3ZSdsbCBqdXN0IHRyeSBjYWNoaW5nIGFuZCByZXNjdWVcbiAgICAgIC8vIGFueSBleGNlcHRpb25zIGJ5IHJldHJ5aW5nIHB1c2hTdGF0ZSB3aXRob3V0IGNhY2hpbmcgdGhlIHJlY29yZHMuXG4gICAgICAvL1xuICAgICAgLy8gSSBoYXZlIGFic29sdXRlbHkgbm8gaWRlYSB3aHkgcGVyUGFnZU9wdGlvbnMgc3VkZGVubHkgYmVjb21lcyBhbiBhcnJheS1saWtlIG9iamVjdCBpbnN0ZWFkIG9mIGFuIGFycmF5LFxuICAgICAgLy8gYnV0IGp1c3QgcmVjZW50bHksIHRoaXMgc3RhcnRlZCB0aHJvd2luZyBhbiBlcnJvciBpZiBJIGRvbid0IGNvbnZlcnQgaXQ6XG4gICAgICAvLyAnVW5jYXVnaHQgRXJyb3I6IERBVEFfQ0xPTkVfRVJSOiBET00gRXhjZXB0aW9uIDI1J1xuICAgICAgY2FjaGUuZHluYXRhYmxlLmRhdGFzZXQucGVyUGFnZU9wdGlvbnMgPSAkLm1ha2VBcnJheShjYWNoZS5keW5hdGFibGUuZGF0YXNldC5wZXJQYWdlT3B0aW9ucyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHdpbmRvdy5oaXN0b3J5W3B1c2hGdW5jdGlvbl0oY2FjaGUsIFwiRHluYXRhYmxlIHN0YXRlXCIsIHBhdGggKyBwYXJhbXMgKyBoYXNoKTtcbiAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgLy8gTWFrZSBjYWNoZWQgcmVjb3JkcyA9IG51bGwsIHNvIHRoYXQgYHBvcGAgd2lsbCByZXJ1biBwcm9jZXNzIHRvIHJldHJpZXZlIHJlY29yZHNcbiAgICAgICAgY2FjaGUuZHluYXRhYmxlLmRhdGFzZXQucmVjb3JkcyA9IG51bGw7XG4gICAgICAgIHdpbmRvdy5oaXN0b3J5W3B1c2hGdW5jdGlvbl0oY2FjaGUsIFwiRHluYXRhYmxlIHN0YXRlXCIsIHBhdGggKyBwYXJhbXMgKyBoYXNoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5wb3AgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRhdGEgPSBldmVudC5zdGF0ZS5keW5hdGFibGU7XG4gICAgICBzZXR0aW5ncy5kYXRhc2V0ID0gZGF0YS5kYXRhc2V0O1xuXG4gICAgICBpZiAoZGF0YS5zY3JvbGxUb3ApIHsgJCh3aW5kb3cpLnNjcm9sbFRvcChkYXRhLnNjcm9sbFRvcCk7IH1cblxuICAgICAgLy8gSWYgZGF0YXNldC5yZWNvcmRzIGlzIGNhY2hlZCBmcm9tIHB1c2hTdGF0ZVxuICAgICAgaWYgKCBkYXRhLmRhdGFzZXQucmVjb3JkcyApIHtcbiAgICAgICAgb2JqLmRvbS51cGRhdGUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9iai5wcm9jZXNzKHRydWUpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIFN0YXRlO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRBdHRyaWJ1dGVSZWFkZXI7XG5cbmZ1bmN0aW9uIGRlZmF1bHRBdHRyaWJ1dGVSZWFkZXIoY2VsbCwgcmVjb3JkKSB7XG4gIHJldHVybiAkKGNlbGwpLmh0bWwoKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB7XG4gIG5vcm1hbGl6ZVRleHQ6IGZ1bmN0aW9uKHRleHQsIHN0eWxlKSB7XG4gICAgdGV4dCA9IHRoaXMudGV4dFRyYW5zZm9ybVtzdHlsZV0odGV4dCk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH0sXG4gIHRleHRUcmFuc2Zvcm06IHtcbiAgICB0cmltRGFzaDogZnVuY3Rpb24odGV4dCkge1xuICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIikucmVwbGFjZSgvXFxzKy9nLCBcIi1cIik7XG4gICAgfSxcbiAgICBjYW1lbENhc2U6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgIHRleHQgPSB0aGlzLnRyaW1EYXNoKHRleHQpO1xuICAgICAgcmV0dXJuIHRleHRcbiAgICAgICAgLnJlcGxhY2UoLyhcXC1bYS16QS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiAkMS50b1VwcGVyQ2FzZSgpLnJlcGxhY2UoJy0nLCcnKTt9KVxuICAgICAgICAucmVwbGFjZSgvKFtBLVpdKShbQS1aXSspL2csIGZ1bmN0aW9uKCQxLCQyLCQzKXtyZXR1cm4gJDIgKyAkMy50b0xvd2VyQ2FzZSgpO30pXG4gICAgICAgIC5yZXBsYWNlKC9eW0EtWl0vLCBmdW5jdGlvbigkMSl7cmV0dXJuICQxLnRvTG93ZXJDYXNlKCk7fSk7XG4gICAgfSxcbiAgICBkYXNoZWQ6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgIHRleHQgPSB0aGlzLnRyaW1EYXNoKHRleHQpO1xuICAgICAgcmV0dXJuIHRoaXMubG93ZXJjYXNlKHRleHQpO1xuICAgIH0sXG4gICAgdW5kZXJzY29yZTogZnVuY3Rpb24odGV4dCkge1xuICAgICAgdGV4dCA9IHRoaXMudHJpbURhc2godGV4dCk7XG4gICAgICByZXR1cm4gdGhpcy5sb3dlcmNhc2UodGV4dC5yZXBsYWNlKC8oLSkvZywgJ18nKSk7XG4gICAgfSxcbiAgICBsb3dlcmNhc2U6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiAkMS50b0xvd2VyQ2FzZSgpO30pO1xuICAgIH1cbiAgfSxcbiAgLy8gRGVzZXJpYWxpemUgcGFyYW1zIGluIFVSTCB0byBvYmplY3RcbiAgLy8gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTEzMTYzMC9qYXZhc2NyaXB0LWpxdWVyeS1wYXJhbS1pbnZlcnNlLWZ1bmN0aW9uLzM0MDEyNjUjMzQwMTI2NVxuICBkZXNlcmlhbGl6ZTogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICBpZiAoIXF1ZXJ5KSByZXR1cm4ge307XG4gICAgLy8gbW9kaWZpZWQgdG8gYWNjZXB0IGFuIGFycmF5IG9mIHBhcnRpYWwgVVJMIHN0cmluZ3NcbiAgICBpZiAodHlwZW9mKHF1ZXJ5KSA9PT0gXCJvYmplY3RcIikgeyBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTsgfVxuXG4gICAgdmFyIGhhc2ggPSB7fSxcbiAgICAgICAgdmFycyA9IHF1ZXJ5LnNwbGl0KFwiJlwiKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhaXIgPSB2YXJzW2ldLnNwbGl0KFwiPVwiKSxcbiAgICAgICAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pLFxuICAgICAgICAgIHYsIG07XG5cbiAgICAgIGlmICghcGFpclsxXSkgeyBjb250aW51ZSB9O1xuICAgICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblxuICAgICAgLy8gbW9kaWZpZWQgdG8gcGFyc2UgbXVsdGktbGV2ZWwgcGFyYW1ldGVycyAoZS5nLiBcImhpW3RoZXJlXVtkdWRlXT13aGF0c3VwXCIgPT4gaGk6IHt0aGVyZToge2R1ZGU6IFwid2hhdHN1cFwifX0pXG4gICAgICB3aGlsZSAobSA9IGsubWF0Y2goLyhbXiY9XSspXFxbKFteJj1dKylcXF0kLykpIHtcbiAgICAgICAgdmFyIG9yaWdWID0gdjtcbiAgICAgICAgayA9IG1bMV07XG4gICAgICAgIHYgPSB7fTtcblxuICAgICAgICAvLyBJZiBuZXN0ZWQgcGFyYW0gZW5kcyBpbiAnXVsnLCB0aGVuIHRoZSByZWdleCBhYm92ZSBlcnJvbmVvdXNseSBpbmNsdWRlZCBoYWxmIG9mIGEgdHJhaWxpbmcgJ1tdJyxcbiAgICAgICAgLy8gd2hpY2ggaW5kaWNhdGVzIHRoZSBlbmQtdmFsdWUgaXMgcGFydCBvZiBhbiBhcnJheVxuICAgICAgICBpZiAobVsyXS5zdWJzdHIobVsyXS5sZW5ndGgtMikgPT0gJ11bJykgeyAvLyBtdXN0IHVzZSBzdWJzdHIgZm9yIElFIHRvIHVuZGVyc3RhbmQgaXRcbiAgICAgICAgICB2W21bMl0uc3Vic3RyKDAsbVsyXS5sZW5ndGgtMildID0gW29yaWdWXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2W21bMl1dID0gb3JpZ1Y7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgaXQgaXMgdGhlIGZpcnN0IGVudHJ5IHdpdGggdGhpcyBuYW1lXG4gICAgICBpZiAodHlwZW9mIGhhc2hba10gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKGsuc3Vic3RyKGsubGVuZ3RoLTIpICE9ICdbXScpIHsgLy8gbm90IGVuZCB3aXRoIFtdLiBjYW5ub3QgdXNlIG5lZ2F0aXZlIGluZGV4IGFzIElFIGRvZXNuJ3QgdW5kZXJzdGFuZCBpdFxuICAgICAgICAgIGhhc2hba10gPSB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhhc2hba10gPSBbdl07XG4gICAgICAgIH1cbiAgICAgIC8vIElmIHN1YnNlcXVlbnQgZW50cnkgd2l0aCB0aGlzIG5hbWUgYW5kIG5vdCBhcnJheVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaGFzaFtrXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBoYXNoW2tdID0gdjsgIC8vIHJlcGxhY2UgaXRcbiAgICAgIC8vIG1vZGlmaWVkIHRvIGFkZCBzdXBwb3J0IGZvciBvYmplY3RzXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBoYXNoW2tdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGhhc2hba10gPSAkLmV4dGVuZCh7fSwgaGFzaFtrXSwgdik7XG4gICAgICAvLyBJZiBzdWJzZXF1ZW50IGVudHJ5IHdpdGggdGhpcyBuYW1lIGFuZCBpcyBhcnJheVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGFzaFtrXS5wdXNoKHYpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbiAgfSxcbiAgcmVmcmVzaFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbih1cmxTdHJpbmcsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgcXVlcnlTdHJpbmcgPSB1cmxTdHJpbmcuc3BsaXQoJz8nKSxcbiAgICAgICAgcGF0aCA9IHF1ZXJ5U3RyaW5nLnNoaWZ0KCksXG4gICAgICAgIHVybE9wdGlvbnM7XG5cbiAgICB1cmxPcHRpb25zID0gdGhpcy5kZXNlcmlhbGl6ZSh1cmxTdHJpbmcpO1xuXG4gICAgLy8gTG9vcCB0aHJvdWdoIGVhY2ggZHluYXRhYmxlIHBhcmFtIGFuZCB1cGRhdGUgdGhlIFVSTCB3aXRoIGl0XG4gICAgZm9yIChhdHRyIGluIHNldHRpbmdzLnBhcmFtcykge1xuICAgICAgaWYgKHNldHRpbmdzLnBhcmFtcy5oYXNPd25Qcm9wZXJ0eShhdHRyKSkge1xuICAgICAgICB2YXIgbGFiZWwgPSBzZXR0aW5ncy5wYXJhbXNbYXR0cl07XG4gICAgICAgIC8vIFNraXAgb3ZlciBwYXJhbWV0ZXJzIG1hdGNoaW5nIGF0dHJpYnV0ZXMgZm9yIGRpc2FibGVkIGZlYXR1cmVzIChpLmUuIGxlYXZlIHRoZW0gdW50b3VjaGVkKSxcbiAgICAgICAgLy8gYmVjYXVzZSBpZiB0aGUgZmVhdHVyZSBpcyB0dXJuZWQgb2ZmLCB0aGVuIHBhcmFtZXRlciBuYW1lIGlzIGEgY29pbmNpZGVuY2UgYW5kIGl0J3MgdW5yZWxhdGVkIHRvIGR5bmF0YWJsZS5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICghc2V0dGluZ3MuZmVhdHVyZXMuc29ydCAmJiBhdHRyID09IFwic29ydHNcIikgfHxcbiAgICAgICAgICAgICghc2V0dGluZ3MuZmVhdHVyZXMucGFnaW5hdGUgJiYgX3RoaXMuYW55TWF0Y2goYXR0ciwgW1wicGFnZVwiLCBcInBlclBhZ2VcIiwgXCJvZmZzZXRcIl0sIGZ1bmN0aW9uKGF0dHIsIHBhcmFtKSB7IHJldHVybiBhdHRyID09IHBhcmFtOyB9KSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWxldGUgcGFnZSBhbmQgb2Zmc2V0IGZyb20gdXJsIHBhcmFtcyBpZiBvbiBwYWdlIDEgKGRlZmF1bHQpXG4gICAgICAgIGlmICgoYXR0ciA9PT0gXCJwYWdlXCIgfHwgYXR0ciA9PT0gXCJvZmZzZXRcIikgJiYgZGF0YVtcInBhZ2VcIl0gPT09IDEpIHtcbiAgICAgICAgICBpZiAodXJsT3B0aW9uc1tsYWJlbF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB1cmxPcHRpb25zW2xhYmVsXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWxldGUgcGVyUGFnZSBmcm9tIHVybCBwYXJhbXMgaWYgZGVmYXVsdCBwZXJQYWdlIHZhbHVlXG4gICAgICAgIGlmIChhdHRyID09PSBcInBlclBhZ2VcIiAmJiBkYXRhW2xhYmVsXSA9PSBzZXR0aW5ncy5kYXRhc2V0LnBlclBhZ2VEZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHVybE9wdGlvbnNbbGFiZWxdKSB7XG4gICAgICAgICAgICBkZWxldGUgdXJsT3B0aW9uc1tsYWJlbF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIHF1ZXJpZXMsIHdlJ3JlIGdvaW5nIHRvIGhhbmRsZSBlYWNoIHBvc3NpYmxlIHF1ZXJ5IHBhcmFtZXRlciBpbmRpdmlkdWFsbHkgaGVyZSBpbnN0ZWFkIG9mXG4gICAgICAgIC8vIGhhbmRsaW5nIHRoZSBlbnRpcmUgcXVlcmllcyBvYmplY3QgYmVsb3csIHNpbmNlIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBpcyBhIHF1ZXJ5IGNvbnRyb2xsZWQgYnkgZHluYXRhYmxlLlxuICAgICAgICBpZiAoYXR0ciA9PSBcInF1ZXJpZXNcIiAmJiBkYXRhW2xhYmVsXSkge1xuICAgICAgICAgIHZhciBxdWVyaWVzID0gc2V0dGluZ3MuaW5wdXRzLnF1ZXJpZXMgfHwgW10sXG4gICAgICAgICAgICAgIGlucHV0UXVlcmllcyA9ICQubWFrZUFycmF5KHF1ZXJpZXMubWFwKGZ1bmN0aW9uKCkgeyByZXR1cm4gJCh0aGlzKS5hdHRyKCduYW1lJykgfSkpO1xuXG4gICAgICAgICAgaWYgKHNldHRpbmdzLmZlYXR1cmVzLnNlYXJjaCkgeyBpbnB1dFF1ZXJpZXMucHVzaCgnc2VhcmNoJyk7IH1cblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBpbnB1dFF1ZXJpZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gaW5wdXRRdWVyaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGRhdGFbbGFiZWxdW2F0dHJdKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdXJsT3B0aW9uc1tsYWJlbF0gPT09ICd1bmRlZmluZWQnKSB7IHVybE9wdGlvbnNbbGFiZWxdID0ge307IH1cbiAgICAgICAgICAgICAgdXJsT3B0aW9uc1tsYWJlbF1bYXR0cl0gPSBkYXRhW2xhYmVsXVthdHRyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmICh1cmxPcHRpb25zICYmIHVybE9wdGlvbnNbbGFiZWxdICYmIHVybE9wdGlvbnNbbGFiZWxdW2F0dHJdKSB7IGRlbGV0ZSB1cmxPcHRpb25zW2xhYmVsXVthdHRyXTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGhhdmVuJ3QgcmV0dXJuZWQgdHJ1ZSBieSBub3csIHRoZW4gd2UgYWN0dWFsbHkgd2FudCB0byB1cGRhdGUgdGhlIHBhcmFtZXRlciBpbiB0aGUgVVJMXG4gICAgICAgIGlmIChkYXRhW2xhYmVsXSkge1xuICAgICAgICAgIHVybE9wdGlvbnNbbGFiZWxdID0gZGF0YVtsYWJlbF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIHVybE9wdGlvbnNbbGFiZWxdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkLnBhcmFtKHVybE9wdGlvbnMpO1xuICB9LFxuICAvLyBHZXQgYXJyYXkgb2Yga2V5cyBmcm9tIG9iamVjdFxuICAvLyBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDgwMTYvaG93LXRvLWxpc3QtdGhlLXByb3BlcnRpZXMtb2YtYS1qYXZhc2NyaXB0LW9iamVjdC8yMDgwMjAjMjA4MDIwXG4gIGtleXNGcm9tT2JqZWN0OiBmdW5jdGlvbihvYmope1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iail7XG4gICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH0sXG4gIC8vIEZpbmQgYW4gb2JqZWN0IGluIGFuIGFycmF5IG9mIG9iamVjdHMgYnkgYXR0cmlidXRlcy5cbiAgLy8gRS5nLiBmaW5kIG9iamVjdCB3aXRoIHtpZDogJ2hpJywgbmFtZTogJ3RoZXJlJ30gaW4gYW4gYXJyYXkgb2Ygb2JqZWN0c1xuICBmaW5kT2JqZWN0SW5BcnJheTogZnVuY3Rpb24oYXJyYXksIG9iamVjdEF0dHIpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBmb3VuZE9iamVjdDtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gYXJyYXlbaV07XG4gICAgICAvLyBGb3IgZWFjaCBvYmplY3QgaW4gYXJyYXksIHRlc3QgdG8gbWFrZSBzdXJlIGFsbCBhdHRyaWJ1dGVzIGluIG9iamVjdEF0dHIgbWF0Y2hcbiAgICAgIGlmIChfdGhpcy5hbGxNYXRjaChpdGVtLCBvYmplY3RBdHRyLCBmdW5jdGlvbihpdGVtLCBrZXksIHZhbHVlKSB7IHJldHVybiBpdGVtW2tleV0gPT0gdmFsdWU7IH0pKSB7XG4gICAgICAgIGZvdW5kT2JqZWN0ID0gaXRlbTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZE9iamVjdDtcbiAgfSxcbiAgLy8gUmV0dXJuIHRydWUgaWYgc3VwcGxpZWQgdGVzdCBmdW5jdGlvbiBwYXNzZXMgZm9yIEFMTCBpdGVtcyBpbiBhbiBhcnJheVxuICBhbGxNYXRjaDogZnVuY3Rpb24oaXRlbSwgYXJyYXlPck9iamVjdCwgdGVzdCkge1xuICAgIC8vIHN0YXJ0IG9mZiB3aXRoIHRydWUgcmVzdWx0IGJ5IGRlZmF1bHRcbiAgICB2YXIgbWF0Y2ggPSB0cnVlLFxuICAgICAgICBpc0FycmF5ID0gJC5pc0FycmF5KGFycmF5T3JPYmplY3QpO1xuICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgaXRlbXMgaW4gYXJyYXlcbiAgICAkLmVhY2goYXJyYXlPck9iamVjdCwgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IGlzQXJyYXkgPyB0ZXN0KGl0ZW0sIHZhbHVlKSA6IHRlc3QoaXRlbSwga2V5LCB2YWx1ZSk7XG4gICAgICAvLyBJZiBhIHNpbmdsZSBpdGVtIHRlc3RzIGZhbHNlLCBnbyBhaGVhZCBhbmQgYnJlYWsgdGhlIGFycmF5IGJ5IHJldHVybmluZyBmYWxzZVxuICAgICAgLy8gYW5kIHJldHVybiBmYWxzZSBhcyByZXN1bHQsXG4gICAgICAvLyBvdGhlcndpc2UsIGNvbnRpbnVlIHdpdGggbmV4dCBpdGVyYXRpb24gaW4gbG9vcFxuICAgICAgLy8gKGlmIHdlIG1ha2UgaXQgdGhyb3VnaCBhbGwgaXRlcmF0aW9ucyB3aXRob3V0IG92ZXJyaWRpbmcgbWF0Y2ggd2l0aCBmYWxzZSxcbiAgICAgIC8vIHRoZW4gd2UgY2FuIHJldHVybiB0aGUgdHJ1ZSByZXN1bHQgd2Ugc3RhcnRlZCB3aXRoIGJ5IGRlZmF1bHQpXG4gICAgICBpZiAoIXJlc3VsdCkgeyByZXR1cm4gbWF0Y2ggPSBmYWxzZTsgfVxuICAgIH0pO1xuICAgIHJldHVybiBtYXRjaDtcbiAgfSxcbiAgLy8gUmV0dXJuIHRydWUgaWYgc3VwcGxpZWQgdGVzdCBmdW5jdGlvbiBwYXNzZXMgZm9yIEFOWSBpdGVtcyBpbiBhbiBhcnJheVxuICBhbnlNYXRjaDogZnVuY3Rpb24oaXRlbSwgYXJyYXlPck9iamVjdCwgdGVzdCkge1xuICAgIHZhciBtYXRjaCA9IGZhbHNlLFxuICAgICAgICBpc0FycmF5ID0gJC5pc0FycmF5KGFycmF5T3JPYmplY3QpO1xuXG4gICAgJC5lYWNoKGFycmF5T3JPYmplY3QsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIHZhciByZXN1bHQgPSBpc0FycmF5ID8gdGVzdChpdGVtLCB2YWx1ZSkgOiB0ZXN0KGl0ZW0sIGtleSwgdmFsdWUpO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBBcyBzb29uIGFzIGEgbWF0Y2ggaXMgZm91bmQsIHNldCBtYXRjaCB0byB0cnVlLCBhbmQgcmV0dXJuIGZhbHNlIHRvIHN0b3AgdGhlIGAkLmVhY2hgIGxvb3BcbiAgICAgICAgbWF0Y2ggPSB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9LFxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWxcbiAgLy8gKGkuZS4gaGF2ZSB0aGUgc2FtZSBhdHRyaWJ1dGVzIGFuZCBhdHRyaWJ1dGUgdmFsdWVzKVxuICBvYmplY3RzRXF1YWw6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICBmb3IgKGF0dHIgaW4gYSkge1xuICAgICAgaWYgKGEuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgaWYgKCFiLmhhc093blByb3BlcnR5KGF0dHIpIHx8IGFbYXR0cl0gIT09IGJbYXR0cl0pIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChhdHRyIGluIGIpIHtcbiAgICAgIGlmIChiLmhhc093blByb3BlcnR5KGF0dHIpICYmICFhLmhhc093blByb3BlcnR5KGF0dHIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIC8vIFRha2VuIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvaG93LXRvLWNyZWF0ZS1hLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0LzEwNTA3NCMxMDUwNzRcbiAgcmFuZG9tSGFzaDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICgoKDErTWF0aC5yYW5kb20oKSkqMHgxMDAwMCl8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbiAgfSxcbiAgLy8gQWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzc3OTYxL2VmZmljaWVudC1qYXZhc2NyaXB0LXN0cmluZy1yZXBsYWNlbWVudC8zNzgwMDEjMzc4MDAxXG4gIHRlbXBsYXRlOiBmdW5jdGlvbihzdHIsIGRhdGEpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL3soXFx3Kil9L2csIGZ1bmN0aW9uKG1hdGNoLCBrZXkpIHtcbiAgICAgIHJldHVybiBkYXRhLmhhc093blByb3BlcnR5KGtleSkgPyBkYXRhW2tleV0gOiBcIlwiO1xuICAgIH0pO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0QXR0cmlidXRlV3JpdGVyO1xuXG5mdW5jdGlvbiBkZWZhdWx0QXR0cmlidXRlV3JpdGVyKHJlY29yZCkge1xuICAvLyBgdGhpc2AgaXMgdGhlIGNvbHVtbiBvYmplY3QgaW4gc2V0dGluZ3MuY29sdW1uc1xuICAvLyBUT0RPOiBhdXRvbWF0aWNhbGx5IGNvbnZlcnQgY29tbW9uIHR5cGVzLCBzdWNoIGFzIGFycmF5cyBhbmQgb2JqZWN0cywgdG8gc3RyaW5nXG4gIHJldHVybiByZWNvcmRbdGhpcy5pZF07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0Q2VsbFdyaXRlcjtcblxuZnVuY3Rpb24gZGVmYXVsdENlbGxXcml0ZXIoY29sdW1uLCByZWNvcmQpIHtcbiAgdmFyIGh0bWwgPSBjb2x1bW4uYXR0cmlidXRlV3JpdGVyKHJlY29yZCksXG4gICAgICB0ZCA9ICc8dGQnO1xuXG4gIGlmIChjb2x1bW4uaGlkZGVuIHx8IGNvbHVtbi50ZXh0QWxpZ24pIHtcbiAgICB0ZCArPSAnIHN0eWxlPVwiJztcblxuICAgIC8vIGtlZXAgY2VsbHMgZm9yIGhpZGRlbiBjb2x1bW4gaGVhZGVycyBoaWRkZW5cbiAgICBpZiAoY29sdW1uLmhpZGRlbikge1xuICAgICAgdGQgKz0gJ2Rpc3BsYXk6IG5vbmU7JztcbiAgICB9XG5cbiAgICAvLyBrZWVwIGNlbGxzIGFsaWduZWQgYXMgdGhlaXIgY29sdW1uIGhlYWRlcnMgYXJlIGFsaWduZWRcbiAgICBpZiAoY29sdW1uLnRleHRBbGlnbikge1xuICAgICAgdGQgKz0gJ3RleHQtYWxpZ246ICcgKyBjb2x1bW4udGV4dEFsaWduICsgJzsnO1xuICAgIH1cblxuICAgIHRkICs9ICdcIic7XG4gIH1cblxuICBpZiAoY29sdW1uLmNzc0NsYXNzKSB7XG4gICAgdGQgKz0gJyBjbGFzcz1cIicgKyBjb2x1bW4uY3NzQ2xhc3MgKyAnXCInO1xuICB9XG5cbiAgcmV0dXJuIHRkICsgJz4nICsgaHRtbCArICc8L3RkPic7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0Um93V3JpdGVyO1xuXG5mdW5jdGlvbiBkZWZhdWx0Um93V3JpdGVyKHJvd0luZGV4LCByZWNvcmQsIGNvbHVtbnMsIGNlbGxXcml0ZXIpIHtcbiAgdmFyIHRyID0gJyc7XG5cbiAgLy8gZ3JhYiB0aGUgcmVjb3JkJ3MgYXR0cmlidXRlIGZvciBlYWNoIGNvbHVtblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29sdW1ucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHRyICs9IGNlbGxXcml0ZXIoY29sdW1uc1tpXSwgcmVjb3JkKTtcbiAgfVxuXG4gIHJldHVybiAnPHRyPicgKyB0ciArICc8L3RyPic7XG59O1xuIl19
