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
 *                         GUI API Interface
 *
 * ------------------------------------------------------------------ */

/**
 * Threshold time for aggregated to full message
 */
const XOWS_MESG_AGGR_THRESHOLD = 600000; //< 10 min

/**
 * History loading process tasks bit (see xows_load* )
 */
const XOWS_LOAD_MAM = xows_load_task_bit();

/**
 * Current selected GUI locale code
 */
let xows_gui_locale = "en-US";

/**
 * Object to temporarly store login user and password
 */
let xows_gui_auth = null;

/**
 * JID of the currently selected peer (room or contact) in Roster
 */
let xows_gui_peer = null;

/**
 * Main browser audio API
 */
const xows_gui_audio = {ctx:null,vol:null};

/**
 * Sound library for audio effects
 */
const xows_gui_sound_lib = new Map();

/**
 * Load sound file to sound library at specified slot
 *
 * @param   {string}    name    Sound slot name
 * @param   {string}    file    Sound file name
 * @param   {boolean}   loop    Optionnal boolean to enable loop
 */
function xows_gui_sound_error(event)
{
  const audio = event.target;
  xows_log(1,"gui_sound_error","'"+audio.title+"' sound load failed",audio.src);
  xows_gui_sound_lib.delete(audio.title);
}

/**
 * Load sound file to sound library at specified slot
 *
 * @param   {string}    name    Sound slot name
 * @param   {string}    file    Sound file name
 * @param   {boolean}   loop    Optionnal boolean to enable loop
 */
function xows_gui_sound_load(name, file, loop)
{
  // Create new Audio object
  const audio = new Audio();
  xows_gui_sound_lib.set(name, audio);

  audio.title = name; //< custom property to keep refrence
  audio.loop = loop;  //< set loop option

  // Creating path to sound
  const path = xows_options.root+"/sounds/"+file;

  xows_log(2,"gui_sound_load","loading '"+name+"' sound",path);

  // Set error callback and start loading
  audio.onerror = xows_gui_sound_error;
  audio.src = path;
}

/**
 * Play the specified sound from sound library
 *
 * @param   {string}    name    Sound slot name
 */
function xows_gui_sound_play(name)
{
  if(xows_gui_sound_lib.has(name))
    xows_gui_sound_lib.get(name).play();
}

/**
 * Stop the specified sound from sound library
 *
 * @param   {string}    name    Sound slot name
 */
function xows_gui_sound_stop(name)
{
  if(xows_gui_sound_lib.has(name))
    xows_gui_sound_lib.get(name).pause();
}

/**
 * Current state of browser focus
 */
let xows_gui_has_focus = true;

/**
 * Indicate the DOM is in its default state
 */
let xows_gui_clean = true;

/**
 * Flag for client connexion loss
 */
let xows_gui_connect_loss = false;

/**
 * Currently available media devices (for multimedia calls)
 */
let xows_gui_medias = null;

/**
 * Callback function to query device enumeration from MediaDevices API
 */
function xows_gui_medias_poll()
{
  // Query available devices for Multimedia features
  if(navigator.mediaDevices) {
    navigator.mediaDevices.enumerateDevices().then(xows_gui_ondevicesinfos);
    navigator.mediaDevices.ondevicechange = xows_gui_ondevicechange;
  }
}

/**
 * Callback function to handle device enumeration from MediaDevices API
 *
 * @param   {object}    devinfo    Array of MediaDeviceInfo object
 */
function xows_gui_ondevicesinfos(devinfo)
{
  // Update media infos list
  xows_gui_medias = devinfo;

  xows_log(2,"gui_ondevicesinfos","received medias infos");

  // Update relevant GUI element
  if(xows_gui_peer)
    xows_gui_peer_chat_update(xows_gui_peer);
}

/**
 * Callback function to handle media devices changes event
 *
 * @param   {object}    event      Event object
 */
function xows_gui_ondevicechange(event)
{
  // Update medias list
  navigator.mediaDevices.enumerateDevices().then(xows_gui_ondevicesinfos);
}

/**
 * Check whether current medias list has the specified type
 *
 * @param   {string}    type      Media type to search for
 */
function xows_gui_medias_has(type)
{
  if(!xows_gui_medias)
    return false;

  for(let i = 0; i < xows_gui_medias.length; ++i)
    if(xows_gui_medias[i].kind === type)
      return true;

  return false;
}

/**
 * Constant for initial offscreen slot identifier
 */
const XOWS_GUI_FRAG_INIT = "NULL";

/**
 * Get Peer related element by id, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 *
 * @return  {object}    Element or null if not found
 */
function xows_gui_peer_doc(peer, id)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id);
  } else {
    return xows_doc_frag_find(peer.addr, id);
  }
}

/**
 * Toggle class of Peer element, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 * @param   {string}    cls       Class name
 * @param   {boolean}   force     Force enable or disable
 */
function xows_gui_peer_doc_cls_tog(peer, id, cls, force)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id).classList.toggle(cls,force);
  } else {
    return xows_doc_frag_find(peer.addr, id).classList.toggle(cls,force);
  }
}

/**
 * Add class to Peer element, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 * @param   {string}    cls       Class name
 */
function xows_gui_peer_doc_cls_add(peer, id, cls)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id).classList.add(cls);
  } else {
    return xows_doc_frag_find(peer.addr, id).classList.add(cls);
  }
}

/**
 * Remove class to Peer element, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 * @param   {string}    cls       Class name
 */
function xows_gui_peer_doc_cls_rem(peer, id, cls)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id).classList.remove(cls);
  } else {
    return xows_doc_frag_find(peer.addr, id).classList.remove(cls);
  }
}

/**
 * Check for class in Peer element, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 * @param   {string}    cls       Class name
 */
function xows_gui_peer_doc_cls_has(peer, id, cls)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id).classList.contains(cls);
  } else {
    return xows_doc_frag_find(peer.addr, id).classList.contains(cls);
  }
}

/**
 * Save the main chat scroll position for the specified peer in the
 * ad-hoc 'scrollBottom' property.
 *
 * If the specified Peer history is offscreen, the function operate on
 * the offscreen dummy object.
 *
 * @param   {object}    peer      Peer object to save scroll value
 */
function xows_gui_peer_scroll_save(peer)
{
  if(peer === xows_gui_peer) {
    xows_doc_scrl_save(document.getElementById("chat_main"));
  } else {
    xows_doc_scrl_save(xows_doc_scrl_db.get(peer.addr));
  }
}

/**
 * Get the main chat last saved scroll position (relative to bottom)
 * corresponding to the specified peer.
 *
 * If the specified Peer history is offscreen, it returns value from
 * the offscreen dummy object.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_peer_scroll_get(peer)
{
  // Returns current DOM element or offscreen dummy object ad-hoc propery
  if(peer === xows_gui_peer) {
    return document.getElementById("chat_main").scrollBottom;
  } else {
    return xows_doc_scrl_db.get(peer.addr).scrollBottom;
  }
}

/**
 * Move to bottom the main chat scroll corresponding to the specified peer
 *
 * If the specified Peer history is offscreen, the function operate on
 * the offscreen dummy object.
 *
 * @param   {object}    peer      Peer object to get scroll value
 * @param   {boolean}  [smooth]   Perform smooth scroll
 */
function xows_gui_peer_scroll_down(peer, smooth = true)
{
  // Close navigation banner
  xows_gui_chat_nav_hide(peer);

  if(peer === xows_gui_peer) {
    xows_doc_scrl_down(document.getElementById("chat_main"), smooth);
  } else {
    xows_doc_scrl_down(xows_doc_scrl_db.get(peer.addr));
  }
}

/**
 * Compensate (to keept at position) the main chat scroll corresponding
 * to the specified peer.
 *
 * If the specified Peer history is offscree, the function operate on
 * the offscreen dummy object.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_peer_scroll_keep(peer)
{
  if(peer === xows_gui_peer) {
    xows_doc_scrl_keep(document.getElementById("chat_main"));
  } else {
    xows_doc_scrl_keep(xows_doc_scrl_db.get(peer.addr));
  }
}

/**
 * Common function to clone current DOM elements to initial offscreen
 * Document Fragment.
 *
 * Clones the current DOM elements to a new Document Fragment used to be
 * initial content to be cloned for any new Peer's Document Fragment.
 *
 * This function should be called only ONCE right after DOM finished to
 * load, when at its initial state.
 */
function xows_gui_peer_frag_init()
{
  // Create intial offscreen slot from current document
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "chat_fram", true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "room_fram", true);

  // Export scroll parameters to offscreen
  xows_doc_scrl_export(XOWS_GUI_FRAG_INIT, "chat_main");
}

/**
 * Common function to create new set of Peer's offscreen DocumentFragment.
 *
 * Clones the initial DOM elements (which was saved in a Document Fragment at
 * initialization) to a new DocumentFragment referenced under the specified
 * slot (usually, Peer's address).
 *
 * If source is specified, the new set of DocumentFragment is cloned from
 * the specified source instead of saved initial DOM elements.
 *
 * @param   {string}    slot      Destination slot (Peer's address)
 * @param   {string}   [source]   Optional source slot.
 */
function xows_gui_peer_frag_new(slot, source)
{
  if(!source)
    source = XOWS_GUI_FRAG_INIT;

  if(!xows_doc_frag_db.has(source)) {
    xows_log(1,"gui_peer_frag_new","source fragment doesn't exist",slot);
    return;
  }

  // Copy offscreen scroll parameters
  xows_doc_scrl_copy(slot, source);

  // Clone elements from initial offscreen slot
  xows_doc_frag_clone(slot, source, "chat_fram");
  xows_doc_frag_clone(slot, source, "room_fram");
}

/**
 * Common function to "export" current DOM elements to Peer's offscreen
 * Document Fragment.
 *
 * Moves the current DOM elements to the offscreen Document Fragment
 * referenced by the specified slot (usually, Peer's address).
 *
 * @param   {string}    slot      Document fragment slot (Peer's address)
 */
function xows_gui_peer_frag_export(slot)
{
  if(!xows_doc_frag_db.has(slot)) {
    xows_log(1,"gui_peer_frag_export","fragment doesn't exist",slot);
    return;
  }

  // Export scroll parameters to offscreen
  xows_doc_scrl_export(slot, "chat_main");

  // Export document elements to offscreen fragment
  xows_doc_frag_export(slot, "chat_fram");
  xows_doc_frag_export(slot, "room_fram");
}

/**
 * Common function to "import" Peer's offscreen Document Fragment to
 * current DOM.
 *
 * Moves elements from offscreen Document Fragment referenced by the
 * specified slot (usually, Peer's address) to the current DOM, actualy
 * replacing DOM elements .
 *
 * If the specified slot is null (or undefined) the function Moves elements
 * from the INITIAL offscreen Document Fragment instead.
 *
 * @param   {string}    slot      Document fragment slot (Peer's address) or null
 */
function xows_gui_peer_frag_import(slot)
{
  let clone = false;
  if(!slot) {
    slot = XOWS_GUI_FRAG_INIT;
    clone = true;
  }

  if(!xows_doc_frag_db.has(slot)) {
    xows_log(1,"gui_peer_frag_import","fragment doesn't exist",slot);
    return;
  }

  // Import document elements from offscreen fragment
  xows_doc_frag_import(slot, "chat_fram", clone);
  xows_doc_frag_import(slot, "room_fram", clone);

  // Import scroll parameters from offscreen
  xows_doc_scrl_import(slot, "chat_main");
}

/**
 * Common function to delete Peer's related offscreen element.
 *
 * @param   {string}    slot      Document fragment slot (Peer's address)
 */
function xows_gui_peer_frag_discard(slot)
{
  // Delete Document Fragment
  xows_doc_frag_delete(slot);

  // Delete Scroll parameters
  xows_doc_scrl_delete(slot);
}

/**
 * Check whether Peer offscreen slot exists
 *
 * @param   {object}    peer      Peer object to check
 *
 * @return  {boolean}   True if offscreen slot exists, false otherwise
 */
function xows_gui_peer_doc_has(peer)
{
  return xows_doc_frag_db.has(peer.addr);
}

/**
 * Create new Peer offscreen slot using initial DOM elements
 *
 * @param   {object}    peer      Peer object to initialize offscreen for
 */
function xows_gui_peer_doc_init(peer)
{
  // Prevent recreate offscreen document
  if(xows_doc_frag_db.has(peer.addr))
    return;

  // Clone elements from initial offscreen slot
  xows_gui_peer_frag_new(peer.addr);

  // Set this document fragment as "closed"
  xows_gui_peer_doc(peer, "hist_ul").dataset.closed = true;

  // Set chat input placeholder
  const placeholder = xows_l10n_get("Send a message to")+" "+peer.name+" ...";
  xows_gui_peer_doc(peer, "chat_inpt").setAttribute("placeholder",placeholder);

  // Set chat header bar informations
  xows_gui_peer_chat_update(peer);

  // Set notification button
  xows_gui_chat_noti_update(peer);
}

/**
 * Reset Peer offscreen slot to initial state
 *
 * @param   {object}    peer      Peer object to reset offscreen for
 */
function xows_gui_peer_doc_reset(peer)
{
  // Prevent recreate offscreen document
  if(xows_doc_frag_db.has(peer.addr))
    xows_doc_frag_db.delete(peer.addr);

  xows_gui_peer_doc_init(peer);
}

const xows_gui_chat_observer = new ResizeObserver(xows_gui_chat_onresize);

/**
 * Move and store current document Peer elements to offscreen
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_peer_doc_export(peer)
{
  //xows_gui_chat_observer.unobserve(xows_doc("chat_hist"));

  // Export document elements to offscreen fragment
  xows_gui_peer_frag_export(peer.addr);
}

/**
 * Bring back saved Peer offscreen elements to current document
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_peer_doc_import(peer)
{
  if(peer) {

    // import document elements from offscreen fragment
    xows_gui_peer_frag_import(peer.addr);

    // Update chat header bar informations
    xows_gui_peer_chat_update(peer);

    // Re-bind resize observer
    xows_gui_chat_observer.observe(xows_doc("chat_main"));
    //xows_gui_chat_observer.observe(xows_doc("chat_hist"));

    // Recreate event listeners
    xows_doc_listener_add(xows_doc("chat_head"), "click", xows_gui_chat_head_onclick);
    xows_doc_listener_add(xows_doc("chat_main"), "scrollend",xows_gui_chat_onscroll);
    xows_doc_listener_add(xows_doc("chat_hist"), "click", xows_gui_chat_hist_onclick);

    const call_ring = xows_doc("call_ring");
    if(!call_ring.hidden) xows_doc_listener_add(call_ring, "click", xows_gui_call_ring_onclick);

    const hist_upld = xows_doc("hist_upld");
    if(!hist_upld.hidden) xows_doc_listener_add(hist_upld, "click", xows_gui_hist_upld_onclick);

    if(!xows_doc("call_view").hidden) {
      xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
      xows_doc_listener_add(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
    }

    const chat_panl = xows_doc("chat_panl");
    xows_doc_listener_add(chat_panl, "click", xows_gui_chat_panl_onclick);
    xows_doc_listener_add(chat_panl, "input", xows_gui_chat_inpt_oninput);
    xows_doc_listener_add(chat_panl, "paste", xows_gui_chat_inpt_onpaste, false); //< need preventDefault()
    xows_doc_listener_add(xows_doc("chat_file"), "change", xows_gui_chat_file_onchange);
    if(peer.type === XOWS_PEER_ROOM) {
      xows_doc_listener_add(xows_doc("room_head"), "click", xows_gui_room_head_onclick);
      xows_doc_listener_add(xows_doc("occu_list"), "click", xows_gui_occu_list_onclick);
    }

  } else {

    // restore (clone) from initial (empty) document elements
    xows_gui_peer_frag_import(null);
  }
}

/**
 * Reassign saved Peer offscreen elements to another reference
 *
 * @param   {object}    peer      Peer object with updated address
 * @param   {string}    slot      Previous Peer's slot (address) to be reassigned
 */
function xows_gui_peer_doc_reassign(peer, slot)
{
  if(peer === xows_gui_peer)
    // Move document elements to offscreen fragment
    xows_gui_peer_frag_export(slot);

  // clone elements from source offscreen slot
  xows_gui_peer_frag_new(peer.addr, slot);

  // Delete previous offscreen elements
  xows_gui_peer_frag_discard(slot);

  if(peer === xows_gui_peer)
    // Bring back Peer documents with new reference
    xows_gui_peer_doc_import(peer);
}

/**
 * Update Peer's chat frame and Occupant list elements heads according
 * Peer data.
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_peer_chat_update(peer)
{
  // Update chat title bar
  xows_gui_peer_doc(peer, "chat_titl").innerText = peer.name;

  const meta_inpt = xows_gui_peer_doc(peer,"meta_inpt");

  if(peer.type === XOWS_PEER_ROOM) {
    meta_inpt.innerText = peer.subj;
    meta_inpt.className = peer.subj ? "" : "PLACEHOLD";
    xows_gui_peer_doc(peer, "chat_bt_bkmk").hidden = (peer.book || peer.publ);
    xows_gui_peer_doc(peer, "chat_bt_nick").hidden = false;
    xows_gui_peer_doc(peer, "chat_bt_subj").hidden = (peer.role < XOWS_ROLE_MODO) && (peer.affi < XOWS_AFFI_ADMN);
    xows_gui_peer_doc(peer, "chat_bt_cnfg").hidden = (peer.affi < XOWS_AFFI_OWNR);
  } else {
    meta_inpt.innerText = peer.stat;
    xows_gui_peer_doc(peer, "chat_show").dataset.show = peer.show;
    // Show or hide Multimedia Call buttons
    const has_ices = xows_cli_external_has("stun", "turn");
    xows_gui_peer_doc(peer, "chat_bt_cala").hidden = !(xows_gui_medias_has("audioinput") && has_ices);
    xows_gui_peer_doc(peer, "chat_bt_calv").hidden = !(xows_gui_medias_has("videoinput") && has_ices);
    if(peer.type === XOWS_PEER_OCCU) {
      xows_gui_peer_doc(peer, "chat_bt_addc").hidden = (xows_gui_peer_subs_status(peer) !== 0);
      // Occupant may also change address (change nick)
      xows_gui_peer_doc(peer, "chat_addr").innerText = "("+peer.addr+")";
    }
  }

  // Enable or disable Multimedia Call buttons
  /*
  const in_call = (xows_wrtc_busy());
  xows_gui_peer_doc(peer, "chat_bt_cala").disabled = in_call;
  xows_gui_peer_doc(peer, "chat_bt_calv").disabled = in_call;
  */

  // If Peer is a Room alos update Occupant List header bar
  if(peer.type === XOWS_PEER_ROOM) {
    // Occupants configuration button
    const occu_bt_cnfg = xows_gui_peer_doc(peer, "occu_bt_cnfg");
    occu_bt_cnfg.hidden = (peer.affi < XOWS_AFFI_ADMN);
  }
}

/* -------------------------------------------------------------------
 *
 * Main initialization
 *
 * -------------------------------------------------------------------*/

/**
 * Initialize main GUI elements (to be called once)
 */
function xows_gui_init()
{
  // Set event listener to handle user keyboard
  xows_doc_listener_add(document, "keydown", xows_gui_wnd_onkey, false); //< need preventDefault()
  xows_doc_listener_add(document, "keyup", xows_gui_wnd_onkey);
  // Set event listener to handle user presence and GUI focus
  xows_doc_listener_add(document, "visibilitychange", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "pagehide", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "focus", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "blur", xows_gui_wnd_onfocus);
  // Set event listener to hook browser "nav back"
  xows_doc_listener_add(window, "popstate", xows_gui_nav_onpopstate);
  // Set event listener to handle chat scroll moving on resize
  xows_doc_listener_add(window, "resize", xows_gui_chat_onresize);

  // Main Page "scr_main" event listeners
  xows_doc_listener_add(xows_doc("main_hndr"), "click", xows_gui_main_open);
  xows_doc_listener_add(xows_doc("main_hndl"), "click", xows_gui_main_open);
  // Tabs/Roster Frame listeners
  xows_doc_listener_add(xows_doc("main_tabs"), "click", xows_gui_main_tabs_onclick);
  xows_doc_listener_add(xows_doc("rost_fram"), "click", xows_gui_rost_fram_onclick);
  xows_doc_listener_add(xows_doc("self_panl"), "click", xows_gui_self_panl_onclick);

  // Create intial offscreen slot from current document
  xows_gui_peer_frag_init();

  // The DOM is now to its default state
  xows_gui_clean = true;

  // Poll for available devices for Multimedia features
  xows_gui_medias_poll();

  // Load sound effects
  xows_gui_sound_load("notify",   "notify.ogg");
  xows_gui_sound_load("disable",  "disable.ogg");
  xows_gui_sound_load("enable",   "enable.ogg");
  xows_gui_sound_load("mute",     "mute.ogg");
  xows_gui_sound_load("unmute",   "unmute.ogg");
  xows_gui_sound_load("ringtone", "ringtone.ogg", true);
  xows_gui_sound_load("ringbell", "ringbell.ogg", true);
  xows_gui_sound_load("hangup",   "hangup.ogg");

  // Set loader functions
  xows_load_task_set(XOWS_LOAD_MAM, xows_gui_mam_fetch_newer);
}

/**
 * Reset the GUI to its initial state
 */
function xows_gui_reset()
{
  xows_log(2,"gui_reset","reset DOM states");

  // hide all screens
  xows_doc_hide("scr_page");
  xows_doc_hide("scr_main");

  // close any opened page or overlay element
  xows_doc_page_close();
  xows_doc_menu_close();
  xows_doc_view_close();
  xows_doc_popu_close();
  xows_doc_ibox_close();
  xows_doc_mbox_close();
  xows_doc_prof_close();

  // Reset columns setup
  xows_doc_cls_rem("main_wrap", "COLR-WIDE");
  xows_doc_cls_rem("main_wrap", "COLL-WIDE");
  xows_doc_cls_add("main_colr", "COL-HIDE");

  // clean roster lists
  xows_doc("cont_pend").innerHTML = "";
  xows_doc("cont_budy").innerHTML = "";
  xows_doc("room_book").innerHTML = "";
  xows_doc("room_publ").innerHTML = "";
  xows_doc("room_priv").innerHTML = "";
  xows_doc("priv_occu").innerHTML = "";

  // Reset roster tabs
  xows_doc("tab_priv").hidden = true;
  xows_doc("tab_room").disabled = true;
  xows_gui_rost_switch("tab_cont");
  const priv_noti = xows_doc("priv_noti");
  priv_noti.dataset.mesg = 0; priv_noti.dataset.call = 0; priv_noti.dataset.ring = 0;
  priv_noti.innerText = "";
  const room_noti = xows_doc("room_noti");
  room_noti.dataset.mesg = 0; room_noti.dataset.call = 0; room_noti.dataset.ring = 0;
  room_noti.innerText = "";
  const cont_noti = xows_doc("cont_noti");
  cont_noti.dataset.mesg = 0; cont_noti.dataset.call = 0; cont_noti.dataset.ring = 0;
  cont_noti.dataset.subs = 0;
  cont_noti.innerText = "";

  // clean user frame
  xows_doc("self_show").dataset.show = 0;
  xows_doc("self_name").innerText = "";
  xows_doc("self_meta").innerText = "";
  xows_doc("self_avat").className = "";

  // Reset Peer related elements
  xows_gui_switch_peer(null);

  // Reset chat input
  xows_doc_cls_add("chat_inpt", "PLACEHOLD");
  xows_doc("chat_inpt").innerText = "";

  // Clear all offscreen elements
  xows_doc_frag_clear();
  xows_doc_scrl_clear();

  // Create intial offscreen slot from current document
  xows_gui_peer_frag_init();

  // The DOM is now to its default state
  xows_gui_clean = true;
}

/* -------------------------------------------------------------------
 *
 * Client Interface - Connect / Dsiconnect
 *
 * -------------------------------------------------------------------*/

/**
 * Function to connect (try login)
 *
 * @param   {boolean}   register  Register new account
 */
function xows_gui_connect(register = false)
{
  // Configure client callbacks
  xows_cli_set_callback("connect", xows_gui_cli_onconnect);
  xows_cli_set_callback("selfpush", xows_gui_cli_onselfpush);
  xows_cli_set_callback("contpush", xows_gui_cli_oncontpush);
  xows_cli_set_callback("contrem", xows_gui_cli_oncontrem);
  xows_cli_set_callback("subspush", xows_gui_cli_onsubspush);
  xows_cli_set_callback("roompush", xows_gui_cli_onroompush);
  xows_cli_set_callback("roomrem", xows_gui_cli_onroomrem);
  xows_cli_set_callback("roomjoin", xows_gui_cli_onroomjoin);
  xows_cli_set_callback("roomexit", xows_gui_cli_onroomexit);
  xows_cli_set_callback("occupush", xows_gui_cli_onoccupush);
  xows_cli_set_callback("occurem", xows_gui_cli_onoccurem);
  xows_cli_set_callback("privpush", xows_gui_cli_onprivpush);
  xows_cli_set_callback("privrem", xows_gui_cli_onprivrem);
  xows_cli_set_callback("message", xows_gui_cli_onmessage);
  xows_cli_set_callback("chatstate", xows_gui_cli_onchatstate);
  xows_cli_set_callback("receipt", xows_gui_cli_onreceipt);
  xows_cli_set_callback("retract", xows_gui_cli_onretract);
  xows_cli_set_callback("subject", xows_gui_cli_onsubject);
  xows_cli_set_callback("calloffer", xows_gui_cli_oncalloffer);
  xows_cli_set_callback("callanwse", xows_gui_cli_oncallanwse);
  xows_cli_set_callback("callstate", xows_gui_cli_oncallstate);
  xows_cli_set_callback("calltermd", xows_gui_cli_oncalltermd);
  xows_cli_set_callback("callerror", xows_gui_cli_oncallerror);
  xows_cli_set_callback("error", xows_gui_cli_onerror);
  xows_cli_set_callback("close", xows_gui_cli_onclose);
  xows_cli_set_callback("timeout", xows_gui_cli_ontimeout);

  // Close message box
  xows_doc_popu_close();

  // From now the DOM is no longer in its default state
  xows_gui_clean = false;

  // Create Audio context (must be done after user interaction)
  if(!xows_gui_audio.ctx) {
    xows_gui_audio.ctx = new AudioContext();
    xows_gui_audio.vol = xows_gui_audio.ctx.createGain();
    xows_gui_audio.vol.connect(xows_gui_audio.ctx.destination);
    // Volume is muted by default
    xows_gui_audio.vol.gain.value = 0;
  }

  // Append domain if the option is set, otherwise it should be
  // set in the usename as typed by user.
  if(xows_options.domain)
    xows_gui_auth.user += "@"+xows_options.domain;

  // Launch the client connection
  xows_cli_connect( xows_options.url,
                    xows_gui_auth.user,
                    xows_gui_auth.pass,
                    register);
}

/**
 * Function to handle client login success and ready
 *
 * @param   {object}    user      User object
 */
function xows_gui_cli_onconnect(user)
{
  // Check whether user asked to remember
  if(xows_gui_auth) {

    if(xows_gui_auth.cred) {

      // Output log
      xows_log(2,"gui_cli_onconnect","Saving credential");

      // Store credentials
      if(window.PasswordCredential) {
        const cred_data = { "id"        : xows_gui_auth.user,
                            "password"  : xows_gui_auth.pass};
        const cred = new PasswordCredential(cred_data);
        navigator.credentials.store(cred);
      }
    }

    // Erase auth data
    xows_gui_auth = null;
  }

  // Check whether we recover from connexion loss
  if(xows_gui_connect_loss) {

    xows_log(1,"gui_cli_onconnect","recover connection");

    // Reset connection loss
    xows_gui_connect_loss = false;

    // Update history for openned chat
    let i = xows_cli_cont.length;
    while(i--) {
      const cont = xows_cli_cont[i];
      // Presence of LOADING class mean chat were not openned, we don't update history
      if(!xows_gui_peer_doc_cls_has(cont,"chat_load","LOADING")) {
        xows_gui_mam_fetch_newer(cont);
      }
    }

    i = xows_cli_room.length;
    while(i--) {
      const room = xows_cli_room[i];
      // Presence of LOADING class mean chat were not openned, we don't update history
      if(!xows_gui_peer_doc_cls_has(room,"chat_load","LOADING")) {
        xows_gui_mam_fetch_newer(room);
      }
    }

  } else {

    xows_log(2,"gui_cli_onconnect","initial connection");

    // Push history to allow message box if user click Back
    window.history.pushState({},"",window.location.pathname);

    // Reset the Roster and Chat window
    xows_gui_switch_peer(null);

    // Check whether file Upload is available
    const has_upld = xows_cli_services.has(XOWS_NS_HTTPUPLOAD);
    xows_doc("edit_bt_upld").disabled = !has_upld;
    // Add embeded download matching http upload service domain
    if(has_upld) xows_tpl_embed_add_upld(xows_cli_services.get(XOWS_NS_HTTPUPLOAD)[0]);

    // Check whether MUC service is available
    const has_muc = xows_cli_services.has(XOWS_NS_MUC);
    xows_doc("room_bt_upd").disabled = !has_muc;
  }

  xows_gui_main_open();

  // Widen roster panel (only in narrow-screen)
  xows_gui_rost_widen();
}

/**
 * Function to disconnect
 */
function xows_gui_disconnect()
{
  // Send chat state to notify current user
  if(xows_gui_peer)
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_GONE);

  // Hangup and clear any Media Call
  xows_gui_call_clear();

  // Disconnect client
  xows_cli_disconnect();
}

/**
 * Handle client connexion/reconnect time out
 */
function xows_gui_cli_ontimeout()
{
  // If documment is hidden we do nothing, once document visible
  // this will trigger event to try to reconnect from connection loss
  if(!document.hidden) {

    // Output log
    xows_log(2,"gui_cli_ontimeout","connection timeout","disconnecting");

    // Disconnect definitively
    xows_gui_disconnect();

    // reset GUI
    xows_gui_reset();

    // Display Login page
    xows_gui_page_auth_open();

    // Display popup message
    xows_doc_popu_open(XOWS_SIG_ERR, "Connection lost");
  }
}

/**
 * Handle client connexion closed
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [text]     Optional information or error message
 */
function xows_gui_cli_onclose(code, text)
{
  // Output log
  xows_log(2,"gui_cli_onclose","connexion closed","("+code+") "+text);

  // Check whether this is a connexion loss
  if(code === XOWS_SIG_HUP) {

    // This is a connection loss
    xows_gui_connect_loss = true;

    // Close any message, popup or dialog box
    xows_doc_popu_close();
    xows_doc_mbox_close();
    xows_doc_ibox_close();
    xows_doc_prof_close();

    // Display wait screen
    xows_gui_page_wait_open("Connecting...");

    return;
  }

  // Prevent reset GUI multiple times
  if(!xows_gui_clean) {

    // reset GUI
    xows_gui_reset();

    // Display Login page
    xows_gui_page_auth_open();
  }

  // Display popup message
  if(text) xows_doc_popu_open(code, text);
}

/**
 * Handle client incomming error
 *
 * @parma   {number}    code      Signal code for message (error or warning)
 * @param   {string}    text      Warning or error message
 */
function xows_gui_cli_onerror(code, text)
{
  // Display popup error message
  xows_doc_popu_open(code, text);
}

/* -------------------------------------------------------------------
 *
 * Browser Window - Browser navigation Back handle
 *
 * -------------------------------------------------------------------*/

/**
 * Process Browser navigation history back
 */
function xows_gui_nav_onpopstate(event)
{
  if(xows_cli_connected() && !xows_doc_popu_modal()) {
    // prevent to go back
    history.forward();
    // open confirmation dialog
    xows_gui_popu_exit_open();
  }
}

/* -------------------------------------------------------------------
 *
 * Browser Window - Events Handling
 *
 * -------------------------------------------------------------------*/

/**
 * Handle the client/Web page focus change
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_wnd_onfocus(event)
{
  switch(event.type)
  {
  case "focus":
  case "blur":
    if(!xows_gui_has_focus)
      xows_cli_activity_wakeup();
    break;

  case "visibilitychange":
    // I am not sure this is usefull at all...
    if(xows_cli_connect_loss && !document.hidden)
      xows_cli_reconnect(10);
    break;
  }

  xows_gui_has_focus = document.hasFocus();
}

/* -------------------------------------------------------------------
 *
 * Browser Window - Push Notification Management
 *
 * -------------------------------------------------------------------*/

/**
 * Store awaiting notification untile permission
 */
let xows_gui_notify_await = null;

/**
 * Handle received notification permission from user
 *
 * @param   {string}    permit    Received permission
 */
function xows_gui_notify_query_handle(permit)
{
  // update notify button for all opened peers
  for(const addr in xows_doc_frag_db) {
    const peer = xows_cli_peer_get(addr, XOWS_PEER_ANY);
    if(peer) xows_gui_chat_noti_update(peer); //< update notify button
  }

  // If user allowed notifications, then enable
  if(permit === "granted") {
    // Send and reset awaiting notification
    if(xows_gui_notify_await) {
      xows_gui_notify_push(xows_gui_notify_await.peer, xows_gui_notify_await.body);
      xows_gui_notify_await = null;
    }
  }
}

/**
 * Query user for notification permission
 */
function xows_gui_notify_query()
{
  // Request permission to user
  if(Notification.permission !== "granted")
    Notification.requestPermission().then(xows_gui_notify_query_handle);
}

/**
 * Test current notification permission status
 *
 * @param   {string}    status    Permission status string to test
 *
 * @return  {boolean}   True if permission status matches, false otherwise
 */
function xows_gui_notify_permi(status)
{
  return (Notification.permission === status);
}

/**
 * Pop a new browser Notification
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    body      Notification body (message body)
 */
function xows_gui_notify_push(peer, body)
{
  if(!peer.noti)
    return;

  xows_log(2,"gui_notify_push", peer.name, Notification.permission);

  switch(Notification.permission)
  {
  case "denied":
    return;

  case "granted":
    {
      // Retrieve the cached, actual or temporary, avatar dataUrl
      const icon = xows_cach_avat_get(peer.avat);
      // Push new notification
      const notif = new Notification(peer.name,{"body":body,"icon":(icon?icon:("/"+xows_options.root+"/icon.svg"))});
      // Sound is slower than light...
      xows_gui_sound_play("notify");
    }
    break;

  default:
    // Hold pending notification to be sent after permission
    xows_gui_notify_await = {"peer":peer,"body":body};
    // Request user permission for notifications
    xows_gui_notify_query();
    break;
  }
}

/* -------------------------------------------------------------------
 *
 * Browser Window - Document title management
 *
 * -------------------------------------------------------------------*/

/**
 * Stack for document title changes
 */
let xows_gui_title_stack = [];

/**
 * Push the title stack and set new document title
 *
 * @param   {string}    title     Title to set
 */
function xows_gui_title_push(title)
{
  xows_gui_title_stack.push(document.title);
  document.title = title;
}

/**
 * Pop title stack and restore previous document title
 */
function xows_gui_title_pop()
{
  document.title = xows_gui_title_stack.pop();
}

/* -------------------------------------------------------------------
 *
 * Browser Window - Input Handling
 *
 * -------------------------------------------------------------------*/

/**
 * Chat Editor table to store current pressed (down) key
 */
const xows_gui_keyd = new Array(256);

function xows_gui_wnd_onkey(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Enable key down according received event
  xows_gui_keyd[event.keyCode] = (event.type === "keydown");

  // Check for key down event
  if(event.type === "keydown") {

    // Check for pressed Esc
    if(event.keyCode === 27) {
      // Cancel any message correction
      xows_gui_mesg_edit_close(event.target);
      // Cancel any message retraction
      xows_gui_mesg_trsh_abort(event.target);
    }

    // Check for pressed Enter
    if(event.keyCode === 13) {

      // Check whether shift key is press, meaning escaping to
      // add new line in input instead of send message.
      if(xows_gui_keyd[16])
        return;

      // Prevent browser to append the new-line in the text-area
      event.preventDefault();

      switch(event.target.tagName)
      {
      case "CHAT-INPT":
        xows_gui_chat_inpt_enter(event.target);
        break;
      case "MESG-INPT":
        xows_gui_mesg_edit_valid(event.target);
        break;
      }
    }
  }
}

/* -------------------------------------------------------------------
 *
 * Main Interactive Elements
 *
 * -------------------------------------------------------------------*/

/* -------------------------------------------------------------------
 *
 * Main Screen
 *
 * -------------------------------------------------------------------*/

/**
 * Callback function called once Peer loading process finished
 *
 * @param   {object}    peer      Peer Object
 */
function xows_gui_preload_done(peer)
{
  if(xows_gui_peer_doc_cls_has(peer,"chat_load","LOADING")) {

    // Put the chat history scroll DOWN
    xows_gui_peer_scroll_down(peer);

    // Remove loading mask
    xows_gui_peer_doc_cls_rem(peer,"chat_load","LOADING");
  }

  // Show or Hide Occupant list if Room or not
  xows_doc_cls_tog("main_colr","COL-HIDE",(peer.type !== XOWS_PEER_ROOM));
}

/**
 * If Peer GUI documents are in intial state, starts the loading process,
 * otherwise, directly show chat frame.
 *
 * @param   {object}    peer      Peer Object
 */
function xows_gui_preload_peer(peer)
{
  let load_mask = 0;

  if(xows_gui_peer_doc_cls_has(peer,"chat_load","LOADING")) {

    // Close right panel
    xows_doc_cls_add("main_colr","COL-HIDE");

    switch(peer.type)
    {
    case XOWS_PEER_CONT:
      load_mask |= XOWS_LOAD_MAM;
      break;

    case XOWS_PEER_ROOM:
      load_mask |= XOWS_LOAD_MAM;
      break;

    case XOWS_PEER_OCCU:
      // Occupant have nothing to load
      xows_doc_cls_add("hist_beg","HIST-START");
      break;
    }
  }

  xows_load_init(peer, load_mask, xows_gui_preload_done);
}

/**
 * Switch the current active chat contact
 *
 * @param   {string}    addr      Peer JID to select
 */
function xows_gui_switch_peer(addr)
{
  // Get previous (current) contact
  const prev = xows_gui_peer;

  if(prev) {
    // Do no switch to same contact
    if(addr === prev.addr) return;
    // Send chat state to notify current user
    xows_cli_chatstate_define(prev, XOWS_CHAT_GONE);
    // Abort any uploading file
    xows_gui_upld_close();
  }

  // Get the next (to be selected) contact
  const next = addr ? xows_cli_peer_get(addr, XOWS_PEER_ANY) : null;

  if(prev) {
    // export document elements to offscreen fragment
    xows_gui_peer_doc_export(prev);
    // If we are not about to switch Roster Tab, we unselect
    // current <li-peer> to prevent irrelevant selection in case
    // of failure, especially for Room join
    if(!next || (next.type === prev.type)) {
      // Remove "selected" class from <li> element
      xows_gui_rost_unselect();
    }
  }

  const chat_fram = xows_doc("chat_fram");

  // If next contact is valid, show the chat <div>
  chat_fram.hidden = (next === null);

  // Revert window title
  if(prev) xows_gui_title_pop();

  if(next) {

    // Poll for available devices for Multimedia features
    xows_gui_medias_poll();

    // Set the current contact
    xows_gui_peer = next;

    // Select <li-peer> element and toggle to proper tab
    xows_gui_rost_peer_select(next, true, true);

    // Bring back Peer document elements from offscreen
    xows_gui_peer_doc_import(next);

    const is_room = (next.type === XOWS_PEER_ROOM);

    // Set proper chat frame style
    chat_fram.classList.toggle("CHAT-ROOM", is_room);
    chat_fram.classList.toggle("CHAT-CONT",!is_room);

    // Check whether peer need loading, start it or bypass
    xows_gui_preload_peer(next);

    // Clear contact unread notification for next peer
    xows_gui_unread_reset(next);

    // Set input focus to Chat Message Edition input
    xows_gui_chat_inpt_focus();

    // Set window title
    xows_gui_title_push("@" + next.name + " - XOWS");

    // Some debug log
    xows_log(2,"gui_switch_peer","peer \""+next.addr+"\"","selected");

  } else {

    if(xows_gui_peer) {

      xows_log(2,"gui_switch_peer","unselect peer");

      // Set the current contact
      xows_gui_peer = null;

      // Bring back initial document elements from offscreen
      xows_gui_peer_doc_import(null);

      // Close right panel
      xows_doc_cls_add("main_colr","COL-HIDE");
    }
  }
}

/**
 * Switch for Room join
 *
 * @param   {string}    addr      Room JID to join or select
 */
function xows_gui_switch_room(addr)
{
  // Get the next (to be selected) contact
  const room = xows_cli_room_get(addr);

  // If we already joined room, simply switch to it
  if(room && room.join) {
    xows_gui_switch_peer(room.addr);
    return;
  }

  // Close any opened chat window
  xows_gui_switch_peer(null);

  // Close panel in case we are in narrow-screen with wide panel
  xows_gui_panel_close();

  if(room) {
    // Simply join the room
    xows_cli_muc_join_atempt(room);
  } else {
    // Join or create room
    xows_cli_muc_join_atempt(null, addr);
  }
}

/**
 * Main Screen close all side panel
 */
function xows_gui_panel_close()
{
  // Remove any widened panel
  xows_doc_cls_rem("main_wrap", "COLR-WIDE");
  xows_doc_cls_rem("main_wrap", "COLL-WIDE");
}

/**
 * Main screen application open
 */
function xows_gui_main_open()
{
  // Close panel in case we are in narrow-screen with wide panel
  xows_gui_panel_close();

  // show main 'screen'
  xows_doc_show("scr_main");

  // Close any opened menu
  xows_doc_menu_close();

  // Close any opened media view
  xows_doc_view_close();

  // Close any opened page
  xows_doc_page_close();

  // Set window title
  if(xows_doc_hidden("chat_fram"))
    xows_gui_title_push(xows_l10n_get("Home")+" - XOWS");
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Interactions
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Interactions - Disconnect Confirmation Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Disconnect Confirmation message box on-abort callback function
 */
function xows_gui_popu_exit_onabort()
{
  // Nothing to do
}

/**
 * Disconnect Confirmation message box on-valid callback function
 */
function xows_gui_popu_exit_onvalid()
{
  // Disconnect
  xows_cli_flyyoufools();

  // Back nav history
  history.back();
}

/**
 * Disconnect Confirmation message box open
 */
function xows_gui_popu_exit_open()
{
  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_WRN, "Do you really want to disconnect current session ?",
                     xows_gui_popu_exit_onvalid, "Yes",
                     xows_gui_popu_exit_onabort, "No",
                     true);
}

/* -------------------------------------------------------------------
 *
 * Main screen - Commons routines
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 *
 * Main screen - Application Frame
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function to handle click event on GUI Roster Tabs <li>
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_main_tabs_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Widen roster panel (only in narrow-screen)
  xows_gui_rost_widen();

  const btn = event.target.closest("ROST-TAB");
  if(btn) xows_gui_rost_switch(btn.id);
}

/**
 * Select to specified Application Tab
 *
 * @param   {string}    tab_id    Tab ID to select
 *
 * @return  {element}   Toggled Roster <rost-page> Element
 */
function xows_gui_rost_tabs_toggle(tab_id)
{
  let rost_page;

  // Select the proper tab button
  const tabs = xows_doc("rost_tabs").querySelectorAll("ROST-TAB");
  for(let i = 0; i < tabs.length; ++i) {

    const select = (tabs[i].id == tab_id);

    // Add or remove SELECTED class to tab
    xows_doc_cls_tog(tabs[i].id, "SELECTED", select);

    // Hide or Show corresponding Roster page
    const page = xows_doc(tabs[i].dataset.page);
    page.hidden = !select;

    // Keep selected page
    if(select) rost_page = page;
  }

  return rost_page;
}

/* -------------------------------------------------------------------
 *
 * Main screen - Roster Frame
 *
 * -------------------------------------------------------------------*/
 /* -------------------------------------------------------------------
 * Main screen - Roster Frame - Geometry
 * -------------------------------------------------------------------*/
/**
 * Main Screen widen Roster (left) panel
 */
function xows_gui_rost_widen()
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // this behavior is reserved for narrow-screen mode
  if(window.matchMedia("(max-width: 799px)").matches) {

    if(!xows_doc_cls_has("main_wrap", "COLL-WIDE")) {

      // Close right panel (Room Occupants)
      xows_doc_cls_rem("main_wrap", "COLR-WIDE");

      // Widen left panel (Roster)
      xows_doc_cls_add("main_wrap", "COLL-WIDE");
    }
  }
}

/* -------------------------------------------------------------------
 * Main screen - Roster Frame - Interactions
 * -------------------------------------------------------------------*/
/**
 * Roster frame (headers and lists) on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_rost_fram_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Check whether this is click on header buttons
  if(event.target.closest("HEAD-ACTS")) {

    switch(event.target.id)
    {
    case "cont_bt_add":
      // Open contact Add page
      xows_gui_ibox_subs_open();
      break;
    case "room_bt_add":
      // Open Join Room page
      xows_gui_ibox_join_open();
      break;
    case "room_bt_upd":
      // Refresh Room list
      xows_gui_room_list_reload();
      break;
    }

    return;
  }

  // Search for <li-peer> parent element
  const li_peer = event.target.closest("LI-PEER");
  if(!li_peer) return;

  // Check for click on action Button
  if(event.target.tagName === "BUTTON") {
    switch(event.target.name)
    {
    case "cont_bt_rtry": //< Retry request subscribe permission
      // Send subscription request
      xows_gui_popu_subs_rqst(li_peer.id);
      return;
    case "cont_bt_unsb": //< Remove (Unsubscribe) contact
      // Open revoke subscription dialog-box
      xows_gui_mbox_subs_revk_open(xows_cli_cont_get(li_peer.id));
      return;
    }
  }

  // This is a normal click on Peer in list
  if(li_peer.classList.contains("PEER-CONT")) {
    // Select peer
    xows_gui_switch_peer(li_peer.id);
  } else
  if(li_peer.classList.contains("PEER-ROOM")) {
    // Special handling for Room join
    xows_gui_switch_room(li_peer.id);
  } else
  if(li_peer.classList.contains("PEER-OCCU")) {
    // Special handling for Private Message
    xows_gui_switch_peer(li_peer.dataset.id);
  } else
  if(li_peer.classList.contains("PEER-PEND")) {
    // Open Subscription Allow/Deny dialog
    xows_gui_mbox_subs_auth_open(li_peer.id);
  }

  // Close panel in case we are in narrow-screen with wide panel
  xows_gui_panel_close();
}
/* -------------------------------------------------------------------
 *
 * Main screen - Roster Head - Contacts
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Roster Head - Contacts - Subscription Routines
 * -------------------------------------------------------------------*/

/**
 * Check for Peer subscription status, either None (0), Pending (1)
 * or Subscribed/Unavailable (2)
 *
 * @param   {string}     addr     Contact JID to subscribes
 *
 * @return  {number}    Peer subscription status.
 */
function xows_gui_peer_subs_status(peer)
{
  // First check whether contact can be subscribed
  if(xows_cli_can_subscribe(peer)) {

    // Check for <li-peer> with contact address
    const li_peer = xows_gui_rost_li_get(peer.jbar);

    // This mean we are waiting for subscription authoriaztion
    if(li_peer && li_peer.classList.contains("PEER-CONT"))
      return 1;

    // Can subscribe and no pending
    return 0;
  }

  // Already subscribed or subscription unavailable
  return 2;
}

/**
 * Send new subscription authorization request and show popup
 *
 * @param   {string}     addr     Contact JID to subscribes
 */
function xows_gui_popu_subs_rqst(addr)
{
  // Send subscribe request
  xows_cli_subs_request(addr);

  // Show message popup
  xows_doc_popu_open(XOWS_STYL_SCS,"New subscription authorization request was sent");

  // Switch to Contacts tab (after little delay)
  setTimeout(xows_gui_rost_switch, 200, "tab_cont");
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Contacts - Add Subscribe Input Dialog-Box
 * -------------------------------------------------------------------*/
/**
 * Add Contact Input Dialog-Box on-valid callback
 *
 * @param   {object}    value     Input content
 */
function xows_gui_ibox_subs_oninput(value)
{
  xows_doc_ibox_allow(value.length && xows_isjid(value));
}

/**
 * Add Contact Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_subs_onvalid(value)
{
  // Send a new subscription request
  xows_gui_popu_subs_rqst(value);
}

/**
 * Open Add Contact Input Dialog-Box
 */
function xows_gui_ibox_subs_open()
{
  // Open the input box dialog
  xows_doc_ibox_open("Subscribes to contact",
    "A subscription authorization request will be sent to the specified address, you'll have to wait for contact to allow to that request.",
    "Enter contact XMPP address...", null,
    xows_gui_ibox_subs_onvalid, "Add",
    null, null,
    xows_gui_ibox_subs_oninput,
    true);
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Contacts - Edit Subscription Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_subs_revk = {peer:null};

/**
 * Contact (subscription) Add/Remove message box on-abort callback function
 */
function xows_gui_mbox_subs_revk_onabort()
{
}

/**
 * Contact (subscription) Add/Remove message box on-valid callback function
 */
function xows_gui_mbox_subs_revk_onvalid()
{
  // Revoke contact subscription
  xows_cli_subs_revoke(xows_gui_mbox_subs_revk.cont);
}

/**
 * Revoking contact subscription Message-Box Dialog open
 *
 * @param   {object}    cont      Contact object to revoke
 */
function xows_gui_mbox_subs_revk_open(cont)
{
  // Store Contact object
  xows_gui_mbox_subs_revk.cont = cont;

  // Select proper text depending current state
  let text = "Do you really want to remove contact and ";
  if(cont.subs) {
    text += "revoke subscription authorization ?";
  } else {
    text += "abort subscription authorization request ?";
  }

  // Open message-box
  xows_doc_mbox_open(XOWS_STYL_WRN, "Revoke contact subscription", text,
                     xows_gui_mbox_subs_revk_onvalid, "OK",
                     xows_gui_mbox_subs_revk_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Contacts - Subscription Allow/Deny Popup-Box
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_subs_auth = {cont:null};

/**
 * Contact Subscription Allow/Deny message box on-abort callback function
 */
function xows_gui_mbox_subs_auth_onabort()
{
  // deny contact subscribe
  xows_cli_subs_answer(xows_gui_mbox_subs_auth.cont, false);
}

/**
 * Contact Subscription Allow/Deny message box on-valid callback function
 */
function xows_gui_mbox_subs_auth_onvalid()
{
  // allow contact subscribe
  xows_cli_subs_answer(xows_gui_mbox_subs_auth.cont, true);
}

/**
 * Contact Subscription Allow/Deny message box open
 *
 * @param   {string}    addr      Supplied JID address to allow or deny
 */
function xows_gui_mbox_subs_auth_open(addr)
{
  // Store Contact object to allow/deny
  xows_gui_mbox_subs_auth.cont = xows_cli_cont_get(addr);

  // Open message box
  xows_doc_mbox_open(XOWS_STYL_ASK, "Contact subscription request",
                     "A new contact is requesting subscription authorization. Would you like to grant authorization and add this contact ?",
                     xows_gui_mbox_subs_auth_onvalid, "Allow",
                     xows_gui_mbox_subs_auth_onabort, "Deny");
}

/* -------------------------------------------------------------------
 *
 * Main screen - Roster Head - Rooms
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Roster Head - Rooms - Join Input Dialog-Box
 * -------------------------------------------------------------------*/
/**
 * Join Room Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_join_oninput(value)
{
  if(value.length) {
    if(value.includes("@")) {
      xows_doc_ibox_allow(xows_isjid(value));
    } else {
      xows_doc_ibox_allow(true);
    }
  } else {
    xows_doc_ibox_allow(false);
  }
}

/**
 * Join Room Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_join_onvalid(value)
{
  // Join or create room
  xows_gui_switch_room(value);
}

/**
 * Open Join Room Input Dialog-Box
 */
function xows_gui_ibox_join_open()
{
  // Open the input box dialog
  xows_doc_ibox_open("Join or create a Channel",
    "If the specified Room does not exist and if server does not restrict rooms creation, a new Room will be created with you as owner.",
    "Enter Channel name or address...", null,
    xows_gui_ibox_join_onvalid, "Join",
    null, null,
    xows_gui_ibox_join_oninput,
    true);
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Rooms - Room Join Handling
 * -------------------------------------------------------------------*/

/**
 * Handle the received MUC Room initial Own presence (Just Joinded Room)
 *
 * @param   {object}    room      Room object
 * @param   {object}   [code]     Optionnal list of status code
 * @param   {object}   [error]    Error data if any
 */
function xows_gui_cli_onroomjoin(room, code, error)
{
  // Handle error if any
  if(error) {

    if(error.type == "auth") {
      // User is banned
      if(error.name == "forbidden") { // banned user
        // Open error message dialog
        xows_gui_mbox_join_fail_open("auth","You cannot join this Channel because you are banned.");
        return;
      }
      // Room require password
      if(error.name == "not-authorized") {
        // Open Room Password input dialog
        xows_gui_ibox_join_pass_open(room);
        return;
      }
      // Room require registration
      if(error.name == "registration-required") {
        // Open Room Registration input dialog
        xows_gui_ibox_join_regi_open(room);
        return;
      }
    }

    if(error.type == "cancel") {
      // Room creation not allowed
      if(error.name == "not-allowed") {
        // Open error message dialog
        xows_gui_mbox_join_fail_open("create","The specified Channel does not exists and Channel creation is restricted.");
        return;
      }
      // TODO: Nickname conflict
      if(error.name == "conflict") {
        // Open Room Nickname Conflict input dialog
        xows_gui_ibox_join_cflt_open(room);
        return;
      }
      // TODO: Room not available
      if(error.name == "item-not-found") {
      }
    }

    if(error.type == "wait") {
      // TODO:
      if(error.name == "service-unavailable") {
      }
    }

    // Open default error message dialog
    xows_gui_mbox_join_fail_open("","<"+error.name+"> "+error.text);

    return;
  }

  // check if this is a re-join after connection loss
  if(room.rcon) {

    // We do NOT switch to room automatically
    room.rcon = false; //< reset flag

  } else {

    // Switch peer to newly joined room
    xows_gui_switch_peer(room.addr);

    // Close panel in case we are in narrow-screen with wide panel
    xows_gui_panel_close();
  }

  // Update privileges related GUI elements
  xows_gui_peer_chat_update(room);

  // Check whether Room is awaiting initial configuration
  if(room.init)
    xows_gui_mbox_conf_open(room);
}
/**
 * Handle the received MUC Room terminal Own presence (Room exit)
 *
 * @param   {object}    room      Room object
 * @param   {object}   [mucx]     Optionnal MUC x extra parameters
 */
function xows_gui_cli_onroomexit(room, mucx)
{
  // Close chat window if Room is current peer
  if(room === xows_gui_peer)
    xows_gui_switch_peer(null);

  // Reset offscreen element for this Room
  xows_gui_peer_doc_reset(room);

  // Possible MUC Status codes
  //
  // 301: A user has been banned from the room
  // 307: A user has been kicked from the room
  // 321: A user is being removed from the room because of an affiliation change
  // 322: A user is being removed from the room because the room has been changed to members-only
  // 333: A user was removed because of an error reply (server error)

  let text = null;

  if(mucx.code.includes(301))
    text = xows_l10n_get("You were banned from the Channel");

  if(mucx.code.includes(307))
    text = xows_l10n_get("You were kicked from the Channel");

  if(mucx.code.includes(321))
    text = xows_l10n_get("Rules changes caused you to leave the Channel");

  if(mucx.code.includes(321))
    text = xows_l10n_get("Server error caused you to leave the Channel");

  if(text) {
    text += " <b>"+room.name+"</b>";
    xows_doc_popu_open(XOWS_SIG_WRN,text);
  }
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Rooms - Join Error Message-Box
 * -------------------------------------------------------------------*/
/**
 * Open an error message dialog-box for room join context
 *
 * @param   {string}    type      Error type
 * @param   {string}    text      Message to set
 */
function xows_gui_mbox_join_fail_open(type, text)
{
  let head;

  switch(type)
  {
  case "auth": head = "Channel access";  break;
  case "create": head = "Channel creation"; break;
  default: head = "Channel join error";
  }

  // Open message dialog
  xows_doc_mbox_open(XOWS_STYL_ERR, head, text, null, null, null, null);
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Rooms - Join Register Input Dialog-Box
 * -------------------------------------------------------------------*/
/**
 * Register Room Input Dialog-Box parameters
 */
const xows_gui_ibox_join_regi = {room:null};

/**
 * Register Room Input Dialog-Box register result callback
 *
 * @param   {object}    value     Room object
 * @param   {string}    type      Result type string
 * @param   {object}    error     Error data if any
 */
function xows_gui_ibox_join_regi_onresult(room, type, error)
{
  if(type == "error") {
    if(error) {
      switch(error.name)
      {
      case "conflict": //< nickname conflict
        // Open register dialog again
        xows_gui_ibox_join_regi_open(room);
        // Set dialog error
        xows_doc_ibox_error("Nickname is already reserved in this Room");
        return;
      case "not-allowed": //< not allowed to register
      case "registration-required": //< seem to be Prosody specific
        // Open error message dialog
        xows_gui_mbox_join_fail_open("auth","You cannot join this Channel because its access is restricted to members only.");
        return;
      // User is banned
      case "forbidden": // banned user
        // Open error message dialog
        xows_gui_mbox_join_fail_open("auth","You cannot join this Channel because you are banned.");
        return;
      }
    }
    // Default error message
    xows_gui_mbox_join_fail_open("auth","Channel registration request failed.");
    return;
  }

  // Close the dialog box
  xows_doc_ibox_close();

  // Switch to joined room
  xows_gui_switch_room(room.addr);
}

/**
 * Register Room Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_join_regi_onvalid(value)
{
  const room = xows_gui_ibox_join_regi.room;

  // Try register again
  xows_cli_muc_regi_query(room, value, xows_gui_ibox_join_regi_onresult);
}

/**
 * Open Register Room Input Dialog-Box
 *
 * @param   {object}    room      Room object
 */
function xows_gui_ibox_join_regi_open(room)
{
  xows_gui_ibox_join_regi.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Channel registration"),
    xows_l10n_get("The nickname will be associated with your XMPP address and being reserved for you in this Room."),
    xows_l10n_get("Enter nickname to register..."), room.nick,
    xows_gui_ibox_join_regi_onvalid, "Register",
    null, null,
    null, true);
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Rooms - Join Password Input Dialog-Box
 * -------------------------------------------------------------------*/
/**
 * Room Password Input Dialog-Box parameters
 */
const xows_gui_ibox_join_pass = {room:null};

/**
 * Room Password Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_join_pass_onvalid(value)
{
  const room = xows_gui_ibox_join_pass.room;
  // Update Room password
  room.pass = value;
  // Try join again
  xows_cli_muc_join_retry(room);
}

/**
 * Open Room Password Input Dialog-Box
 *
 * @param   {object}    room      Room object
 */
function xows_gui_ibox_join_pass_open(room)
{
  xows_gui_ibox_join_pass.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Channel password"),
    xows_l10n_get("This Channel is password-protected, you must provide password in order to join it."),
    xows_l10n_get("Enter a password..."), room.pass,
    xows_gui_ibox_join_pass_onvalid, "Join",
    null, null,
    null, true);

  // If room password is not empty, this mean previous try failed
  if(room.pass) xows_doc_ibox_error("The password you entered is incorrect");
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Room - Join Conflict Input Dialog-Box
 * -------------------------------------------------------------------*/
/**
 * Room Nickname Conflict Input Dialog-Box parameters
 */
const xows_gui_ibox_join_cflt = {room:null};

/**
 * Room Nickname Conflict Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_join_cflt_onvalid(value)
{
  const room = xows_gui_ibox_join_cflt.room;
  // Update Room password
  room.nick = value;
  // Try to join again
  xows_cli_muc_join_retry(room);
}

/**
 * Open Room Nickname Conflict Input Dialog-Box
 *
 * @param   {object}    room      Room object
 */
function xows_gui_ibox_join_cflt_open(room)
{
  xows_gui_ibox_join_cflt.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Nickname conflict"),
    xows_l10n_get("Your nickname conflicts with another Channel's occupant, please choose another nickname."),
    xows_l10n_get("Enter a nickname..."), room.nick,
    xows_gui_ibox_join_cflt_onvalid, "Join",
    null, null,
    null, true);
}

/* -------------------------------------------------------------------
 *
 * Main screen - Roster List
 *
 * -------------------------------------------------------------------*/

/**
 * Find Roster's <li-peer> element of specified Peer object
 *
 * @param   {object}    peer      Peer Object
 *
 * @return  (element}   A <li-peer> element or null/undefined if not found
 */
function xows_gui_rost_li_get(peer)
{
  if(peer.type === XOWS_PEER_OCCU) {
    return xows_doc("rost_priv").querySelector("LI-PEER[data-id='"+peer.addr+"']");
  } else {
    return document.getElementById(peer.addr);
  }
}

/**
 * Select to specified roster tab and switch to selected Peer
 *
 * @param   {string}    tab_id    Tab ID to select
 */
function xows_gui_rost_switch(tab_id)
{
  // Select Roster tab and page
  const rost_page = xows_gui_rost_tabs_toggle(tab_id);

  // Search any SELECTED peer in the list to switch to
  let li_peer;
  if(rost_page) li_peer = rost_page.querySelector(".SELECTED");

  // Swicht to selected Peer
  if(li_peer && li_peer.classList.contains("PEER-OCCU")) {
    // Special case for Occupant, they are Private Message session and
    // the Occupant JID is in dataset instead of id
    xows_gui_switch_peer(li_peer.dataset.id);
  } else {
    xows_gui_switch_peer(li_peer ? li_peer.id : null);
  }
}

/**
 * Select or unselect Roster's <li-peer> element of specified Peer object
 * and optionally force switch to corresponding Roster Tab
 *
 * @param   {object}    peer      Peer Object to select/unselect
 * @param   (boolean}   select    Select or unselect
 * @param   (boolean}  [tab]      Switch to corresponding tab
 */
function xows_gui_rost_peer_select(peer, select, tab)
{
  // Search for corresponding <li-peer>
  const li_peer = xows_gui_rost_li_get(peer);

  // Add or remove SELECTED class
  li_peer.classList.toggle("SELECTED", select);

  // Switch to corresponding tab
  if(tab)
    xows_gui_rost_tabs_toggle(li_peer.closest("ROW-PAGE").dataset.tab);
}

/**
 * Unselect any selected Roster's <li-peer> element of the currently
 * displayed Roster page (does not change selection for others)
 */
function xows_gui_rost_unselect()
{
  // Get current visible Roster page
  const rost_page = xows_doc("rost_fram").querySelectorAll("ROW-PAGE");
  for(let i = 0; i < rost_page.length; ++i) {
    if(!rost_page[i].hidden) {
      // Search for selected <li-peer> if any
      const li_peer = rost_page[i].querySelector(".SELECTED");
      // Unselect <li-peer>
      if(li_peer) li_peer.classList.remove("SELECTED");
      break;
    }
  }
}

/* -------------------------------------------------------------------
 * Main screen - Roster List - Calling Notifications
 * -------------------------------------------------------------------*/
/**
 * Function to show or hide an calling status badge on the displayed
 * roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {boolean}   enable    Enable or disable calling status
 */
function xows_gui_calling_set(peer, enable)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_li_get(peer);
  if(!li_peer) return;

  // Inside the <li-peer> search for the <badg-call>
  const badg_call = li_peer.querySelector("badg-call");

  // Increase the current unread count
  badg_call.hidden = !enable;

  // Enable Call badge depending peer type
  switch(peer.type)
  {
  case XOWS_PEER_OCCU:
    xows_doc("priv_call").hidden = !enable;
    break;
  case XOWS_PEER_ROOM:
    xows_doc("room_call").hidden = !enable;
    break;
  default:
    xows_doc("cont_call").hidden = !enable;
  }
}

/* -------------------------------------------------------------------
 * Main screen - Roster List - Unread Notifications
 * -------------------------------------------------------------------*/
/**
 * Function to update roster tab unread notification spot according
 * current state.
 *
 * This function is a 'private' shortcut to avoid code duplication
 * and should not be called alone.
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 */
function xows_gui_unread_tab_update(peer, mesg, call, ring)
{
  // Select proper tab elements depending peer type
  let tab_rost, badg_noti;
  switch(peer.type)
  {
  case XOWS_PEER_ROOM:
    tab_rost = xows_doc("tab_room");
    badg_noti = xows_doc("room_noti");
    break;
  case XOWS_PEER_OCCU:
    tab_rost = xows_doc("tab_priv");
    badg_noti = xows_doc("priv_noti");
    break;
  default:
    tab_rost = xows_doc("tab_cont");
    badg_noti = xows_doc("cont_noti");
    break;
  }

  // Update unread message count
  let remain_mesg = parseInt(badg_noti.dataset.mesg);
  if(mesg) {
    remain_mesg += mesg;
    badg_noti.dataset.mesg = remain_mesg;
  }

  // Update missed call count
  let remain_call = parseInt(badg_noti.dataset.call);
  if(call) {
    remain_call += call;
    badg_noti.dataset.call = remain_call;
  }

  // Update ringing call count
  let remain_ring = parseInt(badg_noti.dataset.ring);
  if(ring) {
    remain_ring += ring;
    badg_noti.dataset.ring = remain_ring;
  }

  // Get subscribe count
  //let remain_subs = parseInt(badg_noti.dataset.subs);

  // Update ringing animation class
  tab_rost.classList.toggle("RINGING", remain_ring > 0);

  // Show or hide notification spot
  /* This si now done via CSS
  let has_notif = (remain_mesg > 0 || remain_call > 0 || remain_ring > 0 || remain_subs > 0);
  badg_noti.hidden = !has_notif;
  */
}

/**
 * Function to add and/or increase an unread message notification on
 * the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {string}    id        Message Id (not yet used)
 */
function xows_gui_unread_mesg(peer, id)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_li_get(peer);
  if(!li_peer) return;

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  // Increase the current unread count
  badg_noti.dataset.mesg = parseInt(badg_noti.dataset.mesg) + 1;

  // Update tab button class and animation according new state
  xows_gui_unread_tab_update(peer, 1, null, null);
}

/**
 * Function to add and toggle ringing call and missed call notification
 * on the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {boolean}   ring      If true set ringing call otherwise set missed call
 */
function xows_gui_unread_call(peer, ring)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_li_get(peer);
  if(!li_peer) return;

  // Add or remove ringing animation to Contact <li-peer>
  li_peer.classList.toggle("RINGING", ring);

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  const had_ring = (parseInt(badg_noti.dataset.ring) > 0);
  badg_noti.dataset.ring = ring ? 1 : 0;
  badg_noti.dataset.call = ring ? 0 : 1;

  // Update tab button class and animation according new state
  xows_gui_unread_tab_update(peer, null, ring ? 0 : 1, (ring ? 1 : (had_ring ? -1 : 0)));
}

/**
 * Function to clear any unread message notification on
 * the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 */
function xows_gui_unread_reset(peer)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_li_get(peer);
  if(!li_peer) return;

  // Remove the ringing call effect
  li_peer.classList.remove("RINGING");

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  // Get unread element to 'substract' for roster tab button update
  const mesg = -(parseInt(badg_noti.dataset.mesg)); //< invert sign
  const ring = -(parseInt(badg_noti.dataset.ring)); //< invert sign
  const call = -(parseInt(badg_noti.dataset.call)); //< invert sign

  // Reset the unread spot <div> properties
  badg_noti.dataset.mesg = 0;
  badg_noti.dataset.ring = 0;
  badg_noti.dataset.call = 0;

  // Update tab button class and animation according new state
  xows_gui_unread_tab_update(peer, mesg, call, ring);
}
/* -------------------------------------------------------------------
 *
 * Main screen - Roster List - Contacts
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Roster List - Contacts - Contacts List
 * -------------------------------------------------------------------*/
/**
 * Function to force query and refresh for Room list
 */
function xows_gui_cont_list_reload()
{
  xows_gui_switch_peer(null);
  // Empty the lists
  xows_doc("cont_pend").hidden = true;
  xows_doc("cont_pend").innerText = "";
  xows_doc("cont_budy").hidden = true;
  xows_doc("cont_budy").innerText = "";

  // Add loading spinner at top of list
  xows_doc_cls_add("cont_list","LOADING");

  // Query for roster content
  xows_cli_rost_get_query();
}

/**
 * Updates the Contact list according contacts presents
 */
function xows_gui_cont_list_update()
{
  // Remove the potential loading spinner
  xows_doc_cls_rem("cont_list","LOADING");

  // show and hide proper <ul> as required
  const cont_pend = xows_doc("cont_pend");

  // We need the count of pending subscribe
  const subs_list = cont_pend.querySelectorAll("LI-PEER");
  cont_pend.hidden = (subs_list.length == 0);

  // Update the notification badge
  xows_doc("cont_noti").dataset.subs = subs_list.length;

  const cont_budy = xows_doc("cont_budy");
  cont_budy.hidden = (cont_budy.querySelector("LI-PEER") === null);
}

/**
 * Function to add or update item of the roster contact list
 *
 * @param   {object}    cont      Contact object to add or update
 * @param   {string}   [text]     Optional Error text
 */
function xows_gui_cli_oncontpush(cont, text)
{
  // Null Contact mean we properly received Roster Contacts list
  // but it is empty (user doesn't have any Contact in roster).
  if(!cont) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_list","LOADING");
    return;
  }

  // Search for existing contact <li-peer> element
  let li_peer = xows_gui_rost_li_get(cont);
  if(li_peer) {

    // Check whether this is a pending subscription request
    if(li_peer.className == "PEER-PEND") {

      if(cont.subs != XOWS_SUBS_NONE) {
        // We added contact to our contact list, we need to create
        // a new <li-peer> and delete subscribe request
        xows_doc("cont_pend").removeChild(li_peer);
        li_peer = null; //< Force creation of a new <li-peer> element
      }

    } else {

      // Update the existing contact <li-peer> element according template
      xows_tpl_update_rost_cont(li_peer, cont, text);
      // Update chat title bar
      xows_gui_peer_chat_update(cont);
      // Update message history
      xows_gui_hist_update(cont, cont);
      // If contact goes offline, ensure chatstat resets
      if(cont.show < 1) xows_gui_cli_onchatstate(cont, 0);
    }
  }

  // Select proper destination list to add Contact/Subscription request
  const dst_ul = (cont.subs & XOWS_SUBS_TO) ? xows_doc("cont_budy") :
                                              xows_doc("cont_pend");

  if(!li_peer) {
    // This is a roster contact (with or without pending authorization)
    li_peer = xows_tpl_spawn_rost_cont(cont, text);
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(cont);
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Update Lists visibility
  xows_gui_cont_list_update();
}

/**
 * Function to remove item from the roster Contacts list
 *
 * @param   {object}    cont      Contact Object
 */
function xows_gui_cli_oncontrem(cont)
{
  // Retreive <li_peer> element
  const li_peer = xows_gui_rost_li_get(cont);
  if(li_peer) {

    // If current selected Peer is this one, switch to null
    if(xows_gui_peer === cont)
      xows_gui_switch_peer(null);

    // Remove <li_peer> element
    const src_ul = li_peer.parentNode;
    src_ul.removeChild(li_peer);
  }

  // Update Lists visibility
  xows_gui_cont_list_update();

  // We can delete this Contact from
  xows_cli_cont_rem(cont);
}

/* -------------------------------------------------------------------
 * Main screen - Roster List - Contacts - Subscription List
 * -------------------------------------------------------------------*/
/**
 * Add subscription request to the roster
 *
 * This function add a new Subscription request element in the
 * roster.
 *
 * @param   {object}    cont      Contact Object
 */
function xows_gui_cli_onsubspush(cont)
{
  const dst_ul = xows_doc("cont_pend");

  // Search for existing <li_peer> element
  let li_peer = xows_gui_rost_li_get(cont);
  if(li_peer) {
    // Update existing element
    xows_tpl_update_rost_subs(li_peer, cont);
  } else {
    // Create new <li-peer> element from template
    li_peer = xows_tpl_spawn_rost_subs(cont);
  }

  // Parent <li-peer> element to list
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Update Lists visibility
  xows_gui_cont_list_update();
}

/* -------------------------------------------------------------------
 *
 * Main screen - Roster List - Rooms List
 *
 * -------------------------------------------------------------------*/
/**
 * Function to force query and refresh for Room list
 */
function xows_gui_room_list_reload()
{
  // if current selected room is public, exit
  if(xows_gui_peer && xows_gui_peer.publ)
    xows_gui_switch_peer(null);

  // Add loading animation to Room list
  xows_doc_cls_add("room_list", "LOADING");

  // Empty the Public Room list
  xows_doc("room_publ").innerHTML = "";

  // Query to get public room list with delay
  setTimeout(xows_cli_muc_roomlist_query, 500);
}

/**
 * Updates the Occupant list according occupants presents in room
 *
 * @param   {object}    room      Room object
 */
function xows_gui_room_list_update()
{
  // show and hide proper <ul> as required
  const room_publ = xows_doc("room_publ");
  room_publ.hidden = (room_publ.querySelector("LI-PEER") === null);

  const room_priv = xows_doc("room_priv");
  room_priv.hidden = (room_priv.querySelector("LI-PEER") === null);

  const room_book = xows_doc("room_book");
  room_book.hidden = (room_book.querySelector("LI-PEER") === null);
}

/**
 * Function to add or update item of the roster Room list
 *
 * @param   {object}    room      Room object to add or update
 */
function xows_gui_cli_onroompush(room)
{
  // Check for null object, meaning previous public room query response
  if(!room) {
    // disable loading animation
    xows_doc_cls_rem("room_list", "LOADING");
    // Update room list <ul> visibility
    xows_gui_room_list_update();
    return;
  }

  // Select destination <ul>
  const dst_ul = (room.publ) ? xows_doc("room_publ") :
                              (room.book) ? xows_doc("room_book") :
                                            xows_doc("room_priv");

  let li_peer = document.getElementById(room.addr);
  if(li_peer) {
    // Update room <li_peer> element according template
    xows_tpl_update_rost_room(li_peer, room);
    // Update chat title bar
    xows_gui_peer_chat_update(room);
  } else {
    // Append new instance of room <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_rost_room(room);
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(room);
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Update room list <ul> visibility
  xows_gui_room_list_update();
}

/**
 * Function to add or update item of the roster Room list
 *
 * @param   {object}    room      Room Object
 */
function xows_gui_cli_onroomrem(room)
{
  // Search <li-peer> element
  const li_peer = document.getElementById(room.addr);
  if(li_peer) {

    // switch peer if required
    if(xows_gui_peer && xows_gui_peer === room)
      xows_gui_switch_peer(null);

    // delete <li_peer> element
    li_peer.parentNode.removeChild(li_peer);
  }

  // Update room list <ul> visibility
  xows_gui_room_list_update();

  // Remove Room in client side
  xows_cli_room_rem(room);
}
/* -------------------------------------------------------------------
 *
 * Main screen - Roster List - Private Chats List
 *
 * -------------------------------------------------------------------*/
/**
 * Initialize Private Conversation with Occupant
 *
 * @param   {object}    occu      Occupant object
 */
function xows_gui_priv_init(occu)
{
  // Check if occupant has a real-JID, then check if we can
  // found him in contacts, in this case, bring the contact
  // chat window instead of creating Private Conversation
  if(occu.jbar) {
    if(xows_cli_cont_get(occu.jbar)) {
      // Switch to Contact for chat
      xows_gui_switch_peer(occu.jbar);
      return;
    }
  }

  // Add Private Message session in client side
  xows_cli_priv_add(occu);

  // Create Occupant Private Message offscreen structure
  xows_gui_cli_onprivpush(occu);

  // Switch to Occupant
  xows_gui_switch_peer(occu.addr);
}

/**
 * Function to add or update item of the roster Room list
 *
 * @param   {object}    occu      Occupant object to add or update
 * @param   {object}   [mucx]     Optional MUC x extra parameters
 */
function xows_gui_cli_onprivpush(occu, mucx)
{
  const dst_ul = xows_doc("priv_occu");

  if(mucx) {
    // check for nicname change
    if(mucx.code.includes(303)) {

      // The mucx object should embedd an extrea ad-hoc property
      // containing the old occupant address to switch
      if(!mucx.prev) {
        xows_log(1,"gui_cli_onprivpush","missing previous JID for nickname change");
        return;
      }

      // Search for existing occupant <li-peer> element for this Room
      let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+mucx.prev+"']");

      // Change <li-peer> element data-id
      if(li_peer) li_peer.dataset.id = occu.addr;

      // We also need to reassing offscreen document with new Occupant address
      xows_gui_peer_doc_reassign(occu, mucx.prev);
    }
  }

  let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+occu.addr+"']");
  if(li_peer) {
    // Update occupant <li_peer> element according template
    xows_tpl_update_room_occu(li_peer, occu);
    // Update chat title bar
    xows_gui_peer_chat_update(occu);
    // Update message history
    xows_gui_hist_update(occu, occu);

    // Except for nickname change, if Occupant is found offline, this mean
    // a Private Conversation is open and occupant joined again, so, we inform
    // Occupant is back
    if(occu.show === XOWS_SHOW_OFF) {
      // check for nicname change
      if(!(mucx && mucx.code.includes(303))) {
        // Add message to history
        const hist_ul = xows_gui_peer_doc(occu, "hist_ul");
        hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("joined the conversation")));
      }
    }
  } else {
    // Append new instance of occupant <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_room_occu(occu, true); //< Special for Private Message
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(occu);
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Show the Private Message tab
  xows_doc_show("tab_priv");
}

/**
 * Function to remove or update item of the roster Room list
 *
 * @param   {object}    occu      Occupant object to add or update
 */
function xows_gui_cli_onprivrem(occu)
{
  const dst_ul = xows_doc("priv_occu");

  let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+occu.addr+"']");
  if(li_peer) {

    // Update occupant <li_peer> element according template
    xows_tpl_update_room_occu(li_peer, occu);

    // Update chat title bar
    xows_gui_peer_chat_update(occu);

    // Add message to history
    const hist_ul = xows_gui_peer_doc(occu, "hist_ul");
    hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("has left the conversation")));
  }
}

/* -------------------------------------------------------------------
 *
 * Main Screen - User Panel
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main Screen - User Panel - Presence level menu
 * -------------------------------------------------------------------*/

/**
 * Update the presence menu according current own presence show level
 * and status
 *
 * @param   {object}    self      User Peer object
 */
function xows_gui_cli_onselfpush(self)
{
  xows_doc("self_show").dataset.show = self.show;

  // Create new Avatar CSS class
  xows_doc("self_avat").className = xows_tpl_spawn_avat_cls(self); //< Add avatar CSS class
  xows_doc("self_name").innerText = self.name;

  const self_meta = xows_doc("self_meta");
  self_meta.innerText = self.stat;
  self_meta.className = (self.stat) ? "" : "PLACEHOLD";

  // Update all opened chat history
  let i = xows_cli_cont.length;
  while(i--) xows_gui_hist_update(xows_cli_cont[i], self);

  i = xows_cli_room.length;
  while(i--) xows_gui_hist_update(xows_cli_room[i], self);
}

/**
 * User Panel on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_self_panl_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.id === "self_bt_acct")
    // Open user porfile page
    xows_gui_page_acct_open();

  if(event.target.closest("#self_bttn")) {
    // Open user show/presence level menu
    xows_doc_menu_toggle(xows_doc("self_bttn"), "drop_self",
                         xows_gui_self_bttn_onclick,
                         xows_gui_self_bttn_onshow);
  }
}

/**
 * User Presence (show) menu on-show (open) callback
 *
 * @param   {object}    button    Drop menu button
 * @param   {object}    drop      Drop menu object
 */
function xows_gui_self_bttn_onshow(button, drop)
{
  // Update avatar CSS class
  const cls = xows_tpl_spawn_avat_cls(xows_cli_self);
  drop.querySelector("PEER-AVAT").className = cls;
  drop.querySelector("PEER-NAME").innerText = xows_cli_self.name;
  drop.querySelector("PEER-ADDR").innerText = xows_cli_self.addr;

  // Set status
  const drop_meta = drop.querySelector("PEER-META");
  drop_meta.className = (xows_cli_self.stat) ? "" : "PLACEHOLD";
  drop_meta.innerText = xows_cli_self.stat;
}

/**
 * User Presence (show) menu button/drop on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_self_bttn_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Close menu and unfocus button
  xows_doc_menu_toggle(xows_doc("self_bttn"), "drop_self");

  if(event.target.id === "self_bt_edit")
    xows_gui_page_edit_open();

  if(event.target.closest("#self_mi_stat"))
    xows_gui_ibox_stat_open();

  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");
  if(li) {
    // Set presence as selected level
    const show = parseInt(li.value);
    if(show > 0) {
      xows_cli_show_select(show);
    } else {
      // Reset login page
      //xows_doc("auth_user").value = ""; //< FIXE : ?
      //xows_doc("auth_pass").value = "";

      // Disable credentials (request again for login)
      //if(navigator.credentials)
        //navigator.credentials.preventSilentAccess(); //< FIXE : ?

      // Disconnect
      xows_gui_disconnect();
      return;
    }
  }
}

/* -------------------------------------------------------------------
 * Main Screen - User Panel - User status edition
 * -------------------------------------------------------------------*/
/**
 * Self status message input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_stat_onvalid(value)
{
  // If changed, inform of the new status
  if(value != xows_cli_self.stat)
    xows_cli_status_define(value);
}

/**
 * Self status message input box on-input callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_stat_oninput(value)
{
  // Dummy function to allow to set empty status
}

/**
 * Open self status message input box
 */
function xows_gui_ibox_stat_open()
{
  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Edit status message"),
    xows_l10n_get("Indicate anything you want to mention about your current situation."),
    xows_l10n_get("Enter a status message..."),
    xows_cli_self.stat,
    xows_gui_ibox_stat_onvalid, null,
    null, null,
    xows_gui_ibox_stat_oninput, true);
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Chat Frame
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 *
 * Main Screen - Chat Frame - Header
 *
 * -------------------------------------------------------------------*/
/**
 * Set chat notification elements according notification permission
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_chat_noti_update(peer)
{
  const chat_bt_noti = xows_gui_peer_doc(peer, "chat_bt_noti");

  const notify = (peer.noti && xows_gui_notify_permi("granted"));

  // Set notification mute or enable
  chat_bt_noti.title = notify ? xows_l10n_get("Disable notifications") :
                                xows_l10n_get("Enable notifications");

  // Toggle chat action button class
  chat_bt_noti.classList.toggle("DISABLED", !notify);
}

/**
 * Handle incomming room subjec from MUC room
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    subj      Subject string
 */
function xows_gui_cli_onsubject(peer, subj)
{
  const meta_inpt = xows_gui_peer_doc(peer, "meta_inpt");
  meta_inpt.innerText = subj ? subj : "";
  meta_inpt.className = subj ? "" : "PLACEHOLD";
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Chat Frame - Header - Interactions
 *
 * -------------------------------------------------------------------*/
/**
 * Chat Header on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_head_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  switch(event.target.id)
  {
  case "chat_bt_subj":
    // Open Room topic input box
    xows_gui_ibox_room_subj_open(xows_gui_peer);
    break;
  case "chat_bt_nick":
    // Open Nickname input box
    xows_gui_ibox_room_nick_open(xows_gui_peer);
    break;
  case "chat_bt_bkmk":
    // Open confirmation dialog
    if(xows_gui_peer) xows_gui_popu_room_book_open(xows_gui_peer);
    break;
  case "chat_bt_noti":
    // Set notification for this Peer
    xows_gui_peer.noti = !event.target.classList.toggle("DISABLED");
    // Save parameter in localstorage
    xows_cach_peer_save(xows_gui_peer.addr, null, null, null, xows_gui_peer.noti);
    // Check for browser notification permission
    if(xows_gui_notify_permi("granted")) {
      xows_gui_chat_noti_update(xows_gui_peer); //< update notify button
    } else {
      xows_gui_notify_query(); //< request permission
    }
    break;
  case "chat_bt_cnfg":
    // Query for Chatoom configuration, will open Room config page
    xows_cli_muc_getcfg_query(xows_gui_peer, xows_gui_page_mucc_open);
    break;
  case "chat_bt_occu":
    // Checks whether we are in narrow-screen mode
    if(window.matchMedia("(max-width: 799px)").matches) {
      // Widen right panel
      xows_doc_cls_add("main_wrap", "COLR-WIDE");
    } else {
      // Toggle hide right pannel
      xows_doc_cls_tog("main_colr", "COL-HIDE");
    }
    break;
  case "chat_bt_addc":
    // Send subscription request
    xows_gui_popu_subs_rqst(xows_gui_peer.jbar);
    break;
  case "chat_bt_calv":
  case "chat_bt_cala":
    // Initiate call
    xows_gui_call_invite(xows_gui_peer, {"audio":true,"video":(event.target.id === "chat_bt_calv")});
    break;
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Room Header - Set Subject Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room subject/topic input box param
 */
const xows_gui_ibox_room_subj = {room:null};

/**
 * Room subject/topic input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_room_subj_onvalid(value)
{
  const room = xows_gui_ibox_room_subj.room;

  // Get entered subject
  const subj = value.trimEnd();

  // If changed, inform of the new room topic
  if(subj != room.subj)
    xows_cli_muc_set_subject(room, subj);
}

/**
 * Open Room subject/topic input box
 */
function xows_gui_ibox_room_subj_open(room)
{
  if(room.type !== XOWS_PEER_ROOM)
    return;

  xows_gui_ibox_room_subj.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Set topic of")+" #"+room.name,
    "Set the message of the day, a welcome message or the discussion subject.",
    "Enter a topic...", room.subj,
    xows_gui_ibox_room_subj_onvalid, null, null, null, null, true);
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Room Header - Nickname Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room subject/topic input box param
 */
const xows_gui_ibox_room_nick = {room:null};

/**
 * Room subject/topic input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_ibox_room_nick_onvalid(value)
{
  const room = xows_gui_ibox_room_nick.room;

  // Get entered subject
  const nick = value.trimEnd();

  // If changed, inform of the new room topic
  if(nick != xows_jid_resc(room.join))
    xows_cli_muc_set_nick(room, nick);
}

/**
 * Open Room subject/topic input box
 */
function xows_gui_ibox_room_nick_open(room)
{
  if(room.type !== XOWS_PEER_ROOM)
    return;

  xows_gui_ibox_room_nick.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Nickname for")+" #"+room.name,
    "Specify your new nickname for this Channel.",
    "Enter a nickname...", xows_jid_resc(room.join),
    xows_gui_ibox_room_nick_onvalid, null, null, null, null, true);
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Room Header - Bookmark Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
let xows_gui_popu_room_book_room = null;

/**
 * Add Bookmark message box on-abort callback function
 */
function xows_gui_popu_room_book_onabort()
{
  // reset parameters
  xows_gui_popu_room_book_room = null;
}

/**
 * Add Bookmark message box on-valid callback function
 */
function xows_gui_popu_room_book_onvalid()
{
  // add bookmark
  xows_cli_book_publish(xows_gui_popu_room_book_room);
  xows_gui_popu_room_book_room = null;
}

/**
 * Add Bookmark message box open
 *
 * @param   {object}    room      Room object to add Bookmark
 */
function xows_gui_popu_room_book_open(room)
{
  // Store JID and name of contact to allow/deny
  xows_gui_popu_room_book_room = room;

  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_ASK, "Add Channel to bookmarks ?",
                     xows_gui_popu_room_book_onvalid, "Add Bookmark",
                     xows_gui_popu_room_book_onabort, "Cancel",
                     true);
}

/* -------------------------------------------------------------------
 *
 * Main screen - Chat Frame - Call View
 *
 * -------------------------------------------------------------------*/
/**
 * Chat Call frame on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_view_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.tagName !== "BUTTON")
    return;

  let mutted;

  switch(event.target.id)
  {
    case "call_spkr": {
        const call_volu = xows_doc("call_volu");
        mutted = event.target.classList.toggle("MUTTED");
        xows_gui_audio.vol.gain.value = mutted ? 0 : parseInt(call_volu.value) / 100;
        call_volu.disabled = mutted;
        xows_gui_sound_play(mutted ? "mute" : "unmute"); //< Play sound
      } break;

    case "call_came": {
        mutted = event.target.classList.toggle("MUTTED");
        // Enable/Disable local video tracks
        xows_cli_call_self_mute(xows_gui_peer, "video", mutted);
        xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      } break;

    case "call_micr": {
        mutted = event.target.classList.toggle("MUTTED");
        // Enable/Disable local video tracks
        xows_cli_call_self_mute(xows_gui_peer, "audio", mutted);
        xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      } break;

    case "call_hgup": {
        // Hangup and clear data
        xows_gui_call_hangup(xows_gui_peer,"success");
      } break;

    case "call_expd": {
        // Set Chat Frame layout to exapnd Call Frame
        const full = xows_doc_cls_tog("chat_fram","CALL-FULL");
        // Change expand/reduce button title
        const title = full ? "Reduce" : "Expand";
        xows_doc("call_expd").title = xows_l10n_get(title);
      } break;
  }
}

/**
 * Chat Call Volume slider on-input callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_view_oninput(event)
{
  const gain = parseInt(event.target.value) / 100;

  // Set volume
  xows_gui_audio.vol.gain.value = gain;
  xows_log(2, "gui_call_volu_oninput", "volume", gain);

  // Change volume slider icon according current level
  let cls = "";

  if(gain > 0.66) {
    cls = "RNG-MAX";
  } else if(gain < 0.33) {
    cls = "RNG-MIN";
  }

  xows_doc("call_spkr").className = cls;
}

/**
 * Function to open the Chat Multimedia Call Session layout
 *
 * @param   {object}    peer    Peer object
 */
function xows_gui_call_view_open(peer)
{
  const call_view = xows_gui_peer_doc(peer,"call_view");

  // Reset expand/reduce button title
  xows_gui_peer_doc(peer,"call_expd").title = xows_l10n_get("Expand");

  // Reset volume slider and button to initial state
  const call_spkr = xows_gui_peer_doc(peer,"call_spkr");
  const call_volu = xows_gui_peer_doc(peer,"call_volu");

  call_spkr.className = "";
  call_volu.disabled = false;
  call_volu.value = 50;

  // Set gain to current volume slider position
  xows_gui_audio.vol.gain.value = parseInt(call_volu.value) / 100;

  // Reset Microphone and camera button to intial state
  const call_came = xows_gui_peer_doc(peer,"call_came");
  const call_micr = xows_gui_peer_doc(peer,"call_micr");

  call_micr.className = "";
  call_came.className = "";
  call_came.hidden = !xows_cli_call_sess_meds(peer).video;

  if(call_view.hidden) {
    if(peer === xows_gui_peer) {
      // Add event listeners
      xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
      xows_doc_listener_add(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
    }

    // Show Call view
    call_view.hidden = false;
  }
}

/**
 * Function to close Multimedia Call Session layout
 *
 * @param   {object}    peer    Peer object
 */
function xows_gui_call_view_close(peer)
{
  const call_view = xows_gui_peer_doc(peer,"call_view");

  // Mute sound
  xows_gui_audio.vol.gain.value = 0;

  if(peer === xows_gui_peer) {
    // Remove event listeners
    xows_doc_listener_rem(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
    xows_doc_listener_rem(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
  }

  // Hide Call view
  call_view.hidden = true;

  // Empty the peer/stream view grid
  xows_gui_peer_doc(peer,"call_grid").innerHTML = "";

  // Reset Chat frame layout
  xows_doc("chat_fram").classList.remove("CALL-FULL");
}

/**
 * Function to add peer to the Chat Multimedia session (Call view)
 * interface
 *
 * @param   {object}    peer      Call Peer object
 * @param   {object}    part      Participant Peer object
 * @param   {object}    stream    Participant Stream object
 */
function xows_gui_call_view_part_add(peer, part, stream)
{
  const call_grid = xows_gui_peer_doc(peer, "call_grid");

  const is_video = stream.getVideoTracks().length;
  if(is_video && part.self) return; //< No local video loopback

  // Search for already existing stream for this peer
  let element = call_grid.querySelector("div[data-peer='"+xows_cli_peer_iden(part)+"']");

  let media;

  if(element) {
    // Simply update stream
    element.firstChild.srcObject = stream;
    return;
  } else {
    // Create <strm-audio> or <strm-video> element from template
    if(is_video) {
      element = xows_tpl_spawn_stream_video(part);
      media = element.querySelector("video");
    } else {
      element = xows_tpl_spawn_stream_audio(part);
      media = element.querySelector("audio");
    }
  }

  // Mute audio output since it will be managed through AudioContext
  media.muted = true;

  // Creates AudioSource node and store it within Media object
  media.srcNode = xows_gui_audio.ctx.createMediaStreamSource(stream);

  // If stream is Audio we create required stuff for VU-Meter animation
  if(!is_video) {
    // Create Analyser node dans Buffer node stored within the Media
    // objecy to perform audio peek analysis for visual effects
    media.fftNode = xows_gui_audio.ctx.createAnalyser();
    media.fftNode.fftSize = 2048;
    media.fftBuff = new Float32Array(media.fftNode.frequencyBinCount);
    media.srcNode.connect(media.fftNode);
  }

  // Connect AudioSource -> Analyser [-> GainNode]
  if(!part.self) media.srcNode.connect(xows_gui_audio.vol);

  // Set stream to Media element
  media.srcObject = stream;
  media.autoplay = true;

  // Add Stream element to layout
  if(part.self) {
    call_grid.insertBefore(element, call_grid.firstChild);
  } else {
    call_grid.appendChild(element);
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - VU-Meter animation
 * -------------------------------------------------------------------*/
/**
 * Call View VU-Meter animation interval handle.
 */
let xows_gui_call_view_vumet_hnd = null;

/**
 * Start the Call View VU-Meter animation
 *
 * The VU-Meter animation (which is not strictly a VU-Meter) is used to
 * show visual feedback according audio volume arround Chat Call frame
 * participants.
 *
 * @param   {number}    rate    Animation refresh rate in miliseconds
 */
function xows_gui_call_view_vumet_run(rate)
{
  if(!xows_gui_call_view_vumet_hnd)
    xows_gui_call_view_vumet_hnd = setInterval(xows_gui_call_view_vumet_anim, rate);
}

/**
 * Stop the Call View VU-Meter animation
 */
function xows_gui_call_view_vumet_stop()
{
  clearInterval(xows_gui_call_view_vumet_hnd);
  xows_gui_call_view_vumet_hnd = null;
}

/**
 * Call View VU-Meter animation function.
 *
 * The VU-Meter animation (which is not strictly a VU-Meter) is used to
 * show visual feedback according audio volume arround Chat Call frame
 * participants.
 *
 * This function is used within a loop (using requestAnimationFrame) to
 * perform real-time audio analysis of input audio stream to change the
 * proper HTML element color according silence or speaking.
 */
function xows_gui_call_view_vumet_anim()
{
  // Avoid useless calculations
  if(xows_doc("call_view").hidden)
    return;

  // Get list of Audio Media objects
  const audio = xows_doc("call_grid").querySelectorAll("audio");

  // For each Audio object
  for(let i = 0; i < audio.length; ++i) {

    // Get Analyzer time domain (PCM samples)
    audio[i].fftNode.getFloatTimeDomainData(audio[i].fftBuff);

    // Get peek value for window
    let data, peek = 0.0;
    for(let j = 0; j < audio[i].fftBuff.length; j++) {
      data = Math.abs(audio[i].fftBuff[j]); // raw data are between 1.0 and -1.0
      if(data > peek) peek = data;
    }

    // If peek value is greater than threshold, change color
    const color = peek > 0.08 ? "var(--link-base)" : "var(--text-tone4)";
    if(audio[i].parentNode.style.borderColor !== color) {
      audio[i].parentNode.style.borderColor = color;
    }
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Ringing dialog
 * -------------------------------------------------------------------*/
/**
 * Constants for Ring dialog type
 */
const XOWS_RING_TERM = 0;
const XOWS_RING_NEGO = 1;
const XOWS_RING_RING = 2;

/**
 * History Call Ringing dialog on-click callback
 *
 * @param   {object}    event      Event object
 */
function xows_gui_call_ring_onclick(event)
{
  const call_ring = xows_gui_peer_doc(xows_gui_peer,"call_ring");

  switch(event.target.id)
  {
  case "ring_bt_clos":
    // dummy case, will close dialog
    break;

  case "ring_bt_deny":
    // Reject or abort call
    let reason;
    if(call_ring.classList.contains("CALL-INBD")) {
      xows_gui_call_hangup(xows_gui_peer, "decline");
    } else {
      xows_gui_call_onabort(xows_gui_peer);
    }
    break;

  case "ring_bt_pkup": {
      // Ask user for input devices and send answer
      xows_gui_call_accept(xows_gui_peer);
    } return; //< do not close dialog, it will pass to Negotiation state

  default:
    return; //< return without closing
  }

  // Close dialog
  xows_gui_call_ring_close(xows_gui_peer);
}

/**
 * Show the History Call Ringing dialog of the specified Peer
 *
 * @param   {object}    peer          Contact Peer object.
 * @param   {number}    type          Dialog type.
 * @param   {string}    reason        Calling dialog open reason
 */
function xows_gui_call_ring_show(peer, type, reason)
{
  const call_ring = xows_gui_peer_doc(peer,"call_ring");

  let is_video = false, inbound = false;

  if(type !== XOWS_RING_TERM) {
    // Check for inbound or outbound call
    inbound = xows_cli_call_sess_inbd(peer);
    // Get session Medias/Constraints
    is_video = xows_cli_call_sess_meds(peer).video;
  }

  let text, tone, bell;

  switch(type)
  {
  case XOWS_RING_RING:
    if(inbound) {
      bell = true;
      text = is_video ? "Incoming video call..." : "Incoming audio call...";
    } else {
      tone = true;
      text = "Call in progress...";
    }
    break;

  case XOWS_RING_NEGO:
    text = "Establishing relay...";
    break;

  case XOWS_RING_TERM:
      switch(reason)
      {
      case "decline":    //< peer declined call
        text = "The call has been declined";
        break;

      case "buzy":       //< peer is buzy
        text = "The other party is buzy";
        break;

      case "success":    //< peer hung up call
        text = xows_cli_call_sess_cntd(peer) ? "The other party hung up" : "You missed a call";
        break;
      }
    break;
  }

  call_ring.classList.toggle("CALL-VISI", is_video);
  call_ring.classList.toggle("CALL-RING", (type === XOWS_RING_RING));
  call_ring.classList.toggle("CALL-NEGO", (type === XOWS_RING_NEGO));
  call_ring.classList.toggle("CALL-TERM", (type === XOWS_RING_TERM));
  call_ring.classList.toggle("CALL-INBD", inbound);

  call_ring.querySelector("RING-TEXT").innerText = xows_l10n_get(text);

  if(bell) {
    xows_gui_sound_play("ringbell"); //< Play Ring Bell sound
  } else {
    xows_gui_sound_stop("ringbell"); //< Stop Ring Bell sound
  }

  if(tone) {
    xows_gui_sound_play("ringtone"); //< Play Ring Bell sound
  } else {
    xows_gui_sound_stop("ringtone"); //< Stop Ring Bell sound
  }

  if(call_ring.hidden) {

    // Add event listener
    if(peer === xows_gui_peer)
      xows_doc_listener_add(call_ring, "click", xows_gui_call_ring_onclick);

    // Show the incoming call dialog
    call_ring.hidden = false;

    // Signals something new appending to chat
    xows_gui_chat_onappend(peer, call_ring, false);
  }
}

/**
 * History Call Ringing dialog of the specified Peer
 *
 * @param   {object}    peer          Contact Peer object.
 */
function xows_gui_call_ring_close(peer)
{
  // Stop Ring Tone & Bell sound
  xows_gui_sound_stop("ringtone");
  xows_gui_sound_stop("ringbell");

  const call_ring = xows_gui_peer_doc(peer,"call_ring");

  // Remove event listener
  if(peer === xows_gui_peer)
    xows_doc_listener_rem(call_ring, "click", xows_gui_call_ring_onclick);

  // Hide the dialog
  call_ring.hidden = true;
}

/* -------------------------------------------------------------------
 *
 * User Media acquisition routines
 *
 * -------------------------------------------------------------------*/
/**
 * User media acquisition routines parameters
 */
const xows_gui_media_ask_param = {constr:null,onmedia:null,onabort:null,data:null};

/**
 * Acquire user input media stream specified by constraints.
 *
 * @param   {object}     constr     Medias constraints to acquire
 * @param   {function}   onmedia    Acquire success callback
 * @param   {function}   onmedia    Acquire abort callback
 * @param   {any}       [data]      Optional extra param to pass to callbacks
 */
function xows_gui_media_ask(constr, onmedia, onabort, data)
{
  const param = xows_gui_media_ask_param;

  // Save parameters
  param.constr = constr;
  param.onmedia = onmedia;
  param.onabort = onabort;
  param.data = data;

  // Send media request to User
  navigator.mediaDevices.getUserMedia(param.constr)
    .then((stream) => param.onmedia(param.data,stream),
          xows_gui_media_fail_open);
}

/**
 * User media acquisition faillure Input-Box on-valid callback
 */
function xows_gui_media_fail_onvalid()
{
  // Get saved parameters
  const param = xows_gui_media_ask_param;

  // Send again media request to User with saved parameters
  navigator.mediaDevices.getUserMedia(param.constr)
    .then((stream) => param.onmedia(param.data,stream),
          xows_gui_media_fail_open);
}

/**
 * User media acquisition faillure Input-Box on-abort callback
 */
function xows_gui_media_fail_onabort()
{
  // Get saved parameters
  const param = xows_gui_media_ask_param;

  // Call on-abort callback
  if(xows_isfunc(param.onabort))
    param.onabort(param.data);
}

/**
 * User media acquisition faillure Input-Box open
 *
 * This function is called as default fallback when user media acquisition
 * failed.
 */
function xows_gui_media_fail_open()
{
  xows_log(1,"gui_media_fail_open","user media acquisition failed");

  // Display popup error message
  xows_doc_popu_open(XOWS_SIG_WRN, "Unable to get device stream for media call session",
                     xows_gui_media_fail_onvalid, "Retry",
                     xows_gui_media_fail_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 *
 * Multimedia-Call management
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Multimedia-Call - GUI management functions
 * -------------------------------------------------------------------*/
/**
 * Hangup and clear all active or pending call sessions
 */
function xows_gui_call_clear()
{
  let peers = xows_cli_call_peer_list();

  for(let i = 0; i < peers.length; ++i) {

    // Hang up with peer
    xows_cli_call_hangup(peers[i], "failed-application");

    // Close and reset GUI elements
    xows_gui_call_exit(peers[i]);
  }
}

/**
 * Multimedia-Call clear and reset GUI element for the specified Peer
 *
 * @param   {object}     peer       Related Peer object
 */
function xows_gui_call_exit(peer)
{
  // Remove calling badge from roster contact
  xows_gui_calling_set(peer, false);

  // Close any potentially opened Call view frame
  xows_gui_call_view_close(peer);

  // If no more call sessions, stop VU-Meter animation
  if(!xows_cli_call_sess_count())
    xows_gui_call_view_vumet_stop();
}

/* -------------------------------------------------------------------
 * Multimedia-Call - Call interactions functions
 * -------------------------------------------------------------------*/
/**
 * Multimedia-Call terminate call for the specified Peer. This function is
 * called when user takes the initiative to hang-up.
 *
 * If not 'reason' is provided, data for the specified Remote peer is cleared
 * without sending session terminate signaling.
 *
 * @param   {object}     peer       Related Peer object
 * @param   {string}    [reason]    Optionnal reason to HangUp
 */
function xows_gui_call_hangup(peer, reason)
{
  // Hang up with peer
  xows_cli_call_hangup(peer, reason);

  // Close and reset GUI elements
  xows_gui_call_exit(peer);

  // Play Hangup sound
  xows_gui_sound_play("hangup");
}

/**
 * Multimedia-Call accept (Answer) incomping call from the specified Peer
 *
 * This function is a transition function that only starts user Media
 * Acquisition process. Once user authorized media and stream acquired, the
 * xows_gui_call_accept_onstream is called to launch proper routines for
 * call accept (Answer).
 *
 * If the constr parameter is set to null, the function automatically
 * determines proper media constraints according peer's medias and current
 * available inputs.
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     constr       Constraints for media aquisition
 */
function xows_gui_call_accept(peer, constr)
{
  if(!constr) {

    // Get session medias (remote medias, at this stage)
    constr = xows_cli_call_sess_meds(peer);

    // keep only the full-duplex ables medias.
    constr.audio = constr.audio && xows_gui_medias_has("audioinput");
    constr.video = constr.video && xows_gui_medias_has("videoinput");
  }

  // Send media request to User
  xows_gui_media_ask(constr, xows_gui_call_accept_onstream, xows_gui_call_onabort, peer);
}

/**
 * Callback for Multimedia-Call accept (Answer) local stream acquired
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Acquired local input Stream
 */
function xows_gui_call_accept_onstream(peer, stream)
{
  // Answer call
  xows_cli_call_accept(peer, stream);

  // Open Ring dialog in Negotiation mode
  xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);

  // Get session medias (remote medias, at this stage)
  const constr = xows_cli_call_sess_meds(peer);

  // keep only medias that are reciprocal
  constr.audio = constr.audio && xows_gui_medias_has("audioinput");
  constr.video = constr.video && xows_gui_medias_has("videoinput");

  // Add local participant (ourself) to Call View
  xows_gui_call_view_part_add(peer, xows_cli_self, stream);
}

/**
 * Multimedia-Call invite (Offer) the specified Peer for a call
 *
 * This function is a transition function that only starts user Media
 * Acquisition process. Once user authorized media and stream acquired, the
 * xows_gui_call_invite_onstream is called to launch proper routines for
 * call initiation (Offer).
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     constr       Constraints for media aquisition
 */
function xows_gui_call_invite(peer, constr)
{
  // Send media request to User, on success call 'xows_cli_call_invite'
  xows_gui_media_ask(constr, xows_gui_call_invite_onstream, xows_gui_call_onabort, peer);
}

/**
 * Callback for Multimedia-Call invite (Offer) local stream acquired
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Acquired local input Stream
 */
function xows_gui_call_invite_onstream(peer, stream)
{
  // Initiate call (create session)
  xows_cli_call_invite(peer, stream);

  // Open Ring dialog in Negotiation mode
  xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);

  // Add local participant (ourself) to Call View
  xows_gui_call_view_part_add(peer, xows_cli_self, stream);
}

/**
 * Callback for Multimedia-Call invite/accept media acquisition aborted
 *
 * @param   {object}     peer         Related Peer object
 */
function xows_gui_call_onabort(peer)
{
  // Set Ring dialog in Negotiation mode
  xows_gui_call_ring_close(peer);

  // Hang up (this will clear call stuff)
  xows_gui_call_hangup(peer, null);
}

/* -------------------------------------------------------------------
 * Multimedia-Call - Client interface callbacks
 * -------------------------------------------------------------------*/
/**
 * Callback for Multimedia-Call received call invite (inbound Offer)
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_cli_oncalloffer(peer, stream)
{
  // Start the VU-Meter animation for Call View
  xows_gui_call_view_vumet_run(50);

  // Add remote participant to Call View
  xows_gui_call_view_part_add(peer, peer, stream);

  // If peer is offscreen during incomming call, add notification
  if(peer !== xows_gui_peer)
    xows_gui_unread_call(peer, true);

  // Open Ring dialog in Ringing mode
  xows_gui_call_ring_show(peer, XOWS_RING_RING, null);
}

/**
 * Callback for Multimedia-Call received call accept (inbound Answer)
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_cli_oncallanwse(peer, stream)
{
  // Start the VU-Meter animation for Call View
  xows_gui_call_view_vumet_run(50);

  // Add remote participant to Call View
  xows_gui_call_view_part_add(peer, peer, stream);
}

/**
 * Callback for Multimedia-Call negotiation state changes
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     stream       Remote media stream
 */
function xows_gui_cli_oncallstate(peer, state)
{
  if(state === "ringing") {

    // Set Ring dialog in Ringing mode
    xows_gui_call_ring_show(peer, XOWS_RING_RING, null);
  }

  if(state === "gathering") {

    // Set Ring dialog in Negotiation mode
    xows_gui_call_ring_show(peer, XOWS_RING_NEGO, null);
  }

  if(state === "connected") {

    // Set Ring dialog in Negotiation mode
    xows_gui_call_ring_close(peer);

    // Add calling badge to roster contact
    xows_gui_calling_set(peer, true);

    // Open Chat Multimedia View layout
    xows_gui_call_view_open(peer);
  }
}

/**
 * Callback for Multimedia-Call received call termination
 *
 * @param   {object}     peer     Related Peer object
 * @param   {string}     reason   Termination reason string
 */
function xows_gui_cli_oncalltermd(peer, reason)
{
  // Open the Call dialog
  xows_gui_call_ring_show(peer, XOWS_RING_TERM, reason);

  // Close and reset GUI elements
  xows_gui_call_exit(peer);

  // Play Hangup sound
  xows_gui_sound_play("hangup");
}

/**
 * Callback for Multimedia-Call received call error
 *
 * @param   {object}     peer     Related Peer object
 * @param   {object}     error    Error data (DOMException)
 */
function xows_gui_cli_oncallerror(peer, error)
{
  const text = xows_l10n_get("Call session error") + ": ";
  // Display popup error message
  xows_doc_popu_open(XOWS_SIG_ERR,text+error.message);

  // Hangup with peer
  xows_gui_call_hangup(peer, "failed-application");
}

/* -------------------------------------------------------------------
 *
 * Main screen - Chat Frame - History
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Interaction
 * -------------------------------------------------------------------*/

/**
 * Callback function to handle and process chat frame resizing
 *
 * This callback may be called either by Document "resize" event listener
 * or ResizeObserver object.
 *
 * @param   {object}    event   Event object or array of ResizeObserverEntry
 * @param   {object}    observ  Reference to calling ResizeObserver or undefined
 * @param   {}
 */
function xows_gui_chat_onresize(event, observ)
{
  if(xows_gui_peer)
    xows_doc_scrl_keep(document.getElementById("chat_main"));
}

/**
 * Callback function to handle user scroll the chat history window
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_onscroll(event)
{
  if(!xows_gui_peer)
    return;

  // Check whether the "onscroll" event was fired by an automatic scroll
  // position adjustement, in this case we ignore the event as we are only
  // intereseted by scroll user.
  if(xows_doc_scrl_edited())
    return;

  const chat_main = xows_doc("chat_main");

  // Save scroll position
  xows_gui_peer_scroll_save(xows_gui_peer);

  // If scroll near of top, fetch older history
  if(chat_main.scrollTop < xows_doc("hist_beg").offsetHeight * 0.8) {
    // Query archive for current chat contact
    xows_gui_mam_fetch_older(xows_gui_peer);
  }

  // Show, hide or modify navigation bar according scroll position
  xows_gui_chat_nav_update(xows_gui_peer, chat_main.scrollBottom, chat_main.clientHeight);
}

/**
 * Callback function to handle user click in chat history
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_hist_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Check for click on New Message notification banner
  if(event.target.tagName === "IMG") {
    // Open image viewer
    xows_doc_view_open(event.target);
    return;
  }

  // Check for closest <mesg-rply> parent
  const mesg_rply = event.target.closest("MESG-RPLY");
  if(mesg_rply) {
    // Highlight replied message
    xows_gui_hist_mesg_focus(xows_gui_peer, mesg_rply.dataset.id);
    return;
  }

  // Check for closest <li-mesg> parent
  const li_msg = event.target.closest("LI-MESG");
  if(!li_msg)
    return;

  // Special behavior for mobile devices to allow message interaction
  if(event.type.startsWith("touch")) {

    // Unselect any previousely selected message
    const li_selected = xows_doc("hist_ul").querySelector("LI-MESG.SELECTED");
    if(li_selected) li_selected.classList.remove("SELECTED");

    // Select the 'touched' message
    if(li_msg) li_msg.classList.add("SELECTED");
  }

  // Check for click on <button> element
  if(event.target.tagName === "BUTTON") {

     // If button has a valid name, this is history message button
     if(event.target.name) {

      switch(event.target.name)
      {
      case "mesg_bt_edit":
        xows_gui_mesg_edit_open(li_msg);
        break;
      case "edit_bt_abort":
        xows_gui_mesg_edit_close(li_msg);
        break;
      case "edit_bt_valid":
        xows_gui_mesg_edit_valid(li_msg.querySelector("MESG-INPT"));
        break;

      case "mesg_bt_trsh":
        xows_gui_mesg_trsh_open(li_msg);
        break;
      case "trsh_bt_abort":
        xows_gui_mesg_trsh_abort(li_msg);
        break;
      case "trsh_bt_valid":
        xows_gui_mesg_trsh_valid(li_msg);
        break;

      case "mesg_bt_rply":
        xows_gui_chat_rply_set(li_msg);
        break;
      }

      return;
    }
  }
}

/**
 * Function to handle new element appended to chat frame, either
 * incomming history message, call ring notification, file upload
 * progress dialog, etc.
 *
 * @param   {object}    event     Event object associated with trigger
 * @param   {element}   element   Element that was appended to chat frame
 * @param   {boolean}  [self]     Signal action is result of user itself
 */
function xows_gui_chat_onappend(peer, element, self)
{
  let scrolldown = false;

  // Check whether user is scrolling far from bottom
  if((xows_gui_peer_scroll_get(peer) > 50)) {
    if(element.tagName === "LI-MESG") {
      // This is an appended message to history
      if(self) {
        // Force scrolling down
        scrolldown = true;
      } else {
        // Open chat "unread" navigation ribbon
        xows_gui_chat_nav_show(peer,"UNREAD");
      }
    }
    if(element.id === "call_ring") {
      // Open chat "unread" navigation ribbon
      xows_gui_chat_nav_show(peer,"RINGING");
    }
    if(element.id === "hist_upld") {
      // Force scrolling down
      scrolldown = true;
    }
  }

  if(scrolldown) {

    xows_gui_peer_scroll_down(peer, false);

  } else {

    // Keep scroll to proper position from bottom. Calling this
    // manually allow us to get rid of ResizeObserver
    xows_gui_peer_scroll_keep(peer);
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Messages
 * -------------------------------------------------------------------*/
/**
 * History message correction Cancel function
 *
 * @param   {element}    [li_msg]   Instance of <li-mesg> or null
 */
function xows_gui_mesg_edit_close(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName != "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("chat_hist").querySelector(".MESG-EDITOR");
  }

  if(li_msg)
    xows_tpl_mesg_edit_remove(li_msg);
}

/**
 * History message correction Enable function
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to open editor in
 */
function xows_gui_mesg_edit_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_edit_close();

  // Spawn <mesg-edit> instance next to <mesg-body>
  const mesg_edit = xows_tpl_mesg_edit_insert(li_msg);

  // Set caret and focus
  const mesg_inpt = mesg_edit.querySelector("MESG-INPT");
  xows_doc_caret_at(mesg_inpt);
  mesg_inpt.focus();
}

/**
 * History message correction validation (enter) function, called when
 * user press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {object}    inpt      Instance of <mesg-inpt> element
 */
function xows_gui_mesg_edit_valid(inpt)
{
  // Retrieve the parent <li-mesg> element
  const li_msg = inpt.closest("LI-MESG");

  // Get input text
  const inpt_text = inpt.innerText.trimEnd();

  // Check for difference to prevent useless correction
  if(inpt_text !== li_msg.querySelector("MESG-BODY").dataset.raw) {
    // Get message reply
    const rply = li_msg.querySelector("MESG-RPLY");
    // Send message correction
    xows_cli_send_message(xows_gui_peer, inpt_text, li_msg.dataset.id, rply.dataset.id, rply.dataset.to);
  }

  // Close editor
  xows_tpl_mesg_edit_remove(li_msg);
}

/**
 * Cancel history message retraction (delete) (close dialog)
 *
 * @param   {element}    [li_msg]   Instance of <li-mesg> or null
 */
function xows_gui_mesg_trsh_abort(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName != "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("chat_hist").querySelector(".MESG-TRASH");
  }

  if(li_msg)
    xows_tpl_mesg_trsh_remove(li_msg);
}

/**
 * Open history message retraction (delete) dialog
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to open editor in
 */
function xows_gui_mesg_trsh_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_trsh_abort();

  // Spawn <mesg-trsh> instance next to <mesg-body>
  xows_tpl_mesg_trsh_insert(li_msg);
}


/**
 * History message correction validation (enter) function, called when
 * user press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {element}   li_msg    Instance of <li-mesg> to retract
 */
function xows_gui_mesg_trsh_valid(li_msg)
{
  // Get most suitable Stanza reference ID, either Origin-Id, Stanza-Id or Id
  const usid = xows_tpl_mesg_bestref(xows_gui_peer, li_msg);

  // Send message retraction
  if(usid) xows_cli_retract_send(xows_gui_peer, usid);
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Alterations
 * -------------------------------------------------------------------*/
/**
 * Update chat history messages avatar and nickname of the specified
 * author.
 *
 * @param   {object}    peer      Chat history Peer, Room or Contact
 * @param   {object}    author    Author Peer object to update message
 */
function xows_gui_hist_update(peer, author)
{
  // If incoming message is off-screen we get history <div> and <ul> of
  // fragment history corresponding to contact
  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");

  if(!hist_ul || !hist_ul.childNodes.length)
    return;

  // Get peer ID
  const peerid =  xows_cli_peer_iden(author);

  let i;

  // Set new content for all <mesg-from>
  const spn = hist_ul.querySelectorAll("MESG-FROM[data-peer='"+peerid+"'],RPLY-FROM[data-peer='"+peerid+"']");
  i = spn.length;
  while(i--) if(author.name != spn[i].innerText) spn[i].innerText = author.name;

  if(!author.avat)
    return;

  // Retrieve or generate avatar CSS class
  const cls = xows_tpl_spawn_avat_cls(author);

  // Set new CSS class to all corresponding figures
  const fig = hist_ul.querySelectorAll("MESG-AVAT[data-peer='"+peerid+"'],RPLY-AVAT[data-peer='"+peerid+"']");
  i = fig.length;
  while(i--) if(cls != fig[i].className) fig[i].className = cls;
}

/* -------------------------------------------------------------------
 * Main Screen - History - Messages base routines
 * -------------------------------------------------------------------*/
/**
 * Find history message <li-mesg> element corresponding to specified ID
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Message id or Unique and Stable Stanza ID
 */
function xows_gui_hist_mesg_get(peer, id)
{
  // Get Peer's history <ul> element in fast way
  let hist_ul;
  if(peer === xows_gui_peer) {
    hist_ul = document.getElementById("hist_ul");
  } else {
    //hist_ul = xows_doc_frag_element_find(peer.addr,"chat_hist","hist_ul");
    hist_ul = xows_doc_frag_element_find(peer.addr,"chat_fram","hist_ul");
  }

  // First search by id attribute
  let li_msg = hist_ul.querySelector("LI-MESG[data-id='"+id+"']");

  // If no id attribute matches, search for Unique and Stable Stanza IDs (XEP-0359)
  if(!li_msg) {
    if(peer.type === XOWS_PEER_ROOM) {
      li_msg = hist_ul.querySelector("LI-MESG[data-szid='"+id+"']");
    } else {
      li_msg = hist_ul.querySelector("LI-MESG[data-orid='"+id+"']");
    }
  }

  return li_msg;
}

/**
 * Find history message <li-mesg> element corresponding to message
 * reply/quote parameters.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Message reply "id" parameter
 * @param   {string}    to        Message reply "to" parameter
 */
function xows_gui_hist_rply_get(peer, id, to)
{
  // First search for existing message
  let li_msg = xows_gui_hist_mesg_get(peer, id);

  // If no message was found, create temporary Null dummy message
  if(!li_msg)
    li_msg = xows_tpl_mesg_null_spawn(id, to, xows_l10n_get("The message is unreachable"));

  return li_msg;
}

/* -------------------------------------------------------------------
 * Main Screen - History - Message edition
 * -------------------------------------------------------------------*/
/**
 * Perform corrected message replacement with proper references update
 *
 * @param   {object}    peer        Peer object
 * @param   {object}    li_old      Replaced message <li-mesg> element
 * @param   {object}    li_new      New message <li-mesg> element
 *
 * @return  {object}    Inserted new message
 */
function xows_gui_hist_mesg_replace(peer, li_old, li_new)
{
  // Discard old message
  li_old.hidden = true;
  li_old.innerHTML = "";

  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");

  const old_id = xows_tpl_mesg_bestref(peer, li_old);

  // Search for references to old message to be updated
  const li_refs = hist_ul.querySelectorAll("MESG-RPLY[data-id='"+old_id+"']");
  for(let i = 0; i < li_refs.length; ++i)
    xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_new);

  // Also check chat input reply reference
  const chat_rply = xows_gui_peer_doc(peer,"chat_rply");
  if(chat_rply.dataset.id === old_id)
    chat_rply.dataset.id = xows_tpl_mesg_bestref(peer, li_new);

  // Insert replacement message to list
  return hist_ul.insertBefore(li_new, li_old.nextSibling);
}

/**
 * Handle incomming message retraction from the server to update message
 * history and references
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Message Unique and Stable ID to retract
 */
function xows_gui_hist_mesg_retract(peer, usid)
{
  // Retreive message element
  const li_msg = xows_gui_hist_mesg_get(peer, usid);

  if(!li_msg) {
    xows_log(1,"gui_hist_mesg_retract","retracted message not found",usid);
    return;
  }

  // Discard message
  li_msg.hidden = true;
  li_msg.innerHTML = "";

  // Search for references to message to be updated
  const li_refs = xows_gui_peer_doc(peer,"hist_ul").querySelectorAll("MESG-RPLY[data-id='"+usid+"']");

  if(li_refs.length) {
    // Create temporary Null dummy message
    const li_tomb = xows_tpl_mesg_null_spawn(usid,"",xows_l10n_get("The message was deleted"));
    // Update messages with reply
    for(let i = 0; i < li_refs.length; ++i)
      xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_tomb);
  }

  // If next message is same author, adjust the "Append" style
  const next_li = li_msg.nextSibling;
  if(next_li) {
    if(next_li.dataset.from === li_msg.dataset.from)
      next_li.classList.toggle("MESG-APPEND", li_msg.classList.contains("MESG-APPEND"));
  }
}

/**
 * Move scroll to the specified element
 *
 * @param   {object}    peer      Peer object to get scroll value
 * @param   {object}    id        Message ID or Unique and Stable ID
 */
function xows_gui_hist_mesg_focus(peer, id)
{
  // Search for already highlighted message
  const hig_li = xows_gui_peer_doc(peer,"hist_ul").querySelector(".FOCUS");
  if(hig_li) hig_li.classList.remove("FOCUS");

  if(!id) return;

  // Retreive message element
  const li_msg = xows_gui_hist_mesg_get(peer, id);
  if(!li_msg) return;

  // Add Highlight class
  li_msg.classList.add("FOCUS");

  if(peer === xows_gui_peer) {
    // Scroll to element if necessary
    if((li_msg.offsetTop - xows_doc("chat_main").scrollTop) < 0)
      li_msg.scrollIntoView({behavior:"smooth",block:"center"});
  }
}

/**
 * Add unread message notification badge and/or send browser Push Notification
 * as required depending given peer and <li-mesg>
 *
 * @param   {object}    peer      Related Peer object
 * @param   {object}    mesg      Message object
 */
function xows_gui_hist_incoming_notify(peer, mesg)
{
  // No notification for ourself
  if(peer.self)
    return;

  // For MUC we avoid notification unless explicit mention
  if(peer.type === XOWS_PEER_ROOM) {

    if(!mesg.rpto)
      return;

    if(xows_cli_occu_self(peer).addr !== mesg.rpto)
      return;
  }

  // If offsecreen peer, add an Unread messag notification
  if(peer !== xows_gui_peer)
    xows_gui_unread_mesg(peer, mesg.id);

  // If GUI is not in focus, send browser Push Notification
  if(!xows_gui_has_focus)
    xows_gui_notify_push(peer, mesg.body);
}

/**
 * Callback function to add sent or received message to the history
 * window
 *
 * @param   {object}    peer      Related Peer object
 * @param   {object}    mesg      Message object
 * @param   {boolean}   wait      Message wait for receipt
 * @param   {boolean}   self      Message is an echo of one sent by user itself
 * @param   {object}    error     Error data if any
 */
function xows_gui_cli_onmessage(peer, mesg, wait, self, error)
{
  // Check for error message
  if(error) {
    // Find corresponding erroneous message according Id
    const err_li = xows_gui_hist_mesg_get(peer, mesg.id);
    // Mark message as failed
    if(err_li) err_li.classList.add("MESG-FAIL");
    // Print warning log
    xows_log(1,"gui_cli_onmessage","message error",error.name);
    return;
  }

  // MUC specific, we may receive message from ourself as confirmation
  // of reception with server additionnal data
  if(peer.type === XOWS_PEER_ROOM) {
    // Message to update
    const upd_li = xows_gui_hist_mesg_get(peer, (mesg.orid ? mesg.orid : mesg.id));
    if(upd_li) {
      xows_tpl_mesg_update(upd_li, peer, mesg, true);
      return;
    }
  }

  let li_rep, li_rpl;

  // Search for corrected message to be discarded
  if(mesg.repl) {
    li_rep = xows_gui_hist_mesg_get(peer, mesg.repl);
    // We ignore correction which are not in visible history or if correction
    // message have no body, in this case this mean message deletion
    if(!li_rep) return;
  }

  // Search for replied message to be referenced
  if(mesg.rpid)
    li_rpl = xows_gui_hist_rply_get(peer, mesg.rpid, mesg.rpto);

  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");

  // Get last valid (non discarded) previous message
  let li_prv = hist_ul.lastChild;
  while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

  // Create new message element
  const li_msg = xows_tpl_mesg_spawn(peer, mesg, wait, li_prv, li_rep, li_rpl);

  // Insert or append message, depending whether li_ref is null
  if(li_rep) {
    xows_gui_hist_mesg_replace(peer, li_rep, li_msg);
  } else {
    hist_ul.appendChild(li_msg);
  }

  // Avoid notifications for correction messages
  if(!mesg.repl)
    xows_gui_hist_incoming_notify(peer, mesg);

  // Signals something new appending to chat
  xows_gui_chat_onappend(peer, li_msg, self);
}

/**
 * Handle incomming receipts from the server to update history message
 * element style
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Receipt related message Id
 */
function xows_gui_cli_onreceipt(peer, id)
{
  // Check whether message is from or to current chat contact
  const li_msg = xows_gui_hist_mesg_get(peer, id);
  if(li_msg) {
    li_msg.classList.add("MESG-RECP");
  } else {
    xows_log(1,"gui_cli_onreceipt","message not found",id);
  }
}

/**
 * Handle incomming retraction message
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Retracted message SID
 */
function xows_gui_cli_onretract(peer, usid)
{
  xows_gui_hist_mesg_retract(peer, usid);
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Archive Management (MAM)
 * -------------------------------------------------------------------*/
/**
 * Reference to setTimeout sent to temporize archive queries
 */
const xows_gui_mam_query_to = new Map();

/**
 * Query arvhived message for the specified Peer
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    delay     Delay to temporize query
 * @param   {boolean}   after     If true, fetch newer message instead of older
 */
function xows_gui_mam_query(peer, delay, after)
{
  if(xows_gui_mam_query_to.has(peer))  //< Query already pending
    return;

  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");
  //if(!hist_ul) return;

  let start, end;

  // Get start or end time depending after parameter, we get time
  // always 25 ms after or before to prevent received the last or
  // first message already in history.
  if(after) {

    if(hist_ul.childNodes.length)
      start = parseInt(hist_ul.lastChild.dataset.time) + 25;

  } else {

    const hist_beg = xows_gui_peer_doc(peer,"hist_beg");

    // Check whether we already reached the first archived message
    if(hist_beg.className.length)
      return;

    if(hist_ul.childNodes.length)
      end = parseInt(hist_ul.firstChild.dataset.time) - 25;

    //hist_beg.className = "LOADING";
  }

  // To prevent flood and increase ergonomy the archive query is temporised
  xows_gui_mam_query_to.set(peer, setTimeout(xows_cli_mam_fetch, delay,
                                             peer, xows_options.history_count,
                                             start, end,
                                             xows_gui_mam_parse));
}

/**
 * Fetch the newer available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_mam_fetch_newer(peer)
{
  xows_gui_mam_query(peer, 0, true);
}

/**
 * Fetch older available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_mam_fetch_older(peer)
{
  xows_gui_mam_query(peer, xows_options.history_delay, false);
}

/**
 * Callback function to handle the received archives for a contacts
 *
 * @param   {object}    peer      Archive related peer (Contact or Room)
 * @param   {object[]}  result    Received archived messages
 * @param   {number}    count     Count of gathered true (visible) messages
 * @param   {boolean}   complete  Indicate results are complete (no remain)
 */
function xows_gui_mam_parse(peer, result, count, complete)
{
  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");

  let li_ref = null, older = true;

  // Check whether we must append or prepend received archived messages
  if(result.length && hist_ul.childNodes.length) {
    // We compare time (unix epoch) to ensure last archived message is
    // older (or equal) than the current oldest history message.
    if(hist_ul.firstChild.dataset.time >= result[result.length-1].time) {
      li_ref = hist_ul.firstChild; //< node to insert messages before
    } else {
      older = false;
    }
  }

  const hist_beg = xows_gui_peer_doc(peer, "hist_beg");

  // Disable all spin loader
  hist_beg.className = "";

  let li_rep, li_rpl, li_prv, added = 0;

  const n = result.length;
  for(let i = 0; i < n; ++i) {

    const mesg = result[i];

    // Search for message retraction
    if(mesg.retr) {
      xows_gui_hist_mesg_retract(peer, mesg.retr);
      continue;
    }

    // Check whether message has body (this may be reciept or chatstate)
    if(!mesg.body) continue;

    // If message with id alread exists, skip to prevent double
    if(xows_gui_hist_mesg_get(peer, mesg.id))
      continue;

    // Search for corrected message to be discarded
    if(mesg.repl) {
      li_rep = xows_gui_hist_mesg_get(peer, mesg.repl);
      if(!li_rep) continue; //< ignore correction which are not in visible history
    } else {
      li_rep = null;
    }

    // Search for reply/quoted message to be referenced
    if(mesg.rpid) {
      li_rpl = xows_gui_hist_rply_get(peer, mesg.rpid, mesg.rpto);
    } else {
      li_rpl = null;
    }

    // Get last valid (non discarded) previous message
    while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

    // Create new message element
    const li_msg = xows_tpl_mesg_spawn(peer, mesg, false, li_prv, li_rep, li_rpl);

    if(li_rep) {
      // Message correction is insert after the corrected message
      xows_gui_hist_mesg_replace(peer, li_rep, li_msg);
    } else {
      // Insert or append message, depending whether li_ref is null
      li_prv = hist_ul.insertBefore(li_msg, li_ref);
    }

    // Increase added message count
    added++;
  }

  xows_log(2,"gui_mam_parse",added+" added messages for",peer.addr);

  // Checks whether we reached end or start of available history, so we
  // display the proper "bounding" elements.
  if(older && complete) {
    // We reached the oldest history message
    hist_beg.className = "HIST-START";
  }

  // Back scroll to proper position from bottom. Keep that here
  // unless you enable resize observer for "chat_hist"
  xows_gui_peer_scroll_keep(peer);

  xows_gui_mam_query_to.delete(peer); //< Allow a new archive query

  // Inform MAM loaded
  xows_load_task_done(peer, XOWS_LOAD_MAM);
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - History - File Upload
 * -------------------------------------------------------------------*/

/**
 * File Upload on-progress callback function
 *
 * @param   {string}    name      Uplodad file name
 * @param   {number}    percent   Data upload progression in percent
 */
function xows_gui_upld_progress(name, percent)
{
  // Update progress bar
  xows_doc("upld_pbar").style.width = percent + "%";
}

/**
 * File Upload on-error callback function
 *
 * @param   {string}    name      Uplodad file name
 * @param   {string}    text      Reported error message with code
 */
function xows_gui_upld_error(name, text)
{
  // Set the upload dialog message
  xows_doc_cls_add("upld_text","STYL-ERR");
  xows_doc("upld_text").innerHTML = "<b>"+xows_l10n_get("Error")+"</b> : "+text;
}

/**
 * File Upload on-success callback function
 *
 * @param   {string}    name      Uplodad file name
 * @param   {string}    url       Returned download URL of the uploaded file
 */
function xows_gui_upld_load(name, url)
{
  // Send a message to current selected contact with URL to download
  xows_cli_send_message(xows_gui_peer, url);

  // Hide the Upload page
  xows_doc_hide("hist_upld");
}

/**
 * File Upload on-abort callback function
 *
 * @param   {string}    name      Uplodad file name
 */
function xows_gui_upld_abort(name)
{
  xows_gui_upld_close();
}

/**
 * File Upload on-close callback function
 */
function xows_gui_upld_close()
{
  // Remove exit button event listener
  xows_doc_listener_rem(xows_doc("hist_upld"),"click",xows_gui_hist_upld_onclick);

  xows_doc_hide("hist_upld");
}

/**
 * File Upload Frame open
 *
 * @param   {object}    file      File object to upload
 */
function xows_gui_upld_open(file)
{
  const upld_text = xows_doc("upld_text");

  // Reset elements to initial state
  upld_text.classList = "";
  xows_doc("upld_pbar").style.width = "0%";

  // Set uploading file name
  upld_text.innerText = file.name;

  // Send upload query
  xows_cli_upld_query(file, xows_gui_upld_error, xows_gui_upld_load,
                            xows_gui_upld_progress, xows_gui_upld_abort);

  // Add event listener for exit button
  xows_doc_listener_add(xows_doc("hist_upld"),"click",xows_gui_hist_upld_onclick);

  // Show the upload frame
  xows_doc_show("hist_upld");
}

/**
 * File Upload file object on-change callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_file_onchange(event)
{
  const file = xows_doc("chat_file").files[0];

  // Check whether any peer is selected and file object is valid
  if(xows_gui_peer.addr && file)
    xows_gui_upld_open(file);
}

/**
 * File Upload file object on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_hist_upld_onclick(event)
{
  if(event.target.id === "upld_exit")
    xows_gui_upld_close();
}

/* -------------------------------------------------------------------
 *
 * Main screen - Chat Frame - Foot Panel
 *
 * -------------------------------------------------------------------*/
/**
 * Chat Panel on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_panl_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Check whether click occure within input area
  if(event.target.closest("CHAT-INPT")) {

    // Get selection range
    const rng = xows_doc_sel_rng(0);
    if(rng.collapsed) {
      const node = rng.endContainer;
      // Checks whether current selection is within <emo-ji> node
      if(node.parentNode.tagName === "EMO-JI") {
        // Move caret before or after the <emo-ji> node
        xows_doc_caret_around(node.parentNode, !rng.endOffset);
      }
    }

    // Store selection
    xows_gui_chat_inpt_rng = rng;

    return;
  }

  switch(event.target.id)
  {
    // History Navigation banner
    case "chat_nav": {
      // Go to end of history (last messages)
      xows_gui_peer_scroll_down(xows_gui_peer, true);
      return;
    }

    // Message Reply Close button
    case "rply_clos": {
      xows_gui_chat_rply_close();
      break;
    }

    // Upload button
    case "edit_bt_upld": {
      const chat_file = xows_doc("chat_file");
      // Reset file input
      chat_file.value = "";
      // Open the file selector (emulate click)
      chat_file.click();
      break;
    }

    // Emoji button
    case "edit_bt_emoj": {
      // Open Emoji menu
      xows_doc_menu_toggle(xows_doc("edit_bt_emoj"), "drop_emoj",
                           xows_gui_drop_emoj_onclick);
      break;
    }

    default:
      // Set input focus to message edit area
      xows_gui_chat_inpt_focus();
      break;
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Foot Panel - Navigation
 * -------------------------------------------------------------------*/
/**
 * Function to open chat history navigation banner, with or without
 * Unread message alert.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}   [type]     Optional type (CSS class name)
 */
function xows_gui_chat_nav_show(peer, type = null)
{
  // Get the peer history bottom banner
  const chat_nav = xows_gui_peer_doc(peer,"chat_nav");

  // Set class name
  chat_nav.className = type;

  // Show element
  chat_nav.hidden = false;
}

/**
 * Function to close chat history navigation banner
 *
 * @param   {object}    peer     Peer object
 */
function xows_gui_chat_nav_hide(peer)
{
  xows_gui_peer_doc(peer,"chat_nav").hidden = true;
}

/**
 * Function to update navigation bar state accordint user scroll
 *
 * @param   {object}    peer     Peer object
 * @param   {number}    scroll   Chat scroll position (relative to bottom)
 * @param   {number}    client   Chat frame client height
 */
function xows_gui_chat_nav_update(peer, scroll, client)
{
  // Get the peer history bottom banner
  const chat_nav = xows_gui_peer_doc(peer,"chat_nav");

  // If scroll is far enough from bottom, show the "Back to recent" banner
  if(scroll >= 50) {
    if(chat_nav.classList.contains("RINGING")) {
      xows_gui_chat_nav_show(peer,"RINGING");
    } else {
      if(scroll > client)
        xows_gui_chat_nav_show(peer,"NEUTRAL");
    }
  } else {
    // If scroll near of bottom, hide the "Back to recent" banner/button
    xows_gui_chat_nav_hide(peer);
  }
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Reply banner
 * -------------------------------------------------------------------*/
/**
 * Cancel or reset message reply
 */
function xows_gui_chat_rply_close()
{
  if(!xows_doc_cls_has("chat_panl","REPLY"))
    return;

  // Remove REPLY class from Chat Pannel
  xows_doc_cls_rem("chat_panl","REPLY");

  const chat_rply = xows_doc("chat_rply");
  // Reset data and hide element
  xows_doc("rply_name").innerText = "";
  chat_rply.dataset.id = "";
  chat_rply.dataset.to = "";

  // Remove FOCUS class from message is any
  xows_gui_hist_mesg_focus(xows_gui_peer, null);
}

/**
 * Set message reply data and elements
 *
 * @param   {element}   li_msg     Selected <li_mesg> Element to reply to
 */
function xows_gui_chat_rply_set(li_msg)
{
  // Cancel any previous Reply
  xows_gui_chat_rply_close();

  const chat_rply = xows_doc("chat_rply");

  // Get most suitable Stanza reference ID, either Origin-Id, Stanza-Id or Id
  const rpid = xows_tpl_mesg_bestref(xows_gui_peer, li_msg);

  // Get proper destination address
  let rpto;
  if(xows_gui_peer.type === XOWS_PEER_CONT) {
    rpto = xows_jid_bare(li_msg.dataset.from);
  } else {
    rpto = li_msg.dataset.from;
  }

  // Retrieve message author
  let peer;
  if(xows_gui_peer.type === XOWS_PEER_ROOM) {
    peer = xows_cli_occu_get_or_new(xows_gui_peer, rpto, li_msg.dataset.ocid);
  } else {
    peer = xows_gui_peer;
  }

  xows_doc("rply_name").innerText = peer.name;
  chat_rply.dataset.to = rpto;
  chat_rply.dataset.id = rpid;
  chat_rply.hidden = false;

  // Set REPLY class to Chat Pannel
  xows_doc_cls_add("chat_panl","REPLY");

  // set FOCUS to replied message
  xows_gui_hist_mesg_focus(xows_gui_peer, rpid);

  // Set input focus to message edit area
  xows_gui_chat_inpt_focus();
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Message edition
 * -------------------------------------------------------------------*/
/**
 * Set focus and edit caret to chat message input
 */
function xows_gui_chat_inpt_focus()
{
  const chat_inpt = xows_doc("chat_inpt");

  // Set input focus to message edit area
  chat_inpt.focus();

  // move edit caret to end of content
  const rng = xows_doc_sel_rng(0);

  if(rng.endContainer !== chat_inpt)
    xows_doc_caret_around(rng.endContainer);
}

/**
 * Chat Message Edition validation (enter) function, called when user
 * press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {object}    input     Input object to validate
 */
function xows_gui_chat_inpt_enter(input)
{
  // Send message
  if(xows_gui_peer) {

    if(input.innerText.length) {

      const rply = xows_doc("chat_rply");

      // Send message
      xows_cli_send_message(xows_gui_peer, input.innerText.trimEnd(), null, rply.dataset.id, rply.dataset.to);
      input.innerText = ""; //< Empty any residual <br>

      // Reset Reply data
      xows_gui_chat_rply_close();

      // Add CSS class to show placeholder
      input.className = "PLACEHOLD";

    }

    // Reset chatsate to active
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_ACTI);
  }
}

/**
 * Chat message Edition Paste event handling, caled when user
 * paste content from clipload into input area.
 *
 * @param   {object}    event     Clipboard event opbject
 */
function xows_gui_chat_inpt_onpaste(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Get clipboard raw text
  let text = event.clipboardData.getData("text");
  if(!text.length)
    return;

  // Prevent the default clipboard action
  event.preventDefault();

  // Set composing
  if(xows_gui_peer)
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_COMP);

  // Hide the placeholder text
  xows_doc("chat_inpt").className = "";

  // Replace selection by text
  xows_doc_sel.deleteFromDocument();
  xows_doc_sel.getRangeAt(0).insertNode(document.createTextNode(text));
  xows_doc_sel.collapseToEnd();

  // Store selection range
  xows_gui_chat_inpt_rng = xows_doc_sel_rng(0);
}

/**
 * Chat Editor reference to last selection Range object
 */
let xows_gui_chat_inpt_rng = null;

/**
 * Chat Panel on-input callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_inpt_oninput(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Set composing
  if(xows_gui_peer)
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_COMP);

  // Store selection range
  xows_gui_chat_inpt_rng = xows_doc_sel_rng(0);

  const chat_inpt = document.getElementById("chat_inpt");

  // Check inner text content to show placeholder
  if(chat_inpt.innerText.length < 2) {

    if(chat_inpt.innerText.trim().length === 0) {

      // Add CSS class to show placeholder
      chat_inpt.className = "PLACEHOLD";
      chat_inpt.innerText = ""; //< Empty any residual <br>

      return; //< Return now
    }
  }

  // Hide the placeholder text
  chat_inpt.className = "";
}

/**
 * Chat Editor insert element at/within current/last selection
 *
 * @param   {string}    text      Text to insert
 * @param   {string}   [tagname]  Optional wrapper node tagname
 */
function xows_gui_chat_inpt_insert(text, tagname)
{
  const chat_inpt = document.getElementById("chat_inpt");

  // set default carret position if none saved
  if(!xows_gui_chat_inpt_rng) {
    xows_doc_caret_at(chat_inpt, true);
    xows_gui_chat_inpt_rng = xows_doc_sel_rng(0);
  }

  // Get the last saved selection range (caret position)
  const rng = xows_gui_chat_inpt_rng;

  // Delete content of selection if any
  if(rng && !rng.collapsed)
    rng.deleteContents();

  // Create node to insert
  let node;

  if(tagname) {
    node = document.createElement(tagname);
    node.appendChild(document.createTextNode(text));
  } else {
    node = document.createTextNode(text);
  }

  // Insert node within selected range
  rng.insertNode(node);

  // Hide the placeholder text
  chat_inpt.className = "";

  // Focus on input
  chat_inpt.focus();

  // Move caret after the created node
  xows_doc_caret_around(node);

  // Store selection
  xows_gui_chat_inpt_rng = xows_doc_sel_rng(0);
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Emoji Menu Drop
 * -------------------------------------------------------------------*/
/**
 * Chat Emoji menu button/drop on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_drop_emoj_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");

  // Check whether we got click from drop or button
  if(li) xows_gui_chat_inpt_insert(li.childNodes[0].nodeValue, "EMO-JI"); //< Insert selected Emoji

  // Close menu
  xows_doc_menu_close();
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Peer Writing notify
 * -------------------------------------------------------------------*/
/**
 * Handle the received composing state from other contacts to display
 * it in the chat window
 *
 * @param   {object}    peer      Sender peer object
 * @param   {number}    chat      Chat state value
 */
function xows_gui_cli_onchatstate(peer, chat)
{
  // get Peer chatstat object
  const chat_stat = xows_gui_peer_doc(peer, "chat_stat");

  // In case of Private Messae (from Occupant) Chatstat may come before
  // first message, in this case offscreen document doesn't exists
  if(!chat_stat) return;

  if(peer.type === XOWS_PEER_ROOM) {

    // Count of writting occupants
    const n = peer.writ.length;

    // If no Occupant is writing, empty chatsate
    if(n < 1) {
      chat_stat.innerText = "";
      chat_stat.hidden = true;
      return;
    }

    // Compose writing mention depending number of writing occupants
    if(n > 1) {

      let str = "";

      // We display tow names maximum with the count of other
      // typing people if needed
      const l = (n > 2) ? 2 : n - 1;
      // Add the first, or tow first name(s).
      for(let i = 0; i < l; ++i) {
        str += "<b>"+peer.writ[i].name+"</b>";
        if(i < (l-1)) str += ", ";
      }

      // Now append the last part
      str += " "+xows_l10n_get("and")+" <b>";

      // We add either the last name or the remaining count
      const r = (n - l);
      if(r > 1) {
        str += r+" "+xows_l10n_get("other(s)")+"</b> ";
      } else {
        str += peer.writ[n-1].name+"</b> ";
      }

      chat_stat.innerHTML = str + xows_l10n_get("are currently writing");

    } else {
      chat_stat.innerHTML = "<b>"+peer.writ[0].name+"</b> "+xows_l10n_get("is currently writing");
    }

  } else { // XOWS_PEER_CONT|XOWS_PEER_OCCU

    // If Contact stopped writing, empty chatstate
    if(peer.chat < XOWS_CHAT_COMP) {
      chat_stat.innerText = "";
      chat_stat.hidden = true;
      return;
    }

    // Wet writing string
    chat_stat.innerHTML = "<b>"+peer.name+"</b> "+xows_l10n_get("is currently writing");
  }

  // Show the writing mention
  chat_stat.hidden = false;
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Room Occupants
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 *
 * Main Screen - Room Occupants - Header
 *
 * -------------------------------------------------------------------*/
/**
 * Chat Header on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_room_head_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(xows_gui_peer.type != XOWS_PEER_ROOM)
    return;

  if(event.target.id == "occu_bt_cnfg")
    xows_gui_page_muca_open(xows_gui_peer);
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Room Occupants - List
 *
 * -------------------------------------------------------------------*/

/**
 * Find occupant <li-peer> element corresponding to specified Occupant
 *
 * @param   {object}    occu      Occupant object
 */
function xows_gui_occu_li_get(occu)
{
  if(occu.room === xows_gui_peer) {
    return document.getElementById(occu.addr);
  } else {
    //return xows_doc_frag_element_find(occu.room.addr,"occu_list",occu.addr);
    return xows_doc_frag_element_find(occu.room.addr,"room_fram",occu.addr);
  }
}

/**
 * Updates the Occupant list according occupants presents in room
 *
 * @param   {object}    room      Room object
 */
function xows_gui_occu_list_update(room)
{
  // show and hide proper <ul> as required
  const ownr_ul = xows_gui_peer_doc(room, "ownr_ul");
  ownr_ul.hidden = (ownr_ul.querySelector("LI-PEER") === null);

  const admn_ul = xows_gui_peer_doc(room, "admn_ul");
  admn_ul.hidden = (admn_ul.querySelector("LI-PEER") === null);

  const modo_ul = xows_gui_peer_doc(room, "modo_ul");
  modo_ul.hidden = (modo_ul.querySelector("LI-PEER") === null);

  const part_ul = xows_gui_peer_doc(room, "part_ul");
  part_ul.hidden = (part_ul.querySelector("LI-PEER") === null);

  const vist_ul = xows_gui_peer_doc(room, "vist_ul");
  vist_ul.hidden = (vist_ul.querySelector("LI-PEER") === null);
}

/**
 * Handle the received occupant from MUC Room
 *
 * @param   {object}    occu      Occupant object
 * @param   {object}   [mucx]     Optionnal MUX x extra parameters
 */
function xows_gui_cli_onoccupush(occu, mucx)
{
  // Get Occupant's Room
  const room = occu.room;

  xows_log(2,"gui_cli_onoccupush","push occupant","room="+occu.room.addr);

  if(mucx) {
    // check for nicname change
    if(mucx.code.includes(303)) {

      // The mucx object should embedd an extrea ad-hoc property
      // containing the old occupant address to switch
      if(!mucx.prev) {
        xows_log(1,"gui_cli_onoccupush","missing previous JID for nickname change");
        return;
      }

      // Search for existing occupant <li-peer> element for this Room
      let li_peer;
      if(room === xows_gui_peer) {
        li_peer = document.getElementById(mucx.prev);
      } else {
        //li_peer = xows_doc_frag_element_find(room.addr,"occu_list",mucx.prev);
        li_peer = xows_doc_frag_element_find(room.addr,"room_fram",mucx.prev);
      }

      // Change <li-peer> element id
      if(li_peer) li_peer.id = occu.addr;
    }

    // checks whether we have a special status code with this occupant
    if(mucx.code.includes(110)) { //< Self presence update

      // Update privileges related GUI elements
      xows_gui_peer_chat_update(room);
    }
  }

  // Select the proper role/affiliation <ul> to put the occupant in
  let dst_id = "vist_ul";
  if(occu.affi > XOWS_AFFI_MEMB) {
    dst_id = (occu.affi > XOWS_AFFI_ADMN) ? "ownr_ul" : "admn_ul";
  } else {
    switch(occu.role) {
    case XOWS_ROLE_MODO: dst_id = "modo_ul"; break;
    case XOWS_ROLE_PART: dst_id = "part_ul"; break;
    }
  }

  // Search for existing occupant <li-peer> element for this Room
  let li_peer = xows_gui_occu_li_get(occu);
  if(li_peer) {

    // Update the existing <li-peer> ellement according template
    xows_tpl_update_room_occu(li_peer, occu);

  } else {

    // Create new <li-peer> element from template
    li_peer = xows_tpl_spawn_room_occu(occu);
  }

  // Parent <li-peer> to proper destination <ul>
  xows_gui_peer_doc(room, dst_id).appendChild(li_peer);

  // Update occupant list
  xows_gui_occu_list_update(room);

  // Update message history avatars
  xows_gui_hist_update(room, occu);

  // Update Private Message with relatives
  if(occu.self) {
    let i = xows_cli_priv.length;
    while(i--) {
      if(xows_cli_priv[i].room === room)
        xows_gui_hist_update(xows_cli_priv[i], occu);
    }
  }
}

/**
 * Function to remove item from the room occupant list
 *
 * @param   {object}    occu      Occupant object to remove
 */
function xows_gui_cli_onoccurem(occu)
{
  // If Occupant is ourself, this mean we leaved the Room
  if(occu.self) {

    // Check whether current Peer is the Room we leaved
    if(occu.room === xows_gui_peer)
      xows_gui_switch_peer(null); //< Unselect Peer

  } else {

    // Search and remove <li_peer> in document
    const li_peer = xows_gui_occu_li_get(occu);
    if(li_peer) {

      const src_ul = li_peer.parentNode;
      src_ul.removeChild(li_peer);

      // Show or hide list depending content
      src_ul.hidden = !src_ul.childElementCount;
    }
  }

  // Client can remove object from Room
  xows_cli_occu_rem(occu);
}

/**
 * Function to handle click on room occupant list
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_occu_list_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // get related <li-peer> element where click occurred
  const li_peer = event.target.closest("LI-PEER");
  if(!li_peer) return;

  // Checks whether user clicked on menu button
  if(event.target.name === "occu_bt_menu") {
    // Select occupant (Temporarly, to keep track of it)
    li_peer.classList.add("SELECTED");
    // Open Occupant menu
    xows_doc_menu_toggle(event.target, "drop_occu",
                         xows_gui_occu_drop_onclick,
                         xows_gui_occu_drop_onshow,
                         xows_gui_occu_drop_onclose);
  }
}

/* -------------------------------------------------------------------
 *
 * Main Screen - Room Occupants - List - Interactions
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Room Occupants - List - Occupant Contextual Menu
 * -------------------------------------------------------------------*/

/**
 * Occupant drop menu on-close Callback function
 */
function xows_gui_occu_drop_onclose()
{
  // Clear selected occupant
  const li_peer = xows_doc("occu_list").querySelector(".SELECTED");
  li_peer.classList.remove("SELECTED");
}

/**
 * Occupant drop menu placement Callback function
 *
 * @param   {object}    button    Drop menu button
 * @param   {object}    drop      Drop menu object
 */
function xows_gui_occu_drop_onshow(button, drop)
{
  // Calculate menu position next to button
  const rect = button.getBoundingClientRect();
  drop.style.left = (rect.left - (drop.offsetWidth)) + "px";

  // Calculate overflow from screen height
  const offsetTop = rect.top + (rect.height * 0.5);
  let overflow = (offsetTop + drop.offsetHeight) - window.screen.height;
  if(overflow < 0) overflow = 0;

  drop.style.top = (offsetTop - overflow) + "px";

  // Get related Occupant
  const occu = xows_cli_occu_get(xows_gui_peer, button.closest("LI-PEER").id);

  const is_ownr = (xows_gui_peer.affi === XOWS_AFFI_OWNR);
  const is_admn = !occu.self && (xows_gui_peer.affi > XOWS_AFFI_MEMB);
  const is_modo = !occu.self && (is_admn || (xows_gui_peer.role > XOWS_ROLE_PART));
  const is_plus = is_ownr || ((occu.affi < XOWS_AFFI_ADMN) && (xows_gui_peer.affi >= occu.affi));

  const item_priv = xows_doc("occu_mi_priv");
  const item_affi = xows_doc("occu_sm_affi");
  const item_role = xows_doc("occu_sm_role");
  const item_kick = xows_doc("occu_mi_kick");
  const item_outc = xows_doc("occu_mi_outc");

  // Remove separator of top menu item, proper separator
  // will be set according menu configuration
  xows_doc_cls_rem("occu_mi_info", "menu-separ");
  xows_doc_cls_rem("occu_mi_priv", "menu-separ");

  // We cannot send Private Message to ourself
  item_priv.hidden = occu.self;

  if((!is_admn && !is_modo) || !is_plus) {

    // Hide all Administration and Moderation menus
    item_affi.hidden = true;
    item_role.hidden = true;
    item_kick.hidden = true;
    item_outc.hidden = true;
    return;
  }

  // Add separator of "Send a message" menu item
  xows_doc_cls_add(occu.self ? "occu_mi_info" : "occu_mi_priv", "menu-separ");

  item_affi.hidden = !is_admn;
  item_role.hidden = !is_modo;
  item_kick.hidden = !is_modo;
  item_outc.hidden = !is_admn;

  if(is_admn) {

    const item_ownr = xows_doc("occu_mi_ownr");
    const item_admn = xows_doc("occu_mi_admn");
    const item_memb = xows_doc("occu_mi_memb");
    const item_none = xows_doc("occu_mi_none");

    // Enable and disable radio buttons according occupant Affiliation
    item_ownr.querySelector("MENU-RADIO").dataset.on = (occu.affi === XOWS_AFFI_OWNR);
    item_admn.querySelector("MENU-RADIO").dataset.on = (occu.affi === XOWS_AFFI_ADMN);
    item_memb.querySelector("MENU-RADIO").dataset.on = (occu.affi === XOWS_AFFI_MEMB);
    item_none.querySelector("MENU-RADIO").dataset.on = (occu.affi === XOWS_AFFI_NONE);

    // Disable access to menu items according user permissions
    item_ownr.classList.toggle("MENU-GRAYD", !is_ownr);
    item_admn.classList.toggle("MENU-GRAYD", !is_ownr);
  }

  if(is_modo) {

    const item_modo = xows_doc("occu_mi_modo");
    const item_part = xows_doc("occu_mi_part");
    const item_vist = xows_doc("occu_mi_vist");

    // Enable and disable radio buttons according occupant Role
    item_modo.querySelector("MENU-RADIO").dataset.on = (occu.role === XOWS_ROLE_MODO);
    item_part.querySelector("MENU-RADIO").dataset.on = (occu.role === XOWS_ROLE_PART);
    item_vist.querySelector("MENU-RADIO").dataset.on = (occu.role === XOWS_ROLE_VIST);

    // Admin cannot revoke Moderator status of another admin and Modo cannot revoke another Modo
    const can_revoke = (xows_gui_peer.role > occu.role) || (xows_gui_peer.affi > occu.affi);

    // Disable access to subitem according user permissions
    item_modo.classList.toggle("MENU-GRAYD", !is_admn); //< Only Admin can grant Moderator Role
    item_part.classList.toggle("MENU-GRAYD", !can_revoke);
    item_vist.classList.toggle("MENU-GRAYD", !can_revoke);
  }
}

/**
 * Function to handle click on room occupant contextual menu
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_occu_drop_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Get related room occupant <li-peer> element
  const li_peer = xows_doc("occu_list").querySelector(".SELECTED");

  // Close menu and unfocus button
  xows_doc_menu_close();

  // Get related menu item <li> element where click occurred
  const li = event.target.closest("LI");
  if(!li) return;

  // Retreive room occupant object
  const occu = xows_cli_occu_get(xows_gui_peer, li_peer.id);

  let affi = null;
  let role = null;

  switch(li.id)
  {
  case "occu_mi_info":
    xows_gui_prof_open(occu);
    return;
  case "occu_mi_priv":
    // Initialize Private Conversation
    xows_gui_priv_init(occu);
    return;
  // - - - Affiliation sub-menu
  case "occu_mi_ownr": affi = XOWS_AFFI_OWNR; break;
  case "occu_mi_admn": affi = XOWS_AFFI_ADMN; break;
  case "occu_mi_memb": affi = XOWS_AFFI_MEMB; break;
  case "occu_mi_none": affi = XOWS_AFFI_NONE; break;
  // - - - Role sub-menu
  case "occu_mi_modo": role = XOWS_ROLE_MODO; break;
  case "occu_mi_part": role = XOWS_ROLE_PART; break;
  case "occu_mi_vist": role = XOWS_ROLE_VIST; break;
  // - - -
  case "occu_mi_kick": role = XOWS_ROLE_NONE; break;
  case "occu_mi_outc": affi = XOWS_AFFI_OUTC; break;
  }

  if(affi != null && affi != occu.affi) {
    // Asks for confirmation for Ban or granting Admin or Owner.
    if((affi > XOWS_AFFI_MEMB && affi > occu.affi)|| affi === XOWS_AFFI_OUTC) {
      xows_gui_mbox_affi_open(occu, affi);
    } else {
      xows_cli_muc_set_affi(occu, affi);
    }
  }

  if(role != null && role != occu.role) {
    // Asks for confirmation for Kick
    if(role === XOWS_ROLE_NONE) {
      xows_gui_mbox_role_open(occu, role);
    } else {
      xows_cli_muc_set_role(occu, role);
    }
  }
}

/* -------------------------------------------------------------------
 * Main screen - Room Occupants - List - Affiliation Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_affi_param = {occu:null,affi:null};

/**
 * Room Occupant Affiliation change message box on-abort callback function
 */
function xows_gui_mbox_affi_onabort()
{
}

/**
 * Room Occupant Affiliation change message box on-valid callback function
 */
function xows_gui_mbox_affi_onvalid()
{
  const param = xows_gui_mbox_affi_param;

  // query change affiliation for occupant
  xows_cli_muc_set_affi(param.occu, param.affi);
}

/**
 * Room Occupant Affiliation change message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    affi      Affiliation value to set
 */
function xows_gui_mbox_affi_open(occu, affi)
{
  // Store room, occupant and affiliation setup
  const param = xows_gui_mbox_affi_param;
  param.occu = occu;
  param.affi = affi;

  let head, text;

  // Compose dialog message
  if(affi > XOWS_AFFI_OUTC) {
    head = "Change occupant affiliation";
    text = xows_l10n_get("Grant Channel affiliation")+" <b>";
    switch(affi)
    {
    case XOWS_AFFI_OWNR : text += xows_l10n_get("Owner"); break;
    case XOWS_AFFI_ADMN : text += xows_l10n_get("Administrator"); break;
    case XOWS_AFFI_MEMB : text += xows_l10n_get("Member"); break;
    case XOWS_AFFI_NONE : text += xows_l10n_get("None"); break;
    }
    text += "</b> "+xows_l10n_get("to occupant");
  } else {
    head = "Ban occupant";
    text = xows_l10n_get(head);
  }

  text += " <b>"+occu.name+"</b> ?";

  // Open Message Dialog-Box
  xows_doc_mbox_open(XOWS_STYL_ASK, head, text,
                     xows_gui_mbox_affi_onvalid, "OK",
                     xows_gui_mbox_affi_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 * Main screen - Room Occupants - List - Role Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_role_param = {occu:null,role:null};

/**
 * Room Occupant Role change message box on-abort callback function
 */
function xows_gui_mbox_role_onabort()
{
}

/**
 * Room Occupant Role change message box on-valid callback function
 */
function xows_gui_mbox_role_onvalid()
{
  const param = xows_gui_mbox_role_param;

  // query change affiliation for occupant
  xows_cli_muc_set_role(param.occu, param.role);

}

/**
 * Room Occupant Role change message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    role      Role value to set
 */
function xows_gui_mbox_role_open(occu, role)
{
  // Store room, occupant and affiliation setup
  const param = xows_gui_mbox_role_param;
  param.occu = occu;
  param.role = role;

  let head, text;

  // Compose dialog message
  if(role > XOWS_ROLE_NONE) {
    head = "Change occupant role";
    text = xows_l10n_get("Assign the Channel role")+" <b>";
    switch(role)
    {
    case XOWS_ROLE_MODO : text += xows_l10n_get("Moderator"); break;
    case XOWS_ROLE_PART : text += xows_l10n_get("Participant"); break;
    case XOWS_ROLE_VIST : text += xows_l10n_get("Visitor"); break;
    }
    text += "</b> "+xows_l10n_get("to occupant");
  } else {
    head = "Kick occupant";
    text = xows_l10n_get(head);
  }

  text += " <b>"+occu.name+"</b> ?";

  // Open Message Dialog-Box
  xows_doc_mbox_open(XOWS_STYL_ASK, head, text,
                     xows_gui_mbox_role_onvalid, "OK",
                     xows_gui_mbox_role_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 *
 * Page Screen Dialogs
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Page Screen - Wait Screen Page
 * -------------------------------------------------------------------*/
/**
 * Connection Waiting page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_wait_onclick(target)
{
  if(target.id === "wait_abrt") { //< Cancel button

    // Disconnect client
    xows_gui_disconnect();

    // reset GUI
    xows_gui_reset();

    // Display Login page
    xows_gui_page_auth_open();
  }
}

/**
 * Wait Screen page open
 *
 * @param   {string}    text      Message to display
 */
function xows_gui_page_wait_open(text)
{
  // Set wait message
  xows_doc("wait_text").innerText = xows_l10n_get(text);

  // Open wait page
  xows_doc_page_open("page_wait");

  // Open dialog page
  xows_doc_page_open("page_wait",false,null,null,xows_gui_page_wait_onclick);
}

/* -------------------------------------------------------------------
 * Page Screen - User Login Page
 * -------------------------------------------------------------------*/
/**
 * User Login page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_auth_oninput(target)
{
  let disable = true;

  if(xows_doc("auth_user").value.length && xows_doc("auth_pass").value.length)
    disable = false;

  xows_doc("auth_cnct").disabled = disable;
}

/**
 * User Login page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_auth_onclick(target)
{
  if(target.id === "auth_cnct") { //< Submit button

    if(!xows_doc("auth_cnct").disabled) {

      // Display wait screen
      xows_gui_page_wait_open("Connecting...");

      // Get login parameters from DOM
      xows_gui_auth = {};
      xows_gui_auth.user = xows_doc("auth_user").value.toLowerCase();
      xows_gui_auth.pass = xows_doc("auth_pass").value;
      xows_gui_auth.cred = xows_doc("auth_cred").checked;

      // erase password from intput
      xows_doc("auth_pass").value = "";

      // Try connection
      xows_gui_connect(false);
    }

    return;
  }

  if(target.id === "auth_regi") //< Link for register new user
    xows_gui_page_regi_open(); //< display register screen
}

/**
 * User Login page open
 */
function xows_gui_page_auth_open()
{
  // Reset inputs
  xows_doc("auth_user").value = "";
  xows_doc("auth_pass").value = "";

  // Disable connect button
  xows_doc("auth_cnct").disabled = true;

  // Open dialog page
  xows_doc_page_open("page_auth",false,null,xows_gui_page_auth_oninput,
                                            xows_gui_page_auth_onclick);
}

/* -------------------------------------------------------------------
 * Page Screen - User Register Page
 * -------------------------------------------------------------------*/
/**
 * User Register page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_regi_oninput(target)
{
  let disable = true;

  if(xows_doc("regi_user").value.length && xows_doc("regi_pass").value.length)
    if(xows_doc_cls_has("regi_capt", "CAPTCHA-CHECKED"))
      disable = false;

  xows_doc("regi_subm").disabled = disable;
}

/**
 * User Register page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_regi_onclick(target)
{
  if(target.id === "regi_capt") { //< Robot Captcha div

    // Add check to captcha div
    xows_doc_cls_add("regi_capt", "CAPTCHA-CHECKED");

    // Trigger on-input callback to enable/disable submit button
    xows_gui_page_regi_oninput(target);

    return;
  }

  if(target.id === "regi_subm") { //< Submit button

    if(!xows_doc("regi_subm").disabled) {

      // Display wait screen
      xows_gui_page_wait_open("Please wait...");

      // Get login parameters from DOM
      xows_gui_auth = {};
      xows_gui_auth.user = xows_doc("regi_user").value.toLowerCase();
      xows_gui_auth.pass = xows_doc("regi_pass").value;

      // erase password from intput
      xows_doc("regi_pass").value = "";

      // Try register
      xows_gui_connect(true);
    }

    return;
  }

  if(target.id === "regi_canc") //< Link for login with existing user
    xows_gui_page_auth_open(); //< Display login screen
}

/**
 * User Register page open
 */
function xows_gui_page_regi_open()
{
  // Reset inputs
  xows_doc("regi_user").value = "";
  xows_doc("regi_pass").value = "";

  // Disable submit button
  xows_doc("regi_subm").disabled = true;

  // uncheck captcha
  xows_doc_cls_rem("regi_capt", "CAPTCHA-CHECKED");

  // Open dialog page
  xows_doc_page_open("page_regi",false,null,xows_gui_page_regi_oninput,
                                            xows_gui_page_regi_onclick);
}

/* -------------------------------------------------------------------
 * Page Screen - User Profile Page
 * -------------------------------------------------------------------*/
/**
 * User Profile page on-abort callback function
 */
function xows_gui_page_edit_onabort()
{
  // Reset inputs values
  xows_doc("edit_name").value = xows_cli_self.name;

  let data;

  // Get temp or cached avatar
  if(xows_cli_self.avat) {
    data = xows_cach_avat_get(xows_cli_self.avat);
    xows_doc("edit_avat").data = data; //< ad-hoc property
  } else {
    data = xows_cach_avat_temp_data(xows_cli_self.addr, null); // Generate temporary avatar
    xows_doc("edit_avat").data = null; //< ad-hoc property
  }

  xows_doc("edit_avat").style.backgroundImage = "url(\""+data+"\")";

  xows_doc("edit_open").checked = true;
}

/**
 * User Profile page on-valid callback function
 */
function xows_gui_page_edit_onvalid()
{
  // Update user profile
  xows_cli_self_edit(xows_doc("edit_name").value,
                     xows_doc("edit_avat").data,
                     xows_doc("edit_open").checked?"open":"presence");
}

/**
 * User Profile page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_edit_oninput(target)
{
  let changed;

  switch(target.id)
  {
  case "edit_open": //< Checkbox for Data in open access
    changed = !xows_doc("edit_open").checked; break;
  case "edit_name": //< Nickname input text field
    changed = (xows_doc("edit_name").value != xows_cli_self.name);
  }

  // Open Message Box dialog
  if(changed) xows_doc_popu_open_for_save(xows_gui_page_edit_onvalid,
                                          xows_gui_page_edit_onabort);
}

/**
 * User Profile page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_edit_onclick(target)
{
  if(target.id === "edit_bt_avch") { //< Change avatar

    // Emulate click on file input
    xows_doc("edit_file").click();

    return;
  }

  if(target.id === "edit_bt_avrm") { //< Remove avatar

    const edit_avat = xows_doc("edit_avat");

    // set null avatar data
    edit_avat.data = null;

    // Generate default temp avatar
    const data = xows_cach_avat_temp_data(xows_cli_self.addr, null); // Generate temporary avatar
    edit_avat.style.backgroundImage = "url(\""+data+"\")";

    // Open Message box dialog
    xows_doc_popu_open_for_save(xows_gui_page_edit_onvalid,
                                xows_gui_page_edit_onabort);
  }
}

/**
 * User Profile page callback avatar file change event
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_page_edit_ev_file(event)
{
  const edit_file = xows_doc("edit_file");

  if(edit_file.files[0]) {
    // Create file reader to read image data
    const reader = new FileReader();
    reader.onload = function(e) {
      // Once data loaded, create new Image object
      const image = new Image();
      // Define onload function to handle loaded data
      image.onload = function(e) {
        // Set avatar data on background
        const url = xows_gen_avatar(XOWS_AVAT_SIZE, this, null);
        const edit_avat = xows_doc("edit_avat");
        edit_avat.data = url;
        edit_avat.style.backgroundImage = "url(\""+url+"\")";
        // Open Message Box dialog
        xows_doc_popu_open_for_save(xows_gui_page_edit_onvalid,
                                    xows_gui_page_edit_onabort);
      };
      // Start image loading (should be quick)
      image.src = e.target.result;
    };
    // Launch file reading
    reader.readAsDataURL(edit_file.files[0]);
  }
}

/**
 * User Profile page on-close callback function
 */
function xows_gui_page_edit_onclose()
{
  // remove "change" event listener to file input
  xows_doc_listener_rem(xows_doc("edit_file"),"change",xows_gui_page_edit_ev_file);
}

/**
 * User Profile page open
 */
function xows_gui_page_edit_open()
{
  // Initialize inputs values
  xows_gui_page_edit_onabort();

  // Set account address in page header frame
  xows_doc("edit_addr").innerText = xows_cli_self.addr;

  // Open dialog page
  xows_doc_page_open("page_edit", true, xows_gui_page_edit_onclose,
                                        xows_gui_page_edit_oninput,
                                        xows_gui_page_edit_onclick);

  // add "change" event listener to file input
  xows_doc_listener_add(xows_doc("edit_file"),"change",xows_gui_page_edit_ev_file);
}


/* -------------------------------------------------------------------
 * Page Screen - Account options Page
 * -------------------------------------------------------------------*/
/**
 * Account options page on-abort callback function
 */
function xows_gui_page_acct_onabort()
{
}

/**
 * Account options page on-valid callback function
 */
function xows_gui_page_acct_onvalid()
{

}

/**
 * Account options page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_acct_oninput(target)
{
  const acct_pass = xows_doc("acct_pass");
  const acct_pnew = xows_doc("acct_pnew");
  const acct_pcnf = xows_doc("acct_pcnf");

  xows_doc("acct_bt_pass").disabled = (!acct_pass.value || !acct_pnew.value || !acct_pcnf.value);
}

/**
 * Account options page handle change password result
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_acct_onchpas(type, error)
{
  const acct_pass = xows_doc("acct_pass");
  const acct_pnew = xows_doc("acct_pnew");
  const acct_pcnf = xows_doc("acct_pcnf");

  if(type === "error") {
    xows_doc_popu_open(XOWS_STYL_ERR,xows_l10n_get("Password change failed")+": "+error.name);
  } else {
    xows_doc_popu_open(XOWS_STYL_SCS,"Password has been changed successfully");
  }

  // Reset input to initial state
  acct_pass.setCustomValidity("");
  acct_pass.value = "";
  acct_pnew.value = "";
  acct_pcnf.setCustomValidity("");
  acct_pcnf.value = "";
}

/**
 * Account options page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_acct_onclick(target)
{
  const acct_pass = xows_doc("acct_pass");
  const acct_pnew = xows_doc("acct_pnew");
  const acct_pcnf = xows_doc("acct_pcnf");

  // Reset any invalid state
  acct_pass.setCustomValidity("");
  acct_pcnf.setCustomValidity("");

  if(target.id === "acct_bt_pass") {

    // Check current password match
    if(acct_pass.value !== xows_xmp_auth.pass) {
      xows_doc_popu_open(XOWS_STYL_ERR,"The current password you entered is wrong");

      // Empty password
      acct_pass.setCustomValidity("Wrong password");

      return;
    }

    // Check if new password and confirmation matches
    if(acct_pnew.value !== acct_pcnf.value) {
      xows_doc_popu_open(XOWS_STYL_ERR,"The password confirmation does not match");

      // Empty new password and confirmation
      acct_pcnf.setCustomValidity("Confirmation does not match");

      return;
    }

    // Send password change query
    xows_cli_regi_chpas_query(acct_pnew.value, xows_gui_page_acct_onchpas);
  }

  if(target.id === "acct_bt_unre") {
    // Open confirmation message box
    xows_gui_mbox_unre_open();
  }
}

/**
 * Account options page on-close callback function
 */
function xows_gui_page_acct_onclose()
{

}

/**
 * Account options page open
 */
function xows_gui_page_acct_open()
{
  const acct_pass = xows_doc("acct_pass");
  const acct_pnew = xows_doc("acct_pnew");
  const acct_pcnf = xows_doc("acct_pcnf");

  // Reset input to initial state
  acct_pass.setCustomValidity("");
  acct_pass.value = "";
  acct_pnew.value = "";
  acct_pcnf.setCustomValidity("");
  acct_pcnf.value = "";

  // Set account address in page header frame
  xows_doc("acct_addr").innerText = xows_cli_self.addr;

  // Open dialog page
  xows_doc_page_open("page_acct", true, xows_gui_page_acct_onclose,
                                        xows_gui_page_acct_oninput,
                                        xows_gui_page_acct_onclick);
}

/* -------------------------------------------------------------------
 * Page Screen - Room Configuration
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_page_mucc = {room:null,form:null,cancel:true};

/**
 * Room Configuration page query result callback function
 *
 * @param   {object}    Room object
 * @param   {string}    Query result type
 */
function xows_gui_page_mucc_onresult(room, type)
{
  if(type === "result") {
    xows_gui_page_mucc.cancel = false;
    xows_doc_page_close();
  }
}
  // TODO: !

  // Unless the room is configured to not broadcast presence from new occupants below
  // a certain affiliation level (as controlled by the "muc#roomconfig_presencebroadcast"
  // room configuration option), the service MUST also send presence from the new
  // participant's occupant JID to the full JIDs of all the occupants (including
  // the new occupant).

/**
 * Room Configuration page on-valid callback function
 */
function xows_gui_page_mucc_onvalid()
{
  const room = xows_gui_page_mucc.room;
  const form = xows_gui_page_mucc.form;

  // Fill configuration from with input values
  for(let i = 0, n = form.length; i < n; ++i) {

    // Reference to value array
    const value = form[i].value;

    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      value[0] = xows_doc("mucc_titl").value; break;
    case "muc#roomconfig_roomdesc":
      value[0] = xows_doc("mucc_desc").value; break;
    case "muc#roomconfig_persistentroom":
      value[0] = xows_doc("mucc_pers").checked?"1":"0"; break;
    case "muc#roomconfig_publicroom":
      value[0] = xows_doc("mucc_publ").checked?"1":"0"; break;
    case "muc#roomconfig_roomsecret":
      value[0] = xows_doc("mucc_prot").checked ? xows_doc("mucc_pass").value : ""; break;
    case "muc#roomconfig_membersonly":
      value[0] = xows_doc("mucc_mbon").checked?"1":"0"; break;
    case "muc#roomconfig_moderatedroom":
      value[0] = xows_doc("mucc_modo").checked?"1":"0"; break;
    case "muc#roomconfig_whois":
      value[0] = xows_doc("mucc_anon").value; break;
    case "muc#roomconfig_presencebroadcast":
      value.length = 0;
      if(xows_doc("mucc_lsvi").checked) value.push("visitor");
      if(xows_doc("mucc_lspa").checked) value.push("participant");
      if(xows_doc("mucc_lsmo").checked) value.push("moderator");
      break;
    case "muc#roomconfig_historylength":
      value[0] = xows_doc("mucc_hmax").value; break;
    case "muc#roomconfig_defaulthistorymessages":
      value[0] = xows_doc("mucc_hdef").value; break;
    case "muc#roomconfig_enablearchiving":
      value[0] = xows_doc("mucc_arch").checked?"1":"0"; break;
    }
  }

  // Submit fulfilled configuration form
  xows_cli_muc_setcfg_query(room, form, xows_gui_page_mucc_onresult);
}

/**
 * Room Configuration page on-abort callback function
 */
function xows_gui_page_mucc_onabort()
{
  const form = xows_gui_page_mucc.form;

  // Setup page inputs according received config from
  for(let i = 0, n = form.length; i < n; ++i) {

    // Reference to value array
    const value = form[i].value;

    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      xows_doc("mucc_titl").value = value[0] ? value[0] : ""; break;
    case "muc#roomconfig_roomdesc":
      xows_doc("mucc_desc").value = value[0]; break;
    case "muc#roomconfig_persistentroom":
      xows_doc("mucc_pers").checked = xows_asbool(value[0]); break;
    case "muc#roomconfig_publicroom":
      xows_doc("mucc_publ").checked = xows_asbool(value[0]); break;
    case "muc#roomconfig_roomsecret": {
      const enabled = xows_asbool(value[0].length);
      xows_doc("mucc_prot").checked = enabled;
      xows_doc("mucc_pass").disabled = !enabled;
      xows_doc("mucc_pass").value = value[0];
      break; }
    //case "muc#roomconfig_allowmemberinvites":
    //  xows_doc("room_invt").checked = form[i].value[0];
    //  break;
    case "muc#roomconfig_membersonly":
      xows_doc("mucc_mbon").checked = xows_asbool(value[0]); break;
    case "muc#roomconfig_changesubject":
    case "muc#roomconfig_moderatedroom":
      xows_doc("mucc_modo").checked = xows_asbool(value[0]); break;
    case "muc#roomconfig_whois":
      xows_doc("mucc_anon").value = value; break;
    case "muc#roomconfig_presencebroadcast":
      xows_doc("mucc_lsvi").checked = value.includes("visitor");
      xows_doc("mucc_lspa").checked = value.includes("participant");
      xows_doc("mucc_lsmo").checked = value.includes("moderator");
      break;
    //  xows_doc("room_ocls").value = value; break;
    case "muc#roomconfig_historylength":
      xows_doc("mucc_hmax").value = value[0]; break;
    case "muc#roomconfig_defaulthistorymessages":
      xows_doc("mucc_hdef").value = value[0]; break;
    case "muc#roomconfig_enablearchiving":
      xows_doc("mucc_arch").checked = xows_asbool(value[0]); break;
    }
  }
}

/**
 * Room Configuration page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_mucc_oninput(target)
{
  let change = false;

  const form = xows_gui_page_mucc.form;

  // Enable or disable Password input
  const prot = xows_doc("mucc_prot").checked;
  xows_doc("mucc_pass").disabled = !prot;
  if(!prot) xows_doc("mucc_pass").value = "";

  // Compare page inputs and received form values
  for(let i = 0, n = form.length; i < n; ++i) {

    // Reference to value array
    const value = form[i].value;

    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      if(value[0] !== xows_doc("mucc_titl").value) change = true; break;
    case "muc#roomconfig_roomdesc":
      if(value[0] !== xows_doc("mucc_desc").value) change = true; break;
    case "muc#roomconfig_persistentroom":
      if(xows_asbool(value[0]) !== xows_doc("mucc_pers").checked) change = true; break;
    case "muc#roomconfig_publicroom":
      if(xows_asbool(value[0]) !== xows_doc("mucc_publ").checked) change = true; break;
    case "muc#roomconfig_roomsecret":
      if(value[0] !== xows_doc("mucc_pass").value) change = true; break;
    case "muc#roomconfig_membersonly":
      if(xows_asbool(value[0]) !== xows_doc("mucc_mbon").checked) change = true; break;
    case "muc#roomconfig_moderatedroom":
      if(xows_asbool(value[0]) !== xows_doc("mucc_modo").checked) change = true; break;
    case "muc#roomconfig_whois":
      if(value[0] !== xows_doc("mucc_anon").value) change = true; break;
    case "muc#roomconfig_presencebroadcast":
      if(value.includes("visitor") !== xows_doc("mucc_lsvi").checked) change = true;
      if(value.includes("participant") !== xows_doc("mucc_lspa").checked) change = true;
      if(value.includes("moderator") !== xows_doc("mucc_lsmo").checked) change = true;
      break;
    case "muc#roomconfig_historylength":
      if(value[0] !== xows_doc("mucc_hmax").value) change = true; break;
    case "muc#roomconfig_defaulthistorymessages":
      if(value[0] !== xows_doc("mucc_hdef").value) change = true; break;
    case "muc#roomconfig_enablearchiving":
      if(xows_asbool(value[0]) !== xows_doc("mucc_arch").checked) change = true; break;
    }

    if(change) break;
  }

  // Open Message Box for save changes
  if(change) xows_doc_popu_open_for_save(xows_gui_page_mucc_onvalid,
                                         xows_gui_page_mucc_onabort);
}

/**
 * Room Configuration page on-close callback function
 */
function xows_gui_page_mucc_onclose()
{
  const param = xows_gui_page_mucc;

  // Checks whether we are in Room initial config scenario, happening
  // when user Join a non-existing Room that is created on the fly.
  if(param.room.init) {

    // Accept default config
    xows_cli_muc_setcfg_query(param.room, null, null);

  } else {

    // Cancel Chatoom configuration
    if(param.cancel)
      xows_cli_muc_setcfg_cancel(param.room, null);
  }

  // unreference data
  param.form = null;
  param.room = null;
}

/**
 * Room Configuration page open
 *
 * If the form parameter is not set, it is assumed this is room subject
 * changes scenario, otherwise, the Room Configuration scenario is
 * enabled.
 *
 * @param   {object}   room    Room object to be configured
 * @param   {object}   form    Supplied form for config fields
 */
function xows_gui_page_mucc_open(room, form)
{
  // Initialize config form with default value if not defined
  for(let i = 0, n = form.length; i < n; ++i)
    if(!form[i].value) form[i].value = [0];

  // Set the Room ID in the page header frame
  xows_doc("mucc_room").innerText = room.name +" ("+room.addr+")";

  // Initialize parameters
  const param = xows_gui_page_mucc;
  param.room = room;
  param.form = form;
  param.cancel = true;

  // Initialize inputs
  xows_gui_page_mucc_onabort();

  // Open dialog page
  xows_doc_page_open("page_mucc",true,xows_gui_page_mucc_onclose,
                                      xows_gui_page_mucc_oninput,
                                      xows_gui_page_mucc_oninput);
}
/* -------------------------------------------------------------------
 * Page Screen - Room Administration
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_page_muca = {room:null,stage:0,items:null};

/**
 * Array for affiliation list loading cycle stages
 */
const xows_gui_page_muca_load = ["outcast","owner","admin","member"];

/**
 * Room Administration page search reference item Object for <li-memb> Element
 *
 * @param   {element}   li        <li-memb> element to search reference for
 *
 * #return  {object}    Reference item or null if not found
 */
function xows_gui_page_muca_getitem(li)
{
  const items = xows_gui_page_muca.items;

  // Search for item in reference array
  for(let i = 0; i < items.length; ++i)
    if(items[i].jid == li.dataset.bare)
      return items[i];

  return null;
}

/**
 * Room Administration Affiliation-List Loading callback function
 *
 * @param   {string}  from    Sender Room JID
 * @param   {string}  items   Room affiliation data
 */
function xows_gui_page_muca_onload(from, items)
{
  const param = xows_gui_page_muca;
  const room = param.room;

  const muca_outc = xows_doc("muca_outc");
  const muca_affi = xows_doc("muca_affi");

  if(param.stage == 0) {
    // This is initial call, we reset all elements
    muca_outc.innerHTML = "";
    muca_affi.innerHTML = "";

    muca_outc.classList.add("LOADING");
    muca_affi.classList.add("LOADING");

    param.items = [];
  }

  // Fill the destination list
  if(items && items.length) {

    // Concatenate reference array
    param.items = param.items.concat(items);

    // Fill <ul> element with received items
    for(let i = 0; i < items.length; ++i) {

      // We ignore "oufself"
      if(xows_cli_isself_addr(items[i].jid))
        continue;

      // Spawn new <li-memb> Element
      const li_memb = xows_tpl_admn_memb_spawn(items[i], room.affi);

      // Parent to proper <ul>
      if(items[i].affi == -1) {
        muca_outc.appendChild(li_memb);
      } else {
        muca_affi.appendChild(li_memb);
      }
    }
  }

  // Admin doesn't have permission to grant/revoke admin or owner
  if(param.stage == 1 && room.affi < XOWS_AFFI_OWNR)
    param.stage = 3;

  // Successively load member per-affiliation lists until we get all.
  //
  // (If you ask me, this part of the protocol is not the better conceived
  // one. Why can't we poll for multiple affiliations using an unique get query ?
  //
  // The Same remark apply equally for affiliation modifications, this
  // per-affiliation lists management is a mess...)
  //
  if(param.stage < 4) {
    xows_xmp_muc_affi_get_query(room.addr,
                                xows_gui_page_muca_load[param.stage++],
                                xows_gui_page_muca_onload);
    return;
  }

  // Loading finished, remove loading class
  muca_outc.classList.remove("LOADING");
  muca_affi.classList.remove("LOADING");

  const phold = "<li>"+xows_l10n_get("List is empty")+"</li>";

  // Set placeholder in case of empty list
  if(muca_outc.innerHTML == "") muca_outc.innerHTML = phold;
  if(muca_affi.innerHTML == "") muca_affi.innerHTML = phold;
}

/**
 * Room Administration page on-close callback function
 */
function xows_gui_page_muca_onclose()
{
  const param = xows_gui_page_muca;

  // unreference data
  param.room = null;
  param.stage = 0;
  param.items = null;
}

/**
 * Room Administration page on-valid callback function
 */
function xows_gui_page_muca_onvalid()
{
  // Set page in loading state
  xows_doc_cls_add("muca_outc", "LOADING");
  xows_doc_cls_add("muca_affi", "LOADING");

  const param = xows_gui_page_muca;

  // Modify item list according current state and start edit cycle
  let li_mods = xows_doc("page_muca").querySelectorAll(".MODIFIED");

  for(let i = 0; i < li_mods.length; ++i) {

    // Get reference item to be modified
    const item = xows_gui_page_muca_getitem(li_mods[i]);

    // Change item Affiliation value
    item.affi = parseInt(li_mods[i].dataset.affi);

    // We don't use the List-Modify mechanism as described in:
    //   https://xmpp.org/extensions/xep-0045.html#modifyowner
    //   https://xmpp.org/extensions/xep-0045.html#modifyadmin
    //   https://xmpp.org/extensions/xep-0045.html#modifymember
    // and
    //   https://xmpp.org/extensions/xep-0045.html#modifyban
    //
    // First, because our current way to manage occupant affiliations (all at
    // once) make it horribly complex to implement (get-query, building delta
    // list, set-query, for each affiliation-list in sequential way), and
    // secondly, because we never had managed to get it work properly and
    // never figured out how exactly it is supposed to work.
    //
    // Changing affiliation using one query per occupant proved to be robust
    // and frugal enough, assuming administrator changes only few affiliations
    // at once.

    // Change user affiliation
    xows_xmp_muc_affi_set_query(param.room.addr, item, null);
  }

  // Start List loading cycle
  param.stage = 0;
  xows_gui_page_muca_onload(null, null);
}

/**
 * Room Administration page on-abort callback function
 */
function xows_gui_page_muca_onabort()
{
  // Reset values
  let li_mods = xows_doc("page_muca").querySelectorAll(".MODIFIED");

  for(let i = 0; i < li_mods.length; ++i) {

    // Get reference item to compare and set as MODIFIED
    const item = xows_gui_page_muca_getitem(li_mods[i]);

    // Update <li-memb> Element to reset to initial value
    xows_tpl_admn_memb_update(li_mods[i], item.affi, item.affi);
  }
}

/**
 * Room Administration page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_muca_oninput(target)
{
  // Update GUI elements
  if(target.tagName == "MEMB-RADIO") {

    // Get related <li-memb> element
    const li_memb = target.closest("LI-MEMB");

    // Get reference item to compare and set as MODIFIED
    const item = xows_gui_page_muca_getitem(li_memb);

    // Update the <li-memb> element
    xows_tpl_admn_memb_update(li_memb, parseInt(target.dataset.affi), item.affi);
  }

  // Open or close Message Box for save changes
  if(xows_doc("page_muca").querySelectorAll(".MODIFIED").length > 0) {
    xows_doc_popu_open_for_save(xows_gui_page_muca_onvalid,
                                xows_gui_page_muca_onabort);
  } else {
    xows_doc_popu_close();
  }
}

/**
 * Room Administration page open
 *
 * @param   {object}   room    Room object to be configured
 */
function xows_gui_page_muca_open(room)
{
  // Set the Room ID in the page header frame
  xows_doc("muca_room").innerText = room.name +" ("+room.addr +")";

  // Initialize parameters
  const param = xows_gui_page_muca;
  param.room = room;

  // Start List load cycle
  param.stage = 0;
  xows_gui_page_muca_onload(null, null);

  // Open dialog page
  xows_doc_page_open("page_muca",true,xows_gui_page_muca_onclose,
                                      xows_gui_page_muca_oninput,
                                      xows_gui_page_muca_oninput);
}
/* -------------------------------------------------------------------
 *
 * Popup Dialog-Box
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Popup Dialog-Box - Room initialization
 * -------------------------------------------------------------------*/
/**
 * Room Initialization Dialog-Box parameters
 */
const xows_gui_mbox_conf = {room:null};

/**
 * Room Initialization Dialog-Box on-valid callback
 */
function xows_gui_mbox_conf_onvalid()
{
  const room = xows_gui_mbox_conf.room;

  xows_log(2,"gui_room_init_onvalid","request initial Room config",room.addr);

  // Send Room config form request, XMPP server will reply which
  // will automatically opens the Room Configuration page.
  xows_cli_muc_getcfg_query(room, xows_gui_page_mucc_open);
}

/**
 * Room Initialization Dialog-Box on-abort callback
 */
function xows_gui_mbox_conf_onabort()
{
  // If we are in Room creation process, we accept the default config
  xows_cli_muc_setcfg_query(xows_gui_mbox_conf.room, null);
}

/**
 * Room Initialization Dialog-Box
 *
 * @param   {object}    room      Joined Room object
 */
function xows_gui_mbox_conf_open(room)
{
  // This scenario occure after room creation confirmation, to ask
  // user for created Room initial configuration.
  xows_gui_mbox_conf.room = room;

  // Open new Message Box to confirm Room initial config process
  xows_doc_mbox_open(XOWS_STYL_ASK, "Channel initialization",
                                    "A new Channel was created and you are its owner, do you want to configure it right now ?",
                                    xows_gui_mbox_conf_onvalid, "Configure",
                                    xows_gui_mbox_conf_onabort, "Ignore");
}

/* -------------------------------------------------------------------
 * Popup Dialog-Box - Contact/Occupant Profile
 * -------------------------------------------------------------------*/

/**
 * Occupant Infos/Manage page on-input callback function
 *
 * @param   {object}   peer    Occupant or Contact object to show/manage
 * @param   {object}   target  Target object of the triggered Event
 */
function xows_gui_prof_onclick(peer, target)
{
  // Check for click on "Add Contact" button
  if(target && target.id == "prof_addc") {

    // Send subscribe request
    xows_cli_subs_request(peer.jbar);

    // Update popup with new Peer parameters
    xows_doc_prof_update();
  }
}

/**
 * Occupant Infos/Manage page open
 *
 * @param   {object}   peer    Occupant or Contact object to show/manage
 */
function xows_gui_prof_open(peer)
{
  // Open Contact Profile popup
  xows_doc_prof_open(peer, xows_gui_prof_onclick);
}


/* -------------------------------------------------------------------
 * Message Dialog-Box - Account deletion Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Account deletion message box on-abort callback function
 */
function xows_gui_mbox_unre_onabort()
{

}

/**
 * Account deletion message box on-valid callback function
 */
function xows_gui_mbox_unre_onvalid()
{
  xows_cli_regi_remove_query(null, null);
}

/**
 * Account deletion message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    affi      Affiliation value to set
 */
function xows_gui_mbox_unre_open()
{
  // Open Message Dialog-Box
  xows_doc_mbox_open(XOWS_STYL_ASK, "Account deletion",
                     "Are you sure you want to delete your XMPP/Jabber account on this server ? This action cannot be reversed.",
                     xows_gui_mbox_unre_onvalid, "Yes, farewell",
                     xows_gui_mbox_unre_onabort, "God damn, NO !");
}
