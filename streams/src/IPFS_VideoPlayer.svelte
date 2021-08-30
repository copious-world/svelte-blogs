<script>
	export let poster
	export let source
	export let isplaying
	export let ipfs

	// These values are bound to properties of the video
	let time = 0;
	let duration;
	let paused = true;

	let vid_el = null

	let v_cid
	$: v_cid = ipfs

	let a_poster_cid
	$: a_poster_cid = poster && poster.protocol ? poster.cid : false

	$: {
		if ( !isplaying && (vid_el !== null) ) {
			vid_el.pause();
		}
	}

	let source_link = ""
	$:  {
		if ( vid_el !== null ) {
			figure_source_link()
		}
	}

	let poster_link = ""
	$:  {
		if ( vid_el !== null ) {
			figure_poster_link() 
		}
	}


	async function figure_source_link() {
		source_link = media_startup(vid_el,'video','ipfs',v_cid,source)
	}


	async function figure_poster_link() {
		poster_link = media_startup(vid_el,'images','ipfs',a_poster_cid,poster)
	}



	let showControls = true;
	let showControlsTimeout;


	function handleMousemove(e) {
		// Make the controls visible, but fade out after
		// 2.5 seconds of inactivity
		clearTimeout(showControlsTimeout);
		showControlsTimeout = setTimeout(() => showControls = false, 2500);
		showControls = true;

		if (!(e.buttons & 1)) return; // mouse not down
		if (!duration) return; // video not loaded yet

		const { left, right } = this.getBoundingClientRect();
		time = duration * (e.clientX - left) / (right - left);
	}

	function handleMousedown(e) {
		vid_el = e.target

		// we can't rely on the built-in click event, because it fires
		// after a drag — we have to listen for clicks ourselves

		function handleMouseup() {
			
			if (paused) vid_el.play();
			else vid_el.pause();
			cancel();
		}

		function cancel() {
			e.target.removeEventListener('mouseup', handleMouseup);
		}

		e.target.addEventListener('mouseup', handleMouseup);

		setTimeout(cancel, 200);
	}

	function format(seconds) {
		if (isNaN(seconds)) return '...';

		const minutes = Math.floor(seconds / 60);
		seconds = Math.floor(seconds % 60);
		if (seconds < 10) seconds = '0' + seconds;

		return `${minutes}:${seconds}`;
	}


</script>

<style>
	div {
		position: relative;
	}

	.controls {
		position: absolute;
		top: 0;
		width: 100%;
		transition: opacity 1s;
	}

	.info {
		display: flex;
		width: 100%;
		justify-content: space-between;
	}

	span {
		padding: 0.2em 0.5em;
		color: white;
		text-shadow: 0 0 8px black;
		font-size: 1.4em;
		opacity: 0.7;
	}

	.time {
		width: 3em;
	}

	.time:last-child { text-align: right }

	progress {
		display: block;
		width: 100%;
		height: 10px;
		-webkit-appearance: none;
		appearance: none;
	}

	progress::-webkit-progress-bar {
		background-color: rgba(0,0,0,0.2);
	}

	progress::-webkit-progress-value {
		background-color: rgba(255,255,255,0.6);
	}

	video {
		width: 100%;
	}
</style>

<div>
	<video 
		bind:this={vid_el}
		poster="{poster_link}"
		src="{source_link}"
		on:mousemove={handleMousemove}
		on:mousedown={handleMousedown}
		bind:currentTime={time}
		bind:duration
		bind:paused>
			<track kind="captions"/>
	</video>

	<div class="controls" style="opacity: {duration && showControls ? 1 : 0}">
		<progress value="{(time / duration) || 0}"/>

		<div class="info">
			<span class="time">{format(time)}</span>
			<span>click anywhere to {paused ? 'play' : 'pause'} / drag to seek</span>
			<span class="time">{format(duration)}</span>
		</div>
	</div>
</div>
