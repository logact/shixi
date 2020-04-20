// NOTE: Modified to support data URIs for images, ie. data:image/*
// Modified to allow "word-break: break-word" in styles. It is done by adding "break-word" which is at index 55 of J array J[55] to "cssLitGroup" of "word-break"
(function () {
    var c = void 0, n = !0, s = null, C = !1,
        J = ["aliceblue,antiquewhite,aqua,aquamarine,azure,beige,bisque,black,blanchedalmond,blue,blueviolet,brown,burlywood,cadetblue,chartreuse,chocolate,coral,cornflowerblue,cornsilk,crimson,cyan,darkblue,darkcyan,darkgoldenrod,darkgray,darkgreen,darkkhaki,darkmagenta,darkolivegreen,darkorange,darkorchid,darkred,darksalmon,darkseagreen,darkslateblue,darkslategray,darkturquoise,darkviolet,deeppink,deepskyblue,dimgray,dodgerblue,firebrick,floralwhite,forestgreen,fuchsia,gainsboro,ghostwhite,gold,goldenrod,gray,green,greenyellow,honeydew,hotpink,indianred,indigo,ivory,khaki,lavender,lavenderblush,lawngreen,lemonchiffon,lightblue,lightcoral,lightcyan,lightgoldenrodyellow,lightgreen,lightgrey,lightpink,lightsalmon,lightseagreen,lightskyblue,lightslategray,lightsteelblue,lightyellow,lime,limegreen,linen,magenta,maroon,mediumaquamarine,mediumblue,mediumorchid,mediumpurple,mediumseagreen,mediumslateblue,mediumspringgreen,mediumturquoise,mediumvioletred,midnightblue,mintcream,mistyrose,moccasin,navajowhite,navy,oldlace,olive,olivedrab,orange,orangered,orchid,palegoldenrod,palegreen,paleturquoise,palevioletred,papayawhip,peachpuff,peru,pink,plum,powderblue,purple,red,rosybrown,royalblue,saddlebrown,salmon,sandybrown,seagreen,seashell,sienna,silver,skyblue,slateblue,slategray,snow,springgreen,steelblue,tan,teal,thistle,tomato,transparent,turquoise,violet,wheat,white,whitesmoke,yellow,yellowgreen".split(","),
            "all-scroll,col-resize,crosshair,default,e-resize,hand,help,move,n-resize,ne-resize,no-drop,not-allowed,nw-resize,pointer,progress,row-resize,s-resize,se-resize,sw-resize,text,vertical-text,w-resize,wait".split(","), "armenian,decimal,decimal-leading-zero,disc,georgian,lower-alpha,lower-greek,lower-latin,lower-roman,square,upper-alpha,upper-latin,upper-roman".split(","), "100,200,300,400,500,600,700,800,900,bold,bolder,lighter".split(","), "block-level,inline-level,table-caption,table-cell,table-column,table-column-group,table-footer-group,table-header-group,table-row,table-row-group".split(","),
            "condensed,expanded,extra-condensed,extra-expanded,narrower,semi-condensed,semi-expanded,ultra-condensed,ultra-expanded,wider".split(","), "inherit,inline,inline-block,inline-box,inline-flex,inline-grid,inline-list-item,inline-stack,inline-table,run-in".split(","), "behind,center-left,center-right,far-left,far-right,left-side,leftwards,right-side,rightwards".split(","), "large,larger,small,smaller,x-large,x-small,xx-large,xx-small".split(","), "dashed,dotted,double,groove,outset,ridge,solid".split(","),
            "ease,ease-in,ease-in-out,ease-out,linear,step-end,step-start".split(","), "at,closest-corner,closest-side,ellipse,farthest-corner,farthest-side".split(","), "baseline,middle,sub,super,text-bottom,text-top".split(","), "caption,icon,menu,message-box,small-caption,status-bar".split(","), "fast,faster,slow,slower,x-fast,x-slow".split(","), ["above", "below", "higher", "level", "lower"], ["cursive", "fantasy", "monospace", "sans-serif", "serif"], ["loud", "silent", "soft", "x-loud", "x-soft"], ["no-repeat", "repeat-x", "repeat-y",
                "round", "space"], ["blink", "line-through", "overline", "underline"], ["block", "flex", "grid", "table"], ["high", "low", "x-high", "x-low"], ["nowrap", "pre", "pre-line", "pre-wrap"], ["absolute", "relative", "static"], ["alternate", "alternate-reverse", "reverse"], ["border-box", "content-box", "padding-box"], ["capitalize", "lowercase", "uppercase"], ["child", "female", "male"], ["=", "opacity"], ["backwards", "forwards"], ["bidi-override", "embed"], ["bottom", "top"], ["break-all", "keep-all"], ["clip", "ellipsis"], ["contain", "cover"],
            ["continuous", "digits"], ["end", "start"], ["flat", "preserve-3d"], ["hide", "show"], ["horizontal", "vertical"], ["inside", "outside"], ["italic", "oblique"], ["left", "right"], ["ltr", "rtl"], ["no-content", "no-display"], ["paused", "running"], ["suppress", "unrestricted"], ["thick", "thin"], [","], ["/"], ["all"], ["always"], ["auto"], ["avoid"], ["both"], ["break-word"], ["center"], ["circle"], ["code"], ["collapse"], ["contents"], ["fixed"], ["hidden"], ["infinite"], ["inset"], ["invert"], ["justify"], ["list-item"], ["local"], ["medium"],
            ["mix"], ["none"], ["normal"], ["once"], ["repeat"], ["scroll"], ["separate"], ["small-caps"], ["spell-out"], ["to"], ["visible"]],
        L = {
            animation: {
                cssPropBits: 517,
                cssLitGroup: [J[10], J[24], J[29], J[45], J[48], J[54], J[63], J[71], J[72]],
                cssFns: ["cubic-bezier()", "steps()"]
            },
            "animation-delay": {cssPropBits: 5, cssLitGroup: [J[48]], cssFns: []},
            "animation-direction": {cssPropBits: 0, cssLitGroup: [J[24], J[48], J[72]], cssFns: []},
            "animation-duration": "animation-delay",
            "animation-fill-mode": {
                cssPropBits: 0, cssLitGroup: [J[29], J[48],
                    J[54], J[71]], cssFns: []
            },
            "animation-iteration-count": {cssPropBits: 5, cssLitGroup: [J[48], J[63]], cssFns: []},
            "animation-name": {cssPropBits: 512, cssLitGroup: [J[48], J[71]], cssFns: []},
            "animation-play-state": {cssPropBits: 0, cssLitGroup: [J[45], J[48]], cssFns: []},
            "animation-timing-function": {
                cssPropBits: 0,
                cssLitGroup: [J[10], J[48]],
                cssFns: ["cubic-bezier()", "steps()"]
            },
            appearance: {cssPropBits: 0, cssLitGroup: [J[71]], cssFns: []},
            azimuth: {cssPropBits: 5, cssLitGroup: [J[7], J[42], J[56]], cssFns: []},
            "backface-visibility": {
                cssPropBits: 0,
                cssLitGroup: [J[59], J[62], J[80]], cssFns: []
            },
            background: {
                cssPropBits: 23,
                cssLitGroup: [J[0], J[18], J[25], J[31], J[34], J[42], J[48], J[49], J[52], J[56], J[61], J[68], J[71], J[74], J[75]],
                cssFns: "image(),linear-gradient(),radial-gradient(),repeating-linear-gradient(),repeating-radial-gradient(),rgb(),rgba()".split(",")
            },
            "background-attachment": {cssPropBits: 0, cssLitGroup: [J[48], J[61], J[68], J[75]], cssFns: []},
            "background-color": {cssPropBits: 2, cssLitGroup: [J[0]], cssFns: ["rgb()", "rgba()"]},
            "background-image": {
                cssPropBits: 16,
                cssLitGroup: [J[48], J[71]],
                cssFns: ["image()", "linear-gradient()", "radial-gradient()", "repeating-linear-gradient()", "repeating-radial-gradient()"]
            },
            "background-position": {cssPropBits: 5, cssLitGroup: [J[31], J[42], J[48], J[56]], cssFns: []},
            "background-repeat": {cssPropBits: 0, cssLitGroup: [J[18], J[48], J[74]], cssFns: []},
            "background-size": {cssPropBits: 5, cssLitGroup: [J[34], J[48], J[52]], cssFns: []},
            border: {
                cssPropBits: 7,
                cssLitGroup: [J[0], J[9], J[47], J[62], J[64], J[69], J[71]],
                cssFns: ["rgb()", "rgba()"]
            },
            "border-bottom": "border",
            "border-bottom-color": "background-color",
            "border-bottom-left-radius": {cssPropBits: 5, cssFns: []},
            "border-bottom-right-radius": "border-bottom-left-radius",
            "border-bottom-style": {cssPropBits: 0, cssLitGroup: [J[9], J[62], J[64], J[71]], cssFns: []},
            "border-bottom-width": {cssPropBits: 5, cssLitGroup: [J[47], J[69]], cssFns: []},
            "border-collapse": {cssPropBits: 0, cssLitGroup: [J[59], J[76]], cssFns: []},
            "border-color": "background-color",
            "border-left": "border",
            "border-left-color": "background-color",
            "border-left-style": "border-bottom-style",
            "border-left-width": "border-bottom-width",
            "border-radius": {cssPropBits: 5, cssLitGroup: [J[49]], cssFns: []},
            "border-right": "border",
            "border-right-color": "background-color",
            "border-right-style": "border-bottom-style",
            "border-right-width": "border-bottom-width",
            "border-spacing": "border-bottom-left-radius",
            "border-style": "border-bottom-style",
            "border-top": "border",
            "border-top-color": "background-color",
            "border-top-left-radius": "border-bottom-left-radius",
            "border-top-right-radius": "border-bottom-left-radius",
            "border-top-style": "border-bottom-style",
            "border-top-width": "border-bottom-width",
            "border-width": "border-bottom-width",
            bottom: {cssPropBits: 5, cssLitGroup: [J[52]], cssFns: []},
            box: {cssPropBits: 0, cssLitGroup: [J[60], J[71], J[72]], cssFns: []},
            "box-shadow": {cssPropBits: 7, cssLitGroup: [J[0], J[48], J[64], J[71]], cssFns: ["rgb()", "rgba()"]},
            "box-sizing": {cssPropBits: 0, cssLitGroup: [J[25]], cssFns: []},
            "caption-side": {cssPropBits: 0, cssLitGroup: [J[31]], cssFns: []},
            clear: {cssPropBits: 0, cssLitGroup: [J[42], J[54], J[71]], cssFns: []},
            clip: {cssPropBits: 0, cssLitGroup: [J[52]], cssFns: ["rect()"]},
            color: "background-color",
            content: {cssPropBits: 8, cssLitGroup: [J[71], J[72]], cssFns: []},
            cue: {cssPropBits: 16, cssLitGroup: [J[71]], cssFns: []},
            "cue-after": "cue",
            "cue-before": "cue",
            cursor: {cssPropBits: 16, cssLitGroup: [J[1], J[48], J[52]], cssFns: []},
            direction: {cssPropBits: 0, cssLitGroup: [J[43]], cssFns: []},
            display: {cssPropBits: 0, cssLitGroup: [J[4], J[6], J[20], J[52], J[67], J[71]], cssFns: []},
            "display-extras": {cssPropBits: 0, cssLitGroup: [J[67], J[71]], cssFns: []},
            "display-inside": {cssPropBits: 0, cssLitGroup: [J[20], J[52]], cssFns: []},
            "display-outside": {cssPropBits: 0, cssLitGroup: [J[4], J[71]], cssFns: []},
            elevation: {cssPropBits: 5, cssLitGroup: [J[15]], cssFns: []},
            "empty-cells": {cssPropBits: 0, cssLitGroup: [J[38]], cssFns: []},
            filter: {cssPropBits: 0, cssFns: ["alpha()"]},
            "float": {cssPropBits: 0, cssLitGroup: [J[42], J[71]], cssFns: []},
            font: {
                cssPropBits: 73,
                cssLitGroup: [J[3], J[8], J[13], J[16], J[41], J[48], J[49], J[69], J[72], J[77]],
                cssFns: []
            },
            "font-family": {
                cssPropBits: 72, cssLitGroup: [J[16],
                    J[48]], cssFns: []
            },
            "font-size": {cssPropBits: 1, cssLitGroup: [J[8], J[69]], cssFns: []},
            "font-stretch": {cssPropBits: 0, cssLitGroup: [J[5], J[72]], cssFns: []},
            "font-style": {cssPropBits: 0, cssLitGroup: [J[41], J[72]], cssFns: []},
            "font-variant": {cssPropBits: 0, cssLitGroup: [J[72], J[77]], cssFns: []},
            "font-weight": {cssPropBits: 0, cssLitGroup: [J[3], J[72]], cssFns: []},
            height: "bottom",
            left: "bottom",
            "letter-spacing": {cssPropBits: 5, cssLitGroup: [J[72]], cssFns: []},
            "line-height": {cssPropBits: 1, cssLitGroup: [J[72]], cssFns: []},
            "list-style": {
                cssPropBits: 16,
                cssLitGroup: [J[2], J[40], J[57], J[71]],
                cssFns: ["image()", "linear-gradient()", "radial-gradient()", "repeating-linear-gradient()", "repeating-radial-gradient()"]
            },
            "list-style-image": {
                cssPropBits: 16,
                cssLitGroup: [J[71]],
                cssFns: ["image()", "linear-gradient()", "radial-gradient()", "repeating-linear-gradient()", "repeating-radial-gradient()"]
            },
            "list-style-position": {cssPropBits: 0, cssLitGroup: [J[40]], cssFns: []},
            "list-style-type": {cssPropBits: 0, cssLitGroup: [J[2], J[57], J[71]], cssFns: []},
            margin: "bottom",
            "margin-bottom": "bottom",
            "margin-left": "bottom",
            "margin-right": "bottom",
            "margin-top": "bottom",
            "max-height": {cssPropBits: 1, cssLitGroup: [J[52], J[71]], cssFns: []},
            "max-width": "max-height",
            "min-height": {cssPropBits: 1, cssLitGroup: [J[52]], cssFns: []},
            "min-width": "min-height",
            opacity: {cssPropBits: 1, cssFns: []},
            outline: {
                cssPropBits: 7,
                cssLitGroup: [J[0], J[9], J[47], J[62], J[64], J[65], J[69], J[71]],
                cssFns: ["rgb()", "rgba()"]
            },
            "outline-color": {cssPropBits: 2, cssLitGroup: [J[0], J[65]], cssFns: ["rgb()", "rgba()"]},
            "outline-style": "border-bottom-style",
            "outline-width": "border-bottom-width",
            overflow: {cssPropBits: 0, cssLitGroup: [J[52], J[62], J[75], J[80]], cssFns: []},
            "overflow-wrap": {cssPropBits: 0, cssLitGroup: [J[55], J[72]], cssFns: []},
            "overflow-x": {cssPropBits: 0, cssLitGroup: [J[44], J[52], J[62], J[75], J[80]], cssFns: []},
            "overflow-y": "overflow-x",
            padding: "opacity",
            "padding-bottom": "opacity",
            "padding-left": "opacity",
            "padding-right": "opacity",
            "padding-top": "opacity",
            "page-break-after": {cssPropBits: 0, cssLitGroup: [J[42], J[51], J[52], J[53]], cssFns: []},
            "page-break-before": "page-break-after",
            "page-break-inside": {cssPropBits: 0, cssLitGroup: [J[52], J[53]], cssFns: []},
            pause: "border-bottom-left-radius",
            "pause-after": "border-bottom-left-radius",
            "pause-before": "border-bottom-left-radius",
            perspective: {cssPropBits: 5, cssLitGroup: [J[71]], cssFns: []},
            "perspective-origin": {cssPropBits: 5, cssLitGroup: [J[31], J[42], J[56]], cssFns: []},
            pitch: {cssPropBits: 5, cssLitGroup: [J[21], J[69]], cssFns: []},
            "pitch-range": "border-bottom-left-radius",
            "play-during": {cssPropBits: 16, cssLitGroup: [J[52], J[70], J[71], J[74]], cssFns: []},
            position: {cssPropBits: 0, cssLitGroup: [J[23]], cssFns: []},
            quotes: {cssPropBits: 8, cssLitGroup: [J[71]], cssFns: []},
            resize: {cssPropBits: 0, cssLitGroup: [J[39], J[54], J[71]], cssFns: []},
            richness: "border-bottom-left-radius",
            right: "bottom",
            speak: {cssPropBits: 0, cssLitGroup: [J[71], J[72], J[78]], cssFns: []},
            "speak-header": {cssPropBits: 0, cssLitGroup: [J[51], J[73]], cssFns: []},
            "speak-numeral": {cssPropBits: 0, cssLitGroup: [J[35]], cssFns: []},
            "speak-punctuation": {cssPropBits: 0, cssLitGroup: [J[58], J[71]], cssFns: []},
            "speech-rate": {
                cssPropBits: 5,
                cssLitGroup: [J[14], J[69]], cssFns: []
            },
            stress: "border-bottom-left-radius",
            "table-layout": {cssPropBits: 0, cssLitGroup: [J[52], J[61]], cssFns: []},
            "text-align": {cssPropBits: 0, cssLitGroup: [J[42], J[56], J[66]], cssFns: []},
            "text-decoration": {cssPropBits: 0, cssLitGroup: [J[19], J[71]], cssFns: []},
            "text-indent": "border-bottom-left-radius",
            "text-overflow": {cssPropBits: 8, cssLitGroup: [J[33]], cssFns: []},
            "text-shadow": "box-shadow",
            "text-transform": {cssPropBits: 0, cssLitGroup: [J[26], J[71]], cssFns: []},
            "text-wrap": {
                cssPropBits: 0,
                cssLitGroup: [J[46], J[71], J[72]], cssFns: []
            },
            top: "bottom",
            transform: {
                cssPropBits: 0,
                cssLitGroup: [J[71]],
                cssFns: "matrix(),perspective(),rotate(),rotate3d(),rotatex(),rotatey(),rotatez(),scale(),scale3d(),scalex(),scaley(),scalez(),skew(),skewx(),skewy(),translate(),translate3d(),translatex(),translatey(),translatez()".split(",")
            },
            "transform-origin": "perspective-origin",
            "transform-style": {cssPropBits: 0, cssLitGroup: [J[37]], cssFns: []},
            transition: {
                cssPropBits: 1029, cssLitGroup: [J[10], J[48], J[50], J[71]], cssFns: ["cubic-bezier()",
                    "steps()"]
            },
            "transition-delay": "animation-delay",
            "transition-duration": "animation-delay",
            "transition-property": {cssPropBits: 1024, cssLitGroup: [J[48], J[50]], cssFns: []},
            "transition-timing-function": "animation-timing-function",
            "unicode-bidi": {cssPropBits: 0, cssLitGroup: [J[30], J[72]], cssFns: []},
            "vertical-align": {cssPropBits: 5, cssLitGroup: [J[12], J[31]], cssFns: []},
            visibility: "backface-visibility",
            "voice-family": {cssPropBits: 8, cssLitGroup: [J[27], J[48]], cssFns: []},
            volume: {
                cssPropBits: 1, cssLitGroup: [J[17], J[69]],
                cssFns: []
            },
            "white-space": {cssPropBits: 0, cssLitGroup: [J[22], J[72]], cssFns: []},
            width: "min-height",
            "word-break": {cssPropBits: 0, cssLitGroup: [J[32], J[72], J[55]], cssFns: []},
            "word-spacing": "letter-spacing",
            "word-wrap": "overflow-wrap",
            "z-index": "bottom",
            zoom: "line-height",
            "cubic-bezier()": "animation-delay",
            "steps()": {cssPropBits: 5, cssLitGroup: [J[36], J[48]], cssFns: []},
            "image()": {cssPropBits: 18, cssLitGroup: [J[0], J[48]], cssFns: ["rgb()", "rgba()"]},
            "linear-gradient()": {
                cssPropBits: 7, cssLitGroup: [J[0], J[31], J[42], J[48],
                    J[79]], cssFns: ["rgb()", "rgba()"]
            },
            "radial-gradient()": {
                cssPropBits: 7,
                cssLitGroup: [J[0], J[11], J[31], J[42], J[48], J[56], J[57]],
                cssFns: ["rgb()", "rgba()"]
            },
            "repeating-linear-gradient()": "linear-gradient()",
            "repeating-radial-gradient()": "radial-gradient()",
            "rgb()": {cssPropBits: 1, cssLitGroup: [J[48]], cssFns: []},
            "rgba()": "rgb()",
            "rect()": {cssPropBits: 5, cssLitGroup: [J[48], J[52]], cssFns: []},
            "alpha()": {cssPropBits: 1, cssLitGroup: [J[28]], cssFns: []},
            "matrix()": "animation-delay",
            "perspective()": "border-bottom-left-radius",
            "rotate()": "border-bottom-left-radius",
            "rotate3d()": "animation-delay",
            "rotatex()": "border-bottom-left-radius",
            "rotatey()": "border-bottom-left-radius",
            "rotatez()": "border-bottom-left-radius",
            "scale()": "animation-delay",
            "scale3d()": "animation-delay",
            "scalex()": "border-bottom-left-radius",
            "scaley()": "border-bottom-left-radius",
            "scalez()": "border-bottom-left-radius",
            "skew()": "animation-delay",
            "skewx()": "border-bottom-left-radius",
            "skewy()": "border-bottom-left-radius",
            "translate()": "animation-delay",
            "translate3d()": "animation-delay",
            "translatex()": "border-bottom-left-radius",
            "translatey()": "border-bottom-left-radius",
            "translatez()": "border-bottom-left-radius"
        }, O;
    for (O in L) "string" === typeof L[O] && Object.hasOwnProperty.call(L, O) && (L[O] = L[L[O]]);
    "undefined" !== typeof window && (window.cssSchema = L);
    var U, X;
    (function () {
        function g(a) {
            var f = parseInt(a.substring(1), 16);
            return 65535 < f ? (f -= 65536, String.fromCharCode(55296 + (f >> 10), 56320 + (f & 1023))) : f == f ? String.fromCharCode(f) : " " > a[1] ? "" : a[1]
        }

        function w(a, f) {
            return '"' + a.replace(/[\u0000-\u001f\\\"<>]/g, f) + '"'
        }

        function M(a) {
            return E[a] || (E[a] = "\\" + a.charCodeAt(0).toString(16) + " ")
        }

        function x(a) {
            return e[a] || (e[a] = ("\u0010" > a ? "%0" : "%") + a.charCodeAt(0).toString(16))
        }

        var E = {"\\": "\\\\"}, e = {"\\": "%5c"},
            v = RegExp("\\uFEFF|U[+][0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?|url[(][\\t\\n\\f ]*(?:\"(?:'|[^'\"\\n\\f\\\\]|\\\\[\\s\\S])*\"|'(?:\"|[^'\"\\n\\f\\\\]|\\\\[\\s\\S])*'|(?:[\\t\\x21\\x23-\\x26\\x28-\\x5b\\x5d-\\x7e]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))*)[\\t\\n\\f ]*[)]|(?!url[(])-?(?:[a-zA-Z_]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))(?:[a-zA-Z0-9_-]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))*[(]|(?:@?-?(?:[a-zA-Z_]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))|#)(?:[a-zA-Z0-9_-]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))*|\"(?:'|[^'\"\\n\\f\\\\]|\\\\[\\s\\S])*\"|'(?:\"|[^'\"\\n\\f\\\\]|\\\\[\\s\\S])*'|[-+]?(?:[0-9]+(?:[.][0-9]+)?|[.][0-9]+)(?:%|-?(?:[a-zA-Z_]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))(?:[a-zA-Z0-9_-]|[\\u0080-\\ud7ff\\ue000-\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]|\\\\(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff]))*)?|<\!--|--\>|[\\t\\n\\f ]+|/(?:[*][^*]*[*]+(?:[^/][^*]*[*]+)*/|/[^\\n\\f]*)|[~|^$*]=|[^\"'\\\\/]|/(?![/*])", "gi"),
            b = RegExp("\\\\(?:(?:[0-9a-fA-F]{1,6}[\\t\\n\\f ]?|[\\u0020-\\u007e\\u0080-\\ud7ff\\ue000\\ufffd]|[\\ud800-\\udbff][\\udc00-\\udfff])|[\\n\\f])", "g"),
            a = RegExp("^url\\([\\t\\n\\f ]*[\"']?|[\"']?[\\t\\n\\f ]*\\)$", "gi");
        X = function (a) {
            return a.replace(b, g)
        };
        U = function (b) {
            for (var b = ("" + b).replace(/\r\n?/g, "\n").match(v) || [], f = 0, h = " ", d = 0, y = b.length; d < y; ++d) {
                var l = X(b[d]), V = l.length, g = l.charCodeAt(0),
                    l = 34 == g || 39 == g ? w(l.substring(1, V - 1), M) : 47 == g && 1 < V || "\\" == l || "--\>" == l || "<\!--" == l || "\ufeff" == l || 32 >= g ? " " :
                        /url\(/i.test(l) ? "url(" + w(l.replace(a, ""), x) + ")" : l;
                if (h != l || " " != l) b[f++] = h = l
            }
            b.length = f;
            return b
        }
    })();
    "undefined" !== typeof window && (window.lexCss = U, window.decodeCss = X);
    var Y = function () {
        function g(d) {
            d = ("" + d).match(k);
            return !d ? s : new e(v(d[1]), v(d[2]), v(d[3]), v(d[4]), v(d[5]), v(d[6]), v(d[7]))
        }

        function w(d, a) {
            return "string" == typeof d ? encodeURI(d).replace(a, M) : s
        }

        function M(d) {
            d = d.charCodeAt(0);
            return "%" + "0123456789ABCDEF".charAt(d >> 4 & 15) + "0123456789ABCDEF".charAt(d & 15)
        }

        function x(d) {
            if (d === s) return s;
            for (var d = d.replace(/(^|\/)\.(?:\/|$)/g, "$1").replace(/\/{2,}/g, "/"), a = b, h; (h = d.replace(a, "$1")) != d; d = h) ;
            return d
        }

        function E(d, h) {
            var b = d.T(), f = h.K();
            f ? b.ga(h.j) : f = h.X();
            f ? b.da(h.n) : f = h.Y();
            f ? b.ea(h.k) : f = h.$();
            var g = h.g, k = x(g);
            if (f) b.ca(h.V()), k = k && k.replace(a, ""); else if (f = !!g) {
                if (47 !== k.charCodeAt(0)) var k = x(b.g || "").replace(a, ""), e = k.lastIndexOf("/") + 1,
                    k = x((e ? k.substring(0, e) : "") + x(g)).replace(a, "")
            } else k = k && k.replace(a, ""), k !== g && b.G(k);
            f ? b.G(k) : f = h.aa();
            f ? b.O(h.l) : f = h.Z();
            f && b.fa(h.o);
            return b
        }

        function e(d, a, h, f, b, g, k) {
            this.j = d;
            this.n = a;
            this.k = h;
            this.h = f;
            this.g = b;
            this.l = g;
            this.o = k
        }

        function v(d) {
            return "string" == typeof d && 0 < d.length ? d : s
        }

        var b = RegExp(/(\/|^)(?:[^./][^/]*|\.{2,}(?:[^./][^/]*)|\.{3,}[^/]*)\/\.\.(?:\/|$)/),
            a = /^(?:\.\.\/)*(?:\.\.$)?/;
        e.prototype.toString = function () {
            var d = [];
            s !== this.j && d.push(this.j, ":");
            s !== this.k && (d.push("//"), s !== this.n && d.push(this.n, "@"), d.push(this.k), s !== this.h && d.push(":", this.h.toString()));
            s !== this.g && d.push(this.g);
            s !== this.l && d.push("?", this.l);
            s !== this.o && d.push("#", this.o);
            return d.join("")
        };
        e.prototype.T = function () {
            return new e(this.j, this.n, this.k, this.h, this.g, this.l, this.o)
        };
        e.prototype.W = function () {
            return this.j && decodeURIComponent(this.j).toLowerCase()
        };
        e.prototype.ga =
            function (d) {
                this.j = d ? d : s
            };
        e.prototype.K = function () {
            return s !== this.j
        };
        e.prototype.da = function (d) {
            this.n = d ? d : s
        };
        e.prototype.X = function () {
            return s !== this.n
        };
        e.prototype.ea = function (d) {
            this.k = d ? d : s;
            this.G(this.g)
        };
        e.prototype.Y = function () {
            return s !== this.k
        };
        e.prototype.V = function () {
            return this.h && decodeURIComponent(this.h)
        };
        e.prototype.ca = function (d) {
            if (d) {
                d = Number(d);
                if (d !== (d & 65535)) throw Error("Bad port number " + d);
                this.h = "" + d
            } else this.h = s
        };
        e.prototype.$ = function () {
            return s !== this.h
        };
        e.prototype.U =
            function () {
                return this.g && decodeURIComponent(this.g)
            };
        e.prototype.G = function (d) {
            d ? (d = "" + d, this.g = !this.k || /^\//.test(d) ? d : "/" + d) : this.g = s
        };
        e.prototype.O = function (d) {
            this.l = d ? d : s
        };
        e.prototype.aa = function () {
            return s !== this.l
        };
        e.prototype.ba = function (d) {
            if ("object" === typeof d && !(d instanceof Array) && (d instanceof Object || "[object Array]" !== Object.prototype.toString.call(d))) {
                var a = [], h = -1, f;
                for (f in d) {
                    var b = d[f];
                    "string" === typeof b && (a[++h] = f, a[++h] = b)
                }
                d = a
            }
            for (var a = [], h = "", g = 0; g < d.length;) f = d[g++],
                b = d[g++], a.push(h, encodeURIComponent(f.toString())), h = "&", b && a.push("=", encodeURIComponent(b.toString()));
            this.l = a.join("")
        };
        e.prototype.fa = function (d) {
            this.o = d ? d : s
        };
        e.prototype.Z = function () {
            return s !== this.o
        };
        var k = /^(?:([^:/?#]+):)?(?:\/\/(?:([^/?#]*)@)?([^/?#:@]*)(?::([0-9]+))?)?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/,
            f = /[#\/\?@]/g, h = /[\#\?]/g;
        e.parse = g;
        e.create = function (d, a, b, g, k, Q, N) {
            d = new e(w(d, f), w(a, f), "string" == typeof b ? encodeURIComponent(b) : s, 0 < g ? g.toString() : s, w(k, h), s, "string" == typeof N ? encodeURIComponent(N) :
                s);
            Q && ("string" === typeof Q ? d.O(Q.replace(/[^?&=0-9A-Za-z_\-~.%]/g, M)) : d.ba(Q));
            return d
        };
        e.N = E;
        e.ma = x;
        e.ha = {
            ua: function (d) {
                return /\.html$/.test(g(d).U()) ? "text/html" : "application/javascript"
            }, N: function (d, a) {
                return d ? E(g(d), g(a)).toString() : "" + a
            }
        };
        return e
    }();
    "undefined" !== typeof window && (window.URI = Y);
    var aa = c, ba = c, da = c, Z = c;
    (function () {
        function g(a) {
            return "string" === typeof a ? 'url("' + a.replace(e, w) + '")' : 'url("about:blank")'
        }

        function w(a) {
            return v[a]
        }

        function M(a, d) {
            return a ? Y.ha.N(a, d) : d
        }

        function x(h, d, f) {
            if (!f) return s;
            var g = ("" + h).match(b);
            return g && (!g[1] || a.test(g[1])) ? f(h, d) : s
        }

        function E(a) {
            return a.replace(/^-(?:apple|css|epub|khtml|moz|mso?|o|rim|wap|webkit|xv)-(?=[a-z])/, "")
        }

        var e = /[\n\f\r\"\'()*<>]/g, v = {
                "\n": "%0a",
                "\u000c": "%0c",
                "\r": "%0d",
                '"': "%22",
                "'": "%27",
                "(": "%28",
                ")": "%29",
                "*": "%2a",
                "<": "%3c",
                ">": "%3e"
            },
            b = /^(?:([^:/?# ]+):)?/, a = /^(?:https?|mailto|data)$/i;
        aa = function () {
            var a = {};
            return function y(f, b, k, e, N) {
                var f = E(f), u = L[f];
                if (!u || "object" !== typeof u) b.length = 0; else {
                    for (var i = u.cssPropBits, q = i & 80, B = i & 1536, F = NaN, r = 0, o = 0; r < b.length; ++r) {
                        var j = b[r].toLowerCase(), I = j.charCodeAt(0), R, v, P, S, D, w;
                        if (32 === I) j = ""; else if (34 === I) j = 16 === q ? k ? g(x(M(e, X(b[r].substring(1, j.length - 1))), f, k)) : "" : i & 8 && !(q & q - 1) ? j : ""; else if ("inherit" !== j) {
                            if (D = u.cssLitGroup) {
                                var G;
                                if (!(G = u.cssLitMap)) {
                                    G = {};
                                    for (var K = D.length; 0 <= --K;) for (var A =
                                        D[K], T = A.length; 0 <= --T;) G[A[T]] = a;
                                    G = u.cssLitMap = G
                                }
                                D = G
                            } else D = a;
                            if (!(w = D, w[E(j)] === a)) if (35 === I && /^#(?:[0-9a-f]{3}){1,2}$/.test(j)) j = i & 2 ? j : ""; else if (48 <= I && 57 >= I) j = i & 1 ? j : ""; else if (R = j.charCodeAt(1), v = j.charCodeAt(2), P = 48 <= R && 57 >= R, S = 48 <= v && 57 >= v, 43 === I && (P || 46 === R && S)) j = i & 1 ? (P ? "" : "0") + j.substring(1) : ""; else if (45 === I && (P || 46 === R && S)) j = i & 4 ? (P ? "-" : "-0") + j.substring(1) : i & 1 ? "0" : ""; else if (46 === I && P) j = i & 1 ? "0" + j : ""; else if ('url("' === j.substring(0, 5)) j = k && i & 16 ? g(x(M(e, b[r].substring(5, j.length - 2)), f, k)) :
                                ""; else if ("(" === j.charAt(j.length - 1)) a:{
                                D = b;
                                G = r;
                                j = 1;
                                K = G + 1;
                                for (I = D.length; K < I && j;) A = D[K++], j += ")" === A ? -1 : /^[^"']*\($/.test(A);
                                if (!j) {
                                    j = D[G].toLowerCase();
                                    I = E(j);
                                    D = D.splice(G, K - G, "");
                                    G = u.cssFns;
                                    K = 0;
                                    for (A = G.length; K < A; ++K) if (G[K].substring(0, I.length) == I) {
                                        D[0] = D[D.length - 1] = "";
                                        y(G[K], D, k, e);
                                        j = j + D.join(" ") + ")";
                                        break a
                                    }
                                }
                                j = ""
                            } else j = B && /^-?[a-z_][\w\-]*$/.test(j) && !/__$/.test(j) ? N && 512 === B ? b[r] + N : 1024 === B && L[j] && "number" === typeof L[j].oa ? j : "" : /^\w+$/.test(j) && 64 === q && i & 8 ? F + 1 === o ? (b[F] = b[F].substring(0,
                                b[F].length - 1) + " " + j + '"', "") : (F = o, '"' + j + '"') : ""
                        }
                        j && (b[o++] = j)
                    }
                    1 === o && 'url("about:blank")' === b[0] && (o = 0);
                    b.length = o
                }
            }
        }();
        var k = RegExp("^(active|after|before|blank|checked|default|disabled|drop|empty|enabled|first|first-child|first-letter|first-line|first-of-type|fullscreen|focus|hover|in-range|indeterminate|invalid|last-child|last-of-type|left|link|only-child|only-of-type|optional|out-of-range|placeholder-shown|read-only|read-write|required|right|root|scope|user-error|valid|visited)$"),
            f = {};
        f[">"] =
            f["+"] = f["~"] = f;
        ba = function (a, d, b) {
            function g(i, r) {
                function o(b, f, g) {
                    var y, e, i, l, o, m = n;
                    y = "";
                    if (b < f) if (o = a[b], "*" === o) ++b, y = o; else if (/^[a-zA-Z]/.test(o) && (e = x(o.toLowerCase(), []))) "tagName" in e && (o = e.tagName), ++b, y = o;
                    for (l = i = e = ""; m && b < f; ++b) if (o = a[b], "#" === o.charAt(0)) /^#_|__$|[^\w#:\-]/.test(o) ? m = C : e += o + v; else if ("." === o) ++b < f && /^[0-9A-Za-z:_\-]+$/.test(o = a[b]) && !/^_|__$/.test(o) ? e += "." + o : m = C; else if (b + 1 < f && "[" === a[b]) {
                        ++b;
                        var H = a[b++].toLowerCase();
                        o = $.m[y + "::" + H];
                        o !== +o && (o = $.m["*::" + H]);
                        var W;
                        d.ia ? (W = d.ia(y, H), "string" !== typeof W && (m = C, W = H), m && o !== +o && (o = $.d.NONE)) : (W = H, o !== +o && (m = C));
                        var p = H = "", ca = C;
                        /^[~^$*|]?=$/.test(a[b]) && (H = a[b++], p = a[b++], /^[0-9A-Za-z:_\-]+$/.test(p) ? p = '"' + p + '"' : "]" === p && (p = '""', --b), /^"([^\"\\]|\\.)*"$/.test(p) || (m = C), (ca = "i" === a[b]) && ++b);
                        "]" !== a[b] && (++b, m = C);
                        switch (o) {
                            case $.d.CLASSES:
                            case $.d.LOCAL_NAME:
                            case $.d.NONE:
                                break;
                            case $.d.GLOBAL_NAME:
                            case $.d.ID:
                            case $.d.IDREF:
                                ("=" === H || "~=" === H || "$=" === H) && '""' != p && !ca ? p = '"' + p.substring(1, p.length - 1) + v + '"' : "|=" ===
                                    H || "" === H || (m = C);
                                break;
                            case $.d.URI:
                            case $.d.URI_FRAGMENT:
                                "" !== H && (m = C);
                                break;
                            default:
                                m = C
                        }
                        m && (i += "[" + W.replace(/[^\w-]/g, "\\$&") + H + p + (ca ? " i]" : "]"))
                    } else if (b < f && ":" === a[b]) if (o = a[++b], k.test(o)) l += ":" + o; else break; else break;
                    b !== f && (m = C);
                    m && (b = (y + e).replace(/[^ .*#\w-]/g, "\\$&") + i + l + g) && j.push(b);
                    return m
                }

                " " === a[i] && ++i;
                r - 1 !== i && " " === a[r] && --r;
                for (var j = [], l = i, q = n, u = i; q && u < r; ++u) {
                    var B = a[u];
                    if (f[B] === f || " " === B) o(l, u, B) ? l = u + 1 : q = C
                }
                o(l, r, "") || (q = C);
                return q ? (j.length && (l = j.join(""), e !== s && (l = "." +
                    e + " " + l), N.push(l)), n) : !b || b(a.slice(i, r))
            }

            var e = d.na, v = d.L, x = d.Aa, N = [], u = 0, i, q = 0, B;
            for (i = 0; i < a.length; ++i) if (B = a[i], "(" == B || "[" == B ? (++q, n) : ")" == B || "]" == B ? (q && --q, n) : !(" " == a[i] && (q || f[a[i - 1]] === f || f[a[i + 1]] === f))) a[u++] = a[i];
            a.length = u;
            u = a.length;
            for (i = q = 0; i < u; ++i) if ("," === a[i]) {
                if (!g(q, i)) return s;
                q = i + 1
            }
            return !g(q, u) ? s : N
        };
        (function () {
            var a = /^\w/,
                d = RegExp("^(?:(?:(?:(?:only|not) )?(?:all|aural|braille|embossed|handheld|print|projection|screen|speech|tty|tv)|\\( (?:(?:min-|max-)?(?:(?:device-)?(?:aspect-ratio|height|width)|color(?:-index)?|monochrome|orientation|resolution)|grid|hover|luminosity|pointer|scan|script) (?:: -?(?:[a-z]\\w+(?:-\\w+)*|\\d+(?: / \\d+|(?:\\.\\d+)?(?:p[cxt]|[cem]m|in|dpi|dppx|dpcm|%)?)) )?\\))(?: and ?\\( (?:(?:min-|max-)?(?:(?:device-)?(?:aspect-ratio|height|width)|color(?:-index)?|monochrome|orientation|resolution)|grid|hover|luminosity|pointer|scan|script) (?:: -?(?:[a-z]\\w+(?:-\\w+)*|\\d+(?: / \\d+|(?:\\.\\d+)?(?:p[cxt]|[cem]m|in|dpi|dppx|dpcm|%)?)) )?\\))*)(?: , (?:(?:(?:(?:only|not) )?(?:all|aural|braille|embossed|handheld|print|projection|screen|speech|tty|tv)|\\( (?:(?:min-|max-)?(?:(?:device-)?(?:aspect-ratio|height|width)|color(?:-index)?|monochrome|orientation|resolution)|grid|hover|luminosity|pointer|scan|script) (?:: -?(?:[a-z]\\w+(?:-\\w+)*|\\d+(?: / \\d+|(?:\\.\\d+)?(?:p[cxt]|[cem]m|in|dpi|dppx|dpcm|%)?)) )?\\))(?: and ?\\( (?:(?:min-|max-)?(?:(?:device-)?(?:aspect-ratio|height|width)|color(?:-index)?|monochrome|orientation|resolution)|grid|hover|luminosity|pointer|scan|script) (?:: -?(?:[a-z]\\w+(?:-\\w+)*|\\d+(?: / \\d+|(?:\\.\\d+)?(?:p[cxt]|[cem]m|in|dpi|dppx|dpcm|%)?)) )?\\))*))*$",
                    "i");
            Z = function (b) {
                for (var b = b.slice(), f = b.length, g = 0, k = 0; k < f; ++k) {
                    var e = b[k];
                    " " != e && (b[g++] = e)
                }
                b.length = g;
                b = b.join(" ");
                return b = !b.length ? "" : !d.test(b) ? "not all" : a.test(b) ? b : "not all , " + b
            }
        })();
        (function () {
            function a(b) {
                var d = /^\s*[']([^']*)[']\s*$/, f = /^\s*url\s*[(]["]([^"]*)["][)]\s*$/,
                    g = /^\s*url\s*[(][']([^']*)['][)]\s*$/, h = /^\s*url\s*[(]([^)]*)[)]\s*$/, k;
                return (k = /^\s*["]([^"]*)["]\s*$/.exec(b)) || (k = d.exec(b)) || (k = f.exec(b)) || (k = g.exec(b)) || (k = h.exec(b)) ? k[1] : s
            }

            function b(f, g, k, e, v, w, u) {
                function i() {
                    r =
                        F.length && F[F.length - 1] === s
                }

                var q = c, B = u || [0], F = [], r = C;
                fa(g, {
                    startStylesheet: function () {
                        q = []
                    }, endStylesheet: function () {
                    }, startAtrule: function (g, j) {
                        if (r) g = s; else if ("@media" === g) q.push("@media", " ", Z(j)); else if ("@keyframes" === g || "@-webkit-keyframes" === g) {
                            var i = j[0];
                            1 === j.length && !/__$|[^\w\-]/.test(i) ? (q.push(g, " ", i + k.L), g = "@keyframes") : g = s
                        } else if ("@import" === g && 0 < j.length) if (g = s, "function" === typeof w) {
                            var l = Z(j.slice(1));
                            if ("not all" !== l) {
                                ++B[0];
                                var u = [];
                                q.push(u);
                                var E = x(M(f, a(j[0])), function (a) {
                                    var f =
                                        b(E, a.qa, k, e, v, w, B);
                                    --B[0];
                                    a = l ? {
                                        toString: function () {
                                            return "@media " + l + " {" + f.result + "}"
                                        }
                                    } : f.result;
                                    u[0] = a;
                                    w(a, !!B[0])
                                }, v)
                            }
                        } else window.console && window.console.log("@import " + j.join(" ") + " elided");
                        r = !g;
                        F.push(g)
                    }, endAtrule: function () {
                        F.pop();
                        r || q.push(";");
                        i()
                    }, startBlock: function () {
                        r || q.push("{")
                    }, endBlock: function () {
                        r || (q.push("}"), r = n)
                    }, startRuleset: function (a) {
                        if (!r) {
                            var b = c;
                            "@keyframes" === F[F.length - 1] ? (b = a.join(" ").match(/^ *(?:from|to|\d+(?:\.\d+)?%) *(?:, *(?:from|to|\d+(?:\.\d+)?%) *)*$/i),
                                r = !b, b && (b = b[0].replace(/ +/g, ""))) : (a = ba(a, k), !a || !a.length ? r = n : b = a.join(", "));
                            r || q.push(b, "{")
                        }
                        F.push(s)
                    }, endRuleset: function () {
                        F.pop();
                        r || q.push("}");
                        i()
                    }, declaration: function (a, b) {
                        if (!r) {
                            var d = C, g = b.length;
                            2 <= g && "!" === b[g - 2] && "important" === b[g - 1].toLowerCase() && (d = n, b.length -= 2);
                            aa(a, b, e, f, k.L);
                            b.length && q.push(a, ":", b.join(" "), d ? " !important;" : ";")
                        }
                    }
                });
                return {
                    result: {
                        toString: function () {
                            return q.join("")
                        }
                    }, va: !!B[0]
                }
            }

            da = function (a, f, g, k) {
                return b(a, f, g, k, c, c).result.toString()
            }
        })()
    })();
    "undefined" !== typeof window && (window.sanitizeCssProperty = aa, window.sanitizeCssSelectorList = ba, window.sanitizeStylesheet = da, window.sanitizeMediaQuery = Z);
    var fa, ga;
    (function () {
        function g(b, a, g, f, h) {
            for (var d = a++; a < g && "{" !== b[a] && ";" !== b[a];) ++a;
            if (a < g && (h || ";" === b[a])) {
                var h = d + 1, e = a;
                h < g && " " === b[h] && ++h;
                e > h && " " === b[e - 1] && --e;
                f.startAtrule && f.startAtrule(b[d].toLowerCase(), b.slice(h, e));
                a = "{" === b[a] ? w(b, a, g, f) : a + 1;
                f.endAtrule && f.endAtrule()
            }
            return a
        }

        function w(b, a, k, f) {
            ++a;
            for (f.startBlock && f.startBlock(); a < k;) {
                var h = b[a].charAt(0);
                if ("}" == h) {
                    ++a;
                    break
                }
                a = " " === h || ";" === h ? a + 1 : "@" === h ? g(b, a, k, f, C) : "{" === h ? w(b, a, k, f) : M(b, a, k, f)
            }
            f.endBlock && f.endBlock();
            return a
        }

        function M(b, a, g, f) {
            var h = a, d = x(b, a, g, n);
            if (0 > d) return d = ~d, d === h ? d + 1 : d;
            var y = b[d];
            if ("{" !== y) return d === h ? d + 1 : d;
            a = d + 1;
            d > h && " " === b[d - 1] && --d;
            for (f.startRuleset && f.startRuleset(b.slice(h, d)); a < g;) {
                y = b[a];
                if ("}" === y) {
                    ++a;
                    break
                }
                a = " " === y ? a + 1 : e(b, a, g, f)
            }
            f.endRuleset && f.endRuleset();
            return a
        }

        function x(b, a, g, f) {
            for (var h, d = [], e = -1; a < g; ++a) if (h = b[a].charAt(0), "[" === h || "(" === h) d[++e] = h; else if ("]" === h && "[" === d[e] || ")" === h && "(" === d[e]) --e; else if ("{" === h || "}" === h || ";" === h || "@" === h || ":" === h && !f) break;
            0 <=
            e && (a = ~(a + 1));
            return a
        }

        function E(b, a, g) {
            for (; a < g && ";" !== b[a] && "}" !== b[a];) ++a;
            return a < g && ";" === b[a] ? a + 1 : a
        }

        function e(b, a, g, f) {
            var h = b[a++];
            if (!v.test(h)) return E(b, a, g);
            a < g && " " === b[a] && ++a;
            if (a == g || ":" !== b[a]) return E(b, a, g);
            ++a;
            a < g && " " === b[a] && ++a;
            var d = x(b, a, g, C);
            if (0 > d) d = ~d; else {
                for (var e = [], l = 0, w = a; w < d; ++w) a = b[w], " " !== a && (e[l++] = a);
                if (d < g) {
                    do {
                        a = b[d];
                        if (";" === a || "}" === a) break;
                        l = 0
                    } while (++d < g);
                    ";" === a && ++d
                }
                l && f.declaration && f.declaration(h.toLowerCase(), e)
            }
            return d
        }

        fa = function (b, a) {
            var e = U(b);
            a.startStylesheet && a.startStylesheet();
            for (var f = 0, h = e.length; f < h;) f = " " === e[f] ? f + 1 : f < h ? "@" === e[f].charAt(0) ? g(e, f, h, a, n) : M(e, f, h, a) : f;
            a.endStylesheet && a.endStylesheet()
        };
        var v = /^-?[a-z]/i;
        ga = function (b, a) {
            for (var g = U(b), f = 0, h = g.length; f < h;) f = " " !== g[f] ? e(g, f, h, a) : f + 1
        }
    })();
    "undefined" !== typeof window && (window.parseCssStylesheet = fa, window.parseCssDeclarations = ga);
    var $ = {
        d: {
            NONE: 0,
            URI: 1,
            URI_FRAGMENT: 11,
            SCRIPT: 2,
            STYLE: 3,
            HTML: 12,
            ID: 4,
            IDREF: 5,
            IDREFS: 6,
            GLOBAL_NAME: 7,
            LOCAL_NAME: 8,
            CLASSES: 9,
            FRAME_TARGET: 10,
            MEDIA_QUERY: 13
        }
    };
    $.atype = $.d;
    $.m = {
        "*::class": 9,
        "*::dir": 0,
        "*::draggable": 0,
        "*::hidden": 0,
        "*::id": 4,
        "*::inert": 0,
        "*::itemprop": 0,
        "*::itemref": 6,
        "*::itemscope": 0,
        "*::lang": 0,
        "*::onblur": 2,
        "*::onchange": 2,
        "*::onclick": 2,
        "*::ondblclick": 2,
        "*::onerror": 2,
        "*::onfocus": 2,
        "*::onkeydown": 2,
        "*::onkeypress": 2,
        "*::onkeyup": 2,
        "*::onload": 2,
        "*::onmousedown": 2,
        "*::onmousemove": 2,
        "*::onmouseout": 2,
        "*::onmouseover": 2,
        "*::onmouseup": 2,
        "*::onreset": 2,
        "*::onscroll": 2,
        "*::onselect": 2,
        "*::onsubmit": 2,
        "*::ontouchcancel": 2,
        "*::ontouchend": 2,
        "*::ontouchenter": 2,
        "*::ontouchleave": 2,
        "*::ontouchmove": 2,
        "*::ontouchstart": 2,
        "*::onunload": 2,
        "*::spellcheck": 0,
        "*::style": 3,
        "*::tabindex": 0,
        "*::title": 0,
        "*::translate": 0,
        "a::accesskey": 0,
        "a::coords": 0,
        "a::href": 1,
        "a::hreflang": 0,
        "a::name": 7,
        "a::onblur": 2,
        "a::onfocus": 2,
        "a::shape": 0,
        "a::target": 10,
        "a::type": 0,
        "area::accesskey": 0,
        "area::alt": 0,
        "area::coords": 0,
        "area::href": 1,
        "area::nohref": 0,
        "area::onblur": 2,
        "area::onfocus": 2,
        "area::shape": 0,
        "area::target": 10,
        "audio::controls": 0,
        "audio::loop": 0,
        "audio::mediagroup": 5,
        "audio::muted": 0,
        "audio::preload": 0,
        "audio::src": 1,
        "bdo::dir": 0,
        "blockquote::cite": 1,
        "br::clear": 0,
        "button::accesskey": 0,
        "button::disabled": 0,
        "button::name": 8,
        "button::onblur": 2,
        "button::onfocus": 2,
        "button::type": 0,
        "button::value": 0,
        "canvas::height": 0,
        "canvas::width": 0,
        "caption::align": 0,
        "col::align": 0,
        "col::char": 0,
        "col::charoff": 0,
        "col::span": 0,
        "col::valign": 0,
        "col::width": 0,
        "colgroup::align": 0,
        "colgroup::char": 0,
        "colgroup::charoff": 0,
        "colgroup::span": 0,
        "colgroup::valign": 0,
        "colgroup::width": 0,
        "command::checked": 0,
        "command::command": 5,
        "command::disabled": 0,
        "command::icon": 1,
        "command::label": 0,
        "command::radiogroup": 0,
        "command::type": 0,
        "data::value": 0,
        "del::cite": 1,
        "del::datetime": 0,
        "details::open": 0,
        "dir::compact": 0,
        "div::align": 0,
        "dl::compact": 0,
        "fieldset::disabled": 0,
        "font::color": 0,
        "font::face": 0,
        "font::size": 0,
        "form::accept": 0,
        "form::action": 1,
        "form::autocomplete": 0,
        "form::enctype": 0,
        "form::method": 0,
        "form::name": 7,
        "form::novalidate": 0,
        "form::onreset": 2,
        "form::onsubmit": 2,
        "form::target": 10,
        "h1::align": 0,
        "h2::align": 0,
        "h3::align": 0,
        "h4::align": 0,
        "h5::align": 0,
        "h6::align": 0,
        "hr::align": 0,
        "hr::noshade": 0,
        "hr::size": 0,
        "hr::width": 0,
        "iframe::align": 0,
        "iframe::frameborder": 0,
        "iframe::height": 0,
        "iframe::marginheight": 0,
        "iframe::marginwidth": 0,
        "iframe::width": 0,
        "img::align": 0,
        "img::alt": 0,
        "img::border": 0,
        "img::height": 0,
        "img::hspace": 0,
        "img::ismap": 0,
        "img::name": 7,
        "img::src": 1,
        "img::usemap": 11,
        "img::vspace": 0,
        "img::width": 0,
        "input::accept": 0,
        "input::accesskey": 0,
        "input::align": 0,
        "input::alt": 0,
        "input::autocomplete": 0,
        "input::checked": 0,
        "input::disabled": 0,
        "input::inputmode": 0,
        "input::ismap": 0,
        "input::list": 5,
        "input::max": 0,
        "input::maxlength": 0,
        "input::min": 0,
        "input::multiple": 0,
        "input::name": 8,
        "input::onblur": 2,
        "input::onchange": 2,
        "input::onfocus": 2,
        "input::onselect": 2,
        "input::pattern": 0,
        "input::placeholder": 0,
        "input::readonly": 0,
        "input::required": 0,
        "input::size": 0,
        "input::src": 1,
        "input::step": 0,
        "input::type": 0,
        "input::usemap": 11,
        "input::value": 0,
        "ins::cite": 1,
        "ins::datetime": 0,
        "label::accesskey": 0,
        "label::for": 5,
        "label::onblur": 2,
        "label::onfocus": 2,
        "legend::accesskey": 0,
        "legend::align": 0,
        "li::type": 0,
        "li::value": 0,
        "map::name": 7,
        "menu::compact": 0,
        "menu::label": 0,
        "menu::type": 0,
        "meter::high": 0,
        "meter::low": 0,
        "meter::max": 0,
        "meter::min": 0,
        "meter::value": 0,
        "ol::compact": 0,
        "ol::reversed": 0,
        "ol::start": 0,
        "ol::type": 0,
        "optgroup::disabled": 0,
        "optgroup::label": 0,
        "option::disabled": 0,
        "option::label": 0,
        "option::selected": 0,
        "option::value": 0,
        "output::for": 6,
        "output::name": 8,
        "p::align": 0,
        "pre::width": 0,
        "progress::max": 0,
        "progress::min": 0,
        "progress::value": 0,
        "q::cite": 1,
        "select::autocomplete": 0,
        "select::disabled": 0,
        "select::multiple": 0,
        "select::name": 8,
        "select::onblur": 2,
        "select::onchange": 2,
        "select::onfocus": 2,
        "select::required": 0,
        "select::size": 0,
        "source::type": 0,
        "table::align": 0,
        "table::bgcolor": 0,
        "table::border": 0,
        "table::cellpadding": 0,
        "table::cellspacing": 0,
        "table::frame": 0,
        "table::rules": 0,
        "table::summary": 0,
        "table::width": 0,
        "tbody::align": 0,
        "tbody::char": 0,
        "tbody::charoff": 0,
        "tbody::valign": 0,
        "td::abbr": 0,
        "td::align": 0,
        "td::axis": 0,
        "td::bgcolor": 0,
        "td::char": 0,
        "td::charoff": 0,
        "td::colspan": 0,
        "td::headers": 6,
        "td::height": 0,
        "td::nowrap": 0,
        "td::rowspan": 0,
        "td::scope": 0,
        "td::valign": 0,
        "td::width": 0,
        "textarea::accesskey": 0,
        "textarea::autocomplete": 0,
        "textarea::cols": 0,
        "textarea::disabled": 0,
        "textarea::inputmode": 0,
        "textarea::name": 8,
        "textarea::onblur": 2,
        "textarea::onchange": 2,
        "textarea::onfocus": 2,
        "textarea::onselect": 2,
        "textarea::placeholder": 0,
        "textarea::readonly": 0,
        "textarea::required": 0,
        "textarea::rows": 0,
        "textarea::wrap": 0,
        "tfoot::align": 0,
        "tfoot::char": 0,
        "tfoot::charoff": 0,
        "tfoot::valign": 0,
        "th::abbr": 0,
        "th::align": 0,
        "th::axis": 0,
        "th::bgcolor": 0,
        "th::char": 0,
        "th::charoff": 0,
        "th::colspan": 0,
        "th::headers": 6,
        "th::height": 0,
        "th::nowrap": 0,
        "th::rowspan": 0,
        "th::scope": 0,
        "th::valign": 0,
        "th::width": 0,
        "thead::align": 0,
        "thead::char": 0,
        "thead::charoff": 0,
        "thead::valign": 0,
        "tr::align": 0,
        "tr::bgcolor": 0,
        "tr::char": 0,
        "tr::charoff": 0,
        "tr::valign": 0,
        "track::default": 0,
        "track::kind": 0,
        "track::label": 0,
        "track::srclang": 0,
        "ul::compact": 0,
        "ul::type": 0,
        "video::controls": 0,
        "video::height": 0,
        "video::loop": 0,
        "video::mediagroup": 5,
        "video::muted": 0,
        "video::poster": 1,
        "video::preload": 0,
        "video::src": 1,
        "video::width": 0
    };
    $.ATTRIBS = $.m;
    $.c = {
        OPTIONAL_ENDTAG: 1,
        EMPTY: 2,
        CDATA: 4,
        RCDATA: 8,
        UNSAFE: 16,
        FOLDABLE: 32,
        SCRIPT: 64,
        STYLE: 128,
        VIRTUALIZED: 256
    };
    $.eflags = $.c;
    $.f = {
        a: 0,
        abbr: 0,
        acronym: 0,
        address: 0,
        applet: 272,
        area: 2,
        article: 0,
        aside: 0,
        audio: 0,
        b: 0,
        base: 274,
        basefont: 274,
        bdi: 0,
        bdo: 0,
        big: 0,
        blockquote: 0,
        body: 305,
        br: 2,
        button: 0,
        canvas: 0,
        caption: 0,
        center: 0,
        cite: 0,
        code: 0,
        col: 2,
        colgroup: 1,
        command: 2,
        data: 0,
        datalist: 0,
        dd: 1,
        del: 0,
        details: 0,
        dfn: 0,
        dialog: 272,
        dir: 0,
        div: 0,
        dl: 0,
        dt: 1,
        em: 0,
        fieldset: 0,
        figcaption: 0,
        figure: 0,
        font: 0,
        footer: 0,
        form: 0,
        frame: 274,
        frameset: 272,
        h1: 0,
        h2: 0,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0,
        head: 305,
        header: 0,
        hgroup: 0,
        hr: 2,
        html: 305,
        i: 0,
        iframe: 4,
        img: 2,
        input: 2,
        ins: 0,
        isindex: 274,
        kbd: 0,
        keygen: 274,
        label: 0,
        legend: 0,
        li: 1,
        link: 274,
        map: 0,
        mark: 0,
        menu: 0,
        meta: 274,
        meter: 0,
        nav: 0,
        nobr: 0,
        noembed: 276,
        noframes: 276,
        noscript: 276,
        object: 272,
        ol: 0,
        optgroup: 0,
        option: 1,
        output: 0,
        p: 1,
        param: 274,
        pre: 0,
        progress: 0,
        q: 0,
        s: 0,
        samp: 0,
        script: 84,
        section: 0,
        select: 0,
        small: 0,
        source: 2,
        span: 0,
        strike: 0,
        strong: 0,
        style: 148,
        sub: 0,
        summary: 0,
        sup: 0,
        table: 0,
        tbody: 1,
        td: 1,
        textarea: 8,
        tfoot: 1,
        th: 1,
        thead: 1,
        time: 0,
        title: 280,
        tr: 1,
        track: 2,
        tt: 0,
        u: 0,
        ul: 0,
        "var": 0,
        video: 0,
        wbr: 2
    };
    $.ELEMENTS = $.f;
    $.Q = {
        a: "HTMLAnchorElement",
        abbr: "HTMLElement",
        acronym: "HTMLElement",
        address: "HTMLElement",
        applet: "HTMLAppletElement",
        area: "HTMLAreaElement",
        article: "HTMLElement",
        aside: "HTMLElement",
        audio: "HTMLAudioElement",
        b: "HTMLElement",
        base: "HTMLBaseElement",
        basefont: "HTMLBaseFontElement",
        bdi: "HTMLElement",
        bdo: "HTMLElement",
        big: "HTMLElement",
        blockquote: "HTMLQuoteElement",
        body: "HTMLBodyElement",
        br: "HTMLBRElement",
        button: "HTMLButtonElement",
        canvas: "HTMLCanvasElement",
        caption: "HTMLTableCaptionElement",
        center: "HTMLElement",
        cite: "HTMLElement",
        code: "HTMLElement",
        col: "HTMLTableColElement",
        colgroup: "HTMLTableColElement",
        command: "HTMLCommandElement",
        data: "HTMLElement",
        datalist: "HTMLDataListElement",
        dd: "HTMLElement",
        del: "HTMLModElement",
        details: "HTMLDetailsElement",
        dfn: "HTMLElement",
        dialog: "HTMLDialogElement",
        dir: "HTMLDirectoryElement",
        div: "HTMLDivElement",
        dl: "HTMLDListElement",
        dt: "HTMLElement",
        em: "HTMLElement",
        fieldset: "HTMLFieldSetElement",
        figcaption: "HTMLElement",
        figure: "HTMLElement",
        font: "HTMLFontElement",
        footer: "HTMLElement",
        form: "HTMLFormElement",
        frame: "HTMLFrameElement",
        frameset: "HTMLFrameSetElement",
        h1: "HTMLHeadingElement",
        h2: "HTMLHeadingElement",
        h3: "HTMLHeadingElement",
        h4: "HTMLHeadingElement",
        h5: "HTMLHeadingElement",
        h6: "HTMLHeadingElement",
        head: "HTMLHeadElement",
        header: "HTMLElement",
        hgroup: "HTMLElement",
        hr: "HTMLHRElement",
        html: "HTMLHtmlElement",
        i: "HTMLElement",
        iframe: "HTMLIFrameElement",
        img: "HTMLImageElement",
        input: "HTMLInputElement",
        ins: "HTMLModElement",
        isindex: "HTMLUnknownElement",
        kbd: "HTMLElement",
        keygen: "HTMLKeygenElement",
        label: "HTMLLabelElement",
        legend: "HTMLLegendElement",
        li: "HTMLLIElement",
        link: "HTMLLinkElement",
        map: "HTMLMapElement",
        mark: "HTMLElement",
        menu: "HTMLMenuElement",
        meta: "HTMLMetaElement",
        meter: "HTMLMeterElement",
        nav: "HTMLElement",
        nobr: "HTMLElement",
        noembed: "HTMLElement",
        noframes: "HTMLElement",
        noscript: "HTMLElement",
        object: "HTMLObjectElement",
        ol: "HTMLOListElement",
        optgroup: "HTMLOptGroupElement",
        option: "HTMLOptionElement",
        output: "HTMLOutputElement",
        p: "HTMLParagraphElement",
        param: "HTMLParamElement",
        pre: "HTMLPreElement",
        progress: "HTMLProgressElement",
        q: "HTMLQuoteElement",
        s: "HTMLElement",
        samp: "HTMLElement",
        script: "HTMLScriptElement",
        section: "HTMLElement",
        select: "HTMLSelectElement",
        small: "HTMLElement",
        source: "HTMLSourceElement",
        span: "HTMLSpanElement",
        strike: "HTMLElement",
        strong: "HTMLElement",
        style: "HTMLStyleElement",
        sub: "HTMLElement",
        summary: "HTMLElement",
        sup: "HTMLElement",
        table: "HTMLTableElement",
        tbody: "HTMLTableSectionElement",
        td: "HTMLTableDataCellElement",
        textarea: "HTMLTextAreaElement",
        tfoot: "HTMLTableSectionElement",
        th: "HTMLTableHeaderCellElement",
        thead: "HTMLTableSectionElement",
        time: "HTMLTimeElement",
        title: "HTMLTitleElement",
        tr: "HTMLTableRowElement",
        track: "HTMLTrackElement",
        tt: "HTMLElement",
        u: "HTMLElement",
        ul: "HTMLUListElement",
        "var": "HTMLElement",
        video: "HTMLVideoElement",
        wbr: "HTMLElement"
    };
    $.ELEMENT_DOM_INTERFACES = $.Q;
    $.P = {NOT_LOADED: 0, SAME_DOCUMENT: 1, NEW_DOCUMENT: 2};
    $.ueffects = $.P;
    $.J = {
        "a::href": 2,
        "area::href": 2,
        "audio::src": 1,
        "blockquote::cite": 0,
        "command::icon": 1,
        "del::cite": 0,
        "form::action": 2,
        "img::src": 1,
        "input::src": 1,
        "ins::cite": 0,
        "q::cite": 0,
        "video::poster": 1,
        "video::src": 1
    };
    $.URIEFFECTS = $.J;
    $.M = {UNSANDBOXED: 2, SANDBOXED: 1, DATA: 0};
    $.ltypes = $.M;
    $.I = {
        "a::href": 2,
        "area::href": 2,
        "audio::src": 2,
        "blockquote::cite": 2,
        "command::icon": 1,
        "del::cite": 2,
        "form::action": 2,
        "img::src": 1,
        "input::src": 1,
        "ins::cite": 2,
        "q::cite": 2,
        "video::poster": 1,
        "video::src": 2
    };
    $.LOADERTYPES = $.I;
    "undefined" !== typeof window && (window.html4 = $);
    var ha = function (g) {
        function w(a) {
            if (i.hasOwnProperty(a)) return i[a];
            var b = a.match(q);
            return b ? String.fromCharCode(parseInt(b[1], 10)) : (b = a.match(B)) ? String.fromCharCode(parseInt(b[1], 16)) : r && F.test(a) ? (r.innerHTML = "&" + a + ";", b = r.textContent, i[a] = b) : "&" + a + ";"
        }

        function M(a, b) {
            return w(b)
        }

        function x(a) {
            return a.replace(j, M)
        }

        function E(a) {
            return ("" + a).replace(R, "&amp;").replace(P, "&lt;").replace(S, "&gt;").replace(D, "&#34;")
        }

        function e(a) {
            return a.replace(ia, "&amp;$1").replace(P, "&lt;").replace(S, "&gt;")
        }

        function v(b) {
            var d = {
                z: b.z || b.cdata,
                A: b.A || b.comment,
                B: b.B || b.endDoc,
                t: b.t || b.endTag,
                e: b.e || b.pcdata,
                F: b.F || b.rcdata,
                H: b.H || b.startDoc,
                w: b.w || b.startTag
            };
            return function (b, g) {
                var f;
                var H = /(<\/|<\!--|<[!?]|[&<>])/g;
                f = b + "";
                if (G) f = f.split(H); else {
                    for (var e = [], h = 0, j; (j = H.exec(f)) !== s;) e.push(f.substring(h, j.index)), e.push(j[0]), h = j.index + j[0].length;
                    e.push(f.substring(h));
                    f = e
                }
                a(d, f, 0, {r: C, C: C}, g)
            }
        }

        function b(b, d, g, f, t) {
            return function () {
                a(b, d, g, f, t)
            }
        }

        function a(a, d, p, e, t) {
            try {
                a.H && 0 == p && a.H(t);
                for (var h,
                         z, j, i = d.length; p < i;) {
                    var o = d[p++], l = d[p];
                    switch (o) {
                        case "&":
                            I.test(l) ? (a.e && a.e("&" + l, t, A, b(a, d, p, e, t)), p++) : a.e && a.e("&amp;", t, A, b(a, d, p, e, t));
                            break;
                        case "</":
                            if (h = /^([-\w:]+)[^\'\"]*/.exec(l)) if (h[0].length === l.length && ">" === d[p + 1]) p += 2, j = h[1].toLowerCase(), a.t && a.t(j, t, A, b(a, d, p, e, t)); else {
                                var m = d, q = p, r = a, u = t, v = A, y = e, w = f(m, q);
                                w ? (r.t && r.t(w.name, u, v, b(r, m, q, y, u)), p = w.next) : p = m.length
                            } else a.e && a.e("&lt;/", t, A, b(a, d, p, e, t));
                            break;
                        case "<":
                            if (h = /^([-\w:]+)\s*\/?/.exec(l)) if (h[0].length === l.length &&
                                ">" === d[p + 1]) {
                                p += 2;
                                j = h[1].toLowerCase();
                                a.w && a.w(j, [], t, A, b(a, d, p, e, t));
                                var B = g.f[j];
                                B & K && (p = k(d, {name: j, next: p, c: B}, a, t, A, e))
                            } else {
                                var m = d, q = a, r = t, u = A, v = e, x = f(m, p);
                                x ? (q.w && q.w(x.name, x.R, r, u, b(q, m, x.next, v, r)), p = x.c & K ? k(m, x, q, r, u, v) : x.next) : p = m.length
                            } else a.e && a.e("&lt;", t, A, b(a, d, p, e, t));
                            break;
                        case "<\!--":
                            if (!e.C) {
                                for (z = p + 1; z < i && !(">" === d[z] && /--$/.test(d[z - 1])); z++) ;
                                if (z < i) {
                                    if (a.A) {
                                        var D = d.slice(p, z).join("");
                                        a.A(D.substr(0, D.length - 2), t, A, b(a, d, z + 1, e, t))
                                    }
                                    p = z + 1
                                } else e.C = n
                            }
                            e.C && a.e && a.e("&lt;!--",
                                t, A, b(a, d, p, e, t));
                            break;
                        case "<!":
                            if (/^\w/.test(l)) {
                                if (!e.r) {
                                    for (z = p + 1; z < i && ">" !== d[z]; z++) ;
                                    z < i ? p = z + 1 : e.r = n
                                }
                                e.r && a.e && a.e("&lt;!", t, A, b(a, d, p, e, t))
                            } else a.e && a.e("&lt;!", t, A, b(a, d, p, e, t));
                            break;
                        case "<?":
                            if (!e.r) {
                                for (z = p + 1; z < i && ">" !== d[z]; z++) ;
                                z < i ? p = z + 1 : e.r = n
                            }
                            e.r && a.e && a.e("&lt;?", t, A, b(a, d, p, e, t));
                            break;
                        case ">":
                            a.e && a.e("&gt;", t, A, b(a, d, p, e, t));
                            break;
                        case "":
                            break;
                        default:
                            a.e && a.e(o, t, A, b(a, d, p, e, t))
                    }
                }
                a.B && a.B(t)
            } catch (E) {
                if (E !== A) throw E;
            }
        }

        function k(a, d, f, h, t, j) {
            var z = a.length;
            T.hasOwnProperty(d.name) ||
            (T[d.name] = RegExp("^" + d.name + "(?:[\\s\\/]|$)", "i"));
            for (var i = T[d.name], k = d.next, l = d.next + 1; l < z && !("</" === a[l - 1] && i.test(a[l])); l++) ;
            l < z && (l -= 1);
            z = a.slice(k, l).join("");
            if (d.c & g.c.CDATA) f.z && f.z(z, h, t, b(f, a, l, j, h)); else if (d.c & g.c.RCDATA) f.F && f.F(e(z), h, t, b(f, a, l, j, h)); else throw Error("bug");
            return l
        }

        function f(a, b) {
            var d = /^([-\w:]+)/.exec(a[b]), f = {};
            f.name = d[1].toLowerCase();
            f.c = g.f[f.name];
            for (var e = a[b].substr(d[0].length), h = b + 1, j = a.length; h < j && ">" !== a[h]; h++) e += a[h];
            if (!(j <= h)) {
                for (var l = []; "" !==
                e;) if (d = ja.exec(e)) if (d[4] && !d[5] || d[6] && !d[7]) {
                    for (var d = d[4] || d[6], i = C, e = [e, a[h++]]; h < j; h++) {
                        if (i) {
                            if (">" === a[h]) break
                        } else 0 <= a[h].indexOf(d) && (i = n);
                        e.push(a[h])
                    }
                    if (j <= h) break;
                    e = e.join("")
                } else {
                    var i = d[1].toLowerCase(), k;
                    if (d[2]) {
                        k = d[3];
                        var m = k.charCodeAt(0);
                        if (34 === m || 39 === m) k = k.substr(1, k.length - 2);
                        k = x(k.replace(o, ""))
                    } else k = "";
                    l.push(i, k);
                    e = e.substr(d[0].length)
                } else e = e.replace(/^[\s\S][^a-z\s]*/, "");
                f.R = l;
                f.next = h + 1;
                return f
            }
        }

        function h(a) {
            function b(a, d) {
                f || d.push(a)
            }

            var d, f;
            return v({
                startDoc: function () {
                    d =
                        [];
                    f = C
                }, startTag: function (b, e, h) {
                    if (!f && g.f.hasOwnProperty(b)) {
                        var j = g.f[b];
                        if (!(j & g.c.FOLDABLE)) {
                            var k = a(b, e);
                            if (k) {
                                if ("object" !== typeof k) throw Error("tagPolicy did not return object (old API?)");
                                if ("attribs" in k) e = k.attribs; else throw Error("tagPolicy gave no attribs");
                                var i;
                                "tagName" in k ? (i = k.tagName, k = g.f[i]) : (i = b, k = j);
                                if (j & g.c.OPTIONAL_ENDTAG) {
                                    var l = d[d.length - 1];
                                    l && l.D === b && (l.v !== i || b !== i) && h.push("</", l.v, ">")
                                }
                                j & g.c.EMPTY || d.push({D: b, v: i});
                                h.push("<", i);
                                b = 0;
                                for (l = e.length; b < l; b += 2) {
                                    var m =
                                        e[b], o = e[b + 1];
                                    o !== s && o !== c && h.push(" ", m, '="', E(o), '"')
                                }
                                h.push(">");
                                j & g.c.EMPTY && !(k & g.c.EMPTY) && h.push("</", i, ">")
                            } else f = !(j & g.c.EMPTY)
                        }
                    }
                }, endTag: function (a, b) {
                    if (f) f = C; else if (g.f.hasOwnProperty(a)) {
                        var e = g.f[a];
                        if (!(e & (g.c.EMPTY | g.c.FOLDABLE))) {
                            if (e & g.c.OPTIONAL_ENDTAG) for (e = d.length; 0 <= --e;) {
                                var h = d[e].D;
                                if (h === a) break;
                                if (!(g.f[h] & g.c.OPTIONAL_ENDTAG)) return
                            } else for (e = d.length; 0 <= --e && d[e].D !== a;) ;
                            if (!(0 > e)) {
                                for (h = d.length; --h > e;) {
                                    var j = d[h].v;
                                    g.f[j] & g.c.OPTIONAL_ENDTAG || b.push("</", j, ">")
                                }
                                e <
                                d.length && (a = d[e].v);
                                d.length = e;
                                b.push("</", a, ">")
                            }
                        }
                    }
                }, pcdata: b, rcdata: b, cdata: b, endDoc: function (a) {
                    for (; d.length; d.length--) a.push("</", d[d.length - 1].v, ">")
                }
            })
        }

        function d(a, b, d, f, e) {
            if (!e) return s;
            try {
                var g = Y.parse("" + a);
                if (g && (!g.K() || ka.test(g.W()))) {
                    var h = e(g, b, d, f);
                    return h ? h.toString() : s
                }
            } catch (j) {
            }
            return s
        }

        function y(a, b, d, f, e) {
            d || a(b + " removed", {S: "removed", tagName: b});
            if (f !== e) {
                var g = "changed";
                f && !e ? g = "removed" : !f && e && (g = "added");
                a(b + "." + d + " " + g, {S: g, tagName: b, la: d, oldValue: f, newValue: e})
            }
        }

        function l(a, b, d) {
            b = b + "::" + d;
            if (a.hasOwnProperty(b)) return a[b];
            b = "*::" + d;
            if (a.hasOwnProperty(b)) return a[b]
        }

        function V(a, b, f, e, h) {
            for (var j = 0; j < b.length; j += 2) {
                var k = b[j], i = b[j + 1], m = i, o = s, q;
                if ((q = a + "::" + k, g.m.hasOwnProperty(q)) || (q = "*::" + k, g.m.hasOwnProperty(q))) o = g.m[q];
                if (o !== s) switch (o) {
                    case g.d.NONE:
                        break;
                    case g.d.SCRIPT:
                        i = s;
                        h && y(h, a, k, m, i);
                        break;
                    case g.d.STYLE:
                        if ("undefined" === typeof N) {
                            i = s;
                            h && y(h, a, k, m, i);
                            break
                        }
                        var r = [];
                        N(i, {
                            declaration: function (a, b) {
                                var e = a.toLowerCase();
                                u(e, b, f ? function (a) {
                                    return d(a,
                                        g.P.ja, g.M.ka, {TYPE: "CSS", CSS_PROP: e}, f)
                                } : s);
                                b.length && r.push(e + ": " + b.join(" "))
                            }
                        });
                        i = 0 < r.length ? r.join(" ; ") : s;
                        h && y(h, a, k, m, i);
                        break;
                    case g.d.ID:
                    case g.d.IDREF:
                    case g.d.IDREFS:
                    case g.d.GLOBAL_NAME:
                    case g.d.LOCAL_NAME:
                    case g.d.CLASSES:
                        i = e ? e(i) : i;
                        h && y(h, a, k, m, i);
                        break;
                    case g.d.URI:
                        i = d(i, l(g.J, a, k), l(g.I, a, k), {TYPE: "MARKUP", XML_ATTR: k, XML_TAG: a}, f);
                        h && y(h, a, k, m, i);
                        break;
                    case g.d.URI_FRAGMENT:
                        i && "#" === i.charAt(0) ? (i = i.substring(1), i = e ? e(i) : i, i !== s && i !== c && (i = "#" + i)) : i = s;
                        h && y(h, a, k, m, i);
                        break;
                    default:
                        i =
                            s, h && y(h, a, k, m, i)
                } else i = s, h && y(h, a, k, m, i);
                b[j + 1] = i
            }
            return b
        }

        function ea(a, b, d) {
            return function (e, f) {
                if (g.f[e] & g.c.UNSAFE) d && y(d, e, c, c, c); else return {attribs: V(e, f, a, b, d)}
            }
        }

        function Q(a, b) {
            var d = [];
            h(b)(a, d);
            return d.join("")
        }

        var N, u;
        "undefined" !== typeof window && (N = window.parseCssDeclarations, u = window.sanitizeCssProperty);
        var i = {lt: "<", LT: "<", gt: ">", GT: ">", amp: "&", AMP: "&", quot: '"', apos: "'", nbsp: "\u00a0"},
            q = /^#(\d+)$/, B = /^#x([0-9A-Fa-f]+)$/, F = /^[A-Za-z][A-za-z0-9]+$/, r = "undefined" !== typeof window &&
            window.document ? window.document.createElement("textarea") : s, o = /\0/g,
            j = /&(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/g, I = /^(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/, R = /&/g,
            ia = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/gi, P = /[<]/g, S = />/g, D = /\"/g,
            ja = /^\s*([-.:\w]+)(?:\s*(=)\s*((")[^"]*("|$)|(')[^']*('|$)|(?=[a-z][-\w]*\s*=)|[^"'\s]*))?/i,
            G = 3 === "a,b".split(/(,)/).length, K = g.c.CDATA | g.c.RCDATA, A = {}, T = {},
            ka = /^(?:https?|mailto|data)$/i, m = {};
        m.pa = m.escapeAttrib = E;
        m.ra = m.makeHtmlSanitizer = h;
        m.sa = m.makeSaxParser = v;
        m.ta = m.makeTagPolicy =
            ea;
        m.wa = m.normalizeRCData = e;
        m.xa = m.sanitize = function (a, b, d, e) {
            return Q(a, ea(b, d, e))
        };
        m.ya = m.sanitizeAttribs = V;
        m.za = m.sanitizeWithPolicy = Q;
        m.Ba = m.unescapeEntities = x;
        return m
    }($), la = ha.sanitize;
    "undefined" !== typeof window && (window.html = ha, window.html_sanitize = la);
})();