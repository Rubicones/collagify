let Spotify = require("spotify-web-api-js");

function findDominant(imageUrl) {
  return new Promise((resolve, reject) => {
    // Load the image from the given URL
    let img = new Image();
    img.crossOrigin = "anonymous"; // Set the crossOrigin attribute to "anonymous"
    img.src = imageUrl;

    // Wait for the image to load before processing it
    img.onload = function() {
      // Create a canvas element and draw the image on it
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Get the image data from the canvas
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let pixels = imageData.data;

      // Loop through the pixels and count the occurrences of each color
      let colorCounts = {};
      for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i+1];
        let b = pixels[i+2];
        let color = rgbToHex(r, g, b);
        if (color in colorCounts) {
          colorCounts[color]++;
        } else {
          colorCounts[color] = 1;
        }
      }

      // Find the color with the highest occurrence count
      let dominantColor = null;
      let maxCount = 0;
      for (let color in colorCounts) {
        if (colorCounts[color] > maxCount) {
          dominantColor = color;
          maxCount = colorCounts[color];
        }
      }

      // Resolve with the dominant color as a hex value
      resolve(dominantColor);
    };

    // Reject the promise if the image fails to load
    img.onerror = function() {
      reject(new Error("Failed to load image from URL"));
    };
  });
    // Utility function to convert RGB to hex
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  
  // Utility function to convert a component to a two-digit hex value
  function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }
}

class SpotifyService{
  spotifyApi = new Spotify();
  AUTHORIZE = "https://accounts.spotify.com/authorize";
  TOKEN = "https://accounts.spotify.com/api/token";
  client_id = "7cf19d9a363446d79276d46b37418a9f";
  client_secret = "cedf0d5444154f968dfc92c1ca974e5e";
  access_token = localStorage.getItem("access_token");
  refresh_token
  redirect_uri = "https://collagify.netlify.app/" // сюда кидать свой сервер

  requestAuthorization = () => {
    this.client_id = "7cf19d9a363446d79276d46b37418a9f";
    this.client_secret = "cedf0d5444154f968dfc92c1ca974e5e"; // нельзя показывать в реальном запуске
    localStorage.setItem("client_id", this.client_id);
    localStorage.setItem("client_secret", this.client_secret);

    let url = this.AUTHORIZE;
    url += "?client_id=" + this.client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(this.redirect_uri);
    url += "&show_dialog=true";
    url +=
      "&scope=user-read-private user-follow-read user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url;
  }

  fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(this.redirect_uri);
    body += "&client_id=" + this.client_id;
    body += "&client_secret=" + this.client_secret;
    this.callAuthorizationApi(body);
  }

  callAuthorizationApi(body) {
    fetch(this.TOKEN, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(this.client_id + ":" + this.client_secret),
      },
      body: body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Issue during authorization");
        return res;
      })
      .then((res) => res.json())
      .then((res) => {
        if (res.access_token != undefined) {
          console.log(res);
          this.access_token = res.access_token;
          localStorage.setItem("access_token", this.access_token);
          this.spotifyApi.setAccessToken(this.access_token);
        }
        if (res.refresh_token != undefined) {
          this.refresh_token = res.refresh_token;
          localStorage.setItem("refresh_token", this.refresh_token);
        }
        this.onPageLoad();
      })
      .catch((error) => {
        if (JSON.parse(error.response).error.status == 401) {
          console.error("Authorization token expired");
        }
        console.error("Issue during getting saved tracks list");
      });
  }

  onPageLoad() {
    this.client_id = localStorage.getItem("client_id");
    this.client_secret = localStorage.getItem("client_secret");
    this.access_token = localStorage.getItem("access_token");
    if (!this.access_token){
      return false
    } 
    this.spotifyApi.setAccessToken(this.access_token);
    return this.spotifyApi
      .getMySavedTracks()
      .then(() => {console.log("Token is ok"); return true})
      .catch((error) => {
        if (JSON.parse(error.response).error.status == 401) {
           this.refreshAccessToken();
        }
        return false
      })
  }

  handleRedirect() {
    let code =  this.getCode();
    this.fetchAccessToken(code);
    window.history.pushState("", "", this.redirect_uri);
  }

  getCode() {
    let code = null;
    const addressString = window.location.search;
    if (addressString.length > 0) {
      const urlParams = new URLSearchParams(addressString);
      code = urlParams.get("code");
    }
    return code;
  }

  refreshAccessToken() {
    this.refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + this.refresh_token;
    body += "&client_id=" + this.client_id;
    this.callAuthorizationApi(body);
  }

  async getName() {
    return await this.spotifyApi.getMe().then((res) => res.display_name)
  }


  async setFollowedArtists() {
    let limit = 20
    let after = null
    let offset = 0
    let artists = []
    let total = 100
    console.log("setting artists")
    while (offset < total){
      await this.getFollowedArtists(limit, after).then(res => {
        res.artists.items.forEach(item => artists.push([item.id, item.name]))
        offset += limit
        total = res.artists.total
        after = res.artists.cursors.after
      })
    }
    return artists
  }

  async setFollowedPlaylists() {
    let limit = 20
    let offset = 0
    let playlists = []
    let total = 100
    console.log("setting playlists")

    while (offset < total){
      await this.getPlaylists(limit, offset).then(res => {
        res.items.forEach(item => playlists.push([item.id, item.name]))
        offset += limit
        total = res.total
      })
    }
    return playlists
  }

  async setArtistsAlbums(id) {
    let limit = 20
    let offset = 0
    let albums = []
    let total = 100
    console.log("setting albums")


    while (offset < total){
      await this.getArtistAlbums(id, limit, offset).then(res => {
        res.items.forEach(item => albums.push(item.images[1].url))
        offset += limit
        total = res.total
      })
    }


    return albums
  }

  async setPlaylistAlbums(id) {
    let limit = 20
    let offset = 0
    let albums = []
    let total = 100
    console.log("setting albums")


    while (offset < total){
      await this.getPlaylistAlbums(id, limit, offset).then(res => {
        res.items.forEach(item => albums.push(item.track.album.images[1].url))
        offset += limit
        total = res.total
      })
    }

    return Array.from(new Set(albums))
  }

  async setSavedTracks() {
    let limit = 20
    let offset = 0
    let albums = []
    let total = 100
    console.log("setting albums")


    while (offset < total){
      await this.getSavedTracks(limit, offset).then(res => {
        res.items.forEach(item => albums.push(item.track.album.images[1].url))
        offset += limit
        total = res.total
      })
    }

    return Array.from(new Set(albums))
  }

  async getFollowedArtists(limit, after) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getFollowedArtists(after ? {limit: limit, after: after} : {limit: limit})
    .then(res => res)
  }

  async getPlaylists(limit, offset) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getUserPlaylists({limit: limit, offset: offset})
    .then(res => res)
  }

  async getSavedTracks(limit, offset) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getMySavedTracks({limit: limit, offset: offset})
    .then(res => res)
  }

  async getArtistAlbums(id, limit, offset) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getArtistAlbums(id, {include_groups: "single,album", limit: limit, offset: offset})
    .then(res => res)
  }

  async getPlaylistAlbums(id, limit, offset) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getPlaylistTracks(id, {limit: limit, offset: offset})
    .then(res => res)
  }

  async getMySavedTracks(limit, offset) {
    this.access_token = localStorage.getItem("access_token");
    this.spotifyApi.setAccessToken(this.access_token);
    return await this.spotifyApi.getMySavedTracks({limit: limit, offset: offset})
    .then(res => res)
  }
  
  
};

export default SpotifyService;
