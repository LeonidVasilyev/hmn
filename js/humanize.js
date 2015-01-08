(function () {
    var originalEditorSelector = '#postingHtmlBox';

    function switchToHtmlMode() {
        var composeModeButtonSelector = 'span.tabs button:first-of-type()';
        var composeModeIsOn = $(composeModeButtonSelector).attr('aria-selected') === 'true';
        if (composeModeIsOn) {
            var htmlModeButtonSelector = 'span.tabs button:last-of-type()';
            $(htmlModeButtonSelector).trigger('click');
        }
        // Turn off original editor mode switching.
        $('span.tabs').hide();
    }

    function createHumanizedEditor() {
        // Copy original post wrapper and put new editor there.
        // TODO: replace with .after().
        $('.boxes').append('<div id="humanizedEditorWrapper" class="editor htmlBoxWrapper"></div>');
        var humanizedEditor = ace.edit('humanizedEditorWrapper');
        return humanizedEditor;
    }

    function configureHumanizedEditor(humanizedEditor) {
        // TODO: Check and fix html-worker loading issue.
        humanizedEditor.getSession().setUseWorker(false);
        humanizedEditor.getSession().setMode('ace/mode/html');
        humanizedEditor.setTheme('ace/theme/monokai');
        humanizedEditor.getSession().setUseWrapMode(true);
        humanizedEditor.setFontSize(13);
        humanizedEditor.setShowPrintMargin(false);
        humanizedEditor.on('change', function () {
            // Update original textarea value, which will be posted on post Update.
            var humanhumanizedEditorValue = humanizedEditor.getValue();
            $(originalEditorSelector).val(humanhumanizedEditorValue);
        });
    }

    function updateHumanizedEditorValue(humanizedEditor) {
        var originalEditorValue = $(originalEditorSelector).val();
        var humanizedEditorValue = humanizedEditor.getValue();
        if (originalEditorValue.length > 0 && originalEditorValue !== humanizedEditorValue) {
            //originalEditorValue = vkbeautify.xml(originalEditorValue);
            humanizedEditor.setValue(originalEditorValue, 1);
        }
    }

    function humanizeHtmlEditor() {
        // TODO: Fix. Button attributes do not exist at this moment.
        // switchToHtmlMode();
        var humanizedEditor = createHumanizedEditor();
        configureHumanizedEditor(humanizedEditor);
        updateHumanizedEditorValue(humanizedEditor);

        var originalEditorObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // Posts switch.
                var originalEditorID = 'postingHtmlBox';
                if (mutation.target.id === originalEditorID &&
                        mutation.attributeName === 'disabled' &&
                        mutation.target.disabled === false) {
                    updateHumanizedEditorValue(humanizedEditor);
                }

                // Image insert.
                var imageUploadDialogBackgroundClass = 'modal-dialog-bg';
                if (mutation.target.className === imageUploadDialogBackgroundClass &&
                        mutation.target.nodeName === 'DIV' &&
                        mutation.attributeName === 'style' &&
                        mutation.target.style.display === 'none') {
                    console.log(mutation);
                    updateHumanizedEditorValue(humanizedEditor);
                }
            });

        });
        var configuration = { attributes: true, subtree: true };
        originalEditorObserver.observe(document.body, configuration);
    }

    var bloggerObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var originalEditorID = "postingHtmlBox";
            if (mutation.target.id === originalEditorID && mutation.attributeName === "disabled" && mutation.target.disabled === false) {
                // At this moment all data needed for humanized editor creation presented on the page.
                humanizeHtmlEditor();
                bloggerObserver.disconnect();
            }
        });
    });

    // TODO: Add attribute filter.
    var configuration = { attributes: true, subtree: true };
    bloggerObserver.observe(document.body, configuration);
})();