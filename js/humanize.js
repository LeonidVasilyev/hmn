var originalEditorSelector = '#postingHtmlBox';
// TODO: Disable Compose, Bold etc. buttons
// TODO: Intercept image add
function humanizeHtmlEditor() {
    // Copy original post wrapper and put new editor there.
    $('.boxes').append('<div id="humanizedEditorWrapper" class="editor htmlBoxWrapper"></div>');

    var humanizedEditor = ace.edit('humanizedEditorWrapper');
    // TODO: Check and fix html-worker loading issue.
    humanizedEditor.getSession().setUseWorker(false);
    humanizedEditor.getSession().setMode('ace/mode/html');
    humanizedEditor.setTheme('ace/theme/monokai');
    humanizedEditor.getSession().setUseWrapMode(true);
    humanizedEditor.setFontSize(13);
    humanizedEditor.setShowPrintMargin(false);

    function updateHumanizedEditor() {
        var originalEditorValue = $(originalEditorSelector).val();
        var humanizedEditorValue = humanizedEditor.getValue();
        if (originalEditorValue.length > 0 && originalEditorValue !== humanizedEditorValue) {
            //originalEditorValue = vkbeautify.xml(originalEditorValue);
            humanizedEditor.setValue(originalEditorValue, 1);
        }
    }
    updateHumanizedEditor();

    humanizedEditor.on('change', function () {
        // Update original textarea value, which will be posted on post Update.
        var humanhumanizedEditorValue = humanizedEditor.getValue();
        $(originalEditorSelector).val(humanhumanizedEditorValue);
    });

    // Human editor preserved after post switch, so inject must be done only once.
    $(document).off('focus', originalEditorSelector, humanizeHtmlEditor);

    var originalEditorContainerSelector = 'div.GCUXF0KCL5'; 
    $(document).on('DOMSubtreeModified', originalEditorContainerSelector, updateHumanizedEditor);

    // Turn off unneeded stuff.
    $('button:contains("Compose")').hide();
    $('button:contains("HTML")').hide();
    $('#postingHtmlToolbar #bold').hide();
    $('#postingHtmlToolbar #italic').hide();
    $('#postingHtmlToolbar #strikeThrough').hide();
    $('#postingHtmlToolbar #link').hide();
    $('#postingHtmlToolbar #BLOCKQUOTE').hide();
    $('#postingHtmlToolbar .goog-toolbar-separator').hide();
}

// TODO: Instead of turn on editor on focus, turn it on as soon as possible. Maybe inject script at the beggining of the document
// which will set autofocus of original editors textarea.
// Two selector to 'on' work for textarea, which will be created in the future. 
$(document).on('focus', originalEditorSelector, humanizeHtmlEditor);
