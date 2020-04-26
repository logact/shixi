define([], function () {
    var app = angular.module('app');//并没有在html文件发现有这个ng-app但是为什么这里可以被angular.js所托管
    app.controller('ProductController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'session', 'SecurityService', 'janus', 'I18nService', 'websocket',
        function ($scope, $state, DBUtils, dialog, $element, session, SecurityService, janus, I18nService,websocket) {
            var ctrl = this;
            $scope.entity = {};
            _.extend(ctrl, {

//            从excel 中导出
                exportFromData: function () {
                    window.open('product/exportFromData')
                },
//         从excel 中导入
                importFromTemplate: function () {
                    dialog.show({
                        template: 'product_import_from_excel_template',
                        title: '产品数据列表的导入',
                        width: 1100,
//                        控制器？？？传入这个服务中？
                        controller: ['$scope', '$element', function (dialogScope, $element) {
                            var uploadSuccess = false;
                            dialogScope.importing = false;
                            websocket.sub({
                                topic: 'importDataStruct/productImport',
                                onmessage: function (message) {
                                    if (message) {
                                        // $('.import_result').append(message.message);
                                        var state = message.state;
                                        if (state) {
                                            switch (state) {
                                                case 'error':
                                                    $element.find('#import_result').append(errorMessage(message.message));
                                                    break;
                                                case 'success':
                                                    uploadSuccess = true;
                                                    break;
                                                case 'finished':
                                                    $element.find('#import_result').append(finishedMessage(message.message));
                                                    break;
                                            }
                                        }
                                    }
                                }
                            });

                            function errorMessage(message) {
                                return '<div style="color: red;">' + message + '</div>';
                            }

                            function successMessage(message) {
                                return '<div style="color: green;">' + message + '</div>';
                            }
//                             这里的方法是给谁调用的呢？
                            function finishedMessage(message) {
                                return '<div>' + message + '</div>';
                            }

                            // dropzone init
                            var config = {
                                url: 'product/importTemplate',
                                paramName: 'FILE',
                                parallelUploads: 1,
                                autoProcessQueue: false,
                                withCredentials: true,
                                acceptedFiles: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            }
//                            这里的第一个参数？？？
                            dropzone = new Dropzone('#data-struct-import', config);
//这里的handler 都是传给这个dropzone 使用的都不用定义。
                            var eventHandlers = {
                                'addedfile': function (file) {
                                    dialogScope.file = file;
                                    if (this.files[1] != null) {
                                        this.removeFile(this.files[0]);
                                    }
                                    $element.find('#import_result').height(194);
                                    dialogScope.$apply(function () {
                                        dialogScope.fileAdded = true;
                                    })
                                },
                                'success': function (file, response) {
                                    // go import message
                                    dialog.noty('上传成功！');
                                },
                                'error': function (error, msg) {
                                    if (msg === "You can't upload files of this type.") {
                                        dialog.noty('只支持excel格式导入');
                                        dropzone.removeAllFiles();
                                    } else {
                                        dialog.noty('上传失败!请重试！');
                                    }
                                }
                            }
                            angular.forEach(eventHandlers, function (handler, event) {
                                dropzone.on(event, handler);
                            })
                            dialogScope.startImport = function () {
                                dropzone.processQueue();
                                $element.find('#import_result').html('');
                            }
                            dialogScope.resetImport = function () {
//                             这里？
                                var importResult = $element.find('#import_result');
                                importResult.height(178);
                                importResult.html('');
                                dropzone.removeAllFiles();
                            }

                            dialogScope.exportTemplate = function () {
                                ctrl.exportTemplate();
                            }

                            dialogScope.$on('success', function () {
                                websocket.unsub('importDataStruct/' + $scope.classificationId);
                                if (uploadSuccess) {
                                    http.post("dataDefinition/removeCache");
                                    dialog.notyWithRefresh('2秒后自动刷新', $scope);
                                }
                            });

                            dialogScope.$on('cancel', function () {
                                websocket.unsub('importDataStruct/' + $scope.classificationId);
                                if (uploadSuccess) {
                                    dialog.notyWithRefresh('2秒后自动刷新', $scope);
                                }
                            })
                        }]
                    });
                },


                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'product',
                        filled: true,
                        // order: [[8, "desc"]],
                        columns: [{
                            name: 'productName',
                            //                            title: I18nService.getValue('产品名', 'user_name'),
                            title: '产品名',
                            search: true,
                            render: function (data) {
                                //                                if (SecurityService.hasRight('user', 'manage')) {
                                //                                    return `<a data-key='userEditBtn' href="javascript:void(0);">${data}</a>`;
                                //                                } else {
                                //                                    return `<span data-key='userEditBtn' href="javascript:void(0);">${data}</span>`;
                                //                                }
                                return `<a data-key='productEditBtn' href="javascript:void(0);">${data}</a>`;

                            }
                        }, {
                            name: 'model',
                            title: I18nService.getValue('型号', 'product_model'),
                            search: true,
                        }, {
                            name: 'type',
                            title: I18nService.getValue('类型', 'type'),
                            search: true,
                        }, {
                            name: 'price',
                            title: '价格',
                            //                            title: I18nService.getValue('价格', 'own_team'),
                            search: true,
                        }, {
                            name: 'unit',
                            title: '计量单位',
                            search: true,
                        }, {
                            name: 'remarks',
                            title: '备注',
                            search: true
                        }, {
                            name: 'time',
                            title: '最后编辑时间',
                            search: true
                        }, {
                            name: 'do',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            render: function () {
                                // if (SecurityService.hasRight('user', 'manage')) {
                                return `<button  data-key='productEditBtn' class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-edit"></i> ${I18nService.getValue('修改', 'edit')}</button>
                                        <button data-key='productDelBtn'  class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                // }
                            }
                        }]
                    }
                },
                bindEvent: function () {
                    //$scope.$on??用于监听事件
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        //？
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "productEditBtn") {
                            ctrl.showProductDetail(rowdata.id);
                        }
                        if (buttonKey === "productDelBtn") {
                            ctrl.delProduct(rowdata.id);
                        }
                    });
                },
                showProductDetail: function (id) {
                    id = id || 'add_product';
                    janus.goToMenuDetailByName('产品管理', id);
                },
                delProduct: function (id) {
                    if (id) {
                        dialog.confirm(I18nService.getValue('确定删除产品？删除后不可恢复。', 'delete_product')).on('success', function () {
                            //                        这里这个id
                            DBUtils.remove('product', { id: id }).success(function () {
                                dialog.noty(I18nService.getValue('删除成功', 'delete_success'));
                                ctrl.refreshTable();
                            });
                        });
                    }
                },
            });
            ctrl.initialize();
        }]);
});
