var originalEditorSelector = '#postingHtmlBox';
// TODO: Disable Compose, Bold etc. buttons
// TODO: Intercept image add
function injectHumanEditor() {
    // Copy original post wrapper and put new editor there.
    $('.boxes').append('<div id="humanEditorWrapper" class="htmlBoxWrapper"></div>');

    var humanEditor = ace.edit('humanEditorWrapper');
    // TODO: Check and fix html-worker loading issue.
    humanEditor.getSession().setUseWorker(false);
    humanEditor.getSession().setMode('ace/mode/html');
    humanEditor.setTheme('ace/theme/monokai');
    humanEditor.getSession().setUseWrapMode(true);
    humanEditor.setShowPrintMargin(false);

    function updateHumanEditor() {
        var originalEditorValue = $(originalEditorSelector).val();
        var humanEditorValue = humanEditor.getValue();
        if (originalEditorValue.length > 0 && originalEditorValue !== humanEditorValue) {
            originalEditorValue = vkbeautify.xml(originalEditorValue);
            humanEditor.setValue(originalEditorValue);
        }
    }
    updateHumanEditor();

    humanEditor.on('change', function () {
        // Update original textarea value, which will be posted on post Update.
        var humanhumanEditorValue = humanEditor.getValue();
        $(originalEditorSelector).val(humanhumanEditorValue);
    });

    // Human editor preserved after post switch.
    $(document).off('focus', originalEditorSelector, injectHumanEditor);

    var originalEditorContainerSelector = 'div.GCUXF0KCL5'; 
    $(document).on('DOMSubtreeModified', originalEditorContainerSelector, updateHumanEditor);

    // Turn off unneeded stuff.
    $('button:contains("Compose")').hide();
    $('button:contains("HTML")').hide();
    // TODO: Turn on image add button.
    $('#postingHtmlToolbar').hide();
}

// TODO: Instead of turn on editor on focus, turn it on as soon as possible. Maybe inject script at the beggining of the document
// which will set autofocus of original editors textarea.
// Two selector to 'on' work for textarea, which will be created in the future. 
$(document).on('focus', originalEditorSelector, injectHumanEditor);
