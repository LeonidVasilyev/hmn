var HumanizedEditor = (function () {

    var humanizedEditor = {
        init: function () {
            var editor = create();
            configure(editor);
            update(editor);
            onOriginalEditorValueChange(function () { update(editor); });
        }
    };

    var originalEditorSelector = '#postingHtmlBox';

    function create() {
        // Copy original post wrapper and put new editor there.
        // TODO: replace with .after().
        $('.boxes').append('<div id="humanizedEditorWrapper" class="editor htmlBoxWrapper"></div>');
        // Option holder style change a bit later than window resize or media queries applied.
        // It shrinks editor, which is not rerender text wrap after container div is resized.
        // So I add stretched to whole editors wrapper iframe and observe it's windows resize event to rerender editors text wrap. 
        $('.editorHolder').append('<iframe id="holderResizeSignalFrame" width=100% height=100% style="position:absolute;z-index:-1"></iframe>');
        // Turn off mode switching.
        var modeToggle = $('span.tabs');
        modeToggle.hide();

        var humanizedEditor = ace.edit('humanizedEditorWrapper');

        return humanizedEditor;
    }

    function configure(humanizedEditor) {
        // TODO: Check and fix html-worker loading issue.
        humanizedEditor.getSession().setUseWorker(false);
        humanizedEditor.getSession().setMode('ace/mode/html');
        humanizedEditor.setTheme('ace/theme/monokai');
        humanizedEditor.getSession().setUseWrapMode(true);
        humanizedEditor.setFontSize(13);
        humanizedEditor.setShowPrintMargin(false);
        humanizedEditor.commands.addCommand({
            name: 'insertImage',
            bindKey: { win: 'Ctrl-I' },
            exec: insertImage,
            readonly: false
        });
        humanizedEditor.on('change', function () {
            // Update original textarea value, which will be posted on post Update.
            var humanizedEditorValue = humanizedEditor.getValue();
            $(originalEditorSelector).val(humanizedEditorValue);
        });
        humanizedEditor.on('blur', function () {
            updateOriginalEditorSelection(humanizedEditor);
        });
        $('#holderResizeSignalFrame')[0].contentWindow.window.onresize = function () {
            humanizedEditor.resize(true);
        };
    }

    function update(humanizedEditor) {
        var originalEditorValue = $(originalEditorSelector).val();
        var humanizedEditorValue = humanizedEditor.getValue();
        if (originalEditorValue.length > 0 && originalEditorValue !== humanizedEditorValue) {
            //originalEditorValue = vkbeautify.xml(originalEditorValue);
            humanizedEditor.setValue(originalEditorValue, 1);
        }
    }

    function onOriginalEditorValueChange(callback) {
        var originalEditorObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // TODO: Fix. This won't work in case post body is empty and in case of new post in html mode.
                // Posts switch.
                var originalEditorID = 'postingHtmlBox';
                if (mutation.target.id === originalEditorID &&
                        mutation.attributeName === 'disabled' &&
                        mutation.target.disabled === false) {
                    callback();
                }

                // Image insert.
                var insertImageDialogBackgroundClass = 'modal-dialog-bg';
                if (mutation.target.className === insertImageDialogBackgroundClass &&
                        mutation.target.nodeName === 'DIV' &&
                        mutation.attributeName === 'style' &&
                        mutation.target.style.display === 'none') {
                    callback();
                }
            });

        });
        var configuration = { attributes: true, subtree: true };
        originalEditorObserver.observe(document.body, configuration);
    }

    function updateOriginalEditorSelection(humanizedEditor) {
        // Convert selection positions to start and end character indexes.
        var start = humanizedEditor.session.doc.positionToIndex(humanizedEditor.selection.getRange().start)
        var end = humanizedEditor.session.doc.positionToIndex(humanizedEditor.selection.getRange().end)
        $(originalEditorSelector).get(0).setSelectionRange(start, end);
    }

    function insertImage() {
        var insertImageTrigger = document.getElementById('imageUpload');

        var mouseDown = new Event('mousedown', { "bubbles": true });
        var mouseUp = new Event('mouseup', { "bubbles": true });

        insertImageTrigger.dispatchEvent(mouseDown);
        insertImageTrigger.dispatchEvent(mouseUp);
    }

    return humanizedEditor;
}());


var bloggerObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if ((mutation.target.id === 'postingHtmlBox' && mutation.attributeName === "disabled" && mutation.target.disabled === false)) {
            // At this moment all data needed for humanized editor creation presented on the page if html mode is on by default.
            var humanizedEditor = Object.create(HumanizedEditor);
            humanizedEditor.init();
            bloggerObserver.disconnect();
        } else if (mutation.target.className === 'state composeMode') {
            // Switch to html mode if compose mode is turned on by default.
            var htmlModeToggle = $('span.tabs button:last-of-type()');
            htmlModeToggle.trigger('click');
            // Now I need to wait until blogger loads html version of a post.
            bloggerObserver.disconnect();
            bloggerObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.target.id === 'blogger-app' && mutation.target.nodeName === 'BODY' && mutation.type === 'childList' && mutation.removedNodes.length === 1 && mutation.removedNodes[0].className === 'gwt-PopupPanel') {
                        // At this moment all data needed for humanized editor creation presented on the page if compose mode is on by default.
                        var humanizedEditor = Object.create(HumanizedEditor);
                        humanizedEditor.init();
                        bloggerObserver.disconnect();
                    }
                });
            });
            var configuration = { subtree: true, childList: true};
            bloggerObserver.observe(document.body, configuration);
        }
    });
});

// TODO: Add attribute filter.
var configuration = { attributes: true, subtree: true};
bloggerObserver.observe(document.body, configuration);
