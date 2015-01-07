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

    // TODO: Intercept image add
    function humanizeHtmlEditor() {
        // TODO: Fix. Button attributes do not exist at this moment.
        // switchToHtmlMode();
        var humanizedEditor = createHumanizedEditor();
        configureHumanizedEditor(humanizedEditor);
        updateHumanizedEditorValue(humanizedEditor);

        var originalEditorContainerSelector = 'div.GCUXF0KCL5';
        // TODO: Replace with observer.
        $(document).on('DOMSubtreeModified', originalEditorContainerSelector, function () { updateHumanizedEditorValue(humanizedEditor) });
    }

    function isMutatedNodeContainsOriginalEditor(node) {
        return node.className === 'postsNew';
    }

    var bloggerObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0 && isMutatedNodeContainsOriginalEditor(mutation.addedNodes[0])) {
                // At this moment all data needed for humanized editor creation presented on the page.
                humanizeHtmlEditor();
                bloggerObserver.disconnect();
            }
        });
    });

    var configuration = { childList: true, subtree: true };
    bloggerObserver.observe(document.body, configuration);
})();