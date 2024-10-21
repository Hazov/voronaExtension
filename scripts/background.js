chrome.runtime.onMessage.addListener(
     function(request, sender, sendResponse) {
        if (request.method === "openAndDo") {
            openAndDo(request.params);
        } else if(request.method === 'removeTab'){
            removeTab(request.params.tabId);
        } else if(request.method === 'downloadLink'){
            downloadFile(request.params);
        }

    }
);

async function downloadFile(params){
    window.onload = async function(){
        await chrome.downloads.download(params)
    }
}

async function openAndDo(params){
    let newTab = await chrome.tabs.create({url: params.link, active: false, pinned: true});
    chrome.scripting.executeScript({
            target : {tabId : newTab.id},
            func : downloadAllImages,
            args : [params.selId, newTab.id]
        })
        .then(injectionResults => {});
}


async function downloadAllImages(selId, tabId){
    let date = getDate();
    try{
        window.onload = async function(){
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
                    name = selId + '__' + date + '\\' + name
                    await chrome.runtime.sendMessage({method: 'downloadLink', params: {url: URL.createObjectURL(blob), filename: name}})
                }
            }
            await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});
        }
    } catch (e){
        await chrome.runtime.sendMessage({method: 'removeTab', params: {tabId: tabId}});

    }
    return resp;
}

function removeTab(tabId){
    chrome.tabs.remove(tabId);
}

function getDate(){
    let date = new Date();
    let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    return day + '_' + month + "_" + year;
}


