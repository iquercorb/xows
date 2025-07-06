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
 * Maximum count of message the history can contain
 */
let xows_gui_hist_size = 128; //< size of the history 'window'

/**
 * Count of messages to gather for each history pull request
 */
let xows_gui_hist_page = 64;

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
    xows_gui_chat_head_update(xows_gui_peer);
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
 * Object that stores saved scroll values
 */
const xows_gui_peer_scroll_db = new Map();

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
    return xows_doc_frag_find(peer.addr,id);
  }
}

/**
 * Clear and reload the most recent peer chat history
 *
 * @param   {object}    peer      Peer object to reset history
 */
function xows_gui_peer_hist_reload(peer)
{
  const obj = (peer !== xows_gui_peer) ?  xows_gui_peer_scroll_db.get(peer.addr) :
                                          xows_doc("chat_main");
  // Reset scroll
  obj.scrollTop = (obj.scrollHeight - obj.clientHeight);
  obj.scrollSaved = 0;

  // Reset the chat history to initial stat
  xows_gui_peer_doc(peer, "hist_beg").className = "";
  xows_gui_peer_doc(peer, "hist_ul").innerText = "";
  xows_gui_peer_doc(peer, "hist_end").hidden = true;

  // Query for the last archives, with no delay
  xows_gui_mam_query(peer, false, xows_gui_hist_page, 0);
}

/**
 * Save the main chat scroll and client values for the specified peer
 *
 * @param   {object}    peer      Peer object to save scroll value
 */
function xows_gui_peer_scroll_save(peer)
{
  const obj = (peer !== xows_gui_peer) ?  xows_gui_peer_scroll_db.get(peer.addr) :
                                          xows_doc("chat_main");

  // The usefull scroll parameter that doesn't exist as built-in...
  obj.scrollSaved = obj.scrollHeight - (obj.scrollTop + obj.clientHeight);
}

/**
 * Get the main chat last saved scroll position (relative to bottom)
 * corresponding to the specified peer
 *
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_peer_scroll_get(peer)
{
  return (peer !== xows_gui_peer) ?
          xows_gui_peer_scroll_db.get(peer.addr).scrollSaved :
          xows_doc("chat_main").scrollSaved;
}

/**
 * Move to bottom the main chat scroll corresponding to the
 * specified peer
 *
 * If the specified Peer history is offscree, the function
 * operate on the saved scroll parameters.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_peer_scroll_down(peer)
{
  if(xows_gui_peer_doc(peer, "hist_end").hidden) {

    const obj = (peer !== xows_gui_peer) ?  xows_gui_peer_scroll_db.get(peer.addr) :
                                            xows_doc("chat_main");

    obj.scrollTop = (obj.scrollHeight - obj.clientHeight);
    obj.scrollSaved = 0;
  } else {
    // If the most recent message is beyond the current history "window"
    // we must reset history and query last archived messages
    xows_gui_peer_hist_reload(peer);
  }
}

/**
 * Compensate (to keept at position) the main chat scroll corresponding
 * to the specified peer.
 *
 * If the specified Peer history is offscree, the function
 * operate on the saved scroll parameters.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_peer_scroll_adjust(peer)
{
  const obj = (peer !== xows_gui_peer) ?  xows_gui_peer_scroll_db.get(peer.addr) :
                                          xows_doc("chat_main");

  obj.scrollTop = obj.scrollHeight - (obj.clientHeight + (obj.scrollSaved || 0));
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
  
  // clone elements from initial offscreen slot
  xows_doc_frag_clone(peer.addr, XOWS_GUI_FRAG_INIT, "chat_head");
  xows_doc_frag_clone(peer.addr, XOWS_GUI_FRAG_INIT, "chat_hist");
  xows_doc_frag_clone(peer.addr, XOWS_GUI_FRAG_INIT, "chat_panl");
  if(peer.type === XOWS_PEER_ROOM) {  //< XOWS_PEER_ROOM
    xows_doc_frag_clone(peer.addr, XOWS_GUI_FRAG_INIT, "room_head");
    xows_doc_frag_clone(peer.addr, XOWS_GUI_FRAG_INIT, "occu_list");
  }

  // Signal first open by hidding chat history
  xows_gui_peer_doc(peer, "hist_ul").hidden = true;

   // set chat title bar informations
  xows_gui_peer_doc(peer, "chat_titl").innerText = peer.name;

  const meta_inpt = xows_gui_peer_doc(peer, "meta_inpt");

  if(peer.type === XOWS_PEER_ROOM) {  //< XOWS_PEER_ROOM
    meta_inpt.innerText = peer.subj ? peer.subj : "";
    meta_inpt.className = peer.subj ? "" : "PLACEHOLD";
    // Cannot bookmark public rooms or already bookmarked
    xows_gui_peer_doc(peer, "chat_bt_bkmk").hidden = (peer.book || peer.publ);
    xows_gui_peer_doc(peer, "chat_bt_subj").hidden = (peer.role < XOWS_ROLE_MODO) && (peer.affi < XOWS_AFFI_ADMN);
    xows_gui_peer_doc(peer, "chat_bt_cnfg").hidden = (peer.affi < XOWS_AFFI_OWNR);
  } else {     
    meta_inpt.innerText = peer.stat ? peer.stat : "";
    xows_gui_peer_doc(peer, "chat_show").dataset.show = peer.show;
    xows_gui_peer_doc(peer, "chat_addr").innerText = "("+peer.addr+")";
    if(peer.type === XOWS_PEER_OCCU) {
      let can_subs;
      if(peer.bare) {
        const cont = xows_cli_cont_get(peer.bare);
        can_subs = cont ? (cont.subs < XOWS_SUBS_TO) : true;
      }
      xows_gui_peer_doc(peer, "chat_bt_addc").hidden = !can_subs;
    }
  }

  // Set chat input placeholder
  const placeholder = xows_l10n_get("Send a message to")+" "+peer.name+" ...";
  xows_gui_peer_doc(peer, "chat_inpt").setAttribute("placeholder",placeholder);

  // Initialize scroll parameters
  xows_gui_peer_scroll_db.set(peer.addr,{scrollTop:0,scrollHeight:0,clientHeight:0,scrollSaved:0});

  // set notification button
  xows_gui_chat_noti_update(peer);
}

/**
 * Move and store current document Peer elements to offscreen
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_peer_doc_export(peer)
{
  // Save chat history scroll parameters
  const chat_main = xows_doc("chat_main");
  xows_gui_peer_scroll_db.set(peer.addr, {scrollTop:chat_main.scrollTop,
                                          scrollHeight:chat_main.scrollHeight,
                                          clientHeight:chat_main.clientHeight,
                                          scrollSaved:chat_main.scrollSaved || 0});

  // export document elements to offscreen fragment
  xows_doc_frag_export(peer.addr, "chat_head");
  xows_doc_frag_export(peer.addr, "chat_hist");
  xows_doc_frag_export(peer.addr, "chat_panl");
  if(peer.type === XOWS_PEER_ROOM) {
    xows_doc_frag_export(peer.addr, "room_head");
    xows_doc_frag_export(peer.addr, "occu_list");
  }
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
    xows_doc_frag_import(peer.addr, "chat_head");
    xows_doc_frag_import(peer.addr, "chat_hist");
    xows_doc_frag_import(peer.addr, "chat_panl");
    if(peer.type === XOWS_PEER_ROOM) {
      xows_doc_frag_import(peer.addr, "room_head");
      xows_doc_frag_import(peer.addr, "occu_list");
    }

    // Enable or disable Multimedia Call buttons
    const in_call = (xows_wrtc_busy());
    xows_gui_peer_doc(peer, "chat_bt_cala").disabled = in_call;
    xows_gui_peer_doc(peer, "chat_bt_calv").disabled = in_call;

    // Restore chat history with compensation in case of frame resize
    const chat_main = xows_doc("chat_main");
    chat_main.scrollTop = chat_main.scrollHeight - (chat_main.clientHeight + xows_gui_peer_scroll_db.get(peer.addr).scrollSaved);

  } else {
    // restore (clone) from initial (empty) document elements
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_head", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_hist", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_panl", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "room_head", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "occu_list", true);
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
  // Create intial offscreen slot from current document
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "chat_head", true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "chat_hist", true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "chat_panl", true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "room_head", true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "occu_list", true);

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

  // Store MAM parameters from options
  xows_gui_hist_size = xows_options.history_size;
  xows_gui_hist_page = xows_gui_hist_size / 2;
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
  xows_cli_set_callback("selfchange", xows_gui_cli_onselfchange);
  xows_cli_set_callback("contpush", xows_gui_cli_oncontpush);
  xows_cli_set_callback("contrem", xows_gui_cli_oncontrem);
  xows_cli_set_callback("subspush", xows_gui_cli_onsubspush);
  xows_cli_set_callback("subsrem", xows_gui_cli_onsubsrem);
  xows_cli_set_callback("roompush", xows_gui_cli_onroompush);
  xows_cli_set_callback("roomrem", xows_gui_cli_onroomrem);
  xows_cli_set_callback("roomjoin", xows_gui_cli_onroomjoin);
  xows_cli_set_callback("occupush", xows_gui_cli_onoccupush);
  xows_cli_set_callback("occurem", xows_gui_cli_onoccurem);
  xows_cli_set_callback("privpush", xows_gui_cli_onprivpush);
  xows_cli_set_callback("privrem", xows_gui_cli_onprivrem);
  xows_cli_set_callback("message", xows_gui_cli_onmessage);
  xows_cli_set_callback("chatstate", xows_gui_cli_onchatstate);
  xows_cli_set_callback("receipt", xows_gui_cli_onreceipt);
  xows_cli_set_callback("retract", xows_gui_cli_onretract);
  xows_cli_set_callback("subject", xows_gui_cli_onsubject);
  xows_cli_set_callback("error", xows_gui_cli_onerror);
  xows_cli_set_callback("close", xows_gui_cli_onclose);
  xows_cli_set_callback("timeout", xows_gui_cli_ontimeout);
  xows_cli_set_callback("callerror", xows_gui_cli_oncallerror);
  xows_cli_set_callback("callinit", xows_gui_cli_oncallinit);
  xows_cli_set_callback("callaccept", xows_gui_cli_oncallaccept);
  xows_cli_set_callback("callend", xows_gui_cli_oncallend);

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
      xows_log(2,"gui_loggedin","Saving credential");

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

  // Open main 'screen'
  xows_gui_main_open();

  // widen roster panel (only in narrow-screen)
  xows_gui_rost_widen();

  // Check whether we recover from connexion loss
  if(xows_gui_connect_loss) {

    // Reset connection loss
    xows_gui_connect_loss = false;

    // Query to force fetching last messages with no delay for all opened chat history
    let i = xows_cli_cont.length;
    while(i--) xows_gui_mam_query(xows_cli_cont[i], true, xows_gui_hist_page, 0, true);

    i = xows_cli_room.length;
    while(i--) xows_gui_mam_query(xows_cli_room[i], true, xows_gui_hist_page, 0, true);

  } else {

    // Push history to allow message box if user click Back
    window.history.pushState({},"",window.location.pathname);

    // Reset the Roster and Chat window
    xows_gui_peer = null;

    // Check whether file Upload is available
    const upld = xows_cli_services.has(XOWS_NS_HTTPUPLOAD);
    xows_doc("edit_bt_upld").disabled = !upld;
    // Add embeded download matching http upload service domain
    if(upld) xows_tpl_embed_add_upld(xows_cli_services.get(XOWS_NS_HTTPUPLOAD)[0]);

    // Check whether MUC service is available
    const muc = xows_cli_services.has(XOWS_NS_MUC);
    xows_doc("tab_room").disabled = !muc;
  }
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
  xows_gui_call_terminate();

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
  xows_log(2,"gui_cli_onclose","connexion cloded","("+code+") "+text);

  // Check whether this is a connexion loss
  if(code == XOWS_SIG_HUP) {

    // This is a connection loss
    xows_gui_connect_loss = true;

    // Close message box
    xows_doc_popu_close();

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
  xows_doc_page_close(true);
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

  // Create intial offscreen slot from current document
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_head",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_hist",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_panl",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"room_head",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"occu_list",true);

  // The DOM is now to its default state
  xows_gui_clean = true;
}

/* -------------------------------------------------------------------
 *
 * Main Screen
 *
 * -------------------------------------------------------------------*/

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
    xows_gui_upld_onclose();
  }

  // Get the next (to be selected) contact
  const next = addr ? xows_cli_peer_get(addr, XOWS_PEER_ANY) : null;

  if(prev) {
    // export document elements to offscreen fragment
    xows_gui_peer_doc_export(prev);
    // Remove "selected" class from <li> element
    if(next && (next.type === prev.type)) 
      xows_gui_rost_peer_select(prev, false);
  }

  const chat_fram = xows_doc("chat_fram");

  // If next contact is valid, show the chat <div>
  chat_fram.hidden = (next === null);

  // Open or close Multimedia Call layout
  chat_fram.classList.toggle("CALL-OPEN", xows_gui_call_remote.has(next));

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

    // Open or close right panel
    xows_doc_cls_tog("main_colr","COL-HIDE",!is_room);

    // Hidden history mean first open, need to pull some history
    if(xows_doc_hidden("hist_ul")) {
      xows_doc_show("hist_ul");
      xows_gui_peer_scroll_adjust(next);
      // For Private Conversation we bypass MAM query since it does not
      // work very well in this context (at least with Prosody server)
      if(next.type === XOWS_PEER_OCCU) {
        xows_doc_cls_add("hist_beg","HIST-START");
      } else {
        xows_gui_mam_query(next, false, xows_gui_hist_page, 0);
      }
    }

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
      xows_doc_cls_add("main_colr", "COL-HIDE");
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
  // Check for opened dialog
  if(!xows_doc_hidden("scr_page")) {

    // Close any opened page
    xows_doc_page_close(true);
    // hide page 'screen'
    xows_doc_hide("scr_page");

    // Close any opened menu
    xows_doc_menu_close();
    // Close any opened media view
    xows_doc_view_close();

    // show main 'screen'
    xows_doc_show("scr_main");
  }

  // close panel if any
  xows_gui_panel_close();

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
function xows_gui_rost_tabs_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  const btn = event.target.closest("ROST-TAB");
  if(btn) xows_gui_rost_switch(btn.id);
}

/**
 * Select to specified Application Tab
 *
 * @param   {string}    tab_id    Tab ID to select
 * 
 * @return  {element}   Selected Roster <rost-page> Element
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
 * Main Screen widen Roster (right) panel
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

  if(event.target.tagName === "BUTTON") {

    switch(event.target.name)
    {
    case "cont_bt_rtry": //< Retry request subscribe permission
      xows_cli_subscribe_request(li_peer.id);
      xows_doc_popu_open(XOWS_STYL_SCS,"New authorization request was sent");
      return;
    case "cont_bt_unsb": //< Remove (Unsubscribe) contact
      xows_gui_pupu_subs_edit_open(li_peer.id, null);
      return;
    }
  }

  switch(li_peer.className)
  {
  case "PEER-PEND": 
    // Open Subscription Allow/Deny dialog
    xows_gui_popu_subs_auth_open(li_peer.id, li_peer.name);
    return;
  case "PEER-ROOM": 
    // Special handling for Room join
    xows_gui_switch_room(li_peer.id);
    return;
  case "PEER-OCCU":
    // Special handling for Private Message
    xows_gui_switch_peer(li_peer.dataset.id);
    break;
  default: // PEER-CONT
    // Select peer
    xows_gui_switch_peer(li_peer.id);
    break;
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
  // Compose display name from JID
  const userid = value.split("@")[0];
  const name = userid[0].toUpperCase() + userid.slice(1);

  // Request for roster add contact
  xows_cli_rost_edit(value, name);
}

/**
 * Open Add Contact Input Dialog-Box
 */
function xows_gui_ibox_subs_open()
{
  // Open the input box dialog
  xows_doc_ibox_open("Add a contact",
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
const xows_gui_pupu_subs_edit = {addr:"",name:""};

/**
 * Contact (subscription) Add/Remove message box on-abort callback function
 */
function xows_gui_pupu_subs_edit_onabort()
{
  xows_gui_pupu_subs_edit.addr = null;
  xows_gui_pupu_subs_edit.name = null;
}

/**
 * Contact (subscription) Add/Remove message box on-valid callback function
 */
function xows_gui_pupu_subs_edit_onvalid()
{
  const param = xows_gui_pupu_subs_edit;
  
  // query contact add/remove
  xows_cli_rost_edit(param.addr, param.name);

  param.addr = null;
  param.name = null;
}

/**
 * Contact (subscription) Add/Remove message box open
 *
 * @param   {string}    addr      Supplied JID address to add or remove
 * @param   {string}    name      Contact default name in case of contact add
 */
function xows_gui_pupu_subs_edit_open(addr, name)
{
  // Store JID of contact to add or remove
  xows_gui_pupu_subs_edit.addr = addr;

  let text, style;

  // If name is defined, this mean this is for Contact add
  if(name) {
    xows_gui_pupu_subs_edit.name = name;
    style = XOWS_STYL_ASK;
    text = "Add contact and request authorisation ?";
  } else {
    style = XOWS_STYL_WRN;
    text = "Remove contact and revoke authorization ?";
  }

  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(style, text,
                     xows_gui_pupu_subs_edit_onvalid, "OK",
                     xows_gui_pupu_subs_edit_onabort, "Cancel",
                     true);
}

/* -------------------------------------------------------------------
 * Main screen - Roster Head - Contacts - Subscription Allow/Deny Popup-Box
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_popu_subs_auth = {addr:"",name:""};

/**
 * Contact Subscription Allow/Deny message box on-abort callback function
 */
function xows_gui_popu_subs_auth_onabort()
{
  // deny contact subscribe
  xows_cli_subscribe_allow(xows_gui_popu_subs_auth.addr, false);
  xows_gui_popu_subs_auth.addr = null;
  xows_gui_popu_subs_auth.name = null;
}

/**
 * Contact Subscription Allow/Deny message box on-valid callback function
 */
function xows_gui_popu_subs_auth_onvalid()
{
  // allow contact subscribe
  xows_cli_subscribe_allow(xows_gui_popu_subs_auth.addr,true,xows_gui_popu_subs_auth.name);
  xows_gui_popu_subs_auth.addr = null;
  xows_gui_popu_subs_auth.name = null;
}

/**
 * Contact Subscription Allow/Deny message box open
 *
 * @param   {string}    addr      Supplied JID address to allow or deny
 * @param   {string}    name      Contact default name in case of contact allow
 */
function xows_gui_popu_subs_auth_open(addr, name)
{
  // Store JID and name of contact to allow/deny
  xows_gui_popu_subs_auth.addr = addr;
  xows_gui_popu_subs_auth.name = name;

  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_ASK, "Allow contact subscription ?",
                     xows_gui_popu_subs_auth_onvalid, "Allow",
                     xows_gui_popu_subs_auth_onabort, "Deny",
                     true);
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
  
  // Switch peer to newly joined room
  xows_gui_switch_peer(room.addr);
  
  // Close panel in case we are in narrow-screen with wide panel
  xows_gui_panel_close();
  
  // Code 201 mean initial room config
  if(code.includes(201)) 
    xows_gui_mbox_conf_open(room);

  // Update privileges related GUI elements
  xows_gui_room_head_update(room);
  xows_gui_chat_head_update(room);
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
  xows_doc_mbox_open(XOWS_STYL_ERR, head, text, null, null, null, null, true);
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
  
  // Update Room's self nickname
  room.nick = value;
  
  // Try register again
  xows_cli_muc_regi_query(room, xows_gui_ibox_join_regi_onresult);
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
    // Special case for Occupant, the Occupant JID is in dataset
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

  // Update ringing animation class
  tab_rost.classList.toggle("RINGING", remain_ring > 0);

  // Show or hide notification spot
  let has_notif = (remain_mesg > 0 || remain_call > 0 || remain_ring > 0);
  badg_noti.hidden = !has_notif;
}

/**
 * Function to add and/or increase an unread message notification on
 * the displayed roster contact DOM element
 *
 * @param   {object}    peer      Peer object, either Room or Contact
 * @param   {string}    id        Message Id (not yet used)
 */
function xows_gui_unread_add(peer, id)
{
  // Get the corresponding peer <li-peer> (room or contact) in roster
  const li_peer = xows_gui_rost_li_get(peer);
  if(!li_peer) return;

  // Inside the <li-peer> search for the <badg-noti>
  const badg_noti = li_peer.querySelector("BADG-NOTI");

  // Increase the current unread count
  badg_noti.dataset.mesg = parseInt(badg_noti.dataset.mesg) + 1;
  //badg_noti.hidden = false; //< show

  // Update tab button class and animation according new state
  xows_gui_unread_tab_update(peer, 1);
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

  //const had_ring = badg_noti.classList.contains("RINGING");
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
  const mesg = - parseInt(badg_noti.dataset.mesg);
  const ring = - parseInt(badg_noti.dataset.ring);
  const call = - parseInt(badg_noti.dataset.call);

  // Reset the unread spot <div> properties
  badg_noti.dataset.mesg = 0;
  badg_noti.dataset.ring = 0;
  badg_noti.dataset.call = 0;

  badg_noti.hidden = true; //< hide

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
  // show and hide proper <ul> as required
  const cont_pend = xows_doc("cont_pend");
  cont_pend.hidden = (cont_pend.querySelector("LI-PEER") === null);
    
  // Update the notification badge
  xows_doc("cont_noti").dataset.subs = cont_pend.childElementCount;
  
  const cont_budy = xows_doc("cont_budy");
  cont_budy.hidden = (cont_budy.querySelector("LI-PEER") === null);

  // Show Contact <ul> if required
  cont_budy.classList.remove("LOADING"); //< Remove the potential loading spinner
}

/**
 * Function to add or update item of the roster contact list
 *
 * @param   {object}    cont      Contact object to add or update
 */
function xows_gui_cli_oncontpush(cont)
{
  // Null contact mean empty contact list
  if(cont === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_list", "LOADING");
    return;
  }

  // Search for existing contact <li-peer> element
  let li_peer = document.getElementById(cont.addr);
  if(li_peer) {
    // Check whether this is a subscribing contact
    if(li_peer.classList.contains("PEER-PEND")) {
      // Remove the subscribe <li-peer> element
      xows_doc("cont_pend").removeChild(li_peer);
      // Force creation of a new <li-peer> element
      li_peer = null;
    } else {
      // Update the existing contact <li-peer> element according template
      xows_tpl_update_rost_cont(li_peer, cont);
      // Update chat title bar
      xows_gui_chat_head_update(cont);
      // Update message history
      xows_gui_hist_update(cont, cont);
      // If contact goes offline, ensure chatstat resets
      if(cont.show < 1) xows_gui_cli_onchatstate(cont, 0);
    }
  }

  const dst_ul = (cont.subs < XOWS_SUBS_BOTH) ? xows_doc("cont_pend") : 
                                                xows_doc("cont_budy");

  if(!li_peer) {
    // Create new <li-peer> element from template
    li_peer = xows_tpl_spawn_rost_cont(cont);
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(cont);

  }
  
  // Append new instance of contact <li_peer> from template to roster <ul>
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
  const cont_budy = xows_doc("cont_budy");

  // Remove <li_peer> element
  const li_peer = document.getElementById(cont.addr);
  if(li_peer && li_peer.parentNode === cont_budy) {

    // switch peer if required
    if(xows_gui_peer && xows_gui_peer === cont)
      xows_gui_switch_peer(null);

    // delete <li_peer> element
    cont_budy.removeChild(li_peer);
    
    // Hide Authorized Contacts <ul> if required
    cont_budy.hidden = !cont_budy.childElementCount;
  }
  
  // Remove Contact in client
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
 * @param   {string}    bare      Subscription request sender bare JID
 * @param   {string}   [nick]     Prefered nickname (if available)
 */
function xows_gui_cli_onsubspush(bare, nick)
{
  // Ensure subscribe <li_peer> does not already exists
  if(document.getElementById(bare))
    return;

  const cont_pend = xows_doc("cont_pend");

  // Create a new subcription <li_peer> element from template
  cont_pend.appendChild(xows_tpl_spawn_rost_subs(bare, nick));

  // Get count of pending authorization (<ul> children minus title)
  const pendning_count = cont_pend.childElementCount;

  // Show the subscribes <ul>
  cont_pend.hidden = !pendning_count;

  // Update or disable the notification badge
  xows_doc("cont_noti").dataset.subs = pendning_count;
}

/**
 * Cleanup subscription request from roster
 *
 * This function remove a Subscription request element from the
 * roster.
 *
 * @param   {string}    bare      Subscription request bare JID
 */
function xows_gui_cli_onsubsrem(bare)
{
  const cont_pend = xows_doc("cont_pend");

  // Search and remove <li_peer> element
  const li_peer = document.getElementById(bare);
  if(li_peer && li_peer.parentNode === cont_pend) {

    // delete <li_peer> element
    cont_pend.removeChild(li_peer);

    // Get count of pending authorization (<ul> children minus title)
    const pendning_count = cont_pend.childElementCount;

    // Show or hide list depending content
    cont_pend.hidden = !pendning_count;

    // Update or disable the notification badge
    xows_doc("cont_noti").dataset.subs = pendning_count;
  }
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
    xows_gui_chat_head_update(room);
  } else {
    // Append new instance of room <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_rost_room(room);
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(room);
  }
  
  // Parent to proper <ul>
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
    const src_ul = li_peer.parentNode;
    src_ul.removeChild(li_peer);
    
    // Show or hide source <ul> depending content
    src_ul.hidden = (src_ul.childNodes.length < 2);
  }
  
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
  if(occu.bare) {
    if(xows_cli_cont_get(occu.bare)) {
      // Switch to Contact for chat
      xows_gui_switch_peer(occu.bare);
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
 */
function xows_gui_cli_onprivpush(occu)
{
  const dst_ul = xows_doc("priv_occu");
  
  let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+occu.addr+"']");
  if(li_peer) {
    // Update occupant <li_peer> element according template
    xows_tpl_update_room_occu(li_peer, occu);
    // Update chat title bar
    xows_gui_chat_head_update(occu);
    // If Occupant is found offline, this mean a Private Conversation
    // is open and occupant joined again, so, we inform Occupant is back
    if(occu.show === XOWS_SHOW_OFF) {
      // Add message to history
      const hist_ul = xows_gui_peer_doc(occu, "hist_ul");
      hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("joined the conversation")));
    }
  } else {
    // Append new instance of occupant <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_room_occu(occu, true); //< Special for Private Message
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(occu);
  }
  
  // Parent to proper <ul>
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
    xows_gui_chat_head_update(occu);
  }
  
  // Add message to history
  const hist_ul = xows_gui_peer_doc(occu, "hist_ul");
  hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("has left the conversation")));
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
 * @param   {object}    user      User Peer object
 */
function xows_gui_cli_onselfchange(user)
{
  const user_panl = xows_doc("user_panl");

  xows_doc("self_show").dataset.show = user.show;

  xows_tpl_spawn_avat_cls(user.avat); //< Add avatar CSS class
  const peer_avat = user_panl.querySelectorAll("PEER-AVAT");
  for(let i = 0; i < peer_avat.length; ++i)
    peer_avat[i].className = "h-"+user.avat;

  const peer_name = user_panl.querySelectorAll("PEER-NAME");
  for(let i = 0; i < peer_name.length; ++i)
    peer_name[i].innerText = user.name;

  const peer_meta = user_panl.querySelectorAll("PEER-META");
  for(let i = 0; i < peer_meta.length; ++i) {
    peer_meta[i].innerText = user.stat;
    peer_meta[i].className = (user.stat) ? "" : "PLACEHOLD";
  }

  const peer_addr = user_panl.querySelectorAll("PEER-ADDR");
  for(let i = 0; i < peer_addr.length; ++i)
    peer_addr[i].innerText = user.addr;

  // Update all opened chat history
  let i = xows_cli_cont.length;
  while(i--) xows_gui_hist_update(xows_cli_cont[i], user);

  i = xows_cli_room.length;
  while(i--) xows_gui_hist_update(xows_cli_room[i], user);
}

/**
 * User Panel on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_user_panl_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.id === "self_bt_conf")
    // Open user porfile page
    xows_gui_page_user_open();

  if(event.target.closest("#menu_show"))
    // Open user show/presence level menu
    xows_doc_menu_toggle(xows_doc("menu_show"), "drop_show",
                          xows_gui_menu_show_onclick);
}

/**
 * User Presence (show) menu button/drop on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_menu_show_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Close menu and unfocus button
  xows_doc_menu_toggle(xows_doc("menu_show"), "drop_show");

  if(event.target.id === "self_bt_edit")
    xows_gui_page_user_open();

  if(event.target.closest("#menu_stat"))
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
 * Open self status message input box
 */
function xows_gui_ibox_stat_open()
{
  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Edit status message"),
    xows_l10n_get("Indicate anything you want to mention about your current situation."),
    xows_l10n_get("Enter a status message..."),
    xows_cli_self.stat,
    xows_gui_ibox_stat_onvalid, null, null, null, null, true);
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
 * Chat header bar informations update
 *
 * @param   {object}    peer      Peer object, either Contact or Room
 */
function xows_gui_chat_head_update(peer)
{
  // Update chat title bar
  xows_gui_peer_doc(peer, "chat_titl").innerText = peer.name;

  const meta_inpt = xows_gui_peer_doc(peer,"meta_inpt");

  if(peer.type === XOWS_PEER_ROOM) {
    meta_inpt.innerText = peer.subj;
    meta_inpt.className = peer.subj ? "" : "PLACEHOLD";
    xows_gui_peer_doc(peer, "chat_bt_bkmk").hidden = (peer.book || peer.publ);
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
      let can_subs;
      if(peer.bare) {
        const cont = xows_cli_cont_get(peer.bare);
        can_subs = cont ? (cont.subs < XOWS_SUBS_TO) : true;
      }
      xows_gui_peer_doc(peer, "chat_bt_addc").hidden = !can_subs;
    }
  }
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
    // Query contact add
    xows_gui_pupu_subs_edit_open(xows_gui_peer.bare, xows_gui_peer.name);
    // Update chat header frame
    xows_gui_chat_head_update(xows_gui_peer);
    break;
  case "chat_bt_calv":
  case "chat_bt_cala":
    // Initiate call
    xows_gui_call_invite(xows_gui_peer, {"audio": true,"video": (event.target.id === "chat_bt_calv")});
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
  xows_doc_ibox_open(xows_l10n_get("Set topic of") + " #" + room.name,
    xows_l10n_get("Set the message of the day, a welcome message or the discussion subject."),
    xows_l10n_get("Enter a topic..."),
    room.subj,
    xows_gui_ibox_room_subj_onvalid, null, null, null, null, true);
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
/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Call View - Interaction
 * -------------------------------------------------------------------*/

/**
 * Chat Call frame on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_menu_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  if(event.target.tagName !== "BUTTON")
    return;

  let mutted;

  switch(event.target.id)
  {
    case "call_bt_spk": {
      const call_in_vol = xows_doc("call_in_vol");
      mutted = event.target.classList.toggle("MUTTED");
      xows_gui_audio.vol.gain.value = mutted ? 0 : parseInt(call_in_vol.value) / 100;
      call_in_vol.disabled = mutted;
      xows_gui_sound_play(mutted ? "mute" : "unmute"); //< Play sound
      break;
    }
    case "call_bt_cam": {
      mutted = event.target.classList.toggle("MUTTED");
      // Enable/Disable local video tracks
      xows_gui_call_input_enable(!mutted, "video");
      xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      break;
    }
    case "call_bt_mic": {
      mutted = event.target.classList.toggle("MUTTED");
      // Enable/Disable local video tracks
      xows_gui_call_input_enable(!mutted, "audio");
      xows_gui_sound_play(mutted ? "disable" : "enable"); //< Play sound
      break;
    }
    case "call_bt_hup": {
      // Hangup and clear data
      xows_gui_call_terminate(xows_gui_peer,"success");
      break;
    }
    case "call_bt_geo": {
      xows_doc("chat_fram").classList.toggle("CALL-FULL");
      break;
    }
  }
}

/**
 * Chat Call Volume slider on-input callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_call_in_vol_oninput(event)
{
  const gain = parseInt(event.target.value) / 100;

  // Set volume
  xows_gui_audio.vol.gain.value = gain;
  xows_log(2, "gui_call_in_vol_oninput", "volume", gain);

  // Change volume slider icon according current level
  let cls = "";

  if(gain > 0.66) {
    cls = "RNG-MAX";
  } else if(gain < 0.33) {
    cls = "RNG-MIN";
  }

  xows_doc("call_bt_spk").className = cls;
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Call View - Initialization
 * -------------------------------------------------------------------*/

/**
 * Multimedia Call speak/silence visual effect animation function handle.
 */
let xows_gui_chat_call_fx_hnd = null;

/**
 * Animation function for Multimedia Call speak/silence visual effect
 * for audio streams <div> element.
 *
 * This function is used within a loop (using requestAnimationFrame) to
 * perform real-time audio analysis of input audio stream to change the
 * visual audio <div> element border color according silence or speaking.
 */
function xows_gui_chat_call_fx()
{
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
    const color = peek > 0.08 ? "var(--link-base)" : "var(--text-tone3)";
    if(audio[i].parentNode.style.borderColor !== color) {
      audio[i].parentNode.style.borderColor = color;
    }
  }
}

/**
 * Function to open the Chat Multimedia Call Session layout
 */
function xows_gui_chat_call_open()
{
  // Reset volume slider and button to initial state
  const call_bt_spk = xows_doc("call_bt_spk");
  const call_in_vol = xows_doc("call_in_vol");

  call_bt_spk.className = "";
  call_in_vol.disabled = false;
  call_in_vol.value = 50;

  // Set gain to current volume slider position
  xows_gui_audio.vol.gain.value = parseInt(xows_doc("call_in_vol").value) / 100;

  const use_video = xows_gui_call_local.constraints.video; //xows_gui_call_constraints.video;

  // Reset Microphone button to intial state
  const call_bt_mic = xows_doc("call_bt_mic");
  call_bt_mic.classList.remove("MUTTED");

  // Reset Microphone button to intial state
  if(use_video) {
    // Reset Camera button to intial state
    const call_bt_cam = xows_doc("call_bt_cam");
    call_bt_cam.classList.remove("MUTTED");
  }

  xows_doc("call_bt_cam").hidden = !use_video;

  // Add event listeners
  xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_menu_onclick);
  xows_doc_listener_add(xows_doc("call_in_vol"),"input",xows_gui_call_in_vol_oninput);

  // Open Multimedia Call view layout
  xows_doc_cls_add("chat_fram","CALL-OPEN");
}

/**
 * Function to close Multimedia Call Session layout
 */
function xows_gui_chat_call_close()
{
  // Stop the speak/silence visual effects animation loop
  if(xows_gui_chat_call_fx_hnd) {
    clearInterval(xows_gui_chat_call_fx_hnd);
    xows_gui_chat_call_fx_hnd = null;
  }

  // Mute sound
  xows_gui_audio.vol.gain.value = 0;

  // Remove event listeners
  xows_doc_listener_rem(xows_doc("call_menu"),"click",xows_gui_call_menu_onclick);
  xows_doc_listener_rem(xows_doc("call_in_vol"),"input",xows_gui_call_in_vol_oninput);

  // Reset expand/reduce button title
  xows_doc("call_bt_geo").title = xows_l10n_get("Expand");

  // Close Multimedia Call view layout
  xows_doc("chat_fram").classList.remove("CALL-OPEN","CALL-FULL");

  // Empty the peer/stream view grid
  xows_doc("call_grid").innerHTML = "";
}

/**
 * Function to add peer to the Chat Multimedia session (Call view)
 * interface
 *
 * @param   {object}    peer      Contact Peer object related to stream
 * @param   {object}    stream    Stream object to add
 */
function xows_gui_chat_call_add_stream(peer, stream)
{
  const call_grid = xows_doc("call_grid");

  const is_video = stream.getVideoTracks().length;
  if(is_video && peer.self) return; //< No local video loopback

  // Select JID
  const jid = peer.self ? peer.full : peer.call;

  // Search for already existing stream for this peer
  let media, element = call_grid.querySelector("div[jid='"+jid+"']");

  if(element) {
    element.firstChild.srcObject = stream;
    return;
  } else {
    if(is_video) {
      element = xows_tpl_spawn_stream_video(jid, peer.name, peer.avat);
      media = element.querySelector("video");
    } else {
      element = xows_tpl_spawn_stream_audio(jid, peer.name, peer.avat);
      media = element.querySelector("audio");
    }
  }

  // Mute audio output since it will be managed through AudioContext
  media.muted = true;

  // Creates AudioSource node and store it within Media object
  media.srcNode = xows_gui_audio.ctx.createMediaStreamSource(stream);

  // If stream is Audio we create required stuff for the
  // speak/silence visual effect (see xows_gui_chat_call_effect)
  if(!is_video) {

    // Create Analyser node dans Buffer node stored within the Media
    // objecy to perform audio peek analysis for visual effects
    media.fftNode = xows_gui_audio.ctx.createAnalyser();
    media.fftNode.fftSize = 2048;
    media.fftBuff = new Float32Array(media.fftNode.frequencyBinCount);
    media.srcNode.connect(media.fftNode);

    // Start the speak/silence visual effects animation loop
    if(!xows_gui_chat_call_fx_hnd)
      xows_gui_chat_call_fx_hnd = setInterval(xows_gui_chat_call_fx, 50);
  }

  // Connect AudioSource -> Analyser [-> GainNode]
  if(!peer.self) media.srcNode.connect(xows_gui_audio.vol);

  // Set stream to Media element
  media.srcObject = stream;
  media.autoplay = true;

  // Add Stream element to layout
  if(peer.self) {
    call_grid.insertBefore(element, call_grid.firstChild);
  } else {
    call_grid.appendChild(element);
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Incoming call - Initialization
 * -------------------------------------------------------------------*/
 /**
 * History Ringing dialog on-click callback
 *
 * @param   {object}    peer      Contact Peer object.
 * @param   {string}    reason    Calling dialog open reason
 * @param   {object}   [constraints] Optionnal media constraints
 */
function xows_gui_hist_ring_onclick(event)
{
  // Close the Signaling Call dialog
  xows_gui_hist_ring_close();

  // Stop Ring Bell sound
  xows_gui_sound_stop("ringbell");

  switch(event.target.id)
  {
  case "ring_bt_pkup":
    // Ask user for input devices and open Call View
    xows_gui_call_accept(xows_gui_peer);
    break;
  case "ring_bt_deny":
    // Reject and clear call data
    xows_gui_call_terminate(xows_gui_peer,"decline");
    break;
  }
}

/**
 * Open History Ringing dialog
 *
 * @param   {object}    peer          Contact Peer object.
 * @param   {string}    reason        Calling dialog open reason
 * @param   {object}   [constraints]  Optionnal media constraints
 */
function xows_gui_hist_ring_open(peer, reason, constraints)
{
  const hist_ring = xows_gui_peer_doc(peer, "hist_ring");

  const video = constraints ? constraints.video : false;

  let icon, text, ringing, incall;

  switch(reason)
  {
  case "decline": {   //< peer declined call
      icon = "CALL-TERM";
      text = xows_l10n_get("The call has been declined");
    } break;

  case "buzy": {      //< peer is buzy
      icon = "CALL-TERM";
      text = xows_l10n_get("The other person is buzy");
    } break;

  case "success": {   //< peer hung up call
      icon = "CALL-TERM";
      if(xows_wrtc_linked()) {
        text = xows_l10n_get("The other person has hung up");
      } else {
        text = xows_l10n_get("You missed a call");
      }
    } break;

  case "initiate": {  //< initiating call
      icon = video ? "CALL-VID" : "CALL-AUD";
      text = xows_l10n_get("Call in progress...");
      ringing = true;
    } break;

  case "incall":  {    //< incoming call
      icon = video ? "CALL-VID" : "CALL-AUD";
      text = video ? xows_l10n_get("Incoming video call...") : xows_l10n_get("Incoming audio call...");
      ringing = true; incall = true;
    } break;

  default:  {         //< Unknown reason
      icon = "CALL-TERM";
      text = xows_l10n_get("Unexpected end of call") + ": " + xows_l10n_get(reason);
    } break;
  }

  hist_ring.querySelector("RING-ICON").className = icon;
  hist_ring.querySelector("RING-TEXT").innerText = text;

  xows_gui_peer_doc(peer, "ring_bt_deny").hidden = !ringing;
  xows_gui_peer_doc(peer, "ring_bt_pkup").hidden = !incall;
  xows_gui_peer_doc(peer, "ring_bt_clos").hidden = ringing; //< Ringing, no Close button

  hist_ring.classList.toggle("RINGING", ringing);

  // Show the incoming call dialog
  hist_ring.hidden = false;

  // Scroll history down
  xows_gui_peer_scroll_down(peer);
}

/**
 * Close History Ringing dialog
 */
function xows_gui_hist_ring_close()
{
  // Show the incoming call message
  xows_doc("hist_ring").hidden = true;
}

/* -------------------------------------------------------------------
 *
 * Multimedia-Call management
 *
 * -------------------------------------------------------------------*/

/**
 * Multimedia-Call session per-peer Remote parameters
 */
const xows_gui_call_remote = new Map();

/**
 * Multimedia-Call session Local parameters
 */
const xows_gui_call_local = {"sdp":null,"sid":null,"constraints":null,"stream":null};

/* -------------------------------------------------------------------
 * Multimedia-Call - General interface functions
 * -------------------------------------------------------------------*/
/**
 * Function to hangup call and clear Call data and references
 */
function xows_gui_call_clear()
{
  // Close the Media Call view frame
  xows_gui_chat_call_close();

  // Stop local stream
  if(xows_gui_call_local.stream) {

    const tracks = xows_gui_call_local.stream.getTracks();
    let i = tracks.length;
    while(i--) tracks[i].stop();

    xows_gui_call_local.stream = null;
  }

  xows_gui_call_local.sdp = null;
  xows_gui_call_local.sid = null;

  // Stop Ring Tone sound
  xows_gui_sound_stop("ringtone");

  // Stop Ring Bell sound
  xows_gui_sound_stop("ringbell");

  // Play Hangup sound
  xows_gui_sound_play("hangup");

  // Clear WebRTC interface
  xows_wrtc_clear();
}

/**
 * Multimedia-Call terminate call for the specified Peer
 *
 * If not 'reason' is provided, data for the specified Remote peer is cleared
 * without sending session terminate signaling.
 *
 * @param   {object}     peer       Related Peer object
 * @param   {string}    [reason]    Optionnal reason to HangUp
 */
function xows_gui_call_terminate(peer, reason)
{
  if(reason)
    xows_cli_jing_terminate(peer, reason);

  // Prevent useless process
  if(!xows_gui_call_remote.has(peer))
    return;

  // Enable Call buttons
  xows_gui_peer_doc(peer, "chat_bt_cala").disabled = false;
  xows_gui_peer_doc(peer, "chat_bt_calv").disabled = false;

  // Remove calling badge to roster contact
  xows_gui_calling_set(peer, false);

  const remote = xows_gui_call_remote.get(peer);

  // Stop stream for this remote peer
  if(remote.stream) {
    const tracks = remote.stream.getTracks();
    let i = tracks.length;
    while(i--) tracks[i].stop();

    remote.stream = null;
  }

  // Remove peer from remote entities
  xows_gui_call_remote.delete(peer);

  // Clear call data if required
  if(!xows_gui_call_remote.size)
    xows_gui_call_clear();
}

/**
 * Multimedia-Call accept incomping call from the specified Peer
 *
 * @param   {object}     peer     Related Peer object
 */
function xows_gui_call_accept(peer)
{
  if(!xows_gui_call_remote.has(peer))
    return;

  const remote = xows_gui_call_remote.get(peer);

  const medias = xows_sdp_get_medias(remote.sdp);

  // Create best medias constraint according incomming call
  // medias list and currently available local input medias
  const constraints = { audio: (medias.audio && xows_gui_medias_has("audioinput")),
                        video: (medias.video && xows_gui_medias_has("videoinput")) };

  xows_gui_call_input_ask(constraints);
}

/**
 * Multimedia-Call invite the specified Peer for a call
 *
 * @param   {object}     peer         Related Peer object
 * @param   {object}     constraints  Medias constraints
 */
function xows_gui_call_invite(peer, constraints)
{
  if(xows_gui_call_remote.has(peer))
    return;

  // Add peer as remote entiy
  xows_gui_call_remote.set(peer,{"sid":null,"sdp":null,"stream":null});

  // Start by getting user Media Stream
  xows_gui_call_input_ask(constraints);
}

/* -------------------------------------------------------------------
 * Multimedia-Call - Local/User Input-Medias routines
 * -------------------------------------------------------------------*/
/**
 * Multimedia-Call user Input-Medias activation.
 *
 * @param   {boolean} enable      Enable or disable tacks
 * @param   {string}  type        Medias type, either 'audio', 'video' or null for both
 */
function xows_gui_call_input_enable(enable, type)
{
  if(xows_gui_call_local.stream) {

    const stream = xows_gui_call_local.stream;

    let tracks = null;

    switch(type)
    {
    case "video": tracks = stream.getVideoTracks(); break;
    case "audio": tracks = stream.getAudioTracks(); break;
    default:      tracks = stream.getTracks(); break;
    }

    if(tracks) {
      for(let i = 0; i < tracks.length; ++i)
        tracks[i].enabled = enable;
    }
  }
}

/**
 * Multimedia-Call user Input-Medias acquiring error callback
 */
function xows_gui_call_input_error()
{
  // Display popup error message
  xows_doc_popu_open(XOWS_SIG_WRN, xows_l10n_get("Unable to get device stream for media call session"),
                     xows_gui_call_input_retry, "Retry",
                     xows_gui_chat_call_close, "Cancel");
}

/**
 * Multimedia-Call user Input-Medias acquiring success callback
 *
 * @param   {object}  stream    Input MediaStream object
 */
function xows_gui_call_input_setup(stream)
{
  // Store local stream
  xows_gui_call_local.stream = stream;

  // Add stream to Multimedia View
  xows_gui_chat_call_add_stream(xows_cli_self, stream);

  // Setup WebRTC interface if required
  if(!xows_wrtc_ready()) {
    xows_wrtc_setup(  xows_cli_external_get("stun", "turn"),
                      xows_gui_wrtc_onlinked,
                      xows_gui_wrtc_onerror);
  }

  // If no remote stream this is a call initiation
  if(!xows_wrtc_has_remote()) {

    // Open Ringin dialog
    xows_gui_hist_ring_open(xows_gui_peer,"initiate",xows_gui_call_local.constraints);

    // Play Ring Tone sound
    xows_gui_sound_play("ringtone");
  }

  // Set WebRTC Local stream and wait for SDP
  xows_wrtc_local_stream(stream, xows_gui_wrtc_onsdp);

  // Disable Call buttons
  for(const peer of xows_gui_call_remote.keys()) {
    xows_gui_peer_doc(peer, "chat_bt_cala").disabled = true;
    xows_gui_peer_doc(peer, "chat_bt_calv").disabled = true;
  }
}

/**
 * Multimedia-Call user Input-Medias acquiring request function
 *
 * @param   {object}  constraints  Media constraints object
 */
function xows_gui_call_input_ask(constraints)
{
  // Check whether API is available
  if(!xows_gui_medias) {
    xows_log(1,"gui_call_input_ask","Feature unavailable");
    return;
  }

  xows_gui_call_local.constraints = constraints;

  // Send media request to User
  navigator.mediaDevices.getUserMedia(constraints)
    .then(xows_gui_call_input_setup, xows_gui_call_input_error);
}

/**
 * Multimedia-Call user Input-Medias acquiring retry function
 */
function xows_gui_call_input_retry()
{
  xows_gui_call_input_ask(xows_gui_call_local.constraints);
}

/* -------------------------------------------------------------------
 * Multimedia-Call - WebRTC interface routines
 * -------------------------------------------------------------------*/
/**
 * Multimedia-Call WebRTC error callback
 *
 * @param   {string}      text    Error message
 */
function xows_gui_wrtc_onerror(text)
{
  // Display popup error message
  xows_doc_popu_open(XOWS_SIG_WRN,"Call session error: "+text);

  // Close potentially opened dialog
  xows_gui_hist_ring_close();

  // Clear call data
  xows_gui_call_terminate();
}

/**
 * Multimedia-Call WebRTC local description (SDP) created callback
 *
 * @param   {string}      sdp     Local SDP description string
 */
function xows_gui_wrtc_onsdp(sdp)
{
  // Store local SDP
  xows_gui_call_local.sdp = sdp;

  // Check whether we initiated call
  const initiate = !xows_wrtc_has_remote();

  for(const peer of xows_gui_call_remote.keys()) {
    if(initiate) {
      xows_cli_jing_initiate_sdp(peer, sdp);
    } else {
      xows_cli_jing_accept_sdp(peer, sdp);
    }
  }
}

/**
 * Multimedia-Call WebRTC remote stream available callback
 *
 * @param   {object}     stream     Remote MediaStream object
 * @param   {object}     peer       Related Peer object
 */
function xows_gui_wrtc_onstream(stream, peer)
{
  const remote = xows_gui_call_remote.get(peer);

  remote.stream = stream;

 // Add stream to Multimedia View
  xows_gui_chat_call_add_stream(peer, stream);

  // Check whether we answer this call
  if(xows_wrtc_has_local()) {

    // Close the Incoming Call dialog
    xows_gui_hist_ring_close();
  }
}

/**
 * Multimedia-Call WebRTC connection established callback
 */
function xows_gui_wrtc_onlinked()
{
  // Stop Ring Tone sound
  xows_gui_sound_stop("ringtone");

  // Stop Ring Bell sound
  xows_gui_sound_stop("ringbell");

  for(const peer of xows_gui_call_remote.keys()) {
    // Add calling badge to roster contact
    xows_gui_calling_set(peer, true);
  }

  // Open Chat Multimedia View layout
  xows_gui_chat_call_open();
}

/* -------------------------------------------------------------------
 * Multimedia-Call - XMPP/Jingle interface routines
 * -------------------------------------------------------------------*/
/**
 * Multimedia-Call XMPP/Jingle error callback
 *
 * @param   {number}     code     Error code
 * @param   {string}     text     Error message
 */
function xows_gui_cli_oncallerror(code, text)
{
  // Display popup error message
  xows_doc_popu_open(XOWS_SIG_WRN,"Call session error: "+text);

  // Close potentially opened dialog
  xows_gui_hist_ring_close();

  // Hangup with all peer
  for(const peer of xows_gui_call_remote.keys()) {
    // Add calling badge to roster contact
    xows_gui_call_terminate(peer, "failed-application");
  }

  // Clear call data
  xows_gui_call_clear();
}

/**
 * Multimedia-Call XMPP/Jingle received session initiate callback
 *
 * @param   {object}     peer     Related Peer object
 * @param   {string}     sid      Jingle session ID
 * @param   {string}     sdp      Converted SDP Offer string
 */
function xows_gui_cli_oncallinit(peer, sid, sdp)
{
  // Check whether we are busy
  if(xows_wrtc_busy()) {
    xows_gui_call_terminate(peer,"busy");
    return;
  }

  // Add peer as remote entiy
  xows_gui_call_remote.set(peer,{"sid":sid,"sdp":sdp,"stream":null});

  // Setup WebRTC interface if required
  if(!xows_wrtc_ready()) {
    xows_wrtc_setup(  xows_cli_external_get("stun", "turn"),
                      xows_gui_wrtc_onlinked,
                      xows_gui_wrtc_onerror);
  }

  xows_wrtc_remote_sdp(sdp, xows_gui_wrtc_onstream, peer);

  // Open the Incoming Call dialog
  xows_gui_hist_ring_open(peer,"incall",xows_sdp_get_medias(sdp));

  // If peer is offscreen during incomming call, add notification
  if(peer !== xows_gui_peer)
    xows_gui_unread_call(peer, true);

  // Play Ring Bell sound
  xows_gui_sound_play("ringbell");
}

/**
 * Multimedia-Call XMPP/Jingle received session accept callback
 *
 * @param   {object}     peer     Related Peer object
 * @param   {string}     sid      Jingle session ID
 * @param   {string}     sdp      Converted SDP Answer string
 */
function xows_gui_cli_oncallaccept(peer, sid, sdp)
{
  // Check for existing remote entiy
  if(!xows_gui_call_remote.has(peer)) {
    xows_log(1,"gui_cli_oncallaccept","accept from unknown remote",peer.addr);
    return;
  }

  // Save remote SDP answer
  const remote = xows_gui_call_remote.get(peer);
  remote.sdp = sdp;

  xows_wrtc_remote_sdp(sdp, xows_gui_wrtc_onstream, peer);
}

/**
 * Multimedia-Call XMPP/Jingle received session terminate callback
 *
 * @param   {object}     peer     Related Peer object
 * @param   {string}     sid      Jingle session ID
 * @param   {string}     reason   Parsed terminate reason
 */
function xows_gui_cli_oncallend(peer, sid, reason)
{
  // Open the Call dialog
  xows_gui_hist_ring_open(peer, reason);

  // If peer is offscreen during ended call change notification
  if(peer !== xows_gui_peer)
    xows_gui_unread_call(peer, false);

  // Hangup with this peer
  xows_gui_call_terminate(peer, null);
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
 * Callback function to handle user scroll the chat history window
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_main_onscroll(event)
{
  const chat_main = xows_doc("chat_main");

  // Switch from full to empty chat frame can generate a scroll equal
  // to 0, the following condition prevent unwanted query triggering.
  if(chat_main.scrollHeight === chat_main.clientHeight)
    return;

  // Save scroll position
  xows_gui_peer_scroll_save(xows_gui_peer);

  // Check whether the scroll is at top of frame
  if(chat_main.scrollTop < xows_doc("hist_beg").offsetHeight * 0.8) {
    // Query archive for current chat contact
    xows_gui_mam_query(xows_gui_peer, false, xows_gui_hist_page);
  }

  // If scroll is enough far from bottom, show the "Back to recent" banner
  if(chat_main.scrollSaved > chat_main.clientHeight)
    xows_gui_chat_nav_open(xows_gui_peer);

  const hist_end = xows_doc("hist_end");

  // Check whether we have cropped history
  if(!hist_end.hidden) {
    // Check whether the scroll is at bottom of frame
    if(chat_main.scrollSaved < hist_end.offsetHeight * 0.8) {
      // Query archive for current chat contact
      xows_gui_mam_query(xows_gui_peer, true, xows_gui_hist_page);
    }
  } else {
    // Check whether the scroll is at bottom of frame
    if(chat_main.scrollSaved < 50) {
      // Hide the "Back to recent" banner/button
      xows_gui_chat_nav_close(xows_gui_peer);
    }
  }
}

/**
 * Callback function to handle user click in chat history
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_hist_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(event.target.id) {
    // Check for history Ringing dialog
    if(event.target.id.startsWith("ring")) {
      // Forward to dedicated function
      xows_gui_hist_ring_onclick(event);
      return;
    }
  }

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
    xows_gui_hist_mesg_focus(xows_gui_peer, mesg_rply.dataset.ref);
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
    xows_cli_send_message(xows_gui_peer, inpt_text, li_msg.dataset.id, rply.dataset.ref, rply.dataset.to);
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

/**
 * Callback function to handle chat frame resizing
 *
 * @param   {object[]}  entries   Array of ResizeObserverEntry entries
 * @param   {object}    observer  Reference to the ResizeObserver
 */
function xows_gui_chat_main_onresize(entries, observer)
{
  if(xows_gui_peer)
    xows_gui_peer_scroll_adjust(xows_gui_peer);
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
  const cls = xows_tpl_spawn_avat_cls(author.avat);

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
  const hist_ul = (peer === xows_gui_peer) ? document.getElementById("hist_ul") :
                                             xows_doc_frag_element_find(peer.addr,"chat_hist","hist_ul");

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
  /*
  if(!li_msg) li_msg = hist_ul.querySelector("LI-MESG[data-orid='"+id+"']");
  if(!li_msg) li_msg = hist_ul.querySelector("LI-MESG[data-szid='"+id+"']");
  */
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

  const old_ref = xows_tpl_mesg_bestref(peer, li_old);

  // Search for references to old message to be updated
  const li_refs = hist_ul.querySelectorAll("MESG-RPLY[data-ref='"+old_ref+"']");
  for(let i = 0; i < li_refs.length; ++i)
    xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_new);

  // Also check chat input reply reference
  const chat_rply = xows_gui_peer_doc(peer, "chat_rply");
  if(chat_rply.dataset.id === old_ref)
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
  const li_refs = xows_gui_peer_doc(peer,"hist_ul").querySelectorAll("MESG-RPLY[data-ref='"+usid+"']");
  
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
 * Callback function to add sent or received message to the history
 * window
 *
 * @param   {object}    peer      Related Peer object
 * @param   {object}    mesg      Message object
 * @param   {boolean}   wait      Message wait for receipt
 * @param   {object}    error     Error data if any
 */
function xows_gui_cli_onmessage(peer, mesg, wait, error)
{
  xows_log(2,"gui_cli_onmessage","received message",peer.addr);

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
  
  // Store whether message is sent by ourself
  const is_sent = peer.self;

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
  
  let old_li, quo_li;

  // Search for corrected message to be discarded
  if(mesg.repl) {
    old_li = xows_gui_hist_mesg_get(peer, mesg.repl);
    // We ignore correction which are not in visible history or if correction
    // message have no body, in this case this mean message deletion
    if(!old_li) return;
  }

  // Search for replied message to be referenced
  if(mesg.rpid)
    quo_li = xows_gui_hist_rply_get(peer, mesg.rpid, mesg.rpto);

  // Avoid notifications for correction messages
  if(!mesg.repl) {

    // If off screen, add unread message badge to the roster contact
    if(peer !== xows_gui_peer)
      xows_gui_unread_add(peer, mesg.id);

    // Send browser notification popup
    if(!is_sent && !xows_gui_has_focus)
      xows_gui_notify_push(peer, mesg.body);
  }

  // Check whether end of history is croped, in this case the new message
  //  must not be appended, we will show it by querying archives
  if(xows_gui_peer_doc(peer,"hist_end").hidden || old_li) {

    const hist_ul = xows_gui_peer_doc(peer, "hist_ul");

    // To prevent history to inflate infinitely we keep it to a maximum
    // count of message and let user ability to query for archives
    if((hist_ul.childNodes.length + 1) > xows_gui_hist_size) {
      hist_ul.removeChild(hist_ul.firstChild);
      xows_gui_peer_doc(peer,"hist_beg").className = ""; //< Allow query history
    }

    // Create new message element
    const msg_li = xows_tpl_mesg_spawn(peer, mesg, wait, hist_ul.lastChild, old_li, quo_li);

    // Insert or append message, depending whether ref_li is null
    if(old_li) {
      xows_gui_hist_mesg_replace(peer, old_li, msg_li);
    } else {
      hist_ul.appendChild(msg_li);
    }
  }

  if(!is_sent && xows_gui_peer_scroll_get(peer) >= 50) {
    xows_gui_chat_nav_open(peer, true); //< Show the "new messages" alert
  } else {
    xows_gui_peer_scroll_down(peer); //< Scroll down to most recent message
  }
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
 * Query arvhived message for the current chat contact
 *
 * The 'after' parameter is used to choose to get either newers or
 * older messages than the ones currently present in the history <div>
 * if 'after' parameter is true, the function will query for newer
 * messages.
 *
 * @param   {boolean}   after     Get archives beyond first of after last message
 * @param   {number}    count     Desired count of message to gather, default is 20
 * @param   {boolean}   delay     Delay to temporize query, default is 100 MS
 * @param   {boolean}   force     Bypass optimization process and force query
 */
function xows_gui_mam_query(peer, after, count = 20, delay = 100, force = false)
{
  if(xows_gui_mam_query_to.has(peer))  //< Query already pending
    return;

  const hist_ul = xows_gui_peer_doc(peer, "hist_ul");
  if(!hist_ul) return;

  let start, end;

  // Get start or end time depending after parameter, we get time
  // always 25 ms after or before to prevent received the last or
  // first message already in history.

  if(after) {

    const hist_end = xows_gui_peer_doc(peer, "hist_end");

    // Check whether we already got the latest message
    if(!force && hist_end.hidden)
      return;

    if(hist_ul.childNodes.length)
      start = parseInt(hist_ul.lastChild.dataset.time) + 25;

    hist_end.classList.add("LOADING");

  } else {

    const hist_beg = xows_gui_peer_doc(peer, "hist_beg");

    // Check whether we already reached the first archived message
    if(!force && hist_beg.className.length)
      return;

    if(hist_ul.childNodes.length)
      end = parseInt(hist_ul.firstChild.dataset.time) - 25;

    hist_beg.className = "LOADING";
  }
  
  // To prevent flood and increase ergonomy the archive query is
  // temporised with a fake loading time.
  xows_gui_mam_query_to.set(peer, setTimeout(xows_cli_mam_fetch, delay, peer, count, start, end, xows_gui_mam_parse));
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

  let ref_li = null, prepend = true;

  // Check whether we must append or prepend received archived messages
  if(result.length && hist_ul.childNodes.length) {
    // We compare time (unix epoch) to ensure last archived message is
    // older (or equal) than the first history message.
    if(hist_ul.firstChild.dataset.time >= result[result.length-1].time) {
      ref_li = hist_ul.firstChild; //< node to insert messages before
    } else {
      prepend = false;
    }
  }

  const hist_beg = xows_gui_peer_doc(peer, "hist_beg");
  const hist_end = xows_gui_peer_doc(peer, "hist_end");

  // Disable all spin loader
  hist_beg.className = "";
  hist_end.className = "";

  // To prevent history to inflate infinitely we keep it to a maximum
  // count of message and let user ability to query for archives
  // Here we preventively cut the history as needed, either at top
  // or bottom, depending the "direction" of the archive result.
  let crop = (hist_ul.childNodes.length - xows_gui_hist_size) + count;
  if(crop > 0) {
    if(prepend) {
      // Result are older messages, we delete messages at bottom of history
      while(crop--) hist_ul.removeChild(hist_ul.lastChild);
      hist_end.hidden = false; //< Allow query history
    } else {
      // Result are newer messages, we delete messages at top of history
      while(crop--) hist_ul.removeChild(hist_ul.firstChild);
      hist_beg.className = ""; //< Allow query history
    }
  }

  // Preparing scroll sorcery to keep scroll aligned with visible content
  if(prepend) {
    // Save scroll offset from bottom once bottom of history was removed
    // so it will be properly adjusted later
    xows_gui_peer_scroll_save(peer);
  } else {
    // Adjust scroll position from bottom once top of history was removed
    // si we can save it at proper position later
    xows_gui_peer_scroll_adjust(peer);
  }

  let old_li, quo_li, pre_li, added = 0;

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
      old_li = xows_gui_hist_mesg_get(peer, mesg.repl);
      if(!old_li) continue; //< ignore correction which are not in visible history
    } else {
      old_li = null;
    }

    // Search for reply/quoted message to be referenced
    if(mesg.rpid) {
      quo_li = xows_gui_hist_rply_get(peer, mesg.rpid, mesg.rpto);
    } else {
      quo_li = null;
    }

    // Create new message element
    const msg_li = xows_tpl_mesg_spawn(peer, mesg, false, pre_li, old_li, quo_li);

    if(old_li) {
      // Message correction is insert after the corrected message
      xows_gui_hist_mesg_replace(peer, old_li, msg_li);
    } else {
      // Insert or append message, depending whether ref_li is null
      pre_li = hist_ul.insertBefore(msg_li, ref_li);
    }

    // Increase added message count
    added++;
  }

  xows_log(2,"gui_mam_parse",added+" added messages for",peer.addr);

  // Checks whether we reached end or start of available history, so we
  // display the proper "bounding" elements.
  if(complete) {
    // If no message was added, we must ensure which history bound
    // was reached since "insert" will not necessarly be set
    if(count && !added) {
      // compare id of the last result with the last history message
      if(result[0].id === hist_ul.firstChild.dataset.id)
        prepend = true; //< Set prepend to show history start
    }
    if(prepend) {
      // We reached the oldest history message
      hist_beg.className = "HIST-START";
    } else {
      // We reached the most recent history message
      hist_end.hidden = true; //< Disallow reaching history
    }
  }

  // Applying scroll sorcery to keep scroll aligned with visible content
  if(prepend) {
    // Ensure scroll is compensated after content heigth changed
    xows_gui_peer_scroll_adjust(peer);
  } else {
    // Save current offset from bottom to properly align it later
    xows_gui_peer_scroll_save(peer);
  }

  xows_gui_mam_query_to.delete(peer); //< Allow a new archive query
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
  xows_gui_upld_onclose();
}

/**
 * File Upload on-close callback function
 */
function xows_gui_upld_onclose()
{
  // Remove exit button event listener
  xows_doc_listener_rem(xows_doc("upld_exit"),"click",xows_gui_upld_onclose);

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
  xows_doc_listener_add(xows_doc("upld_exit"),"click",xows_gui_upld_onclose);

  // Show the upload frame
  xows_doc_show("hist_upld");

  // Scroll history down
  xows_gui_peer_scroll_down(xows_gui_peer);
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
      // Close navigation banner
      xows_gui_chat_nav_close(xows_gui_peer);
      // Go to end of history (last messages)
      xows_gui_peer_scroll_down(xows_gui_peer);
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
      xows_doc_menu_toggle(xows_doc("edit_bt_emoj"), "drop_emoj");
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
 * @param   {boolean}   alert     Enabled unread message alert
 */
function xows_gui_chat_nav_open(peer, alert = false)
{
  // Get the peer history bottom banner
  const chat_nav = xows_gui_peer_doc(peer, "chat_nav");

  // Set text
  chat_nav.innerText = alert ?  xows_l10n_get("New unread messages") :
                                xows_l10n_get("Back to recent messages");

  // Set Unread Alert class
  chat_nav.classList.toggle("UNDREAD", alert);

  // Show or hide element
  chat_nav.hidden = false;
}

/**
 * Function to close chat history navigation banner
 *
 * @param   {object}    peer     Peer object
 */
function xows_gui_chat_nav_close(peer)
{
  xows_gui_peer_doc(peer, "chat_nav").hidden = true;
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
  xows_doc("chat_panl").classList.remove("REPLY");

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
  const rpto = (xows_gui_peer.type === XOWS_PEER_CONT) ? 
                      xows_jid_bare(li_msg.dataset.from) :
                      li_msg.dataset.from;
  
  // Retrieve message author
  const peer = (xows_gui_peer.type === XOWS_PEER_ROOM) ? 
                    xows_cli_occu_get_or_new(xows_gui_peer, rpto, li_msg.dataset.ocid) :
                    xows_gui_peer;
  
  xows_doc("rply_name").innerText = peer.name;
  chat_rply.dataset.to = rpto;
  chat_rply.dataset.id = rpid;
  chat_rply.hidden = false;

  // Set REPLY class to Chat Pannel
  xows_doc("chat_panl").classList.add("REPLY");

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

  // Close menu and unfocus button
  xows_doc_menu_toggle(xows_doc("edit_bt_emoj"), "drop_emoj");
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
/**
 * Enable or disable UI elements according Room role and affiliation
 *
 * @param   {object}    room      Room object
 * @param   {object}   [occu]     Optional Occupant object
 */
function xows_gui_room_head_update(room, occu)
{
  // Occupants configuration button
  const occu_bt_cnfg = xows_gui_peer_doc(room,"occu_bt_cnfg");
  occu_bt_cnfg.hidden = (room.affi < XOWS_AFFI_ADMN);
}

/**
 * Switch the current selected room occupant
 *
 * @param   {string}    ojid       Occupant JID to select
 */
function xows_gui_occu_switch(ojid)
{
  const occu_list = xows_doc("occu_list");

  // remeve selection from previous occupant <li-peer>>
  const sel_li = occu_list.querySelector(".SELECTED");
  if(sel_li) sel_li.classList.remove("SELECTED");

  // add selection to next occupant <li-peer>>
  if(ojid) document.getElementById(ojid).classList.add("SELECTED");
}

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
    return xows_doc_frag_element_find(occu.room.addr,"occu_list",occu.addr);
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
 * @param   {object}   [code]     Optionnal list of status code
 */
function xows_gui_cli_onoccupush(occu, code)
{
  // Get Occupant's Room
  const room = occu.room;
  
  // checks whether we have a special status code with this occupant
  if(code && code.includes(110)) { //< Self presence update
    
    // Update privileges related GUI elements
    xows_gui_room_head_update(room);
    xows_gui_chat_head_update(room);
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
  
  // If we are in Private Conversation with occupant we don't
  // delete the Occupant Peer object since we need it to keep Chat 
  // Frame "alive" and futhermore, the occupant may rejoin the 
  // Room, bringin back the possiblity to send PM
  if(!xows_cli_priv_has(occu))
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

  // Toggle Occupant selection
  const li_selected = xows_doc("occu_list").querySelector(".SELECTED");
  if(li_selected) li_selected.classList.remove("SELECTED");

  // Add selected to next occupant <li-peer>
  document.getElementById(li_peer.id).classList.add("SELECTED");
  
  // Checks whether user clicked on menu button
  if(event.target.name === "occu_bt_menu") {
    // Open Occupant menu
    xows_doc_menu_toggle(event.target, "drop_occu", xows_gui_occu_drop_onclick, 
                                                    xows_gui_occu_drop_onshow);
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
  
  const is_admn = !occu.self && (xows_gui_peer.affi > XOWS_AFFI_MEMB);
  const is_modo = !occu.self && (is_admn || (xows_gui_peer.role > XOWS_ROLE_PART));
  const is_plus = xows_gui_peer.affi > occu.affi;
  
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
    
    // Only owner can grant Owner and Admin status
    const is_owner = (xows_gui_peer.affi == XOWS_AFFI_OWNR);
    
    // Disable access to menu items according user permissions
    item_ownr.disabled = !is_owner;
    item_admn.disabled = !is_owner;
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
    item_modo.disabled = !is_admn; //< Only Admin can grant Moderator Role
    item_part.disabled = !can_revoke;
    item_vist.disabled = !can_revoke;
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
  xows_doc_menu_toggle(li_peer.querySelector("BUTTON"), "drop_occu");

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
  case "occu_mi_visi": role = XOWS_ROLE_VIST; break;
  // - - -
  case "occu_mi_kick": role = XOWS_ROLE_NONE; break;
  case "occu_mi_outc": affi = XOWS_AFFI_OUTC; break;
  }

  if(affi != null && affi != occu.affi) {
    // Asks for confirmation for Ban or granting Admin or Owner. 
    if(affi > XOWS_AFFI_MEMB || affi == XOWS_AFFI_OUTC) {
      xows_gui_mbox_affi_open(xows_gui_peer, occu, affi);
    } else {
      xows_cli_muc_set_affi(xows_gui_peer, occu, affi);
    }
  }

  if(role != null && role != occu.role) {
    // Asks for confirmation for Kick or granting Moderator. 
    if(role == XOWS_ROLE_MODO || role == XOWS_ROLE_NONE) {
      xows_gui_mbox_role_open(xows_gui_peer, occu, role);
    } else {
      xows_cli_muc_set_role(xows_gui_peer, occu, role);
    }
  }
}

/* -------------------------------------------------------------------
 * Main screen - Room Occupants - List - Affiliation Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_affi_data = {};

/**
 * Room Occupant Affiliation change message box on-abort callback function
 */
function xows_gui_mbox_affi_onabort()
{
  xows_gui_mbox_affi_data.room = null;
  xows_gui_mbox_affi_data.occu = null;
  xows_gui_mbox_affi_data.affi = null;
}

/**
 * Room Occupant Affiliation change message box on-valid callback function
 */
function xows_gui_mbox_affi_onvalid()
{
  // query change affiliation for occupant
  xows_cli_muc_set_affi(xows_gui_mbox_affi_data.room,
                        xows_gui_mbox_affi_data.occu,
                        xows_gui_mbox_affi_data.affi);

  xows_gui_mbox_affi_data.room = null;
  xows_gui_mbox_affi_data.occu = null;
  xows_gui_mbox_affi_data.affi = null;
}

/**
 * Room Occupant Affiliation change message box open
 *
 * @param   {object}    room      Room object
 * @param   {object}    occu      Occupant object
 * @param   {number}    affi      Affiliation value to set
 */
function xows_gui_mbox_affi_open(room, occu, affi)
{
  // Store room, occupant and affiliation setup
  xows_gui_mbox_affi_data.room = room;
  xows_gui_mbox_affi_data.occu = occu;
  xows_gui_mbox_affi_data.affi = affi;

  let text;

  // Compose dialog message
  if(affi > XOWS_AFFI_OUTC) {
    text = xows_l10n_get("Change Affiliation of ");
    text += "<b>"+occu.name+"</b> ";
    text += xows_l10n_get("to")+" <b>";
    switch(affi) 
    {
    case XOWS_AFFI_OWNR : text += xows_l10n_get("Owner"); break;
    case XOWS_AFFI_ADMN : text += xows_l10n_get("Administrator"); break;
    case XOWS_AFFI_MEMB : text += xows_l10n_get("Member"); break;
    case XOWS_AFFI_NONE : text += xows_l10n_get("None"); break;
    }
    text += "</b> ?";
  } else {
    text = xows_l10n_get("Ban occupant ");
    text += "<b>"+occu.name+"</b> ?";
  }
  
  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_ASK, text,
                     xows_gui_mbox_affi_onvalid, "OK",
                     xows_gui_mbox_affi_onabort, "Cancel",
                     true);
}

/* -------------------------------------------------------------------
 * Main screen - Room Occupants - List - Role Popup-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_role_data = {};

/**
 * Room Occupant Role change message box on-abort callback function
 */
function xows_gui_mbox_role_onabort()
{
  xows_gui_mbox_role_data.room = null;
  xows_gui_mbox_role_data.occu = null;
  xows_gui_mbox_role_data.role = null;
}

/**
 * Room Occupant Role change message box on-valid callback function
 */
function xows_gui_mbox_role_onvalid()
{
  // query change affiliation for occupant
  xows_cli_muc_set_role(xows_gui_mbox_role_data.room,
                        xows_gui_mbox_role_data.occu,
                        xows_gui_mbox_role_data.role);

  xows_gui_mbox_role_data.room = null;
  xows_gui_mbox_role_data.occu = null;
  xows_gui_mbox_role_data.role = null;
}

/**
 * Room Occupant Role change message box open
 *
 * @param   {object}    room      Room object
 * @param   {object}    occu      Occupant object
 * @param   {number}    role      Role value to set
 */
function xows_gui_mbox_role_open(room, occu, role)
{
  // Store room, occupant and affiliation setup
  xows_gui_mbox_role_data.room = room;
  xows_gui_mbox_role_data.occu = occu;
  xows_gui_mbox_role_data.role = role;

  let text;

  // Compose dialog message
  if(role > XOWS_ROLE_NONE) {
    text = xows_l10n_get("Change Role of ");
    text += "<b>"+occu.name+"</b> ";
    text += xows_l10n_get("to")+" <b>";
    switch(role) 
    {
    case XOWS_ROLE_MODO : text += xows_l10n_get("Moderator"); break;
    case XOWS_ROLE_PART : text += xows_l10n_get("Participant"); break;
    case XOWS_ROLE_VIST : text += xows_l10n_get("Visitor"); break;
    }
    text += "</b> ?";
  } else {
    text = xows_l10n_get("Kick occupant ");
    text += "<b>"+occu.name+"</b> ?";
  }
  
  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_ASK, text,
                     xows_gui_mbox_role_onvalid, "OK",
                     xows_gui_mbox_role_onabort, "Cancel",
                     true);
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
function xows_gui_page_user_onabort()
{
  // Reset inputs values
  //xows_doc("card_addr").value = xows_cli_self.bare;
  xows_doc("card_name").value = xows_cli_self.name;

  // Get temps or cached avatar
  const data = xows_cach_avat_get(xows_cli_self.avat);
  xows_doc("card_avat").style.backgroundImage = "url(\""+data+"\")";
  xows_doc("card_avat").data = data; //< had-oc property

  xows_doc("card_open").checked = true;
}

/**
 * User Profile page on-valid callback function
 */
function xows_gui_page_user_onvalid()
{
  const access = xows_doc("card_open").checked ? "open" : "presence";
  
  // Update user profile
  xows_cli_change_profile(xows_doc("card_name").value,
                          xows_doc("card_avat").data,
                          access);
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
  case "card_open": //< Checkbox for Data in open access
    changed = !xows_doc("card_open").checked; break;
  case "card_name": //< Nickname input text field
    changed = (xows_doc("card_name").value != xows_cli_self.name);
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
  if(target.id === "card_avch") { //< Change avatar

    // Emulate click on file input
    xows_doc("card_file").click();

    return;
  }

  if(target.id === "card_avrm") { //< Remove avatar

    const card_avat = xows_doc("card_avat");

    // set null avatar data
    card_avat.data = null;

    // Generate default temp avatar
    const hash = xows_cli_avat_temp(xows_cli_self.addr);
    card_avat.style.backgroundImage = "url(\""+xows_cach_avat_get(hash)+"\")";

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
  const card_file = xows_doc("card_file");

  if(card_file.files[0]) {
    // Create file reader to read image data
    const reader = new FileReader();
    reader.onload = function(e) {
      // Once data loaded, create new Image object
      const image = new Image();
      // Define onload function to handle loaded data
      image.onload = function(e) {
        // Set avatar data on background
        const url = xows_gen_avatar(XOWS_AVAT_SIZE, this);
        const card_avat = xows_doc("card_avat");
        card_avat.data = url;
        card_avat.style.backgroundImage = "url(\""+url+"\")";
        // Open Message Box dialog
        xows_doc_popu_open_for_save(xows_gui_page_user_onvalid, 
                                    xows_gui_page_user_onabort);
      };
      // Start image loading (should be quick)
      image.src = e.target.result;
    };
    // Launch file reading
    reader.readAsDataURL(card_file.files[0]);
  }
}

/**
 * User Profile page on-close callback function
 */
function xows_gui_page_user_onclose()
{
  // remove "change" event listener to file input
  xows_doc_listener_rem(xows_doc("card_file"),"change",xows_gui_page_user_ev_file);
}

/**
 * User Profile page open
 */
function xows_gui_page_user_open()
{
  // Initialize inputs values
  xows_gui_page_user_onabort();

  // Open dialog page
  xows_doc_page_open("page_user",true,  xows_gui_page_user_onclose,
                                        xows_gui_page_user_oninput,
                                        xows_gui_page_user_onclick);

  // add "change" event listener to file input
  xows_doc_listener_add(xows_doc("card_file"),"change",xows_gui_page_user_ev_file);
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
                                    xows_gui_mbox_conf_onabort, "Ignore", 
                                    true);
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

    // query contact add
    xows_gui_pupu_subs_edit_open(peer.addr, peer.name);
    
    // Hide button
    target.hidden = true;

    return;
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
