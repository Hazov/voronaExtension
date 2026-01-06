
chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        if (request.method === "downloadAllImages") {

            let newVar = await downloadAllImages();
            sendResponse({farewell: newVar});
        }

    }
);

createDownloadBtnInDlg();

$(document).on('click', () => {
    createDownloadBtnInDlg();
})

function createDownloadBtnInDlg(){
    if(!document.getElementById('dwnld')){
        let peerInfo = document.getElementsByClassName("ConvoUserInfoBanner__container");
        if(peerInfo && peerInfo[0]){
            peerInfo = peerInfo[0];

            let dt = document.createElement("dt");
            dt.className = "ConvoUserInfoBannerDescription__title";
            dt.style = "padding-top: 10px;";
            dt.innerText = "Белая ворона";

            let dd = document.createElement("dd");
            dd.className = "ConvoUserInfoBannerDescription__conent";

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
    let userId = getUserId();
    let links = [];
    let selectedMessages = $('*[class*="ConvoHistory__messageWrapper"]').filter(function() {
        const prevElem = $(this).prev();
        const nextElem = $(this).next();

        // Проверяем предыдущего и следующего соседа
        return (
            prevElem.is('[class*="selectTogglerActive"]') ||
            nextElem.is('[class*="selectTogglerActive"]')
        );
    });
    for (let i = 0; i < selectedMessages.length; i++) {
        links.push(...searchPhotoLinks(selectedMessages[i]));
    }
    await sendMsgToBackground('openAndDo', {links: links, selId: userId})
}

function getUserId(){
    let userId = 'undefined';
    userId = $('h2.ConvoTitle__author').first().text();
    if(!userId){
        userId = window.location.href;
        userId = userId.substring(userId.indexOf('convo/') + 6);
        if(userId.indexOf('?') !== -1){
            return userId.substring(0, userId.indexOf('?'));
        }
    } else {
        return userId;
    }
    return 'undefined'
}

function searchPhotoLinks(messElement){
    let links = [];
    links.push(...getSimpleLinks(messElement));
    return links;
}

function getSimpleLinks(messElement){
    let links = [];

    $(messElement).find('.AttachPhotos__link img').each(function() {
        let src = $(this).attr('src');

        if (src && /^http[s]*?:/.test(src)) {
            links.push({href: src, isDoc: false})
        }
    });

    $(messElement).find('.AttachDocPreview').each(function() {
        let href = $(this).attr('href');

        if (href && /^http[s]*?:/.test(href)) {
            links.push({href: href, isDoc: true})
        }
    });
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




