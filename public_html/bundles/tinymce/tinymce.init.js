window.tinymce.dom.Event.domLoaded = true;
tinymce.baseURL = "/bundles/tinymce";
tinymce.suffix = ".min";
tinymce.init({
	selector : '.tinymce',
	theme: 'modern',
	language : 'ru',
	forced_root_block : '',
	document_base_url: "/",
	file_browser_callback : 'fileBrowserCallBack',
	plugins : "advlist anchor contextmenu directionality fullscreen image layer link lists media nonbreaking noneditable pagebreak paste preview responsivefilemanager save searchreplace table template textcolor visualblocks visualchars",
	extended_valid_elements: 'dd,dt',
	relative_urls : false,
	convert_urls : false,
	paste_use_dialog : false,
	height: '400',
	width: '100%',
	image_advtab: true,

	external_filemanager_path:window.prj_ref+"/bundles/filemanager/",
	filemanager_title:"Файловый менеджер" ,
	external_plugins: { "filemanager" : window.prj_ref+"/bundles/filemanager/plugin.min.js"},
	content_css: [
		'/bundles/public/css/app.css'
	]
});

function controlEditor(el, elementName) {
	if (el.checked)
		tinymce.execCommand('mceAddEditor', false, elementName);
	else
		tinymce.execCommand('mceRemoveEditor', false, elementName);
}