/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                          ____       ____
 *                          \   \     /   /
 *                           \    \_/    /
 *                      .   .-           -.   .
 *                     /|  /   -.     .-   \  |\
 *                    | \_/  |___\   /___|  \_/ |
 *                    .                         .
 *                     \.__       ___       __./
 *                         /     /   \     \ 
 *                        /_____/     \_____\
 *         
 *                     Copyright (c) 2022 Eric M.
 * 
 *     This file is part of X.O.W.S (XMPP Over WebSocket Library).
 * 
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 * 
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source
 * 
 * @licend
 */
/* ------------------------------------------------------------------
 * 
 *                     DOM Managment API Module
 * 
 * ------------------------------------------------------------------ */

/**
 * Reference list to current document used DOM objects
 */
const xows_doc = {};

/**
 * Object that stores backed documents Fragments.
 */
const xows_doc_frag_db = {};

/**
 * Variable to hold scroll position of the last loading checkup to 
 * prevent useless flood while scrolling.
 */
let xows_doc_loader_scroll = {"top":99999,"off":0}; 

/**
 * Current target of the lazy loader, this is the element with 
 * monitored scrolling which the inner medias are checked for loading.
 */
let xows_doc_loader_client = null;

/**
 * Placeholder source attribute name to get media source URL.
 */
let xows_doc_loader_attrib = "";

/**
 * Array of objects to be checked against viewport for Lazy loading.
 */
const xows_doc_loader_stack = [];

/**
 * Global reference to document's Selection object
 */
const xows_doc_sel = document.getSelection();

/**
 * Global reference to temporary selection Range object
 */
const xows_doc_rng = document.createRange();

/**
 * Create local reference of the specified DOM object
 * 
 * @param {string}  id  Element id to cache
 */
function xows_doc_cache(id)
{
  xows_doc[id] = document.getElementById(id);
}

/**
 * Add an event listener to the specified object with proper options
 * 
 * @param {object}    element   Element to add event listener to.
 * @param {string}    event     Event type to listen.
 * @param {function}  callback  Callback function for event listener
 * @param {boolean}   [passive] Optional force enable or disable passive.
 * @param {boolean}   [capture] Optional force enable or disable capture mode.
 */
function xows_doc_listener_add(element, event, callback, passive = true, capture = false)
{
  element.addEventListener(event,callback,{capture:capture,passive:passive});
}

/**
 * Remove an event listener from the specified object
 * 
 * @param {object}    element  Element to add event listener to.
 * @param {string}    event    Event type to listen.
 * @param {function}  callback Callback function for event listener.
 * @param {boolean}   [passive] Optional force enable or disable passive.
 * @param {boolean}   [capture] Optional force enable or disable capture mode.
 */
function xows_doc_listener_rem(element, event, callback, passive = true, capture = false)
{
  element.removeEventListener(event,callback,{capture:capture,passive:passive});
}

/**
 * Add an event listener to selected children nodes of the specified 
 * object with proper options.
 * 
 * @param {object}    element   Element to add event listener to.
 * @param {string}    select    CSS selectors string to select children.
 * @param {string}    event     Event type to listen.
 * @param {function}  callback  Callback function for event listener.
 * @param {boolean}   [passive] Optional force enable or disable passive.
 */
function xows_doc_listener_add_select(element, select, event, callback, passive = true)
{
  const nodes = element.querySelectorAll(select);
  let i = nodes.length;
  while(i--) nodes[i].addEventListener(event,callback,{capture:false,passive:passive});
  
}

/**
 * Remove an event listener from selected children of the specified  
 * object with proper options.
 * 
 * @param {object}    element   Element to add event listener to.
 * @param {string}    select    CSS selectors string to select children.
 * @param {string}    event     Event type to listen.
 * @param {function}  callback  Callback function for event listener.
 * @param {boolean}   [passive] Optional force enable or disable passive.
 */
function xows_doc_listener_rem_select(element, select, event, callback, passive = true)
{
  const nodes = element.querySelectorAll(select);
  let i = nodes.length;
  while(i--) nodes[i].removeEventListener(event,callback,{capture:false,passive:passive});
  
}

/**
 * Chechk whether element has class in its class list.
 * 
 * @param {string}  id        Cached element id. 
 * @param {string}  clsname   Class name.
 */
function xows_doc_cls_has(id, clsname)
{
  return xows_doc[id].classList.contains(clsname);
}

/**
 * Toggle the specified class in element class list.
 * 
 * @param {string}  id        Cached element id. 
 * @param {string}  clsname   Class name.
 */
function xows_doc_cls_tog(id, clsname)
{
  return xows_doc[id].classList.toggle(clsname);
}

/**
 * Add the specified class to element class list.
 * 
 * @param {string}  id        Cached element id. 
 * @param {string}  clsname   Class name.
 */
function xows_doc_cls_add(id, clsname)
{
  xows_doc[id].classList.add(clsname);
}

/**
 * Remove the specified class to element class list.
 * 
 * @param {string}  id        Cached element id. 
 * @param {string}  clsname   Class name.
 */
function xows_doc_cls_rem(id, clsname)
{
  xows_doc[id].classList.remove(clsname);
}

/**
 * Add or remove the specified class to/from element class list.
 * 
 * @param {string}  id        Cached element id. 
 * @param {string}  clsname   Class name.
 * @param {boolean} add       Boolean to add or remove class.
 */
function xows_doc_cls_set(id, clsname, add)
{
  add ? xows_doc[id].classList.add(clsname) 
      : xows_doc[id].classList.remove(clsname);
}

/**
 * Show the specified item, either element object or id.
 * 
 * @param {string}  id        Cached element id.  
 */
function xows_doc_show(id)
{
  xows_doc[id].classList.remove("HIDDEN");
}

/**
 * Hide the specified item, either element object or id.
 * 
 * @param {string}  id        Cached element id.  
 */
function xows_doc_hide(id)
{
  xows_doc[id].classList.add("HIDDEN");
}

/**
 * Show or hide the specified item, either element object or id.
 * 
 * @param {string}  id        Cached element id.  
 * @param {boolean} hidden    Boolean to show or hide.
 */
function xows_doc_hidden_set(id, hidden)
{
  hidden  ? xows_doc[id].classList.add("HIDDEN") 
        : xows_doc[id].classList.remove("HIDDEN");
}

/**
 * Check whether the specified item, either element object or id is
 * hidden (has the .hidden class).
 * 
 * @param {string}  id        Cached element id.  
 *   
 * @return  {boolean}   True if element is visible, false otherwise.
 */
function xows_doc_hidden(id)
{
  return xows_doc[id].classList.contains("HIDDEN");
}

/**
 * Clone specified element from source to destination 
 * offscreen slots. 
 * 
 * @param {string}  dst       Destination offscreen slot identifier.
 * @param {string}  src       Source offscreen slot identifier.
 * @param {string}  element   Root element id.
 */
function xows_doc_frag_clone(dst, src, element)
{
  // create slot if required
  if(!xows_doc_frag_db[dst]) 
    xows_doc_frag_db[dst] = {};

  let s, d;
  
  // set source and destination
  s = xows_doc_frag_db[src][element];
  d = xows_doc_frag_db[dst][element] = document.createDocumentFragment();
  
  // clone source nodes to destination
  for(let i = 0, n = s.childNodes.length; i < n; ++i)
    d.appendChild(s.childNodes[i].cloneNode(true));
}

/**
 * Backup specified element content to an offscreen document fragment. 
 * 
 * @param {string}  slot      Offscreen slot identifier.
 * @param {string}  element   Root element id.
 * @param {boolean} clone     Clone nodes.
 */
function xows_doc_frag_export(slot, element, clone)
{
  // create slot if required
  if(!xows_doc_frag_db[slot]) 
    xows_doc_frag_db[slot] = {};
  
  let s, d;
  
  // set source and destination
  s = xows_doc[element];
  d = xows_doc_frag_db[slot][element] = document.createDocumentFragment();

  if(clone) {
    
    // clone children from document to fragment
    for(let i = 0, n = s.childNodes.length; i < n; ++i)
      d.appendChild(s.childNodes[i].cloneNode(true));
      
  } else {
    
    // move children from fragment to document
    while(s.childNodes.length) 
      d.appendChild(s.firstChild);
      
  }
}

/**
 * Restore specified element from offscreen fragment. 
 * 
 * @param {string}  slot      Offscreen slot identifier.
 * @param {string}  element   Root element id.
 * @param {boolean} clone     Clone nodes.
 */
function xows_doc_frag_import(slot, element, clone)
{
  if(xows_doc_frag_db[slot]) {
    
    let s, d, e;
    
    // set source and destination
    s = xows_doc_frag_db[slot][element];
    d = xows_doc[element];
    
    // empty destination
    xows_doc[element].innerText = "";
    
    if(clone) {
      
      // clone children from fragment to document
      for(let i = 0, n = s.childNodes.length; i < n; ++i) {
        e = d.appendChild(s.childNodes[i].cloneNode(true));
        if(e.id) xows_doc[e.id] = e; //< replace document cached elements
        
      }
      
    } else {
      
      // move children from fragment to document
      while(s.childNodes.length) {
        e = d.appendChild(s.firstChild);
        if(e.id) xows_doc[e.id] = e; //< replace document cached elements
        
      }
    }
  }
}

/**
 * Delete specified offscreen document fragment. 
 * 
 * @param {string}  slot      Offscreen slot identifier.
 */
function xows_doc_frag_delete(slot) 
{
  delete xows_doc_frag_db[slot];
}

/**
 * Delete all offscreen document fragment. 
 */
function xows_doc_frag_clear() 
{
  for(const slot in xows_doc_frag_db)
    delete xows_doc_frag_db[slot];
}

/**
 * Get offscreen slot saved root element.
 * 
 * @param {string}  slot      Offscreen slot identifier.
 * @param {string}  element   Root element id.
 */
function xows_doc_frag_element(slot, element)
{
  return xows_doc_frag_db[slot] ? xows_doc_frag_db[slot][element] : null;
}

/**
 * Get element within backed document fragment element.
 * 
 * @param {string}  slot      Offscreen slot identifier.
 * @param {string}  id        Child element id to search.
 */
function xows_doc_frag_find(slot, id)
{
  if(xows_doc_frag_db[slot] && xows_doc_frag_db[slot][id])
    return xows_doc_frag_db[slot][id];
  
  let node;
  
  for(const element in xows_doc_frag_db[slot]) {
    if(node = xows_doc_frag_db[slot][element].getElementById(id))
      return node;
  }
  
  return null;
}

/**
 * Find child element with specified id in offscreen root element.
 * 
 * @param {string}  slot      Offscreen slot identifier.
 * @param {string}  element   Root element id.
 * @param {string}  id        Child element id to search.
 */
function xows_doc_frag_element_find(slot, element, id)
{
  if(xows_doc_frag_db[slot] && xows_doc_frag_db[slot][element]) 
    return xows_doc_frag_db[slot][element].getElementById(id);
}

/**
 * Set edition caret either before or after the specified node.
 * 
 * @param {object}    node    Reference node to position caret.
 * @param {object}    before  Place caret before of node.
 */
function xows_doc_caret_around(node, before = false)
{
  xows_doc_sel.removeAllRanges();
  xows_doc_rng.setStartBefore(node);
  xows_doc_rng.setEndAfter(node);
  xows_doc_rng.collapse(before);
  xows_doc_sel.addRange(xows_doc_rng);
}

/**
 * Set edition caret in the specified node.
 * 
 * @param {object}    node    Node to position caret in.
 * @param {boolean}   start   Place caret at beginning of content.
 */
function xows_doc_caret_at(node, start = false)
{
  xows_doc_sel.removeAllRanges();
  xows_doc_rng.selectNodeContents(node);
  xows_doc_rng.collapse(start);
  xows_doc_sel.addRange(xows_doc_rng);
}

/**
 * Get current document selection range
 * 
 * @param {number}  index     The zero-based index of the range to return.
 */
function xows_doc_sel_rng(index) 
{
  return xows_doc_sel.getRangeAt(index);
}


/**
 * Remove all <li> elements of the specified DOM object.
 * 
 * @param {string}  id        Cached element id.  
 */
function xows_doc_list_clean(id)
{
  const child = xows_doc[id].querySelectorAll("LI");
  let i = child.length;
  while(i--) child[i].parentNode.removeChild(child[i]);
}

/**
 * Initializes document manager and browser interactions. 
 * 
 * This function cache the static document elements for fast access and 
 * setup the nécessary listeners and the callbacks for user and client 
 * interactions.
 * 
 * @param {object}    onready   Callback function to be called once 
 *                                templates successfully loaded.
 */
function xows_doc_init(onready)
{
  // Localy store references to all DOM elements with an id
  const element = document.querySelectorAll("[id]");
  let i = element.length;
  while(i--) xows_doc_cache(element[i].id);

  // Main Page "scr_main" event listeners
  xows_doc_listener_add(xows_doc.main_tabs,   "click",    xows_gui_rost_widen); //< capture mode
  xows_doc_listener_add(xows_doc.main_hndr,   "click",    xows_gui_main_open);
  xows_doc_listener_add(xows_doc.main_hndl,   "click",    xows_gui_main_open);
  
  xows_doc_listener_add(xows_doc.rost_tabs,   "click",    xows_gui_rost_tabs_onclick);
  xows_doc_listener_add(xows_doc.cont_list,   "click",    xows_gui_rost_list_onclick);
  xows_doc_listener_add(xows_doc.room_list,   "click",    xows_gui_rost_list_onclick);
  xows_doc_listener_add(xows_doc.cont_add,    "click",    xows_gui_page_cont_open);
  xows_doc_listener_add(xows_doc.room_add,    "click",    xows_gui_room_add_onclick);
  xows_doc_listener_add(xows_doc.room_upd,    "click",    xows_gui_room_list_reload);
  
  xows_doc_listener_add(xows_doc.menu_show,   "click",    xows_gui_menu_show_onclick);
  xows_doc_listener_add(xows_doc.drop_show,   "click",    xows_gui_menu_show_onclick);
  xows_doc_listener_add(xows_doc.menu_user,   "click",    xows_gui_page_user_open);
  xows_doc_listener_add(xows_doc.user_stat,   "keypress", xows_gui_user_stat_onkeyp);
  xows_doc_listener_add(xows_doc.user_stat,   "blur",     xows_gui_user_stat_onblur);
  
  // Chat header
  xows_doc_listener_add(xows_doc.chat_meta,   "keypress", xows_gui_chat_meta_onkeyp);
  xows_doc_listener_add(xows_doc.chat_meta,   "blur",     xows_gui_chat_meta_onblur);
  xows_doc_listener_add(xows_doc.chat_noti,   "click",    xows_gui_chat_noti_onclick);
  xows_doc_listener_add(xows_doc.chat_conf,   "click",    xows_gui_chat_conf_onclick);
  xows_doc_listener_add(xows_doc.chat_occu,   "click",    xows_gui_chat_occu_onclick);
  xows_doc_listener_add(xows_doc.chat_book,   "click",    xows_gui_chat_book_onclick);
  
  // Chat main
  xows_doc_listener_add(xows_doc.chat_main,   "scroll",   xows_gui_chat_main_onscroll);
  xows_doc_listener_add(xows_doc.chat_main,   "click",    xows_gui_chat_main_onclick);
  
  // Chat foot
  xows_doc_listener_add(xows_doc.chat_file,   "change",   xows_gui_chat_file_onchange);
  xows_doc_listener_add(xows_doc.drop_emoj,   "click",    xows_gui_drop_emoj_onclick);
  xows_doc_listener_add(xows_doc.chat_panl,   "keydown",  xows_gui_chat_panl_onkeyp, false); //< need preventDefault()
  xows_doc_listener_add(xows_doc.chat_panl,   "keyup",    xows_gui_chat_panl_onkeyp);
  xows_doc_listener_add(xows_doc.chat_panl,   "input",    xows_gui_chat_panl_oninput);
  xows_doc_listener_add(xows_doc.chat_panl,   "click",    xows_gui_chat_panl_onclick);
  
  xows_doc_listener_add(xows_doc.occu_list,   "click",    xows_gui_occu_list_onclick);


  // Page screen "scr_page" event listener
  xows_doc_listener_add(xows_doc.scr_page,    "keyup",    xows_doc_page_onkeyu);
  
  // Close page button "page_exit" event listener
  xows_doc_listener_add(xows_doc.page_exit,   "click",    xows_doc_page_onclose);
  
  // HTTP Upload Page "hist_upld" event listeners
  xows_doc_listener_add(xows_doc.upld_exit,   "click",    xows_gui_upld_onclose);

  // Check whether Registering option is enabled
  if(xows_options.allow_register) {
    // Show and configure the "Register new account" link in the Login Page
    xows_doc_show("auth_regi"); 
  }

  // Modal screen "scr_void" event listener
  xows_doc_listener_add(xows_doc.scr_void,    "click",    xows_doc_void_onclick);
  
  // Message Box "over_mbox" event listeners
  xows_doc_listener_add(xows_doc.mbox_close,  "click",    xows_doc_mbox_close);
  xows_doc_listener_add(xows_doc.mbox_abort,  "click",    xows_doc_mbox_onabort);
  xows_doc_listener_add(xows_doc.mbox_valid,  "click",    xows_doc_mbox_onvalid);
  
  // Set event listener to handle user presence and GUI focus
  xows_doc_listener_add(document,   "visibilitychange",   xows_gui_wnd_onfocus);
  xows_doc_listener_add(window,     "focus",              xows_gui_wnd_onfocus);
  xows_doc_listener_add(window,     "blur",               xows_gui_wnd_onfocus);

  // Set event listener to handle page quit or reload
  xows_doc_listener_add(window,     "beforeunload",       xows_gui_wnd_onunload);
  
  // Set event listener to hook browser "nav back"
  xows_doc_listener_add(window,     "popstate",           xows_gui_nav_onpopstate);
  
  // Load the notification sound
  xows_gui_notify_sound = new Audio("/" + xows_options.root + "/sounds/notify.mp3?456");

  xows_log(2,"gui_start","document ready");

  // Finaly call onready callback
  if(xows_isfunc(onready)) onready();
}

/**
 * Empty the Lazy Loading stack to avoid useless checks.
 */
function xows_doc_loader_clear()
{
  xows_doc_loader_stack.length = 0;
  xows_doc_loader_scroll.top = 99999;
  xows_log(2,"doc_loader_clear","loader stack cleared");
}

/**
 * Define a new client viewport for lazy-loading monitor.
 * 
 * The specified element will be used as viewport to calculate whether
 * the monitored elements in the stack are currently visible and should 
 * start loading.
 * 
 * @param {object}  client  Scrolling element with content to be monitored.
 * @param {string}  attrib  Placeholder attribute containing media URL.
 */
function xows_doc_loader_setup(client, attrib)
{
  xows_doc_loader_attrib = attrib;
  xows_log(2,"doc_loader_setup","now search elements with attribute",attrib);

  // Add and/or remove the proper event listener if needed
  if(xows_doc_loader_client !== client) {
    
    if(xows_doc_loader_client) {
      xows_doc_listener_rem(xows_doc_loader_client,"scroll",xows_doc_loader_check);
      xows_log(2,"doc_loader_setup","removing scroll listener from element",
                "<"+xows_doc_loader_client.tagName+" id=\""+xows_doc_loader_client.getAttribute("id")+"\">");
    }

    xows_doc_loader_client = client;
    
    if(xows_doc_loader_client) {
      xows_doc_listener_add(xows_doc_loader_client,"scroll",xows_doc_loader_check);
      xows_log(2,"doc_loader_setup","adding scroll listener to element",
              "<"+client.tagName+" id=\""+client.getAttribute("id")+"\">");
    }
  }
  
  // Reset scroll to "infinite" to ve sure we make a first check
  xows_doc_loader_scroll.top = 99999;
}

/**
 * Add the specified element to the lazy-loading stack.
 * 
 * @param {object}  target  Element to check for load monitoring.
 */
function xows_doc_loader_monitor(target)
{
  const targets = Array.from(target.querySelectorAll("["+xows_doc_loader_attrib+"]"));
  if(targets.length) {
    xows_log(2,"doc_loader_monitor","adding to monitoring stack",targets.length+" new element(s)");
    let i = targets.length;
    while(i--) xows_doc_loader_stack.push(targets[i]);
  }
}

/**
 * Lazy Loader on-load callback function for loaded medias
 * 
 * @param {object}  media   Media object that finished to load.
 */
function xows_doc_loader_onload(media)
{
  // Remove the spin loader and show the media (normal height)
  media.parentNode.classList.remove("LOADING"); //< container
  media.classList.remove("FLATTEN"); //< media
  
  // Adjust scroll position to compensate content new height
  xows_doc_loader_client.scrollTop = xows_doc_loader_client.scrollHeight - xows_doc_loader_scroll.off;
}

/**
 * Lazy Loader check function. 
 * 
 * this function test embeded media containers against current viewport
 * to start loading source.
 * 
 * @param {boolean}   force   Force check.
 */
function xows_doc_loader_check(force)
{
  if(!xows_doc_loader_stack.length)
    return;
    
  // We perform check only if scroll changed enough to justify it
  if(!force && Math.abs(xows_doc_loader_client.scrollTop - xows_doc_loader_scroll.top) < 120) 
    return;

  // Keep scroll parameters
  xows_doc_loader_scroll.top = xows_doc_loader_client.scrollTop;
  xows_doc_loader_scroll.off = xows_doc_loader_client.scrollHeight - xows_doc_loader_scroll.top;
  
  // Used variables
  const view_bound = xows_doc_loader_client.getBoundingClientRect();
  let media_bound;

  let media, i = xows_doc_loader_stack.length;
  while(i--) {
    
    media = xows_doc_loader_stack[i];

    // Get client bounding for this element
    media_bound = media.getBoundingClientRect();

    // Check whether the object is currently within the chat history
    // window client (the visible part)
    if(media_bound.bottom > view_bound.top && media_bound.top <= view_bound.bottom) {
      
      // The NOLOADER attribute, non-standard HTML attribute, is 
      // used to indiate the media should not be hidden during 
      // loading. This is typically used for GIF images, assumed as 
      // animated, to let them starting playing without waiting full 
      // loading (which can take long).
      if(!media.hasAttribute("NOLOADER")) {
        
        // We virtually hide the media by setting its height to 0 using
        // the flatten class, then we add a spin loader to its 
        // parent, which is usualy the placeholder
        media.classList.add("FLATTEN"); //< media
        media.parentNode.classList.add("LOADING"); //< container

        // Define an onload function to handle loading end
        media.onload = function(){xows_doc_loader_onload(this);};
      } 
      
      // Set the src from data_src to start load data
      media.src = media.getAttribute(xows_doc_loader_attrib);
      media.removeAttribute(xows_doc_loader_attrib);

      // Remove this one from stack
      xows_doc_loader_stack.splice(i,1);
      
      // Output log
      xows_log(2,"doc_loader_check","loading",media.src);
    }
  }
}

/**
 * Apply background blink animation to the specified object.
 * 
 * @param {string}  id        Object ID to apply blink to.
 * @param {number}  duration  Blink duration in miliseconds.
 */
function xows_doc_blink(id, duration)
{
  if(xows_doc_cls_has(id, "BLINK")) {
    // remove blink animation class and clean stuff
    xows_doc_cls_rem(id, "BLINK"); 
  } else {
    // add blink animation class and start timeout
    xows_doc_cls_add(id, "BLINK"); 
    setTimeout(xows_doc_blink,duration,id);
  }
}

/**
 * Dialog Page reference to custom init function.
 */
let xows_doc_mbox_cb_onabort = null;

/**
 * Dialog Page reference to custom save function.
 */
let xows_doc_mbox_cb_onvalid = null;

/**
 * Dialog Page Abort (click on Abort button) callback. 
 * 
 * @param {object}  event   Event data.
 */
function xows_doc_mbox_onabort(event)
{
  if(xows_doc_mbox_cb_onabort) {
    xows_doc_mbox_cb_onabort();
    xows_doc_mbox_close(); //< Close message box dialog
  }
}

/**
 * Dialog Page Valid (click on valid button) callback. 
 * 
 * @param {object}  event   Event data.
 */
function xows_doc_mbox_onvalid(event)
{
  if(xows_doc_mbox_cb_onvalid) {
    xows_doc_mbox_cb_onvalid();
    xows_doc_mbox_close(); //< Close message box dialog
  }
}

/**
 * Message box style codes definition.
 */
const XOWS_MBOX_ERR = -1; //< same as XOWS_SIG_ERR
const XOWS_MBOX_WRN = 0;  //< same as XOWS_SIG_WRN
const XOWS_MBOX_SCS = 1;
const XOWS_MBOX_ASK = 2;

/**
 * Message Box Dialog open.
 * 
 * If any of the "onvalid" or "onabort" parameters is not-null, the 
 * Message Box turn in "modal mode", forcing user to interact with 
 * the dialog before continue.
 * 
 * @param {number}    style     Message box style or null for default.
 * @param {string}    text      Message to display.
 * @param {function} [onvalid]  Optional callback function for valid/save.
 * @param {string}   [valid]    Optional valid button text or null to hide.
 * @param {function} [onabort]  Optional callback function for abort/reset.
 * @param {string}   [abort]    Optional abort button text or null to hide.
 * @param {boolean}  [modal]    Optional open in 'modal' dialog mode.
 */
function xows_doc_mbox_open(style, text, onvalid, valid, onabort, abort, modal)
{
  // Checks for already opened Message Box 
  if(xows_doc_mbox_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_mbox_close();
  }
  
  let cls;
  
  switch(style)  {
  case XOWS_MBOX_ERR: cls = "TEXT-ERR"; break; //< same as XOWS_SIG_ERR
  case XOWS_MBOX_WRN: cls = "TEXT-WRN"; break; //< same as XOWS_SIG_WRN
  case XOWS_MBOX_SCS: cls = "TEXT-SCS"; break;
  case XOWS_MBOX_ASK: cls = "TEXT-ASK"; break;
  }
  
  xows_doc.mbox_text.classList = cls;
  xows_doc.mbox_text.innerHTML = xows_l10n_get(text);
  
  xows_doc_hidden_set("mbox_close", (onvalid || onabort));
  xows_doc_hidden_set("mbox_valid", !onvalid);
  xows_doc_hidden_set("mbox_abort", !onabort);
  if(onvalid) xows_doc.mbox_valid.innerHTML = xows_l10n_get(valid);
  if(onabort) xows_doc.mbox_abort.innerHTML = xows_l10n_get(abort);
  
  // set callbacks
  xows_doc_mbox_cb_onabort = onabort;
  xows_doc_mbox_cb_onvalid = onvalid;
  
  // if 'modal' show the 'void screen' to catch mouse clicks
  if(modal) xows_doc_show("scr_void");  
    
  xows_doc_show("over_mbox");
}

/**
 * Message Box Dialog open with predefined values for Save changes.
 * 
 * @param {function} [onvalid]  Optional callback function for valid/save.
 * @param {function} [onabort]  Optional callback function for abort/reset.
 */
function xows_doc_mbox_open_for_save(onvalid, onabort)
{
  if(xows_doc_hidden("over_mbox"))
    xows_doc_mbox_open(null, "It remains unsaved changes",
                          onvalid, "Save changes", 
                          onabort, "Reset");
}

/**
 * Message Box Dialog close.
 */
function xows_doc_mbox_close()
{
  // reset references
  xows_doc_mbox_cb_onabort = null;
  xows_doc_mbox_cb_onvalid = null;
  
  // hide message box stuff
  xows_doc_hide("over_mbox");
  xows_doc_hide("scr_void"); //< hide the 'void screen'
}

/**
 * Message Box Dialog modal check and blink. 
 * 
 * This function is used in context where message box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid 
 * or abort). 
 * 
 * If the message box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the 
 * message box blink, and the function returns true to tell the caller
 * that message box 'is' modal, and must deny user to continue. 
 * 
 * @return {boolean}  True if dialog 'is' modal, false otherwise.
 */
function xows_doc_mbox_modal()
{
  if(!xows_doc_hidden("over_mbox") && xows_doc_mbox_cb_onabort) {
    xows_doc_blink("over_mbox", 400); //< blinking Message box
    return true;
  }
  return false;
}

/**
 * Current opened dialog pages array.
 */
let xows_doc_page_id = null;

/**
 * Dialog Page reference to custom exit function.
 */
let xows_doc_page_cb_onclose = null;

/**
 * Dialog Page reference to custom on input event function.
 */
let xows_doc_page_cb_oninput = null;

/**
 * Dialog Page reference to custom on click event function.
 */
let xows_doc_page_cb_onclick = null;

/**
 * Dialog Page Close (click on close button) callback. 
 * 
 * @param {object}  event   Event data.
 */
function xows_doc_page_oninput(event)
{
  xows_doc_page_cb_oninput(event.target);
}

/**
 * Dialog Page Close (click on close button) callback. 
 * 
 * @param {object}  event   Event data.
 */
function xows_doc_page_onclick(event)
{
  xows_doc_page_cb_onclick(event.target);
}

/**
 * Dialog Page Close (click on close button) callback. 
 * 
 * @param {object}  event   Event data.
 */
function xows_doc_page_onclose(event)
{
  if(!xows_doc_mbox_modal())
    xows_doc_page_close(); //< close dialog page
}

/**
 * Dialog Page Close.
 * 
 * @param {soft}    Soft close, prepare for new page to open only.
 */
function xows_doc_page_close(soft)
{
  if(!xows_doc_page_id) 
    return;
    
  xows_log(2,"gui_page_close",(soft?"soft":"hard")+" close",xows_doc_page_id);

  // remove "event" event listener
  if(xows_doc_page_cb_oninput) {
    xows_doc_listener_rem(xows_doc[xows_doc_page_id],"input",xows_doc_page_oninput);
    xows_doc_page_cb_oninput = null;
  }
  
  // remove "click" event listener
  if(xows_doc_page_cb_onclick) {
    xows_doc_listener_rem(xows_doc[xows_doc_page_id],"click",xows_doc_page_onclick);
    xows_doc_page_cb_onclick = null;     
  }
  
  // call exit callback
  if(xows_doc_page_cb_onclose) 
    xows_doc_page_cb_onclose();
  
  // reset callback functions
  xows_doc_page_cb_onclose = null;

  // hide close button Overlay
  xows_doc_hide("colr_exit");
  
  // hide the diloag
  xows_doc_hide(xows_doc_page_id);
  xows_doc_page_id = null;

  // also exit potentially opened message box
  xows_doc_mbox_close();

  // if this is a hard-close, we switch to "screen page"
  if(!soft) {
    // Open main screen
    xows_gui_main_open();
  }
}

/**
 * Dialog Page Open.
 * 
 * @param {string}    id        Page ID to open.
 * @param {boolean}  [close]    Optional force display or hide close button.
 * @param {function} [onclose]  Optional callback function for page close.
 * @param {function} [oninput]  Optional callback function for input events.
 * @param {function} [onclick]  Optional callback function for click events.
 */
function xows_doc_page_open(id, close, onclose, oninput, onclick) 
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Check for soft-open, meaning simply switch page
  let soft = (xows_doc_page_id !== null);
  
  if(soft) {
    xows_doc_page_close(true); //< close any opened dialog
  }
  
  xows_log(2,"gui_dlg_open", id);
  
  // switch 'screens' only if hard oppen
  if(!soft) {
    // hide main screen and show page screen
    xows_doc_hide("scr_main");
    xows_doc_show("scr_page");
  }
  
  // show specific dialog
  xows_doc_show(id); 
  xows_doc_page_id = id;

  if(close) xows_doc_show("colr_exit"); //< show close button
  
  // set callbacks
  xows_doc_page_cb_onclose = onclose;
  
  // add "input" event listener
  if(oninput) {
    xows_doc_page_cb_oninput = oninput;
    xows_doc_listener_add(xows_doc[id],"input",xows_doc_page_oninput);        
  }
  
  // add "click" event listener
  if(onclick) {
    xows_doc_page_cb_onclick = onclick;
    xows_doc_listener_add(xows_doc[id],"click",xows_doc_page_onclick);        
  }
  
  // also exit potentially opened message box
  xows_doc_mbox_close();
}

/**
 * Dialog Page on-keyup callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_doc_page_onkeyu(event)
{
  if(xows_doc_page_id && event.keyCode === 13) {
    // Emulate click on Valid button
    if(!xows_doc_hidden("over_mbox") && !xows_doc_hidden("mbox_valid")) {
     xows_doc.mbox_valid.click();
   } else {
     // Emulate click on submit button
     const submit = xows_doc[xows_doc_page_id].querySelector("*[type='submit']");
     if(submit) submit.click();
   }
  }
}

/**
 * Check whether given page is the currently openned one.
 * 
 * @param   {string}  page  Page ID to check.
 * 
 * @return  {boolean} True if page is openned, false otherwise.
 */
function xows_doc_page_opened(page)
{
  return (xows_doc_page_id == page);
}

/**
 * Currently opened menu elements.
 */
const xows_doc_menu = {};

/**
 * Close current opened menu.
 */
function xows_doc_menu_close()
{
  // hide the 'void' screen
  xows_doc_hide("scr_void");
  
  if(xows_doc_menu.drop) 
    xows_doc_hide(xows_doc_menu.drop);
    
  if(xows_doc_menu.btn)  
    xows_doc_menu.btn.blur();
    
  xows_doc_menu.btn = null;
  xows_doc_menu.drop = null;
}

/**
 * Toggle menu drop.
 * 
 * This function toggle the specified menu and show the invisible menu 
 * screen to gather click event outside menu.
 * 
 * @param {object}  btn       Menu button object.
 * @param {string}  drop      Menu drop object Id.
 */
function xows_doc_menu_toggle(btn, drop)
{
  if(xows_doc_menu.btn) {
    xows_doc_menu_close();
  } else {
    // show the 'void' screen to catch clicks outside menu
    xows_doc_show("scr_void");
    xows_doc_show(drop);
    btn.focus();
    xows_doc_menu.btn = btn;
    xows_doc_menu.drop = drop;
  }
}

/**
 * Media Viewer screen close.
 */
function xows_doc_view_close()
{
  if(!xows_doc_hidden("over_view")) {
    
    // hide the media overlay element
    xows_doc_hide("over_view");
    
    // remove 'dark' filter and hide 'void' screen
    xows_doc_cls_rem("scr_void", "VOID-DARK");
    xows_doc_hide("scr_void");
  }
}

/**
 * Media Viewer screen open.
 * 
 * @param {object}   media    DOM element that throwed event.
 */
function xows_doc_view_open(media)
{
  // Check for image media to view
  if(media.tagName === "IMG") {
    
    // set proper link and references
    xows_doc.view_img.src = media.src;
    xows_doc.view_open.href = media.src;
    
    // show the media overlay element
    xows_doc_show("over_view");
    
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }
}


/**
 * Function to proceed click on void 'screen'.
 * 
 * This function is called when user click on the 'void screen', meaning
 * outside an opened menu or dialog.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_doc_void_onclick(event)
{
  // check whether a menu is opened, and close it
  if(xows_doc_menu.btn)
    xows_doc_menu_close();
  
  // Close potentially opened media viewer screen
  xows_doc_view_close();
  
  // Make potentially opened modal Message Box blinking
  xows_doc_mbox_modal();

}
