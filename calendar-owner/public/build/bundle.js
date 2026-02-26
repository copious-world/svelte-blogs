
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$3() { }
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
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
            update: noop$3,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
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
            this.$destroy = noop$3;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
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

    function i(e){let t=e.getTime(),n=new Date(t+864e5);return new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime()}function f(e,t,n,r){let u=r.getFullYear(),a=r.getMonth(),g=r.getDate();return u===t&&(a===n&&g===e.day)}function D(e,t,n,r){let u=r.getFullYear(),a=r.getMonth(),g=r.getDate(),i=new Date(u,a,g).getTime();return new Date(t,n,e).getTime()<i}function M(e){let t=e.getMonth(),n=e.getFullYear();return new Date(n,t).getTime()}function T(e){let t=e.getMonth(),n=e.getFullYear();return t=(t+1)%12,0===t&&n++,new Date(n,t).getTime()}function F$1(e,t){let n=e.getMonth(),r=e.getFullYear();if(0!==t){let e=n+t;if(t>0)if(e>12){r+=Math.trunc((e-12)/12)+1,n=e%12;}else n=e;else if(e<0){n=e%12+12,r+=Math.trunc((t-n)/12);}else n=e;}return new Date(r,n).getTime()}

    const PITCH_MATCH_EPSILON = 0.000005;

    let local_clock_date = new Date();   // UTC time
    let when_is_midnight = (i(local_clock_date) - local_clock_date.getTime());



    setTimeout(() => {
        local_clock_date = new Date();
        when_is_midnight = (i(local_clock_date) - local_clock_date.getTime());
    }, when_is_midnight);



    function day_is_today(a_day,year,month) {
        return f(a_day,year,month,local_clock_date)
    }

    function day_is_today_timezone(a_day,year,month,timezone) {
        let str = local_clock_date.toLocaleDateString('en-US', {
            timeZone: timezone,
          });
        let pmn_date = new Date(str);
        return f(a_day,year,month,pmn_date)
    }


    // current_day == a_day.day
    function tz_day_is_today(a_day,year,month,local_date_string,time_zone) {
        //
        let tz_date_parts = local_date_string.split('/');
        let tz_day = parseInt(tz_date_parts[1]);
        let dday = a_day.day;

        if ( tz_day === dday ) {
            if ( day_is_today(a_day,year,month) ) {
                return true
            } else {
                return day_is_today_timezone(a_day,year,month,time_zone)
            }
        }
        return false
    }



    function day_is_before_today(a_day,year,month) {
        return D(a_day,year,month,local_clock_date)
    }


    // getTimezoneOffset

    function getTimezoneOffset(tz,st){
        let date = new Date(st);
        date = new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),0,0);
        //
        let dstr = date.toLocaleString('en-us',{hour12 : false});
        let dt_dat = dstr.split(',');
        let [mo,day,year] = dt_dat[0].trim().split('/').map(istr => parseInt(istr));  //en-us
        let [hr,min,secs] = dt_dat[1].trim().split(':').map(istr => parseInt(istr));

        let offset = 0;

        let tz_dstr = date.toLocaleString('en-us',{timeZone : tz, hour12 : false});
    //console.log(tz_dstr)
        let tz_dt_dat = tz_dstr.split(',');
        let [tz_mo,tz_day,tz_year] = tz_dt_dat[0].trim().split('/').map(istr => parseInt(istr));  //en-us
        let [tz_hr,tz_min,tz_secs] = tz_dt_dat[1].trim().split(':').map(istr => parseInt(istr)); 

        //console.log(tz_mo,tz_day,tz_year,tz_hr,tz)
        if ( (year > tz_year) || (mo > tz_mo)|| (day > tz_day) ) {
            offset = (tz_hr - hr) - 24;
        } else {
            offset = (tz_hr + (( hr === 23 ) ? 1 : 0)) % 24;
        }
        //
        //console.log("timezone offset", offset, '-', tz_hr, hr)

        // return UTC offset in millis
        return offset;
    }


    // calculate endpoint

    function rect_to_time_slot(found_rect,pitch) {
        //
        let disp_offset = found_rect.unit_x;
        let disp_end = found_rect.unit_width + disp_offset;
        if ( disp_offset % pitch === 0 ) {
            disp_offset += PITCH_MATCH_EPSILON;
        }
        if ( disp_end % pitch === 0 ) {
            disp_end += PITCH_MATCH_EPSILON;
        }
        //
        let mo_start = Math.trunc(disp_offset/pitch);
        let mo_end = Math.trunc(disp_end/pitch);
        //
        let cday = new Date();
        let d1 = F$1(cday,mo_start);
        let d2 = F$1(cday,mo_end);
        //
        let mo_of_d1 = new Date(d1);
        let mo_of_d2 = new Date(d2);

        let n_d1 = T(mo_of_d1);
        let n_d2 = T(mo_of_d2);

        // start
        let partial_mo = (disp_offset % pitch)/pitch;
        let t1_partial = (n_d1 - d1)*partial_mo;
        d1 += t1_partial;
        // end
        partial_mo = (disp_end % pitch)/pitch;
        let t2_partial = (n_d2 - d2)*partial_mo;
        d2 += t2_partial;
        //
        let mody_of_d1 = new Date(d1);
        let mody_of_d2 = new Date(d2);
        //
        return [mody_of_d1,mody_of_d2]
    }



    function time_slot_to_rect(date1,date2,pitch) {
        //
        let ts_start = date1.getTime();
        let ts_end = date2.getTime();
        //
        let mo1_d1 = M(date1);
        let mo2_d1 = M(date2);

        let mo1_nxt_d1 = T(date1);
        let mo2_nxt_d1 = T(date2);

        let mo1_time = (mo1_nxt_d1 - mo1_d1);
        let mo2_time = (mo2_nxt_d1 - mo2_d1);
        //
        let part1 = (ts_start - mo1_d1)/mo1_time;
        let part2 = (ts_end - mo2_d1)/mo2_time;

        let last_mo_partail_1 = part1*pitch;
        let last_mo_partail_2 = part2*pitch;

        let cur_time = new Date();
        let start_time = M(cur_time);

        let mo_time = start_time;
        let save_x = 0;
        while ( mo_time < ts_start ) {
            let dmo = new Date(mo_time);
            mo_time = T(dmo);
            save_x += pitch;
        }

        let rect_start = save_x + last_mo_partail_1 - pitch;

        mo_time = start_time;
        save_x = 0;
        while ( mo_time < ts_end ) {
            let dmo = new Date(mo_time);
            mo_time = T(dmo);
            save_x += pitch;
        }

        let rect_end =  save_x + last_mo_partail_2;
        let rect_width = rect_end - rect_start - pitch;

        return [ rect_start, rect_width  ]
    }

    const ONE_MINUTE = (60*1000);

    function bin_search_nearest(v,list) {
        let n = list.length;
        let i = 0;
        let j = n-1;
        while ( i < j ) {
            let lb = list[i];
            let ub = list[j];
            if ( v === lb ) return [v,v]
            if ( v === ub ) return [v,v]
            let k = i + Math.trunc((j-i)/2);
            if ( k === i ) return [lb,ub]
            let tst = list[k];
            if ( tst === v ) return [v,v]
            if ( v > tst ) {
                i = k;
            } else {
                j = k;
            }
        }

        let lb = list[i];
        let ub = list[j];
        return [lb,ub]
    }


    class tsDB {
        constructor() {
            this._all_events = {};
            this._time_stamp_keys = [];
        }

        // ---- ev_obj
        add(ev_obj) {
            if ( ev_obj.begin_at ) {
                let beg = parseInt(ev_obj.begin_at);
                this._all_events[beg] = Object.assign({},ev_obj);
                this._time_stamp_keys = Object.keys(this._all_events);
                this._time_stamp_keys = this._time_stamp_keys.map(k => parseInt(k));
                this._time_stamp_keys.sort();  
            }
        }

        remove(ev_obj) {
            if ( ev_obj.begin_at ) {
                delete this._all_events[ev_obj.begin_at];
                this._time_stamp_keys = Object.keys(this._all_events);
                this._time_stamp_keys = this._time_stamp_keys.map(k => parseInt(k));
                this._time_stamp_keys.sort();  
            }
        }

        find_event(time_stamp) {
            let ev = this._all_events[time_stamp];
            if ( ev ) return(ev)
            //
            let [l,u] = bin_search_nearest(time_stamp,this._time_stamp_keys);
            ev = this._all_events[l];
            if ( !(ev) ) {
                ev = this._all_events[u];
            }
            //
            if ( ev ) {
                if (  (time_stamp >= ev.begin_at) && (time_stamp < (ev.begin_at + ev.how_long*ONE_MINUTE)) ) {
                    return ev
                }
            }
            //
            return false
        }

        event_in_bucket(start_time,end_time,ev_obj) {
            if ( (this._time_stamp_keys.length > 0) && start_time && end_time ) {
                let st = Math.max(this._time_stamp_keys[0],start_time);
                let et = Math.min(this._time_stamp_keys[this._time_stamp_keys.length -1],end_time);
                let find_time = ev_obj.begin_at;
                if ( (find_time >= st) && (find_time <= et) && (st <= et)) {
                    let bi = this._time_stamp_keys.indexOf(find_time);
                    if ( bi >= 0 ) return true
                }
            }
            return false
        }

        range_has_events(start_time,end_time,chck_use) {
            if ( typeof chck_use !== 'function' ) return false
            if ( start_time < end_time ) {
                for ( let ts of this._time_stamp_keys ) {
                    if ( ts >= start_time && ts <= end_time ) {
                        if ( chck_use(this._all_events[ts]) ) return true
                    }
                    if ( ts > end_time ) break
                }
            }
            return false
        }

    }


    let timestamp_db = new tsDB();

    /* src/MonthFull.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1$3, console: console_1$1 } = globals;

    const file$b = "src/MonthFull.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    // (162:7) {:else}
    function create_else_block_1$3(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "-";
    			attr_dev(li, "class", "exclude-day svelte-eakgiw");
    			add_location(li, file$b, 162, 8, 4256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$3.name,
    		type: "else",
    		source: "(162:7) {:else}",
    		ctx
    	});

    	return block;
    }

    // (154:7) {#if a_day_key !== false }
    function create_if_block$6(ctx) {
    	let each_1_anchor;
    	let each_value_2 = [/*cal*/ ctx[3].map[/*a_day_key*/ ctx[32]]];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < 1; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cal, year, month, local_date_string, time_zone, event_management, day_includes_events*/ 493) {
    				each_value_2 = [/*cal*/ ctx[3].map[/*a_day_key*/ ctx[32]]];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < 1; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < 1; i += 1) {
    					each_blocks[i].d(1);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(154:7) {#if a_day_key !== false }",
    		ctx
    	});

    	return block;
    }

    // (158:9) {:else}
    function create_else_block$5(ctx) {
    	let li;
    	let t_value = /*a_day*/ ctx[35].day + "";
    	let t;
    	let li_style_value;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[17](/*a_day_key*/ ctx[32], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "event-access svelte-eakgiw");

    			attr_dev(li, "style", li_style_value = tz_day_is_today(/*a_day*/ ctx[35], /*year*/ ctx[2], /*month*/ ctx[0], /*local_date_string*/ ctx[6], /*time_zone*/ ctx[5])
    			? 'border:solid 2px lime'
    			: '');

    			add_location(li, file$b, 158, 9, 4003);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*cal*/ 8 && t_value !== (t_value = /*a_day*/ ctx[35].day + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*cal, year, month, local_date_string, time_zone*/ 109 && li_style_value !== (li_style_value = tz_day_is_today(/*a_day*/ ctx[35], /*year*/ ctx[2], /*month*/ ctx[0], /*local_date_string*/ ctx[6], /*time_zone*/ ctx[5])
    			? 'border:solid 2px lime'
    			: '')) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(158:9) {:else}",
    		ctx
    	});

    	return block;
    }

    // (156:9) {#if day_includes_events(a_day) }
    function create_if_block_1$4(ctx) {
    	let li;
    	let t_value = /*a_day*/ ctx[35].day + "";
    	let t;
    	let li_style_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[16](/*a_day_key*/ ctx[32], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "event-access-plus svelte-eakgiw");

    			attr_dev(li, "style", li_style_value = tz_day_is_today(/*a_day*/ ctx[35], /*year*/ ctx[2], /*month*/ ctx[0], /*local_date_string*/ ctx[6], /*time_zone*/ ctx[5])
    			? 'border:solid 2px lime'
    			: '');

    			add_location(li, file$b, 156, 9, 3773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*cal*/ 8 && t_value !== (t_value = /*a_day*/ ctx[35].day + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*cal, year, month, local_date_string, time_zone*/ 109 && li_style_value !== (li_style_value = tz_day_is_today(/*a_day*/ ctx[35], /*year*/ ctx[2], /*month*/ ctx[0], /*local_date_string*/ ctx[6], /*time_zone*/ ctx[5])
    			? 'border:solid 2px lime'
    			: '')) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(156:9) {#if day_includes_events(a_day) }",
    		ctx
    	});

    	return block;
    }

    // (155:8) {#each [cal.map[a_day_key]] as a_day}
    function create_each_block_2$1(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (dirty[0] & /*cal*/ 8) show_if = null;
    		if (show_if == null) show_if = !!/*day_includes_events*/ ctx[7](/*a_day*/ ctx[35]);
    		if (show_if) return create_if_block_1$4;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type_1(ctx, [-1, -1]);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
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
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(155:8) {#each [cal.map[a_day_key]] as a_day}",
    		ctx
    	});

    	return block;
    }

    // (153:6) {#each a_week as a_day_key}
    function create_each_block_1$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*a_day_key*/ ctx[32] !== false) return create_if_block$6;
    		return create_else_block_1$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
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
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(153:6) {#each a_week as a_day_key}",
    		ctx
    	});

    	return block;
    }

    // (152:5) {#each cal.table as a_week}
    function create_each_block$7(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*a_week*/ ctx[29];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cal, year, month, local_date_string, time_zone, event_management, day_includes_events*/ 493) {
    				each_value_1 = /*a_week*/ ctx[29];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(152:5) {#each cal.table as a_week}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let header;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let ul;
    	let li0;
    	let abbr0;
    	let t5;
    	let li1;
    	let abbr1;
    	let t7;
    	let li2;
    	let abbr2;
    	let t9;
    	let li3;
    	let abbr3;
    	let t11;
    	let li4;
    	let abbr4;
    	let t13;
    	let li5;
    	let abbr5;
    	let t15;
    	let li6;
    	let abbr6;
    	let t17;
    	let div0;
    	let ol;
    	let t18;
    	let div1;
    	let t19;
    	let t20;
    	let each_value = /*cal*/ ctx[3].table;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(/*month_str*/ ctx[1]);
    			t1 = space();
    			t2 = text(/*year*/ ctx[2]);
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			abbr0 = element("abbr");
    			abbr0.textContent = "S";
    			t5 = space();
    			li1 = element("li");
    			abbr1 = element("abbr");
    			abbr1.textContent = "M";
    			t7 = space();
    			li2 = element("li");
    			abbr2 = element("abbr");
    			abbr2.textContent = "T";
    			t9 = space();
    			li3 = element("li");
    			abbr3 = element("abbr");
    			abbr3.textContent = "W";
    			t11 = space();
    			li4 = element("li");
    			abbr4 = element("abbr");
    			abbr4.textContent = "T";
    			t13 = space();
    			li5 = element("li");
    			abbr5 = element("abbr");
    			abbr5.textContent = "F";
    			t15 = space();
    			li6 = element("li");
    			abbr6 = element("abbr");
    			abbr6.textContent = "S";
    			t17 = space();
    			div0 = element("div");
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			div1 = element("div");
    			t19 = text("Number of events taking_place: ");
    			t20 = text(/*total_events*/ ctx[4]);
    			add_location(h1, file$b, 123, 5, 3087);
    			attr_dev(header, "class", "svelte-eakgiw");
    			add_location(header, file$b, 122, 3, 3073);
    			attr_dev(abbr0, "title", "S");
    			attr_dev(abbr0, "class", "svelte-eakgiw");
    			add_location(abbr0, file$b, 128, 4, 3172);
    			attr_dev(li0, "class", "svelte-eakgiw");
    			add_location(li0, file$b, 127, 5, 3163);
    			attr_dev(abbr1, "title", "M");
    			attr_dev(abbr1, "class", "svelte-eakgiw");
    			add_location(abbr1, file$b, 131, 4, 3222);
    			attr_dev(li1, "class", "svelte-eakgiw");
    			add_location(li1, file$b, 130, 5, 3213);
    			attr_dev(abbr2, "title", "T");
    			attr_dev(abbr2, "class", "svelte-eakgiw");
    			add_location(abbr2, file$b, 134, 4, 3272);
    			attr_dev(li2, "class", "svelte-eakgiw");
    			add_location(li2, file$b, 133, 5, 3263);
    			attr_dev(abbr3, "title", "W");
    			attr_dev(abbr3, "class", "svelte-eakgiw");
    			add_location(abbr3, file$b, 137, 4, 3322);
    			attr_dev(li3, "class", "svelte-eakgiw");
    			add_location(li3, file$b, 136, 5, 3313);
    			attr_dev(abbr4, "title", "T");
    			attr_dev(abbr4, "class", "svelte-eakgiw");
    			add_location(abbr4, file$b, 140, 4, 3372);
    			attr_dev(li4, "class", "svelte-eakgiw");
    			add_location(li4, file$b, 139, 5, 3363);
    			attr_dev(abbr5, "title", "F");
    			attr_dev(abbr5, "class", "svelte-eakgiw");
    			add_location(abbr5, file$b, 143, 4, 3422);
    			attr_dev(li5, "class", "svelte-eakgiw");
    			add_location(li5, file$b, 142, 5, 3413);
    			attr_dev(abbr6, "title", "S");
    			attr_dev(abbr6, "class", "svelte-eakgiw");
    			add_location(abbr6, file$b, 146, 4, 3472);
    			attr_dev(li6, "class", "svelte-eakgiw");
    			add_location(li6, file$b, 145, 5, 3463);
    			attr_dev(ul, "class", "weekdays svelte-eakgiw");
    			add_location(ul, file$b, 126, 3, 3136);
    			attr_dev(ol, "class", "day-grid svelte-eakgiw");
    			add_location(ol, file$b, 150, 4, 3552);
    			attr_dev(div0, "class", "scroller-grid svelte-eakgiw");
    			add_location(div0, file$b, 149, 3, 3520);
    			attr_dev(div1, "class", "ev-count svelte-eakgiw");
    			add_location(div1, file$b, 169, 3, 4402);
    			attr_dev(div2, "class", "calendar");
    			add_location(div2, file$b, 121, 2, 3047);
    			set_style(div3, "padding", "6px");
    			add_location(div3, file$b, 120, 1, 3017);
    			attr_dev(div4, "class", "blg-el-wrapper-full svelte-eakgiw");
    			add_location(div4, file$b, 119, 0, 2982);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, header);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div2, t3);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, abbr0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, abbr1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, abbr2);
    			append_dev(ul, t9);
    			append_dev(ul, li3);
    			append_dev(li3, abbr3);
    			append_dev(ul, t11);
    			append_dev(ul, li4);
    			append_dev(li4, abbr4);
    			append_dev(ul, t13);
    			append_dev(ul, li5);
    			append_dev(li5, abbr5);
    			append_dev(ul, t15);
    			append_dev(ul, li6);
    			append_dev(li6, abbr6);
    			append_dev(div2, t17);
    			append_dev(div2, div0);
    			append_dev(div0, ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			append_dev(div2, t18);
    			append_dev(div2, div1);
    			append_dev(div1, t19);
    			append_dev(div1, t20);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*month_str*/ 2) set_data_dev(t0, /*month_str*/ ctx[1]);
    			if (dirty[0] & /*year*/ 4) set_data_dev(t2, /*year*/ ctx[2]);

    			if (dirty[0] & /*cal, year, month, local_date_string, time_zone, event_management, day_includes_events*/ 493) {
    				each_value = /*cal*/ ctx[3].table;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*total_events*/ 16) set_data_dev(t20, /*total_events*/ ctx[4]);
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const ONE_QUARTER_HOUR_MINUTES$4 = 15;
    const ONE_HALF_HOUR_MINUTES$4 = 30;
    const USE_AS_BLOCK$6 = "block";
    const USE_AS_MEET$5 = "meeting";
    const USE_AS_ACTIVITY$6 = "activity";
    const USE_AS_OPEN$6 = "open";

    function convert_date$1(secsdate) {
    	if (secsdate === 'never') {
    		return 'never';
    	} else {
    		let idate = parseInt(secsdate);
    		let dformatted = new Date(idate).toLocaleDateString('en-US');
    		return dformatted;
    	}
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MonthFull', slots, []);
    	const dispatch = createEventDispatcher();
    	let { dates } = $$props;
    	let { entry } = $$props;
    	let { title } = $$props;
    	let { ucwid } = $$props;
    	let { comment } = $$props;
    	let { month } = $$props;
    	let { month_str } = $$props;
    	let { year } = $$props;
    	let { cal } = $$props; // the calendar object 
    	let { total_events } = $$props;
    	let { time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone } = $$props;
    	const ONE_HOUR = 3600 * 1000;
    	const ONE_HALF_HOUR = 3600 * 500;
    	const ONE_QUARTER_HOUR = 3600 * 250;

    	// ---- ---- ---- ---- ---- ---- ---- ---- ----
    	let today = new Date();

    	let date_string = today.toUTCString();
    	let local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone });
    	let local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone });
    	let local_dt_string = `${local_date_string} ${local_time_string}`;
    	let calc_day = new Date();
    	let current_month = calc_day.getMonth();
    	let current_day = calc_day.getDate();
    	let current_year = calc_day.getFullYear();

    	function day_includes_events(a_day) {
    		let st = a_day.start_time;
    		let et = a_day.end_time;

    		//
    		let tzoff = getTimezoneOffset(time_zone, st);

    		//console.log(tzoff)
    		st -= ONE_HOUR * tzoff;

    		et -= ONE_HOUR * tzoff;

    		return timestamp_db.range_has_events(st, et, evnt => {
    			return evnt.use !== USE_AS_BLOCK$6;
    		});
    	}

    	let going_session = false;

    	function event_management(event, day_key) {
    		//
    		let tid = event.currentTarget.innerHTML;

    		//
    		let day_info = cal.map[day_key];

    		if (day_is_before_today(day_info.day, year, month)) {
    			alert("This day has gone by");
    			return;
    		}

    		//
    		day_info = Object.assign({}, day_info, {
    			"month": current_month,
    			"year": current_year,
    			"monthstr": month_str
    		});

    		//
    		console.log(day_info);

    		//
    		dispatch('message', {
    			"type": 'event-click',
    			"text": 'click ' + tid,
    			day_info
    		});
    	} //

    	const writable_props = [
    		'dates',
    		'entry',
    		'title',
    		'ucwid',
    		'comment',
    		'month',
    		'month_str',
    		'year',
    		'cal',
    		'total_events',
    		'time_zone'
    	];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<MonthFull> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (a_day_key, ev) => {
    		event_management(ev, a_day_key);
    	};

    	const click_handler_1 = (a_day_key, ev) => {
    		event_management(ev, a_day_key);
    	};

    	$$self.$$set = $$props => {
    		if ('dates' in $$props) $$invalidate(9, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(10, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(11, title = $$props.title);
    		if ('ucwid' in $$props) $$invalidate(12, ucwid = $$props.ucwid);
    		if ('comment' in $$props) $$invalidate(13, comment = $$props.comment);
    		if ('month' in $$props) $$invalidate(0, month = $$props.month);
    		if ('month_str' in $$props) $$invalidate(1, month_str = $$props.month_str);
    		if ('year' in $$props) $$invalidate(2, year = $$props.year);
    		if ('cal' in $$props) $$invalidate(3, cal = $$props.cal);
    		if ('total_events' in $$props) $$invalidate(4, total_events = $$props.total_events);
    		if ('time_zone' in $$props) $$invalidate(5, time_zone = $$props.time_zone);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		tz_day_is_today,
    		getTimezoneOffset,
    		day_is_before_today,
    		day_is_today,
    		timestamp_db,
    		dispatch,
    		dates,
    		entry,
    		title,
    		ucwid,
    		comment,
    		month,
    		month_str,
    		year,
    		cal,
    		total_events,
    		time_zone,
    		ONE_HOUR,
    		ONE_HALF_HOUR,
    		ONE_QUARTER_HOUR,
    		ONE_QUARTER_HOUR_MINUTES: ONE_QUARTER_HOUR_MINUTES$4,
    		ONE_HALF_HOUR_MINUTES: ONE_HALF_HOUR_MINUTES$4,
    		USE_AS_BLOCK: USE_AS_BLOCK$6,
    		USE_AS_MEET: USE_AS_MEET$5,
    		USE_AS_ACTIVITY: USE_AS_ACTIVITY$6,
    		USE_AS_OPEN: USE_AS_OPEN$6,
    		today,
    		date_string,
    		local_date_string,
    		local_time_string,
    		local_dt_string,
    		convert_date: convert_date$1,
    		calc_day,
    		current_month,
    		current_day,
    		current_year,
    		day_includes_events,
    		going_session,
    		event_management
    	});

    	$$self.$inject_state = $$props => {
    		if ('dates' in $$props) $$invalidate(9, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(10, entry = $$props.entry);
    		if ('title' in $$props) $$invalidate(11, title = $$props.title);
    		if ('ucwid' in $$props) $$invalidate(12, ucwid = $$props.ucwid);
    		if ('comment' in $$props) $$invalidate(13, comment = $$props.comment);
    		if ('month' in $$props) $$invalidate(0, month = $$props.month);
    		if ('month_str' in $$props) $$invalidate(1, month_str = $$props.month_str);
    		if ('year' in $$props) $$invalidate(2, year = $$props.year);
    		if ('cal' in $$props) $$invalidate(3, cal = $$props.cal);
    		if ('total_events' in $$props) $$invalidate(4, total_events = $$props.total_events);
    		if ('time_zone' in $$props) $$invalidate(5, time_zone = $$props.time_zone);
    		if ('today' in $$props) $$invalidate(27, today = $$props.today);
    		if ('date_string' in $$props) date_string = $$props.date_string;
    		if ('local_date_string' in $$props) $$invalidate(6, local_date_string = $$props.local_date_string);
    		if ('local_time_string' in $$props) $$invalidate(14, local_time_string = $$props.local_time_string);
    		if ('local_dt_string' in $$props) local_dt_string = $$props.local_dt_string;
    		if ('calc_day' in $$props) $$invalidate(15, calc_day = $$props.calc_day);
    		if ('current_month' in $$props) current_month = $$props.current_month;
    		if ('current_day' in $$props) current_day = $$props.current_day;
    		if ('current_year' in $$props) current_year = $$props.current_year;
    		if ('going_session' in $$props) going_session = $$props.going_session;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*time_zone*/ 32) {
    			$$invalidate(6, local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone }));
    		}

    		if ($$self.$$.dirty[0] & /*time_zone*/ 32) {
    			$$invalidate(14, local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone }));
    		}

    		if ($$self.$$.dirty[0] & /*local_date_string, local_time_string*/ 16448) {
    			local_dt_string = `${local_date_string} ${local_time_string}`;
    		}

    		if ($$self.$$.dirty[0] & /*year, month, calc_day*/ 32773) {
    			{
    				$$invalidate(15, calc_day = new Date(year, month));
    				current_month = month;
    				current_day = calc_day.getDate();
    				current_year = calc_day.getFullYear();
    			}
    		}
    	};

    	date_string = today.toUTCString();

    	return [
    		month,
    		month_str,
    		year,
    		cal,
    		total_events,
    		time_zone,
    		local_date_string,
    		day_includes_events,
    		event_management,
    		dates,
    		entry,
    		title,
    		ucwid,
    		comment,
    		local_time_string,
    		calc_day,
    		click_handler,
    		click_handler_1
    	];
    }

    class MonthFull extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				dates: 9,
    				entry: 10,
    				title: 11,
    				ucwid: 12,
    				comment: 13,
    				month: 0,
    				month_str: 1,
    				year: 2,
    				cal: 3,
    				total_events: 4,
    				time_zone: 5
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MonthFull",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dates*/ ctx[9] === undefined && !('dates' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'dates'");
    		}

    		if (/*entry*/ ctx[10] === undefined && !('entry' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'entry'");
    		}

    		if (/*title*/ ctx[11] === undefined && !('title' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'title'");
    		}

    		if (/*ucwid*/ ctx[12] === undefined && !('ucwid' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'ucwid'");
    		}

    		if (/*comment*/ ctx[13] === undefined && !('comment' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'comment'");
    		}

    		if (/*month*/ ctx[0] === undefined && !('month' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'month'");
    		}

    		if (/*month_str*/ ctx[1] === undefined && !('month_str' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'month_str'");
    		}

    		if (/*year*/ ctx[2] === undefined && !('year' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'year'");
    		}

    		if (/*cal*/ ctx[3] === undefined && !('cal' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'cal'");
    		}

    		if (/*total_events*/ ctx[4] === undefined && !('total_events' in props)) {
    			console_1$1.warn("<MonthFull> was created without expected prop 'total_events'");
    		}
    	}

    	get dates() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dates(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ucwid() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ucwid(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get comment() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comment(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month_str() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month_str(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get year() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cal() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cal(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get total_events() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set total_events(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time_zone() {
    		throw new Error("<MonthFull>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time_zone(value) {
    		throw new Error("<MonthFull>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$3) {
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
        function subscribe(run, invalidate = noop$3) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$3;
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

    /* src/Thing.svelte generated by Svelte v3.50.1 */

    const file$a = "src/Thing.svelte";

    // (125:1) {:else}
    function create_else_block$4(ctx) {
    	let span0;
    	let t0;
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*months_away*/ ctx[4] === 1) return create_if_block_1$3;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text(/*month_str*/ ctx[0]);
    			t1 = text(" is");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(/*months_away*/ ctx[4]);
    			t4 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "class", "blg-item-title svelte-ab7hyh");
    			add_location(span0, file$a, 125, 2, 3123);
    			set_style(span1, "color", "navy");
    			set_style(span1, "font-weight", "bolder");
    			attr_dev(span1, "class", "svelte-ab7hyh");
    			add_location(span1, file$a, 126, 2, 3178);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			insert_dev(target, t4, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*month_str*/ 1) set_data_dev(t0, /*month_str*/ ctx[0]);
    			if (dirty & /*months_away*/ 16) set_data_dev(t3, /*months_away*/ ctx[4]);

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t4);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(125:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (122:1) {#if show_clock }
    function create_if_block$5(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Today Is";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*local_dt_string*/ ctx[3]);
    			t3 = space();
    			t4 = text(/*time_zone*/ ctx[2]);
    			attr_dev(span0, "class", "blg-item-title svelte-ab7hyh");
    			add_location(span0, file$a, 122, 2, 2969);
    			set_style(span1, "color", "navy");
    			set_style(span1, "font-weight", "bolder");
    			set_style(span1, "font-size", "66%");
    			attr_dev(span1, "class", "svelte-ab7hyh");
    			add_location(span1, file$a, 123, 2, 3017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*local_dt_string*/ 8) set_data_dev(t2, /*local_dt_string*/ ctx[3]);
    			if (dirty & /*time_zone*/ 4) set_data_dev(t4, /*time_zone*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(122:1) {#if show_clock }",
    		ctx
    	});

    	return block;
    }

    // (130:2) {:else}
    function create_else_block_1$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "months away";
    			attr_dev(span, "class", "blg-item-title svelte-ab7hyh");
    			add_location(span, file$a, 130, 3, 3335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(130:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#if months_away === 1 }
    function create_if_block_1$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "month away";
    			attr_dev(span, "class", "blg-item-title svelte-ab7hyh");
    			add_location(span, file$a, 128, 3, 3273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(128:2) {#if months_away === 1 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let t0;
    	let div1;
    	let h6;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*show_clock*/ ctx[5]) return create_if_block$5;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			t1 = text(/*month_str*/ ctx[0]);
    			t2 = space();
    			t3 = text(/*year*/ ctx[1]);
    			t4 = space();
    			div0 = element("div");
    			attr_dev(h6, "class", "svelte-ab7hyh");
    			add_location(h6, file$a, 134, 2, 3409);
    			add_location(div0, file$a, 135, 2, 3439);
    			add_location(div1, file$a, 133, 1, 3401);
    			attr_dev(div2, "class", "blg-el-wrapper svelte-ab7hyh");
    			add_location(div2, file$a, 120, 0, 2919);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if_block.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, t1);
    			append_dev(h6, t2);
    			append_dev(h6, t3);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, t0);
    				}
    			}

    			if (dirty & /*month_str*/ 1) set_data_dev(t1, /*month_str*/ ctx[0]);
    			if (dirty & /*year*/ 2) set_data_dev(t3, /*year*/ ctx[1]);
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const USE_AS_BLOCK$5 = "block";
    const USE_AS_MEET$4 = "meeting";
    const USE_AS_ACTIVITY$5 = "activity";
    const USE_AS_OPEN$5 = "open";

    function convert_date(secsdate) {
    	if (secsdate === 'never') {
    		return 'never';
    	} else {
    		let idate = parseInt(secsdate);
    		let dformatted = new Date(idate).toLocaleString('en-US');
    		return dformatted;
    	}
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Thing', slots, []);
    	let { id } = $$props;
    	let { dates } = $$props;
    	let { entry } = $$props;
    	let { score } = $$props;
    	let { ucwid } = $$props;
    	let { when } = $$props;
    	let { comment } = $$props;
    	let { month } = $$props;
    	let { month_str } = $$props;
    	let { year } = $$props;
    	let { cal } = $$props; // the calendar object 
    	let { time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone } = $$props;
    	const ONE_HOUR = 3600 * 1000;
    	let today = new Date();
    	let date_string = today.toUTCString();
    	let local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone });
    	let local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone });
    	let local_dt_string = `${local_date_string} ${local_time_string}`;

    	let months_away = year === today.getFullYear()
    	? month - today.getMonth()
    	: -1;

    	if (months_away < 0 && year > today.getFullYear()) {
    		let y_diff = year - today.getFullYear();
    		months_away = 12 - today.getMonth() - 1 + 12 * (y_diff - 1) + month + 1;
    	}

    	let show_clock = false;

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(15, today = new Date());
    			},
    			1000
    		);

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	let truncated;
    	let score_rounded;
    	let picked_this = false;
    	let updated_when;
    	let created_when;

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
    		picked_this = link_picker.is_picked(entry);
    	});

    	const writable_props = [
    		'id',
    		'dates',
    		'entry',
    		'score',
    		'ucwid',
    		'when',
    		'comment',
    		'month',
    		'month_str',
    		'year',
    		'cal',
    		'time_zone'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Thing> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('dates' in $$props) $$invalidate(7, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(8, entry = $$props.entry);
    		if ('score' in $$props) $$invalidate(9, score = $$props.score);
    		if ('ucwid' in $$props) $$invalidate(10, ucwid = $$props.ucwid);
    		if ('when' in $$props) $$invalidate(11, when = $$props.when);
    		if ('comment' in $$props) $$invalidate(12, comment = $$props.comment);
    		if ('month' in $$props) $$invalidate(13, month = $$props.month);
    		if ('month_str' in $$props) $$invalidate(0, month_str = $$props.month_str);
    		if ('year' in $$props) $$invalidate(1, year = $$props.year);
    		if ('cal' in $$props) $$invalidate(14, cal = $$props.cal);
    		if ('time_zone' in $$props) $$invalidate(2, time_zone = $$props.time_zone);
    	};

    	$$self.$capture_state = () => ({
    		link_picker,
    		picker,
    		onMount,
    		id,
    		dates,
    		entry,
    		score,
    		ucwid,
    		when,
    		comment,
    		month,
    		month_str,
    		year,
    		cal,
    		time_zone,
    		ONE_HOUR,
    		USE_AS_BLOCK: USE_AS_BLOCK$5,
    		USE_AS_MEET: USE_AS_MEET$4,
    		USE_AS_ACTIVITY: USE_AS_ACTIVITY$5,
    		USE_AS_OPEN: USE_AS_OPEN$5,
    		today,
    		date_string,
    		local_date_string,
    		local_time_string,
    		local_dt_string,
    		months_away,
    		show_clock,
    		truncated,
    		score_rounded,
    		picked_this,
    		convert_date,
    		updated_when,
    		created_when,
    		toggle_pick,
    		count_value,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('dates' in $$props) $$invalidate(7, dates = $$props.dates);
    		if ('entry' in $$props) $$invalidate(8, entry = $$props.entry);
    		if ('score' in $$props) $$invalidate(9, score = $$props.score);
    		if ('ucwid' in $$props) $$invalidate(10, ucwid = $$props.ucwid);
    		if ('when' in $$props) $$invalidate(11, when = $$props.when);
    		if ('comment' in $$props) $$invalidate(12, comment = $$props.comment);
    		if ('month' in $$props) $$invalidate(13, month = $$props.month);
    		if ('month_str' in $$props) $$invalidate(0, month_str = $$props.month_str);
    		if ('year' in $$props) $$invalidate(1, year = $$props.year);
    		if ('cal' in $$props) $$invalidate(14, cal = $$props.cal);
    		if ('time_zone' in $$props) $$invalidate(2, time_zone = $$props.time_zone);
    		if ('today' in $$props) $$invalidate(15, today = $$props.today);
    		if ('date_string' in $$props) date_string = $$props.date_string;
    		if ('local_date_string' in $$props) $$invalidate(16, local_date_string = $$props.local_date_string);
    		if ('local_time_string' in $$props) $$invalidate(17, local_time_string = $$props.local_time_string);
    		if ('local_dt_string' in $$props) $$invalidate(3, local_dt_string = $$props.local_dt_string);
    		if ('months_away' in $$props) $$invalidate(4, months_away = $$props.months_away);
    		if ('show_clock' in $$props) $$invalidate(5, show_clock = $$props.show_clock);
    		if ('truncated' in $$props) truncated = $$props.truncated;
    		if ('score_rounded' in $$props) score_rounded = $$props.score_rounded;
    		if ('picked_this' in $$props) picked_this = $$props.picked_this;
    		if ('updated_when' in $$props) updated_when = $$props.updated_when;
    		if ('created_when' in $$props) created_when = $$props.created_when;
    		if ('count_value' in $$props) count_value = $$props.count_value;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*today*/ 32768) {
    			date_string = today.toUTCString();
    		}

    		if ($$self.$$.dirty & /*today, time_zone*/ 32772) {
    			$$invalidate(16, local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone }));
    		}

    		if ($$self.$$.dirty & /*today, time_zone*/ 32772) {
    			$$invalidate(17, local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone }));
    		}

    		if ($$self.$$.dirty & /*local_date_string, local_time_string*/ 196608) {
    			$$invalidate(3, local_dt_string = `${local_date_string} ${local_time_string}`);
    		}

    		if ($$self.$$.dirty & /*today, month, year*/ 40962) {
    			if (today.getMonth() === month && today.getFullYear() === year) {
    				$$invalidate(5, show_clock = true);
    			} else {
    				$$invalidate(5, show_clock = false);
    			}
    		}

    		if ($$self.$$.dirty & /*comment*/ 4096) {
    			truncated = comment !== undefined
    			? comment.substr(0, 250) + "&#8230;"
    			: "search";
    		}

    		if ($$self.$$.dirty & /*score*/ 512) {
    			score_rounded = score ? score.toFixed(3) : 0;
    		}

    		if ($$self.$$.dirty & /*entry*/ 256) {
    			picked_this = link_picker.is_picked(entry);
    		}

    		if ($$self.$$.dirty & /*dates*/ 128) {
    			updated_when = dates ? convert_date(dates.updated) : "";
    		}

    		if ($$self.$$.dirty & /*dates, when*/ 2176) {
    			created_when = dates ? convert_date(when) : "";
    		}

    		if ($$self.$$.dirty & /*id*/ 64) {
    			if (id !== undefined) {
    				//
    				setTimeout(
    					() => {
    						let thing_box = document.getElementById(`xy_${id}`);

    						if (thing_box) {
    							thing_box.style.height = "90px";
    						}
    					},
    					5
    				);
    			} //
    		}
    	};

    	return [
    		month_str,
    		year,
    		time_zone,
    		local_dt_string,
    		months_away,
    		show_clock,
    		id,
    		dates,
    		entry,
    		score,
    		ucwid,
    		when,
    		comment,
    		month,
    		cal,
    		today,
    		local_date_string,
    		local_time_string
    	];
    }

    class Thing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			id: 6,
    			dates: 7,
    			entry: 8,
    			score: 9,
    			ucwid: 10,
    			when: 11,
    			comment: 12,
    			month: 13,
    			month_str: 0,
    			year: 1,
    			cal: 14,
    			time_zone: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thing",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[6] === undefined && !('id' in props)) {
    			console.warn("<Thing> was created without expected prop 'id'");
    		}

    		if (/*dates*/ ctx[7] === undefined && !('dates' in props)) {
    			console.warn("<Thing> was created without expected prop 'dates'");
    		}

    		if (/*entry*/ ctx[8] === undefined && !('entry' in props)) {
    			console.warn("<Thing> was created without expected prop 'entry'");
    		}

    		if (/*score*/ ctx[9] === undefined && !('score' in props)) {
    			console.warn("<Thing> was created without expected prop 'score'");
    		}

    		if (/*ucwid*/ ctx[10] === undefined && !('ucwid' in props)) {
    			console.warn("<Thing> was created without expected prop 'ucwid'");
    		}

    		if (/*when*/ ctx[11] === undefined && !('when' in props)) {
    			console.warn("<Thing> was created without expected prop 'when'");
    		}

    		if (/*comment*/ ctx[12] === undefined && !('comment' in props)) {
    			console.warn("<Thing> was created without expected prop 'comment'");
    		}

    		if (/*month*/ ctx[13] === undefined && !('month' in props)) {
    			console.warn("<Thing> was created without expected prop 'month'");
    		}

    		if (/*month_str*/ ctx[0] === undefined && !('month_str' in props)) {
    			console.warn("<Thing> was created without expected prop 'month_str'");
    		}

    		if (/*year*/ ctx[1] === undefined && !('year' in props)) {
    			console.warn("<Thing> was created without expected prop 'year'");
    		}

    		if (/*cal*/ ctx[14] === undefined && !('cal' in props)) {
    			console.warn("<Thing> was created without expected prop 'cal'");
    		}
    	}

    	get id() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
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

    	get score() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ucwid() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ucwid(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get when() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set when(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get comment() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comment(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month_str() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month_str(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get year() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cal() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cal(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time_zone() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time_zone(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DayEvents.svelte generated by Svelte v3.50.1 */

    const file$9 = "src/DayEvents.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[49] = list[i];
    	return child_ctx;
    }

    // (254:4) {#if show_editor }
    function create_if_block_6$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let span;
    	let t3;
    	let br;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block0 = /*editor_for_new*/ ctx[14] && create_if_block_14(ctx);
    	let if_block1 = /*editor_for_update*/ ctx[15] && create_if_block_13(ctx);
    	let if_block2 = /*editor_for_cancel*/ ctx[16] && create_if_block_12(ctx);

    	function select_block_type(ctx, dirty) {
    		if (!/*editor_for_cancel*/ ctx[16]) return create_if_block_10$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block3 = current_block_type(ctx);
    	let if_block4 = /*editor_for_new*/ ctx[14] && create_if_block_9$1(ctx);
    	let if_block5 = /*editor_for_update*/ ctx[15] && create_if_block_8$1(ctx);
    	let if_block6 = (/*editor_for_cancel*/ ctx[16] || /*editor_for_update*/ ctx[15]) && create_if_block_7$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			span = element("span");
    			t3 = text(/*maybe_event_time*/ ctx[10]);
    			br = element("br");
    			t4 = space();
    			if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			t6 = space();
    			if (if_block5) if_block5.c();
    			t7 = space();
    			if (if_block6) if_block6.c();
    			t8 = space();
    			button = element("button");
    			button.textContent = "cancel";
    			attr_dev(span, "class", "scheduler-label svelte-174b2s8");
    			add_location(span, file$9, 264, 8, 7341);
    			add_location(br, file$9, 264, 63, 7396);
    			add_location(button, file$9, 297, 8, 9691);
    			attr_dev(div, "class", "scheduler-box svelte-174b2s8");
    			add_location(div, file$9, 254, 4, 6977);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			append_dev(div, span);
    			append_dev(span, t3);
    			append_dev(div, br);
    			append_dev(div, t4);
    			if_block3.m(div, null);
    			append_dev(div, t5);
    			if (if_block4) if_block4.m(div, null);
    			append_dev(div, t6);
    			if (if_block5) if_block5.m(div, null);
    			append_dev(div, t7);
    			if (if_block6) if_block6.m(div, null);
    			append_dev(div, t8);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*hide_editor*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*editor_for_new*/ ctx[14]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_14(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*editor_for_update*/ ctx[15]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_13(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*editor_for_cancel*/ ctx[16]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_12(ctx);
    					if_block2.c();
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*maybe_event_time*/ 1024) set_data_dev(t3, /*maybe_event_time*/ ctx[10]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div, t5);
    				}
    			}

    			if (/*editor_for_new*/ ctx[14]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_9$1(ctx);
    					if_block4.c();
    					if_block4.m(div, t6);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*editor_for_update*/ ctx[15]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_8$1(ctx);
    					if_block5.c();
    					if_block5.m(div, t7);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*editor_for_cancel*/ ctx[16] || /*editor_for_update*/ ctx[15]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_7$1(ctx);
    					if_block6.c();
    					if_block6.m(div, t8);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(254:4) {#if show_editor }",
    		ctx
    	});

    	return block;
    }

    // (256:8) {#if editor_for_new }
    function create_if_block_14(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Shedule an event at:";
    			attr_dev(span, "class", "scheduler-hn svelte-174b2s8");
    			add_location(span, file$9, 256, 8, 7043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(256:8) {#if editor_for_new }",
    		ctx
    	});

    	return block;
    }

    // (259:8) {#if editor_for_update }
    function create_if_block_13(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Change an event at:";
    			attr_dev(span, "class", "scheduler-hn svelte-174b2s8");
    			add_location(span, file$9, 259, 8, 7154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(259:8) {#if editor_for_update }",
    		ctx
    	});

    	return block;
    }

    // (262:8) {#if editor_for_cancel }
    function create_if_block_12(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Cancel an event at:";
    			attr_dev(span, "class", "scheduler-hn svelte-174b2s8");
    			add_location(span, file$9, 262, 8, 7264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(262:8) {#if editor_for_cancel }",
    		ctx
    	});

    	return block;
    }

    // (277:8) {:else}
    function create_else_block_1$1(ctx) {
    	let span0;
    	let t1;
    	let br0;
    	let t2;
    	let span1;
    	let input0;
    	let br1;
    	let t4;
    	let span2;
    	let input1;
    	let br2;
    	let t6;
    	let span3;
    	let t8;
    	let br3;
    	let t9;
    	let span4;
    	let t11;
    	let br4;
    	let t12;
    	let span5;
    	let input2;
    	let t14;
    	let span6;
    	let input3;
    	let br5;
    	let t16;
    	let span7;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let br6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Topic:";
    			t1 = text(/*maybe_event_topic*/ ctx[3]);
    			br0 = element("br");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Enter your id:";
    			input0 = element("input");
    			br1 = element("br");
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "Enter your event code:";
    			input1 = element("input");
    			br2 = element("br");
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "Email:";
    			t8 = text(/*maybe_event_email*/ ctx[5]);
    			br3 = element("br");
    			t9 = space();
    			span4 = element("span");
    			span4.textContent = "Phone:";
    			t11 = text(/*maybe_event_contact_phone*/ ctx[6]);
    			br4 = element("br");
    			t12 = space();
    			span5 = element("span");
    			span5.textContent = "by zoom: ";
    			input2 = element("input");
    			t14 = space();
    			span6 = element("span");
    			span6.textContent = "in person: ";
    			input3 = element("input");
    			br5 = element("br");
    			t16 = space();
    			span7 = element("span");
    			t17 = text("for ");
    			t18 = text(/*maybe_event_how_long*/ ctx[9]);
    			t19 = text(" minutes");
    			t20 = text(/*maybe_event_how_long*/ ctx[9]);
    			br6 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$9, 277, 8, 8495);
    			add_location(br0, file$9, 277, 70, 8557);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$9, 278, 8, 8570);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$9, 278, 59, 8621);
    			add_location(br1, file$9, 278, 107, 8669);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$9, 279, 8, 8682);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$9, 279, 67, 8741);
    			add_location(br2, file$9, 279, 117, 8791);
    			attr_dev(span3, "class", "scheduler-label svelte-174b2s8");
    			add_location(span3, file$9, 280, 8, 8804);
    			add_location(br3, file$9, 280, 70, 8866);
    			attr_dev(span4, "class", "scheduler-label svelte-174b2s8");
    			add_location(span4, file$9, 281, 8, 8879);
    			add_location(br4, file$9, 281, 78, 8949);
    			attr_dev(span5, "class", "scheduler-label svelte-174b2s8");
    			add_location(span5, file$9, 282, 8, 8962);
    			attr_dev(input2, "type", "checkbox");
    			input2.disabled = true;
    			add_location(input2, file$9, 282, 54, 9008);
    			attr_dev(span6, "class", "scheduler-label svelte-174b2s8");
    			add_location(span6, file$9, 283, 8, 9083);
    			attr_dev(input3, "type", "checkbox");
    			input3.disabled = true;
    			add_location(input3, file$9, 283, 56, 9131);
    			add_location(br5, file$9, 283, 128, 9203);
    			attr_dev(span7, "class", "scheduler-label svelte-174b2s8");
    			add_location(span7, file$9, 284, 8, 9216);
    			add_location(br6, file$9, 284, 101, 9309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_id*/ ctx[4]);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*maybe_event_code*/ ctx[12]);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, span3, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span4, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, span5, anchor);
    			insert_dev(target, input2, anchor);
    			input2.checked = /*maybe_event_zoom*/ ctx[7];
    			insert_dev(target, t14, anchor);
    			insert_dev(target, span6, anchor);
    			insert_dev(target, input3, anchor);
    			input3.checked = /*maybe_event_in_person*/ ctx[8];
    			insert_dev(target, br5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, span7, anchor);
    			append_dev(span7, t17);
    			append_dev(span7, t18);
    			append_dev(span7, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, br6, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_2*/ ctx[39]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[40]),
    					listen_dev(input2, "change", /*input2_change_handler_1*/ ctx[41]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[42])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_topic*/ 8) set_data_dev(t1, /*maybe_event_topic*/ ctx[3]);

    			if (dirty[0] & /*maybe_event_id*/ 16 && input0.value !== /*maybe_event_id*/ ctx[4]) {
    				set_input_value(input0, /*maybe_event_id*/ ctx[4]);
    			}

    			if (dirty[0] & /*maybe_event_code*/ 4096 && input1.value !== /*maybe_event_code*/ ctx[12]) {
    				set_input_value(input1, /*maybe_event_code*/ ctx[12]);
    			}

    			if (dirty[0] & /*maybe_event_email*/ 32) set_data_dev(t8, /*maybe_event_email*/ ctx[5]);
    			if (dirty[0] & /*maybe_event_contact_phone*/ 64) set_data_dev(t11, /*maybe_event_contact_phone*/ ctx[6]);

    			if (dirty[0] & /*maybe_event_zoom*/ 128) {
    				input2.checked = /*maybe_event_zoom*/ ctx[7];
    			}

    			if (dirty[0] & /*maybe_event_in_person*/ 256) {
    				input3.checked = /*maybe_event_in_person*/ ctx[8];
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 512) set_data_dev(t18, /*maybe_event_how_long*/ ctx[9]);
    			if (dirty[0] & /*maybe_event_how_long*/ 512) set_data_dev(t20, /*maybe_event_how_long*/ ctx[9]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span4);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(span6);
    			if (detaching) detach_dev(input3);
    			if (detaching) detach_dev(br5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(span7);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(br6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(277:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (267:8) {#if !(editor_for_cancel) }
    function create_if_block_10$1(ctx) {
    	let span0;
    	let input0;
    	let br0;
    	let t1;
    	let t2;
    	let span1;
    	let input1;
    	let t4;
    	let span2;
    	let input2;
    	let br1;
    	let t6;
    	let span3;
    	let t7;
    	let t8;
    	let t9;
    	let input3;
    	let br2;
    	let mounted;
    	let dispose;
    	let if_block = !/*model_general_class*/ ctx[2] && create_if_block_11(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Enter a topic:";
    			input0 = element("input");
    			br0 = element("br");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "by zoom: ";
    			input1 = element("input");
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "in person: ";
    			input2 = element("input");
    			br1 = element("br");
    			t6 = space();
    			span3 = element("span");
    			t7 = text("for ");
    			t8 = text(/*maybe_event_how_long*/ ctx[9]);
    			t9 = text(" minutes");
    			input3 = element("input");
    			br2 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$9, 267, 8, 7478);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter a topic label");
    			add_location(input0, file$9, 267, 59, 7529);
    			add_location(br0, file$9, 267, 143, 7613);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$9, 273, 8, 8044);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$9, 273, 54, 8090);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$9, 274, 8, 8154);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$9, 274, 56, 8202);
    			add_location(br1, file$9, 274, 116, 8262);
    			attr_dev(span3, "class", "scheduler-label svelte-174b2s8");
    			add_location(span3, file$9, 275, 8, 8275);
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "min", /*maybe_event_lb*/ ctx[18]);
    			attr_dev(input3, "max", /*maybe_event_ub*/ ctx[11]);
    			attr_dev(input3, "step", /*maybe_event_step*/ ctx[19]);
    			add_location(input3, file$9, 275, 79, 8346);
    			add_location(br2, file$9, 275, 199, 8466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_topic*/ ctx[3]);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input1, anchor);
    			input1.checked = /*maybe_event_zoom*/ ctx[7];
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input2, anchor);
    			input2.checked = /*maybe_event_in_person*/ ctx[8];
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t7);
    			append_dev(span3, t8);
    			append_dev(span3, t9);
    			insert_dev(target, input3, anchor);
    			set_input_value(input3, /*maybe_event_how_long*/ ctx[9]);
    			insert_dev(target, br2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[32]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[36]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[37]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[38]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[38])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_topic*/ 8 && input0.value !== /*maybe_event_topic*/ ctx[3]) {
    				set_input_value(input0, /*maybe_event_topic*/ ctx[3]);
    			}

    			if (!/*model_general_class*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_11(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*maybe_event_zoom*/ 128) {
    				input1.checked = /*maybe_event_zoom*/ ctx[7];
    			}

    			if (dirty[0] & /*maybe_event_in_person*/ 256) {
    				input2.checked = /*maybe_event_in_person*/ ctx[8];
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 512) set_data_dev(t8, /*maybe_event_how_long*/ ctx[9]);

    			if (dirty[0] & /*maybe_event_ub*/ 2048) {
    				attr_dev(input3, "max", /*maybe_event_ub*/ ctx[11]);
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 512) {
    				set_input_value(input3, /*maybe_event_how_long*/ ctx[9]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(input3);
    			if (detaching) detach_dev(br2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10$1.name,
    		type: "if",
    		source: "(267:8) {#if !(editor_for_cancel) }",
    		ctx
    	});

    	return block;
    }

    // (269:8) {#if !model_general_class }
    function create_if_block_11(ctx) {
    	let span0;
    	let input0;
    	let br0;
    	let t1;
    	let span1;
    	let input1;
    	let br1;
    	let t3;
    	let span2;
    	let input2;
    	let br2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Enter your id:";
    			input0 = element("input");
    			br0 = element("br");
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Enter your email:";
    			input1 = element("input");
    			br1 = element("br");
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Enter your phone:";
    			input2 = element("input");
    			br2 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$9, 269, 12, 7666);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$9, 269, 63, 7717);
    			add_location(br0, file$9, 269, 111, 7765);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$9, 270, 12, 7782);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$9, 270, 66, 7836);
    			add_location(br1, file$9, 270, 117, 7887);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$9, 271, 12, 7904);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$9, 271, 66, 7958);
    			add_location(br2, file$9, 271, 125, 8017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_id*/ ctx[4]);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*maybe_event_email*/ ctx[5]);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*maybe_event_contact_phone*/ ctx[6]);
    			insert_dev(target, br2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[33]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[34]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[35])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_id*/ 16 && input0.value !== /*maybe_event_id*/ ctx[4]) {
    				set_input_value(input0, /*maybe_event_id*/ ctx[4]);
    			}

    			if (dirty[0] & /*maybe_event_email*/ 32 && input1.value !== /*maybe_event_email*/ ctx[5]) {
    				set_input_value(input1, /*maybe_event_email*/ ctx[5]);
    			}

    			if (dirty[0] & /*maybe_event_contact_phone*/ 64 && input2.value !== /*maybe_event_contact_phone*/ ctx[6]) {
    				set_input_value(input2, /*maybe_event_contact_phone*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(br2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(269:8) {#if !model_general_class }",
    		ctx
    	});

    	return block;
    }

    // (288:8) {#if editor_for_new }
    function create_if_block_9$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "request";
    			add_location(button, file$9, 288, 8, 9367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*publish_event_request*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(288:8) {#if editor_for_new }",
    		ctx
    	});

    	return block;
    }

    // (291:8) {#if editor_for_update }
    function create_if_block_8$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "update";
    			add_location(button, file$9, 291, 8, 9480);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*publish_event_update*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(291:8) {#if editor_for_update }",
    		ctx
    	});

    	return block;
    }

    // (294:8) {#if (editor_for_cancel || editor_for_update) }
    function create_if_block_7$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "drop";
    			add_location(button, file$9, 294, 8, 9614);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*publish_event_cancel*/ ctx[24], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(294:8) {#if (editor_for_cancel || editor_for_update) }",
    		ctx
    	});

    	return block;
    }

    // (304:8) {#if (all_day_display !== undefined) }
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*all_day_display*/ ctx[17];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*all_day_display, handle_change_request*/ 2228224) {
    				each_value = /*all_day_display*/ ctx[17];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(304:8) {#if (all_day_display !== undefined) }",
    		ctx
    	});

    	return block;
    }

    // (320:20) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*hour_data*/ ctx[49].label.length > 0 && create_if_block_5$1(ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[44](/*hour_data*/ ctx[49], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("+30:\n                            ");
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "half-hour-display " + /*hour_data*/ ctx[49].use + " svelte-174b2s8");
    			add_location(div, file$9, 320, 24, 10673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*hour_data*/ ctx[49].label.length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5$1(ctx);
    					if_block.c();
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*all_day_display*/ 131072 && div_class_value !== (div_class_value = "half-hour-display " + /*hour_data*/ ctx[49].use + " svelte-174b2s8")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(320:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (313:20) {#if !(hour_data.on_half_hour) }
    function create_if_block_3$1(ctx) {
    	let div;
    	let t0_value = /*hour_data*/ ctx[49].time + "";
    	let t0;
    	let t1;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*hour_data*/ ctx[49].label.length > 0 && create_if_block_4$1(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[43](/*hour_data*/ ctx[49], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(div, "class", div_class_value = "hour-display " + /*hour_data*/ ctx[49].use + " svelte-174b2s8");
    			add_location(div, file$9, 313, 24, 10287);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*all_day_display*/ 131072 && t0_value !== (t0_value = /*hour_data*/ ctx[49].time + "")) set_data_dev(t0, t0_value);

    			if (/*hour_data*/ ctx[49].label.length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$1(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*all_day_display*/ 131072 && div_class_value !== (div_class_value = "hour-display " + /*hour_data*/ ctx[49].use + " svelte-174b2s8")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(313:20) {#if !(hour_data.on_half_hour) }",
    		ctx
    	});

    	return block;
    }

    // (306:16) {#if hour_data.use === USE_AS_BLOCK }
    function create_if_block_1$2(ctx) {
    	let if_block_anchor;
    	let if_block = !/*hour_data*/ ctx[49].on_half_hour && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*hour_data*/ ctx[49].on_half_hour) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(306:16) {#if hour_data.use === USE_AS_BLOCK }",
    		ctx
    	});

    	return block;
    }

    // (323:28) {#if hour_data.label.length > 0}
    function create_if_block_5$1(ctx) {
    	let span;
    	let t_value = /*hour_data*/ ctx[49].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$9, 323, 32, 10903);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*all_day_display*/ 131072 && t_value !== (t_value = /*hour_data*/ ctx[49].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(323:28) {#if hour_data.label.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (316:28) {#if hour_data.label.length > 0}
    function create_if_block_4$1(ctx) {
    	let span;
    	let t_value = /*hour_data*/ ctx[49].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$9, 316, 32, 10525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*all_day_display*/ 131072 && t_value !== (t_value = /*hour_data*/ ctx[49].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(316:28) {#if hour_data.label.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (307:20) {#if !(hour_data.on_half_hour) }
    function create_if_block_2$2(ctx) {
    	let div;
    	let t0_value = /*hour_data*/ ctx[49].time + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "hour-display blocked-hour svelte-174b2s8");
    			add_location(div, file$9, 307, 24, 10043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*all_day_display*/ 131072 && t0_value !== (t0_value = /*hour_data*/ ctx[49].time + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(307:20) {#if !(hour_data.on_half_hour) }",
    		ctx
    	});

    	return block;
    }

    // (305:12) {#each all_day_display as hour_data}
    function create_each_block$6(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*hour_data*/ ctx[49].use === USE_AS_BLOCK$4) return create_if_block_1$2;
    		if (!/*hour_data*/ ctx[49].on_half_hour) return create_if_block_3$1;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
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
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(305:12) {#each all_day_display as hour_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div2;
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let h3;
    	let t6;
    	let div0;
    	let if_block0 = /*show_editor*/ ctx[13] && create_if_block_6$1(ctx);
    	let if_block1 = /*all_day_display*/ ctx[17] !== undefined && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			t0 = text(/*monthstr*/ ctx[1]);
    			t1 = text("  ");
    			t2 = text(/*day*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "events";
    			t6 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			add_location(h2, file$9, 251, 0, 6882);
    			attr_dev(h3, "class", "svelte-174b2s8");
    			add_location(h3, file$9, 301, 4, 9764);
    			attr_dev(div0, "class", "day-list-holder svelte-174b2s8");
    			add_location(div0, file$9, 302, 4, 9786);
    			attr_dev(div1, "class", "contain-controls svelte-174b2s8");
    			add_location(div1, file$9, 252, 0, 6919);
    			attr_dev(div2, "class", "contain-all svelte-174b2s8");
    			add_location(div2, file$9, 250, 0, 6856);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, h3);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*monthstr*/ 2) set_data_dev(t0, /*monthstr*/ ctx[1]);
    			if (dirty[0] & /*day*/ 1) set_data_dev(t2, /*day*/ ctx[0]);

    			if (/*show_editor*/ ctx[13]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*all_day_display*/ ctx[17] !== undefined) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const ONE_QUARTER_HOUR_MINUTES$3 = 15;
    const ONE_HALF_HOUR_MINUTES$3 = 30;
    const USE_AS_BLOCK$4 = "block";
    const USE_AS_MEET$3 = "meeting";
    const USE_AS_ACTIVITY$4 = "activity";
    const USE_AS_OPEN$4 = "open";

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DayEvents', slots, []);
    	let { day } = $$props;
    	let { monthstr } = $$props;
    	let { all_day_list } = $$props;
    	let { day_event_count = 0 } = $$props;
    	let { model_how_long } = $$props;
    	let { model_general_class } = $$props;
    	let { slot_of_change } = $$props;
    	const ONE_HOUR = 3600 * 1000;
    	const ONE_HALF_HOUR = 3600 * 500;
    	const ONE_QUARTER_HOUR = 3600 * 250;
    	let maybe_event_time = "none scheduled";
    	let maybe_event_topic = "";
    	let maybe_event_id = "";
    	let maybe_event_email = "";
    	let maybe_event_contact_phone = "";
    	let maybe_event_zoom = false;
    	let maybe_event_in_person = false;
    	let maybe_event_index = 0;
    	let maybe_event_half_hour = false;
    	let maybe_event_how_long = 0;
    	let maybe_event_lb = 15;
    	let maybe_event_ub = 30;
    	let maybe_event_step = 15;
    	let maybe_event_code = "";
    	let show_editor = false;
    	let editor_for_new = false;
    	let editor_for_update = false;
    	let editor_for_cancel = false;
    	let dropped_event = false;
    	let changed_event = false;
    	let all_day_display = all_day_list;

    	function hide_editor() {
    		$$invalidate(13, show_editor = false);
    		$$invalidate(14, editor_for_new = false);
    		$$invalidate(15, editor_for_update = false);
    		$$invalidate(16, editor_for_cancel = false);
    	}

    	function handle_change_request(hour_data) {
    		//
    		let real_start = hour_data;

    		//
    		if (hour_data.use !== USE_AS_OPEN$4) {
    			let ri = hour_data.index;

    			while (ri > 0) {
    				ri--;
    				let maybe_real = all_day_list[ri];

    				if (maybe_real.use === real_start.use && maybe_real.label === real_start.label) {
    					real_start = maybe_real;
    				} else break;
    			}
    		}

    		//
    		if (real_start.use === USE_AS_OPEN$4) {
    			$$invalidate(14, editor_for_new = true);
    		} else if (real_start.use !== USE_AS_BLOCK$4) {
    			//  && (real_start.changed)
    			$$invalidate(15, editor_for_update = true);
    		}

    		/*
    else if ( (real_start.use !== USE_AS_BLOCK) && !(real_start.changed) ) {
        editor_for_cancel = true
    }
    */
    		//
    		$$invalidate(9, maybe_event_how_long = real_start.how_long);

    		$$invalidate(29, maybe_event_index = real_start.index);
    		$$invalidate(10, maybe_event_time = real_start.time);
    		maybe_event_half_hour = real_start.on_half_hour;

    		//
    		$$invalidate(3, maybe_event_topic = real_start.label);

    		$$invalidate(4, maybe_event_id = real_start.person_id);
    		$$invalidate(5, maybe_event_email = real_start.email);
    		$$invalidate(6, maybe_event_contact_phone = real_start.contact_phone);
    		$$invalidate(7, maybe_event_zoom = real_start.on_zoom);
    		$$invalidate(8, maybe_event_in_person = real_start.in_person);

    		//
    		$$invalidate(13, show_editor = true);

    		//
    		if (editor_for_new) {
    			let current_ub = 0;
    			let i = maybe_event_index;

    			while (++i < 48) {
    				current_ub += ONE_HALF_HOUR_MINUTES$3;
    				let nxt_slot = all_day_list[i];
    				if (nxt_slot.use !== USE_AS_OPEN$4) break;
    			}

    			$$invalidate(11, maybe_event_ub = current_ub);
    		} else if (editor_for_update) {
    			// can increase the duration of the event
    			let current_ub = 0;

    			let i = maybe_event_index;

    			while (++i < 48) {
    				current_ub += ONE_HALF_HOUR_MINUTES$3;
    				let nxt_slot = all_day_list[i];
    				if (nxt_slot.use !== USE_AS_OPEN$4 && nxt_slot.label !== maybe_event_topic) break;
    			}

    			$$invalidate(11, maybe_event_ub = current_ub);
    		}
    	} //

    	function publish_event_request(ev) {
    		let ev_data = all_day_list[maybe_event_index];
    		ev_data.use = USE_AS_MEET$3;
    		hide_editor();
    		$$invalidate(31, changed_event = true);
    		$$invalidate(26, day_event_count++, day_event_count);
    	} //

    	function publish_event_update(ev) {
    		let model_ev = all_day_list[maybe_event_index];
    		model_ev.use = USE_AS_MEET$3;
    		hide_editor();
    		model_ev.changed = false;
    		let total_time = model_ev.how_long;
    		let ch_i = maybe_event_index;

    		while (total_time > 0) {
    			total_time -= 30;
    			ch_i++;

    			if (total_time > 0) {
    				let ntxt_slot = all_day_list[ch_i];
    				ntxt_slot.changed = false;
    				ntxt_slot.use = USE_AS_OPEN$4;
    				ntxt_slot.label = "";
    			}
    		}

    		model_ev.changed = true;
    		$$invalidate(31, changed_event = true);
    	}

    	function publish_event_cancel(ev) {
    		//
    		hide_editor();

    		//
    		$$invalidate(31, changed_event = false);

    		$$invalidate(30, dropped_event = true);
    		$$invalidate(26, day_event_count--, day_event_count);
    	} //

    	const writable_props = [
    		'day',
    		'monthstr',
    		'all_day_list',
    		'day_event_count',
    		'model_how_long',
    		'model_general_class',
    		'slot_of_change'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DayEvents> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		maybe_event_topic = this.value;
    		$$invalidate(3, maybe_event_topic);
    	}

    	function input0_input_handler_1() {
    		maybe_event_id = this.value;
    		$$invalidate(4, maybe_event_id);
    	}

    	function input1_input_handler() {
    		maybe_event_email = this.value;
    		$$invalidate(5, maybe_event_email);
    	}

    	function input2_input_handler() {
    		maybe_event_contact_phone = this.value;
    		$$invalidate(6, maybe_event_contact_phone);
    	}

    	function input1_change_handler() {
    		maybe_event_zoom = this.checked;
    		$$invalidate(7, maybe_event_zoom);
    	}

    	function input2_change_handler() {
    		maybe_event_in_person = this.checked;
    		$$invalidate(8, maybe_event_in_person);
    	}

    	function input3_change_input_handler() {
    		maybe_event_how_long = to_number(this.value);
    		($$invalidate(9, maybe_event_how_long), $$invalidate(28, model_how_long));
    	}

    	function input0_input_handler_2() {
    		maybe_event_id = this.value;
    		$$invalidate(4, maybe_event_id);
    	}

    	function input1_input_handler_1() {
    		maybe_event_code = this.value;
    		$$invalidate(12, maybe_event_code);
    	}

    	function input2_change_handler_1() {
    		maybe_event_zoom = this.checked;
    		$$invalidate(7, maybe_event_zoom);
    	}

    	function input3_change_handler() {
    		maybe_event_in_person = this.checked;
    		$$invalidate(8, maybe_event_in_person);
    	}

    	const click_handler = (hour_data, ev) => {
    		handle_change_request(hour_data);
    	};

    	const click_handler_1 = (hour_data, ev) => {
    		handle_change_request(hour_data);
    	};

    	$$self.$$set = $$props => {
    		if ('day' in $$props) $$invalidate(0, day = $$props.day);
    		if ('monthstr' in $$props) $$invalidate(1, monthstr = $$props.monthstr);
    		if ('all_day_list' in $$props) $$invalidate(25, all_day_list = $$props.all_day_list);
    		if ('day_event_count' in $$props) $$invalidate(26, day_event_count = $$props.day_event_count);
    		if ('model_how_long' in $$props) $$invalidate(28, model_how_long = $$props.model_how_long);
    		if ('model_general_class' in $$props) $$invalidate(2, model_general_class = $$props.model_general_class);
    		if ('slot_of_change' in $$props) $$invalidate(27, slot_of_change = $$props.slot_of_change);
    	};

    	$$self.$capture_state = () => ({
    		day,
    		monthstr,
    		all_day_list,
    		day_event_count,
    		model_how_long,
    		model_general_class,
    		slot_of_change,
    		ONE_HOUR,
    		ONE_HALF_HOUR,
    		ONE_QUARTER_HOUR,
    		ONE_QUARTER_HOUR_MINUTES: ONE_QUARTER_HOUR_MINUTES$3,
    		ONE_HALF_HOUR_MINUTES: ONE_HALF_HOUR_MINUTES$3,
    		USE_AS_BLOCK: USE_AS_BLOCK$4,
    		USE_AS_MEET: USE_AS_MEET$3,
    		USE_AS_ACTIVITY: USE_AS_ACTIVITY$4,
    		USE_AS_OPEN: USE_AS_OPEN$4,
    		maybe_event_time,
    		maybe_event_topic,
    		maybe_event_id,
    		maybe_event_email,
    		maybe_event_contact_phone,
    		maybe_event_zoom,
    		maybe_event_in_person,
    		maybe_event_index,
    		maybe_event_half_hour,
    		maybe_event_how_long,
    		maybe_event_lb,
    		maybe_event_ub,
    		maybe_event_step,
    		maybe_event_code,
    		show_editor,
    		editor_for_new,
    		editor_for_update,
    		editor_for_cancel,
    		dropped_event,
    		changed_event,
    		all_day_display,
    		hide_editor,
    		handle_change_request,
    		publish_event_request,
    		publish_event_update,
    		publish_event_cancel
    	});

    	$$self.$inject_state = $$props => {
    		if ('day' in $$props) $$invalidate(0, day = $$props.day);
    		if ('monthstr' in $$props) $$invalidate(1, monthstr = $$props.monthstr);
    		if ('all_day_list' in $$props) $$invalidate(25, all_day_list = $$props.all_day_list);
    		if ('day_event_count' in $$props) $$invalidate(26, day_event_count = $$props.day_event_count);
    		if ('model_how_long' in $$props) $$invalidate(28, model_how_long = $$props.model_how_long);
    		if ('model_general_class' in $$props) $$invalidate(2, model_general_class = $$props.model_general_class);
    		if ('slot_of_change' in $$props) $$invalidate(27, slot_of_change = $$props.slot_of_change);
    		if ('maybe_event_time' in $$props) $$invalidate(10, maybe_event_time = $$props.maybe_event_time);
    		if ('maybe_event_topic' in $$props) $$invalidate(3, maybe_event_topic = $$props.maybe_event_topic);
    		if ('maybe_event_id' in $$props) $$invalidate(4, maybe_event_id = $$props.maybe_event_id);
    		if ('maybe_event_email' in $$props) $$invalidate(5, maybe_event_email = $$props.maybe_event_email);
    		if ('maybe_event_contact_phone' in $$props) $$invalidate(6, maybe_event_contact_phone = $$props.maybe_event_contact_phone);
    		if ('maybe_event_zoom' in $$props) $$invalidate(7, maybe_event_zoom = $$props.maybe_event_zoom);
    		if ('maybe_event_in_person' in $$props) $$invalidate(8, maybe_event_in_person = $$props.maybe_event_in_person);
    		if ('maybe_event_index' in $$props) $$invalidate(29, maybe_event_index = $$props.maybe_event_index);
    		if ('maybe_event_half_hour' in $$props) maybe_event_half_hour = $$props.maybe_event_half_hour;
    		if ('maybe_event_how_long' in $$props) $$invalidate(9, maybe_event_how_long = $$props.maybe_event_how_long);
    		if ('maybe_event_lb' in $$props) $$invalidate(18, maybe_event_lb = $$props.maybe_event_lb);
    		if ('maybe_event_ub' in $$props) $$invalidate(11, maybe_event_ub = $$props.maybe_event_ub);
    		if ('maybe_event_step' in $$props) $$invalidate(19, maybe_event_step = $$props.maybe_event_step);
    		if ('maybe_event_code' in $$props) $$invalidate(12, maybe_event_code = $$props.maybe_event_code);
    		if ('show_editor' in $$props) $$invalidate(13, show_editor = $$props.show_editor);
    		if ('editor_for_new' in $$props) $$invalidate(14, editor_for_new = $$props.editor_for_new);
    		if ('editor_for_update' in $$props) $$invalidate(15, editor_for_update = $$props.editor_for_update);
    		if ('editor_for_cancel' in $$props) $$invalidate(16, editor_for_cancel = $$props.editor_for_cancel);
    		if ('dropped_event' in $$props) $$invalidate(30, dropped_event = $$props.dropped_event);
    		if ('changed_event' in $$props) $$invalidate(31, changed_event = $$props.changed_event);
    		if ('all_day_display' in $$props) $$invalidate(17, all_day_display = $$props.all_day_display);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*model_how_long*/ 268435456) {
    			if (typeof model_how_long === 'number') {
    				$$invalidate(9, maybe_event_how_long = model_how_long);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*all_day_list, maybe_event_index, maybe_event_how_long, maybe_event_topic, maybe_event_id, maybe_event_email, maybe_event_contact_phone, maybe_event_zoom, maybe_event_in_person, model_general_class*/ 570426364 | $$self.$$.dirty[1] & /*changed_event*/ 1) {
    			if (changed_event && all_day_list !== undefined) {
    				$$invalidate(31, changed_event = false);
    				let model_ev = all_day_list[maybe_event_index];
    				model_ev.changed = true;
    				model_ev.how_long = maybe_event_how_long;
    				model_ev.label = maybe_event_topic;
    				model_ev.person_id = maybe_event_id;
    				model_ev.email = maybe_event_email;
    				model_ev.contact_phone = maybe_event_contact_phone;
    				model_ev.on_zoom = maybe_event_zoom;
    				model_ev.in_person = maybe_event_in_person;

    				if (model_general_class) {
    					$$invalidate(27, slot_of_change = model_ev);
    				}

    				let total_time = maybe_event_how_long;
    				let ch_i = maybe_event_index;

    				while (total_time > 0) {
    					total_time -= 30;
    					ch_i++;

    					if (total_time > 0) {
    						let ntxt_slot = all_day_list[ch_i];
    						ntxt_slot.changed = true;
    						ntxt_slot.use = model_ev.use;
    						ntxt_slot.how_long = model_ev.how_long;
    						ntxt_slot.label = model_ev.label;

    						//
    						ntxt_slot.person_id = model_ev.person_id;

    						ntxt_slot.email = model_ev.email;
    						ntxt_slot.contact_phone = model_ev.contact_phone;
    						ntxt_slot.on_zoom = model_ev.on_zoom;
    						ntxt_slot.in_person = model_ev.in_person;

    						//
    						$$invalidate(25, all_day_list[ch_i] = ntxt_slot, all_day_list);
    					}
    				}

    				$$invalidate(25, all_day_list[maybe_event_index] = model_ev, all_day_list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*dropped_event, all_day_list, maybe_event_index, maybe_event_how_long*/ 1644167680) {
    			if (dropped_event && all_day_list !== undefined) {
    				$$invalidate(30, dropped_event = false);
    				let model_ev = all_day_list[maybe_event_index];
    				model_ev.how_long = 15;
    				model_ev.label = "";
    				model_ev.person_id = "";
    				model_ev.email = "";
    				model_ev.contact_phone = "";
    				model_ev.on_zoom = false;
    				model_ev.in_person = false;
    				model_ev.use = USE_AS_OPEN$4;
    				let total_time = maybe_event_how_long;
    				let ch_i = maybe_event_index;

    				while (total_time > 0) {
    					total_time -= 30;
    					ch_i++;

    					if (total_time > 0) {
    						let ntxt_slot = all_day_list[ch_i];
    						ntxt_slot.changed = true;
    						ntxt_slot.use = model_ev.use;
    						ntxt_slot.how_long = model_ev.how_long;
    						ntxt_slot.label = model_ev.label;

    						//
    						ntxt_slot.person_id = model_ev.person_id;

    						ntxt_slot.email = model_ev.email;
    						ntxt_slot.contact_phone = model_ev.contact_phone;
    						ntxt_slot.on_zoom = model_ev.on_zoom;
    						ntxt_slot.in_person = model_ev.in_person;

    						//
    						ntxt_slot.use = USE_AS_OPEN$4;

    						//
    						$$invalidate(25, all_day_list[ch_i] = ntxt_slot, all_day_list);
    					}
    				}

    				$$invalidate(25, all_day_list[maybe_event_index] = model_ev, all_day_list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*all_day_list*/ 33554432) {
    			$$invalidate(17, all_day_display = all_day_list);
    		}
    	};

    	return [
    		day,
    		monthstr,
    		model_general_class,
    		maybe_event_topic,
    		maybe_event_id,
    		maybe_event_email,
    		maybe_event_contact_phone,
    		maybe_event_zoom,
    		maybe_event_in_person,
    		maybe_event_how_long,
    		maybe_event_time,
    		maybe_event_ub,
    		maybe_event_code,
    		show_editor,
    		editor_for_new,
    		editor_for_update,
    		editor_for_cancel,
    		all_day_display,
    		maybe_event_lb,
    		maybe_event_step,
    		hide_editor,
    		handle_change_request,
    		publish_event_request,
    		publish_event_update,
    		publish_event_cancel,
    		all_day_list,
    		day_event_count,
    		slot_of_change,
    		model_how_long,
    		maybe_event_index,
    		dropped_event,
    		changed_event,
    		input0_input_handler,
    		input0_input_handler_1,
    		input1_input_handler,
    		input2_input_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_input_handler,
    		input0_input_handler_2,
    		input1_input_handler_1,
    		input2_change_handler_1,
    		input3_change_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class DayEvents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$9,
    			create_fragment$9,
    			safe_not_equal,
    			{
    				day: 0,
    				monthstr: 1,
    				all_day_list: 25,
    				day_event_count: 26,
    				model_how_long: 28,
    				model_general_class: 2,
    				slot_of_change: 27
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DayEvents",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*day*/ ctx[0] === undefined && !('day' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'day'");
    		}

    		if (/*monthstr*/ ctx[1] === undefined && !('monthstr' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'monthstr'");
    		}

    		if (/*all_day_list*/ ctx[25] === undefined && !('all_day_list' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'all_day_list'");
    		}

    		if (/*model_how_long*/ ctx[28] === undefined && !('model_how_long' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'model_how_long'");
    		}

    		if (/*model_general_class*/ ctx[2] === undefined && !('model_general_class' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'model_general_class'");
    		}

    		if (/*slot_of_change*/ ctx[27] === undefined && !('slot_of_change' in props)) {
    			console.warn("<DayEvents> was created without expected prop 'slot_of_change'");
    		}
    	}

    	get day() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set day(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get monthstr() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set monthstr(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all_day_list() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all_day_list(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get day_event_count() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set day_event_count(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get model_how_long() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model_how_long(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get model_general_class() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model_general_class(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get slot_of_change() {
    		throw new Error("<DayEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot_of_change(value) {
    		throw new Error("<DayEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*!
     * calendar.js: inspired by the calendar module from Python
     * Copyright(c) 2011 Luciano Ramalho <luciano@ramalho.org>
     * MIT Licensed
     */

    class CalendarException {
        constructor(message) {
            this.message = message;
            this.toString = () => {
                return "CalendarException: " + this.message;
            };
        }
    }
    class Calendar {
        static JAN = 0;
        static FEB = 1;
        static MAR = 2;
        static APR = 3;
        static MAY = 4;
        static JUN = 5;
        static JUL = 6;
        static AUG = 7;
        static SEP = 8;
        static OCT = 9;
        static NOV = 10;
        static DEC = 11;

        constructor(firstWeekDay) {
            this.firstWeekDay = firstWeekDay || 0;
        }
        weekStartDate(date) {
            let startDate = new Date(date.getTime());
            while (startDate.getDay() !== this.firstWeekDay) {
                startDate.setDate(startDate.getDate() - 1);
            }
            return startDate;
        }
        monthDates(year, month, dayFormatter, weekFormatter) {
            if ((typeof year !== "number") || (year < 1970)) {
                throw new CalendarException('year must be a number >= 1970');
            }
            if ((typeof month !== "number") || (month < 0) || (month > 11)) {
                throw new CalendarException('month must be a number (Jan is 0)');
            }
            let weeks = new Array();
            let date = this.weekStartDate(new Date(year, month, 1));
            let count = 0;
            do {
                let week = new Array();
                for (let i = 0; (i < 7); i++) {
                    let rslt = (dayFormatter ? dayFormatter(date, count++) : date);
                    week.push(rslt);
                    date = new Date(date.getTime());
                    date.setDate(date.getDate() + 1);
                }
                weeks.push(weekFormatter ? weekFormatter(week) : week);
            } while ((date.getMonth() <= month) && (date.getFullYear() === year));
            return weeks;
        }
        monthDays(year, month) {
            let getDayOrZero = (date) => {
                return date.getMonth() === month ? date.getDate() : 0;
            };
            return this.monthDates(year, month, getDayOrZero);
        }
        monthMap(year, month, InfoClass) {
            let getDayOrFalse = (date, count) => {
                return (date.getMonth() === month) ? `${date.getDate()},${count}` : false;
            };
            let month_table = this.monthDates(year, month, getDayOrFalse);
            let mlist = month_table.flat();
            let the_map = false;
            if (InfoClass !== undefined) {
                the_map = {};
                for (let day of mlist) {
                    if (day !== false) {
                        let ds = day.toString();
                        let ifc = new InfoClass(...((ds.split(',').map(dd => parseInt(dd)))));
                        the_map[ds] = ifc;
                        if ( typeof ifc.fill_day === 'function' ) {
                            ifc.fill_day(year,month,ds); 
                        }
                    }
                }
            }
            let month_map = {
                "table": month_table,
                "list": mlist,
                "map": the_map
            };
            return month_map;
        }
        monthText(year, month) {
            if (typeof year === "undefined") {
                let now = new Date();
                year = now.getFullYear();
                month = now.getMonth();
            }
            let getDayOrBlank = (date) => {
                let s = date.getMonth() === month ? date.getDate().toString() : "  ";
                while (s.length < 2)
                    s = " " + s;
                return s;
            };
            let weeks = this.monthDates(year, month, getDayOrBlank, (week) => { return week.join(" "); });
            return weeks.join("\n");
        }
    }

    //
    function hours_of(lapse) {
        let hrs = ((lapse/1000)/3600);
        return hrs
    }

    //
    function calc_days(t_time) {
        let days = Math.trunc((t_time/1000)/3600/24);
        return days
    }

    //
    function same_day(t1,t2) {
        return (new Date(t1).getDate() === (new Date(t2).getDate()))
    }

    //
    function first_day_of_month(a_date) {
        // a_date should be a Date object
        let mo = a_date.getMonth();
        let year = a_date.getFullYear();

        let nd = new Date(year,mo);
        let t = nd.getTime();
        return t
    }


    function first_day_of_next_month(a_date) {
        // a_date should be a Date object
        let mo = a_date.getMonth();
        let year = a_date.getFullYear();

        mo = (mo + 1) % 12;
        if ( mo === 0 ) year++;

        let nd = new Date(year,mo);
        let t = nd.getTime();
        return t
    }


    function lower_month_bounday(a_time) {
        let arg_date = new Date(a_time);
        return first_day_of_month(arg_date)
    }

    function next_month_start(a_time) {
        let arg_date = new Date(a_time);
        return first_day_of_next_month(arg_date)
    }

    //
    function in_interval(instant,t_start,t_end) {
        //console.log("in_interval",instant,t_start,t_end)
        if ( (t_start <= instant) && (instant <= t_end) ) return true
        return false
    }

    // ---- TimeSlotAgenda ---- ---- ---- ---- ---- ---- ----
    class TimeSlotAgenda {

        //
        constructor(day,index) {
            this.day = day;
            this.index = index;
            this.start_time = -Infinity;
            this.end_time = Infinity;
            this.all_day = {};
        }

        // set_start_and_end
        set_start_and_end(st,et) {
            this.start_time = st;
            this.end_time = et;
        }

        // ---- add_slot
        // returns a conflict if found (false otherwise)... 
        add_slot(a_slot) {
            if ( !a_slot ) return false
            //
            let conflicts = [];
            //
            let ba = a_slot.begin_at; 
            let ea = a_slot.end_at; 

            for ( let sky in this.all_day ) {
                let slot = this.all_day[sky];
                if ( in_interval(slot.begin_at, ba,ea) || in_interval(slot.end_at, ba,ea) ) {
                    conflicts.push(slot);
                } else if ( in_interval(ba,slot.begin_at,slot.end_at) || in_interval(ea,slot.begin_at, slot.end_at) ) {
                    conflicts.push(slot);
                }
            }
            //
            if ( conflicts.length ) return conflicts
            else {
                this.all_day[a_slot.begin_at] = a_slot;
            }
            return false
        }


        // ---- find_slot 
        find_slot(start_time) {
            let slot = this.all_day[start_time];
            if ( slot ) return slot
            for ( let sky in this.all_day ) {
                let slot = this.all_day[sky];
                if ( in_interval(start_time,slot.begin_at,slot.end_at)  ) return slot
            }
            return false
        }

        // ---- remove_slot
        remove_slot(a_slot) {
            if ( !a_slot ) return
            let st = a_slot.begin_at;
            if ( this.all_day[st] ) {
                delete this.all_day[st];
            }
        }


        // ---- add_all_slots
        add_all_slots(slot_list) {
            let conflicts = [];
            for ( let a_slot of slot_list ) {
                if ( a_slot ) {
                    let conflict = this.add_slot(a_slot);
                    if ( conflict ) {
                        conflicts.push(...conflict);
                    }    
                }
            }
            if ( conflicts.length ) return conflicts
            return false
        }

    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


    const g_cal = new Calendar(0);

    const TWENTY_FOUR$1 = (24*3600*1000);


    // ---- overlap
    function overlap(a_month,a_slot) {
        if ( (a_slot.end_time < a_month.start_time) || (a_month.end_time < a_slot.start_time) ) {
            return false
        }
        if ( (a_slot.start_time < a_month.start_time) && (a_slot.end_time < a_month.end_time) ) {
            return 1
        } else if ( a_month.start_time < a_slot.start_time ) {
            if ( a_month.end_time <= a_slot.end_time ) {
                return 2
            }
            return 3  // contained
        } else if ( (a_month.start_time >= a_slot.start_time) && (a_month.end_time <= a_slot.end_time) ) {
            return 4  // month is contained  ... condition check not stricly necessary
        }
        return false
    }


    // ---- MonthContainer
    class MonthContainer {

        // ----
        constructor(start_time,AgendaClass) {
            if ( Array.isArray(start_time) ) {
                this.date = new Date(...start_time);
            } else {
                this.date = new Date(start_time);
            }
            this.start_time = first_day_of_month(this.date);
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();
            if ( isNaN(this.year) || isNaN(this.month) ) throw "Nan for year or month in MontainContainer constructor"
            //
            this.agenda_maker = (AgendaClass !== undefined) ? AgendaClass : TimeSlotAgenda;
            if ( (AgendaClass !== undefined) && !(AgendaClass.prototype instanceof TimeSlotAgenda) ) {
                this.agenda_maker = TimeSlotAgenda;
            }
            //
            this.cal = g_cal.monthMap(this.year, this.month, this.agenda_maker);
            this.init_slot_times();
            this.end_time = this.last_day_time();
        }

        init_slot_times() {
            let st = this.start_time;
            let access_tsa = this.cal.map;
            let tsa_keys = Object.keys(access_tsa);
            tsa_keys.sort();
            for ( let key of tsa_keys ) {
                let tsa = access_tsa[key];
                if ( tsa ) {
                    tsa.set_start_and_end(st,st + TWENTY_FOUR$1-1);
                }
                st += TWENTY_FOUR$1;
            }
        }

        last_day_time()  {
            let lday_tsa = this.last_day();
            return lday_tsa ? lday_tsa.end_time : Infinity
        }


        last_day() {
            let d_list = this.cal.list;
            if ( d_list ) {
                let idx = d_list.lastIndexOf(false);
                if ( (idx === -1) || (idx < 7) ) idx = d_list.length - 1;
                let lday_ky = false;
                while ( lday_ky === false ) {
                    idx--;
                    lday_ky = d_list[idx];
                }
                
                d_list[idx-1];
                let lday = this.cal.map[lday_ky];
                return lday
            }
            return false
        }

        day_of(a_time) {
            let lapse = a_time - this.start_time;
            return calc_days(lapse)
        }

        get_day_agenda(indx) {
            let da_ky = this.map.list[indx];
            if ( da_ky ) {
                let tsa = this.cal.map[da_ky];
                return tsa
            }
            return false
        }

        add_agenda_list(day_agenda) {   // for deserializing
            if ( day_agenda === undefined ) return false
            let idx = day_agenda.index;
            let ts_agenda_ky = this.cal.list[idx];
            if ( ts_agenda_ky ) {
                let tsa = this.cal.map[ts_agenda_ky];
                if ( tsa === undefined ) {
                    tsa = new this.agenda_maker(day_agenda.day,idx);
                    this.cal.map[ts_agenda_ky] = tsa;
                }
                //
                let conflicts = tsa.add_all_slots(day_agenda.slots);
                if ( conflicts ) return conflicts
            }
            return false
        }

        add_time_slot(a_t_slot) {
            let ovl = overlap(this,a_t_slot);
            if ( ovl !== false ) {
                //
                let slots = false;
                //
                switch (ovl) {
                    case 1: {
                        slots = a_t_slot.get_range(this.start_time,a_t_slot.end_time);
                        break; 
                    }
                    case 2: {
                        slots = a_t_slot.each_day;
                        break;
                    }
                    case 3:  {
                        slots = a_t_slot.get_range(a_t_slot.start_time,a_t_slot.end_time);
                        break;
                    }
                    case 4:   {
                        slots = a_t_slot.get_range(this.start_time,this.end_time);
                        break;
                    }
                }
                //
                if ( slots && slots.length ) {
                    let conflicts = [];
                    let a_slot = slots[0];
                    if ( a_slot ) {
                        let mo_i = this.day_of(a_slot.begin_at);
                        a_slot = slots[slots.length - 1];
                        let mo_end = this.day_of(a_slot.end_at);
                        while ( mo_i < mo_end ) {
                            let ts_agenda_ky = this.cal.list[mo_i];
                            let ts_agenda = this.cal.map[ts_agenda_ky];
                            if ( ts_agenda ) {
                                let slot_conflicts = ts_agenda.add_slot(a_slot);
                                if ( slot_conflicts ) {
                                    conflicts = conflicts.push(...slot_conflicts);
                                }    
                            }
                            mo_i++;
                        }    
                    }
                    //
                    if ( conflicts.length ) return conflicts
                }
                return true
            }
            return false
        }


        remove_time_slot(start_time) {
            let day = this.day_of(start_time);
            let da_ky = this.cal.list[day];
            if ( da_ky ) {
                let tsa = this.cal.map[da_ky];
                if ( tsa ) {
                    let a_slot = tsa.find_slot(start_time);
                    tsa.remove_slot(a_slot);
                }    
            }
        }

        remove_all_of_time_slot(a_t_slot) {
            let month_set = a_t_slot.get_range(this.start_time,this.end_time);
            for ( let a_slot of month_set ) {
                this.remove_time_slot(a_slot.begin_at);
            }
        }

    }

    // a list of month containers ... managed sliding window relative to a DB
    // Time line has the conflicts publication...

    const DEFAULT_MAX_WINDOW = 100;

    class TimeLine {
        // 
        constructor(conf,AgendaClass) {
            //
            this.in_app_month_store = {};  // all the months that have been fetched or injested
            this.month_start_time_window = []; // the window of time that have been fetched or we want fetched
            //
            this.agenda_maker = AgendaClass;   /// let the month container sort it out
            //
            this.all_events_labels_to_time = {
                "example" : [0,false]  // start_time, slot data structure 
            };
            //
            this.month_fetcher = conf.fetcher;
            if ( (conf.fetcher === undefined) || typeof this.month_fetcher.get !== 'function' ) {
                this.month_fetcher = false;
            }
            //
            if ( typeof conf.time_line_fetcher === 'function' ) {
                let t_fetch = conf.time_line_fetcher;
                let self = this;
                setTimeout(async () => {
                    let t_data = await t_fetch();
                    if ( t_data ) {
                        self.all_events_labels_to_time = t_data.label_to_time;
                    }
                },0);
            }
            this.time_line_sender = false;
            if ( typeof conf.time_line_sender === 'function' ) {
                this.time_line_sender = conf.time_line_sender;
            }
            //
            this.month_sender = conf.send_and_store;
            //
            this.window_size = conf.window_size ? conf.window_size :  DEFAULT_MAX_WINDOW;
            this.conflict_publisher = conf.conflict_publisher;
        }


        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        // send_month
        send_month(start_time) {
            let st = lower_month_bounday(start_time);
            let mo = this.in_app_month_store[st];
            if ( this.month_sender ) {
                this.month_sender(mo);
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        // publish_conflicts
        publish_conflicts(conflicts) {
            if ( typeof this.conflict_publisher === 'function' ) {
                try {
                    this.conflict_publisher(conflicts);
                } catch(e) {
                    console.log(e);
                }
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        // filter_existing_times
        #filter_existing_times(st_list) {
            let remaining = [];
            for ( let st of st_list ) {
                if ( this.in_app_month_store[st] === undefined ) {
                    remaining.push(st);
                }
            }
            return remaining
        }

        //
        // adjacent_start_times
        missing_adjacent_start_times(start_time) {
            let adj_list = [];
            //
            if ( start_time < this.month_start_time_window[0] ) {
                let first_starter = this.month_start_time_window[0];
                adj_list.push(start_time);
                while ( start_time < first_starter ) {
                    start_time = next_month_start(start_time);
                    adj_list.push(start_time);
                }
            } else if ( start_time > this.month_start_time_window[this.month_start_time_window.length -1] ) {
                let first_starter = this.month_start_time_window[this.month_start_time_window.length -1];
                while ( start_time > first_starter ) {
                    first_starter = next_month_start(first_starter);
                    adj_list.push(first_starter);
                }
            }
            
            adj_list = this.#filter_existing_times(adj_list);
            return adj_list
        }


        // trim_to_window
        #trim_to_window(start_time) {   // mostly about trimming the time list (age out the map)
            let nm = this.month_start_time_window.length;
            if ( nm < this.window_size ) return
            else {
                //
                let no2 = Math.floor(nm/2);
                let st = this.month_start_time_window[no2];
                if ( st > start_time ) {
                    let delta = (nm - this.window_size);
                    this.month_start_time_window.splice(0,delta);
                } else {
                    let delta = (nm - this.window_size);
                    let start = this.window_size;
                    this.month_start_time_window.splice(start,delta);
                }
                //
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        //
        // injest_month
        async injest_month(start_time) {
            //
            if ( !(this.month_fetcher) ) return
            //
            if ( this.in_app_month_store[start_time] === undefined ) {
                //
                start_time = lower_month_bounday(start_time);
                //
                let window_based_list = this.missing_adjacent_start_times(start_time);  // return missing months as a list
                if ( window_based_list.length ) {
                    let month_data = await this.month_fetcher.get(window_based_list);
                    if ( month_data ) {
                        for ( let mo_moment in month_data ) {
                            //
                            let i_mo_moment = parseInt(mo_moment);
                            let moc = new MonthContainer(i_mo_moment,this.agenda_maker);
                            this.in_app_month_store[mo_moment] = moc;   /// only place the missing ones
                            this.month_start_time_window.push(i_mo_moment);
                            //
                            let mo = month_data[mo_moment];  // the data from the fetcher service (whatever that is)
                            let conflicts = moc.add_agenda_list(mo.agenda);
                            //
                            if ( conflicts && conflicts.length ) {
                                this.publish_conflicts(conflicts);
                            }
                        }
                        this.month_start_time_window.sort();
                        this.#trim_to_window(start_time);
                    }
                }
            }
        }

        async scroll_right(n) {
            let st = 0;
            if ( this.month_start_time_window.length === 0) {
                st = lower_month_bounday(Date.now());
            } else {
                st = this.month_start_time_window[this.month_start_time_window.length - 1];
            }
            while ( n-- ) {
                st = next_month_start(st);
            }
            await this.injest_month(st);
        }

        async scroll_left(n) {
            let st = 0;
            if ( this.month_start_time_window.length === 0 ) {
                st = lower_month_bounday(Date.now());
            } else {
                st = this.month_start_time_window[0];
            }
            while ( n-- ) {
                st -= 3600*24;  // go back a day
                st = lower_month_bounday(st);
            }
            await this.injest_month(st);
        }

        // remove_slot_from_store ---- local slot removal 
        remove_slot_from_store(a_t_slot) {  // 
            let st = a_t_slot.start_time;
            let et = a_t_slot.end_time;

            st = lower_month_bounday(st);
            et = next_month_start(et);
            while ( st < et ) {
                let mo = this.in_app_month_store[st];
                if ( mo ) {
                    mo.remove_all_of_time_slot(a_t_slot);
                }
                st = next_month_start(st);    
            }
        }

        remove_slot_everywhere(label) {
            if ( this.all_events_labels_to_time ) {
                let slot_data = this.all_events_labels_to_time[label];
                delete this.all_events_labels_to_time[label];
                //
                let a_t_slot = slot_data[1];
                if ( a_t_slot ) {
                    this.remove_slot_from_store(a_t_slot);
                    if ( this.time_line_sender ) {
                        // send the new time line, send the slot that is being removed from server side 
                        // stored months
                        this.time_line_sender(this.all_events_labels_to_time,a_t_slot);
                    }
                }
            }
        }

        save_time_list(do_send_months) {
            if ( this.time_line_sender ) {
                // send the new time line, state specifically that no slot is being removed...
                this.time_line_sender(this.all_events_labels_to_time,false);
            }
            if ( do_send_months ) {
                for ( let st of this.month_start_time_window ) {
                    this.send_month(st);
                }
            }
        }

    }

    const TWENTY_FOUR = 24*3600*1000;


    class Slot {

        constructor(label,begin_t,end_t) {
            this.begin_at = begin_t ? begin_t : 0;
            this.end_at = end_t ? end_t : 0;
            this.label = label;
        }

        adjust_start(lapse) {     // may be negative
            this.begin_at += lapse;
        }

        adjust_end(lapse) {     // may be negative
            this.end_at += lapse;
        }

    }


    class TimeSlot {

        static USE_AS_BLOCK = "block"
        static USE_AS_MEET = "meeting"
        static USE_AS_ACTIVITY = "activity"
        static USE_AS_OPEN = "open"

        constructor(label,use_case,start_time,end_time,break_apart,importance,weekends,daily_dur,filler,SlotClass) {
            this.start_time = start_time;    // may be months apart
            this.end_time = end_time;
            this.break_apart = break_apart;
            this.importance = importance;
            this.weekends = weekends;
            this.use_case = use_case;
            this.daily_duration = daily_dur ? daily_dur : ((same_day(start_time,end_time)) ? (end_time - start_time) : 0);
            this.label = label;
            this.each_day = [];   /// constructed finally in init...
            //
            this.slot_maker = ( SlotClass !== undefined ) ? SlotClass : Slot;
            if ( ( SlotClass !== undefined ) && !(SlotClass.prototype instanceof Slot) ) {
                this.slot_maker = Slot;
            }
            //
            this.init(filler);
        }

        init(filler) {
            this.lapse = (this.end_time - this.start_time);
            this.lapse_sec  = (this.lapse)/1000;
            this.lapse_hr = this.lapse_sec/3600;
            this.lapse_days = this.lapse_hr/24;
            this.lapse_mo = this.lapse_days/30; /// this approximate
            //
            if ( (filler === undefined) || (filler === false) ) {
                this.each_day = [];
                for ( let i = 0; i < this.lapse_days; i++ ) {
                    this.each_day.push(new this.slot_maker(this.label));
                }
            } else {
                this.each_day = Array.from(Array(this.lapse_days),filler);
                this.#trim_slots();
                this.#filter_slots();
                this.#sort_slots();
            }

            this.set_beginnings();
            this.set_endings();
        }

        #trim_slots() {
            while ( this.each_day[0] === false ) this.each_day.shift();
            if ( this.each_day.length ) {
                while ( this.each_day[this.each_day.length - 1] === false ) this.each_day.pop();
            }
        }

        #filter_slots() {
            this.each_day = this.each_day.filter((a_slot) => a_slot);
        }

        #sort_slots() {
            this.each_day.sort((a,b) => { return  (b && a) ? (b.start_at - a.start_at) : (a ? -1 : 1)  }); 
        }

        split(start_of_split,end_of_split) {
            if ( ( this.start_time <= start_of_split ) && (this.end_time >= end_of_split) ) {
                let s_day_index = calc_days(start_of_split - this.start_time);
                let e_day_index = calc_days(this.end_time - end_of_split) + 1;
                for ( let i = s_day_index; i < e_day_index; i++ ) {
                    let a_slot = this.each_day[i];
                    if ( a_slot ) {
                        if ( (a_slot.begin_at < start_of_split) && (hours_of((start_of_split - a_slot.begin_at)) < 24) ) {
                            a_slot.adjust_start(start_of_split -  a_slot.begin_at);
                            this.start_time = a_slot.begin_at;
                        } else if ( a_slot.end_at > end_of_split && (hours_of((a_slot.end_at - end_of_split)) < 24) ) {
                            a_slot.adjust_end(end_of_split -  a_slot.end_at);
                            this.end_time = a_slot.end_at;
                        } else {
                            this.each_day[i] = false;  // remove the event
                        }
                    }
                }
            }

            let first_start_time = false;
            let first_end_time = false;
            //
            let second_start_time = false;
            let second_end_time = false;

            let part_1 = [];
            let part_2 = [];

            for ( let a_day of this.each_day ) {
                if ( a_day && (first_start_time === false) ) {
                    first_start_time = a_day.begin_at;
                    part_1.push(a_day);
                } else if ( a_day && (first_end_time === false) ) {
                    first_end_time = a_day.end_at;
                    part_1.push(a_day);
                } else if ( a_day && (second_start_time === false)  ) {
                    second_start_time = a_day.begin_at;
                    part_2.push(a_day);
                } else if ( a_day && (second_end_time === false)  ) {
                    second_end_time = a_day.end_at;
                    part_2.push(a_day);
                }
            }

            let early = false;
            let later = false;

            if ( first_end_time ) {
                let start_time = first_start_time;
                let end_time = first_end_time;
                let use_case = this.use_case;
                let break_apart = this.break_apart;
                let importance = this.importance;
                let weekends = this.weekends;
                let label = this.label;
                early = new TimeSlot(label,use_case,start_time,end_time,break_apart,importance,weekends);
                let n = early.each_day.length;
                for ( let i = 0; i < n; i++ ) {
                    early.each_day[i] = part_1.shift();
                }

            }

            if ( second_start_time ) {
                let start_time = second_start_time;
                let end_time = second_end_time;
                let break_apart = this.break_apart;
                let importance = this.importance;
                let weekends = this.weekends;
                let label = this.label;
                later = new TimeSlot(label,use_case,start_time,end_time,break_apart,importance,weekends);
                for ( let i = 0; i < n; i++ ) {
                    later.each_day[i] = part_2.shift();
                }
            }

            if ( early ) early.#filter_slots();
            if ( later ) later.#filter_slots();

            return [early,later]
        }


        grow_sooner_days(num_days) {
            let first_day = this.each_day[0];
            for ( let i = 0; i < num_days; i++ ) {
                let a_slot = new this.slot_maker(this.label,first_day.begin_at,first_day.end_at);
                this.each_day.unshift(a_slot);
            }
            this.#sort_slots();
        }

        grow_later_days(num_days) {
            let last_day = this.each_day[this.each_day.length-1];
            for ( let i = 0; i < num_days; i++ ) {
                let a_slot = new this.slot_maker(this.label,last_day.begin_at,last_day.end_at);
                a_slot.begin_at = last_day.begin_at;
                a_slot.end_at = last_day.end_at;
                this.each_day.push(a_slot);
            }
            this.#sort_slots();
        }

        set_beginnings() { // a time from Date calculation
            let day_start = this.start_time;
            for ( let a_slot of this.each_day ) {
                if ( a_slot ) a_slot.begin_at = day_start;
                day_start += TWENTY_FOUR;
            }
        }

        set_endings() {  // a time is seconds into the day
            this.each_day.forEach((a_slot) => {
                if ( a_slot ) a_slot.end_at = a_slot.begin_at + this.daily_duration;
            });
        }

        shift_slots(delta) {
            this.each_day.forEach((a_slot) => {
                if ( a_slot ) {
                    a_slot.begin_at += delta;
                    a_slot.end_at += delta;
                }
            });        
        }

        drop_by_pattern(pat_fun) {
            this.each_day = this.each_day.filter((a_slot) => { return pat_fun(a_slot) });
        }

        set_one_begining(index,a_time) {
            let a_slot = this.each_day[index];
            if ( a_slot ) {
                a_slot.begin_at = a_time;
            }
        }

        set_one_ending(index,a_time) {
            let a_slot = this.each_day[index];
            if ( a_slot ) {
                a_slot.end_at = a_time;
            }
        }

        #merge_first(first_t_slot,second_t_slot) {
            let between_time = (second_t_slot.start_time-first_t_slot.end_time);
            if ( between_time > 0 ) {
                let days_between = calc_days(second_t_slot.start_time - first_t_slot.end_time);
                first_t_slot.grow_later_days(days_between);
                for ( let a_slot of second_t_slot.each_day ) {
                    first_t_slot.each_day.push(a_slot);
                }
            } else {
                let days_overlap = calc_days(second_t_slot.start_time - first_t_slot.end_time);
                if ( second_t_slot.lapse_days > days_overlap ) {
                    let day_1 = (second_t_slot.lapse_days - days_overlap);
                    while ( day_1 < second_t_slot.lapse_days ) {
                        let a_slot = second_t_slot.each_day[day_1++];
                        first_t_slot.each_day.push(a_slot);
                    }
                }
            }
        }

        merge_with(a_time_slot) {
            if ( a_time_slot.start_time < this.start_time ) {
                this.#merge_first(a_time_slot,this);
            } else {
                this.#merge_first(this,a_time_slot);
            }
        }

        merge_with_overlap(a_time_slot) {
            this.each_day = this.each_day.concat(a_time_slot.each_day);
            this.#sort_slots();
        }


        get_range(start_time,end_time) {
            if ( (start_time >= this.start_time) && (end_time <= this.end_time) ) {
                let day_offset = calc_days(start_time - this.start_time);
                let e_day_offset = (this.lapse_days - calc_days(this.end_time - end_time)) + 1;
                let slots = this.each_day.slice(day_offset,e_day_offset);
                return slots
            }
            return []
        }

    }

    let EventDays = {
        TimeLine,
        TimeSlotAgenda,
        MonthContainer,
        TimeSlot,
        Slot
    };

    /* src/TimeSlotEditor.svelte generated by Svelte v3.50.1 */
    const file$8 = "src/TimeSlotEditor.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[62] = list[i];
    	return child_ctx;
    }

    // (289:12) {#if is_open }
    function create_if_block$3(ctx) {
    	let div;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*type_of_activity*/ ctx[19];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (/*selected_activity*/ ctx[16] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[39].call(select));
    			add_location(select, file$8, 290, 20, 9628);
    			attr_dev(div, "class", "svelte-1ci2a8g");
    			add_location(div, file$8, 289, 16, 9602);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selected_activity*/ ctx[16]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[39]),
    					listen_dev(select, "change", /*change_handler*/ ctx[40], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*type_of_activity*/ 524288) {
    				each_value = /*type_of_activity*/ ctx[19];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*selected_activity, type_of_activity*/ 589824) {
    				select_option(select, /*selected_activity*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(289:12) {#if is_open }",
    		ctx
    	});

    	return block;
    }

    // (292:24) {#each type_of_activity as question}
    function create_each_block$5(ctx) {
    	let option;
    	let t0_value = /*question*/ ctx[62].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*question*/ ctx[62];
    			option.value = option.__value;
    			add_location(option, file$8, 292, 28, 9798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(292:24) {#each type_of_activity as question}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div13;
    	let div2;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div1;
    	let span0;
    	let t5;
    	let span1;
    	let input0;
    	let t7;
    	let span2;
    	let input1;
    	let t9;
    	let span3;
    	let input2;
    	let t11;
    	let span4;
    	let input3;
    	let t13;
    	let span5;
    	let input4;
    	let t15;
    	let span6;
    	let input5;
    	let t17;
    	let span7;
    	let input6;
    	let t19;
    	let div12;
    	let div10;
    	let div3;
    	let label0;
    	let t21;
    	let input7;
    	let t22;
    	let div4;
    	let span8;
    	let t24;
    	let t25;
    	let t26;
    	let div5;
    	let span9;
    	let t27;
    	let t28;
    	let t29;
    	let t30;
    	let div6;
    	let label1;
    	let t31;
    	let input8;
    	let t32;
    	let label2;
    	let t33;
    	let input9;
    	let t34;
    	let t35;
    	let div7;
    	let span10;
    	let t37;
    	let t38;
    	let div8;
    	let span11;
    	let t40;
    	let t41;
    	let div9;
    	let label3;
    	let t43;
    	let textarea;
    	let t44;
    	let div11;
    	let dayevents;
    	let updating_slot_of_change;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*is_open*/ ctx[8] && create_if_block$3(ctx);
    	const dayevents_spread_levels = [/*model_day_data*/ ctx[7]];

    	function dayevents_slot_of_change_binding(value) {
    		/*dayevents_slot_of_change_binding*/ ctx[42](value);
    	}

    	let dayevents_props = {};

    	for (let i = 0; i < dayevents_spread_levels.length; i += 1) {
    		dayevents_props = assign(dayevents_props, dayevents_spread_levels[i]);
    	}

    	if (/*slot_of_change*/ ctx[18] !== void 0) {
    		dayevents_props.slot_of_change = /*slot_of_change*/ ctx[18];
    	}

    	dayevents = new DayEvents({ props: dayevents_props, $$inline: true });
    	binding_callbacks.push(() => bind(dayevents, 'slot_of_change', dayevents_slot_of_change_binding));

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "save";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "delete";
    			t3 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Days of Week Pattern:";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "S ";
    			input0 = element("input");
    			t7 = text(" \n            ");
    			span2 = element("span");
    			span2.textContent = "M ";
    			input1 = element("input");
    			t9 = text(" \n            ");
    			span3 = element("span");
    			span3.textContent = "T ";
    			input2 = element("input");
    			t11 = text(" \n            ");
    			span4 = element("span");
    			span4.textContent = "W ";
    			input3 = element("input");
    			t13 = text(" \n            ");
    			span5 = element("span");
    			span5.textContent = "Th ";
    			input4 = element("input");
    			t15 = text(" \n            ");
    			span6 = element("span");
    			span6.textContent = "F ";
    			input5 = element("input");
    			t17 = text(" \n            ");
    			span7 = element("span");
    			span7.textContent = "S ";
    			input6 = element("input");
    			t19 = space();
    			div12 = element("div");
    			div10 = element("div");
    			div3 = element("div");
    			label0 = element("label");
    			label0.textContent = "Name:";
    			t21 = space();
    			input7 = element("input");
    			t22 = space();
    			div4 = element("div");
    			span8 = element("span");
    			span8.textContent = "DB KEY:";
    			t24 = space();
    			t25 = text(/*name*/ ctx[0]);
    			t26 = space();
    			div5 = element("div");
    			span9 = element("span");
    			t27 = text(/*start_time*/ ctx[5]);
    			t28 = text(", ");
    			t29 = text(/*end_time*/ ctx[6]);
    			t30 = space();
    			div6 = element("div");
    			label1 = element("label");
    			t31 = text("open ");
    			input8 = element("input");
    			t32 = space();
    			label2 = element("label");
    			t33 = text("blocked ");
    			input9 = element("input");
    			t34 = space();
    			if (if_block) if_block.c();
    			t35 = space();
    			div7 = element("div");
    			span10 = element("span");
    			span10.textContent = "Start Day: ";
    			t37 = text(/*start_day*/ ctx[3]);
    			t38 = space();
    			div8 = element("div");
    			span11 = element("span");
    			span11.textContent = "End Day: ";
    			t40 = text(/*end_day*/ ctx[4]);
    			t41 = space();
    			div9 = element("div");
    			label3 = element("label");
    			label3.textContent = "Description";
    			t43 = space();
    			textarea = element("textarea");
    			t44 = space();
    			div11 = element("div");
    			create_component(dayevents.$$.fragment);
    			attr_dev(button0, "class", "svelte-1ci2a8g");
    			add_location(button0, file$8, 256, 36, 7730);
    			attr_dev(button1, "class", "svelte-1ci2a8g");
    			add_location(button1, file$8, 256, 81, 7775);
    			attr_dev(div0, "class", "e-control-row svelte-1ci2a8g");
    			add_location(div0, file$8, 256, 8, 7702);
    			set_style(span0, "font-weight", "bold");
    			set_style(span0, "color", "rgb(40,130,90)");
    			attr_dev(span0, "class", "svelte-1ci2a8g");
    			add_location(span0, file$8, 258, 12, 7879);
    			set_style(span1, "font-weight", "bold");
    			attr_dev(span1, "class", "svelte-1ci2a8g");
    			add_location(span1, file$8, 259, 12, 7972);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$8, 259, 52, 8012);
    			set_style(span2, "font-weight", "bold");
    			attr_dev(span2, "class", "svelte-1ci2a8g");
    			add_location(span2, file$8, 260, 12, 8084);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$8, 260, 52, 8124);
    			set_style(span3, "font-weight", "bold");
    			attr_dev(span3, "class", "svelte-1ci2a8g");
    			add_location(span3, file$8, 261, 12, 8196);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$8, 261, 52, 8236);
    			set_style(span4, "font-weight", "bold");
    			attr_dev(span4, "class", "svelte-1ci2a8g");
    			add_location(span4, file$8, 262, 12, 8309);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$8, 262, 52, 8349);
    			set_style(span5, "font-weight", "bold");
    			attr_dev(span5, "class", "svelte-1ci2a8g");
    			add_location(span5, file$8, 263, 12, 8424);
    			attr_dev(input4, "type", "checkbox");
    			add_location(input4, file$8, 263, 53, 8465);
    			set_style(span6, "font-weight", "bold");
    			attr_dev(span6, "class", "svelte-1ci2a8g");
    			add_location(span6, file$8, 264, 12, 8539);
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file$8, 264, 52, 8579);
    			set_style(span7, "font-weight", "bold");
    			attr_dev(span7, "class", "svelte-1ci2a8g");
    			add_location(span7, file$8, 265, 12, 8651);
    			attr_dev(input6, "type", "checkbox");
    			add_location(input6, file$8, 265, 52, 8691);
    			attr_dev(div1, "class", "e-control-row svelte-1ci2a8g");
    			add_location(div1, file$8, 257, 8, 7839);
    			attr_dev(div2, "class", "edit-controls svelte-1ci2a8g");
    			add_location(div2, file$8, 255, 4, 7666);
    			attr_dev(label0, "for", "name-tse-1");
    			attr_dev(label0, "class", "svelte-1ci2a8g");
    			add_location(label0, file$8, 272, 16, 8938);
    			attr_dev(input7, "id", "name-tse-1");
    			attr_dev(input7, "type", "text");
    			add_location(input7, file$8, 272, 55, 8977);
    			attr_dev(div3, "class", "svelte-1ci2a8g");
    			add_location(div3, file$8, 271, 12, 8916);
    			attr_dev(span8, "class", "svelte-1ci2a8g");
    			add_location(span8, file$8, 275, 16, 9091);
    			attr_dev(div4, "class", "svelte-1ci2a8g");
    			add_location(div4, file$8, 274, 12, 9069);
    			attr_dev(span9, "class", "svelte-1ci2a8g");
    			add_location(span9, file$8, 278, 12, 9168);
    			attr_dev(div5, "class", "svelte-1ci2a8g");
    			add_location(div5, file$8, 277, 12, 9150);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "name", "openess");
    			input8.__value = true;
    			input8.value = input8.__value;
    			/*$$binding_groups*/ ctx[37][0].push(input8);
    			add_location(input8, file$8, 282, 25, 9292);
    			attr_dev(label1, "class", "svelte-1ci2a8g");
    			add_location(label1, file$8, 281, 16, 9259);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "name", "openess");
    			input9.__value = false;
    			input9.value = input9.__value;
    			/*$$binding_groups*/ ctx[37][0].push(input9);
    			add_location(input9, file$8, 285, 28, 9442);
    			attr_dev(label2, "class", "svelte-1ci2a8g");
    			add_location(label2, file$8, 284, 16, 9406);
    			attr_dev(div6, "class", "svelte-1ci2a8g");
    			add_location(div6, file$8, 280, 12, 9237);
    			attr_dev(span10, "for", "sd-tse-1");
    			attr_dev(span10, "class", "svelte-1ci2a8g");
    			add_location(span10, file$8, 300, 16, 10047);
    			attr_dev(div7, "class", "svelte-1ci2a8g");
    			add_location(div7, file$8, 299, 12, 10025);
    			attr_dev(span11, "for", "ed-tse-1");
    			attr_dev(span11, "class", "svelte-1ci2a8g");
    			add_location(span11, file$8, 303, 16, 10152);
    			attr_dev(div8, "class", "svelte-1ci2a8g");
    			add_location(div8, file$8, 302, 12, 10130);
    			attr_dev(label3, "for", "txt2");
    			attr_dev(label3, "class", "svelte-1ci2a8g");
    			add_location(label3, file$8, 306, 16, 10283);
    			attr_dev(textarea, "id", "txt2");
    			attr_dev(textarea, "type", "text");
    			add_location(textarea, file$8, 306, 54, 10321);
    			set_style(div9, "vertical-align", "top");
    			attr_dev(div9, "class", "svelte-1ci2a8g");
    			add_location(div9, file$8, 305, 12, 10232);
    			attr_dev(div10, "class", "controls-column svelte-1ci2a8g");
    			set_style(div10, "font-size", "smaller");
    			add_location(div10, file$8, 270, 8, 8847);
    			attr_dev(div11, "class", "controls-column svelte-1ci2a8g");
    			set_style(div11, "padding", "0px");
    			add_location(div11, file$8, 310, 8, 10455);
    			attr_dev(div12, "class", "controls_panels svelte-1ci2a8g");
    			add_location(div12, file$8, 268, 4, 8778);
    			attr_dev(div13, "class", "contain-all svelte-1ci2a8g");
    			add_location(div13, file$8, 254, 0, 7636);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div2);
    			append_dev(div2, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t5);
    			append_dev(div1, span1);
    			append_dev(div1, input0);
    			input0.checked = /*maybe_sunday*/ ctx[9];
    			append_dev(div1, t7);
    			append_dev(div1, span2);
    			append_dev(div1, input1);
    			input1.checked = /*maybe_monday*/ ctx[10];
    			append_dev(div1, t9);
    			append_dev(div1, span3);
    			append_dev(div1, input2);
    			input2.checked = /*maybe_tuesday*/ ctx[11];
    			append_dev(div1, t11);
    			append_dev(div1, span4);
    			append_dev(div1, input3);
    			input3.checked = /*maybe_wednesday*/ ctx[12];
    			append_dev(div1, t13);
    			append_dev(div1, span5);
    			append_dev(div1, input4);
    			input4.checked = /*maybe_thursday*/ ctx[13];
    			append_dev(div1, t15);
    			append_dev(div1, span6);
    			append_dev(div1, input5);
    			input5.checked = /*maybe_friday*/ ctx[14];
    			append_dev(div1, t17);
    			append_dev(div1, span7);
    			append_dev(div1, input6);
    			input6.checked = /*maybe_staturday*/ ctx[15];
    			append_dev(div13, t19);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, div3);
    			append_dev(div3, label0);
    			append_dev(div3, t21);
    			append_dev(div3, input7);
    			set_input_value(input7, /*slot_name*/ ctx[1]);
    			append_dev(div10, t22);
    			append_dev(div10, div4);
    			append_dev(div4, span8);
    			append_dev(div4, t24);
    			append_dev(div4, t25);
    			append_dev(div10, t26);
    			append_dev(div10, div5);
    			append_dev(div5, span9);
    			append_dev(span9, t27);
    			append_dev(span9, t28);
    			append_dev(span9, t29);
    			append_dev(div10, t30);
    			append_dev(div10, div6);
    			append_dev(div6, label1);
    			append_dev(label1, t31);
    			append_dev(label1, input8);
    			input8.checked = input8.__value === /*is_open*/ ctx[8];
    			append_dev(div6, t32);
    			append_dev(div6, label2);
    			append_dev(label2, t33);
    			append_dev(label2, input9);
    			input9.checked = input9.__value === /*is_open*/ ctx[8];
    			append_dev(div10, t34);
    			if (if_block) if_block.m(div10, null);
    			append_dev(div10, t35);
    			append_dev(div10, div7);
    			append_dev(div7, span10);
    			append_dev(div7, t37);
    			append_dev(div10, t38);
    			append_dev(div10, div8);
    			append_dev(div8, span11);
    			append_dev(div8, t40);
    			append_dev(div10, t41);
    			append_dev(div10, div9);
    			append_dev(div9, label3);
    			append_dev(div9, t43);
    			append_dev(div9, textarea);
    			set_input_value(textarea, /*description*/ ctx[2]);
    			append_dev(div12, t44);
    			append_dev(div12, div11);
    			mount_component(dayevents, div11, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handle_save*/ ctx[21], false, false, false),
    					listen_dev(button1, "click", /*handle_delete*/ ctx[20], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[28]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[29]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[30]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[31]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[32]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[33]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[34]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[35]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[36]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[38]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[41])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_sunday*/ 512) {
    				input0.checked = /*maybe_sunday*/ ctx[9];
    			}

    			if (dirty[0] & /*maybe_monday*/ 1024) {
    				input1.checked = /*maybe_monday*/ ctx[10];
    			}

    			if (dirty[0] & /*maybe_tuesday*/ 2048) {
    				input2.checked = /*maybe_tuesday*/ ctx[11];
    			}

    			if (dirty[0] & /*maybe_wednesday*/ 4096) {
    				input3.checked = /*maybe_wednesday*/ ctx[12];
    			}

    			if (dirty[0] & /*maybe_thursday*/ 8192) {
    				input4.checked = /*maybe_thursday*/ ctx[13];
    			}

    			if (dirty[0] & /*maybe_friday*/ 16384) {
    				input5.checked = /*maybe_friday*/ ctx[14];
    			}

    			if (dirty[0] & /*maybe_staturday*/ 32768) {
    				input6.checked = /*maybe_staturday*/ ctx[15];
    			}

    			if (dirty[0] & /*slot_name*/ 2 && input7.value !== /*slot_name*/ ctx[1]) {
    				set_input_value(input7, /*slot_name*/ ctx[1]);
    			}

    			if (!current || dirty[0] & /*name*/ 1) set_data_dev(t25, /*name*/ ctx[0]);
    			if (!current || dirty[0] & /*start_time*/ 32) set_data_dev(t27, /*start_time*/ ctx[5]);
    			if (!current || dirty[0] & /*end_time*/ 64) set_data_dev(t29, /*end_time*/ ctx[6]);

    			if (dirty[0] & /*is_open*/ 256) {
    				input8.checked = input8.__value === /*is_open*/ ctx[8];
    			}

    			if (dirty[0] & /*is_open*/ 256) {
    				input9.checked = input9.__value === /*is_open*/ ctx[8];
    			}

    			if (/*is_open*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div10, t35);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*start_day*/ 8) set_data_dev(t37, /*start_day*/ ctx[3]);
    			if (!current || dirty[0] & /*end_day*/ 16) set_data_dev(t40, /*end_day*/ ctx[4]);

    			if (dirty[0] & /*description*/ 4) {
    				set_input_value(textarea, /*description*/ ctx[2]);
    			}

    			const dayevents_changes = (dirty[0] & /*model_day_data*/ 128)
    			? get_spread_update(dayevents_spread_levels, [get_spread_object(/*model_day_data*/ ctx[7])])
    			: {};

    			if (!updating_slot_of_change && dirty[0] & /*slot_of_change*/ 262144) {
    				updating_slot_of_change = true;
    				dayevents_changes.slot_of_change = /*slot_of_change*/ ctx[18];
    				add_flush_callback(() => updating_slot_of_change = false);
    			}

    			dayevents.$set(dayevents_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dayevents.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dayevents.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			/*$$binding_groups*/ ctx[37][0].splice(/*$$binding_groups*/ ctx[37][0].indexOf(input8), 1);
    			/*$$binding_groups*/ ctx[37][0].splice(/*$$binding_groups*/ ctx[37][0].indexOf(input9), 1);
    			if (if_block) if_block.d();
    			destroy_component(dayevents);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const USE_AS_OPEN$3 = "open";
    const USE_AS_BLOCK$3 = "block";
    const USE_AS_MEETING = "meeting";
    const USE_AS_ACTIVITY$3 = "activity";
    const MIN_ACTIVITY_DURATON = 15;

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TimeSlotEditor', slots, []);
    	const Slot = EventDays.Slot;
    	const dispatch = createEventDispatcher();
    	let { name } = $$props;
    	let { slot_name } = $$props;
    	let { start_day } = $$props;
    	let { end_day } = $$props;
    	let { description } = $$props;
    	let { pattern } = $$props;
    	let { activity } = $$props;
    	let { begin_at } = $$props;
    	let { end_at } = $$props;
    	let { start_time } = $$props;
    	let { end_time } = $$props;
    	let { allow_zoom } = $$props;
    	let { allow_in_person } = $$props;
    	let day_event_count = 0;
    	let external_update = false;

    	let model_day_data = {
    		"day": 0,
    		"monthstr": "",
    		"all_day_list": [],
    		"day_event_count": 0,
    		"model_how_long": 0,
    		"model_general_class": true
    	};

    	const ONE_HALF_HOUR = 3600 * 500;
    	const ONE_MINUTE = 60 * 1000;
    	let is_open = true;

    	class TSSlot extends Slot {
    		//
    		constructor(label, begin_at, end_at, info, d_date) {
    			super(label, begin_at, end_at);
    			this.index = info.index;
    			this.label = slot_name;
    			this.time = d_date.toLocaleTimeString();
    			this.use = info.blocked;
    			this.on_hour = USE_AS_OPEN$3;
    			this.on_half_hour = info.on_half_hour;
    			this.changed = false;

    			this.how_long = end_at > begin_at
    			? (end_at - begin_at) / 60 / 1000
    			: MIN_ACTIVITY_DURATON;

    			this.on_zoom = allow_zoom === undefined ? false : allow_zoom;
    			this.in_person = allow_in_person === undefined ? false : allow_in_person;
    		}
    	} //

    	function fill_model_day() {
    		let nn = new Date(start_time);
    		let d_date = new Date(nn.getFullYear(), nn.getMonth(), nn.getDate()); // these have been passed
    		let mdd = model_day_data;
    		let all_day_list = mdd.all_day_list;
    		let how_long = MIN_ACTIVITY_DURATON;

    		if (typeof begin_at === 'number' && typeof end_at == 'number') {
    			how_long = (end_at - begin_at) / 60 / 1000;
    		}

    		//
    		for (let i = 0; i < 48; i++) {
    			//
    			d_date.getHours();

    			let minutes = d_date.getMinutes();
    			let blocked = USE_AS_OPEN$3;

    			//
    			let time = d_date.getTime();

    			let future = MIN_ACTIVITY_DURATON * 60 * 100;

    			if (typeof begin_at === 'number' && typeof end_at == 'number' && begin_at <= time && time <= end_at) {
    				if (activity !== USE_AS_OPEN$3 && activity !== USE_AS_BLOCK$3) {
    					blocked = activity !== USE_AS_MEETING ? USE_AS_ACTIVITY$3 : activity;
    					future = end_at;
    				}
    			}

    			//
    			all_day_list[i] = new TSSlot("",
    			time,
    			future,
    			{
    					"index": i,
    					blocked,
    					"on_half_hour": minutes !== 0
    				},
    			d_date);

    			time += ONE_HALF_HOUR;
    			d_date = new Date(time);
    		}

    		// --  -- 
    		mdd.all_day_list = all_day_list;

    		mdd.event_count = 0;
    		mdd.has_events = false;
    		mdd.monthstr = "Time Slot";
    		mdd.model_how_long = how_long;

    		//mdd.key = key
    		return all_day_list;
    	}

    	function check_entered_times() {
    		let time_slots = model_day_data.all_day_list;
    		let beg_time = -1;
    		let end_time = -1;
    		let use_key = USE_AS_OPEN$3;

    		for (let a_slot of time_slots) {
    			if (a_slot.use !== USE_AS_OPEN$3 && use_key === USE_AS_OPEN$3) {
    				beg_time = a_slot.begin_at;
    				end_time = beg_time + a_slot.how_long * ONE_MINUTE;
    				use_key = a_slot.use;
    			} else if (a_slot.use !== use_key && beg_time >= 0) {
    				// !== use_key ends it
    				break;
    			}
    		}

    		if (beg_time >= 0 && end_time >= 0) {
    			return [beg_time, end_time];
    		}

    		return [begin_at, end_at];
    	}

    	let yes_sunday = false;
    	let yes_monday = false;
    	let yes_tuesday = false;
    	let yes_wednesday = false;
    	let yes_thursday = false;
    	let yes_friday = false;
    	let yes_staturday = false;

    	//
    	let maybe_sunday = false;

    	let maybe_monday = false;
    	let maybe_tuesday = false;
    	let maybe_wednesday = false;
    	let maybe_thursday = false;
    	let maybe_friday = false;
    	let maybe_staturday = false;
    	let pattern_update = [].concat(pattern);

    	function patterns_do() {
    		$$invalidate(9, maybe_sunday = yes_sunday);
    		$$invalidate(10, maybe_monday = yes_monday);
    		$$invalidate(11, maybe_tuesday = yes_tuesday);
    		$$invalidate(12, maybe_wednesday = yes_wednesday);
    		$$invalidate(13, maybe_thursday = yes_thursday);
    		$$invalidate(14, maybe_friday = yes_friday);
    		$$invalidate(15, maybe_staturday = yes_staturday);
    	}

    	let type_of_activity = [
    		{ id: 0, text: USE_AS_OPEN$3 },
    		{ id: 1, text: `meeting` },
    		{ id: 2, text: `teaching` },
    		{ id: 3, text: `music` },
    		{ id: 3, text: `travel` }
    	];

    	let selected_activity;
    	let answer_activity = '';
    	let slot_of_change = false;

    	function figure_activity(activity) {
    		for (let act of type_of_activity) {
    			if (act.text === activity) {
    				return act;
    			}
    		}

    		return type_of_activity[0];
    	}

    	function handle_delete(ev) {
    		dispatch('message', {
    			"type": 'command',
    			"cmd": 'delete-time-slot'
    		});
    	}

    	function handle_save(ev) {
    		pattern_update = [
    			maybe_sunday,
    			maybe_monday,
    			maybe_tuesday,
    			maybe_wednesday,
    			maybe_thursday,
    			maybe_friday,
    			maybe_staturday
    		];

    		let [udpate_begin_at, update_end_at] = check_entered_times();

    		//
    		let name_changed = false;

    		let update_name = slot_name;

    		if (name.indexOf(slot_name) !== 0) {
    			name_changed = true;
    			$$invalidate(0, name = `${slot_name}-${start_time}`);
    		}

    		let udate_zoom = allow_zoom;
    		let update_in_person = allow_in_person;

    		if (slot_of_change) {
    			udate_zoom = slot_of_change.on_zoom;
    			update_in_person = slot_of_change.in_person;
    		}

    		//
    		dispatch('message', {
    			"type": 'command',
    			"cmd": 'save-time-slot',
    			"status": { "name_change": name_changed },
    			"time_slot_data": {
    				name,
    				"slot_name": update_name,
    				description,
    				"begin_at": udpate_begin_at,
    				"end_at": update_end_at,
    				"pattern": pattern_update,
    				start_time,
    				end_time,
    				"activity": selected_activity.text,
    				"allow_zoom": udate_zoom,
    				"allow_in_person": update_in_person
    			}
    		});
    	}

    	const writable_props = [
    		'name',
    		'slot_name',
    		'start_day',
    		'end_day',
    		'description',
    		'pattern',
    		'activity',
    		'begin_at',
    		'end_at',
    		'start_time',
    		'end_time',
    		'allow_zoom',
    		'allow_in_person'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimeSlotEditor> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		maybe_sunday = this.checked;
    		$$invalidate(9, maybe_sunday);
    	}

    	function input1_change_handler() {
    		maybe_monday = this.checked;
    		$$invalidate(10, maybe_monday);
    	}

    	function input2_change_handler() {
    		maybe_tuesday = this.checked;
    		$$invalidate(11, maybe_tuesday);
    	}

    	function input3_change_handler() {
    		maybe_wednesday = this.checked;
    		$$invalidate(12, maybe_wednesday);
    	}

    	function input4_change_handler() {
    		maybe_thursday = this.checked;
    		$$invalidate(13, maybe_thursday);
    	}

    	function input5_change_handler() {
    		maybe_friday = this.checked;
    		$$invalidate(14, maybe_friday);
    	}

    	function input6_change_handler() {
    		maybe_staturday = this.checked;
    		$$invalidate(15, maybe_staturday);
    	}

    	function input7_input_handler() {
    		slot_name = this.value;
    		$$invalidate(1, slot_name);
    	}

    	function input8_change_handler() {
    		is_open = this.__value;
    		$$invalidate(8, is_open);
    	}

    	function input9_change_handler() {
    		is_open = this.__value;
    		$$invalidate(8, is_open);
    	}

    	function select_change_handler() {
    		selected_activity = select_value(this);
    		(($$invalidate(16, selected_activity), $$invalidate(23, activity)), $$invalidate(19, type_of_activity));
    		$$invalidate(19, type_of_activity);
    	}

    	const change_handler = () => $$invalidate(17, answer_activity = '');

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate(2, description);
    	}

    	function dayevents_slot_of_change_binding(value) {
    		slot_of_change = value;
    		$$invalidate(18, slot_of_change);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('slot_name' in $$props) $$invalidate(1, slot_name = $$props.slot_name);
    		if ('start_day' in $$props) $$invalidate(3, start_day = $$props.start_day);
    		if ('end_day' in $$props) $$invalidate(4, end_day = $$props.end_day);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('pattern' in $$props) $$invalidate(22, pattern = $$props.pattern);
    		if ('activity' in $$props) $$invalidate(23, activity = $$props.activity);
    		if ('begin_at' in $$props) $$invalidate(24, begin_at = $$props.begin_at);
    		if ('end_at' in $$props) $$invalidate(25, end_at = $$props.end_at);
    		if ('start_time' in $$props) $$invalidate(5, start_time = $$props.start_time);
    		if ('end_time' in $$props) $$invalidate(6, end_time = $$props.end_time);
    		if ('allow_zoom' in $$props) $$invalidate(26, allow_zoom = $$props.allow_zoom);
    		if ('allow_in_person' in $$props) $$invalidate(27, allow_in_person = $$props.allow_in_person);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		DayEvents,
    		EventDays,
    		Slot,
    		dispatch,
    		name,
    		slot_name,
    		start_day,
    		end_day,
    		description,
    		pattern,
    		activity,
    		begin_at,
    		end_at,
    		start_time,
    		end_time,
    		allow_zoom,
    		allow_in_person,
    		day_event_count,
    		external_update,
    		model_day_data,
    		ONE_HALF_HOUR,
    		ONE_MINUTE,
    		USE_AS_OPEN: USE_AS_OPEN$3,
    		USE_AS_BLOCK: USE_AS_BLOCK$3,
    		USE_AS_MEETING,
    		USE_AS_ACTIVITY: USE_AS_ACTIVITY$3,
    		MIN_ACTIVITY_DURATON,
    		is_open,
    		TSSlot,
    		fill_model_day,
    		check_entered_times,
    		yes_sunday,
    		yes_monday,
    		yes_tuesday,
    		yes_wednesday,
    		yes_thursday,
    		yes_friday,
    		yes_staturday,
    		maybe_sunday,
    		maybe_monday,
    		maybe_tuesday,
    		maybe_wednesday,
    		maybe_thursday,
    		maybe_friday,
    		maybe_staturday,
    		pattern_update,
    		patterns_do,
    		type_of_activity,
    		selected_activity,
    		answer_activity,
    		slot_of_change,
    		figure_activity,
    		handle_delete,
    		handle_save
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('slot_name' in $$props) $$invalidate(1, slot_name = $$props.slot_name);
    		if ('start_day' in $$props) $$invalidate(3, start_day = $$props.start_day);
    		if ('end_day' in $$props) $$invalidate(4, end_day = $$props.end_day);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('pattern' in $$props) $$invalidate(22, pattern = $$props.pattern);
    		if ('activity' in $$props) $$invalidate(23, activity = $$props.activity);
    		if ('begin_at' in $$props) $$invalidate(24, begin_at = $$props.begin_at);
    		if ('end_at' in $$props) $$invalidate(25, end_at = $$props.end_at);
    		if ('start_time' in $$props) $$invalidate(5, start_time = $$props.start_time);
    		if ('end_time' in $$props) $$invalidate(6, end_time = $$props.end_time);
    		if ('allow_zoom' in $$props) $$invalidate(26, allow_zoom = $$props.allow_zoom);
    		if ('allow_in_person' in $$props) $$invalidate(27, allow_in_person = $$props.allow_in_person);
    		if ('day_event_count' in $$props) day_event_count = $$props.day_event_count;
    		if ('external_update' in $$props) external_update = $$props.external_update;
    		if ('model_day_data' in $$props) $$invalidate(7, model_day_data = $$props.model_day_data);
    		if ('is_open' in $$props) $$invalidate(8, is_open = $$props.is_open);
    		if ('yes_sunday' in $$props) yes_sunday = $$props.yes_sunday;
    		if ('yes_monday' in $$props) yes_monday = $$props.yes_monday;
    		if ('yes_tuesday' in $$props) yes_tuesday = $$props.yes_tuesday;
    		if ('yes_wednesday' in $$props) yes_wednesday = $$props.yes_wednesday;
    		if ('yes_thursday' in $$props) yes_thursday = $$props.yes_thursday;
    		if ('yes_friday' in $$props) yes_friday = $$props.yes_friday;
    		if ('yes_staturday' in $$props) yes_staturday = $$props.yes_staturday;
    		if ('maybe_sunday' in $$props) $$invalidate(9, maybe_sunday = $$props.maybe_sunday);
    		if ('maybe_monday' in $$props) $$invalidate(10, maybe_monday = $$props.maybe_monday);
    		if ('maybe_tuesday' in $$props) $$invalidate(11, maybe_tuesday = $$props.maybe_tuesday);
    		if ('maybe_wednesday' in $$props) $$invalidate(12, maybe_wednesday = $$props.maybe_wednesday);
    		if ('maybe_thursday' in $$props) $$invalidate(13, maybe_thursday = $$props.maybe_thursday);
    		if ('maybe_friday' in $$props) $$invalidate(14, maybe_friday = $$props.maybe_friday);
    		if ('maybe_staturday' in $$props) $$invalidate(15, maybe_staturday = $$props.maybe_staturday);
    		if ('pattern_update' in $$props) pattern_update = $$props.pattern_update;
    		if ('type_of_activity' in $$props) $$invalidate(19, type_of_activity = $$props.type_of_activity);
    		if ('selected_activity' in $$props) $$invalidate(16, selected_activity = $$props.selected_activity);
    		if ('answer_activity' in $$props) $$invalidate(17, answer_activity = $$props.answer_activity);
    		if ('slot_of_change' in $$props) $$invalidate(18, slot_of_change = $$props.slot_of_change);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*pattern*/ 4194304) {
    			if (pattern) {
    				yes_sunday = pattern[0];
    				yes_monday = pattern[1];
    				yes_tuesday = pattern[2];
    				yes_wednesday = pattern[3];
    				yes_thursday = pattern[4];
    				yes_friday = pattern[5];
    				yes_staturday = pattern[6];
    				pattern_update = [].concat(pattern);

    				//
    				let dlist = fill_model_day();

    				$$invalidate(7, model_day_data.all_day_list = dlist, model_day_data); // this is also a svelte weirdness...
    				setTimeout(patterns_do, 0); // this does have to happen
    			}
    		}

    		if ($$self.$$.dirty[0] & /*activity*/ 8388608) {
    			$$invalidate(16, selected_activity = !(typeof activity === 'string') || !activity.length
    			? type_of_activity[0]
    			: figure_activity(activity));
    		}
    	};

    	return [
    		name,
    		slot_name,
    		description,
    		start_day,
    		end_day,
    		start_time,
    		end_time,
    		model_day_data,
    		is_open,
    		maybe_sunday,
    		maybe_monday,
    		maybe_tuesday,
    		maybe_wednesday,
    		maybe_thursday,
    		maybe_friday,
    		maybe_staturday,
    		selected_activity,
    		answer_activity,
    		slot_of_change,
    		type_of_activity,
    		handle_delete,
    		handle_save,
    		pattern,
    		activity,
    		begin_at,
    		end_at,
    		allow_zoom,
    		allow_in_person,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_input_handler,
    		input8_change_handler,
    		$$binding_groups,
    		input9_change_handler,
    		select_change_handler,
    		change_handler,
    		textarea_input_handler,
    		dayevents_slot_of_change_binding
    	];
    }

    class TimeSlotEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{
    				name: 0,
    				slot_name: 1,
    				start_day: 3,
    				end_day: 4,
    				description: 2,
    				pattern: 22,
    				activity: 23,
    				begin_at: 24,
    				end_at: 25,
    				start_time: 5,
    				end_time: 6,
    				allow_zoom: 26,
    				allow_in_person: 27
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeSlotEditor",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'name'");
    		}

    		if (/*slot_name*/ ctx[1] === undefined && !('slot_name' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'slot_name'");
    		}

    		if (/*start_day*/ ctx[3] === undefined && !('start_day' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'start_day'");
    		}

    		if (/*end_day*/ ctx[4] === undefined && !('end_day' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'end_day'");
    		}

    		if (/*description*/ ctx[2] === undefined && !('description' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'description'");
    		}

    		if (/*pattern*/ ctx[22] === undefined && !('pattern' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'pattern'");
    		}

    		if (/*activity*/ ctx[23] === undefined && !('activity' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'activity'");
    		}

    		if (/*begin_at*/ ctx[24] === undefined && !('begin_at' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'begin_at'");
    		}

    		if (/*end_at*/ ctx[25] === undefined && !('end_at' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'end_at'");
    		}

    		if (/*start_time*/ ctx[5] === undefined && !('start_time' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'start_time'");
    		}

    		if (/*end_time*/ ctx[6] === undefined && !('end_time' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'end_time'");
    		}

    		if (/*allow_zoom*/ ctx[26] === undefined && !('allow_zoom' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'allow_zoom'");
    		}

    		if (/*allow_in_person*/ ctx[27] === undefined && !('allow_in_person' in props)) {
    			console.warn("<TimeSlotEditor> was created without expected prop 'allow_in_person'");
    		}
    	}

    	get name() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get slot_name() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot_name(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start_day() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_day(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_day() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_day(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pattern() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pattern(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activity() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activity(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get begin_at() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set begin_at(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_at() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_at(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start_time() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_time(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_time() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_time(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allow_zoom() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allow_zoom(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allow_in_person() {
    		throw new Error("<TimeSlotEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allow_in_person(value) {
    		throw new Error("<TimeSlotEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // 

    const HOST = "localhost";
    const PORT = "9696";

    class JSONMessageQueue {

        constructor(decoder,encoder) {
            this.message_queue = [];
            this.last_message = '';
            this.current_message = {};
            //
            if ( (decoder === undefined) || (decoder === false) ) {
                this.message_decoder = this.default_decoder;
            } else if ( decoder !== this.decode_message ) {
                this.message_decoder = decoder;
            } else {
                this.message_decoder = this.default_decoder;
            }
            //
            if ( (encoder === undefined) || (encoder === false) ) {
                this.message_encoder = this.default_encoder;
            } else if ( encoder !== this.message_encoder ) {
                this.message_encoder = encoder;
            } else {
                this.message_encoder = this.default_encoder;
            }
        }
        
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        set_decoder(decoder) {
            this.message_decoder = decoder;
        }

        set_encoder(encoder) {
            this.message_encoder = encoder;
        }

        default_decoder(str) {
            try {
                let m_obj = JSON.parse(str);
                return m_obj
            } catch (e) {
                console.error(e);
            }
            return false
        }

        default_encoder(j_obj) {
            return JSON.stringify(j_obj)
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        //
        add_data(data) {
            this.last_message += data.toString();
        }

        add_object(m_obj) {
            this.message_queue.push(m_obj);
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        //
        message_complete() {
            let msg = this.last_message;
            this.last_message = "";
            //
            msg = msg.trim();
            //
            if ( !(msg.length) ) return
            //
            msg = msg.replace(/\}\s+\{/g,'}{');
            let raw_m_list = msg.split('}{');
            let rest = "";
            let n = raw_m_list.length;
            for ( let i = 0; i < n; i++ ) {
                rest = raw_m_list[i];
                let str = rest;
                if ( i < (n-1) ) str += '}';
                if ( i > 0 ) str = '{' + str;
                let m_obj = this.message_decoder(str);
                if ( m_obj ) {
                    this.message_queue.push(m_obj);              /// enqueue
                } else {
                    this.last_message = '{' + rest;
                }
            }
        }

        //
        dequeue() {
            this.current_message = this.message_queue.shift();
            return this.current_message
        }


        encode_message(message) {
            return this.message_encoder(message)
        }

        decode_message(message_str) {
            return this.message_decoder(message_str)
        }

    }

    // ResponseVector 
    // class with no dependencies -- this keeps the response lambdas waiting for data back from a server
    // does not address expiration.. does not provide optimization beyon javascript capability


    const MAX_UNANSWERED_MESSAGES = 100;

    class ResponseVector {

        constructor(conf) {
            this.max_unanswered =  conf ? conf.max_pending_messages || MAX_UNANSWERED_MESSAGES : MAX_UNANSWERED_MESSAGES;  
            this.setup_response_vector();
        }

        //
        // get_response_id
        //      looks for a free position in the waiting_for_response array.
        //      Elements in use always contain resolver functions for relaying responses to waiting callers (await ...)
        //      usually found within 'async' functions.
        //
        get_response_id() {
            let first_try = Math.floor(Math.random()*this.max_unanswered);
            let try_index = first_try;
            while ( try_index < this.max_unanswered ) {
                if ( this.waiting_for_response[try_index] === false ) {
                    return(try_index)
                }
                try_index++;
            }
            try_index = 0;
            while ( try_index < first_try ) {
                if ( this.waiting_for_response[try_index] === false ) {
                    return(try_index)
                }
                try_index++;
            }
            return(-1) // server might be down
        }

        setup_response_vector() {
            this.waiting_for_response = new Array(this.max_unanswered);
            this.waiting_for_response.fill(false,0,this.max_unanswered);
        }

        unlock_response_id(id) {
            this.waiting_for_response[id] = false;
        }

        lock_response_id(id,fn) {
            this.waiting_for_response[id] = fn;
        }
        
        get_response_resolver(id) {
            return this.waiting_for_response[id]
        }  

    }

    // Copyright Joyent, Inc. and other Node contributors.



    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    const DEFAULT_MAX_LISTENERS = 10;
    let g_max_listeners = DEFAULT_MAX_LISTENERS;


    let R = typeof Reflect === 'object' ? Reflect : null;
    let ReflectApply = R && typeof R.apply === 'function'
      ? R.apply
      : function ReflectApply(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };

    let ReflectOwnKeys;
    if (R && typeof R.ownKeys === 'function') {
      ReflectOwnKeys = R.ownKeys;
    } else if (Object.getOwnPropertySymbols) {
      ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target)
          .concat(Object.getOwnPropertySymbols(target));
      };
    } else {
      ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target);
      };
    }

    function ProcessEmitWarning(warning) {
      if (console && console.warn) console.warn(warning);
    }

    let NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
      return value !== value;
    };


    function checkListener(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
    }


    function onceWrapper() {
      if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0)
          return this.listener.call(this.target);
        return this.listener.apply(this.target, arguments);
      }
    }

    function _onceWrap(target, type, listener) {
      let state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
      let wrapped = onceWrapper.bind(state);
      wrapped.listener = listener;
      state.wrapFn = wrapped;
      return wrapped;
    }

    function unwrapListeners(arr) {
      let ret = new Array(arr.length);
      for (let i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }


    // ---- ---- ---- ---- ---- ----

    class EventEmitter {

      constructor() {
        this._events = {};
        this._eventsCount = 0;
        this._maxListeners = false;


        this.init();
      }


      get defaultMaxListeners() {
        return g_max_listeners;
      }

      set defaultMaxListeners(arg) {
        if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
        }
        g_max_listeners = arg;
      }

      setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
        }
        this._maxListeners = n;
      }

      getMaxListeners() {
        if ( typeof  this._maxListeners !== 'number' ) {
          return g_max_listeners
        }
        return this._maxListeners
      }


      init() {

        if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        }
      
        this._maxListeners = this._maxListeners || undefined;
      }


      emit(type) {
        //
        let args = [];
        for (let i = 1; i < arguments.length; i++) args.push(arguments[i]);
        ///

        let event_map = this._events;
        //
        let doError = (type === 'error');

        if ( (event_map === undefined)  && !doError ) return false
      
        if (event_map !== undefined) {
          if (doError && (event_map.error === undefined)) {
            let er;
            if ( args.length > 0 ) er = args[0];
            if (er instanceof Error) {
              // Note: The comments on the `throw` lines are intentional, they show
              // up in Node's output if this results in an unhandled exception.
              throw er; // Unhandled 'error' event
            }
            // At least give some kind of context to the user
            let err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
            err.context = er;
            throw err; // Unhandled 'error' event  
          }
        }
      
        let handler = event_map[type];
        //
        if  (handler === undefined )  return false;
      
        if (typeof handler === 'function') {
          ReflectApply(handler, this, args);
        } else {
          let len = handler.length;
          let listeners =  [].concat(handler);
          for ( let i = 0; i < len; ++i )
            ReflectApply(listeners[i], this, args);
        }
      
        return true;
      }


      // #addListener
      #addListener(target, type, listener, prepend) {
        let m;
        let events;
        let existing;
      
        checkListener(listener);
      
        events = target._events;
        if ( events === undefined ) {
          events = target._events = {};
          target._eventsCount = 0;
        } else {
          // To avoid recursion in the case that type === "newListener"! Before
          // adding it to the listeners, first emit "newListener".
          if ( events.newListener !== undefined ) {
            target.emit('newListener', type,
                        listener.listener ? listener.listener : listener);
      
            // Re-assign `events` because a newListener handler could have caused the
            // this._events to be assigned to a new object
            events = target._events;
          }
          existing = events[type];
        }
      
        if ( existing === undefined ) {
          // Optimize the case of one listener. Don't need the extra array object.
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === 'function') {  // was a single element
            // Adding the second element, need to change to array.
            existing = events[type] =
              prepend ? [listener, existing] : [existing, listener];  // array of two
            // If we've already got an array, just append.
          } else if (prepend) { // else ops on array
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
      
          // Check for listener leak
          m = target.getMaxListeners();
          if ( (m > 0) && (existing.length > m )&& !existing.warned ) {
            existing.warned = true;
            // No error code for this since it is a Warning
            // eslint-disable-next-line no-restricted-syntax
            let w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + String(type) + ' listeners ' +
                                'added. Use emitter.setMaxListeners() to ' +
                                'increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
      
        return target;
      }


      removeListener(type, listener) {
        let list, events, position, i, originalListener;

        checkListener(listener);

        events = this._events;
        if (events === undefined) return this;

        list = events[type];
        if (list === undefined) return this;

        if ( (list === listener) || (list.listener === listener) ) {  // SINGLE LISTENER
          if (--this._eventsCount === 0)
            this._events = {};
          else {
            delete events[type];
            if (events.removeListener) {
              this.emit('removeListener', type, list.listener || listener);
            }
          }
        } else if (typeof list !== 'function') {
          position = -1;

          // index of listener
          for (i = list.length - 1; i >= 0; i--) {
            if ( list[i] === listener || list[i].listener === listener ) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          // not found
          if (position < 0) return this;

          if (position === 0)
            list.shift();
          else {
            list.splice(position,1);
          }

          // save some memory
          if ( list.length === 1 )  events[type] = list[0];

          if ( events.removeListener !== undefined ) {  // key for remove
            this.emit('removeListener', type, originalListener || listener);
          }
        }

        return this;
      }



      removeAllListeners(type) {
        let listeners, events, i;

        events = this._events;
        if ( events === undefined ) return this;

        // not listening for removeListener, no need to emit
        if ( events.removeListener === undefined ) {
          if (arguments.length === 0) {
            this._events = {};
            this._eventsCount = 0;
          } else if (events[type] !== undefined) {
            if (--this._eventsCount === 0)
              this._events = {};
            else
              delete events[type];
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {

          for ( let key in events ) {
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = {};
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners !== undefined) {
          // LIFO order
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }

        return this;
      }


      // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

      // synonyms
      addListener = function addListener(type, listener) {
        return this.#addListener(this, type, listener, false);
      }

      prependListener(type, listener) {
        return this.#addListener(this, type, listener, true);
      }


      once(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      
      prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      
      on(type, listener) {
        return this.#addListener(this, type, listener, false);
      }

      off(type, listener) {
        return this.removeListener(type, listener)
      }



      // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

      listenerCount(type) {
        let events = this._events;
        if ( events !== undefined ) {
          let evlistener = events[type];
          if ( typeof evlistener === 'function' ) {
            return 1;
          } else if ( evlistener !== undefined ) {
            return evlistener.length;
          }
        }
        return 0;
      }
      
      eventNames() {
        return (this._eventsCount > 0) ? ReflectOwnKeys(this._events) : [];
      }


      #listeners(target, type, unwrap) {
        let events = target._events;
      
        if (events === undefined)
          return [];
      
        let evlistener = events[type];
        if (evlistener === undefined)
          return [];
      
        if (typeof evlistener === 'function')
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
      
        return unwrap ?
          unwrapListeners(evlistener) : [].concat(evlistener);
      }
      
      listeners(type) {
        return this.#listeners(this, type, true);
      }
      
      rawListeners(type) {
        return this.#listeners(this, type, false);
      }
      
    }

    // ---- ----



    class CommunicatorAPI extends EventEmitter {
        //
        constructor() {
            super();
        }

        // ---- ---- ---- ---- ---- ---- ----
        async publish(topic,path,message) {
            if ( !(topic) || !(path) ) return false
            if ( !(message) ) return false
            message._ps_op = "pub";
            message.topic = topic;
            message._m_path = path;
            try {
                return await this.sendMessage(message)            
            } catch (e) {
                console.log(e);
                return false
            }
        }

        
        // ---- ---- ---- ---- ---- ---- ---- ----
        //
        async subscribe(topic,path,message,handler) {
            if ( !(topic) || !(path) ) return false
            if ( (typeof message === 'function') && (handler === undefined) ) {
                handler = message;
                message = {};
            } else if ( (typeof message === 'boolean')  && (typeof message === 'function') ) {
                message = {};
            } else if (handler === undefined ) {
                return false
            } 
            if ( handler !== undefined && (typeof handler === "function") ) {
                this.on(`update-${topic}-${path}`,handler);
                this.subcriptions[`update-${topic}-${path}`] = handler;
            }
            message._ps_op = "sub";
            message.topic = topic;
            message._m_path = path;
            try {
                return await this.sendMessage(message)            
            } catch (e) {
                console.log(e);
                return false
            }
        }

        // ---- ---- ---- ---- ---- ---- ----
        async unsubscribe(topic,path) {
            if ( !(topic) || !(path) ) return false
            let handler = this.subcriptions[`update-${topic}-${path}`];
            if ( handler ) {
                this.removeListener(`update-${topic}-${path}`,handler);
                delete this.subcriptions[`update-${topic}-${path}`];
            }
            let message = {
                "_ps_op" : "unsub",
                "topic" : topic
            };
            message._m_path = path;
            try {
                return await this.sendMessage(message)            
            } catch (e) {
                console.log(e);
                return false
            }
        }


        //
        send(message) {     // sometimes synonyms help
            if ( !(message) ) return false
            return this.sendMessage(message)
        }

        //      returns a promise
        send_on_path(message,path) {
            try {
                let msg = Object.assign({},message);
                msg['_m_path'] = path;
                return this.sendMessage(msg)
            } catch (e) {
                console.error(e);
                return false
            }
        }

        send_op_on_path(message,path,op) {
            if ( !(message) ) return false
            message._tx_op = op;
            return this.send_on_path(message,path)
        }

        get_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'G';
            return this.send_on_path(message,path)
        }

        set_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'S';
            return this.send_on_path(message,path)
        }

        mod_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'M';
            return this.send_on_path(message,path)
        }

        del_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'D';
            return this.send_on_path(message,path)
        }

        publication_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'P';
            return this.send_on_path(message,path)
        }

        unpublish_on_path(message,path) {
            if ( !(message) ) return false
            message._tx_op = 'U';
            return this.send_on_path(message,path)
        }

    }


    class Communicator extends CommunicatorAPI  {

        constructor(conf,wrapper,skip_init) {
            //
            super();
            //
            this.subcriptions = {};
            if ( conf.JSONMessageQueueClass ) {
                let mqClass = require(conf.JSONMessageQueueClass);
                this.messages = new mqClass(false);
            } else {
                this.messages = new JSONMessageQueue(false);
            }
            //
            try {
                this.resp_vector = !(conf.response_vector) ? new ResponseVector(conf) : new (require(conf.response_vector));
            } catch (e) {
                this.resp_vector = new ResponseVector(conf);
            }
            //
            //
            this.writer = false;     // The writer is set by the descendant... perhaps tcp udp websocket, etc.
            this.event_wrapper = false;
            if ( wrapper ) {
                 this.event_wrapper = wrapper;
            }
            //
            if ( !(skip_init) ) {
                this._init(conf);
            }
        }


        _init(conf) { 
            throw new Error("Descedant of class Messenger must implement _init.")
        }

        //
        _handle_unsolicited(message) {
            if ( message !== undefined ) {
                let topic = message.topic;
                let path = message._m_path;
                this.emit(`update-${topic}-${path}`,message);
            } 
        }
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        // INBOUND MESSAGE DATA
        // The inbound message handlers (responses and unsolicited on this client socket)
        client_add_data_and_react(data) {
            let mqueue = this.messages;
            mqueue.add_data(data);
            mqueue.message_complete();
            let message = undefined;
            while ( mqueue.message_queue.length ) {
                message = mqueue.dequeue();
                if ( message._response_id !== undefined ) {
                    let resolver = this.resp_vector.get_response_resolver(message._response_id);
                    if ( typeof resolver === "function" ) {
                        resolver(message);
                    }
                } else {
                    this._handle_unsolicited(message);
                }
            }
        }

        // OUTBOUND MESSAGE DATA
        _message_and_response(message,resolve,reject) {
            let id = this.resp_vector.get_response_id();
            if ( id < 0 ) {
                reject(new Error("send message max out... is server up?"));
            }
            message._response_id = id;   // overwrites this if sender copied a forwarded object...
            let message_handler = (msg) => { 
                this.resp_vector.unlock_response_id(id);
                resolve(msg); 
            };
            this.resp_vector.lock_response_id(id,message_handler);
            //
            // write message
            let flat_message = this.messages.encode_message(message);

            if ( this.writer ) {
                //
                let err_handler = (err) => {
                    this.writer.removeListener('error',err_handler);
                    reject(err);
                };
                this.writer.on('error',err_handler);
                try {
                    this.writer.write(flat_message);            // write message here....
                } catch (e) {
                    this.resp_vector.unlock_response_id(id);
                    console.log(e);
                } finally {
                    // might reserve this until the response is received
                    this.writer.removeListener('error',err_handler);
                }
                //
            }
        }

        //
        // sendMessage
        // ---- ---- ---- ---- ---- ---- ---- ---- ----
        //
        // This sends messages to IP endpoints. But, it may also write to a file if that has been setup through configuration 
        // with files_only. Another reason data may be place in files is that the socket may close or be broken in some way.
        //
        // If sending through on the sockets, this method will only ever add _response_id to the object being sent. 
        // This class expects the server to send _response_id back so that it can find callers without thunking too much. 
        // _response_id finds the requeting socket and relays the results back. 
        //
        // _response_id is specifically generated by _get_response_id(). _get_response_id returns an index for a space in 
        //  waiting_for_response array.
        //
        sendMessage(message) {   // secondary queuing is possible
            return new Promise((resolve, reject) => {
                    this._message_and_response(message,resolve,reject);
            });
        }


        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


        // external event wrapper 
        wrap_event(wrapper_key) {
            if ( this.event_wrapper && this.event_wrapper.commission ) {
                this.event_wrapper.commission(wrapper_key);
            }
        }

        unwrap_event(wrapper_key) {
            if ( this.event_wrapper && this.event_wrapper.decommission  ) {
                this.event_wrapper.decommission(wrapper_key);
            }
        }

    }

    const DEFAULT_MAX_RECONNECT = 20;
    const DEFAULT_RECONNECT_WAIT = 5;


    class WSWriter extends EventEmitter {

        constructor(ws) {
            super();
            this.ws = ws;
        }

        //
        write(message) {
            try {
                this.ws.send(message);
            } catch(e) {
                console.log(e);
            }
        }

    }

    // use the browser WebSocket class

    class MessageRelayer extends Communicator {
        //
        constructor(conf,wrapper) {
            super(conf,wrapper);
        }

        //
        _init(conf) {
            if ( conf === undefined ) {
                console.log("message relay client: cannot initialize -- no configuration");
                return;
            }
            this._init_members(conf);
            this._create_connection(conf);
        }

        
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        _init_members(conf) {

            this.port = conf ? conf.port || PORT : PORT;
            this.address = conf ? conf.address || HOST : HOST;
            this.options = conf.ws_options;
            this.ws_app_path = conf.ws_path ? console.ws_path : "";
            if ( this.ws_app_path[0] != '/' ) this.ws_app_path = '/' + this.ws_app_path;
            //
            //
            this.send_on_reconnect = conf ? conf.send_on_reconnect || false : false;
            //
            this.attempt_reconnect = false;
            this.reconnect_wait = DEFAULT_RECONNECT_WAIT;
            this.max_reconnect = DEFAULT_MAX_RECONNECT;
            this.reconnect_count = 0;
        }


        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        _create_connection(conf) {
            this.attempt_reconnect = (conf.attempt_reconnect !== undefined) ? conf.attempt_reconnect : false;
            if ( this.attempt_reconnect ) {
                this._configure_reconnect(conf);
            }
            this._connect();
            this._setup_connection_handlers(this,conf);
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        // CONNECTION
        _connect() {
            if ( this.options ) {
                this.ws = new WebSocket(`ws://${this.address}:${this.port}${this.ws_app_path}`,this.options);
            } else {
                this.ws = new WebSocket(`ws://${this.address}:${this.port}${this.ws_app_path}`);
            }
            this.ws.onopen = () => {
                this._connection_handler();
            };
        }

        // // // // // // 

        _connection_handler() {
            this.writer = new WSWriter(this.ws);
            this.wrap_event(this.address);
            this.reconnect_count = 0;
            console.log(`Client connected to: ${this.address} :  ${this.port}`);
            this.emit('client-ready',this.address,this.port);
        }

        // SET UP CONNECTION AND HANDLERS  on('close'...) on('data'...) on('error'...)
        // _setup_connection_handlers
        //
        _setup_connection_handlers(client,conf) {
            //
            // 1. data
            client.ws.onmessage = ((com) => { return (ev) => {   // ws returns an event
                let data = ev.data;
                com.client_add_data_and_react(data);
            }})(this);
            //
            //  2. close
            client.ws.onclose = ((com) => { return () => {
                this.unwrap_event(this.address);
                console.log('Client closed');
                if ( client.attempt_reconnect ) {
                    client._attempt_reconnect(conf);
                }
                com.closeAll();
            }})(this);
            //
            // 3. error
            client.ws.onerror = (err) => {
                this.unwrap_event(this.address);
                console.log(err);
            };
            //
        }


        closeAll() {
        }


    }

    let WSMessageRelayer = MessageRelayer;

    const g_topic_to_messenger = {};


    function add_ws_endpoint(topic_group,url,a_port,a_path,subscriptions) {
        //
        let port = a_port ? a_port : '';
        let api_path = a_path ? a_path : '';
        g_topic_to_messenger[topic_group] = {
            "com" : new WSMessageRelayer({
                            "host" : "localhost",
                            "port" : port,
                            "path" : api_path
                        }),
             "subscriptions" : subscriptions
        };
        //
        // Subscribe to a number of things
        g_topic_to_messenger[topic_group].com.on('client-ready', (address,port) => {
            for ( let ky in subscriptions ) {
                let subscription = subscriptions[ky];
                let topic = subscription.topic;
                let path = subscription.path;
                let handler = subscription.handler;
                g_topic_to_messenger[topic_group].com.subscribe(topic,path,handler);
            }
        });
        //
    }


    // fetch the relayer
    async function publish(topic_group,topic,path,message) {
        let relayer = g_topic_to_messenger[topic_group].com;
        relayer.publish(topic,path,message);
    }

    const USER_CHAT_PATH = 'calendar-owner-contact';
    //
    const SUGGEST_CHANGE_EVENT_TOPIC = 'owner-ask-event-calendar-change';
    const ACCEPT_EVENT_TOPIC = 'owner-accept-event-calendar';
    const SCHEDULER_ACCEPTED_TOPIC = 'owner-accept-event-calendar';
    const REJECT_EVENT_TOPIC = 'owner-drop-event-calendar';
    const NOTIFY_TIMELINE_CHANGE = 'owner-change-timeline-calendar';

    const TIMELINE_UPDATE_READY = 'timeline-update-available';
    //
    const REQUEST_EVENT_TOPIC = 'user-request-event-calendar';
    const REQUEST_EVENT_CHANGE_TOPIC = 'user-request-change-event-calendar';
    const REQUEST_EVENT_DROP_TOPIC = 'user-request-drop-event-calendar';
    //
    const APPRISE_NEW_MONTH_DATA = 'month-update-available';

    const CALENDAR_TOPIC_GROUP = "calendar-activity";

    const EVENT_IN_NEGOTIATION = "cal-event-no-closure";
    const EVENT_STATE_FROZEN = "cal-event-freeze";

    var cnst = {
        USER_CHAT_PATH,
        SUGGEST_CHANGE_EVENT_TOPIC,
        ACCEPT_EVENT_TOPIC,
        SCHEDULER_ACCEPTED_TOPIC,
        REJECT_EVENT_TOPIC,
        NOTIFY_TIMELINE_CHANGE,
        TIMELINE_UPDATE_READY,
        REQUEST_EVENT_TOPIC,
        REQUEST_EVENT_CHANGE_TOPIC,
        REQUEST_EVENT_DROP_TOPIC,
        APPRISE_NEW_MONTH_DATA,
        EVENT_IN_NEGOTIATION,
        EVENT_STATE_FROZEN,
        CALENDAR_TOPIC_GROUP
    };

    /* src/DayEventsRequests.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1$2 } = globals;
    const file$7 = "src/DayEventsRequests.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[61] = list[i];
    	return child_ctx;
    }

    // (458:4) {#if show_editor }
    function create_if_block_8(ctx) {
    	let div;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let button2;
    	let t10;
    	let button3;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*editor_for_cancel*/ ctx[16]) return create_if_block_9;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "Respond to event at:";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*maybe_event_time*/ ctx[12]);
    			br = element("br");
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "accept";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "update";
    			t8 = space();
    			button2 = element("button");
    			button2.textContent = "drop";
    			t10 = space();
    			button3 = element("button");
    			button3.textContent = "cancel";
    			attr_dev(span0, "class", "scheduler-hn svelte-174b2s8");
    			add_location(span0, file$7, 459, 8, 13716);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$7, 460, 8, 13780);
    			add_location(br, file$7, 460, 63, 13835);
    			add_location(button0, file$7, 483, 8, 15776);
    			add_location(button1, file$7, 484, 8, 15840);
    			add_location(button2, file$7, 485, 8, 15906);
    			add_location(button3, file$7, 487, 8, 15969);
    			attr_dev(div, "class", "scheduler-box svelte-174b2s8");
    			add_location(div, file$7, 458, 4, 13680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(div, br);
    			append_dev(div, t3);
    			if_block.m(div, null);
    			append_dev(div, t4);
    			append_dev(div, button0);
    			append_dev(div, t6);
    			append_dev(div, button1);
    			append_dev(div, t8);
    			append_dev(div, button2);
    			append_dev(div, t10);
    			append_dev(div, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*publish_event_accept*/ ctx[21], false, false, false),
    					listen_dev(button1, "click", /*publish_event_revision*/ ctx[22], false, false, false),
    					listen_dev(button2, "click", /*publish_event_cancel*/ ctx[23], false, false, false),
    					listen_dev(button3, "click", /*hide_editor*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_time*/ 4096) set_data_dev(t2, /*maybe_event_time*/ ctx[12]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t4);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(458:4) {#if show_editor }",
    		ctx
    	});

    	return block;
    }

    // (473:8) {:else}
    function create_else_block_1(ctx) {
    	let span0;
    	let t1;
    	let br0;
    	let t2;
    	let span1;
    	let input0;
    	let br1;
    	let t4;
    	let span2;
    	let input1;
    	let br2;
    	let t6;
    	let span3;
    	let t8;
    	let br3;
    	let t9;
    	let span4;
    	let t11;
    	let br4;
    	let t12;
    	let span5;
    	let input2;
    	let t14;
    	let span6;
    	let input3;
    	let br5;
    	let t16;
    	let span7;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let br6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Topic:";
    			t1 = text(/*maybe_event_topic*/ ctx[4]);
    			br0 = element("br");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Enter your id:";
    			input0 = element("input");
    			br1 = element("br");
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "Enter your event code:";
    			input1 = element("input");
    			br2 = element("br");
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "Email:";
    			t8 = text(/*maybe_event_email*/ ctx[6]);
    			br3 = element("br");
    			t9 = space();
    			span4 = element("span");
    			span4.textContent = "Phone:";
    			t11 = text(/*maybe_event_contact_phone*/ ctx[7]);
    			br4 = element("br");
    			t12 = space();
    			span5 = element("span");
    			span5.textContent = "by zoom: ";
    			input2 = element("input");
    			t14 = space();
    			span6 = element("span");
    			span6.textContent = "in person: ";
    			input3 = element("input");
    			br5 = element("br");
    			t16 = space();
    			span7 = element("span");
    			t17 = text("for ");
    			t18 = text(/*maybe_event_how_long*/ ctx[10]);
    			t19 = text(" minutes");
    			t20 = text(/*maybe_event_how_long*/ ctx[10]);
    			br6 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$7, 473, 8, 14934);
    			add_location(br0, file$7, 473, 70, 14996);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$7, 474, 8, 15009);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$7, 474, 59, 15060);
    			add_location(br1, file$7, 474, 107, 15108);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$7, 475, 8, 15121);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$7, 475, 67, 15180);
    			add_location(br2, file$7, 475, 117, 15230);
    			attr_dev(span3, "class", "scheduler-label svelte-174b2s8");
    			add_location(span3, file$7, 476, 8, 15243);
    			add_location(br3, file$7, 476, 70, 15305);
    			attr_dev(span4, "class", "scheduler-label svelte-174b2s8");
    			add_location(span4, file$7, 477, 8, 15318);
    			add_location(br4, file$7, 477, 78, 15388);
    			attr_dev(span5, "class", "scheduler-label svelte-174b2s8");
    			add_location(span5, file$7, 478, 8, 15401);
    			attr_dev(input2, "type", "checkbox");
    			input2.disabled = true;
    			add_location(input2, file$7, 478, 54, 15447);
    			attr_dev(span6, "class", "scheduler-label svelte-174b2s8");
    			add_location(span6, file$7, 479, 8, 15522);
    			attr_dev(input3, "type", "checkbox");
    			input3.disabled = true;
    			add_location(input3, file$7, 479, 56, 15570);
    			add_location(br5, file$7, 479, 128, 15642);
    			attr_dev(span7, "class", "scheduler-label svelte-174b2s8");
    			add_location(span7, file$7, 480, 8, 15655);
    			add_location(br6, file$7, 480, 101, 15748);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_id*/ ctx[5]);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*maybe_event_code*/ ctx[14]);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, span3, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span4, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, span5, anchor);
    			insert_dev(target, input2, anchor);
    			input2.checked = /*maybe_event_zoom*/ ctx[8];
    			insert_dev(target, t14, anchor);
    			insert_dev(target, span6, anchor);
    			insert_dev(target, input3, anchor);
    			input3.checked = /*maybe_event_in_person*/ ctx[9];
    			insert_dev(target, br5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, span7, anchor);
    			append_dev(span7, t17);
    			append_dev(span7, t18);
    			append_dev(span7, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, br6, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_2*/ ctx[46]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[47]),
    					listen_dev(input2, "change", /*input2_change_handler_1*/ ctx[48]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[49])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_topic*/ 16) set_data_dev(t1, /*maybe_event_topic*/ ctx[4]);

    			if (dirty[0] & /*maybe_event_id*/ 32 && input0.value !== /*maybe_event_id*/ ctx[5]) {
    				set_input_value(input0, /*maybe_event_id*/ ctx[5]);
    			}

    			if (dirty[0] & /*maybe_event_code*/ 16384 && input1.value !== /*maybe_event_code*/ ctx[14]) {
    				set_input_value(input1, /*maybe_event_code*/ ctx[14]);
    			}

    			if (dirty[0] & /*maybe_event_email*/ 64) set_data_dev(t8, /*maybe_event_email*/ ctx[6]);
    			if (dirty[0] & /*maybe_event_contact_phone*/ 128) set_data_dev(t11, /*maybe_event_contact_phone*/ ctx[7]);

    			if (dirty[0] & /*maybe_event_zoom*/ 256) {
    				input2.checked = /*maybe_event_zoom*/ ctx[8];
    			}

    			if (dirty[0] & /*maybe_event_in_person*/ 512) {
    				input3.checked = /*maybe_event_in_person*/ ctx[9];
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 1024) set_data_dev(t18, /*maybe_event_how_long*/ ctx[10]);
    			if (dirty[0] & /*maybe_event_how_long*/ 1024) set_data_dev(t20, /*maybe_event_how_long*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span4);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(span6);
    			if (detaching) detach_dev(input3);
    			if (detaching) detach_dev(br5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(span7);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(br6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(473:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (463:8) {#if !(editor_for_cancel) }
    function create_if_block_9(ctx) {
    	let span0;
    	let input0;
    	let br0;
    	let t1;
    	let t2;
    	let span1;
    	let input1;
    	let t4;
    	let span2;
    	let input2;
    	let br1;
    	let t6;
    	let span3;
    	let t7;
    	let t8;
    	let t9;
    	let input3;
    	let br2;
    	let mounted;
    	let dispose;
    	let if_block = !/*model_general_class*/ ctx[3] && create_if_block_10(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Enter a topic:";
    			input0 = element("input");
    			br0 = element("br");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "by zoom: ";
    			input1 = element("input");
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "in person: ";
    			input2 = element("input");
    			br1 = element("br");
    			t6 = space();
    			span3 = element("span");
    			t7 = text("for ");
    			t8 = text(/*maybe_event_how_long*/ ctx[10]);
    			t9 = text(" minutes");
    			input3 = element("input");
    			br2 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$7, 463, 8, 13917);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter a topic label");
    			add_location(input0, file$7, 463, 59, 13968);
    			add_location(br0, file$7, 463, 143, 14052);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$7, 469, 8, 14483);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$7, 469, 54, 14529);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$7, 470, 8, 14593);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$7, 470, 56, 14641);
    			add_location(br1, file$7, 470, 116, 14701);
    			attr_dev(span3, "class", "scheduler-label svelte-174b2s8");
    			add_location(span3, file$7, 471, 8, 14714);
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "min", /*maybe_event_lb*/ ctx[17]);
    			attr_dev(input3, "max", /*maybe_event_ub*/ ctx[13]);
    			attr_dev(input3, "step", /*maybe_event_step*/ ctx[18]);
    			add_location(input3, file$7, 471, 79, 14785);
    			add_location(br2, file$7, 471, 199, 14905);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_topic*/ ctx[4]);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input1, anchor);
    			input1.checked = /*maybe_event_zoom*/ ctx[8];
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input2, anchor);
    			input2.checked = /*maybe_event_in_person*/ ctx[9];
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t7);
    			append_dev(span3, t8);
    			append_dev(span3, t9);
    			insert_dev(target, input3, anchor);
    			set_input_value(input3, /*maybe_event_how_long*/ ctx[10]);
    			insert_dev(target, br2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[39]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[43]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[44]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[45]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[45])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_topic*/ 16 && input0.value !== /*maybe_event_topic*/ ctx[4]) {
    				set_input_value(input0, /*maybe_event_topic*/ ctx[4]);
    			}

    			if (!/*model_general_class*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_10(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*maybe_event_zoom*/ 256) {
    				input1.checked = /*maybe_event_zoom*/ ctx[8];
    			}

    			if (dirty[0] & /*maybe_event_in_person*/ 512) {
    				input2.checked = /*maybe_event_in_person*/ ctx[9];
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 1024) set_data_dev(t8, /*maybe_event_how_long*/ ctx[10]);

    			if (dirty[0] & /*maybe_event_ub*/ 8192) {
    				attr_dev(input3, "max", /*maybe_event_ub*/ ctx[13]);
    			}

    			if (dirty[0] & /*maybe_event_how_long*/ 1024) {
    				set_input_value(input3, /*maybe_event_how_long*/ ctx[10]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(input3);
    			if (detaching) detach_dev(br2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(463:8) {#if !(editor_for_cancel) }",
    		ctx
    	});

    	return block;
    }

    // (465:8) {#if !model_general_class }
    function create_if_block_10(ctx) {
    	let span0;
    	let input0;
    	let br0;
    	let t1;
    	let span1;
    	let input1;
    	let br1;
    	let t3;
    	let span2;
    	let input2;
    	let br2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Enter your id:";
    			input0 = element("input");
    			br0 = element("br");
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Enter your email:";
    			input1 = element("input");
    			br1 = element("br");
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Enter your phone:";
    			input2 = element("input");
    			br2 = element("br");
    			attr_dev(span0, "class", "scheduler-label svelte-174b2s8");
    			add_location(span0, file$7, 465, 12, 14105);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$7, 465, 63, 14156);
    			add_location(br0, file$7, 465, 111, 14204);
    			attr_dev(span1, "class", "scheduler-label svelte-174b2s8");
    			add_location(span1, file$7, 466, 12, 14221);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$7, 466, 66, 14275);
    			add_location(br1, file$7, 466, 117, 14326);
    			attr_dev(span2, "class", "scheduler-label svelte-174b2s8");
    			add_location(span2, file$7, 467, 12, 14343);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$7, 467, 66, 14397);
    			add_location(br2, file$7, 467, 125, 14456);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*maybe_event_id*/ ctx[5]);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*maybe_event_email*/ ctx[6]);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*maybe_event_contact_phone*/ ctx[7]);
    			insert_dev(target, br2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[40]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[41]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[42])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maybe_event_id*/ 32 && input0.value !== /*maybe_event_id*/ ctx[5]) {
    				set_input_value(input0, /*maybe_event_id*/ ctx[5]);
    			}

    			if (dirty[0] & /*maybe_event_email*/ 64 && input1.value !== /*maybe_event_email*/ ctx[6]) {
    				set_input_value(input1, /*maybe_event_email*/ ctx[6]);
    			}

    			if (dirty[0] & /*maybe_event_contact_phone*/ 128 && input2.value !== /*maybe_event_contact_phone*/ ctx[7]) {
    				set_input_value(input2, /*maybe_event_contact_phone*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(br2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(465:8) {#if !model_general_class }",
    		ctx
    	});

    	return block;
    }

    // (493:8) {#if (all_day_list !== undefined) }
    function create_if_block$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*revized_all_day_list*/ ctx[11];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*revized_all_day_list, handle_change_request*/ 1050624) {
    				each_value = /*revized_all_day_list*/ ctx[11];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
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
    		source: "(493:8) {#if (all_day_list !== undefined) }",
    		ctx
    	});

    	return block;
    }

    // (512:20) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*hour_data*/ ctx[61].label.length > 0 && create_if_block_7(ctx);
    	let if_block1 = /*hour_data*/ ctx[61].accepted > 0 && create_if_block_6(ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[51](/*hour_data*/ ctx[61], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("+30:\n                            ");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			attr_dev(div, "class", div_class_value = "half-hour-display " + /*hour_data*/ ctx[61].use + " svelte-174b2s8");
    			add_location(div, file$7, 512, 24, 17091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*hour_data*/ ctx[61].label.length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*hour_data*/ ctx[61].accepted > 0) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(div, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*revized_all_day_list*/ 2048 && div_class_value !== (div_class_value = "half-hour-display " + /*hour_data*/ ctx[61].use + " svelte-174b2s8")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(512:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (502:20) {#if !(hour_data.on_half_hour) }
    function create_if_block_3(ctx) {
    	let div;
    	let t0_value = /*hour_data*/ ctx[61].time + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*hour_data*/ ctx[61].label.length > 0 && create_if_block_5(ctx);
    	let if_block1 = /*hour_data*/ ctx[61].accepted > 0 && create_if_block_4(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[50](/*hour_data*/ ctx[61], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			attr_dev(div, "class", div_class_value = "hour-display " + /*hour_data*/ ctx[61].use + " svelte-174b2s8");
    			add_location(div, file$7, 502, 24, 16566);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*revized_all_day_list*/ 2048 && t0_value !== (t0_value = /*hour_data*/ ctx[61].time + "")) set_data_dev(t0, t0_value);

    			if (/*hour_data*/ ctx[61].label.length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*hour_data*/ ctx[61].accepted > 0) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(div, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*revized_all_day_list*/ 2048 && div_class_value !== (div_class_value = "hour-display " + /*hour_data*/ ctx[61].use + " svelte-174b2s8")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(502:20) {#if !(hour_data.on_half_hour) }",
    		ctx
    	});

    	return block;
    }

    // (495:16) {#if hour_data.use === USE_AS_BLOCK }
    function create_if_block_1$1(ctx) {
    	let if_block_anchor;
    	let if_block = !/*hour_data*/ ctx[61].on_half_hour && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*hour_data*/ ctx[61].on_half_hour) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(495:16) {#if hour_data.use === USE_AS_BLOCK }",
    		ctx
    	});

    	return block;
    }

    // (515:28) {#if hour_data.label.length > 0}
    function create_if_block_7(ctx) {
    	let span;
    	let t_value = /*hour_data*/ ctx[61].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$7, 515, 32, 17321);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*revized_all_day_list*/ 2048 && t_value !== (t_value = /*hour_data*/ ctx[61].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(515:28) {#if hour_data.label.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (518:28) {#if hour_data.accepted > 0}
    function create_if_block_6(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "✔️";
    			add_location(span, file$7, 518, 32, 17475);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(518:28) {#if hour_data.accepted > 0}",
    		ctx
    	});

    	return block;
    }

    // (505:28) {#if hour_data.label.length > 0}
    function create_if_block_5(ctx) {
    	let span;
    	let t_value = /*hour_data*/ ctx[61].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$7, 505, 32, 16804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*revized_all_day_list*/ 2048 && t_value !== (t_value = /*hour_data*/ ctx[61].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(505:28) {#if hour_data.label.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (508:28) {#if hour_data.accepted > 0}
    function create_if_block_4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "✔️";
    			add_location(span, file$7, 508, 32, 16958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(508:28) {#if hour_data.accepted > 0}",
    		ctx
    	});

    	return block;
    }

    // (496:20) {#if !(hour_data.on_half_hour) }
    function create_if_block_2$1(ctx) {
    	let div;
    	let t0_value = /*hour_data*/ ctx[61].time + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "hour-display blocked-hour svelte-174b2s8");
    			add_location(div, file$7, 496, 24, 16322);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*revized_all_day_list*/ 2048 && t0_value !== (t0_value = /*hour_data*/ ctx[61].time + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(496:20) {#if !(hour_data.on_half_hour) }",
    		ctx
    	});

    	return block;
    }

    // (494:12) {#each revized_all_day_list as hour_data}
    function create_each_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*hour_data*/ ctx[61].use === USE_AS_BLOCK$2) return create_if_block_1$1;
    		if (!/*hour_data*/ ctx[61].on_half_hour) return create_if_block_3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
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
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(494:12) {#each revized_all_day_list as hour_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let h3;
    	let t6;
    	let div0;
    	let if_block0 = /*show_editor*/ ctx[15] && create_if_block_8(ctx);
    	let if_block1 = /*all_day_list*/ ctx[2] !== undefined && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			t0 = text(/*monthstr*/ ctx[1]);
    			t1 = text("  ");
    			t2 = text(/*day*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "events";
    			t6 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			add_location(h2, file$7, 455, 0, 13585);
    			attr_dev(h3, "class", "svelte-174b2s8");
    			add_location(h3, file$7, 490, 4, 16041);
    			attr_dev(div0, "class", "day-list-holder svelte-174b2s8");
    			add_location(div0, file$7, 491, 4, 16063);
    			attr_dev(div1, "class", "contain-controls svelte-174b2s8");
    			add_location(div1, file$7, 456, 0, 13622);
    			attr_dev(div2, "class", "contain-all svelte-174b2s8");
    			add_location(div2, file$7, 454, 0, 13559);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, h3);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*monthstr*/ 2) set_data_dev(t0, /*monthstr*/ ctx[1]);
    			if (dirty[0] & /*day*/ 1) set_data_dev(t2, /*day*/ ctx[0]);

    			if (/*show_editor*/ ctx[15]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(div1, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*all_day_list*/ ctx[2] !== undefined) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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

    const ONE_QUARTER_HOUR_MINUTES$2 = 15;
    const ONE_HALF_HOUR_MINUTES$2 = 30;
    const USE_AS_BLOCK$2 = "block";
    const USE_AS_MEET$2 = "meeting";
    const USE_AS_ACTIVITY$2 = "activity";
    const USE_AS_OPEN$2 = "open";

    function set_ev_values(time, model_ev, ev, how_long) {
    	if (ev === undefined) {
    		return;
    	}

    	model_ev.use = ev.use;
    	model_ev.end_at = ev.end_at;
    	model_ev.how_long = how_long !== undefined ? how_long : ev.how_long;

    	//
    	model_ev.use = ev.use;

    	//
    	model_ev.begin_at = time;

    	model_ev.label = ev.label;
    	model_ev.person_id = ev.person_id;
    	model_ev.email = ev.email;
    	model_ev.contact_phone = ev.contact_phone;
    	model_ev.on_zoom = ev.on_zoom;
    	model_ev.in_person = ev.in_person;
    	model_ev.user_id = ev.user_id;
    	model_ev.accepted = ev.accepted;
    	model_ev.revision_state = ev.revision_state;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DayEventsRequests', slots, []);
    	let { day } = $$props;
    	let { monthstr } = $$props;
    	let { all_day_list } = $$props;
    	let { day_event_count = 0 } = $$props;
    	let { month } = $$props;
    	let { year } = $$props;
    	let { model_how_long } = $$props;
    	let { model_general_class } = $$props;
    	let { tz_hour_shift } = $$props;
    	let { user_id } = $$props;
    	let { time_zone } = $$props;
    	let { ui_user_id } = $$props;
    	const ONE_MINUTE = 60 * 1000;
    	const ONE_HOUR = 3600 * 1000;
    	const ONE_HALF_HOUR = 3600 * 500;
    	const ONE_QUARTER_HOUR = 3600 * 250;
    	let maybe_event_time = "none scheduled";
    	let maybe_event_topic = "";
    	let maybe_event_id = "";
    	let maybe_event_email = "";
    	let maybe_event_contact_phone = "";
    	let maybe_event_zoom = false;
    	let maybe_event_in_person = false;
    	let maybe_event_index = 0;
    	let maybe_event_half_hour = false;
    	let maybe_event_how_long = 0;
    	let maybe_event_lb = 15;
    	let maybe_event_ub = 30;
    	let maybe_event_step = 15;
    	let maybe_event_code = "";
    	let show_editor = false;
    	let editor_for_new = false;
    	let editor_for_update = false;
    	let editor_for_cancel = false;
    	let topic_group = cnst.CALENDAR_TOPIC_GROUP;
    	let revized_all_day_list = [];
    	let events_in_play = {};
    	let tzoff = 0;
    	let tzoof_ts = 0;
    	let src_date = new Date(year, month, day);
    	let dropped_event = false;
    	let changed_event = false;
    	let updating_event = false;

    	function hide_editor() {
    		$$invalidate(15, show_editor = false);
    		editor_for_new = false;
    		editor_for_update = false;
    		$$invalidate(16, editor_for_cancel = false);
    	}

    	function handle_change_request(hour_data) {
    		//
    		let real_start = hour_data;

    		//
    		if (hour_data.use !== USE_AS_OPEN$2) {
    			let ri = hour_data.index;

    			while (ri > 0) {
    				ri--;
    				let maybe_real = revized_all_day_list[ri];

    				if (maybe_real.use === real_start.use && maybe_real.label === real_start.label) {
    					real_start = maybe_real;
    				} else break;
    			}
    		}

    		//  WHO OWNS
    		//
    		let src_ev = events_in_play[real_start.begin_at - tzoof_ts];

    		if (src_ev === undefined) {
    			if (real_start.use === USE_AS_OPEN$2) {
    				editor_for_new = true;
    			} else if (real_start.use !== USE_AS_BLOCK$2 && real_start.changed) {
    				// or this is the owner....
    				editor_for_update = true;
    			} else if (real_start.use !== USE_AS_BLOCK$2 && !real_start.changed) {
    				$$invalidate(16, editor_for_cancel = true); // 
    			}

    			$$invalidate(10, maybe_event_how_long = real_start.how_long);
    			$$invalidate(32, maybe_event_index = real_start.index);
    			$$invalidate(12, maybe_event_time = real_start.time);
    			maybe_event_half_hour = real_start.on_half_hour;

    			//
    			$$invalidate(4, maybe_event_topic = real_start.label);

    			$$invalidate(5, maybe_event_id = real_start.person_id);
    			$$invalidate(6, maybe_event_email = real_start.email);
    			$$invalidate(7, maybe_event_contact_phone = real_start.contact_phone);
    			$$invalidate(8, maybe_event_zoom = real_start.on_zoom);
    			$$invalidate(9, maybe_event_in_person = real_start.in_person);
    		} else {
    			if (src_ev.revision_state === cnst.EVENT_IN_NEGOTIATION && src_ev.user_id === ui_user_id) {
    				// or this is the owner....
    				editor_for_update = true;
    			} else {
    				$$invalidate(16, editor_for_cancel = true); // 
    			}

    			$$invalidate(10, maybe_event_how_long = src_ev.how_long);
    			$$invalidate(32, maybe_event_index = src_ev.index);
    			$$invalidate(12, maybe_event_time = src_ev.time);
    			maybe_event_half_hour = src_ev.on_half_hour;

    			//
    			$$invalidate(4, maybe_event_topic = src_ev.label);

    			$$invalidate(5, maybe_event_id = src_ev.person_id);
    			$$invalidate(6, maybe_event_email = src_ev.email);
    			$$invalidate(7, maybe_event_contact_phone = src_ev.contact_phone);
    			$$invalidate(8, maybe_event_zoom = src_ev.on_zoom);
    			$$invalidate(9, maybe_event_in_person = src_ev.in_person);
    		}

    		//
    		$$invalidate(15, show_editor = true);

    		//
    		if (editor_for_new) {
    			let current_ub = 0;
    			let i = maybe_event_index;

    			while (++i < 48) {
    				current_ub += ONE_HALF_HOUR_MINUTES$2;
    				let nxt_slot = revized_all_day_list[i];
    				if (nxt_slot.use !== USE_AS_OPEN$2) break;
    			}

    			$$invalidate(13, maybe_event_ub = current_ub);
    		} else if (editor_for_update) {
    			// can increase the duration of the event
    			let current_ub = 0;

    			let i = maybe_event_index;

    			while (++i < 48) {
    				current_ub += ONE_HALF_HOUR_MINUTES$2;
    				let nxt_slot = revized_all_day_list[i];
    				if (nxt_slot.use !== USE_AS_OPEN$2 && nxt_slot.label !== maybe_event_topic) break;
    			}

    			$$invalidate(13, maybe_event_ub = current_ub);
    		}
    	} //

    	function publish_event_accept(ev) {
    		hide_editor();
    		$$invalidate(37, changed_event = true);
    		$$invalidate(38, updating_event = false);
    		$$invalidate(24, day_event_count++, day_event_count);
    	} //

    	function publish_event_revision(ev) {
    		let model_ev = all_day_list[maybe_event_index];
    		model_ev.use = USE_AS_MEET$2;
    		hide_editor();
    		model_ev.changed = false;
    		let total_time = model_ev.how_long;
    		let ch_i = maybe_event_index;

    		while (total_time > 0) {
    			total_time -= 30;
    			ch_i++;

    			if (total_time > 0) {
    				let ntxt_slot = all_day_list[ch_i];
    				ntxt_slot.changed = false;
    				ntxt_slot.use = USE_AS_OPEN$2;
    				ntxt_slot.label = "";
    			}
    		}

    		//
    		model_ev.changed = true;

    		$$invalidate(37, changed_event = true);
    		$$invalidate(38, updating_event = true);
    	} //

    	function publish_event_cancel(ev) {
    		//
    		hide_editor();

    		//
    		$$invalidate(37, changed_event = false);

    		$$invalidate(38, updating_event = false);
    		$$invalidate(36, dropped_event = true);
    		$$invalidate(24, day_event_count--, day_event_count);
    	} // 

    	const writable_props = [
    		'day',
    		'monthstr',
    		'all_day_list',
    		'day_event_count',
    		'month',
    		'year',
    		'model_how_long',
    		'model_general_class',
    		'tz_hour_shift',
    		'user_id',
    		'time_zone',
    		'ui_user_id'
    	];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DayEventsRequests> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		maybe_event_topic = this.value;
    		$$invalidate(4, maybe_event_topic);
    	}

    	function input0_input_handler_1() {
    		maybe_event_id = this.value;
    		$$invalidate(5, maybe_event_id);
    	}

    	function input1_input_handler() {
    		maybe_event_email = this.value;
    		$$invalidate(6, maybe_event_email);
    	}

    	function input2_input_handler() {
    		maybe_event_contact_phone = this.value;
    		$$invalidate(7, maybe_event_contact_phone);
    	}

    	function input1_change_handler() {
    		maybe_event_zoom = this.checked;
    		$$invalidate(8, maybe_event_zoom);
    	}

    	function input2_change_handler() {
    		maybe_event_in_person = this.checked;
    		$$invalidate(9, maybe_event_in_person);
    	}

    	function input3_change_input_handler() {
    		maybe_event_how_long = to_number(this.value);
    		($$invalidate(10, maybe_event_how_long), $$invalidate(27, model_how_long));
    	}

    	function input0_input_handler_2() {
    		maybe_event_id = this.value;
    		$$invalidate(5, maybe_event_id);
    	}

    	function input1_input_handler_1() {
    		maybe_event_code = this.value;
    		$$invalidate(14, maybe_event_code);
    	}

    	function input2_change_handler_1() {
    		maybe_event_zoom = this.checked;
    		$$invalidate(8, maybe_event_zoom);
    	}

    	function input3_change_handler() {
    		maybe_event_in_person = this.checked;
    		$$invalidate(9, maybe_event_in_person);
    	}

    	const click_handler = (hour_data, ev) => {
    		handle_change_request(hour_data);
    	};

    	const click_handler_1 = (hour_data, ev) => {
    		handle_change_request(hour_data);
    	};

    	$$self.$$set = $$props => {
    		if ('day' in $$props) $$invalidate(0, day = $$props.day);
    		if ('monthstr' in $$props) $$invalidate(1, monthstr = $$props.monthstr);
    		if ('all_day_list' in $$props) $$invalidate(2, all_day_list = $$props.all_day_list);
    		if ('day_event_count' in $$props) $$invalidate(24, day_event_count = $$props.day_event_count);
    		if ('month' in $$props) $$invalidate(25, month = $$props.month);
    		if ('year' in $$props) $$invalidate(26, year = $$props.year);
    		if ('model_how_long' in $$props) $$invalidate(27, model_how_long = $$props.model_how_long);
    		if ('model_general_class' in $$props) $$invalidate(3, model_general_class = $$props.model_general_class);
    		if ('tz_hour_shift' in $$props) $$invalidate(28, tz_hour_shift = $$props.tz_hour_shift);
    		if ('user_id' in $$props) $$invalidate(29, user_id = $$props.user_id);
    		if ('time_zone' in $$props) $$invalidate(30, time_zone = $$props.time_zone);
    		if ('ui_user_id' in $$props) $$invalidate(31, ui_user_id = $$props.ui_user_id);
    	};

    	$$self.$capture_state = () => ({
    		publish,
    		cnst,
    		getTimezoneOffset,
    		timestamp_db,
    		day,
    		monthstr,
    		all_day_list,
    		day_event_count,
    		month,
    		year,
    		model_how_long,
    		model_general_class,
    		tz_hour_shift,
    		user_id,
    		time_zone,
    		ui_user_id,
    		ONE_MINUTE,
    		ONE_HOUR,
    		ONE_HALF_HOUR,
    		ONE_QUARTER_HOUR,
    		ONE_QUARTER_HOUR_MINUTES: ONE_QUARTER_HOUR_MINUTES$2,
    		ONE_HALF_HOUR_MINUTES: ONE_HALF_HOUR_MINUTES$2,
    		USE_AS_BLOCK: USE_AS_BLOCK$2,
    		USE_AS_MEET: USE_AS_MEET$2,
    		USE_AS_ACTIVITY: USE_AS_ACTIVITY$2,
    		USE_AS_OPEN: USE_AS_OPEN$2,
    		maybe_event_time,
    		maybe_event_topic,
    		maybe_event_id,
    		maybe_event_email,
    		maybe_event_contact_phone,
    		maybe_event_zoom,
    		maybe_event_in_person,
    		maybe_event_index,
    		maybe_event_half_hour,
    		maybe_event_how_long,
    		maybe_event_lb,
    		maybe_event_ub,
    		maybe_event_step,
    		maybe_event_code,
    		show_editor,
    		editor_for_new,
    		editor_for_update,
    		editor_for_cancel,
    		topic_group,
    		revized_all_day_list,
    		events_in_play,
    		tzoff,
    		tzoof_ts,
    		src_date,
    		set_ev_values,
    		dropped_event,
    		changed_event,
    		updating_event,
    		hide_editor,
    		handle_change_request,
    		publish_event_accept,
    		publish_event_revision,
    		publish_event_cancel
    	});

    	$$self.$inject_state = $$props => {
    		if ('day' in $$props) $$invalidate(0, day = $$props.day);
    		if ('monthstr' in $$props) $$invalidate(1, monthstr = $$props.monthstr);
    		if ('all_day_list' in $$props) $$invalidate(2, all_day_list = $$props.all_day_list);
    		if ('day_event_count' in $$props) $$invalidate(24, day_event_count = $$props.day_event_count);
    		if ('month' in $$props) $$invalidate(25, month = $$props.month);
    		if ('year' in $$props) $$invalidate(26, year = $$props.year);
    		if ('model_how_long' in $$props) $$invalidate(27, model_how_long = $$props.model_how_long);
    		if ('model_general_class' in $$props) $$invalidate(3, model_general_class = $$props.model_general_class);
    		if ('tz_hour_shift' in $$props) $$invalidate(28, tz_hour_shift = $$props.tz_hour_shift);
    		if ('user_id' in $$props) $$invalidate(29, user_id = $$props.user_id);
    		if ('time_zone' in $$props) $$invalidate(30, time_zone = $$props.time_zone);
    		if ('ui_user_id' in $$props) $$invalidate(31, ui_user_id = $$props.ui_user_id);
    		if ('maybe_event_time' in $$props) $$invalidate(12, maybe_event_time = $$props.maybe_event_time);
    		if ('maybe_event_topic' in $$props) $$invalidate(4, maybe_event_topic = $$props.maybe_event_topic);
    		if ('maybe_event_id' in $$props) $$invalidate(5, maybe_event_id = $$props.maybe_event_id);
    		if ('maybe_event_email' in $$props) $$invalidate(6, maybe_event_email = $$props.maybe_event_email);
    		if ('maybe_event_contact_phone' in $$props) $$invalidate(7, maybe_event_contact_phone = $$props.maybe_event_contact_phone);
    		if ('maybe_event_zoom' in $$props) $$invalidate(8, maybe_event_zoom = $$props.maybe_event_zoom);
    		if ('maybe_event_in_person' in $$props) $$invalidate(9, maybe_event_in_person = $$props.maybe_event_in_person);
    		if ('maybe_event_index' in $$props) $$invalidate(32, maybe_event_index = $$props.maybe_event_index);
    		if ('maybe_event_half_hour' in $$props) maybe_event_half_hour = $$props.maybe_event_half_hour;
    		if ('maybe_event_how_long' in $$props) $$invalidate(10, maybe_event_how_long = $$props.maybe_event_how_long);
    		if ('maybe_event_lb' in $$props) $$invalidate(17, maybe_event_lb = $$props.maybe_event_lb);
    		if ('maybe_event_ub' in $$props) $$invalidate(13, maybe_event_ub = $$props.maybe_event_ub);
    		if ('maybe_event_step' in $$props) $$invalidate(18, maybe_event_step = $$props.maybe_event_step);
    		if ('maybe_event_code' in $$props) $$invalidate(14, maybe_event_code = $$props.maybe_event_code);
    		if ('show_editor' in $$props) $$invalidate(15, show_editor = $$props.show_editor);
    		if ('editor_for_new' in $$props) editor_for_new = $$props.editor_for_new;
    		if ('editor_for_update' in $$props) editor_for_update = $$props.editor_for_update;
    		if ('editor_for_cancel' in $$props) $$invalidate(16, editor_for_cancel = $$props.editor_for_cancel);
    		if ('topic_group' in $$props) topic_group = $$props.topic_group;
    		if ('revized_all_day_list' in $$props) $$invalidate(11, revized_all_day_list = $$props.revized_all_day_list);
    		if ('events_in_play' in $$props) events_in_play = $$props.events_in_play;
    		if ('tzoff' in $$props) $$invalidate(33, tzoff = $$props.tzoff);
    		if ('tzoof_ts' in $$props) $$invalidate(34, tzoof_ts = $$props.tzoof_ts);
    		if ('src_date' in $$props) $$invalidate(35, src_date = $$props.src_date);
    		if ('dropped_event' in $$props) $$invalidate(36, dropped_event = $$props.dropped_event);
    		if ('changed_event' in $$props) $$invalidate(37, changed_event = $$props.changed_event);
    		if ('updating_event' in $$props) $$invalidate(38, updating_event = $$props.updating_event);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*year, month, day, time_zone*/ 1174405121 | $$self.$$.dirty[1] & /*src_date, tzoff*/ 20) {
    			// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    			{
    				$$invalidate(35, src_date = new Date(year, month, day)); // these have been passed
    				let time = src_date.getTime();
    				$$invalidate(33, tzoff = getTimezoneOffset(time_zone, time));
    				$$invalidate(34, tzoof_ts = tzoff * ONE_HOUR);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*all_day_list, year, month, day, revized_all_day_list*/ 100665349 | $$self.$$.dirty[1] & /*tzoof_ts*/ 8) {
    			if (all_day_list !== undefined) {
    				//
    				let d_date = new Date(year, month, day);

    				let n = all_day_list.length;
    				$$invalidate(11, revized_all_day_list = [].fill(0, n));

    				for (let i = 0; i < n; i++) {
    					//
    					//
    					let time = d_date.getTime();

    					//
    					$$invalidate(11, revized_all_day_list[i] = Object.assign({}, all_day_list[i]), revized_all_day_list);

    					//
    					let ev = timestamp_db.find_event(time - tzoof_ts);

    					if (ev !== false) {
    						(ev.end_at - time + tzoof_ts) / ONE_MINUTE;
    						let t = time - tzoof_ts;

    						//
    						if (ev.use !== USE_AS_BLOCK$2 && ev.use !== USE_AS_OPEN$2) {
    							events_in_play[t] = ev;
    						}

    						//
    						$$invalidate(11, revized_all_day_list[i] = Object.assign({}, all_day_list[i]), revized_all_day_list);

    						let model_ev = revized_all_day_list[i];
    						set_ev_values(time, model_ev, ev);

    						//
    						if (ev.how_long > 30) {
    							t += ONE_HALF_HOUR;
    							ev.how_long - 30;

    							while (t < ev.end_at && i < 48) {
    								i++;
    								if (i === 48) break;
    								time += ONE_HALF_HOUR;
    								t += ONE_HALF_HOUR;
    								d_date = new Date(time);

    								//
    								$$invalidate(11, revized_all_day_list[i] = Object.assign({}, all_day_list[i]), revized_all_day_list);

    								let model_ev = revized_all_day_list[i];
    								set_ev_values(time, model_ev, ev, revized_all_day_list[i - 1].how_long - 30);
    							} //
    						}
    					} else {
    						$$invalidate(11, revized_all_day_list[i].use = USE_AS_OPEN$2, revized_all_day_list);
    					}

    					//
    					time += ONE_HALF_HOUR;

    					d_date = new Date(time);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*model_how_long*/ 134217728) {
    			if (typeof model_how_long === 'number') {
    				$$invalidate(10, maybe_event_how_long = model_how_long);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*all_day_list, revized_all_day_list, maybe_event_how_long, maybe_event_topic, maybe_event_id, maybe_event_email, maybe_event_contact_phone, maybe_event_zoom, maybe_event_in_person, month, year*/ 100667380 | $$self.$$.dirty[1] & /*changed_event, maybe_event_index, ui_user_id, updating_event, tzoof_ts*/ 203) {
    			if (changed_event && all_day_list !== undefined) {
    				$$invalidate(37, changed_event = false);
    				let model_ev = revized_all_day_list[maybe_event_index];
    				model_ev.changed = true;
    				model_ev.how_long = maybe_event_how_long;
    				model_ev.end_at = model_ev.begin_at + maybe_event_how_long * ONE_MINUTE;
    				model_ev.label = maybe_event_topic;
    				model_ev.person_id = maybe_event_id;
    				model_ev.email = maybe_event_email;
    				model_ev.contact_phone = maybe_event_contact_phone;
    				model_ev.on_zoom = maybe_event_zoom;
    				model_ev.in_person = maybe_event_in_person;

    				//
    				model_ev.user_id = ui_user_id;

    				model_ev.accepted = false;
    				model_ev.month = month;
    				model_ev.year = year;

    				if (!updating_event) {
    					model_ev.revision_state = cnst.EVENT_IN_NEGOTIATION;
    				}

    				let total_time = maybe_event_how_long;
    				let ch_i = maybe_event_index;

    				while (total_time > 0) {
    					total_time -= 30;
    					ch_i++;

    					if (total_time > 0) {
    						let ntxt_slot = revized_all_day_list[ch_i];
    						ntxt_slot.changed = true;
    						ntxt_slot.use = model_ev.use;
    						ntxt_slot.how_long = model_ev.how_long;
    						ntxt_slot.label = model_ev.label;

    						//
    						ntxt_slot.person_id = model_ev.person_id;

    						ntxt_slot.email = model_ev.email;
    						ntxt_slot.contact_phone = model_ev.contact_phone;
    						ntxt_slot.on_zoom = model_ev.on_zoom;
    						ntxt_slot.in_person = model_ev.in_person;
    						ntxt_slot.accepted = model_ev.accepted;
    						ntxt_slot.revision_state = model_ev.revision_state;

    						//
    						$$invalidate(11, revized_all_day_list[ch_i] = ntxt_slot, revized_all_day_list);
    					}
    				}

    				$$invalidate(11, revized_all_day_list[maybe_event_index] = model_ev, revized_all_day_list);

    				//
    				//all_day_list = [].concat(revized_all_day_list)
    				let ev_utc = Object.assign({}, model_ev); // tzoof_ts

    				ev_utc.begin_at -= tzoof_ts;
    				ev_utc.end_at -= tzoof_ts;

    				//
    				// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    				//
    				if (updating_event) {
    					let uid_topic = ev_utc.user_id;
    					ev_utc.accepted = true;

    					//
    					publish(cnst.CALENDAR_TOPIC_GROUP, uid_topic, cnst.USER_CHAT_PATH, {
    						// cnst.ACCEPT_EVENT_TOPIC
    						"type": "change",
    						"data": ev_utc
    					});

    					setTimeout(
    						() => {
    							// after svelte changes
    							publish(cnst.CALENDAR_TOPIC_GROUP, consts.SUGGEST_CHANGE_EVENT_TOPIC, consts.USER_CHAT_PATH, { "type": "change", "data": ev_utc });
    						},
    						5
    					);
    				} else {
    					let uid_topic = ev_utc.user_id;
    					ev_utc.accepted = true;

    					//
    					publish(cnst.CALENDAR_TOPIC_GROUP, uid_topic, cnst.USER_CHAT_PATH, {
    						// cnst.ACCEPT_EVENT_TOPIC
    						"type": "accept",
    						"data": ev_utc
    					});

    					setTimeout(
    						() => {
    							// after svelte changes
    							publish(cnst.CALENDAR_TOPIC_GROUP, cnst.ACCEPT_EVENT_TOPIC, cnst.USER_CHAT_PATH, { "type": "change", "data": ev_utc });
    						},
    						5
    					);
    				}

    				timestamp_db.add(ev_utc);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*all_day_list, revized_all_day_list, maybe_event_how_long*/ 3076 | $$self.$$.dirty[1] & /*dropped_event, maybe_event_index, tzoof_ts*/ 42) {
    			if (dropped_event && all_day_list !== undefined) {
    				$$invalidate(36, dropped_event = false);
    				let model_ev = revized_all_day_list[maybe_event_index];
    				model_ev.how_long = 15;
    				model_ev.label = "";
    				model_ev.person_id = "";
    				model_ev.email = "";
    				model_ev.contact_phone = "";
    				model_ev.on_zoom = false;
    				model_ev.in_person = false;
    				model_ev.use = USE_AS_OPEN$2;
    				let total_time = maybe_event_how_long;
    				let ch_i = maybe_event_index;

    				while (total_time > 0) {
    					total_time -= 30;
    					ch_i++;

    					if (total_time > 0) {
    						let ntxt_slot = revized_all_day_list[ch_i];
    						ntxt_slot.changed = true;
    						ntxt_slot.use = model_ev.use;
    						ntxt_slot.how_long = model_ev.how_long;
    						ntxt_slot.label = model_ev.label;

    						//
    						ntxt_slot.person_id = model_ev.person_id;

    						ntxt_slot.email = model_ev.email;
    						ntxt_slot.contact_phone = model_ev.contact_phone;
    						ntxt_slot.on_zoom = model_ev.on_zoom;
    						ntxt_slot.in_person = model_ev.in_person;
    						ntxt_slot.accepted = model_ev.accepted;

    						//
    						ntxt_slot.use = USE_AS_OPEN$2;

    						//
    						$$invalidate(11, revized_all_day_list[ch_i] = ntxt_slot, revized_all_day_list);
    					}
    				}

    				$$invalidate(11, revized_all_day_list[maybe_event_index] = model_ev, revized_all_day_list);

    				//all_day_list = [].concat(revized_all_day_list)
    				let ev_utc = Object.assign({}, model_ev); // tzoof_ts

    				ev_utc.begin_at -= tzoof_ts;
    				ev_utc.end_at -= tzoof_ts;
    				ev_utc.accepted = false;
    				let uid_topic = `${ev_utc.user_id}-${cnst.REQUEST_EVENT_DROP_TOPIC}`;

    				//
    				publish(cnst.CALENDAR_TOPIC_GROUP, uid_topic, cnst.USER_CHAT_PATH, {
    					// cnst.ACCEPT_EVENT_TOPIC
    					"type": "drop",
    					"data": ev_utc
    				});

    				//
    				setTimeout(
    					() => {
    						// after svelte changes
    						publish(cnst.CALENDAR_TOPIC_GROUP, cnst.REJECT_EVENT_TOPIC, cnst.USER_CHAT_PATH, { "type": "drop", "data": ev_utc });
    					},
    					5
    				);

    				timestamp_db.remove(ev_utc);
    			}
    		}
    	};

    	return [
    		day,
    		monthstr,
    		all_day_list,
    		model_general_class,
    		maybe_event_topic,
    		maybe_event_id,
    		maybe_event_email,
    		maybe_event_contact_phone,
    		maybe_event_zoom,
    		maybe_event_in_person,
    		maybe_event_how_long,
    		revized_all_day_list,
    		maybe_event_time,
    		maybe_event_ub,
    		maybe_event_code,
    		show_editor,
    		editor_for_cancel,
    		maybe_event_lb,
    		maybe_event_step,
    		hide_editor,
    		handle_change_request,
    		publish_event_accept,
    		publish_event_revision,
    		publish_event_cancel,
    		day_event_count,
    		month,
    		year,
    		model_how_long,
    		tz_hour_shift,
    		user_id,
    		time_zone,
    		ui_user_id,
    		maybe_event_index,
    		tzoff,
    		tzoof_ts,
    		src_date,
    		dropped_event,
    		changed_event,
    		updating_event,
    		input0_input_handler,
    		input0_input_handler_1,
    		input1_input_handler,
    		input2_input_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_input_handler,
    		input0_input_handler_2,
    		input1_input_handler_1,
    		input2_change_handler_1,
    		input3_change_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class DayEventsRequests extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				day: 0,
    				monthstr: 1,
    				all_day_list: 2,
    				day_event_count: 24,
    				month: 25,
    				year: 26,
    				model_how_long: 27,
    				model_general_class: 3,
    				tz_hour_shift: 28,
    				user_id: 29,
    				time_zone: 30,
    				ui_user_id: 31
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DayEventsRequests",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*day*/ ctx[0] === undefined && !('day' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'day'");
    		}

    		if (/*monthstr*/ ctx[1] === undefined && !('monthstr' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'monthstr'");
    		}

    		if (/*all_day_list*/ ctx[2] === undefined && !('all_day_list' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'all_day_list'");
    		}

    		if (/*month*/ ctx[25] === undefined && !('month' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'month'");
    		}

    		if (/*year*/ ctx[26] === undefined && !('year' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'year'");
    		}

    		if (/*model_how_long*/ ctx[27] === undefined && !('model_how_long' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'model_how_long'");
    		}

    		if (/*model_general_class*/ ctx[3] === undefined && !('model_general_class' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'model_general_class'");
    		}

    		if (/*tz_hour_shift*/ ctx[28] === undefined && !('tz_hour_shift' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'tz_hour_shift'");
    		}

    		if (/*user_id*/ ctx[29] === undefined && !('user_id' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'user_id'");
    		}

    		if (/*time_zone*/ ctx[30] === undefined && !('time_zone' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'time_zone'");
    		}

    		if (/*ui_user_id*/ ctx[31] === undefined && !('ui_user_id' in props)) {
    			console.warn("<DayEventsRequests> was created without expected prop 'ui_user_id'");
    		}
    	}

    	get day() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set day(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get monthstr() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set monthstr(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all_day_list() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all_day_list(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get day_event_count() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set day_event_count(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get month() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get year() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get model_how_long() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model_how_long(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get model_general_class() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model_general_class(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tz_hour_shift() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tz_hour_shift(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get user_id() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user_id(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time_zone() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time_zone(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ui_user_id() {
    		throw new Error("<DayEventsRequests>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ui_user_id(value) {
    		throw new Error("<DayEventsRequests>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/RequestChangeAlerts.svelte generated by Svelte v3.50.1 */

    const file$6 = "src/RequestChangeAlerts.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "this is a test";
    			attr_dev(div, "class", "svelte-dnva0b");
    			add_location(div, file$6, 5, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RequestChangeAlerts', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RequestChangeAlerts> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class RequestChangeAlerts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RequestChangeAlerts",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/ClockSelections.svelte generated by Svelte v3.50.1 */
    const file$5 = "src/ClockSelections.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (50:20) {:else}
    function create_else_block$1(ctx) {
    	let input;
    	let t0;
    	let span;
    	let t1_value = /*a_timezone*/ ctx[10] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = text("  ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", /*a_timezone*/ ctx[10]);
    			add_location(input, file$5, 50, 24, 1377);
    			add_location(span, file$5, 50, 106, 1459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*handle_checked*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(50:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:20) {#if selected_tz(a_timezone) }
    function create_if_block$1(ctx) {
    	let input;
    	let t0;
    	let span;
    	let t1_value = /*a_timezone*/ ctx[10] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = text("  ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			input.checked = true;
    			attr_dev(input, "id", /*a_timezone*/ ctx[10]);
    			add_location(input, file$5, 48, 24, 1208);
    			add_location(span, file$5, 48, 115, 1299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*handle_checked*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(48:20) {#if selected_tz(a_timezone) }",
    		ctx
    	});

    	return block;
    }

    // (46:12) {#each all_tz as a_timezone}
    function create_each_block$3(ctx) {
    	let li;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*selected_tz*/ ctx[3](/*a_timezone*/ ctx[10])) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			add_location(li, file$5, 46, 16, 1128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if_block.m(li, null);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(46:12) {#each all_tz as a_timezone}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let button;
    	let t1;
    	let div1;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*all_tz*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "save";
    			t1 = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "class", "svelte-1xlmnmv");
    			add_location(button, file$5, 41, 8, 924);
    			attr_dev(div0, "class", "svelte-1xlmnmv");
    			add_location(div0, file$5, 40, 4, 910);
    			add_location(ul, file$5, 44, 8, 1066);
    			attr_dev(div1, "class", "tz_list_container svelte-1xlmnmv");
    			add_location(div1, file$5, 43, 4, 995);
    			set_style(div2, "overflow", "hidden");
    			attr_dev(div2, "class", "svelte-1xlmnmv");
    			add_location(div2, file$5, 39, 0, 876);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			/*div1_binding*/ ctx[6](div1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*selection_save_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*all_tz, handle_checked, selected_tz*/ 26) {
    				each_value = /*all_tz*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			/*div1_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ClockSelections', slots, []);
    	const dispatch = createEventDispatcher();
    	let { time_zone_clocks = [] } = $$props; // currently selected timezones
    	let all_tz = Intl.supportedValuesOf('timeZone');
    	let tzlist_container = undefined;
    	let g_selected_clocks = {};

    	function selection_save_handler(ev) {
    		dispatch('message', {
    			"type": 'save-clock-eelections',
    			"clocks": g_selected_clocks
    		});
    	}

    	let tz_set;

    	function selected_tz(a_tz) {
    		let idx = tz_set.indexOf(a_tz);
    		return idx > -1;
    	}

    	function handle_checked(ev) {
    		let el = ev.target;

    		if (el) {
    			let is_checked = el.checked;
    			g_selected_clocks[el.id] = is_checked;
    		}
    	}

    	const writable_props = ['time_zone_clocks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ClockSelections> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			tzlist_container = $$value;
    			$$invalidate(0, tzlist_container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('time_zone_clocks' in $$props) $$invalidate(5, time_zone_clocks = $$props.time_zone_clocks);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		time_zone_clocks,
    		all_tz,
    		tzlist_container,
    		g_selected_clocks,
    		selection_save_handler,
    		tz_set,
    		selected_tz,
    		handle_checked
    	});

    	$$self.$inject_state = $$props => {
    		if ('time_zone_clocks' in $$props) $$invalidate(5, time_zone_clocks = $$props.time_zone_clocks);
    		if ('all_tz' in $$props) $$invalidate(1, all_tz = $$props.all_tz);
    		if ('tzlist_container' in $$props) $$invalidate(0, tzlist_container = $$props.tzlist_container);
    		if ('g_selected_clocks' in $$props) g_selected_clocks = $$props.g_selected_clocks;
    		if ('tz_set' in $$props) tz_set = $$props.tz_set;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*time_zone_clocks*/ 32) {
    			tz_set = time_zone_clocks;
    		}
    	};

    	return [
    		tzlist_container,
    		all_tz,
    		selection_save_handler,
    		selected_tz,
    		handle_checked,
    		time_zone_clocks,
    		div1_binding
    	];
    }

    class ClockSelections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { time_zone_clocks: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClockSelections",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get time_zone_clocks() {
    		throw new Error("<ClockSelections>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time_zone_clocks(value) {
    		throw new Error("<ClockSelections>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/grid-of-things/src/ThingGrid.svelte generated by Svelte v3.50.1 */
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

    /* node_modules/svelte-float-window/src/w_resize.svelte generated by Svelte v3.50.1 */
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

    /* node_modules/svelte-float-window/src/FloatWindow.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "node_modules/svelte-float-window/src/FloatWindow.svelte";

    // (225:1) <Resizer on:message={handle_size} >
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
    		source: "(225:1) <Resizer on:message={handle_size} >",
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
    			add_location(span, file$2, 220, 3, 6204);
    			attr_dev(div0, "id", div0_id_value = "popup_bar_" + /*index*/ ctx[1]);
    			attr_dev(div0, "class", "popup_bar svelte-8emtpk");
    			add_location(div0, file$2, 218, 1, 6096);
    			set_style(p, "font-size", "0.75em");
    			set_style(p, "font-weight", "bold");
    			set_style(p, "color", "darkgreen");
    			set_style(p, "padding-left", "4px");
    			add_location(p, file$2, 222, 1, 6296);
    			attr_dev(div1, "id", div1_id_value = "popup_" + /*index*/ ctx[1]);
    			attr_dev(div1, "class", "popup svelte-8emtpk");
    			add_location(div1, file$2, 217, 0, 6054);
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

    		window.start_floating_window = (index, ph, pw) => {
    			popup_starter(index, ph, pw);
    		};

    		window.fix_z_topper = idx => {
    			fix_z_order(idx);
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
    			let case_h = popup._x_save_scale_h;
    			let case_w = popup._x_save_scale_w;

    			let w_scale = case_w === undefined
    			? scale_current_size.w
    			: scale_current_size.w * case_w;

    			let h_scale = case_h === undefined
    			? scale_current_size.h
    			: scale_current_size.h * case_h;

    			popup.style.width = window.innerWidth * w_scale - SCROLL_WIDTH + "px";
    			popup.style.height = window.innerHeight * h_scale - SCROLL_WIDTH + "px";
    			originals(popup);
    		}
    	}

    	function popup_starter(ii, case_h, case_w) {
    		var popup = document.getElementById(`popup_${ii}`);

    		if (popup && popup.style.display !== 'block') {
    			popup.style.top = "4px";
    			popup.style.left = "4px";

    			if (typeof case_h === 'number') {
    				popup._x_save_scale_h = case_h;
    			}

    			if (typeof case_w === 'number') {
    				popup._x_save_scale_w = case_w;
    			}

    			let w_scale = case_w === undefined
    			? scale_current_size.w
    			: scale_current_size.w * case_w;

    			let h_scale = case_h === undefined
    			? scale_current_size.h
    			: scale_current_size.h * case_h;

    			popup.style.width = window.innerWidth * w_scale - SCROLL_WIDTH + "px";
    			popup.style.height = window.innerHeight * h_scale - SCROLL_WIDTH + "px";
    			originals(popup);

    			//
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

    /* node_modules/svelte-clock/src/Clock.svelte generated by Svelte v3.50.1 */
    const file$1 = "node_modules/svelte-clock/src/Clock.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (35:2) {#each [1, 2, 3, 4] as offset}
    function create_each_block_1$1(ctx) {
    	let line;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "minor svelte-1xs85ek");
    			attr_dev(line, "y1", "42");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", "rotate(" + 6 * (/*minute*/ ctx[4] + /*offset*/ ctx[7]) + ")");
    			add_location(line, file$1, 35, 3, 686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(35:2) {#each [1, 2, 3, 4] as offset}",
    		ctx
    	});

    	return block;
    }

    // (27:1) {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
    function create_each_block$1(ctx) {
    	let line;
    	let each_1_anchor;
    	let each_value_1 = [1, 2, 3, 4];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			line = svg_element("line");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(line, "class", "major svelte-1xs85ek");
    			attr_dev(line, "y1", "35");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", "rotate(" + 30 * /*minute*/ ctx[4] + ")");
    			add_location(line, file$1, 27, 2, 562);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(27:1) {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let svg;
    	let circle;
    	let line0;
    	let line0_transform_value;
    	let line1;
    	let line1_transform_value;
    	let g;
    	let line2;
    	let line3;
    	let g_transform_value;
    	let each_value = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < 12; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks[i].c();
    			}

    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			g = svg_element("g");
    			line2 = svg_element("line");
    			line3 = svg_element("line");
    			attr_dev(circle, "class", "clock-face svelte-1xs85ek");
    			attr_dev(circle, "r", "48");
    			add_location(circle, file$1, 23, 1, 439);
    			attr_dev(line0, "class", "hour svelte-1xs85ek");
    			attr_dev(line0, "y1", "2");
    			attr_dev(line0, "y2", "-20");
    			attr_dev(line0, "transform", line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[2] + /*minutes*/ ctx[1] / 2) + ")");
    			add_location(line0, file$1, 45, 1, 829);
    			attr_dev(line1, "class", "minute svelte-1xs85ek");
    			attr_dev(line1, "y1", "4");
    			attr_dev(line1, "y2", "-30");
    			attr_dev(line1, "transform", line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[0] / 10) + ")");
    			add_location(line1, file$1, 53, 1, 947);
    			attr_dev(line2, "class", "second svelte-1xs85ek");
    			attr_dev(line2, "y1", "10");
    			attr_dev(line2, "y2", "-38");
    			add_location(line2, file$1, 62, 2, 1109);
    			attr_dev(line3, "class", "second-counterweight svelte-1xs85ek");
    			attr_dev(line3, "y1", "10");
    			attr_dev(line3, "y2", "2");
    			add_location(line3, file$1, 63, 2, 1151);
    			attr_dev(g, "transform", g_transform_value = "rotate(" + 6 * /*seconds*/ ctx[0] + ")");
    			add_location(g, file$1, 61, 1, 1069);
    			attr_dev(svg, "viewBox", "-50 -50 100 100");
    			attr_dev(svg, "class", "svelte-1xs85ek");
    			add_location(svg, file$1, 22, 0, 406);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			append_dev(svg, g);
    			append_dev(g, line2);
    			append_dev(g, line3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hours, minutes*/ 6 && line0_transform_value !== (line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[2] + /*minutes*/ ctx[1] / 2) + ")")) {
    				attr_dev(line0, "transform", line0_transform_value);
    			}

    			if (dirty & /*minutes, seconds*/ 3 && line1_transform_value !== (line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[0] / 10) + ")")) {
    				attr_dev(line1, "transform", line1_transform_value);
    			}

    			if (dirty & /*seconds*/ 1 && g_transform_value !== (g_transform_value = "rotate(" + 6 * /*seconds*/ ctx[0] + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
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
    	let hours;
    	let minutes;
    	let seconds;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clock', slots, []);
    	let time = new Date();

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(3, time = new Date());
    			},
    			1000
    		);

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, time, seconds, minutes, hours });

    	$$self.$inject_state = $$props => {
    		if ('time' in $$props) $$invalidate(3, time = $$props.time);
    		if ('seconds' in $$props) $$invalidate(0, seconds = $$props.seconds);
    		if ('minutes' in $$props) $$invalidate(1, minutes = $$props.minutes);
    		if ('hours' in $$props) $$invalidate(2, hours = $$props.hours);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*time*/ 8) {
    			// these automatically update when `time`
    			// changes, because of the `$:` prefix
    			$$invalidate(2, hours = time.getHours());
    		}

    		if ($$self.$$.dirty & /*time*/ 8) {
    			$$invalidate(1, minutes = time.getMinutes());
    		}

    		if ($$self.$$.dirty & /*time*/ 8) {
    			$$invalidate(0, seconds = time.getSeconds());
    		}
    	};

    	return [seconds, minutes, hours, time];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$1.name
    		});
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


    function make_empty_thing(model_template,no_clone) {
        if ( model_template !== undefined ) {
            thing_template = model_template;
            app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template);
        }
        if ( no_clone ) {
            return Object.assign({},app_empty_object)
        }
        return clonify(model_template)
    }

    let app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template);



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


    function merge_data(merger,things,other_things,article_index,dstart) {
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
                    things[i] = merger(things[i],oto);
                } else {
                    let ceo = clonify(app_empty_object);
                    ceo.id = i+1;
                    things[i] = merger(things[i],ceo);
                }
            } else {
                let ceo = clonify(app_empty_object);
                ceo.id = i+1;
                things[i] = merger(things[i],ceo);
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
    function unload_data$1(data) {
        let usable_data = data.map(datum => {
            datum.title = datum.title ? decodeURIComponent(datum.title) : "no title";
            datum.abstract = datum.abstract ? decodeURIComponent(datum.abstract) : "no abstract";
            if (  datum.keys && Array.isArray(datum.keys) ) {
                datum.keys = datum.keys.map(key => {
                    return(decodeURIComponent(key))
                });                
            }
            return datum
        });
        return usable_data
    }

    //
    function process_search_results(stindex,qstart,search_result,other_things,data_unloader) {
        //
        let article_index = 1;
        //
        if ( search_result ) {
            let data = search_result.data;
            if ( data ) {
                //
                if ( data_unloader !== undefined ) {
                    data = data_unloader(data);
                } else {
                    data = unload_data$1(data);
                }
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

    function F(e,t){let n=e.getMonth(),r=e.getFullYear();if(0!==t){let e=n+t;if(t>0)if(e>12){r+=Math.trunc((e-12)/12)+1,n=e%12;}else n=e;else if(e<0){n=e%12+12,r+=Math.trunc((t-n)/12);}else n=e;}return new Date(r,n).getTime()}

    /**
     * This module used to unify mouse wheel behavior between different browsers in 2014
     * Now it's just a wrapper around addEventListener('wheel');
     *
     * Usage:
     *  var addWheelListener = require('wheel').addWheelListener;
     *  var removeWheelListener = require('wheel').removeWheelListener;
     *  addWheelListener(domElement, function (e) {
     *    // mouse wheel event
     *  });
     *  removeWheelListener(domElement, function);
     */

    var wheel = addWheelListener;

    // But also expose "advanced" api with unsubscribe:
    var addWheelListener_1 = addWheelListener;
    var removeWheelListener_1 = removeWheelListener;


    function addWheelListener(element, listener, useCapture) {
      element.addEventListener('wheel', listener, useCapture);
    }

    function removeWheelListener( element, listener, useCapture ) {
      element.removeEventListener('wheel', listener, useCapture);
    }
    wheel.addWheelListener = addWheelListener_1;
    wheel.removeWheelListener = removeWheelListener_1;

    /**
     * https://github.com/gre/bezier-easing
     * BezierEasing - use bezier curve for transition easing function
     * by Gaëtan Renaudeau 2014 - 2015 – MIT License
     */

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === 'function';

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
     for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
       var currentSlope = getSlope(aGuessT, mX1, mX2);
       if (currentSlope === 0.0) {
         return aGuessT;
       }
       var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
       aGuessT -= currentX / currentSlope;
     }
     return aGuessT;
    }

    function LinearEasing (x) {
      return x;
    }

    var src = function bezier (mX1, mY1, mX2, mY2) {
      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
      }

      if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
      }

      // Precompute samples table
      var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }

      function getTForX (aX) {
        var intervalStart = 0.0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;

        // Interpolate to provide an initial guess for t
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;

        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }

      return function BezierEasing (x) {
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
          return 0;
        }
        if (x === 1) {
          return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      };
    };

    // Predefined set of animations. Similar to CSS easing functions
    var animations = {
      ease:  src(0.25, 0.1, 0.25, 1),
      easeIn: src(0.42, 0, 1, 1),
      easeOut: src(0, 0, 0.58, 1),
      easeInOut: src(0.42, 0, 0.58, 1),
      linear: src(0, 0, 1, 1)
    };


    var amator = animate;
    var makeAggregateRaf_1 = makeAggregateRaf;
    var sharedScheduler = makeAggregateRaf();


    function animate(source, target, options) {
      var start = Object.create(null);
      var diff = Object.create(null);
      options = options || {};
      // We let clients specify their own easing function
      var easing = (typeof options.easing === 'function') ? options.easing : animations[options.easing];

      // if nothing is specified, default to ease (similar to CSS animations)
      if (!easing) {
        if (options.easing) {
          console.warn('Unknown easing function in amator: ' + options.easing);
        }
        easing = animations.ease;
      }

      var step = typeof options.step === 'function' ? options.step : noop$2;
      var done = typeof options.done === 'function' ? options.done : noop$2;

      var scheduler = getScheduler(options.scheduler);

      var keys = Object.keys(target);
      keys.forEach(function(key) {
        start[key] = source[key];
        diff[key] = target[key] - source[key];
      });

      var durationInMs = typeof options.duration === 'number' ? options.duration : 400;
      var durationInFrames = Math.max(1, durationInMs * 0.06); // 0.06 because 60 frames pers 1,000 ms
      var previousAnimationId;
      var frame = 0;

      previousAnimationId = scheduler.next(loop);

      return {
        cancel: cancel
      }

      function cancel() {
        scheduler.cancel(previousAnimationId);
        previousAnimationId = 0;
      }

      function loop() {
        var t = easing(frame/durationInFrames);
        frame += 1;
        setValues(t);
        if (frame <= durationInFrames) {
          previousAnimationId = scheduler.next(loop);
          step(source);
        } else {
          previousAnimationId = 0;
          setTimeout(function() { done(source); }, 0);
        }
      }

      function setValues(t) {
        keys.forEach(function(key) {
          source[key] = diff[key] * t + start[key];
        });
      }
    }

    function noop$2() { }

    function getScheduler(scheduler) {
      if (!scheduler) {
        var canRaf = typeof window !== 'undefined' && window.requestAnimationFrame;
        return canRaf ? rafScheduler() : timeoutScheduler()
      }
      if (typeof scheduler.next !== 'function') throw new Error('Scheduler is supposed to have next(cb) function')
      if (typeof scheduler.cancel !== 'function') throw new Error('Scheduler is supposed to have cancel(handle) function')

      return scheduler
    }

    function rafScheduler() {
      return {
        next: window.requestAnimationFrame.bind(window),
        cancel: window.cancelAnimationFrame.bind(window)
      }
    }

    function timeoutScheduler() {
      return {
        next: function(cb) {
          return setTimeout(cb, 1000/60)
        },
        cancel: function (id) {
          return clearTimeout(id)
        }
      }
    }

    function makeAggregateRaf() {
      var frontBuffer = new Set();
      var backBuffer = new Set();
      var frameToken = 0;

      return {
        next: next,
        cancel: next,
        clearAll: clearAll
      }

      function clearAll() {
        frontBuffer.clear();
        backBuffer.clear();
        cancelAnimationFrame(frameToken);
        frameToken = 0;
      }

      function next(callback) {
        backBuffer.add(callback);
        renderNextFrame();
      }

      function renderNextFrame() {
        if (!frameToken) frameToken = requestAnimationFrame(renderFrame);
      }

      function renderFrame() {
        frameToken = 0;

        var t = backBuffer;
        backBuffer = frontBuffer;
        frontBuffer = t;

        frontBuffer.forEach(function(callback) {
          callback();
        });
        frontBuffer.clear();
      }
    }
    amator.makeAggregateRaf = makeAggregateRaf_1;
    amator.sharedScheduler = sharedScheduler;

    var ngraph_events = function eventify(subject) {
      validateSubject(subject);

      var eventsStorage = createEventsStorage(subject);
      subject.on = eventsStorage.on;
      subject.off = eventsStorage.off;
      subject.fire = eventsStorage.fire;
      return subject;
    };

    function createEventsStorage(subject) {
      // Store all event listeners to this hash. Key is event name, value is array
      // of callback records.
      //
      // A callback record consists of callback function and its optional context:
      // { 'eventName' => [{callback: function, ctx: object}] }
      var registeredEvents = Object.create(null);

      return {
        on: function (eventName, callback, ctx) {
          if (typeof callback !== 'function') {
            throw new Error('callback is expected to be a function');
          }
          var handlers = registeredEvents[eventName];
          if (!handlers) {
            handlers = registeredEvents[eventName] = [];
          }
          handlers.push({callback: callback, ctx: ctx});

          return subject;
        },

        off: function (eventName, callback) {
          var wantToRemoveAll = (typeof eventName === 'undefined');
          if (wantToRemoveAll) {
            // Killing old events storage should be enough in this case:
            registeredEvents = Object.create(null);
            return subject;
          }

          if (registeredEvents[eventName]) {
            var deleteAllCallbacksForEvent = (typeof callback !== 'function');
            if (deleteAllCallbacksForEvent) {
              delete registeredEvents[eventName];
            } else {
              var callbacks = registeredEvents[eventName];
              for (var i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].callback === callback) {
                  callbacks.splice(i, 1);
                }
              }
            }
          }

          return subject;
        },

        fire: function (eventName) {
          var callbacks = registeredEvents[eventName];
          if (!callbacks) {
            return subject;
          }

          var fireArguments;
          if (arguments.length > 1) {
            fireArguments = Array.prototype.splice.call(arguments, 1);
          }
          for(var i = 0; i < callbacks.length; ++i) {
            var callbackInfo = callbacks[i];
            callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
          }

          return subject;
        }
      };
    }

    function validateSubject(subject) {
      if (!subject) {
        throw new Error('Eventify cannot use falsy object as events subject');
      }
      var reservedWords = ['on', 'fire', 'off'];
      for (var i = 0; i < reservedWords.length; ++i) {
        if (subject.hasOwnProperty(reservedWords[i])) {
          throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
        }
      }
    }

    /**
     * Allows smooth kinetic scrolling of the surface
     */
    var kinetic_1 = kinetic;

    function kinetic(getPoint, scroll, settings) {
      if (typeof settings !== 'object') {
        // setting could come as boolean, we should ignore it, and use an object.
        settings = {};
      }

      var minVelocity = (typeof settings.minVelocity === 'number') ? settings.minVelocity : 5;
      var amplitude = (typeof settings.amplitude === 'number') ? settings.amplitude : 0.25;
      var cancelAnimationFrame = (typeof settings.cancelAnimationFrame === 'function') ? settings.cancelAnimationFrame : getCancelAnimationFrame();
      var requestAnimationFrame = (typeof settings.requestAnimationFrame === 'function') ? settings.requestAnimationFrame : getRequestAnimationFrame();
      let callWhenMotionStops = (typeof settings.callWhenMotionStops === 'function') ?  settings.callWhenMotionStops : false;

      var lastPoint;
      var timestamp;
      var timeConstant = 342;

      var ticker;
      var vx, targetX, ax;
      var vy, targetY, ay;

      var raf;

      return {
        start: start,
        stop: stop,
        cancel: dispose
      };

      function dispose() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);
      }

      function start() {
        lastPoint = getPoint();

        ax = ay = vx = vy = 0;
        timestamp = new Date();

        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        // we start polling the point position to accumulate velocity
        // Once we stop(), we will use accumulated velocity to keep scrolling
        // an object.
        ticker = requestAnimationFrame(track);
      }

      function track() {
        var now = Date.now();
        var elapsed = now - timestamp;
        timestamp = now;

        var currentPoint = getPoint();

        var dx = currentPoint.x - lastPoint.x;
        var dy = currentPoint.y - lastPoint.y;

        lastPoint = currentPoint;

        var dt = 1000 / (1 + elapsed);

        // moving average
        vx = 0.8 * dx * dt + 0.2 * vx;
        vy = 0.8 * dy * dt + 0.2 * vy;

        ticker = requestAnimationFrame(track);
      }

      function stop() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        var currentPoint = getPoint();

        targetX = currentPoint.x;
        targetY = currentPoint.y;
        timestamp = Date.now();

        if (vx < -minVelocity || vx > minVelocity) {
          ax = amplitude * vx;
          targetX += ax;
        }

        if (vy < -minVelocity || vy > minVelocity) {
          ay = amplitude * vy;
          targetY += ay;
        }

        raf = requestAnimationFrame(autoScroll);
      }

      function autoScroll() {
        var elapsed = Date.now() - timestamp;

        var moving = false;
        var dx = 0;
        var dy = 0;

        if (ax) {
          dx = -ax * Math.exp(-elapsed / timeConstant);

          if (dx > 0.5 || dx < -0.5) moving = true;
          else dx = ax = 0;
        }

        if (ay) {
          dy = -ay * Math.exp(-elapsed / timeConstant);

          if (dy > 0.5 || dy < -0.5) moving = true;
          else dy = ay = 0;
        }

        if (moving) {
          scroll(targetX + dx, targetY + dy);
          raf = requestAnimationFrame(autoScroll);
        } else if ( callWhenMotionStops !== false ) {
          callWhenMotionStops();
        }
      }
    }

    function getCancelAnimationFrame() {
      if (typeof cancelAnimationFrame === 'function') return cancelAnimationFrame;
      return clearTimeout;
    }

    function getRequestAnimationFrame() {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame;

      return function (handler) {
        return setTimeout(handler, 16);
      };
    }

    /**
     * Disallows selecting text.
     */
    var createTextSelectionInterceptor_1 = createTextSelectionInterceptor;

    function createTextSelectionInterceptor(useFake) {
      if (useFake) {
        return {
          capture: noop$1,
          release: noop$1
        };
      }

      var dragObject;
      var prevSelectStart;
      var prevDragStart;
      var wasCaptured = false;

      return {
        capture: capture,
        release: release
      };

      function capture(domObject) {
        wasCaptured = true;
        prevSelectStart = window.document.onselectstart;
        prevDragStart = window.document.ondragstart;

        window.document.onselectstart = disabled;

        dragObject = domObject;
        dragObject.ondragstart = disabled;
      }

      function release() {
        if (!wasCaptured) return;
        
        wasCaptured = false;
        window.document.onselectstart = prevSelectStart;
        if (dragObject) dragObject.ondragstart = prevDragStart;
      }
    }

    function disabled(e) {
      e.stopPropagation();
      return false;
    }

    function noop$1() {}

    class Transform {
      constructor(useAspect) {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        if ( !useAspect ) {
          this.scaleX = 1;
          this.scaleY = 1;
        }
      }
    }


    var transform = Transform;

    var svgController = makeSvgController;
    var canAttach$1 = isSVGElement;

    function makeSvgController(svgElement, options) {
      if (!isSVGElement(svgElement)) {
        throw new Error('svg element is required for svg.panzoom to work');
      }

      var owner = svgElement.ownerSVGElement;
      if (!owner) {
        throw new Error(
          'Do not apply panzoom to the root <svg> element. ' +
          'Use its child instead (e.g. <g></g>). ' +
          'As of March 2016 only FireFox supported transform on the root element');
      }

      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getScreenCTM: getScreenCTM,
        getOwner: getOwner,
        applyTransform: applyTransform,
        initTransform: initTransform
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        var bbox =  svgElement.getBBox();
        return {
          left: bbox.x,
          top: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };
      }

      function getScreenCTM() {
        var ctm = owner.getCTM();
        if (!ctm) {
          // This is likely firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=873106
          // The code below is not entirely correct, but still better than nothing
          return owner.getScreenCTM();
        }
        return ctm;
      }

      function initTransform(transform) {
        var screenCTM = svgElement.getCTM();

        // The above line returns null on Firefox
        if (screenCTM === null) {
          screenCTM = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        }

        transform.x = screenCTM.e;
        transform.y = screenCTM.f;
        transform.scale = screenCTM.a;
        owner.removeAttributeNS(null, 'viewBox');
      }

      function applyTransform(transform,linkAspect) {
        //
        if ( isNaN(transform.x) || isNaN(transform.y) || isNaN(transform.scale) || isNaN(transform.scaleX) || isNaN(transform.scaleY)) {
          console.log(transform);
          throw new Error("applyTransform NaN")
        }
        if ( linkAspect ) {
          svgElement.setAttribute('transform', 'matrix(' +
                                      transform.scale + ' 0 0 ' +
                                      transform.scale + ' ' +
                                      transform.x + ' ' + transform.y + ')');
        } else {
          svgElement.setAttribute('transform', 'matrix(' +
                                      transform.scaleX + ' 0 0 ' +
                                      transform.scaleY + ' ' +
                                      transform.x + ' ' + transform.y + ')');

        }
      }

    }

    function isSVGElement(element) {
      return element && element.ownerSVGElement && element.getCTM;
    }
    svgController.canAttach = canAttach$1;

    var domController = makeDomController;

    var canAttach = isDomElement;

    function makeDomController(domElement, options) {
      var elementValid = isDomElement(domElement); 
      if (!elementValid) {
        throw new Error('panzoom requires DOM element to be attached to the DOM tree');
      }

      var owner = domElement.parentElement;
      domElement.scrollTop = 0;
      
      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getOwner: getOwner,
        applyTransform: applyTransform,
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        // TODO: We should probably cache this?
        return  {
          left: 0,
          top: 0,
          width: domElement.clientWidth,
          height: domElement.clientHeight
        };
      }

      function applyTransform(transform) {
        // TODO: Should we cache this?
        domElement.style.transformOrigin = '0 0 0';
        domElement.style.transform = 'matrix(' +
          transform.scale + ', 0, 0, ' +
          transform.scale + ', ' +
          transform.x + ', ' + transform.y + ')';
      }
    }

    function isDomElement(element) {
      return element && element.parentElement && element.style;
    }
    domController.canAttach = canAttach;

    /**
     * Allows to drag and zoom svg elements
     */





    let domTextSelectionInterceptor = createTextSelectionInterceptor_1();
    let fakeTextSelectorInterceptor = createTextSelectionInterceptor_1(true);




    const defaultZoomSpeed = 1;
    const defaultDoubleTapZoomSpeed = 1.75;
    const doubleTapSpeedInMS = 300;
    const clickEventTimeInMS = 200;



    /**
     * Creates a new instance of panzoom, so that an object can be panned and zoomed
     *
     * @param {DOMElement} domElement where panzoom should be attached.
     * @param {Object} options that configure behavior.
     */
    function createPanZoom(domElement, options) {
      options = options || {};

      let panController = options.controller;

      let linkAspect = true;
      let scaleFactors = { x : 1.0, y : 1.0 };
      
      if ( typeof options.preserveAspecRatio === "boolean" ) {
        linkAspect = (typeof options.preserveAspecRatio === "boolean") ? options.preserveAspecRatio : true;
        if ( !(linkAspect) && (typeof options.scaleFactors === "object") ) {
          scaleFactors.x = (options.scaleFactors.x !== undefined) ? options.scaleFactors.x : 1.0;
          scaleFactors.y = (options.scaleFactors.y !== undefined) ? options.scaleFactors.y : 1.0;
        }
      }

      if (!panController) {
        if (svgController.canAttach(domElement)) {
          panController = svgController(domElement, options);
        } else if (domController.canAttach(domElement)) {
          panController = domController(domElement, options);
        }
      }

      if (!panController) {
        throw new Error(
          'Cannot create panzoom for the current type of dom element'
        );
      }
      let owner = panController.getOwner();
      // just to avoid GC pressure, every time we do intermediate transform
      // we return this object. For internal use only. Never give it back to the consumer of this library
      let storedCTMResult = { x: 0, y: 0 };

      let isDirty = false;
      let transform$1 = new transform(linkAspect);

      if (panController.initTransform) {
        panController.initTransform(transform$1);
      }

      let filterKey = typeof options.filterKey === 'function' ? options.filterKey : noop;
      // TODO: likely need to unite pinchSpeed with zoomSpeed
      let pinchSpeed = typeof options.pinchSpeed === 'number' ? options.pinchSpeed : 1;
      let bounds = options.bounds;
      let maxZoom = typeof options.maxZoom === 'number' ? options.maxZoom : Number.POSITIVE_INFINITY;
      let minZoom = typeof options.minZoom === 'number' ? options.minZoom : 0;

      let boundsPadding = typeof options.boundsPadding === 'number' ? options.boundsPadding : 0.05;
      let zoomDoubleClickSpeed = typeof options.zoomDoubleClickSpeed === 'number' ? options.zoomDoubleClickSpeed : defaultDoubleTapZoomSpeed;
      let beforeWheel = options.beforeWheel || noop;
      let beforeMouseDown = options.beforeMouseDown || noop;
      let speed = typeof options.zoomSpeed === 'number' ? options.zoomSpeed : defaultZoomSpeed;
      let transformOrigin = parseTransformOrigin(options.transformOrigin);
      let textSelection = options.enableTextSelection ? fakeTextSelectorInterceptor : domTextSelectionInterceptor;

      validateBounds(bounds);

      if (options.autocenter) {
        autocenter();
      }

      let frameAnimation;
      let lastTouchEndTime = 0;
      let lastTouchStartTime = 0;
      let pendingClickEventTimeout = 0;
      let lastMouseDownedEvent = null;
      let lastMouseDownTime = new Date();
      let lastSingleFingerOffset;
      let touchInProgress = false;

      // We only need to fire panstart when actual move happens
      let panstartFired = false;

      // cache mouse coordinates here
      let mouseX;
      let mouseY;

      // Where the first click has happened, so that we can differentiate
      // between pan and click
      let clickX;
      let clickY;

      let pinchZoomLength;

      let smoothScroll;
      if ('smoothScroll' in options && !options.smoothScroll) {
        // If user explicitly asked us not to use smooth scrolling, we obey
        smoothScroll = rigidScroll();
      } else {
        // otherwise we use forward smoothScroll settings to kinetic API
        // which makes scroll smoothing.
        if ( options.smoothScroll.reactZeroVelocity ) {
          options.smoothScroll.callWhenMotionStops = triggerDecelerateToZero;
        }
        smoothScroll = kinetic_1(getPoint, scroll, options.smoothScroll);
      }

      let moveByAnimation;
      let zoomToAnimation;

      let multiTouch;
      let paused = false;

      listenForEvents();

      let api = {
        dispose: dispose,
        moveBy: internalMoveBy,
        moveTo: moveTo,
        smoothMoveTo: smoothMoveTo, 
        centerOn: centerOn,
        zoomTo: publicZoomTo,
        zoomAbs: zoomAbs,
        smoothZoom: smoothZoom,
        smoothZoomAbs: smoothZoomAbs,
        showRectangle: showRectangle,

        pause: pause,
        resume: resume,
        isPaused: isPaused,

        getTransform: getTransformModel,

        getMinZoom: getMinZoom,
        setMinZoom: setMinZoom,

        getMaxZoom: getMaxZoom,
        setMaxZoom: setMaxZoom,

        getTransformOrigin: getTransformOrigin,
        setTransformOrigin: setTransformOrigin,

        getZoomSpeed: getZoomSpeed,
        setZoomSpeed: setZoomSpeed,

        setPreserveAspect : setPreserveAspect
      };

     
      ngraph_events(api);
      
      const initialX = typeof options.initialX === 'number' ? options.initialX : transform$1.x;
      const initialY = typeof options.initialY === 'number' ? options.initialY : transform$1.y;
      const initialZoom = typeof options.initialZoom === 'number' ? options.initialZoom : transform$1.scale;

      if(initialX != transform$1.x || initialY != transform$1.y || initialZoom != transform$1.scale){
        zoomAbs(initialX, initialY, initialZoom);
      }

      return api;

      function pause() {
        releaseEvents();
        paused = true;
      }

      function resume() {
        if (paused) {
          listenForEvents();
          paused = false;
        }
      }

      function isPaused() {
        return paused;
      }

      function showRectangle(rect) {
        // TODO: this duplicates autocenter. I think autocenter should go.
        let clientRect = owner.getBoundingClientRect();
        let size = transformToScreen(clientRect.width, clientRect.height);

        let rectWidth = rect.right - rect.left;
        let rectHeight = rect.bottom - rect.top;
        if (!Number.isFinite(rectWidth) || !Number.isFinite(rectHeight)) {
          throw new Error('Invalid rectangle');
        }

        let dw = size.x / rectWidth;
        let dh = size.y / rectHeight;
        let scale = Math.min(dw, dh);
        let scaleX = dw;
        let scaleY = dh;

        if ( linkAspect ) {
          transform$1.x = -(rect.left + rectWidth / 2) * scale + size.x / 2;
          transform$1.y = -(rect.top + rectHeight / 2) * scale + size.y / 2;
          transform$1.scale = scale;
        } else {
          transform$1.x = (-(rect.left + rectWidth / 2) * scaleX * scaleFactors.x) + size.x / 2;
          transform$1.y = (-(rect.top + rectHeight / 2) * scaleY * scaleFactors.y) + size.y / 2;
          transform$1.scaleX = scaleX * (scaleFactors.x === 0 ? 1.0 : scaleFactors.x);
          transform$1.scaleY = scaleY * (scaleFactors.y === 0 ? 1.0 : scaleFactors.y);
        }
      }


      function transformToScreen(x, y) {
        if (panController.getScreenCTM) {
          let parentCTM = panController.getScreenCTM();
          let parentScaleX = parentCTM.a;
          let parentScaleY = parentCTM.d;
          let parentOffsetX = parentCTM.e;
          let parentOffsetY = parentCTM.f;
          storedCTMResult.x = x * parentScaleX - parentOffsetX;
          storedCTMResult.y = y * parentScaleY - parentOffsetY;
        } else {
          storedCTMResult.x = x;
          storedCTMResult.y = y;
        }

        return storedCTMResult;
      }

      function autocenter() {
        let w; // width of the parent
        let h; // height of the parent
        let left = 0;
        let top = 0;
        let sceneBoundingBox = getBoundingBox();
        if (sceneBoundingBox) {
          // If we have bounding box - use it.
          left = sceneBoundingBox.left;
          top = sceneBoundingBox.top;
          w = sceneBoundingBox.right - sceneBoundingBox.left;
          h = sceneBoundingBox.bottom - sceneBoundingBox.top;
        } else {
          // otherwise just use whatever space we have
          let ownerRect = owner.getBoundingClientRect();
          w = ownerRect.width;
          h = ownerRect.height;
        }
        let bbox = panController.getBBox();
        if (bbox.width === 0 || bbox.height === 0) {
          // we probably do not have any elements in the SVG
          // just bail out;
          return;
        }
        let dh = h / bbox.height;
        let dw = w / bbox.width;
        let scale = Math.min(dw, dh);
        transform$1.x = -(bbox.left + bbox.width / 2) * scale + w / 2 + left;
        transform$1.y = -(bbox.top + bbox.height / 2) * scale + h / 2 + top;
        transform$1.scale = scale;
      }

      function getTransformModel() {
        // TODO: should this be read only?
        return transform$1;
      }

      function getMinZoom() {
        return minZoom;
      }

      function setMinZoom(newMinZoom) {
        minZoom = newMinZoom;
      }

      function getMaxZoom() {
        return maxZoom;
      }

      function setMaxZoom(newMaxZoom) {
        maxZoom = newMaxZoom;
      }

      function getTransformOrigin() {
        return transformOrigin;
      }

      function setTransformOrigin(newTransformOrigin) {
        transformOrigin = parseTransformOrigin(newTransformOrigin);
      }

      function getZoomSpeed() {
        return speed;
      }

      function setZoomSpeed(newSpeed) {
        if (!Number.isFinite(newSpeed)) {
          throw new Error('Zoom speed should be a number');
        }
        speed = newSpeed;
      }

      function getPoint() {
        return {
          x: transform$1.x,
          y: transform$1.y
        };
      }

      function moveTo(x, y) {
        transform$1.x = x;
        transform$1.y = y;

        keepTransformInsideBounds();

        triggerEvent('pan');
        makeDirty();
      }

      function moveBy(dx, dy) {
        moveTo(transform$1.x + dx, transform$1.y + dy);
      }

      function keepTransformInsideBounds() {
        let boundingBox = getBoundingBox();
        if (!boundingBox) return;

        let adjusted = false;
        let clientRect = getClientRect();

        let diff = boundingBox.left - clientRect.right;
        if (diff > 0) {
          transform$1.x += diff;
          adjusted = true;
        }
        // check the other side:
        diff = boundingBox.right - clientRect.left;
        if (diff < 0) {
          transform$1.x += diff;
          adjusted = true;
        }

        // y axis:
        diff = boundingBox.top - clientRect.bottom;
        if (diff > 0) {
          // we adjust transform, so that it matches exactly our bounding box:
          // transform.y = boundingBox.top - (boundingBox.height + boundingBox.y) * transform.scale =>
          // transform.y = boundingBox.top - (clientRect.bottom - transform.y) =>
          // transform.y = diff + transform.y =>
          transform$1.y += diff;
          adjusted = true;
        }

        diff = boundingBox.bottom - clientRect.top;
        if (diff < 0) {
          transform$1.y += diff;
          adjusted = true;
        }
        return adjusted;
      }

      /**
       * Returns bounding box that should be used to restrict scene movement.
       */
      function getBoundingBox() {
        if (!bounds) return; // client does not want to restrict movement

        if (typeof bounds === 'boolean') {
          // for boolean type we use parent container bounds
          let ownerRect = owner.getBoundingClientRect();
          let sceneWidth = ownerRect.width;
          let sceneHeight = ownerRect.height;

          return {
            left: sceneWidth * boundsPadding,
            top: sceneHeight * boundsPadding,
            right: sceneWidth * (1 - boundsPadding),
            bottom: sceneHeight * (1 - boundsPadding)
          };
        }

        return bounds;
      }

      function getClientRect() {
        let bbox = panController.getBBox();
        let leftTop = client(bbox.left, bbox.top);

        if ( linkAspect ) {
          return {
            left: leftTop.x,
            top: leftTop.y,
            right: bbox.width * transform$1.scale + leftTop.x,
            bottom: bbox.height * transform$1.scale + leftTop.y
          };  
        } else {
          let scx = scaleFactors.x ? scaleFactors.x : 1.0;
          let scy = scaleFactors.y ? scaleFactors.y : 1.0;
          return {
            left: leftTop.x,
            top: leftTop.y,
            right: (bbox.width * transform$1.scaleX * scx) + leftTop.x,
            bottom: (bbox.height * transform$1.scaleY * scy) + leftTop.y
          };
        }
      }

      function client(x, y) {
        if ( linkAspect ) {
          return {
            x: x * transform$1.scale + transform$1.x,
            y: y * transform$1.scale + transform$1.y
          };
        } else {
          let scx = scaleFactors.x ? scaleFactors.x : 1.0;
          let scy = scaleFactors.y ? scaleFactors.y : 1.0;
          return {
            x: (x * transform$1.scaleX * scx) + transform$1.x,
            y: (y * transform$1.scaleY * scy) + transform$1.y
          };
        }
      }

      function makeDirty() {
        isDirty = true;
        frameAnimation = window.requestAnimationFrame(frame);
      }

      function zoomByRatio(clientX, clientY, ratio) {
        if (isNaN$1(clientX) || isNaN$1(clientY) ) {
          throw new Error('zoom requires valid numbers');
        }
        if ( linkAspect ) {
          if ( isNaN$1(ratio)) {
            throw new Error('zoom requires valid numbers');
          }
      
          let newScale = transform$1.scale * ratio;
      
          if (newScale < minZoom) {
            if (transform$1.scale === minZoom) return;
            ratio = minZoom / transform$1.scale;
          }
          if (newScale > maxZoom) {
            if (transform$1.scale === maxZoom) return;
            ratio = maxZoom / transform$1.scale;
          }
      
          let size = transformToScreen(clientX, clientY);
      
          transform$1.x = size.x - ratio * (size.x - transform$1.x);
          transform$1.y = size.y - ratio * (size.y - transform$1.y);
      
          // TODO: https://github.com/anvaka/panzoom/issues/112
          if (bounds && boundsPadding === 1 && minZoom === 1) {
            transform$1.scale *= ratio;
            keepTransformInsideBounds();
          } else {
            let transformAdjusted = keepTransformInsideBounds();
            if (!transformAdjusted) transform$1.scale *= ratio;
          }
        } else {
          
          if ( (typeof ratio === "number") ) {
            ratio = { x : ratio, y : ratio }; 
          } else if ( (typeof ratio !== "object") || isNaN$1(ratio.x) || isNaN$1(ratio.y) ) {
            throw new Error('zoom (no aspect) requires valid numbers in x,y pair');
          }

          let newScaleX = transform$1.scaleX * ratio.x * scaleFactors.x ;
          let newScaleY = transform$1.scaleY * ratio.y * scaleFactors.y ;
      
          if ( (scaleFactors.x > 0) && (newScaleX < minZoom) ) {
            if (transform$1.scaleX === minZoom) return;
            ratio.x = minZoom / transform$1.scaleX;
          }
          if ( (scaleFactors.y > 0) && (newScaleY < minZoom) ) {
            if (transform$1.scaleY === minZoom) return;
            ratio.y = minZoom / transform$1.scaleY;
          }

          if (newScaleX > maxZoom) {
            if (transform$1.scaleX === maxZoom) return;
            ratio.x  = maxZoom / transform$1.scaleX;
          }
          if (newScaleY > maxZoom) {
            if (transform$1.scaleY === maxZoom) return;
            ratio.y = maxZoom / transform$1.scaleY;
          }
      
          let size = transformToScreen(clientX, clientY);
      
          transform$1.x = size.x - ratio.x * (size.x - transform$1.x) * scaleFactors.x;  // scale factor?
          transform$1.y = size.y - ratio.y * (size.y - transform$1.y) * scaleFactors.y;
      
          // TODO: https://github.com/anvaka/panzoom/issues/112
          let scx = scaleFactors.x;
          let scy = scaleFactors.y;
          if ( bounds && (boundsPadding === 1) && (minZoom === 1) ) {
            if ( scx ) transform$1.scaleX *= ratio.x;
            if ( scy ) transform$1.scaleY *= ratio.y;
            keepTransformInsideBounds();
          } else {
            let transformAdjusted = keepTransformInsideBounds();
            if (!transformAdjusted) {
              if ( scx ) transform$1.scaleX *= ratio.x;
              if ( scy ) transform$1.scaleY *= ratio.y;
            }
          }

        }

        triggerEvent('zoom');

        makeDirty();
      }

      function zoomAbs(clientX, clientY, zoomLevel) {
        if ( linkAspect ) {
          let ratio = zoomLevel / transform$1.scale;
          zoomByRatio(clientX, clientY, ratio);
        } else {
          let r_pair = { x : 1, y : 1 }; 
          if ( typeof zoomLevel === 'number' ) {
            r_pair = {
              x : (zoomLevel / transform$1.scaleX),
              y : (zoomLevel / transform$1.scaleY)
            };  
          } else {
            r_pair = {
              x : (zoomLevel.x / transform$1.scaleX),
              y : (zoomLevel.y / transform$1.scaleY)
            };  
          }
          zoomByRatio(clientX, clientY, r_pair);
        }
      }

      function centerOn(ui) {
        let parent = ui.ownerSVGElement;
        if (!parent)
          throw new Error('ui element is required to be within the scene');

        // TODO: should i use controller's screen CTM?
        let clientRect = ui.getBoundingClientRect();
        let cx = clientRect.left + clientRect.width / 2;
        let cy = clientRect.top + clientRect.height / 2;

        let container = parent.getBoundingClientRect();
        let dx = container.width / 2 - cx;
        let dy = container.height / 2 - cy;

        internalMoveBy(dx, dy, true);
      }

      function smoothMoveTo(x, y){
        internalMoveBy(x - transform$1.x, y - transform$1.y, true);
      }

      function internalMoveBy(dx, dy, smooth) {
        if (!smooth) {
          return moveBy(dx, dy);
        }

        if (moveByAnimation) moveByAnimation.cancel();

        let from = { x: 0, y: 0 };
        let to = { x: dx, y: dy };
        let lastX = 0;
        let lastY = 0;

        moveByAnimation = amator(from, to, {
          step: function (v) {
            moveBy(v.x - lastX, v.y - lastY);

            lastX = v.x;
            lastY = v.y;
          }
        });
      }

      function scroll(x, y) {
        cancelZoomAnimation();
        moveTo(x, y);
      }

      function dispose() {
        releaseEvents();
      }

      function listenForEvents() {
        owner.addEventListener('mousedown', onMouseDown, { passive: false });
        owner.addEventListener('dblclick', onDoubleClick, { passive: false });
        owner.addEventListener('touchstart', onTouch, { passive: false });
        owner.addEventListener('keydown', onKeyDown, { passive: false });

        // Need to listen on the owner container, so that we are not limited
        // by the size of the scrollable domElement
        wheel.addWheelListener(owner, onMouseWheel, { passive: false });

        makeDirty();
      }

      function releaseEvents() {
        wheel.removeWheelListener(owner, onMouseWheel);
        owner.removeEventListener('mousedown', onMouseDown);
        owner.removeEventListener('keydown', onKeyDown);
        owner.removeEventListener('dblclick', onDoubleClick);
        owner.removeEventListener('touchstart', onTouch);

        if (frameAnimation) {
          window.cancelAnimationFrame(frameAnimation);
          frameAnimation = 0;
        }

        smoothScroll.cancel();

        releaseDocumentMouse();
        releaseTouches();
        textSelection.release();

        triggerPanEnd();
      }

      function frame() {
        if (isDirty) applyTransform();
      }

      function applyTransform() {
        isDirty = false;

        // TODO: Should I allow to cancel this?
        let tt = Object.assign({},transform$1);
        tt.scaleX *= (scaleFactors.x === 0 ? 1.0 : scaleFactors.x);
        tt.scaleY *= (scaleFactors.y === 0 ? 1.0 : scaleFactors.y);
        panController.applyTransform(tt,linkAspect);

        triggerEvent('transform');
        frameAnimation = 0;
      }

      function onKeyDown(e) {
        let x = 0,
          y = 0,
          z = 0;
        if (e.keyCode === 38) {
          y = 1; // up
        } else if (e.keyCode === 40) {
          y = -1; // down
        } else if (e.keyCode === 37) {
          x = 1; // left
        } else if (e.keyCode === 39) {
          x = -1; // right
        } else if (e.keyCode === 189 || e.keyCode === 109) {
          // DASH or SUBTRACT
          z = 1; // `-` -  zoom out
        } else if (e.keyCode === 187 || e.keyCode === 107) {
          // EQUAL SIGN or ADD
          z = -1; // `=` - zoom in (equal sign on US layout is under `+`)
        }

        if (filterKey(e, x, y, z)) {
          // They don't want us to handle the key: https://github.com/anvaka/panzoom/issues/45
          return;
        }

        if (x || y) {
          e.preventDefault();
          e.stopPropagation();

          let clientRect = owner.getBoundingClientRect();
          // movement speed should be the same in both X and Y direction:
          let offset = Math.min(clientRect.width, clientRect.height);
          let moveSpeedRatio = 0.05;
          let dx = offset * moveSpeedRatio * x;
          let dy = offset * moveSpeedRatio * y;

          // TODO: currently we do not animate this. It could be better to have animation
          internalMoveBy(dx, dy);
        }

        if (z) {
          let scaleMultiplier = getScaleMultiplier(z * 100);
          let offset = transformOrigin ? getTransformOriginOffset() : midPoint();
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
        }
      }

      function midPoint() {
        let ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width / 2,
          y: ownerRect.height / 2
        };
      }

      function onTouch(e) {
        // let them override the touch behavior
        beforeTouch(e);
        clearPendingClickEventTimeout();

        if (e.touches.length === 1) {
          return handleSingleFingerTouch(e, e.touches[0]);
        } else if (e.touches.length === 2) {
          // handleTouchMove() will care about pinch zoom.
          pinchZoomLength = getPinchZoomLength(e.touches[0], e.touches[1]);
          multiTouch = true;
          startTouchListenerIfNeeded();
        }
      }

      function beforeTouch(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeTouch`
        if (options.onTouch && !options.onTouch(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/12
          return;
        }

        e.stopPropagation();
        e.preventDefault();
      }

      function beforeDoubleClick(e) {
        clearPendingClickEventTimeout();

        // TODO: Need to unify this filtering names. E.g. use `beforeDoubleClick``
        if (options.onDoubleClick && !options.onDoubleClick(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/46
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      }

      function handleSingleFingerTouch(e) {
        lastTouchStartTime = new Date();
        let touch = e.touches[0];
        let offset = getOffsetXY(touch);
        lastSingleFingerOffset = offset;
        let point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;
        clickX = mouseX;
        clickY = mouseY;

        smoothScroll.cancel();
        startTouchListenerIfNeeded();
      }

      function startTouchListenerIfNeeded() {
        if (touchInProgress) {
          // no need to do anything, as we already listen to events;
          return;
        }

        touchInProgress = true;
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
      }

      function handleTouchMove(e) {
        if (e.touches.length === 1) {
          e.stopPropagation();
          let touch = e.touches[0];

          let offset = getOffsetXY(touch);
          let point = transformToScreen(offset.x, offset.y);

          let dx = point.x - mouseX;
          let dy = point.y - mouseY;

          if (dx !== 0 && dy !== 0) {
            triggerPanStart();
          }
          mouseX = point.x;
          mouseY = point.y;
          internalMoveBy(dx, dy);
        } else if (e.touches.length === 2) {
          // it's a zoom, let's find direction
          multiTouch = true;
          let t1 = e.touches[0];
          let t2 = e.touches[1];
          let currentPinchLength = getPinchZoomLength(t1, t2);

          // since the zoom speed is always based on distance from 1, we need to apply
          // pinch speed only on that distance from 1:
          let scaleMultiplier =
            1 + (currentPinchLength / pinchZoomLength - 1) * pinchSpeed;

          let firstTouchPoint = getOffsetXY(t1);
          let secondTouchPoint = getOffsetXY(t2);
          mouseX = (firstTouchPoint.x + secondTouchPoint.x) / 2;
          mouseY = (firstTouchPoint.y + secondTouchPoint.y) / 2;
          if (transformOrigin) {
            let offset = getTransformOriginOffset();
            mouseX = offset.x;
            mouseY = offset.y;
          }

          publicZoomTo(mouseX, mouseY, scaleMultiplier);

          pinchZoomLength = currentPinchLength;
          e.stopPropagation();
          e.preventDefault();
        }
      }

      function clearPendingClickEventTimeout() {
        if (pendingClickEventTimeout) {
          clearTimeout(pendingClickEventTimeout);
          pendingClickEventTimeout = 0;
        }
      }

      function handlePotentialClickEvent(e) {
        // we could still be in the double tap mode, let's wait until double tap expires,
        // and then notify:
        if (!options.onClick) return;
        clearPendingClickEventTimeout();
        let dx = mouseX - clickX;
        let dy = mouseY - clickY;
        let l = Math.sqrt(dx * dx + dy * dy);
        if (l > 5) return; // probably they are panning, ignore it

        pendingClickEventTimeout = setTimeout(function() {
          pendingClickEventTimeout = 0;
          options.onClick(e);
        }, doubleTapSpeedInMS);
      }

      function handleTouchEnd(e) {
        clearPendingClickEventTimeout();
        if (e.touches.length > 0) {
          let offset = getOffsetXY(e.touches[0]);
          let point = transformToScreen(offset.x, offset.y);
          mouseX = point.x;
          mouseY = point.y;
        } else {
          let now = new Date();
          if (now - lastTouchEndTime < doubleTapSpeedInMS) {
            // They did a double tap here
            if (transformOrigin) {
              let offset = getTransformOriginOffset();
              if ( linkAspect ) {
                smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);            
              } else {
                let xypair = { x : zoomDoubleClickSpeed, y : zoomDoubleClickSpeed };
                smoothZoom(offset.x, offset.y, xypair);            
              }
            } else {
              // We want untransformed x/y here.
              if ( linkAspect ) {
                smoothZoom(lastSingleFingerOffset.x, lastSingleFingerOffset.y, zoomDoubleClickSpeed);            
              } else {
                let xypair = { x : zoomDoubleClickSpeed, y : zoomDoubleClickSpeed };
                smoothZoom(lastSingleFingerOffset.x, lastSingleFingerOffset.y, xypair);            
              }
            }
          } else if (now - lastTouchStartTime < clickEventTimeInMS) {
            handlePotentialClickEvent(e);
          }

          lastTouchEndTime = now;

          triggerPanEnd();
          releaseTouches();
        }
      }

      function getPinchZoomLength(finger1, finger2) {
        let dx = finger1.clientX - finger2.clientX;
        let dy = finger1.clientY - finger2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function onDoubleClick(e) {
        beforeDoubleClick(e);
        let offset = getOffsetXY(e);
        if (transformOrigin) {
          // TODO: looks like this is duplicated in the file.
          // Need to refactor
          offset = getTransformOriginOffset();
        }
        if ( linkAspect ) {
          smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
        } else {
          let ratio = { x : zoomDoubleClickSpeed, y: zoomDoubleClickSpeed };
          smoothZoom(offset.x, offset.y, ratio);
        }
      }

      function onMouseDown(e) {
        clearPendingClickEventTimeout();

        // if client does not want to handle this event - just ignore the call
        if (beforeMouseDown(e)) return;

        lastMouseDownedEvent = e;
        lastMouseDownTime = new Date();

        if (touchInProgress) {
          // modern browsers will fire mousedown for touch events too
          // we do not want this: touch is handled separately.
          e.stopPropagation();
          return false;
        }
        // for IE, left click == 1
        // for Firefox, left click == 0
        let isLeftButton =
          (e.button === 1 && window.event !== null) || e.button === 0;
        if (!isLeftButton) return;

        smoothScroll.cancel();

        let offset = getOffsetXY(e);
        let point = transformToScreen(offset.x, offset.y);
        clickX = mouseX = point.x;
        clickY = mouseY = point.y;

        // We need to listen on document itself, since mouse can go outside of the
        // window, and we will loose it
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        textSelection.capture(e.target || e.srcElement);

        return false;
      }

      function onMouseMove(e) {
        // no need to worry about mouse events when touch is happening
        if (touchInProgress) return;

        triggerPanStart();

        let offset = getOffsetXY(e);
        let point = transformToScreen(offset.x, offset.y);
        let dx = point.x - mouseX;
        let dy = point.y - mouseY;

        mouseX = point.x;
        mouseY = point.y;

        internalMoveBy(dx, dy);
      }

      function onMouseUp() {
        let now = new Date();
        if (now - lastMouseDownTime < clickEventTimeInMS) handlePotentialClickEvent(lastMouseDownedEvent);
        textSelection.release();
        triggerPanEnd();
        releaseDocumentMouse();
      }

      function releaseDocumentMouse() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        panstartFired = false;
      }

      function releaseTouches() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
        panstartFired = false;
        multiTouch = false;
        touchInProgress = false;
      }

      function onMouseWheel(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeWheel(e)) return;

        smoothScroll.cancel();

        let delta = e.deltaY;
        if (e.deltaMode > 0) delta *= 100;

        let scaleMultiplier = getScaleMultiplier(delta);

        if (scaleMultiplier !== 1) {
          let offset = transformOrigin
            ? getTransformOriginOffset()
            : getOffsetXY(e);
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
          e.preventDefault();
        }
      }

      function getOffsetXY(e) {
        let offsetX, offsetY;
        // I tried using e.offsetX, but that gives wrong results for svg, when user clicks on a path.
        let ownerRect = owner.getBoundingClientRect();
        offsetX = e.clientX - ownerRect.left;
        offsetY = e.clientY - ownerRect.top;

        return { x: offsetX, y: offsetY };
      }

      function smoothZoom(clientX, clientY, scaleMultiplier) {
        if ( linkAspect ) {
          let fromValue = transform$1.scale;
          let from = { scale: fromValue };
          let to = { scale: scaleMultiplier * fromValue };
      
          smoothScroll.cancel();
          cancelZoomAnimation();
      
          zoomToAnimation = amator(from, to, {
            step:  (v) => {
              zoomAbs(clientX, clientY, v.scale);
            },
            done: triggerZoomEnd
          });  
        } else {
          let fromValueX = transform$1.scaleX;
          let fromValueY = transform$1.scaleY;
          let from = { x: fromValueX, y: fromValueY };
          let to = false;
          
          if ( typeof scaleMultiplier === 'number' ) {
            to = { x : (scaleMultiplier * fromValueX), y : (scaleMultiplier * fromValueY) };
          } else {
            to = { x : (scaleMultiplier.x * fromValueX), y : (scaleMultiplier.y * fromValueY) };
          }
      
          smoothScroll.cancel();
          cancelZoomAnimation();
      
          zoomToAnimation = amator(from, to, {
            step:  (v) => {
              zoomAbs(clientX, clientY, v);
            },
            done: triggerZoomEnd
          });
        }
      }

      function smoothZoomAbs(clientX, clientY, toScaleValue) {
        if ( linkAspect ) {
          let fromValue = transform$1.scale;
          let from = { scale: fromValue };
          let to = { scale: toScaleValue };

          smoothScroll.cancel();
          cancelZoomAnimation();

          zoomToAnimation = amator(from, to, {
            step: (v) => {
              zoomAbs(clientX, clientY, v.scale);
            }
          });
        } else if ( toScaleValue >= 0.0005 ) {
          let fromValueX = transform$1.scaleX;
          let fromValueY = transform$1.scaleY;
          let from = { x: fromValueX, y: fromValueY };

          let xdif = Math.abs(fromValueX - toScaleValue)/toScaleValue;
          let ydif = Math.abs(fromValueY - toScaleValue)/toScaleValue;


          let to = { x : xdif, y :ydif };

          smoothScroll.cancel();
          cancelZoomAnimation();

          zoomToAnimation = amator(from, to, {
            step: (v) => {
              zoomAbs(clientX, clientY, v);
            }
          });
        }
      }

      function getTransformOriginOffset() {
        let ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width * transformOrigin.x,
          y: ownerRect.height * transformOrigin.y
        };
      }

      function publicZoomTo(clientX, clientY, scaleMultiplier) {
        smoothScroll.cancel();
        cancelZoomAnimation();
        if ( linkAspect ) {
          return zoomByRatio(clientX, clientY, scaleMultiplier);
        } else {
          if (  typeof scaleMultiplier === 'number' ) {
            return zoomByRatio(clientX, clientY, { x : scaleMultiplier, y: scaleMultiplier });
          } else {
            return zoomByRatio(clientX, clientY, { x : scaleMultiplier.x, y: scaleMultiplier.y });
          }
        }
      }

      function cancelZoomAnimation() {
        if (zoomToAnimation) {
          zoomToAnimation.cancel();
          zoomToAnimation = null;
        }
      }

      function getScaleMultiplier(delta) {
        let sign = Math.sign(delta);
        let deltaAdjustedSpeed = Math.min(0.25, Math.abs(speed * delta / 128));
        return 1 - sign * deltaAdjustedSpeed;
      }

      function triggerPanStart() {
        if (!panstartFired) {
          triggerEvent('panstart');
          panstartFired = true;
          smoothScroll.start();
        }
      }

      function triggerPanEnd() {
        if (panstartFired) {
          // we should never run smooth scrolling if it was multiTouch (pinch zoom animation):
          if (!multiTouch) smoothScroll.stop();
          triggerEvent('panend');
        }
      }

      function triggerDecelerateToZero() {
        if ( smoothScroll.stop !== noop ) {
          triggerEvent('decelerated-to-zero');
        }
      }

      function triggerZoomEnd() {
        triggerEvent('zoomend');
      }

      function triggerEvent(name) {
        api.fire(name, api);
      }
    }

    function parseTransformOrigin(options) {
      if (!options) return;
      if (typeof options === 'object') {
        if (!isNumber(options.x) || !isNumber(options.y))
          failTransformOrigin(options);
        return options;
      }

      failTransformOrigin();
    }

    function failTransformOrigin(options) {
      console.error(options);
      throw new Error(
        [
          'Cannot parse transform origin.',
          'Some good examples:',
          '  "center center" can be achieved with {x: 0.5, y: 0.5}',
          '  "top center" can be achieved with {x: 0.5, y: 0}',
          '  "bottom right" can be achieved with {x: 1, y: 1}'
        ].join('\n')
      );
    }

     

    function setPreserveAspect(state) {
      if ( typeof state === "boolean" ) linkAspect = state;
    }


    function noop() { }

    function validateBounds(bounds) {
      let boundsType = typeof bounds;
      if (boundsType === 'undefined' || boundsType === 'boolean') return; // this is okay
      // otherwise need to be more thorough:
      let validBounds =
        isNumber(bounds.left) &&
        isNumber(bounds.top) &&
        isNumber(bounds.bottom) &&
        isNumber(bounds.right);

      if (!validBounds)
        throw new Error(
          'Bounds object is not valid. It can be: ' +
          'undefined, boolean (true|false) or an object {left, top, right, bottom}'
        );
    }

    function isNumber(x) {
      return Number.isFinite(x);
    }

    // IE 11 does not support isNaN:
    function isNaN$1(value) {
      if (Number.isNaN) {
        return Number.isNaN(value);
      }

      return value !== value;
    }

    function rigidScroll() {
      return {
        start: noop,
        stop: noop,
        cancel: noop
      };
    }

    function autoRun() {
      if (typeof document === 'undefined') return;

      let scripts = document.getElementsByTagName('script');
      if (!scripts) return;
      let panzoomScript;

      for (let i = 0; i < scripts.length; ++i) {
        let x = scripts[i];
        if (x.src && x.src.match(/\bpanzoom(\.min)?\.js/)) {
          panzoomScript = x;
          break;
        }
      }

      if (!panzoomScript) return;

      let query = panzoomScript.getAttribute('query');
      if (!query) return;

      let globalName = panzoomScript.getAttribute('name') || 'pz';
      let started = Date.now();

      tryAttach();

      function tryAttach() {
        let el = document.querySelector(query);
        if (!el) {
          let now = Date.now();
          let elapsed = now - started;
          if (elapsed < 2000) {
            // Let's wait a bit
            setTimeout(tryAttach, 100);
            return;
          }
          // If we don't attach within 2 seconds to the target element, consider it a failure
          console.error('Cannot find the panzoom element', globalName);
          return;
        }
        let options = collectOptions(panzoomScript);
        console.log(options);
        window[globalName] = createPanZoom(el, options);
      }

      function collectOptions(script) {
        let attrs = script.attributes;
        let options = {};
        for (let j = 0; j < attrs.length; ++j) {
          let attr = attrs[j];
          let nameValue = getPanzoomAttributeNameValue(attr);
          if (nameValue) {
            options[nameValue.name] = nameValue.value;
          }
        }

        return options;
      }

      function getPanzoomAttributeNameValue(attr) {
        if (!attr.name) return;
        let isPanZoomAttribute =
          attr.name[0] === 'p' && attr.name[1] === 'z' && attr.name[2] === '-';

        if (!isPanZoomAttribute) return;

        let name = attr.name.substr(3);
        let value = JSON.parse(attr.value);
        return { name: name, value: value };
      }
    }

    var panzoom = createPanZoom;


    autoRun();

    // list_on_display -- this is actually using the thing list... it has the current edits. 
    //

    async function send_time_line(manager_link,upload_link,list_of_time_slots,list_on_display) {
        //
        let time_slot_meta = {
            "link" : manager_link,
            "secondary_link" : upload_link,
            "topic" : "calendar-slots",
            "uploader_type" : "json-lite"
        };
        await window.send_time_slots(list_of_time_slots,time_slot_meta);
        //
        /*
        let tl = new TimeLine({
            "send_and_store" : (a_month) => {
                window.post_month(a_month)
            },
            "month" : new MonthFetcher(list_on_display)
        })
        //
        for ( let mo of list_on_display ) {
            for ( let ts of list_of_time_slots ) {
                mo.add_time_slot(ts)
            }
            tl.injest_month(mo.start_time)
        }
        //
        let status = await tl.save_time_list(true)   // has to negotiate with of-this.world
        if ( status ) {
        }
        */
        let message = {
            "notification" : "change",
            "affective" : Date.now()
        };
        publish(cnst.NOTIFY_TIMELINE_CHANGE,cnst.USER_CHAT_PATH,message);
    }



    async function injest_request(slot,things) {
        for ( let a_thing of things ) {
            if ( (a_thing.month === slot.month) && (a_thing.year === slot.year) ) {
                //
                let tlsa = a_thing.cal.map[slot.mo_key];
                if ( tlsa ) {
                    tlsa.add_slot(slot);
                }
                //
                return true
            }
        }
        return false
    }


    async function drop_request(slot,things) {
        for ( let a_thing of things ) {
            if ( (a_thing.month === slot.month) && (a_thing.year === slot.year) ) {
                //
                let tlsa = a_thing.cal.map[slot.mo_key];
                if ( tlsa ) {
                    tlsa.remove_slot(slot);
                }
                //
                return true
            }
        }
        return false
    }

    var tl_subr = {
        send_time_line,
        injest_request,
        drop_request
    };

    const ONE_HOUR = (3600*1000);
    const ONE_HALF_HOUR = (3600*500);
    const ONE_QUARTER_HOUR = (3600*250);
    const ONE_QUARTER_HOUR_MINUTES$1 = (15);
    const ONE_HALF_HOUR_MINUTES$1  = (30);
    //
    const USE_AS_BLOCK$1 = "block";
    const USE_AS_MEET$1 = "meeting";
    const USE_AS_ACTIVITY$1 = "activity";
    const USE_AS_OPEN$1 = "open";


    var evuses = {
        "ONE_HOUR" : ONE_HOUR,
        "ONE_HALF_HOUR" : ONE_HALF_HOUR,
        "ONE_QUARTER_HOUR" : ONE_QUARTER_HOUR,
        "ONE_QUARTER_HOUR_MINUTES" : ONE_QUARTER_HOUR_MINUTES$1,
        "ONE_HALF_HOUR_MINUTES" : ONE_HALF_HOUR_MINUTES$1,
        //
        "USE_AS_BLOCK" : USE_AS_BLOCK$1,
        "USE_AS_MEET" : USE_AS_MEET$1,
        "USE_AS_ACTIVITY" : USE_AS_ACTIVITY$1,
        "USE_AS_OPEN" : USE_AS_OPEN$1
    };

    let time_zone = 'America/Los Angeles';

    let local_midnights = {
      "1/1/2022": 1641024000000,
      "1/31/2022": 1643616000000,
      "2/1/2022": 1643702400000,
      "2/28/2022": 1646035200000,
      "3/1/2022": 1646121600000,
      "3/31/2022": 1648710000000,
      "4/1/2022": 1648796400000,
      "4/30/2022": 1651302000000,
      "5/1/2022": 1651388400000,
      "5/31/2022": 1653980400000,
      "6/1/2022": 1654066800000,
      "6/30/2022": 1656572400000,
      "7/1/2022": 1656658800000,
      "7/31/2022": 1659250800000,
      "8/1/2022": 1659337200000,
      "8/31/2022": 1661929200000,
      "9/1/2022": 1662015600000,
      "9/30/2022": 1664521200000,
      "10/1/2022": 1664607600000,
      "10/31/2022": 1667199600000,
      "11/1/2022": 1667286000000,
      "11/30/2022": 1669795200000,
      "12/1/2022": 1669881600000,
      "12/31/2022": 1672473600000,
      "1/1/2023": 1672560000000,
      "1/31/2023": 1675152000000,
      "2/1/2023": 1675238400000,
      "2/28/2023": 1677571200000,
      "3/1/2023": 1677657600000,
      "3/31/2023": 1680246000000,
      "4/1/2023": 1680332400000,
      "4/30/2023": 1682838000000,
      "5/1/2023": 1682924400000,
      "5/31/2023": 1685516400000,
      "6/1/2023": 1685602800000,
      "6/30/2023": 1688108400000,
      "7/1/2023": 1688194800000,
      "7/31/2023": 1690786800000,
      "8/1/2023": 1690873200000,
      "8/31/2023": 1693465200000,
      "9/1/2023": 1693551600000,
      "9/30/2023": 1696057200000,
      "10/1/2023": 1696143600000,
      "10/31/2023": 1698735600000,
      "11/1/2023": 1698822000000,
      "11/30/2023": 1701331200000,
      "12/1/2023": 1701417600000,
      "12/31/2023": 1704009600000,
      "1/1/2024": 1704096000000,
      "1/31/2024": 1706688000000,
      "2/1/2024": 1706774400000,
      "2/29/2024": 1709193600000,
      "3/1/2024": 1709280000000,
      "3/31/2024": 1711868400000,
      "4/1/2024": 1711954800000,
      "4/30/2024": 1714460400000,
      "5/1/2024": 1714546800000,
      "5/31/2024": 1717138800000,
      "6/1/2024": 1717225200000,
      "6/30/2024": 1719730800000,
      "7/1/2024": 1719817200000,
      "7/31/2024": 1722409200000,
      "8/1/2024": 1722495600000,
      "8/31/2024": 1725087600000,
      "9/1/2024": 1725174000000,
      "9/30/2024": 1727679600000,
      "10/1/2024": 1727766000000,
      "10/31/2024": 1730358000000,
      "11/1/2024": 1730444400000,
      "11/30/2024": 1732953600000,
      "12/1/2024": 1733040000000,
      "12/31/2024": 1735632000000,
      "1/1/2025": 1735718400000,
      "1/31/2025": 1738310400000,
      "2/1/2025": 1738396800000,
      "2/28/2025": 1740729600000,
      "3/1/2025": 1740816000000,
      "3/31/2025": 1743404400000,
      "4/1/2025": 1743490800000,
      "4/30/2025": 1745996400000,
      "5/1/2025": 1746082800000,
      "5/31/2025": 1748674800000,
      "6/1/2025": 1748761200000,
      "6/30/2025": 1751266800000,
      "7/1/2025": 1751353200000,
      "7/31/2025": 1753945200000,
      "8/1/2025": 1754031600000,
      "8/31/2025": 1756623600000,
      "9/1/2025": 1756710000000,
      "9/30/2025": 1759215600000,
      "10/1/2025": 1759302000000,
      "10/31/2025": 1761894000000,
      "11/1/2025": 1761980400000,
      "11/30/2025": 1764489600000,
      "12/1/2025": 1764576000000,
      "12/31/2025": 1767168000000
    }; // UTC midnight by local time (stored for this stite)
    //
    let sundays = {
      "1/2/2022": 1641110400000,
      "1/9/2022": 1641715200000,
      "1/16/2022": 1642320000000,
      "1/23/2022": 1642924800000,
      "1/30/2022": 1643529600000,
      "2/6/2022": 1644134400000,
      "2/13/2022": 1644739200000,
      "2/20/2022": 1645344000000,
      "2/27/2022": 1645948800000,
      "3/6/2022": 1646553600000,
      "3/13/2022": 1647158400000,
      "3/20/2022": 1647759600000,
      "3/27/2022": 1648364400000,
      "4/3/2022": 1648969200000,
      "4/10/2022": 1649574000000,
      "4/17/2022": 1650178800000,
      "4/24/2022": 1650783600000,
      "5/1/2022": 1651388400000,
      "5/8/2022": 1651993200000,
      "5/15/2022": 1652598000000,
      "5/22/2022": 1653202800000,
      "5/29/2022": 1653807600000,
      "6/5/2022": 1654412400000,
      "6/12/2022": 1655017200000,
      "6/19/2022": 1655622000000,
      "6/26/2022": 1656226800000,
      "7/3/2022": 1656831600000,
      "7/10/2022": 1657436400000,
      "7/17/2022": 1658041200000,
      "7/24/2022": 1658646000000,
      "7/31/2022": 1659250800000,
      "8/7/2022": 1659855600000,
      "8/14/2022": 1660460400000,
      "8/21/2022": 1661065200000,
      "8/28/2022": 1661670000000,
      "9/4/2022": 1662274800000,
      "9/11/2022": 1662879600000,
      "9/18/2022": 1663484400000,
      "9/25/2022": 1664089200000,
      "10/2/2022": 1664694000000,
      "10/9/2022": 1665298800000,
      "10/16/2022": 1665903600000,
      "10/23/2022": 1666508400000,
      "10/30/2022": 1667113200000,
      "11/6/2022": 1667718000000,
      "11/13/2022": 1668326400000,
      "11/20/2022": 1668931200000,
      "11/27/2022": 1669536000000,
      "12/4/2022": 1670140800000,
      "12/11/2022": 1670745600000,
      "12/18/2022": 1671350400000,
      "12/25/2022": 1671955200000,
      "1/1/2023": 1672560000000,
      "1/8/2023": 1673164800000,
      "1/15/2023": 1673769600000,
      "1/22/2023": 1674374400000,
      "1/29/2023": 1674979200000,
      "2/5/2023": 1675584000000,
      "2/12/2023": 1676188800000,
      "2/19/2023": 1676793600000,
      "2/26/2023": 1677398400000,
      "3/5/2023": 1678003200000,
      "3/12/2023": 1678608000000,
      "3/19/2023": 1679209200000,
      "3/26/2023": 1679814000000,
      "4/2/2023": 1680418800000,
      "4/9/2023": 1681023600000,
      "4/16/2023": 1681628400000,
      "4/23/2023": 1682233200000,
      "4/30/2023": 1682838000000,
      "5/7/2023": 1683442800000,
      "5/14/2023": 1684047600000,
      "5/21/2023": 1684652400000,
      "5/28/2023": 1685257200000,
      "6/4/2023": 1685862000000,
      "6/11/2023": 1686466800000,
      "6/18/2023": 1687071600000,
      "6/25/2023": 1687676400000,
      "7/2/2023": 1688281200000,
      "7/9/2023": 1688886000000,
      "7/16/2023": 1689490800000,
      "7/23/2023": 1690095600000,
      "7/30/2023": 1690700400000,
      "8/6/2023": 1691305200000,
      "8/13/2023": 1691910000000,
      "8/20/2023": 1692514800000,
      "8/27/2023": 1693119600000,
      "9/3/2023": 1693724400000,
      "9/10/2023": 1694329200000,
      "9/17/2023": 1694934000000,
      "9/24/2023": 1695538800000,
      "10/1/2023": 1696143600000,
      "10/8/2023": 1696748400000,
      "10/15/2023": 1697353200000,
      "10/22/2023": 1697958000000,
      "10/29/2023": 1698562800000,
      "11/5/2023": 1699167600000,
      "11/12/2023": 1699776000000,
      "11/19/2023": 1700380800000,
      "11/26/2023": 1700985600000,
      "12/3/2023": 1701590400000,
      "12/10/2023": 1702195200000,
      "12/17/2023": 1702800000000,
      "12/24/2023": 1703404800000,
      "12/31/2023": 1704009600000,
      "1/7/2024": 1704614400000,
      "1/14/2024": 1705219200000,
      "1/21/2024": 1705824000000,
      "1/28/2024": 1706428800000,
      "2/4/2024": 1707033600000,
      "2/11/2024": 1707638400000,
      "2/18/2024": 1708243200000,
      "2/25/2024": 1708848000000,
      "3/3/2024": 1709452800000,
      "3/10/2024": 1710057600000,
      "3/17/2024": 1710658800000,
      "3/24/2024": 1711263600000,
      "3/31/2024": 1711868400000,
      "4/7/2024": 1712473200000,
      "4/14/2024": 1713078000000,
      "4/21/2024": 1713682800000,
      "4/28/2024": 1714287600000,
      "5/5/2024": 1714892400000,
      "5/12/2024": 1715497200000,
      "5/19/2024": 1716102000000,
      "5/26/2024": 1716706800000,
      "6/2/2024": 1717311600000,
      "6/9/2024": 1717916400000,
      "6/16/2024": 1718521200000,
      "6/23/2024": 1719126000000,
      "6/30/2024": 1719730800000,
      "7/7/2024": 1720335600000,
      "7/14/2024": 1720940400000,
      "7/21/2024": 1721545200000,
      "7/28/2024": 1722150000000,
      "8/4/2024": 1722754800000,
      "8/11/2024": 1723359600000,
      "8/18/2024": 1723964400000,
      "8/25/2024": 1724569200000,
      "9/1/2024": 1725174000000,
      "9/8/2024": 1725778800000,
      "9/15/2024": 1726383600000,
      "9/22/2024": 1726988400000,
      "9/29/2024": 1727593200000,
      "10/6/2024": 1728198000000,
      "10/13/2024": 1728802800000,
      "10/20/2024": 1729407600000,
      "10/27/2024": 1730012400000,
      "11/3/2024": 1730617200000,
      "11/10/2024": 1731225600000,
      "11/17/2024": 1731830400000,
      "11/24/2024": 1732435200000,
      "12/1/2024": 1733040000000,
      "12/8/2024": 1733644800000,
      "12/15/2024": 1734249600000,
      "12/22/2024": 1734854400000,
      "12/29/2024": 1735459200000
    };
    let saturdays = {
      "1/1/2022": 1641024000000,
      "1/8/2022": 1641628800000,
      "1/15/2022": 1642233600000,
      "1/22/2022": 1642838400000,
      "1/29/2022": 1643443200000,
      "2/5/2022": 1644048000000,
      "2/12/2022": 1644652800000,
      "2/19/2022": 1645257600000,
      "2/26/2022": 1645862400000,
      "3/5/2022": 1646467200000,
      "3/12/2022": 1647072000000,
      "3/19/2022": 1647673200000,
      "3/26/2022": 1648278000000,
      "4/2/2022": 1648882800000,
      "4/9/2022": 1649487600000,
      "4/16/2022": 1650092400000,
      "4/23/2022": 1650697200000,
      "4/30/2022": 1651302000000,
      "5/7/2022": 1651906800000,
      "5/14/2022": 1652511600000,
      "5/21/2022": 1653116400000,
      "5/28/2022": 1653721200000,
      "6/4/2022": 1654326000000,
      "6/11/2022": 1654930800000,
      "6/18/2022": 1655535600000,
      "6/25/2022": 1656140400000,
      "7/2/2022": 1656745200000,
      "7/9/2022": 1657350000000,
      "7/16/2022": 1657954800000,
      "7/23/2022": 1658559600000,
      "7/30/2022": 1659164400000,
      "8/6/2022": 1659769200000,
      "8/13/2022": 1660374000000,
      "8/20/2022": 1660978800000,
      "8/27/2022": 1661583600000,
      "9/3/2022": 1662188400000,
      "9/10/2022": 1662793200000,
      "9/17/2022": 1663398000000,
      "9/24/2022": 1664002800000,
      "10/1/2022": 1664607600000,
      "10/8/2022": 1665212400000,
      "10/15/2022": 1665817200000,
      "10/22/2022": 1666422000000,
      "10/29/2022": 1667026800000,
      "11/5/2022": 1667631600000,
      "11/12/2022": 1668240000000,
      "11/19/2022": 1668844800000,
      "11/26/2022": 1669449600000,
      "12/3/2022": 1670054400000,
      "12/10/2022": 1670659200000,
      "12/17/2022": 1671264000000,
      "12/24/2022": 1671868800000,
      "12/31/2022": 1672473600000,
      "1/7/2023": 1673078400000,
      "1/14/2023": 1673683200000,
      "1/21/2023": 1674288000000,
      "1/28/2023": 1674892800000,
      "2/4/2023": 1675497600000,
      "2/11/2023": 1676102400000,
      "2/18/2023": 1676707200000,
      "2/25/2023": 1677312000000,
      "3/4/2023": 1677916800000,
      "3/11/2023": 1678521600000,
      "3/18/2023": 1679122800000,
      "3/25/2023": 1679727600000,
      "4/1/2023": 1680332400000,
      "4/8/2023": 1680937200000,
      "4/15/2023": 1681542000000,
      "4/22/2023": 1682146800000,
      "4/29/2023": 1682751600000,
      "5/6/2023": 1683356400000,
      "5/13/2023": 1683961200000,
      "5/20/2023": 1684566000000,
      "5/27/2023": 1685170800000,
      "6/3/2023": 1685775600000,
      "6/10/2023": 1686380400000,
      "6/17/2023": 1686985200000,
      "6/24/2023": 1687590000000,
      "7/1/2023": 1688194800000,
      "7/8/2023": 1688799600000,
      "7/15/2023": 1689404400000,
      "7/22/2023": 1690009200000,
      "7/29/2023": 1690614000000,
      "8/5/2023": 1691218800000,
      "8/12/2023": 1691823600000,
      "8/19/2023": 1692428400000,
      "8/26/2023": 1693033200000,
      "9/2/2023": 1693638000000,
      "9/9/2023": 1694242800000,
      "9/16/2023": 1694847600000,
      "9/23/2023": 1695452400000,
      "9/30/2023": 1696057200000,
      "10/7/2023": 1696662000000,
      "10/14/2023": 1697266800000,
      "10/21/2023": 1697871600000,
      "10/28/2023": 1698476400000,
      "11/4/2023": 1699081200000,
      "11/11/2023": 1699689600000,
      "11/18/2023": 1700294400000,
      "11/25/2023": 1700899200000,
      "12/2/2023": 1701504000000,
      "12/9/2023": 1702108800000,
      "12/16/2023": 1702713600000,
      "12/23/2023": 1703318400000,
      "12/30/2023": 1703923200000,
      "1/6/2024": 1704528000000,
      "1/13/2024": 1705132800000,
      "1/20/2024": 1705737600000,
      "1/27/2024": 1706342400000,
      "2/3/2024": 1706947200000,
      "2/10/2024": 1707552000000,
      "2/17/2024": 1708156800000,
      "2/24/2024": 1708761600000,
      "3/2/2024": 1709366400000,
      "3/9/2024": 1709971200000,
      "3/16/2024": 1710572400000,
      "3/23/2024": 1711177200000,
      "3/30/2024": 1711782000000,
      "4/6/2024": 1712386800000,
      "4/13/2024": 1712991600000,
      "4/20/2024": 1713596400000,
      "4/27/2024": 1714201200000,
      "5/4/2024": 1714806000000,
      "5/11/2024": 1715410800000,
      "5/18/2024": 1716015600000,
      "5/25/2024": 1716620400000,
      "6/1/2024": 1717225200000,
      "6/8/2024": 1717830000000,
      "6/15/2024": 1718434800000,
      "6/22/2024": 1719039600000,
      "6/29/2024": 1719644400000,
      "7/6/2024": 1720249200000,
      "7/13/2024": 1720854000000,
      "7/20/2024": 1721458800000,
      "7/27/2024": 1722063600000,
      "8/3/2024": 1722668400000,
      "8/10/2024": 1723273200000,
      "8/17/2024": 1723878000000,
      "8/24/2024": 1724482800000,
      "8/31/2024": 1725087600000,
      "9/7/2024": 1725692400000,
      "9/14/2024": 1726297200000,
      "9/21/2024": 1726902000000,
      "9/28/2024": 1727506800000,
      "10/5/2024": 1728111600000,
      "10/12/2024": 1728716400000,
      "10/19/2024": 1729321200000,
      "10/26/2024": 1729926000000,
      "11/2/2024": 1730530800000,
      "11/9/2024": 1731139200000,
      "11/16/2024": 1731744000000,
      "11/23/2024": 1732348800000,
      "11/30/2024": 1732953600000,
      "12/7/2024": 1733558400000,
      "12/14/2024": 1734163200000,
      "12/21/2024": 1734768000000,
      "12/28/2024": 1735372800000
    };

    let holidays = {
      "12/31/2021": {
        "label": "New Year's Day",
        "date_key": "12/31/2021",
        "begin_at": 1640937600000,
        "end_at": 1641024000000,
        "use": "block"
      },
      "1/17/2022": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/17/2022",
        "begin_at": 1642406400000,
        "end_at": 1642492800000,
        "use": "block"
      },
      "2/21/2022": {
        "label": "Washington's Birthday",
        "date_key": "2/21/2022",
        "begin_at": 1645430400000,
        "end_at": 1645516800000,
        "use": "block"
      },
      "5/30/2022": {
        "label": "Memorial Day",
        "date_key": "5/30/2022",
        "begin_at": 1653894000000,
        "end_at": 1653980400000,
        "use": "block"
      },
      "6/20/2022": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/20/2022",
        "begin_at": 1655708400000,
        "end_at": 1655794800000,
        "use": "block"
      },
      "7/4/2022": {
        "label": "Independence Day",
        "date_key": "7/4/2022",
        "begin_at": 1656918000000,
        "end_at": 1657004400000,
        "use": "block"
      },
      "9/5/2022": {
        "label": "Labor Day",
        "date_key": "9/5/2022",
        "begin_at": 1662361200000,
        "end_at": 1662447600000,
        "use": "block"
      },
      "10/10/2022": {
        "label": "Columbus Day",
        "date_key": "10/10/2022",
        "begin_at": 1665385200000,
        "end_at": 1665471600000,
        "use": "block"
      },
      "11/11/2022": {
        "label": "Veterans Day",
        "date_key": "11/11/2022",
        "begin_at": 1668153600000,
        "end_at": 1668240000000,
        "use": "block"
      },
      "11/24/2022": {
        "label": "Thanksgiving Day",
        "date_key": "11/24/2022",
        "begin_at": 1669276800000,
        "end_at": 1669363200000,
        "use": "block"
      },
      "12/26/2022": {
        "label": "Christmas Day",
        "date_key": "12/26/2022",
        "begin_at": 1672041600000,
        "end_at": 1672128000000,
        "use": "block"
      },
      "1/2/2023": {
        "label": "New Year's Day",
        "date_key": "1/2/2023",
        "begin_at": 1672646400000,
        "end_at": 1672732800000,
        "use": "block"
      },
      "1/16/2023": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/16/2023",
        "begin_at": 1673856000000,
        "end_at": 1673942400000,
        "use": "block"
      },
      "2/20/2023": {
        "label": "Washington's Birthday",
        "date_key": "2/20/2023",
        "begin_at": 1676880000000,
        "end_at": 1676966400000,
        "use": "block"
      },
      "5/29/2023": {
        "label": "Memorial Day",
        "date_key": "5/29/2023",
        "begin_at": 1685343600000,
        "end_at": 1685430000000,
        "use": "block"
      },
      "6/19/2023": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2023",
        "begin_at": 1687158000000,
        "end_at": 1687244400000,
        "use": "block"
      },
      "7/4/2023": {
        "label": "Independence Day",
        "date_key": "7/4/2023",
        "begin_at": 1688454000000,
        "end_at": 1688540400000,
        "use": "block"
      },
      "9/4/2023": {
        "label": "Labor Day",
        "date_key": "9/4/2023",
        "begin_at": 1693810800000,
        "end_at": 1693897200000,
        "use": "block"
      },
      "10/9/2023": {
        "label": "Columbus Day",
        "date_key": "10/9/2023",
        "begin_at": 1696834800000,
        "end_at": 1696921200000,
        "use": "block"
      },
      "11/10/2023": {
        "label": "Veterans Day",
        "date_key": "11/10/2023",
        "begin_at": 1699603200000,
        "end_at": 1699689600000,
        "use": "block"
      },
      "11/23/2023": {
        "label": "Thanksgiving Day",
        "date_key": "11/23/2023",
        "begin_at": 1700726400000,
        "end_at": 1700812800000,
        "use": "block"
      },
      "12/25/2023": {
        "label": "Christmas Day",
        "date_key": "12/25/2023",
        "begin_at": 1703491200000,
        "end_at": 1703577600000,
        "use": "block"
      },
      "1/1/2024": {
        "label": "New Year's Day",
        "date_key": "1/1/2024",
        "begin_at": 1704096000000,
        "end_at": 1704182400000,
        "use": "block"
      },
      "1/15/2024": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/15/2024",
        "begin_at": 1705305600000,
        "end_at": 1705392000000,
        "use": "block"
      },
      "2/19/2024": {
        "label": "Washington's Birthday",
        "date_key": "2/19/2024",
        "begin_at": 1708329600000,
        "end_at": 1708416000000,
        "use": "block"
      },
      "5/27/2024": {
        "label": "Memorial Day",
        "date_key": "5/27/2024",
        "begin_at": 1716793200000,
        "end_at": 1716879600000,
        "use": "block"
      },
      "6/19/2024": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2024",
        "begin_at": 1718780400000,
        "end_at": 1718866800000,
        "use": "block"
      },
      "7/4/2024": {
        "label": "Independence Day",
        "date_key": "7/4/2024",
        "begin_at": 1720076400000,
        "end_at": 1720162800000,
        "use": "block"
      },
      "9/2/2024": {
        "label": "Labor Day",
        "date_key": "9/2/2024",
        "begin_at": 1725260400000,
        "end_at": 1725346800000,
        "use": "block"
      },
      "10/14/2024": {
        "label": "Columbus Day",
        "date_key": "10/14/2024",
        "begin_at": 1728889200000,
        "end_at": 1728975600000,
        "use": "block"
      },
      "11/11/2024": {
        "label": "Veterans Day",
        "date_key": "11/11/2024",
        "begin_at": 1731312000000,
        "end_at": 1731398400000,
        "use": "block"
      },
      "11/28/2024": {
        "label": "Thanksgiving Day",
        "date_key": "11/28/2024",
        "begin_at": 1732780800000,
        "end_at": 1732867200000,
        "use": "block"
      },
      "12/25/2024": {
        "label": "Christmas Day",
        "date_key": "12/25/2024",
        "begin_at": 1735113600000,
        "end_at": 1735200000000,
        "use": "block"
      },
      "1/1/2025": {
        "label": "New Year's Day",
        "date_key": "1/1/2025",
        "begin_at": 1735718400000,
        "end_at": 1735804800000,
        "use": "block"
      },
      "1/20/2025": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/20/2025",
        "begin_at": 1737360000000,
        "end_at": 1737446400000,
        "use": "block"
      },
      "2/17/2025": {
        "label": "Washington's Birthday",
        "date_key": "2/17/2025",
        "begin_at": 1739779200000,
        "end_at": 1739865600000,
        "use": "block"
      },
      "5/26/2025": {
        "label": "Memorial Day",
        "date_key": "5/26/2025",
        "begin_at": 1748242800000,
        "end_at": 1748329200000,
        "use": "block"
      },
      "6/19/2025": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2025",
        "begin_at": 1750316400000,
        "end_at": 1750402800000,
        "use": "block"
      },
      "7/4/2025": {
        "label": "Independence Day",
        "date_key": "7/4/2025",
        "begin_at": 1751612400000,
        "end_at": 1751698800000,
        "use": "block"
      },
      "9/1/2025": {
        "label": "Labor Day",
        "date_key": "9/1/2025",
        "begin_at": 1756710000000,
        "end_at": 1756796400000,
        "use": "block"
      },
      "10/13/2025": {
        "label": "Columbus Day",
        "date_key": "10/13/2025",
        "begin_at": 1760338800000,
        "end_at": 1760425200000,
        "use": "block"
      },
      "11/11/2025": {
        "label": "Veterans Day",
        "date_key": "11/11/2025",
        "begin_at": 1762848000000,
        "end_at": 1762934400000,
        "use": "block"
      },
      "11/27/2025": {
        "label": "Thanksgiving Day",
        "date_key": "11/27/2025",
        "begin_at": 1764230400000,
        "end_at": 1764316800000,
        "use": "block"
      },
      "12/25/2025": {
        "label": "Christmas Day",
        "date_key": "12/25/2025",
        "begin_at": 1766649600000,
        "end_at": 1766736000000,
        "use": "block"
      },
      "1/1/2026": {
        "label": "New Year's Day",
        "date_key": "1/1/2026",
        "begin_at": 1767254400000,
        "end_at": 1767340800000,
        "use": "block"
      },
      "1/19/2026": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/19/2026",
        "begin_at": 1768809600000,
        "end_at": 1768896000000,
        "use": "block"
      },
      "2/16/2026": {
        "label": "Washington's Birthday",
        "date_key": "2/16/2026",
        "begin_at": 1771228800000,
        "end_at": 1771315200000,
        "use": "block"
      },
      "5/25/2026": {
        "label": "Memorial Day",
        "date_key": "5/25/2026",
        "begin_at": 1779692400000,
        "end_at": 1779778800000,
        "use": "block"
      },
      "6/19/2026": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2026",
        "begin_at": 1781852400000,
        "end_at": 1781938800000,
        "use": "block"
      },
      "7/3/2026": {
        "label": "Independence Day",
        "date_key": "7/3/2026",
        "begin_at": 1783062000000,
        "end_at": 1783148400000,
        "use": "block"
      },
      "9/7/2026": {
        "label": "Labor Day",
        "date_key": "9/7/2026",
        "begin_at": 1788764400000,
        "end_at": 1788850800000,
        "use": "block"
      },
      "10/12/2026": {
        "label": "Columbus Day",
        "date_key": "10/12/2026",
        "begin_at": 1791788400000,
        "end_at": 1791874800000,
        "use": "block"
      },
      "11/11/2026": {
        "label": "Veterans Day",
        "date_key": "11/11/2026",
        "begin_at": 1794384000000,
        "end_at": 1794470400000,
        "use": "block"
      },
      "11/26/2026": {
        "label": "Thanksgiving Day",
        "date_key": "11/26/2026",
        "begin_at": 1795680000000,
        "end_at": 1795766400000,
        "use": "block"
      },
      "12/25/2026": {
        "label": "Christmas Day",
        "date_key": "12/25/2026",
        "begin_at": 1798185600000,
        "end_at": 1798272000000,
        "use": "block"
      },
      "1/1/2027": {
        "label": "New Year's Day",
        "date_key": "1/1/2027",
        "begin_at": 1798790400000,
        "end_at": 1798876800000,
        "use": "block"
      },
      "1/18/2027": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/18/2027",
        "begin_at": 1800259200000,
        "end_at": 1800345600000,
        "use": "block"
      },
      "2/15/2027": {
        "label": "Washington's Birthday",
        "date_key": "2/15/2027",
        "begin_at": 1802678400000,
        "end_at": 1802764800000,
        "use": "block"
      },
      "5/31/2027": {
        "label": "Memorial Day",
        "date_key": "5/31/2027",
        "begin_at": 1811746800000,
        "end_at": 1811833200000,
        "use": "block"
      },
      "6/18/2027": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/18/2027",
        "begin_at": 1813302000000,
        "end_at": 1813388400000,
        "use": "block"
      },
      "7/5/2027": {
        "label": "Independence Day",
        "date_key": "7/5/2027",
        "begin_at": 1814770800000,
        "end_at": 1814857200000,
        "use": "block"
      },
      "9/6/2027": {
        "label": "Labor Day",
        "date_key": "9/6/2027",
        "begin_at": 1820214000000,
        "end_at": 1820300400000,
        "use": "block"
      },
      "10/11/2027": {
        "label": "Columbus Day",
        "date_key": "10/11/2027",
        "begin_at": 1823238000000,
        "end_at": 1823324400000,
        "use": "block"
      },
      "11/11/2027": {
        "label": "Veterans Day",
        "date_key": "11/11/2027",
        "begin_at": 1825920000000,
        "end_at": 1826006400000,
        "use": "block"
      },
      "11/25/2027": {
        "label": "Thanksgiving Day",
        "date_key": "11/25/2027",
        "begin_at": 1827129600000,
        "end_at": 1827216000000,
        "use": "block"
      },
      "12/24/2027": {
        "label": "Christmas Day",
        "date_key": "12/24/2027",
        "begin_at": 1829635200000,
        "end_at": 1829721600000,
        "use": "block"
      },
      "12/31/2027": {
        "label": "New Year's Day",
        "date_key": "12/31/2027",
        "begin_at": 1830240000000,
        "end_at": 1830326400000,
        "use": "block"
      },
      "1/17/2028": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/17/2028",
        "begin_at": 1831708800000,
        "end_at": 1831795200000,
        "use": "block"
      },
      "2/21/2028": {
        "label": "Washington's Birthday",
        "date_key": "2/21/2028",
        "begin_at": 1834732800000,
        "end_at": 1834819200000,
        "use": "block"
      },
      "5/29/2028": {
        "label": "Memorial Day",
        "date_key": "5/29/2028",
        "begin_at": 1843196400000,
        "end_at": 1843282800000,
        "use": "block"
      },
      "6/19/2028": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2028",
        "begin_at": 1845010800000,
        "end_at": 1845097200000,
        "use": "block"
      },
      "7/4/2028": {
        "label": "Independence Day",
        "date_key": "7/4/2028",
        "begin_at": 1846306800000,
        "end_at": 1846393200000,
        "use": "block"
      },
      "9/4/2028": {
        "label": "Labor Day",
        "date_key": "9/4/2028",
        "begin_at": 1851663600000,
        "end_at": 1851750000000,
        "use": "block"
      },
      "10/9/2028": {
        "label": "Columbus Day",
        "date_key": "10/9/2028",
        "begin_at": 1854687600000,
        "end_at": 1854774000000,
        "use": "block"
      },
      "11/10/2028": {
        "label": "Veterans Day",
        "date_key": "11/10/2028",
        "begin_at": 1857456000000,
        "end_at": 1857542400000,
        "use": "block"
      },
      "11/23/2028": {
        "label": "Thanksgiving Day",
        "date_key": "11/23/2028",
        "begin_at": 1858579200000,
        "end_at": 1858665600000,
        "use": "block"
      },
      "12/25/2028": {
        "label": "Christmas Day",
        "date_key": "12/25/2028",
        "begin_at": 1861344000000,
        "end_at": 1861430400000,
        "use": "block"
      },
      "1/1/2029": {
        "label": "New Year's Day",
        "date_key": "1/1/2029",
        "begin_at": 1861948800000,
        "end_at": 1862035200000,
        "use": "block"
      },
      "1/15/2029": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/15/2029",
        "begin_at": 1863158400000,
        "end_at": 1863244800000,
        "use": "block"
      },
      "2/19/2029": {
        "label": "Washington's Birthday",
        "date_key": "2/19/2029",
        "begin_at": 1866182400000,
        "end_at": 1866268800000,
        "use": "block"
      },
      "5/28/2029": {
        "label": "Memorial Day",
        "date_key": "5/28/2029",
        "begin_at": 1874646000000,
        "end_at": 1874732400000,
        "use": "block"
      },
      "6/19/2029": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2029",
        "begin_at": 1876546800000,
        "end_at": 1876633200000,
        "use": "block"
      },
      "7/4/2029": {
        "label": "Independence Day",
        "date_key": "7/4/2029",
        "begin_at": 1877842800000,
        "end_at": 1877929200000,
        "use": "block"
      },
      "9/3/2029": {
        "label": "Labor Day",
        "date_key": "9/3/2029",
        "begin_at": 1883113200000,
        "end_at": 1883199600000,
        "use": "block"
      },
      "10/8/2029": {
        "label": "Columbus Day",
        "date_key": "10/8/2029",
        "begin_at": 1886137200000,
        "end_at": 1886223600000,
        "use": "block"
      },
      "11/12/2029": {
        "label": "Veterans Day",
        "date_key": "11/12/2029",
        "begin_at": 1889164800000,
        "end_at": 1889251200000,
        "use": "block"
      },
      "11/22/2029": {
        "label": "Thanksgiving Day",
        "date_key": "11/22/2029",
        "begin_at": 1890028800000,
        "end_at": 1890115200000,
        "use": "block"
      },
      "12/25/2029": {
        "label": "Christmas Day",
        "date_key": "12/25/2029",
        "begin_at": 1892880000000,
        "end_at": 1892966400000,
        "use": "block"
      },
      "1/1/2030": {
        "label": "New Year's Day",
        "date_key": "1/1/2030",
        "begin_at": 1893484800000,
        "end_at": 1893571200000,
        "use": "block"
      },
      "1/21/2030": {
        "label": "Birthday of Martin Luther King, Jr.",
        "date_key": "1/21/2030",
        "begin_at": 1895212800000,
        "end_at": 1895299200000,
        "use": "block"
      },
      "2/18/2030": {
        "label": "Washington's Birthday",
        "date_key": "2/18/2030",
        "begin_at": 1897632000000,
        "end_at": 1897718400000,
        "use": "block"
      },
      "5/27/2030": {
        "label": "Memorial Day",
        "date_key": "5/27/2030",
        "begin_at": 1906095600000,
        "end_at": 1906182000000,
        "use": "block"
      },
      "6/19/2030": {
        "label": "Juneteenth Independence Day",
        "date_key": "6/19/2030",
        "begin_at": 1908082800000,
        "end_at": 1908169200000,
        "use": "block"
      },
      "7/4/2030": {
        "label": "Independence Day",
        "date_key": "7/4/2030",
        "begin_at": 1909378800000,
        "end_at": 1909465200000,
        "use": "block"
      },
      "9/2/2030": {
        "label": "Labor Day",
        "date_key": "9/2/2030",
        "begin_at": 1914562800000,
        "end_at": 1914649200000,
        "use": "block"
      },
      "10/14/2030": {
        "label": "Columbus Day",
        "date_key": "10/14/2030",
        "begin_at": 1918191600000,
        "end_at": 1918278000000,
        "use": "block"
      },
      "11/11/2030": {
        "label": "Veterans Day",
        "date_key": "11/11/2030",
        "begin_at": 1920614400000,
        "end_at": 1920700800000,
        "use": "block"
      },
      "11/28/2030": {
        "label": "Thanksgiving Day",
        "date_key": "11/28/2030",
        "begin_at": 1922083200000,
        "end_at": 1922169600000,
        "use": "block"
      },
      "12/25/2030": {
        "label": "Christmas Day",
        "date_key": "12/25/2030",
        "begin_at": 1924416000000,
        "end_at": 1924502400000,
        "use": "block"
      }
    };
    //


    let presets = {
        "daily" : [
            {
                "label" :  "daily-am",
                "begin_at" : 0,
                "end_at"   : 10,
                "use" : evuses.USE_AS_BLOCK
            },
            {
                "label" :  "daily-pm",
                "begin_at" : 18,
                "end_at"   : 24,
                "use" : evuses.USE_AS_BLOCK
            }
        ],
        "saturday" : [
            {
                "label" :  "saturday-am",
                "begin_at" : 0,
                "end_at"   : 15,
                "use" : evuses.USE_AS_BLOCK
            },
            {
                "label" :  "saturday-am",
                "begin_at" : 18,
                "end_at"   : 24,
                "use" : evuses.USE_AS_BLOCK
            }
        ],
        "sunday" : [
            {
                "begin_at" : 0,
                "end_at"   : 24,
                "use" : evuses.USE_AS_BLOCK
            }
        ],

        "holiday" :  [
            {
                "begin_at" : 0,
                "end_at"   : 24,
                "use" : evuses.USE_AS_BLOCK
            }
        ],

        "specials" : []
    };

    //
    var local_presets = {
        "time_zone" : time_zone,
        "local_midnights" : local_midnights,
        "sundays" : sundays,
        "saturdays" : saturdays,
        "holidays" : holidays,
        "presets" : presets
    };

    /* src/App.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1, console: console_1 } = globals;

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[138] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    // (1863:4) {#each info_points as point }
    function create_each_block_2(ctx) {
    	let text_1;
    	let t_value = /*point*/ ctx[43].label + "";
    	let t;
    	let text_1_x_value;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "x", text_1_x_value = /*point*/ ctx[43].x);
    			attr_dev(text_1, "y", text_1_y_value = /*timeline_slider_height*/ ctx[4] - 20);
    			attr_dev(text_1, "stroke", "none");
    			attr_dev(text_1, "fill", "rgb(50,130,60)");
    			attr_dev(text_1, "vector-effect", "non-scaling-size");
    			attr_dev(text_1, "font-size", "12");
    			attr_dev(text_1, "font-weight", "bold");
    			add_location(text_1, file, 1863, 5, 50060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*info_points*/ 2048 && t_value !== (t_value = /*point*/ ctx[43].label + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*info_points*/ 2048 && text_1_x_value !== (text_1_x_value = /*point*/ ctx[43].x)) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty[0] & /*timeline_slider_height*/ 16 && text_1_y_value !== (text_1_y_value = /*timeline_slider_height*/ ctx[4] - 20)) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(1863:4) {#each info_points as point }",
    		ctx
    	});

    	return block;
    }

    // (1871:5) {:else}
    function create_else_block(ctx) {
    	let line;
    	let line_y__value;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", /*point*/ ctx[43].x);
    			attr_dev(line, "x2", /*point*/ ctx[43].x);
    			attr_dev(line, "y1", "0");
    			attr_dev(line, "y2", line_y__value = /*timeline_slider_height*/ ctx[4] - 10);
    			attr_dev(line, "stroke-width", "2");
    			attr_dev(line, "stroke", "rgb(0,0,0)");
    			attr_dev(line, "vector-effect", "non-scaling-stroke");
    			add_location(line, file, 1871, 6, 50556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*timeline_slider_height*/ 16 && line_y__value !== (line_y__value = /*timeline_slider_height*/ ctx[4] - 10)) {
    				attr_dev(line, "y2", line_y__value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(1871:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1869:5) {#if point.x < 0 }
    function create_if_block_2(ctx) {
    	let rect;
    	let rect_height_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", /*point*/ ctx[43].x);
    			attr_dev(rect, "y", "-2");
    			attr_dev(rect, "height", rect_height_value = /*timeline_slider_height*/ ctx[4] - 6);
    			attr_dev(rect, "width", /*division_width*/ ctx[23]);
    			attr_dev(rect, "stroke-width", "1");
    			attr_dev(rect, "stroke", "rgb(0,0,0)");
    			attr_dev(rect, "fill", "rgba(155,155,155,0.25)");
    			add_location(rect, file, 1869, 6, 50371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*timeline_slider_height*/ 16 && rect_height_value !== (rect_height_value = /*timeline_slider_height*/ ctx[4] - 6)) {
    				attr_dev(rect, "height", rect_height_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(1869:5) {#if point.x < 0 }",
    		ctx
    	});

    	return block;
    }

    // (1868:4) {#each line_points as point}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*point*/ ctx[43].x < 0) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(1868:4) {#each line_points as point}",
    		ctx
    	});

    	return block;
    }

    // (1909:2) {#if g_selected_ts }
    function create_if_block_1(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Edit";
    			set_style(button, "color", "mediumvioletred");
    			set_style(button, "font-weight", "bold");
    			set_style(button, "font-size", "smaller");
    			add_location(button, file, 1910, 3, 52957);
    			attr_dev(div, "class", "blg-ctrl-panel svelte-1v0typc");
    			set_style(div, "display", "inline-block");
    			set_style(div, "vertical-align", "top");
    			set_style(div, "background-color", "#DEEEDE");
    			add_location(div, file, 1909, 2, 52851);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", open_editor, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(1909:2) {#if g_selected_ts }",
    		ctx
    	});

    	return block;
    }

    // (1924:4) {#each g_all_clocks as zone_pair}
    function create_each_block(ctx) {
    	let div1;
    	let clock;
    	let t0;
    	let div0;
    	let t1_value = /*zone_pair*/ ctx[138].label + "";
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;

    	clock = new Clock({
    			props: { timezone: /*zone_pair*/ ctx[138].tz_info },
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[56](/*zone_pair*/ ctx[138]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(clock.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			set_style(div0, "text-align", "center");
    			set_style(div0, "font-size", "60%");
    			set_style(div0, "font-weight", "bolder");
    			add_location(div0, file, 1926, 5, 53849);
    			set_style(div1, "height", "60px");
    			set_style(div1, "display", "inline-block");
    			set_style(div1, "margin-right", "4px");
    			set_style(div1, "cursor", "pointer");
    			add_location(div1, file, 1924, 4, 53671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(clock, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const clock_changes = {};
    			if (dirty[0] & /*g_all_clocks*/ 1048576) clock_changes.timezone = /*zone_pair*/ ctx[138].tz_info;
    			clock.$set(clock_changes);
    			if ((!current || dirty[0] & /*g_all_clocks*/ 1048576) && t1_value !== (t1_value = /*zone_pair*/ ctx[138].label + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(clock);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(1924:4) {#each g_all_clocks as zone_pair}",
    		ctx
    	});

    	return block;
    }

    // (1951:0) <FloatWindow title={current_thing.title + '...'}  index={0} scale_size_array={all_window_scales} >
    function create_default_slot_4(ctx) {
    	let fullmonth;
    	let current;
    	const fullmonth_spread_levels = [/*current_thing*/ ctx[2]];
    	let fullmonth_props = {};

    	for (let i = 0; i < fullmonth_spread_levels.length; i += 1) {
    		fullmonth_props = assign(fullmonth_props, fullmonth_spread_levels[i]);
    	}

    	fullmonth = new MonthFull({ props: fullmonth_props, $$inline: true });
    	fullmonth.$on("message", /*handleEventPlanningMessage*/ ctx[28]);

    	const block = {
    		c: function create() {
    			create_component(fullmonth.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fullmonth, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fullmonth_changes = (dirty[0] & /*current_thing*/ 4)
    			? get_spread_update(fullmonth_spread_levels, [get_spread_object(/*current_thing*/ ctx[2])])
    			: {};

    			fullmonth.$set(fullmonth_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fullmonth.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fullmonth.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fullmonth, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(1951:0) <FloatWindow title={current_thing.title + '...'}  index={0} scale_size_array={all_window_scales} >",
    		ctx
    	});

    	return block;
    }

    // (1956:0) <FloatWindow title="Day Planner" index={1} scale_size_array={all_window_scales} >
    function create_default_slot_3(ctx) {
    	let dayeventsrequests;
    	let updating_day_event_count;
    	let current;

    	const dayeventsrequests_spread_levels = [
    		/*current_day_data*/ ctx[1],
    		{
    			tz_hour_shift: /*g_timezone_shift*/ ctx[18]
    		},
    		{ time_zone: /*g_timezone*/ ctx[10] },
    		{ ui_user_id: /*g_user_id*/ ctx[21] }
    	];

    	function dayeventsrequests_day_event_count_binding(value) {
    		/*dayeventsrequests_day_event_count_binding*/ ctx[58](value);
    	}

    	let dayeventsrequests_props = {};

    	for (let i = 0; i < dayeventsrequests_spread_levels.length; i += 1) {
    		dayeventsrequests_props = assign(dayeventsrequests_props, dayeventsrequests_spread_levels[i]);
    	}

    	if (/*day_event_count*/ ctx[0] !== void 0) {
    		dayeventsrequests_props.day_event_count = /*day_event_count*/ ctx[0];
    	}

    	dayeventsrequests = new DayEventsRequests({
    			props: dayeventsrequests_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(dayeventsrequests, 'day_event_count', dayeventsrequests_day_event_count_binding));

    	const block = {
    		c: function create() {
    			create_component(dayeventsrequests.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dayeventsrequests, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dayeventsrequests_changes = (dirty[0] & /*current_day_data, g_timezone_shift, g_timezone, g_user_id*/ 2360322)
    			? get_spread_update(dayeventsrequests_spread_levels, [
    					dirty[0] & /*current_day_data*/ 2 && get_spread_object(/*current_day_data*/ ctx[1]),
    					dirty[0] & /*g_timezone_shift*/ 262144 && {
    						tz_hour_shift: /*g_timezone_shift*/ ctx[18]
    					},
    					dirty[0] & /*g_timezone*/ 1024 && { time_zone: /*g_timezone*/ ctx[10] },
    					dirty[0] & /*g_user_id*/ 2097152 && { ui_user_id: /*g_user_id*/ ctx[21] }
    				])
    			: {};

    			if (!updating_day_event_count && dirty[0] & /*day_event_count*/ 1) {
    				updating_day_event_count = true;
    				dayeventsrequests_changes.day_event_count = /*day_event_count*/ ctx[0];
    				add_flush_callback(() => updating_day_event_count = false);
    			}

    			dayeventsrequests.$set(dayeventsrequests_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dayeventsrequests.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dayeventsrequests.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dayeventsrequests, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(1956:0) <FloatWindow title=\\\"Day Planner\\\" index={1} scale_size_array={all_window_scales} >",
    		ctx
    	});

    	return block;
    }

    // (1961:0) <FloatWindow title="Time Slot Editor" index={2} scale_size_array={all_window_scales} >
    function create_default_slot_2(ctx) {
    	let timesloteditor;
    	let current;
    	const timesloteditor_spread_levels = [/*current_time_slot*/ ctx[5]];
    	let timesloteditor_props = {};

    	for (let i = 0; i < timesloteditor_spread_levels.length; i += 1) {
    		timesloteditor_props = assign(timesloteditor_props, timesloteditor_spread_levels[i]);
    	}

    	timesloteditor = new TimeSlotEditor({
    			props: timesloteditor_props,
    			$$inline: true
    		});

    	timesloteditor.$on("message", /*handle_time_slot_editor*/ ctx[37]);

    	const block = {
    		c: function create() {
    			create_component(timesloteditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timesloteditor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timesloteditor_changes = (dirty[0] & /*current_time_slot*/ 32)
    			? get_spread_update(timesloteditor_spread_levels, [get_spread_object(/*current_time_slot*/ ctx[5])])
    			: {};

    			timesloteditor.$set(timesloteditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timesloteditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timesloteditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timesloteditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(1961:0) <FloatWindow title=\\\"Time Slot Editor\\\" index={2} scale_size_array={all_window_scales} >",
    		ctx
    	});

    	return block;
    }

    // (1965:0) {#if g_request_alert_parameters }
    function create_if_block(ctx) {
    	let floatwindow;
    	let current;

    	floatwindow = new FloatWindow({
    			props: {
    				title: "Day Planner",
    				index: 3,
    				scale_size_array: /*all_window_scales*/ ctx[13],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(floatwindow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(floatwindow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const floatwindow_changes = {};
    			if (dirty[0] & /*all_window_scales*/ 8192) floatwindow_changes.scale_size_array = /*all_window_scales*/ ctx[13];

    			if (dirty[0] & /*g_request_alert_parameters*/ 4096 | dirty[4] & /*$$scope*/ 2097152) {
    				floatwindow_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow.$set(floatwindow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(floatwindow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(floatwindow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(floatwindow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(1965:0) {#if g_request_alert_parameters }",
    		ctx
    	});

    	return block;
    }

    // (1966:0) <FloatWindow title="Day Planner" index={3} scale_size_array={all_window_scales} >
    function create_default_slot_1(ctx) {
    	let requestchangealerts;
    	let current;
    	const requestchangealerts_spread_levels = [/*g_request_alert_parameters*/ ctx[12]];
    	let requestchangealerts_props = {};

    	for (let i = 0; i < requestchangealerts_spread_levels.length; i += 1) {
    		requestchangealerts_props = assign(requestchangealerts_props, requestchangealerts_spread_levels[i]);
    	}

    	requestchangealerts = new RequestChangeAlerts({
    			props: requestchangealerts_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(requestchangealerts.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(requestchangealerts, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const requestchangealerts_changes = (dirty[0] & /*g_request_alert_parameters*/ 4096)
    			? get_spread_update(requestchangealerts_spread_levels, [get_spread_object(/*g_request_alert_parameters*/ ctx[12])])
    			: {};

    			requestchangealerts.$set(requestchangealerts_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(requestchangealerts.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(requestchangealerts.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(requestchangealerts, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(1966:0) <FloatWindow title=\\\"Day Planner\\\" index={3} scale_size_array={all_window_scales} >",
    		ctx
    	});

    	return block;
    }

    // (1972:0) <FloatWindow title="Timezone Clocks" index={4} scale_size_array={all_window_scales} >
    function create_default_slot(ctx) {
    	let clockselections;
    	let current;

    	clockselections = new ClockSelections({
    			props: {
    				time_zone_clocks: /*g_time_zone_clocks*/ ctx[40]
    			},
    			$$inline: true
    		});

    	clockselections.$on("message", /*handleTimezoneUpdateMessage*/ ctx[39]);

    	const block = {
    		c: function create() {
    			create_component(clockselections.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(clockselections, target, anchor);
    			current = true;
    		},
    		p: noop$3,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clockselections.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clockselections.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(clockselections, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1972:0) <FloatWindow title=\\\"Timezone Clocks\\\" index={4} scale_size_array={all_window_scales} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div10;
    	let div0;
    	let svg1;
    	let g0;
    	let g1;
    	let g2;
    	let rect0;
    	let rect0_height_value;
    	let svg0;
    	let line;
    	let polygon0;
    	let circle;
    	let circle_cy_value;
    	let polygon1;
    	let polygon1_points_value;
    	let t0;
    	let svg2;
    	let rect1;
    	let polygon2;
    	let polygon3;
    	let t1;
    	let div8;
    	let div2;
    	let div1;
    	let span;
    	let t3;
    	let input;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let button2;
    	let t10;
    	let t11;
    	let div6;
    	let div4;
    	let clock;
    	let t12;
    	let div3;
    	let t13;
    	let t14;
    	let div5;
    	let t15;
    	let div7;
    	let button3;
    	let t17;
    	let div9;
    	let thinggrid;
    	let t18;
    	let floatwindow0;
    	let t19;
    	let floatwindow1;
    	let t20;
    	let floatwindow2;
    	let t21;
    	let t22;
    	let floatwindow3;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*info_points*/ ctx[11];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*line_points*/ ctx[22];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block0 = /*g_selected_ts*/ ctx[16] && create_if_block_1(ctx);

    	clock = new Clock({
    			props: { timezone: /*g_timezone*/ ctx[10] },
    			$$inline: true
    		});

    	let each_value = /*g_all_clocks*/ ctx[20];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	thinggrid = new ThingGrid({
    			props: {
    				things: /*things*/ ctx[3],
    				thing_component: Thing
    			},
    			$$inline: true
    		});

    	thinggrid.$on("message", /*handleMessage*/ ctx[27]);

    	floatwindow0 = new FloatWindow({
    			props: {
    				title: /*current_thing*/ ctx[2].title + '...',
    				index: 0,
    				scale_size_array: /*all_window_scales*/ ctx[13],
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	floatwindow1 = new FloatWindow({
    			props: {
    				title: "Day Planner",
    				index: 1,
    				scale_size_array: /*all_window_scales*/ ctx[13],
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	floatwindow2 = new FloatWindow({
    			props: {
    				title: "Time Slot Editor",
    				index: 2,
    				scale_size_array: /*all_window_scales*/ ctx[13],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block1 = /*g_request_alert_parameters*/ ctx[12] && create_if_block(ctx);

    	floatwindow3 = new FloatWindow({
    			props: {
    				title: "Timezone Clocks",
    				index: 4,
    				scale_size_array: /*all_window_scales*/ ctx[13],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			svg1 = svg_element("svg");
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			g2 = svg_element("g");
    			rect0 = svg_element("rect");
    			svg0 = svg_element("svg");
    			line = svg_element("line");
    			polygon0 = svg_element("polygon");
    			circle = svg_element("circle");
    			polygon1 = svg_element("polygon");
    			t0 = space();
    			svg2 = svg_element("svg");
    			rect1 = svg_element("rect");
    			polygon2 = svg_element("polygon");
    			polygon3 = svg_element("polygon");
    			t1 = space();
    			div8 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Boxes";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "-";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			t8 = space();
    			button2 = element("button");
    			button2.textContent = "choose clocks";
    			t10 = space();
    			if (if_block0) if_block0.c();
    			t11 = space();
    			div6 = element("div");
    			div4 = element("div");
    			create_component(clock.$$.fragment);
    			t12 = space();
    			div3 = element("div");
    			t13 = text(/*tz_city*/ ctx[19]);
    			t14 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			div7 = element("div");
    			button3 = element("button");
    			button3.textContent = "Revise Timeline";
    			t17 = space();
    			div9 = element("div");
    			create_component(thinggrid.$$.fragment);
    			t18 = space();
    			create_component(floatwindow0.$$.fragment);
    			t19 = space();
    			create_component(floatwindow1.$$.fragment);
    			t20 = space();
    			create_component(floatwindow2.$$.fragment);
    			t21 = space();
    			if (if_block1) if_block1.c();
    			t22 = space();
    			create_component(floatwindow3.$$.fragment);
    			add_location(g0, file, 1861, 3, 50017);
    			attr_dev(g1, "cursor", "pointer");
    			add_location(g1, file, 1866, 3, 50262);
    			attr_dev(rect0, "x", "0");
    			attr_dev(rect0, "y", "-2");
    			attr_dev(rect0, "height", rect0_height_value = /*timeline_slider_height*/ ctx[4] - 6);
    			attr_dev(rect0, "width", "100%");
    			attr_dev(rect0, "stroke-width", "1");
    			attr_dev(rect0, "stroke", "rgb(0,0,0)");
    			attr_dev(rect0, "fill", "rgba(255,255,255,0.01)");
    			add_location(rect0, file, 1876, 4, 50890);
    			attr_dev(line, "x1", "5");
    			attr_dev(line, "x2", "5");
    			attr_dev(line, "y1", "-5");
    			attr_dev(line, "y2", /*timeline_slider_height*/ ctx[4]);
    			attr_dev(line, "stroke-width", "3");
    			attr_dev(line, "stroke", "rgb(245,220,100)");
    			attr_dev(line, "vector-effect", "non-scaling-stroke");
    			add_location(line, file, 1878, 5, 51110);
    			attr_dev(polygon0, "points", "5 0, 0 6, 10 6");
    			add_location(polygon0, file, 1879, 5, 51256);
    			attr_dev(circle, "cx", "5");
    			attr_dev(circle, "cy", circle_cy_value = /*timeline_slider_height*/ ctx[4] / 2 - 3);
    			attr_dev(circle, "r", "5");
    			attr_dev(circle, "fill", "rgba(255,50,0,0.9)");
    			add_location(circle, file, 1880, 5, 51296);
    			attr_dev(polygon1, "points", polygon1_points_value = "5 " + (/*timeline_slider_height*/ ctx[4] - 10) + ", 0 " + (/*timeline_slider_height*/ ctx[4] - 15) + ", 10 " + (/*timeline_slider_height*/ ctx[4] - 15));
    			add_location(polygon1, file, 1881, 5, 51477);
    			set_style(svg0, "visibility", "hidden");
    			attr_dev(svg0, "x", "-5");
    			add_location(svg0, file, 1877, 4, 51039);
    			attr_dev(g2, "class", "cursor-grabber svelte-1v0typc");
    			add_location(g2, file, 1875, 3, 50745);
    			set_style(svg1, "width", "100%");
    			attr_dev(svg1, "height", "inherit");
    			add_location(svg1, file, 1859, 2, 49933);
    			attr_dev(div0, "class", "calendar-admin-slider svelte-1v0typc");
    			set_style(div0, "height", /*timeline_slider_height*/ ctx[4] + "px");
    			add_location(div0, file, 1858, 1, 49823);
    			attr_dev(rect1, "x", "0");
    			attr_dev(rect1, "y", "2");
    			attr_dev(rect1, "height", "2");
    			attr_dev(rect1, "width", "100%");
    			attr_dev(rect1, "stroke-width", "0");
    			attr_dev(rect1, "stroke", "rgb(0,0,0)");
    			attr_dev(rect1, "fill", "rgba(20,40,185,0.9)");
    			add_location(rect1, file, 1887, 2, 51849);
    			attr_dev(polygon2, "points", "5 0, 0 6, 10 6");
    			add_location(polygon2, file, 1888, 2, 51966);
    			attr_dev(polygon3, "points", "15 6, 10 0, 20 0");
    			add_location(polygon3, file, 1889, 2, 52003);
    			attr_dev(svg2, "class", "canvas-resize-cntrl svelte-1v0typc");
    			attr_dev(svg2, "width", "100%");
    			attr_dev(svg2, "height", "6px");
    			attr_dev(svg2, "style", "margin;0px;");
    			add_location(svg2, file, 1886, 1, 51633);
    			set_style(span, "color", "navy");
    			set_style(span, "font-weight", "bold");
    			add_location(span, file, 1896, 4, 52377);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "blg-ctl-number-field svelte-1v0typc");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "4");
    			add_location(input, file, 1897, 4, 52436);
    			attr_dev(button0, "class", "blg-ctl-button svelte-1v0typc");
    			add_location(button0, file, 1898, 4, 52524);
    			attr_dev(button1, "class", "blg-ctl-button svelte-1v0typc");
    			add_location(button1, file, 1901, 4, 52611);
    			set_style(div1, "height", "inherit");
    			set_style(div1, "width", "fit-content");
    			set_style(div1, "white-space", "nowrap");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file, 1895, 3, 52287);
    			set_style(button2, "font-size", "x-small");
    			set_style(button2, "white-space", "nowrap");
    			add_location(button2, file, 1905, 3, 52705);
    			attr_dev(div2, "class", "blg-ctrl-panel svelte-1v0typc");
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "text-align", "center");
    			set_style(div2, "vertical-align", "top");
    			set_style(div2, "background-color", "#EFFFFE");
    			set_style(div2, "height", "inherit");
    			set_style(div2, "width", "fit-content");
    			add_location(div2, file, 1894, 2, 52129);
    			set_style(div3, "text-align", "center");
    			set_style(div3, "font-size", "60%");
    			set_style(div3, "font-weight", "bolder");
    			add_location(div3, file, 1918, 4, 53397);
    			set_style(div4, "height", "60px");
    			set_style(div4, "display", "inline-block");
    			set_style(div4, "cursor", "pointer");
    			set_style(div4, "vertical-align", "top");
    			add_location(div4, file, 1916, 3, 53245);
    			set_style(div5, "display", "inline-block");
    			set_style(div5, "height", "fit-content");
    			set_style(div5, "width", "calc(100% - 4px)");
    			set_style(div5, "overflow-x", "scroll");
    			set_style(div5, "padding", "0px");
    			set_style(div5, "white-space", "nowrap");
    			add_location(div5, file, 1922, 3, 53501);
    			attr_dev(div6, "class", "blg-ctrl-panel svelte-1v0typc");
    			set_style(div6, "display", "inline-block");
    			set_style(div6, "vertical-align", "top");
    			set_style(div6, "background-color", "#EFEFFE");
    			set_style(div6, "width", "calc(76vw - 8px)");
    			set_style(div6, "white-space", "nowrap");
    			add_location(div6, file, 1915, 2, 53095);
    			set_style(button3, "font-size", "smaller");
    			add_location(button3, file, 1935, 3, 54102);
    			attr_dev(div7, "class", "blg-ctrl-panel svelte-1v0typc");
    			set_style(div7, "display", "inline-block");
    			set_style(div7, "vertical-align", "top");
    			set_style(div7, "background-color", "#EFEFFE");
    			add_location(div7, file, 1934, 2, 53996);
    			set_style(div8, "border", "solid 2px navy");
    			set_style(div8, "padding", "4px");
    			set_style(div8, "background-color", "#EFEFEF");
    			add_location(div8, file, 1893, 1, 52051);
    			attr_dev(div9, "class", "blg-grid-container svelte-1v0typc");
    			add_location(div9, file, 1942, 1, 54229);
    			add_location(div10, file, 1857, 0, 49794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, svg1);
    			append_dev(svg1, g0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(g0, null);
    			}

    			append_dev(svg1, g1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g1, null);
    			}

    			/*g1_binding*/ ctx[50](g1);
    			append_dev(svg1, g2);
    			append_dev(g2, rect0);
    			append_dev(g2, svg0);
    			append_dev(svg0, line);
    			append_dev(svg0, polygon0);
    			append_dev(svg0, circle);
    			append_dev(svg0, polygon1);
    			/*svg0_binding*/ ctx[51](svg0);
    			/*g2_binding*/ ctx[52](g2);
    			/*div0_binding*/ ctx[53](div0);
    			append_dev(div10, t0);
    			append_dev(div10, svg2);
    			append_dev(svg2, rect1);
    			append_dev(svg2, polygon2);
    			append_dev(svg2, polygon3);
    			/*svg2_binding*/ ctx[54](svg2);
    			append_dev(div10, t1);
    			append_dev(div10, div8);
    			append_dev(div8, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			set_input_value(input, /*box_delta*/ ctx[14]);
    			append_dev(div1, t4);
    			append_dev(div1, button0);
    			append_dev(div1, t6);
    			append_dev(div1, button1);
    			append_dev(div2, t8);
    			append_dev(div2, button2);
    			append_dev(div8, t10);
    			if (if_block0) if_block0.m(div8, null);
    			append_dev(div8, t11);
    			append_dev(div8, div6);
    			append_dev(div6, div4);
    			mount_component(clock, div4, null);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, t13);
    			append_dev(div6, t14);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div8, t15);
    			append_dev(div8, div7);
    			append_dev(div7, button3);
    			append_dev(div10, t17);
    			append_dev(div10, div9);
    			mount_component(thinggrid, div9, null);
    			/*div10_binding*/ ctx[57](div10);
    			insert_dev(target, t18, anchor);
    			mount_component(floatwindow0, target, anchor);
    			insert_dev(target, t19, anchor);
    			mount_component(floatwindow1, target, anchor);
    			insert_dev(target, t20, anchor);
    			mount_component(floatwindow2, target, anchor);
    			insert_dev(target, t21, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t22, anchor);
    			mount_component(floatwindow3, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(circle, "mousedown", /*manage_width*/ ctx[34], false, false, false),
    					listen_dev(circle, "mouseup", /*width_end_tracking*/ ctx[36], false, false, false),
    					listen_dev(circle, "mousemove", /*width_tracking*/ ctx[35], false, false, false),
    					listen_dev(g2, "mousedown", /*handle_editor*/ ctx[31], false, false, false),
    					listen_dev(g2, "mouseup", /*handle_editor_end*/ ctx[32], false, false, false),
    					listen_dev(g2, "mousemove", /*moving_mouse*/ ctx[33], false, false, false),
    					listen_dev(svg2, "mousedown", /*canvas_resizer_activate*/ ctx[24], false, false, false),
    					listen_dev(svg2, "mousemove", /*canvas_resizer_track*/ ctx[25], false, false, false),
    					listen_dev(svg2, "mouseup", /*canvas_resizer_end*/ ctx[26], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[55]),
    					listen_dev(button0, "click", /*handleClick_remove*/ ctx[29], false, false, false),
    					listen_dev(button1, "click", /*handleClick_add*/ ctx[30], false, false, false),
    					listen_dev(button2, "click", launch_custom_clocks, false, false, false),
    					listen_dev(div4, "click", /*return_local_clock*/ ctx[42], false, false, false),
    					listen_dev(button3, "click", /*handleClick_send_update*/ ctx[38], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*info_points, timeline_slider_height*/ 2064) {
    				each_value_2 = /*info_points*/ ctx[11];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(g0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*line_points, timeline_slider_height, division_width*/ 12582928) {
    				each_value_1 = /*line_points*/ ctx[22];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty[0] & /*timeline_slider_height*/ 16 && rect0_height_value !== (rect0_height_value = /*timeline_slider_height*/ ctx[4] - 6)) {
    				attr_dev(rect0, "height", rect0_height_value);
    			}

    			if (!current || dirty[0] & /*timeline_slider_height*/ 16) {
    				attr_dev(line, "y2", /*timeline_slider_height*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*timeline_slider_height*/ 16 && circle_cy_value !== (circle_cy_value = /*timeline_slider_height*/ ctx[4] / 2 - 3)) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (!current || dirty[0] & /*timeline_slider_height*/ 16 && polygon1_points_value !== (polygon1_points_value = "5 " + (/*timeline_slider_height*/ ctx[4] - 10) + ", 0 " + (/*timeline_slider_height*/ ctx[4] - 15) + ", 10 " + (/*timeline_slider_height*/ ctx[4] - 15))) {
    				attr_dev(polygon1, "points", polygon1_points_value);
    			}

    			if (!current || dirty[0] & /*timeline_slider_height*/ 16) {
    				set_style(div0, "height", /*timeline_slider_height*/ ctx[4] + "px");
    			}

    			if (dirty[0] & /*box_delta*/ 16384 && to_number(input.value) !== /*box_delta*/ ctx[14]) {
    				set_input_value(input, /*box_delta*/ ctx[14]);
    			}

    			if (/*g_selected_ts*/ ctx[16]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div8, t11);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const clock_changes = {};
    			if (dirty[0] & /*g_timezone*/ 1024) clock_changes.timezone = /*g_timezone*/ ctx[10];
    			clock.$set(clock_changes);
    			if (!current || dirty[0] & /*tz_city*/ 524288) set_data_dev(t13, /*tz_city*/ ctx[19]);

    			if (dirty[0] & /*g_all_clocks*/ 1048576 | dirty[1] & /*select_time_zone*/ 1024) {
    				each_value = /*g_all_clocks*/ ctx[20];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const thinggrid_changes = {};
    			if (dirty[0] & /*things*/ 8) thinggrid_changes.things = /*things*/ ctx[3];
    			thinggrid.$set(thinggrid_changes);
    			const floatwindow0_changes = {};
    			if (dirty[0] & /*current_thing*/ 4) floatwindow0_changes.title = /*current_thing*/ ctx[2].title + '...';
    			if (dirty[0] & /*all_window_scales*/ 8192) floatwindow0_changes.scale_size_array = /*all_window_scales*/ ctx[13];

    			if (dirty[0] & /*current_thing*/ 4 | dirty[4] & /*$$scope*/ 2097152) {
    				floatwindow0_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow0.$set(floatwindow0_changes);
    			const floatwindow1_changes = {};
    			if (dirty[0] & /*all_window_scales*/ 8192) floatwindow1_changes.scale_size_array = /*all_window_scales*/ ctx[13];

    			if (dirty[0] & /*current_day_data, g_timezone_shift, g_timezone, day_event_count*/ 263171 | dirty[4] & /*$$scope*/ 2097152) {
    				floatwindow1_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow1.$set(floatwindow1_changes);
    			const floatwindow2_changes = {};
    			if (dirty[0] & /*all_window_scales*/ 8192) floatwindow2_changes.scale_size_array = /*all_window_scales*/ ctx[13];

    			if (dirty[0] & /*current_time_slot*/ 32 | dirty[4] & /*$$scope*/ 2097152) {
    				floatwindow2_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow2.$set(floatwindow2_changes);

    			if (/*g_request_alert_parameters*/ ctx[12]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*g_request_alert_parameters*/ 4096) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t22.parentNode, t22);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const floatwindow3_changes = {};
    			if (dirty[0] & /*all_window_scales*/ 8192) floatwindow3_changes.scale_size_array = /*all_window_scales*/ ctx[13];

    			if (dirty[4] & /*$$scope*/ 2097152) {
    				floatwindow3_changes.$$scope = { dirty, ctx };
    			}

    			floatwindow3.$set(floatwindow3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(thinggrid.$$.fragment, local);
    			transition_in(floatwindow0.$$.fragment, local);
    			transition_in(floatwindow1.$$.fragment, local);
    			transition_in(floatwindow2.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(floatwindow3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(thinggrid.$$.fragment, local);
    			transition_out(floatwindow0.$$.fragment, local);
    			transition_out(floatwindow1.$$.fragment, local);
    			transition_out(floatwindow2.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(floatwindow3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			/*g1_binding*/ ctx[50](null);
    			/*svg0_binding*/ ctx[51](null);
    			/*g2_binding*/ ctx[52](null);
    			/*div0_binding*/ ctx[53](null);
    			/*svg2_binding*/ ctx[54](null);
    			if (if_block0) if_block0.d();
    			destroy_component(clock);
    			destroy_each(each_blocks, detaching);
    			destroy_component(thinggrid);
    			/*div10_binding*/ ctx[57](null);
    			if (detaching) detach_dev(t18);
    			destroy_component(floatwindow0, detaching);
    			if (detaching) detach_dev(t19);
    			destroy_component(floatwindow1, detaching);
    			if (detaching) detach_dev(t20);
    			destroy_component(floatwindow2, detaching);
    			if (detaching) detach_dev(t21);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t22);
    			destroy_component(floatwindow3, detaching);
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

    const DEFAULT_WS_CALENDAR_ACCESS = "https://www.copious.training/calendars";
    const ABRITRARY_MAX_CANVAS_HEIGHT = 450;
    const ABRITRARY_MIN_CANVAS_HEIGHT = 120;
    const ONE_QUARTER_HOUR_MINUTES = 15;
    const ONE_HALF_HOUR_MINUTES = 30;

    //
    const USE_AS_BLOCK = "block";

    const USE_AS_MEET = "meeting";
    const USE_AS_ACTIVITY = "activity";
    const USE_AS_OPEN = "open";
    const c_TIME_SLOT_HEIGHT = 12;

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    function matching_slot(d_date, list_of_slots) {
    	let t = d_date.getTime();

    	for (let a_slot of list_of_slots) {
    		if (a_slot.start_at < t && t < a_slot.end_at) {
    			return a_slot.activity;
    		}
    	}

    	return false;
    }

    function update_calendars(a_time_slot) {
    	
    } // go through the list of months (already filled) and change events....
    //

    // get the slots that match this time slice
    function update_active_slot_list(d_date, slot_defs) {
    	let slots = [];

    	for (let s_label in slot_defs) {
    		let slot = slot_defs[s_label];

    		if (slot) {
    			let dt = d_date.getTime();

    			if (dt >= slot.start_time && dt <= slot.end_time) {
    				slots.push(slot);
    			}
    		}
    	}

    	return slots;
    }

    function best_for_hour(slot_list, time, blocked) {
    	let slots_of_hour = [];

    	for (let slot of slot_list) {
    		if (slot.begin_at <= time && time <= slot.end_at) {
    			slots_of_hour.push(slot);
    		}
    	}

    	//
    	if (slots_of_hour.length === 0) {
    		return blocked;
    	}

    	if (slots_of_hour.length === 1) {
    		return slots_of_hour[0].use;
    	}

    	// else
    	let priority = -1;

    	let pindex = -1;

    	for (let i = 0; i < slots_of_hour.length; i++) {
    		let slot = slots_of_hour[i];
    		let tspan = slot.end_time - slot.start_time;
    		let toffset = time - slot.start_time;
    		let partial = toffset / tspan;
    		let bias = slot.offset_bias(partial); ///  from the definition of a slot...

    		if (bias > priority) {
    			priority = bias;
    			pindex = i;
    		}
    	}

    	//
    	return slots_of_hour[pindex].use;
    }

    function fill_cal(mentry) {
    	mentry.cal.map;
    }

    function merge_calendars(c_dst, c_src) {
    	//
    	if (!c_dst) return c_src;

    	if (!c_src) return c_dst;

    	//
    	if (c_src.year === c_dst.year && c_src.month === c_dst.month) {
    		//
    		for (let ky in c_dst.cal.map) {
    			let agenda_dst = c_dst.cal.map[ky];
    			let agenda_src = c_src.cal.map[ky];

    			if (agenda_src && agenda_dst) {
    				let n = agenda_src.all_day_list.length;

    				for (let i = 0; i < n; i++) {
    					let dst_d = agenda_dst.all_day_list[i];

    					if (dst_d.use !== USE_AS_OPEN) {
    						agenda_dst.all_day_list[i] = agenda_src.all_day_list[i];
    					}
    				}
    			}
    		}
    	} //

    	//
    	if (c_src.year > c_dst.year) {
    		// condition arising out of showing a calendar without search (place holder value is current date)
    		return c_src;
    	}

    	return c_dst;
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    // DATA HANDLING FROM AFTER FETCHING ... prefetch -- generate empty data locally
    function unload_data(data) {
    	let usable_data = data.map(datum => {
    		let the_comment = decodeURIComponent(datum.comment);
    		datum.comment = the_comment;
    		datum.title = datum.comment.substring(0, 16);

    		if (datum.when === undefined) {
    			datum.when = datum.dates.created;
    		}

    		return datum;
    	});

    	return usable_data;
    }

    //---- ---- ---- ---- ---- ---- ---- ---- ----
    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // TIME LINE EDITOR DIALOG -  DATABASE FUNCTIONS
    function open_editor(ev) {
    	start_floating_window(2);
    }

    function launch_custom_clocks(ev) {
    	start_floating_window(4);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let g_user_id = "moi";

    	//
    	const ONE_HOUR = 3600 * 1000;

    	const ONE_HALF_HOUR = 3600 * 500;
    	const ONE_QUARTER_HOUR = 3600 * 250;
    	let timeline_slider_height = ABRITRARY_MIN_CANVAS_HEIGHT;
    	let current_date = new Date();

    	let title_months = [
    		"January",
    		"February",
    		"March",
    		"April",
    		"May",
    		"June",
    		"July",
    		"August",
    		"September",
    		"October",
    		"November",
    		"December"
    	];

    	// ----
    	let current_time_slot = {
    		"name": false,
    		"slot_name": "",
    		"start_day": "9/29",
    		"end_day": "10/29",
    		"description": "This is a test of tests",
    		//
    		"x": 0,
    		"y": 0,
    		"height": 0,
    		"width": 0,
    		//
    		"unit_x": 0,
    		"unit_y": 0,
    		"unit_width": 0,
    		"unit_height": 0,
    		"start_time": 0,
    		"end_time": 0,
    		"begin_at": 0,
    		"end_at": 0,
    		"pattern": {
    			"sunday": false,
    			"monday": false,
    			"tuesday": false,
    			"wednesday": false,
    			"thursday": false,
    			"friday": false,
    			"staturday": false
    		},
    		"activity": USE_AS_OPEN,
    		"allow_in_person": false,
    		"allow_zoom": false
    	};

    	let panzoomOptions = {
    		maxZoom: 5,
    		minZoom: 1,
    		initialZoom: 1,
    		zoomDoubleClickSpeed: 1,
    		transformOrigin: { x: 0, y: 0 },
    		zoomSpeed: 0.25,
    		preserveAspecRatio: false,
    		scaleFactors: { x: 1.0, y: 0.0 },
    		smoothScroll: { reactZeroVelocity: true }
    	};

    	let x = 1000;
    	let y = 1000;
    	let canvasElt = null;
    	let controllerElt = null;
    	let panzoomInstance = null;
    	let canvas_resizer = false;
    	let app_view = false;

    	// remove time slot (labeled) for the named slot ... then put the back...
    	//
    	// could fetch months not on display...
    	// merge months...
    	let session = "";

    	let going_session = "";
    	let day_event_count = 0;

    	//
    	const MonthContainer = EventDays.MonthContainer;

    	const Slot = EventDays.Slot;
    	const TimeSlotAgenda = EventDays.TimeSlotAgenda;
    	let force_day_event_update = false;
    	let g_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    	let g_all_time_slots = [];
    	let line_points = [];
    	let info_points = [];
    	let divider_starts = -36;
    	let division_width = 200;
    	let point = { x: divider_starts, y: 0 };
    	let left_shift = divider_starts * division_width;
    	let info_delta = 3;
    	let g_slot_definitions = {};
    	let g_active_slot_list = [];

    	for (let i = 0; i < 1000; i++) {
    		line_points.push({
    			x: i * division_width + left_shift,
    			y: 0,
    			index: divider_starts + i
    		});

    		let mo_time = F(current_date, divider_starts + i);
    		let da = new Date(mo_time);
    		let mo_label = title_months[da.getMonth()] + " " + da.getFullYear();

    		info_points.push({
    			x: i * division_width + left_shift,
    			y: 0,
    			index: divider_starts + i,
    			label: mo_label
    		});
    	}

    	let original_info_points = info_points.map(p => {
    		return Object.assign({}, p);
    	});

    	// --- ReqSlot --- --- --- --- --- --- --- --- --- ---
    	class ReqSlot extends Slot {
    		//
    		constructor(label, begin_at, end_at, info, d_date, day_key) {
    			super(label, begin_at, end_at);
    			this.index = info.index;
    			this.label = "";
    			this.person_id = "";
    			this.email = "";
    			this.contact_phone = "";
    			this.on_zoom = false;
    			this.in_person = false;
    			this.time = d_date.toLocaleTimeString();
    			this.use = info.blocked;
    			this.on_hour = USE_AS_OPEN;
    			this.on_half_hour = info.on_half_hour;
    			this.changed = false;
    			this.how_long = 15;
    			this.month = d_date.getMonth();
    			this.year = d_date.getFullYear();
    			this.mo_key = day_key;
    			this.accepted = false;
    			this.revision_state = cnst.EVENT_IN_NEGOTIATION;
    		}
    	} //

    	// ---- ---- ---- ManageableTSAgenda
    	class ManageableTSAgenda extends TimeSlotAgenda {
    		//
    		constructor(day, index) {
    			super(day, index);
    			this.all_day_list = [];
    			this.event_count = 0;
    			this.has_events = false;
    			this.key = "";
    		}

    		//
    		copy_relevant_fields(sl, a_slot) {
    			sl.label = a_slot.label;
    			sl.person_id = a_slot.person_id;
    			sl.email = a_slot.email;
    			sl.contact_phone = a_slot.contact_phone;
    			sl.on_zoom = a_slot.on_zoom;
    			sl.in_person = a_slot.in_person;
    			sl.user_id = a_slot.user_id;
    			sl.how_long = a_slot.how_long;
    			sl.month = a_slot.month;
    			sl.year = a_slot.year;
    			sl.mo_key = a_slot.mo_key;
    		}

    		add_slot(a_slot) {
    			super.add_slot(a_slot);
    			let a_list = this.all_day_list;

    			for (let sl of a_list) {
    				if (sl.begin_at >= a_slot.begin_at && sl.begin_at < a_slot.end_at) {
    					sl.use = a_slot.use;
    				}

    				this.copy_relevant_fields(sl, a_slot);
    			}

    			this.event_count++;
    			this.has_events = true;
    			$$invalidate(45, force_day_event_update = true);
    		}

    		remove_slot(a_slot) {
    			super.remove_slot(a_slot);

    			if (this.event_count > 0) {
    				this.event_count--;
    			}

    			if (this.event_count === 0) {
    				this.has_events = false;
    			}

    			let d_date = new Date(a_slot.begin_at);

    			let replacer = new ReqSlot("",
    			a_slot.begin_at,
    			0,
    			{
    					"index": a_slot.index,
    					"blocked": USE_AS_OPEN,
    					"on_half_hour": a_slot.on_half_hour
    				},
    			d_date);

    			super.add_slot(replacer);
    			let all_day_list = this.all_day_list;

    			for (let i = 0; i < 48; i++) {
    				let sl = all_day_list[i];

    				if (sl.begin_at >= a_slot.begin_at && sl.begin_at <= a_slot.end_at) {
    					sl.use = USE_AS_OPEN;
    					this.copy_relevant_fields(sl, replacer);
    				}
    			}

    			//
    			$$invalidate(45, force_day_event_update = true);
    		}

    		//
    		fill_day(year, month, key) {
    			let d_date = new Date(year, month, this.day, 0, 0, 0); // these have been passed

    			// --------
    			let dkey = d_date.toLocaleDateString('en-US', local_presets.time_zone);

    			let mnight = local_presets.saturdays[dkey];

    			if (mnight !== undefined) {
    				//console.log("SATURDAY",dkey)
    				let day_defs = local_presets.presets.saturday;

    				for (let def of day_defs) {
    					let ev = Object.assign({}, def);
    					ev.begin_at = mnight + def.begin_at * ONE_HOUR;
    					ev.end_at = mnight + def.end_at * ONE_HOUR;
    					ev.how_long = (def.end_at - def.begin_at) * 60;
    					timestamp_db.add(ev);
    				}
    			} else {
    				mnight = local_presets.sundays[dkey];

    				if (mnight !== undefined) {
    					//console.log("SUNDAY",dkey)
    					let day_defs = local_presets.presets.sunday;

    					for (let def of day_defs) {
    						let ev = Object.assign({}, def);
    						ev.begin_at = mnight + def.begin_at * ONE_HOUR;
    						ev.end_at = mnight + def.end_at * ONE_HOUR;
    						ev.how_long = (def.end_at - def.begin_at) * 60;
    						timestamp_db.add(ev);
    					}
    				} else {
    					let day_def = local_presets.holidays[dkey];

    					if (day_def !== undefined) {
    						//console.log("HOLIDAY",dkey)
    						let ev = Object.assign({}, day_def);

    						ev.how_long = 24 * 60;
    						timestamp_db.add(ev);
    					} else {
    						let day_defs = local_presets.presets.daily;
    						let a_day = new Date(dkey);
    						mnight = a_day.getTime();

    						//console.log("DAILY",dkey)
    						for (let def of day_defs) {
    							let ev = Object.assign({}, def);
    							ev.begin_at = mnight + def.begin_at * ONE_HOUR;
    							ev.end_at = mnight + def.end_at * ONE_HOUR;
    							ev.how_long = (def.end_at - def.begin_at) * 60;
    							timestamp_db.add(ev);
    						}
    					}
    				}
    			}

    			// --------
    			let all_day_list = this.all_day_list;

    			//
    			//
    			for (let i = 0; i < 48; i++) {
    				//
    				let minutes = d_date.getMinutes();

    				let time = d_date.getTime();

    				//
    				let blocked = USE_AS_OPEN;

    				all_day_list[i] = new ReqSlot("",
    				time,
    				0,
    				{
    						"index": i,
    						blocked,
    						"on_half_hour": minutes !== 0
    					},
    				d_date,
    				key);

    				//
    				let ev = timestamp_db.find_event(time);

    				if (!!ev) {
    					all_day_list[i].use = ev.use;
    					all_day_list[i].end_at = ev.end_at;
    					all_day_list[i].how_long = ev.how_long;

    					if (ev.how_long > 30) {
    						let time_left = ev.how_long - 30;

    						while (time_left > 0 && i < 48) {
    							i++;
    							time_left -= 30;
    							time += ONE_HALF_HOUR;
    							d_date = new Date(time);
    							minutes = d_date.getMinutes();

    							//
    							all_day_list[i] = new ReqSlot("",
    							time,
    							0,
    							{
    									"index": i,
    									"blocked": ev.use,
    									"on_half_hour": minutes !== 0
    								},
    							d_date,
    							key);

    							all_day_list[i].begin_at = time;
    							all_day_list[i].how_long = all_day_list[i - 1].how_long - 30;
    						}
    					}
    				}

    				//
    				time += ONE_HALF_HOUR;

    				d_date = new Date(time);
    			}

    			// --  -- 
    			this.all_day_list = all_day_list;

    			this.event_count = 0;
    			this.has_events = false;
    			this.key = key;
    		}
    	}

    	//
    	let g_request_alert_parameters = false;

    	let parameter_setup = false;

    	//
    	let g_mo_gen = new MonthContainer(current_date.getTime(), ManageableTSAgenda);

    	let day_data = {
    		"day": current_date.getDate(),
    		"month": current_date.getMonth(),
    		"year": 2022,
    		"all_day": []
    	};

    	let current_day_data = day_data;
    	let prev_day_event_count = day_event_count;
    	let data_stem = "contactsearch";

    	let qlist_ordering = [
    		{ id: 1, text: `update_date` },
    		{ id: 2, text: `score` },
    		{ id: 3, text: `create_date` }
    	];

    	let search_ordering = qlist_ordering[2];
    	let search_topic = 'any';

    	//
    	let current_roller_title = "";

    	let model_month_entry = {
    		"_tracking": false,
    		"color": 'grey',
    		"title": "no content",
    		"month": g_mo_gen.month,
    		"year": g_mo_gen.year,
    		"start_time": g_mo_gen.start_time,
    		"end_time": g_mo_gen.end_time,
    		"cal": g_mo_gen.cal,
    		"month_str": title_months[g_mo_gen.month],
    		"dates": { "created": "never", "updated": "never" },
    		"subject": "",
    		"abstract": "no content",
    		"keys": [],
    		"comments": [],
    		"score": 1.0,
    		"total_events": 0,
    		"time_zone": g_timezone
    	};

    	let thing_template = make_empty_thing(model_month_entry, true);
    	let current_thing = Object.assign({ "id": 0, "entry": 0 }, thing_template);
    	let app_empty_object = Object.assign({ "id": 1, "entry": -1 }, thing_template);

    	//fill_cal(current_thing)
    	//fill_cal(app_empty_object)
    	//
    	//
    	let cal_update = false;

    	function update_calendar() {
    		$$invalidate(49, cal_update = current_thing);
    	}

    	let window_scale = { "w": 0.4, "h": 0.6 };

    	//
    	let all_window_scales = [];

    	all_window_scales = popup_size();
    	let g_last_known_transition = false;

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

    		//
    		let topic_group = cnst.CALENDAR_TOPIC_GROUP;

    		let api_path = "requests";

    		let subscriptions = {
    			// published by the user
    			"in-new-request": {
    				"path": cnst.USER_CHAT_PATH,
    				"topic": cnst.REQUEST_EVENT_TOPIC,
    				"handler": async message => {
    					let status = message.data !== undefined;

    					if (status) {
    						let req = message.data;
    						tl_subr.injest_request(req, things);
    						update_calendar();
    					}
    				}
    			},
    			"in-request-change": {
    				// the server stores the change -- so fetch the months associated
    				"path": cnst.USER_CHAT_PATH,
    				"topic": cnst.REQUEST_EVENT_CHANGE_TOPIC, //  user confirmation. user length change
    				"handler": async message => {
    					let status = message.data !== undefined;

    					if (status) {
    						$$invalidate(46, parameter_setup = message.data);

    						setTimeout(
    							() => {
    								start_floating_window(3);
    							},
    							5
    						);

    						data_fetcher(); // retrieve the changes that this mesage is telling us about
    					}
    				}
    			},
    			"in-request-drop": {
    				// the server stores the change -- so fetch the months associated
    				"path": cnst.USER_CHAT_PATH,
    				"topic": cnst.REQUEST_EVENT_DROP_TOPIC, // cancel meeting, drop and create new (different time)
    				"handler": async message => {
    					let status = message.data !== undefined;

    					if (status) {
    						$$invalidate(46, parameter_setup = message.data);
    						tl_subr.drop_request(parameter_setup, things);

    						setTimeout(
    							() => {
    								start_floating_window(3);
    							},
    							5
    						);

    						data_fetcher(); // retrieve the changes that this mesage is telling us about
    					}
    				}
    			}
    		};

    		//
    		add_ws_endpoint(topic_group, cnst.DEFAULT_WS_CALENDAR_ACCESS, 9797, api_path, subscriptions);

    		//
    		// end of timeline subscriptions
    		// PANZOOM
    		panzoomInstance = panzoom(canvasElt, panzoomOptions);

    		// panzoomInstance.moveTo(centerX, centerY);
    		let final_timeout = false;

    		panzoomInstance.on('zoom', e => {
    			/// left to right only
    			let tt = e.getTransform();

    			tt.y = 0;

    			let repoint = original_info_points.map(p => {
    				let oo = Object.assign({}, p);
    				oo.x = oo.x * tt.scaleX + tt.x + info_delta * tt.scaleX;
    				return oo;
    			});

    			$$invalidate(11, info_points = repoint);

    			//
    			//
    			$$invalidate(15, width_control.style.visibility = "hidden", width_control);

    			//
    			if (final_timeout) {
    				clearTimeout(final_timeout);
    				final_timeout = false;
    			}

    			final_timeout = setTimeout(
    				() => {
    					let width_control_reference_object = false; //

    					//
    					g_all_time_slots = g_all_time_slots.map(oo => {
    						//
    						oo.x = oo.unit_x * tt.scaleX + tt.x;

    						oo.width = oo.unit_width * tt.scaleX;

    						//
    						if (oo.selected) {
    							width_control_reference_object = oo;
    						}

    						//
    						return oo;
    					});

    					//
    					if (width_control_reference_object) {
    						$$invalidate(15, width_control.style.visibility = "visible", width_control);
    						let info_rect = width_control_reference_object;
    						width_control.setAttribute('x', info_rect.x + info_rect.width - 5);
    					}
    				},
    				30
    			); //

    			//
    			g_last_known_transition = tt;
    		});

    		panzoomInstance.on('zoomend', e => {
    			/// left to right only
    			let tt = e.getTransform();

    			tt.y = 0;

    			let repoint = original_info_points.map(p => {
    				let oo = Object.assign({}, p);
    				oo.x = oo.x * tt.scaleX + tt.x + info_delta * tt.scaleX;
    				return oo;
    			});

    			$$invalidate(11, info_points = repoint);

    			//
    			//  update slots so that they can be found on a mouse click
    			g_all_time_slots = g_all_time_slots.map(oo => {
    				//
    				oo.x = oo.unit_x * tt.scaleX + tt.x;

    				oo.width = oo.unit_width * tt.scaleX;

    				//
    				return oo;
    			});

    			//
    			g_last_known_transition = tt;
    		});

    		panzoomInstance.on('pan', e => {
    			/// left to right only
    			let tt = e.getTransform();

    			tt.y = 0;

    			let repoint = original_info_points.map(p => {
    				let oo = Object.assign({}, p);
    				oo.x = oo.x * tt.scaleX + tt.x + info_delta * tt.scaleX;
    				return oo;
    			});

    			//
    			$$invalidate(11, info_points = repoint);

    			//
    			$$invalidate(15, width_control.style.visibility = "hidden", width_control);

    			//
    			g_last_known_transition = tt;
    		});

    		panzoomInstance.on('panend', e => {
    			/// left to right only
    			let tt = e.getTransform();

    			tt.y = 0;

    			let repoint = original_info_points.map(p => {
    				let oo = Object.assign({}, p);
    				oo.x = oo.x * tt.scaleX + tt.x + info_delta * tt.scaleX;
    				return oo;
    			});

    			//
    			$$invalidate(11, info_points = repoint);

    			//
    			//
    			g_last_known_transition = tt;
    		});

    		panzoomInstance.on('decelerated-to-zero', e => {
    			let tt = panzoomInstance.getTransform();

    			//  update slots so that they can be found on a mouse click
    			let width_control_reference_object = false;

    			g_all_time_slots = g_all_time_slots.map(oo => {
    				//
    				oo.x = oo.unit_x * tt.scaleX + tt.x;

    				if (oo.selected) {
    					width_control_reference_object = oo;
    				}

    				//
    				return oo;
    			});

    			//
    			if (width_control_reference_object) {
    				$$invalidate(15, width_control.style.visibility = "visible", width_control);
    				let info_rect = width_control_reference_object;
    				width_control.setAttribute('x', info_rect.x + info_rect.width - 5);
    			}

    			//
    			g_last_known_transition = tt;
    		}); //console.log(tt)

    		setTimeout(load_data_from_db, 20);
    	});

    	// ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	// METHODS FOR RESIZING the time slot canvas
    	//'ns-resize'
    	let g_canvas_tracking_start_point = false;

    	function canvas_resizer_activate(ev) {
    		ev.preventDefault();
    		ev.stopPropagation();
    		window.addEventListener('mousemove', canvas_resizer_track);
    		window.addEventListener('mouseup', canvas_resizer_end);
    		$$invalidate(8, canvas_resizer.style.cursor = 'ns-resize', canvas_resizer);
    		$$invalidate(9, app_view.style.cursor = 'ns-resize', app_view);
    		g_canvas_tracking_start_point = { x: ev.clientX, y: ev.clientY };
    	}

    	function canvas_resizer_track(ev) {
    		ev.preventDefault();
    		ev.stopPropagation();

    		//
    		if (g_canvas_tracking_start_point) {
    			$$invalidate(8, canvas_resizer.style.cursor = 'ns-resize', canvas_resizer);

    			let maybe_update = {
    				x: ev.clientX - g_canvas_tracking_start_point.x,
    				y: ev.clientY - g_canvas_tracking_start_point.y
    			};

    			g_canvas_tracking_start_point = { x: ev.clientX, y: ev.clientY };
    			$$invalidate(4, timeline_slider_height += maybe_update.y);

    			if (timeline_slider_height > ABRITRARY_MAX_CANVAS_HEIGHT) {
    				$$invalidate(4, timeline_slider_height = ABRITRARY_MAX_CANVAS_HEIGHT);
    			}

    			if (timeline_slider_height < ABRITRARY_MIN_CANVAS_HEIGHT) {
    				$$invalidate(4, timeline_slider_height = ABRITRARY_MIN_CANVAS_HEIGHT);
    			}
    		}
    	}

    	function canvas_resizer_end(ev) {
    		window.removeEventListener('mousemove', canvas_resizer_track);
    		window.removeEventListener('mouseup', canvas_resizer_end);
    		$$invalidate(8, canvas_resizer.style.cursor = 'pointer', canvas_resizer);
    		$$invalidate(9, app_view.style.cursor = 'default', app_view);

    		//
    		if (g_canvas_tracking_start_point) {
    			let maybe_update = {
    				x: ev.clientX - g_canvas_tracking_start_point.x,
    				y: ev.clientY - g_canvas_tracking_start_point.y
    			};

    			//
    			$$invalidate(4, timeline_slider_height += maybe_update.y);

    			if (timeline_slider_height > ABRITRARY_MAX_CANVAS_HEIGHT) {
    				$$invalidate(4, timeline_slider_height = ABRITRARY_MAX_CANVAS_HEIGHT);
    			}

    			if (timeline_slider_height < ABRITRARY_MIN_CANVAS_HEIGHT) {
    				$$invalidate(4, timeline_slider_height = ABRITRARY_MIN_CANVAS_HEIGHT);
    			}

    			//
    			g_canvas_tracking_start_point = false;
    		}
    	}

    	// ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	// METHODS FOR Handling grid box selection
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
    					$$invalidate(2, current_thing = athing);
    					let dd = new Date(athing.when);
    					$$invalidate(2, current_thing.title = dd.toLocaleDateString(), current_thing);
    					start_floating_window(0);
    				} else {
    					current_roller_title = athing.title;
    				}
    			}
    		}
    	}

    	function handleEventPlanningMessage(event) {
    		let data = event.detail;
    		$$invalidate(47, day_data = data.day_info);
    		$$invalidate(0, day_event_count = day_data.event_count);
    		start_floating_window(1, 1.0, 0.5);
    		fix_z_topper(1);
    	}

    	function clickEmptyElement(thing_counter) {
    		//
    		let y = g_mo_gen.year;

    		let m = g_mo_gen.month;
    		m = (m + thing_counter - 1) % 12;
    		if (m === 0) y++;
    		let ee_date = new Date(y, m);

    		//
    		let ee_thing = Object.assign({ "id": 0, "entry": 0 }, thing_template);

    		let mo_gen = new MonthContainer(ee_date.getTime(), ManageableTSAgenda);

    		//
    		ee_thing.month = mo_gen.month;

    		ee_thing.year = mo_gen.year;
    		ee_thing.start_time = mo_gen.start_time;
    		ee_thing.end_time = mo_gen.end_time;
    		ee_thing.cal = mo_gen.cal;
    		ee_thing.month_str = title_months[mo_gen.month];
    		fill_cal(ee_thing);

    		//
    		//
    		ee_thing.id = thing_counter;

    		return ee_thing;
    	}

    	// MANAGE ELEMENTS SHOWING UP IN THE GRID
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
    			$$invalidate(3, things = [...p]);
    		}
    	}

    	// ---- ---- ---- ---- ---- ---- ----
    	async function handleClick_add() {
    		let start = things.length;

    		for (let i = 0; i < box_delta; i++) {
    			let thing_counter = things.length;
    			thing_counter++;
    			let additional = clickEmptyElement(thing_counter);
    			$$invalidate(3, things = [...things, additional]);
    		}

    		//
    		let end = things.length; /// start + box_delta

    		if (needs_data(start, end)) {
    			data_fetcher(start, things.length);
    		} else {
    			pre_data_fetcher();
    		}
    	}

    	//
    	function handle_index_changed() {
    		do_data_placement();
    	}

    	function handleClick_first() {
    		article_index = 1;
    		do_data_placement();
    	}

    	function handleClick_last() {
    		article_index = article_count;
    		do_data_placement();
    	}

    	function handle_keyDown(ev) {
    		if (ev.charCode == 13) {
    			article_index = 1;
    			data_fetcher();
    		}
    	}

    	function handle_order_change(ev) {
    		article_index = 1;
    		data_fetcher();
    	}

    	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	// FETCH BUTTON RESPONSE 
    	function handleClick_fetch(ev) {
    		article_index = 1;
    		data_fetcher();
    	}

    	function pre_data_fetcher(qstart, alt_length) {
    		let l = alt_length === undefined ? things.length : alt_length;
    		let stindex = qstart === undefined ? article_index - 1 : qstart;

    		//
    		stindex = Math.max(0, stindex);

    		try {
    			let search_result = { "data": [], "count": l };
    			let ee_date = new Date();

    			for (let ee = 0; ee < l; ee++) {
    				let ee_thing = Object.assign({ "id": 0, "entry": 0 }, thing_template);
    				let mo_gen = new MonthContainer(ee_date.getTime(), ManageableTSAgenda);

    				//
    				ee_thing.month = mo_gen.month;

    				ee_thing.year = mo_gen.year;
    				ee_thing.start_time = mo_gen.start_time;
    				ee_thing.end_time = mo_gen.end_time;
    				ee_thing.cal = mo_gen.cal;
    				ee_thing.month_str = title_months[mo_gen.month];
    				fill_cal(ee_thing);
    				search_result.data.push(ee_thing);

    				//
    				let y = mo_gen.year;

    				let m = mo_gen.month;
    				m = (m + 1) % 12;
    				if (m === 0) y++;
    				ee_date = new Date(y, m);
    			}

    			let [a_i, lo, ot] = process_search_results(stindex, qstart, search_result, other_things, unload_data);
    			article_index = a_i;
    			article_count = lo;
    			other_things = ot;

    			if (other_things !== false) {
    				$$invalidate(3, things = merge_data(merge_calendars, things, other_things, article_index));
    			}
    		} catch(e) {
    			alert(e.message);
    		}
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

    			//data_stem = ""  // TEST  /${data_stem}
    			//let search_result = await link_server_fetch(`${prot}${sp}${srver}/${data_stem}/${rest}`,post_params, postData)
    			let search_result = { "data": [], "count": l };

    			let ee_date = new Date();

    			for (let ee = 0; ee < l; ee++) {
    				let ee_thing = Object.assign({ "id": 0, "entry": 0 }, thing_template);
    				let mo_gen = new MonthContainer(ee_date.getTime(), ManageableTSAgenda);

    				//
    				ee_thing.month = mo_gen.month;

    				ee_thing.year = mo_gen.year;
    				ee_thing.start_time = mo_gen.start_time;
    				ee_thing.end_time = mo_gen.end_time;
    				ee_thing.cal = mo_gen.cal;
    				ee_thing.month_str = title_months[mo_gen.month];
    				fill_cal(ee_thing);
    				search_result.data.push(ee_thing);

    				//
    				let y = mo_gen.year;

    				let m = mo_gen.month;
    				m = (m + 1) % 12;
    				if (m === 0) y++;
    				ee_date = new Date(y, m);
    			}

    			let [a_i, lo, ot] = process_search_results(stindex, qstart, search_result, other_things, unload_data);
    			article_index = a_i;
    			article_count = lo;
    			other_things = ot;

    			if (other_things !== false) {
    				$$invalidate(3, things = merge_data(merge_calendars, things, other_things, article_index));
    			}
    		} catch(e) {
    			alert(e.message);
    		}
    	}

    	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	// 
    	// ---- STARTING TIME SLOT EDITING CONTROLS
    	function deselect_all_selected_rects(info_rect) {
    		for (let slot_bound of g_all_time_slots) {
    			if (info_rect !== slot_bound && slot_bound.selected) {
    				slot_bound.selected = false;
    				slot_bound.el.setAttribute('fill', 'black');
    			}
    		}
    	}

    	function show_width_control(info_rect) {
    		width_control.setAttribute('x', info_rect.x + info_rect.width - 5);
    		$$invalidate(15, width_control.style.visibility = 'visible', width_control);
    		deselect_all_selected_rects(info_rect);
    	}

    	function hide_width_control() {
    		$$invalidate(15, width_control.style.visibility = 'hidden', width_control);
    	}

    	// ---- ---- ---- ---- ---- ---- ---- ---- ----
    	let g_starting_point = { x: 0, y: 0 };

    	let g_update_point = { x: 0, y: 0 };
    	let g_tracking_mouse = false;
    	let g_current_rect = false;
    	let g_tracking_rect = false;
    	let g_selected_svg_timeslot_rect = false;
    	let width_control = false;

    	function click_in_rect(point) {
    		for (let slot_bound of g_all_time_slots) {
    			if (slot_bound.x <= point.x && point.x <= slot_bound.x + slot_bound.width) {
    				if (point.y >= slot_bound.y && point.y <= slot_bound.y + c_TIME_SLOT_HEIGHT) {
    					return slot_bound;
    				}
    			}
    		}

    		return false;
    	}

    	//
    	function handle_click_in_rect(found_rect) {
    		//console.log(found_rect)
    		g_tracking_rect = found_rect;

    		found_rect.el.setAttribute('fill', 'green');
    		canvasElt.removeChild(found_rect.el);

    		//
    		let tt = g_last_known_transition;

    		//
    		if (tt) {
    			let x = found_rect.x;
    			let w = found_rect.width;
    			found_rect.el.setAttribute('x', x);
    			found_rect.el.setAttribute('width', w);
    		}

    		//
    		controllerElt.appendChild(found_rect.el);
    	} // begin tracking

    	let g_selected_ts = false;

    	function handle_editor(ev) {
    		let option = ev.altKey;
    		let command = ev.metaKey;

    		if (option || command) {
    			hide_width_control();
    			const rect = ev.currentTarget.getBoundingClientRect();

    			let maybe_update = {
    				x: ev.clientX - rect.x,
    				y: ev.clientY - rect.y
    			};

    			//
    			let found_rect = click_in_rect(maybe_update);

    			if (found_rect) {
    				ev.preventDefault();
    				ev.stopPropagation();

    				if (command) {
    					found_rect.selected = !found_rect.selected;

    					if (found_rect.selected) {
    						$$invalidate(16, g_selected_ts = true);
    						g_selected_svg_timeslot_rect = found_rect;
    						show_width_control(found_rect);
    						found_rect.el.setAttribute('fill', 'darkorange');

    						//
    						rect_to_time_slot_editor(found_rect);
    					} else {
    						$$invalidate(16, g_selected_ts = false);
    						hide_width_control();
    						found_rect.el.setAttribute('fill', 'black');
    					}
    				} else {
    					handle_click_in_rect(found_rect);

    					g_starting_point = {
    						x: ev.clientX - rect.x,
    						y: ev.clientY - rect.y
    					};

    					found_rect.delta_x = g_starting_point.x - found_rect.x;
    					found_rect.delta_y = g_starting_point.y - found_rect.y;
    				}
    			} else {
    				deselect_all_selected_rects(false);
    				g_tracking_mouse = true;

    				g_starting_point = {
    					x: ev.clientX - rect.x,
    					y: ev.clientY - rect.y
    				};

    				g_update_point = maybe_update;
    				const svgns = "http://www.w3.org/2000/svg";

    				//const  xlinkns = "http://www.w3.org/1999/xlink";
    				let n_rect = document.createElementNS(svgns, "rect");

    				// rect.setAttributeNS(xlinkns, "href", "#MidCLine1");
    				n_rect.setAttribute("y", g_update_point.y);

    				n_rect.setAttribute("x", g_update_point.x);
    				n_rect.setAttribute("height", `${c_TIME_SLOT_HEIGHT}px`);
    				n_rect.setAttribute("width", '3px');
    				controllerElt.appendChild(n_rect);
    				g_current_rect = n_rect;
    				ev.preventDefault();
    				ev.stopPropagation();
    			}
    		} else {
    			$$invalidate(7, controllerElt.style.cursor = "grabbing", controllerElt);
    		}
    	}

    	function place_rect_in_scalable(created_rect, window_rect) {
    		//
    		controllerElt.removeChild(created_rect);

    		let x = parseInt(created_rect.getAttribute('x'));
    		let y = parseInt(created_rect.getAttribute('y'));
    		let w = parseInt(created_rect.getAttribute('width'));
    		if (w < 5) return false;

    		//
    		let tt = g_last_known_transition;

    		//
    		if (tt) {
    			x = (x - tt.x) / tt.scaleX;
    			w = w / tt.scaleX;
    			created_rect.setAttribute('x', x);
    			created_rect.setAttribute('width', w);
    		}

    		canvasElt.appendChild(created_rect);

    		// ---- ---- ---- ---- ---- ---- ---- ----
    		//
    		let scx = tt ? tt.scaleX : 1.0;

    		let scy = tt ? tt.scaleY : 1.0;

    		let info = {
    			'x': window_rect.x,
    			'y': window_rect.y,
    			'height': window_rect.height,
    			'width': window_rect.width,
    			//
    			'unit_x': x,
    			'unit_y': y,
    			'unit_width': window_rect.width / scx,
    			'unit_height': window_rect.height / scy,
    			//
    			'el': created_rect,
    			'selected': false
    		};

    		return info;
    	}

    	function handle_editor_end(ev) {
    		const rect = ev.currentTarget.getBoundingClientRect();
    		g_tracking_mouse = false;
    		$$invalidate(7, controllerElt.style.cursor = "pointer", controllerElt);

    		g_update_point = {
    			x: ev.clientX - rect.x,
    			y: ev.clientY - rect.y
    		};

    		//
    		if (g_current_rect) {
    			let recalc_width = 0;
    			recalc_width = g_update_point.x - g_starting_point.x;
    			if (recalc_width < 3) recalc_width = 3;
    			g_current_rect.setAttribute('width', recalc_width);

    			//
    			let window_rect = {
    				x: g_starting_point.x,
    				y: g_starting_point.y,
    				width: recalc_width,
    				height: c_TIME_SLOT_HEIGHT
    			};

    			let rect_info = place_rect_in_scalable(g_current_rect, window_rect);

    			//
    			if (rect_info) g_all_time_slots.push(rect_info);

    			//
    			rect_to_time_slot_editor(rect_info, false, true);

    			g_current_rect = false;
    		} else if (g_tracking_rect) {
    			//
    			let previous_rect = Object.assign({}, g_tracking_rect);

    			let window_rect = {
    				x: g_tracking_rect.x,
    				y: g_tracking_rect.y,
    				width: g_tracking_rect.width,
    				height: g_tracking_rect.height
    			};

    			//
    			let rect_info = place_rect_in_scalable(g_tracking_rect.el, window_rect);

    			//
    			g_tracking_rect.x = rect_info.x;

    			g_tracking_rect.y = rect_info.y;
    			g_tracking_rect.unit_x = rect_info.unit_x;
    			g_tracking_rect.unit_y = rect_info.unit_y;

    			//
    			rect_to_time_slot_editor(g_tracking_rect, previous_rect);

    			//
    			g_tracking_rect.el.setAttribute('fill', 'black');

    			g_tracking_rect.selected = false;
    			g_tracking_rect = false;
    		}
    	}

    	function moving_mouse(ev) {
    		if (g_tracking_mouse) {
    			const rect = ev.currentTarget.getBoundingClientRect();

    			g_update_point = {
    				x: ev.clientX - rect.x,
    				y: ev.clientY - rect.y
    			};

    			if (g_current_rect) {
    				let recalc_width = 0;
    				recalc_width = g_update_point.x - g_starting_point.x;
    				if (recalc_width < 3) recalc_width = 3;
    				g_current_rect.setAttribute('width', recalc_width);
    			}
    		} else if (g_tracking_rect) {
    			//
    			const rect = ev.currentTarget.getBoundingClientRect();

    			g_update_point = {
    				x: ev.clientX - rect.x,
    				y: ev.clientY - rect.y
    			};

    			//
    			let el = g_tracking_rect.el;

    			let new_x = g_update_point.x;
    			let new_y = g_update_point.y;
    			g_tracking_rect.x = new_x - g_tracking_rect.delta_x;
    			g_tracking_rect.y = new_y - g_tracking_rect.delta_y;
    			el.setAttribute('x', `${new_x - g_tracking_rect.delta_x}px`);
    			el.setAttribute('y', `${new_y - g_tracking_rect.delta_y}px`);
    		}
    	}

    	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	// WIDTH TRACKING --- handle using the width control...
    	let g_wc_start_point = false;

    	function manage_width(ev) {
    		ev.preventDefault();
    		ev.stopPropagation();
    		ev.currentTarget.getBoundingClientRect();
    		g_wc_start_point = { x: ev.clientX, y: ev.clientY };
    		window.addEventListener('mousemove', width_tracking);
    		window.addEventListener('mouseup', width_end_tracking);
    	}

    	function width_tracking(ev) {
    		ev.preventDefault();
    		ev.stopPropagation();

    		if (g_wc_start_point && width_control) {
    			let maybe_update = {
    				x: ev.clientX - g_wc_start_point.x,
    				y: ev.clientY - g_wc_start_point.y
    			};

    			g_wc_start_point = { x: ev.clientX, y: ev.clientY };

    			//
    			let cur_loc = parseInt(width_control.getAttribute('x'));

    			let new_x = maybe_update.x + cur_loc;

    			if (g_selected_svg_timeslot_rect) {
    				let tt = g_last_known_transition;
    				let scalex = tt ? tt.scaleX : 1.0;
    				let oo = g_selected_svg_timeslot_rect;

    				//
    				let box_w = new_x - oo.x;

    				oo.width = box_w;
    				oo.unit_width = box_w / scalex;
    				oo.el.setAttribute('width', oo.unit_width);

    				//
    				rect_to_time_slot_editor(oo);
    			}

    			width_control.setAttribute('x', `${new_x}px`);
    		}
    	}

    	function width_end_tracking(ev) {
    		ev.preventDefault();
    		ev.stopPropagation();
    		window.removeEventListener('mousemove', width_tracking);
    		window.removeEventListener('mouseup', width_end_tracking);

    		if (g_wc_start_point) {
    			if (width_control) {
    				let maybe_update = {
    					x: ev.clientX - g_wc_start_point.x,
    					y: ev.clientY - g_wc_start_point.y
    				};

    				g_wc_start_point = { x: ev.clientX, y: ev.clientY };

    				//
    				let cur_loc = parseInt(width_control.getAttribute('x'));

    				let new_x = maybe_update.x + cur_loc;

    				//
    				if (g_selected_svg_timeslot_rect) {
    					let tt = g_last_known_transition;
    					let scalex = tt ? tt.scaleX : 1.0;
    					let oo = g_selected_svg_timeslot_rect;

    					//
    					let box_w = new_x - oo.x;

    					oo.width = box_w;
    					oo.unit_width = box_w / scalex;
    					oo.el.setAttribute('width', oo.unit_width);

    					//
    					rect_to_time_slot_editor(oo, false, true);
    				}

    				//
    				width_control.setAttribute('x', `${new_x}px`);
    			}

    			g_wc_start_point = false;
    		}
    	}

    	let edit_op_possibly_delete = false;

    	async function handle_delete(keep_svg) {
    		if (edit_op_possibly_delete) {
    			let idx = g_all_time_slots.indexOf(edit_op_possibly_delete);

    			if (idx >= 0) {
    				g_all_time_slots.splice(idx, 1);

    				if (!keep_svg) {
    					let svg_el = edit_op_possibly_delete.el;

    					if (svg_el) {
    						canvasElt.removeChild(svg_el);
    					}
    				}

    				//
    				if (g_human_time_slot_storage) {
    					try {
    						await g_human_time_slot_storage.get_time_slot(edit_op_possibly_delete.name);
    						await g_human_time_slot_storage.remove_time_slot();
    					} catch(e) {
    						
    					}
    				}
    			} //
    		}
    	}

    	async function save_time_slot(status, update_ts) {
    		if (status.name_change) {
    			await handle_delete(true);
    			$$invalidate(5, current_time_slot.name = update_ts.name, current_time_slot);
    			$$invalidate(5, current_time_slot.slot_name = update_ts.slot_name, current_time_slot);
    		}

    		$$invalidate(5, current_time_slot.description = update_ts.description, current_time_slot);
    		$$invalidate(5, current_time_slot.begin_at = update_ts.begin_at, current_time_slot);
    		$$invalidate(5, current_time_slot.end_at = update_ts.end_at, current_time_slot);

    		//
    		$$invalidate(5, current_time_slot.pattern = update_ts.pattern, current_time_slot);

    		$$invalidate(5, current_time_slot.start_time = update_ts.start_time, current_time_slot);
    		$$invalidate(5, current_time_slot.end_time = update_ts.end_time, current_time_slot);
    		$$invalidate(5, current_time_slot.activity = update_ts.activity, current_time_slot);
    		$$invalidate(5, current_time_slot.allow_zoom = update_ts.allow_zoom, current_time_slot);
    		$$invalidate(5, current_time_slot.allow_in_person = update_ts.allow_in_person, current_time_slot);

    		//
    		await g_human_time_slot_storage.update_time_slot(current_time_slot);

    		let idx = g_all_time_slots.indexOf(edit_op_possibly_delete);

    		if (idx >= 0) {
    			let oo = edit_op_possibly_delete;
    			oo.description = update_ts.description;
    			oo.begin_at = update_ts.begin_at;
    			oo.end_at = update_ts.end_at;

    			//
    			oo.pattern = update_ts.pattern;

    			oo.activity = update_ts.activity;
    			oo.allow_zoom = update_ts.allow_zoom;
    			oo.allow_in_person = update_ts.allow_in_person;
    		}
    	}

    	async function handle_time_slot_editor(event) {
    		let cmd_dscr = event.detail;

    		if (cmd_dscr.type === "command") {
    			switch (cmd_dscr.cmd) {
    				case 'delete-time-slot':
    					{
    						handle_delete();
    						break;
    					}
    				case 'save-time-slot':
    					{
    						await save_time_slot(cmd_dscr.status, cmd_dscr.time_slot_data);
    						break;
    					}
    			}
    		}
    	}

    	//
    	async function rect_to_time_slot_editor(found_rect, previous_rect, changed) {
    		if (!found_rect) return;
    		edit_op_possibly_delete = found_rect;

    		//
    		let scaleX = 1.0;

    		let tt = g_last_known_transition;

    		if (tt) {
    			scaleX = tt.scaleX;
    			if (scaleX === 0) return;
    		}

    		let pitch = division_width * scaleX;

    		//
    		let [mody_of_d1, mody_of_d2] = rect_to_time_slot(found_rect, pitch / scaleX);

    		//
    		//
    		let create_new = false;

    		if (!previous_rect && (typeof found_rect.name !== "string" || !found_rect.name.length)) {
    			create_new = true;
    			let dtime = mody_of_d1.getTime();

    			//
    			let y_rep = Math.floor(found_rect.unit_y);

    			found_rect.slot_name = `unnamed-${y_rep}-${dtime}`;
    			found_rect.name = found_rect.slot_name;

    			//
    			found_rect.description = "";

    			found_rect.begin_at = "";
    			found_rect.end_at = "";
    			found_rect.allow_in_person = false;
    			found_rect.allow_zoom = false;
    			found_rect.activity = USE_AS_BLOCK;

    			found_rect.pattern = {
    				"sunday": false,
    				"monday": false,
    				"tuesday": false,
    				"wednesday": false,
    				"thursday": false,
    				"friday": false,
    				"staturday": false
    			};
    		} else if (previous_rect) {
    			// updating
    			// the rect position (and times) have changed
    			create_new = true;

    			try {
    				await g_human_time_slot_storage.get_time_slot(previous_rect.name);
    				await g_human_time_slot_storage.remove_time_slot();
    			} catch(e) {
    				
    			}

    			//
    			let formed_name = previous_rect.name;

    			if (formed_name.indexOf('unnamed-') === 0) {
    				let dtime = mody_of_d1.getTime();
    				let y_rep = Math.floor(found_rect.unit_y);
    				let slot_name = `unnamed-${y_rep}-${dtime}`;

    				//
    				found_rect.name = slot_name;

    				found_rect.slot_name = slot_name;
    			} else {
    				let name_parts = formed_name.split('-'); // label and start time
    				found_rect.slot_name = name_parts[0];
    				let dtime = mody_of_d1.getTime();
    				name_parts[name_parts.length - 1] = dtime;
    				name_parts.name = name_parts.join('-');
    			}
    		}

    		//
    		$$invalidate(5, current_time_slot.name = found_rect.name, current_time_slot);

    		$$invalidate(5, current_time_slot.slot_name = found_rect.slot_name, current_time_slot);

    		//
    		$$invalidate(5, current_time_slot.start_day = mody_of_d1.toLocaleDateString(), current_time_slot);

    		$$invalidate(5, current_time_slot.end_day = mody_of_d2.toLocaleDateString(), current_time_slot);
    		$$invalidate(5, current_time_slot.start_time = mody_of_d1.getTime(), current_time_slot);
    		$$invalidate(5, current_time_slot.end_time = mody_of_d2.getTime(), current_time_slot);

    		//
    		$$invalidate(5, current_time_slot.description = found_rect.description, current_time_slot);

    		$$invalidate(5, current_time_slot.begin_at = found_rect.begin_at, current_time_slot);
    		$$invalidate(5, current_time_slot.end_at = found_rect.end_at, current_time_slot);
    		$$invalidate(5, current_time_slot.activity = found_rect.activity, current_time_slot);
    		$$invalidate(5, current_time_slot.pattern = found_rect.pattern, current_time_slot);

    		//
    		$$invalidate(5, current_time_slot.allow_zoom = found_rect.allow_zoom, current_time_slot);

    		$$invalidate(5, current_time_slot.allow_in_person = found_rect.allow_in_person, current_time_slot);

    		//
    		$$invalidate(5, current_time_slot.unit_y = found_rect.unit_y, current_time_slot);

    		$$invalidate(5, current_time_slot.unit_x = found_rect.unit_x, current_time_slot);
    		$$invalidate(5, current_time_slot.unit_width = found_rect.unit_width, current_time_slot);
    		$$invalidate(5, current_time_slot.unit_height = found_rect.unit_height, current_time_slot);

    		//
    		if (create_new) {
    			await g_human_time_slot_storage.add_time_slot(current_time_slot);
    		} else if (changed) {
    			await g_human_time_slot_storage.update_time_slot(current_time_slot);
    		}
    	}

    	let time_line_display = false;

    	function time_line_slots_to_display(slot_list) {
    		for (let a_slot of slot_list) {
    			//
    			let scaleX = 1.0;

    			let tt = g_last_known_transition;

    			if (tt) {
    				scaleX = tt.scaleX;
    			}

    			//
    			let d1 = new Date(a_slot.start_time);

    			let d2 = new Date(a_slot.end_time);

    			//
    			let [rect_start, rect_width] = time_slot_to_rect(d1, d2, division_width * scaleX);

    			let ypos = a_slot.unit_y;

    			let window_rect = {
    				x: rect_start,
    				y: ypos,
    				width: rect_width,
    				height: c_TIME_SLOT_HEIGHT
    			};

    			const svgns = "http://www.w3.org/2000/svg";
    			let n_rect = document.createElementNS(svgns, "rect");
    			n_rect.setAttribute("y", window_rect.y);
    			n_rect.setAttribute("x", window_rect.x);
    			n_rect.setAttribute("height", `${c_TIME_SLOT_HEIGHT}px`);
    			n_rect.setAttribute("width", window_rect.width);
    			controllerElt.appendChild(n_rect);

    			//
    			let rect_info = place_rect_in_scalable(n_rect, window_rect);

    			if (rect_info) {
    				for (let sl in a_slot) {
    					if (sl in rect_info) continue;
    					rect_info[sl] = a_slot[sl];
    				}

    				g_all_time_slots.push(rect_info);
    			}
    		}
    	}

    	async function load_data_from_db() {
    		let slot_list = await g_human_time_slot_storage.get_slot_entries();
    		time_line_slots_to_display(slot_list);
    	}

    	//
    	async function handleClick_send_update(ev) {
    		let slot_list = await g_human_time_slot_storage.get_slot_entries();
    		await tl_subr.send_time_line('publication-commands', 'uploader-commands', slot_list, things);
    	}

    	// ---- TIMEZONE
    	let g_event_window_tstarts = {};

    	let g_timezone_shift = 0;

    	function handleTimezoneUpdateMessage(event) {
    		let tz_data = event.detail;

    		if (tz_data) {
    			let clock_changes = tz_data.clocks;

    			if (clock_changes) {
    				let reclocked = g_all_clocks.map(a_clock => {
    					let clock_ky = a_clock.tz_info;
    					let clck_change = clock_changes[clock_ky];

    					if (clck_change !== undefined) {
    						if (clck_change) {
    							delete clock_changes[clock_ky];
    							return a_clock;
    						} else {
    							return false;
    						}
    					}

    					return a_clock;
    				});

    				reclocked = reclocked.filter(el => {
    					return el;
    				});

    				let add_on = Object.keys(clock_changes);

    				for (let clock_ky of add_on) {
    					let city = clock_ky.split('/');
    					city = city[city.length - 1];

    					reclocked.push({
    						"label": city,
    						"timezone": "+6",
    						"tz_info": clock_ky
    					});
    				}

    				$$invalidate(20, g_all_clocks = reclocked);
    			}
    		}
    	}

    	// 
    	let tz_city = g_timezone.split('/')[1];

    	// ----
    	let home_time = new Date();

    	let g_home_timezone = g_timezone;
    	let home_tz_str = home_time.toLocaleTimeString("en-US", { timeZone: g_home_timezone });
    	let home_tparts = home_tz_str.split(':');
    	let home_hr_update = parseInt(home_tparts[0]);
    	let h_rest = home_tparts[2].split(' ');
    	let h_night_n_day = h_rest[1].trim();

    	if (h_night_n_day === "PM" && home_hr_update !== 12) {
    		home_hr_update += 12;
    	}

    	let h_tz_date_str = home_time.toLocaleDateString("en-US", { timeZone: g_timezone });
    	let home_extract_day = h_tz_date_str.split('/')[1];

    	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    	let g_all_clocks = [
    		//
    		{
    			"label": "New York",
    			"timezone": "+6",
    			"tz_info": "America/New_York"
    		},
    		{
    			"label": "Boise",
    			"timezone": "+6",
    			"tz_info": "America/Boise"
    		},
    		{
    			"label": "Dublin",
    			"timezone": "+6",
    			"tz_info": "Europe/Dublin"
    		},
    		{
    			"label": "Gibraltar",
    			"timezone": "+6",
    			"tz_info": "Europe/Gibraltar"
    		},
    		{
    			"label": "London",
    			"timezone": "+6",
    			"tz_info": "Europe/London"
    		},
    		{
    			"label": "Berlin",
    			"timezone": "+6",
    			"tz_info": "Europe/Berlin"
    		},
    		{
    			"label": "Los Angeles",
    			"timezone": "+6",
    			"tz_info": "America/Los_Angeles"
    		},
    		{
    			"label": "Denver",
    			"timezone": "+6",
    			"tz_info": "America/Denver"
    		},
    		{
    			"label": "Chicago",
    			"timezone": "+6",
    			"tz_info": "America/Chicago"
    		},
    		{
    			"label": "Paris",
    			"timezone": "+6",
    			"tz_info": "Europe/Paris"
    		},
    		{
    			"label": "Vienna",
    			"timezone": "+6",
    			"tz_info": "Europe/Vienna"
    		},
    		{
    			"label": "Warsaw",
    			"timezone": "+6",
    			"tz_info": "Europe/Warsaw"
    		},
    		{
    			"label": "Auckland",
    			"timezone": "+6",
    			"tz_info": "Pacific/Auckland"
    		},
    		{
    			"label": "Tokyo",
    			"timezone": "+6",
    			"tz_info": "Asia/Tokyo"
    		},
    		{
    			"label": "Sydney",
    			"timezone": "+6",
    			"tz_info": "Australia/Sydney"
    		},
    		{
    			"label": "Singapore",
    			"timezone": "+6",
    			"tz_info": "Asia/Singapore"
    		},
    		{
    			"label": "Perth",
    			"timezone": "+6",
    			"tz_info": "Australia/Perth"
    		}
    	]; // 

    	const g_time_zone_clocks = [];

    	for (let tz of g_all_clocks) {
    		g_time_zone_clocks.push(tz.tz_info);
    	}

    	function select_time_zone(zone_pair) {
    		$$invalidate(19, tz_city = zone_pair.label);
    		$$invalidate(10, g_timezone = zone_pair.tz_info);
    		let time = new Date();
    		let tz_str = time.toLocaleTimeString("en-US", { timeZone: g_timezone });
    		let tparts = tz_str.split(':');
    		let hr_update = parseInt(tparts[0]);
    		let rest = tparts[2].split(' ');
    		let night_n_day = rest[1].trim();

    		if (night_n_day === "PM" && hr_update !== 12) {
    			hr_update += 12;
    		}

    		//
    		$$invalidate(18, g_timezone_shift = hr_update - home_hr_update);

    		let tz_date_str = time.toLocaleDateString("en-US", { timeZone: g_timezone });
    		let extract_day = tz_date_str.split('/')[1];

    		for (let a_thing of things) {
    			a_thing.time_zone = g_timezone;
    		}

    		((((((($$invalidate(3, things), $$invalidate(48, prev_day_event_count)), $$invalidate(0, day_event_count)), $$invalidate(1, current_day_data)), $$invalidate(2, current_thing)), $$invalidate(45, force_day_event_update)), $$invalidate(47, day_data)), $$invalidate(49, cal_update));
    		console.log(home_hr_update, h_night_n_day, h_tz_date_str, home_extract_day, "::", hr_update, night_n_day, tz_date_str, extract_day, "::> ", home_hr_update - hr_update);
    	}

    	function return_local_clock() {
    		let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    		//
    		let tz_parts = timezone.split('/');

    		let city = tz_parts[tz_parts.length - 1];

    		let original_tz = {
    			"label": city,
    			"timezone": "+6",
    			"tz_info": timezone
    		};

    		select_time_zone(original_tz);
    	}

    	const writable_props = ['name'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function g1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElt = $$value;
    			$$invalidate(6, canvasElt);
    		});
    	}

    	function svg0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			width_control = $$value;
    			$$invalidate(15, width_control);
    		});
    	}

    	function g2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			controllerElt = $$value;
    			$$invalidate(7, controllerElt);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			time_line_display = $$value;
    			$$invalidate(17, time_line_display);
    		});
    	}

    	function svg2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas_resizer = $$value;
    			$$invalidate(8, canvas_resizer);
    		});
    	}

    	function input_input_handler() {
    		box_delta = to_number(this.value);
    		$$invalidate(14, box_delta);
    	}

    	const click_handler = zone_pair => {
    		select_time_zone(zone_pair);
    	};

    	function div10_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			app_view = $$value;
    			$$invalidate(9, app_view);
    		});
    	}

    	function dayeventsrequests_day_event_count_binding(value) {
    		day_event_count = value;
    		$$invalidate(0, day_event_count);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(44, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		FullMonth: MonthFull,
    		Thing,
    		TimeSlotEditor,
    		DayEventsRequests,
    		RequestChangeAlerts,
    		ClockSelections,
    		ThingGrid,
    		FloatWindow,
    		Clock,
    		process_search_results,
    		place_data,
    		merge_data,
    		clonify,
    		make_empty_thing,
    		link_server_fetch,
    		popup_size,
    		get_search,
    		rect_to_time_slot,
    		time_slot_to_rect,
    		first_day_of_relative_month: F,
    		EventDays,
    		panzoom,
    		add_ws_endpoint,
    		tl_subr,
    		cnst,
    		local_presets,
    		timestamp_db,
    		onMount,
    		g_user_id,
    		DEFAULT_WS_CALENDAR_ACCESS,
    		ABRITRARY_MAX_CANVAS_HEIGHT,
    		ABRITRARY_MIN_CANVAS_HEIGHT,
    		ONE_HOUR,
    		ONE_HALF_HOUR,
    		ONE_QUARTER_HOUR,
    		ONE_QUARTER_HOUR_MINUTES,
    		ONE_HALF_HOUR_MINUTES,
    		USE_AS_BLOCK,
    		USE_AS_MEET,
    		USE_AS_ACTIVITY,
    		USE_AS_OPEN,
    		timeline_slider_height,
    		current_date,
    		title_months,
    		current_time_slot,
    		panzoomOptions,
    		x,
    		y,
    		canvasElt,
    		controllerElt,
    		panzoomInstance,
    		canvas_resizer,
    		app_view,
    		matching_slot,
    		update_calendars,
    		session,
    		going_session,
    		day_event_count,
    		MonthContainer,
    		Slot,
    		TimeSlotAgenda,
    		force_day_event_update,
    		g_timezone,
    		g_all_time_slots,
    		line_points,
    		info_points,
    		divider_starts,
    		division_width,
    		point,
    		left_shift,
    		info_delta,
    		g_slot_definitions,
    		g_active_slot_list,
    		original_info_points,
    		update_active_slot_list,
    		best_for_hour,
    		ReqSlot,
    		ManageableTSAgenda,
    		g_request_alert_parameters,
    		parameter_setup,
    		g_mo_gen,
    		day_data,
    		current_day_data,
    		prev_day_event_count,
    		data_stem,
    		qlist_ordering,
    		search_ordering,
    		search_topic,
    		current_roller_title,
    		model_month_entry,
    		thing_template,
    		fill_cal,
    		merge_calendars,
    		current_thing,
    		app_empty_object,
    		cal_update,
    		update_calendar,
    		window_scale,
    		all_window_scales,
    		g_last_known_transition,
    		g_canvas_tracking_start_point,
    		canvas_resizer_activate,
    		canvas_resizer_track,
    		canvas_resizer_end,
    		handleMessage,
    		handleEventPlanningMessage,
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
    		unload_data,
    		pre_data_fetcher,
    		data_fetcher,
    		deselect_all_selected_rects,
    		show_width_control,
    		hide_width_control,
    		g_starting_point,
    		g_update_point,
    		g_tracking_mouse,
    		c_TIME_SLOT_HEIGHT,
    		g_current_rect,
    		g_tracking_rect,
    		g_selected_svg_timeslot_rect,
    		width_control,
    		click_in_rect,
    		handle_click_in_rect,
    		g_selected_ts,
    		handle_editor,
    		place_rect_in_scalable,
    		handle_editor_end,
    		moving_mouse,
    		g_wc_start_point,
    		manage_width,
    		width_tracking,
    		width_end_tracking,
    		open_editor,
    		edit_op_possibly_delete,
    		handle_delete,
    		save_time_slot,
    		handle_time_slot_editor,
    		rect_to_time_slot_editor,
    		time_line_display,
    		time_line_slots_to_display,
    		load_data_from_db,
    		handleClick_send_update,
    		g_event_window_tstarts,
    		g_timezone_shift,
    		handleTimezoneUpdateMessage,
    		tz_city,
    		home_time,
    		g_home_timezone,
    		home_tz_str,
    		home_tparts,
    		home_hr_update,
    		h_rest,
    		h_night_n_day,
    		h_tz_date_str,
    		home_extract_day,
    		g_all_clocks,
    		g_time_zone_clocks,
    		select_time_zone,
    		return_local_clock,
    		launch_custom_clocks
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(44, name = $$props.name);
    		if ('g_user_id' in $$props) $$invalidate(21, g_user_id = $$props.g_user_id);
    		if ('timeline_slider_height' in $$props) $$invalidate(4, timeline_slider_height = $$props.timeline_slider_height);
    		if ('current_date' in $$props) current_date = $$props.current_date;
    		if ('title_months' in $$props) title_months = $$props.title_months;
    		if ('current_time_slot' in $$props) $$invalidate(5, current_time_slot = $$props.current_time_slot);
    		if ('panzoomOptions' in $$props) panzoomOptions = $$props.panzoomOptions;
    		if ('x' in $$props) x = $$props.x;
    		if ('y' in $$props) y = $$props.y;
    		if ('canvasElt' in $$props) $$invalidate(6, canvasElt = $$props.canvasElt);
    		if ('controllerElt' in $$props) $$invalidate(7, controllerElt = $$props.controllerElt);
    		if ('panzoomInstance' in $$props) panzoomInstance = $$props.panzoomInstance;
    		if ('canvas_resizer' in $$props) $$invalidate(8, canvas_resizer = $$props.canvas_resizer);
    		if ('app_view' in $$props) $$invalidate(9, app_view = $$props.app_view);
    		if ('session' in $$props) session = $$props.session;
    		if ('going_session' in $$props) going_session = $$props.going_session;
    		if ('day_event_count' in $$props) $$invalidate(0, day_event_count = $$props.day_event_count);
    		if ('force_day_event_update' in $$props) $$invalidate(45, force_day_event_update = $$props.force_day_event_update);
    		if ('g_timezone' in $$props) $$invalidate(10, g_timezone = $$props.g_timezone);
    		if ('g_all_time_slots' in $$props) g_all_time_slots = $$props.g_all_time_slots;
    		if ('line_points' in $$props) $$invalidate(22, line_points = $$props.line_points);
    		if ('info_points' in $$props) $$invalidate(11, info_points = $$props.info_points);
    		if ('divider_starts' in $$props) divider_starts = $$props.divider_starts;
    		if ('division_width' in $$props) $$invalidate(23, division_width = $$props.division_width);
    		if ('point' in $$props) $$invalidate(43, point = $$props.point);
    		if ('left_shift' in $$props) left_shift = $$props.left_shift;
    		if ('info_delta' in $$props) info_delta = $$props.info_delta;
    		if ('g_slot_definitions' in $$props) g_slot_definitions = $$props.g_slot_definitions;
    		if ('g_active_slot_list' in $$props) g_active_slot_list = $$props.g_active_slot_list;
    		if ('original_info_points' in $$props) original_info_points = $$props.original_info_points;
    		if ('g_request_alert_parameters' in $$props) $$invalidate(12, g_request_alert_parameters = $$props.g_request_alert_parameters);
    		if ('parameter_setup' in $$props) $$invalidate(46, parameter_setup = $$props.parameter_setup);
    		if ('g_mo_gen' in $$props) g_mo_gen = $$props.g_mo_gen;
    		if ('day_data' in $$props) $$invalidate(47, day_data = $$props.day_data);
    		if ('current_day_data' in $$props) $$invalidate(1, current_day_data = $$props.current_day_data);
    		if ('prev_day_event_count' in $$props) $$invalidate(48, prev_day_event_count = $$props.prev_day_event_count);
    		if ('data_stem' in $$props) data_stem = $$props.data_stem;
    		if ('qlist_ordering' in $$props) qlist_ordering = $$props.qlist_ordering;
    		if ('search_ordering' in $$props) search_ordering = $$props.search_ordering;
    		if ('search_topic' in $$props) search_topic = $$props.search_topic;
    		if ('current_roller_title' in $$props) current_roller_title = $$props.current_roller_title;
    		if ('model_month_entry' in $$props) model_month_entry = $$props.model_month_entry;
    		if ('thing_template' in $$props) thing_template = $$props.thing_template;
    		if ('current_thing' in $$props) $$invalidate(2, current_thing = $$props.current_thing);
    		if ('app_empty_object' in $$props) app_empty_object = $$props.app_empty_object;
    		if ('cal_update' in $$props) $$invalidate(49, cal_update = $$props.cal_update);
    		if ('window_scale' in $$props) window_scale = $$props.window_scale;
    		if ('all_window_scales' in $$props) $$invalidate(13, all_window_scales = $$props.all_window_scales);
    		if ('g_last_known_transition' in $$props) g_last_known_transition = $$props.g_last_known_transition;
    		if ('g_canvas_tracking_start_point' in $$props) g_canvas_tracking_start_point = $$props.g_canvas_tracking_start_point;
    		if ('things' in $$props) $$invalidate(3, things = $$props.things);
    		if ('other_things' in $$props) other_things = $$props.other_things;
    		if ('article_count' in $$props) article_count = $$props.article_count;
    		if ('article_index' in $$props) article_index = $$props.article_index;
    		if ('box_delta' in $$props) $$invalidate(14, box_delta = $$props.box_delta);
    		if ('g_starting_point' in $$props) g_starting_point = $$props.g_starting_point;
    		if ('g_update_point' in $$props) g_update_point = $$props.g_update_point;
    		if ('g_tracking_mouse' in $$props) g_tracking_mouse = $$props.g_tracking_mouse;
    		if ('g_current_rect' in $$props) g_current_rect = $$props.g_current_rect;
    		if ('g_tracking_rect' in $$props) g_tracking_rect = $$props.g_tracking_rect;
    		if ('g_selected_svg_timeslot_rect' in $$props) g_selected_svg_timeslot_rect = $$props.g_selected_svg_timeslot_rect;
    		if ('width_control' in $$props) $$invalidate(15, width_control = $$props.width_control);
    		if ('g_selected_ts' in $$props) $$invalidate(16, g_selected_ts = $$props.g_selected_ts);
    		if ('g_wc_start_point' in $$props) g_wc_start_point = $$props.g_wc_start_point;
    		if ('edit_op_possibly_delete' in $$props) edit_op_possibly_delete = $$props.edit_op_possibly_delete;
    		if ('time_line_display' in $$props) $$invalidate(17, time_line_display = $$props.time_line_display);
    		if ('g_event_window_tstarts' in $$props) g_event_window_tstarts = $$props.g_event_window_tstarts;
    		if ('g_timezone_shift' in $$props) $$invalidate(18, g_timezone_shift = $$props.g_timezone_shift);
    		if ('tz_city' in $$props) $$invalidate(19, tz_city = $$props.tz_city);
    		if ('home_time' in $$props) home_time = $$props.home_time;
    		if ('g_home_timezone' in $$props) g_home_timezone = $$props.g_home_timezone;
    		if ('home_tz_str' in $$props) home_tz_str = $$props.home_tz_str;
    		if ('home_tparts' in $$props) home_tparts = $$props.home_tparts;
    		if ('home_hr_update' in $$props) home_hr_update = $$props.home_hr_update;
    		if ('h_rest' in $$props) h_rest = $$props.h_rest;
    		if ('h_night_n_day' in $$props) h_night_n_day = $$props.h_night_n_day;
    		if ('h_tz_date_str' in $$props) h_tz_date_str = $$props.h_tz_date_str;
    		if ('home_extract_day' in $$props) home_extract_day = $$props.home_extract_day;
    		if ('g_all_clocks' in $$props) $$invalidate(20, g_all_clocks = $$props.g_all_clocks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*parameter_setup*/ 32768) {
    			$$invalidate(12, g_request_alert_parameters = parameter_setup);
    		}

    		if ($$self.$$.dirty[1] & /*day_data*/ 65536) {
    			$$invalidate(1, current_day_data = day_data);
    		}

    		if ($$self.$$.dirty[0] & /*day_event_count, current_day_data, current_thing, things*/ 15 | $$self.$$.dirty[1] & /*prev_day_event_count*/ 131072) {
    			if (prev_day_event_count != day_event_count) {
    				$$invalidate(48, prev_day_event_count = day_event_count);
    				$$invalidate(1, current_day_data.event_count = day_event_count, current_day_data);
    				$$invalidate(1, current_day_data.has_events = current_day_data.event_count > 0, current_day_data);
    				$$invalidate(2, current_thing.total_events = current_thing.total_events + 1, current_thing);
    				let agenda = current_thing.cal.map[current_day_data.key];

    				if (agenda) {
    					agenda.has_events = current_day_data.has_events;
    					agenda.event_count = current_day_data.event_count;
    				}

    				((((((($$invalidate(3, things), $$invalidate(48, prev_day_event_count)), $$invalidate(0, day_event_count)), $$invalidate(1, current_day_data)), $$invalidate(2, current_thing)), $$invalidate(45, force_day_event_update)), $$invalidate(47, day_data)), $$invalidate(49, cal_update));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*things*/ 8 | $$self.$$.dirty[1] & /*force_day_event_update*/ 16384) {
    			if (force_day_event_update) {
    				things[0];
    				((((((($$invalidate(3, things), $$invalidate(48, prev_day_event_count)), $$invalidate(0, day_event_count)), $$invalidate(1, current_day_data)), $$invalidate(2, current_thing)), $$invalidate(45, force_day_event_update)), $$invalidate(47, day_data)), $$invalidate(49, cal_update));
    				$$invalidate(45, force_day_event_update = false);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*cal_update*/ 262144) {
    			if (cal_update) {
    				$$invalidate(2, current_thing = cal_update);
    			}
    		}
    	};

    	return [
    		day_event_count,
    		current_day_data,
    		current_thing,
    		things,
    		timeline_slider_height,
    		current_time_slot,
    		canvasElt,
    		controllerElt,
    		canvas_resizer,
    		app_view,
    		g_timezone,
    		info_points,
    		g_request_alert_parameters,
    		all_window_scales,
    		box_delta,
    		width_control,
    		g_selected_ts,
    		time_line_display,
    		g_timezone_shift,
    		tz_city,
    		g_all_clocks,
    		g_user_id,
    		line_points,
    		division_width,
    		canvas_resizer_activate,
    		canvas_resizer_track,
    		canvas_resizer_end,
    		handleMessage,
    		handleEventPlanningMessage,
    		handleClick_remove,
    		handleClick_add,
    		handle_editor,
    		handle_editor_end,
    		moving_mouse,
    		manage_width,
    		width_tracking,
    		width_end_tracking,
    		handle_time_slot_editor,
    		handleClick_send_update,
    		handleTimezoneUpdateMessage,
    		g_time_zone_clocks,
    		select_time_zone,
    		return_local_clock,
    		point,
    		name,
    		force_day_event_update,
    		parameter_setup,
    		day_data,
    		prev_day_event_count,
    		cal_update,
    		g1_binding,
    		svg0_binding,
    		g2_binding,
    		div0_binding,
    		svg2_binding,
    		input_input_handler,
    		click_handler,
    		div10_binding,
    		dayeventsrequests_day_event_count_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 44 }, null, [-1, -1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[44] === undefined && !('name' in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
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

})();
//# sourceMappingURL=bundle.js.map
