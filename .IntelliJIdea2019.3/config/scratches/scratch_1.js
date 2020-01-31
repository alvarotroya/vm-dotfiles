//asynchronous call for metadata

if (oConfigModel.getServiceMetadata()) {
           			this._metadataLoaded();
           		} else {
           			oConfigModel.attachMetadataLoaded(this._metadataLoaded, this);
           		}

var oMetadata = oConfigModel.getServiceMetadata();

for (var i in oMetadata.dataServices.schema) {
if (oMetadata.dataServices.schema[i].namespace === "SFOData") {
var oSFODAtaSchema = oMetadata.dataServices.schema[i];
for (var j in oSFODAtaSchema.entityType) {
if (oSFODAtaSchema.entityType[j].name === sEntity) {
var oEntityMetadata = oSFODAtaSchema.entityType[j];
for (var k in oEntityMetadata.property) {
if (oEntityMetadata.property[k].name.indexOf(sAttributeName) !== -1) {
var sAttributeNameWithLocale = oEntityMetadata.property[k].name;
if(sAttributeNameWithLocale != undefined){
aAttributeNames.push(sAttributeNameWithLocale);
if (sNavigationName && sNavigationName.length > 0) {
sSelect = sSelect + ", " + sNavigationName + "/" + sAttributeNameWithLocale;
} else {
sSelect = sSelect + ", " + sAttributeNameWithLocale;
}
}
}
}
break;
}
}
break;
}
}
return sSelect;