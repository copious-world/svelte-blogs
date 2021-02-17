

const fs = require('fs')
const path = require('path'); 
  
let g_indir = '/media/richard/ELEMENTS/writing/'
let g_outdir = '/media/richard/ELEMENTS/data/streams/'
//
let word_list = fs.readFileSync('words.txt','ascii').toString()


word_list = word_list.replace(/\s\s+/g,' ').trim()
word_list = word_list.split(' ')


// // // // // // // // // // // // // //
// // // // // // // // // // // // // //
// // // // // // // // // // // // // //


let g_global_asset_list = []

function load_asset_directory(dirpath,noisy) {
    return new Promise((resolve,reject) => {
        console.log("loading asset files")

        g_global_asset_list = []
    
        fs.readdir(dirpath, (err, files) => {
            console.log("loading asset entries ... reading files")
            if (err)  {
                console.log(err);
                reject(false)
                process.exit(0)
            } else { 
                // console.log("\Filenames with the .svg extension:"); 
                files.forEach(file => { 
                    if ( path.extname(file) == ".svg" ) {
                        if ( noisy ) {
                            console.log(file)
                        }
                        //
                        let fpath = dirpath + '/' + file
                        let fdata = fs.readFileSync(fpath).toString()
                        fdata = encodeURIComponent(fdata)
                        g_global_asset_list.push(fdata)
                        //
                    } 
                })
                //
                resolve(true)
            } 
        }) 
    
    })
  
}

async function load_assets() {
    let res = await load_asset_directory("./assets",true)    
    console.log(res)
}

load_assets()

// // // // // // //

//
let poster= "https://sveltejs.github.io/assets/caminandes-llamigos.jpg"
let source = "https://sveltejs.github.io/assets/caminandes-llamigos.mp4"

let m_poster= "https://i1.sndcdn.com/artworks-qh9D0xD7SNI8ztFG-Sq46rA-t500x500.jpg"
let m_source = "https://www.popsongnow.com/streamer/streamoftheday"

function flip_coin() {
    let chk = Math.random()
    if ( chk > 0.5 ) return(true)
    return(false)
}

function  gen_random_components() {

    let mo = {
        "media_type" : "audio",
        "media" : {
            "poster" : "",
            "source" : ""
        }
    }

    let chance = flip_coin()
    if ( chance ) {
       mo.media_type = "video"
       mo.media.poster = poster
       mo.media.source = source
    } else {
        mo.media_type = "audio"
        mo.media.poster = m_poster
        mo.media.source = m_source 
    }

    //
    return mo
}


function gen_random_output(max_len) {
    let n = word_list.length
    let output = ''
    let maxw = Math.floor(Math.random()*250)
    maxw = Math.min(max_len,maxw)

    for ( let i = 0; i < maxw; i++ ) {
        //
        let index = Math.floor(Math.random()*n)
        let w = word_list[index]
        output += w + ' '
        //
    }
    output = output.trim()
    return(output)
}


function process_file(indir,file) {

    let subject = gen_random_output(24)
    let keys = gen_random_output(6)
    //
    let in_path = `${indir}${file}`

    keys = keys.replace(' ',',')

    let component_part = gen_random_components()    
    component_part = JSON.stringify(component_part)

    const { spawn } = require('child_process');
    const ls = spawn('node', ['data_placer.js', g_outdir, in_path, keys, subject, component_part ]);

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ls.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });


}

function load_directory(dirpath) {

    g_global_file_list = []

    fs.readdir(dirpath, (err, files) => { 
        if (err)  {
            console.log(err); 
        } else { 
            console.log("Filenames with the .txt extension:"); 
            files.forEach(file => { 
                if ( path.extname(file) == ".txt" ) {
                    //
                    let fpath = dirpath + '/' + file
                    process_file(dirpath,file)
                    //
                } 
            }) 
        } 
    }) 
  
}



load_directory(g_indir)