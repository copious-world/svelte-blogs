function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
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
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
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
function children(element) {
    return Array.from(element.childNodes);
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
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
function beforeUpdate(fn) {
    get_current_component().$$.before_update.push(fn);
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
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
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
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
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
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
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
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
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

const debounce = (fn, ms = 0) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

function getRowsCount(items, cols) {
  return Math.max(
    ...items.map((val) => {
      const item = val[cols];
      return (item && item.y) + (item && item.h);
    }),
    1,
  );
}

const getColumn = (containerWidth, columns) => {
  try {
    let [_, cols] = columns
      .slice()
      .reverse()
      .find((value) => {
        const [width, cols] = value;
        return containerWidth <= width;
      });
    return cols;
  } catch {
    return columns[columns.length - 1];
  }
};

function getContainerHeight(items, yPerPx, cols) {
  return getRowsCount(items, cols) * yPerPx;
}

const makeMatrix = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

function findCloseBlocks(items, matrix, curObject) {
  const { h, x, y } = curObject;

  const w = Math.min(matrix[0].length, curObject.w);
  const tempR = matrix.slice(y, y + h);

  let result = [];
  for (var i = 0; i < tempR.length; i++) {
    let tempA = tempR[i].slice(x, x + w);
    result = [...result, ...tempA.map((val) => val.id && val.id !== curObject.id && val.id).filter(Boolean)];
  }

  return [...new Set(result)];
}

function makeMatrixFromItemsIgnore(items, ignoreList, _row, _col) {
  let matrix = makeMatrix(_row, _col);
  for (var i = 0; i < items.length; i++) {
    const value = items[i][_col];
    const id = items[i].id;
    const { x, y, h } = value;
    const w = Math.min(_col, value.w);

    if (ignoreList.indexOf(id) === -1) {
      for (var j = y; j < y + h; j++) {
        const row = matrix[j];
        if (row) {
          for (var k = x; k < x + w; k++) {
            row[k] = { ...value, id };
          }
        }
      }
    }
  }
  return matrix;
}

function findItemsById(closeBlocks, items) {
  return items.filter((value) => closeBlocks.indexOf(value.id) !== -1);
}

function getItemById(id, items) {
  return items.find((value) => value.id === id);
}

function findFreeSpaceForItem(matrix, item, items = []) {
  const cols = matrix[0].length;
  const w = Math.min(cols, item.w);
  let xNtime = cols - w;

  for (var i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    for (var j = 0; j < xNtime + 1; j++) {
      const sliceA = row.slice(j, j + w);
      const empty = sliceA.every((val) => val === undefined);
      if (empty) {
        const isEmpty = matrix.slice(i, i + item.h).every((a) => a.slice(j, j + w).every((n) => n === undefined));

        if (isEmpty) {
          return { y: i, x: j };
        }
      }
    }
  }

  return {
    y: getRowsCount(items, cols),
    x: 0,
  };
}

const getItem = (item, col) => {
  return { ...item[col], id: item.id };
};

const updateItem = (elements, active, position, col) => {
  return elements.map((value) => {
    if (value.id === active.id) {
      return { ...value, [col]: { ...value[col], ...position } };
    }
    return value;
  });
};

function moveItemsAroundItem(active, items, cols, original) {
  // Get current item from the breakpoint
  const activeItem = getItem(active, cols);
  const ids = items.map((value) => value.id).filter((value) => value !== activeItem.id);

  const els = items.filter((value) => value.id !== activeItem.id);

  // Update items
  let newItems = updateItem(items, active, activeItem, cols);

  let matrix = makeMatrixFromItemsIgnore(newItems, ids, getRowsCount(newItems, cols), cols);
  let tempItems = newItems;

  // Exclude resolved elements ids in array
  let exclude = [];

  els.forEach((item) => {
    // Find position for element
    let position = findFreeSpaceForItem(matrix, item[cols], tempItems);
    // Exclude item
    exclude.push(item.id);

    tempItems = updateItem(tempItems, item, position, cols);

    // Recreate ids of elements
    let getIgnoreItems = ids.filter((value) => exclude.indexOf(value) === -1);

    // Update matrix for next iteration
    matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
  });

  // Return result
  return tempItems;
}

function moveItem(active, items, cols, original) {
  // Get current item from the breakpoint
  const item = getItem(active, cols);
  // Create matrix from the items expect the active
  let matrix = makeMatrixFromItemsIgnore(items, [item.id], getRowsCount(items, cols), cols);
  // Getting the ids of items under active Array<String>
  const closeBlocks = findCloseBlocks(items, matrix, item);
  // Getting the objects of items under active Array<Object>
  let closeObj = findItemsById(closeBlocks, items);
  // Getting whenever of these items is fixed
  const fixed = closeObj.find((value) => value[cols].fixed);

  // If found fixed, reset the active to its original position
  if (fixed) return items;

  // Update items
  items = updateItem(items, active, item, cols);

  // Create matrix of items expect close elements
  matrix = makeMatrixFromItemsIgnore(items, closeBlocks, getRowsCount(items, cols), cols);

  // Create temp vars
  let tempItems = items;
  let tempCloseBlocks = closeBlocks;

  // Exclude resolved elements ids in array
  let exclude = [];

  // Iterate over close elements under active item
  closeObj.forEach((item) => {
    // Find position for element
    let position = findFreeSpaceForItem(matrix, item[cols], tempItems);
    // Exclude item
    exclude.push(item.id);

    // If position is found
    if (position) {
      // Assign the position to the element in the column
      tempItems = updateItem(tempItems, item, position, cols);

      // Recreate ids of elements
      let getIgnoreItems = tempCloseBlocks.filter((value) => exclude.indexOf(value) === -1);

      // Update matrix for next iteration
      matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
    }
  });

  // Return result
  return tempItems;
}

/* src/MoveResize/index.svelte generated by Svelte v3.30.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-p5p96u-style";
	style.textContent = ".svlt-grid-item.svelte-p5p96u{touch-action:none;position:absolute;background:#f1f1f1;will-change:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden}.svlt-grid-resizer.svelte-p5p96u{user-select:none;width:20px;height:20px;position:absolute;right:0;bottom:0;cursor:se-resize}.svlt-grid-resizer.svelte-p5p96u::after{content:\"\";position:absolute;right:3px;bottom:3px;width:5px;height:5px;border-right:2px solid rgba(0, 0, 0, 0.4);border-bottom:2px solid rgba(0, 0, 0, 0.4)}.no-user.svelte-p5p96u{backface-visibility:hidden;-webkit-backface-visibility:hidden;-moz-backface-visibility:hidden;-o-backface-visibility:hidden;-ms-backface-visibility:hidden;-webkit-user-drag:none;-moz-user-drag:none;-o-user-drag:none;user-drag:none;user-select:none}.active.svelte-p5p96u{z-index:3;cursor:grabbing}.shadow-active.svelte-p5p96u{z-index:2}.svlt-grid-shadow.svelte-p5p96u{position:absolute;background:red;will-change:transform;background:pink;backface-visibility:hidden;-webkit-backface-visibility:hidden}.transition.svelte-p5p96u{transition:all 0.2s}";
	append(document.head, style);
}

const get_default_slot_changes = dirty => ({});
const get_default_slot_context = ctx => ({ pointerdown: /*pointerdown*/ ctx[14] });

// (75:2) {#if resizable}
function create_if_block_1(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svlt-grid-resizer svelte-p5p96u");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "pointerdown", /*resizePointerDown*/ ctx[15]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (80:0) {#if active}
function create_if_block(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svlt-grid-shadow transition shadow-active svelte-p5p96u");
			set_style(div, "width", /*shadow*/ ctx[11].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
			set_style(div, "height", /*shadow*/ ctx[11].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
			set_style(div, "transform", "translate(" + (/*shadow*/ ctx[11].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[11].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*shadow, xPerPx, gapX*/ 2368) {
				set_style(div, "width", /*shadow*/ ctx[11].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
			}

			if (dirty[0] & /*shadow, yPerPx, gapY*/ 2688) {
				set_style(div, "height", /*shadow*/ ctx[11].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
			}

			if (dirty[0] & /*shadow, xPerPx, gapX, yPerPx, gapY*/ 3008) {
				set_style(div, "transform", "translate(" + (/*shadow*/ ctx[11].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[11].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
			}
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function create_fragment(ctx) {
	let div;
	let t0;
	let t1;
	let if_block1_anchor;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[22].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], get_default_slot_context);
	let if_block0 = /*resizable*/ ctx[4] && create_if_block_1(ctx);
	let if_block1 = /*active*/ ctx[12] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
			attr(div, "class", "svlt-grid-item svelte-p5p96u");

			set_style(div, "width", (/*active*/ ctx[12]
			? /*cloneBound*/ ctx[13].width
			: /*width*/ ctx[0]) + "px");

			set_style(div, "height", (/*active*/ ctx[12]
			? /*cloneBound*/ ctx[13].height
			: /*height*/ ctx[1]) + "px");

			set_style(div, "transform", "translate(" + (/*active*/ ctx[12]
			? /*cloneBound*/ ctx[13].left
			: /*left*/ ctx[2]) + "px, " + (/*active*/ ctx[12]
			? /*cloneBound*/ ctx[13].top
			: /*top*/ ctx[3]) + "px)");

			toggle_class(div, "transition", !/*active*/ ctx[12]);
			toggle_class(div, "active", /*active*/ ctx[12]);
			toggle_class(div, "no-user", /*active*/ ctx[12]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(div, t0);
			if (if_block0) if_block0.m(div, null);
			insert(target, t1, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(div, "pointerdown", function () {
					if (is_function(/*item*/ ctx[10] && /*item*/ ctx[10].custom
					? null
					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[14])) (/*item*/ ctx[10] && /*item*/ ctx[10].custom
					? null
					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[14]).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (default_slot) {
				if (default_slot.p && dirty[0] & /*$$scope*/ 2097152) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[21], dirty, get_default_slot_changes, get_default_slot_context);
				}
			}

			if (/*resizable*/ ctx[4]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (!current || dirty[0] & /*active, cloneBound, width*/ 12289) {
				set_style(div, "width", (/*active*/ ctx[12]
				? /*cloneBound*/ ctx[13].width
				: /*width*/ ctx[0]) + "px");
			}

			if (!current || dirty[0] & /*active, cloneBound, height*/ 12290) {
				set_style(div, "height", (/*active*/ ctx[12]
				? /*cloneBound*/ ctx[13].height
				: /*height*/ ctx[1]) + "px");
			}

			if (!current || dirty[0] & /*active, cloneBound, left, top*/ 12300) {
				set_style(div, "transform", "translate(" + (/*active*/ ctx[12]
				? /*cloneBound*/ ctx[13].left
				: /*left*/ ctx[2]) + "px, " + (/*active*/ ctx[12]
				? /*cloneBound*/ ctx[13].top
				: /*top*/ ctx[3]) + "px)");
			}

			if (dirty[0] & /*active*/ 4096) {
				toggle_class(div, "transition", !/*active*/ ctx[12]);
			}

			if (dirty[0] & /*active*/ 4096) {
				toggle_class(div, "active", /*active*/ ctx[12]);
			}

			if (dirty[0] & /*active*/ 4096) {
				toggle_class(div, "no-user", /*active*/ ctx[12]);
			}

			if (/*active*/ ctx[12]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
			if (if_block0) if_block0.d();
			if (detaching) detach(t1);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(if_block1_anchor);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { width } = $$props;
	let { height } = $$props;
	let { left } = $$props;
	let { top } = $$props;
	let { resizable } = $$props;
	let { draggable } = $$props;
	let { id } = $$props;
	let { xPerPx } = $$props;
	let { yPerPx } = $$props;
	let { gapX } = $$props;
	let { gapY } = $$props;
	let { item } = $$props;
	let { dynamic } = $$props;
	let { max } = $$props;
	let { min } = $$props;
	let { cols } = $$props;
	let shadow = {};
	let active = false;
	let debounce = false;
	let initX, initY;
	let xyRef = { x: left, y: top };
	let newXY = { x: 0, y: 0 };
	let cloneBound = { width, height, top, left };

	const inActivate = () => {
		$$invalidate(12, active = false);
		dispatch("pointerup", { id });
	};

	let repaint = cb => {
		dispatch("repaint", { id, shadow, onUpdate: cb });
	};

	beforeUpdate(() => {
		if (xPerPx && !debounce && item) {
			xyRef = { x: left, y: top };

			$$invalidate(11, shadow = {
				x: item.x,
				y: item.y,
				w: item.w,
				h: item.h
			});

			debounce = true;
		}
	});

	const pointerdown = ({ pageX, pageY, clientX, clientY }) => {
		initX = pageX;
		initY = pageY;
		$$invalidate(13, cloneBound = { width, height, top, left });
		debounce = false;
		$$invalidate(12, active = true);
		window.addEventListener("pointermove", pointermove);
		window.addEventListener("pointerup", pointerup);
		window.addEventListener("pointercancel", pointerup);
	};

	const pointermove = ({ pageX, pageY, clientX, clientY }) => {
		newXY = { x: initX - pageX, y: initY - pageY };
		$$invalidate(13, cloneBound.left = xyRef.x - newXY.x, cloneBound);
		$$invalidate(13, cloneBound.top = xyRef.y - newXY.y, cloneBound);
		let gridX = Math.round(cloneBound.left / xPerPx);
		let gridY = Math.round(cloneBound.top / yPerPx);
		$$invalidate(11, shadow.x = Math.max(Math.min(gridX, cols - shadow.w), 0), shadow);
		$$invalidate(11, shadow.y = Math.max(gridY, 0), shadow);
		if (dynamic) repaint();
	};

	const pointerup = e => {
		xyRef.x -= newXY.x;
		xyRef.y -= newXY.y;
		window.removeEventListener("pointerdown", pointerdown);
		window.removeEventListener("pointermove", pointermove);
		window.removeEventListener("pointerup", pointerup);
		window.removeEventListener("pointercancel", pointerup);
		repaint(inActivate);
	};

	// Resize
	let resizeInitX, resizeInitY;

	let initialWidth = 0;
	let initialHeight = 0;

	const resizePointerDown = e => {
		e.stopPropagation();
		const { pageX, pageY } = e;
		resizeInitX = pageX;
		resizeInitY = pageY;
		initialWidth = width;
		initialHeight = height;
		$$invalidate(13, cloneBound = { width, height, top, left });
		$$invalidate(12, active = true);
		const { x, y, w, h } = item;
		$$invalidate(11, shadow = { x, y, w, h });
		window.addEventListener("pointermove", resizePointerMove);
		window.addEventListener("pointerup", resizePointerUp);
		window.addEventListener("pointercancel", resizePointerUp);
	};

	const resizePointerMove = ({ pageX, pageY }) => {
		$$invalidate(13, cloneBound.width = initialWidth + pageX - resizeInitX, cloneBound);
		$$invalidate(13, cloneBound.height = initialHeight + pageY - resizeInitY, cloneBound);

		// Get max col number
		let maxWidth = cols - shadow.x;

		maxWidth = Math.min(max.w, maxWidth) || maxWidth;

		// Limit bound
		$$invalidate(13, cloneBound.width = Math.max(Math.min(cloneBound.width, maxWidth * xPerPx - gapX * 2), min.w * xPerPx - gapX * 2), cloneBound);

		$$invalidate(13, cloneBound.height = Math.max(cloneBound.height, min.h * yPerPx - gapY * 2), cloneBound);

		if (max.h) {
			$$invalidate(13, cloneBound.height = Math.min(cloneBound.height, max.h * yPerPx - gapY * 2), cloneBound);
		}

		// Limit col & row
		$$invalidate(11, shadow.w = Math.round(cloneBound.width / xPerPx), shadow);

		$$invalidate(11, shadow.h = Math.round(cloneBound.height / yPerPx), shadow);
		if (dynamic) repaint();
	};

	const resizePointerUp = e => {
		e.stopPropagation();
		repaint(inActivate);
		window.removeEventListener("pointermove", resizePointerMove);
		window.removeEventListener("pointerup", resizePointerUp);
		window.removeEventListener("pointercancel", resizePointerUp);
	};

	$$self.$$set = $$props => {
		if ("width" in $$props) $$invalidate(0, width = $$props.width);
		if ("height" in $$props) $$invalidate(1, height = $$props.height);
		if ("left" in $$props) $$invalidate(2, left = $$props.left);
		if ("top" in $$props) $$invalidate(3, top = $$props.top);
		if ("resizable" in $$props) $$invalidate(4, resizable = $$props.resizable);
		if ("draggable" in $$props) $$invalidate(5, draggable = $$props.draggable);
		if ("id" in $$props) $$invalidate(16, id = $$props.id);
		if ("xPerPx" in $$props) $$invalidate(6, xPerPx = $$props.xPerPx);
		if ("yPerPx" in $$props) $$invalidate(7, yPerPx = $$props.yPerPx);
		if ("gapX" in $$props) $$invalidate(8, gapX = $$props.gapX);
		if ("gapY" in $$props) $$invalidate(9, gapY = $$props.gapY);
		if ("item" in $$props) $$invalidate(10, item = $$props.item);
		if ("dynamic" in $$props) $$invalidate(17, dynamic = $$props.dynamic);
		if ("max" in $$props) $$invalidate(18, max = $$props.max);
		if ("min" in $$props) $$invalidate(19, min = $$props.min);
		if ("cols" in $$props) $$invalidate(20, cols = $$props.cols);
		if ("$$scope" in $$props) $$invalidate(21, $$scope = $$props.$$scope);
	};

	return [
		width,
		height,
		left,
		top,
		resizable,
		draggable,
		xPerPx,
		yPerPx,
		gapX,
		gapY,
		item,
		shadow,
		active,
		cloneBound,
		pointerdown,
		resizePointerDown,
		id,
		dynamic,
		max,
		min,
		cols,
		$$scope,
		slots
	];
}

class MoveResize extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-p5p96u-style")) add_css();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				width: 0,
				height: 1,
				left: 2,
				top: 3,
				resizable: 4,
				draggable: 5,
				id: 16,
				xPerPx: 6,
				yPerPx: 7,
				gapX: 8,
				gapY: 9,
				item: 10,
				dynamic: 17,
				max: 18,
				min: 19,
				cols: 20
			},
			[-1, -1]
		);
	}
}

/* src/index.svelte generated by Svelte v3.30.0 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-p0xk9p-style";
	style.textContent = ".svlt-grid-container.svelte-p0xk9p{position:relative}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[28] = list[i];
	child_ctx[30] = i;
	return child_ctx;
}

const get_default_slot_changes$1 = dirty => ({
	pointerdown: dirty[1] & /*pointerdown*/ 1,
	dataItem: dirty[0] & /*items*/ 1,
	item: dirty[0] & /*items, getComputedCols*/ 9,
	index: dirty[0] & /*items*/ 1
});

const get_default_slot_context$1 = ctx => ({
	pointerdown: /*pointerdown*/ ctx[31],
	dataItem: /*item*/ ctx[28],
	item: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]],
	index: /*i*/ ctx[30]
});

// (8:2) {#if xPerPx || !fastStart}
function create_if_block$1(ctx) {
	let each_blocks = [];
	let each_1_lookup = new Map();
	let each_1_anchor;
	let current;
	let each_value = /*items*/ ctx[0];
	const get_key = ctx => /*item*/ ctx[28].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*items, getComputedCols, xPerPx, yPerPx, gapX, gapY, dynamic, handleRepaint, pointerup, $$scope*/ 8392429 | dirty[1] & /*pointerdown*/ 1) {
				const each_value = /*items*/ ctx[0];
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d(detaching);
			}

			if (detaching) detach(each_1_anchor);
		}
	};
}

// (30:8) {#if item[getComputedCols]}
function create_if_block_1$1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[21].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], get_default_slot_context$1);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty[0] & /*$$scope, items, getComputedCols*/ 8388617 | dirty[1] & /*pointerdown*/ 1) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_default_slot_changes$1, get_default_slot_context$1);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (10:6) <MoveResize         on:repaint={handleRepaint}         on:pointerup={pointerup}         id={item.id}         resizable={item[getComputedCols] && item[getComputedCols].resizable}         draggable={item[getComputedCols] && item[getComputedCols].draggable}         {xPerPx}         {yPerPx}         width={Math.min(getComputedCols, item[getComputedCols] && item[getComputedCols].w) * xPerPx - gapX * 2}         height={(item[getComputedCols] && item[getComputedCols].h) * yPerPx - gapY * 2}         top={(item[getComputedCols] && item[getComputedCols].y) * yPerPx + gapY}         left={(item[getComputedCols] && item[getComputedCols].x) * xPerPx + gapX}         item={item[getComputedCols]}         min={item[getComputedCols] && item[getComputedCols].min}         max={item[getComputedCols] && item[getComputedCols].max}         {dynamic}         cols={getComputedCols}         {gapX}         {gapY}         let:pointerdown>
function create_default_slot(ctx) {
	let t;
	let current;
	let if_block = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && create_if_block_1$1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			t = space();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, t, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*items, getComputedCols*/ 9) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(t.parentNode, t);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t);
		}
	};
}

// (9:4) {#each items as item, i (item.id)}
function create_each_block(key_1, ctx) {
	let first;
	let moveresize;
	let current;

	moveresize = new MoveResize({
			props: {
				id: /*item*/ ctx[28].id,
				resizable: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].resizable,
				draggable: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].draggable,
				xPerPx: /*xPerPx*/ ctx[5],
				yPerPx: /*yPerPx*/ ctx[9],
				width: Math.min(/*getComputedCols*/ ctx[3], /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].w) * /*xPerPx*/ ctx[5] - /*gapX*/ ctx[6] * 2,
				height: (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].h) * /*yPerPx*/ ctx[9] - /*gapY*/ ctx[7] * 2,
				top: (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].y) * /*yPerPx*/ ctx[9] + /*gapY*/ ctx[7],
				left: (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].x) * /*xPerPx*/ ctx[5] + /*gapX*/ ctx[6],
				item: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]],
				min: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].min,
				max: /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].max,
				dynamic: /*dynamic*/ ctx[2],
				cols: /*getComputedCols*/ ctx[3],
				gapX: /*gapX*/ ctx[6],
				gapY: /*gapY*/ ctx[7],
				$$slots: {
					default: [
						create_default_slot,
						({ pointerdown }) => ({ 31: pointerdown }),
						({ pointerdown }) => [0, pointerdown ? 1 : 0]
					]
				},
				$$scope: { ctx }
			}
		});

	moveresize.$on("repaint", /*handleRepaint*/ ctx[11]);
	moveresize.$on("pointerup", /*pointerup*/ ctx[10]);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(moveresize.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(moveresize, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const moveresize_changes = {};
			if (dirty[0] & /*items*/ 1) moveresize_changes.id = /*item*/ ctx[28].id;
			if (dirty[0] & /*items, getComputedCols*/ 9) moveresize_changes.resizable = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].resizable;
			if (dirty[0] & /*items, getComputedCols*/ 9) moveresize_changes.draggable = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].draggable;
			if (dirty[0] & /*xPerPx*/ 32) moveresize_changes.xPerPx = /*xPerPx*/ ctx[5];
			if (dirty[0] & /*getComputedCols, items, xPerPx, gapX*/ 105) moveresize_changes.width = Math.min(/*getComputedCols*/ ctx[3], /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].w) * /*xPerPx*/ ctx[5] - /*gapX*/ ctx[6] * 2;
			if (dirty[0] & /*items, getComputedCols, gapY*/ 137) moveresize_changes.height = (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].h) * /*yPerPx*/ ctx[9] - /*gapY*/ ctx[7] * 2;
			if (dirty[0] & /*items, getComputedCols, gapY*/ 137) moveresize_changes.top = (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].y) * /*yPerPx*/ ctx[9] + /*gapY*/ ctx[7];
			if (dirty[0] & /*items, getComputedCols, xPerPx, gapX*/ 105) moveresize_changes.left = (/*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].x) * /*xPerPx*/ ctx[5] + /*gapX*/ ctx[6];
			if (dirty[0] & /*items, getComputedCols*/ 9) moveresize_changes.item = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]];
			if (dirty[0] & /*items, getComputedCols*/ 9) moveresize_changes.min = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].min;
			if (dirty[0] & /*items, getComputedCols*/ 9) moveresize_changes.max = /*item*/ ctx[28][/*getComputedCols*/ ctx[3]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[3]].max;
			if (dirty[0] & /*dynamic*/ 4) moveresize_changes.dynamic = /*dynamic*/ ctx[2];
			if (dirty[0] & /*getComputedCols*/ 8) moveresize_changes.cols = /*getComputedCols*/ ctx[3];
			if (dirty[0] & /*gapX*/ 64) moveresize_changes.gapX = /*gapX*/ ctx[6];
			if (dirty[0] & /*gapY*/ 128) moveresize_changes.gapY = /*gapY*/ ctx[7];

			if (dirty[0] & /*$$scope, items, getComputedCols*/ 8388617 | dirty[1] & /*pointerdown*/ 1) {
				moveresize_changes.$$scope = { dirty, ctx };
			}

			moveresize.$set(moveresize_changes);
		},
		i(local) {
			if (current) return;
			transition_in(moveresize.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(moveresize.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(moveresize, detaching);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let current;
	let if_block = (/*xPerPx*/ ctx[5] || !/*fastStart*/ ctx[1]) && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "svlt-grid-container svelte-p0xk9p");
			set_style(div, "height", /*containerHeight*/ ctx[8] + "px");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[22](div);
			current = true;
		},
		p(ctx, dirty) {
			if (/*xPerPx*/ ctx[5] || !/*fastStart*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*xPerPx, fastStart*/ 34) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*containerHeight*/ 256) {
				set_style(div, "height", /*containerHeight*/ ctx[8] + "px");
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			/*div_binding*/ ctx[22](null);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { fillSpace = false } = $$props;
	let { items } = $$props;
	let { rowHeight } = $$props;
	let { cols } = $$props;
	let { gap = [10, 10] } = $$props;
	let { dynamicCols = true } = $$props;
	let { fastStart = false } = $$props;
	let { debounceUpdate = 100 } = $$props;
	let { debounceResize = 100 } = $$props;
	let { dynamic = false } = $$props;
	let getComputedCols;
	let container;
	let xPerPx = 0;
	let yPerPx = rowHeight;
	let containerWidth;
	let prevCols;

	const pointerup = ev => {
		dispatch("pointerup", { id: ev.detail.id, cols: getComputedCols });
	};

	const onResize = debounce(
		() => {
			dispatch("resize", {
				cols: getComputedCols,
				xPerPx,
				yPerPx,
				width: containerWidth
			});
		},
		debounceResize
	);

	onMount(() => {
		const sizeObserver = new ResizeObserver(entries => {
				let width = entries[0].contentRect.width;
				if (width === containerWidth) return;
				$$invalidate(3, getComputedCols = getColumn(width, cols));
				$$invalidate(5, xPerPx = width / getComputedCols);

				if (!containerWidth) {
					dispatch("mount", {
						cols: getComputedCols,
						xPerPx,
						yPerPx, // same as rowHeight
						
					});
				} else {
					onResize();
				}

				$$invalidate(19, containerWidth = width);
			});

		sizeObserver.observe(container);
		return () => sizeObserver.disconnect();
	});

	const updateMatrix = ({ detail }) => {
		let activeItem = getItemById(detail.id, items);

		if (activeItem) {
			activeItem = {
				...activeItem,
				[getComputedCols]: {
					...activeItem[getComputedCols],
					...detail.shadow
				}
			};

			if (fillSpace) {
				$$invalidate(0, items = moveItemsAroundItem(activeItem, items, getComputedCols, getItemById(detail.id, items)));
			} else {
				$$invalidate(0, items = moveItem(activeItem, items, getComputedCols, getItemById(detail.id, items)));
			}

			if (detail.onUpdate) detail.onUpdate();

			dispatch("change", {
				unsafeItem: activeItem,
				id: activeItem.id,
				cols: getComputedCols
			});
		}
	};

	const handleRepaint = debounce(updateMatrix, debounceUpdate);

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			container = $$value;
			$$invalidate(4, container);
		});
	}

	$$self.$$set = $$props => {
		if ("fillSpace" in $$props) $$invalidate(12, fillSpace = $$props.fillSpace);
		if ("items" in $$props) $$invalidate(0, items = $$props.items);
		if ("rowHeight" in $$props) $$invalidate(13, rowHeight = $$props.rowHeight);
		if ("cols" in $$props) $$invalidate(14, cols = $$props.cols);
		if ("gap" in $$props) $$invalidate(15, gap = $$props.gap);
		if ("dynamicCols" in $$props) $$invalidate(16, dynamicCols = $$props.dynamicCols);
		if ("fastStart" in $$props) $$invalidate(1, fastStart = $$props.fastStart);
		if ("debounceUpdate" in $$props) $$invalidate(17, debounceUpdate = $$props.debounceUpdate);
		if ("debounceResize" in $$props) $$invalidate(18, debounceResize = $$props.debounceResize);
		if ("dynamic" in $$props) $$invalidate(2, dynamic = $$props.dynamic);
		if ("$$scope" in $$props) $$invalidate(23, $$scope = $$props.$$scope);
	};

	let gapX;
	let gapY;
	let containerHeight;

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*gap*/ 32768) {
			 $$invalidate(6, [gapX, gapY] = gap, gapX, ($$invalidate(7, gapY), $$invalidate(15, gap)));
		}

		if ($$self.$$.dirty[0] & /*items, getComputedCols*/ 9) {
			 $$invalidate(8, containerHeight = getContainerHeight(items, yPerPx, getComputedCols));
		}

		if ($$self.$$.dirty[0] & /*prevCols, cols, dynamicCols, containerWidth*/ 1654784) {
			 {
				if (prevCols !== cols && dynamicCols) {
					$$invalidate(5, xPerPx = containerWidth / cols);
				}

				$$invalidate(20, prevCols = cols);
			}
		}
	};

	return [
		items,
		fastStart,
		dynamic,
		getComputedCols,
		container,
		xPerPx,
		gapX,
		gapY,
		containerHeight,
		yPerPx,
		pointerup,
		handleRepaint,
		fillSpace,
		rowHeight,
		cols,
		gap,
		dynamicCols,
		debounceUpdate,
		debounceResize,
		containerWidth,
		prevCols,
		slots,
		div_binding,
		$$scope
	];
}

class Src extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-p0xk9p-style")) add_css$1();

		init(
			this,
			options,
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				fillSpace: 12,
				items: 0,
				rowHeight: 13,
				cols: 14,
				gap: 15,
				dynamicCols: 16,
				fastStart: 1,
				debounceUpdate: 17,
				debounceResize: 18,
				dynamic: 2
			},
			[-1, -1]
		);
	}
}

export default Src;
