
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


function createDownloadBtnInDlg(){
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
    let selId = getSelId();
    let links = [];
    let selectedMessages = document.getElementsByClassName("im-mess_selected");
    for (let i = 0; i < selectedMessages.length; i++) {
        links.push(...searchPhotoLinks(selectedMessages[i]));
    }
    await sendMsgToBackground('openAndDo', {links: links, selId: selId})
}

function getSelId(){
    let selId =  document.getElementsByClassName('ui_rmenu_item_sel');
    if(selId && selId[0] && selId[0].title){
        return selId[0].title
    } else {
        selId = window.location.href;
        selId = selId.substring(selId.indexOf('sel=') + 4);
        if(selId.indexOf('&') !== -1){
            return selId.substring(0, selId.indexOf('&'));
        }
    }
    return 'undefined'
}

function searchPhotoLinks(messElement){
    let links = [];
    links.push(...getSimpleLinks(messElement));
    links.push(...getForwardedLinks(messElement));
    return links;
}

function getSimpleLinks(messElement){
    let links = [];
    let gimId = getGimId(window.location.href)
    //Обычные сообщения
    let messId;
    let classWithMessId = messElement.classList.values()
        .filter(f => typeof f === 'string')
        .find(className => className.search(/\d/) !== -1);
    if(classWithMessId){
        messId = classWithMessId.replaceAll(/\D/g, '');
    }
    if(messId){
        let link = 'https://vk.com/' + gimId + '?act=browse_images&id=' + messId;
        if(link){
            links.push({href: link, isDoc: false});
        }
    }
    return links;
}

function getForwardedLinks(messElement){
    let links = [];
    let fwdMessages = messElement.getElementsByClassName('im-mess--inline-fwd');
    for (let i = 0; i < fwdMessages.length; i++) {
        let mess = fwdMessages[i];
        let hrefs = mess.getElementsByTagName('a');
        for (let j = 0; j < hrefs.length; j++) {
            let a = hrefs[j];
            if(a.classList.toString().includes('page_post_thumb_wrap')){
                links.push({href: getMaxSizeLinkFromOnClick(a), isDoc: false});
            } else if(a.classList.toString().includes('page_post_thumb_unsized')){
                links.push({href: a.href, isDoc: true});
            }
        }
    }
    return links;
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

async function sendMsgToBackground(method, params){
    try{
        await chrome.runtime.sendMessage({method: method, params: params});
    }catch (e){
        chrome.runtime.reload()
    }

}




