$(function() {
var qs;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    qs = {};
    while (match = search.exec(query))
       qs[decode(match[1])] = decode(match[2]);
})();

var channels;
if ("channel" in qs) {
channels = [qs['channel']], // Channels to initially join
	fadeDelay = 5000, // Set to false to disable chat fade
	showChannel = true, // Show repespective channels if the channels is longer than 1
	useColor = true, // Use chatters' colors or to inherit
	showBadges = true, // Show chatters' badges
	showEmotes = true, // Show emotes in the chat
	doTimeouts = true, // Hide the messages of people who are timed-out
	doChatClears = true, // Hide the chat from an entire channel
	showHosting = true, // Show when the channel is hosting or not
	showConnectionNotices = true; // Show messages like "Connected" and "Disconnected"
} else {
channels = ['yongjhih', 'mistakelolz', 'twitchplayspokemon'], // Channels to initially join
	fadeDelay = 5000, // Set to false to disable chat fade
	showChannel = true, // Show repespective channels if the channels is longer than 1
	useColor = true, // Use chatters' colors or to inherit
	showBadges = true, // Show chatters' badges
	showEmotes = true, // Show emotes in the chat
	doTimeouts = true, // Hide the messages of people who are timed-out
	doChatClears = true, // Hide the chat from an entire channel
	showHosting = true, // Show when the channel is hosting or not
	showConnectionNotices = true; // Show messages like "Connected" and "Disconnected"
}
var options = {
    options: {
        debug: true
    },
    channels: channels
};

if (qs['username'] && qs['password']) {
    options = {
        options: {
            debug: true
        },
        identity: {
            username: qs['username'],
            password: qs['password']
        },
        channels: channels
    };
}

var chat = document.getElementById('chat'),
	defaultColors = ['rgb(255, 0, 0)','rgb(0, 0, 255)','rgb(0, 128, 0)','rgb(178, 34, 34)','rgb(255, 127, 80)','rgb(154, 205, 50)','rgb(255, 69, 0)','rgb(46, 139, 87)','rgb(218, 165, 32)','rgb(210, 105, 30)','rgb(95, 158, 160)','rgb(30, 144, 255)','rgb(255, 105, 180)','rgb(138, 43, 226)','rgb(0, 255, 127)'],
	randomColorsChosen = {},
        clientOptions = options,
	client = new irc.client(clientOptions);

function dehash(channel) {
	return channel.replace(/^#/, '');
}

function capitalize(n) {
	return n[0].toUpperCase() +  n.substr(1);
}

function htmlEntities(html) {
	function it() {
		return html.map(function(n, i, arr) {
				if(n.length == 1) {
					return n.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
						   return '&#'+i.charCodeAt(0)+';';
						});
				}
				return n;
			});
	}
	var isArray = Array.isArray(html);
	if(!isArray) {
		html = html.split('');
	}
	html = it(html);
	if(!isArray) html = html.join('');
	return html;
}

function formatEmotes(text, emotes) {
	var splitText = text.split('');
	for(var i in emotes) {
		var e = emotes[i];
		for(var j in e) {
			var mote = e[j];
			if(typeof mote == 'string') {
				mote = mote.split('-');
				mote = [parseInt(mote[0]), parseInt(mote[1])];
				var length =  mote[1] - mote[0],
					empty = Array.apply(null, new Array(length + 1)).map(function() { return '' });
				splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
				splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
			}
		}
	}
	return htmlEntities(splitText).join('')
}

function badges(chan, user, isBot) {
	
	function createBadge(name) {
		var badge = document.createElement('div');
		badge.className = 'chat-badge-' + name;
		return badge;
	}
	
	var chatBadges = document.createElement('span');
	chatBadges.className = 'chat-badges';
	
	if(!isBot) {
		if(user.username == chan) {
			chatBadges.appendChild(createBadge('broadcaster'));
		}
		if(user['user-type']) {
			chatBadges.appendChild(createBadge(user['user-type']));
		}
		if(user.turbo) {
			chatBadges.appendChild(createBadge('turbo'));
		}
	}
	else {
		chatBadges.appendChild(createBadge('bot'));
	}
	
	return chatBadges;
}

$("#subtitle").hide();
function handleChat(channel, user, message, self) {
    if (message.trim().startsWith('_')) {
        Rx.Observable.just(message.trim().slice('_'.length))
            .debounce(500 /* ms */)
            .doOnNext(function (msg) {
                $("#subtitle").show();
                $("#subtitle").text(msg);
            }).delay(5000).doOnNext(function (msg) {
                $("#subtitle").hide();
            }).subscribe();
    }
}

function chatNotice(information, noticeFadeDelay, level, additionalClasses) {
	var ele = document.createElement('div');
	
	ele.className = 'chat-line chat-notice';
	ele.innerHTML = information;
	
	if(additionalClasses !== undefined) {
		if(Array.isArray(additionalClasses)) {
			additionalClasses = additionalClasses.join(' ');
		}
		ele.className += ' ' + additionalClasses;
	}
	
	if(typeof level == 'number' && level != 0) {
		ele.dataset.level = level;
	}
	
	chat.appendChild(ele);
	
	if(typeof noticeFadeDelay == 'number') {
		setTimeout(function() {
				ele.dataset.faded = '';
			}, noticeFadeDelay || 500);
	}
	
	return ele;
}

var recentTimeouts = {};

function timeout(channel, username) {
	if(!doTimeouts) return false;
	if(!recentTimeouts.hasOwnProperty(channel)) {
		recentTimeouts[channel] = {};
	}
	if(!recentTimeouts[channel].hasOwnProperty(username) || recentTimeouts[channel][username] + 1000*10 < +new Date) {
		recentTimeouts[channel][username] = +new Date;
		chatNotice(capitalize(username) + ' was timed-out in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-timeout')
	};
	var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"][data-username="' + username + '"]:not(.chat-timedout) .chat-message');
	for(var i in toHide) {
		var h = toHide[i];
		if(typeof h == 'object') {
			h.innerText = '<Message deleted>';
			h.parentElement.className += ' chat-timedout';
		}
	}
}
function clearChat(channel) {
	if(!doChatClears) return false;
	var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"]');
	for(var i in toHide) {
		var h = toHide[i];
		if(typeof h == 'object') {
			h.className += ' chat-cleared';
		}
	}
	chatNotice('Chat was cleared in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-clear')
}
function hosting(channel, target, viewers, unhost) {
	if(!showHosting) return false;
	if(viewers == '-') viewers = 0;
	var chan = dehash(channel);
	chan = capitalize(chan);
	if(!unhost) {
		var targ = capitalize(target);
		chatNotice(chan + ' is now hosting ' + targ + ' for ' + viewers + ' viewer' + (viewers !== 1 ? 's' : '') + '.', null, null, 'chat-hosting-yes');
	}
	else {
		chatNotice(chan + ' is no longer hosting.', null, null, 'chat-hosting-no');
	}
}

client.addListener('message', handleChat);
client.addListener('timeout', timeout);
client.addListener('clearchat', clearChat);
client.addListener('hosting', hosting);
client.addListener('unhost', function(channel, viewers) { hosting(channel, null, viewers, true) });

var joinAccounced = [];
var joinAccouncedUsers = [];

client.addListener('connecting', function (address, port) {
	});
client.addListener('logon', function () {
	});
client.addListener('connectfail', function () {
	});
client.addListener('connected', function (address, port) {
	});
client.addListener('disconnected', function (reason) {
	});
client.addListener('reconnect', function () {
	});
client.on("join", function (channel, username, self) {
	});
client.addListener('part', function (channel, username) {
	});

client.addListener('crash', function () {
	});

function put(item, arr) {
    var contains = function (i, a) {
        return arr.indexOf(item) >= 0;
    };

    if (!contains(item, arr)) {
        arr.push(item);
    }
}

// liveChatId is from https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastType=all&mine=true&key={api-key}
// you can use Google Explorer: get your liveChatId from livBrodcast: https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list#try-it

// liveChat has no websocket, you cannot be as observer, you need polling it. ref. https://www.reddit.com/r/youtubegaming/comments/4kibiw/api_reading_live_chat_messages_from_javascript/
// polling this endpoint:
// https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId={liveChatId}&part=snippet&key={api-key}
// {
//  "kind": "youtube#liveChatMessageListResponse",
//  "etag": "\"ffffff-ffffffffffffffffffffffffffffffffffffffffffffffff\"",
//  "nextPageToken": "ffffffffffffffffffffffff",
//  "pollingIntervalMillis": 10000,
//  "pageInfo": {
//   "totalResults": 1,
//   "resultsPerPage": 1
//  },
//  "items": [
//   {
//    "kind": "youtube#liveChatMessage",
//    "etag": "\"ffffff-ffffffffffffffffffffffffffffffffffffffffffffffff\"",
//    "id": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
//    "snippet": {
//     "type": "textMessageEvent",
//     "liveChatId": "fffffffffffffffffffffffffffffffffffffffffffffff",
//     "authorChannelId": "ffffffffffffffffffffffff",
//     "publishedAt": "2016-06-21T17:24:24.166Z",
//     "hasDisplayContent": true,
//     "displayMessage": "test",
//     "textMessageDetails": {
//      "messageText": "test"
//     }
//    }
//   }
//  ]
// }

var SECONDS = 1000;
var MINITES = 60 * SECONDS;
var HOUR = 60 * MINITES;

if (qs['liveChatId'] && qs['liveChatKey']) {
    Rx.Observable.interval(3 * SECONDS).timeInterval().flatMap(function (i) {
        return getLiveChatMessages(qs['liveChatId'], qs['liveChatKey']);
    }).subscribe(function (chat) {
        var contains = function (item, arr) {
            return arr.indexOf(item) >= 0;
        };

        var publishedAt = new Date(chat.publishedAt);
        if (publishedAt > lastMsgDate) {
            lastMsgDate = publishedAt;
            var user = {
                username: 'youtube',
                name: qs['channel'],
                emotes: []
            };

            handleChat(qs['channel'], user, chat.textMessageDetails.messageText, true);
        }
    });
}

var lastMsgDate = new Date();

function getLiveChatMessages(liveChatId, apiKey) {
    var liveChatUrl = 'https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=' + liveChatId + '&part=snippet&key=' +  apiKey;
    return rxfetch(liveChatUrl).map(function (chat) {
        return chat.items;
    }).flatMap(function (items) {
        return Rx.Observable.from(items);
    }).map(function (item) {
        return item.snippet;
    });
}

function rxfetch(url) {
  return Rx.Observable.create(function (observer) {
    fetch(url).then(function (res) { return res.json(); })
      .then(function (json) {
        observer.onNext(json);
        observer.onCompleted();
      }).catch(observer.onError);
  });
}

client.connect();
});
