var HumanizedEditor = (function () {

    var humanizedEditor = {
        init: function () {
            var editor = create();
            configure(editor);
            update(editor);
            // Clear first undo stack element to prevent ctrl-z from return editor to it's default value and not initial post body value.
            clearUndoStack(editor);
            keepUpdated(editor);
        }
    };

    function create() {
        // Contains original html editor and original compose editor.
        var editorsContainer = $('.boxes');
        editorsContainer.append('<div id="humanizedEditorWrapper" class="editor htmlBoxWrapper"></div>');
        // Option holder style change a bit later than window resize or media queries applied.
        // It shrinks editor, which is not rerender text wrap after container div is resized.
        // So I add stretched to whole editors wrapper iframe and observe it's windows resize event to rerender editors text wrap. 
        var originalEditorHolder = $('.editorHolder');
        originalEditorHolder.append('<iframe id="holderResizeSignalFrame" width=100% height=100% style="position:absolute;z-index:-1"></iframe>');
        // Turn off mode switching.
        var modeToggle = $('span.tabs');
        modeToggle.hide();

        // Add identifiers to important interface elements using jQuery :contains() selector, so I can easily identify and call native events
        // on this elements later.
        var closeButton = $('button.blogg-button:contains(Close)');
        closeButton.attr('id', 'closeButton');
        var previewButton = $('button.blogg-button:contains(Preview)');
        previewButton.attr('id', 'previewButton');

        // Inject humanized editor.
        var humanizedEditor = ace.edit('humanizedEditorWrapper');
        humanizedEditor.focus();
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
        });
        humanizedEditor.commands.addCommand({
            name: 'beautifyPost',
            bindKey: { win: 'Ctrl-B' },
            exec: function () {
                var beautifiedValue = html_beautify(humanizedEditor.getValue());
                humanizedEditor.setValue(beautifiedValue, 1);
            },
        });
        humanizedEditor.commands.addCommand({
            name: 'closePost',
            bindKey: { win: 'Ctrl-Q' },
            exec: closePost,
        });
        humanizedEditor.commands.addCommand({
            name: 'previewPost',
            bindKey: { win: 'Ctrl-P' },
            exec: previewPost,
        });
        humanizedEditor.on('change', function () {
            // Update original textarea value, which will be posted on post Update.
            var humanizedEditorValue = humanizedEditor.getValue();
            var originalEditor = $('#postingHtmlBox');
            originalEditor.val(humanizedEditorValue);
        });
        humanizedEditor.on('blur', function () {
            updateOriginalEditorSelection(humanizedEditor);
        });

        var holderResizeSignalFrameWindow = $('#holderResizeSignalFrame')[0].contentWindow.window;
        holderResizeSignalFrameWindow.onresize = function () {
            humanizedEditor.resize(true);
        };
    }

    function update(humanizedEditor) {
        var originalEditor = $('#postingHtmlBox');
        var originalEditorValue = originalEditor.val();
        var humanizedEditorValue = humanizedEditor.getValue();
        if (originalEditorValue.length > 0 && originalEditorValue !== humanizedEditorValue) {
            // 1 - set cursor at the end of the text.
            humanizedEditor.setValue(originalEditorValue, 1);
        }
    }

    function keepUpdated(humanizedEditor) {
        var originalEditorObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // Posts switch.
                var originalEditorID = 'postingHtmlBox';
                if (mutation.target.id === originalEditorID &&
                        mutation.attributeName === 'disabled' &&
                        mutation.target.disabled === false) {
                    update(humanizedEditor);
                    // New post - new undo stack.
                    clearUndoStack(humanizedEditor);
                }

                // Image insert.
                var insertImageDialogBackgroundClass = 'modal-dialog-bg';
                if (mutation.target.className === insertImageDialogBackgroundClass &&
                        mutation.target.nodeName === 'DIV' &&
                        mutation.attributeName === 'style' &&
                        mutation.target.style.display === 'none') {
                    update(humanizedEditor);
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
        // get(0) because I need actual textarea behind original html editor to properly set selection.
        var originalEditor = $('#postingHtmlBox').get(0);
        originalEditor.setSelectionRange(start, end);
    }

    var UndoManager = require('ace/undomanager').UndoManager;
    function clearUndoStack(humanizedEditor) {
        humanizedEditor.getSession().setUndoManager(new UndoManager());
    }

    function insertImage() {
        var insertImageTrigger = document.getElementById('imageUpload');

        var mouseDown = new Event('mousedown', { "bubbles": true });
        var mouseUp = new Event('mouseup', { "bubbles": true });
        var mouseOut = new Event('mouseout', { "bubbles": true });

        insertImageTrigger.dispatchEvent(mouseDown);
        insertImageTrigger.dispatchEvent(mouseUp);
        insertImageTrigger.dispatchEvent(mouseOut);
    }

    // TODO: Change to .topHolder:nth-child()
    function closePost() {
        var closeButton = document.getElementById('closeButton');
        closeButton.click();
    }

    function previewPost() {
        var previewButton = document.getElementById('previewButton');
        previewButton.click();
    }

    function switchToLabels() {
        var labelsTrigger = $('.optionHolder a').get(1);
        labelsTrigger.click();
    }

    return humanizedEditor;
}());

var bloggerObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        // Because of the dynamic nature of Blogger website it is not easy to catch moment when everthing that I need is ready.
        // All if-conditions are oblique signs that certain event is occur.
        if ((mutation.target.id === 'postingHtmlBox' && mutation.attributeName === "disabled" && mutation.target.disabled === false)) {
            // Html mode is on by default and post is fully loaded.
            var humanizedEditor = Object.create(HumanizedEditor);
            humanizedEditor.init();
            bloggerObserver.disconnect();
        } else if (mutation.target.className === 'state composeMode') {
            // Turns out that compose mode is on by default.
            // Switch to html mode.
            var htmlModeToggle = $('span.tabs button:last-of-type()');
            htmlModeToggle.trigger('click');
            // Now I need to wait until blogger loads html version of a post.
            bloggerObserver.disconnect();
            bloggerObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.target.id === 'blogger-app' && mutation.target.nodeName === 'BODY' && mutation.type === 'childList' && mutation.removedNodes.length === 1 && mutation.removedNodes[0].className === 'gwt-PopupPanel') {
                        // Html version of post is fully loaded.
                        var humanizedEditor = Object.create(HumanizedEditor);
                        humanizedEditor.init();
                        bloggerObserver.disconnect();
                    }
                });
            });
            var configuration = { subtree: true, childList: true };
            bloggerObserver.observe(document.body, configuration);
        }
    });
});

// TODO: Add attribute filter.
var configuration = { attributes: true, subtree: true };
bloggerObserver.observe(document.body, configuration);
