// no real need for fancy express or hapi, just stick with standard node APIs
const http = require("http");
const path = require("path");
const fs = require("fs");
const url = require("url");
// use the youtube dl library for the main work
const youtubeDownload = require("youtube-dl");
// get the port either as process argument or assume standard port 5050
const port = process.argv.length > 2 ? process.argv[3] : 5050;

const server = http.createServer((req, res) => {
  let u = "." + req.url;
  if(u === "./") u += "index.html";
  if(u.startsWith("./download.mp3")){
    // handle youtube downloads
    const youtubeURL = url.parse(u, true).query.u;
    // check for common input errors
    if(!youtubeURL){
      // case: missing url
      res.writeHead(400, "MISSING_YOUTUBE_URL");
      res.end("PLEASE ENTER A YOUTUBE URL");
    }else if(!/^((https)?:\/\/)?(www\.)?youtube.com\/watch\?v=[a-zA-Z0-9_\-=\+]+$/gi.test(youtubeURL)){
      // case: not standard youtube url format
      res.writeHead(400, "INVALID_YOUTUBE_URL");
      res.end("PLEASE ENTER A STANDARD YOUTUBE URL");
    }else{
      // case: all ok -> open, convert and pipe to client
      res.setHeader("content-type", "audio/mpeg");
      const mp3 = youtubeDownload(youtubeURL, ["-x", "--extract-audio", "--audio-format", "mp3"], {filter: "audio-only"});
      mp3.on("info", info => {
        const filename = (info.title || info.full_title || info.alt_title || "download").replace(/[:;=\\\/]/,"") + ".mp3";
        res.setHeader( "content-disposition", `attachment; filename="${filename}"`);
      });
      mp3.on("error", console.error);
      mp3.pipe(res);
    }
  }else{
    // handle static files
    fs.readFile(path.join(__dirname,"static", u), (err, data) => {
      if(err){
        res.writeHead(404);
        res.end("FILE NOT FOUND");
      }else{
        res.writeHead(200);
        res.end(data);
      }
    });
  }
});

server.listen(port, () => console.log("server running on http://127.0.0.1:"+port+"/"));
