var PeopleDocuments = function(options){
    var self = this;
    return {
        
        viewModelMap: {
            create: function (options) {
                return ko.mapping.fromJS(options.data, {
                    'Rows': {
                        key: function (item) {
                            return ko.utils.unwrapObservable(item.Id);
                        },
                        create: function (options) {
                            var result = ko.mapping.fromJS(options.data, {
                                'Id': {
                                    create: function (options) {
                                        return ko.protectedObservable(options.data);
                                    }
                                },
                                'Name': {
                                    create: function (options) {
                                        return ko.protectedObservable(options.data);
                                    }
                                }
                            });

                            result.Title = ko.computed(function () {
                                return result.Name();
                            });
                            return result;
                        }
                    }

                });
            }

        },
        destroy: function () {
            options.element.gridcontrol('destroy');
            options.element.gridcontrol = null;
            options = null;
        },
        init: function () {
            options.element.gridcontrol({
                dataUrl: '/Home/People',
                saveUrl: '/Home/People',
                deleteUrl:'notimplemented',
                inlineEdit: true,                
                error: function (options) {
                    if (options.item) {
                        var message = 'There was an error saving item ' + options.item.Id;
                        $('.header-top').notify(message);
                    }

                },
                onSave: function (options) {
                    var item = ko.dataFor(options.currentTarget);
                    item.Name.commit();
                    return true;
                },
                viewModelMap: this.viewModelMap,
                add: function () {
                    var newRow = ko.mapping.fromJS({ Id: "", Name: options.element.find('.edit-new:first').val() });
                    options.element.find('.edit-new:first').val('');
                    return newRow;
                },
                gridRowCreated: function (element) {
                    //our customization for the add column
                    if ($(element).find('.template-column').length == 0)
                        $(element).append('<td data-column="template" class="template-column">&nbsp</td>');
                },
                edit: function (options) {
                    //find add button assign function
                    //this controls edit template not grid
                    options.element.find('.add-button').on('click', function (s) {
                        var data = ko.dataFor(options.element.currentTarget);
                        options.element.find('.new-person:first').val('');
                    });
                    $options.element.find('.person-list:first').on('click', function (s) {
                        if ($(s.target).hasClass('delete-button')) {
                            var row = ko.dataFor($('.row-editor')[0]);
                        }

                    });

                },
                cancelEdit: function (s) {
                    var item = ko.dataFor(s.currentTarget);
                    item.Name.reset();
                }
            });
            options.element.gridcontrol('loadData');

        }
    }
}

