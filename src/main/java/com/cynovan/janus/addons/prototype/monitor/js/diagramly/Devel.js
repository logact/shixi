/*
 * $Id: Devel.js,v 1.27 2014/01/08 16:38:06 gaudenz Exp $
 * Copyright (c) 2006-2013, JGraph Ltd
 */
// This provides an indirection to make sure the mxClient.js
// loads before the dependent classes below are loaded. This
// is used for development mode where the JS is in separate
// files and the mxClient.js loads other files.
// Adds external dependencies
mxscript(drawDevUrl + 'js/cryptojs/aes.js');
// mxscript(drawDevUrl + 'js/spin/spin.min.js');
// mxscript(drawDevUrl + 'js/deflate/pako.min.js');
mxscript(drawDevUrl + 'js/deflate/base64.js');
mxscript(drawDevUrl + 'js/jscolor/jscolor.js');
mxscript(drawDevUrl + 'js/sanitizer/sanitizer.js');
//Aric.chen Neptune handler event
mxscript(drawDevUrl + 'janus/neptune-handler.js');
mxscript(drawDevUrl + 'janus/neptune-http.js');
mxscript(drawDevUrl + 'janus/neptune-utils.js');

// Uses grapheditor from devhost
mxscript(geBasePath + '/Sidebar.js');
mxscript(geBasePath + '/Editor.js');
mxscript(geBasePath + '/EditorUi.js');
mxscript(geBasePath + '/Graph.js');
mxscript(geBasePath + '/Format.js');
mxscript(geBasePath + '/Shapes.js');
mxscript(geBasePath + '/Actions.js');
mxscript(geBasePath + '/Menus.js');
mxscript(geBasePath + '/Toolbar.js');
mxscript(geBasePath + '/Dialogs.js');

// Loads main classes
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar.js');
//Aric.chen :::: import js file
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Neptune.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Android.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Arrows2.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Azure.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Basic.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Bootstrap.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Electrical.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Ios.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Ios7.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Network.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-PID.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-Gmdl.js');
mxscript(drawDevUrl + 'js/diagramly/sidebar/Sidebar-WebIcons.js');

mxscript(drawDevUrl + 'js/diagramly/util/mxJsCanvas.js');
mxscript(drawDevUrl + 'js/diagramly/util/mxAsyncCanvas.js');

mxscript(drawDevUrl + 'js/diagramly/DrawioFile.js');
mxscript(drawDevUrl + 'js/diagramly/LocalFile.js');
mxscript(drawDevUrl + 'js/diagramly/LocalLibrary.js');
mxscript(drawDevUrl + 'js/diagramly/StorageFile.js');
mxscript(drawDevUrl + 'js/diagramly/StorageLibrary.js');
mxscript(drawDevUrl + 'js/diagramly/Dialogs.js');
mxscript(drawDevUrl + 'js/diagramly/Editor.js');
mxscript(drawDevUrl + 'js/diagramly/EditorUi.js');
mxscript(drawDevUrl + 'js/diagramly/DiffSync.js');
mxscript(drawDevUrl + 'js/diagramly/Settings.js');

//Comments
mxscript(drawDevUrl + 'js/diagramly/DriveComment.js');

// Excluded in base.min.js
mxscript(drawDevUrl + 'js/diagramly/UrlLibrary.js');
mxscript(drawDevUrl + 'js/diagramly/DriveFile.js');
mxscript(drawDevUrl + 'js/diagramly/DriveLibrary.js');
mxscript(drawDevUrl + 'js/diagramly/DriveClient.js');

mxscript(drawDevUrl + 'js/diagramly/App.js');
mxscript(drawDevUrl + 'js/diagramly/Menus.js');
mxscript(drawDevUrl + 'js/diagramly/Pages.js');
mxscript(drawDevUrl + 'js/diagramly/Trees.js');
mxscript(drawDevUrl + 'js/diagramly/Minimal.js');
mxscript(drawDevUrl + 'js/diagramly/DistanceGuides.js');
mxscript(drawDevUrl + 'js/diagramly/mxRuler.js');
mxscript(drawDevUrl + 'js/diagramly/mxFreehand.js');
