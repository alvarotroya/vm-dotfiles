
        _initAttachmentSettingsModel: function() {
          var oTimeAccountPayoutModel = this.getView().getModel(TIME_ACCOUNT_PAYOUT_MODEL);
          var oPayoutAttachmentConfig = this._getAttachmentCustomFieldConfigFromPayoutMetadata(
            oTimeAccountPayoutModel
          );
          this._setAttachmentSettingsModel(oPayoutAttachmentConfig);
        },




