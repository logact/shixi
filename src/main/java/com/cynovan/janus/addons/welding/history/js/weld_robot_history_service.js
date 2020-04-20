define(['fullcalendar'], function () {
    var app = angular.module('app');

    var params = {
        "119_Par_WeldingVoltage": '$data.119_Par_WeldingVoltage',
        "121_Status_WeldingVoltage": '$data.121_Status_WeldingVoltage',
        "118_Par_WeldingCurrent": '$data.118_Par_WeldingCurrent',
        "120_Status_WeldingCurrent": '$data.120_Status_WeldingCurrent',
        "101_Status_DI_ArcWeldingStart": '$data.101_Status_DI_ArcWeldingStart',
        "128_Par_WelderType": '$data.128_Par_WelderType',
        "130_Par_MaterialType": '$data.130_Par_MaterialType',
        "131_Par_WireType": '$data.131_Par_WireType',
        "132_Par_GasType": '$data.132_Par_GasType',
        "141_ArcOn_Time": "$data.141_ArcOn_Time",
        "MaterialName": '$data.166_MaterialName',
        "MaterialBatch": '$data.167_MaterialBatch',
        "182_TCP_X": "$data.182_TCP_X",
        "183_TCP_Y": "$data.183_TCP_Y",
        "184_TCP_Z": "$data.184_TCP_Z",
        "199_M_TCP_X": "$data.199_M_TCP_X",
        "200_M_TCP_Y": "$data.200_M_TCP_Y",
        "201_M_TCP_Z": "$data.201_M_TCP_Z"
    };

    app.service('WeldService', ['DBUtils', 'AppDataService', 'MD5Service', 'dialog', 'session',
        function (DBUtils, AppDataService, MD5Service, dialog, session) {
            var service = {
                isPassedDay: function (date) {
                    var today = moment();
                    today.set('hour', 0);
                    today.set('minute', 0);
                    today.set('second', 0);
                    today.set('millisecond', 0);

                    var diff = today.diff(date, 'minutes');
                    return diff > 0;
                },
                loadDayEvents: function (uuid, date, config) {
                    var deferred = $.Deferred();
                    var year = date.get('year'), month = date.get('month') + 1, day = date.get('date');
                    var isPassed = service.isPassedDay(date);
                    var appDataKey = _.join([uuid, year, month, day], '_');

                    /*检查已存在的数据*/
                    AppDataService.get('weld_robot_history', appDataKey).success(function (result) {
                        if (_.isObject(result)) {
                            /*数据已存在,检查如果为今天之前的，直接使用，如果为今天的数据，需要比对差异*/
                            if (isPassed && result.diffed) {
                                deferred.notify(result);
                            } else {
                                service.aggregatorDayEvents(result, uuid, date, isPassed, config).progress(function (dayEvent) {
                                    deferred.notify(dayEvent);
                                });
                            }
                        }
                    });

                    return deferred;
                },
                aggregatorDayEvents: function (oldDayData, uuid, date, diffed, config) {
                    var deferred = $.Deferred();
                    var end = moment(date).add(1, 'day');
                    service.aggregatorValue(uuid, date, end, config).success(function (result) {
                        let dayEvent = _.get(result, 'datas.result', {});
                        if (!dayEvent.length) {
                            var dataKey = _.join(['weld_robot_history', uuid, date.get('year'), date.get('month') + 1, date.get('date')], '_');
                            var dayData = {
                                arr: [],
                                diffed: diffed
                            };
                            service.addNewAppData(dataKey, dayData);
                            deferred.notify(dayData);
                        } else {
                            service.diffAppData(dayEvent, oldDayData, uuid, date, deferred, diffed, config);
                        }
                    });
                    return deferred;
                },
                getConfigParams: function () {
                    var deferred = $.Deferred();
                    AppDataService.get('weld_robot_history_config').success(function (result) {
                        let _params = {};
                        if (result && !_.isEmpty(result)) {
                            let fieldList = _.get(result, 'fields', []);
                            _.each(fieldList, function (field) {
                                if (field.r_option === 'data' && field.bind.length > 4) {
                                    var fieldKey = field.bind;
                                    _params[fieldKey] = '$data.' + field.bind;
                                } else if (field.r_option === 'input') {
                                    // 设置 默认值
                                    if (!_.isUndefined(field.default) && !_.isEmpty(field.default)) {
                                        _params[field.bind] = {$ifNull: ['$data.' + field.bind, field.default]};
                                    } else {
                                        _params[field.bind] = '$data.' + field.bind;
                                    }
                                }
                            });
                        }

                        _.extend(params, _params);

                        var config = result;
                        config.params = params;
                        deferred.notify(config);
                    });
                    return deferred;
                },
                addNewAppData: function (dataKey, dayData) {
                    DBUtils.update('appData', {
                        key: dataKey,
                    }, {
                        $set: {
                            data: dayData
                        }
                    }, true);
                },
                diffAppData: function (events, existData, uuid, date, deferred, diffed, config) {
                    /*取得自动上传的图片信息以及AI检查后的图片信息*/
                    service.loadItemImage(uuid, date).done(function (resultMap) {
                        service.dataToDB(events, existData, uuid, date, deferred, diffed, resultMap, config);
                    });
                },
                setAiResult: function (dataArr, resultMap, config) {
                    if (_.isEmpty(resultMap)) {
                        return;
                    }
                    if (dataArr.length) {
                        _.each(dataArr, function (item) {
                            var arcTag = item.arcTag;
                            var arcTagList = _.get(resultMap, arcTag, []);
                            if (arcTagList.length) {
                                var preFileIdList = [], afterFileIdMap = {}, afterFileIdList = [];
                                _.each(arcTagList, function (arcItem) {
                                    if (arcItem.fileId_preprocess && _.indexOf(preFileIdList, arcItem.fileId_preprocess) === -1) {
                                        preFileIdList.push(arcItem.fileId_preprocess);
                                    }

                                    if (arcItem.fileId_postprocess && !afterFileIdMap[arcItem.fileId_postprocess]) {
                                        afterFileIdList.push(arcItem);
                                        afterFileIdMap[arcItem.fileId_postprocess] = '1';
                                    }
                                });
                                var image_ids = item.image_ids || [];
                                var diff = 4 - image_ids.length;
                                if (diff > 0) {
                                    _.times(diff, function (idx) {
                                        var fileId = _.get(preFileIdList, idx, '');
                                        if (fileId) {
                                            image_ids.push(fileId);
                                        }
                                    });
                                }
                                item.image_ids = _.uniq(image_ids);
                                afterFileIdList = _.sortBy(afterFileIdList, 'create_date');
                                item.ai_images = afterFileIdList;
                                /*检查结果, 一个为人工结果，一个为AI智能结果，一个为正式的结果（之前的栏位）*/
                                if (item.man_made_result === undefined) {
                                    item.man_made_result = item.result;
                                }
                                /*如果AI有上传图片，并且所有AI的结果都为OK*/
                                var aiResult = '';
                                if (afterFileIdList.length) {
                                    var okList = _.filter(afterFileIdList, function (item) {
                                        var result = _.toLower(item.analysis_result);
                                        return result === 'ok';
                                    });

                                    if (okList.length === afterFileIdList.length) {
                                        aiResult = 'OK';
                                    } else {
                                        aiResult = 'NG';
                                    }
                                }
                                item.ai_made_result = aiResult;
                                if (config.check_result === 'ai') {
                                    if (!item.man_made_result) {
                                        item.result = item.ai_made_result;
                                    } else {
                                        item.result = item.man_made_result;
                                    }
                                } else {
                                    item.result = item.man_made_result;
                                }
                            }
                        })
                    }
                },
                valueToFloat: function (value) {
                    value = parseFloat(value);
                    if (_.isNaN(value)) {
                        value = 0;
                    }
                    return value;
                },
                dataToDB: function (events, existData, uuid, date, deferred, diffed, aiResultMap, config) {
                    var newData = {
                        arr: [],
                        diffed: diffed
                    };

                    let year = date.get('year');
                    let month = date.get('month') + 1;
                    let day = date.get('date');
                    var appDataKey = _.join(['weld_robot_history', uuid, year, month, day], '_');
                    _.each(events, function (obj) {
                        let delta = (new Date(obj.end).getTime() - new Date(obj.start).getTime()) / 1000;
                        var barcode = _.get(obj, '_id.barcode', '');

                        /*焊丝长度*/
                        var wireLength = _.get(obj, 'show_data.176_WireFeedLengthSingleWelding', 0);
                        wireLength = service.valueToFloat(wireLength);
                        if (wireLength === 0) {
                            wireLength = _.get(obj, 'wire.176_WireFeedLengthSingleWelding', 0);
                            wireLength = service.valueToFloat(wireLength);
                        }
                        /*焊丝重量*/
                        var wireDensity = _.get(obj, 'show_data.178_WireDensity', 0);
                        wireDensity = service.valueToFloat(wireDensity);
                        if (wireDensity === 0) {
                            wireDensity = _.get(obj, 'wire.178_WireDensity', 0);
                            wireDensity = service.valueToFloat(wireDensity);
                        }
                        wireDensity = wireDensity * wireLength;

                        var arcTag = _.get(obj, 'show_data.141_ArcOn_Time', '');
                        var dataItem = {
                            'start': obj.start,
                            'end': obj.end,
                            'barcode': barcode,
                            'period': Math.floor(delta * 100) / 100,    // 保留2位小数
                            'uuid': uuid,
                            'start_id': obj.start_id,
                            'end_id': obj.end_id,
                            'wire_length': wireLength,
                            'wire_density': wireDensity,
                            'weldingId': MD5Service.md5(obj.start_id + '_' + obj.end_id),
                            'show_data': obj.show_data,
                            'arcTag': arcTag
                        };
                        newData.arr.push(dataItem);
                    });

                    if (_.isUndefined(existData) || _.isEmpty(existData)) {
                        service.setAiResult(newData.arr, aiResultMap, config);
                        service.addNewAppData(appDataKey, newData);
                        deferred.notify(newData);
                    } else {
                        existData.arr = existData.arr || [];
                        var existsWeldIdList = _.map(existData.arr, function (item) {
                            return item.weldingId;
                        });

                        var startIdMap = _.keyBy(existData.arr, 'start_id');

                        var updateFlag = false;
                        _.each(newData.arr, function (item) {
                            var targetExists = startIdMap[item.start_id];
                            if (targetExists) {
                                //当start_id存在 且 weldingId不一样时，代表数据为重复生成，删除原有的数据
                                if (targetExists['weldingId'] !== item.weldingId) {
                                    existData.arr = _.filter(existData.arr, function (existItem) {
                                        return existItem.start_id !== item.start_id;
                                    });
                                }
                                delete startIdMap[item.start_id];
                            }

                            if (_.indexOf(existsWeldIdList, item.weldingId) === -1) {
                                existData.arr.push(item);
                            }
                        });

                        if (existData.diffed !== diffed) {
                            existData.diffed = diffed;
                        }
                        service.setAiResult(existData.arr, aiResultMap, config);
                        DBUtils.update('appData', {
                            key: appDataKey
                        }, {
                            $set: {
                                'data.arr': existData.arr,
                                'data.diffed': existData.diffed
                            }
                        });
                        deferred.notify(existData);
                    }
                },
                loadItemImage: function (uuid, date) {
                    var deferred = $.Deferred();
                    var cloneDate = moment(date);
                    var startDate = cloneDate.set({hour: 0, minute: 0, second: 0, millisecond: 0});
                    var endDate = moment(cloneDate).add(1, 'days');

                    /*加载所有的原始数据*/
                    DBUtils.list('fileInfo', {
                        create_date: {
                            $gte: {
                                $date: startDate.valueOf()
                            },
                            $lt: {
                                $date: endDate.valueOf()
                            }
                        },
                        '$and': [{
                            tags: uuid
                        }, {
                            tags: "vision_preprocess"
                        }]
                    }).success(function (preImgResult) {

                        /*加载由AI上传的图片*/
                        var appDataKey = [];
                        appDataKey.push('weld_robot_ai_check');
                        appDataKey.push(uuid);
                        appDataKey.push(date.get('year'));
                        appDataKey.push(date.get('month') + 1);
                        appDataKey.push(date.get('date'));

                        appDataKey = _.join(appDataKey, '_');
                        AppDataService.get(appDataKey).success(function (aiResult) {
                            var preImgList = _.get(preImgResult, 'datas.result', []);
                            preImgList = _.sortBy(preImgList, 'create_date');
                            var aiList = _.get(aiResult, 'list', []);

                            var preImgMap = {};
                            _.each(preImgList, function (item) {
                                var arcTag = _.get(item, 'tags[1]', '');
                                if (arcTag) {
                                    var arcTagList = _.get(preImgMap, arcTag, []);
                                    arcTagList.push(item);
                                    _.set(preImgMap, arcTag, arcTagList);
                                }
                            });

                            var aiMap = {};
                            _.each(aiList, function (item) {
                                var arcTag = _.get(item, 'arcTag', '');
                                if (arcTag) {
                                    var arcTagList = _.get(aiMap, arcTag, []);
                                    arcTagList.push(item);
                                    _.set(aiMap, arcTag, arcTagList);
                                }
                            });

                            /*组合两种Map为一种*/
                            var resultMap = {};
                            if (_.isEmpty(preImgMap)) {
                                resultMap = aiMap;
                            } else {
                                _.each(preImgMap, function (valueList, arcTag) {
                                    var aiTagList = _.get(aiMap, arcTag, []);

                                    var hasAi = false;
                                    var aiFileIdMap = {};
                                    _.each(aiTagList, function (item) {
                                        var fileId = item.fileId_preprocess;
                                        aiFileIdMap[fileId] = fileId;
                                        hasAi = true;
                                    });

                                    var storeTagList = [];
                                    if (hasAi === true) {
                                        storeTagList = _.cloneDeep(aiTagList);
                                    }

                                    _.each(valueList, function (item) {
                                        var fileId = _.get(item, 'fileId', '');
                                        if (fileId && !aiFileIdMap[fileId]) {
                                            if (_.size(storeTagList) < 4) {
                                                var pushItem = {};
                                                /*检查从AI的List能否找到*/
                                                var targetItem = _.find(aiTagList, {'fileId_preprocess': fileId});
                                                if (targetItem) {
                                                    pushItem = targetItem;
                                                } else {
                                                    pushItem = {
                                                        arcTag: arcTag,
                                                        uuid: uuid,
                                                        fileId_preprocess: fileId
                                                    };
                                                }
                                                storeTagList.push(pushItem);
                                            }
                                        }
                                    });
                                    _.set(resultMap, arcTag, storeTagList);
                                });
                            }
                            deferred.resolve(resultMap);
                        });
                    });
                    return deferred;
                },
                aggregatorValue: function (uuid, start, end, config) {
                    if (config && config.params) {
                        params = _.extend(params, config.params);
                    }
                    return DBUtils.aggregator('deviceData', {
                        $match: {
                            uuid: uuid,
                            "$or": [{
                                'data.101_Status_DI_ArcWeldingStart': {
                                    $in: ["TRUE", "1", "true"]
                                }
                            }, {
                                'data.173_Status_DI_ArcWeldingStart_DataCollect': {
                                    $in: ["TRUE", "1", "true"]
                                }
                            }],
                            time: {
                                $gte: {
                                    //时区的处理
                                    '$date': moment(start).add(-8, 'hours').valueOf()
                                },
                                $lt: {
                                    '$date': moment(end).add(-8, 'hours').valueOf()
                                }
                            }
                        }
                    }, {
                        $sort: {
                            'time': 1
                        }
                    }, {
                        $group: {
                            _id: {
                                year: {
                                    $year: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                                month: {
                                    $month: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                                date: {
                                    $dayOfMonth: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                                barcode: '$data.168_MaterialBarcode',
                                tag: '$data.141_ArcOn_Time'
                            },
                            start: {
                                $first: '$time'
                            },
                            end: {
                                $last: '$time'
                            },
                            start_id: {
                                $first: '$_id',
                            },
                            end_id: {
                                $last: '$_id',
                            },
                            show_data: {
                                $first: params
                            },
                            "wire": {
                                $last: {
                                    "176_WireFeedLengthSingleWelding": "$data.176_WireFeedLengthSingleWelding",
                                    "178_WireDensity": "$data.178_WireDensity",
                                }
                            },
                            count: {
                                $sum: 1
                            }
                        }
                    })
                },
                /* load data from appData*/
                queryAppData: function (uuid, year, month, day) {
                    var keyArr = [];
                    keyArr.push('weld_robot_history');
                    keyArr.push(uuid);
                    keyArr.push(year);
                    keyArr.push(month);
                    keyArr.push(day);
                    let dataKey = '^' + keyArr.join('_') + '_';
                    return DBUtils.find('appData', {
                        'key': dataKey
                    })
                }
            }
            return service;
        }]);

});