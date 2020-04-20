define([], function () {
    var app = angular.module('app');

    app.controller('NcFileController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'SecurityService', 'janus',
        function ($scope, $state, DBUtils, dialog, $element, SecurityService, janus) {
            var ctrl = this;
            _.extend(ctrl, {
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
                        collection: 'ncfile',
                        filled: true,
                        columns: [{
                            name: 'filename',
                            title: 'NC文件名称',
                            search: true,
                            render: function (data) {
                                return `<a data-key='detailKey' href="javascript:void(0);">${data}</a>`;
                            }
                        }, {
                            name: 'latest_version',
                            title: '最新版本',
                            search: true,
                            render: function (data) {
                                return `<span>v${data}</span>`;
                            }
                        }, {
                            name: 'last_update_date',
                            title: '最后更新日期',
                            search: true
                        }, {
                            name: 'latest_remarks',
                            title: '备注',
                            search: true
                        }, {
                            name: 'do',
                            title: '操作',
                            orderable: false,
                            render: function () {
                                if (SecurityService.hasRight('cnc_ncfile', 'manage')) {
                                    return `<button data-key='detailKey' class="btn btn-primary btn-xs btn-outline" type="button">
                                                <i class="fa fa-edit"></i> 查看</button>
                                            <button type="button" data-key="ncfileDelBtn" class="btn btn-primary btn-xs btn-outline">
                                            <i class="fa fa-trash"></i> 删除</button>`;
                                }
                            }
                        }]
                    }
                },
                showUpload: function () {
                    var dialogElement = dialog.show({
                        template: 'cnc_ncfile_upload',
                        width: 1200,
                        title: false,
                        controller: 'NcFileUploadController',
                        controllerAs: 'ctrl',
                        data: {
                            entity: {},
                            trigger: {
                                onSuccess: function () {
                                    ctrl.refreshTable();
                                },
                                onFail: function () {
                                }
                            }
                        }
                    });
                    dialogElement.on('hidden.bs.modal', function () {
                        ctrl.refreshTable();
                    });
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "detailKey") {
                            ctrl.checkNcfileHistory(rowdata.id);
                        }
                        if (buttonKey === "ncfileDelBtn") {
                            ctrl.delAllNCFiles(rowdata.id);
                        }
                    });
                },
                checkNcfileHistory: function (id) {
                    janus.goToMenuDetailByName('NC文件', id);
                },
                delAllNCFiles: function (id) {
                    if (id) {
                        dialog.confirm('确定删除该文件的全部版本？删除后不可恢复。').on('success', function () {
                            DBUtils.remove('ncfile', {id: id}).success(function () {
                                dialog.hideWaiting();
                                dialog.noty('删除成功');
                                ctrl.refreshTable();
                            });
                        });
                    }
                }

            });
            ctrl.initialize();
        }
    ]);
    app.controller('NcFileUploadController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'FileUploadService', '$timeout', 'util',
        function ($scope, $state, DBUtils, dialog, $element, FileUploadService, $timeout, util) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.initFileUpload();
                    }, 300);
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initFileUpload: function () {
                    FileUploadService.initialize({
                        buttonElement: $element.find('.upload-btn'),
                        fileElement: $element.find('input[type="file"]'),
                        fileType: ''
                    }).progress(function (result) {
                        $scope.entity.id = _.get(result, 'datas.id', '');
                        $scope.entity.name = _.get(result, 'datas.name', '');
                        $scope.entity.size = _.get(result, 'datas.size', '');
                        util.apply($scope);
                    });
                    $scope.$on('success', function () {
                        ctrl.save($scope.entity.id, $scope.entity.name, $scope.entity.size);
                    });
                },
                save: function (id, name, size) {
                    DBUtils.find('ncfile', {filename: name}).then(function (result) {
                        var fsname = _.get(result, 'data.datas.result.filename', '');

                        var now = new Date();
                        var year = now.getFullYear();
                        var month = now.getMonth() + 1;
                        var date = now.getDate();
                        var hours = now.getHours();
                        var minutes = now.getMinutes();
                        var seconds = now.getSeconds();
                        if (minutes < 10) {
                            minutes = '0' + minutes;
                        }
                        if (seconds < 10) {
                            seconds = '0' + seconds;
                        }
                        var time = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

                        var unit = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                        var sizename = '0 Byte';
                        if (size !== 0) {
                            var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
                            sizename = Math.round(size / Math.pow(1024, i), 2) + ' ' + unit[i];
                        }

                        var entity = $scope.entity;

                        if (fsname) {
                            var latest_version = _.get(result, 'data.datas.result.latest_version', '');
                            var new_version = latest_version + 1;
                            var remarks = entity.remarks || '';
                            DBUtils.update('ncfile', {
                                filename: name
                            }, {
                                $set: {
                                    'latest_version': new_version,
                                    'last_update_date': time,
                                    'latest_remarks': remarks
                                },
                                $push: {
                                    history_info: {
                                        $each: [{
                                            version: new_version,
                                            update_time: time,
                                            fileId: id,
                                            fileSize: size,
                                            size_name: sizename,
                                            remarks: entity.remarks
                                        }],
                                        $sort: {version: -1},
                                    }
                                }
                            }).success(function () {
                                ctrl.refreshTable();
                            });
                        } else {
                            var newOjb = {
                                filename: name,
                                latest_version: 1,
                                last_update_date: time,
                                latest_remarks: entity.remarks,
                                history_info: [{
                                    version: 1,
                                    update_time: time,
                                    fileId: id,
                                    fileSize: size,
                                    size_name: sizename,
                                    remarks: entity.remarks
                                }]
                            }
                            DBUtils.save('ncfile', newOjb).success(function () {
                                ctrl.refreshTable();
                            });
                        }
                    })
                },
            });
            ctrl.initialize();
        }
    ]);
    app.controller('NcFileHistoryController', ['$scope', '$stateParams', 'DBUtils', 'dialog', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, dialog, $state, janus) {
            var ctrl = this;
            $scope.records = [];
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                },
                loadData: function () {
                    if ($stateParams.id) {
                        DBUtils.find('ncfile', {
                            id: $stateParams.id,
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.ncfile_title = entity.filename;
                            $scope.latest_version = entity.latest_version;
                            $scope.records = entity.history_info;
                        });
                    }
                },
                back: function () {
                    janus.goToMenuByName('NC文件');
                },
                downloadThisFile: function (index) {
                    var x = $scope.records[index];
                    window.open('gridfs/' + x.fileId, "_blank");
                    dialog.noty('下载成功');
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });

            ctrl.initialize();
        }]);
});
