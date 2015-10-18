# Twitter Chat Suptitle

Twitch 聊天訊息彈幕面板。類似 bilibili, niconico 影音網站的彈幕功能。讓你方便地將彈幕面板即時合成到你的實況影片。

![](art/twichat-screenshot.png)

網址參數寫上台名，例如: yongjhih 台名：

```
http://twitchat.github.io/?channel=yongjhih
```

* 目前彈幕的 Color key: `1e1e1e` 就可背景透明了

## 範例影片 Demo Video

* https://youtu.be/lmmO6zVhh1o


## Development


init:

```js
var CM = new CommentManager($('#danmu'));
CM.init();
CM.start();
window.CM = CM; // global
```

send chat as suptitle:

```js
// old: client.addListener('message', function (channel, user, message, self) {});
client.on("chat", function (channel, user, message, self) {
    var danmaku = {
        "mode": 1,
        "text": message,
        "stime": 0,
        "size": 25,
        "color": 0xffffff,
        "dur": 10000
    };
    CM.send(danmaku);
});
```

## FAQ

* Twitter 暗色聊天室背景 19191e
