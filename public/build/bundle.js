
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.27.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
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
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const activeTask = writable();

    class Task {
    	constructor(description='', expectedPomodoros=1) {
    		this.description = description;
    		this.expectedPomodoros = expectedPomodoros;
    		this.actualPomodoros = 0;
    	}
    }

    /* src/components/TaskList.svelte generated by Svelte v3.27.0 */
    const file = "src/components/TaskList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[16] = list;
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (46:0) {:else}
    function create_else_block(ctx) {
    	let ul;
    	let each_value = /*tasks*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1778ke3");
    			add_location(ul, file, 46, 1, 1002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$activeTask, tasks, removeTask, lastInput, selectTask*/ 107) {
    				each_value = /*tasks*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(46:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:0) {#if tasks.length === 0}
    function create_if_block_1(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "You haven't added any tasks yet.";
    			add_location(h3, file, 44, 1, 951);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(44:0) {#if tasks.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#each tasks as task}
    function create_each_block(ctx) {
    	let li;
    	let button0;
    	let t0;
    	let input0;
    	let t1;
    	let input1;
    	let t2;
    	let input2;
    	let t3;
    	let button1;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*task*/ ctx[15], ...args);
    	}

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[8].call(input0, /*each_value*/ ctx[16], /*task_index*/ ctx[17]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[10].call(input1, /*each_value*/ ctx[16], /*task_index*/ ctx[17]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[11].call(input2, /*each_value*/ ctx[16], /*task_index*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button0 = element("button");
    			t0 = space();
    			input0 = element("input");
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t5 = space();
    			attr_dev(button0, "class", "select-task svelte-1778ke3");
    			add_location(button0, file, 49, 4, 1079);
    			attr_dev(input0, "class", "description svelte-1778ke3");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 50, 4, 1155);
    			attr_dev(input1, "class", "pomodoros svelte-1778ke3");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file, 51, 4, 1251);
    			attr_dev(input2, "class", "pomodoros small svelte-1778ke3");
    			input2.disabled = true;
    			add_location(input2, file, 52, 4, 1331);
    			attr_dev(button1, "class", "svelte-1778ke3");
    			add_location(button1, file, 53, 4, 1410);
    			attr_dev(li, "class", "svelte-1778ke3");
    			toggle_class(li, "active", /*$activeTask*/ ctx[3] === /*task*/ ctx[15]);
    			add_location(li, file, 48, 3, 1034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button0);
    			append_dev(li, t0);
    			append_dev(li, input0);
    			set_input_value(input0, /*task*/ ctx[15].description);
    			/*input0_binding*/ ctx[9](input0);
    			append_dev(li, t1);
    			append_dev(li, input1);
    			set_input_value(input1, /*task*/ ctx[15].expectedPomodoros);
    			append_dev(li, t2);
    			append_dev(li, input2);
    			set_input_value(input2, /*task*/ ctx[15].actualPomodoros);
    			append_dev(li, t3);
    			append_dev(li, button1);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(input0, "input", input0_input_handler),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*removeTask*/ ctx[5](/*task*/ ctx[15]))) /*removeTask*/ ctx[5](/*task*/ ctx[15]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*tasks*/ 2 && input0.value !== /*task*/ ctx[15].description) {
    				set_input_value(input0, /*task*/ ctx[15].description);
    			}

    			if (dirty & /*tasks*/ 2 && to_number(input1.value) !== /*task*/ ctx[15].expectedPomodoros) {
    				set_input_value(input1, /*task*/ ctx[15].expectedPomodoros);
    			}

    			if (dirty & /*tasks*/ 2 && input2.value !== /*task*/ ctx[15].actualPomodoros) {
    				set_input_value(input2, /*task*/ ctx[15].actualPomodoros);
    			}

    			if (dirty & /*$activeTask, tasks*/ 10) {
    				toggle_class(li, "active", /*$activeTask*/ ctx[3] === /*task*/ ctx[15]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			/*input0_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(48:2) {#each tasks as task}",
    		ctx
    	});

    	return block;
    }

    // (62:0) {#if tasks.length !== 0}
    function create_if_block(ctx) {
    	let h3;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Today you will complete ");
    			t1 = text(/*allExpectedPomodoros*/ ctx[2]);
    			t2 = text(" pomodoros.");
    			add_location(h3, file, 62, 1, 1583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*allExpectedPomodoros*/ 4) set_data_dev(t1, /*allExpectedPomodoros*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(62:0) {#if tasks.length !== 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let button;
    	let t2;
    	let if_block1_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*tasks*/ ctx[1].length === 0) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*tasks*/ ctx[1].length !== 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t0 = space();
    			button = element("button");
    			button.textContent = "Add task";
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(button, "class", "primary");
    			add_location(button, file, 59, 0, 1495);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addTask*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			}

    			if (/*tasks*/ ctx[1].length !== 0) {
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
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

    function instance($$self, $$props, $$invalidate) {
    	let $activeTask;
    	validate_store(activeTask, "activeTask");
    	component_subscribe($$self, activeTask, $$value => $$invalidate(3, $activeTask = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TaskList", slots, []);
    	const dispatch = createEventDispatcher();
    	let taskPendingFocus = false;
    	let lastInput;
    	let tasks = [];

    	const addTask = () => {
    		$$invalidate(1, tasks = tasks.concat(new Task()));
    		taskPendingFocus = true;
    	};

    	const removeTask = task => {
    		const index = tasks.indexOf(task);

    		if ($activeTask === task) {
    			selectTask(undefined);
    		}

    		$$invalidate(1, tasks = [...tasks.slice(0, index), ...tasks.slice(index + 1)]);
    	};

    	const selectTask = task => {
    		set_store_value(activeTask, $activeTask = task, $activeTask);
    	};

    	const focusNewTask = () => {
    		if (taskPendingFocus && lastInput) {
    			lastInput.focus();
    			taskPendingFocus = false;
    		}
    	};

    	afterUpdate(focusNewTask);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TaskList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = task => selectTask(task);

    	function input0_input_handler(each_value, task_index) {
    		each_value[task_index].description = this.value;
    		$$invalidate(1, tasks);
    	}

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			lastInput = $$value;
    			$$invalidate(0, lastInput);
    		});
    	}

    	function input1_input_handler(each_value, task_index) {
    		each_value[task_index].expectedPomodoros = to_number(this.value);
    		$$invalidate(1, tasks);
    	}

    	function input2_input_handler(each_value, task_index) {
    		each_value[task_index].actualPomodoros = this.value;
    		$$invalidate(1, tasks);
    	}

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		createEventDispatcher,
    		get: get_store_value,
    		activeTask,
    		Task,
    		dispatch,
    		taskPendingFocus,
    		lastInput,
    		tasks,
    		addTask,
    		removeTask,
    		selectTask,
    		focusNewTask,
    		allExpectedPomodoros,
    		$activeTask
    	});

    	$$self.$inject_state = $$props => {
    		if ("taskPendingFocus" in $$props) taskPendingFocus = $$props.taskPendingFocus;
    		if ("lastInput" in $$props) $$invalidate(0, lastInput = $$props.lastInput);
    		if ("tasks" in $$props) $$invalidate(1, tasks = $$props.tasks);
    		if ("allExpectedPomodoros" in $$props) $$invalidate(2, allExpectedPomodoros = $$props.allExpectedPomodoros);
    	};

    	let allExpectedPomodoros;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tasks*/ 2) {
    			 $$invalidate(2, allExpectedPomodoros = tasks.reduce((acc, t) => acc + t.expectedPomodoros, 0));
    		}
    	};

    	return [
    		lastInput,
    		tasks,
    		allExpectedPomodoros,
    		$activeTask,
    		addTask,
    		removeTask,
    		selectTask,
    		click_handler,
    		input0_input_handler,
    		input0_binding,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class TaskList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaskList",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Timer.svelte generated by Svelte v3.27.0 */
    const file$1 = "src/components/Timer.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let time;
    	let t0_value = /*formatTime*/ ctx[4](/*pomodoroTime*/ ctx[1]) + "";
    	let t0;
    	let t1;
    	let footer;
    	let button0;
    	let t2;
    	let button0_disabled_value;
    	let t3;
    	let button1;
    	let t4;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			time = element("time");
    			t0 = text(t0_value);
    			t1 = space();
    			footer = element("footer");
    			button0 = element("button");
    			t2 = text("Start");
    			t3 = space();
    			button1 = element("button");
    			t4 = text("Cancel");
    			attr_dev(time, "class", "svelte-3d3yge");
    			add_location(time, file$1, 69, 1, 1689);
    			attr_dev(button0, "class", "primary");
    			button0.disabled = button0_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[3].idle || !/*$activeTask*/ ctx[2];
    			add_location(button0, file$1, 71, 2, 1741);
    			button1.disabled = button1_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[3].inProgress || !/*$activeTask*/ ctx[2];
    			add_location(button1, file$1, 72, 2, 1862);
    			add_location(footer, file$1, 70, 1, 1730);
    			add_location(section, file$1, 68, 0, 1678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, time);
    			append_dev(time, t0);
    			append_dev(section, t1);
    			append_dev(section, footer);
    			append_dev(footer, button0);
    			append_dev(button0, t2);
    			append_dev(footer, t3);
    			append_dev(footer, button1);
    			append_dev(button1, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*startPomodoro*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*cancelPomodoro*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pomodoroTime*/ 2 && t0_value !== (t0_value = /*formatTime*/ ctx[4](/*pomodoroTime*/ ctx[1]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*currentState, $activeTask*/ 5 && button0_disabled_value !== (button0_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[3].idle || !/*$activeTask*/ ctx[2])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*currentState, $activeTask*/ 5 && button1_disabled_value !== (button1_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[3].inProgress || !/*$activeTask*/ ctx[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
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
    	let $activeTask;
    	validate_store(activeTask, "activeTask");
    	component_subscribe($$self, activeTask, $$value => $$invalidate(2, $activeTask = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timer", slots, []);
    	const minutesToSeconds = minutes => minutes * 60;
    	const secondsToMinutes = seconds => Math.floor(seconds / 60);
    	const padWithZeroes = number => number.toString().padStart(2, "0");

    	const State = {
    		idle: "idle",
    		inProgress: "in progress",
    		resting: "resting"
    	};

    	const POMODORO_S = minutesToSeconds(25);
    	const LONG_BREAK_S = minutesToSeconds(20);
    	const SHORT_BREAK_S = minutesToSeconds(5);
    	let currentState = State.idle;
    	let pomodoroTime = POMODORO_S;
    	let completedPomodoros = 0;
    	let interval;

    	const formatTime = timeInSeconds => {
    		const minutes = secondsToMinutes(timeInSeconds);
    		const remainingSeconds = timeInSeconds % 60;
    		return `${padWithZeroes(minutes)}:${padWithZeroes(remainingSeconds)}`;
    	};

    	const startPomodoro = () => {
    		$$invalidate(0, currentState = State.inProgress);

    		interval = setInterval(
    			() => {
    				if (pomodoroTime === 0) {
    					completePomodoro();
    				}

    				$$invalidate(1, pomodoroTime -= 1);
    			},
    			1000
    		);
    	};

    	const completePomodoro = () => {
    		//clearInterval(interval);
    		set_store_value(activeTask, $activeTask.actualPomodoros++, $activeTask);

    		completedPomodoros++;

    		if (completedPomodoros === 4) {
    			rest(LONG_BREAK_S);
    			completedPomodoros = 0;
    		} else {
    			rest(SHORT_BREAK_S);
    		}
    	};

    	const cancelPomodoro = () => {
    		// TODO: Add some logic to prompt the user to write down the cause of cancelling the Pomodoro
    		idle();
    	};

    	const rest = time => {
    		$$invalidate(0, currentState = State.resting);
    		$$invalidate(1, pomodoroTime = time);

    		interval = setInterval(
    			() => {
    				if (pomodoroTime === 0) {
    					idle();
    				}

    				$$invalidate(1, pomodoroTime -= 1);
    			},
    			1000
    		);
    	};

    	const idle = () => {
    		$$invalidate(0, currentState = State.idle);
    		clearInterval(interval);
    		$$invalidate(1, pomodoroTime = POMODORO_S);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		activeTask,
    		minutesToSeconds,
    		secondsToMinutes,
    		padWithZeroes,
    		State,
    		POMODORO_S,
    		LONG_BREAK_S,
    		SHORT_BREAK_S,
    		currentState,
    		pomodoroTime,
    		completedPomodoros,
    		interval,
    		formatTime,
    		startPomodoro,
    		completePomodoro,
    		cancelPomodoro,
    		rest,
    		idle,
    		$activeTask
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentState" in $$props) $$invalidate(0, currentState = $$props.currentState);
    		if ("pomodoroTime" in $$props) $$invalidate(1, pomodoroTime = $$props.pomodoroTime);
    		if ("completedPomodoros" in $$props) completedPomodoros = $$props.completedPomodoros;
    		if ("interval" in $$props) interval = $$props.interval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentState,
    		pomodoroTime,
    		$activeTask,
    		State,
    		formatTime,
    		startPomodoro,
    		cancelPomodoro
    	];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.27.0 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let timer;
    	let t2;
    	let tasklist;
    	let current;

    	timer = new Timer({
    			props: { activeTask: /*activeTask*/ ctx[0] },
    			$$inline: true
    		});

    	tasklist = new TaskList({ $$inline: true });
    	tasklist.$on("taskSelected", /*updateActiveTask*/ ctx[2]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = `${/*title*/ ctx[1]}`;
    			t1 = space();
    			create_component(timer.$$.fragment);
    			t2 = space();
    			create_component(tasklist.$$.fragment);
    			attr_dev(h1, "class", "svelte-1xh0p44");
    			add_location(h1, file$2, 13, 1, 255);
    			attr_dev(main, "class", "svelte-1xh0p44");
    			add_location(main, file$2, 12, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(timer, main, null);
    			append_dev(main, t2);
    			mount_component(tasklist, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const timer_changes = {};
    			if (dirty & /*activeTask*/ 1) timer_changes.activeTask = /*activeTask*/ ctx[0];
    			timer.$set(timer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(tasklist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(tasklist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(timer);
    			destroy_component(tasklist);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let title = "Pomodoro Timer";
    	let activeTask;

    	const updateActiveTask = event => {
    		$$invalidate(0, activeTask = event.detail.task);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		TaskList,
    		Timer,
    		title,
    		activeTask,
    		updateActiveTask
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("activeTask" in $$props) $$invalidate(0, activeTask = $$props.activeTask);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activeTask, title, updateActiveTask];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
