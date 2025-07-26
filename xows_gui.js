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
"use strict";
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
const XOWS_FETCH_HIST = xows_load_task_bit();

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
  const path = xows_options.lib_path+"/sounds/"+file;

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
 * Flag for client connexion loss
 */
let xows_gui_resume_pnd = false;

/**
 * Currently available media devices (for multimedia calls)
 */
let xows_gui_devices_data = null;

/**
 * Callback function to query device enumeration from MediaDevices API
 */
function xows_gui_devices_poll()
{
  // Query available devices for Multimedia features
  if(navigator.mediaDevices) {
    navigator.mediaDevices.enumerateDevices().then(xows_gui_devices_oninfos);
    navigator.mediaDevices.ondevicechange = xows_gui_devices_onchange;
  }
}

/**
 * Callback function to handle media devices changes event
 *
 * @param   {object}    event      Event object
 */
function xows_gui_devices_onchange(event)
{
  // Update medias list
  navigator.mediaDevices.enumerateDevices().then(xows_gui_devices_oninfos);
}

/**
 * Callback function to handle device enumeration from MediaDevices API
 *
 * @param   {object}    devinfo    Array of MediaDeviceInfo object
 */
function xows_gui_devices_oninfos(devinfo)
{
  // Update media infos list
  xows_gui_devices_data = devinfo;

  xows_log(2,"gui_ondevicesinfos","received medias infos");

  // Update relevant GUI element
  if(xows_gui_peer)
    xows_gui_doc_update(xows_gui_peer);
}

/**
 * Check whether current medias list has the specified type
 *
 * @param   {string}    type      Media type to search for
 */
function xows_gui_devices_has(type)
{
  if(!xows_gui_devices_data)
    return false;

  for(let i = 0; i < xows_gui_devices_data.length; ++i)
    if(xows_gui_devices_data[i].kind === type)
      return true;

  return false;
}

/**
 * Constant for initial offscreen slot identifier
 */
const XOWS_GUI_FRAG_VOID = "void";

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
function xows_gui_frag_new(slot, source)
{
  if(!source)
    source = XOWS_GUI_FRAG_VOID;

  if(!xows_doc_frag_db.has(source)) {
    xows_log(1,"gui_frag_new","source fragment doesn't exist",source);
    return;
  }

  // Copy offscreen scroll parameters
  xows_doc_scrl_copy(slot, source);

  // Clone elements from initial offscreen slot
  xows_doc_frag_clone(slot, source, "peer_col");
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
function xows_gui_frag_export(slot)
{
  if(!xows_doc_frag_db.has(slot)) {
    xows_log(1,"gui_peer_frag_export","fragment doesn't exist",slot);
    return;
  }

  // Export scroll parameters to offscreen
  xows_doc_scrl_export(slot, "chat_main");

  // Export document elements to offscreen fragment
  xows_doc_frag_export(slot, "peer_col");
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
function xows_gui_frag_import(slot)
{
  let clone = false;
  if(!slot) {
    slot = XOWS_GUI_FRAG_VOID;
    clone = true;
  }

  if(!xows_doc_frag_db.has(slot)) {
    xows_log(1,"gui_peer_frag_import","fragment doesn't exist",slot);
    return;
  }

  // Import document elements from offscreen fragment
  xows_doc_frag_import(slot, "peer_col", clone);

  // Import scroll parameters from offscreen
  xows_doc_scrl_import(slot, "chat_main");
}

/**
 * Common function to delete Peer's related offscreen element.
 *
 * @param   {string}    slot      Document fragment slot (Peer's address)
 */
function xows_gui_frag_discard(slot)
{
  // Delete Document Fragment
  xows_doc_frag_delete(slot);

  // Delete Scroll parameters
  xows_doc_scrl_delete(slot);
}

/**
 * Clear all Peer's related offscreen elements.
 */
function xows_gui_frag_clear()
{
  for(const slot of xows_doc_frag_db.keys()) {
    if(slot !== XOWS_GUI_FRAG_VOID) {
      xows_gui_frag_discard(slot);
    }
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
  // Create intial offscreen data from current document
  xows_doc_scrl_export(XOWS_GUI_FRAG_VOID, "chat_main");
  xows_doc_frag_export(XOWS_GUI_FRAG_VOID, "peer_col", false);

  // Poll for available devices for Multimedia features
  xows_gui_devices_poll();

  // Set event listener to handle user keyboard
  xows_doc_listener_add(document, "keydown", xows_gui_wnd_onkey, false); //< need preventDefault()
  xows_doc_listener_add(document, "keyup", xows_gui_wnd_onkey);
  // Set event listener to handle user presence and GUI focus
  xows_doc_listener_add(document, "visibilitychange", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "pagehide", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "focus", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "blur", xows_gui_wnd_onfocus);
  xows_doc_listener_add(window, "beforeunload", xows_gui_wnd_unload);
  // Set event listener to hook browser "nav back"
  xows_doc_listener_add(window, "popstate", xows_gui_wnd_onback);
  // Set event listener to handle chat scroll moving on resize
  xows_doc_listener_add(window, "resize", xows_gui_chat_onresize);

  // Main Page "scr_main" event listeners
  xows_doc_listener_add(xows_doc("rost_hand"), "click", xows_gui_layout_hand_onclick);
  // Tabs/Roster Frame listeners
  xows_doc_listener_add(xows_doc("app_fram"), "click", xows_gui_app_fram_onclick);
  // Roster headers listerners
  xows_doc_listener_add(xows_doc("cont_acts"), "click", xows_gui_rost_head_onclick);
  xows_doc_listener_add(xows_doc("room_acts"), "click", xows_gui_rost_head_onclick);
  xows_doc_listener_add(xows_doc("occu_acts"), "click", xows_gui_rost_head_onclick);
  // Roster lists listerners
  xows_doc_listener_add(xows_doc("cont_list"), "click", xows_gui_rost_list_onclick);
  xows_doc_listener_add(xows_doc("room_list"), "click", xows_gui_rost_list_onclick);
  xows_doc_listener_add(xows_doc("occu_list"), "click", xows_gui_rost_list_onclick);
  // Self panel listerner
  xows_doc_listener_add(xows_doc("self_panl"), "click", xows_gui_self_fram_onclick);

  // Load sound effects
  xows_gui_sound_load("notify",   "notify.ogg");
  xows_gui_sound_load("disable",  "disable.ogg");
  xows_gui_sound_load("enable",   "enable.ogg");
  xows_gui_sound_load("mute",     "mute.ogg");
  xows_gui_sound_load("unmute",   "unmute.ogg");
  xows_gui_sound_load("ringtone", "ringtone.ogg", true);
  xows_gui_sound_load("ringbell", "ringbell.ogg", true);
  xows_gui_sound_load("hangup",   "hangup.ogg");

  // Configure client callbacks
  xows_cli_set_callback("ready",      xows_gui_cli_onready);
  xows_cli_set_callback("error",      xows_gui_cli_onerror);
  xows_cli_set_callback("close",      xows_gui_cli_onclose);
  xows_cli_set_callback("selfpush",   xows_gui_self_onpush);
  xows_cli_set_callback("subspush",   xows_gui_rost_subs_onpush);
  xows_cli_set_callback("contpush",   xows_gui_rost_cont_onpush);
  xows_cli_set_callback("contpull",   xows_gui_rost_cont_onpull);
  xows_cli_set_callback("roompush",   xows_gui_rost_room_onpush);
  xows_cli_set_callback("roompull",   xows_gui_rost_room_onpull);
  xows_cli_set_callback("occupush",   xows_gui_rost_occu_onpush);
  xows_cli_set_callback("occupull",   xows_gui_rost_occu_onpull);
  xows_cli_set_callback("mucjoin",    xows_gui_muc_onjoin);
  xows_cli_set_callback("mucexit",    xows_gui_muc_onexit);
  xows_cli_set_callback("mucpush",    xows_gui_muc_onpush);
  xows_cli_set_callback("mucpull",    xows_gui_muc_onpull);
  xows_cli_set_callback("mucsubj",    xows_gui_muc_onsubj);
  xows_cli_set_callback("msgrecv",    xows_gui_hist_onrecv);
  xows_cli_set_callback("msgrecp",    xows_gui_hist_onrecp);
  xows_cli_set_callback("msgretr",    xows_gui_hist_onretr);
  xows_cli_set_callback("msgchst",    xows_gui_edit_onchst);
  xows_cli_set_callback("upldprog",   xows_gui_upld_onporg);
  xows_cli_set_callback("upldload",   xows_gui_upld_onload);
  xows_cli_set_callback("calloffer",  xows_gui_call_onoffer);
  xows_cli_set_callback("callanwse",  xows_gui_call_onanwse);
  xows_cli_set_callback("callstate",  xows_gui_call_onstate);
  xows_cli_set_callback("calltermd",  xows_gui_call_ontermd);
  xows_cli_set_callback("callerror",  xows_gui_call_onerror);

  // Set loader functions
  xows_load_task_set(XOWS_FETCH_HIST, xows_gui_mam_fetch_newer);
}

/**
 * Clean the GUI to its session-start state
 *
 * This function keeps the sessions and Peer's related elements and simply
 * close any opened dialog, menu or page.
 */
function xows_gui_clean()
{
  // close any opened page or overlay element
  xows_doc_page_close();
  xows_doc_menu_close();
  xows_doc_view_close();
  xows_doc_popu_close();
  xows_doc_ibox_close();
  xows_doc_mbox_close();
  xows_doc_prof_close();
}

/**
 * Hard-reset all GUI to its initial loading state
 *
 * This function reset and empty all GUI element to their initial
 * loading state and delete all Peer related elements.
 */
function xows_gui_reset()
{
  xows_log(2,"gui_reset","set GUI to initial state");

  // Clean GUI (close any opened page, dialog, etc)
  xows_gui_clean();

  // Remove Peer related elements
  if(xows_gui_peer)
    xows_gui_doc_export(xows_gui_peer);

  // Reset columns setup
  xows_doc_cls_rem("main_wrap", "MUCL-WIDE");
  xows_doc_cls_add("main_wrap", "ROST-WIDE");

  // hide all screens
  xows_doc_hide("scr_page");
  xows_doc_hide("scr_main");

  // clean roster lists
  xows_doc("cont_pend").innerHTML = "";
  xows_doc("cont_budy").innerHTML = "";
  xows_doc("room_book").innerHTML = "";
  xows_doc("room_publ").innerHTML = "";
  xows_doc("room_priv").innerHTML = "";
  xows_doc("priv_occu").innerHTML = "";

  // Reset roster tabs
  xows_doc("tab_occu").hidden = true;
  xows_doc("tab_room").disabled = true;
  xows_gui_app_tab_select("tab_cont");
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

  // Clear all Peer's offscreen elements
  xows_gui_frag_clear();
}

/* -------------------------------------------------------------------
 *
 * Client Interface - Connect / Dsiconnect
 *
 * -------------------------------------------------------------------*/
/**
 * Function to connect (try login)
 *
 *
 * @param   {string}    user    Login username or Full JID
 * @param   {string}    pass    Login Password
 * @param   {boolean}   cred    Indicate remember credential
 * @param   {boolean}   regi    Register new account
 */
function xows_gui_connect(user, pass, cred, regi = false)
{
  // Display wait screen
  xows_gui_page_wait_open("Connecting...");

  // Get login parameters from DOM
  xows_gui_auth = {};
  xows_gui_auth.user = user;
  xows_gui_auth.pass = pass;
  xows_gui_auth.cred = cred;

  // Close any popup-box
  xows_doc_popu_close();

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
  let jid = xows_gui_auth.user;
  if(xows_options.login_force_domain)
    jid += "@"+xows_options.login_force_domain;

  // Launch the client connection
  xows_cli_cnx_login( xows_options.xmpp_url,
                    jid,
                    xows_gui_auth.pass,
                    regi);
}

/**
 * Function to handle client login success and ready
 *
 * @param   {object}    user      User object
 */
function xows_gui_cli_onready(user)
{
  // Check whether user asked to remember
  if(xows_gui_auth) {

    if(xows_gui_auth.cred) {

      // Output log
      xows_log(2,"gui_cli_onready","Saving credential");

      // Store credentials
      if(window.PasswordCredential) {
        const cred = {"id"        : xows_gui_auth.user,
                      "password"  : xows_gui_auth.pass};
        navigator.credentials.store(new PasswordCredential(cred));
      }
    }
  }

  // Check whether we recover from connexion loss
  if(xows_gui_resume_pnd) {

    xows_log(1,"gui_cli_onready","resume session");

    // Reset connection loss
    xows_gui_resume_pnd = false;

    // Update history for openned chat
    let i = xows_cli_cont.length;
    while(i--) {
      const cont = xows_cli_cont[i];
      // Update only if history already preloaded
      if(xows_gui_doc_has(cont))
        xows_gui_mam_fetch_newer(cont);
    }

    i = xows_cli_room.length;
    while(i--) {
      const room = xows_cli_room[i];
      // Update only if history already preloaded
      if(xows_gui_doc_has(room))
        xows_gui_mam_fetch_newer(room);
    }

  } else {

    xows_log(2,"gui_cli_onready","open session");

    // Push history to allow message box if user click Back
    window.history.pushState({},"",window.location.pathname);

    // Reset the Roster and Chat window
    xows_gui_peer_switch_to(null);

    // Check MUC service
    const has_muc = xows_cli_services.has(XOWS_NS_MUC);
    xows_doc("room_bt_upd").disabled = !has_muc;

    // Check for HTTP-Upload service
    const upld_svc = xows_cli_services.get(XOWS_NS_HTTPUPLOAD);
    // Add embedd routine for HTTP-Upload (for automatic URL parsing)
    if(upld_svc && upld_svc.length)
      xows_tpl_embed_add_upld(upld_svc[0]);
  }

  // Close wait page
  xows_doc_page_close();

  // show main 'screen'
  xows_doc_show("scr_main");
}

/**
 * Function to disconnect
 */
function xows_gui_disconnect()
{
  // This is a session lost
  xows_log(2,"gui_disconnect","prepare disconnect");

  // Reset auth data
  //xows_gui_auth = null;

  // Disconnect client
  xows_cli_cnx_close();
}

/**
 * Handle client connexion closed
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [text]     Optional information or error message
 */
function xows_gui_cli_onclose(code, text)
{
  let failure;

  // Do we have an error code ?
  if(code) {

    if(code & XOWS_SESS_LOST) {

      // This is a session lost
      xows_log(2,"gui_cli_onclose","session lost",text);

      xows_gui_resume_pnd = true;

      // Clean GUI
      xows_gui_clean();

      // Display wait screen
      xows_gui_page_wait_open("Connecting...");

      return; //< do not reset everything

    } else {

      xows_log(2,"gui_cli_onclose","session failure",text);

      xows_gui_resume_pnd = false;

      // This is a session failure or abort after unsuccessful recover
      if(code & XOWS_SESS_ABRT) {
        failure = "Connection lost";
      } else if(code & XOWS_SOCK_FAIL) {
        failure = "Network error";
      } else if(code & XOWS_XMPP_AUTH) {
        failure = "Authentication failure";
      } else  if(code & XOWS_XMPP_REGI) {
        failure = "Registration failure";
      } else {
        failure = "Connection failure";
      }
    }
  } else {
    xows_log(2,"gui_cli_onclose","session closed by user");
  }

  // reset GUI
  xows_gui_reset();

  // Display Login page
  xows_gui_page_auth_open();

  // display error message
  if(failure)
    xows_doc_popu_open(XOWS_STYL_ERR, xows_l10n_get(failure)+": "+xows_l10n_get(text));
}

/**
 * Handle client incomming error
 *
 * @parma   {string}    from      Error expeditor
 * @param   {object}    error     Error data object
 */
function xows_gui_cli_onerror(from, error)
{
  let text = xows_l10n_get("Unhandled error")+": ";
  text += xows_xml_beatify_tag(error.name);

  // Display popup error message
  xows_doc_popu_open(XOWS_STYL_ERR, text);
}

/* -------------------------------------------------------------------
 *
 * Peer Documents Routines
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Peer Documents - Creation & Management
 * -------------------------------------------------------------------*/
/**
 * Check whether Peer offscreen slot exists
 *
 * @param   {object}    peer      Peer object to check
 *
 * @return  {boolean}   True if offscreen slot exists, false otherwise
 */
function xows_gui_doc_has(peer)
{
  return xows_doc_frag_db.has(peer.addr);
}

/**
 * Create new Peer offscreen slot using initial DOM elements
 *
 * @param   {object}    peer      Peer object to initialize offscreen for
 */
function xows_gui_doc_init(peer)
{
  // Prevent recreate offscreen document
  if(xows_doc_frag_db.has(peer.addr))
    return;

  // Clone elements from initial offscreen slot
  xows_gui_frag_new(peer.addr);

  // Set proper chat frame style
  const chat_fram = xows_gui_doc(peer,"chat_fram");
  if(peer.type === XOWS_PEER_ROOM) {
    chat_fram.classList.add("CHAT-ROOM");
  } else {
    //xows_gui_doc_cls_add(peer,"mucl_col","COL-HIDE");
    xows_gui_doc(peer,"mucl_col").hidden = true;
    chat_fram.classList.add("CHAT-BUDY");
  }

  // Set chat input placeholder
  const placeholder = xows_l10n_get("Send a message to")+" "+peer.name+" ...";
  xows_gui_doc(peer,"edit_inpt").setAttribute("placeholder",placeholder);

  // Check whether file Upload is available
  xows_gui_doc(peer,"edit_upld").disabled = !xows_cli_services.has(XOWS_NS_HTTPUPLOAD);

  // Set chat header bar informations
  xows_gui_doc_update(peer);
}

/**
 * Reset Peer offscreen slot to initial state
 *
 * @param   {object}    peer      Peer object to reset offscreen for
 */
function xows_gui_doc_reset(peer)
{
  // Prevent recreate offscreen document
  if(xows_doc_frag_db.has(peer.addr))
    xows_doc_frag_db.delete(peer.addr);

  xows_gui_doc_init(peer);
}

/**
 * Move and store current document Peer elements to offscreen
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_doc_export(peer)
{
  // Export document elements to offscreen fragment
  xows_gui_frag_export(peer.addr);

  // Unset current active Peer
  xows_gui_peer = null;
}

/**
 * Bring back saved Peer offscreen elements to current document
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_doc_import(peer)
{
  if(!peer) {
    xows_log(1,"gui_doc_import","peer is null");
    return;
  }

  // If no document fragment exists for Peer, create it
  if(!xows_doc_frag_db.has(peer.addr)) {
    xows_gui_doc_init(peer);
  }

  // import document elements from offscreen fragment
  xows_gui_frag_import(peer.addr);

  // Set current active Peer
  xows_gui_peer = peer;

  // Re-bind resize observer
  xows_gui_chat_observer.observe(xows_doc("chat_main"));
  //xows_gui_chat_observer.observe(xows_doc("chat_hist"));

  // Recreate event listeners
  xows_doc_listener_add(xows_doc("chat_head"), "click", xows_gui_chat_head_onclick);
  xows_doc_listener_add(xows_doc("chat_main"), "scrollend",xows_gui_chat_onscroll);
  xows_doc_listener_add(xows_doc("chat_hist"), "click", xows_gui_hist_onclick);

  if(!xows_doc("call_view").hidden) {
    xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
    xows_doc_listener_add(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
  }

  const call_ring = xows_doc("call_ring");
  if(!call_ring.hidden) xows_doc_listener_add(call_ring, "click", xows_gui_call_ring_onclick);

  const hist_upld = xows_doc("hist_upld");
  if(!hist_upld.hidden) xows_doc_listener_add(hist_upld, "click", xows_gui_upld_onclick);

  const chat_nav = xows_doc("chat_nav");
  if(!chat_nav.hidden) xows_doc_listener_add(chat_nav, "click", xows_gui_chat_nav_onclick);

  const chat_edit = xows_doc("chat_edit");
  xows_doc_listener_add(chat_edit, "click", xows_gui_edit_onclick);
  xows_doc_listener_add(chat_edit, "input", xows_gui_edit_inpt_oninput);
  xows_doc_listener_add(chat_edit, "paste", xows_gui_edit_inpt_onpaste, false); //< need preventDefault()
  xows_doc_listener_add(xows_doc("edit_file"), "change", xows_gui_edit_onfile);

  if(peer.type === XOWS_PEER_ROOM) {
    xows_doc_listener_add(xows_doc("mucl_hand"), "click", xows_gui_layout_hand_onclick);
    xows_doc_listener_add(xows_doc("mucl_head"), "click", xows_gui_mucl_head_onclick);
    xows_doc_listener_add(xows_doc("mucl_list"), "click", xows_gui_mucl_list_onclick);
  }

  // Check whether document is newly opened and need some preload
  if(xows_gui_doc(peer,"peer_load").hidden) {

    xows_log(2,"gui_doc_import","updating elements",peer.addr);

    // Update elements according peer state
    xows_gui_doc_update(peer);

  } else {

    xows_log(2,"gui_doc_import","initia preloading",peer.addr);

    let load_mask = 0;

    switch(peer.type)
    {
    case XOWS_PEER_OCCU:
      // Occupant have nothing to load
      xows_doc_cls_add("hist_beg","HIST-START");
      break;
    default:
      load_mask |= XOWS_FETCH_HIST;
      break;
    }

    // Load required then update elements according peer state.
    xows_load_task_push(peer, load_mask,
                        xows_gui_doc_update,
                        XOWS_UPDT_ALL|XOWS_UPDT_LOAD);
  }
}

/**
 * Reassign saved Peer offscreen elements to another reference
 *
 * @param   {object}    peer      Peer object with updated address
 * @param   {string}    slot      Previous Peer's slot (address) to be reassigned
 */
function xows_gui_doc_reassign(peer, slot)
{
  if(peer === xows_gui_peer)
    // Move document elements to offscreen fragment
    xows_gui_frag_export(slot);

  // clone elements from source offscreen slot
  xows_gui_frag_new(peer.addr, slot);

  // Delete previous offscreen elements
  xows_gui_frag_discard(slot);

  if(peer === xows_gui_peer)
    // Bring back Peer documents with new reference
    xows_gui_doc_import(peer);
}

/* -------------------------------------------------------------------
 * Peer Documents - Fetch and Actions routines
 * -------------------------------------------------------------------*/
/**
 * Get Peer related element by id, either in current document or in
 * offscreen fragment
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Element id
 *
 * @return  {object}    Element or null if not found
 */
function xows_gui_doc(peer, id)
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
function xows_gui_doc_cls_tog(peer, id, cls, force)
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
function xows_gui_doc_cls_add(peer, id, cls)
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
function xows_gui_doc_cls_rem(peer, id, cls)
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
function xows_gui_doc_cls_has(peer, id, cls)
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
function xows_gui_doc_scrl_save(peer)
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
function xows_gui_doc_scrl_get(peer)
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
function xows_gui_doc_scrl_down(peer, smooth = true)
{
  // Force update navigation bar
  xows_gui_chat_nav_update(xows_gui_peer, 0, 0);

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
function xows_gui_doc_scrl_keep(peer)
{
  if(peer === xows_gui_peer) {
    xows_doc_scrl_keep(document.getElementById("chat_main"));
  } else {
    xows_doc_scrl_keep(xows_doc_scrl_db.get(peer.addr));
  }
}

/* -------------------------------------------------------------------
 * Peer Documents - Update routines
 * -------------------------------------------------------------------*/
/**
 * Maks bits for document update routine
 */
const XOWS_UPDT_NOTI = 0x01;  //< Update Notification button
const XOWS_UPDT_BUZY = 0x02;  //< Update according Call Buzy state
const XOWS_UPDT_SUBJ = 0x04;  //< Update Room subject
const XOWS_UPDT_ADMN = 0x08;  //< Update Room admin button
const XOWS_UPDT_OTHR = 0x10;  //< Update other misc elements
const XOWS_UPDT_ALL  = 0xff;  //< All common updates
const XOWS_UPDT_LOAD = 0x100; //< Special mask for preloading

/**
 * Update Peer's chat frame and Occupant list elements heads according
 * Peer data.
 *
 * @param   {object}    peer      Peer object
 * @param   {number}   [mask]     Optional bits mask for selective update
 */
function xows_gui_doc_update(peer, mask = 0xff)
{
  if(!xows_doc_frag_db.has(peer.addr))
    return;

  if(mask & XOWS_UPDT_NOTI) {
    const enabled = (xows_gui_wnd_noti_allowed() && peer.noti);
    const chat_noti = xows_gui_doc(peer, "chat_noti");
    // Set notification mute or enable
    chat_noti.title = enabled ? xows_l10n_get("Disable notifications") :
                                   xows_l10n_get("Enable notifications");
    // Toggle chat action button class
    chat_noti.classList.toggle("DISABLED", !enabled);
  }

  if(peer.type === XOWS_PEER_ROOM) {

    if(mask & XOWS_UPDT_OTHR) {
      // Chat header common elements
      xows_gui_doc(peer,"chat_titl").innerText = "# "+ peer.name;
      // Chat header room-specific buttons
      xows_gui_doc(peer,"chat_bkmk").hidden = (peer.book || peer.publ);
      xows_gui_doc(peer,"chat_nick").hidden = false;
      xows_gui_doc(peer,"chat_subj").hidden = (peer.role < XOWS_ROLE_MODO) && (peer.affi < XOWS_AFFI_ADMN);
      xows_gui_doc(peer,"chat_cnfg").hidden = (peer.affi < XOWS_AFFI_OWNR);
    }

    // Room subject
    if(mask & XOWS_UPDT_SUBJ) {
      const chat_meta = xows_gui_doc(peer, "chat_meta");
      chat_meta.innerText = peer.subj ? peer.subj : "";
      chat_meta.className = peer.subj ? "" : "PLACEHOLD";
    }

    // Muc Roster Admin button
    if(mask & XOWS_UPDT_ADMN) {
      const muc_bt_admn = xows_gui_doc(peer, "muc_bt_admn");
      muc_bt_admn.hidden = (peer.affi < XOWS_AFFI_ADMN);
    }

  } else {

    if(mask & XOWS_UPDT_OTHR) {

      // Common header elements
      xows_gui_doc(peer,"chat_titl").innerText = peer.name;
      xows_gui_doc(peer,"chat_meta").innerText = peer.stat;
      xows_gui_doc(peer,"chat_show").dataset.show = peer.show;

      // Contact or Occupant (Private Message) variations
      if(peer.type === XOWS_PEER_OCCU) {
        xows_gui_doc(peer,"chat_addr").innerText = "(# "+peer.room.name +")";
        xows_gui_doc(peer,"chat_addc").hidden = (xows_cli_peer_subsste(peer) !== 0);
      } else {
        xows_gui_doc(peer,"chat_addr").innerText = "("+peer.addr+")";
      }

      // Show or hide call buttons
      const has_ices = xows_cli_extsvc_has("stun","turn");
      xows_gui_doc(peer,"chat_cala").hidden = !(xows_gui_devices_has("audioinput") && has_ices);
      xows_gui_doc(peer,"chat_calv").hidden = !(xows_gui_devices_has("videoinput") && has_ices);
    }

    // Enable or disable Call buttons according buzy state
    if(mask & XOWS_UPDT_BUZY) {
      const unavailable = xows_cli_call_buzy() || (peer.show <= XOWS_SHOW_DND);
      xows_gui_doc(peer, "chat_cala").disabled = unavailable;
      xows_gui_doc(peer, "chat_calv").disabled = unavailable;
    }
  }

  // Special mask to disable the preloading screen
  // for newly opened document set.
  if(mask & XOWS_UPDT_LOAD) {
    const peer_load = xows_gui_doc(peer,"peer_load");
    if(!peer_load.hidden) peer_load.hidden = true;
  }
}

/* -------------------------------------------------------------------
 *
 * Peer General Routines
 *
 * -------------------------------------------------------------------*/
/**
 * Set the active Peer and display its associated document set.
 *
 * This function is a central pivot of GUI interaction, it open and close
 * the proper document sets according requested Peer selection
 *
 * @param   {string}    addr      Peer JID to select
 */
function xows_gui_peer_switch_to(addr)
{
  if(xows_gui_peer) {
    // Do no switch to same contact
    if(addr === xows_gui_peer.addr)
      return;
  }

  // Get the next (to be selected) contact
  let peer = addr ? xows_cli_peer_get(addr, XOWS_PEER_ANY) : null;

  if(peer) {

    // Special behavior for room, we need to join first
    if(peer.type === XOWS_PEER_ROOM && !peer.join) {

      // Attempt to join room first
      xows_gui_muc_join(peer);

      // Peer not ready yet
      peer = null;
    }
  }

  if(xows_gui_peer) {

    // If we are not about to switch Roster Tab, we unselect
    // current <li-peer> to prevent irrelevant selection

    if(!peer || (peer.type === xows_gui_peer.type)) {
      // Get current visible Roster page
      const rost_page = xows_doc("rost_fram").querySelector("ROW-PAGE:not([hidden])");
      // Search for selected <li-peer> if any then unselect
      const li_peer = rost_page.querySelector(".SELECTED");
      if(li_peer) li_peer.classList.remove("SELECTED");
    }

    // Send chat state to notify current user
    xows_cli_chst_set(xows_gui_peer, XOWS_CHAT_GONE);

    // export document elements to offscreen fragment
    xows_gui_doc_export(xows_gui_peer);

    // Revert window title
    xows_gui_wnd_title_pop();
  }

  if(peer) {

    // Select <li-peer> element and toggle to proper tab
    {
      // Search for corresponding <li-peer>
      const li_peer = xows_gui_rost_list_find(peer.addr);
      // Add or remove SELECTED class
      li_peer.classList.toggle("SELECTED", true);
      // Switch to corresponding tab
      xows_gui_app_tab_select(li_peer.closest("ROW-PAGE").dataset.tab);
    }

    // Bring back Peer document elements from offscreen
    xows_gui_doc_import(peer);
    // Clear contact unread notification for next peer
    xows_gui_badg_unrd_reset(peer);
    // Set input focus to Chat Message Edition input
    xows_gui_edit_inpt_setfocus();
    // Switch to Chat-View layout
    xows_gui_layout_chat_view();
    // Set window title
    xows_gui_wnd_title_set("@" + peer.name + " - XOWS");
    // Some debug log
    xows_log(2,"gui_switch_peer","peer \""+peer.addr+"\"","selected");
  }

  if(!xows_gui_peer) {

    xows_log(2,"gui_switch_peer","unselect peer");

    // Back to roster view in case of narrow-screen
    xows_gui_layout_rost_view();
  }

}

/* -------------------------------------------------------------------
 *
 * Main layout interactions
 *
 * -------------------------------------------------------------------*/
/**
 * Handle click on column Handles to hide Roster or MUC List
 *
 * @param   {object}    event   Event object
 */
function xows_gui_layout_hand_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  xows_gui_layout_chat_view();
}

/**
 * Switch to normal Chat-View layout
 */
function xows_gui_layout_chat_view()
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Remove any widened panel
  xows_doc_cls_rem("main_wrap", "MUCL-WIDE");
  xows_doc_cls_rem("main_wrap", "ROST-WIDE");
}

/**
 * Widens the User Roster column (Left Panel)
 */
function xows_gui_layout_rost_view()
{
  // Widen left panel (Roster)
  xows_doc_cls_add("main_wrap","ROST-WIDE");
}

/**
 * Toggles the MUC (Occupants) Roster column (Left Panel)
 */
function xows_gui_layout_muc_toggle()
{
  // Checks whether we are in narrow-screen mode
  if(window.matchMedia("(max-width: 799px)").matches) {

    // Widen right panel
    xows_doc_cls_add("main_wrap","MUCL-WIDE");

  } else {

    if(xows_gui_peer) {
      const muc_col = xows_doc("mucl_col");
      muc_col.hidden = !muc_col.hidden;
    }
  }
}

/* -------------------------------------------------------------------
 *
 * Browser window routines
 *
 * -------------------------------------------------------------------*/
 /* -------------------------------------------------------------------
 * Browser window - Title
 * -------------------------------------------------------------------*/
/**
 * Stack for document title changes
 */
const xows_gui_wnd_title_stk = [];

/**
 * Push the title stack and set new document title
 *
 * @param   {string}    title     Title to set
 */
function xows_gui_wnd_title_set(title)
{
  xows_gui_wnd_title_stk.push(document.title);
  document.title = title;
}

/**
 * Pop title stack and restore previous document title
 */
function xows_gui_wnd_title_pop()
{
  document.title = xows_gui_wnd_title_stk.pop();
}

/* -------------------------------------------------------------------
 * Browser window - Browser navigation Back handle
 * -------------------------------------------------------------------*/
/**
 * Handles user click on browser navigation history back
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_onback(event)
{
  if(xows_cli_cnx_cntd() && !xows_doc_popu_modal()) {

    // prevent to go back
    history.forward();

    // open confirmation dialog
    xows_gui_wnd_exit_popu_open();
  }
}

/* -------------------------------------------------------------------
 * Browser window - Events Handling
 * -------------------------------------------------------------------*/
/**
 * Handles the client/Web page focus change
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_onfocus(event)
{
  switch(event.type)
  {
  case "focus":
  case "blur":
    if(!xows_gui_has_focus)
      xows_cli_pres_show_back();
    break;

  case "visibilitychange":
    // I am not sure this is usefull at all...
    if(xows_cli_cnx_resume_pnd && !document.hidden)
      xows_cli_cnx_resume(10);
    break;
  }

  xows_gui_has_focus = document.hasFocus();
}

/**
 * Handles the client/Web page unload
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_unload(event)
{
  // Disconnect
  xows_cli_flush();

  return undefined; //< prevent prompting dialog to user
}

/* -------------------------------------------------------------------
 * Browser window - Push Notification
 * -------------------------------------------------------------------*/
/**
 * Handle received notification permission from user
 *
 * @param   {string}    perm      Received permission
 */
function xows_gui_wnd_noti_onperm(perm)
{
  // update notify button for current peer
  if(xows_gui_peer)
    xows_gui_doc_update(xows_gui_peer, XOWS_UPDT_NOTI);
}

/**
 * Query user for notification permission
 */
function xows_gui_wnd_noti_ask()
{
  // Request permission to user
  if(Notification.permission !== "granted")
    Notification.requestPermission().then(xows_gui_wnd_noti_onperm);
}

/**
 * Returns whether permission for browser/window notifications
 * emission was granted by user.
 *
 * @return  {boolean}   True if permission granted, false otherwise
 */
function xows_gui_wnd_noti_allowed()
{
  return (Notification.permission === "granted");
}

/**
 * Pop a new browser Notification
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    body      Notification body (message body)
 */
function xows_gui_wnd_noti_emit(peer, body)
{
  if(!peer.noti)
    return;

  xows_log(2,"gui_wnd_noti_emi", peer.name, Notification.permission);

  switch(Notification.permission)
  {
  case "denied":
    return;

  case "granted":
    {
      // Retrieve the cached, actual or temporary, avatar dataUrl
      const icon = xows_cach_avat_get(peer.avat);
      // Push new notification
      const notif = new Notification(peer.name,{"body":body,"icon":(icon?icon:("/"+xows_options.lib_path+"/icon.svg"))});
      // Sound is slower than light...
      xows_gui_sound_play("notify");
    }
    break;

  default:
    // Request user permission for notifications
    xows_gui_wnd_noti_ask();
    break;
  }
}

/* -------------------------------------------------------------------
 * Browser window - User input devices access
 * -------------------------------------------------------------------*/
/**
 * User input devices access parameters
 */
const xows_gui_wnd_media_param = {constr:null,onmedia:null,onabort:null,payload:null,error:null};

/**
 * Request user permissions to access input devices specified by constraints.
 *
 * @param   {object}     constr     Medias constraints to acquire
 * @param   {function}   onmedia    Acquire success callback
 * @param   {function}   onmedia    Acquire abort callback
 * @param   {any}       [payload]   Optional payload to pass to callbacks
 */
function xows_gui_wnd_media_try(constr, onmedia, onabort, payload)
{
  const param = xows_gui_wnd_media_param;

  // If constraints are not defined, reuse previous parameters
  if(constr) {

    // Save parameters
    param.constr = constr;
    param.onmedia = onmedia;
    param.onabort = onabort;
    param.payload = payload;
    param.error = null;

  } else {

    if(!param.constr) {
      xows_log(1,"gui_getmedia_try","invalid usage","constraints not defined");
      return;
    }
  }

  // Send media request to User
  navigator.mediaDevices.getUserMedia(param.constr)
    .then((stream) => param.onmedia(param.payload, stream),
                      xows_gui_wnd_media_onfail);
}

/**
 * Callback for user access input devices faillure or deny.
 *
 * If received error is an explicit user access denied, the configured
 * onabort callback is directly called with the received error.
 *
 * On the other hand, if it is not clear why access failed, a message dialog
 * is displayed to ask user to abort or retry.
 *
 * @param   {object}    error   Error object (DOMException)
 */
function xows_gui_wnd_media_onfail(error)
{
  // Save received error
  xows_gui_wnd_media_param.error = error;

  if(error.name === "NotAllowedError") { //< User deny access

    // It is not possible to "retry" after user deny (at least on firefox),
    // the choice is saved until session end or being reset via explicit
    // user action.
    //
    // So we simply forward the specific error to inform user choice was
    // made.
    xows_gui_wnd_media_onabort();

  } else {

    // This may be a temporary hardware or system error, maybe we can retry
    // to acquire and ask again to user.

    xows_log(1,"gui_getmedia_onfail","input devices access failed",error.name);

    // Opend message dialog
    xows_doc_mbox_open(XOWS_STYL_ASK, "Input devices access",
                       "Getting access to input devices failed, would you like to retry ?",
                       xows_gui_wnd_media_try, "Retry",
                       xows_gui_wnd_media_onabort, "Cancel");
  }
}

/**
 * Callback for user access input devices canceled or denied by user
 */
function xows_gui_wnd_media_onabort()
{
  // Get saved parameters
  const param = xows_gui_wnd_media_param;

  // Call on-abort callback
  if(xows_isfunc(param.onabort))
    param.onabort(param.payload, param.error);
}

/* -------------------------------------------------------------------
 * Browser window - Input Handling
 * -------------------------------------------------------------------*/
/**
 * Chat Editor table to store current pressed (down) key
 */
const xows_gui_wnd_keydn = new Array(256);

/**
 * Handles browser window keyboard inputs
 *
 * It is used to capture user's pressing keyboard basic keys such as
 * Escape or Enter to trigger proper actions, for instance, closing
 * edition dialog or sending a message.
 *
 * @param   {object}    event     Event object.
 */
function xows_gui_wnd_onkey(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Enable key down according received event
  xows_gui_wnd_keydn[event.keyCode] = (event.type === "keydown");

  // Check for key down event
  if(event.type === "keydown") {

    // Check for pressed Esc
    if(event.keyCode === 27) {
      // Cancel any message correction
      xows_gui_mesg_repl_dlg_close(event.target);
      // Cancel any message retraction
      xows_gui_mesg_retr_dlg_abort(event.target);
    }

    // Check for pressed Enter
    if(event.keyCode === 13) {

      // Check whether shift key is press, meaning escaping to
      // add new line in input instead of send message.
      if(xows_gui_wnd_keydn[16])
        return;

      // Prevent browser to append the new-line in the text-area
      event.preventDefault();

      switch(event.target.tagName)
      {
      case "CHAT-INPT":
        xows_gui_edit_inpt_onenter(event.target);
        break;
      case "MESG-INPT":
        xows_gui_mesg_repl_dlg_valid(event.target);
        break;
      }
    }
  }
}

/* -------------------------------------------------------------------
 * Browser window - Exit Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Disconnect Confirmation message box on-abort callback function
 */
function xows_gui_wnd_exit_popu_onabort()
{
  // Nothing to do
}

/**
 * Disconnect Confirmation message box on-valid callback function
 */
function xows_gui_wnd_exit_popu_onvalid()
{
  // Disconnect
  xows_cli_flush();

  // Back nav history
  history.back();
}

/**
 * Disconnect Confirmation message box open
 */
function xows_gui_wnd_exit_popu_open()
{
  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_WRN, "Do you really want to disconnect current session ?",
                     xows_gui_wnd_exit_popu_onvalid, "Yes",
                     xows_gui_wnd_exit_popu_onabort, "No",
                     true);
}

/* -------------------------------------------------------------------
 *
 * Notification Badges
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Notification Badges - Roster Tabs Management
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
function xows_gui_badg_update_tabs(peer, mesg, call, ring)
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
    tab_rost = xows_doc("tab_occu");
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

  // Update ringing animation class
  tab_rost.classList.toggle("RINGING", remain_ring > 0);
}

/* -------------------------------------------------------------------
 * Notification Badges - Unread alerts
 * -------------------------------------------------------------------*/
/**
 * Function to add and/or increase an unread message notification on
 * the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {string}    id        Message Id (not yet used)
 */
function xows_gui_badg_unrd_mesg(peer, id)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_list_find(peer.addr);
  if(!li_peer) return;

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  // Increase the current unread count
  badg_noti.dataset.mesg = parseInt(badg_noti.dataset.mesg) + 1;

  // Update tab button class and animation according new state
  xows_gui_badg_update_tabs(peer, 1, null, null);
}

/**
 * Function to add and toggle ringing call and missed call notification
 * on the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {boolean}   ring      If true set ringing call otherwise set missed call
 */
function xows_gui_badg_unrd_call(peer, ring)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_list_find(peer.addr);
  if(!li_peer) return;

  // Add or remove ringing animation to Contact <li-peer>
  li_peer.classList.toggle("RINGING", ring);

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  const had_ring = (parseInt(badg_noti.dataset.ring) > 0);
  badg_noti.dataset.ring = ring ? 1 : 0;
  badg_noti.dataset.call = ring ? 0 : 1;

  // Update tab button class and animation according new state
  xows_gui_badg_update_tabs(peer, null, ring ? 0 : 1, (ring ? 1 : (had_ring ? -1 : 0)));
}

/**
 * Function to clear any unread message notification on
 * the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 */
function xows_gui_badg_unrd_reset(peer)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_list_find(peer.addr);
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
  xows_gui_badg_update_tabs(peer, mesg, call, ring);
}

/* -------------------------------------------------------------------
 * Notification Badges - In-Call (Buzy) Badge
 * -------------------------------------------------------------------*/
/**
 * Function to show or hide an calling status badge on the displayed
 * roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {boolean}   enable    Enable or disable calling status
 */
function xows_gui_badg_buzy(peer, enable)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_list_find(peer.addr);
  if(!li_peer) return;

  // Inside the <li-peer> search for the <badg-call>
  const badg_call = li_peer.querySelector("BADG-CALL");

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
 *
 * Application Interactions
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function to handle click event on GUI Roster Tabs <li>
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_app_fram_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Widen user roster column (only in narrow-screen)
  xows_gui_layout_rost_view();

  // Check for click on Application menu button
  if(event.target.id === "app_menu") {
    // nothing for now...
  }

  // Check for click on Roster tab button
  if(event.target.tagName === "ROST-TAB") {

    // Select proper roster tab
    const rost_page = xows_gui_app_tab_select(event.target.id);

    // Search any SELECTED peer in the list to switch to
    const li_peer = rost_page.querySelector(".SELECTED");

    // Swicht to selected Peer
    if(li_peer && li_peer.classList.contains("PEER-OCCU")) {
      // Special case for Occupant, they are Private Message session and
      // the Occupant JID is in dataset instead of id
      xows_gui_peer_switch_to(li_peer.dataset.id);
    } else {
      xows_gui_peer_switch_to(li_peer ? li_peer.dataset.id : null);
    }
  }
}

/**
 * Select to specified Application Tab
 *
 * @param   {string}    tab_id    Tab ID to select
 *
 * @return  {element}   Toggled Roster <rost-page> Element
 */
function xows_gui_app_tab_select(tab_id)
{
  let sel_page;

  // Change the SELECTED tab
  const rost_tabs = xows_doc("rost_tabs").querySelectorAll("ROST-TAB");

  for(let i = 0; i < rost_tabs.length; ++i) {

    const sel_tab = (rost_tabs[i].id === tab_id);

    // Add or remove SELECTED class
    xows_doc_cls_tog(rost_tabs[i].id, "SELECTED", sel_tab);

    // Show or hide roster page
    const rost_page = xows_doc(rost_tabs[i].dataset.page);
    rost_page.hidden = !sel_tab;

    // Store selected page as result
    if(sel_tab)
      sel_page = rost_page;
  }

  return sel_page;
}
/* -------------------------------------------------------------------
 *
 * Self Interactions
 *
 * -------------------------------------------------------------------*/
/**
 * User Panel on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_self_fram_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(event.target.id === "self_bt_acct")
    // Open user porfile page
    xows_gui_page_acct_open();

  if(event.target.closest("#self_bttn")) {
    // Open user show/presence level menu
    xows_doc_menu_toggle(xows_doc("self_bttn"), "drop_self",
                         xows_gui_self_menu_onclick,
                         xows_gui_self_menu_onshow);
  }
}

/* -------------------------------------------------------------------
 * Self Interactions - Self Peer Management
 * -------------------------------------------------------------------*/
/**
 * Update the presence menu according current own presence show level
 * and status
 *
 * @param   {object}    self      User Peer object
 */
function xows_gui_self_onpush(self)
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

/* -------------------------------------------------------------------
 * Self Interactions - Self Presence/Profile menu
 * -------------------------------------------------------------------*/
/**
 * User Presence (show) menu on-show (open) callback
 *
 * @param   {object}    button    Drop menu button
 * @param   {object}    drop      Drop menu object
 */
function xows_gui_self_menu_onshow(button, drop)
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
function xows_gui_self_menu_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Close menu and unfocus button
  xows_doc_menu_toggle(xows_doc("self_bttn"), "drop_self");

  if(event.target.id === "self_bt_edit")
    xows_gui_page_user_open();

  if(event.target.closest("#self_mi_stat"))
    xows_gui_self_stat_ibox_open();

  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");
  if(li) {
    // Set presence as selected level
    const show = parseInt(li.value);
    if(show > 0) {
      xows_cli_pres_show_set(show);
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
 * Self Interactions - Self Status Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Self status message input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_self_stat_ibox_onvalid(value)
{
  // If changed, inform of the new status
  if(value != xows_cli_self.stat)
    xows_cli_pres_stat_set(value);
}

/**
 * Self status message input box on-input callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_self_stat_ibox_oninput(value)
{
  // Dummy function to allow to set empty status
}

/**
 * Open self status message input box
 */
function xows_gui_self_stat_ibox_open()
{
  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Edit status message"),
    xows_l10n_get("Indicate anything you want to mention about your current situation."),
    xows_l10n_get("Enter a status message..."),
    xows_cli_self.stat,
    xows_gui_self_stat_ibox_onvalid, null,
    null, null,
    xows_gui_self_stat_ibox_oninput, true);
}

/* -------------------------------------------------------------------
 *
 * Chat Frame Routines
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Chat Frame Interactions - User Click
 * -------------------------------------------------------------------*/
/**
 * Chat Header on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_head_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  switch(event.target.id)
  {
  case "chat_subj":
    // Open Room topic input box
    xows_gui_muc_subj_ibox_open(xows_gui_peer);
    break;
  case "chat_nick":
    // Open Nickname input box
    xows_gui_muc_nick_ibox_open(xows_gui_peer);
    break;
  case "chat_bkmk":
    // Open confirmation dialog
    xows_gui_muc_book_popu_open(xows_gui_peer);
    break;
  case "chat_noti":
    // Set notification for this Peer
    xows_gui_peer.noti = !event.target.classList.toggle("DISABLED");
    // Save parameter in localstorage
    xows_cach_peer_save(xows_gui_peer);
    // Check for browser notification permission
    if(xows_gui_wnd_noti_allowed()) {
      xows_gui_doc_update(xows_gui_peer, XOWS_UPDT_NOTI); //< update notify button
    } else {
      xows_gui_wnd_noti_ask(); //< request permission
    }
    break;
  case "chat_cnfg":
    // Query for Chatoom configuration, will open Room config page
    xows_cli_muc_cfg_get(xows_gui_peer, xows_gui_page_mucc_open);
    break;
  case "chat_mucl":
    xows_gui_layout_muc_toggle();
    break;
  case "chat_addc":
    // Send subscription request
    xows_gui_rost_subs_rqst_pupu(xows_gui_peer.jbar);
    break;
  case "chat_calv":
  case "chat_cala":
    // Initiate call
    xows_gui_call_self_invite(xows_gui_peer, {"audio":true,"video":(event.target.id === "chat_calv")});
    break;
  }
}
/* -------------------------------------------------------------------
 * Chat Frame Interactions - Resize and Input routines
 * -------------------------------------------------------------------*/
/**
 * Risize observer instance for Chat frame
 */
const xows_gui_chat_observer = new ResizeObserver(xows_gui_chat_onresize);

/**
 * Callback function to handle and process chat frame resizing
 *
 * This callback may be called either by Document "resize" event listener
 * or ResizeObserver object.
 *
 * @param   {object}    event   Event object or array of ResizeObserverEntry
 * @param   {object}    observ  Reference to calling ResizeObserver or undefined
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
  xows_gui_doc_scrl_save(xows_gui_peer);

  // If scroll near of top, fetch older history
  if(chat_main.scrollTop < xows_doc("hist_beg").offsetHeight * 0.8) {
    // Query archive for current chat contact
    xows_gui_mam_fetch_older(xows_gui_peer);
  }

  // Update Chat navigation banner according user scroll relative to bottom.
  // If scroll is far enough from bottom, show the "Back to recent" banner
  xows_gui_chat_nav_update(xows_gui_peer, chat_main.scrollBottom, chat_main.clientHeight);
}

/* -------------------------------------------------------------------
 *
 * Chat Navigation Bar
 *
 * -------------------------------------------------------------------*/
/**
 * Handles click on chat navigation banner.
 *
 * @param   {object}    event      Event object
 */
function xows_gui_chat_nav_onclick(event)
{
  // Scroll history down, this will also update navigation bar
  // status (and hide it) since scrolling down imply an update
  xows_gui_doc_scrl_down(xows_gui_peer, true);
}

/**
 * Update chat navigation state and visibility according given
 * scroll position relative to client.
 *
 * @param   {object}    peer        Peer object
 * @param   {number}    scroll      Chat Scroll relative to client bottom
 * @param   {number}    client      Chat client height
 */
function xows_gui_chat_nav_update(peer, scroll, client)
{
  // Get element
  const chat_nav = xows_gui_doc(peer,"chat_nav");

  if(scroll >= 50) {

    // If scroll is greater than client height we set the "Old-Message" status
    // which is not formely an alert.
    if(scroll > client)
      chat_nav.classList.add("OLDMSG");

    // Scroll is pretty far from chat history bottom, if any alter is
    // present we show the navigation bar

    if(chat_nav.hidden && chat_nav.classList.length) {
      // Add event listener
      if(peer === xows_gui_peer)
        xows_doc_listener_add(chat_nav, "click", xows_gui_chat_nav_onclick);
      chat_nav.hidden = false;
    }

  } else {

    // Scroll is near bottom of chat history, we reset common alerts
    // and hide navigation bar

    if(!chat_nav.hidden) {
      // Remove event listener
      if(peer === xows_gui_peer)
        xows_doc_listener_rem(chat_nav, "click", xows_gui_chat_nav_onclick);
      chat_nav.hidden = true;
    }

    // Unset "Old-Message" status, since user is new reading last messages
    chat_nav.classList.remove("OLDMSG");

    // Reset UNREAD alert, we assume user actualy read the new message
    chat_nav.classList.remove("UNREAD");
  }
}

/**
 * Adds alert status to navigation bar.
 *
 * Depending current scroll position, the navigation bar may be not shown
 * and UNREAD alert may be completely ignored.
 *
 * @param   {object}    peer        Peer object
 * @param   {string}    alert       Alert to apply (RINGING or UNREAD)
 */
function xows_gui_chat_nav_alert(peer, alert)
{
  // Get element
  const chat_nav = xows_gui_doc(peer,"chat_nav");

  const scroll = xows_gui_doc_scrl_get(peer);

  // If scroll is already almost at bottom we ignore the "UNREAD" alert
  if(scroll < 50 && alert === "UNREAD")
    return;

  // Add class
  chat_nav.classList.add(alert);

  // Update status according scroll
  xows_gui_chat_nav_update(peer, scroll, scroll);
}

/**
 * Removes alert status from the navigation bar.
 *
 * @param   {object}    peer        Peer object
 * @param   {string}    alert       Alert to reset (RINGING or UNREAD)
 */
function xows_gui_chat_nav_reset(peer, alert)
{
  // Get element
  const chat_nav = xows_gui_doc(peer,"chat_nav");

  // Add class
  chat_nav.classList.remove(alert);

  // Update status according scroll
  const scroll = xows_gui_doc_scrl_get(peer);
  xows_gui_chat_nav_update(peer, scroll, scroll);
}

/* -------------------------------------------------------------------
 *
 * Upload Interactions
 *
 * -------------------------------------------------------------------*/
const xows_gui_upld_stk = new Map();

/**
 * Handle click or File Upload dialog
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_upld_onclick(event)
{
  if(event.target.id === "upld_exit")
    xows_gui_upld_close(xows_gui_peer);
}

/**
 * Closes File Upload progression dialog, if an upload is currently
 * processing, it is aborted.
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_upld_close(peer)
{
  // Abort processing upload
  if(xows_cli_upld_has(peer))
    xows_cli_upld_abort(peer);


  const hist_upld = xows_gui_doc(peer,"hist_upld");

  // Remove exit button event listener
  xows_doc_listener_rem(hist_upld, "click", xows_gui_upld_onclick);

  // Hide the upload dialog
  hist_upld.hidden = true;
}

/**
 * File Upload Frame open
 *
 * @param   {object}    peer      Peer object
 * @param   {object}    file      File object to upload
 */
function xows_gui_upld_start(peer, file)
{
  const upld_text = xows_gui_doc(peer,"upld_text");

  // Reset elements to initial state
  upld_text.classList = "";
  xows_gui_doc(peer,"upld_pbar").style.width = "0%";

  // Set uploading file name
  upld_text.innerText = file.name;

  const hist_upld = xows_gui_doc(peer,"hist_upld");

  // Add event listener for exit button
  xows_doc_listener_add(hist_upld, "click", xows_gui_upld_onclick);

  // Show the upload dialog
  hist_upld.hidden = false;

  // Force scroll down
  if(peer === xows_gui_peer)
    xows_gui_doc_scrl_down(peer, false);

  // Send upload query
  xows_cli_upld_query(peer, file);
}

/**
 * Handles File Upload download progress
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    percent   Data upload progression in percent
 */
function xows_gui_upld_onporg(peer, percent)
{
  // Update progress bar
  xows_gui_doc(peer,"upld_pbar").style.width = percent + "%";
}

/**
 * Handles File Upload download finished (either success, error or abort)
 *
 * @param   {object}    peer      Peer object
 * @param   {number}    stat      Upload status code (sucess, error, etc.)
 * @param   {string}    data      Uploaded file URL or error message
 */
function xows_gui_upld_onload(peer, stat, data)
{
  switch(stat)
  {
  case XOWS_UPLD_ERIQ:
  case XOWS_UPLD_ERHT: {
      // Set upload dialog error message
      const upld_text = xows_gui_doc(peer,"upld_text");
      upld_text.className = "STYL-ERR";
      let text;
      if(stat === XOWS_UPLD_ERIQ) {
        text = "Upload denied";
      } else {
        text = "Upload failed";
      }
      upld_text.innerHTML ="<b>"+xows_l10n_get(text)+"</b> : "+data;
    } return; //< do not close dialog

  case XOWS_UPLD_SUCC:
    // Send a message to current selected contact with URL to download
    xows_cli_msg_send(peer, data);
    break;

  default: //< XOWS_UPLD_ABRT
    xows_log(1,"gui_upld_onload","upload aborted");
    // Do nothing
    break;
  }

  // Close upload dialog
  xows_gui_upld_close(peer);
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
  // Enable or disable connect button
  xows_doc("auth_cnct").disabled = !(xows_doc("auth_user").value.length &&
                                     xows_doc("auth_pass").value.length);
}

/**
 * User Login page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_auth_oncreds(target)
{
  // Enable or disable connect button
  xows_doc("auth_cnct").disabled = !(xows_doc("auth_user").value.length &&
                                     xows_doc("auth_pass").value.length);
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

      const user = xows_doc("auth_user").value.toLowerCase();
      const pass = xows_doc("auth_pass").value;
      const cred = xows_doc("auth_cred").checked;

      // erase password from intput
      xows_doc("auth_pass").value = "";

      // Try connect and login
      xows_gui_connect(user, pass, cred, false);
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
  xows_doc("auth_user").value = xows_gui_auth ? xows_gui_auth.user : "";
  xows_doc("auth_pass").value = xows_gui_auth ? xows_gui_auth.pass : "";

  // Enable or disable connect button
  xows_doc("auth_cnct").disabled = !(xows_doc("auth_user").value.length &&
                                     xows_doc("auth_pass").value.length);

  // Open dialog page
  xows_doc_page_open("page_auth", false, null,
                     xows_gui_page_auth_oninput,
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

      const user = xows_doc("regi_user").value.toLowerCase();
      const pass = xows_doc("regi_pass").value;

      // erase password from intput
      //xows_doc("regi_pass").value = "";

      // Try register
      xows_gui_connect(user, pass, false, true);
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
function xows_gui_page_user_onabort()
{
  // Reset inputs values
  xows_doc("user_name").value = xows_cli_self.name;

  let data;

  // Get temp or cached avatar
  if(xows_cli_self.avat) {
    data = xows_cach_avat_get(xows_cli_self.avat);
    xows_doc("user_avat").data = data; //< ad-hoc property
  } else {
    data = xows_cach_avat_temp_data(xows_cli_self.addr, null); // Generate temporary avatar
    xows_doc("user_avat").data = null; //< ad-hoc property
  }

  xows_doc("user_avat").style.backgroundImage = "url(\""+data+"\")";

  xows_doc("user_accs").checked = true;
}

/**
 * User Profile page on-valid callback function
 */
function xows_gui_page_user_onvalid()
{
  // Update user profile
  xows_cli_self_edit(xows_doc("user_name").value,
                     xows_doc("user_avat").data,
                     xows_doc("user_accs").checked?"open":"presence");
}

/**
 * User Profile page on-input event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_user_oninput(target)
{
  let changed;

  switch(target.id)
  {
  case "user_accs": //< Checkbox for Data in open access
    changed = !xows_doc("user_accs").checked; break;
  case "user_name": //< Nickname input text field
    changed = (xows_doc("user_name").value != xows_cli_self.name);
  }

  // Open Message Box dialog
  if(changed) xows_doc_popu_open_for_save(xows_gui_page_user_onvalid,
                                          xows_gui_page_user_onabort);
}

/**
 * User Profile page on-click event callback function
 *
 * @param   {object}    target    Target object of the triggered Event
 */
function xows_gui_page_user_onclick(target)
{
  if(target.id === "user_bt_avch") { //< Change avatar

    // Emulate click on file input
    xows_doc("user_file").click();

    return;
  }

  if(target.id === "user_bt_avrm") { //< Remove avatar

    const user_avat = xows_doc("user_avat");

    // set null avatar data
    user_avat.data = null;

    // Generate default temp avatar
    const data = xows_cach_avat_temp_data(xows_cli_self.addr, null); // Generate temporary avatar
    user_avat.style.backgroundImage = "url(\""+data+"\")";

    // Open Message box dialog
    xows_doc_popu_open_for_save(xows_gui_page_user_onvalid,
                                xows_gui_page_user_onabort);
  }
}

/**
 * User Profile page callback avatar file change event
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_page_user_ev_file(event)
{
  const user_file = xows_doc("user_file");

  if(user_file.files[0]) {
    // Create file reader to read image data
    const reader = new FileReader();
    reader.onload = function(e) {
      // Once data loaded, create new Image object
      const image = new Image();
      // Define onload function to handle loaded data
      image.onload = function(e) {
        // Set avatar data on background
        const url = xows_gen_avatar(XOWS_AVAT_SIZE, this, null);
        const user_avat = xows_doc("user_avat");
        user_avat.data = url;
        user_avat.style.backgroundImage = "url(\""+url+"\")";
        // Open Message Box dialog
        xows_doc_popu_open_for_save(xows_gui_page_user_onvalid,
                                    xows_gui_page_user_onabort);
      };
      // Start image loading (should be quick)
      image.src = e.target.result;
    };
    // Launch file reading
    reader.readAsDataURL(user_file.files[0]);
  }
}

/**
 * User Profile page on-close callback function
 */
function xows_gui_page_user_onclose()
{
  // remove "change" event listener to file input
  xows_doc_listener_rem(xows_doc("user_file"),"change",xows_gui_page_user_ev_file);
}

/**
 * User Profile page open
 */
function xows_gui_page_user_open()
{
  // Initialize inputs values
  xows_gui_page_user_onabort();

  // Set account address in page header frame
  xows_doc("user_addr").innerText = xows_cli_self.addr;

  // Open dialog page
  xows_doc_page_open("page_user", true, xows_gui_page_user_onclose,
                                        xows_gui_page_user_oninput,
                                        xows_gui_page_user_onclick);

  // add "change" event listener to file input
  xows_doc_listener_add(xows_doc("user_file"),"change",xows_gui_page_user_ev_file);
}


/* -------------------------------------------------------------------
 * Page Screen - Account options Page
 * -------------------------------------------------------------------*/
/**
 * Account options page on-abort callback function
 */
function xows_gui_page_acct_onabort() {}

/**
 * Account options page on-valid callback function
 */
function xows_gui_page_acct_onvalid() {}

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
    xows_cli_regi_chpas(acct_pnew.value, xows_gui_page_acct_onchpas);
  }

  if(target.id === "acct_bt_unrg") {
    // Open confirmation message box
    xows_gui_acct_unrg_mbox_open();
  }
}

/**
 * Account options page on-close callback function
 */
function xows_gui_page_acct_onclose() {}

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
 *
 * Popup Dialog-Box
 *
 * -------------------------------------------------------------------*/
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
function xows_gui_acct_unrg_mbox_onabort()
{

}

/**
 * Account deletion message box on-valid callback function
 */
function xows_gui_acct_unrg_mbox_onvalid()
{
  xows_cli_regi_remove(null, null);
}

/**
 * Account deletion message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    affi      Affiliation value to set
 */
function xows_gui_acct_unrg_mbox_open()
{
  // Open Message Dialog-Box
  xows_doc_mbox_open(XOWS_STYL_ASK, "Account deletion",
                     "Are you sure you want to delete your XMPP/Jabber account on this server ? This action cannot be reversed.",
                     xows_gui_acct_unrg_mbox_onvalid, "Yes, farewell",
                     xows_gui_acct_unrg_mbox_onabort, "God damn, NO !");
}
