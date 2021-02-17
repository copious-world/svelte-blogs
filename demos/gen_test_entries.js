

const fs = require('fs')
const path = require('path'); 
  
let g_indir = '/media/richard/ELEMENTS/writing/'
let g_outdir = '/media/richard/ELEMENTS/data/demos/'
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
const COLS = 16;
const id = () => "_" + Math.random().toString(36).substr(2, 9);
//
//

function makeItem(item) {
    const { min = { w: 1, h: 1 }, max } = item;
    return {
      fixed: false,
      resizable: !item.fixed,
      draggable: !item.fixed,
      min: {
        w: Math.max(1, min.w),
        h: Math.max(1, min.h),
      },
      max: { ...max },
      ...item,
    };
  }
  

let itemsA = [
    {
        [COLS]: makeItem({
        x: 0,
        y: 0,
        w: 2,
        h: 2,
        }),
        id: id(),
    },
    {
        [COLS]: makeItem({
        x: 2,
        y: 0,
        w: 2,
        h: 2,
        }),
        id: id(),
    },
    {
        [COLS]: makeItem({
        x: 2,
        y: 2,
        w: 3,
        h: 2,
        }),
        id: id(),
    },
    {
        [COLS]: makeItem({
        x: 4,
        y: 0,
        w: 5,
        h: 2,
        fixed: true,
        }),
        id: id(),
    },
    {
        [COLS]: makeItem({
        x: 0,
        y: 3,
        w: 4,
        h: 1,
        }),
        id: id(),
    },
];



function  gen_random_components() {
    //
    let n = itemsA.length - 1
    let max_els = Math.floor(Math.random()*n) + 1
    return itemsA.slice(0,max_els)
    //
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

    let components = gen_random_components()
    let component_part = {
        "graphic" : components.map((el,index) => {
             let n = g_global_asset_list.length
             let i = index % n
             let asset = g_global_asset_list[i]
             return asset
        }),
        "boxes" : components
    }
    
    component_part = JSON.stringify(component_part)

        // node data_placer.js $output $indir$afile ${keys} "$subject"


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