define([], function () {
    var app = angular.module('app');

    app.controller('WeldingDetailController', ['$scope', 'http', 'dialog', '$timeout', '$element', 'FileUploadService', 'util', 'DBUtils', 'AppDataService',
        function ($scope, http, dialog, $timeout, $element, FileUploadService, util, DBUtils, AppDataService) {
            var ctrl = this;

            var datamap = $scope.datamap;

            $scope.resultOps = [{
                'id': '', 'name': ''
            }, {
                'id': 'OK', 'name': '合格'
            }, {
                'id': 'NG', 'name': '不合格'
            }];

            var entity = $scope.entity;

            $scope.imageMap = {};

            $scope.aiImageMap = {};

            $scope.config = {};

            $scope.result = {};
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.initImgUpload();
                    }, 300);
                    ctrl.loadConfig();
                    ctrl.transferImages();
                    ctrl.bindEvent();
                },
                getResultDesc: function (rst) {
                    if (rst) {
                        rst = _.toLower(rst);
                        if (rst === 'ok') {
                            return '合格';
                        } else {
                            return '不合格';
                        }
                    }
                    return '';
                },
                showAiResultTable: function () {
                    var ele = $('.ai_result_table');
                    ele.stop(true, true);
                    if (ele.is(":visible")) {
                        ele.slideUp(200);
                    } else {
                        ele.slideDown(200);
                    }
                },
                loadConfig: function () {
                    AppDataService.get('weld_robot_history_config').success(function (_config) {
                        _config.state1Desc = '关闭';
                        if (_config.ai_check === '1') {
                            _config.state1Desc = '开启';
                        }
                        _config.state2Desc = '人工判定';
                        if (_config.check_result === 'ai') {
                            _config.state2Desc = '智能判定';
                        }
                        $scope.config = _config;

                        /*计算对应的结果信息*/
                        var result = {
                            result: entity.result,
                            resultDesc: ctrl.getResultDesc(entity.result),
                            man_made_result: entity.man_made_result || '',
                            ai_made_result: entity.ai_made_result,
                            ai_made_result_desc: ctrl.getResultDesc(entity.ai_made_result)
                        };
                        $scope.result = result;
                        util.apply($scope);
                    });
                },
                bindEvent: function () {
                    $scope.$watch('result', function () {
                        ctrl.reCalcResult();
                    }, true);

                    $scope.$watch('imageMap', function () {
                        ctrl.saveImage();
                    }, true)
                },
                saveImage: _.debounce(function () {
                    var imageList = _.values($scope.imageMap);
                    imageList = _.uniq(imageList);
                    imageList = _.filter(imageList, function (item) {
                        return !!item;
                    })
                    if (imageList.length !== _.size(entity.image_ids)) {
                        ctrl.updateValue({
                            'data.arr.$.image_ids': imageList || []
                        });
                        entity.image_ids = imageList;
                    }
                }, 300),
                reCalcResult: _.debounce(function () {
                    if ($scope.result.man_made_result === 'OK') {
                        $scope.result.result = 'OK';
                    } else if ($scope.result.man_made_result === 'NG') {
                        $scope.result.result = 'NG';
                    } else {
                        $scope.result.result = '';
                    }
                    if ($scope.config.check_result === 'ai') {
                        if (!$scope.result.result) {
                            $scope.result.result = $scope.result.ai_made_result || '';
                        }
                    }

                    $scope.result.resultDesc = ctrl.getResultDesc($scope.result.result);

                    entity.man_made_result = entity.man_made_result || '';
                    $scope.result.man_made_result = $scope.result.man_made_result || '';
                    if (!_.eq(entity.man_made_result, $scope.result.man_made_result)) {
                        ctrl.updateValue({
                            'data.arr.$.result': $scope.result.result,
                            'data.arr.$.man_made_result': $scope.result.man_made_result || ''
                        });
                        entity.result = $scope.result.result;
                        entity.man_made_result = $scope.result.man_made_result;
                    }
                    util.apply($scope);
                }, 300),
                updateValue: function (values) {
                    DBUtils.update('appData', {
                        'key': datamap.parentId,
                        'data.arr.weldingId': entity.weldingId
                    }, {
                        $set: values
                    }).success(function () {
                        dialog.noty('保存成功');
                    });
                },
                saveRemarks: _.debounce(function () {
                    ctrl.updateValue({
                        'data.arr.$.remarks': entity.remarks || ''
                    });
                }, 1000),
                transferImages: function () {
                    /* before show images*/
                    if (_.size(entity.image_ids)) {
                        _.each(entity.image_ids, function (imageId, idx) {
                            var key = `image${idx + 1}_id`;
                            _.set($scope.imageMap, key, imageId);
                        });
                    }
                    if (_.size(entity.ai_images)) {
                        _.each(entity.ai_images, function (item, idx) {
                            var key = `image${idx + 1}_id`;
                            var imageId = _.get(item, 'fileId_postprocess', '');
                            if (imageId) {
                                _.set($scope.aiImageMap, key, imageId);
                            }
                        });
                    }
                    util.apply($scope);
                },
                initImgUpload: function () {
                    FileUploadService.initialize({
                        buttonElement: $element.find('.welding_upload_btn'),
                        fileElement: $element.find('#upload_welding_fileinput')
                    }).progress(function (result) {
                        var imageId = _.get(result, 'datas.id', '');
                        if (imageId) {
                            _.set(entity, 'image_id', imageId);
                            ctrl.setPreviewImg(imageId);
                        }
                    });
                },
                setPreviewImg: function (imageId) {
                    // $element.find('.welding_upload_btn').addClass('hide');
                    var url = util.getImageUrl(imageId);
                    $element.find('.welding_preview_box').removeClass('hide').attr('src', url);
                },
                clearWeldingPic: function () {

                },
            });
            ctrl.initialize();
        }]);
});