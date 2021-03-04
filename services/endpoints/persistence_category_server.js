
const PersistenceMessageEndpoint = require("categorical-handlers/persistence.js")
//
const fs = require('fs')
const fsPromises = require('fs/promises')


/*
let a_dashboard = {
    name: 'Samantha Seagul',
    email: 'striking@pp.com',
    password: 'd1833d2cc77287f622d748b8bf3e0c53c3272beb069ca907bcc632fe61855855',
    action: 'register',
    form_key: 'register',
    _id: 'striking@pp.com',
    user_op: 'update',
    m_path: 'user',
    _tstamp: 1614675063926,
    m_type: 'persistence',
    op: 'S',
    _response_id: 11,
    dir_paths: {
      base: '/user-assets/striking@pp.com',
      dashboard: '/striking@pp.com/dashboard.json',
      profile: '/striking@pp.com/profile.json'
    },
    logged_in: true,
    strategy: 'local',
    dates: { created: 1614675064436, updated: 1614675064436 },
    entry: 4,
    score: 1,
    dashboard: "%7B%22header_user_name%22%3A%22Samantha%20Seagul%22%2C%22date%22%3A%222021-03-01T07%3A54%3A41.948Z%22%2C%22dates%22%3A%7B%22created%22%3A1614585281948%2C%22updated%22%3A1614585281948%7D%2C%22tag_line%22%3A%22%3Cbutton%20id%3D'dashboard-tagline-maker'%20onclick%3D'make_dashoard_tagline(event)'%3Eadd%20tag%20line%3C%2Fbutton%3E%22%2C%22panel_key%22%3A%2289cc1e87885e8b22ec3a294ec20850b4be5559a7794743b26c701aeacd1fc6ab%22%2C%22dashboard_text%22%3A%22%3Cbutton%20id%3D'dashboard-text-maker'%20onclick%3D'make_dashoard_text(event)'%3Eadd%20text%3C%2Fbutton%3E%22%2C%22entries%22%3A%7B%7D%7D"
  }


let ss = {
    "color":"grey",
    "entry":-1,
    "title":"",
    "dates":{"created":"1609958962338","updated":"1609958962338"},
    "subject":"Eagan%20glads%20gadid%20Gemma%20each%20tika%20Gause%20tada%20twat%20Taos%20Tsat%20tame%20gazal%20Berga%20STCA%20JGA%20PGA%20Argie%20Angas%20Caen%20Gauss%20lant%20Tyva%20gafia",
    "keys":["GLA","fogas%20tina%20beags%20dagga%20cag"],
    "t_type":"html",
    "txt_full":"gazal%20Algol%20aiger%20gales%20argol%20Argue%20esca%20GARCH%20tona%20flags%20cagot%20argot%20Stan%20arage%20taxi-%20lact-%20evac%20Elgar%20tads%20stap%20gaols%20Aghas%20Ganga%20C%26sc%20Gault%20Taos%20Matt.%20b%10%23gogo%20garth%20Pant%20games%20Ceas%20LITA%20Durga%20MALT%20PITA%20Thad%20matr-%20Eagar%20gayer%20dargs%20Dagda%20TDMA%20tuya%20ganif%20AltGr%20gauzy%20evac%20aggro%20CNb%10%23gas%20geasa%20stan'%20gaits%20gatka%20staw%20Stan%20meat%20SAFT%20peta-%20Ega%20Sant%20aggry%20Sant%20gazee%20tach%20Sota%20gaunt%20gazel%20gawth%20cega%20gawms%20MTAs%20Gauss%20Gajda%20Garos%20Maat%20Craig%20Genao%20goa%20Gizah%20agend%20Daegu%20each%20crags%20GAFIA%20BGA%20TIAs%20de-gay%20glead%20gator%20gau%20alec%20Lata%20glams%20maft%20Cave%20gapik%20acet-%20P.C.A.T.%20tack%20Goa%0AGoN1%20glacC)%20gal.%20T-Can%20taxi-%20alang%20ESCA%20matl%20aggie%20math.%20ghana%20Dagon%20PATs%20Gallo%20aping%20dace%20Tani%20angb%10%23mo%20toas%20gayal%20Acre%20gnaff%20agita"
}

ss = {
    "color":"grey",
    "entry":-1,
    "title":"ganev%20Thad%20eggah%20acre%20Ganja%20gasps%20gades%20gabey%20Case%20ergat-%20glacC)%20Taye%20Anglo%20ageth%20hag%20Anglo-%20GIb%10%23can%20de-gay%20glaum%20bigae%20Eliga%20tosa%20ecad%20Rato",
    "dates":{
        "created":"1611728306015",
        "updated":"1611728306015"
    },
    "keys":["gawms","tazi%20gawed%20Gangl%20tram%20gawns"],
    "txt_full":"align%20GBA%20dugla%20AGs%20tota%20esca%20tale%20Garza%20MaD%0De%20Taul%20ahing%20Gabay%20toga%20eager%20agism%20IgA%20TSCA%20EPCA%20glare%20tabu%20glads%20-path%20Crea%20may't%20Tayk%20TANJ%20AGC%20acre%20Teal%20betag%20gamey%20taha%20IgA%20gadge%20gmina%20gloar%20pant%20gac%20g-flat%20taha%20Gauge%20Balog%20Tail%20vag%20tapa%20FAANG%20tabs%20Gatta%20Cage%20GIb%10%23can%20gazer%20gal%20agayn%20taxo-%20agony%20gaymo%20gamie%20tab%10%23ta%20Cade%20argil%20AGB%20ANG%20Cage%20agons%20usta%20geare%20taha%20glams%20Agees%20TAS's%20tera-%20galop%20skat%20agile%20GLAMs%20algid%20argil%20tead%20CETA%20algum%20race%20Dague%20Dagur%20airag%20Tena%20gamic%20Tait%20gnarl%20TANJ%20agree%20gauds%20tana%20gatah%20Tati%20Glatt%20glatt%20MALT%20gazet%20Galan%20ghani%20Gnagy%20Thao%20AGS%20TGA%20peta-%20gades%20geans%20Galea%20gayby%20Toal%20Eagle%20Ghana%20Aungs%20swat%20JGA%20peta-%20Dagur%20thas%20late%20thas%20taas%20Nato%20Bragg%20VGA%20rapt%20part.%20gak%20aggro%20Gaian%20gaspy%20Ghans%20DRAGN%20Dugan%20taft%20fogas%20blags%20Ghans%20Mota%20agita%20gazid%20TTAB%20Gavar%20AGM%20CNb%10%23gas%20AGs%20meat%20Eagen%20Gaons%20Ganns%20dangs%20Gabay%20garua%20staw%20ARPGs%20oats%20mota%20Garry%20Gaz%20toma%20Mag.%20swat%20mag%20tawn%20Bogan%20ditag%20MTAs%20Argus%20gamey%20gawds%20gaida",
    "media_type":"video",
    "media":{
        "poster":"https://sveltejs.github.io/assets/caminandes-llamigos.jpg",
        "source":"https://sveltejs.github.io/assets/caminandes-llamigos.mp4"
    }
}
ss = {
    "color":"grey",
    "entry":-1,
    "title":"Fegan%20gafia%20taha%20tuya%20-angle%20aslug%20toas%20gault%20CETA%20-stat%20aragh%20SAFT%20agone%20agyen%20outa%20rata%20Patz%20gauss%20teat%20matr-%20toad%20satC)%20Taff%20chaga",
    "dates":{
        "created":"1611728305804","updated":"1611728305804"
    },
    "keys":[ "Fager","TAPs%20gat%20MLat%20tosa%20baghs"],
    "txt_full":"augle%20diags%20thaa%20MaD%0De%20Tyan%20garbo%20TAED%20gantC)%20bace%20Gajda%20Sota%20tako%20Kota%20coags%20Garth%20SWAT%20gawed%20caged%20TBAs%20tafs%20Nat'l%20mast-%20geats%20agane",
    "media_type":"audio",
    "media":{
        "poster":"https://i1.sndcdn.com/artworks-qh9D0xD7SNI8ztFG-Sq46rA-t500x500.jpg",
        "source":"https://www.popsongnow.com/streamer/streamoftheday"
    }
}

ss = {
    "color":"grey",
    "entry":-1,
    "title":"",
    "dates":{"created":"1611817968610","updated":"1611817968610"},
    "subject":"aooga%20kyat%20keat%20Balog%20Tabb%20THAM%20glead%20NAIT%20Taku%20thia-%20blawg%20Ta-tu%20gawms%20Stam%20rats%20outa%20D-bags%20toas%20tarm%20matC)%20Givan%20T-bar%20LART%20Gahan",
    "keys":["tata","star%20Durga%20tosa%20gatah%20gange"],
    "t_type":"html",
    "txt_full":"agony%20barge%20Durga%20Agric.%20keat%20argyr-%20Girma%20begay%20META%20TADA%20agayn%20cape%20TDMA%20gangs%20rota%20AGJ%20Egean%20gades%20bulga%20Tupa%20GIb%10%23can%20cangs%20TEAs%20Agnew%20late%20bogan%20e-gate%20Agins%20Garst%20gha%20Ghana%20Eguia%20Garrs%20GALEX%20TCAs%20aslug%20Thai%20almug%20tard%20gauzy%20sats%20AGP%20jag%20Chae%20came%20Aigio%20nag%20nota%20caze%20Gangl%20qats%20naat%20glare%20VGA%20meat%20sate%20aight%20Eliga%20benga%20TDMA%20Katy%20Tema%20TGA%20slat%20fag%20NAPT%20duang%20Tham%20Glaze%20Ega%20AGSMs%20augur%20Aungs%20Acle%20TATT%20glave%20puta%20eagle%20-tard%20diags%20gabby%20kats%20ALEC%20agree%20faugh%20tabs%20LGAT%20gansa%20tact%20meta%20Cragg%20Tupa%20tag%20ghazi%20Ta-Ha%20fangs%20Tabo%20acre%20gafia%20tepa%20taxi%20matr-%20Gazan%20agora%20gayed%20tian%20Agees%20tail%20zag%0Aagami%20Ags.%0AAGU%20NAPT%20taha%20cega%20tear%20taxa%20A.b%10%23G.b%10%23I.%20geaux%20path%20-fugal%20stap%20Gazan%20Gabor%20argyr-%20Glass%20Apgar%20GaspC)%20TIAS%20TWAs%20thal%20tawa%20gangs%20keat%20Utah%20do-rag%20begat%20ARPGs%20gangs%20Balog%20plat%20gha%20barge%20genal%20genta%20gazar%20matl%20Taro%20S.W.A.T.",
    "components": {
        "graphic":["%3Csvg%20role%3D%22img%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Ctitle%3EGitHub%20copious-world%3C%2Ftitle%3E%0A%3Cpath%20d%3D%22M12%20.297c-6.63%200-12%205.373-12%2012%200%205.303%203.438%209.8%208.205%2011.385.6.113.82-.258.82-.577%200-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422%2018.07%203.633%2017.7%203.633%2017.7c-1.087-.744.084-.729.084-.729%201.205.084%201.838%201.236%201.838%201.236%201.07%201.835%202.809%201.305%203.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93%200-1.31.465-2.38%201.235-3.22-.135-.303-.54-1.523.105-3.176%200%200%201.005-.322%203.3%201.23.96-.267%201.98-.399%203-.405%201.02.006%202.04.138%203%20.405%202.28-1.552%203.285-1.23%203.285-1.23.645%201.653.24%202.873.12%203.176.765.84%201.23%201.91%201.23%203.22%200%204.61-2.805%205.625-5.475%205.92.42.36.81%201.096.81%202.22%200%201.606-.015%202.896-.015%203.286%200%20.315.21.69.825.57C20.565%2022.092%2024%2017.592%2024%2012.297c0-6.627-5.373-12-12-12%22%2F%3E%0A%3C%2Fsvg%3E%0A"],
        "boxes":[
            {
                "16":{"fixed":false,
                "resizable":true,
                "draggable":true,
                "min":{"w":1,"h":1},
                "max":{},
                "x":0,"y":0,"w":2,"h":2},
                "id":"_0x4wd65fy"
            }]
    }
}

*/
/*
{
    "id" : Math.floor(Math.random()*5000),
    "published" : (Math.random()>0.667),
    'title' : `${ky}_${i}_a bunch of stuff that can be said.....`,
    'data'  : `All about ${ky}_${i}_a bunch of stuff that can be said..... if you will\on a better day something random`,
    'deleted' : false,
    'saved_ever' : true,
    'asset_type' : ky
}
*/

class TransitionsPersistenceEndpoint extends PersistenceMessageEndpoint {

    //
    constructor(conf) {
        super(conf)
    }
    //

    make_path(u_obj) {
        let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
        let asset_info = u_obj[key_field]   // dashboard+striking@pp.com
        if ( !(asset_info) ) return(false)
        asset_info = asset_info.split('+')
        let user_path = this.user_directory
        let user_id = asset_info.pop()
        //
        user_path += '/' + user_id
        let entry_type = asset_info.pop()
        user_path += '/' + entry_type
        //
        if ( asset_info.length ) {
            let file = asset_info.pop()
            user_path += '/' + file + ".json"
        } else {
            user_path += ".json"
        }
console.log(user_path)
        return(user_path)
    }

    // ----
    async user_action_keyfile(op,u_obj) {
        switch ( op ) {
            case 'C' : {
                let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
                let asset_info = u_obj[key_field]   // dashboard+striking@pp.com
        
                asset_info = asset_info.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                user_path += '/' + user_id
                //
                let entries_file = user_path + "/dashboard.json"
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                let entry_type = asset_info.pop()
                user_path += '/' + entry_type
                //
                let file = asset_info.pop()
                user_path += '/' + file + ".json"
                //
                u_obj.file_name = user_path
                if ( entries_record.entries[entry_type] === undefined ) {
                    entries_record.entries[entry_type] = []
                }
                entries_record.entries[entry_type].push(u_obj)
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                break;
            }
            case 'U' : {
                let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
                let asset_info = u_obj[key_field]   // dashboard+striking@pp.com

                asset_info = asset_info.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                user_path += '/' + user_id
                //
                let entries_file = user_path + "/dashboard.json"
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                let entry_type = asset_info.pop()
                user_path += '/' + entry_type
                //
                let file = asset_info.pop()
                user_path += '/' + file + ".json"
                //
                u_obj.file_name = user_path
                if ( entries_record.entries[entry_type] !== undefined ) {
                    let entry_list = entries_record.entries[entry_type]
                    for ( let i = 0; i < entry_list.length; i++ ) {
                        let entry = entry_list[i]
                        if ( entry.id == u_obj.id ) {
                            entry_list[i] = u_obj
                        }

                    }
                }
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                break;
            }
            case 'D' : {
                break;
            }
        }
        /*
        */
    }
}





let conf_file = 'relay-service.conf'
let conf_par = process.argv[2]
if ( conf_par !== undefined ) {
    conf_file = conf_par
}

let conf = JSON.parse(fs.readFileSync(conf_file).toString())


new TransitionsPersistenceEndpoint(conf.persistence_endpoint)
