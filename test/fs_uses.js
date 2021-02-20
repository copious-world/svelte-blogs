
const fs = require('fs')


let g_subdir = __dirname + "/data"

let g_check_for_new_files = fs.watch(g_subdir)

g_check_for_new_files.on('change',(eventType, filename) => {
    console.log(`event type is: ${eventType}`);
    if ( filename ) {
        let path = g_subdir + '/' + filename
        console.log(path)
        let is_file = false
        try {
            fs.statSync(path)
            is_file = true
        } catch (e) {
            // suppress error
        }
        if ( is_file ) {
            console.log(`filename provided: ${filename}`);
            fs.readFile(path,(err,data) => {
                if ( err ) {
                    console.log(err)
                } else {
                    add_just_one(data.toString())
                }
            })
        } else {
            console.log("file gone")
        }
    } else {
      console.log('filename not provided');
    }
});
