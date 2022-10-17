import {WSMessageRelayer} from './messenger-relay-websocket.mjs'

const g_topic_group_to_url = {}
const g_topic_to_messenger = {}


export function add_ws_endpoint(topic_group,url,a_port,a_path,subscriptions) {
    //
    g_topic_group_to_url[topic_group] = url
    //
    let port = a_port ? a_port : ''
    let api_path = a_port ? a_path : ''
    g_topic_to_messenger[topic_group] = {
        "com" : new WSMessageRelayer({
                        "host" : "losalhost:8080",
                        "port" : port,
                        "path" : api_path
                    }),
         "subscriptions" : subscriptions
    }
    //
    // Subscribe to a number of things
    g_topic_to_messenger[topic_group].com.on('client-ready', (address,port) => {
        for ( let ky in subscriptions ) {
            let subscription = subscription[ky]
            let topic = subscription.topic
            let path = subscription.path
            let handler = subscription.handler
            g_topic_to_messenger.subscribe(topic,path,handler)
        }
    })
    //
}


// fetch the relayer
export async function publish(topic_group,topic,path,message) {
    let relayer = g_topic_to_messenger[topic_group].com
    relayer.publish(topic,path,message)
}
