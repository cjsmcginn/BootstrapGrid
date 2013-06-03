
!function ($) {

    var GridControl = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.gridcontrol.defaults, options);
        if (this.options.parent)
            this.$parent = $(this.options.parent);

    };


    $.fn.gridcontrol = function (option) {
        return this.each(function () {
            var $this = $(this)
           , data = $this.data('gridcontrol')
           , options = $.extend({}, $.fn.gridcontrol.defaults, $this.data(), typeof option == 'object' && option)
            if (!data) {
                $this.data('gridcontrol', (data = new GridControl(this, options)))
                data.init();
            }

            if (typeof option == 'string') data[option]()
            else if (options.show) data.show()
        });
    };
    GridControl.prototype = {
        inlineEdit: function (s) {
            var $this = this;            
            var item = ko.dataFor(s.currentTarget);
            ko.renderTemplate('row-edit-template', item, {}, $(s.currentTarget)[0]);
            $(s.currentTarget).find('.edit-save:first').on('click', function (s) { $this.save(s) });
            $(s.currentTarget).find('.edit-cancel:first').on('click', function (s) { $this.cancelEdit(s); });
            $(s.currentTarget).find('.edit-delete:first').on('click', function (s) { $this.deleteRow(s); });
            
        },
        editAdd: function (s) {
            var $this = this;
            var newRow = $this.options.add();
            if (newRow) {
                $this.viewModel.Rows.unshift(newRow);
                $this.save(newRow);
            }
        },
        edit: function (s) {
            var $this = this;
            if ($this.options.inlineEdit)
                $this.inlineEdit(s);
            else {
                var item = ko.dataFor(s.currentTarget);
                ko.renderTemplate('row-edit-template', item, {}, $('.row-edit')[0]);
                $this.$element.find('.edit-save').on('click', item.saveRow);
                $this.$element.find('.modal-title').text(item.Title());
                $this.options.edit({ element: s, data: item });
                $this.$element.find('.modal-edit').modal('show');
            }

        },
        cancelEdit: function (s) {
            var $this = this;           
            $this.options.cancelEdit(s);         
        },
        search: function (s) {
            $this = this;
            var action = $(s.currentTarget).data('filter');
            if (action == 'clear')
                ko.dataFor(s.currentTarget).FilterExpression(null);
            //either way we will filter
            $this.refreshData();
        },
        deleteRow: function (s, ui) {
            var $this = this;
            var item = ko.dataFor(s.currentTarget);
            if (!$this.options.deleteUrl) {
                $this.viewModel.Rows.remove(item);
                return;
            }

            
            var model = ko.mapping.toJS(item);
            amplify.request({
                resourceId: 'gridcontrol.deleteData', data: JSON.stringify(model), success: function (data, status) {
                    amplify.publish($this.events.deleteDataComplete, data, status);
                }, error: function (data, status) {
                    var options = { data: data, status: status, item: model };
                    $this.onDataError(options);
                }
            });
            $this.viewModel.Rows.remove(item);            
        },

        save: function (s) {
            var $this = this;
            var item = null;
            if (s.currentTarget) {
                item = ko.dataFor(s.currentTarget);
                if (!$this.options.onSave(s))
                    return;
            }
            else
                item = s;            
         
            var model = ko.mapping.toJS(item);
            amplify.request({
                resourceId: 'gridcontrol.saveData', data: JSON.stringify(model), success: function (data, status) {
                    amplify.publish($this.events.saveDataComplete, data, status);
                }, error: function (data, status) {
                    var options = { data: data, status: status, item: model };
                    $this.onDataError(options);
                }
            });
            $('.modal-edit').modal('hide');
        },
        hideOverlay: function () {
            $('.grid-overlay').hide();
        },
        page: function (s) {
            var $this = this;
            var pageIndex = $this.viewModel.Pager.PageIndex();
            var arg = $(s.currentTarget).data('page');
            switch (arg) {
                case 'first':
                    $this.viewModel.Pager.PageIndex(0);
                    break;
                case 'last':
                    $this.viewModel.Pager.PageIndex($this.viewModel.Pager.TotalPages()-1);
                    break;
                case 'next':
                    $this.viewModel.Pager.PageIndex(pageIndex + 1);
                    break;
                case 'previous':
                    $this.viewModel.Pager.PageIndex(pageIndex - 1);
                    break;
                case 'change':
                    $this.viewModel.Pager.PageIndex($this.viewModel.Pager.CurrentPage() - 1);
                    break;
                default:
                    break;
            }
            $this.refreshData();

        },
        refreshPager: function () {
            var $this = this;
            var pageControls = $this.$element.find('.page-control');
            pageControls.each(function (item) {
                $(this).removeClass('.icon-white');
                $(this).data('disabled', true);
            });


            var first = $(pageControls[0]);
            var previous = $(pageControls[1]);
            var next = $(pageControls[2]);
            var last = $(pageControls[3]);
            //multiple pages
            if ($this.viewModel.Pager.TotalPages() > 1) {
                //first page
                if ($this.viewModel.Pager.CurrentPage() == 1) {
                    next.data('disabled', false);
                    last.data('disabled', false);
                }
                    //not first page
                else if ($this.viewModel.Pager.CurrentPage() > 1) {
                    first.data('disabled', false);
                    previous.data('disabled', false);
                    //not last page
                    if ($this.viewModel.Pager.CurrentPage() < $this.viewModel.Pager.TotalPages()) {
                        next.data('disabled', false);
                        last.data('disabled', false);
                    }
                }
            }
            pageControls.each(function (item) {
                if ($(this).data('disabled') == false)
                    $(this).addClass('icon-white');
            });
        },
        refreshData: function () {
            var $this = this;
            $this.showOverlay();
            //clear rows
            var model = ko.mapping.toJS($this.viewModel);
            model.Rows = [];
            amplify.request({
                resourceId: 'gridcontrol.refreshData', data: JSON.stringify(model), success: function (data, status) {
                    amplify.publish($this.events.refreshDataComplete, data, status);
                }, error: function (data, status) { }
            });
        },

        sortColumn: function (s) {
            var $this = this;
            var data = ko.dataFor(s.currentTarget);
            var column = data.Column();
            $('i.icon-chevron-down').each(function () {
                $(this).removeClass('icon-chevron-down');
            });
            $('i.icon-chevron-up').each(function () {
                $(this).removeClass('icon-chevron-up');
            });
            //current order
            var order = data.SortOrder();
            if (order < 2)
                data.SortOrder(2);
            else
                data.SortOrder(1);

            $this.viewModel.Rows.sort(function (left, right) {
                var leftVal = left[column]() == '' ? '' : left[column]().toLowerCase();
                var rightVal = right[column]() == '' ? '' : right[column]().toLowerCase();
                if (order < 2) {
                    return leftVal == rightVal ? 0 : (leftVal < rightVal ? -1 : 1)
                }
                else {
                    return leftVal == rightVal ? 0 : (leftVal > rightVal ? -1 : 1)
                }

            });
            if (data.SortOrder() == 1) {
                $(s.currentTarget).find('i:first').removeClass('icon-chevron-down');
                $(s.currentTarget).find('i:first').addClass('icon-chevron-up');
            } else if (data.SortOrder() == 2) {
                $(s.currentTarget).find('i:first').removeClass('icon-chevron-up');
                $(s.currentTarget).find('i:first').addClass('icon-chevron-down');
            }

        },
        showOverlay: function (options) {
            var $this = this;
            if (options && options.hideLoadingImage)
                $('.grid-overlay:first #loading-image').hide();
            else
                $('.grid-overlay .loading-image').show();

            var parent = $this.options.overlayParent;
            var target = $('#overlay.grid-overlay');
            var totalHeight = parent.height();
            var totalWidth = parent.width();
            

            if($this.$element.find('.grid table').length>0)
            {
                parent = $($this.$element.find('thead tr')[1]);            
                totalHeight = $('tbody').height() + $($('thead tr')[1]).height();
         
            }
            var loaderPosition = (totalHeight / 2) - 16;
            $('.grid-overlay .loading-image').css('padding-top', loaderPosition + 'px');
            target.css({ 'top': parent.position().top + 'px', left: parent.position().left + 'px', width: totalWidth, height: totalHeight });
       
            $('.grid-overlay').show();

        },
        constructor: GridControl,
        viewModel: null,
        init: function () {
            var $this = this;
            ko.bindingHandlers.gridRow = {
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var columns = bindingContext.$root.Columns();
                    var $element = $(element);
                    ko.utils.arrayForEach(columns, function (column) {
                        var gridColumn = $('<td/>');
                        gridColumn.data('column', column.Column());
                        $element.append(gridColumn);
                    });
                    $this.options.gridRowCreated(element);
                },
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    $(element).find('td').each(function () {
                        var column = $(this).data('column');
                        var value = '';
                        if (viewModel[column])
                            value = viewModel[column]();                    
                        $(this).text(value);

                    });
                    $this.options.gridRowCreated(element);
                }
            };
            var $this = this;
            if ($this.options.dataUrl) {
                amplify.request.define('gridcontrol.getData', 'ajax', {
                    url: $this.options.dataUrl,
                    dataType: 'json',
                    type: 'GET'
                });
                amplify.request.define('gridcontrol.refreshData', 'ajax', {
                    url: $this.options.dataUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    type: 'POST'
                });
                amplify.request.define('gridcontrol.saveData', 'ajax', {
                    url: $this.options.saveUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    type: 'POST'
                });
                amplify.request.define('gridcontrol.deleteData', 'ajax', {
                    url: $this.options.deleteUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    type: 'POST'
                });
            }
            amplify.subscribe($this.events.getDataComplete, function (data, status) {
                $this.onGetDataComplete(data, status);
                $this.options.loaded(data);
            });
            amplify.subscribe($this.events.refreshDataComplete, function (data, status) {
                $this.onRefreshDataComplete(data, status);
                $this.options.refreshed(data);
            });
            amplify.subscribe($this.events.saveDataComplete, function (data, status) {
                $this.onSaveDataComplete(data, status);
            });
        },
        //eventHandlers
        onDataError: function (options) {
            var $this = this;
            var message = 'An error occured';
            this.options.error(options);

        },
        onGetDataComplete: function (data, status) {
            var $this = this;
            $this.onRefreshDataComplete(data, status);
            //handlers loaded once
            $this.$element.find('#modal-edit').on('shown', function () { $this.showOverlay({ hideLoadingImage: true }); });
            $this.$element.find('#modal-edit').on('hidden', function () { $this.hideOverlay(); $('.row-edit').empty() });
           
            
        },
        onRefreshDataComplete: function (data, status) {
            var $this = this;
            $this.viewModel = ko.mapping.fromJS(data, $this.options.viewModelMap);
            ko.renderTemplate($this.options.templateName, $this.viewModel, {}, $this.$element[0]);
            $this.$element.find('.grid-sort').on('click', function (s) { $this.sortColumn(s); });
            $this.$element.find('.page-control').on('click', function (s) { $this.page(s); });
            $this.$element.find('.current-page').on('change', function (s) { $this.page(s); });
            $this.$element.find('.page-size').on('change', function (s) { $this.page(s); });
            $this.$element.find('.grid-row').on('dblclick', function (s) { $this.edit(s); });
            $this.$element.find('.grid-search').on('click', function (s) { $this.search(s); });
            $this.$element.find('.edit-add:first').on('click', function (s) { $this.editAdd(s); });
            $this.refreshPager();
            $this.hideOverlay();
            ko.protectedObservable($this.viewModel);
        },
        onSaveDataComplete: function (data, status) {
            var $this = this;



        },
        destroy: function () {
            var $this = this;
            $this.viewModel = null;
            ko.cleanNode($this.$element);
            $this.$element.find('.grid-sort').unbind();
            $this.$element.find('.page-control').unbind();
            $this.$element.find('.current-page').unbind();
            $this.$element.find('.page-size').unbind();
            $this.$element.find('.grid-row').unbind();
            $this.$element.find('.grid-search').unbind();
            $this.$element.find('.edit-add:first').unbind();
            $this.$element.find('.edit-add:first').unbind();
            $this.$element.find('.edit-save:first').unbind();
            $this.$element.find('.edit-cancel:first').unbind();
            $this.$element.find('.edit-delete:first').unbind();
            $this.$element.data('gridcontrol', null);
            $this.$element.empty();            
        },
        events: {
            getDataComplete: 'getDataComplete',
            refreshDataComplete: 'refreshDataComplete',
            saveDataComplete: 'saveDataComplete',
            deleteDataComplete:'deleteDataComplete'
        },
        loadData: function () {
            var $this = this;
            $this.showOverlay();
            amplify.request({
                resourceId: 'gridcontrol.getData', success: function (data, status) {
                    amplify.publish($this.events.getDataComplete, data, status);
                }, error: function (data, status) { }
            })

        }
    }
    var old = $.fn.gridcontrol;

    $.fn.gridcontrol.Constructor = GridControl;


    $.fn.gridcontrol.defaults = {
        dataUrl: false,
        saveUrl: false,
        deleteUrl:false,
        inline: false,
        reload:false,
        //callbacks
        overlayParent:$('.grid'),
        loaded: function (options) { },
        refreshed: function (options) { },
        error: function (options) { },
        edit: function (options) { },
        add: function (options) { },
        gridRowCreated:function(element){},
        cancelEdit:function(options){},
        onSave: function (options) { return true; },//give a chance for owner to cancel
        viewModelMap: {
            create: function (options) {
                return ko.mapping.fromJS(options.data);
            }
        },
        templateName: 'grid-template',
        events: {
            dataLoaded: 'dataLoaded'

        }
    }


}(window.jQuery);