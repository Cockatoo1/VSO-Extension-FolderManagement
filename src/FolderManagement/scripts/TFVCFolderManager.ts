﻿//---------------------------------------------------------------------
// <copyright file="TFVCFolderManager.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// TypeScript class that creates a TFVC folder.
// </summary>
//---------------------------------------------------------------------

import Dialog = require("scripts/Dialog");
import FolderManager = require("scripts/FolderManager");
import RestClient = require("TFS/VersionControl/TfvcRestClient");
import VCContracts = require("TFS/VersionControl/Contracts");
import Q = require("q");

export class TFVCFolderManager extends FolderManager.FolderManager
    implements FolderManager.IFolderManager {

    constructor(actionContext) {
        super(actionContext);
    }

    public dialogCallback: (result: Dialog.IFormInput) => void = (result) => {
        var tfvcClient = RestClient.getClient();

        var path = this.actionContext.item.path + "/" + result.folderName;

        var data = {
            comment: result.comment,
            changes: [
                {
                    changeType: VCContracts.VersionControlChangeType.Add,
                    item: {
                        path: path + "/" + result.placeHolderFileName,
                        contentMetadata: { encoding: 65001 },
                    },
                    newContent: {
                        content: "Placeholder file for new folder",
                        contentType: VCContracts.ItemContentType.RawText
                    }
                }]
        };

        (<any>tfvcClient).createChangeset(data).then(
            () => {
                this.refreshBrowserWindow();
            });

    }

    public checkDuplicateFolder(folderName: string): IPromise<boolean> {
        var deferred = Q.defer<boolean>();

        var tfvcClient = RestClient.getClient();

        var path = this.actionContext.item.path + "/" + folderName;

        tfvcClient.getItems(undefined, path, VCContracts.VersionControlRecursionType.OneLevel,
            false, undefined).then((itemsMetaData) => {
                if (this.checkFolderExists(tfvcClient, path, itemsMetaData)) {
                    deferred.resolve(true);
                }
                else {
                    deferred.resolve(false);

                }
            });

        return deferred.promise;
    }

    private checkFolderExists(
        tfvcClient: RestClient.TfvcHttpClient2_1,
        path: string,
        itemsMetaData: VCContracts.TfvcItem[]) {
        for (var i = 0; i < itemsMetaData.length; i++) {
            var current = itemsMetaData[i];
            if (current.isFolder && current.path.indexOf(path) === 0) {
                return true;
            }
        }

        return false;
    }
}