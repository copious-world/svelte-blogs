<script>

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

let offset = { x: 0, y: 0 };

function start_drag(e) {
    let mover = e.target
    if ( mover ) {
        offset.x = e.clientX - mover.offsetLeft;
        offset.y = e.clientY - mover.offsetTop;
        window.addEventListener('mousemove', dragging, true);
    }
}

function stop_drag(e) {
    window.removeEventListener('mousemove', dragging, true);
}


function dragging(e) {
    let mover = e.target
    if ( mover === undefined ) return
    mover.style.position = 'absolute';
    var top = e.clientY - offset.y;
    var left = e.clientX - offset.x;
    mover.style.top = top + 'px';
    mover.style.left = left + 'px';

    let rect = mover.getBoundingClientRect();

    // 
    let p_delta_w  = (rect.right/window.innerWidth)
    let p_delta_h  = (rect.bottom/window.innerHeight)

    dispatch('message', {
        "w_delta": p_delta_w,
        "h_delta": p_delta_h
    });

}


</script>
<div class="drag-container" on:mousedown={start_drag}  on:mouseup={stop_drag} >
    <slot></slot>
</div>

<style>

    .drag-container {
        position:absolute;
        left: 0px;
        top:0px;
    }


</style>