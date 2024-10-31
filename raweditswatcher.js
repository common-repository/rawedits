// raw-editor status
var rawEditActive = false;

jQuery(document).ready( function($) {
	// add Raw tab to WP content editor
	var tabRaw = '<a id="content-raw" class="wp-switch-editor switch-raw">Raw Content</a>';
	$('#wp-content-editor-tools').prepend(tabRaw);

	// add Raw content editor
	var toolButtons = '<input id="raw_fullscreen" type="button" value="fullscreen" title="Toggle fullscreen mode">';
	var toolRaw = '<div id="toolraw" class="raw-toolbar">'+toolButtons+'</div>';
	$('#wp-content-editor-container').append(toolRaw);
	var editorRaw = '<textarea id="contentraw" class="wp-editor-raw" name="contentraw" cols="40" style="resize:none;" aria-hidden="true"></textarea>';
	$('#wp-content-editor-container').append(editorRaw);

	// adjust height
	$('#contentraw').height($('#content').height() + 'px');

	// get content directly from database
	$.ajax({
		type: "post",
		url: ajaxurl,
		data: {
			action: 'get_raw_post',
			postid: raweditswatcher.postid
		},
		dataType: 'html',
		beforeSend: function(){},
		success: function(data){
			$('#contentraw').val(data);
		},
		error: function(xhr, ajaxOptions, thrownError){
			console.log(xhr.status);
			console.log(thrownError);
		},
		complete: function(){}
	});

	// add click to raw tab
	$('#wp-content-editor-tools').on('click', '#content-raw', function(e){
		e.preventDefault();
		rawEditActive = true;
		$('#wp-content-wrap').removeClass('tmce-active');
		$('#wp-content-wrap').removeClass('html-active');
		$('#wp-content-wrap').addClass('raw-active');
		$('#content_parent').hide();

		// update update/save button
		var btnTitle = $('#publish').val() + " Raw";
		$('#publish').hide();
		var btnRawAction = '<input id="rawpublish" class="button button-raw button-large" type="submit" value="'+btnTitle+'" name="save">';
		$('#publishing-action').append(btnRawAction);

		// update content if possible
		var tC = $('#content').val();
		var tR = $('#contentraw').val();
		if(tR.length == 0){
			$('#contentraw').val(tC);
		}

		// add raw draft action
		$('#save-action').on('click', '#save-post', function(e){
			e.preventDefault();
			savePost('draft');
		});
	});

	// add raw publish action
	$('#publishing-action').on('click', '#rawpublish', function(e){
		e.preventDefault();
		savePost('publish');
	});

	// add action to other tabs to disable raw editing
	$('#wp-content-editor-tools').on('click', '#content-html', function(e){
		disableRawEditor('html');
	});
	$('#wp-content-editor-tools').on('click', '#content-tmce', function(e){
		disableRawEditor('tmce');
	});

	// add action to content resize handle for raw area
	$('#content-resize-handle').on('mousedown', function(e){
		var textarea = $('#contentraw');
		var offset = textarea.height() - e.pageY;
		textarea.blur();

		function dragging(e){
			textarea.height( Math.max(50, offset + e.pageY) + 'px' );
			console.log(offset);
			return false;
		}

		function endDrag(e){
			textarea.focus();
			$(document).unbind('mousemove', dragging).unbind('mouseup', endDrag);
		}

		$(document).mousemove(dragging).mouseup(endDrag);
		return false;
	});

	function mergeSpaces(text) {
		return text.replace(/\s{2,}/g, ' ');
	}

	function trim(text) {
		return text.replace(/^\s+|\s+$/g,"");
	}

	// count words and capture tab
	$("#wp-content-editor-container").on('keydown change', '#contentraw', function(e){
		var text = $(this).val();
		text = trim(text);
		text = mergeSpaces(text);
		var wordCount = text.split(' ').length;
		$('#wp-word-count span').html(wordCount);
		// capture tab
		if(raweditswatcher){
			if(raweditswatcher.capturetype != 1){
				var keyCode = e.keyCode || e.which;
				if(keyCode == 9){
					e.preventDefault();
					var char = '';
					if(raweditswatcher.capturetype == 2){
						char = String.fromCharCode(9);
					} else if (raweditswatcher.capturetype == 3){
						char = Array(parseInt(raweditswatcher.spacesnum) + 1).join(' ');
					}
					insertAtCaret('contentraw', char);
				}
			}
		}
	});

	// fullscreen toolbar
	$('#toolraw').on('click', '#raw_fullscreen', function(e){
		$('#contentraw').fullScreen(true);
	});

	// in case it is default editor
	if(raweditswatcher){
		if(raweditswatcher.isdefault){
			if(raweditswatcher.isdefault == 1){
				$('#content-raw').trigger('click');
			}
		}
	}
});

function savePost(saveType)
{
	var contentRaw = jQuery('#contentraw').val();
	jQuery.ajax({
		type: "post",
		url: ajaxurl,
		data: {
			action: 'save_raw_post',
			postid: raweditswatcher.postid,
			content: contentRaw,
			edittype: raweditswatcher.edittype
		},
		dataType: 'html',
		beforeSend: function(){
			if(saveType == 'publish') {
				jQuery('#post').append('<input type="hidden" name="publish" value="Publish" />');
			} else {
				jQuery('#post').append('<input type="hidden" name="save" value="Save Draft" />');
			}
			jQuery('#rawpublish').attr('disabled', 'disabled');
			jQuery('#publishing-action span.spinner').show();
		},
		success: function(data){
			jQuery('#content').remove();
			window.onbeforeunload = null;
			jQuery('#post').trigger('submit');
		},
		error: function(xhr, ajaxOptions, thrownError){
			console.log(xhr.status);
			console.log(thrownError);
		},
		complete: function(){}
	});
}

function disableRawEditor(source)
{
	if(rawEditActive == true){
		rawEditActive = false;
		jQuery('#wp-content-wrap').removeClass('raw-active');
		jQuery('#rawpublish').remove();
		jQuery('#publish').show();
		jQuery('#save-action').off('click', '#save-post');
		switch(source){
			case 'html':
				jQuery('#wp-content-wrap').addClass('html-active');
				break;
			case 'tmce':
				jQuery('#content_parent').show();
				jQuery('#wp-content-wrap').addClass('tmce-active');
				break;
		}
	}
}

function insertAtCaret(areaId,text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
    	"ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") {
    	txtarea.focus();
    	var range = document.selection.createRange();
    	range.moveStart ('character', -txtarea.value.length);
    	strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") {
    	txtarea.focus();
    	var range = document.selection.createRange();
    	range.moveStart ('character', -txtarea.value.length);
    	range.moveStart ('character', strPos);
    	range.moveEnd ('character', 0);
    	range.select();
    }
    else if (br == "ff") {
    	txtarea.selectionStart = strPos;
    	txtarea.selectionEnd = strPos;
    	txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}