// TODO: Disable Compose, Bold etc. buttons
// TODO: Intercept image add
function injectHumanEditor() {
    // Copy original post wrapper and put new editor there.
    $('.boxes').append('<div id="htmlBoxWrapper" class="htmlBoxWrapper"></div>');

    var humanEditor = ace.edit('htmlBoxWrapper');
    // TODO: Check and fix html-worker loading issue.
    humanEditor.getSession().setUseWorker(false);
    humanEditor.getSession().setMode('ace/mode/html');
    humanEditor.setTheme('ace/theme/monokai');
    humanEditor.getSession().setUseWrapMode(true);
    humanEditor.setShowPrintMargin(false);

    var originalEditorValue = $("#postingHtmlBox:first-child()").val();
    if (originalEditorValue.length > 0) {
        originalEditorValue = vkbeautify.xml(originalEditorValue);
        humanEditor.setValue(originalEditorValue);
    }

    humanEditor.on('change', function () {
        // Update original textarea value, which will be posted on post Update.
        var humanhumanEditorValue = humanEditor.getValue();
        $('#postingHtmlBox:first-child()').val(humanhumanEditorValue);
    });

    $('body').off('focus', '#postingHtmlBox:first-child()', injectHumanEditor);

    // Turn off unneeded stuff.
    $('button:contains("Compose")').hide();
    $('button:contains("HTML")').hide();
    // TODO: Turn on image add button.
    $('#postingHtmlToolbar').hide();
}

// TODO: Instead of turn on editor on focus, turn it on as soon as possible. Maybe inject script at the beggining of the document
// which will set autofocus of original editors textarea.
// Two selector to 'on' work for textarea, which will be created in the future. 
// Almost everything on blogger editor page is created using JavaScript and XmlHttpRequests.
$('body').on('focus', '#postingHtmlBox:first-child()', injectHumanEditor);
