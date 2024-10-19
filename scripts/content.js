
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
            span.style = "position: relative; top: 4px; padding-right: 5px;"
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
            let element;
            element = searchPhotoLink(selectedMessage);
            if(!element){
                element = searchPhotoLink(selectedMessage, 'page_post_thumb_unsized');
            }
            if(element){
                links.push(element.href);
            } else {
                element = searchPhotoLink(selectedMessage, 'page_post_thumb_wrap');
                if(element){
                    let link = element.style.backgroundImage;
                    console.log(link)
                    if(link){
                        link = link.substring(5, link.length - 2);
                    }
                    links.push(link);
                }
            }


        }
    }
    for (const link of links) {
        await sendMsgToBackground('openAndDo', {link: link, selId})
    }


    console.log(links.length);
}

function searchPhotoLink(element, className){
    let element1 = className ? element.getElementsByClassName(className) : element.getElementsByTagName('a');
    if(element1){
        element1 = element1[0];
        if(!className && element1?.innerText !== 'Посмотреть все изображения'){
            element1 = null;
        }
        if(className && (!element1?.classList?.contains(className) || element1?.tagName.toLowerCase() !== 'a')){
            element1 = null;
        }
    }

    if (!element1 && element.children != null){
        for(let i= 0; i < element.children.length; i++){
            element1 = searchPhotoLink(element.children[i], className);
            if(element1) break;
        }
    }
    return element1;
}


async function sendMsgToBackground(method, params){
    const response = await chrome.runtime.sendMessage({method: method, params: params});
    console.log(response);
}




