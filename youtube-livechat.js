#!/usr/bin/env node

// liveChatId is from https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastType=all&mine=true&key={api-key}
// you can use Google Explorer: get your liveChatId from livBrodcast: https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list#try-it

// liveChat has no websocket, you cannot be as observer, you need polling it. ref. https://www.reddit.com/r/youtubegaming/comments/4kibiw/api_reading_live_chat_messages_from_javascript/
// polling this endpoint:
// https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId={liveChatId}&part=snippet&key={api-key}
