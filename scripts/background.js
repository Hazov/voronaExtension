
let fwdDocs = [];

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
    if(fwdDocs.length){
        let found = fwdDocs.find(ff => ff.fileName === item.filename);
        if(found){
            let idx = fwdDocs.indexOf(found);
            fwdDocs.splice(idx, 1);
            suggest(found.fName + '\\' + item.filename, 'uniquify');
            return;
        }
    }
    suggest(item.fileName, item.conflictAction);
});

async function downloadFile(params){
    await chrome.downloads.download(params)
}

async function openAndDo(params){
    let date = getDate();
    let links = params.links;
    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        let newTab = await chrome.tabs.create({url: link.href, active: false, pinned: true});
        await chrome.scripting.executeScript({
            target : {tabId : newTab.id},
            func : downloadAllImages,
            args : [params.selId, newTab.id, link.isDoc, date]
        });
    }
}

function waitFwdDoc(fwdDoc){
    fwdDocs.push(fwdDoc);
}


async function downloadAllImages(selId, tabId, isDoc, date){

    let fName = selId + '__' + date;
    try{
        window.onload = async function(){
            if(!isDoc){
                let elementsByTagName = document.querySelectorAll('img');

                for (let i = 0; i < elementsByTagName.length; i++) {
                    let img = elementsByTagName[i];
                    const src = img.src;

                    const fetchResponse = await fetch(src);
                    const blob = await fetchResponse.blob();
                    const mimeType = blob.type;

                    const start = src.lastIndexOf('/') + 1;
                    const end = src.indexOf('.', start);
                    let name = src.substring(start, end === -1 ? undefined : end);
                    name = name.replace(/[^a-zA-Z0-9]+/g, '-');
                    name += '.' + mimeType.substring(mimeType.lastIndexOf('/') + 1);
                    let ext = name.substring(name.lastIndexOf('.'));
                    name = fName + '\\' + name.substring(0, 10) + ext;
                    await chrome.runtime.sendMessage({method: 'downloadLink', params: {url: URL.createObjectURL(blob), filename: name, conflictAction: 'uniquify'}})
                }
                await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});
            } else {
                let fileName = document.getElementsByClassName('docs_panel_name')[0].children[0].innerHTML;
                await chrome.runtime.sendMessage({method: 'waitFwdDoc', params: {fileName: fileName, fName: fName, tabId: tabId}});
                document.getElementsByClassName('FlatButton--primary')[0].click();
            }
        }
    } catch (e){
        await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});
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


