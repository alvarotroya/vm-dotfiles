this.getView().setModel(new JSONModel({
				"items": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"]
			}), "filetypes");
and filetypes>selected as argument in UploadCollection (see UI5 Sample)

this.getView().setModel(new JSONModel({
				"maximumFilenameLength": 55,
				"maximumFileSize": 1000,
				"mode": MobileLibrary.ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": true,
				"enableDelete": true,
				"visibleEdit": true,
				"visibleDelete": true,
			}), "attachmentSettings");
/****************************************************************************************************
  * EVENT HANDLER ATTACHMENT CONTROL: UploadCollection
  * Tasks:
  * *** Listener callbacks
  * *** Execution of rules
  * *** Fire Change Events
  ****************************************************************************************************/

 sap.extent.uilib.util.EditFormGenerator.prototype._beforeUploadStarts = function(oEvent){
	 if(this._listenerImplementsFunction("getSubmitButton")){
		 this._oListener.getSubmitButton().setEnabled(false); //disable don button before attachment upload finish
	 }
 };

 sap.extent.uilib.util.EditFormGenerator.prototype._uploadComplete = function(oEvent){
	 var oInput = oEvent.getSource();

	 var aFiles = oEvent.getParameter("files");
	 var aResponseResult = aFiles && aFiles[0] && aFiles[0].responseRaw && aFiles[0].responseRaw.match(/{.*}/);

	 var oResponseResult = eval("(" + aResponseResult[0].replace(/&#34;/g, "'").replace(/&amp;/g, "&") + ")");

	 if (oResponseResult.success){
		 var oAttachtmentData = oInput.getAttachmentDataFromResponse(oResponseResult);

		 if(this._listenerImplementsFunction("cacheAttachmentsInfo")){
			 this._oListener.cacheAttachmentsInfo("upload", oAttachtmentData);
		 }

		 this._attachmentChanged(oEvent);
	 }
 };

 sap.extent.uilib.util.EditFormGenerator.prototype._fileDeleted = function(oEvent){
     var iAttachmentId = oEvent.getParameter("documentId");

     var bDeleteAttachment = this._getDeleteAttachment(oEvent.getSource(),iAttachmentId);
     if (this._listenerImplementsFunction("cacheAttachmentsInfo") && bDeleteAttachment){
		 this._oListener.cacheAttachmentsInfo("delete", iAttachmentId);
	 }

	 !oEvent.getSource().bIsDestroyed && this._attachmentChanged(oEvent);
 };

 sap.extent.uilib.util.EditFormGenerator.prototype._attachmentChanged = function(oEvent){
	 // call changeListener but not with property value, use aggreagtion "items"
	 // In the change listener happens lots of special logic for other controls like "updateBinding" which is not needed for UploadCollection.
	 // We could think about implementing a short clear changeListener for UploadCollection.
	 this._changeListener(oEvent, "items");
 };

 sap.extent.uilib.util.EditFormGenerator.prototype._getDeleteAttachment = function(oInput, attachmentId) {
     var sFieldId = sap.extent.uilib.util.EditFormGeneratorHelper.getFieldId(oInput);
     var sRowId = sap.extent.uilib.util.EditFormGeneratorHelper.getRowId(oInput);
     var sInitialValuePath = "/data/fields/" + sFieldId + "/initialValue/" + (sRowId ? sRowId : "0");
     var iInitialAttachmentId = oInput.getModel().getProperty(sInitialValuePath);
     var bExistingAttachment = iInitialAttachmentId && (iInitialAttachmentId.attachmentId == attachmentId);
     var bIsEffectiveDated = this._oForm && this._oForm.effectiveDated;
     var bDeleteAttachment = bIsEffectiveDated ? (bExistingAttachment ? false : true) : true;
     return bDeleteAttachment ;
 };

})();

