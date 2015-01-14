var HumanizedEditor = (function () {

    var humanizedEditor = {
        init: function () {
            // TODO: Fix. Button attributes do not exist at this moment.
            // setHtmlMode();
            var editor = create();
            configure(editor);
            update(editor);
            onOriginalEditorValueChange(function () { update(editor); });
        }
    };

    var originalEditorSelector = '#postingHtmlBox';

    function setHtmlMode() {
        var composeModeButtonSelector = 'span.tabs button:first-of-type()';
        var composeModeIsOn = $(composeModeButtonSelector).attr('aria-selected') === 'true';
        if (composeModeIsOn) {
            var htmlModeButtonSelector = 'span.tabs button:last-of-type()';
            $(htmlModeButtonSelector).trigger('click');
        }
        // Turn off original editor mode switching.
        $('span.tabs').hide();
    }

    function create() {
        // Copy original post wrapper and put new editor there.
        // TODO: replace with .after().
        $('.boxes').append('<div id="humanizedEditorWrapper" class="editor htmlBoxWrapper"></div>');
        // Option holder style change a bit later than window resize or media queries applied.
        // It shrinks editor, which is not rerender text wrap after container div is resized.
        // So I add stretched to whole editors wrapper iframe and observe it's windows resize event to rerender editors text wrap. 
        $('.editorHolder').append('<iframe id="holderResizeSignalFrame" width=100% height=100% style="position:absolute;z-index:-1"></iframe>');

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
                // Posts switch.
                var originalEditorID = 'postingHtmlBox';
                if (mutation.target.id === originalEditorID &&
                        mutation.attributeName === 'disabled' &&
                        mutation.target.disabled === false) {
                    callback();
                }

                // Image insert.
                var imageUploadDialogBackgroundClass = 'modal-dialog-bg';
                if (mutation.target.className === imageUploadDialogBackgroundClass &&
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

    return humanizedEditor;
}());


var bloggerObserver = new MutationObserver(function (mutations) {
    var originalEditorID = "postingHtmlBox";

    mutations.forEach(function (mutation) {
        if (mutation.target.id === originalEditorID && mutation.attributeName === "disabled" && mutation.target.disabled === false) {
            // At this moment all data needed for humanized editor creation presented on the page.
            var humanizedEditor = Object.create(HumanizedEditor);
            humanizedEditor.init();
            bloggerObserver.disconnect();
        }
    });
});

// TODO: Add attribute filter.
var configuration = { attributes: true, subtree: true };
bloggerObserver.observe(document.body, configuration);