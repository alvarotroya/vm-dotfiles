jQuery.sap.require("sap.m.UploadCollectionParameter");
jQuery.sap.require("sap.m.Dialog");
jQuery.sap.require("sap.ui.model.json.JSONModel");
jQuery.sap.require("servicecenter.controller.C4CHelper");
jQuery.sap.require("servicecenter.controller.constants");
jQuery.sap.require("sap.m.routing.Router");
jQuery.sap.require("servicecenter.controller.NavigationManager");
var sbinaryResult; // This is a global variable to store the binary value of the attachment
var sUploadedFile; // This is a global variable to store the file name of the attachment
var count = 0;
var C4CinternalId;
var defaultPriority; // Variable to get the default value of priority ie "Normal"
var defaultPriorityKey;
var serviceResultsArray = []; //Array to store the valid service category results
var incidentResultsArray = []; //Array to store all the incident category results
var validIncidentArray = []; //Array to store the incident category results corresponding to the selected service category

var fileMap = new Map();

sap.ui.controller("servicecenter.controller.CreateTicket", {
	onInit: function() {
		// Code to get i18n values
		var oComponent = this.getOwnerComponent();
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._oConfigBundle = oComponent.getModel("config").getResourceBundle();

		this._oView = this.getView();
		this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oRouter = this._oComponent.getRouter();

		// This is an empty json Object for storing user's inputs while creating the ticket for the current session
		var odata = {
			"items": []
		};
		// This is a global variable (JSON) to store the details of the attachment
		this.uploadJSONAttachment = {
			"details": []
		};

		C4CinternalId = c4cInternaID;
		// create JSON model instance
		var oModel = new sap.ui.model.json.JSONModel();
		// set the data for the model
		oModel.setData(odata);
		// set the model to the core
		this.getView().setModel(oModel);

		// Sets the text to the attachment label (initially 0)
		this.getView().byId("UploadCollection").addEventDelegate({
			onBeforeRendering: function() {
				this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
			}.bind(this)
		});

		//Dirty check before reloading/ closing the browser window
		var that = this;
		window.onbeforeunload = function() {
			var bInputResult = that.checkInputCancel();
			if (bInputResult) {
				return that._oResourceBundle.getText("ECT_SERVICECENTER_DATA_LOST_DIALOG");
			} else {
				return null;
			}
		};

		// Main destination url
		var uri = C4CURI;

		var oDataModel = new sap.ui.model.odata.ODataModel(uri);

		// Code for fetching the valid parentId aka ObjectID which can be used to pupulate Service dropdown values
		var parentId = 0;
		oDataModel.read("ServiceIssueCategoryCatalogueCollection?$filter=LifeCycleStatusCode eq '2'", null, null, false, function(oData,
			oResponse) {
			var currentDateTime = new Date().getTime(); //Getting the current date time
			//get the valid parentId by checking the date time
			for (var i = 0; i < oData.results.length; i++) {
				var startDateTime = new Date(oData.results[i].StartDateTime).getTime();
				var endDateTime = new Date(oData.results[i].EndDateTime).getTime();
				if ((startDateTime < currentDateTime) && (endDateTime > currentDateTime)) {
					parentId = oData.results[i].ObjectID;
					break;
				}
			}
		});

		//Code to store all the valid service and incident categories corresponding to the valid parentID
		oDataModel.read(
			"ServiceIssueCategoryCatalogueCategoryCollection?$filter=(TypeCode eq '1' or TypeCode eq '2') and ParentObjectID eq %27" +
			parentId + "%27", null, null, false,
			function(oData, oResponse) {

				var result = oData.results;

				for (var i = 0; i < result.length; i++) {
					switch (result[i].TypeCode) {
						case "1": //Store the valid service categories
							serviceResultsArray.push({
								"Name": result[i].Name.content,
								"ServiceIssueCategoryID": result[i].ServiceIssueCategoryID,
								"TypeCode": "1",
								"UUID": result[i].UUID,
								"ParentCategoryUUID": result[i].ParentCategoryUUID
							});
							break;

						case "2": //Store the valid incident categories
							incidentResultsArray.push({
								"Name": result[i].Name.content,
								"ServiceIssueCategoryID": result[i].ServiceIssueCategoryID,
								"TypeCode": "2",
								"UUID": result[i].UUID,
								"ParentCategoryUUID": result[i].ParentCategoryUUID
							});
							break;
					}
				}
			});

		// Set the Service dropdown values by calling the default function populateCategoryDropdown
		this.populateCategoryDropdown(serviceResultsArray, "serviceDropdown");

		//Code to set the default priority to Normal when the page is loaded
		var setPriorityNormal = this.getView().byId("priorityDropdown");
		oDataModel.read("ServiceRequestServicePriorityCodeCollection", null, null, true, function(oData, oResponse) {
			for (var i = 0; i < oData.results.length; i++) {
				if (oData.results[i].Code === "3") { // Code 3 is normal priority
					setPriorityNormal.setValue(oData.results[i].Description);
					defaultPriority = oData.results[i].Description;
					defaultPriorityKey = oData.results[i].Code;
					break;
				}
			}
		});

		// Set the Priority dropdown values by calling the default function populateDropdown
		this.populateDropdown(uri + "ServiceRequestServicePriorityCodeCollection?$format=json", "priorityDropdown");
		// Registering create ticket controller in NavigationManager for making closeBusyIndicator() accessible to KnowledgeBase controller
		registerCreateTicketController(this);
	},

	// Hide the busy indicator after first rendering of the Page
	onAfterRendering: function() {
		sap.ui.core.BusyIndicator.hide();
	},

	// Function to hide the busy indicator (This function is called from KnowledgeBase controller and )
	closeBusyIndicator: function() {
		sap.ui.core.BusyIndicator.hide();
	},

	// Default Function to set the dropdown values when JSON parameter as JSON Data
	populateCategoryDropdown: function(dropdownData, viewId) {
		// Get the current view
		var dropdownView = this.getView().byId(viewId);
		// Define the JSON Model
		var dropdownJSONModel = new sap.ui.model.json.JSONModel();
		// set dropdown data
		dropdownJSONModel.setData(dropdownData);
		// set the current model
		dropdownView.setModel(dropdownJSONModel, viewId + "JSONModel");
	},

	// Default Function to set the dropdown values when JSON parameter as a url
	populateDropdown: function(dropdownURL, viewId) {
		// Get the current view
		var dropdownView = this.getView().byId(viewId);
		// Define the JSON Model
		var dropdownJSONModel = new sap.ui.model.json.JSONModel(dropdownURL);
		// set the current model
		dropdownView.setModel(dropdownJSONModel, viewId + "JSONModel");
	},

	//Function to check if any file upload is in progress
	checkFileUploadInProgress: function() {
		var oView = this.getView();
		var newLength = this.getView().byId("UploadCollection").aItems.length;
		if ((newLength != 0) && (this.getView().byId("UploadCollection").aItems["0"]._status == "uploading")) {
			oView.byId("BusyDialogNew").open();
			return true;
		}else{
			return false;
		}
	},

	// Function called after pressing confirm button
	confirmMessage: function() {
		var oView = this.getView();
		var that = this;
		//Check if any file upload is in progress
		if (this.checkFileUploadInProgress()) {
			return;
		}

		// First check if all the mandatory fields are filled
		var validationResult = this.checkInputConfirm();
		// If no filled, the show the error message box
		if (!validationResult) {
			sap.m.MessageBox.error(this._oResourceBundle.getText("ECT_SERVICECENTER_REQUIRED_FIELDS_ERROR"));
			return;
		}

		//////////////////check if file upload still

		// Main destination url
		var uri = C4CURI;
		var oModel = new sap.ui.model.odata.ODataModel(uri, {
			json: true,
			headers: {
				"Authorization": "Basic QWRtaW5pc3RyYXRpb24wMTpXZWxjb21lMQ==",
				"X-CSRF-Token": "fetch"
			},
			useBatch: false,
			refreshAfterChange: true
		});

		//Open the Busy dialog as soon as the confirm button pressed, provided all the mandatory fields are filled.
		var oBusyDialog = oView.byId("busyDialog");
		oBusyDialog.setVisible(true);
		oBusyDialog.open();

		var x_csrf_token = oModel.getSecurityToken();

		// set headers again with fetched csrf token
		oModel.setHeaders({
			"Accept": "application/json",
			"DataServiceVersion": "2.0",
			"X-CSRF-Token": x_csrf_token
		});
		// Set the uploaded files data to the attachment array
		this.setAttachmentJSONData();
		// Get the real-time input values entered by user
		var newInputService = oView.byId("serviceDropdown").getSelectedKey();
		var newInputIncident = oView.byId("incidentDropdown").getSelectedKey();
		var newInputSubject = oView.byId("odataServiceInput").getValue().trim();
		var newInputDescription = oView.byId("descriptionId").getValue().trim();
		var newInputPriority = oView.byId("priorityDropdown").getSelectedKey();

		//If no change is made to the priority field, set the default code ie "3" for normal
		if (newInputPriority === "") {
			newInputPriority = defaultPriorityKey;
		}

		//Store all create ticket related fields which are to be pushed to C4C
		var createTicketData = {
			"DataOriginTypeCode": "4",
			"Name": {
				"languageCode": ECT_SERVICECENTER_LANGUAGE_CODE,
				"content": newInputSubject
			},
			"ProcessingTypeCode": ECT_SERVICECENTER_PROCESSING_TYPE_CODE,
			"ReportedForPartyID": C4CinternalId,
			"ReporterPartyID": C4CinternalId,
			"ServicePriorityCode": newInputPriority,
			"ServiceRequestLifeCycleStatusCode": "1",
			"ServiceIssueCategoryID": newInputService,
			"IncidentServiceIssueCategoryID": newInputIncident,
			"ServiceRequestDescription": [{
				"Text": newInputDescription,
				"AuthorUUID": UUID,
				"TypeCode": "10004"
			}],
			"ServiceRequestAttachmentFolder": this.uploadJSONAttachment["details"]
		};
		// Create the ticket by making an oData call
		setTimeout(function() {
			oModel.create("ServiceRequestCollection", createTicketData, null, function() {
					sap.m.MessageToast.show(that._oResourceBundle.getText("ECT_SERVICECENTER_CREATE_TICKET_SUCCESS"), {
						duration: 2000
					});
					jQuery.sap.delayedCall(2300, this, function() {
						// Route to the 2nd tab in knowledge base screen ie "My tickets"
						this._oRouter.navTo("homePage");
						var ticketTabBar = getKnowledge().getView().byId("Iconbar");
						ticketTabBar.setSelectedKey("viewTicketKey");
						getKnowledge().onselectitem();
						loadTickets(C4CinternalId);

						oBusyDialog.close();
						oBusyDialog.setVisible(false);
						that.clearData();
					});
				},
				function() {
					sap.m.MessageBox.error(that._oResourceBundle.getText("ECT_SERVICECENTER_CREATE_TICKET_FAILED"));
					oBusyDialog.close();
					oBusyDialog.setVisible(false);
				});
		}, 10);
	},

	//Set the filename and its corresponding binary
	setAttachmentJSONData: function() {
		var length = this.uploadJSONAttachment.details.length;
		for (var i = 0; i < length; i++) {
			var fileName = this.uploadJSONAttachment.details[i].Name;
			this.uploadJSONAttachment.details[i].Binary = fileMap.get(fileName);
		}
	},

	//Default function for having numeric file size
	formatAttribute: function(sValue) {
		jQuery.sap.require("sap.ui.core.format.FileSizeFormat");
		if (jQuery.isNumeric(sValue)) {
			return sap.ui.core.format.FileSizeFormat.getInstance({
				binaryFilesize: false,
				maxFractionDigits: 1,
				maxIntegerDigits: 3
			}).format(sValue);
		} else {
			return sValue;
		}
	},

	//First function called before any file upload
	onChange: function(oEvent) {
		var oUploadCollection = oEvent.getSource();
		// Header Token
		var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
			name: "x-csrf-token",
			value: "securityTokenFromModel"
		});
		oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

		//store the file details to file variable
		var files = oEvent.getParameter("files");
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			this.convertFileToBinary(file);
		}
	},

	//Convert the file to Base64 format
	convertFileToBinary: function(file) {
		var that = this;
		if (file && window.FileReader) {
			var reader = new FileReader();
			reader.onload = function(evn) {
				var sbinaryString = evn.target.result; //Binary result including base64 prefix
				sbinaryResult = sbinaryString.split('base64,').pop();
				fileMap.set(file.name, sbinaryResult);
			};
			reader.readAsDataURL(file);
		}
	},

	//Get the ID of the file to be delted
	onFileDeleted: function(oEvent) {
		this.deleteItemById(oEvent.getParameter("documentId"));
	},

	//Delete the file from the aItems and uploadJSONAttachment array
	deleteItemById: function(sItemToDeleteId) {
		var that = this;
		var oData = this.getView().byId("UploadCollection").getModel().getData();

		var aItems = jQuery.extend(true, {}, oData).items;
		jQuery.each(aItems, function(index) {
			if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
				aItems.splice(index, 1);
				that.uploadJSONAttachment.details.splice(index, 1);
			}
		});
		this.getView().byId("UploadCollection").getModel().setData({
			"items": aItems
		});
		this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
	},

	//File name maximum length reached
	onFilenameLengthExceed: function(oEvent) {
		sap.m.MessageBox.information(this._oResourceBundle.getText("ECT_SERVICECENTER_MAX_FILENAME_LENGTH"));
	},

	//Called when rename button clicked
	onFileRenamed: function(oEvent) {
		var oData = this.getView().byId("UploadCollection").getModel().getData();
		var aItems = jQuery.extend(true, {}, oData).items;
		var that = this;
		var sDocumentId = oEvent.getParameter("documentId");
		var newFileName = oEvent.getParameter("fileName");

		var rg1 = /^[^\\/:\*\?"<>\|]+$/; // regex for checking forbidden characters \ / : * ? " < > |

		//Check if new file name types is valid or not
		if (!rg1.test(newFileName)) {
			sap.m.MessageBox.information(this._oResourceBundle.getText("ECT_SERVICECENTER_ALLOWED_FILE_NAME"));
			for (var index = 0; index < aItems.length; index++) {
				if (aItems[index] && aItems[index].documentId === sDocumentId) {
					var oldFileName = that.uploadJSONAttachment.details[index].Name;
					aItems[index].fileName = oldFileName;
					//update the file map: Replace old filename in file map with the new name
					that.updateFileMapForBinaryValue(oldFileName, aItems[index].fileName);
					this.getView().byId("UploadCollection").getModel().setData({
						"items": aItems
					});
					break;
				}
			}
		} else {
			jQuery.each(aItems, function(index) {
				if (aItems[index] && aItems[index].documentId === sDocumentId) {
					var counter = 1;
					var fileExtension;
					var fileNameWithoutExt;

					//Append the (#) to the file if the file with same filename already exists in the UI
					for (var i = 0; i < that.uploadJSONAttachment.details.length; i++) {
						if (that.uploadJSONAttachment.details.length != 0 && that.uploadJSONAttachment.details[i].Name == newFileName) {
							fileExtension = newFileName.substring(newFileName.lastIndexOf(".")); // file extension
							fileNameWithoutExt = newFileName.slice(0, newFileName.lastIndexOf(".")); // file name without extention
							// Keep repeating this loop till you get the latest (#).
							for (var j = 0; j < that.uploadJSONAttachment.details.length; j++) {
								if (aItems[j].fileName == (fileNameWithoutExt + " (" + counter + ")" + fileExtension)) {
									counter++;
									j = -1;
								}
							}
							newFileName = fileNameWithoutExt + " (" + counter + ")" + fileExtension;
							break;
						}
					}
					aItems[index].fileName = newFileName;
					var oldFileName = that.uploadJSONAttachment.details[index].Name;
					that.uploadJSONAttachment.details[index].Name = aItems[index].fileName;
					//update the file map: Replace old filename in file map with the new name
					that.updateFileMapForBinaryValue(oldFileName, aItems[index].fileName);
				}
			});
			this.getView().byId("UploadCollection").getModel().setData({
				"items": aItems
			});
		}
	},

	//update the file map: Replace old filename in file map with the new name and delete old name
	updateFileMapForBinaryValue: function(oldFileName, newFileName) {
		fileMap.set(newFileName, fileMap.get(oldFileName));
		fileMap.delete(oldFileName);
	},

	//maximum file size reached
	onFileSizeExceed: function(oEvent) {
		sap.m.MessageBox.information(this._oResourceBundle.getText("ECT_SERVICECENTER_MAX_FILE_SIZE"));
	},

	//File type not supported
	onTypeMissmatch: function(oEvent) {
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
		//sap.m.MessageBox.information(this._oResourceBundle.getText("ECT_SERVICECENTER_ALLOWED_FILE_TYPE"));
		sap.m.MessageBox.show(
			this._oResourceBundle.getText("ECT_SERVICECENTER_ALLOWED_FILE_TYPE"), {
				icon: sap.m.MessageBox.Icon.INFORMATION,
				title: "Information",
				defaultAction: sap.m.MessageBox.Action.OK,
				actions: sap.m.MessageBox.Action.OK,
				textDirection: sap.ui.core.TextDirection.LTR,
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				details: this._oResourceBundle.getText("ECT_SERVICECENTER_VALID_FILE_TYPES"),
				onClose: function(oAction) {
					/* do something */
				}
			}
		);
	},

	//Called after onBeforeUploadStarts
	onUploadComplete: function(oEvent) {
		var oData = this.getView().byId("UploadCollection")
			.getModel().getData();
		var aItems = jQuery.extend(true, {}, oData).items;
		var oItem = {};

		sUploadedFile = oEvent.getParameter("files")[0].fileName;

		// at the moment parameter fileName is not set in IE9
		if (!sUploadedFile) {
			var aUploadedFile = (oEvent.getParameters().getSource().getProperty("value")).split(/\" "/);
			sUploadedFile = aUploadedFile[0];
		}

		var counter = 1;
		var fileExtension;
		var fileNameWithoutExt;

		//Append the (#) to the file if the file with same filename already exists in the UI
		for (var i = 0; i < aItems.length; i++) {
			if (aItems.length != 0 && aItems[i].fileName == sUploadedFile) {
				fileExtension = sUploadedFile.substring(sUploadedFile.lastIndexOf(".")); // file extension
				fileNameWithoutExt = sUploadedFile.slice(0, sUploadedFile.lastIndexOf(".")); // file name without extention
				// Keep repeating this loop till you get the latest (#).
				for (var j = 0; j < aItems.length; j++) {
					if (aItems[j].fileName == (fileNameWithoutExt + " (" + counter + ")" + fileExtension)) {
						counter++;
						j = -1;
					}
				}
				sUploadedFile = fileNameWithoutExt + " (" + counter + ")" + fileExtension;
				break;
			}
		}

		var options = {
			year: "numeric",
			month: "short",
			day: "numeric"
		};
		//Append the following details to the file being uploaded
		oItem = {
			"documentId": jQuery.now().toString(), // generate
			// Id,
			"fileName": sUploadedFile,
			"mimeType": "",
			"thumbnailUrl": "",
			"url": "",
			"attributes": [{
				"title": "",
				"text": new Date(jQuery.now()).toLocaleDateString(ECT_SERVICECENTER_UPLOAD_DEFAULT_LOCALE, options)
			}, {
				"title": this._oResourceBundle.getText("ECT_SERVICECENTER_UPLOAD_TITLE"), // By
				"text": this._oResourceBundle.getText("ECT_SERVICECENTER_UPLOAD_TEXT") // you
			}]
		};

		//Set the EDIT and DELETE button to true for this file
		oItem.visibleEdit = true;
		oItem.visibleDelete = true;

		aItems.unshift(oItem);

		//Check if maximum file count reached
		if (aItems.length > 5) {
			sap.m.MessageBox.information(this._oResourceBundle.getText("ECT_SERVICECENTER_MAX_FILE_COUNT"));
			return;
		}

		//Set the attachment details in the UI (only on user locale)
		this.getView().byId("UploadCollection").getModel().setData({
			"items": aItems
		});

		// Sets the new text to the attachment label
		this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());

		//Append the file to the JSON array which is used to push the attachments to C4C when Submit button pressed
		this.uploadJSONAttachment['details'].unshift({
			"Name": sUploadedFile,
			"TypeCode": "10001",
			"Binary": sbinaryResult,
			"CategoryCode": "2"
		});

	},

	//Called after onChange and before onUploadComplete
	onBeforeUploadStarts: function(oEvent) {
		// Header Slug
		var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
			name: "slug",
			value: oEvent.getParameter("fileName")
		});
		oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
	},

	//delete the file being uploaded
	onUploadTerminated: function(oEvent) {
		// get parameter file name
		var sFileName = oEvent.getParameter("fileName");
		// get a header parameter (in case no parameter specified, the callback function getHeaderParameter returns all request headers)
		var oRequestHeaders = oEvent.getParameters().getHeaderParameter();

		var oView = this.getView();
		var oData = oView.byId("UploadCollection").getModel().getData();
		var aItems = jQuery.extend(true, {}, oData).items;
		//Delete the file being uploaded from both the arrays
		aItems.shift();
		this.uploadJSONAttachment.details.shift();

		oView.byId("UploadCollection").getModel().setData({
			"items": aItems
		});
		oView.byId("attachmentTitle").setText(this.getAttachmentTitleText());
	},

	//Get the Attachment title (Called everytime the file gets uploaded to increment the count)
	getAttachmentTitleText: function() {
		var aItems = this.getView().byId("UploadCollection").getItems();
		return this._oResourceBundle.getText("ECT_SERVICECENTER_UPLOAD_ATTACHMENTS") + " (" + aItems.length + ")";
	},

	//Warning dialog box, asking the user if he/she wants to leave the current view
	onApproveDialog: function() {
		var navtoLanding = this._oRouter;
		var that = this;
		var oView = this.getView();

		var dialog = new sap.m.Dialog({
			icon: "sap-icon://message-warning",
			title: this._oResourceBundle.getText("ECT_SERVICECENTER_PLEASE_CONSIDER"),
			type: 'Message',
			content: new sap.m.Text({
				text: this._oResourceBundle.getText("ECT_SERVICECENTER_DATA_LOST_DIALOG")
			}),
			beginButton: new sap.m.Button({
				text: this._oResourceBundle.getText("ECT_SERVICECENTER_LEAVE"),
				press: function() {
					//Clear the data if the leave is pressed and navigate to the KB screen
					that.clearData();
					navtoLanding.navTo("homePage");
					dialog.close();
				}
			}),
			endButton: new sap.m.Button({
				text: this._oResourceBundle.getText("ECT_SERVICECENTER_STAY"),
				press: function() {
					//Do nothing and stay on the current page
					dialog.close();
				}
			}),
			afterClose: function() {
				//destroy the contents of the dialog box
				dialog.destroy();
			}
		});
		//Open the dialog
		dialog.open();
	},

	//If a user has opted to leave the page, check and clear all the entries made by him
	clearData: function() {
		var that = this;
		var oView = this.getView();
		var setDefaultPriority = oView.byId("priorityDropdown");

		var aInputs = [
			oView.byId("serviceDropdown"),
			oView.byId("incidentDropdown"),
			oView.byId("descriptionId"),
			oView.byId("priorityDropdown"),
			oView.byId("odataServiceInput")
		];

		//Reset the error state (if any) to None
		for (var i = 0; i < aInputs.length; i++) {
			aInputs[i].setValue("");
			if (aInputs[i].getValueState() === sap.ui.core.ValueState.Error) {
				aInputs[i].setValueState(sap.ui.core.ValueState.None);
			}
		}
		//Also clear the data from both the attachment arrays and reset the Attachment title to Attachment(0)
		var oData = oView.byId("UploadCollection").getModel().getData();

		var aItems = jQuery.extend(true, {}, oData).items;
		aItems.length = 0;
		that.uploadJSONAttachment.details.length = 0;
		fileMap.clear();

		oView.byId("UploadCollection").getModel().setData({
			"items": aItems
		});
		oView.byId("attachmentTitle").setText(that.getAttachmentTitleText());
		//Clear the changes and set the default priority back to normal
		setDefaultPriority.setValue(defaultPriority);
	},

	//Called when cancel button pressed: Do a dirty check and perform onApproveDialog() or clearCancelValidations()
	cancelMessage: function() {
		var oView = this.getView();
		//Check if a file upload is in progress
		if (this.checkFileUploadInProgress()) {
			return;
		}

		var oBusyDialog = oView.byId("busyDialog");
		oBusyDialog.setVisible(true);
		oBusyDialog.open();

		var navToLanding = this._oRouter;
		var bInputResult = this.checkInputCancel();
		if (bInputResult) {
			this.onApproveDialog();
			oBusyDialog.close();
			oBusyDialog.setVisible(false);
		} else {
			this.clearCancelValidations();
			navToLanding.navTo("homePage");
			oBusyDialog.close();
			oBusyDialog.setVisible(false);
		}
	},

	//navigate to landing page, Knowledge base
	navToKnowledge: function() {
		var navToLanding = this._oRouter;
		//Check if a file upload is in progress
		if (this.checkFileUploadInProgress()) {
			return;
		}
		var binputResult = this.checkInputCancel();
		if (binputResult) {
			this.onApproveDialog();
		} else {
			navToLanding.navTo("homePage");
		}
	},

	populateIncidentDropdown: function(serviceKey) {
		var oView = this.getView();
		var newInputIncident = oView.byId("incidentDropdown");
		var serviceUUID;
		validIncidentArray = [];
		if (!newInputIncident.getValue()) {
			newInputIncident.setValue("");
		}
		if (newInputIncident.getValueState() === sap.ui.core.ValueState.Error) {
			newInputIncident.setValueState(sap.ui.core.ValueState.None);
		}

		for (var i = 0; i < serviceResultsArray.length; i++) {
			if (serviceResultsArray[i].ServiceIssueCategoryID === serviceKey) {
				serviceUUID = serviceResultsArray[i].UUID;
				break;
			}
		}
		for (var j = 0; j < incidentResultsArray.length; j++) {
			if (incidentResultsArray[j].ParentCategoryUUID === serviceUUID) {
				validIncidentArray.push(incidentResultsArray[j]);
			}
		}
		this.populateCategoryDropdown(validIncidentArray, "incidentDropdown");
		newInputIncident.setBusy(false);
	},

	checkInputCancel: function() {
		var that = this;
		var oView = this.getView();
		var aInputs = [
			oView.byId("serviceDropdown"),
			oView.byId("incidentDropdown"),
			oView.byId("descriptionId"),
			oView.byId("odataServiceInput")
		];
		var priorityValue = oView.byId("priorityDropdown").getValue();
		var oData = oView.byId("UploadCollection").getModel().getData();
		var aItems = jQuery.extend(true, {}, oData).items;

		// check that all fields are empty
		for (var i = 0; i < aInputs.length; i++) {
			if (aInputs[i].getValue() || (defaultPriority != priorityValue)) {
				return true;
			}
		}

		if (aItems.length && that.uploadJSONAttachment.details.length) {
			return true;
		}
	},

	checkInputConfirm: function() {
		var oView = this.getView();
		var aInputs = [
			oView.byId("serviceDropdown"),
			//		oView.byId("incidentDropdown"),
			oView.byId("priorityDropdown"),
			oView.byId("descriptionId"),
			oView.byId("odataServiceInput")
		];

		// make sure all fields are not empty
		jQuery.each(aInputs, function(i, oInput) {
			if (!oInput.getValue()) {
				oInput.setValueState(sap.ui.core.ValueState.Error);
			}
		});

		// check that all fields are ok
		for (var i = 0; i < aInputs.length; i++) {
			if (aInputs[i].getValueState() === sap.ui.core.ValueState.Error) {
				return false;
			}
		}
		return true;
	},

	clearCancelValidations: function() {
		var that = this;
		var oView = this.getView();

		var aInputs = [
			oView.byId("serviceDropdown"),
			oView.byId("incidentDropdown"),
			oView.byId("descriptionId"),
			oView.byId("priorityDropdown"),
			oView.byId("odataServiceInput")
		];

		for (var i = 0; i < aInputs.length; i++) {
			aInputs[i].setValueState(sap.ui.core.ValueState.None);
		}
	},

	///////////////////////////////////////////////////////////   VALIDATIONS ////////////////////////////////////////////////////////

	//Dynamic value changes for service dropdown
	selectionChangeService: function() {
		var oView = this.getView();
		var newInputService = oView.byId("serviceDropdown");
		var dropdownData = newInputService.getModel("serviceDropdownJSONModel").getData();
		var serviceValue = newInputService.getValue();
		var serviceKey = newInputService.getSelectedKey();
		var newInputIncident = oView.byId("incidentDropdown");

		console.log("selection");
		//If field empty, set error state
		if (serviceValue === "") {
			newInputService.setValueState(sap.ui.core.ValueState.Error);
			newInputService.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_SERVICE_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputService.setValueState(sap.ui.core.ValueState.None);
		}

		var flag = 0;
		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (serviceKey === dropdownData[index].ServiceIssueCategoryID) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputIncident.setEnabled(false);
			newInputService.setValueState(sap.ui.core.ValueState.Error);
			newInputService.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_SERVICE"));
		} else {
			newInputIncident.setBusy(true);
			newInputIncident.setEnabled(true);
			this.populateIncidentDropdown(serviceKey);
		}
	},

	//Static (onClick outside dropdown scope) value changes for service dropdown
	handleServiceChange: function() {
		var oView = this.getView();
		var newInputService = oView.byId("serviceDropdown");
		var dropdownData = newInputService.getModel("serviceDropdownJSONModel").getData();
		var serviceValue = newInputService.getValue().trim();
		var serviceKey = newInputService.getSelectedKey();

		console.log("change");
		//If field empty, set error state
		if (serviceValue === "") {
			newInputService.setValueState(sap.ui.core.ValueState.Error);
			newInputService.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_SERVICE_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputService.setValueState(sap.ui.core.ValueState.None);
		}
		//	this.populateIncidentDropdown(serviceUUID);

		var flag = 0;
		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (serviceKey === dropdownData[index].ServiceIssueCategoryID) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputService.setValueState(sap.ui.core.ValueState.Error);
			newInputService.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_SERVICE"));
		}
	},

	//Dynamic value changes for incident dropdown
	selectionChangeIncident: function() {
		var oView = this.getView();
		var newInputIncident = oView.byId("incidentDropdown");
		var dropdownData = newInputIncident.getModel("incidentDropdownJSONModel").getData();
		var incidentValue = newInputIncident.getValue();
		var incidentKey = newInputIncident.getSelectedKey();

		console.log("selection");
		//If field empty, set error state
		if (newInputIncident.getValue() === "") {
			newInputIncident.setValueState(sap.ui.core.ValueState.Error);
			newInputIncident.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INCIDENT_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputIncident.setValueState(sap.ui.core.ValueState.None);
		}

		var flag = 0;
		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (incidentValue === dropdownData[index].Name) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputIncident.setValueState(sap.ui.core.ValueState.Error);
			newInputIncident.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_INCIDENT"));
		}
	},

	//Static (onClick outside dropdown scope) value changes for incident dropdown
	handleIncidentChange: function() {
		var oView = this.getView();
		var newInputIncident = oView.byId("incidentDropdown");
		var dropdownData = newInputIncident.getModel("incidentDropdownJSONModel").getData();
		var incidentValue = newInputIncident.getValue().trim();
		var incidentKey = newInputIncident.getSelectedKey();

		console.log("change");
		//If field empty, set error state
		if (incidentValue === "") {
			newInputIncident.setValueState(sap.ui.core.ValueState.Error);
			newInputIncident.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INCIDENT_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputIncident.setValueState(sap.ui.core.ValueState.None);
		}

		var flag = 0;
		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (incidentValue === dropdownData[index].Name) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputIncident.setValueState(sap.ui.core.ValueState.Error);
			newInputIncident.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_INCIDENT"));
		}
	},

	//Function gets called each time a user enters/deletes a subject value
	handleOnLiveChangeSubject: function() {
		var newInputSubject = this.getView().byId("odataServiceInput");
		var currentSubjectLength = newInputSubject.getValue().length;
		var maxSubjectLength = newInputSubject.getMaxLength();

		//If field empty, set error state
		if (newInputSubject.getValue() === "") {
			newInputSubject.setValueState(sap.ui.core.ValueState.Error);
			newInputSubject.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_SUBJECT_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputSubject.setValueState(sap.ui.core.ValueState.None);
		}

		//Display warning states if a user types in the characters more than or equal to the maximum allowed limit
		if (currentSubjectLength >= maxSubjectLength) {
			newInputSubject.setValueState(sap.ui.core.ValueState.Warning);
			newInputSubject.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_MAX_SUBJECT_LIMIT"));
		}
	},

	//Called when you click outside the scope of the subject field
	handleSubjectChange: function() {
		var newInputSubject = this.getView().byId("odataServiceInput");

		//If field empty, set error state
		if (newInputSubject.getValue().trim() === "") {
			newInputSubject.setValueState(sap.ui.core.ValueState.Error);
			newInputSubject.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_SUBJECT_EMPTY_VALUE_STATE"));
		} else {
			newInputSubject.setValueState(sap.ui.core.ValueState.None);
		}
	},

	//Function gets called each time a user enters/deletes a description value
	handleOnLiveChangeDescription: function() {
		var newInputDescription = this.getView().byId("descriptionId");
		var currentDescriptionLength = newInputDescription.getValue().length;
		var maxDescriptionLength = newInputDescription.getMaxLength();

		//If field empty, set error state
		if (newInputDescription.getValue() === "") {
			newInputDescription.setValueState("Error");
			newInputDescription.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_DESCRIPTION_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputDescription.setValueState("None");
		}

		//Display warning states if a user types in the characters more than or equal to the maximum allowed limit
		if (currentDescriptionLength >= maxDescriptionLength) {
			newInputDescription.setValueState(sap.ui.core.ValueState.Warning);
			newInputDescription.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_MAX_DESCRIPTION_LIMIT"));
		}
	},

	//Called when you click outside the scope of the description field
	handleDescriptionChange: function() {
		var newInputDescription = this.getView().byId("descriptionId");

		//If field empty, set error state
		if (newInputDescription.getValue().trim() === "") {
			newInputDescription.setValueState("Error");
			newInputDescription.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_DESCRIPTION_EMPTY_VALUE_STATE"));
		} else {
			newInputDescription.setValueState("None");
		}
	},

	//Dynamic value changes for priority dropdown
	selectionChangePriority: function() {
		var newInputPriority = this.getView().byId("priorityDropdown");

		//If field empty, set error state
		if (newInputPriority.getValue() === "") {
			newInputPriority.setValueState(sap.ui.core.ValueState.Error);
			newInputPriority.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_PRIORITY_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputPriority.setValueState(sap.ui.core.ValueState.None);
		}

		var priorityKey = newInputPriority.getSelectedKey();
		var dropdownData = newInputPriority.getModel("priorityDropdownJSONModel").getData().d.results;
		var flag = 0;

		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (priorityKey === dropdownData[index].Code) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputPriority.setValueState(sap.ui.core.ValueState.Error);
			newInputPriority.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_PRIORITY"));
		}
	},

	//Static (onClick outside dropdown scope) value changes for priority dropdown
	handlePriorityChange: function() {
		var oView = this.getView();
		var newInputPriority = oView.byId("priorityDropdown");
		var priorityValue = newInputPriority.getValue().trim();
		var dropdownData = newInputPriority.getModel("priorityDropdownJSONModel").getData().d.results;
		var flag = 0;

		//If field empty, set error state
		if (newInputPriority.getValue().trim() === "") {
			newInputPriority.setValueState(sap.ui.core.ValueState.Error);
			newInputPriority.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_PRIORITY_EMPTY_VALUE_STATE"));
			return;
		} else {
			newInputPriority.setValueState(sap.ui.core.ValueState.None);
		}

		//Check invalid entry, if flag == 1, means the entry is valid
		for (var index = 0; index < dropdownData.length; index++) {
			if (priorityValue === dropdownData[index].Description) {
				flag = 1;
				break;
			}
		}
		if (flag !== 1) {
			newInputPriority.setValueState(sap.ui.core.ValueState.Error);
			newInputPriority.setValueStateText(this._oResourceBundle.getText("ECT_SERVICECENTER_INVALID_PRIORITY"));
		}
	}

	///////////////////////////////////////////////////////// END VALIDATIONS //////////////////////////////////////////////////////

});
