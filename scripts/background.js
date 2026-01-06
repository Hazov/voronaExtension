
let filesToDownload = [];

chrome.runtime.onMessage.addListener(
     function(request, sender, sendResponse) {
        if (request.method === "openAndDo") {
            openAndDo(request.params);
        } else if(request.method === 'removeTab'){
            removeTab(request.params.tabId);
        } else if(request.method === 'downloadLink'){
            downloadFile(request.params);
        } else if(request.method === 'waitFwdDoc'){
            waitFwdDoc(request.params)
        }

    }
);

chrome.downloads.onDeterminingFilename.addListener(function(item, __suggest) {
    function suggest(filename, conflictAction) {
        __suggest({filename: filename,
            conflictAction: conflictAction,
            conflict_action: conflictAction});
    }
    if(filesToDownload.length){
        let found = filesToDownload.find(ff => ff.fileName && ff.fileName === item.filename);
        found = found ? found : filesToDownload.find(ff => ff.size && ff.size === item.fileSize);
        if(found){
            let idx = filesToDownload.indexOf(found);
            if(found.fileName){
                try{
                    removeTab(found.tabId);
                } catch (e){

                }
            }
            filesToDownload.splice(idx, 1);
            suggest(found.fName + '\\' + item.filename, 'uniquify');
        }
    }
});

async function downloadFile(params){
    params.filename = params.filename.replaceAll(/\s/g, '');
    await chrome.downloads.download(params)
}

async function openAndDo(params){
    let date = getDate();
    let links = params.links;
    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        let newTab = await chrome.tabs.create({url: link.href, active: false, pinned: true});
        setTimeout(async () => {
            await chrome.scripting.executeScript({
                target : {tabId : newTab.id},
                func : downloadAllImages,
                args : [params.selId, newTab.id, link.isDoc, date]
            });
        }, link.isDoc ? 2000 : 0)

    }
}

function waitFwdDoc(fwdDoc){
    filesToDownload.push(fwdDoc);
}


async function downloadAllImages(selId, tabId, isDoc, date){
    let folderName = selId + '__' + date;

    const func = async function(){
        console.log("я туточки")
        let elementsByTagName = document.querySelectorAll('img');
        console.log(elementsByTagName.length)
        for (let i = 0; i < elementsByTagName.length; i++) {
            let img = elementsByTagName[i];
            const src = img.src;
            const fetchResponse = await fetch(src);
            const blob = await fetchResponse.blob();
            const mimeType = blob.type;
            let link = URL.createObjectURL(blob);
            let name = 'dfg'

            const start = src.lastIndexOf('/') + 1;
            const end = src.indexOf('.', start);
            name = src.substring(start, end === -1 ? undefined : end);
            name = name.replace(/[^a-zA-Z0-9]+/g, '-');
            name += '.' + mimeType.substring(mimeType.lastIndexOf('/') + 1);
            let ext = name.substring(name.lastIndexOf('.'));
            name = folderName + '\\' + name.substring(0, 10) + ext;

            await chrome.runtime.sendMessage({method: 'waitFwdDoc', params: {size: blob.size, tabId: tabId, fName: folderName}});
            await chrome.runtime.sendMessage({method: 'downloadLink', params: {url: link, filename: name}});
            await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});
        }
    }

    try{
        if(!isDoc)
            window.onload = func
        else
            await func()
    } catch (e){
        try{
            await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});
        } catch (ignore) {}
    }
    return resp;
}


function getDate(){
    let date = new Date();
    let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    return day + '_' + month + "_" + year;
}

function removeTab(tabId){
    chrome.tabs.remove(tabId);
}


