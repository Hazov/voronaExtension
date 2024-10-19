chrome.runtime.onMessage.addListener(
     function(request, sender, sendResponse) {
        if (request.method === "openAndDo") {
            openAndDo(request.params);
        } else if(request.method === 'removeTab'){
            removeTab(request.params.tabId);
        }

    }
);

async function openAndDo(params){
    let newTab = await chrome.tabs.create({url: params.link, active: false, pinned: true});
    chrome.scripting
        .executeScript({
            target : {tabId : newTab.id},
            func : downloadAllImages,
            args : [params.selId, newTab.id]
        })
        .then(injectionResults => {
            setTimeout(() => {
                if(newTab){
                    removeTab(newTab.id)
                }
            }, 10000)
        });
}


async function downloadAllImages(selId, tabId){

    try{
        setTimeout(async () => {
            let elementsByTagName = document.querySelectorAll('img');
            if(!elementsByTagName.length){
                let elementsByClassNameElement = document.getElementsByClassName('FlatButton--primary');
                if(elementsByClassNameElement){
                    if(elementsByClassNameElement.length){
                        elementsByClassNameElement[0].click()
                    }
                }
            } else {
                for (let i = 0; i < elementsByTagName.length; i++) {
                    let img = elementsByTagName[i];
                    const src = img.src;

                    // Fetch the image as a blob.
                    const fetchResponse = await fetch(src);
                    const blob = await fetchResponse.blob();
                    const mimeType = blob.type;

                    // Figure out a name for it from the src and the mime-type.
                    const start = src.lastIndexOf('/') + 1;
                    const end = src.indexOf('.', start);
                    let name = src.substring(start, end === -1 ? undefined : end);
                    name = name.replace(/[^a-zA-Z0-9]+/g, '-');
                    name += '.' + mimeType.substring(mimeType.lastIndexOf('/') + 1);
                    name = selId + '__' + name;

                    // Download the blob using a <a> element.
                    const a = document.createElement('a');
                    a.setAttribute('href', URL.createObjectURL(blob));
                    a.setAttribute('download', name);
                    a.click();
                }
            }
            sendMsgToBackground('removeTab', {tabId: tabId})
        }, 5000)
    } catch (e){
        sendMsgToBackground('removeTab', {tabId: tabId})

    }
    return resp;
}

function removeTab(tabId){
    setTimeout(() => {
        chrome.tabs.remove(tabId)
    }, 3000)

}


async function sendMsgToBackground(method, params){
    await chrome.runtime.sendMessage({method: method, params: params});
}


