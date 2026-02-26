const polka       = require('polka');
const send        = require('@polka/send-type');
const path        = require('path')
const fs          = require('fs')
//
const app         = polka();

let g_port = 7777

const { json } = require('body-parser');
const cors = require('cors')
app.use(json())
app.use(cors())


class ClearAssetsOnly {

    constructor(conf,no_range) {
        this.use_range = !no_range
        //
        this.media_extension = conf.med_ext
        this.ext_to_type = conf.ext
        this.asset_directory = conf.dir
        this.ipfs_sender = conf.ipfs_sender
        this.crypto_M = conf.crypto_M
        //
        this.play_count = conf.play_count
        if ( this.play_count === false ) {
            this.play_count = () => {}
        }
        this.media_of_the_day = conf.media_of_the_day
        this.safe_host = conf.safe_host
        this.safe_redirect = conf.safe_redirect
    }

    // --- --- --- --- --- --- ---
    asset_of_the_day(req, res) {
        //
        if ( req.headers.host === 'localhost' ) {
        //
        let media_extensions = [].concat(this.media_extension)
        let filename = this.media_of_the_day()
        //
        while ( media_extensions.length > 0 ) {
            let media_extension = media_extensions.shift()
            try {
                //
                let fname = filename + media_extension
                console.log(this.asset_directory + fname)
                let stat = fs.statSync(this.asset_directory + fname)  // throws exception
                //
                //this.play_count()
                let mtype = this.ext_to_type[media_extension]
                res.writeHead(200, {
                    'Content-Type': mtype,
                    'Content-Length': stat.size
                });
                // We replaced all the event handlers with a simple call to util.pump()
                fs.createReadStream(this.asset_directory + fname,{start:0}).pipe(res);
                //
                return(true)
            } catch (e) {
                if ( !(media_extensions.length) ) {
                    console.log(e)
                }
            }
        }
        //
        }
        //
        res.writeHead(301, {Location: this.safe_redirect} );
        res.end();
        return(false)
        //
    }

    // --- --- --- --- --- --- ---


    asset_streamer(req, res) {
        let key = req.params.key;
    
        let asset = this.asset_directory + key
    
        let ext = path.extname(key)
        let mtype = this.ext_to_type[ext]
        //
        let stat
        try {
            stat = fs.statSync(asset);
        } catch(e) {
            console.log("no music")
            res.end()
            return
        }
    
        let range = req.headers.range;
        let readStream;
    
        if ( this.use_range && (range !== undefined) ) {
            //
            let parts = range.replace(/bytes=/, "").split("-");
            //
            let partial_start = parts[0];
            let partial_end = parts[1];
        
            if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
                return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
            }
        
            let start = parseInt(partial_start, 10);
            let end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
            let content_length = (end - start) + 1;
            //
            res.writeHead(206,{
                'Content-Type': mtype,
                "Accept-Ranges": "bytes",
                'Content-Length': content_length,
                'Content-Range': "bytes " + start + "-" + end + "/" + stat.size
            });
            readStream = fs.createReadStream(asset, {start: start, end: end});
        } else {
            res.writeHead(206, {
                'Content-Type': mtype,
                'Content-Length': stat.size
            });
            readStream = fs.createReadStream(asset);
        }
        //
        this.play_count(key)
        // readStream
        readStream.pipe(res);
    }
    //
}

var g_image_media_extension = ['.gif','.jpg','.png']
var g_image_ext_to_type = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png'
};

var g_video_media_extension = ['.mpeg','.mp4','.txt']
var g_video_ext_to_type = {
  '.mpeg' : "video/mp4",
  '.mp4' : "video/mp4",
  '.txt' : "text/ascii"
}


let image_conf = {
    "med_ext" : g_image_media_extension,
    "ext" : g_image_ext_to_type,
    "dir" : "./images/",
    "ipfs_sender" : false,
    "ctypo_M" : false,
    "play_count" : false,
    "media_of_the_day" : "test",
    "safe_host"  : 'popsongnow.com',
    "safe_redirect" : 'http://www.popsongnow.com/'
}


let video_conf = {
    "med_ext" : g_video_media_extension,
    "ext" : g_video_ext_to_type,
    "dir" : "./clips/",
    "ipfs_sender" : false,
    "ctypo_M" : false,
    "play_count" : false,
    "media_of_the_day" : "test",
    "safe_host"  : 'popsongnow.com',
    "safe_redirect" : 'http://www.popsongnow.com/'
}


let images = new ClearAssetsOnly(image_conf)
let movies = new ClearAssetsOnly(video_conf)



app.get('/clear-media/:tracking',(req,res) => {
    let tracking = req.params.tracking
console.log(tracking)
    let test_links = {
        "poster" : `http://localhost:${g_port}/images/20200818_170319.jpg`,
        "source" : `http://localhost:${g_port}/video/clip_0001.mp4`,
    }
    //
    send(res, 200, { "status": "OK", "links" : test_links });  
})


app.get('/images/:key',async (req,res) => {
    images.asset_streamer(req,res)
})

app.get('/video/:key',async (req,res) => {
    movies.asset_streamer(req,res)
})



const start = async () => {
    try {
        console.log(`blog searcher :: listening on port: ${g_port}`)
        await app.listen(g_port)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}


start()