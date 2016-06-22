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

soundManager.setup({
url: 'https://github.com/hiddentao/google-tts/raw/master/soundmanager2_debug.swf',
//url: 'swf/soundmanager2.swf',
preferFlash: false,
onready: function() {
    var HTML = '\
    <div> \
        <label for="demo_language">Language:</label> \
        <select id="demo_language"> \
            <option value="" disabled="disabled">(Select language)</option> \
        </select> \
    </div> \
    <div> \
        <label for="demo_text">Text:</label> \
        <textarea rows="5" cols="60" id="demo_text" /> \
    </div> \
    <button id="demo_play">Play!</button> \
    ';
    $("#tts_demo").html(HTML);
}
});

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

function handleChat(channel, user, message, self) {
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
client.addListener('join', function (channel, username) {
    console.log(username + " join");
	});
client.addListener('part', function (channel, username) {
	});
client.addListener('crash', function () {
	});

var subject = new Rx.Subject();
subject.doOnNext(function (username) {
    console.log(username + " subscription");
})
.map(function (username) {
    return Rx.Observable.return(username)
        .doOnNext(function (username) {
            console.log(username + " playsound");
            //playSoundFadeOut('https://www.myinstants.com/media/sounds/epic.swf_1.mp3', 10000);
            playSound('https://www.myinstants.com/media/sounds/epic.swf_1.mp3');
            $("#subscription").show();
        })
        .delay(10000)
        .doOnNext(function (msg) {
            $("#subscription").hide();
        });
})
.concatAll()
.subscribe();

client.on("subscription", function (channel, username) {
    console.log(username + " subscription");
    subject.onNext(username);
});
client.on("resub", function (channel, username, months, message) {
    console.log(username + " resub");
});

function contains (i, a) {
    return arr.indexOf(item) >= 0;
};

function put(item, arr) {
    if (!contains(item, arr)) {
        arr.push(item);
    }
}

//https://api.twitch.tv/kraken/channels/xxxxxxxx/follows
//
// {
//     "follows": [
//     {
//         "created_at": "2016-06-22T19:24:46Z",
//         "_links": {
//             "self": "https://api.twitch.tv/kraken/users/uuuuuuuuu/follows/channels/xxxxxxxx"
//         },
//         "notifications": false,
//         "user": {
//             "_id": 00000000,
//             "name": "uuuuuuuuu",
//             "created_at": "2014-09-04T17:49:18Z",
//             "updated_at": "2016-06-22T19:30:20Z",
//             "_links": {
//                 "self": "https://api.twitch.tv/kraken/users/e4e2e7343"
//             },
//             "display_name": "uuuuuuuuu",
//             "logo": "https://static-cdn.jtvnw.net/jtv_user_pictures/uuuuuuuuu-profile_image-ffffffffffffffff-300x300.jpeg",
//             "bio": "xxxxxxxxxxxxxxxxxxxxxx",
//             "type": "user"
//         }
//     }
//     ],
//     "_total": 1,
//     "_links": {
//         "self": "https://api.twitch.tv/kraken/channels/xxxxxxxx/follows?direction=DESC&limit=25&offset=0",
//         "next": "https://api.twitch.tv/kraken/channels/xxxxxxxx/follows?cursor=0000000000000000000&direction=DESC&limit=25"
//     },
//     "_cursor": "0000000000000000000"
// }

function getTwitchFollows(channel) {
    var url = 'https://api.twitch.tv/kraken/channels/' + channel + '/follows';
    return rxfetch(url).flatMap(function (json) {
        return Rx.Observable.from(json.follows);
    });
}

function rxTwitch(url) {
  return rxfetch(url).flatMap(function (json) {
    var next = (json._links && json._links.next) ? rxfetch(json._links.next) : Rx.Observable.empty();
    return Rx.Observable.concat(Rx.Observable.just(json), next);
  });
}

var SECONDS = 1000;
var MINITES = 60 * SECONDS;
var HOUR = 60 * MINITES;

var lastSubscribeDate = new Date();

Rx.Observable.interval(10 * SECONDS).timeInterval().flatMap(function (i) {
    //playSound('https://www.myinstants.com/media/sounds/epic.swf_1.mp3');
    return getTwitchFollows(qs['channel']);
}).subscribe(function (follow) {
    var created_at = new Date(follow.created_at);
    if (created_at > lastSubscribeDate) {
        lastSubscribeDate = created_at;

        if (qs['username'] && qs['password']) {
            var welcomeSubscribeMsg = '歡迎 ' + follow.user.name + ' 的訂閱！';
            console.log(welcomeSubscribeMsg);
            client.say(capitalize(dehash(qs['channel'])), welcomeSubscribeMsg);
        }
        // welcomeAnimation and welcomeSound
        subject.onNext(follow.user.name);
    }
});

function rxfetch(url) {
  return Rx.Observable.create(function (observer) {
    fetch(url).then(function (res) { return res.json(); })
      .then(function (json) {
        observer.onNext(json);
        observer.onCompleted();
      }).catch(observer.onError);
  });
}

function startsWithIgnoreCase(source, pattern) {
    return source.substr(0, pattern.length).toLowerCase().startsWith(pattern.toLowerCase());
}

function playSound(url) {
    var sound = soundManager.getSoundById(url);
    if (!sound) {
        sound = soundManager.createSound({
            id: url,
            url: url
        });
    }
    sound.play();
}

/**
 * Allow mixed sounds
 */
function playSounds(url) {
    var sound = soundManager.createSound({
        url: url
    });
    sound.play();
}

function playSoundFadeOut(url, duration) {
    var id = Math.random().toString();
    sound = soundManager.createSound({
        id: id,
        url: url,
        from: 0,
        to: duration
    });
    soundManager.fadeTo(id, duration);
    sound.play();
}

client.connect();
