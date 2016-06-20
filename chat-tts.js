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
    //url: 'https://github.com/hiddentao/google-tts/raw/master/soundmanager2_debug.swf',
    url: 'swf/soundmanager2.swf',
    preferFlash: false,
    onready: function() {
      if (!window.GoogleTTS) {
        $("#error").text("Sorry, the google-tts script couldn't be loaded.");
        return;
      } else {
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
    }
  });

if(typeof soundManager !== 'undefined') {
    soundManager.fadeTo = function (id, dur, toVol, callback) {
        dur      = dur || 1000;
        toVol    = toVol || 0;
        callback = typeof callback == 'function' ? callback : function () {};
        var s    = soundManager.getSoundById(id),
        k = s.volume,
        t = dur/Math.abs(k - toVol),
        i = setInterval(function () {
            k = k > toVol ? k - 1 : k + 1;
            s.setVolume(k);
            if (k == toVol) {
                callback.call(this);
                clearInterval(i);
                i = null;
            }
        }, t);
    }
}

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
var alias = qs['alias'] ? qs['alias'] : qs['channel'];

var chat = document.getElementById('chat'),
	defaultColors = ['rgb(255, 0, 0)','rgb(0, 0, 255)','rgb(0, 128, 0)','rgb(178, 34, 34)','rgb(255, 127, 80)','rgb(154, 205, 50)','rgb(255, 69, 0)','rgb(46, 139, 87)','rgb(218, 165, 32)','rgb(210, 105, 30)','rgb(95, 158, 160)','rgb(30, 144, 255)','rgb(255, 105, 180)','rgb(138, 43, 226)','rgb(0, 255, 127)'],
	randomColorsChosen = {},
	clientOptions = {
			options: {
					debug: true
				},
			channels: channels
		},
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
	var chan = dehash(channel),
		name = user.username,
		chatBubbler = document.createElement('div'),
		chatBubble = document.createElement('span'),
		chatLine = document.createElement('span'),
		chatTail = document.createElement('span'),
		chatChannel = document.createElement('span'),
		chatAvatar = document.createElement('div'),
		chatName = document.createElement('span'),
		chatColon = document.createElement('span'),
		chatMessage = document.createElement('span');
	
	var color = useColor ? user.color : 'inherit';
	if(color === null) {
		if(!randomColorsChosen.hasOwnProperty(chan)) {
			randomColorsChosen[chan] = {};
		}
		if(randomColorsChosen[chan].hasOwnProperty(name)) {
			color = randomColorsChosen[chan][name];
		}
		else {
			color = defaultColors[Math.floor(Math.random()*defaultColors.length)];
			randomColorsChosen[chan][name] = color;
		}
	}
	
	chatLine.className = 'chat-line bubble';
	chatLine.dataset.username = name;
	chatLine.dataset.channel = channel;
	
	if(user['message-type'] == 'action') {
		chatLine.className += ' chat-action';
	}

	chatChannel.className = 'chat-channel';
	chatChannel.innerHTML = chan;
	
	chatName.className = 'chat-name';
	chatName.style.color = color;
	chatName.innerHTML = user['display-name'] || name;
	
	chatColon.className = 'chat-colon';
	
	chatMessage.className = 'chat-message';
	
	chatMessage.style.color = color;
	chatMessage.innerHTML = showEmotes ? formatEmotes(message, user.emotes) : htmlEntities(message);

	chatBubbler.className = 'chat-bubbler';
	chatAvatar.className = 'chat-avatar';
	
	if(client.opts.channels.length > 1 && showChannel) chatLine.appendChild(chatChannel);
	if(showBadges) chatLine.appendChild(badges(chan, user, self));
	//chatLine.appendChild(chatName);
	chatAvatar.appendChild(chatName);
	//chatLine.appendChild(chatColon);
	chatAvatar.appendChild(chatColon);
	chatLine.appendChild(chatMessage);
	chatBubble.appendChild(chatLine);
	chatBubbler.appendChild(chatAvatar);
	chatBubbler.appendChild(chatBubble);
	chat.appendChild(chatBubbler);
	
	if(typeof fadeDelay == 'number') {
		setTimeout(function() {
				chatLine.dataset.faded = '';
			}, fadeDelay);
	}
	
	if(chat.children.length > 50) {
		var oldMessages = [].slice.call(chat.children).slice(0, 10);
		for(var i in oldMessages) oldMessages[i].remove();
	}

        if (startsWithIgnoreCase(message.trim(), '!tw')) responsiveVoice.speak(message.trim().slice('!tw'.length), 'Chinese Female');
        else if (startsWithIgnoreCase(message.trim(), '!jp')) responsiveVoice.speak(message.trim().slice('!jp'.length), 'Japanese Female');
        else if (startsWithIgnoreCase(message.trim(), '!kr')) responsiveVoice.speak(message.trim().slice('!kr'.length), 'Korean Female');
        else if (startsWithIgnoreCase(message.trim(), '!us')) responsiveVoice.speak(message.trim().slice('!us'.length), 'US English Female');
        else if (startsWithIgnoreCase(message.trim(), '!en')) responsiveVoice.speak(message.trim().slice('!en'.length), 'US English Female');
        else if (startsWithIgnoreCase(message.trim(), '!banzai')) {
            playSoundFadeOut('http://taira-komori.jpn.org/sound_os/event01/banzai.mp3', 5500);
        }
        else if (startsWithIgnoreCase(message.trim(), '!spawn')) {
            playSound('http://vignette3.wikia.nocookie.net/leagueoflegends/images/c/cf/Female1_OnMinionsSpawn_1.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!executed')) {
            playSound('http://vignette3.wikia.nocookie.net/leagueoflegends/images/3/37/Female1_OnChampionKillTurretH.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!1blood') || startsWithIgnoreCase(message.trim(), '!firstblood')) {
            playSound('http://vignette1.wikia.nocookie.net/leagueoflegends/images/4/4c/Female1_OnFirstBlood_1.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!aced')) {
            playSound('http://vignette3.wikia.nocookie.net/leagueoflegends/images/8/89/Female1_OnAce_1.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!unstop')) {
            playSound('http://vignette4.wikia.nocookie.net/leagueoflegends/images/5/56/Female1_OnKillingSpreeSet3You.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!legendary')) {
            playSound('http://vignette4.wikia.nocookie.net/leagueoflegends/images/8/8c/Female1_OnKillingSpreeSet6You1.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!2kill') || startsWithIgnoreCase(message.trim(), '!doublekill')) {
            playSound('sound/double_kill.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!3kill') || startsWithIgnoreCase(message.trim(), '!triplekill')) {
            playSound('sound/triple_kill.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!4kill') || startsWithIgnoreCase(message.trim(), '!quadrakill')) {
            playSound('sound/quadra_kill.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!5kill') || startsWithIgnoreCase(message.trim(), '!pentakill') || startsWithIgnoreCase(message.trim(), '!penta')) {
            playSound('sound/penta_kill.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!godlike')) {
            //soundManager.createSound({ url: 'http://vignette2.wikia.nocookie.net/leagueoflegends/images/e/e9/Female1_OnKillingSpreeSet5You1.ogg'}).play();
            playSound({ url: 'http://vignette2.wikia.nocookie.net/leagueoflegends/images/e/e9/Female1_OnKillingSpreeSet5You1.ogg'}).play();
        }
        else if (startsWithIgnoreCase(message.trim(), '!laugh1')) {
            playSound('http://vignette2.wikia.nocookie.net/leagueoflegends/images/d/d0/Teemo.laugh1.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!laugh2')) {
            playSound('http://vignette2.wikia.nocookie.net/leagueoflegends/images/3/33/Teemo.laugh2.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!laugh3')) {
            playSound('http://vignette2.wikia.nocookie.net/leagueoflegends/images/1/10/Teemo.laugh3.ogg');
        }
        else if (startsWithIgnoreCase(message.trim(), '!clap4')) {
            playSound('http://www.sounds.beachware.com/2illionzayp3may/wlvwsnyw/CLAPPNG1.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!clap3')) {
            playSound('http://cd.textfiles.com/999wavs/WAVS_A/APPLAUS2.WAV');
        }
        else if (startsWithIgnoreCase(message.trim(), '!clap2')) {
            playSound('http://www.4uall.net/free-sound-effects/SF-free-sound-effects/CLAPS.WAV');
        }
        else if (startsWithIgnoreCase(message.trim(), '!claps')) {
            playSound('http://taira-komori.jpn.org/sound_os/event01/clapping_short.mp3');
        }
        else if (startsWithIgnoreCase(message.trim(), '!clap')) {
            playSound('http://maennerseiten.de/klaps.wav');
        }
        else if (startsWithIgnoreCase(message.trim(), '!bravo')) {
            playSoundFadeOut('http://taira-komori.jpn.org/sound_os/event01/clapping_bravo.mp3', 5000);
        }


        // !bot
        if (!self && qs['firebase']) {
            if (qs['firebase_email'] && qs['firebase_password']) {
                var ref = new Firebase("https://" + qs['firebase'] + ".firebaseio.com/");
                firebaseSignInWithPassword(ref, qs['firebase_email'], qs['firebase_password']).map(function (auth) {
                    console.log(auth);
                    return ref.child("stats").child(user.username);
                }).flatMap(function (chatterRef) {
                    return firebaseGet(chatterRef).doOnNext(function (chatterSnap) {
                        var stay_duration = 0;
                        try {
                            stay_duration = chatterSnap.val().stay_duration;
                        } catch (e) {
                            //console.warn();
                        }

                        var chat_count = 0;
                        try {
                            chat_count = chatterSnap.val().chat_count;
                        } catch (e) {
                            //console.warn();
                        }

                        console.log(chatterSnap.key());
                        console.log(chatterSnap.val());
                        chatterRef.set({
                            "chat_count": chat_count + 1,
                            "stay_duration": stay_duration
                        });
                    });
                })
                .subscribe();
            }
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
		if(showConnectionNotices) {
			chatNotice('Connecting', 1000, -4, 'chat-connection-good-connecting');
		}
	});
client.addListener('logon', function () {
		if(showConnectionNotices) chatNotice('Authenticating', 1000, -3, 'chat-connection-good-logon');
	});
client.addListener('connectfail', function () {
		if(showConnectionNotices) chatNotice('Connection failed', 1000, 3, 'chat-connection-bad-fail');
	});
client.addListener('connected', function (address, port) {
		if(showConnectionNotices) chatNotice('Connected', 1000, -2, 'chat-connection-good-connected');
		joinAccounced = [];
	});
client.addListener('disconnected', function (reason) {
		if(showConnectionNotices) chatNotice('Disconnected: ' + (reason || ''), 3000, 2, 'chat-connection-bad-disconnected');
	});
client.addListener('reconnect', function () {
		if(showConnectionNotices) chatNotice('Reconnected', 1000, 'chat-connection-good-reconnect');
	});
client.addListener('join', function (channel, username) {
                    console.log('!startsWith: ' + username + ': ' + (!username.startsWith('justinfan')));
                    console.log('contains: ' + username + ': ' + contains(user, joinAccouncedUsers));
                    console.log('!startsWith && !contains: ' + username + ': ' + (!username.startsWith('justinfan') && !contains(username, joinAccouncedUsers)));

                    if (!username.startsWith('justinfan') && !contains(username, joinAccouncedUsers)) {
                        if (!contains(username, joinAccouncedUsers)) {
                            console.log('!contains{: ' + username + ': ' + !contains(user, joinAccouncedUsers));
                            put(username, joinAccouncedUsers);
                            console.log('!contains}: ' + username + ': ' + !contains(user, joinAccouncedUsers));
                            return;
                        }
                        if (showConnectionNotices) chatNotice(capitalize(dehash(username)) + ' joined ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-join');
                        if (qs['firebase']) {
                            console.log("welcomeMsg: ");
                            var ref = new Firebase("https://" + qs['firebase'] + ".firebaseio.com/");
                            Rx.Observable.just(ref.child("stats").child(username)).flatMap(function (chatterRef) {
                                return firebaseGet(chatterRef).doOnNext(function (chatterSnap) {
                                    var stay_duration = 0;
                                    try {
                                        stay_duration = chatterSnap.val().stay_duration;
                                    } catch (e) {
                                        //console.warn();
                                    }

                                    var chat_count = 0;
                                    try {
                                        chat_count = chatterSnap.val().chat_count;
                                    } catch (e) {
                                        //console.warn();
                                    }


                                    var welcomeMsg;
                                    if (stay_duration > 0) {
                                        welcomeMsg = '歡迎再次來到 ' + alias + ' 的遊戲間 ' + username;
                                    } else {
                                        welcomeMsg = '歡迎第一次來到 ' + alias + ' 的遊戲間 ' + username;
                                    }
                                    responsiveVoice.speak(welcomeMsg, 'Chinese Female');
                                    var user;
                                    user = {
                                        username: qs['channel'],
                                        name: qs['channel'],
                                        emotes: []
                                    };

                                    handleChat(channel, user, welcomeMsg, true);

                                    console.log(chatterSnap.key());
                                    console.log(chatterSnap.val());
                                    chatterRef.set({
                                        "chat_count": chat_count + 1,
                                        "stay_duration": stay_duration
                                    });
                                });
                            })
                            .subscribe();
                        } else {
                            var welcomeMsg = '歡迎來到 ' + alias + ' 的遊戲間 ' + username;
                            responsiveVoice.speak(welcomeMsg, 'Chinese Female');
                            var user;
                            user = {
                                username: qs['channel'],
                                name: qs['channel'],
                                emotes: []
                            };

                            handleChat(channel, user, welcomeMsg, true);
                        }
                    }

                    put(channel, joinAccounced);
                    put(username, joinAccouncedUsers);
	});
client.addListener('part', function (channel, username) {
		var index = joinAccounced.indexOf(channel);
		if(index > -1) {
			joinAccounced.splice(joinAccounced.indexOf(channel), 1)
		}
                if(showConnectionNotices) chatNotice(capitalize(dehash(username)) + ' parted ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-part');
	});

client.addListener('crash', function () {
		chatNotice('Crashed', 10000, 4, 'chat-crash');
	});

getChatters(qs['channel']).subscribe(function (chatter) {
    console.log('add: ' + chatter + ' to ' + joinAccouncedUsers);
    put(chatter, joinAccouncedUsers);
}, function (e) {}, function () {
    console.log('Imported users')
});

function contains(item, arr) {
    return !~arr.indexOf(item);
}

function put(item, arr) {
    if (contains(item, arr)) {
        arr.push(item);
    }
}

var SECONDS = 1000;
var MINITES = 60 * SECONDS;
var HOUR = 60 * MINITES;

if (qs['firebase']) {
    if (qs['firebase_email'] && qs['firebase_password']) {
        var ref = new Firebase("https://" + qs['firebase'] + ".firebaseio.com/");
        firebaseSignInWithPassword(ref, qs['firebase_email'], qs['firebase_password']).flatMap(function (auth) {
            return Rx.Observable.interval(1 * MINITES).timeInterval();
        }).flatMap(function (i) {
            return getChatters(qs['channel']);
        }).map(function (chatter) {
            return ref.child("stats").child(chatter);
        }).flatMap(function (chatterRef) {
            return firebaseGet(chatterRef).doOnNext(function (chatterSnap) {
                var stay_duration = 0;
                try {
                    stay_duration = chatterSnap.val().stay_duration;
                } catch (e) {
                    //console.warn();
                }

                var chat_count = 0;
                try {
                    chat_count = chatterSnap.val().chat_count;
                } catch (e) {
                    //console.warn();
                }

                console.log(chatterSnap.key());
                console.log(chatterSnap.val());
                chatterRef.set({
                    "chat_count": chat_count,
                    "stay_duration": stay_duration + 1
                });
            });
        })
        .subscribe();
    }
}

/**
 * TODO Move to rx-tmi.js
 *
 *  "moderators": [],
 *  "staff": [],
 *  "admins": [],
 *  "global_mods": [],
 *  "viewers": []
 */
function getChatters(_channel) {
    return Rx.Observable.create(function (observer) {
        client.api({
            url: "http://tmi.twitch.tv/group/user/" + _channel + "/chatters"
        }, function(err, res, body) {
            if (!err) {
                observer.onNext(body);
                observer.onCompleted();
            } else {
                observer.onError(err);
            }
        });
    }).doOnNext(function (chatters) {
        console.log(chatters.data);
        console.log(chatters.data.chatters);
        console.log(chatters.data.chatters.moderators);
    }).flatMap(function (chatters) {
        return Rx.Observable.concat(Rx.Observable.from(chatters.data.chatters.moderators),
                Rx.Observable.from(chatters.data.chatters.staff),
                Rx.Observable.from(chatters.data.chatters.admins),
                Rx.Observable.from(chatters.data.chatters.global_mods),
                Rx.Observable.from(chatters.data.chatters.viewers));
    });
}

/**
 * TODO Move rx-firebase.js
 */
function firebaseSignInWithToken(ref, token) {
    return Rx.Observable.create(function (observer) {
        ref.authWithCustomToken(token, function (error, authData) {
            if (error) {
                observer.onError(error);
            } else {
                observer.onNext(authData);
                observer.onCompleted();
            }
        });
    });
}

function firebaseSignInWithPassword(ref, email, password) {
    return Rx.Observable.create(function (observer) {
        ref.authWithPassword({
            email: email,
            password: password
        }, function (error, authData) {
            if (error) {
                observer.onError(error);
            } else {
                observer.onNext(authData);
                observer.onCompleted();
            }
        });
    });
}

function firebaseGet(ref) {
    return Rx.Observable.create(function (observer) {
        ref.once("value", function (snap) {
            observer.onNext(snap);
            observer.onCompleted(snap);
        });
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
    sound = soundManager.createSound({
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
