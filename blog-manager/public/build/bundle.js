
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //
    window._link_picker_list = {};

    class LinkPicker {
        //
        constructor() {
            this.picked = window._link_picker_list;
        }
        //
        add_entry(entry_id) {
            if ( this.picked[entry_id] === undefined ) {
                this.picked[entry_id] = true;
            }
        }
        //
        remove_entry(entry_id) {
            if ( this.picked[entry_id] !== undefined ) {
                delete this.picked[entry_id];
            }
        }
        //
        is_picked(entry_id) {
            return (this.picked[entry_id] !== undefined)
        }
        //
        toggle_pick(entry_id) {
            if ( this.is_picked(entry_id) ) {
                this.remove_entry(entry_id);
            } else {
                this.add_entry(entry_id);
            }
        }
        //
        map_picks(entry_list) {
            for ( let obj of entry_list ) {
                if ( this.is_picked(obj.entry) ) {
                    this.picked[obj.entry] = obj;
                }
            }
        }
        //
        get_pick_values() {
            let v_list = [];
            for ( let ky in this.picked ) {
                v_list.push(this.picked[ky]);
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

    const picker = createPickerStats();
    const link_picker = new LinkPicker();

    /* src/Comment.svelte generated by Svelte v3.42.4 */

    const file$7 = "src/Comment.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2;
    	let t3;
    	let span2;
    	let t4;
    	let t5;
    	let h4;
    	let t6;
    	let t7;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span0 = element("span");
    			t0 = text(/*entry*/ ctx[0]);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*created_when*/ ctx[3]);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(/*updated_when*/ ctx[2]);
    			t5 = space();
    			h4 = element("h4");
    			t6 = text(/*short_title*/ ctx[4]);
    			t7 = space();
    			div0 = element("div");
    			set_style(span0, "color", "darkbrown");
    			attr_dev(span0, "class", "svelte-1rpkexp");
    			add_location(span0, file$7, 34, 1, 764);
    			set_style(span1, "background-color", "yellowgreen");
    			attr_dev(span1, "class", "svelte-1rpkexp");
    			add_location(span1, file$7, 35, 1, 811);
    			set_style(span2, "background-color", "lightblue");
    			attr_dev(span2, "class", "svelte-1rpkexp");
    			add_location(span2, file$7, 36, 1, 878);
    			attr_dev(h4, "class", "blg-item-title svelte-1rpkexp");
    			set_style(h4, "background-color", "inherit");
    			add_location(h4, file$7, 37, 1, 943);
    			attr_dev(div0, "class", "teaser svelte-1rpkexp");
    			add_location(div0, file$7, 38, 1, 1025);
    			attr_dev(div1, "class", "blg-el-wrapper svelte-1rpkexp");
    			add_location(div1, file$7, 33, 0, 733);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span0);
    			append_dev(span0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, span1);
    			append_dev(span1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, span2);
    			append_dev(span2, t4);
    			append_dev(div1, t5);
    			append_dev(div1, h4);
    			append_dev(h4, t6);
    			append_dev(div1, t7);
    			append_dev(div1, div0);
    			div0.innerHTML = /*truncated*/ ctx[1];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*entry*/ 1) set_data_dev(t0, /*entry*/ ctx[0]);
    			if (dirty & /*created_when*/ 8) set_data_dev(t2, /*created_when*/ ctx[3]);
    			if (dirty & /*updated_when*/ 4) set_data_dev(t4, /*updated_when*/ ctx[2]);
    			if (dirty & /*short_title*/ 16) set_data_dev(t6, /*short_title*/ ctx[4]);
    			if (dirty & /*truncated*/ 2) div0.innerHTML = /*truncated*/ ctx[1];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function convert_date$2(secsdate) {
    	if (secsdate === 'never') {
    		return 'never';
    	} else {
    		let idate = parseInt(secsdate);
    		let dformatted = new Date(idate).toLocaleDateString('en-US');
    		return dformatted;
    	}
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Comment', slots, []);
    	let { dates } = $$props;
    	let { entry } = $$props;
    	let { title } = $$props;
    	let { txt_full } = $$props;
    	let truncated;
    	let updated_when;
    	let created_when;
    	let short_title;
    	const writable_props = ['dates', 'entry', 'title', 'txt_full'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Comment> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('dates' in $$props) $$invalidate(5, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(0, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(6, title = $$props.title);
    		if ('txt_full' in $$props) $$invalidate(7, txt_full = $$props.txt_full);
    	};

    	$$self.$capture_state = () => ({
    		dates,
    		entry,
    		title,
    		txt_full,
    		truncated,
    		convert_date: convert_date$2,
    		updated_when,
    		created_when,
    		short_title
    	});

    	$$self.$inject_state = $$props => {
    		if ('dates' in $$props) $$invalidate(5, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(0, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(6, title = $$props.title);
    		if ('txt_full' in $$props) $$invalidate(7, txt_full = $$props.txt_full);
    		if ('truncated' in $$props) $$invalidate(1, truncated = $$props.truncated);
    		if ('updated_when' in $$props) $$invalidate(2, updated_when = $$props.updated_when);
    		if ('created_when' in $$props) $$invalidate(3, created_when = $$props.created_when);
    		if ('short_title' in $$props) $$invalidate(4, short_title = $$props.short_title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*txt_full*/ 128) {
    			$$invalidate(1, truncated = txt_full !== undefined
    			? txt_full.substr(0, 250) + "&#8230;"
    			: "search");
    		}

    		if ($$self.$$.dirty & /*dates*/ 32) {
    			$$invalidate(2, updated_when = dates ? convert_date$2(dates.updated) : "");
    		}

    		if ($$self.$$.dirty & /*dates*/ 32) {
    			$$invalidate(3, created_when = dates ? convert_date$2(dates.created) : "");
    		}

    		if ($$self.$$.dirty & /*title*/ 64) {
    			$$invalidate(4, short_title = title ? title.substr(0, 16) + '...' : "...");
    		}
    	};

    	return [
    		entry,
    		truncated,
    		updated_when,
    		created_when,
    		short_title,
    		dates,
    		title,
    		txt_full
    	];
    }

    class Comment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			dates: 5,
    			entry: 0,
    			title: 6,
    			txt_full: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comment",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dates*/ ctx[5] === undefined && !('dates' in props)) {
    			console.warn("<Comment> was created without expected prop 'dates'");
    		}

    		if (/*entry*/ ctx[0] === undefined && !('entry' in props)) {
    			console.warn("<Comment> was created without expected prop 'entry'");
    		}

    		if (/*title*/ ctx[6] === undefined && !('title' in props)) {
    			console.warn("<Comment> was created without expected prop 'title'");
    		}

    		if (/*txt_full*/ ctx[7] === undefined && !('txt_full' in props)) {
    			console.warn("<Comment> was created without expected prop 'txt_full'");
    		}
    	}

    	get dates() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dates(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get txt_full() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set txt_full(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ThingFull.svelte generated by Svelte v3.42.4 */
    const file$6 = "src/ThingFull.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (82:2) {#if going_session }
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "add comment";
    			add_location(button, file$6, 82, 2, 1996);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*present_comment_editing*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(82:2) {#if going_session }",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#if have_comments }
    function create_if_block$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*comments*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*comments*/ 32) {
    				each_value = /*comments*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(95:2) {#if have_comments }",
    		ctx
    	});

    	return block;
    }

    // (96:3) {#each comments as comment }
    function create_each_block$3(ctx) {
    	let ul;
    	let li;
    	let comment;
    	let t;
    	let current;
    	const comment_spread_levels = [/*comment*/ ctx[19]];
    	let comment_props = {};

    	for (let i = 0; i < comment_spread_levels.length; i += 1) {
    		comment_props = assign(comment_props, comment_spread_levels[i]);
    	}

    	comment = new Comment({ props: comment_props, $$inline: true });

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			create_component(comment.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "comment-list-entry");
    			add_location(li, file$6, 97, 5, 2509);
    			attr_dev(ul, "class", "comment-list");
    			add_location(ul, file$6, 96, 4, 2478);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			mount_component(comment, li, null);
    			append_dev(ul, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_changes = (dirty & /*comments*/ 32)
    			? get_spread_update(comment_spread_levels, [get_spread_object(/*comment*/ ctx[19])])
    			: {};

    			comment.$set(comment_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(comment);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(96:3) {#each comments as comment }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div4;
    	let div1;
    	let span0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let span1;
    	let t3;
    	let t4;
    	let span2;
    	let t5;
    	let t6;
    	let t7;
    	let h4;
    	let t8;
    	let t9;
    	let h6;
    	let t10;
    	let t11;
    	let div0;
    	let span3;
    	let t13;
    	let h5;
    	let t14;
    	let t15;
    	let div2;
    	let t16;
    	let div3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*going_session*/ ctx[6] && create_if_block_1(ctx);
    	let if_block1 = /*have_comments*/ ctx[7] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			t0 = text(/*entry*/ ctx[1]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(/*created_when*/ ctx[10]);
    			t4 = space();
    			span2 = element("span");
    			t5 = text(/*updated_when*/ ctx[9]);
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			h4 = element("h4");
    			t8 = text(/*title*/ ctx[2]);
    			t9 = space();
    			h6 = element("h6");
    			t10 = text(/*key_str*/ ctx[11]);
    			t11 = space();
    			div0 = element("div");
    			span3 = element("span");
    			span3.textContent = "subject";
    			t13 = text("  ");
    			h5 = element("h5");
    			t14 = text(/*subject*/ ctx[3]);
    			t15 = space();
    			div2 = element("div");
    			t16 = space();
    			div3 = element("div");
    			if (if_block1) if_block1.c();
    			set_style(span0, "background-color", /*color*/ ctx[0]);
    			attr_dev(span0, "class", "svelte-giy3dc");
    			add_location(span0, file$6, 78, 2, 1705);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$6, 78, 57, 1760);
    			set_style(span1, "background-color", "yellowgreen");
    			attr_dev(span1, "class", "svelte-giy3dc");
    			add_location(span1, file$6, 79, 2, 1838);
    			set_style(span2, "background-color", "lightblue");
    			attr_dev(span2, "class", "svelte-giy3dc");
    			add_location(span2, file$6, 80, 2, 1906);
    			attr_dev(h4, "class", "blg-item-title svelte-giy3dc");
    			set_style(h4, "background-color", "inherit");
    			add_location(h4, file$6, 84, 2, 2070);
    			attr_dev(h6, "class", "svelte-giy3dc");
    			add_location(h6, file$6, 85, 2, 2147);
    			set_style(span3, "background-color", "navy");
    			attr_dev(span3, "class", "svelte-giy3dc");
    			add_location(span3, file$6, 87, 3, 2177);
    			attr_dev(h5, "class", "blg-item-subject svelte-giy3dc");
    			add_location(h5, file$6, 87, 65, 2239);
    			add_location(div0, file$6, 86, 2, 2168);
    			set_style(div1, "padding", "6px");
    			add_location(div1, file$6, 77, 1, 1675);
    			attr_dev(div2, "id", "blg-window-full-text");
    			attr_dev(div2, "class", "full-display svelte-giy3dc");
    			add_location(div2, file$6, 90, 1, 2302);
    			attr_dev(div3, "class", "comment-list-block");
    			add_location(div3, file$6, 93, 1, 2385);
    			attr_dev(div4, "class", "blg-el-wrapper-full svelte-giy3dc");
    			add_location(div4, file$6, 76, 0, 1640);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			input.checked = /*picked_this*/ ctx[8];
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, span2);
    			append_dev(span2, t5);
    			append_dev(div1, t6);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t7);
    			append_dev(div1, h4);
    			append_dev(h4, t8);
    			append_dev(div1, t9);
    			append_dev(div1, h6);
    			append_dev(h6, t10);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div0, span3);
    			append_dev(div0, t13);
    			append_dev(div0, h5);
    			append_dev(h5, t14);
    			append_dev(div4, t15);
    			append_dev(div4, div2);
    			div2.innerHTML = /*txt_full*/ ctx[4];
    			append_dev(div4, t16);
    			append_dev(div4, div3);
    			if (if_block1) if_block1.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[16]),
    					listen_dev(input, "click", /*toggle_pick*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*entry*/ 2) set_data_dev(t0, /*entry*/ ctx[1]);

    			if (!current || dirty & /*color*/ 1) {
    				set_style(span0, "background-color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*picked_this*/ 256) {
    				input.checked = /*picked_this*/ ctx[8];
    			}

    			if (!current || dirty & /*created_when*/ 1024) set_data_dev(t3, /*created_when*/ ctx[10]);
    			if (!current || dirty & /*updated_when*/ 512) set_data_dev(t5, /*updated_when*/ ctx[9]);

    			if (/*going_session*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*title*/ 4) set_data_dev(t8, /*title*/ ctx[2]);
    			if (!current || dirty & /*key_str*/ 2048) set_data_dev(t10, /*key_str*/ ctx[11]);
    			if (!current || dirty & /*subject*/ 8) set_data_dev(t14, /*subject*/ ctx[3]);
    			if (!current || dirty & /*txt_full*/ 16) div2.innerHTML = /*txt_full*/ ctx[4];
    			if (/*have_comments*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*have_comments*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function convert_date$1(secsdate) {
    	if (secsdate === 'never') {
    		return 'never';
    	} else {
    		let idate = parseInt(secsdate);
    		let dformatted = new Date(idate).toLocaleDateString('en-US');
    		return dformatted;
    	}
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let key_str;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ThingFull', slots, []);
    	let { color } = $$props;
    	let { entry } = $$props;
    	let { title } = $$props;
    	let { dates } = $$props;
    	let { subject } = $$props;
    	let { keys } = $$props;
    	let { txt_full } = $$props;
    	let { comments } = $$props;
    	let have_comments = false;
    	let picked_this = false;
    	let updated_when;
    	let created_when;
    	let going_session = false;

    	function present_comment_editing() {
    		if (going_session && typeof window.launch_comment_editor === "function") {
    			window.launch_comment_editor(going_session, entry);
    		}
    	}

    	function toggle_pick(ev) {
    		link_picker.toggle_pick(entry);

    		if (picked_this) {
    			picker.increment();
    		} else {
    			picker.decrement();
    		}
    	}

    	let count_value;

    	const unsubscribe = picker.subscribe(value => {
    		count_value = value;
    		$$invalidate(8, picked_this = link_picker.is_picked(entry));
    	});

    	const writable_props = ['color', 'entry', 'title', 'dates', 'subject', 'keys', 'txt_full', 'comments'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ThingFull> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		picked_this = this.checked;
    		($$invalidate(8, picked_this), $$invalidate(1, entry));
    	}

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('entry' in $$props) $$invalidate(1, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('dates' in $$props) $$invalidate(14, dates = $$props.dates);
    		if ('subject' in $$props) $$invalidate(3, subject = $$props.subject);
    		if ('keys' in $$props) $$invalidate(15, keys = $$props.keys);
    		if ('txt_full' in $$props) $$invalidate(4, txt_full = $$props.txt_full);
    		if ('comments' in $$props) $$invalidate(5, comments = $$props.comments);
    	};

    	$$self.$capture_state = () => ({
    		link_picker,
    		picker,
    		Comment,
    		color,
    		entry,
    		title,
    		dates,
    		subject,
    		keys,
    		txt_full,
    		comments,
    		convert_date: convert_date$1,
    		have_comments,
    		picked_this,
    		updated_when,
    		created_when,
    		going_session,
    		present_comment_editing,
    		toggle_pick,
    		count_value,
    		unsubscribe,
    		key_str
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('entry' in $$props) $$invalidate(1, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('dates' in $$props) $$invalidate(14, dates = $$props.dates);
    		if ('subject' in $$props) $$invalidate(3, subject = $$props.subject);
    		if ('keys' in $$props) $$invalidate(15, keys = $$props.keys);
    		if ('txt_full' in $$props) $$invalidate(4, txt_full = $$props.txt_full);
    		if ('comments' in $$props) $$invalidate(5, comments = $$props.comments);
    		if ('have_comments' in $$props) $$invalidate(7, have_comments = $$props.have_comments);
    		if ('picked_this' in $$props) $$invalidate(8, picked_this = $$props.picked_this);
    		if ('updated_when' in $$props) $$invalidate(9, updated_when = $$props.updated_when);
    		if ('created_when' in $$props) $$invalidate(10, created_when = $$props.created_when);
    		if ('going_session' in $$props) $$invalidate(6, going_session = $$props.going_session);
    		if ('count_value' in $$props) count_value = $$props.count_value;
    		if ('key_str' in $$props) $$invalidate(11, key_str = $$props.key_str);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*keys*/ 32768) {
    			$$invalidate(11, key_str = keys.join(', '));
    		}

    		if ($$self.$$.dirty & /*entry*/ 2) {
    			$$invalidate(8, picked_this = link_picker.is_picked(entry));
    		}

    		if ($$self.$$.dirty & /*dates*/ 16384) {
    			$$invalidate(9, updated_when = convert_date$1(dates.updated));
    		}

    		if ($$self.$$.dirty & /*dates*/ 16384) {
    			$$invalidate(10, created_when = convert_date$1(dates.created));
    		}

    		if ($$self.$$.dirty & /*comments, going_session*/ 96) {
    			if (comments !== undefined) {
    				if (typeof window.retrieve_session === "function") {
    					$$invalidate(6, going_session = window.retrieve_session());

    					if (going_session) {
    						$$invalidate(7, have_comments = Array.isArray(comments) && comments.length !== 0);
    					}
    				}
    			}
    		}
    	};

    	return [
    		color,
    		entry,
    		title,
    		subject,
    		txt_full,
    		comments,
    		going_session,
    		have_comments,
    		picked_this,
    		updated_when,
    		created_when,
    		key_str,
    		present_comment_editing,
    		toggle_pick,
    		dates,
    		keys,
    		input_change_handler
    	];
    }

    class ThingFull extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			color: 0,
    			entry: 1,
    			title: 2,
    			dates: 14,
    			subject: 3,
    			keys: 15,
    			txt_full: 4,
    			comments: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThingFull",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*color*/ ctx[0] === undefined && !('color' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'color'");
    		}

    		if (/*entry*/ ctx[1] === undefined && !('entry' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'entry'");
    		}

    		if (/*title*/ ctx[2] === undefined && !('title' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'title'");
    		}

    		if (/*dates*/ ctx[14] === undefined && !('dates' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'dates'");
    		}

    		if (/*subject*/ ctx[3] === undefined && !('subject' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'subject'");
    		}

    		if (/*keys*/ ctx[15] === undefined && !('keys' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'keys'");
    		}

    		if (/*txt_full*/ ctx[4] === undefined && !('txt_full' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'txt_full'");
    		}

    		if (/*comments*/ ctx[5] === undefined && !('comments' in props)) {
    			console.warn("<ThingFull> was created without expected prop 'comments'");
    		}
    	}

    	get color() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dates() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dates(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subject() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subject(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keys() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keys(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get txt_full() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set txt_full(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get comments() {
    		throw new Error("<ThingFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comments(value) {
    		throw new Error("<ThingFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Thing.svelte generated by Svelte v3.42.4 */
    const file$5 = "src/Thing.svelte";

    // (89:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "End of Content";
    			attr_dev(h4, "class", "blg-item-title svelte-z1o6yc");
    			set_style(h4, "background-color", "lightgrey");
    			set_style(h4, "color", "darkgrey");
    			add_location(h4, file$5, 90, 1, 2224);
    			attr_dev(div, "class", "blg-el-wrapper svelte-z1o6yc");
    			add_location(div, file$5, 89, 0, 2194);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(89:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:0) {#if dates && (dates.created != 'never') }
    function create_if_block$1(ctx) {
    	let div2;
    	let input;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4;
    	let span2;
    	let t5;
    	let t6;
    	let h4;
    	let t7;
    	let t8;
    	let h6;
    	let t9;
    	let t10;
    	let div0;
    	let span3;
    	let t11;
    	let span4;
    	let t13;
    	let h5;
    	let t14;
    	let t15;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(/*entry*/ ctx[1]);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(/*created_when*/ ctx[6]);
    			t4 = space();
    			span2 = element("span");
    			t5 = text(/*updated_when*/ ctx[5]);
    			t6 = space();
    			h4 = element("h4");
    			t7 = text(/*short_title*/ ctx[7]);
    			t8 = space();
    			h6 = element("h6");
    			t9 = text(/*key_str*/ ctx[9]);
    			t10 = space();
    			div0 = element("div");
    			span3 = element("span");
    			t11 = text(/*score_rounded*/ ctx[3]);
    			span4 = element("span");
    			span4.textContent = "subject";
    			t13 = text("  ");
    			h5 = element("h5");
    			t14 = text(/*short_subject*/ ctx[8]);
    			t15 = space();
    			div1 = element("div");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$5, 73, 1, 1592);
    			set_style(span0, "color", "darkbrown");
    			attr_dev(span0, "class", "svelte-z1o6yc");
    			add_location(span0, file$5, 75, 1, 1671);
    			set_style(span1, "background-color", "yellowgreen");
    			attr_dev(span1, "class", "svelte-z1o6yc");
    			add_location(span1, file$5, 76, 1, 1718);
    			set_style(span2, "background-color", "lightblue");
    			attr_dev(span2, "class", "svelte-z1o6yc");
    			add_location(span2, file$5, 77, 1, 1785);
    			attr_dev(h4, "class", "blg-item-title svelte-z1o6yc");
    			set_style(h4, "background-color", "inherit");
    			add_location(h4, file$5, 78, 1, 1850);
    			attr_dev(h6, "class", "svelte-z1o6yc");
    			add_location(h6, file$5, 79, 1, 1932);
    			attr_dev(span3, "class", "thng-score svelte-z1o6yc");
    			add_location(span3, file$5, 81, 1, 1959);
    			set_style(span4, "background-color", "navy");
    			attr_dev(span4, "class", "svelte-z1o6yc");
    			add_location(span4, file$5, 81, 48, 2006);
    			attr_dev(h5, "class", "blg-item-subject svelte-z1o6yc");
    			add_location(h5, file$5, 81, 110, 2068);
    			add_location(div0, file$5, 80, 1, 1952);
    			attr_dev(div1, "class", "teaser svelte-z1o6yc");
    			add_location(div1, file$5, 83, 1, 2128);
    			attr_dev(div2, "class", "blg-el-wrapper svelte-z1o6yc");
    			add_location(div2, file$5, 71, 0, 1559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			input.checked = /*picked_this*/ ctx[4];
    			append_dev(div2, t0);
    			append_dev(div2, span0);
    			append_dev(span0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, span1);
    			append_dev(span1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, span2);
    			append_dev(span2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, h4);
    			append_dev(h4, t7);
    			append_dev(div2, t8);
    			append_dev(div2, h6);
    			append_dev(h6, t9);
    			append_dev(div2, t10);
    			append_dev(div2, div0);
    			append_dev(div0, span3);
    			append_dev(span3, t11);
    			append_dev(div0, span4);
    			append_dev(div0, t13);
    			append_dev(div0, h5);
    			append_dev(h5, t14);
    			append_dev(div2, t15);
    			append_dev(div2, div1);
    			div1.innerHTML = /*truncated*/ ctx[2];

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[20]),
    					listen_dev(input, "click", /*toggle_pick*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*picked_this*/ 16) {
    				input.checked = /*picked_this*/ ctx[4];
    			}

    			if (dirty & /*entry*/ 2) set_data_dev(t1, /*entry*/ ctx[1]);
    			if (dirty & /*created_when*/ 64) set_data_dev(t3, /*created_when*/ ctx[6]);
    			if (dirty & /*updated_when*/ 32) set_data_dev(t5, /*updated_when*/ ctx[5]);
    			if (dirty & /*short_title*/ 128) set_data_dev(t7, /*short_title*/ ctx[7]);
    			if (dirty & /*key_str*/ 512) set_data_dev(t9, /*key_str*/ ctx[9]);
    			if (dirty & /*score_rounded*/ 8) set_data_dev(t11, /*score_rounded*/ ctx[3]);
    			if (dirty & /*short_subject*/ 256) set_data_dev(t14, /*short_subject*/ ctx[8]);
    			if (dirty & /*truncated*/ 4) div1.innerHTML = /*truncated*/ ctx[2];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(71:0) {#if dates && (dates.created != 'never') }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*dates*/ ctx[0] && /*dates*/ ctx[0].created != 'never') return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function convert_date(secsdate) {
    	if (secsdate === 'never') {
    		return 'never';
    	} else {
    		let idate = parseInt(secsdate);
    		let dformatted = new Date(idate).toLocaleDateString('en-US');
    		return dformatted;
    	}
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let key_str;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Thing', slots, []);
    	let { abstract } = $$props;
    	let { color } = $$props;
    	let { dates } = $$props;
    	let { entry } = $$props;
    	let { id } = $$props;
    	let { keys } = $$props;
    	let { media } = $$props;
    	let { score } = $$props;
    	let { subject } = $$props;
    	let { title } = $$props;
    	let { txt_full } = $$props;
    	let truncated;
    	let score_rounded;
    	let picked_this = false;
    	let updated_when;
    	let created_when;
    	let short_title;
    	let short_subject;

    	function toggle_pick(ev) {
    		ev.stopPropagation();
    		link_picker.toggle_pick(entry);

    		if (picked_this) {
    			picker.increment();
    		} else {
    			picker.decrement();
    		}
    	}

    	let count_value;

    	const unsubscribe = picker.subscribe(value => {
    		count_value = value;
    		$$invalidate(4, picked_this = link_picker.is_picked(entry));
    	});

    	const writable_props = [
    		'abstract',
    		'color',
    		'dates',
    		'entry',
    		'id',
    		'keys',
    		'media',
    		'score',
    		'subject',
    		'title',
    		'txt_full'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Thing> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		picked_this = this.checked;
    		($$invalidate(4, picked_this), $$invalidate(1, entry));
    	}

    	$$self.$$set = $$props => {
    		if ('abstract' in $$props) $$invalidate(11, abstract = $$props.abstract);
    		if ('color' in $$props) $$invalidate(12, color = $$props.color);
    		if ('dates' in $$props) $$invalidate(0, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(1, entry = $$props.entry);
    		if ('id' in $$props) $$invalidate(13, id = $$props.id);
    		if ('keys' in $$props) $$invalidate(14, keys = $$props.keys);
    		if ('media' in $$props) $$invalidate(15, media = $$props.media);
    		if ('score' in $$props) $$invalidate(16, score = $$props.score);
    		if ('subject' in $$props) $$invalidate(17, subject = $$props.subject);
    		if ('title' in $$props) $$invalidate(18, title = $$props.title);
    		if ('txt_full' in $$props) $$invalidate(19, txt_full = $$props.txt_full);
    	};

    	$$self.$capture_state = () => ({
    		link_picker,
    		picker,
    		abstract,
    		color,
    		dates,
    		entry,
    		id,
    		keys,
    		media,
    		score,
    		subject,
    		title,
    		txt_full,
    		truncated,
    		score_rounded,
    		picked_this,
    		convert_date,
    		updated_when,
    		created_when,
    		short_title,
    		short_subject,
    		toggle_pick,
    		count_value,
    		unsubscribe,
    		key_str
    	});

    	$$self.$inject_state = $$props => {
    		if ('abstract' in $$props) $$invalidate(11, abstract = $$props.abstract);
    		if ('color' in $$props) $$invalidate(12, color = $$props.color);
    		if ('dates' in $$props) $$invalidate(0, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(1, entry = $$props.entry);
    		if ('id' in $$props) $$invalidate(13, id = $$props.id);
    		if ('keys' in $$props) $$invalidate(14, keys = $$props.keys);
    		if ('media' in $$props) $$invalidate(15, media = $$props.media);
    		if ('score' in $$props) $$invalidate(16, score = $$props.score);
    		if ('subject' in $$props) $$invalidate(17, subject = $$props.subject);
    		if ('title' in $$props) $$invalidate(18, title = $$props.title);
    		if ('txt_full' in $$props) $$invalidate(19, txt_full = $$props.txt_full);
    		if ('truncated' in $$props) $$invalidate(2, truncated = $$props.truncated);
    		if ('score_rounded' in $$props) $$invalidate(3, score_rounded = $$props.score_rounded);
    		if ('picked_this' in $$props) $$invalidate(4, picked_this = $$props.picked_this);
    		if ('updated_when' in $$props) $$invalidate(5, updated_when = $$props.updated_when);
    		if ('created_when' in $$props) $$invalidate(6, created_when = $$props.created_when);
    		if ('short_title' in $$props) $$invalidate(7, short_title = $$props.short_title);
    		if ('short_subject' in $$props) $$invalidate(8, short_subject = $$props.short_subject);
    		if ('count_value' in $$props) count_value = $$props.count_value;
    		if ('key_str' in $$props) $$invalidate(9, key_str = $$props.key_str);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*txt_full*/ 524288) {
    			$$invalidate(2, truncated = txt_full !== undefined
    			? txt_full.substr(0, 250) + "&#8230;"
    			: "search");
    		}

    		if ($$self.$$.dirty & /*keys*/ 16384) {
    			$$invalidate(9, key_str = keys ? keys.join(', ') : "");
    		}

    		if ($$self.$$.dirty & /*score*/ 65536) {
    			$$invalidate(3, score_rounded = score ? score.toFixed(3) : 0);
    		}

    		if ($$self.$$.dirty & /*entry*/ 2) {
    			$$invalidate(4, picked_this = link_picker.is_picked(entry));
    		}

    		if ($$self.$$.dirty & /*dates*/ 1) {
    			$$invalidate(5, updated_when = dates ? convert_date(dates.updated) : "");
    		}

    		if ($$self.$$.dirty & /*dates*/ 1) {
    			$$invalidate(6, created_when = dates ? convert_date(dates.created) : "");
    		}

    		if ($$self.$$.dirty & /*title*/ 262144) {
    			$$invalidate(7, short_title = title ? title.substr(0, 16) + '...' : "...");
    		}

    		if ($$self.$$.dirty & /*subject*/ 131072) {
    			$$invalidate(8, short_subject = subject ? subject.substr(0, 32) + '...' : "...");
    		}
    	};

    	return [
    		dates,
    		entry,
    		truncated,
    		score_rounded,
    		picked_this,
    		updated_when,
    		created_when,
    		short_title,
    		short_subject,
    		key_str,
    		toggle_pick,
    		abstract,
    		color,
    		id,
    		keys,
    		media,
    		score,
    		subject,
    		title,
    		txt_full,
    		input_change_handler
    	];
    }

    class Thing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			abstract: 11,
    			color: 12,
    			dates: 0,
    			entry: 1,
    			id: 13,
    			keys: 14,
    			media: 15,
    			score: 16,
    			subject: 17,
    			title: 18,
    			txt_full: 19
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thing",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*abstract*/ ctx[11] === undefined && !('abstract' in props)) {
    			console.warn("<Thing> was created without expected prop 'abstract'");
    		}

    		if (/*color*/ ctx[12] === undefined && !('color' in props)) {
    			console.warn("<Thing> was created without expected prop 'color'");
    		}

    		if (/*dates*/ ctx[0] === undefined && !('dates' in props)) {
    			console.warn("<Thing> was created without expected prop 'dates'");
    		}

    		if (/*entry*/ ctx[1] === undefined && !('entry' in props)) {
    			console.warn("<Thing> was created without expected prop 'entry'");
    		}

    		if (/*id*/ ctx[13] === undefined && !('id' in props)) {
    			console.warn("<Thing> was created without expected prop 'id'");
    		}

    		if (/*keys*/ ctx[14] === undefined && !('keys' in props)) {
    			console.warn("<Thing> was created without expected prop 'keys'");
    		}

    		if (/*media*/ ctx[15] === undefined && !('media' in props)) {
    			console.warn("<Thing> was created without expected prop 'media'");
    		}

    		if (/*score*/ ctx[16] === undefined && !('score' in props)) {
    			console.warn("<Thing> was created without expected prop 'score'");
    		}

    		if (/*subject*/ ctx[17] === undefined && !('subject' in props)) {
    			console.warn("<Thing> was created without expected prop 'subject'");
    		}

    		if (/*title*/ ctx[18] === undefined && !('title' in props)) {
    			console.warn("<Thing> was created without expected prop 'title'");
    		}

    		if (/*txt_full*/ ctx[19] === undefined && !('txt_full' in props)) {
    			console.warn("<Thing> was created without expected prop 'txt_full'");
    		}
    	}

    	get abstract() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set abstract(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dates() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dates(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keys() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keys(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get media() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set media(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get score() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subject() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subject(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get txt_full() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set txt_full(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/grid-of-things/src/ThingGrid.svelte generated by Svelte v3.42.4 */
    const file$4 = "node_modules/grid-of-things/src/ThingGrid.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (31:1) {#each things as thing (thing.id)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let div_id_value;
    	let current;
    	let mounted;
    	let dispose;
    	const switch_instance_spread_levels = [/*thing*/ ctx[7]];
    	var switch_value = /*thing_component*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			attr_dev(div, "id", div_id_value = "xy_" + /*thing*/ ctx[7].id);
    			attr_dev(div, "class", "" + (null_to_empty(/*element_poster_class*/ ctx[5]) + " svelte-1q6bcs0"));
    			add_location(div, file$4, 31, 2, 672);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*do_display*/ ctx[2], false, false, false),
    					listen_dev(div, "mouseover", /*show_titles*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const switch_instance_changes = (dirty & /*things*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*thing*/ ctx[7])])
    			: {};

    			if (switch_value !== (switch_value = /*thing_component*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if (!current || dirty & /*things*/ 1 && div_id_value !== (div_id_value = "xy_" + /*thing*/ ctx[7].id)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(31:1) {#each things as thing (thing.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*things*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*thing*/ ctx[7].id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "" + (null_to_empty(/*grid_container_class*/ ctx[4]) + " svelte-1q6bcs0"));
    			add_location(div, file$4, 29, 0, 598);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*things, element_poster_class, do_display, show_titles, thing_component*/ 47) {
    				each_value = /*things*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ThingGrid', slots, []);
    	let { things } = $$props;
    	let { thing_component } = $$props;
    	const dispatch = createEventDispatcher();

    	function do_display(event) {
    		let tid = event.currentTarget.id;
    		dispatch('message', { type: 'click', text: 'click ' + tid });
    	}

    	function show_titles(event) {
    		let tid = event.currentTarget.id;
    		dispatch('message', { type: 'over', text: 'over ' + tid });
    	}

    	let grid_container_class = "grid-container";
    	let element_poster_class = "element-poster";
    	const writable_props = ['things', 'thing_component'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ThingGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('things' in $$props) $$invalidate(0, things = $$props.things);
    		if ('thing_component' in $$props) $$invalidate(1, thing_component = $$props.thing_component);
    	};

    	$$self.$capture_state = () => ({
    		things,
    		thing_component,
    		createEventDispatcher,
    		dispatch,
    		do_display,
    		show_titles,
    		grid_container_class,
    		element_poster_class
    	});

    	$$self.$inject_state = $$props => {
    		if ('things' in $$props) $$invalidate(0, things = $$props.things);
    		if ('thing_component' in $$props) $$invalidate(1, thing_component = $$props.thing_component);
    		if ('grid_container_class' in $$props) $$invalidate(4, grid_container_class = $$props.grid_container_class);
    		if ('element_poster_class' in $$props) $$invalidate(5, element_poster_class = $$props.element_poster_class);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		things,
    		thing_component,
    		do_display,
    		show_titles,
    		grid_container_class,
    		element_poster_class
    	];
    }

    class ThingGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { things: 0, thing_component: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThingGrid",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*things*/ ctx[0] === undefined && !('things' in props)) {
    			console.warn("<ThingGrid> was created without expected prop 'things'");
    		}

    		if (/*thing_component*/ ctx[1] === undefined && !('thing_component' in props)) {
    			console.warn("<ThingGrid> was created without expected prop 'thing_component'");
    		}
    	}

    	get things() {
    		throw new Error("<ThingGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set things(value) {
    		throw new Error("<ThingGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thing_component() {
    		throw new Error("<ThingGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thing_component(value) {
    		throw new Error("<ThingGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-float-window/src/w_resize.svelte generated by Svelte v3.42.4 */
    const file$3 = "node_modules/svelte-float-window/src/w_resize.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "drag-container svelte-1qg5mt7");
    			add_location(div, file$3, 45, 4, 1012);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mousedown", /*start_drag*/ ctx[0], false, false, false),
    					listen_dev(div, "mouseup", /*stop_drag*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('W_resize', slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let offset = { x: 0, y: 0 };

    	function start_drag(e) {
    		let mover = e.target;

    		if (mover) {
    			offset.x = e.pageX;
    			
    			offset.y = e.pageY;
    			window.addEventListener('mousemove', dragging, true);
    			window.addEventListener('mouseup', stop_drag, true);
    		}
    	}

    	function stop_drag(e) {
    		window.removeEventListener('mousemove', dragging, true);
    		window.removeEventListener('mouseup', stop_drag, true);
    		dispatch('message', { "cmd": "stop" });
    	}

    	function dragging(e) {
    		let mover = e.target;
    		if (mover === undefined) return;
    		const width_delta = e.pageX - offset.x;
    		const height_delta = e.pageY - offset.y;

    		dispatch('message', {
    			"cmd": "drag",
    			"w_delta": width_delta,
    			"h_delta": height_delta
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<W_resize> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		offset,
    		start_drag,
    		stop_drag,
    		dragging
    	});

    	$$self.$inject_state = $$props => {
    		if ('offset' in $$props) offset = $$props.offset;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [start_drag, stop_drag, $$scope, slots];
    }

    class W_resize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "W_resize",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* node_modules/svelte-float-window/src/FloatWindow.svelte generated by Svelte v3.42.4 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "node_modules/svelte-float-window/src/FloatWindow.svelte";

    // (207:1) <Resizer on:message={handle_size} >
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ⓩ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(207:1) <Resizer on:message={handle_size} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let span_id_value;
    	let div0_id_value;
    	let t3;
    	let p;
    	let t5;
    	let t6;
    	let resizer;
    	let div1_id_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	resizer = new W_resize({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	resizer.$on("message", /*handle_size*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			span = element("span");
    			t2 = text("[X]");
    			t3 = space();
    			p = element("p");
    			p.textContent = "Press ESC to close window.";
    			t5 = space();
    			if (default_slot) default_slot.c();
    			t6 = space();
    			create_component(resizer.$$.fragment);
    			attr_dev(span, "id", span_id_value = "btn_close_" + /*index*/ ctx[1]);
    			attr_dev(span, "class", "btn_close svelte-8emtpk");
    			add_location(span, file$2, 202, 3, 5527);
    			attr_dev(div0, "id", div0_id_value = "popup_bar_" + /*index*/ ctx[1]);
    			attr_dev(div0, "class", "popup_bar svelte-8emtpk");
    			add_location(div0, file$2, 200, 1, 5419);
    			set_style(p, "font-size", "0.75em");
    			set_style(p, "font-weight", "bold");
    			set_style(p, "color", "darkgreen");
    			set_style(p, "padding-left", "4px");
    			add_location(p, file$2, 204, 1, 5619);
    			attr_dev(div1, "id", div1_id_value = "popup_" + /*index*/ ctx[1]);
    			attr_dev(div1, "class", "popup svelte-8emtpk");
    			add_location(div1, file$2, 199, 0, 5377);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(div1, t5);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append_dev(div1, t6);
    			mount_component(resizer, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", handle_close, false, false, false),
    					listen_dev(div0, "mousedown", /*mouseDown*/ ctx[4], false, false, false),
    					listen_dev(div0, "mouseup", /*mouseUp*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (!current || dirty & /*index*/ 2 && span_id_value !== (span_id_value = "btn_close_" + /*index*/ ctx[1])) {
    				attr_dev(span, "id", span_id_value);
    			}

    			if (!current || dirty & /*index*/ 2 && div0_id_value !== (div0_id_value = "popup_bar_" + /*index*/ ctx[1])) {
    				attr_dev(div0, "id", div0_id_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
    						null
    					);
    				}
    			}

    			const resizer_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				resizer_changes.$$scope = { dirty, ctx };
    			}

    			resizer.$set(resizer_changes);

    			if (!current || dirty & /*index*/ 2 && div1_id_value !== (div1_id_value = "popup_" + /*index*/ ctx[1])) {
    				attr_dev(div1, "id", div1_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(resizer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(resizer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			destroy_component(resizer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const minimum_size = 300;

    function handle_close(e) {
    	let closer = e.target.id;

    	if (closer) {
    		let idx = closer.replace('btn_close_', '');
    		let popupId = `popup_${idx}`;
    		var popup = document.getElementById(popupId);
    		if (popup === undefined) return;
    		popup.style.display = "none";
    	}
    }

    function fix_height(ii, startup_delta) {
    	let txt_area = document.getElementById('blg-window-full-text');

    	if (txt_area) {
    		//
    		txt_area._blg_app_resized = true;

    		//
    		let r = txt_area.getBoundingClientRect();

    		//
    		var popup = document.getElementById(`popup_${ii}`);

    		if (popup) {
    			let rp = popup.getBoundingClientRect();
    			let h = Math.floor(rp.bottom - r.top) - startup_delta;
    			txt_area.style.height = h + "px";
    		}
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FloatWindow', slots, ['default']);
    	let { title } = $$props;
    	let { scale_size_array } = $$props;
    	let { index = 0 } = $$props;
    	var SCROLL_WIDTH = 24;
    	var Z_BOTTOM = 500;

    	// 
    	//-- let the popup make draggable & movable.
    	let offset = { x: 0, y: 0 };

    	let original_width = 0;
    	let original_height = 0;
    	let original_x = 0;
    	let original_y = 0;

    	function originals(popup) {
    		if (popup) {
    			original_width = parseFloat(getComputedStyle(popup, null).getPropertyValue('width').replace('px', ''));
    			original_height = parseFloat(getComputedStyle(popup, null).getPropertyValue('height').replace('px', ''));
    			original_x = popup.getBoundingClientRect().left;
    			original_y = popup.getBoundingClientRect().top;
    		}
    	}

    	let scale_current_size = Object.assign({}, scale_size_array);

    	onMount(() => {
    		let z_index_buffer = window._fws_z_order;

    		if (z_index_buffer === undefined) {
    			window._fws_z_order = [];
    			z_index_buffer = window._fws_z_order;
    		}

    		z_index_buffer.push(index);

    		//
    		var popup = document.getElementById(`popup_${index}`);

    		if (popup === undefined) return;
    		do_resize(index);

    		//
    		var popup_bar = document.getElementById(`popup_bar_${index}`);

    		//
    		popup_bar.addEventListener('mousedown', mouseDown, false);

    		window.addEventListener('mouseup', mouseUp, false);

    		window.addEventListener('keydown', e => {
    			if (e.keyCode == 27) {
    				// if ESC key pressed
    				var popup = document.getElementById(`popup_${index}`);

    				if (popup === undefined) return;
    				popup.style.display = "none";
    			}
    		});

    		window.addEventListener("resize", e => {
    			do_resize(index);
    		});

    		window.start_floating_window = index => {
    			popup_starter(index);
    		};
    	});

    	function fix_z_order(idx) {
    		let z_index_buffer = window._fws_z_order;

    		if (z_index_buffer !== undefined) {
    			if (typeof idx === "string") idx = parseInt(idx);
    			let pos = z_index_buffer.indexOf(idx);

    			if (pos >= 0) {
    				z_index_buffer.splice(pos, 1);
    				z_index_buffer.push(idx);
    				let bottom_z = Z_BOTTOM;

    				for (let p_i of z_index_buffer) {
    					let popupId = `popup_${p_i}`;
    					let popup = document.getElementById(popupId);

    					if (popup) {
    						popup.style.zIndex = bottom_z++;
    					}
    				}
    			}
    		}
    	}

    	function handle_size(event) {
    		if (event && event.detail) {
    			if (event.detail.cmd == 'drag') {
    				let w_dlt = event.detail.w_delta;
    				let h_dlt = event.detail.h_delta;

    				//
    				const width = original_width + w_dlt;

    				const height = original_height + h_dlt;
    				var popup = document.getElementById(`popup_${index}`);

    				if (popup) {
    					if (width > minimum_size) {
    						popup.style.width = width + 'px';
    					}

    					if (height > minimum_size) {
    						popup.style.height = height + 'px';
    					}
    				}
    			} else if (event.detail.cmd == 'stop') {
    				var popup = document.getElementById(`popup_${index}`);
    				originals(popup);
    			}
    		}
    	}

    	function do_resize(ii) {
    		var popup = document.getElementById(`popup_${ii}`);

    		if (popup) {
    			popup.style.width = window.innerWidth * scale_current_size.w - SCROLL_WIDTH + "px";
    			popup.style.height = window.innerHeight * scale_current_size.h - SCROLL_WIDTH + "px";
    			originals(popup);
    		}
    	}

    	function popup_starter(ii) {
    		var popup = document.getElementById(`popup_${ii}`);

    		if (popup && popup.style.display !== 'block') {
    			popup.style.top = "4px";
    			popup.style.left = "4px";
    			popup.style.width = window.innerWidth * scale_current_size.w - SCROLL_WIDTH + "px";
    			popup.style.height = window.innerHeight * scale_current_size.h - SCROLL_WIDTH + "px";
    			popup.style.display = "block";

    			setTimeout(
    				() => {
    					fix_height(ii, 4);
    				},
    				40
    			);
    		}

    		setTimeout(
    			() => {
    				fix_height(ii, 4);
    			},
    			20
    		);
    	}

    	function mouseUp(e) {
    		// popupMove is temporarily assiged to just one subwindow
    		window.removeEventListener('mousemove', popupMove, true);
    	}

    	function mouseDown(e) {
    		let mover = e.target.id;

    		if (mover) {
    			let idx = mover.replace('popup_bar_', '');
    			let popupId = `popup_${idx}`;
    			var popup = document.getElementById(popupId);
    			if (!popup) return;
    			fix_z_order(idx);
    			offset.x = e.clientX - popup.offsetLeft;
    			offset.y = e.clientY - popup.offsetTop;
    			window.addEventListener('mousemove', popupMove, true);
    		}
    	}

    	function popupMove(e) {
    		var popup = document.getElementById(`popup_${index}`);
    		if (popup === undefined) return;
    		popup.style.position = 'absolute';
    		var top = Math.max(e.clientY - offset.y, 0);
    		var left = Math.max(e.clientX - offset.x, 0);
    		popup.style.top = top + 'px';
    		popup.style.left = left + 'px';
    	}

    	const writable_props = ['title', 'scale_size_array', 'index'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FloatWindow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('scale_size_array' in $$props) $$invalidate(5, scale_size_array = $$props.scale_size_array);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Resizer: W_resize,
    		onMount,
    		title,
    		scale_size_array,
    		index,
    		SCROLL_WIDTH,
    		Z_BOTTOM,
    		minimum_size,
    		offset,
    		original_width,
    		original_height,
    		original_x,
    		original_y,
    		originals,
    		scale_current_size,
    		fix_z_order,
    		handle_close,
    		fix_height,
    		handle_size,
    		do_resize,
    		popup_starter,
    		mouseUp,
    		mouseDown,
    		popupMove
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('scale_size_array' in $$props) $$invalidate(5, scale_size_array = $$props.scale_size_array);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('SCROLL_WIDTH' in $$props) SCROLL_WIDTH = $$props.SCROLL_WIDTH;
    		if ('Z_BOTTOM' in $$props) Z_BOTTOM = $$props.Z_BOTTOM;
    		if ('offset' in $$props) offset = $$props.offset;
    		if ('original_width' in $$props) original_width = $$props.original_width;
    		if ('original_height' in $$props) original_height = $$props.original_height;
    		if ('original_x' in $$props) original_x = $$props.original_x;
    		if ('original_y' in $$props) original_y = $$props.original_y;
    		if ('scale_current_size' in $$props) scale_current_size = $$props.scale_current_size;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		index,
    		handle_size,
    		mouseUp,
    		mouseDown,
    		scale_size_array,
    		slots,
    		$$scope
    	];
    }

    class FloatWindow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0, scale_size_array: 5, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FloatWindow",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
    			console.warn("<FloatWindow> was created without expected prop 'title'");
    		}

    		if (/*scale_size_array*/ ctx[5] === undefined && !('scale_size_array' in props)) {
    			console.warn("<FloatWindow> was created without expected prop 'scale_size_array'");
    		}
    	}

    	get title() {
    		throw new Error("<FloatWindow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<FloatWindow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale_size_array() {
    		throw new Error("<FloatWindow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale_size_array(value) {
    		throw new Error("<FloatWindow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<FloatWindow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<FloatWindow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function clonify(obj) {
        let o = JSON.parse(JSON.stringify(obj));
        return o
    }


    let thing_template = {
        "color": 'grey',
        "title" : "no content",
        "_tracking" : false,
        "dates" : {
            "created" : "never",
            "updated" : "never"
        },
        "subject" : "",
        "abstract" : "no content",
        "keys" : [  ],
        "media" : {
            "_x_link_counter" : "nowhere",
            "protocol" : "default",
            "poster" : "test",
            "source" : "test"
        },
        "components" : {
            "graphic" : [],
            "boxes" : []
        },
        "comments" : [],
        "score" : 1.0
    };


    function make_empty_thing() {
        return clonify(thing_template)
    }

    const app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template);



    function padd_other_things(count,other_things) {
        let n = count - other_things.length;
        while ( n > 0 ) {
            other_things.push(false);
            n--;
        }
    }



    function place_data(things,other_things,article_index,dstart) {
        let l = things.length;
        let lo = other_things.length;
        //
        let strt = (( dstart === undefined ) ? (article_index-1) : (dstart-1));
        //
        for ( let i = 0; i < l; i++ ) {
            if ( (strt + i) < lo ) {
                let oto = other_things[strt + i];
                if ( oto !== false ) {
                    oto.id = i+1;
                    things[i] = oto;
                } else {
                    let ceo = clonify(app_empty_object);
                    ceo.id = i+1;
                    things[i] = ceo;
                }
            } else {
                let ceo = clonify(app_empty_object);
                ceo.id = i+1;
                things[i] = ceo;
            }
        }
        return things
    }


    async function link_server_fetch(url, post_params, postData) {
        {
            if ( typeof window.personalization === 'function' )
                window.personalization(post_params);
        }
            return await postData(url, post_params)
    }


    //
    function unload_data(data) {
        let usable_data = data.map(datum => {
            datum.title = decodeURIComponent(datum.title);
            datum.abstract = decodeURIComponent(datum.abstract);
            datum.keys = datum.keys.map(key => {
                return(decodeURIComponent(key))
            });
            return datum
        });
        return usable_data
    }

    //
    function process_search_results(stindex,qstart,search_result,other_things) {
        //
        let article_index = 1;
        //
        if ( search_result ) {
            let data = search_result.data;
            if ( data ) {
                //
                data = unload_data(data);
                //
                let lo = search_result.count;
                if ( qstart === undefined ) {	// used the search button
                    if ( lo > data.length ) {
                        padd_other_things(lo,data);
                    }
                    return [1,lo,data]
                } else {
                    //
                    if ( lo > other_things.length ) {
                        padd_other_things(lo,other_things);
                    }
                    //
                    let n = data.length;
                    for ( let i = 0; i < n; i++ ) {
                        other_things[i + stindex] = data.shift();
                    }
                    // // 
                }
                //
                return [article_index,lo,other_things]
            }
        }
        //
        return [false,false,false]
    }

    function popup_size() {
        let smallest_w = 200;   // smallest and bigget willing to accomodate
        let biggest_w = 3000;

        let smallest_h = 600;
        let biggest_h = 1000;

        // bounded window width
        let w = Math.max(smallest_w,window.innerWidth);
        w = Math.min(biggest_w,w);

        // bounded window height
        let h = Math.max(smallest_h,window.innerHeight);
        h = Math.min(biggest_h,h);

        let p_range;
        let P;
        //	percentage h range 
        let h_p_max = 0.80;
        let h_p_min = 0.60;
        p_range = h_p_max - h_p_min;
        P = (biggest_h - h)/(biggest_h - smallest_h);
        //console.log("P h: " + P)
        let h_scale = P*(p_range) + h_p_min;

        //	percentage w range 
        let w_p_max = 0.96;
        let w_p_min = 0.20;
        p_range = w_p_max - w_p_min;
        P = (biggest_w - w)/(biggest_w - smallest_w);
        //console.log("P w: " + P)
        let w_scale = P*(p_range) + w_p_min;

        // Setting the current height & width 
        // to the elements 

        return { "w" : w_scale, "h" : h_scale }
    }

    /* ../common/Selections.svelte generated by Svelte v3.42.4 */
    const file$1 = "../common/Selections.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (17:2) {#each link_picks as thing (thing.id)}
    function create_each_block$1(key_1, ctx) {
    	let li;
    	let t0_value = /*thing*/ ctx[3].title + "";
    	let t0;
    	let t1;
    	let li_id_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(li, "id", li_id_value = "xy_" + /*thing*/ ctx[3].id);
    			attr_dev(li, "class", "element-poster");
    			add_location(li, file$1, 17, 2, 323);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*link_picks*/ 1 && t0_value !== (t0_value = /*thing*/ ctx[3].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*link_picks*/ 1 && li_id_value !== (li_id_value = "xy_" + /*thing*/ ctx[3].id)) {
    				attr_dev(li, "id", li_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(17:2) {#each link_picks as thing (thing.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*link_picks*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*thing*/ ctx[3].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file$1, 15, 1, 275);
    			attr_dev(div, "class", "blg-el-wrapper-full svelte-giy3dc");
    			add_location(div, file$1, 14, 0, 240);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*link_picks*/ 1) {
    				each_value = /*link_picks*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Selections', slots, []);
    	let { link_picks } = $$props;
    	let count_value;

    	const unsubscribe = picker.subscribe(value => {
    		count_value = value;
    		$$invalidate(0, link_picks = link_picker.get_pick_values());
    	});

    	const writable_props = ['link_picks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Selections> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('link_picks' in $$props) $$invalidate(0, link_picks = $$props.link_picks);
    	};

    	$$self.$capture_state = () => ({
    		link_picker,
    		picker,
    		link_picks,
    		count_value,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ('link_picks' in $$props) $$invalidate(0, link_picks = $$props.link_picks);
    		if ('count_value' in $$props) count_value = $$props.count_value;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [link_picks];
    }

    class Selections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { link_picks: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Selections",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*link_picks*/ ctx[0] === undefined && !('link_picks' in props)) {
    			console.warn("<Selections> was created without expected prop 'link_picks'");
    		}
    	}

    	get link_picks() {
    		throw new Error("<Selections>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link_picks(value) {
    		throw new Error("<Selections>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // ----
    let g_search_table = {};
    let g_when_table = {};
    let g_all_keys = [];

    let g_prune_timeout = null;

    const TIMEOUT_THRESHHOLD = 4*60*60;

    // got this from somewhere
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }


    function gen_unique_id() {
        let ky = uuidv4();
        while ( g_all_keys.indexOf(ky) >= 0 ) ky = uuidv4();
        return ky
    } 

    function prune_old_keys() {
        //
        let deleters = [];
        let tcheck = Date.now();
        for ( let ky in g_search_table ) {
            let was_when = g_when_table[ky];
            if ( (tcheck - was_when) > TIMEOUT_THRESHHOLD ) {
                deleters.push(ky);
            }
        }
        deleters.forEach((ky) => {
            delete g_when_table[ky];
            delete g_search_table[ky];
        });

        deleters = [];  // push it along
    }


    function add_search(key) {
        if ( g_all_keys.length >= 200 ) {
            if ( g_prune_timeout === null ) {
                g_prune_timeout = setTimeout(prune_old_keys,60000*10);
            }
        }
        let uid = gen_unique_id();
        g_search_table[key] = uid; // writes over old seaches
        g_when_table[key] = Date.now();
        g_all_keys = Object.keys(g_search_table);
        return(uid)
    }


    function get_search(key,add_if_new = false) {

        if ( key in g_search_table ) {
            return(g_search_table[key])
        }
        if ( add_if_new ) {
            return(add_search(key))
        }
    }

    /* src/App.svelte generated by Svelte v3.42.4 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	return child_ctx;
    }

    // (284:4) {#each qlist_ordering as ordering}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*ordering*/ ctx[42].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*ordering*/ ctx[42];
    			option.value = option.__value;
    			add_location(option, file, 284, 5, 7229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(284:4) {#each qlist_ordering as ordering}",
    		ctx
    	});

    	return block;
    }

    // (293:2) {#if going_session }
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "add entry";
    			add_location(button, file, 293, 42, 7476);
    			attr_dev(div, "class", "sel-titles blg-ctl-button svelte-aq6usa");
    			add_location(div, file, 293, 2, 7436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*present_assest_editing*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(293:2) {#if going_session }",
    		ctx
    	});

    	return block;
    }

    // (308:0) <FloatWindow title={current_thing.title.substr(0,g_max_title_chars) + '...'}  index={0} scale_size_array={all_window_scales[0]} >
    function create_default_slot_1(ctx) {
    	let fullthing;
    	let current;
    	const fullthing_spread_levels = [/*current_thing*/ ctx[5]];
    	let fullthing_props = {};

    	for (let i = 0; i < fullthing_spread_levels.length; i += 1) {
    		fullthing_props = assign(fullthing_props, fullthing_spread_levels[i]);
    	}

    	fullthing = new ThingFull({ props: fullthing_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fullthing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fullthing, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fullthing_changes = (dirty[0] & /*current_thing*/ 32)
    			? get_spread_update(fullthing_spread_levels, [get_spread_object(/*current_thing*/ ctx[5])])
    			: {};

    			fullthing.$set(fullthing_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fullthing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fullthing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fullthing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(308:0) <FloatWindow title={current_thing.title.substr(0,g_max_title_chars) + '...'}  index={0} scale_size_array={all_window_scales[0]} >",
    		ctx
    	});

    	return block;
    }

    // (313:0) <FloatWindow title="Selection List"  index={1} scale_size_array={all_window_scales[1]} >
    function create_default_slot(ctx) {
    	let selections;
    	let current;

    	selections = new Selections({
    			props: { link_picks: /*all_link_picks*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(selections.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selections, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selections_changes = {};
    			if (dirty[0] & /*all_link_picks*/ 1) selections_changes.link_picks = /*all_link_picks*/ ctx[0];
    			selections.$set(selections_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selections.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selections.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selections, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(313:0) <FloatWindow title=\\\"Selection List\\\"  index={1} scale_size_array={all_window_scales[1]} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div11;
    	let div5;
    	let div0;
    	let span;
    	let t1;
    	let input0;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let div2;
    	let button2;
    	let t8;
    	let div1;
    	let t9;
    	let input1;
    	let t10;
    	let div3;
    	let button3;
    	let t12;
    	let input2;
    	let t13;
    	let button4;
    	let t15;
    	let input3;
    	let t16;
    	let t17;
    	let t18;
    	let div4;
    	let select;
    	let t19;
    	let div9;
    	let t20;
    	let div6;
    	let t21;
    	let t22;
    	let div7;
    	let t23;
    	let t24;
    	let t25;
    	let div8;
    	let button5;
    	let t27;
    	let div10;
    	let thinggrid;
    	let t28;
    	let floatwindow0;
    	let t29;
    	let floatwindow1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*qlist_ordering*/ ctx[11];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*going_session*/ ctx[10] && create_if_block(ctx);

    	thinggrid = new ThingGrid({
    			props: {
    				things: /*things*/ ctx[6],
    				thing_component: Thing
    			},
    			$$inline: true
    		});

    	thinggrid.$on("message", /*handleMessage*/ ctx[15]);

    	floatwindow0 = new FloatWindow({
    			props: {
    				title: /*current_thing*/ ctx[5].title.substr(0, /*g_max_title_chars*/ ctx[12]) + '...',
    				index: 0,
    				scale_size_array: /*all_window_scales*/ ctx[13][0],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	floatwindow1 = new FloatWindow({
    			props: {
    				title: "Selection List",
    				index: 1,
    				scale_size_array: /*all_window_scales*/ ctx[13][1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Boxes";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "-";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			t6 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = "search";
    			t8 = space();
    			div1 = element("div");
    			t9 = text(" ");
    			input1 = element("input");
    			t10 = space();
    			div3 = element("div");
    			button3 = element("button");
    			button3.textContent = "≤";
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			button4 = element("button");
    			button4.textContent = "≥";
    			t15 = space();
    			input3 = element("input");
    			t16 = text("\n\t\t\tof ");
    			t17 = text(/*article_count*/ ctx[7]);
    			t18 = space();
    			div4 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			div9 = element("div");
    			if (if_block) if_block.c();
    			t20 = space();
    			div6 = element("div");
    			t21 = text("Title: ");
    			t22 = text(/*current_roller_title*/ ctx[3]);
    			div7 = element("div");
    			t23 = text("Subject: ");
    			t24 = text(/*current_roller_subject*/ ctx[4]);
    			t25 = space();
    			div8 = element("div");
    			button5 = element("button");
    			button5.textContent = "show selections";
    			t27 = space();
    			div10 = element("div");
    			create_component(thinggrid.$$.fragment);
    			t28 = space();
    			create_component(floatwindow0.$$.fragment);
    			t29 = space();
    			create_component(floatwindow1.$$.fragment);
    			set_style(span, "color", "navy");
    			set_style(span, "font-weight", "bold");
    			add_location(span, file, 254, 3, 5846);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "blg-ctl-number-field svelte-aq6usa");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "max", "4");
    			add_location(input0, file, 255, 3, 5904);
    			attr_dev(button0, "class", "blg-ctl-button svelte-aq6usa");
    			add_location(button0, file, 257, 3, 5992);
    			attr_dev(button1, "class", "blg-ctl-button svelte-aq6usa");
    			add_location(button1, file, 261, 3, 6077);
    			attr_dev(div0, "class", "blg-ctrl-panel svelte-aq6usa");
    			set_style(div0, "display", "inline-block");
    			set_style(div0, "vertical-align", "bottom");
    			set_style(div0, "background-color", "#EFFFFE");
    			add_location(div0, file, 253, 2, 5737);
    			add_location(button2, file, 266, 3, 6276);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 270, 9, 6386);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file, 269, 3, 6341);
    			attr_dev(div2, "class", "blg-ctrl-panel svelte-aq6usa");
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "vertical-align", "bottom");
    			set_style(div2, "background-color", "#EFEFFE");
    			add_location(div2, file, 265, 2, 6167);
    			attr_dev(button3, "class", "blg-ctl-button svelte-aq6usa");
    			add_location(button3, file, 275, 3, 6572);
    			attr_dev(input2, "class", "blg-ctl-slider svelte-aq6usa");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "1");
    			attr_dev(input2, "max", /*article_count*/ ctx[7]);
    			add_location(input2, file, 276, 3, 6649);
    			attr_dev(button4, "class", "blg-ctl-button svelte-aq6usa");
    			add_location(button4, file, 277, 3, 6781);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "blg-ctl-number-field svelte-aq6usa");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "max", /*article_count*/ ctx[7]);
    			add_location(input3, file, 278, 3, 6857);
    			attr_dev(div3, "class", "blg-ctrl-panel svelte-aq6usa");
    			set_style(div3, "display", "inline-block");
    			set_style(div3, "background-color", "#FFFFFA");
    			add_location(div3, file, 273, 2, 6481);
    			if (/*search_ordering*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[30].call(select));
    			add_location(select, file, 282, 3, 7113);
    			attr_dev(div4, "class", "blg-ctrl-panel svelte-aq6usa");
    			set_style(div4, "display", "inline-block");
    			set_style(div4, "background-color", "#FFFFFA");
    			add_location(div4, file, 281, 2, 7026);
    			set_style(div5, "border", "solid 2px navy");
    			set_style(div5, "padding", "4px");
    			set_style(div5, "background-color", "#EFEFEF");
    			add_location(div5, file, 252, 1, 5659);
    			attr_dev(div6, "class", "sel-titles svelte-aq6usa");
    			add_location(div6, file, 295, 2, 7553);
    			attr_dev(div7, "class", "sel-titles svelte-aq6usa");
    			add_location(div7, file, 295, 62, 7613);
    			add_location(button5, file, 296, 46, 7723);
    			attr_dev(div8, "class", "sel-titles svelte-aq6usa");
    			set_style(div8, "width", "15%");
    			add_location(div8, file, 296, 2, 7679);
    			set_style(div9, "border", "solid 1px grey");
    			set_style(div9, "padding", "4px");
    			set_style(div9, "background-color", "#F5F6EF");
    			add_location(div9, file, 291, 1, 7335);
    			attr_dev(div10, "class", "blg-grid-container svelte-aq6usa");
    			add_location(div10, file, 299, 1, 7803);
    			add_location(div11, file, 250, 0, 5651);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div5);
    			append_dev(div5, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*box_delta*/ ctx[9]);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			append_dev(div2, button2);
    			append_dev(div2, t8);
    			append_dev(div2, div1);
    			append_dev(div1, t9);
    			append_dev(div1, input1);
    			set_input_value(input1, /*search_topic*/ ctx[2]);
    			append_dev(div5, t10);
    			append_dev(div5, div3);
    			append_dev(div3, button3);
    			append_dev(div3, t12);
    			append_dev(div3, input2);
    			set_input_value(input2, /*article_index*/ ctx[8]);
    			append_dev(div3, t13);
    			append_dev(div3, button4);
    			append_dev(div3, t15);
    			append_dev(div3, input3);
    			set_input_value(input3, /*article_index*/ ctx[8]);
    			append_dev(div3, t16);
    			append_dev(div3, t17);
    			append_dev(div5, t18);
    			append_dev(div5, div4);
    			append_dev(div4, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*search_ordering*/ ctx[1]);
    			append_dev(div11, t19);
    			append_dev(div11, div9);
    			if (if_block) if_block.m(div9, null);
    			append_dev(div9, t20);
    			append_dev(div9, div6);
    			append_dev(div6, t21);
    			append_dev(div6, t22);
    			append_dev(div9, div7);
    			append_dev(div7, t23);
    			append_dev(div7, t24);
    			append_dev(div9, t25);
    			append_dev(div9, div8);
    			append_dev(div8, button5);
    			append_dev(div11, t27);
    			append_dev(div11, div10);
    			mount_component(thinggrid, div10, null);
    			insert_dev(target, t28, anchor);
    			mount_component(floatwindow0, target, anchor);
    			insert_dev(target, t29, anchor);
    			mount_component(floatwindow1, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[26]),
    					listen_dev(button0, "click", /*handleClick_remove*/ ctx[16], false, false, false),
    					listen_dev(button1, "click", /*handleClick_add*/ ctx[17], false, false, false),
    					listen_dev(button2, "click", /*handleClick_fetch*/ ctx[23], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[27]),
    					listen_dev(input1, "keypress", /*handle_keyDown*/ ctx[21], false, false, false),
    					listen_dev(button3, "click", /*handleClick_first*/ ctx[19], false, false, false),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[28]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[28]),
    					listen_dev(input2, "change", /*handle_index_changed*/ ctx[18], false, false, false),
    					listen_dev(button4, "click", /*handleClick_last*/ ctx[20], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[29]),
    					listen_dev(input3, "change", /*handle_index_changed*/ ctx[18], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[30]),
    					listen_dev(select, "change", /*handle_order_change*/ ctx[22], false, false, false),
    					listen_dev(button5, "click", /*pop_up_selections*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*box_delta*/ 512 && to_number(input0.value) !== /*box_delta*/ ctx[9]) {
    				set_input_value(input0, /*box_delta*/ ctx[9]);
    			}

    			if (dirty[0] & /*search_topic*/ 4 && input1.value !== /*search_topic*/ ctx[2]) {
    				set_input_value(input1, /*search_topic*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*article_count*/ 128) {
    				attr_dev(input2, "max", /*article_count*/ ctx[7]);
    			}

    			if (dirty[0] & /*article_index*/ 256) {
    				set_input_value(input2, /*article_index*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*article_count*/ 128) {
    				attr_dev(input3, "max", /*article_count*/ ctx[7]);
    			}

    			if (dirty[0] & /*article_index*/ 256 && to_number(input3.value) !== /*article_index*/ ctx[8]) {
    				set_input_value(input3, /*article_index*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*article_count*/ 128) set_data_dev(t17, /*article_count*/ ctx[7]);

    			if (dirty[0] & /*qlist_ordering*/ 2048) {
    				each_value = /*qlist_ordering*/ ctx[11];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*search_ordering, qlist_ordering*/ 2050) {
    				select_option(select, /*search_ordering*/ ctx[1]);
    			}

    			if (/*going_session*/ ctx[10]) if_block.p(ctx, dirty);
    			if (!current || dirty[0] & /*current_roller_title*/ 8) set_data_dev(t22, /*current_roller_title*/ ctx[3]);
    			if (!current || dirty[0] & /*current_roller_subject*/ 16) set_data_dev(t24, /*current_roller_subject*/ ctx[4]);
    			const thinggrid_changes = {};
    			if (dirty[0] & /*things*/ 64) thinggrid_changes.things = /*things*/ ctx[6];
    			thinggrid.$set(thinggrid_changes);
    			const floatwindow0_changes = {};
    			if (dirty[0] & /*current_thing*/ 32) floatwindow0_changes.title = /*current_thing*/ ctx[5].title.substr(0, /*g_max_title_chars*/ ctx[12]) + '...';

    			if (dirty[0] & /*current_thing*/ 32 | dirty[1] & /*$$scope*/ 16384) {
    				floatwindow0_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow0.$set(floatwindow0_changes);
    			const floatwindow1_changes = {};

    			if (dirty[0] & /*all_link_picks*/ 1 | dirty[1] & /*$$scope*/ 16384) {
    				floatwindow1_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow1.$set(floatwindow1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thinggrid.$$.fragment, local);
    			transition_in(floatwindow0.$$.fragment, local);
    			transition_in(floatwindow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thinggrid.$$.fragment, local);
    			transition_out(floatwindow0.$$.fragment, local);
    			transition_out(floatwindow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			destroy_component(thinggrid);
    			if (detaching) detach_dev(t28);
    			destroy_component(floatwindow0, detaching);
    			if (detaching) detach_dev(t29);
    			destroy_component(floatwindow1, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const appsearch = 'search'; //   search later translated to songsearch (nginx conf by url)

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let session = "";
    	let going_session = "";

    	let qlist_ordering = [
    		{ id: 1, text: `update_date` },
    		{ id: 2, text: `score` },
    		{ id: 3, text: `create_date` }
    	];

    	let all_link_picks = [];
    	let search_ordering = qlist_ordering[2];
    	let search_topic = 'any';
    	let g_max_title_chars = 20;

    	//
    	let current_roller_title = "";

    	let current_roller_subject = "";
    	let thing_template = make_empty_thing();
    	let current_thing = Object.assign({ "id": 0, "entry": 0 }, thing_template);
    	let app_empty_object = Object.assign({ "id": 1, "entry": -1 }, thing_template);

    	//
    	let window_scale = { "w": 0.4, "h": 0.6 };

    	//
    	window_scale = popup_size();

    	let all_window_scales = [];
    	all_window_scales.push(window_scale);
    	all_window_scales.push(window_scale);

    	//
    	onMount(() => {
    		session = window.retrieve_session();

    		window.addEventListener("resize", e => {
    			//
    			let scale = popup_size();

    			//
    			window_scale.h = scale.h;

    			window_scale.w = scale.w;
    		}); //
    	});

    	function present_assest_editing() {
    		if (going_session && typeof window.launch_comment_editor === "function") {
    			window.launch_asset_editor(going_session);
    		}
    	}

    	function handleMessage(event) {
    		let key = "xy_";
    		let txt = event.detail.text;
    		let idx = txt.substr(txt.indexOf(key) + 3);
    		let etype = event.detail.type;
    		idx = parseInt(idx);
    		idx--;

    		if (idx !== undefined && idx >= 0 && idx < things.length) {
    			let athing = things[idx];

    			if (athing !== undefined) {
    				if (etype === 'click') {
    					$$invalidate(5, current_thing = athing);
    					start_floating_window(0);
    				} else {
    					$$invalidate(3, current_roller_title = athing.title);
    					$$invalidate(4, current_roller_subject = athing.subject);
    				}
    			}
    		}
    	}

    	function clickEmptyElement(thing_counter) {
    		let elem = clonify(app_empty_object);
    		elem.id = thing_counter;
    		return elem;
    	}

    	let things = [
    		// window
    		app_empty_object
    	];

    	let other_things = []; // current data...		loaded from server 
    	let article_count = 1;
    	let article_index = 1;
    	let box_delta = 1; // how boxes to add when increasing the window

    	function needs_data(start, end) {
    		if (other_things.length > 0) {
    			for (let i = start; i < end; i++) {
    				if (other_things[i] === false) {
    					return true;
    				}
    			}
    		}

    		return false;
    	}

    	function do_data_placement() {
    		let end = article_index + things.length;
    		let start = article_index - 1;

    		if (needs_data(start, end)) {
    			data_fetcher(start, things.length);
    		} else {
    			place_data(things, other_things, article_index);
    		}
    	}

    	function handleClick_remove() {
    		for (let i = 0; i < box_delta; i++) {
    			let p = things;
    			p.pop();
    			$$invalidate(6, things = [...p]);
    		}
    	}

    	// ---- ---- ---- ---- ---- ---- ----
    	async function handleClick_add() {
    		let start = things.length;

    		for (let i = 0; i < box_delta; i++) {
    			let thing_counter = things.length;
    			thing_counter++;
    			let additional = clickEmptyElement(thing_counter);
    			$$invalidate(6, things = [...things, additional]);
    		}

    		//
    		let end = things.length; /// start + box_delta

    		if (needs_data(start, end)) {
    			data_fetcher(start, things.length);
    		} else {
    			$$invalidate(6, things = place_data(things, other_things, article_index));
    		}
    	}

    	//
    	function handle_index_changed() {
    		do_data_placement();
    	}

    	function handleClick_first() {
    		$$invalidate(8, article_index = 1);
    		do_data_placement();
    	}

    	function handleClick_last() {
    		$$invalidate(8, article_index = article_count);
    		do_data_placement();
    	}

    	function handle_keyDown(ev) {
    		if (ev.charCode == 13) {
    			$$invalidate(8, article_index = 1);
    			data_fetcher();
    		}
    	}

    	function handle_order_change(ev) {
    		$$invalidate(8, article_index = 1);
    		data_fetcher();
    	}

    	function handleClick_fetch(ev) {
    		$$invalidate(8, article_index = 1);
    		data_fetcher();
    	}

    	async function data_fetcher(qstart, alt_length) {
    		let l = alt_length === undefined ? things.length : alt_length;
    		let stindex = qstart === undefined ? article_index - 1 : qstart;
    		let qry = encodeURIComponent(search_topic);
    		qry += '|' + search_ordering.text;

    		//
    		//console.log(search_ordering.text)
    		//
    		let uid = get_search(qry, true);

    		//
    		stindex = Math.max(0, stindex);

    		let post_params = {
    			uid,
    			"query": qry,
    			"box_count": l,
    			"offset": stindex
    		};

    		try {
    			let rest = `${post_params.uid}/${post_params.query}/${post_params.box_count}/${post_params.offset}`;
    			let srver = location.host;
    			let prot = location.protocol;
    			let sp = '//';
    			let search_result = await link_server_fetch(`${prot}${sp}${srver}/${data_stem}/${rest}`, post_params, postData);
    			let [a_i, lo, ot] = process_search_results(stindex, qstart, search_result, other_things);
    			$$invalidate(8, article_index = a_i);
    			$$invalidate(7, article_count = lo);
    			other_things = ot;

    			if (other_things !== false) {
    				$$invalidate(6, things = place_data(things, other_things, article_index));
    			}
    		} catch(e) {
    			alert(e.message);
    		}
    	}

    	let count_value;

    	const unsubscribe = picker.subscribe(value => {
    		count_value = value;
    		link_picker.map_picks(things);
    	});

    	function pop_up_selections(ev) {
    		$$invalidate(0, all_link_picks = link_picker.get_pick_values());
    		start_floating_window(1);
    	}

    	const writable_props = ['name'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		box_delta = to_number(this.value);
    		$$invalidate(9, box_delta);
    	}

    	function input1_input_handler() {
    		search_topic = this.value;
    		$$invalidate(2, search_topic);
    	}

    	function input2_change_input_handler() {
    		article_index = to_number(this.value);
    		$$invalidate(8, article_index);
    	}

    	function input3_input_handler() {
    		article_index = to_number(this.value);
    		$$invalidate(8, article_index);
    	}

    	function select_change_handler() {
    		search_ordering = select_value(this);
    		$$invalidate(1, search_ordering);
    		$$invalidate(11, qlist_ordering);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(25, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		FullThing: ThingFull,
    		Thing,
    		ThingGrid,
    		FloatWindow,
    		process_search_results,
    		place_data,
    		clonify,
    		make_empty_thing,
    		link_server_fetch,
    		popup_size,
    		Selections,
    		link_picker,
    		picker,
    		get_search,
    		onMount,
    		session,
    		going_session,
    		appsearch,
    		qlist_ordering,
    		all_link_picks,
    		search_ordering,
    		search_topic,
    		g_max_title_chars,
    		current_roller_title,
    		current_roller_subject,
    		thing_template,
    		current_thing,
    		app_empty_object,
    		window_scale,
    		all_window_scales,
    		present_assest_editing,
    		handleMessage,
    		clickEmptyElement,
    		things,
    		other_things,
    		article_count,
    		article_index,
    		box_delta,
    		needs_data,
    		do_data_placement,
    		handleClick_remove,
    		handleClick_add,
    		handle_index_changed,
    		handleClick_first,
    		handleClick_last,
    		handle_keyDown,
    		handle_order_change,
    		handleClick_fetch,
    		data_fetcher,
    		count_value,
    		unsubscribe,
    		pop_up_selections
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(25, name = $$props.name);
    		if ('session' in $$props) session = $$props.session;
    		if ('going_session' in $$props) $$invalidate(10, going_session = $$props.going_session);
    		if ('qlist_ordering' in $$props) $$invalidate(11, qlist_ordering = $$props.qlist_ordering);
    		if ('all_link_picks' in $$props) $$invalidate(0, all_link_picks = $$props.all_link_picks);
    		if ('search_ordering' in $$props) $$invalidate(1, search_ordering = $$props.search_ordering);
    		if ('search_topic' in $$props) $$invalidate(2, search_topic = $$props.search_topic);
    		if ('g_max_title_chars' in $$props) $$invalidate(12, g_max_title_chars = $$props.g_max_title_chars);
    		if ('current_roller_title' in $$props) $$invalidate(3, current_roller_title = $$props.current_roller_title);
    		if ('current_roller_subject' in $$props) $$invalidate(4, current_roller_subject = $$props.current_roller_subject);
    		if ('thing_template' in $$props) thing_template = $$props.thing_template;
    		if ('current_thing' in $$props) $$invalidate(5, current_thing = $$props.current_thing);
    		if ('app_empty_object' in $$props) app_empty_object = $$props.app_empty_object;
    		if ('window_scale' in $$props) window_scale = $$props.window_scale;
    		if ('all_window_scales' in $$props) $$invalidate(13, all_window_scales = $$props.all_window_scales);
    		if ('things' in $$props) $$invalidate(6, things = $$props.things);
    		if ('other_things' in $$props) other_things = $$props.other_things;
    		if ('article_count' in $$props) $$invalidate(7, article_count = $$props.article_count);
    		if ('article_index' in $$props) $$invalidate(8, article_index = $$props.article_index);
    		if ('box_delta' in $$props) $$invalidate(9, box_delta = $$props.box_delta);
    		if ('count_value' in $$props) count_value = $$props.count_value;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		all_link_picks,
    		search_ordering,
    		search_topic,
    		current_roller_title,
    		current_roller_subject,
    		current_thing,
    		things,
    		article_count,
    		article_index,
    		box_delta,
    		going_session,
    		qlist_ordering,
    		g_max_title_chars,
    		all_window_scales,
    		present_assest_editing,
    		handleMessage,
    		handleClick_remove,
    		handleClick_add,
    		handle_index_changed,
    		handleClick_first,
    		handleClick_last,
    		handle_keyDown,
    		handle_order_change,
    		handleClick_fetch,
    		pop_up_selections,
    		name,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_input_handler,
    		input3_input_handler,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 25 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[25] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.getElementById('app-main'),
    	props: {
    		name: 'My Blog With Grid'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
