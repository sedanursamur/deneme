var yetkiVarMi = false;
var uygunKlasorMu = false;
STBEbys.Webix.Dys = new Object();

STBEbys.Webix.Dys.GenerateGuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function OpenViewer(e, realId, name, documentId, type) {
    if (type == "folder") {

        Di_DYS_DokumanAction.GetDokumanListByFolderId(realId, function (ret) {
            if (ret && ret.length) {
                var documentList = new Array();
                for (var i = 0; i < ret.length; i++) {
                    if (STBEbys.Webix.SistemParametreleriObject.CevrilebilirDosyaTurleri.includes(ret[i].Ad.split('.').pop())) {
                        var obj = {
                            DokumanAdi: ret[i].Ad,
                            DokumanId: ret[i].DokumanId > 0 ? ret[i].DokumanId : null,
                            Extension: ret[i].Tip,
                            IsRuntimeConvert: true
                        };
                        documentList.push(obj);
                    }
                }
                if (documentList.length) {
                    PreviewDocument(documentList, false, true, true);
                }
                else
                    STBEbys.Webix.ShowWarning(currentLang.AnlikOnizlemeDocHataMsg);
            }
            else {
                STBEbys.Webix.ShowWarning(currentLang.AnlikOnizlemeDocHataMsg);
            }
        });
    }
    else {
        $$("fmanager").showMask();

        var documentList = new Array();
        var obj = {
            DokumanAdi: name,
            DokumanId: documentId && documentId > 0 ? documentId : null,
            Extension: type,
            IsRuntimeConvert: true
        };
        DokumanAction.GetGosterimKopyasiDokumanId(documentId.toString(), function (retVal) {
            if (retVal && obj) {
                obj.DokumanId = retVal;
                obj.IsRuntimeConvert = false;
                obj.IslemDurumu = STBEbys.Webix.DokumanIslemDurumu.Hazir;
                documentList.push(obj);
                PreviewDocument(documentList, false, true, true);
            }
            else {
                documentList.push(obj);
                PreviewDocument(documentList, false, true, true);
            }
            $$("fmanager").hideMask();
        });
    }
    return e.preventDefault();
}

STBEbys.Webix.Dys.MaskObj = {
    maskView: null,
    maskCounter: 0,
    showProgressBar: function () {
        this.maskCounter++;
        if (this.maskCounter == 1) {
            STBEbys.Webix.ShowProgressBar(this.maskView);
        }
    },
    hideProgressBar: function () {
        this.maskCounter--;
        if (this.maskCounter == 0) {
            this.maskView.hideProgressBar();
        }
    }
};

STBEbys.Webix.Dys.DoesUploadComplete = function (progressView, file, target, fileManager, anyErrorOccured, refreshFolderUsageInfo) {
    var isComplete = true;
    for (var i = 0; i < progressView.data.getRange().length; i++) {
        var width = document.getElementById("progress_" + progressView.data.getRange()[i].id).style.width;
        var tempName = progressView.data.getRange()[i].name;
        tempName = tempName.includes("/") ? tempName.substring(tempName.lastIndexOf("/") + 1) : tempName;
        if (tempName == file.name && file.status != "Iptal") {
            if (document.getElementById("isDuplicate_" + progressView.data.getRange()[i].id).innerHTML == 'true') {
                document.getElementById("progress_" + progressView.data.getRange()[i].id).style.width = "0%";
                document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML = 'Hata';
            }
            else {
                document.getElementById("progress_" + progressView.data.getRange()[i].id).style.width = "100%";
                document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML = currentLang.Tamamlandi;
            }

            document.getElementById("remove_file_" + progressView.data.getRange()[i].id).remove();
        }
        else if (tempName == file.name && file.status == "Iptal") {
            document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML = currentLang.Iptal;
        }
    }

    for (var i = 0; i < progressView.data.getRange().length; i++) {
        if (document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML != currentLang.Tamamlandi && document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML != currentLang.Iptal && document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML != 'Hata') {
            isComplete = false;
            break;
        }
        else
            isComplete = true;
    }

    if (isComplete) {
        var docArr = new Array();
        var isFolder = false;
        for (var i = 0; i < progressView.data.getRange().length; i++) {
            docArr.push(progressView.data.getRange()[i].name);

            if ((progressView.data.getRange()[i].name.match(new RegExp("/", "g")) || []).length > 0) {
                isFolder = true;
            }
        }

        function Refresh() {
            STBEbys.Webix.Dys.UploadProgressWindow.hide();
            STBEbys.Webix.Dys.UploadProgressWindow.define("height", 25);
            STBEbys.Webix.Dys.UploadProgressWindow.resize();

            $$("progressListId").data.clearAll();

            if (isFolder) {
                let uploadedFileName = docArr[0] // DocArr, içinde yüklenen dosyaların adını bulunduran bir dizidir. Yüklenen her elemanda klasor adı bulunduğu için herhangi bir elamanı bir değişkene aktarıyoruz
                const folderName = uploadedFileName.split("/")[0]  //  "/" den önce klasör adı bulunduğu için split fonksiyonu ile name verisini parçalayıp "/" den önceki kısmını alıyoruz.
                STBEbys.Webix.Dys.RefreshFileManagerData(target).then(function () {
                    const myFileBranch = fileManager.data.getBranch(target)

                    const uploadedFolders = myFileBranch.filter((file) => file.value == folderName);
                    if (uploadedFolders.length) {
                        fileManager.$$("table").select(uploadedFolders[0].id);
                        fileManager.$$("table").showItem(uploadedFolders[0].id);
                    }

                    fileManager.hideMask();

                });
            }
            else {
                STBEbys.Webix.Dys.RefreshFileManagerData(target).then(function () {
                    const myFileBranch = fileManager.data.getBranch(target)

                    const uploadedFiles = myFileBranch.filter((file1) => {
                        return docArr.some((file2) => {
                            return file2 === file1.value;
                        });
                    });
                    const uploadedFilesIds = uploadedFiles.map(f => f.id)
                    if (uploadedFilesIds.length) {
                        fileManager.$$("table").select(uploadedFilesIds[uploadedFilesIds.length - 1]);
                        fileManager.$$("table").showItem(uploadedFilesIds[uploadedFilesIds.length - 1]);
                    }
                    fileManager.hideMask();

                });
            }

            /*Refresh personal folder data*/
            if (!anyErrorOccured || (anyErrorOccured && refreshFolderUsageInfo)) {
                STBEbys.Webix.Dys.ShowOrHideFolderInfoControl(fileManager, target, refreshFolderUsageInfo, file.size);
            }
        }

        if (!anyErrorOccured) {
            /*Filemanager 1.kez refreshlendikten sonra getCurrentFolder değeri boş gelmektedir. Eğer boş gelirse getCursor() ile seçili klasör alınabilir. */
            var target = fileManager.getCurrentFolder() ? fileManager.getCurrentFolder() : fileManager.getCursor();
            STBEbys.Webix.Dys.ShowKVKKWindow(docArr, target, Refresh, null, null, false);
        }

        Refresh();
    }
}

STBEbys.Webix.Dys.ReadBlobFromFile = function (fileManager, file, opt_startByte, opt_stopByte, currentChunk, target, guid, currentSize) {
    if (file.size == 0) {
        STBEbys.Webix.Dys.UploadProgressWindow.hide();
        $$("progressListId").data.clearAll();
        fileManager.hideMask();
        STBEbys.Webix.ShowWarning(currentLang.DysDokumanBosUyari);
        return;
    }
    var interval = parseInt(ChunkSize);
    var start = parseInt(opt_startByte) || 0;
    var stop = parseInt(opt_stopByte) || file.size - 1;
    totalChunk = Math.ceil(file.size / interval);
    var reader = new FileReader();
    var progressView = $$("progressListId");
    for (var i = 0; i < progressView.data.getRange().length; i++) {

        var tempName = progressView.data.getRange()[i].name;
        tempName = tempName.includes("/") ? tempName.substring(tempName.lastIndexOf("/") + 1) : tempName;
        if (tempName == file.name) {
            var percent, status;
            if (currentChunk == totalChunk)
                percent = currentLang.Kaydediliyor;
            else
                percent = Math.ceil((currentChunk / totalChunk) * 100);

            if (progressView.data.getRange()[i].status == "Iptal") {
                status = currentLang.Iptal;
            }
            else if (percent > 0 && percent < 100) {
                status = percent + "%";
            }
            else if (percent == 0)
                status = "0px";
            else
                status = currentLang.Kaydediliyor;

            if (status != currentLang.Iptal) {
                file.status = status;
            }
            else {
                file.status = "Iptal";
            }

            if (status == currentLang.Iptal) {
                document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML = status;
            }
            else {
                document.getElementById("progress_" + progressView.data.getRange()[i].id).style.width = (status != currentLang.Kaydediliyor ? status : "100%");
                document.getElementById("message_" + progressView.data.getRange()[i].id).innerHTML = status;
            }
        }
    }

    reader.onload = function (evt) {
        if (evt.target.readyState == FileReader.DONE) {
            var myArray = evt.target.result;

            var xhr = new XMLHttpRequest;
            currentSize += myArray.byteLength;
            xhr.open("POST", EDASYSRootPath + "/IX/FileManagerHandlers/FmChunk.ashx?currentChunk=" + currentChunk + "&totalChunk=" + totalChunk + "&target=" + target + "&guid=" + encodeURIComponent(guid) + "&mimeType=" + file.type + "&totalSize=" + file.size + "&currentSize=" + currentSize, false);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.addEventListener("load", function (a, b, c) {
                if (a && a.target && a.target.response && JSON.isJson(a.target.response) && JSON.parse(a.target.response).State == 2) {
                    document.getElementById("isDuplicate_" + progressView.data.getRange()[i - 1].id).innerHTML = 'true';
                    var response = JSON.parse(a.target.response);
                    STBEbys.Webix.ShowWarning(response.Message);
                    STBEbys.Webix.Dys.DoesUploadComplete(progressView, file, target, fileManager, true, response.RefreshFolderUsageInfo);
                    return false;
                }
                else if (a && a.target && a.target.response && !JSON.isJson(a.target.response)) {
                    STBEbys.Webix.ShowWarning(currentLang.DokumanUploadError);
                    return false;
                }
                STBEbys.Webix.Dys.ReadBlobFromFile(fileManager, file, opt_startByte + interval, opt_stopByte + interval, currentChunk + 1, target, guid, currentSize);
            });
            xhr.addEventListener("error", function (a, b, c) {
                STBEbys.Webix.Dys.ReadBlobFromFile(fileManager, file, opt_startByte, opt_stopByte, currentChunk, target, guid, currentSize);
            });
            if (myArray && myArray.byteLength)
                xhr.send(myArray);
            else {
                STBEbys.Webix.Dys.ReadBlobFromFile(fileManager, file, opt_startByte, opt_stopByte, currentChunk, target, guid, currentSize);
            }
        }
    };

    reader.onerror = function (evt) {
        reader.readAsArrayBuffer(blob);
    };

    var blob = file.slice(opt_startByte, opt_stopByte);
    if (blob.size && file.status != "Iptal") {
        reader.readAsArrayBuffer(blob);
    }
    else {
        var isAnyErrorOccured = file.status == "Iptal" ? true : false;
        STBEbys.Webix.Dys.DoesUploadComplete(progressView, file, target, fileManager, isAnyErrorOccured, false);
    }
}

webix.type(webix.ui.list, {
    name: "progressUploader",
    height: 40,
    template: function (f, type) {
        var html = "<div class='overall'><div class='name'>" + f.name + "</div>";
        html += " <div class='remove_file' ><span id='remove_file_" + f.id + "' style='color:#AAA; cursor:pointer; margin-top:7px;' class='webix_icon fas fa-times fa-lg'></span></div>";
        html += "<div class='status'>";
        html += "<div class='progress " + f.status + "' id='progress_" + f.id + "' style='width:" + (f.status == 'transfer' || f.status == "server" ? f.percent + "%" : "0px") + "'></div>";
        html += "<div class='message " + f.status + "' id='message_" + f.id + "'>" + type.status(f) + "</div>";
        html += "</div>";
        html += "<div class='size'>" + f.sizetext + "</div></div>";
        html += "<div class='isDuplicate' id='isDuplicate_" + f.id + "' style='visibility: hidden'> 'false' </div>";
        return html;
    },
    status: function (f) {
        var messages = {
            server: currentLang.Tamamlandi,
            error: currentLang.HataMeydanaGeldi,
            client: currentLang.Hazir,
            transfer: f.percent != 100 ? f.percent + "%" : currentLang.Kaydediliyor
        };
        return messages[f.status];
    },
    on_click: {
        "remove_file": function (ev, id) {
            var progressView = $$("progressListId");
            if (progressView.data.getRange() && progressView.data.getRange().length && progressView.data.getItem(id)) {
                progressView.data.getItem(id).status = "Iptal";
            }
        }
    }
});

webix.type(webix.ui.tree, {
    name: "FileTree",
    css: "webix_fmanager_tree",
    dragTemplate: webix.template("#value#"),
    icon: function icon(obj) {
        var html = "";
        for (var i = 1; i < obj.$level; i++) {
            html += "<div class='webix_tree_none'></div>";
        }
        if (obj.webix_child_branch && !obj.$count) {
            html += "<div class='webix_tree_child_branch webix_fmanager_icon webix_tree_close'></div>";
        } else if (obj.$count > 0) {
            if (obj.open) html += "<div class='webix_fmanager_icon webix_tree_open'></div>"; else html += "<div class='webix_fmanager_icon webix_tree_close'></div>";
        } else html += "<div class='webix_tree_none'></div>";
        return html;
    },
    folder: function folder(obj) {
        if (obj.KokteMi) {
            return "<div class='webix_fmanager_icon fa-list-ul'></div>";
        }
        else if (obj.Di_DYS_ProjeId) {
            if (obj.ProjeKayitTipi == STBEbys.Webix.RecordType.UI) {
                return "<div class='webix_fmanager_icon fa-folder project_folder_icon UI' title='" + currentLang.Proje + "'></div>";
            }
            else if (obj.ProjeKayitTipi == STBEbys.Webix.RecordType.Integration) {
                return "<div class='webix_fmanager_icon fa-folder project_folder_icon Integration' title='" + currentLang.EntegrasyonIleGelenProje + "'></div>";
            }
        }
        else if (obj.realId == "personallikes") {
            return "<div class='webix_fmanager_icon fa-star custom_folder_icon'></div>";
        }
        else if (obj.realId == "shared") {
            return "<div class='webix_fmanager_icon fa-share-square custom_folder_icon'></div>";
        }

        else if (obj.$parent == DmsSettings.RootKlasorId.toString() && obj.KlasorTipi == 1) { // kişisel klasörü ise
            return "<div class='webix_fmanager_icon fa-user custom_folder_icon'></div>";
        }
        else if (obj.realId == DmsSettings.KurumsalKlasorId) {
            return "<div class='webix_fmanager_icon fa-folder custom_folder_icon'></div>";
        }
        else if (obj.$count && obj.open) {
            return "<div class='webix_fmanager_icon webix_folder_open'></div>";
        }
        return "<div class='webix_fmanager_icon webix_folder'></div>";
    }
});

STBEbys.Webix.Dys.FolderInfo = {
    view: "layout",
    type: "header",
    itemId: "dysFolderInfo",
    id: "dysFolderInfo",
    hidden: true,
    height: 40,
    cols: [
        {
            view: "label",
            itemId: "dysLblFolderInfo",
            width: 253,
            minWidth: 253
        },
        {
            view: "resizer",
            width: 3
        },
        {
            width: 15,
            minWidth: 15
        },
        {
            minWidth: 470,
            rows: [
                {
                    height: 10
                },
                {
                    view: "bullet",
                    itemId: "dysBulletFolderUsage",
                    minRange: 0,
                    maxRange: 100,
                    value: 0,
                    barWidth: 0,
                    width: 460,
                    labelHeight: 25,
                    borderless: true,
                    heigth: 25,
                    bands: [
                        { value: 100, color: "#b4e5fb" },
                        { value: 80, color: "#55c2f3" },
                        { value: 60, color: "#1997dc" },
                    ],
                    marker: 70,
                    stroke: 8,
                    scale: {
                        step: 10,
                        template: "#value#%"
                    }
                }
            ]
        },
        {
            width: 1,
            minWidth: 1
        },
        {
            view: "resizer",
            width: 3
        },
        {
            view: "label",
            itemId: "dysLblUsagePercent",
            minWidth: 230
        },
        {
            view: "resizer",
            width: 3
        },
        {
            view: "label",
            itemId: "dysLblUsedAreaInfo",
            minWidth: 230
        },
        {
            view: "resizer",
            width: 3
        },
        {
            view: "label",
            itemId: "dysLblFreeAreaInfo",
            minWidth: 230
        }
    ]
};


STBEbys.Webix.Dys.FileManager = {
    view: "STBEbys.Webix.FileManager",
    id: "fmanager",
    itemdId: "fManagerItemId",
    allowDownload: true,
    disabledHistory: true,
    _historyIgnore: true,
    autoWidth: true,
    ready: function () {
        var columns = [
            //{
            //    id: "customEdit",
            //    icon: "fm-edit",
            //    value: currentLang.Duzelt,
            //    method: "customEdit",
            //    batch: "item"
            //},
            {
                id: "customDelete",
                icon: "fm-delete",
                value: currentLang.Sil,
                method: "customDelete",
                batch: "item"
            },
            { $template: "Separator" },
            {
                id: "checkOut",
                icon: "fas fa-unlock",
                value: currentLang.CheckOut,
                method: "checkOut",
                batch: "file"
            },
            {
                id: "checkIn",
                icon: "fas fa-lock",
                value: currentLang.CheckIn,
                method: "checkIn",
                batch: "file"
            },
            {
                id: "undo",
                icon: "fas fa-unlock-alt",
                value: currentLang.CheckOutIptal,
                method: "undo",
                batch: "file"
            },
            { $template: "Separator" },
            {
                id: "publish",
                icon: "fa fa-check-square-o",
                value: currentLang.Publish,
                method: "publish",
                batch: "file"
            },
            {
                id: "addFavorites",
                icon: "fas fa-star",
                value: currentLang.SikKullanilanlaraEkle,
                method: "addFavorites",
                batch: "folder"
            },
            {
                id: "removeFavorites",
                icon: "fas fa-star-half-o",
                value: currentLang.SikKullanilanlardanCikart,
                method: "removeFavorites",
                batch: "folder"
            },
            {
                id: "showFolderPath",
                icon: "fas fa-eye",
                value: currentLang.KlasorYolunuGoster,
                method: "showFolderPath",
                batch: "folder"
            },
            {
                id: "showFilePath",
                icon: "fas fa-eye",
                value: currentLang.KlasorYolunuGoster,
                method: "showFilePath",
                batch: "file"
            },
            {
                id: "redirectFolderPath",
                icon: "fas fa-arrow-right",
                value: currentLang.KlasorKaynaginaYonlendir,
                method: "redirectFolderPath",
                batch: "folder"
            },
            {
                id: "redirectFilePath",
                icon: "fas fa-arrow-right",
                value: currentLang.DosyaKaynaginaYonlendir,
                method: "redirectFilePath",
                batch: "file"
            },
            {
                id: "searchFromFolder",
                icon: "fas fa-search-plus",
                value: currentLang.KlasordeAra,
                method: "searchFromFolder",
                batch: "folder"
            },
            {
                id: "convertProject",
                icon: "fas fa-share",
                value: currentLang.ProjeyeCevir,
                method: "convertProject",
                batch: "folder"
            },
            {
                id: "getProjects",
                icon: "fas fa-circle-o",
                value: currentLang.ProjeleriGoster,
                method: "getProjects",
                batch: "folder"
            },
            {
                id: "getActorOrganization",
                icon: "fas fa-sitemap",
                value: currentLang.Organizasyon,
                method: "getActorOrganization",
                batch: "folder"
            },
            {
                id: "showImages",
                icon: "fas fa-picture-o",
                value: currentLang.Album,
                method: "showImages",
                batch: "folder"
            },
            {
                id: "requestOpinionProcesses",
                icon: "fas fa-comment-o",
                value: currentLang.GorusIslemleri,
                batch: "item",
                submenu: [
                    {
                        id: "requestOpinion",
                        icon: "fas fa-comment-o",
                        value: currentLang.KullaniciRoleGorusBaslat,
                        trWidth: 250,
                        enWidth: 250,
                        method: "requestOpinion",
                        batch: "item"
                    },
                    {
                        id: "requestCollectiveOpinion",
                        icon: "fas fa-comments-o",
                        value: currentLang.GorusOrtakGorusGoreviBaslat,
                        trWidth: 250,
                        enWidth: 250,
                        method: "requestCollectiveOpinion",
                        batch: "item"
                    },
                    {
                        id: "showOpinionHistory",
                        icon: "fas fa-history",
                        value: currentLang.GorusGecmisi,
                        method: "showOpinionHistory",
                        batch: "item"
                    }
                ]
            },
            {
                id: "processFollowReports",
                icon: "fas fa-pie-chart",
                value: currentLang.SurecTakipRaporlari,
                batch: "folder",
                submenu: [
                    {
                        id: "opinionReport",
                        icon: "fas fa-area-chart",
                        value: currentLang.GorusRaporu,
                        method: "opinionReport",
                        batch: "folder"
                    },
                    {
                        id: "contractApproveReport",
                        icon: "fas fa-thumbs-o-up",
                        value: currentLang.SozlesmeOnayRaporu,
                        trWidth: 200,
                        enWidth: 220,
                        method: "contractApproveReport",
                        batch: "folder"
                    },
                    {
                        id: "contractArchiveReport",
                        icon: "fas fa-line-chart",
                        value: currentLang.SozlesmeArsivRaporu,
                        method: "contractArchiveReport",
                        trWidth: 200,
                        enWidth: 220,
                        batch: "folder"
                    }
                ]
            },
            {
                id: "archiveOperations",
                icon: "fas fa-file-text-o",
                itemId: "archiveOperations",
                autowidth: true,
                value: currentLang.ArsivlemeIslemleri,
                batch: "file",
                submenu: [
                    {
                        id: "createTaslakBelge",
                        icon: "fas fa-play",
                        value: currentLang.ArsivlemeIslemineDevamEt,
                        method: "createTaslakBelge",
                        trWidth: 220,
                        enWidth: 220,
                        batch: "file"
                    },
                    {
                        id: "deleteDysSablonIliski",
                        icon: "fas fa-times",
                        value: currentLang.ArsivlemeIsleminiIptalEt,
                        method: "deleteDysSablonIliski",
                        trWidth: 200,
                        enWidth: 250,
                        batch: "file"
                    },
                    {
                        id: "deleteDysSablonIliskiAndCreateNew",
                        icon: "fas fa-retweet",
                        value: currentLang.ArsivlemeIsleminiIptalEtveYeniDokumanTipiSec,
                        method: "deleteDysSablonIliskiAndCreateNew",
                        trWidth: 390,
                        enWidth: 200,
                        batch: "file"
                    }
                ]
            },
            {
                id: "createTaslakBelgeDokumansiz",
                icon: "fas fa-play",
                value: currentLang.ArsivlemeIsleminiBaslat,
                method: "createTaslakBelgeDokumansiz"
            },
            {
                id: "linkOperations",
                icon: "fas fa-link",
                value: currentLang.BaglantiIslemleri,
                batch: "item",
                submenu: [
                    {
                        id: "generateLink",
                        icon: "fas fa-ellipsis-h",
                        value: currentLang.LinkOlustur,
                        method: "generateLink",
                        batch: "item"
                    },
                    {
                        id: "generateLinkHistory",
                        icon: "fas fa-history",
                        value: currentLang.DiDriveHistory,
                        method: "generateLinkHistory",
                        trWidth: 250,
                        enWidth: 250,
                        batch: "item"
                    },
                    {
                        id: "createFastAccessLinkForFile",
                        icon: "fas fa-bolt",
                        value: currentLang.HizliErisimLinkiOlustur,
                        method: "createFastAccessLinkForFile",
                        batch: "file"
                    },
                    {
                        id: "createFastAccessLinkForFolder",
                        icon: "fas fa-bolt",
                        value: currentLang.HizliErisimLinkiOlustur,
                        method: "createFastAccessLinkForFolder",
                        batch: "folder"
                    }
                ]
            },
            {
                id: "otherOperations",
                icon: "fas fa-list-ol",
                value: currentLang.DigerIslemler,
                batch: "item",
                submenu: [
                    {
                        id: "dokumanTipi",
                        icon: "fas fa-book",
                        value: currentLang.DiDYSDokumanTipiLabel,
                        trWidth: 170,
                        enWidth: 170,
                        method: "dokumanTipi",
                        batch: "file"
                    },
                    {
                        id: "showMetadatas",
                        value: currentLang.DiDYSDokumanTipiUstverileri,
                        trWidth: 250,
                        enWidth: 250,
                        icon: "fas fa-file-text",
                        method: "showMetadatas",
                        batch: "file"
                    },
                    {
                        id: "versions",
                        icon: "fas fa-history",
                        value: currentLang.Versiyonlar,
                        method: "showVersions",
                        batch: "file"
                    },
                    {
                        id: "logInfo",
                        icon: "fas fa-unlink",
                        value: currentLang.LogBilgileri,
                        enWidth: 200,
                        method: "logInfo",
                        batch: "item"
                    },
                    {
                        id: "erisimHaklari",
                        icon: "fas fa-shield",
                        value: currentLang.ErisimHaklari,
                        method: "erisimHaklari",
                        batch: "item"

                    },
                    {
                        id: "changeKvkk",
                        value: currentLang.KvkkDurumu,
                        icon: "fas fa-gavel",
                        method: "changeKvkk",
                        batch: "file"
                    }
                ]
            },
            {
                id: "showTaslakInfos",
                icon: "fas fa-info-circle",
                value: currentLang.DokumanSurecGecmisi,
                method: "showTaslakInfos",
                batch: "file"
            },
            {
                id: "share",
                icon: "fas fa-share-alt",
                value: currentLang.Paylas,
                method: "share",
                batch: "item"
            },

            {
                id: "startWorkflow",
                icon: "fas fa-play",
                value: currentLang.SurecBaslat,
                method: "startWorkflow",
                batch: "item"
            },
            {
                id: "processHistory",
                icon: "fas fa-history",
                value: currentLang.SurecGecmisi,
                method: "processHistory",
                batch: "item"
            },
            {
                id: "sign",
                icon: "fas fa-pencil",
                value: currentLang.Imzala,
                method: "sign",
                batch: "file"
            },
            {
                id: "showSignHistory",
                icon: "fas fa-history",
                value: currentLang.DokumanImzaGecmisi,
                method: "showSignHistory",
                batch: "file"
            },
            {
                id: "defaultApprovers",
                icon: "fas fa-user-plus",
                value: currentLang.OnTanimliOnaycilar,
                method: "defaultApprovers",
                batch: "folder"
            },
            {
                id: "webScan",
                icon: "fas fa-print",
                value: currentLang.WebScan_Title,
                method: "webScan"
            }
        ];
        var actions = this.getMenu();
        var fileManager = this;
        fileManager.webDavExtensions = ['doc', 'excel', 'pp'];
        actions.remove("remove");
        this.ready();

        //config dosyasına göre(webconfig) ayarlanır.
        columns = STBEbys.Webix.Dys.CheckContextMenuConfig(columns);
        /*config*/
        var view = this;
        var search = view.$$("search");
        if (search) {
            debugger;
            function showSearchResultsMultipleColumns(value) {
                //arama değeri girildiğinde, verilen sorguya göre tablodan verileri filtreler. Eğer kullanıcının belirlediği bir arama işlemi gerçekleştirilirken bir hata meydana gelirse, "getSearchDataMultipleColumns" adlı fonksiyon verileri filtreleyerek geri döndürür.
                var id = view.getCursor();

                if (view.config.handlers.search) {
                    loadSearchData(this, this.config.handlers.search, id, value);
                } else {

                    var data = getSearchDataMultipleColumns(id, value);
                    parseSearchData(view, data);
                }
            }
            function getSearchDataMultipleColumns(id, value) {
                debugger;
                var found = [];
                view.data.each(function (obj) {
                    var text = view.config.templateName(obj);
                    var searchColumns = view.config.searchColumns;
                    if (text.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                        found.push(webix.copy(obj));
                    } else if (searchColumns) {
                        var control = false;
                        for (var i = 0; i < searchColumns.length; i++) {
                            text = obj[searchColumns[i]];
                            if (text != null && text.toString().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                                control = true;
                                break;
                            }
                        }
                        if (control)
                            found.push(webix.copy(obj));
                    }
                }, view, true, id);
                return found;
            }
            function parseSearchData(view, data) {
                //showSearchResultsMultipleColumns" fonksiyonu tarafından elde edilen filtrelenmiş verileri tabloda gösterir. Bu fonksiyon ayrıca, "onShowSearchResults" olayını tetikler.
                view.callEvent("onShowSearchResults", []);
                view.$searchResults = true;
                var cell = view.$$(view.config.mode);
                if (cell && cell.filter) {
                    cell.clearAll();
                    if (view.sortState && view.sortState.view == cell.config.id) data = sorting.sortData(view.sortState.sort, data);
                    cell.parse(data);
                }
            }
            function loadSearchData(view, url, id, value) {
                var params = { action: "search", source: id, text: value };
                if (view.callEvent("onBeforeSearchRequest", [id, params])) {
                    var callback = {
                        success: function success(text, response) {
                            view.hideProgress();
                            var data = view.data.driver.toObject(text, response);
                            parseSearchData(view, data);
                            view.$searchValue = value;
                        },
                        error: function error() {
                            view.hideProgress();
                        }
                    };
                    if (url.load) return url.load(null, callback, params);
                }
            }
            search.attachEvent("onTimedKeyPress", function () {
                if (this._code != 9) {
                    var value = search.getValue();
                    if (value) {
                        if (view.callEvent("onBeforeSearch", [value])) {
                            showSearchResultsMultipleColumns(value);
                            view.callEvent("onAfterSearch", [value]);
                        }
                    } else if (view.$searchResults) {
                        view.hideSearchResults();
                    }
                }
            });

        }


        for (var i = 0; i < columns.length; i++) {
            actions.add(columns[i]);
        }

        this.download = this.config.download;
        //this.customEdit = this.config.customEdit;//TTI'da webdav olmayacağı için commentlendi.
        this.customDelete = this.config.customDelete;
        this.erisimHaklari = this.config.erisimHaklari;
        this.checkIn = this.config.checkIn;
        this.startWorkflow = this.config.startWorkflow;
        this.processHistory = this.config.processHistory;
        this.openDysWorkflowHistory = this.config.openDysWorkflowHistory;
        this.checkOut = this.config.checkOut;
        this.undo = this.config.undo;
        this.publish = this.config.publish;
        this.dokumanTipi = this.config.dokumanTipi;
        this.showVersions = this.config.showVersions;
        this.searchFromFolder = this.config.searchFromFolder;
        this.convertProject = this.config.convertProject;
        this.requestOpinion = this.config.requestOpinion;
        this.requestCollectiveOpinion = this.config.requestCollectiveOpinion;
        this.showOpinionHistory = this.config.showOpinionHistory;
        this.getProjects = this.config.getProjects;
        this.getActorOrganization = this.config.getActorOrganization;
        this.showImages = this.config.showImages;
        this.createTaslakBelge = this.config.createTaslakBelge;
        this.createTaslakBelgeDokumansiz = this.config.createTaslakBelgeDokumansiz;
        this.showTaslakInfos = this.config.showTaslakInfos;
        this.deleteDysSablonIliski = this.config.deleteDysSablonIliski;
        this.deleteDysSablonIliskiAndCreateNew = this.config.deleteDysSablonIliskiAndCreateNew;
        this.logInfo = this.config.logInfo;
        this.share = this.config.share;
        this.generateLink = this.config.generateLink;
        this.createFastAccessLinkForFolder = this.config.createFastAccessLinkForFolder;
        this.createFastAccessLinkForFile = this.config.createFastAccessLinkForFile;
        this.changeKvkk = this.config.changeKvkk;
        this.showMetadatas = this.config.showMetadatas;
        this.sign = this.config.sign;
        this.showSignHistory = this.config.showSignHistory;
        this.opinionReport = this.config.opinionReport;
        this.contractApproveReport = this.config.contractApproveReport;
        this.contractArchiveReport = this.config.contractArchiveReport;
        this.generateLinkHistory = this.config.generateLinkHistory;
        this.defaultApprovers = this.config.defaultApprovers;
        this.addFavorites = this.config.addFavorites;
        this.removeFavorites = this.config.removeFavorites;
        this.showFolderPath = this.config.showFolderPath;
        this.showFilePath = this.config.showFilePath;
        this.redirectFolderPath = this.config.redirectFolderPath;
        this.redirectFilePath = this.config.redirectFilePath;
        this.webScan = this.config.webScan;
        var fileManager = this;
        var view = this;
        this.getUploader().attachEvent("onFileUpload", function (item) {
            fileManager.showMask();
        });

        this.getUploader().attachEvent("onUploadComplete", function (item) {
            if (item.State == 2 && item.Message) {
                webix.alert({
                    ok: currentLang.Tamam,
                    type: "alert-warning",
                    text: item.Message
                });
            }

            var folderId = fileManager.getCurrentFolder();
            STBEbys.Webix.Dys.RefreshFileManagerData(folderId).then(function () {
                $$("progressListId").clearAll();

                STBEbys.Webix.Dys.UploadProgressWindow.hide();
                STBEbys.Webix.Dys.UploadProgressWindow.define("height", 25);
                STBEbys.Webix.Dys.UploadProgressWindow.resize();
                fileManager.hideMask();
            });
        });

        this.getUploader().attachEvent("onFileUploadError", function (a, b, c) {
            if (b && b.message) {
                webix.alert({
                    ok: currentLang.Tamam,
                    type: "alert-warning",
                    text: b.message
                });
            }
        });
        STBEbys.Webix.Dys.RefreshFileManagerData(DmsSettings.RootKlasorId).then(function () {
            if (typeof (fileManager.AutoNavigationFolderList) == "undefined") {
                fileManager.openFolders([DmsSettings.RootKlasorId]);
                fileManager.$$("tree").select([DmsSettings.RootKlasorId], true);
            }
        });

        //Alt menülere itemclick eklenerek method atamaları yapılmaktadır. 
        //onBeforeShow event ile menü filter tetiklenmesi sağlanarak show ve hide işlemleri yapılmaktadır.
        STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent(actions, actions.getSubMenu("otherOperations"));
        STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent(actions, actions.getSubMenu("linkOperations"));
        STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent(actions, actions.getSubMenu("archiveOperations"));
        STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent(actions, actions.getSubMenu("processFollowReports"));
        STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent(actions, actions.getSubMenu("requestOpinionProcesses"));
    },
    menuFilter: function (obj) {
        var fileManager = $$("fmanager");
        var context = fileManager.getMenu().getContext();
        var data = fileManager.getItem(typeof (context.id) == "object" ? context.id.row : context.id);

        if (fileManager.getActive() == "shared" || fileManager.getActive().indexOf("s") == 0) {
            return false;
        }

        if (data) {

            if (data.id == DmsSettings.RootKlasorId.toString()) {
                if (STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi && obj.id == "create") {
                    return true;
                }
                else {
                    return false;
                }
            }

            if (data.realId == "personallikes") {
                return false;
            }
            else if (data.id == ("f" + DmsSettings.KurumsalKlasorId)) {
                if (STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi && obj.id == "create") {
                    return true;
                }
                else {
                    return false;
                }
            }
            else if (data.$parent == DmsSettings.RootKlasorId.toString()) {
                if (data.KlasorTipi == 1) {
                    /*Kişisel klasör ise*/
                    if (obj.id == "create") {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    /*Sadece sistem yöneticisi ise context menüyü görebilsin.*/
                    if (!STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi) {
                        return false;
                    }
                }
            }
            else if (data.id && (data.id.indexOf("s") > -1) || fileManager.getActive() == "shared") {
                return false;
            }

            var kurumsalAltindaMi = STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(fileManager, data.$parent);
            var sharedKlasorAltindaMi = STBEbys.Webix.Dys.SharedKlasorAltindaMi(fileManager, data.$parent);
            var kokKlasorAltindaMi = STBEbys.Webix.Dys.KokKlasorAltindaMi(fileManager, data.$parent);
            var kisiselKlasorAltindaMi = STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, data.$parent);
            var favoritesKlasorAltindaMi = STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManager, data.$parent);

            if (favoritesKlasorAltindaMi) {
                if (!((obj.id == "removeFavorites" && data.$parent == "personallikes") || (obj.id == "showFolderPath") || (obj.id == "showFilePath") || (obj.id == "redirectFolderPath") || (obj.id == "redirectFilePath") || (obj.id == "showOpinionHistory") || (obj.id == "edit") || (obj.id == "create") || (obj.id == "upload") || (obj.id == "archiveOperations") || (obj.id == "createTaslakBelge") || (obj.id == "deleteDysSablonIliski") || (obj.id == "deleteDysSablonIliskiAndCreateNew"))) {
                    return false;
                }
                else if (!STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi && obj.id == "edit" && data.KokteMi) {
                    return false;
                }
            }
            else {
                if (((obj.id == "removeFavorites") && !data.IsFavorite) || (obj.id == "showFolderPath") || (obj.id == "showFilePath") || (obj.id == "redirectFolderPath") || (obj.id == "redirectFilePath") || ((obj.id == "addFavorites") && data.IsFavorite)) {
                    return false;
                }
            }


            if (kurumsalAltindaMi && !kokKlasorAltindaMi) {
                if (obj.id == "convertProject" || obj.id == "createTaslakBelge" || obj.id == "createTaslakBelgeDokumansiz" || obj.id == "requestOpinionProcesses" || obj.id == "archiveOperations")
                    return false;
            }
            if (data.Boyut > parseInt(STBEbys.Webix.SistemParametreleriObject.DysBuyukDosyaBoyutu)) {
                if (obj.id == "checkOut" || obj.id == "checkIn" || obj.id == "publish" || obj.id == "share" || obj.id == "requestOpinionProcesses" || obj.id == "startWorkflow" || obj.id == "processHistory" || obj.id == "undo" || obj.id == "createTaslakBelge" || obj.id == "archiveOperations")
                    return false;
            }

            if (sharedKlasorAltindaMi) {
                if (!(obj.id == "download" || obj.id == "versions" || obj.id == "logInfo"))
                    return false;
            }

            if (data.$parent != ("f" + DmsSettings.KurumsalKlasorId) && obj.id == "getActorOrganization") {
                return false;
            }

            if (kurumsalAltindaMi && data.KokteMi
                && !(obj.id == "paste" || obj.id == "upload" || obj.id == "create" || obj.id == "getProjects" || obj.id == "linkOperations" || obj.id == "getActorOrganization" || obj.id == "showImages" || obj.id == "createFastAccessLinkForFolder" || obj.id == "addFavorites" || obj.id == "removeFavorites" || ((obj.id == "erisimHaklari" || obj.id == "otherOperations") && STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi)))
                return false;

            if (obj.id == "convertProject" && kisiselKlasorAltindaMi)
                return false;

            if (obj.id == "addFavorites" && (kisiselKlasorAltindaMi || data.realId == "shared"))
                return false;

            if (obj.id == "erisimHaklari") {
                if (data.KlasorTipi == 1 || STBEbys.Webix.Dys.KurumDysKlasoruMu(fileManager, data.$parent))
                    return false;
                else if (!STBEbys.Webix.CurrentAktorInfo.SistemYoneticisi && data.$parent == DmsSettings.RootKlasorId) {
                    return false;
                }
                else if (data.KlasorTipi == null) {
                    var dataKlasor = fileManager.getItem(data.$parent);
                    if (dataKlasor.KlasorTipi == 1 || dataKlasor.value == "Personal")
                        return false;
                }
            }

            if (obj.id == "customDelete" && (data.Durumu != null && data.Durumu != STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor") || data.GorusBekleniyorMu == true))
                return false;

            if ((obj.id == "customDelete" || obj.id == "copy" || obj.edit == "edit") && data.Di_DYS_ProjeId)
                return false;
            if (obj.id == "checkOut" && ((data.IsCheckedOut || !(data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor")
                || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Sonlandirildi")
                || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesti")))
                || ((data.DYSSablonName) && !(data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor")))))
                return false;
            if ((obj.id == "checkIn" || obj.id == "undo") && !data.IsCheckedOut)
                return false;
            if ((obj.id == "publish" || obj.id == "share") && (data.DYSSablonId && data.Durumu != STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor")))
                return false;
            if ((obj.id == "publish" && data.MinorVersiyon == 0))
                return false;
            if (obj.id == "convertProject") {
                if (data.Di_DYS_ProjeId) {
                    fileManager.getMenu().data.pull.convertProject.value = currentLang.ProjeBilgileri;//"Proje Bilgileri";
                    fileManager.getMenu().data.pull.convertProject.icon = "fas fa-info-circle";
                }
                else {
                    fileManager.getMenu().data.pull.convertProject.value = currentLang.ProjeyeCevir;//"Projeye Çevir";
                    fileManager.getMenu().data.pull.convertProject.icon = "fas fa-share";
                }
            }

            if ((obj.id == "requestOpinion" || obj.id == "requestCollectiveOpinion") && data.type != "folder" && !DmsSettings.RequestOpinionForDocument) {
                return false;
            }
          
            if ((obj.id == "requestOpinion" || obj.id == "requestOpinionProcesses") && ((data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor") && data.DYSSablonId) || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesiyor") || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesti")))
                return false;
            if (obj.id == "requestOpinion" || obj.id == "showOpinionHistory") {
                if (data.type == "folder")
                    return true;
                else if (data.type != "folder" /*&& STBEbys.Webix.Dys.ProjeAltindaMi(fileManager, data.$parent)*/)
                    return true;
                else return false;
            }
            if (obj.id == "processHistory") {
                if (data.type == "folder")
                    return true;
                else if (data.type != "folder" /*&& STBEbys.Webix.Dys.ProjeAltindaMi(fileManager, data.$parent)*/)
                    return true;
                else return false;
            }

            if ((obj.id == "createTaslakBelge" || obj.id == "archiveOperations")
                && (
                    kisiselKlasorAltindaMi
                    || (data.DYSSablonId && data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesti"))
                    || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesiyor")
                    || (data.GorusBekleniyorMu && !DmsSettings.ShowArchiveOperations)
                ))
                return false;

            if (obj.id == "showTaslakInfos" && (kisiselKlasorAltindaMi || !data.DYSSablonId))
                return false;

            if ((obj.id == "deleteDysSablonIliski" || obj.id == "deleteDysSablonIliskiAndCreateNew") && (!data.DYSSablonId || data.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesiyor") || data.GorusBekleniyorMu))
                return false;

            if (obj.id == "share" && !kurumsalAltindaMi)
                return false;

            if (obj.id == "webScan") {
                if ((kurumsalAltindaMi || !kokKlasorAltindaMi) && (data.type != "folder" && data.type != "empty")) {
                    return false;
                }
            }

            if (obj.id == "createFastAccessLinkForFolder" && kisiselKlasorAltindaMi)
                return false;

            if (obj.id == "createFastAccessLinkForFile" && kisiselKlasorAltindaMi)
                return false;

            if (obj.id == "defaultApprovers" && kisiselKlasorAltindaMi) {
                return false;
            }

            if (obj.id == "customEdit" && (fileManager.webDavExtensions.indexOf(data.type) == -1 || WebDavKullanimiAcik == "false"))
                return false;

            if (obj.id == "linkOperations") {
                if (kisiselKlasorAltindaMi && data.type == "folder") {
                    return false;
                }
            }

            if (obj.id == "createTaslakBelgeDokumansiz") {
                return false;
            }

            if (obj.id == "processFollowReports") {
                if (data.$level <= 2 || kisiselKlasorAltindaMi || data.type != "folder" || !DmsSettings.ShowSurecTakipRaporlari) {
                    return false;
                }
            }

            if (obj.id == "getProjects" && kisiselKlasorAltindaMi) {
                return false;
            }
            if (obj.id == "sign" || obj.id == "showSignHistory") {
                //İmza veya doküman imza geçmiş değeri false olduğu sürece context menüde gösterilmez.
                if (DmsSettings.ShowImzaAndDokumanImzaGecmisi) {
                    if (data.Tip != ".pdf" && data.Tip != ".docx" && data.Tip != ".xlsx" && data.Tip != ".doc" && data.Tip != ".xls" && data.Tip != ".mpp" && data.Tip != ".vsd" && data.Tip != ".vsdx" && data.Tip != ".ppt" && data.Tip != ".pptx" && data.Tip != ".cms")
                        return false;
                }
                else {
                    return false;
                }

            }


            if (obj.id == "createTaslakBelge") {
                if (data.TaslakBelgeId || data.DYSSablonId) {
                    obj.value = currentLang.ArsivlemeIslemineDevamEt;
                }
                else {
                    obj.value = currentLang.ArsivlemeIsleminiBaslat;
                }
            }

            //Menü onBeforeShow eventında ypaılan işlem buraya taşındı.
            //İçiçe menüde 1.level için test edildi. 2.levele gerek olduğunda test edilmeli.
            return STBEbys.Webix.Dys.CreateSubMenu(obj.id);

        }

        else {

            var kurumsalAltindaMi = STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(fileManager, fileManager.getActive());
            var sharedKlasorAltindaMi = STBEbys.Webix.Dys.SharedKlasorAltindaMi(fileManager, fileManager.getActive());
            var kokKlasorAltindaMi = STBEbys.Webix.Dys.KokKlasorAltindaMi(fileManager, fileManager.getActive());
            var kisiselKlasorAltindaMi = STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, fileManager.getActive());
            var favoritesKlasorAltindaMi = STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManager, fileManager.getActive());

            if ((fileManager.getActive() == "personallikes" || (fileManager.getActive().indexOf("l") == 0 && obj.id == "paste"))) {
                return false;
            }
            if (obj.id == "createTaslakBelgeDokumansiz" && ((kurumsalAltindaMi && !kokKlasorAltindaMi) || kisiselKlasorAltindaMi || sharedKlasorAltindaMi || fileManager.getActive() == DmsSettings.RootKlasorId.toString() || fileManager.getActive() == "personallikes" || fileManager.getActive() == ("f" + DmsSettings.KurumsalKlasorId))) {
                return false;
            }
            if (obj.id == "webScan" && (sharedKlasorAltindaMi || fileManager.getActive() == DmsSettings.RootKlasorId.toString() || fileManager.getActive() == "personallikes" || fileManager.getActive() == ("f" + DmsSettings.KurumsalKlasorId))) {
                return false;
            }
        }
        return true;
    },
    customDelete: function (nodeId, b, c) {

        var fileManager = this;
        fileManager.showMask();
        var itemList = new Array();
          if (!Array.isArray(nodeId)) {
            var temp = nodeId;
            nodeId = new Array();
            nodeId.push(temp);
        }

        for (var i = 0; i < nodeId.length; i++) {
            var realId;
            var selected = fileManager.getItem(nodeId[i]);

            if (this.getItem(nodeId[i]).type != "folder") {
                realId = selected.realId ? selected.realId : selected.id.toString().replace("d", "");
            }
            else {
                realId = selected.realId ? selected.realId : selected.id.toString().replace("f", "");
            }

        

                itemList.push({
                    Id: realId,
                    Type: this.getItem(nodeId[i]).type != "folder" ? STBEbys.Webix.DysItemType.Document : STBEbys.Webix.DysItemType.Folder
                });
            
        }


        webix.confirm({
            title: "<i style='margin-right: 3px;' class='fa fa-exclamation-triangle' aria-hidden='true'></i> " + currentLang.Uyari,
            type: "alert-warning",
            ok: currentLang.Evet,
            cancel: currentLang.Hayir,
            text: nodeId.length != 1 ? currentLang.KayitCokluSilmeUyari : currentLang.KayitSilmeUyari,
            callback: function (result) {
                if (result) {
                    fileManager.showMask();
                    Di_DYS_KlasorDokumanAction.DeleteDysItem(itemList, function (ret) {
                        if (ret) {
                            
                            var silinemeyenler = ret;                          
                            var yetkisiz = new Array();                           
                            var yetkili = new Array(); //silinebilenler
                            var kuralNedeniyle = new Array(); //Kural nedeniyle silinemeyecekler



                            for (var i = 0; i < itemList.length; i++) {

                                if (!silinemeyenler.some(item => item.Id == itemList[i].Id)) {
                                    yetkili.push(itemList[i]);
                                }
                             
                            }
                            for (var i = 0; i < silinemeyenler.length; i++) {
                                if (silinemeyenler[i].Aciklama=="yetkisiz") {
                                    yetkisiz.push({
                                        Id: silinemeyenler[i].Id,
                                        Type: silinemeyenler[i].Type,
                                        ErrorType: currentLang.DysSilinmemeUyarisiYetkisiz
                                    });
                                  
                                }
                                if (silinemeyenler[i].Aciklama == "silinemeyen") {
                                    kuralNedeniyle.push({
                                        Id: silinemeyenler[i].Id,
                                        Type: silinemeyenler[i].Type,
                                        ErrorType: currentLang.SilinemezOge
                                    });

                                }
                             
                            } 
                            if (silinemeyenler.length == 0) {


                                if (itemList.length == 1) {
                                    STBEbys.Webix.ShowInfo(itemList[0].Type == 0 ? currentLang.KlasorSilindi : currentLang.DysDokumanSilindi);
                                    STBEbys.Webix.Dys.RefreshFileManagerData(itemList[0].Id);
                                }
                                else {
                                    STBEbys.Webix.ShowInfo(currentLang.DysCokluSilindi);
                                }

                            }
                            else if (silinemeyenler.length == itemList.length) {
                              
                                if (yetkisiz.length > 0) {
                                    STBEbys.Webix.ShowWarning(currentLang.DysDokumanSilmeYetkisiHatasi);

                                    STBEbys.Webix.Dys.RefreshFileManagerData(itemList[0].Id).then(function () {                                    

                                        fileManager.hideMask();
                                    });
                                }
                                if (kuralNedeniyle.length > 0) {
                                    STBEbys.Webix.ShowWarning(currentLang.SilinemezOge);
                                    for (var i = 0; i < kuralNedeniyle.length; i++) {
                                        var selected = kuralNedeniyle[i].Type == 0 ? fileManager.getItem("f" + kuralNedeniyle[i].Id) : fileManager.getItem("d" + kuralNedeniyle[i].Id);
                                        if (kuralNedeniyle[i].Type == 0) {                                           
                                            STBEbys.Webix.Dys.RefreshFileManagerData(selected.id).then(function () {
                                                fileManager.hideMask();
                                            });
                                        }
                                        if (kuralNedeniyle[i].Type == 1) {
                                            STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {

                                                fileManager.hideMask();
                                            });
                                        }
                                       
                                    }
                                    
                                    
                                }
                                else {
                                    STBEbys.Webix.ShowWarning(currentLang.DysCokluSilinemedi);
                                    STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {

                                        fileManager.hideMask();
                                    });
                                }
                            }
                            else {

                                var seconItemListTooltip = new String();

                                for (var i = 0; i < silinemeyenler.length; i++) {
                                    var selected = silinemeyenler[i].Type == 0 ? fileManager.getItem("f" + silinemeyenler[i].Id) : fileManager.getItem("d" + silinemeyenler[i].Id);
                                    seconItemListTooltip += '•' + selected.Ad  + "\n";
                                    
                                }


                                var yetkiliListTooltip = new String();

                                for (var i = 0; i < yetkili.length; i++) {
                                    var selected = yetkili[i].Type == 0 ? fileManager.getItem("f" + yetkili[i].Id) : fileManager.getItem("d" + yetkili[i].Id);
                                    yetkiliListTooltip += '•' + selected.Ad + "\n";
                                }
                                var stringYetkili = "<span data-tooltip='" + yetkiliListTooltip.toString() + "' <a href='#'>" + yetkili.length + "</a> </span>";
                                var stringYetkisiz = "<span data-tooltip='" + seconItemListTooltip.toString() + "' <a href='#'>" + silinemeyenler.length + "</a> </span>";

                                STBEbys.Webix.ShowWarning(currentLang.DysCokluSilmeHata.format(stringYetkili, stringYetkisiz));

                            }
                            for (var i = 0; i < yetkili.length; i++) {                              
                                var selected = itemList[i].Type == 0 ? fileManager.getItem("f" + itemList[i].Id) : fileManager.getItem("d" + itemList[i].Id);
                                STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {
                                    fileManager.hideMask();
                                });
                            }

                        }

                    })


                }
            }
        });


        fileManager.hideMask();
    },
    customEdit: function (nodeId, b, c) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(nodeId, true))
            return false;
        var fileManager = this;
        fileManager.showMask();
        if (Array.isArray(nodeId)) {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: currentLang.DysSilmeUyarisi1//"Sadece tek dosya düzenleyebilirsiniz."
            });
            fileManager.hideMask();
            return false;
        }
        var selected = fileManager.getItem(nodeId);

        if (fileManager.webDavExtensions.indexOf(selected.type) >= 0) {
            function KontrolDokumanCheckOut() {
                Di_DYS_DokumanAction.KontrolDokumanCheckOut(selected.realId.toString(), function (ret) {
                    fileManager.hideMask();
                    if (ret) {
                        Di_DYS_DokumanAction.ControlDocumentHasWebDavUpdate(selected.realId.toString(), function (WebDavDokumanId) {
                            if (selected.IsCheckedOut != 1 && WebDavDokumanId == null) {
                                webix.confirm({
                                    width: 500,
                                    ok: currentLang.Evet,
                                    cancel: currentLang.Hayir,
                                    type: "alert-warning",
                                    text: currentLang.DysEditFileConfirmMsg, //"Açmak istediğiniz dökümanın yeni bir versiyonu oluşacak yine de açmak ister misiniz? Güncelleme yapmayacaksanız İndir seçeneğini kullanabilirsiniz."
                                    callback: function (result) {
                                        if (result) {
                                            Di_DYS_DokumanAction.DokumanCheckOut(selected.realId.toString(), function (res, b) {
                                                if (res) {
                                                    fileManager.showMask();
                                                    Di_DYS_DokumanAction.SaveNewDocumentForWebDavFromOldDocument(selected.DokumanId.toString(), selected.realId.toString(), function (newDokumanId, b) {// Dökümamanın WebDav ile güncellenmesi için kopyası oluşturuluyor
                                                        if (newDokumanId && newDokumanId > 0) {
                                                            STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {
                                                                fileManager.hideMask();
                                                                webix.message({
                                                                    text: currentLang.DysDokumanCheckOut,
                                                                    type: "info",
                                                                    expire: 4000
                                                                });
                                                                fileManager.showMask();
                                                                if (WebDAVRepositoryRoot && newDokumanId > 0) {
                                                                    editDocumentWithProgID(WebDAVRepositoryRoot + newDokumanId + '/taslak' + selected.Tip, 2);
                                                                    fileManager.hideMask();
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                                else {
                                                    fileManager.hideMask();
                                                    webix.alert({
                                                        ok: currentLang.Tamam,
                                                        type: "alert-error",
                                                        text: currentLang.DysDokumanCheckOutError
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            else if (selected.IsCheckedOut == 1 && WebDavDokumanId > 0) {// Döküman zaten check out ise tekrardan check out etmesine ve tekrardan  gerek yok 
                                fileManager.hideMask();
                                if (WebDAVRepositoryRoot) {
                                    editDocumentWithProgID(WebDAVRepositoryRoot + WebDavDokumanId + '/taslak' + selected.Tip, 2);
                                    fileManager.hideMask();
                                }
                            }
                            else {
                                webix.alert({
                                    ok: currentLang.Tamam,
                                    type: "alert-warning",
                                    text: currentLang.DysEditFileInfoMsg //"Dökümanı 'Kullanıma Al' diyerek güncellemeye başlamışsınız. Ancak 'Kullanımı Bırak' diyerek güncelleyebilirsiniz.Eğer güncelleme yapacaksanız dökümanın son hali için 'Indir' seçeneğini kullanabilirsiniz."
                                });
                                return false;
                            }

                        });
                    }
                });
            }


            if (selected.SablonDokumanId && parseInt(selected.SablonDokumanId) > 0) {
                webix.confirm({
                    title: currentLang.Dikkat,
                    ok: currentLang.Evet,
                    cancel: currentLang.Hayir,
                    type: "confirm-warning",
                    text: currentLang.DysDokumansizArsivlemeIptalUyarisi,
                    width: 400,
                    callback: function (confirmResult) {
                        if (confirmResult) {
                            KontrolDokumanCheckOut();
                        }
                        else {
                            fileManager.hideMask();
                        }
                    }
                });
            }
            else {
                KontrolDokumanCheckOut();
            }
        }
    },
    erisimHaklari: function (nodeId, b, c) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(nodeId, true))
            return false;

        if (this.getItem(nodeId).type == "folder") {
            STBEbys.Webix.ErisimHaklari.ShowPanel("Di_DYS_Klasor", this.getItem(nodeId).realId, STBEbys.Webix.DYS_KlasorYetkiChoices, false);
        }
        else {
            STBEbys.Webix.ErisimHaklari.ShowPanel("Di_DYS_Dokuman", this.getItem(nodeId).realId, STBEbys.Webix.DYS_DokumanYetkiChoices, false);
        }
    },
    download: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;

        var fileManager = this;
        fileManager.showMask();

        var data = this.getItem(id);

        Di_DYS_DokumanAction.AddLogForDysDownload(parseInt(data.realId));

        Di_DYS_DokumanAction.GetLatestDocIdForDownload(parseInt(data.realId), function (retVal) {
            if (retVal) {
                YetkilendirmeAction.CheckDysDownloadPermission(retVal.Di_DYS_DokumanId, false, function (yetkiRetVal) {
                    if (yetkiRetVal) {
                        if (WebDavKullanimiAcik == "true" && retVal.WebDavDokumanId) {
                            document.location.href = FileDownloaderAddress + '?id=' + GenerateEncryptedIdCode(retVal.WebDavDokumanId) + '&dysDokId=' + GenerateEncryptedIdCode(retVal.Di_DYS_DokumanId);
                        }
                        else {
                            document.location.href = FileDownloaderAddress + '?id=' + GenerateEncryptedIdCode(retVal.DokumanId) + '&dysDokId=' + GenerateEncryptedIdCode(retVal.Di_DYS_DokumanId);
                        }
                        if (retVal.Di_DYS_DokumanId != data.readId) {
                            STBEbys.Webix.Dys.RefreshFileManagerData(data.$parent).then(function () {
                                fileManager.hideMask();
                            });
                        }
                    }
                    else {
                        STBEbys.Webix.ShowMessage({
                            text: currentLang.DokumanIndirmeYetkiWarning
                        });
                    }
                    fileManager.hideMask();
                });
            }
            fileManager.hideMask();
        });
    },
    checkOut: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;


        webix.confirm({
            title: currentLang.Dikkat,
            ok: currentLang.Evet,
            cancel: currentLang.Hayir,
            type: "confirm-warning",
            text: currentLang.CheckOutUyari,
            callback: function (confirmResult) {
                if (confirmResult) {
                    fileManager.showMask();
                    var selected = fileManager.getItem(id);


                    Di_DYS_DokumanAction.KontrolDokumanCheckOut(selected.realId.toString(), function (ret) {
                        fileManager.hideMask();
                        if (ret) {
                            fileManager.showMask();
                            if (selected.IsCheckedOut != 1) {
                                Di_DYS_DokumanAction.DokumanCheckOut(selected.realId.toString(), function (res, b) {
                                    if (res) {
                                        STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {
                                            fileManager.hideMask();
                                            webix.message({
                                                text: currentLang.DysDokumanCheckOut,
                                                type: "info",
                                                expire: 4000
                                            });
                                        });
                                    }
                                    else {
                                        fileManager.hideMask();
                                        webix.alert({
                                            ok: currentLang.Tamam,
                                            type: "alert-error",
                                            text: currentLang.DysDokumanCheckOutError
                                        });
                                    }
                                });
                            }
                            else {
                                fileManager.hideMask();
                                webix.alert({
                                    ok: currentLang.Tamam,
                                    type: "alert-warning",
                                    text: currentLang.DysDokumanBaskaKullaniciCheckOut
                                });
                            }
                        }
                    });
                }
            }
        });

    },
    checkIn: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;


        webix.confirm({
            title: currentLang.Dikkat,
            ok: currentLang.Evet,
            cancel: currentLang.Hayir,
            type: "confirm-warning",
            text: currentLang.CheckInUyari,
            callback: function (confirmResult) {
                if (confirmResult) {
                    fileManager.showMask();
                    var selected = fileManager.getItem(id);

                    function ControlDocumentCheckOutAndUpdate() {
                        Di_DYS_DokumanAction.ControlDocumentCheckOutAndUpdate(selected.realId.toString(), function (ret) {
                            fileManager.hideMask();
                            if (ret) {
                                var selectedFileExt = STBEbys.Webix.GetFileExtension(selected.value);
                                Di_DYS_DokumanAction.ControlDocumentHasWebDavUpdate(selected.realId.toString(), function (WebDavDokumanId) {
                                    var HasWebDavUpdate = false;
                                    if (WebDavDokumanId > 0)
                                        HasWebDavUpdate = true;
                                    HasWebDavUpdate = WebDavKullanimiAcik == "false" ? false : HasWebDavUpdate;
                                    var window = webix.ui({
                                        view: "window",
                                        id: "checkinWindow",
                                        head: {
                                            view: "toolbar",
                                            cols: [
                                                {
                                                    view: "label", label: "<i style='color:#ffffff; margin-right:10px' class='fas fa-lock' aria-hidden='true'></i>" + currentLang.CheckIn + " (" + selected.Ad + ")", align: 'left'
                                                },
                                                {
                                                    view: "icon",
                                                    icon: "times-circle",
                                                    click: function () {
                                                        this.getTopParentView().close();
                                                    }
                                                }
                                            ]
                                        },
                                        position: "center",
                                        modal: true,
                                        width: 800,
                                        height: 520,
                                        body: {
                                            view: "form",
                                            elements: [
                                                {
                                                    view: "template",
                                                    borderless: true,
                                                    css: { "margin-top": "5px !important" },
                                                    height: 65,
                                                    template: "<i class='fas fa-info-circle' style='color: #346f81; margin-right: 7px; font-size:18px' aria-hidden='true'></i><span style='color:#346f81'>"
                                                        +
                                                        currentLang.CheckInInfo.format("<a href='#' onclick='STBEbys.Webix.Dys.CheckInClickUpload()'" +
                                                            " class='showSablonOnayciList' style = 'color:#0a6b82; font-weight:bolder; text-decoration:underline;' > ", "</a > ")
                                                        +
                                                        "</span>"
                                                },
                                                {
                                                    view: "textarea",
                                                    label: currentLang.Not,
                                                    height: 100,
                                                    required: true,
                                                    itemId: "txtNot"
                                                },
                                                {
                                                    view: "fileuploader",
                                                    singleFile: true,
                                                    itemId: "fileUploaderItemId",
                                                    whiteList: selectedFileExt ? [selectedFileExt] : null,
                                                    hidden: HasWebDavUpdate,
                                                    windowItemId: "checkinWindow",
                                                    readOnly: true
                                                },
                                                {
                                                    cols: [
                                                        {
                                                            view: "button",
                                                            label: currentLang.Kaydet,
                                                            type: "iconButton",
                                                            icon: "floppy-o",
                                                            click: function (a, b, c) {
                                                                var window = this.getTopParentView();
                                                                var txtNot = GetChildViewsByItemId(this.getTopParentView(), "txtNot")[0].getValue();
                                                                var dokuman = GetChildViewsByItemId(this.getTopParentView(), "fileUploaderItemId")[0].getValue();
                                                                STBEbys.Webix.Dys.MaskObj.maskView = null;
                                                                STBEbys.Webix.Dys.MaskObj.maskCounter = 0;


                                                                function UpdateDocument(dokuman, selectedFile, txtNot, win, HasWebDavUpdate, newName, windowObj, keepDefaultName) {
                                                                    var dokumanJson = '';
                                                                    if (!HasWebDavUpdate) {
                                                                        var jsonObj = JSON.parse(dokuman)[0];
                                                                        dokumanJson = JSON.stringify(jsonObj);
                                                                    }

                                                                    if (STBEbys.Webix.Dys.MaskObj.maskView == null) {
                                                                        if (windowObj) {
                                                                            STBEbys.Webix.Dys.MaskObj.maskView = windowObj;
                                                                        }
                                                                        else {
                                                                            STBEbys.Webix.Dys.MaskObj.maskView = win;
                                                                        }
                                                                    }
                                                                    STBEbys.Webix.Dys.MaskObj.showProgressBar();
                                                                    Di_DYS_DokumanAction.RemoveDokumanSablonRelation(selectedFile.realId, function () {

                                                                        Di_DYS_DokumanAction.UpdateDocument(dokumanJson, selectedFile.realId, selectedFile.UstKlasorId, txtNot, HasWebDavUpdate, keepDefaultName, function (retVal) {

                                                                            if (retVal.success) {
                                                                                STBEbys.Webix.Dys.RefreshFileManagerData(selectedFile.$parent).then(function () {


                                                                                    if (newName) {
                                                                                        webix.message({
                                                                                            text: currentLang.DysCheckinChangeNameInfo.format(selectedFile.value, newName),
                                                                                            type: "info",
                                                                                            expire: 4000
                                                                                        });

                                                                                    }
                                                                                    else {
                                                                                        webix.message({
                                                                                            text: currentLang.DysCheckinInfo.format(selectedFile.value),
                                                                                            type: "info",
                                                                                            expire: 4000
                                                                                        });
                                                                                    }

                                                                                });
                                                                                if (windowObj) {
                                                                                    windowObj.close();
                                                                                }
                                                                                win.close();
                                                                            }
                                                                            else {
                                                                                webix.alert({
                                                                                    ok: currentLang.Tamam,
                                                                                    type: "alert-error",
                                                                                    text: currentLang.DysCheckinError
                                                                                });
                                                                            }
                                                                            STBEbys.Webix.Dys.MaskObj.hideProgressBar();
                                                                        });
                                                                    });

                                                                }

                                                                if (!HasWebDavUpdate && (!dokuman || dokuman == "[]")) {
                                                                    webix.alert({
                                                                        width: 300,
                                                                        ok: currentLang.Tamam,
                                                                        type: "alert-warning",
                                                                        text: currentLang.DokumanYuklemeTamamlanmadi
                                                                    });
                                                                    return false;
                                                                }
                                                                else if (!HasWebDavUpdate && STBEbys.Webix.GetFileExtension(JSON.parse(dokuman)[0].name) != selectedFileExt) {
                                                                    webix.alert({
                                                                        ok: currentLang.Tamam,
                                                                        type: "alert-warning",
                                                                        text: currentLang.FileUpload_WhiteListWarning.format(selectedFileExt)
                                                                    });
                                                                    return false;
                                                                }
                                                                else if (!txtNot) {
                                                                    webix.alert({
                                                                        ok: currentLang.Tamam,
                                                                        type: "alert-warning",
                                                                        text: currentLang.NotAlaniZorunlu
                                                                    });
                                                                    return false;
                                                                }
                                                                else if (!HasWebDavUpdate && JSON.parse(dokuman)[0].name != selected.value) {

                                                                    webix.ui({
                                                                        view: "window",
                                                                        height: 200,
                                                                        width: 600,
                                                                        position: "bottom",
                                                                        modal: true,
                                                                        head: {
                                                                            view: "toolbar",
                                                                            cols: [
                                                                                {
                                                                                    view: "label", label: "<i style='color:#ffffff;margin-right:2px' class='fa fa-question-circle-o aria-hidden='true'></i> " + currentLang.DysDokumanAdiSecimi, align: "left"
                                                                                },
                                                                                {
                                                                                    view: "icon", icon: "times-circle",
                                                                                    click: function () {
                                                                                        var windowObj = this.getTopParentView();
                                                                                        windowObj.close();
                                                                                    }
                                                                                }
                                                                            ]
                                                                        },
                                                                        body: {
                                                                            padding: 5,
                                                                            rows:
                                                                                [
                                                                                    {
                                                                                        cols: [
                                                                                            {
                                                                                                template: currentLang.DysCheckinFileNameMsg,
                                                                                                borderless: true
                                                                                            }

                                                                                        ]

                                                                                    },
                                                                                    {
                                                                                        cols: [
                                                                                            {
                                                                                                view: "radio",
                                                                                                vertical: true,
                                                                                                css: { "margin-left": "10px !important" },
                                                                                                label: "",
                                                                                                itemId: "DokumanAdiSecimId",
                                                                                                options: [
                                                                                                    { value: "<div title='" + JSON.parse(dokuman)[0].name + "'>" + currentLang.YukledigimDosyaIle + "</div>", id: "0" },
                                                                                                    { value: "<div title='" + selected.value + "'>" + currentLang.MevcutAdIle + "</div>", id: "1" },

                                                                                                ],
                                                                                                value: 0

                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        cols: [
                                                                                            {},
                                                                                            {
                                                                                                view: "button",
                                                                                                label: currentLang.Kaydet, //"Kaydet"
                                                                                                width: 120,
                                                                                                type: "iconButton",
                                                                                                icon: "floppy-o",
                                                                                                click: function () {
                                                                                                    var windowObj = this.getTopParentView();
                                                                                                    var dokumanAdiSecimId = GetChildViewsByItemId(windowObj, "DokumanAdiSecimId")[0];

                                                                                                    var fileManager = $$("fmanager");

                                                                                                    if (dokumanAdiSecimId.data.value == STBEbys.Webix.DokumanAdiSecimObj.YukledigimDosyaIle) {
                                                                                                        STBEbys.Webix.Dys.MaskObj.maskView = windowObj;
                                                                                                        STBEbys.Webix.Dys.MaskObj.showProgressBar();
                                                                                                        var realFolderId = fileManager.getCurrentFolder().replace("f", "");

                                                                                                        Di_DYS_DokumanAction.CheckName(selected.realId, JSON.parse(dokuman)[0].name, function (result, y) {
                                                                                                            if (!result) {
                                                                                                                STBEbys.Webix.ShowWarning(currentLang.DysDosyaRenameWarn);
                                                                                                                STBEbys.Webix.Dys.MaskObj.hideProgressBar();
                                                                                                            }

                                                                                                            else {
                                                                                                                //    //isim değişikliği yapıldı ise:
                                                                                                                UpdateDocument(dokuman, selected, txtNot, window, HasWebDavUpdate, JSON.parse(dokuman)[0].name, windowObj, false);
                                                                                                            }
                                                                                                        }, this);


                                                                                                    }

                                                                                                    else if (dokumanAdiSecimId.data.value == STBEbys.Webix.DokumanAdiSecimObj.MevcutAdIle) {
                                                                                                        UpdateDocument(dokuman, selected, txtNot, window, HasWebDavUpdate, null, windowObj, true);

                                                                                                    }

                                                                                                }
                                                                                            },
                                                                                            {
                                                                                                view: "button",
                                                                                                label: currentLang.Vazgec, //"Vazgeç"
                                                                                                align: "center",
                                                                                                width: 120,
                                                                                                type: "iconButton",
                                                                                                icon: "undo",
                                                                                                click: function () {
                                                                                                    this.getTopParentView().close();
                                                                                                }
                                                                                            }
                                                                                        ]

                                                                                    }
                                                                                ]
                                                                        }
                                                                    }).show();

                                                                }
                                                                else {
                                                                    UpdateDocument(dokuman, selected, txtNot, window, HasWebDavUpdate, null, null, true);
                                                                }
                                                            }
                                                        },
                                                        {
                                                            view: "button",
                                                            label: currentLang.Vazgec,
                                                            type: "iconButton",
                                                            icon: "undo",
                                                            click: function (a, b, c) {
                                                                this.getTopParentView().close();
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }).show();
                                });
                            }
                            else {
                                webix.alert({
                                    ok: currentLang.Tamam,
                                    type: "alert-warning",
                                    text: currentLang.DysCheckinYetkiWarn.format(selected.value)
                                });
                            }
                        });
                    }

                    if (selected.IsCheckedOut) {
                        if (selected.SablonDokumanId && parseInt(selected.SablonDokumanId) > 0) {
                            webix.confirm({
                                title: currentLang.Dikkat,
                                ok: currentLang.Evet,
                                cancel: currentLang.Hayir,
                                type: "confirm-warning",
                                text: currentLang.DysDokumansizArsivlemeIptalUyarisi,
                                width: 400,
                                callback: function (confirmResult) {
                                    if (confirmResult) {
                                        ControlDocumentCheckOutAndUpdate();
                                    }
                                    fileManager.hideMask();
                                }
                            });
                        }
                        else {
                            ControlDocumentCheckOutAndUpdate();
                        }
                    }
                }
            }
        });
    },
    startWorkflow: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var selected = this.getItem(id);

        STBEbys.Webix.DYSStartWorkflow.ShowWorkflowSelectWindow(selected);
    },
    processHistory: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var selected = this.getItem(id);

        var klasorMu = !selected.KlasorMuDokumanMi;

        var window = webix.ui(webix.copy(STBEbys.Webix.DysWorkflowHistory.ProcessHistoryWindow({ form: selected, klasorMu: klasorMu, goreviMi: false })));
        var historyWindowItem = GetChildViewsByItemId(window, "historyWindowHeadItemId")[0];
        historyWindowItem.setValue("<i style='color:#ffffff;margin-right:2px' class='fa-fas fa-history' aria-hidden='true'></i> " + currentLang.SurecGecmisi + " ( " + selected.value + " )");

        var surecGecmisiInfoTextItem = GetChildViewsByItemId(window, "SurecGecmisiInfoTextItemId");
        if (surecGecmisiInfoTextItem && surecGecmisiInfoTextItem.length > 0 && surecGecmisiInfoTextItem[0].setValue) {
            surecGecmisiInfoTextItem[0].setValue("<span style='margin-top:20px;'> " + (klasorMu ? currentLang.SurecGecmisiTooltipProje : currentLang.SurecGecmisiGoreviToolTip) + "</span>");
        }
    },
    openDysWorkflowHistory: function (id) {
        STBEbys.Webix.DYSWorkflowHistory.ShowWorkflowHistoryWindow(id);
    },
    undo: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;

        webix.confirm({
            title: currentLang.Dikkat,
            ok: currentLang.Evet,
            cancel: currentLang.Hayir,
            type: "confirm-warning",
            text: currentLang.UndoUyari,
            callback: function (confirmResult) {
                if (confirmResult) {
                    fileManager.showMask();
                    var selected = fileManager.getItem(id);
                    Di_DYS_DokumanAction.DokumanUndo(selected.realId, function (ret) {
                        if (ret) {
                            STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {
                                fileManager.hideMask();
                            });
                        }
                        fileManager.hideMask();
                    });
                }
            }
        });

    },
    publish: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;

        webix.confirm({
            title: currentLang.Dikkat,
            ok: currentLang.Evet,
            cancel: currentLang.Hayir,
            type: "confirm-warning",
            text: currentLang.PublishUyari,
            callback: function (confirmResult) {
                if (confirmResult) {
                    fileManager.showMask();
                    var selected = fileManager.getItem(id);
                    Di_DYS_DokumanAction.GetLatestDocIdForPublish(selected.realId, function (retVal) {
                        if (retVal && retVal.Di_DYS_DokumanId) {
                            selected.realId = retVal.Di_DYS_DokumanId;
                            if (retVal.VersiyonMinor) {
                                Di_DYS_DokumanAction.KontrolDokumanCheckOut(selected.realId, function (ret) {
                                    if (ret) {
                                        Di_DYS_DokumanAction.DokumanSonlandirma(selected.realId, function (ret) {
                                            if (ret) {
                                                STBEbys.Webix.Dys.RefreshFileManagerData(selected.$parent).then(function () {
                                                    fileManager.hideMask();
                                                    webix.message({
                                                        text: currentLang.DysPublishSuccess,
                                                        type: "info",
                                                        expire: 4000
                                                    });
                                                });
                                            }
                                            else {
                                                fileManager.hideMask();
                                                webix.alert({
                                                    ok: currentLang.Tamam,
                                                    type: "alert-warning",
                                                    text: currentLang.DysPublishError
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        fileManager.hideMask();
                                    }
                                }, this);
                            }
                            else {
                                fileManager.hideMask();
                                webix.alert({
                                    ok: currentLang.Tamam,
                                    type: "alert-warning",
                                    text: currentLang.DysPublishPublishedError
                                });
                            }
                        }
                        else {
                            fileManager.hideMask();
                            webix.alert({
                                ok: currentLang.Tamam,
                                type: "alert-warning",
                                text: currentLang.DysPublishError
                            });
                        }
                    });
                }
            }
        });
    },
    dokumanTipi: function (id) {
        var fileManager = this;
        var selected = fileManager.getItem(id);
        var target = fileManager.getCurrentFolder() ? fileManager.getCurrentFolder() : fileManager.getCursor();
        STBEbys.Webix.DiDYSDokumanTipi.OpenWindow(selected.realId, target);
    },
    showVersions: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;
        fileManager.showMask();
        var selected = fileManager.getItem(id);

        Di_DYS_DokumanAction.GetVersionListWithSignInfo(selected.realId, function (retVal) {
            for (var i = 0; i < retVal.length; i++) {
                retVal[i].CheckinNotes = language == "Tr" ? retVal[i].CheckinNotesTr : retVal[i].CheckinNotesEn;
            }

            var window = webix.ui({
                view: "window",
                resize: true,
                width: innerWidth - 300,
                autoheight:true,
                minHeight:200,
                minWidth:1000,
                head: {
                    view: "toolbar",
                    cols: [
                        {
                            view: "label", label: "<i style='color:#ffffff;margin-right:2px' class='fas fa-history' aria-hidden='true'></i> " + currentLang.Versiyonlar, align: 'left'
                        },
                        {
                            view: "icon",
                            icon: "times-circle",
                            click: function () {
                                this.getTopParentView().close();
                            }
                        }
                    ]
                },
                position: "center",
                modal: true,
                body: {
                    paddingY: 10, paddingX: 20,
                    rows: [
                        {
                            view: "scrollview",
                            body: {
                                type: "clean",
                                rows: [
                                    {
                                        view: "datatable",
                                        itemId: "dtVersion",
                                        scrollX: false,
                                        editable: true,
                                        resizeRow: true,
                                        resizeColumn: true,
                                        columns: [
                                            {
                                                id: "selected", header: "", template: "<div style='vertical-align:text-top; height:5px;'></div><span style='margin-left:5px; text-align:center;'>{common.checkbox()}</span>", height: 50, checkValue: 'on', uncheckValue: 'off', width: 50,

                                            },
                                            {
                                                id: "download", header: "", width: 50, css: "centerText", template: "<span class='download webix_icon fa-download' style='cursor:pointer; margin-top:7px;'></span>"
                                            },
                                            {
                                                id: "VersiyonMajor", header: [{
                                                    text: currentLang.MajorVersiyon, css: "centerText"
                                                }], css: "centerText", width: 50,

                                            },
                                            {
                                                id: "VersiyonMinor", header: [{
                                                    text: currentLang.MinorVersiyon, css: "centerText"
                                                }], css: "centerText", width: 50,

                                            },
                                            {
                                                id: "DokumanUzantisi", header: [{
                                                    text: currentLang.DokumanUzantisi, css: "centerText"
                                                }], css: "centerText", width: 150,

                                            },
                                            {
                                                id: "Name", header: [{
                                                    text: currentLang.DokumanVersiyonAdi, css: "centerText"
                                                }], css: "centerText", width: 250,
                                                format: function (value) {
                                                    if (value) {
                                                        return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                                                    }
                                                    return "—";
                                                }
                                            },
                                            {
                                                id: "IslemYapan", header: [{
                                                    text: currentLang.IslemYapan, css: "centerText"
                                                }], css: "centerText", width: 150,
                                                format: function (value) {
                                                    if (value) {
                                                        return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                                                    }
                                                    return "—";
                                                }
                                            },
                                            {
                                                id: "OlusturulmaTarihi", header: [{ text: currentLang.OlusturmaTarihi, css: "centerText" }], css: "centerText", width: 125,
                                                template: function (item) {
                                                    if (item.OlusturulmaTarihi) {
                                                        return "<div' data-tooltip='" + webix.Date.jsonDateTimeToStr(item.OlusturulmaTarihi) + "'>" + webix.Date.jsonDateTimeToStr(item.OlusturulmaTarihi) + "</div>";
                                                    }
                                                    return "-";
                                                }

                                            },
                                            {
                                                id: "CheckinNotes", header: [{ text: currentLang.Not, css: "centerText" }], width: 450, css: "centerText",
                                                template: function (item) {
                                                    var checkinNotes = item.CheckinNotes != null ? item.CheckinNotes : "";
                                                    return "<div style='width: 450px; text-overflow: ellipsis !important; overflow:hidden !important; display:inline-block; white-space:nowrap;'  data-tooltip='" + item.CheckinNotes + "'>" + checkinNotes + "</div>";
                                                }


                                            }
                                        ],
                                        onClick: {
                                            "download": function (e, id) {
                                                this.getTopParentView().config.download(id.row);
                                            },
                                        },
                                        on: {
                                            onItemDblClick: function (id, e, node) {
                                                var selectedItem = this.getItem(id);
                                                if (selectedItem && id.column == "CheckinNotes" && selectedItem[id.column]) {
                                                    webix.ui({
                                                        view: "window",
                                                        height: 150,
                                                        width: 450,
                                                        position: "bottom",
                                                        head: {
                                                            view: "toolbar",
                                                            cols: [
                                                                {
                                                                    view: "label", label: "<i style='color:#ffffff;margin-right:2px' class='fas fa-sticky-note aria-hidden='true'></i> " + currentLang.DysCheckinNotu, align: "center"
                                                                },
                                                                {
                                                                    view: "icon", icon: "times-circle",
                                                                    click: function () {
                                                                        var windowObj = this.getTopParentView();
                                                                        windowObj.close();
                                                                    }
                                                                }
                                                            ]
                                                        },
                                                        body: {
                                                            paddingY: 20, paddingX: 30, elementsConfig: {
                                                                labelWidth: 140
                                                            },
                                                            rows: [{
                                                                view: "customtextarea", readonly: true, value: selectedItem.CheckinNotes
                                                            }]
                                                        }
                                                    }).show();
                                                }
                                            }
                                        },
                                        autoheight: true,
                                        autowidth: true
                                    },

                                ]
                            }
                        },
                        {
                            paddingY: 10,
                            cols: [
                                {},
                                {
                                    view: "button", value: currentLang.Karsilastir, width: 100, click: function (a, b, c) {
                                        this.getTopParentView().config.compare();
                                    }
                                }
                            ]
                        }
                    ]
                },
                download: function (id) {
                    if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
                        return false;
                    STBEbys.Webix.ShowProgressBar(window);
                    var dt = GetChildViewsByItemId(window, "dtVersion")[0];
                    var selectedIds = dt.getSelectedId();
                    if ((selectedIds && selectedIds.length == 1) || id) {
                        var docId = dt.getItem(id || selectedIds[0]).DokumanId;
                        document.location.href = FileDownloaderAddress + '?id=' + GenerateEncryptedIdCode(docId);
                    }
                    else if (selectedIds && selectedIds.length > 1) {
                        webix.alert({
                            ok: currentLang.Tamam,
                            type: "alert-warning",
                            text: currentLang.DysDownloadWarn1
                        });
                    }
                    else {
                        webix.alert({
                            ok: currentLang.Tamam,
                            type: "alert-warning",
                            text: currentLang.DysDownloadWarn2
                        });
                    }
                    window.hideProgressBar();

                },
                compare: function () {
                    STBEbys.Webix.ShowProgressBar(window);
                    var dt = GetChildViewsByItemId(window, "dtVersion")[0];
                    var selectedIds = new Array();
                    var dataList = dt.data.getRange();

                    for (var i = 0; i < dataList.length; i++) {
                        if (dataList[i].selected == 'on')
                            selectedIds.push(dataList[i]);
                    }

                    if (selectedIds && selectedIds.length == 2) {
                        if (selectedIds[0].DokumanUzantisi == ".doc" || selectedIds[0].DokumanUzantisi == ".docx") {
                            var docId1 = "";
                            var docId2 = "";
                            //Versiyon karşılaştırmasından major değeri büyük olan docId2, küçük olan docId1 olarak setlenmektedir.
                            //Major değerleri aynı minor değerleri kontrolü yapılır. Minor değeri büyük olan docId2, küçük olan docId1 olarak setlenmektedir.
                            if (selectedIds[0].VersiyonMajor > selectedIds[1].VersiyonMajor) {
                                docId1 = selectedIds[1].Id;
                                docId2 = selectedIds[0].Id;
                            }
                            else if (selectedIds[1].VersiyonMajor > selectedIds[0].VersiyonMajor) {
                                docId1 = selectedIds[0].Id;
                                docId2 = selectedIds[1].Id;
                            }
                            else {
                                if (selectedIds[0].VersiyonMinor > selectedIds[1].VersiyonMinor) {
                                    docId1 = selectedIds[1].Id;
                                    docId2 = selectedIds[0].Id;
                                }
                                else {
                                    docId1 = selectedIds[0].Id;
                                    docId2 = selectedIds[1].Id;
                                }
                            }

                            Di_DYS_DokumanAction.VersiyonlariKarsilastir(docId1, docId2, function (retVal, e) {
                                window.hideProgressBar();
                                if (retVal) {
                                    document.location.href = FileDownloaderAddress + '?decCont=' + retVal;
                                }
                            }, this);
                        }
                        else {
                            STBEbys.Webix.ShowWarning(currentLang.DysVersiyonKarislastirmaWarn3);
                            window.hideProgressBar();
                        }

                    }
                    else {
                        var alertText = currentLang.DysVersiyonKarislastirmaWarn3;
                        if (dataList && dataList.length > 0 && (dataList[0].DokumanUzantisi == ".doc" || dataList[0].DokumanUzantisi == ".docx")) {
                            alertText = currentLang.DysVersiyonKarislastirmaWarn2;
                        }
                        STBEbys.Webix.ShowWarning(alertText);
                        window.hideProgressBar();
                    }

                }
            });

            var dtVersion = GetChildViewsByItemId(window, "dtVersion")[0];
            if (retVal && retVal.length) {
                dtVersion.parse(retVal);

                var dataList = dtVersion.data.getRange();
                for (var i = 0; i < dataList.length; i++) {
                    var signedDoc = retVal.find(function (obj) {
                        return obj.Id == dataList[i].Id;
                    });
                }
                window.show();
            }
            else {
                STBEbys.Webix.ShowWarning(currentLang.DysVersiyonYok);
            }
            fileManager.hideMask();
        }, this);


    },
    convertProject: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.DysProje.ConvertProject(this, id, this.getItem(id).Di_DYS_ProjeId);
    },
    searchFromFolder: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.ContentSearch.ShowSearchWindow(id.replace("f", ""), this.getItem(id).value);
    },
    addFavorites: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.AddFavorites(this, id);
    },
    removeFavorites: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.RemoveFavorites(this, id);
    },
    redirectFolderPath: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.RedirectPath(this, id, "folder");
    },
    redirectFilePath: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.RedirectPath(this, id, "file");
    },
    showFolderPath: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.ShowFolderPath(this, id, "folder");
    },
    showFilePath: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.ShowFolderPath(this, id, "file");
    },
    getProjects: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.DysProje.GetProjects(this, id);
    },
    getActorOrganization: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.GetAktorOrganization(this, id);
    },
    requestOpinion: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true)) {
            return false;
        }

        id = Array.isArray(id) ? id : [id];
        var item = this.getItem(id);
        if (item) {
            if (!item.KlasorMuDokumanMi) {
                /* Klasöre görüş talep ediliyor. */
                STBEbys.Webix.Gorus.ShowRequestWindow(this, id, STBEbys.Webix.GorusBaslatmaKaynagi.Klasor, item.Ad);
            }
            else {
                /* Dokümana görüş talep ediliyor. */
                STBEbys.Webix.Gorus.ShowRequestWindow(this, id, STBEbys.Webix.GorusBaslatmaKaynagi.Dokuman);
            }
        }
    },
    requestCollectiveOpinion: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true)) {
            return false;
        }

        id = Array.isArray(id) ? id : [id];
        var item = this.getItem(id);
        if (item) {
            if (!item.KlasorMuDokumanMi) {
                /* Klasöre görüş talep ediliyor. */
                STBEbys.Webix.Gorus.ShowCollectiveRequestWindow({ fileManager: this, items: id, gorusBaslatmaKaynagi: STBEbys.Webix.GorusBaslatmaKaynagi.Klasor, folderName: item.value });
            }
            else {
                /* Dokümana görüş talep ediliyor. */
                STBEbys.Webix.Gorus.ShowCollectiveRequestWindow({ fileManager: this, items: id, gorusBaslatmaKaynagi: STBEbys.Webix.GorusBaslatmaKaynagi.Dokuman });
            }
        }
    },
    showOpinionHistory: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;

        STBEbys.Webix.Gorus.ShowHistoryWindow(this, id);
    },
    showImages: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.ShowImages(this, id);
    },
    createTaslakBelge: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;

        var fileManager = $$("fmanager");
        fileManager.showMask();

        var selectedItem = fileManager.getItem(id);
        if (!selectedItem) {
            id = STBEbys.Webix.Dys.FileManagerGetIdByRealId(fileManager, id.replace(/\D/g, ""));
            selectedItem = fileManager.getItem(id);
        }
        if (selectedItem.type != "folder") {
            Di_DYS_DokumanAction.DocumentCheckOutWithVersionControl(selectedItem.realId.toString(), function (retVal) {
                fileManager.hideMask();
                if (retVal.IsSucceed && retVal.Result) {
                    selectedItem.IsCheckedOut = 1;
                    STBEbys.Webix.DysTaslak.DysTaslakKaydiOlustur(fileManager, id, retVal.Result.TaslakBelgeId, retVal.Result.DYSSablonId, selectedItem ? selectedItem.$parent.replace(/\D/g, '') : null, retVal.Result.DokumanName, retVal.Result.UstveriPaneliTekSatir,
                        selectedItem ? selectedItem.Ad : null,
                        selectedItem ? selectedItem.DokumanId : null,
                        selectedItem ? selectedItem.type : null);
                }
            });
        }
    },
    createTaslakBelgeDokumansiz: function (id) {
        var fileManager = $$("fmanager")
        var selectedItem = fileManager.getItem(id);

        var clickFn = function () {
            var txtDokumanAdi = GetChildViewsByItemId(this.getTopParentView(), "txtDokumanAdi")[0];

            if (txtDokumanAdi && txtDokumanAdi.getValue() && txtDokumanAdi.getValue().trim()) {
                var documentName = txtDokumanAdi.getValue();

                documentName = documentName.split('.').join("");

                STBEbys.Webix.DysTaslak.DysDokumansizTaslakKaydiOlustur({ fileManager: fileManager, folderId: id, realFolderId: selectedItem.realId, documentName: documentName + ".docx" });
                this.getTopParentView().close();
            }
        }

        webix.ui({
            view: "window",
            position: webix_window_position,
            move: true,
            modal: true,
            width: 500,
            head: {
                view: "toolbar",
                cols: [
                    {
                        view: "label",
                        align: "left",
                        css: { "margin-top": "0px !important" },
                        template: "<i style='color:#ffffff;margin-right:10px;' class='fas fa-play' aria-hidden='true'></i>" + currentLang.DysDokumansizArsivleme
                    },
                    {
                        view: "icon",
                        width: 50,
                        css: { "margin-top": "7px !important" },
                        icon: "times-circle",
                        click: function () {
                            this.getTopParentView().close();
                        }
                    }
                ]
            },
            body: {
                rows: [
                    {
                        view: "template",
                        autoheight: true,
                        template: "<i class='fas fa-info-circle' style='color: #346f81; margin-right: 7px; font-size:18px' aria-hidden='true'></i><span style='color:#346f81'>" + currentLang.DysDokumansizArsivlemeInfo + "</span>"
                    },
                    {
                        view: "text",
                        label: currentLang.DokumanAdi,
                        itemId: "txtDokumanAdi",
                        name: "DokumanAdi",
                        required: true,
                        attributes: { maxlength: 200 },
                        labelWidth: 150,
                        on: {
                            "onEnter": clickFn
                        }
                    },
                    {
                        cols: [
                            {},
                            {
                                view: "button",
                                width: 120,
                                label: currentLang.DevamEt,
                                icon: "play",
                                type: "iconButton",
                                click: clickFn
                            }
                        ]
                    }
                ]
            }
        }).show();
    },
    showTaslakInfos: function (id) {
        var selectedItem = this.getItem(id);

        if (!selectedItem.DYSSablonId || !STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;

        STBEbys.Webix.Dys.ShowTaslakBilgileriWindow(selectedItem.TaslakBelgeId, selectedItem.DYSSablonId, selectedItem.DYSSablonName);
    },
    deleteDysSablonIliski: function (id, cancelAndChooseNew, returnFunc) {
        var selectedItem = this.getItem(id);
        if (!selectedItem.DYSSablonId || !STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;
        var selectedItem = fileManager.getItem(id);

        function DocumentCheckOutWithVersionControl() {
            var favoritesKlasorAltindaMi = STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManager, selectedItem.$parent);
            Di_DYS_DokumanAction.DocumentCheckOutWithVersionControl(selectedItem.realId.toString(), function (retVal) {
                fileManager.hideMask();
                if (retVal.IsSucceed && retVal.Result) {
                    selectedItem.IsCheckedOut = 1;

                    Di_DYS_DokumanAction.RemoveDokumanSablonRelation(selectedItem.realId, function () {

                        STBEbys.Webix.DysTaslak.DeleteDysSablonIliski({
                            window: fileManager,
                            dysSablonName: selectedItem.DYSSablonName,
                            diDysDokumanId: selectedItem.realId,
                            folderId: selectedItem.$parent,
                            cancelAndChooseNew: cancelAndChooseNew,
                            favoritesKlasorAltindaMi: favoritesKlasorAltindaMi
                        }, returnFunc);

                    });
                }
            });
        }


        if (selectedItem.SablonDokumanId && parseInt(selectedItem.SablonDokumanId) > 0) {
            webix.confirm({
                title: currentLang.Dikkat,
                ok: currentLang.Evet,
                cancel: currentLang.Hayir,
                type: "confirm-warning",
                text: currentLang.DysDokumansizArsivlemeIptalUyarisi,
                width: 400,
                callback: function (confirmResult) {
                    if (confirmResult) {
                        DocumentCheckOutWithVersionControl();
                    }
                }
            });
        }
        else {
            DocumentCheckOutWithVersionControl();
        }

    },
    deleteDysSablonIliskiAndCreateNew: function (id) {
        var fileManager = this;
        var selectedItem = fileManager.getItem(id);
        Di_DYS_DokumanAction.DocumentCheckOutWithVersionControl(selectedItem.realId.toString(), function (retVal) {
            fileManager.hideMask();
            if (retVal.IsSucceed && retVal.Result) {
                selectedItem.IsCheckedOut = 1;
                fileManager.deleteDysSablonIliski(id, true, function (retVal) {
                    fileManager.createTaslakBelge(retVal);
                });
            }
        });
    },
    logInfo: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.GetLogInformations({ fileManager: this, itemId: id });
    },
    share: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Shared.OpenShareWindow(this, id);
    },
    generateLink: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.DiDrive.OpenGenerateLinkWindow(id);
    },
    generateLinkHistory: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.DiDrive.ShowDiDriveHistory(id);
    },
    createFastAccessLinkForFolder: function (id) {
        STBEbys.Webix.Dys.GetFastAccessAddress(this, id, "folder");
    },
    createFastAccessLinkForFile: function (id) {
        STBEbys.Webix.Dys.GetFastAccessAddress(this, id, "file");
    },
    changeKvkk: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var selectedItem = this.getItem(id);
        STBEbys.Webix.Dys.ShowKVKKWindow(null, null, function () { }, selectedItem.realId, selectedItem.KvkkMi, true);
    },
    showMetadatas: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var fileManager = this;
        var selectedItem = this.getItem(id);
        STBEbys.Webix.DysDokumanTipiUstVeri.OpenUstVeriPanel(
            {
                dysDokumanTipiId: selectedItem.DYS_DokumanTipiId,
                dysDokumanTipiAdi: selectedItem.DYS_DokumanTipiAdi,
                dysDokumanId: selectedItem.Id,
                dysDokumanName: selectedItem.value,
                canCancel: true,
                saveFunc: function (result) {
                    STBEbys.Webix.ShowProgressBar(fileManager);
                    var metadataList = result && result.length ? result : null;
                    Di_DYS_DokumanAction.SaveDysDokumanMetadata(selectedItem.Id, metadataList, function () {
                        fileManager.hideProgressBar();
                    });
                },
                cancelFunc: function () {
                    STBEbys.Webix.ShowWarning(currentLang.DiDYSDokumanTipiUstveriBulunamadi.format(selectedItem.DYS_DokumanTipiAdi));
                }
            });
    },
    templateCreate: function () {
        var defaultName = currentLang.DysYeniKlasor;
        var fileManager = $$(this.id);
        var currentBranch = fileManager.data.getBranch(fileManager.getCurrentFolder());
        if (currentBranch.length > 0) {
            var itemsWithSameName = currentBranch.filter(function (item) {
                return item.value.indexOf(defaultName) > -1
            });
            for (var i = 0; i < itemsWithSameName.length; i++) {
                var tempDefaultName = defaultName + " (" + (i + 1) + ")";
                if (currentBranch.filter(function (item) { return item.value.indexOf(tempDefaultName) > -1 }).length == 0) {
                    defaultName = tempDefaultName;
                    break;
                }
            }
        }
        return {
            value: defaultName, type: "folder", date: new Date()
        };
    },
    templateIcon: function templateIcon(obj, common) {
        if (obj.KokteMi) {
            return "<div class='webix_fmanager_icon fa-list-ul'></div>";
        }
        else if (obj.Di_DYS_ProjeId) {
            if (obj.ProjeKayitTipi == STBEbys.Webix.RecordType.UI) {
                return "<div class='webix_fmanager_icon fa-folder project_folder_icon UI' title='" + currentLang.Proje + "'></div>";
            }
            else if (obj.ProjeKayitTipi == STBEbys.Webix.RecordType.Integration) {
                return "<div class='webix_fmanager_icon fa-folder project_folder_icon Integration' title='" + currentLang.EntegrasyonIleGelenProje + "'></div>";
            }
        }
        else if (obj.GorusBekleniyorMu) {
            return "<div class='webix_fmanager_icon webix_fmanager_icon_gorus fm-" + (common.icons[obj.type] || common.icons.file) + "' title='" + currentLang.Gorus + "'></div>";
        }
        return "<div class='webix_fmanager_icon fm-" + (common.icons[obj.type] || common.icons.file) + "'></div>";
    },
    opinionReport: function (id) {
        var selectedItem = this.getItem(id);
        STBEbys.Webix.Dys.GetSurecTakipRapolari({
            folderId: id,
            folderName: selectedItem.Ad,
            filemanger: this,
            sayfaUrl: STBEbys.Webix.SurecGorusRaporlariUrllObj.GorusRaporu,
            yetkiUyariMessage: currentLang.GorusRaporYetkiWarning
        });
    },
    contractApproveReport: function (id) {
        var selectedItem = this.getItem(id);
        STBEbys.Webix.Dys.GetSurecTakipRapolari({
            folderId: id,
            folderName: selectedItem.Ad,
            filemanger: this,
            sayfaUrl: STBEbys.Webix.SurecGorusRaporlariUrllObj.SozlesmeOnayRaporu,
            yetkiUyariMessage: currentLang.SozlesmeOnayRaporuYetkiWarning
        });
    },
    contractArchiveReport: function (id) {
        var selectedItem = this.getItem(id);
        STBEbys.Webix.Dys.GetSurecTakipRapolari({
            folderId: id,
            folderName: selectedItem.Ad,
            filemanger: this,
            sayfaUrl: STBEbys.Webix.SurecGorusRaporlariUrllObj.SozlesmeArsivRaporu,
            yetkiUyariMessage: currentLang.SozlesmeArsivRaporuYetkiWarning
        });
    },
    defaultApprovers: function (id) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        STBEbys.Webix.Dys.ShowDefaultApproversWindow({ fileManager: this, id: id });
    },
    webScan: function (id) {

        var fileManager = $$("fmanager")
        var selectedItem = fileManager.getItem(id);

        var clickFn = function () {
            var txtDokumanAdi = GetChildViewsByItemId(this.getTopParentView(), "txtDokumanAdi")[0];

            if (txtDokumanAdi && txtDokumanAdi.getValue() && txtDokumanAdi.getValue().trim()) {
                var documentName = txtDokumanAdi.getValue();
                documentName = documentName.split('.').join("");

                var isDuplicate = fileManager.data.getBranch(selectedItem.id).some(item => item.value == (documentName + ".tiff"));
                if (!isDuplicate) {
                    fileManager.showMask();
                    $('.modal-body').load('../WebScan/Index.html', function () {
                        WebScan.LoadWebScanCall({
                            onLoadFn: function () {
                                $('#webScannerModal').modal({ show: true, backdrop: 'static', keyboard: true });
                                $("#webScanTitle").text(currentLang.WebScan_Title + " (" + documentName + ".tiff)")
                                fileManager.hideMask();
                            },
                            saveFunc: function (byteArrayList, dpi) {
                                if (byteArrayList) {
                                    fileManager.showMask();
                                    Di_DYS_DokumanAction.UploadScannedDocs(byteArrayList, selectedItem.realId, documentName + ".tiff", function (uploadResult) {
                                        STBEbys.Webix.Dys.RefreshFileManagerData(selectedItem.id).then(function () {
                                            fileManager.hideMask();
                                        });
                                    });
                                }
                            },
                            msgNotFoundScanner: currentLang.WebScan_NotFoundScannerMessage,
                            msgNotFoundImage: currentLang.WebScan_NotFoundImageMessage,
                            msgNotFoundClientExe: currentLang.WebScan_NotFoundClientExeMessage,
                            msgNotChoosedScanner: currentLang.WebScan_NotChoosedScannerMessage
                        });
                    });

                    this.getTopParentView().close();

                }
                else {
                    STBEbys.Webix.ShowWarning(currentLang.DysDokumanAyniIsimWarn);
                }
            }
        }

        var wnd = webix.ui({
            view: "window",
            position: webix_window_position,
            move: true,
            modal: true,
            width: 500,
            head: {
                view: "toolbar",
                cols: [
                    {
                        view: "label",
                        align: "left",
                        css: { "margin-top": "0px !important" },
                        template: "<i style='color:#ffffff;margin-right:10px; margin-top:8px;' class='fa fa-print' aria-hidden='true'></i>" + currentLang.WebScan_Title
                    },
                    {
                        view: "icon",
                        width: 50,
                        css: { "margin-top": "2px !important" },
                        icon: "times-circle",
                        click: function () {
                            this.getTopParentView().close();
                        }
                    }
                ]
            },
            body: {
                rows: [
                    {
                        view: "template",
                        autoheight: true,
                        template: "<i class='fas fa-info-circle' style='color: #346f81; margin-right: 7px; font-size:18px' aria-hidden='true'></i><span style='color:#346f81'>" + currentLang.WebScan_DysNameInfo + "</span>"
                    },
                    {
                        view: "text",
                        label: currentLang.DokumanAdi,
                        itemId: "txtDokumanAdi",
                        name: "DokumanAdi",
                        required: true,
                        attributes: { maxlength: 200 },
                        labelWidth: 150,
                        on: {
                            "onEnter": clickFn
                        }
                    },
                    {
                        cols: [
                            {},
                            {
                                view: "button",
                                width: 120,
                                label: currentLang.DevamEt,
                                icon: "play",
                                type: "iconButton",
                                click: clickFn
                            }
                        ]
                    }
                ]
            }
        });

        wnd.show();

        var txtDokumanAdi = GetChildViewsByItemId(wnd, "txtDokumanAdi")[0];
        txtDokumanAdi.focus();
    },
    templateDate: function (obj) {
        var date = obj.date;
        if (typeof (date) != "object") {
            if (typeof (date) == "number") {
                return webix.Date.numberDateTimeToStr(date);
            }
            return webix.Date.jsonDateTimeToStr(date);
        }
        return "—";
    },
    searchColumns: ["DYSNo", "ArsivNo", "DYS_DokumanTipiAdi", "SahibiName", "DYSSablonName", "IslemYapan"],
    handlers: {
        upload: EDASYSRootPath + "/IX/FileManagerHandlers/FmUpload.ashx",
        branch: EDASYSRootPath + "/IX/FileManagerHandlers/FmLoad.ashx",
        create: EDASYSRootPath + "/IX/FileManagerHandlers/FmCreate.ashx",
        copy: EDASYSRootPath + "/IX/FileManagerHandlers/FmCopyMove.ashx",
        move: EDASYSRootPath + "/IX/FileManagerHandlers/FmCopyMove.ashx"
    },
    defaultSelection: function () {
        var fileManager = this;
        Di_DYS_AutoNavigationAction.GetFastAccessFolderList(function (checkForAutoNavigation) {
            if (checkForAutoNavigation != null && checkForAutoNavigation.AutoNavigationFolderList) {
                fileManager.AutoNavigationFolderList = checkForAutoNavigation.AutoNavigationFolderList;
                STBEbys.Webix.Dys.SelectFolderFromTree({ fileManagerTree: fileManager.$$("tree"), selectedFolderId: checkForAutoNavigation.AutoNavigationFolderList.pop() });

                if (checkForAutoNavigation.AutoNavigationDocumentId != null) {
                    var data = fileManager.getItem(checkForAutoNavigation.AutoNavigationDocumentId);
                    fileManager.$$("table").select(checkForAutoNavigation.AutoNavigationDocumentId);
                    fileManager.$$("table").showItem(checkForAutoNavigation.AutoNavigationDocumentId);

                    if (STBEbys.Webix.Dys.CanOpenWithWebDav(fileManager, checkForAutoNavigation.AutoNavigationDocumentId)) {
                        fileManager.customEdit(checkForAutoNavigation.AutoNavigationDocumentId);
                    }
                    else if (checkForAutoNavigation.EnableDownload) {
                        fileManager.download(checkForAutoNavigation.AutoNavigationDocumentId);
                    }
                }

                /*Oto yönlendirme işleminde de bilgi mesajı verilmek istenirse diye eklenmiştir*/
                if (checkForAutoNavigation.MessageToUser != null) {
                    webix.alert({
                        ok: currentLang.Tamam,
                        type: "alert-warning",
                        text: checkForAutoNavigation.MessageToUser
                    });
                }

                return checkForAutoNavigation.AutoNavigationFolderList[checkForAutoNavigation.AutoNavigationFolderList.length - 1];
            }
            else if (checkForAutoNavigation != null && checkForAutoNavigation.MessageToUser != null) {
                webix.alert({
                    ok: currentLang.Tamam,
                    type: "alert-warning",
                    text: checkForAutoNavigation.MessageToUser
                });

                return "root";
            }
            else {
                return "root";
            }
        });
    },
    on: {
        onViewInit: function (name, config) {
            if (name == "table") {
                var columns = config.columns;
                columns.filter(function (x) {
                    return x.id === 'date'
                })[0].fillspace = 1.25;

                var customColumns = [
                    {
                        id: "DYS_DokumanTipiAdi",
                        fillspace: 2,
                        header: { text: currentLang.DiDYSDokumanTipiLabel, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        format: function (value) {
                            if (value) {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }
                    },
                    {
                        id: "onizleButton",
                        itemId: "onizleButton",
                        header: currentLang.Onizleme,
                        width: 70,
                        hidden: false,
                        template: function (obj) {
                            if (obj) {

                                var onizlenebilirIcon = "<div class='onizle' style='cursor:pointer; text-align:center; padding-top: 5px;' title='" + currentLang.Onizle + "' onclick='OpenViewer(event, \"{0}\", \"{1}\", \"{2}\", \"{3}\")' ><span class='material-icons search'></div>";
                                var onizlenemez = "<font size='5'><i class='fa fa-minus-square-o' aria-hidden='true' style='padding-top: 3px; padding-left:17px; text-align:center;' title='{0}' onclick='STBEbys.Webix.ShowWarning(\"{0}\")'></i></font>";

                                if (obj.type == "folder") {
                                    if (parseInt(obj.realId)) {
                                        return onizlenebilirIcon.format(obj.realId, obj.Ad, obj.DokumanId, obj.type);
                                    }
                                    else {
                                        return onizlenemez.format(currentLang.AnlikOnizlemeFolderHataMsg);
                                    }
                                }
                                else {

                                    if (parseInt(obj.realId) && obj.Ad && STBEbys.Webix.SistemParametreleriObject.CevrilebilirDosyaTurleri.includes(obj.Ad.split('.').pop())) {
                                        return onizlenebilirIcon.format(obj.realId, obj.Ad, obj.DokumanId, obj.type);
                                    }
                                    else {
                                        return onizlenemez.format(currentLang.OnIzleHataMsj);
                                    }
                                }
                            }
                            else {
                                return "";
                            }
                        }
                    },
                    {
                        id: "DYSNo",
                        header: { text: currentLang.DysNo, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        width: 80,
                        format: function (value) {
                            if (value) {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }

                    },
                    {
                        id: "ArsivNo",
                        header: { text: currentLang.ArsivNo, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        template: function (obj) {
                            if (obj && obj.ArsivNo && obj.ArsivUrl) {
                                return "<a style=\" border-bottom-style: solid; border-bottom-width: 1px; color: #50749E; padding-left: 2px;\" title=\""
                                    + obj.ArsivNo
                                    + "\" href=\"" + obj.ArsivUrl + "\" target=\"_blank\" \">"
                                    + obj.ArsivNo + "</a>";
                            }
                            return "—";

                        }
                    },
                    {
                        id: "SahibiName",
                        header: currentLang.Sahibi,
                        fillspace: 2,
                        header: { text: currentLang.Sahibi, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        fillspace: 2,
                        format: function (value) {
                            if (value) {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }
                    },
                    {
                        id: "DYSSablonName",
                        header: currentLang.DysDokumanTipi,
                        fillspace: 2,
                        header: { text: currentLang.DysDokumanTipi, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        fillspace: 2,
                        format: function (value) {
                            if (value) {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }
                    },
                    {
                        id: "MajorVersiyon",
                        header: { text: "Major", css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        width: 50,
                        format: function (value) {
                            if (value || value == "0") {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }
                    },
                    {
                        id: "MinorVersiyon",
                        header: { text: "Minor", css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        width: 50,
                        format: function (value) {
                            if (value || value == "0") {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }

                    },
                    {
                        id: "IslemYapan",
                        header: currentLang.IslemYapan,
                        fillspace: 2,
                        header: { text: currentLang.IslemYapan, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        fillspace: 2,
                        format: function (value) {
                            if (value) {
                                return "<div data-tooltip='" + (value.length > 50 ? value.substring(0, 50) + "..." : value) + "'>" + value + "</div>";
                            }
                            return "—";
                        }
                    },
                    {
                        id: "PaylasimTarihi",
                        header: { text: currentLang.PaylasimTarihi, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        hidden: true,
                        width: 120,
                        template: function (obj) {
                            if (obj && obj.PaylasimTarihi)
                                return "<span title='" + webix.Date.jsonDateTimeToStr(obj.PaylasimTarihi) + "'>" + webix.Date.jsonDateTimeToStr(obj.PaylasimTarihi) + "</span>";
                            return "—";
                        }
                    },
                    {
                        id: "BaslangicTarihi",
                        header: { text: currentLang.BaslangicTarihi, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        hidden: true,
                        width: 80,
                        template: function (obj) {
                            if (obj && obj.BaslangicTarihi)
                                return "<span title='" + webix.Date.jsonDateToStr(obj.BaslangicTarihi) + "'>" + webix.Date.jsonDateToStr(obj.BaslangicTarihi) + "</span>";
                            return "—";
                        }
                    },
                    {
                        id: "BitisTarihi",
                        header: { text: currentLang.BitisTarihi, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        hidden: true,
                        width: 80,
                        template: function (obj) {
                            if (obj && obj.BitisTarihi)
                                return "<span title='" + webix.Date.jsonDateToStr(obj.BitisTarihi) + "'>" + webix.Date.jsonDateToStr(obj.BitisTarihi) + "</span>";
                            return "—";
                        }
                    },
                    {
                        id: "PaylasanAktorName",
                        header: { text: currentLang.Paylasan, css: { 'text-align': 'center' } },
                        css: { 'text-align': 'center' },
                        hidden: true,
                        width: 120,
                        template: function (obj) {
                            if (obj && obj.PaylasanAktorName)
                                return "<span title='" + obj.PaylasanAktorName + "'>" + obj.PaylasanAktorName + "</span>";
                            return "—";
                        }
                    },
                    {
                        header: "",
                        css: { 'text-align': 'center' },
                        width: 30,
                        template: function (obj) {
                            if (obj && obj.type != "folder") {
                                if (obj.IsCheckedOut || ((obj.DYSSablonName) && !(obj.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor"))))
                                    return "<span class='fa fa-lock' style='color:#e06969; margin-top: 8px;' title='" + currentLang.Kilitli + "'></span>";
                                return "<span class='fa fa-unlock-alt' style='color:#4cbd39; margin-top: 8px;' title='" + currentLang.KilitliDegil + "'></span>";
                            }

                            return "—";
                        }
                    },
                    {
                        header: "",
                        css: { 'text-align': 'center' },
                        width: 30,
                        template: function (obj) {
                            if (obj) {
                                if (obj.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesiyor"))
                                    return "<span class='fas fa-hourglass-half' style='color:#efc241;' title='" + STBEbys.Webix.GetEnumText("STBEbys.Common.DiDYSDokumanDurumu", obj.Durumu) + "'></span>";
                                else if (obj.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesti"))
                                    return "<span class='fas fa-file-text-o' style='color:#0aa915;' title='" + STBEbys.Webix.GetEnumText("STBEbys.Common.DiDYSDokumanDurumu", obj.Durumu) + "'></span>";
                                else if (obj.DYSSablonId || obj.TaslakBelgeId) {
                                    var tooltipText = STBEbys.Webix.GetEnumText("STBEbys.Common.DiDYSDokumanDurumu", STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor"));
                                    return "<span class='fas fa-pencil-square-o' style='color:#e06969;' title='" + tooltipText + "'></span>";
                                }
                            }

                            return "—";
                        }
                    },
                    {
                        header: "",
                        id: "DokumanPaylasimdaMi",
                        css: { 'text-align': 'center' },
                        width: 30,
                        template: function (obj) {
                            if (obj) {
                                if (obj.DokumanPaylasimdaMi)
                                    return "<span class='fas fa-share-alt' style='color:#66BB6A;' title='" + currentLang.DokumanPaylasimda + "'></span>";
                            }

                            return "—";
                        }
                    }
                ];

                for (var i = 0; i < customColumns.length; i++) {
                    columns.push(customColumns[i]);
                }
            }
        },
        onBeforeRequest: function (url, folder) {
            var fileManager = this;
            fileManager.showMask();
        },
        onSuccessResponse: function (data, response) {
            var fileManager = this;
            if (response && response.State == 2 && response.Message) {
                webix.alert({
                    ok: currentLang.Tamam,
                    type: "alert-warning",
                    text: response.Message
                });
                var res = data.source.split(",");
                var ustKlasorId = null;
                if (fileManager.getItem(res[0])) {
                    var ustKlasorId = fileManager.getItem(res[0]).UstKlasorId;
                    for (var i = 0; i < res.length; i++) {
                        if (fileManager.getItem(res[i]))
                            fileManager.deleteFile(res[i]);
                    }
                    ustKlasorId = ustKlasorId.toString().indexOf("f") >= 0 ? ustKlasorId.toString() : "f" + ustKlasorId.toString();
                }
                else if (fileManager.getItem(data.id)) {
                    ustKlasorId = fileManager.getItem(data.id).UstKlasorId;
                    fileManager.deleteFile(data.id);
                }

                if (ustKlasorId && fileManager.getItem(ustKlasorId)) {
                    STBEbys.Webix.Dys.RefreshFileManagerData(ustKlasorId).then(function () {
                        fileManager.hideMask();
                    });
                }

            }
            var arr = new Array();
            if (data.action == "copy" || data.action == "move" || data.action == "create") {
                if (data.action == "move" || data.action == "copy") {
                    for (var property in fileManager.data.pull) {
                        if (property > 0 && property != DmsSettings.RootKlasorId) {
                            arr.push(property);
                        }
                    }

                    for (var i = 0; i < arr.length; i++) {
                        if (fileManager.getItem(arr[i]))
                            fileManager.deleteFile(arr[i]);
                    }
                }

                var oldId = data.id;


                STBEbys.Webix.Dys.RefreshFileManagerData(data.target).then(function () {
                    fileManager.hideMask();
                    if (data.action == "create") {
                        if (fileManager.getItem(oldId)) {
                            fileManager.deleteFile(oldId);
                        }

                        const myFileBranch = fileManager.data.getBranch(data.target)
                        const createdFolder = myFileBranch.filter((file) => file.value == data.value)[0];

                        fileManager.$$("table").select(createdFolder.id);
                        fileManager.editFile(STBEbys.Webix.Dys.FileManagerGetIdByRealId(fileManager, response.id.replace(/\D/g, "")));
                    }
                });

                if (fileManager.movedItemsSizeAsByteFromPersonelFolder != null &&
                    fileManager.movedItemsSizeAsByteFromPersonelFolder != 0 &&
                    fileManager.PersonelFolderUsageInfo != null) {
                    fileManager.PersonelFolderUsageInfo.CurrentSizeAsByte -= fileManager.movedItemsSizeAsByteFromPersonelFolder;
                    fileManager.movedItemsFromPersonelFolder = null;
                }
            }
            else {
                fileManager.hideMask();
            }
            fileManager.refreshCursor();
        },
        onAfterDeleteFile: function (a, b, c) {
            //this.hideMask();
        },
        onAfterEditStop: function (a, b, c) {
            if (b.old != b.value) {
                var fileManager = this;
                fileManager.showMask();
                var folderId = this.getCurrentFolder();
                var realFolderId = folderId.replace(/\D/g, '');
                var itemId = a.replace(/\D/g, '');
                if (this.getItem(a).type != "folder") {
                    Di_DYS_DokumanAction.KontrolDokumanCheckOut(itemId, function (retVal) {



                        if (retVal) {
                            if (b.value && b.value.trim()) {
                                Di_DYS_DokumanAction.RefreshName(itemId, b.value, function (res, y) {
                                    fileManager.hideMask();
                                    if (!res) {
                                        STBEbys.Webix.Dys.RefreshFileManagerData(fileManager.getItem(a).$parent).then(function () {
                                            fileManager.hideMask();
                                            STBEbys.Webix.ShowWarning(currentLang.DysDosyaRenameWarn);
                                        });
                                    }
                                    else {
                                        webix.message({
                                            text: currentLang.DysDosyaRenameInfo.format(b.old, b.value),
                                            type: "info",
                                            expire: 4000
                                        });
                                    }
                                }, this);
                            }
                            else {
                                STBEbys.Webix.Dys.RefreshFileManagerData(fileManager.getItem(a).$parent).then(function () {
                                    fileManager.hideMask();

                                    STBEbys.Webix.ShowWarning(currentLang.DokumanAdiBosBırakılamaz);
                                });
                            }
                        }
                        else {
                            fileManager.hideMask();
                            return false;
                        }



                    });
                }
                else {
                    var oldValue = fileManager.getItem(a).Ad;
                    var parentId = this.getItem(a).$parent.replace(/\D/g, '');
                    Di_DYS_KlasorAction.KontrolDysKlasorGuncellemeYetkisi(itemId, function (retValYetki) {
                        if (retValYetki) {
                            if (b.value && b.value.trim) {
                                Di_DYS_KlasorAction.RefreshName(itemId, b.value, function (res, y) {
                                    if (!res) {
                                        STBEbys.Webix.Dys.RefreshFileManagerData(fileManager.getItem(a).$parent).then(function () {
                                            fileManager.hideMask();

                                            STBEbys.Webix.ShowMessage({
                                                text: currentLang.DysKlasorRenameWarn
                                            });
                                        });
                                    }
                                    else {
                                        fileManager.hideMask();
                                        STBEbys.Webix.ShowMessage({
                                            text: currentLang.DysKlasorRenameInfo.format(b.old, b.value)
                                        });
                                    }
                                }, this);
                            }
                            else {
                                STBEbys.Webix.Dys.RefreshFileManagerData(fileManager.getItem(a).$parent).then(function () {
                                    fileManager.hideMask();

                                    STBEbys.Webix.ShowWarning(currentLang.KlasorAdiBosBirakilamaz);
                                });
                            }
                        }
                        else {
                            STBEbys.Webix.Dys.RefreshFileManagerData(fileManager.getItem(a).$parent).then(function () {
                                fileManager.hideMask();
                            });
                        }

                    });
                }
            }
        },
        onBeforeFileUpload: function (a, b, c) {

            var filemanager = this;
            var folderId = this.getCurrentFolder() ? this.getCurrentFolder() : this.getCursor();
            //var generatedLink = ""; zaten erişim izni bulunmadığı için güncelleme sayfa yenileme ile yapıldı. bu nedenle bu kısım kullanılmadı.bulunduğu sayfada kalsın dönüşü olursa durum bu şekilde izah edilebilir.
            //Di_DYS_AutoNavigationAction.CreateFastAccessLink("folder", folderId, function (retVal) {
            //    generatedLink = retVal.Result;
            //});
         
           
            if (folderId == DmsSettings.RootKlasorId.toString() || folderId == 'personallikes')
                return false;


            if (uygunKlasorMu == false) {
                if (yetkiVarMi == false) {                
                    webix.alert({
                        ok: currentLang.Tamam,
                        type: "alert-warning",
                        text: currentLang.DysKlasorYetkiUyarisi,
                        title: currentLang.DysKlasorYetkiUyarisiTitle,
                        callback: function (result) {
                            if (result) {                            
                                // window.location.href = generatedLink; bu linke zaten erişim izni bulunmadığı için güncelleme sayfa yenileme ile yapıldı. 
                                window.location.href=window.location.href;                              
                            }
                        }
                    });
                    yetkiVarMi = true;
                    return false;
                }
                else {
                    return false;
                }
            }


            this.showMask();


            STBEbys.Webix.Dys.UploadProgressWindow.define("height", STBEbys.Webix.Dys.UploadProgressWindow.$height + 40);
            STBEbys.Webix.Dys.UploadProgressWindow.resize();
            $$("progressListId").add({ name: a.name, status: a.status, sizetext: a.sizetext, percent: 0 });
            $$("progressListId").refresh();
            STBEbys.Webix.Dys.UploadProgressWindow.show();
            this.hideMask();
            folderPath = a.name.includes("/") ? a.name.substring(0, a.name.lastIndexOf("/")) : "";
            if (folderPath) {
                var klasorId = 0;
                if (folderId.startsWith("l"))
                    //klasorId = RegExp.Replace(folderId, "[a-zA-Z]", "");
                    klasorId = parseInt(filemanager.getItem(folderId).realId);
                else
                    klasorId = folderId.replace("f", "");
                Di_DYS_KlasorAction.IX_SaveYeniKlasorRecursive(folderPath, "silk-folder", klasorId, function (retValue) {
                    if (retValue != null)
                        STBEbys.Webix.Dys.ReadBlobFromFile(filemanager, a.file, 0, parseInt(ChunkSize), 1, retValue, STBEbys.Webix.Dys.GenerateGuid() + "_" + a.file.name, 0);
                    else
                        STBEbys.Webix.Dys.UploadProgressWindow.hide();
                });
            }
            else
                STBEbys.Webix.Dys.ReadBlobFromFile(filemanager, a.file, 0, parseInt(ChunkSize), 1, folderId, STBEbys.Webix.Dys.GenerateGuid() + "_" + a.file.name, 0);

            return false;

        },
        onBeforePasteFile: function (a, b, c) {
            var fileManager = this;
            fileManager.movedItemsSizeAsByteFromPersonelFolder = null;
            var activeItem = fileManager.getItem(a);
            if (activeItem && activeItem.type == "folder") {
                if (fileManager._copyFiles || fileManager._moveData) {
                    if (fileManager._moveData && fileManager._moveData.length > 0) {
                        //hedef klasör kaynak klasörün alt klasörü ise veya klasör kendi kendine kopyalanmaya çalışıldıysa:
                        if (fileManager._moveData[0] == activeItem.id || fileManager.getItem(activeItem.id).$parent == fileManager._moveData[0]) {
                            fileManager.getMenu().hide();
                            webix.alert({
                                ok: currentLang.Tamam,
                                type: "alert-warning",
                                text: currentLang.DysKlasorKopyalamaHatasi,
                                title: currentLang.DysKlasorKopyalamaHatasiTitle
                            });
                            return false;
                        }



                        var moveDataKurumsalAltindaMi = STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(this, fileManager._moveData[0]);
                        var targetFolderKisiselAltindaMi = STBEbys.Webix.Dys.KisiselKlasorAltindaMi(this, activeItem.id);
                        if (moveDataKurumsalAltindaMi && targetFolderKisiselAltindaMi) { //Kurumsal kırılımından hiç bir doküman Kişisel kırılımına kopyalanamaz
                            fileManager.getMenu().hide();
                            return false;
                        }
                        else {
                            if (!fileManager._copyFiles && fileManager._moveData &&
                                STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, fileManager.getItem(fileManager._moveData[0]).$parent)) {
                                fileManager.movedItemsSizeAsByteFromPersonelFolder = 0;
                                for (var i = 0; i < fileManager._moveData.length; i++) {
                                    fileManager.movedItemsSizeAsByteFromPersonelFolder += fileManager.getItem(fileManager._moveData[i]).Boyut;
                                }
                            }
                        }

                        if (!fileManager.data.branch[a]) {
                            //Webix FileManager'ın bugını gidermek için eklendi. Eğer bir klasörün altında bir item yoksa branch içerisinde görünmüyor.
                            //Copy ya da cut yaparken brancha baktığı için branch içerisinde klasörü bulamadığı zaman kopyalamaya izin vermiyor.
                            //Bu yüzden filemanagerı aldatmak için, yapıştırma işlemi öncesinde brancha işlem yapılacak klasör eklendi.
                            //Filemanager yeni versiyonlarında bu bugı çözmüş.
                            fileManager.data.branch[a] = new Array();
                        }
                    }

                    fileManager.showMask();
                }
            }
        },
        onBeforeDrag: function (context, ev) {
            var parent = this.getItem(context.start).$parent;
            parent = parent ? parent.replace("f", "") : parent;
            if (this.getItem(context.start).id == DmsSettings.RootKlasorId.toString() || parent == DmsSettings.RootKlasorId.toString() || parent == DmsSettings.KurumsalKlasorId)
                return false;
            else if (parent.indexOf("s") > -1) //Paylaşılanlar kırılımından hiç bir doküman taşınamaz
                return false;
            else if (parent.indexOf("l") > -1) //Sık Kullanılanlar kırılımından hiç bir doküman taşınamaz
                return false;
            else if (this.getItem(context.start).KokteMi)
                return false;
        },
        onBeforeDrop: function (a, b, c) {
            var target = a.target && a.target.indexOf ? a.target : a.target.row;//Birden fazla kayıt sürüklenirse nesne tipinde geliyor.

            if (!target) {
                return false;
            }
            else if (target.indexOf("s") > -1) //Paylaşılanlar kırılımına hiç bir doküman taşınamaz
                return false;
            else if (target.indexOf("l") > -1) //Sık Kullanılanlar kırılımına hiç bir doküman taşınamaz
                return false;
            else if (STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(this, this.getItem(a.start).$parent) && STBEbys.Webix.Dys.KisiselKlasorAltindaMi(this, target)) //Kurumsal kırılımından hiç bir doküman Kişisel kırılımına taşınamaz
                return false;

            var fileManager = this;
            fileManager.showMask();
        },
        onFolderSelect: function (id) {
            if (STBEbys.Webix.Dys.SharedKlasorAltindaMi(this, id)) {
                if (this.$$("table").isColumnVisible("MajorVersiyon"))
                    this.$$("table").hideColumn("MajorVersiyon");
                if (this.$$("table").isColumnVisible("MinorVersiyon"))
                    this.$$("table").hideColumn("MinorVersiyon");

                if (!this.$$("table").isColumnVisible("PaylasimTarihi"))
                    this.$$("table").showColumn("PaylasimTarihi");
                if (!this.$$("table").isColumnVisible("BaslangicTarihi"))
                    this.$$("table").showColumn("BaslangicTarihi");
                if (!this.$$("table").isColumnVisible("BitisTarihi"))
                    this.$$("table").showColumn("BitisTarihi");
                if (!this.$$("table").isColumnVisible("PaylasanAktorName"))
                    this.$$("table").showColumn("PaylasanAktorName");

                STBEbys.Webix.Dys.FileManager.ShowOrHideSaveLastOpenedFolderIdButton({ fileManager: this, paylasilanKlasorAltindaMi: true, folderId: id });
            }
            else {
                if (!this.$$("table").isColumnVisible("MajorVersiyon"))
                    this.$$("table").showColumn("MajorVersiyon");
                if (!this.$$("table").isColumnVisible("MinorVersiyon"))
                    this.$$("table").showColumn("MinorVersiyon");

                if (this.$$("table").isColumnVisible("PaylasimTarihi"))
                    this.$$("table").hideColumn("PaylasimTarihi");
                if (this.$$("table").isColumnVisible("BaslangicTarihi"))
                    this.$$("table").hideColumn("BaslangicTarihi");
                if (this.$$("table").isColumnVisible("BitisTarihi"))
                    this.$$("table").hideColumn("BitisTarihi");
                if (this.$$("table").isColumnVisible("PaylasanAktorName"))
                    this.$$("table").hideColumn("PaylasanAktorName");

                STBEbys.Webix.Dys.FileManager.ShowOrHideSaveLastOpenedFolderIdButton({ fileManager: this, paylasilanKlasorAltindaMi: false, folderId: id });
            }

            if (STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(this, id)) {
                if (!this.$$("table").isColumnVisible("DokumanPaylasimdaMi"))
                    this.$$("table").showColumn("DokumanPaylasimdaMi");
            }
            else {
                if (this.$$("table").isColumnVisible("DokumanPaylasimdaMi"))
                    this.$$("table").hideColumn("DokumanPaylasimdaMi");
            }

            /*
             * Kişisel klasör id değeri tespit edilerek.
             * Kişisel klasör içerisinde boyut hesaplaması gerçekleşecektir.
            */
            var kisiselKlasorId = STBEbys.Webix.Dys.GetKisiselKlasorRootId(this, id);
            if (kisiselKlasorId) {
                STBEbys.Webix.Dys.ShowOrHideFolderInfoControl(this, kisiselKlasorId, true, null);
            }
            else {
                STBEbys.Webix.Dys.ShowOrHideFolderInfoControl(this, id, true, null);
            }
            this.refreshCursor();
        },
        onBeforeRun: function (id) {
            if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
                return false;
            if (STBEbys.Webix.Dys.CanOpenWithWebDav(this, id)) {
                this.customEdit(id);
                return false;
            }
        },
        onBeforeDynParse: function (a, b, c) {

            if (a.realId != null && a.realId != "personallikes") {

                Di_DYS_DokumanAction.KontrolKlasoreDokumanEklemeYetkisi(a.realId, false, function (retVal) {
                    if (retVal) {
                        uygunKlasorMu = true;
                    }
                    else {
                        uygunKlasorMu = false;
                    }
                });
            }
            if (a.id == DmsSettings.RootKlasorId.toString() && window.navigator.userAgent.indexOf("MSIE ") > 0) {
                //Internet explorerda bir kullanıcı ile DYS sayfasına giriş yapıp daha sonra başka bir kullanıcı ile login olunduğunda önceki kullanıcıya ait Kişisel klasör root altında görünmeye devam etmekteydi. 
                //Bu yüzden root klasör için data çekildi ise data filemanagera parse edilmeden önce filemanager itemlarını temizliyoruz.
                var fileManager = $$("fmanager");
                fileManager.clearAll();
            }
        },
        onAfterLevelUp: function () {
            STBEbys.Webix.Dys.FileManager.SetCurrentFolderId({ fileManager: this });
        },
        onAfterBack: function () {
            STBEbys.Webix.Dys.FileManager.SetCurrentFolderId({ fileManager: this });
        },
        onAfterForward: function () {
            STBEbys.Webix.Dys.FileManager.SetCurrentFolderId({ fileManager: this });
        },
        onAfterPathClick: function () {
            STBEbys.Webix.Dys.FileManager.SetCurrentFolderId({ fileManager: this });
        }
    },
    sign: function (id) {
        var EImzaWindow = this.getTopParentView();
        var fileManager = this;
        var selected = $$("fmanager").getItem(id);
        if (selected == null || fileManager == null || EImzaWindow == null)
            return false;
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;

        // Internet Explorer 6-11
        var isIE = !!document.documentMode;
        if (!isIE) {
            STBEbys.Webix.ShowProgressBar(fileManager);
            Di_DYS_DokumanAction.KontrolKlasoreDokumanEklemeYetkisi(selected.$parent.replace("f", ""), false, function (retVal) {

                if (retVal) {
                    if (selected.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesiyor")) {
                        STBEbys.Webix.ShowWarning(currentLang.ImzaYetkiUyariBelge)
                    }
                    else if (selected.IsCheckedOut && STBEbys.Webix.CurrentAktorInfo.AktorId != selected.SahibiId) {
                        STBEbys.Webix.ShowWarning(currentLang.ImzaYetkiUyariSahibi)
                    }
                    else if (selected.IsCheckedOut && selected.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Hazirlaniyor")) {
                        STBEbys.Webix.ShowWarning(currentLang.ImzaYetkiUyariHazir)
                    }
                    else if (selected.Durumu == STBEbys.Webix.GetEnumValue("STBEbys.Common.DiDYSDokumanDurumu.Belgelesti")) {
                        STBEbys.Webix.ShowWarning(currentLang.ImzaYetkiUyariArsiv)
                    }
                    else {
                        STBEbys.Webix.EsyaSigner.ShowEsyaSignWindowFromDMS(fileManager, EImzaWindow, id)
                    }
                }
                else {
                    webix.alert({
                        ok: currentLang.Tamam,
                        type: "alert-warning",
                        text: currentLang.DysDokumanEklemeYetkisiYok
                    });
                }
                fileManager.hideProgressBar();
            });
        }
        else {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: currentLang.ElektronikImzaInternetExplorer
            });
        }
    },
    showSignHistory: function (id) {
        var selected = $$("fmanager").getItem(id);
        if (selected == null)
            return false;
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(id, true))
            return false;
        var EImzaWindow = this.getTopParentView();
        STBEbys.Webix.EsyaSigner.ShowSignHistoryWindow(this, EImzaWindow, id);
    }
};

STBEbys.Webix.Dys.FileManagerToolbarContextMenuView = null;
STBEbys.Webix.Dys.FileManagerToolbarContextMenu = {
    view: "submenu",
    width: 150,
    padding: 5,
    data: [
        {
            id: "paste", icon: "paste", value: currentLang.Yapistir
        },
        {
            $template: "Separator"
        },
        {
            id: "createFolder", icon: "folder", value: currentLang.KlasorOlustur
        },
        {
            id: "upload", icon: "upload", value: currentLang.Yukle
        }
    ],
    template: "<span class='webix_fmanager_icon fm-#icon#' style='color:#8a8a8a'></span>#value#",
    on: {
        onBeforeShow: function (id) {
            var fileManagerView = $$("fmanager");
            var activeItemId = fileManagerView.getActive();

            //Root klasör, Kurumsal klasörü ve Paylaşılanlar kırılımı altında menü görünmesin
            if (activeItemId == DmsSettings.RootKlasorId.toString() || activeItemId == "f" + DmsSettings.KurumsalKlasorId || activeItemId == "shared" || activeItemId.indexOf("s") > -1)
                return false;

            return true;
        },
        onMenuItemClick: function (id) {
            var fileManagerView = $$("fmanager");
            var activeItemId = fileManagerView.getActive();

            if (id == "paste") {
                fileManagerView.pasteFile(activeItemId);
            }
            else if (id == "createFolder") {
                fileManagerView.createFolder(activeItemId);
            }
            else if (id == "upload") {
                fileManagerView.uploadFile(activeItemId);
            }
            this.hide();
        }
    }
};

STBEbys.Webix.GetFileExtension = function (fileName) {
    return fileName.substr((fileName.lastIndexOf('.') + 1));
}
STBEbys.Webix.Dys.UploadProgressWindow;

webix.ready(function () {
    var mainView = $$("mainView");
    mainView.addView(STBEbys.Webix.Dys.FolderInfo, 0);
    mainView.addView(STBEbys.Webix.Dys.FileManager, 0);

    STBEbys.Webix.Dys.FileManagerToolbarContextMenuView = webix.ui(STBEbys.Webix.Dys.FileManagerToolbarContextMenu);

    STBEbys.Webix.Dys.UploadProgressWindow = webix.ui({
        view: "window",
        id: "wndprogress",
        position: "center",
        headHeight: 16,
        width: 700,
        height: 25,
        //autoHeight: true,
        //maxHeight: 500,
        scroll: false,
        modal: true,
        body: {
            view: "list", id: "progressListId", type: "progressUploader", minHeight: 20, maxHeight: 200, css: "progressList", scroll: true
        }
    });

    var setLastOpenedFolderIdButton = {
        view: "icon",
        icon: "fas fa-folder-o",
        hidden: !DmsSettings.ShowLastOpenedFolderIdButton,
        itemId: "setLastOpenedFolderIdButtonItemId",
        selected: false,
        isActive: DmsSettings.ActiveLastOpenedFolderIdButton,
        tooltip: currentLang.SonAcilanKlasoreDonInfo,
        click: function () {
            var iconItem = this;
            webix.confirm({
                title: currentLang.Dikkat,
                ok: currentLang.Evet,
                cancel: currentLang.Hayir,
                type: "confirm-warning",
                text: iconItem.config.isActive ? currentLang.SonAcilanSayfayaDonPasiflestirmeOnaySorusu : currentLang.SonAcilanSayfayaDonAktiflestirmeOnaySorusu,
                width: 400,
                callback: function (confirmResult) {
                    if (confirmResult) {
                        var fileManager = $$("fmanager");
                        fileManager.showMask();
                        iconItem.config.icon = iconItem.config.isActive ? "fas fa-folder-o" : "fas fa-folder";
                        iconItem.config.selected = iconItem.config.isActive ? false : true;
                        Di_DYS_KlasorAction.SetDYSLastOpenedKlasorId(iconItem.config.isActive ? null : fileManager.getCurrentFolder().replace("f", ""), function () {
                        }).then(function () {
                            STBEbys.Webix.ShowMessage({ text: iconItem.config.isActive ? currentLang.SonAcilanSayfayaDonPasiflestirildi : currentLang.SonAcilanSayfayaDonAktiflestirildi, type: "info", expire: 4000 });
                            iconItem.config.isActive = !(iconItem.config.isActive);
                            iconItem.refresh();
                            fileManager.hideMask();
                        });
                    }
                }
            });
        }
    }

    var refreshButton = {
        view: "icon",
        icon: "refresh",
        css: "fileManager_refresh_icon",
        click: function () {
            var fileManager = $$("fmanager");
            fileManager.showMask();
            var folderId = fileManager.getCurrentFolder() ? fileManager.getCurrentFolder() : fileManager.getCursor();
            if (folderId) {
                STBEbys.Webix.Dys.RefreshFileManagerData(folderId).then(function () {
                    //Kişisel klasör altında herhangi bir dosya içinde yenileme yapıldığı zaman klasör boyutu değil kişisel klasörün boyutu gösterilmesi gerekmektedir.
                    var kisiselKlasorId = STBEbys.Webix.Dys.GetKisiselKlasorRootId(fileManager, folderId);
                    if (kisiselKlasorId) {
                        folderId = kisiselKlasorId;
                    }

                    if (STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, folderId)) {
                        STBEbys.Webix.Dys.ShowOrHideFolderInfoControl(fileManager, folderId, true, null);
                    }

                    fileManager.hideMask();
                });
            }
            else {
                fileManager.hideMask();
            }
        }
    }

    var contentSearchButton = {
        view: "icon",
        icon: "search-plus",
        css: "fileManager_content_search_icon",
        click: function () {
            var fileManagerView = $$("fmanager");
            var activeItemId = fileManagerView.getActive();
            var activeFolderId = null;
            if (activeItemId != DmsSettings.RootKlasorId
                && (
                    STBEbys.Webix.Dys.SharedKlasorAltindaMi(fileManagerView, fileManagerView.getItem(activeItemId).$parent)
                    || activeItemId == "shared"
                    || STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManagerView, fileManagerView.getItem(activeItemId).$parent)
                    || activeItemId == "personallikes")) {

                STBEbys.Webix.ShowWarning(currentLang.SharedFolderWarning);
                return;
            }

            if (fileManagerView.getItem(activeItemId).KlasorMuDokumanMi) //dokuman ise bir üst folder alınır.
            {
                activeFolderId = fileManagerView.getItem(activeItemId).$parent;
            }
            else {
                activeFolderId = activeItemId;
            }

            STBEbys.Webix.ContentSearch.ShowSearchWindow(activeFolderId.replace(/\D/g, ''), fileManagerView.getItem(activeFolderId).value);
        }
    }

    $$("fmanager").getChildViews()[0].addView(setLastOpenedFolderIdButton, $$("fmanager").getChildViews()[0].getChildViews().length);
    $$("fmanager").getChildViews()[0].addView(refreshButton, $$("fmanager").getChildViews()[0].getChildViews().length);
    $$("fmanager").getChildViews()[0].addView(contentSearchButton, $$("fmanager").getChildViews()[0].getChildViews().length);

    var contextMenuButton = {
        view: "icon",
        icon: "angle-double-down",
        css: "fileManager_refresh_icon",
        click: function () {
            if (STBEbys.Webix.Dys.FileManagerToolbarContextMenuView != null)
                STBEbys.Webix.Dys.FileManagerToolbarContextMenuView.show(this.$view);
        }
    }

    $$("fmanager").getChildViews()[0].addView(contextMenuButton, $$("fmanager").getChildViews()[0].getChildViews().length);

    Di_DYS_KlasorAction.DefaultKlasorOlusturma(function (retValue) {
        $$("fmanager").load(EDASYSRootPath + "/IX/FileManagerHandlers/FmLoad.ashx", function () {
            $$("fmanager").setCursor(DmsSettings.RootKlasorId.toString());
        },
            {
                source: DmsSettings.RootKlasorId.toString()
            });
    });
    if ($$("fmanager").getUploader()._settings)
        $$("fmanager").getUploader()._settings.link = 'progressListId';
    $$("fmanager").getUploader().link_setter("progressListId");
});

STBEbys.Webix.Dys.OrganizationChart = {
    view: "organogram",
    itemId: "organizationChart",
    select: true,
    borderless: true,
    type: {
        width: 150
    }
};

STBEbys.Webix.Dys.OrganizationWindow = {
    view: "window",
    itemId: "organizationWindow",
    fileManager: null,
    folderId: null,
    fullscreen: true,
    head: {
        view: "toolbar",
        cols: [
            { view: "label", label: currentLang.OrganizasyonBilgisi, align: 'left' },
            {
                view: "icon",
                icon: "times-circle",
                click: function () {
                    this.getTopParentView().close();
                }
            }
        ]
    },
    position: "center",
    modal: true,
    body: {
        cols: [STBEbys.Webix.Dys.OrganizationChart]
    }
};

STBEbys.Webix.Dys.GetAktorOrganization = function (fileManager, folderId) {
    fileManager.showMask();
    var window = webix.ui(webix.copy(STBEbys.Webix.Dys.OrganizationWindow));
    var organization = GetChildViewsByItemId(window, "organizationChart")[0];
    window.fileManager = fileManager;

    if (folderId.indexOf("f") > -1)
        folderId = folderId.replace("f", "");

    window.folderId = folderId;

    Di_DYS_KlasorAction.GetAktorOrganizationWithFolderId(folderId, function (retVal) {
        if (retVal) {
            organization.parse(retVal);
            window.show();
        }
        fileManager.hideMask();
    });
};

STBEbys.Webix.Dys.AddFavorites = function (fileManager, folderId) {
    fileManager.showMask();
    webix.confirm({
        ok: currentLang.Evet,
        title: currentLang.Dikkat,
        cancel: currentLang.Hayir,
        text: currentLang.SikKullanilanlarUyari,
        callback: function (result) {
            if (result) {

                Di_DYS_FavoritesAction.AddFavorites(folderId.toString().replace("f", ""), function (ret) {
                    fileManager.hideMask();

                    if (ret) {

                        fileManager.getItem(folderId).IsFavorite = true; //contextmenude sık kullanılanlara ekle yerine sık kullanılanlardan çıkart item'ının gözükmesini sağlar
                        STBEbys.Webix.Dys.RefreshFavoritesFolder();
                        webix.message({
                            text: currentLang.SikKullanilanlarMessage,
                            type: "info",
                            expire: 4000
                        });

                    }
                    else {

                        webix.alert({
                            ok: currentLang.Tamam,
                            type: "alert-warning",
                            text: currentLang.HataMeydanaGeldi
                        });
                    }

                });
            }
            else {
                fileManager.hideMask();
            }
        }
    });

};

STBEbys.Webix.Dys.RemoveFavorites = function (fileManager, folderId) {
    fileManager.showMask();
    webix.confirm({
        ok: currentLang.Evet,
        title: currentLang.Dikkat,
        cancel: currentLang.Hayir,
        text: currentLang.SikKullanilanlarUyari2,
        callback: function (result) {
            if (result) {

                Di_DYS_FavoritesAction.RemoveFavorites(folderId.toString().replace("f", "").replace("l", ""), function (ret) {
                    fileManager.hideMask();

                    if (ret) {
                        if (fileManager.exists(folderId.toString().replace("f", "l"))) {
                            fileManager.deleteFile(folderId.toString().replace("f", "l"));
                        }
                        fileManager.getItem(folderId.toString().replace("l", "f")).IsFavorite = false; //contextmenude sık kullanılanlardan çıkart yerine sık kullanılanlara ekle item'ının gözükmesini sağlar
                        STBEbys.Webix.Dys.RefreshFavoritesFolder();
                        webix.message({
                            text: currentLang.SikKullanilanlarMessage2,
                            type: "info",
                            expire: 4000
                        });

                    }
                    else {
                        webix.alert({
                            ok: currentLang.Tamam,
                            type: "alert-warning",
                            text: currentLang.HataMeydanaGeldi
                        });
                    }

                });

            }
            else {
                fileManager.hideMask();
            }
        }
    });

};

STBEbys.Webix.Dys.ProjeAltindaMi = function (fileManager, itemId) {
    var retVal = false;
    var item = fileManager.getItem(itemId);
    if (item.Di_DYS_ProjeId)
        retVal = true;
    else if (item.$parent)
        retVal = STBEbys.Webix.Dys.ProjeAltindaMi(fileManager, item.$parent);
    else
        retVal = false;

    return retVal;
}

STBEbys.Webix.Dys.GetProjectId = function (fileManager, itemId) {
    var retVal = null;
    var item = fileManager.getItem(itemId);
    if (item.Di_DYS_ProjeId)
        retVal = item.Di_DYS_ProjeId;
    else if (item.$parent)
        retVal = STBEbys.Webix.Dys.GetProjectId(fileManager, item.$parent);

    return retVal;
}

STBEbys.Webix.Dys.TekKayitMiSecili = function (id, warn) {
    if (Array.isArray(id)) {
        if (warn) {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: currentLang.DysIslemUyarisi
            });
        }
        return false;
    }
    return true;
}

STBEbys.Webix.Dys.ImgTemplate = function (obj) {
    return '<img src="' + obj.src + '" class="imageContent" ondragstart="return false"/>'
}

STBEbys.Webix.Dys.ShowImages = function (fileManager, itemId) {
    fileManager.showMask();

    Di_DYS_KlasorAction.GetImagesInFolderWithRecursively(parseInt(itemId.toString().replace("f", "")), function (retVal) {
        if (retVal.length) {

            var viewsArray = [];
            for (var i = 0; i < retVal.length; i++) {

                retVal[i].src = FileDownloaderAddress + '?id=' + GenerateEncryptedIdCode(retVal[i].DocId);

                viewsArray.push({
                    id: retVal[i].id,
                    css: "image",
                    template: STBEbys.Webix.Dys.ImgTemplate,
                    data: webix.copy(retVal[i])
                });
            }


            var ImageWindow = {
                view: "window",
                itemId: "imageWindow",
                height: 600,
                width: 800,
                head: {
                    view: "toolbar",
                    cols: [
                        {
                            view: "label", itemId: "lblTitle", align: 'left'
                        },
                        {
                            view: "icon",
                            icon: "times-circle",
                            click: function () {
                                this.getTopParentView().close();
                            }
                        }
                    ]
                },
                position: "center",
                modal: true,
                body: {
                    rows: [{
                        view: "carousel",
                        itemId: "carouselImage",
                        cols: viewsArray,
                        navigation: {
                            type: "side",
                            items: true
                        },
                        on: {
                            onShow: function (id) {
                                var dvImage = GetChildViewsByItemId(this.getTopParentView(), "dvImage")[0];
                                dvImage.select(id);

                                var lblTitle = GetChildViewsByItemId(this.getTopParentView(), "lblTitle")[0];
                                lblTitle.setValue($$(id).data.title);

                            }
                        }
                    },
                    {
                        view: "dataview",
                        itemId: "dvImage",
                        css: "nav_list",
                        yCount: 1,
                        hidden: true,
                        select: true,
                        scroll: false,
                        type: {
                            width: 100,
                            height: 65
                        },
                        template: STBEbys.Webix.Dys.ImgTemplate,
                        data: retVal,
                        pager: "dataViewPager",
                        on: {
                            onItemClick: function (id) {
                                $$(id).show();
                            }
                        }
                    },
                    {
                        view: "pager",
                        id: "dataViewPager",
                        hidden: true,
                        size: 8,
                        group: Math.ceil(retVal.length / 8)
                    }
                    ]
                }
            };

            var window = webix.ui(ImageWindow);

            window.show();
            var lblTitle = GetChildViewsByItemId(window, "lblTitle")[0];
            lblTitle.setValue(retVal[0].title);
            fileManager.hideMask();
        }
        else {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: currentLang.ListelenecekAlbumBulunamadi //"Listelenecek Albüm Bulunmamaktadır."
            });
            fileManager.hideMask();
        }
    });
}

STBEbys.Webix.Dys.ShowTaslakBilgileriWindow = function (taslakBelgeId, sablonId, sablonAdi) {
    if (!taslakBelgeId && !sablonId)
        return;

    taslakBilgileriWin = webix.ui({
        view: "window",
        position: "center",
        move: true,
        modal: true,
        fullscreen: false,
        width: innerWidth - 500,
        height: innerHeight - 100,
        head: {
            view: "toolbar",
            cols: [
                {
                    view: "label",
                    align: "left",
                    template: "<span class='editt-menuitem-icon material-icons fa-info-circle' style='padding-right: 5px; color: white;'></span>" + currentLang.DokumanSurecGecmisi
                },
                {
                    view: "icon",
                    icon: "times-circle",
                    click: function () {
                        this.getTopParentView().close();
                    }
                }
            ]
        },
        on: {
            onShow: function () {
                var thisWindow = this;
                STBEbys.Webix.ShowProgressBar(thisWindow);

                Di_DYS_DokumanAction.GetDokumanSurecGecmisi(taslakBelgeId, sablonId, function (retVal) {
                    if (retVal) {
                        if (retVal.Tasnifler && retVal.Tasnifler.length > 0) {
                            var dinamikFormItem = GetChildViewsByItemId(thisWindow, "dinamikFormId")[0];
                            dinamikFormItem.loadForm(JSON.stringify(retVal.Tasnifler));

                            if (retVal.UstVeriler && retVal.UstVeriler.length > 0)
                                dinamikFormItem.setValue(retVal.UstVeriler);
                        }

                        if (retVal.OnayImzaHistory && retVal.OnayImzaHistory.length > 0) {
                            var onayListObj = GetChildViewsByItemId(thisWindow, "onayImzaTableItemId")[0];
                            onayListObj.clearAll();
                            if (retVal.OnayOncesiMi) {
                                for (var i in retVal.OnayImzaHistory) {
                                    retVal.OnayImzaHistory[i].BelgeKayitAsamasindaMi = true;
                                }
                            }
                            onayListObj.parse(retVal.OnayImzaHistory);
                        }

                        var fldOnaySonrasiAktorHistory = GetChildViewsByItemId(thisWindow, "fldOnaySonrasiAktorHistory")[0];
                        if (retVal.OnaySonrasiAktorHistory && retVal.OnaySonrasiAktorHistory.length > 0) {
                            fldOnaySonrasiAktorHistory.show();

                            var onaySonrasiAktorList = {
                                "data": retVal.OnaySonrasiAktorHistory,
                                "pos": 0,
                                "total_count": retVal.OnaySonrasiAktorHistory.length
                            };

                            var onaySonrasiAktorHistoryTable = GetChildViewsByItemId(thisWindow, "onaySonrasiAktorHistoryTableItemId")[0];
                            onaySonrasiAktorHistoryTable.clearAll();
                            onaySonrasiAktorHistoryTable.parse(onaySonrasiAktorList);
                        }



                        var dinamikForm = GetChildViewsByItemId(thisWindow, "dinamikFormId")[0];
                        dinamikForm.config.singleColumnLayout = retVal.UstveriPaneliTekSatir;
                        dinamikForm.refresh();
                    }

                    thisWindow.hideProgressBar();
                });
            }
        },
        body: {
            paddingY: 10, paddingX: 10,
            rows: [
                {
                    cols: [
                        {
                            view: "label",
                            label: currentLang.DysDokumanTipi + " :",
                            css: {
                                "font-weight": "bold"
                            },
                            width: 120
                        },
                        {
                            view: "label",
                            label: sablonAdi ? sablonAdi : "-"
                        }
                    ]
                },
                {
                    view: "label",
                    borderless: true,
                    template: "<span class='editt-menuitem-icon material-icons fa-info-circle'></span><span class='editt-menuitem-value'>" + currentLang.DokumanIslemGecmisiInfo + "</span>"
                },
                {
                    height: 10
                },
                {
                    view: "toolbar",
                    css: "highlighted_header header6",
                    height: 35,
                    cols: [
                        {
                            "template": "<span class='webix_icon fa-file-text'></span>" + currentLang.UstVeriler, "css": "sub_title2", borderless: true
                        }
                    ]
                },
                {
                    view: "scrollview",
                    css: { "min-height": "100px" },
                    body: {
                        rows: [
                            {
                                view: "dinamikform",
                                itemId: "dinamikFormId",
                                name: "UstVeriler",
                                UstVeriOwnerPropertyName: "TaslakBelgeId",
                                formLoadFunc: DosyaTasnifPlaniAction.GetCurrentUstVeriler,
                                singleColumnLayout: false,
                                defaultLabelWidth: 200,
                                resizeDinamikForm: 0,
                                readOnlyFormFields: true

                            }
                        ]
                    }
                },
                {
                    view: "toolbar",
                    css: "highlighted_header header6",
                    height: 35,
                    cols: [
                        {
                            "template": "<span class='webix_icon fa fa-check'></span>" + currentLang.OnayAsamasi, "css": "sub_title2", borderless: true
                        }
                    ]
                },
                {
                    view: "fieldset",
                    body: {
                        rows: [GetOnayImzaDataTable()]
                    }
                },
                {
                    view: "fieldset",
                    itemId: "fldOnaySonrasiAktorHistory",
                    label: currentLang.OnaySureciSonrasiVeriGirisi, //"Onay Süreci Sonrası Veri Girişi"
                    hidden: true,
                    body: {
                        rows: [GetOnaySonrasiAktorDataTable()]
                    }
                },
                {
                    cols: [
                        {},
                        {
                            view: "button",
                            type: "htmlbutton",
                            css: "formCloseBtn",
                            label: "<span class='fa-times-circle'></span><span style='padding-left: 5px;'>" + currentLang.Kapat + "</span>",
                            width: 100,
                            click: function () {
                                this.getTopParentView().close();
                            }
                        }
                    ]
                }
            ]
        }
    });

    webix.event(window, "resize", function () {
        if (taslakBilgileriWin && taslakBilgileriWin.$view) {
            taslakBilgileriWin.define({
                width: innerWidth - 500,
                height: innerHeight - 100
            });
            taslakBilgileriWin.resize();
        }
    });
    taslakBilgileriWin.show();
};

/*Summary: Klasöre ait ön tanımlı onaycılar ekranıdır.
* config
*      fileManager : fileManager: Dys ekranındaki dosya yonetim componenti
*      item        : Seçili klasör item bilgisi
*
*/
STBEbys.Webix.Dys.DefaultApproversWindow = function (config) {
    if (config && config.fileManager && config.item) {
        return {
            view: "window",
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "<i style='color:#ffffff;margin-right:2px' class='fas fa-user-plus' aria-hidden='true'></i> " + currentLang.OnTanimliOnaycilar + " (" + config.item.value + ")", align: 'left', itemId: "title" },
                    {
                        view: "icon",
                        icon: "times-circle",
                        click: function () {
                            this.getTopParentView().close();
                        }
                    }
                ]
            },
            padding: {
                top: 10,
                right: 10,
                left: 10
            },
            position: "center",
            height: 245,
            width: 750,
            modal: true,
            body: {
                rows: [
                    {
                        view: "form",
                        itemId: "frmDefaultApprovers",
                        scroll: true,
                        elementsConfig: {
                            labelWidth: 130
                        },
                        elements: [
                            {
                                height: 50,
                                borderless: true,
                                cols: [
                                    {
                                        template: "<font size='6'><i class='fa fa-info-circle' aria-hidden='true'></i></font>",
                                        borderless: true,
                                        width: 40
                                    },
                                    {
                                        template: currentLang.OnTanimliOnaycilarInfo,
                                        borderless: true
                                    }
                                ]
                            },
                            { name: "Id", hidden: true, itemId: "onTanimliOnayciId" },
                            {
                                view: "actormultiselect", label: currentLang.BirinciSeviyeOnay, name: "BirinciSeviyeOnayciIdList", itemId: "birinciSeviyeOnayciId", minChar: 3, isAktorByQueryParamsPaged: true,
                                queryParams: JSON.stringify({
                                    AramaYoluId: STBEbys.Webix.SistemParametreleriObject.Kurum_AktorId,
                                    AktorTipi: [STBEbys.Webix.SistemParametreleriObject.KurumPersoneli_AktorTipiId, STBEbys.Webix.SistemParametreleriObject.AktorTipiId_Rol, STBEbys.Webix.SistemParametreleriObject.AktorTipiId_Unvan]
                                })
                            },
                            {
                                view: "actormultiselect", label: currentLang.IkinciSeviyeOnay, name: "IkinciSeviyeOnayciIdList", itemId: "ikinciSeviyeOnayciId", minChar: 3, isAktorByQueryParamsPaged: true, showApprovalTypeColumn: true,
                                queryParams: JSON.stringify({
                                    AramaYoluId: STBEbys.Webix.SistemParametreleriObject.Kurum_AktorId,
                                    AktorTipi: [STBEbys.Webix.SistemParametreleriObject.KurumPersoneli_AktorTipiId, STBEbys.Webix.SistemParametreleriObject.AktorTipiId_Rol, STBEbys.Webix.SistemParametreleriObject.AktorTipiId_Unvan]
                                })
                            },
                            { height: 5 }
                        ]
                    },
                    {
                        view: "toolbar",
                        css: "highlighted_header header6",
                        paddingX: 5,
                        paddingY: 5,
                        cols: [
                            {}, {},
                            {
                                view: "button",
                                type: "iconButton",
                                icon: "check",
                                label: currentLang.Kaydet,
                                width: 100,
                                click: function (a, b, c) {
                                    var window = this.getTopParentView();
                                    STBEbys.Webix.ShowProgressBar(window);
                                    var form = GetChildViewsByItemId(window, "frmDefaultApprovers")[0];
                                    if (form && form.validate()) {
                                        var onTanimliOnayciObject = new Object();
                                        var formValues = form.getValues();
                                        onTanimliOnayciObject.Id = formValues.Id ? formValues.Id : 0;
                                        onTanimliOnayciObject.Di_DYS_KlasorId = config.item.realId ? config.item.realId : config.item.id.toString().replace("f", "");

                                        if (formValues.BirinciSeviyeOnayciIdList) {
                                            onTanimliOnayciObject.BirinciSeviyeOnayciIdList = formValues.BirinciSeviyeOnayciIdList.trim().split(",");
                                        }
                                        else {
                                            onTanimliOnayciObject.BirinciSeviyeOnayciIdList = new Array();
                                        }

                                        if (formValues.IkinciSeviyeOnayciIdList) {
                                            onTanimliOnayciObject.IkinciSeviyeOnayciIdList = formValues.IkinciSeviyeOnayciIdList.trim().split(",");
                                        }
                                        else {
                                            onTanimliOnayciObject.IkinciSeviyeOnayciIdList = new Array();
                                        }

                                        /*Aynı aktör 1. seviye ve 2. seviye onaycıya eklendi mi kontrolü yapılır. Eklendi ise uyarı mesajı verilir.*/
                                        if (onTanimliOnayciObject && onTanimliOnayciObject.BirinciSeviyeOnayciIdList.length && onTanimliOnayciObject.IkinciSeviyeOnayciIdList.length) {
                                            var isAktorExist = false;
                                            onTanimliOnayciObject.BirinciSeviyeOnayciIdList.forEach(function (aktorId) {
                                                if (onTanimliOnayciObject.IkinciSeviyeOnayciIdList.indexOf(aktorId) > -1) {
                                                    isAktorExist = true;
                                                    return;
                                                }
                                            });
                                            if (isAktorExist) {
                                                STBEbys.Webix.ShowWarning(currentLang.AyniOnayciAktorUyariMsj);
                                                window.hideProgressBar();
                                                return;
                                            }
                                        }

                                        Di_DYS_KlasorOnTanimliOnayciAction.SaveOnTanimliOnayci(onTanimliOnayciObject, function (retVal) {
                                            window.hideProgressBar();
                                            if (retVal && retVal.Result) {
                                                window.close();
                                                STBEbys.Webix.ShowInfo(currentLang.KayitIslemiTamamlandi, 400);
                                            }
                                            else {
                                                STBEbys.Webix.ShowInfo(retVal.Message || currentLang.KayitIslemiHatali, 400);
                                            }
                                        })
                                    }
                                }
                            },
                            {
                                view: "button",
                                type: "iconButton",
                                icon: "close",
                                label: currentLang.Vazgec,
                                width: 100,
                                click: function (a, b, c) {
                                    this.getTopParentView().close();
                                }
                            }
                        ]
                    }
                ]
            }
        };
    }
}

/*Summary: Klasöre ait ön tanımlı onaycı ekranını gösterir. Birinci ve ikinci onaycı combolarının değerleri setlenir.
* config
*      fileManager : fileManager: Dys ekranındaki dosya yonetim componenti
*      id          : Klasör id değeri
*      
 */
STBEbys.Webix.Dys.ShowDefaultApproversWindow = function (config) {
    if (config && config.fileManager && config.id) {
        var fileManager = config.fileManager;
        fileManager.showMask();
        var folderId = config.id;
        fileManager.showMask();
        var item = fileManager.getItem(folderId);
        var window = webix.ui(webix.copy(STBEbys.Webix.Dys.DefaultApproversWindow({ fileManager: fileManager, item: item })));

        var birinciSeviyeOnayciItem = GetChildViewsByItemId(window, "birinciSeviyeOnayciId")[0];
        var ikinciSeviyeOnayciItem = GetChildViewsByItemId(window, "ikinciSeviyeOnayciId")[0];
        var frmDefaultApprovers = GetChildViewsByItemId(window, "frmDefaultApprovers")[0];

        Di_DYS_KlasorOnTanimliOnayciAction.GetOnTanimliOnayciList(config.id.toString().replace("f", ""), function (retVal) {
            if (retVal) {
                frmDefaultApprovers.parse(retVal);
                window.show();
                fileManager.hideMask();
            }
            else {
                window.show();
                fileManager.hideMask();
            }
        });
    }
}

STBEbys.Webix.Dys.KurumsalKlasorAltindaMi = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (parentId.toString().replace("f", "") == DmsSettings.KurumsalKlasorId || item.realId == DmsSettings.KurumsalKlasorId)
        return true;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.KurumsalKlasorAltindaMi(fileManager, item.$parent);
}

STBEbys.Webix.Dys.KisiselKlasorAltindaMi = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (item.$parent == DmsSettings.RootKlasorId.toString() && item.KlasorTipi == 1)
        return true;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, item.$parent);
}

STBEbys.Webix.Dys.GetKisiselKlasorRootId = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (item.$parent == DmsSettings.RootKlasorId.toString() && item.KlasorTipi == 1)
        return item.id;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.GetKisiselKlasorRootId(fileManager, item.$parent);
}

STBEbys.Webix.Dys.KurumDysKlasoruMu = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (parentId.replace("f", "") == DmsSettings.KurumKlasorId || item.realId == DmsSettings.KurumKlasorId)
        return true;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.KurumDysKlasoruMu(fileManager, item.$parent);
}

//Kurumsal klasörü altında olup bir kök klasörü var mı kontrolü.
//Ülke klasörlerini bulmak için eklenmiştir.
STBEbys.Webix.Dys.KokKlasorAltindaMi = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (parentId.replace("f", "") == DmsSettings.KurumKlasorId || item.realId == DmsSettings.KurumKlasorId)
        return false;
    else if (item.KokteMi)
        return true;
    else if (item.$parent)
        return STBEbys.Webix.Dys.KokKlasorAltindaMi(fileManager, item.$parent);
    else return false;
}

STBEbys.Webix.Dys.SharedKlasorAltindaMi = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (parentId == "shared")
        return true;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.SharedKlasorAltindaMi(fileManager, item.$parent);
}

STBEbys.Webix.Dys.FavoritesKlasorAltindaMi = function (fileManager, parentId) {
    var item = fileManager.getItem(parentId);
    if (parentId == "personallikes")
        return true;
    else if (item.id == DmsSettings.RootKlasorId.toString())
        return false;
    else return STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManager, item.$parent);
}

STBEbys.Webix.Dys.RefreshFileManagerData = function (parent) {
    var fileManager = $$("fmanager");
    var item = fileManager.getItem(parent);
    if (!item) {
        var fileId = STBEbys.Webix.Dys.FileManagerGetIdByRealId(fileManager, parent);
        parent = fileId;
        item = fileManager.getItem(fileId);
    }
    if (item) {

        if (parent.toString().indexOf("l") == 0 || parent == "personallikes") {
            var view = fileManager;
            var items = [];
            view.data.eachChild(parent, function (item) {
                items.push(item.id);
            }, view, true);

            for (var i = 0; i < items.length; i++) {
                view.remove(items[i]);
            }

            //todo
            var folderId = parent.toString().replace(/\D/g, '');
            var folder = fileManager.getItem("f" + folderId);
            if (folder && !folder.webix_branch) {
                items = [];

                view.data.eachChild(folder.id, function (item) {
                    items.push(item.id);
                }, view, true);

                for (var i = 0; i < items.length; i++) {
                    view.remove(items[i]);
                }
                folder.webix_branch = 1;
            }

            view.refresh();
        }

        STBEbys.Webix.Dys.ClearBranch({ fileManager: fileManager, id: parent });
        fileManager.getItem(parent).webix_branch = 1;
        return fileManager.openFolders([parent]);
    }
    else {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}

/**
* Summary      : Dys ekranında açık klasör (branch) üzerinde yapılan değişikliklere göre (doküman, klasör ekleme/silme, adını güncelleme vb. işlemler) güncel halini tekrar getirmek için kullanılır.
* config
*  fileManager : fileManager nesnesi
*  id          : parent id değeri
*/
STBEbys.Webix.Dys.ClearBranch = function (config) {
    if (config && config.fileManager, config.id) {
        var fileManager = config.fileManager;
        var id = config.id;
        var items = [];

        fileManager.data.eachChild(id, function (item) {
            if (!fileManager.data.branch[item.id]) {
                items.push(item.id);
            }
        }, fileManager, true);

        for (var i = 0; i < items.length; i++) {
            fileManager.remove(items[i]);
        }

        fileManager.refresh();
    }
}

STBEbys.Webix.Dys.FastAccessWindow = function (title, description, fastAccessAddress, warning) {
    var window = {
        view: "window",
        head: {
            view: "toolbar",
            cols: [
                {
                    view: "label", label: title, align: 'left'
                },
                {
                    view: "icon",
                    icon: "times-circle",
                    click: function () {
                        this.getTopParentView().close();
                    }
                }

            ]
        },
        padding: {
            top: 10,
            right: 10,
            left: 10
        },
        position: "center",
        modal: true,
        width: 600,
        height: 430,
        body: {
            paddingY: 10,
            paddingX: 10,
            rows: [
                {

                    template: warning,
                    css: "fast-access-warning fast-access-label",
                    autoheight: true,
                    borderless: true,
                },

                {
                    view: "label",
                    label: description,
                    inputWidth: 100,
                    css: "fast-access-label",
                    align: "left"
                },
                {
                    cols: [
                        {
                            view: "text",
                            value: fastAccessAddress,
                            itemId: "fast-access-textbox",
                            readonly: true,
                            align: "left"
                        },
                        {
                            view: "icon",
                            icon: "fas fa-clipboard",
                            css: "fast-access-copy-icon",
                            click: function (a, b, c) {
                                var textbox = GetChildViewsByItemId(this.getTopParentView(), "fast-access-textbox")[0];
                                var inputNodeId = textbox.getInputNode().id;
                                var copyText = document.getElementById(inputNodeId);
                                copyText.select();
                                document.execCommand("copy");
                                webix.message({
                                    text: currentLang.LinkKopyalandi,
                                    type: "info",
                                    expire: 4000
                                });
                            }
                        }

                    ]
                }
            ]
        }
    };
    return webix.copy(window);
}

/*
* Summary: İşlem bilgileri ekranında seçili olan dokümanın işlem hareket geçmişini (loglarını) gösterir.
* 
 * @config
*    fileManager: Dys ekranındaki dosya yonetim componenti
*    itemId     : Seçilen item'ın itemId si
*/
STBEbys.Webix.Dys.LogInfoWindow = function (config) {
    if (config && config.fileManager && config.itemId) {
        var isFolder = (config.itemId).indexOf("f") >= 0;
        var selected = config.fileManager.getItem(config.itemId);
        var logInfoWindow = {
            view: "window",
            head: {
                view: "toolbar",
                cols: [
                    {
                        view: "label", label: "<span class='fas fa-unlink' style='color:white; margin-left:-3px; margin-right:10px;'></span>" +
                            currentLang.LogBilgileri + " (" + selected.value + ")", align: 'left'
                    },
                    {
                        view: "icon",
                        icon: "times-circle",
                        click: function () {
                            this.getTopParentView().close();
                        }
                    }
                ]
            },
            padding: {
                top: 10,
                right: 10,
                left: 10
            },
            position: "center",
            modal: true,
            width: 1100,
            height: 400,
            body: {
                rows: [
                    {
                        view: "datatable",
                        itemId: "dtLogInfo",
                        scroll: true,
                        headerRowHeight: 50,
                        tooltip: window && !!window.chrome,
                        columns: [
                            { id: "MajorVersiyon", header: currentLang.MajorVersiyon, css: { 'text-align': 'center' }, width: 50, tooltip: false, hidden: isFolder },
                            { id: "MinorVersiyon", header: currentLang.MinorVersiyon, css: { 'text-align': 'center' }, width: 50, tooltip: false, hidden: isFolder },
                            { id: "AktorName", header: currentLang.Kullanici, width: 160 },
                            { id: "Tarih", header: currentLang.Tarih, width: 140, format: webix.Date.jsonDateTimeToStr, tooltip: false, },
                            { id: "DokumanIslemTipi", header: currentLang.IslemTipi, template: function (a) { return a.DokumanIslemTipi >= 0 ? STBEbys.Webix.Di_DYS_DokumanHistoryIslemTipi[a.DokumanIslemTipi].value : ""; }, width: 200, hidden: isFolder },
                            { id: "KlasorIslemTipi", header: currentLang.IslemTipi, template: function (a) { return a.KlasorIslemTipi >= 0 ? STBEbys.Webix.Di_DYS_KlasorHistoryIslemTipi[a.KlasorIslemTipi].value : ""; }, width: 200, hidden: !isFolder },
                            {
                                id: "EskiDeger", header: currentLang.EskiDeger, fillspace: true,
                                template: function (a) {
                                    if (a.EskiDeger)
                                        return a.EskiDeger.length > 35 ? a.EskiDeger.substring(0, 35) + "..." : a.EskiDeger;
                                    else
                                        return "";
                                },
                                tooltip: function (a) {
                                    if (a.EskiDeger)
                                        return a.EskiDeger;
                                    else
                                        return "";
                                }
                            },
                            {
                                id: "YeniDeger", header: currentLang.YeniDeger, fillspace: true,
                                template: function (a) {
                                    if (a.YeniDeger)
                                        return a.YeniDeger.length > 35 ? a.YeniDeger.substring(0, 35) + "..." : a.YeniDeger;
                                    else
                                        return "";
                                },
                                tooltip: function (a) {
                                    if (a.YeniDeger)
                                        return a.YeniDeger;
                                    else
                                        return "";
                                }
                            }
                        ],
                        on: {
                            onItemDblClick: function (id, e, node) {
                                var selectedItem = this.getItem(id);
                                if (selectedItem && selectedItem[id.column] && (id.column == 'EskiDeger' || id.column == 'YeniDeger')) {
                                    webix.ui({
                                        view: "window",
                                        resize: true,
                                        minWidth: 225,
                                        minHeight: 125,
                                        position: "bottom",
                                        head: {
                                            view: "toolbar",
                                            cols: [
                                                { view: "label", align: "center", label: this.getColumnConfig(id.column) && this.getColumnConfig(id.column).header && this.getColumnConfig(id.column).header[0] && this.getColumnConfig(id.column).header[0].text ? this.getColumnConfig(id.column).header[0].text : "" },
                                                {
                                                    view: "icon", icon: "times-circle",
                                                    click: function () {
                                                        var windowObj = this.getTopParentView();
                                                        windowObj.close();
                                                    }
                                                }
                                            ]
                                        },
                                        body: {
                                            paddingY: 20, paddingX: 30, elementsConfig: { labelWidth: 140 },
                                            rows: [{
                                                view: "customtextarea", readonly: true, value: selectedItem[id.column]
                                            }]
                                        }
                                    }).show();
                                }
                            }
                        }
                    }
                ]
            }
        }

        return webix.copy(logInfoWindow);
    }
};

/**
* Süreç raporları yetki kontrolü ve sayfa yönlendirmesi işlemini yapar.
* @ config
*      folderId        : Klasör id bilgisidir.
*      folderName      : Klasör name bilgisidir. 
 *      filemanager     : filemananer component bilgisidir.
*      sayfaUrl        : Sayfa url bilgisidir.
*      yetkiUyariMessage    : Yetki uyarı mesaj bilgisidir.
*/
STBEbys.Webix.Dys.GetSurecTakipRapolari = function (config) {
    if (config && config.folderId) {
        if (!STBEbys.Webix.Dys.TekKayitMiSecili(config.folderId, true))
            return false;
        var folderId = GenerateEncryptedIdCode(config.folderId.replace("f", ""));
        var filemanger = config.filemanger;
        STBEbys.Webix.ShowProgressBar(filemanger);
        IX_YetkilendirmeAction.CheckKullaniciSayfaYetkileri(config.sayfaUrl, function (ret) {
            if (ret) {
                STBEbys.Webix.CheckDysKlasorGoruntulemeYetkisi(folderId, function (retVal) {
                    filemanger.hideProgressBar();
                    if (retVal) {
                        window.open(EDASYSUrl + '/' + config.sayfaUrl + '?folderName=' + config.folderName + '&folderId=' + folderId);
                    }
                    else {
                        STBEbys.Webix.ShowWarning(currentLang.SurecRaporlariYetkiWarning);
                    }
                });
            } else {
                filemanger.hideProgressBar();
                STBEbys.Webix.ShowWarning(config.yetkiUyariMessage);
            }
        });
    }
};

STBEbys.Webix.Dys.GetFastAccessAddress = function (fileManager, itemId, itemType) {
    fileManager.showMask();

    var opDescription = '';
    var warning = currentLang.HizliErisimLinkiFileAciklama + "<br/><br/>" + currentLang.HizliErisimLinkiFolderAciklama + "<br/><br/>" + currentLang.HizliErisimLinkiUyari;
    if (itemType == "folder") {
        opDescription = currentLang.KlasorIcinHizliLinkAciklama;
    } else {
        opDescription = currentLang.DosyaIcinHizliLinkAciklama;
    }

    Di_DYS_AutoNavigationAction.CreateFastAccessLink(itemType, itemId.toString(), function (retVal) {
        fileManager.hideMask();
        if (retVal.Message == null || retVal.Message == '') {
            var window = webix.ui(STBEbys.Webix.Dys.FastAccessWindow(currentLang.HizliErisimLinkiOlustur, opDescription, retVal.Result, warning));
            window.show();
        }
        else {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: retVal.Message
            });
        }
    });
};


STBEbys.Webix.Dys.RedirectPath = function (fileManager, itemId, itemType) {
    fileManager.showMask();

    Di_DYS_AutoNavigationAction.CreateFastAccessLink(itemType, itemId.toString().replace(/\D/g, ''), function (retVal) {
        fileManager.hideMask();
        if (retVal.Message == null || retVal.Message == '') {
            document.location.href = retVal.Result;
        }
        else {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: retVal.Message
            });
        }
    });
};


STBEbys.Webix.Dys.ShowFolderPath = function (fileManager, itemId, itemType) {
    fileManager.showMask();
    var folderId = null;
    var pathInfo = "";
    var parentFolder = "";

    if (itemType == "file") {
        folderId = fileManager.getItem(itemId).$parent.replace(/\D/g, '');
        pathInfo = currentLang.DosyaPathInfo;
        parentFolder = fileManager.getItem(fileManager.getItem(itemId).$parent).value + "\\";
    }
    else if (itemType == "folder") {
        folderId = itemId.replace(/\D/g, '');
        pathInfo = currentLang.KlasorPathInfo;
    }

    IX_RecycleBinAction.GetFolderPath(folderId, function (retVal) {
        fileManager.hideMask();
        if (retVal.success) {
            webix.ui({
                view: "window",
                resize: true,
                width: 480,
                height: 210,
                minHeight: 210,
                minWidth: 480,
                position: "bottom",
                modal: true,
                head: {
                    view: "toolbar",
                    cols: [
                        { view: "label", label: "<i style='color:#ffffff;margin-right:6px' class='fas fa-desktop'></i> " + currentLang.PathBilgisi, align: 'left', itemId: "title" },
                        {
                            view: "icon", icon: "times-circle",
                            click: function () {
                                var windowObj = this.getTopParentView();
                                windowObj.close();
                            }
                        }
                    ]
                },
                body: {
                    padding: 5,
                    rows:
                        [
                            {
                                cols: [
                                    {
                                        template: "<font size='5'><i class='fa fa-info-circle' aria-hidden='true'></i></font>",
                                        borderless: true,
                                        maxHeight: 20,
                                        maxWidth: 40,
                                    },
                                    {
                                        height: 50,
                                        view: "label",
                                        label: pathInfo,
                                        css: { "margin-top": "-12px !important", "margin-left": "-8px !important" },
                                        maxHeight: 20,
                                        borderless: true
                                    }
                                ]

                            },
                            {
                                cols: [
                                    {
                                        height: 50,
                                        view: "label",
                                        label: currentLang.CopKutusuKlasorPathInfo2,
                                        css: { "margin-top": "-20px !important", "margin-left": "32px !important" },
                                        maxHeight: 20,
                                        borderless: true
                                    }
                                ],
                                css: { "margin-top": "-18px !important", "overflow": "visible !important" }
                            },
                            {
                                borderless: true,
                                minHeight: 40,
                                cols: [
                                    {
                                        template: retVal.data + parentFolder,
                                        borderless: true
                                    }
                                ],
                                css: { "margin-top": "-20px !important" }
                            }
                        ]
                }
            }).show();
        }
        else {
            webix.alert({
                ok: currentLang.Tamam, // "Tamam",
                type: "alert-error",
                text: retVal.data
            });
        }
    });
};


/*
* Summary: Seçili item'ın geçmiş işlem hareketlerini gösterir. Geçmiş hareketi yoksa uyarı mesajı vermektedir.
* Dys ekranında 
 * @config
*    fileManager: Dys ekranındaki dosya yonetim componenti
*    itemId     : Seçilen item'ın itemId si
*/
STBEbys.Webix.Dys.GetLogInformations = function (config) {
    if (config && config.fileManager && config.itemId) {
        config.fileManager.showMask();
        var logInfoWindow = STBEbys.Webix.Dys.LogInfoWindow(config);
        if (logInfoWindow) {
            var window = webix.ui(logInfoWindow);
            var dt = GetChildViewsByItemId(window, "dtLogInfo")[0];

            window.isFolder = !!(config.itemId.indexOf("f") >= 0 || config.itemId.indexOf("s") >= 0);
            config.itemId = config.fileManager.getItem(config.itemId).realId;

            Di_DYS_KlasorDokumanAction.GetLogInformations(parseInt(config.itemId), window.isFolder, function (retVal) {
                if (retVal && retVal.length) {
                    dt.parse(retVal);
                    window.show();
                    config.fileManager.hideMask();
                }
                else {
                    STBEbys.Webix.ShowWarning(currentLang.LogBilgisiKayitYok);
                    config.fileManager.hideMask();
                }
            });
        }
    }
}

STBEbys.Webix.Dys.CanOpenWithWebDav = function (fileManager, documentId) {
    var data = fileManager.getItem(documentId);
    if (fileManager.webDavExtensions.indexOf(data.type) > -1 && findBrowser() == 'Microsoft Internet Explorer' && WebDavKullanimiAcik == 'true') {
        return true;
    }
    else {
        return false;
    }
}

/**
* Footer'da bulunan klasör bilgilerini gizleme veya gösterme fonksiyonudur.
* Sadece kişisel klasörde gösterilmektedir. Gösterim işleminde boyut hesaplaması yapılmaktadır.
* @fileManager               : Filemanager componet bilgisidir.
* @selectedFolderId          : Seçili klasör id bilgisidir.
* @forceToResfreshFolderInfo : Klasör boyut bilgisi güncellensin mi bilgisidir. 
 * @sizeChangeValue           : Değişiklik olan boyut bilgisidir.
*/
STBEbys.Webix.Dys.ShowOrHideFolderInfoControl = function (fileManager, selectedFolderId, forceToResfreshFolderInfo, sizeChangeValue) {
    if (STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, selectedFolderId)) {

        if (fileManager.PersonelFolderUsageInfo != null && !forceToResfreshFolderInfo && sizeChangeValue != null
            && fileManager.PersonelFolderUsageInfo.CurrentSizeAsByte + sizeChangeValue > fileManager.PersonelFolderUsageInfo.MaximumAllowedSizeAsByte) {
            forceToResfreshFolderInfo = true;
        }

        if (fileManager.PersonelFolderUsageInfo != null && !forceToResfreshFolderInfo) {
            if (sizeChangeValue != null) {
                fileManager.PersonelFolderUsageInfo.CurrentSizeAsByte += sizeChangeValue;
            }
            STBEbys.Webix.Dys.ShowFolderInfoControl(
                fileManager,
                currentLang.KisiselKlasorKullanimBilgisi,
                fileManager.PersonelFolderUsageInfo.CurrentSizeAsByte,
                fileManager.PersonelFolderUsageInfo.MaximumAllowedSizeAsByte);
        }
        else {
            /*Get from server*/
            Di_DYS_KlasorAction.GetKlasorKullanimBilgileri(selectedFolderId, function (retVal) {
                if (retVal != null) {
                    fileManager.PersonelFolderUsageInfo = retVal;
                    STBEbys.Webix.Dys.ShowFolderInfoControl(
                        fileManager,
                        currentLang.KisiselKlasorKullanimBilgisi,
                        fileManager.PersonelFolderUsageInfo.CurrentSizeAsByte,
                        fileManager.PersonelFolderUsageInfo.MaximumAllowedSizeAsByte);
                }
                else {
                    STBEbys.Webix.Dys.HideFolderInfoControl(fileManager);
                }
            });
        }
    } else {
        STBEbys.Webix.Dys.HideFolderInfoControl(fileManager);
    }
}

STBEbys.Webix.Dys.ShowFolderInfoControl = function (fileManager, folderDescription, usedAreaAsByte, totalAreaAsByte) {
    /*Kota aşımı durumlarında görselde 100% görünmesi için eklendi*/
    var dysFolderInfo = GetChildViewsByItemId(fileManager.getParentView(), "dysFolderInfo")[0];
    dysFolderInfo.show();
    GetChildViewsByItemId(dysFolderInfo, "dysLblFolderInfo")[0].setValue("<center><i class='fas fa-info-circle' aria-hidden='true'></i>      <b>" + folderDescription + "</b></center>");
    GetChildViewsByItemId(dysFolderInfo, "dysBulletFolderUsage")[0].setValue(usedAreaAsByte <= totalAreaAsByte ? ((usedAreaAsByte / totalAreaAsByte) * 100) : 100);
    GetChildViewsByItemId(dysFolderInfo, "dysLblUsagePercent")[0].setValue("<center><i class='fas fa-pie-chart' aria-hidden='true'></i>      <b>" + currentLang.KullanimOrani + "</b> : " + (usedAreaAsByte <= totalAreaAsByte ? ((usedAreaAsByte / totalAreaAsByte) * 100).toFixed(2) : 100) + "%</center>");
    GetChildViewsByItemId(dysFolderInfo, "dysLblUsedAreaInfo")[0].setValue("<center><i class='fas fa-folder' aria-hidden='true'></i>      <b>" + currentLang.KullanilanAlan + "</b> : " + (usedAreaAsByte / 1048576).toFixed(2) + " / " + totalAreaAsByte / 1048576 + " MB</center>");
    GetChildViewsByItemId(dysFolderInfo, "dysLblFreeAreaInfo")[0].setValue("<center><i class='fas fa-folder-o' aria-hidden='true'></i>      <b>" + currentLang.KullanilabilirAlan + "</b> : " + (usedAreaAsByte <= totalAreaAsByte ? ((totalAreaAsByte - usedAreaAsByte) / 1048576).toFixed(2) : 0) + " MB</center>");
}

STBEbys.Webix.Dys.HideFolderInfoControl = function (fileManager) {
    var dysFolderInfo = GetChildViewsByItemId(fileManager.getParentView(), "dysFolderInfo")[0];
    dysFolderInfo.hide();
}

STBEbys.Webix.Dys.ShowKVKKWindow = function (docArr, target, retFunc, dysDocId, value, canClose) {

    /* Sürükle bırakla klasör atıldı ise çalışmasın. */
    var saveArchive = true;
    var isValid = !docArr || (docArr.length == 1 && docArr[0].indexOf("/") == -1);

    if (docArr && docArr.length > 1) {

        /* 
         * Sürükle bırak ile klasör atıldığı zaman doküman adları klasöradı/dokümanadı formatı ile gitmektedir. 
         * Doküman adı doğru olmadığı için KVKK seçimlerinin kaydedilemediği farkedildi. 
         * Bu sebeple eğer sürükle bırakla klasör atılır ise KVKK windowu açılmamaktadır. 
         * Aşağıdaki script ile klasör atılıp atılmadığı bulunmaktadır. 
         */

        var result = docArr.find(function (item) {
            return item && item.indexOf("/") > -1;
        });

        isValid = !result;
    }

    if (isValid) {
        var fileManager = $$("fmanager");

        /*Kişisel klasör haricindeki klasörlere dosya upload edildiğinde Save and Archive butonu disable edilmektedir.*/

        var kisiselKlasorAltindaMi = STBEbys.Webix.Dys.KisiselKlasorAltindaMi(fileManager, target || fileManager.getItem("d" + dysDocId).$parent);
        var favoritesKlasorAltindaMi = STBEbys.Webix.Dys.FavoritesKlasorAltindaMi(fileManager, target || fileManager.getItem("d" + dysDocId).$parent);

        var saveAndArchiveLabelVisibility = (kisiselKlasorAltindaMi || !!dysDocId) || !(docArr && docArr.length > 1);

        var window = {
            view: "window",
            head: {
                view: "toolbar",
                cols: [
                    {
                        view: "label",
                        template: "<font style='margin-top:-2px !important;'><i class='fa fa-gavel' style='color:#ffffff; margin-right:5px; !important;'></i> " + currentLang.KvkkSecimi + "</font>",
                        align: 'left'
                    },
                    {
                        view: "icon",
                        hidden: !canClose,
                        icon: "times-circle",
                        click: function () {
                            this.getTopParentView().close();
                        }
                    }
                ]
            },
            padding: {
                top: 10,
                bottom: 10,
                right: 10,
                left: 20
            },
            position: "center",
            modal: true,
            width: 600,
            saveClickFn: function (metadataList, retFunc) {

                metadataList = metadataList && metadataList.length ? metadataList : null;

                $$("fmanager").showMask();
                var choise = GetChildViewsByItemId($$(this.id).getTopParentView(), "cbKvkk")[0].getValue();
                var di_DYS_DokumanTipiId = GetChildViewsByItemId($$(this.id).getTopParentView(), "di_DYS_DokumanTipiId")[0].getValue();
                if (di_DYS_DokumanTipiId == "") {
                    STBEbys.Webix.ShowWarning(currentLang.DiDysDokumanTipiSecmelisiniz);
                    return;
                }
                if (dysDocId) {
                    Di_DYS_DokumanAction.SaveKvkkContentAndMetadata(parseInt(dysDocId), di_DYS_DokumanTipiId, choise, metadataList, function () {
                        $$("fmanager").getItem("d" + dysDocId).KvkkMi = !!choise;
                        if (retFunc)
                            retFunc();
                    });
                }
                else {
                    Di_DYS_DokumanAction.SaveKvkkContentAndMetadataWithName(docArr, parseInt(target.replace(/\D/g, '')), choise, di_DYS_DokumanTipiId, metadataList, function () {
                        if (retFunc)
                            retFunc();
                    });
                }
            },
            body: {
                rows: [
                    {
                        template: currentLang.KykkInfo,
                        hidden: canClose,
                        height: 70
                    },
                    {
                        view: "checkbox",
                        itemId: "cbKvkk",
                        labelWidth: 400,
                        height: 50,
                        label: currentLang.KvkkMesaji
                    },
                    {
                        cols: [
                            {
                                view: "STBEbys.Webix.CustomComboBox",
                                label: currentLang.DiDYSDokumanTipiLabel,
                                name: "Di_DYS_DokumanTipiId",
                                itemId: "di_DYS_DokumanTipiId",
                                serverFilter: true,
                                autoStoreLoad: true,
                                options: {},
                                labelWidth: 130,
                                minChars: 3,
                                params: { query: "" },
                                idField: "Id",
                                valueField: "Name",
                                loadStore: function () {
                                    STBEbys.Webix.ShowOverlay(this);
                                    var combo = this;

                                    Di_DYS_DokumanTipiAction.DokumanTipleriSearch(combo.config.params.query, function (retVal) {

                                        var datajson = webix.DataDriver.customComboJson.toObject(retVal, combo);
                                        combo.getList().parse(datajson);
                                        combo.hideOverlay();
                                        if (retVal.length > 0 && !combo.isSearch) {
                                            combo.setValue(STBEbys.Webix.SistemParametreleriObject.DiDYSDokumanTipiId);
                                        } else {
                                            var value = combo.getText();
                                            combo.setValue('');
                                        }
                                    });
                                },
                                on: {
                                    onChange: function (newValue, oldValue) {
                                        if (newValue) {
                                            this.getTopParentView().config.configureButtons(newValue);
                                        }
                                    }
                                }

                            },
                            {
                                width: 5,

                            },
                            {
                                view: "icon", icon: "info-circle", click: function () { STBEbys.Webix.ShowInfo(currentLang.DiDYSDokumanTipiSecimInfo, 450); }
                            }
                        ],
                        hidden: !!dysDocId

                    },
                    {
                        height: 45,
                        cols: [
                            {
                                width: saveAndArchiveLabelVisibility ? 300 : 1
                            },
                            {
                                template: "<font style='color:#a5c5cd; font-size: 13px; !important;'><i class='fa fa-info-circle' aria-hidden='true' style='color:#a5c5cd; margin-right:5px;'></i> " + currentLang.SaveAndArchiveDisableInfo + "</font>",
                                hidden: saveAndArchiveLabelVisibility,
                                width: 300
                            },
                            {
                                view: "button",
                                itemId: "btnKaydetVeArsivle",
                                label: currentLang.SaveAndArchive,
                                type: "iconButton",
                                icon: "file-text-o",
                                hidden: kisiselKlasorAltindaMi || !!dysDocId,
                                disabled: docArr && docArr.length > 1,
                                width: 150,
                                click: function () {
                                    var btn = this;
                                    var di_DYS_DokumanTipi = GetChildViewsByItemId(btn.getTopParentView(), "di_DYS_DokumanTipiId")[0];

                                    function SaveAndArchiveFunc(metadata) {
                                        STBEbys.Webix.ShowProgressBar(btn.getTopParentView());
                                        btn.getTopParentView().config.saveClickFn(metadata, function () {
                                            var fileManager = $$("fmanager");

                                            function close() {
                                                fileManager.hideMask();
                                                btn.getTopParentView().hideProgressBar();
                                                btn.getTopParentView().close();
                                            }

                                            if (docArr && docArr.length == 1 && docArr[0]) {

                                                Di_DYS_KlasorDokumanAction.GetDocumentIdWithFolderIdAndName(parseInt(target.replace(/\D/g, '')), docArr[0], function (retVal) {
                                                    close();
                                                    if (retVal) {

                                                        if (favoritesKlasorAltindaMi) {
                                                            var fileId = STBEbys.Webix.Dys.FileManagerGetIdByRealId(fileManager, retVal);
                                                            fileManager.config.createTaslakBelge(fileId);

                                                        }
                                                        else {
                                                            fileManager.config.createTaslakBelge("d" + retVal);
                                                            STBEbys.Webix.Dys.RefreshFavoritesFolder();

                                                        }
                                                    }
                                                });
                                            }
                                            else {
                                                close();
                                            }
                                        });
                                    }

                                    var selected = di_DYS_DokumanTipi.getPopup().getList().getItem(di_DYS_DokumanTipi.getValue());

                                    if (selected && selected.HasMetadata) {
                                        STBEbys.Webix.DysDokumanTipiUstVeri.OpenUstVeriPanel({
                                            dysDokumanTipiId: di_DYS_DokumanTipi.getValue(),
                                            dysDokumanTipiAdi: di_DYS_DokumanTipi.getText(),
                                            canCancel: false,
                                            saveFunc: function (result) {
                                                SaveAndArchiveFunc(result);
                                            }
                                        });
                                    }
                                    else {
                                        SaveAndArchiveFunc();
                                    }
                                }
                            },
                            {
                                view: "button",
                                itemId: "btnKaydet",
                                label: currentLang.Kaydet,
                                type: "iconButton",
                                icon: "floppy-o",
                                width: 120,
                                click: function () {
                                    var btn = this;

                                    function SaveFn(metadata) {
                                        btn.getTopParentView().config.saveClickFn(metadata, function () {
                                            btn.getTopParentView().close();
                                            STBEbys.Webix.Dys.RefreshFileManagerData(target).then(function () {
                                                $$("fmanager").hideMask();
                                                if (!favoritesKlasorAltindaMi) {
                                                    STBEbys.Webix.Dys.RefreshFavoritesFolder();
                                                }
                                            });
                                        });
                                    }

                                    var di_DYS_DokumanTipi = GetChildViewsByItemId(btn.getTopParentView(), "di_DYS_DokumanTipiId")[0];

                                    var selected = di_DYS_DokumanTipi.getPopup().getList().getItem(di_DYS_DokumanTipi.getValue());

                                    if (selected && selected.HasMetadata) {
                                        STBEbys.Webix.DysDokumanTipiUstVeri.OpenUstVeriPanel({
                                            dysDokumanTipiId: di_DYS_DokumanTipi.getValue(),
                                            dysDokumanTipiAdi: di_DYS_DokumanTipi.getText(),
                                            canCancel: false,
                                            saveFunc: function (result) {
                                                SaveFn(result);
                                            }
                                        });
                                    }
                                    else {
                                        SaveFn();
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            configureButtons: function (dysDokumanTipiId) {
                var di_DYS_DokumanTipi = GetChildViewsByItemId($$(this.id), "di_DYS_DokumanTipiId")[0];
                var btnKaydetVeArsivle = GetChildViewsByItemId($$(this.id), "btnKaydetVeArsivle")[0];
                var btnKaydet = GetChildViewsByItemId($$(this.id), "btnKaydet")[0];

                var selected = di_DYS_DokumanTipi.getPopup().getList().getItem(di_DYS_DokumanTipi.getValue());
                if (selected && selected.HasMetadata) {
                    btnKaydetVeArsivle.config.label = currentLang.DevamEtVeArsivle;
                    btnKaydet.config.label = currentLang.DevamEt;
                }
                else {
                    btnKaydetVeArsivle.config.label = currentLang.SaveAndArchive;
                    btnKaydet.config.label = currentLang.Kaydet;
                }
                btnKaydet.refresh()
                btnKaydetVeArsivle.refresh();
            }
        };
        var kvkkWin = webix.ui(window);
        if (value) {
            var cbKvkk = GetChildViewsByItemId(kvkkWin, "cbKvkk")[0];
            cbKvkk.setValue(value);
        }

        kvkkWin.show();
    }
    else {
        $$("fmanager").hideMask();
    }
}


STBEbys.Webix.Dys.FileManagerGetIdByRealId = function (fileManager, realId) {
    var fileId = '';
    for (var property in fileManager.data.pull) {
        if (property.endsWith(realId)) {
            var id = property.replace(realId, '');
            if (isNaN(id.slice(-1))) {
                fileId = property;
                //console.log(fileManager.data.pull[property]);
                break;
            }

        }
    }
    return fileId;
}


STBEbys.Webix.Dys.AttachFileManagerSubMenuEvent = function (menu, submenu) {
    var width = 160;
    submenu.define("width", width); //Sadece altmenülerin value değerleri için width genişliği atanmıştır.
    submenu.config.maxWidth = width;

    if (submenu && submenu.attachEvent) {
        submenu.attachEvent("onItemClick", function (id, e) {
            var fileManager = $$("fmanager");

            var obj = this.getItem(id);
            var method = fileManager[obj.method] || fileManager[id];
            if (method) {
                var active = fileManager.getActive();
                if (fileManager.callEvent("onbefore" + (obj.event || obj.method || id), [active])) {
                    if (!(id == "upload" && fileManager.config.legacyUploader)) {
                        if (fileManager._uploadPopup) fileManager._uploadPopup.hide();
                        menu.hide();
                    }
                    var args = [active];
                    if (id == "upload") {
                        e = webix.html.pos(e);
                        args.push(e);
                    }
                    webix.delay(function () {
                        method.apply(fileManager, args);
                        fileManager.callEvent("onafter" + (obj.event || obj.method || id), []);
                    });
                }
            }
        });
    }
};

STBEbys.Webix.Dys.DokumanEklemeYetkisiVarMi = function (klasorId) {
    Di_DYS_DokumanAction.KontrolKlasoreDokumanEklemeYetkisi(klasorId, false, function (retVal) {
        if (retVal) {
            webix.alert({
                ok: currentLang.Tamam,
                type: "alert-warning",
                text: currentLang.ImzaUyari
            });
            return false;
        }
        return true;
    });
}


/**
* Summary          : Son açılan/seçilen klasörün id ve bulunduğu tree setlenmiştir. Bu parametreler ile seçilen klasörün scroll bar'ı ayarlanmıştır.
* config
*      id : Seçilen klasörün id parametresidir.
*      treeItems: Seçilen klasörün bulunduğu tree'nin item parametresidir.
*/
STBEbys.Webix.Dys.FileManager.CustomScrollToMethod = function (config) {
    if (config && config.Id && config.treeItems) {
        var html = config.treeItems.getItemNode(config.Id);
        if (html && config.treeItems.scrollTo) {
            if (config.treeItems.getNode()) {
                if ((config.treeItems.getNode().offsetLeft || config.treeItems.getNode().offsetLeft == 0) && (html.offsetLeft || html.offsetLeft == 0)) {
                    var txmin = Math.abs(config.treeItems.getNode().offsetLeft - html.offsetLeft);
                }
                if ((config.treeItems.getNode().offsetTop || config.treeItems.getNode().offsetTop == 0) && (html.offsetTop || html.offsetTop == 0)) {
                    var tymin = Math.abs(config.treeItems.getNode().offsetTop - html.offsetTop);
                }
                if (txmin && (html.offsetWidth || html.offsetWidth == 0)) {
                    var txmax = txmin + html.offsetWidth;
                }
                if (tymin && (html.offsetHeight || html.offsetHeight == 0)) {
                    var tymax = tymin + html.offsetHeight;
                }
            }
            if (config.treeItems.getScrollState()) {
                var state = config.treeItems.getScrollState();
                if (state && (state.x || state.x == 0) && (state.y || state.y == 0)) {
                    var x = state.x;
                    if (txmax || txmax == 0)
                        x = txmax + html.offsetLeft;
                    var y = state.y;
                    if (tymax || tymax == 0)
                        y = tymax + html.offsetHeight;
                }
            }
            var tt = config.treeItems.getItemNode(config.Id);
            config.treeItems.scrollTo(tt, x, y, '100ms');
            return scollParams = [x, y];
        }
    }
};


/**
* Summary          : Kullanıcının son açtığı sayfayı geri dönmesini sağlayan butonun ekranda görüntülenme durumunu belirler.
*                    Eğer paylasılanlar (shared) klasörünün altındaysa buton gizlenir. Bulunduğu klasördeki durumuna ikonu değiştilirmektedir. 
 * config
*      fileManager : FileManager componet bilgisidir.
*      folderId    : Klasör id değeridir.
*/
STBEbys.Webix.Dys.FileManager.ShowOrHideSaveLastOpenedFolderIdButton = function (config) {
    if (config && config.fileManager && config.folderId) {
        var treeItems = $$("$filetree1");
        config.treeItems = treeItems;
        var selectedId = treeItems.getSelectedId();
        config.Id = selectedId;
        var scrollParams = [0, 0];

        if (!selectedId) {
            selectedId = config.folderId;
        }
        var setLastOpenedFolderIdButton = GetChildViewsByItemId(config.fileManager.getTopParentView(), "setLastOpenedFolderIdButtonItemId");
        if (setLastOpenedFolderIdButton && setLastOpenedFolderIdButton.length) {
            if (!setLastOpenedFolderIdButton[0].config.isActive && setLastOpenedFolderIdButton[0].config.hidden) {
                scrollParams = STBEbys.Webix.Dys.FileManager.CustomScrollToMethod(config);
                return scrollParams;
            }
            if (config.paylasilanKlasorAltindaMi) {
                if (setLastOpenedFolderIdButton[0].isVisible) {
                    setLastOpenedFolderIdButton[0].hide();
                }
            }
            else {
                if (setLastOpenedFolderIdButton[0].config.hidden) {
                    setLastOpenedFolderIdButton[0].show();
                }
                if (setLastOpenedFolderIdButton[0].isVisible) {
                    Di_DYS_KlasorAction.GetDYSLastOpenedKlasorId(function (retVal) {
                        setLastOpenedFolderIdButton[0].config.icon = (retVal || DmsSettings.ActiveLastOpenedFolderIdButton) ? "fas fa-folder" : "fas fa-folder-o";
                        setLastOpenedFolderIdButton[0].config.selected = retVal || DmsSettings.ActiveLastOpenedFolderIdButton;
                        setLastOpenedFolderIdButton[0].config.isActive = retVal || DmsSettings.ActiveLastOpenedFolderIdButton;
                    }).then(function () {
                        setLastOpenedFolderIdButton[0].refresh();
                        if (DmsSettings.ShowLastOpenedFolderIdButton) {
                            setLastOpenedFolderIdButton[0].show();
                        }

                    });

                    // Tree de bir klasöre tıklayınca (shared hariç) ya da datatable da bir klasöre double click yapınca klasör id sinin tutulması gerekmektedir.
                    STBEbys.Webix.Dys.FileManager.SetCurrentFolderId({ fileManager: config.fileManager });
                }
            }
        }
    }

}

/**
* Summary          : Son açılan klasöre dön özelliği aktif edilmiş ise klasörün id değerini set etmektedir. 
 * config
*      fileManager : FileManager componet bilgisidir.
*/
STBEbys.Webix.Dys.FileManager.SetCurrentFolderId = function (config) {
    if (config && config.fileManager) {
        var setLastOpenedFolderIdButton = GetChildViewsByItemId(config.fileManager.getTopParentView(), "setLastOpenedFolderIdButtonItemId");
        if (setLastOpenedFolderIdButton && setLastOpenedFolderIdButton.length && setLastOpenedFolderIdButton[0].config.isActive) {
            var folderId = config.fileManager.getCurrentFolder();
            if (folderId) {
                if (!folderId.toString().startsWith("s")) { // Son açılan klasöre dön özelliği shared (paylasılan) klasörleri için geçerli değildir.
                    Di_DYS_KlasorAction.SetDYSLastOpenedKlasorId(folderId.toString().replace("f", ""), function () {
                    });
                }
            }
        }
    }
}

/**
* Summary          : İstenilen klasörün file manager tree üzerinde seçilmesini sağlar.
* config
*      fileManagerTree   : FileManager componet bilgisidir.
*      selectedFolderId  : FileManager componet bilgisidir.
*/
STBEbys.Webix.Dys.SelectFolderFromTree = function (config) {
    if (config && config.fileManagerTree && config.selectedFolderId) {
        config.fileManagerTree._selected.push(config.selectedFolderId);
        config.fileManagerTree._select_mark(config.selectedFolderId, true, []);
    }
};

//Bu işlem menü altında 1.level dallanma içindir, ileride 2.level dallanma ihtiyac olursa recursive cözüm geliştirilmedir.
STBEbys.Webix.Dys.CheckContextMenuConfig = function (menus) {
    if (DmsSettings.DYSFileManagerContextMenuHideConfig == "") {
        return menus;
    }

    //virgül ile ayrılmış menü id'leri array'a dönüştürülür.
    var hiddenMenus = DmsSettings.DYSFileManagerContextMenuHideConfig.split(",");
    //önce root menüde kaldırılması gereken menüler kaldırılır.
    menus = menus.filter(function (item) { return !hiddenMenus.includes(item.id) });
    //menü id'lerinin noktadan önceki parentId'leri gruplanır.
    var hiddenMenuParents = hiddenMenus.map(function (item) { return item.split('.')[0] }).filter(function (value, index, self) { return self.indexOf(value) === index; });

    //daha sonra submenü'ler de kaldırılması gereken gereken menüler kaldırılır.
    menus.filter(function (menu) {
        return hiddenMenuParents.includes(menu.id);
    }).forEach(function (menu) {
        return menu.submenu = menu.submenu.filter(function (item) { return !hiddenMenus.includes(menu.id + '.' + item.id); });
    });
    return menus;
}

STBEbys.Webix.Dys.CreateSubMenu = function (menuId) {

    var fileManager = $$("fmanager");
    var menu = fileManager.getMenu(menuId);
    var submenu = menu.getSubMenu(menuId);

    if (submenu == null)
        return true;

    var context = menu.getContext();
    var type = "";
    if (context.id) type = fileManager.getItem(context.id).type === "folder" ? "folder" : "file";

    submenu.filter(function (obj) {
        var res = true;

        if (obj.batch) {
            if (!type) {
                res = obj.batch == "empty";
            } else {
                res = obj.batch == type || obj.batch == "item";
            }
        }
        if (fileManager.config.menuFilter) res = res && fileManager.config.menuFilter(obj);

        /*SubMenu datalarına width atanmışsa atanmış width propertysine göre genişlik belirleniyor. Submenu datalarından en genişi referans alınıyor.*/
        var itemWidth = language == 'En' ? obj.enWidth : obj.trWidth;
        if (res && itemWidth && (!submenu.config.maxWidth || submenu.config.maxWidth <= itemWidth)) {
            submenu.define("autowidth", true);
            delete submenu.config.width;
            submenu.config.maxWidth = itemWidth;
        }

        return res;
    });

    if (submenu.count() && context.id) {
        webix.UIManager.setFocus(menu);
        var sel = menu.getSelectedId();
        var found = false;
        if (webix.isArray(sel)) {
            for (var i = 0; !found && i < sel.length; i++) {
                if ("" + sel[i] == "" + context.id) found = true;
            }
        }
        if (!found && menu.exists(context.id)) menu.select(context.id);
    }

    return submenu.count() > 0;
}

STBEbys.Webix.Dys.RefreshFavoritesFolder = function (retFunc) {
    if (!$$("fmanager").getItem("personallikes").webix_branch) {
        STBEbys.Webix.Dys.RefreshFileManagerData("personallikes").then(function () {
            if (retFunc && typeof retFunc == "function") {
                retFunc();
            }
        });
    }
}
STBEbys.Webix.Dys.CheckInClickUpload = function () {

    var btn = GetChildViewsByItemId($$("checkinWindow"), "fileuploadButton")[0];
    btn.config.click();
}
