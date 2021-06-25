
import { writable } from 'svelte/store';

//
window._link_picker_list = {}

class LinkPicker {
    //
    constructor() {
        this.picked = window._link_picker_list
    }
    //
    add_entry(entry_id) {
        if ( this.picked[entry_id] === undefined ) {
            this.picked[entry_id] = true
        }
    }
    //
    remove_entry(entry_id) {
        if ( this.picked[entry_id] !== undefined ) {
            delete this.picked[entry_id]
        }
    }
    //
    is_picked(entry_id) {
        return (this.picked[entry_id] !== undefined)
    }
    //
    toggle_pick(entry_id) {
        if ( this.is_picked(entry_id) ) {
            this.remove_entry(entry_id)
        } else {
            this.add_entry(entry_id)
        }
    }
    //
    map_picks(entry_list) {
        for ( let obj of entry_list ) {
            if ( this.is_picked(obj.entry) ) {
                this.picked[obj.entry] = obj
            }
        }
    }
    //
    get_pick_values() {
        let v_list = []
        for ( let ky in this.picked ) {
            v_list.push(this.picked[ky])
        }
        return v_list
    }
} 


function createPickerStats() {
	const { subscribe, set, update } = writable(0);

	return {
		subscribe,
		increment: () => update(n => n + 1),
		decrement: () => update(n => n - 1),
		reset: () => set(0)
	};
}

export const picker = createPickerStats();
export const link_picker = new LinkPicker();