/**
 * Copyright (c) 2006-2019, JGraph Ltd
 * Copyright (c) 2006-2019, draw.io AG
 */
(function () {
    // Adds scrollbars for menus that exceed the page height
    var mxPopupMenuShowMenu = mxPopupMenu.prototype.showMenu;
    mxPopupMenu.prototype.showMenu = function () {
        mxPopupMenuShowMenu.apply(this, arguments);

        this.div.style.overflowY = 'auto';
        this.div.style.overflowX = 'hidden';
        var h0 = Math.max(document.body.clientHeight, document.documentElement.clientHeight);
        this.div.style.maxHeight = (h0 - 10) + 'px';
    };

    Menus.prototype.createHelpLink = function (href) {
        var link = document.createElement('span');
        link.setAttribute('title', mxResources.get('help'));
        link.style.cssText = 'color:blue;text-decoration:underline;margin-left:8px;cursor:help;';

        var icon = document.createElement('img');
        mxUtils.setOpacity(icon, 50);
        icon.style.height = '16px';
        icon.style.width = '16px';
        icon.setAttribute('border', '0');
        icon.setAttribute('valign', 'bottom');
        icon.setAttribute('src', Editor.helpImage);
        link.appendChild(icon);

        mxEvent.addGestureListeners(link, mxUtils.bind(this, function (evt) {
            if (this.editorUi.menubar != null) {
                this.editorUi.menubar.hideMenu();
            }

            this.editorUi.openLink(href);
            mxEvent.consume(evt);
        }));

        return link;
    };

    Menus.prototype.addLinkToItem = function (item, href) {
        if (item != null) {
            item.firstChild.nextSibling.appendChild(this.createHelpLink(href));
        }
    };

    var menusInit = Menus.prototype.init;
    Menus.prototype.init = function () {
        menusInit.apply(this, arguments);
        var editorUi = this.editorUi;
        var graph = editorUi.editor.graph;
        var isGraphEnabled = mxUtils.bind(graph, graph.isEnabled);

        var rulerAction = editorUi.actions.addAction('ruler', function () {
            mxSettings.setRulerOn(!mxSettings.isRulerOn());
            mxSettings.save();

            if (editorUi.ruler != null) {
                editorUi.ruler.destroy();
                editorUi.ruler = null;
                editorUi.refresh();
            } else {
                editorUi.ruler = new mxDualRuler(editorUi, editorUi.editor.graph.view.unit);
                editorUi.refresh();
            }
        });
        rulerAction.setToggleAction(true);
        rulerAction.setSelectedCallback(function () {
            return editorUi.ruler != null;
        });

        editorUi.actions.addAction('editShape...', mxUtils.bind(this, function () {
            var cells = graph.getSelectionCells();

            if (graph.getSelectionCount() == 1) {
                var cell = graph.getSelectionCell();
                var state = graph.view.getState(cell);

                if (state != null && state.shape != null && state.shape.stencil != null) {
                    var dlg = new EditShapeDialog(editorUi, cell, mxResources.get('editShape') + ':', 630, 400);
                    editorUi.showDialog(dlg.container, 640, 480, true, false);
                    dlg.init();
                }
            }
        }));

        var autosaveAction = editorUi.actions.addAction('autosave', function () {
            editorUi.editor.setAutosave(!editorUi.editor.autosave);
        });

        autosaveAction.setToggleAction(true);
        autosaveAction.setSelectedCallback(function () {
            return autosaveAction.isEnabled() && editorUi.editor.autosave;
        });

        editorUi.actions.addAction('editGeometry...', function () {
            var cells = graph.getSelectionCells();
            var vertices = [];

            for (var i = 0; i < cells.length; i++) {
                if (graph.getModel().isVertex(cells[i])) {
                    vertices.push(cells[i]);
                }
            }

            if (vertices.length > 0) {
                var dlg = new EditGeometryDialog(editorUi, vertices);
                editorUi.showDialog(dlg.container, 300, 285, true, true);
                dlg.init();
            }
        }, null, null, Editor.ctrlKey + '+Shift+M');

        var copiedStyles = ['rounded', 'shadow', 'dashed', 'dashPattern', 'fontFamily', 'fontSize', 'fontColor', 'fontStyle',
            'align', 'verticalAlign', 'strokeColor', 'strokeWidth', 'fillColor', 'gradientColor', 'swimlaneFillColor',
            'textOpacity', 'gradientDirection', 'glass', 'labelBackgroundColor', 'labelBorderColor', 'opacity',
            'spacing', 'spacingTop', 'spacingLeft', 'spacingBottom', 'spacingRight', 'endFill', 'endArrow',
            'endSize', 'targetPerimeterSpacing', 'startFill', 'startArrow', 'startSize', 'sourcePerimeterSpacing',
            'arcSize'];

        editorUi.actions.addAction('copyStyle', function () {
            var state = graph.view.getState(graph.getSelectionCell());

            if (graph.isEnabled() && state != null) {
                editorUi.copiedStyle = mxUtils.clone(state.style);

                // Handles special case for value "none"
                var cellStyle = graph.getModel().getStyle(state.cell);
                var tokens = (cellStyle != null) ? cellStyle.split(';') : [];

                for (var j = 0; j < tokens.length; j++) {
                    var tmp = tokens[j];
                    var pos = tmp.indexOf('=');

                    if (pos >= 0) {
                        var key = tmp.substring(0, pos);
                        var value = tmp.substring(pos + 1);

                        if (editorUi.copiedStyle[key] == null && value == 'none') {
                            editorUi.copiedStyle[key] = 'none';
                        }
                    }
                }
            }
        }, null, null, Editor.ctrlKey + '+Shift+C');

        editorUi.actions.addAction('pasteStyle', function () {
            if (graph.isEnabled() && !graph.isSelectionEmpty() && editorUi.copiedStyle != null) {
                graph.getModel().beginUpdate();

                try {
                    var cells = graph.getSelectionCells();

                    for (var i = 0; i < cells.length; i++) {
                        var state = graph.view.getState(cells[i]);

                        for (var j = 0; j < copiedStyles.length; j++) {
                            var key = copiedStyles[j];
                            var value = editorUi.copiedStyle[key];

                            if (state.style[key] != value) {
                                graph.setCellStyles(key, value, [cells[i]]);
                            }
                        }
                    }
                } finally {
                    graph.getModel().endUpdate();
                }
            }
        }, null, null, Editor.ctrlKey + '+Shift+V');

        editorUi.actions.put('pageBackgroundImage', new Action(mxResources.get('backgroundImage') + '...', function () {
            if (!editorUi.isOffline()) {
                var apply = function (image) {
                    editorUi.setBackgroundImage(image);
                };

                var dlg = new BackgroundImageDialog(editorUi, apply);
                editorUi.showDialog(dlg.container, 320, 170, true, true);
                dlg.init();
            }
        }));

        action = editorUi.actions.put('shadowVisible', new Action(mxResources.get('shadow'), function () {
            graph.setShadowVisible(!graph.shadowVisible);
        }));
        action.setToggleAction(true);
        action.setSelectedCallback(function () {
            return graph.shadowVisible;
        });

        action = editorUi.actions.addAction('find...', mxUtils.bind(this, function () {
            if (this.findWindow == null) {
                this.findWindow = new FindWindow(editorUi, document.body.offsetWidth - 300, 110, 240, 140);
                this.findWindow.window.addListener('show', function () {
                    editorUi.fireEvent(new mxEventObject('find'));
                });
                this.findWindow.window.addListener('hide', function () {
                    editorUi.fireEvent(new mxEventObject('find'));
                });
                this.findWindow.window.setVisible(true);
                editorUi.fireEvent(new mxEventObject('find'));
            } else {
                this.findWindow.window.setVisible(!this.findWindow.window.isVisible());
            }
        }));
        action.setToggleAction(true);
        action.setSelectedCallback(mxUtils.bind(this, function () {
            return this.findWindow != null && this.findWindow.window.isVisible();
        }));

        // Adds language menu to options only if localStorage is available for
        // storing the choice. We do not want to use cookies for older browsers.
        // Note that the URL param lang=XX is available for setting the language
        // in older browsers. URL param has precedence over the saved setting.

        editorUi.customLayoutConfig = [{
            'layout': 'mxHierarchicalLayout',
            'config':
                {
                    'orientation': 'west',
                    'intraCellSpacing': 30,
                    'interRankCellSpacing': 100,
                    'interHierarchySpacing': 60,
                    'parallelEdgeSpacing': 10
                }
        }];

        editorUi.actions.addAction('shapes...', function () {
            if (mxClient.IS_CHROMEAPP || !editorUi.isOffline()) {
                editorUi.showDialog(new MoreShapesDialog(editorUi, true).container, 700, (isLocalStorage) ?
                    ((mxClient.IS_IOS) ? 480 : 460) : 440, true, true);
            } else {
                editorUi.showDialog(new MoreShapesDialog(editorUi, false).container, 360, (isLocalStorage) ?
                    ((mxClient.IS_IOS) ? 300 : 280) : 260, true, true);
            }
        });

        editorUi.actions.put('createShape', new Action(mxResources.get('shape') + '...', function (evt) {
            if (graph.isEnabled()) {
                var cell = new mxCell('', new mxGeometry(0, 0, 120, 120), editorUi.defaultCustomShapeStyle);
                cell.vertex = true;

                var dlg = new EditShapeDialog(editorUi, cell, mxResources.get('editShape') + ':', 630, 400);
                editorUi.showDialog(dlg.container, 680, 520, true, false);
                dlg.init();
            }
        })).isEnabled = isGraphEnabled;

        // Adds plugins menu item only if localStorage is available for storing the plugins
        if (isLocalStorage || mxClient.IS_CHROMEAPP) {
            editorUi.actions.addAction('plugins...', function () {
                editorUi.showDialog(new PluginsDialog(editorUi).container, 400, 230, true, false);
            });
        }

        var action = editorUi.actions.addAction('search', function () {
            var visible = editorUi.sidebar.isEntryVisible('search');
            editorUi.sidebar.showPalette('search', !visible);

            if (isLocalStorage) {
                mxSettings.settings.search = !visible;
                mxSettings.save();
            }
        });

        action.setToggleAction(true);
        action.setSelectedCallback(function () {
            return editorUi.sidebar.isEntryVisible('search');
        });

        var addInsertItem = function (menu, parent, title, method) {
            if (method != 'plantUml' || (EditorUi.enablePlantUml && !editorUi.isOffline())) {
                menu.addItem(title, null, mxUtils.bind(this, function () {
                    if (method == 'fromText' || method == 'formatSql' || method == 'plantUml') {
                        var dlg = new ParseDialog(editorUi, title, method);
                        editorUi.showDialog(dlg.container, 650, 465, true, false);
                        editorUi.dialog.container.style.overflow = 'auto';
                        dlg.init();
                    } else {
                        var dlg = new CreateGraphDialog(editorUi, title, method);
                        editorUi.showDialog(dlg.container, 650, 465, true, false);
                        // Executed after dialog is added to dom
                        dlg.init();
                    }
                }), parent, null, isGraphEnabled());
            }
        };

        var insertVertex = function (value, w, h, style) {
            var pt = (graph.isMouseInsertPoint()) ? graph.getInsertPoint() : graph.getFreeInsertPoint();
            var cell = new mxCell(value, new mxGeometry(pt.x, pt.y, w, h), style);
            cell.vertex = true;

            graph.getModel().beginUpdate();
            try {
                cell = graph.addCell(cell);
                graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [cell]));
            } finally {
                graph.getModel().endUpdate();
            }

            graph.scrollCellToVisible(cell);
            graph.setSelectionCell(cell);
            graph.container.focus();

            if (graph.editAfterInsert) {
                graph.startEditing(cell);
            }

            return cell;
        };

        editorUi.actions.put('insertText', new Action(mxResources.get('text'), function () {
            if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
                graph.startEditingAtCell(insertVertex('Text', 40, 20, 'text;html=1;resizable=0;autosize=1;' +
                    'align=center;verticalAlign=middle;points=[];fillColor=none;strokeColor=none;rounded=0;'));
            }
        }), null, null, Editor.ctrlKey + '+Shift+X').isEnabled = isGraphEnabled;

        editorUi.actions.put('insertRectangle', new Action(mxResources.get('rectangle'), function () {
            if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
                insertVertex('', 120, 60, 'whiteSpace=wrap;html=1;');
            }
        }), null, null, Editor.ctrlKey + '+K').isEnabled = isGraphEnabled;

        editorUi.actions.put('insertEllipse', new Action(mxResources.get('ellipse'), function () {
            if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
                insertVertex('', 80, 80, 'ellipse;whiteSpace=wrap;html=1;');
            }
        }), null, null, Editor.ctrlKey + '+Shift+K').isEnabled = isGraphEnabled;

        var addInsertMenuItems = mxUtils.bind(this, function (menu, parent, methods) {
            for (var i = 0; i < methods.length; i++) {
                if (methods[i] == '-') {
                    menu.addSeparator(parent);
                } else {
                    addInsertItem(menu, parent, mxResources.get(methods[i]) + '...', methods[i]);
                }
            }
        });

        var action = editorUi.actions.addAction('comments', mxUtils.bind(this, function () {
            if (this.commentsWindow == null) {
                // LATER: Check outline window for initial placement
                this.commentsWindow = new CommentsWindow(editorUi, document.body.offsetWidth - 380, 120, 300, 350);
                //TODO Are these events needed?
                this.commentsWindow.window.addListener('show', function () {
                    editorUi.fireEvent(new mxEventObject('comments'));
                });
                this.commentsWindow.window.addListener('hide', function () {
                    editorUi.fireEvent(new mxEventObject('comments'));
                });
                this.commentsWindow.window.setVisible(true);
                editorUi.fireEvent(new mxEventObject('comments'));
            } else {
                var isVisible = !this.commentsWindow.window.isVisible();
                this.commentsWindow.window.setVisible(isVisible);

                this.commentsWindow.refreshCommentsTime();

                if (isVisible && this.commentsWindow.hasError) {
                    this.commentsWindow.refreshComments();
                }
            }
        }));
        action.setToggleAction(true);
        action.setSelectedCallback(mxUtils.bind(this, function () {
            return this.commentsWindow != null && this.commentsWindow.window.isVisible();
        }));

        // Destroys comments window to force update or disable if not supported
        editorUi.editor.addListener('fileLoaded', mxUtils.bind(this, function () {
            if (this.commentsWindow != null) {
                this.commentsWindow.destroy();
                this.commentsWindow = null;
            }
        }));

        // Extends toolbar dropdown to add comments
        var viewPanelsMenu = this.get('viewPanels');
        var viewPanelsFunct = viewPanelsMenu.funct;

        viewPanelsMenu.funct = function (menu, parent) {
            viewPanelsFunct.apply(this, arguments);

            if (editorUi.commentsSupported()) {
                editorUi.menus.addMenuItems(menu, ['comments'], parent);
            }
        };
    };
})();
