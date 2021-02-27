


const fs = require('fs')
const fsPromises = require('fs/promises')
const path = require('path')


function file_watch_handler(path,data_record_adder) {
    if ( path ) {
        let is_file = false
        try {
            fs.statSync(path)
            is_file = true
        } catch (e) {
            // suppress error
        }
        if ( is_file ) {
            // READ NEW FILE
            fs.readFile(path,(err,data) => {
                if ( err ) { console.log(err); return; }
                // 
                data_record_adder(data.toString())       //  ----  ADD ONE NEW RECORD.....
                //
            })
            // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        } else {
            console.log("file gone")
        }
    } else {
      console.log('filename not provided');
    }
}



function load_directory(dirpath,noisy,item_injector,after_loaded) {
    console.log("loading user entries")

    g_global_file_list = []

    fs.readdir(dirpath, (err, files) => {
        console.log("loading user entries ... reading files")
        if (err)  {
            console.log(err);
            process.exit(0)
        } else { 
            // console.log("\Filenames with the .txt extension:"); 
            files.forEach(file => { 
                if ( path.extname(file) == ".json" ) {
                    if ( noisy ) {
                        console.log(file)
                    }
                    //
                    let fpath = dirpath + '/' + file
                    let fdata = fs.readFileSync(fpath).toString()   // initialization time
                    try {
                        let f_obj = JSON.parse(fdata)
                        item_injector(f_obj)
                    } catch(e) {
                        console.log(file)
                    }
                    //
                } 
            })
            //
            if ( after_loaded ) {
                after_loaded()
            }
        }
    }) 
  
}



module.exports.file_watch_handler = file_watch_handler
module.exports.load_directory = load_directory