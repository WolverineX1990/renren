const request = require('request');
const CONFIG = require('./config');
const getSign = require('./sign');
const appendFile = require('./fs');

const RR_API_URL = 'https://rrwapi.renren.com/';

function getAlbums(userId) {
    var url = RR_API_URL + 'feed/v1/albums';
    const data = {
        appKey: CONFIG.appKey,
        app_ver: '1.0.0',
        count: 50,
        home_id: userId,
        uid: userId,
        sessionKey: CONFIG.sessionKey,
        callId: (new Date).getTime().toString(),
        product_id: 2080928,
    };
    data.sig = getSign(data, '759140cb2e534416086a59be812d0867');
    request({
        url,
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    }, function(error, response, body) {
        const res = JSON.parse(body);
        const albums = res.data;
        parseAlbums(albums, [], userId);
    });
}

function parseAlbums(albums, albumList, userId) {
    if (!albums.length) {
        exportHtml(albumList, userId);
        console.log('albums已经解析完成');
        return;
    }
    console.log('还需解析' + albums.length + '个相册');
    const album = albums.pop();
    getAlbumDetail(album.uid, album.id, [], 0).then(imgList => {
        return albumList.push({
            id: album.id,
            name: album.name,
            imgList,
        });
        // var text = '相册： ' + album.name + '\r\n' + imgList.join('\r\n') + '\r\n\r\n\r\n';
        // return appendFile('./' + album.uid, text);
    }).then(() => parseAlbums(albums, albumList, userId));
}

function getAlbumDetail(userId, albumId, imgList, after) {
    var url = RR_API_URL + 'feed/v1/album';
    const data = {
        uid: userId,
        album_id: albumId, 
        appKey: CONFIG.appKey,
        app_ver: '1.0.0',
        count: 20,
        sessionKey: CONFIG.sessionKey,
        callId: (new Date).getTime().toString(),
        product_id: 2080928,
    };

    data.after = after;
    data.sig = getSign(data, '759140cb2e534416086a59be812d0867');

   return requestPromise({
        url,
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then((body) => {
        var res = JSON.parse(body);
        if (!res.data) {
            return imgList;
        }
        var list = res.data.map(item => item.large_url);
        imgList = imgList.concat(list);
        if (imgList.length < res.album.size) {
            return getAlbumDetail(userId, albumId, imgList, res.tail_id);
        } else {
            return imgList;
        }
    });
}


function requestPromise(data) {
    return new Promise(function(resolve, reject) {
        request(data, function(error, response, body) {
            if (error) {
                reject(error)
            } else {
                resolve(body);
            }
        });
    });
}

function exportHtml(albumList, userId) {
   const content = albumList.map(album => getAlbumHtml(album)).join('');
   const html = `<!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Document</title>
       <style>
           * {
               margin: 0;
               padding: 0;
           }
   
           .title {
               font-weight: bold;
               font-size: 20px;
               padding: 7px 12px;
           }
   
           .img-list {
               display: flex;
               flex-wrap: wrap;
           }
   
           .img {
               width: 30%;
               padding: 5px;
           }
       </style>
   </head>
   <body>
       ${content}
   </body>
   </html>`;

   appendFile(`./${userId}.html`, html);
}

function getAlbumHtml(album) {
    const imgHtml = album.imgList.map(imgUrl => `<img class="img" src="${imgUrl}" />`).join('')
    return `<div class="title">${album.name}:${album.id}</div>
    <div class="img-list">
        ${imgHtml}
    </div>`;
}

getAlbums(307329586);
