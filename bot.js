var TwitterPackage = require("twitter");
var SpotifyWebApi = require("spotify-web-api-node");

require(`dotenv`).config();

var fs = require("fs"),
  path = require("path"),
  express = require("express"),
  chalk = require("chalk"),
  sass = require("node-sass-middleware"),
  app = express(),
  config = {
    spotify: {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: "https://example.com/callback",
    },
  };

app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(
  sass({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
  })
);

var secret = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

var Twitter = new TwitterPackage(secret);

// Call the stream function and pass in 'statuses/filter', our filter object, and our callback
Twitter.stream("statuses/filter", { track: "@BotMiddle" }, function (stream) {
  // ... when we get tweet data...
  stream.on("data", function (tweet) {
    // print out the text of the tweet that came in
    console.log(tweet.text);
    Spotify.init().then((result) => {
      songLink = result.uri;
      songName = result.name;
      songArtists = result.artists;
      console.log("call for twit " + songLink);

      //build our reply object
      var statusObj = {
        status:
          "hey @" +
          tweet.user.screen_name +
          " your song is: " +
          songName +
          " by " +
          songArtists +
          " " +
          songLink,
      };

      //call the post function to tweet something
      Twitter.post(
        "statuses/update",
        statusObj,
        function (error, tweetReply, response) {
          //if we get an error print it out
          if (error) {
            console.log(error);
          }

          //print the text of the tweet we sent out
          console.log(tweetReply.text);
        }
      );
    });
  });

  // ... when we get an error...
  stream.on("error", function (error) {
    //print out the error
    console.log(error);
  });
});

// SPOTIFY REQUEST
var Spotify = Spotify || {
  api: {},

  init: () => {
    Spotify.api = new SpotifyWebApi(config.spotify);

    return Spotify.getSong();
  },

  getSong: async () => {
    /* let's get the credentials to get access to the Spotify API */
    const data = await Spotify.api.clientCredentialsGrant(); /* the credentials are returned and _then_ we move on to the next steps */ // not sure if this is async but we can await it just in case

    await Spotify.api.setAccessToken(data.body["access_token"]);

    const botTracks = await Spotify.api.getPlaylistTracks(
      "05YlmFJIC6rbsCBam035Nk",
      {
        offset: 1,
        // fields: "items",
      }
    );

    const songs = botTracks.body.items;
    const num = Math.floor(Math.random() * songs.length);
    const song = songs[num].track;
    console.log(song.name);

    return {
      name: song.name,
      uri: `https://open.spotify.com/track/${song.id}`,
      artists: song.artists.map((artists) => artists["name"]),
    };
  },
};

app.listen(app.get("port"), () => {
  console.log(
    "%s App is running at http://localhost:%d in %s mode",
    chalk.green("✓"),
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});
