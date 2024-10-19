
chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        if (request.method === "downloadAllImages") {

            let newVar = await downloadAllImages();
            sendResponse({farewell: newVar});
        }

    }
);

createDownloadBtnInDlg();

$(document).on('scroll', () => {
    createDownloadBtnInDlg();
})


function createDownloadBtnInDlg(withoutCheck){
    if(!document.getElementById('dwnld')){
        let peerInfo = document.getElementsByClassName("PeerProfile__container");
        if(peerInfo && peerInfo[0]){
            peerInfo = peerInfo[0];

            let dt = document.createElement("dt");
            dt.className = "PeerProfile__label";
            dt.style = "padding-top: 10px;";
            dt.innerText = "Белая ворона";

            let dd = document.createElement("dd");
            dd.className = "PeerProfile__content PeerProfile__tags";

            let button = document.createElement("button");
            button.className = "FlatButton FlatButton--primary FlatButton--size-s im-page-action _im_page_action";
            button.style = "display: flex"
            button.id = "dwnld"

            let span = document.createElement("span");
            span.style = "position: relative; top: 5px; padding-right: 5px;"
            span.innerText = "Скачать фотки";

            let voronaImg = document.createElement("img");
            voronaImg.src = chrome.runtime.getURL("/assets/images/ext_logo/vorona32.png");
            voronaImg.style = "height: -webkit-fill-available"

            button.appendChild(span)
            button.appendChild(voronaImg);

            dd.appendChild(button);

            peerInfo.appendChild(dt);
            peerInfo.appendChild(dd);

            button.addEventListener("click", onClickDownload);
        }
    }
}

async function onClickDownload(){
    let selId =  document.getElementsByClassName('ui_rmenu_item_sel');
    if(selId && selId[0] && selId[0].title){
        selId = selId[0].title
    } else {
        selId = window.location.href;
        selId = selId.substring(selId.indexOf('sel=') + 4);
        if(selId.indexOf('&') !== -1){
            selId = selId.substring(0, selId.indexOf('&'));
        }
    }

    let links = [];
    let selectedMessages = document.getElementsByClassName("im-mess_selected");
    if(selectedMessages?.length){
        for (let i = 0; i < selectedMessages.length; i++) {
            let selectedMessage = selectedMessages[i];
            let elements;
            elements = searchPhotoLink(selectedMessage);
            if(!elements.length){
                elements = searchPhotoLink(selectedMessage, 'page_post_thumb_unsized');
            }
            if(elements.length){
                for (let j = 0; j < elements.length; j++) {
                    links.push(elements[j].href);
                }
            } else {
                elements = searchPhotoLink(selectedMessage, 'page_post_thumb_wrap');
                if(elements.length){
                    for (let j = 0; j < elements.length; j++) {
                        let el = elements[j];
                        let link = getMaxSizeLinkFromOnClick(el);
                        if(link){
                            links.push(link);
                        }
                    }
                }
            }
        }
    }
    for (const link of links) {
        await sendMsgToBackground('openAndDo', {link: link, selId})
    }
}

function searchPhotoLink(rootElement, className, acc){
    acc = acc ? acc : [];

    let elements = className ? rootElement.getElementsByClassName(className) : rootElement.getElementsByTagName('a');
    if(elements?.length){
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            if(!className){
                if(element?.innerText !== 'Посмотреть все изображения' || !isMatchContext(element.href)){
                    element = null;
                } else {
                    acc.push(element);
                    break;
                }
            } else {
                if(!element?.classList?.contains(className) || element?.tagName.toLowerCase() !== 'a'){
                    element = null;
                } else {
                    acc.push(element);
                }
            }
        }
    }
    return acc;
}


async function sendMsgToBackground(method, params){
    await chrome.runtime.sendMessage({method: method, params: params});
}

function isMatchContext(elHref){
    let href = window.location.href;
    if(!elHref?.includes('gim') || !href?.includes('gim')){
        return false;
    }
    return getGimId(href) === getGimId(elHref);
}

function getGimId(href){
    let start = href.indexOf('gim');
    href = href.substring(start);
    let end = href.indexOf('?');
    if(end === -1){
        end = href.length;
    }
    return href.substring(0, end);
}

function getMaxSizeLinkFromOnClick(element){
    let textCon = element.attributes.onclick.textContent;
    textCon = textCon.substring(textCon.lastIndexOf('https'));
    textCon = textCon.substring(0, textCon.indexOf('"'));
    textCon = textCon.replaceAll('\\', '');
    return textCon;

}




