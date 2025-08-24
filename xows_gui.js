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
 *                  Copyright (c) 2019-2025 Eric M.
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
/* ---------------------------------------------------------------------------
 *
 * User Interface (GUI) Module
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Global constants and variables
 * ---------------------------------------------------------------------------*/
/**
 * Constants value for loading process tasks bits (see xows_load* )
 */
const XOWS_FETCH_NEWR = xows_load_task_bit();     //< 0x20 - #32
const XOWS_FETCH_OLDR = xows_load_task_bit();     //< 0x40 - #64

/**
 * Storage for user (own) authentication data (login, password, etc.)
 */
let xows_gui_auth = null;

/**
 * Reference to Peer object that user is currently interacting with.
 *
 * The GUI allows to interact with only one user at a time, opening one and
 * only one Chat window (It can be either Contact, MUC Room or MUC Occupant
 * in case of private messages). This variable stores and therefore represents
 * the Peer whose chat windows is currently open by user.
 *
 * If this variable is null, this mean no chat window is open (this may happen
 * either transitionally or in a more durable way).
 *
 * If you break this, everything is broken since this reference is used all
 * along the Module absolutely EVERYWHERE.
 */
let xows_gui_peer = null;

/* ---------------------------------------------------------------------------
 * Media Devices Management
 * ---------------------------------------------------------------------------*/
/**
 * Storage for available Media Devices informations
 */
let xows_gui_devs_data = null;

/**
 * Query the navigator to gather data bout available (detected) Media Devices
 */
function xows_gui_devs_poll()
{
  // Query available devices for Multimedia features
  if("mediaDevices" in navigator) {
    navigator.mediaDevices.enumerateDevices().then(xows_gui_devs_oninfos);
    navigator.mediaDevices.ondevicechange = xows_gui_devs_onchange;
  }
}

/**
 * Handles received Media Devices changes notify (forwarded from mediaDevice
 * API).
 *
 * @param   {object}    event      Event object
 */
function xows_gui_devs_onchange(event)
{
  // Update medias list
  navigator.mediaDevices.enumerateDevices().then(xows_gui_devs_oninfos);
}

/**
 * Handles received Media Devices informations (forwarded from mediaDevice API).
 *
 * @param   {object}    devinfo    Array of MediaDeviceInfo object
 */
function xows_gui_devs_oninfos(devinfo)
{
  // Update media infos list
  xows_gui_devs_data = devinfo;

  xows_log(2,"gui_devices_oninfo","received medias infos");

  // Update relevant GUI element
  if(xows_gui_peer)
    xows_gui_doc_update(xows_gui_peer);
}

/**
 * Check whether the specified media type is available, searching in
 * the Media Devices list as reported by mediaDevice API.
 *
 * @param   {string}    type      Media type to search for
 */
function xows_gui_devs_has(type)
{
  if(!xows_gui_devs_data)
    return false;

  for(let i = 0; i < xows_gui_devs_data.length; ++i)
    if(xows_gui_devs_data[i].kind === type)
      return true;

  return false;
}

/* ---------------------------------------------------------------------------
 * Navigator Credential Management
 * ---------------------------------------------------------------------------*/
/**
 * Stores navigator Credential data into navigator
 *
 * @param   {object}    data    Crediential data to store
 */
function xows_gui_cred_store(data)
{
  const creds = new PasswordCredential(data);

  navigator.credentials.store(creds).then(
    ( ) => {xows_log(2,"gui_cred_store","credential stored");},
    (e) => {xows_log(1,"gui_cred_store","error storing credential",e);});
}

/**
 * Check for browser support of PasswordCredential storage
 *
 * @return   {boolean}   True if browser support feature, false otherwise
 */
function xows_gui_cred_support()
{
  return (("credentials" in navigator) && ("PasswordCredential" in window));
}

/* ---------------------------------------------------------------------------
 * Peer Offscreen documents management
 * ---------------------------------------------------------------------------*/
/**
 * Constant for initial Offscreen-Slot identifier
 *
 * This is the 'key' used to stores the Peers related GUI (Chat Window)
 * initial state (before any alteration) into the Offscreen storage Map.
 */
const XOWS_GUI_FRAG_VOID = "void";

/**
 * Creates a new Peer Offscreen-Slot (DocumentFragment).
 *
 * It clones the Peer related initial DOM Elements (saved in "void"
 * Offscreen-Slot at initialization) to a new Offscreen-Slot.
 *
 * If 'source' is specified, the new set of Offscreen-Slot is cloned from
 * the specified 'source' instead of "void" Offscreen-Slot.
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

  // Clone elements from initial offscreen slot
  xows_doc_frag_clone(slot, source);
}

/**
 * Exports the specified Peer Offscreen-Slot (DocumentFragment)
 *
 * It moves the current Peer related DOM Elements to the specified
 * Offscreen-Slot.
 *
 * @param   {string}    slot      Document fragment slot (Peer's address)
 */
function xows_gui_frag_export(slot)
{
  // Unlisten scrollable elements to prevent ResizeObserver bug
  xows_doc_scroll_unobserv(xows_doc("chat_hist"));
  xows_doc_scroll_unobserv(xows_doc("mucl_list"));

  // Export chat history scrollBottom ad-hoc parameter
  xows_doc_scroll_export("chat_hist");

  // Export document elements to offscreen fragment
  //xows_doc_frag_export(slot, "peer_col");
  xows_doc_frag_export("peer_col", slot);
}

/**
 * Import the specified Peer Offscreen-Slot (DocumentFragment)
 *
 * It moves the specified Offscreen-Slot's Elements into the DOM, effectively
 * replacing existing DOM Elements.
 *
 * If the 'slot' is null (or undefined) the function moves elements from
 * the "void" (initial) Offscreen-Slot.
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

  // Import chat history scrollBottom ad-hoc parameter
  if(slot !== XOWS_GUI_FRAG_VOID)
    xows_doc_scroll_import("chat_hist");
}

/**
 * Deletes the specified Peer Offscreen-Slot.
 *
 * @param   {string}    slot      Document fragment slot (Peer's address)
 */
function xows_gui_frag_discard(slot)
{
  // Delete Document Fragment
  xows_doc_frag_delete(slot);
}

/**
 * Removes all Peer Offscreen-Slot, leaving only the initial "void".
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
 * Module initialization
 *
 * -------------------------------------------------------------------*/
/**
 * Module initialization.
 *
 * Configures required elements to make the Module ready to use. This
 * function should be called only once.
 */
function xows_gui_init()
{
  // Export chat history scrollBottom ad-hoc parameter
  xows_doc_scroll_export("chat_hist");

  // Create intial offscreen data from current document
  xows_gui_frag_export(XOWS_GUI_FRAG_VOID);

  // Check whether Registering option is enabled
  if(xows_options.gui_allow_register)
    xows_doc_show("auth_regi"); //< The link in Login Page

  // Poll for available devices for Multimedia features
  xows_gui_devs_poll();

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
  xows_snd_sample_load("notify",   "notify.ogg");
  xows_snd_sample_load("disable",  "disable.ogg");
  xows_snd_sample_load("enable",   "enable.ogg");
  xows_snd_sample_load("mute",     "mute.ogg");
  xows_snd_sample_load("unmute",   "unmute.ogg");
  xows_snd_sample_load("ringtone", "ringtone.ogg");
  xows_snd_sample_load("ringbell", "ringbell.ogg");
  xows_snd_sample_load("hangup",   "hangup.ogg");

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
  xows_cli_set_callback("mucpush",    xows_gui_muc_list_onpush);
  xows_cli_set_callback("mucpull",    xows_gui_muc_list_onpull);
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

  // Configure sound callbacks
  xows_snd_set_callback("onvmtr",     xows_gui_snd_onvmtr);

  // Set loader functions
  xows_load_task_set(XOWS_FETCH_NEWR, xows_gui_mam_fetch_newer);
  xows_load_task_set(XOWS_FETCH_OLDR, xows_gui_mam_fetch_older);

  // Startup GUI (Auto-connect or login page)
  xows_gui_startup();
}

/* ---------------------------------------------------------------------------
 *
 * Main GUI management
 *
 * ---------------------------------------------------------------------------*/
/**
 * Cleans the GUI to its Session-Start state
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
 * Hard-reset all GUI to its initial "Loaded" state
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

  // Reset previous self parameters
  Object.assign(xows_gui_self_prev, {name:null,addr:null,avat:null,stat:null});

  // Clear all Peer's offscreen elements
  xows_gui_frag_clear();
}

/**
 * GUI hang timeout handle
 */
let xows_gui_hang_hto = null;

/**
 * Set GUI to paused mode with Wait screen.
 *
 * This function is part of automated GUI hang process, it is called
 * via a setTimeout, and should not be called alone outside this context.
 */
function xows_gui_hang_timeout(text)
{
  // Clean GUI
  xows_gui_clean();

  // Display wait screen
  xows_gui_page_wait_open(text);
}

/**
 * Abort pending GUI hang
 */
function xows_gui_hang_abort()
{
  if(xows_gui_hang_hto) {
    clearTimeout(xows_gui_hang_hto);
    xows_gui_hang_hto = null;
  }
}

/**
 * Prepare for GUI hang state.
 *
 * GUI hang is kind of "pause" mode with the Wait Page displayed. It is mainly
 * used in the connection recovery process, to stop any user interaction and
 * showing the "connecting..." wait page until connection recover or timeout.
 *
 * @param   {number}  delay   Delay before displaying wait page
 * @param   {string}  text    Text for the wait page
 */
function xows_gui_hang(delay, text)
{
  // Abort any pending timeout
  xows_gui_hang_abort();
  xows_gui_hang_hto = setTimeout(xows_gui_hang_timeout, delay, text);
}

/* ---------------------------------------------------------------------------
 *
 * Startup, Connect and Dsiconnect routines
 *
 * ---------------------------------------------------------------------------*/
/**
 * Flag indicating that client is in connection recovery process
 */
let xows_gui_resume_pnd = false;

/**
 * Main startup function, either shows login page or try to autoconnect
 * using navigator saved credentials (if supported)
 *
 * This function is not intended to be called more than once, it could have
 * been integrated in Module Initialization but was left outside, in case...
 */
function xows_gui_startup()
{
  // Check whether credentials are available for auto-login
  if(xows_gui_cred_support()) {
    // Try to find credential for automatic login
    const options = { "password"  : true,
                      "mediation" : "optional" };
    navigator.credentials.get(options).then(  xows_gui_startup_oncreds,
                                              xows_gui_page_auth_open);

    return; //< do not show login page
  }

  // Check for stored SASL auth data
  if(xows_cach_auth_has()) {

    // Check whether option is enabled
    if(xows_options.login_sasl_store) {

      // Connect with saved SASL auth data
      const auth_data = xows_cach_auth_get();

      // extract username from JID
      const user = auth_data.z.split("@")[0];

      xows_log(2,"gui_startup","auto connect (stored SASL data)");

      // Try connect
      xows_gui_connect(user, null, false, false);

      return; //< do not show login page

    } else {

      // Erase saved auth data
      xows_cach_auth_reset();

      xows_log(2,"gui_startup","stored SASL data erased");
    }
  }

  // Show login page
  xows_gui_page_auth_open();
}

/**
 * Handles received result of Navigator Credential fetch query (forwarded from
 * Credential Management API)
 *
 * @param   {object}    creds   PasswordCredential object or null
 */
function xows_gui_startup_oncreds(creds)
{
  if(creds) {
    xows_log(2,"gui_startup_oncreds","auto connect");
    // Try connect
    xows_gui_connect(creds.id, creds.password, false, false);
  } else {
    xows_log(2,"gui_startup_oncreds","no credential");
    // Show login page
    xows_gui_page_auth_open();
  }
}

/**
 * Attempts Client connection and login.
 *
 * Stores authentication data and request Client (CLI Module) to connect
 * and login to XMPP server.
 *
 * @param   {string}    user    Login username or Full JID
 * @param   {string}    pass    Login Password
 * @param   {boolean}   save    Indicates to save credentials for auto-login
 * @param   {boolean}   regi    Register new account
 */
function xows_gui_connect(user, pass, save, regi = false)
{
  // Display wait screen
  xows_gui_page_wait_open("Connecting...");

  // Get login parameters from DOM
  xows_gui_auth = {};
  xows_gui_auth.user = user;
  xows_gui_auth.pass = pass;
  xows_gui_auth.save = save;

  // Close any popup-box
  xows_doc_popu_close();

  // Create Audio context (must be done after user interaction)
  xows_snd_init();

  // Append domain if the option is set, otherwise it should be
  // set in the usename as typed by user.
  let jid = xows_gui_auth.user;
  if(xows_options.login_force_domain)
    jid += "@"+xows_options.login_force_domain;

  // Launch the client connection
  xows_cli_cnx_login(xows_options.xmpp_url, jid, xows_gui_auth.pass, save, regi);
}

/**
 * Handles Client successfull connection and ready (forwarded from CLI Module)
 *
 * @param   {object}    user      User (SELF) Peer object
 * @param   {boolean}   resume    Indicate XMPP stream resume
 */
function xows_gui_cli_onready(user, resume)
{
  // Check whether user asked to remember
  if(xows_gui_cred_support() && xows_gui_auth.auto) {

    xows_log(2,"gui_cli_onready","Saving credential");

    const data = {id        : xows_gui_auth.user,
                  password  : xows_gui_auth.pass};

    // Store credential data (Ask user, etc.)
    xows_gui_cred_store(data);
  }

  // Check whether we recover from connexion loss
  if(xows_gui_resume_pnd) {

    xows_log(1,"gui_cli_onready","resume session");

    // Reset connection loss
    xows_gui_resume_pnd = false;

    // If XMPP stream resumed, no need to fetch newer history
    if(!resume) {

      // Update history for openned chat
      for(let i = 0; i < xows_cli_cont.length; ++i) {
        // Update only if history already preloaded
        if(xows_gui_doc_has(xows_cli_cont[i]))
          xows_load_task_push(xows_cli_cont[i], XOWS_FETCH_NEWR, xows_gui_hist_resume);
      }

      for(let i = 0; i < xows_cli_room.length; ++i) {
        // Update only if history already preloaded
        if(xows_gui_doc_has(xows_cli_room[i]))
          xows_load_task_push(xows_cli_room[i], XOWS_FETCH_NEWR, xows_gui_hist_resume);
      }
    }

    // Abort any pending "GUI hang"
    xows_gui_hang_abort();

    // Flush stanza queue
    xows_xmp_flush();

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
 * Disconnect Client.
 *
 * This tells Client to close the current XMPP session.
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
 * Handles Client session closed (forwarded from CLI Module)
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

      // From this point, sent messages are queued waiting for connection
      // recover or stream resume. We do not display the "connecting" page
      // immediately to let recover a short disconnect almost-transparently.
      //
      // If connection loss become longer, we pause the GUI and display the
      // wait page.
      xows_gui_hang(xows_options.resume_try_delay*2100, "Connecting...");

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
 * Handles Client unhandled error (forwarded from CLI Module)
 *
 * Errors that reach this point are not handled, this may happen if XMPP server
 * send an error for which there is no dedicated implementation. This should
 * never happen, but may happen anyway.
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

/* ---------------------------------------------------------------------------
 *
 * Peer Documents Set Routines
 *
 * ---------------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Peer Documents Set - Creation, Export and Import
 * -------------------------------------------------------------------*/
/**
 * Creates new Documents set (chat interface) for the specified Peer
 *
 * @param   {object}    peer      Peer object
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

  // Set chat header bar informations
  xows_gui_doc_update(peer);
}

/**
 * Resets Peer's Documents set (chat interface) to initial state
 *
 * @param   {object}    peer      Peer object to reset offscreen for
 */
function xows_gui_doc_reset(peer)
{
  // Prevent recreate offscreen document
  if(xows_doc_frag_db.has(peer.addr))
    xows_doc_frag_db.delete(peer.addr);

  // Peer is no longer "live"
  peer.live = false;

  xows_gui_doc_init(peer);
}

/**
 * Export Peer's Documents set (chat interface) to Offscreen
 *
 * This moves Peer related DOM Elements ot its dedicated Offscreen-Slot
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
 * Import Peer's Documents set (chat interface) to DOM
 *
 * This moves Peer related Offscreen-Slot Elements to DOM, showing Peer
 * related chat interface to user.
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
  if(!xows_doc_frag_db.has(peer.addr))
    xows_gui_doc_init(peer);

  // import document elements from offscreen fragment
  xows_gui_frag_import(peer.addr);

  // Set current active Peer
  xows_gui_peer = peer;

  // Reassign and resize observers listeners to scrollable elements
  xows_doc_scroll_listen(xows_doc("chat_hist"));
  if(peer.type === XOWS_PEER_ROOM)
    xows_doc_scroll_listen(xows_doc("mucl_list"));

  // Recreate event listeners
  xows_doc_listener_add(xows_doc("chat_head"), "click", xows_gui_chat_head_onclick);

  xows_doc_listener_add(xows_doc("chat_hist"), "scrollend",xows_gui_hist_onscroll);
  if(!xows_doc("call_view").hidden) {
    xows_doc_listener_add(xows_doc("call_menu"),"click",xows_gui_call_view_onclick);
    xows_doc_listener_add(xows_doc("call_volu"),"input",xows_gui_call_view_oninput);
  }

  xows_doc_listener_add(xows_doc("hist_mesg"), "click", xows_gui_hist_onclick);

  const hist_ring = xows_doc("hist_ring");
  if(!hist_ring.hidden) xows_doc_listener_add(hist_ring, "click", xows_gui_hist_ring_onclick);

  const hist_upld = xows_doc("hist_upld");
  if(!hist_upld.hidden) xows_doc_listener_add(hist_upld, "click", xows_gui_upld_onclick);

  const edit_alrt = xows_doc("edit_alrt");
  if(!edit_alrt.hidden) xows_doc_listener_add(edit_alrt, "click", xows_gui_edit_alrt_onclick);

  const edit_inpt = xows_doc("edit_inpt");
  xows_doc_listener_add(edit_inpt, "keyup", xows_gui_edit_inpt_oncaret);
  xows_doc_listener_add(edit_inpt, "mouseup", xows_gui_edit_inpt_oncaret);
  xows_doc_listener_add(edit_inpt, "paste", xows_gui_edit_inpt_onpaste, false); //< need preventDefault()
  const chat_edit = xows_doc("chat_edit");
  xows_doc_listener_add(chat_edit, "input", xows_gui_edit_oninput);
  xows_doc_listener_add(chat_edit, "click", xows_gui_edit_onclick);
  xows_doc_listener_add(xows_doc("edit_file"), "change", xows_gui_edit_onfile);

  if(peer.type === XOWS_PEER_ROOM) {
    xows_doc_listener_add(xows_doc("mucl_hand"), "click", xows_gui_layout_hand_onclick);
    xows_doc_listener_add(xows_doc("mucl_head"), "click", xows_gui_muc_head_onclick);
    xows_doc_listener_add(xows_doc("mucl_list"), "click", xows_gui_muc_list_onclick);
  }

  // Check whether document is newly opened and need some preload
  if(xows_gui_doc(peer,"peer_load").hidden) {

    xows_log(2,"gui_doc_import","updating elements",peer.addr);

    // Update elements according peer state
    xows_gui_doc_update(peer);

  } else {

    xows_log(2,"gui_doc_import","initial preloading",peer.addr);

    let load_mask = 0;

    switch(peer.type)
    {
    case XOWS_PEER_OCCU:
      // Occupant have nothing to load
      xows_doc_cls_add("hist_beg","HIST-START");
      break;
    default:
      load_mask |= XOWS_FETCH_OLDR;
      break;
    }

    // Load required then update elements according peer state.
    xows_load_task_push(peer, load_mask,
                        xows_gui_doc_update,
                        XOWS_UPDT_ALL|XOWS_UPDT_LOAD);
  }
}

/**
 * Reassign Peer's Documents set (chat interface) to another Offscreen-Slot
 *
 * This function may be used when a Peer change its identifier (its JID), this
 * mainly happen in MUC context (Private Messages) when JID may changes as
 * Occupant changes its nickname.
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

/* ---------------------------------------------------------------------------
 * Peer Documents Set - Elements access routines
 * ---------------------------------------------------------------------------*/
/**
 * Check whether Peer Documents Set exists
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
 * Get Peer Documents Set element by id.
 *
 * The returned element can be either in current DOM (if Peer is the current
 * selected one) or from offscreen DocumentFragment (Offscreen-Slot)
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
  } else if(xows_doc_frag_db.has(peer.addr)) {
    return xows_doc_frag_db.get(peer.addr).getElementById(id);
  }

  return null;
}

/* ---------------------------------------------------------------------------
 * Peer Documents - Update routines
 * ---------------------------------------------------------------------------*/
/**
 * Constants maks bits for document update routine
 */
const XOWS_UPDT_NOTI = 0x01;  //< Update Notification button
const XOWS_UPDT_BUZY = 0x02;  //< Update according Call Buzy state
const XOWS_UPDT_SUBJ = 0x04;  //< Update Room subject
const XOWS_UPDT_OTHR = 0x10;  //< Update other misc elements
const XOWS_UPDT_ALL  = 0xff;  //< All common updates
const XOWS_UPDT_LOAD = 0x100; //< Special mask for preloading

/**
 * Updates Peer Documents Set elements according current Peer and
 * global states.
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
      xows_gui_doc(peer,"chat_bkad").hidden = (peer.book || (peer.locl && peer.publ));
      xows_gui_doc(peer,"chat_bkrm").hidden = !peer.book;
    }

    // Room subject
    if(mask & XOWS_UPDT_SUBJ) {
      const chat_meta = xows_gui_doc(peer, "chat_meta");
      chat_meta.innerText = peer.subj ? peer.subj : "";
    }

  } else {

    if(mask & XOWS_UPDT_OTHR) {

      // Common header elements
      xows_gui_doc(peer,"chat_titl").innerText = peer.name;
      xows_gui_doc(peer,"chat_meta").innerText = peer.stat ? peer.stat : "";
      xows_gui_doc(peer,"chat_show").dataset.show = peer.show;

      // Contact or Occupant (Private Message) variations
      if(peer.type === XOWS_PEER_OCCU) {
        xows_gui_doc(peer,"chat_addr").innerText = "(# "+peer.room.name +")";
        xows_gui_doc(peer,"chat_addc").hidden = (xows_cli_peer_subsste(peer) !== 0);
      } else {
        xows_gui_doc(peer,"chat_addr").innerText = "("+peer.addr+")";
      }

      // Show or hide call buttons
      const has_ices = xows_cli_extservs_has("stun","turn");
      xows_gui_doc(peer,"chat_cala").hidden = !(xows_gui_devs_has("audioinput") && has_ices);
      xows_gui_doc(peer,"chat_calv").hidden = !(xows_gui_devs_has("videoinput") && has_ices);
    }

    // Enable or disable Call buttons according buzy state
    if(mask & XOWS_UPDT_BUZY) {
      const unavailable = xows_cli_call_buzy() || (peer.show <= XOWS_SHOW_DND);
      xows_gui_doc(peer, "chat_cala").disabled = unavailable;
      xows_gui_doc(peer, "chat_calv").disabled = unavailable;
    }
  }

  if(mask & XOWS_UPDT_OTHR) {

    // Check whether file Upload is available
    xows_gui_doc(peer,"edit_upld").disabled = !xows_cli_services.has(XOWS_NS_HTTPUPLOAD);

    // Set chat input placeholder
    const text = xows_l10n_get("Send a message to")+" "+peer.name+" ...";
    xows_gui_doc(peer,"edit_inpt").setAttribute("placeholder",text);
  }

  // Special mask to disable the preloading screen
  // for newly opened document set.
  if(mask & XOWS_UPDT_LOAD) {
    const peer_load = xows_gui_doc(peer,"peer_load");
    if(!peer_load.hidden) peer_load.hidden = true;

    // Set peer as "live", indicating it now has
    // open and ready chat window
    peer.live = true;
  }
}

/* -------------------------------------------------------------------
 *
 * Peer Selection
 *
 * -------------------------------------------------------------------*/
/**
 * Set the active Peer and display its associated Document Set (chat
 * interface).
 *
 * This function is a central pivot of GUI interactions, it opens and closes
 * the proper Document Sets according Peer selected by user then set this
 * Peer as current selected one.
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
      xows_cli_muc_join(peer);

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
    xows_cli_chst_self_set(xows_gui_peer, XOWS_CHAT_GONE);

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
 * Layout management
 *
 * -------------------------------------------------------------------*/
/**
 * Handles column's flap-handles click events to expand or hide
 * Roster or MUC List in narrow-screen configuration.
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
 * Toggles the MUC (Occupants) list column (Right Panel)
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

/* ---------------------------------------------------------------------------
 *
 * Navigator window routines
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Navigator window - Title bar
 * ---------------------------------------------------------------------------*/
/**
 * Stack for navigator window title bar changes
 */
const xows_gui_wnd_title_stk = [];

/**
 * Push the titles stack and set new navigator window title
 *
 * @param   {string}    title     Title to set
 */
function xows_gui_wnd_title_set(title)
{
  xows_gui_wnd_title_stk.push(document.title);
  document.title = title;
}

/**
 * Pop the titles stack to restores previous navigator window title
 */
function xows_gui_wnd_title_pop()
{
  document.title = xows_gui_wnd_title_stk.pop();
}

/* ---------------------------------------------------------------------------
 * Navigator window - Navigation Back handling
 * ---------------------------------------------------------------------------*/
/**
 * Handles navigator 'Back' button click
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_onback(event)
{
  if(xows_cli_cnx_cntd() && !xows_doc_popu_modal()) {

    // prevent to go back
    history.forward();

    // open confirmation dialog
    xows_gui_wnd_exit_mbox_open();
  }
}

/* ---------------------------------------------------------------------------
 * Navigator window - Misc events handling
 * ---------------------------------------------------------------------------*/
/**
 * Current state of navigator window focus
 */
let xows_gui_wnd_has_focus = true;

/**
 * Handles navigator window page/tab focus changes
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_onfocus(event)
{
  switch(event.type)
  {
  case "focus":
  case "blur":
    if(!xows_gui_wnd_has_focus)
      xows_cli_pres_show_back();
    break;

  case "visibilitychange":
    // I am not sure this is usefull at all...
    if(xows_cli_cnx_resume_pnd && !document.hidden)
      xows_cli_cnx_resume(10);
    break;
  }

  xows_gui_wnd_has_focus = document.hasFocus();
}

/**
 * Handles navigator window page/tab unload
 *
 * @param   {object}    event     Event object
 */
function xows_gui_wnd_unload(event)
{
  // Disconnect
  xows_cli_onuload();

  return undefined; //< prevent prompting dialog to user
}

/* ---------------------------------------------------------------------------
 * Navigator window - Desktop Notifications
 * ---------------------------------------------------------------------------*/
/**
 * Handles received Desktop-Notification permission from user.
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
 * Asks user for Desktop-Notification permission.
 */
function xows_gui_wnd_noti_ask()
{
  // Request permission to user
  if(Notification.permission !== "granted")
    Notification.requestPermission().then(xows_gui_wnd_noti_onperm);
}

/**
 * Returns whether permission for Desktop-Notification was granted by user.
 *
 * @return  {boolean}   True if permission granted, false otherwise.
 */
function xows_gui_wnd_noti_allowed()
{
  return (Notification.permission === "granted");
}

/**
 * Pop a new Desktop-Notification
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
      const avat = xows_cach_avat_get(peer.avat);
      const badg = "/" + xows_options.lib_path + "/logo.svg";
      const icon = avat ? avat : badg;

      // Push new notification
      const notif = new Notification(peer.name,{"body":body,"icon":icon,"badge":badg});
      // Sound is slower than light...
      xows_snd_sample_play("notify");
    }
    break;

  default:
    // Request user permission for notifications
    xows_gui_wnd_noti_ask();
    break;
  }
}

/* ---------------------------------------------------------------------------
 * Navigator window - User input devices access
 * ---------------------------------------------------------------------------*/
/**
 * Storage for user media devices access parameters
 */
const xows_gui_wnd_media_param = {constr:null,onmedia:null,onabort:null,payload:null,error:null};

/**
 * Asks user permission to access media devices specified by constraints.
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
 * Handle user media devices access permission denied or faillure.
 *
 * If the received error is an explicit user access denied, the configured
 * 'onabort' callback is directly called with the received error.
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
 * Handles user access media devices canceled or denied by user
 */
function xows_gui_wnd_media_onabort()
{
  // Get saved parameters
  const param = xows_gui_wnd_media_param;

  // Call on-abort callback
  if(xows_isfunc(param.onabort))
    param.onabort(param.payload, param.error);
}

/* ---------------------------------------------------------------------------
 * Navigator window - Global input handling
 * ---------------------------------------------------------------------------*/
/**
 * Storage for currently pressed keyboard keys (by keycodes)
 */
const xows_gui_wnd_keydn = new Array(256);

/**
 * Handles navigator window keyboard input events
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

/* ---------------------------------------------------------------------------
 * Navigator window - Disconnect Confirmation
 * ---------------------------------------------------------------------------*/
/**
 * Handles Disconnect Confirmation Popup abortion (click on abort button)
 */
function xows_gui_wnd_exit_mbox_onabort()
{
  // Nothing to do
}

/**
 * Handles Disconnect Confirmation Popup validation (click on OK button)
 */
function xows_gui_wnd_exit_mbox_onvalid()
{
  // Disconnect
  xows_cli_cnx_close();

  // Back nav history
  history.back();
}

/**
 * Opens Disconnect Confirmation Popup Dialog
 */
function xows_gui_wnd_exit_mbox_open()
{
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(XOWS_STYL_WRN, "Disconnect", "Do you really want to disconnect current session ?",
                     xows_gui_wnd_exit_mbox_onvalid, "Yes",
                     xows_gui_wnd_exit_mbox_onabort, "No",
                     true);
}

/* ---------------------------------------------------------------------------
 *
 * Notification Badges
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Notification Badges - Application Tabs
 * ---------------------------------------------------------------------------*/
/**
 * Updates unread notification spots of the Application Tabs according
 * current state.
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

/* ---------------------------------------------------------------------------
 * Notification Badges - Roster's spots
 * ---------------------------------------------------------------------------*/
/**
 * Adds (and increase count of) unread messages for the specified Peer
 *
 * This show a red spot (with count of unread messages) on the corresponding
 * Contact element in Roster.
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
 * Toggles ringing and missed call (incoming Media Call) notification
 * for the specified Peer.
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
 * Clears unread message and ringing notification for the specified Peer.
 *
 * This removes notification spots from the corresponding Contact element
 * in Roster and reset count of unread messages.
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

/* ---------------------------------------------------------------------------
 * Notification Badges - In-Call (Buzy) Badge
 * ---------------------------------------------------------------------------*/
/**
 * Toggles the In-Call badge for the specified Peer.
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

/* ---------------------------------------------------------------------------
 *
 * Application Tabs
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles Application Tabs click events.
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
 * Selects the specified Application Tab
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

/* ---------------------------------------------------------------------------
 *
 * User Account visual feedback
 *
 * ---------------------------------------------------------------------------*/
/**
 * Storage for previous Self update (to make selective updates)
 */
const xows_gui_self_prev = {name:null,addr:null,avat:null,stat:null};

/**
 * Updates user (own) account related GUI elements according current
 * state.
 *
 * This updates user (own) nickname, avatar, show level and status accross
 * all GUI elements (including Peer's chat interfaces).
 *
 * @param   {object}    self      User Peer object
 */
function xows_gui_self_onpush(self)
{
  // Update User Panel
  xows_doc("self_show").dataset.show = self.show;
  xows_doc("self_meta").innerText = self.stat;

  // Update User Presence-Menu
  const drop_self = xows_doc("drop_self");
  drop_self.querySelector("PEER-ADDR").innerText = self.addr;
  drop_self.querySelector("PEER-META").innerText = self.stat;

  // Selective update for Avatar or Name changed
  if(xows_gui_self_prev.avat !== self.avat || xows_gui_self_prev.name !== self.name) {

    // Create new Avatar CSS class
    const avat_cls = xows_tpl_spawn_avat_cls(self); //< Add avatar CSS class

    // Update User Panel
    xows_doc("self_avat").className = avat_cls;
    xows_doc("self_name").innerText = self.name;

    // Update User Presence-Menu
    drop_self.querySelector("PEER-AVAT").className = avat_cls;
    drop_self.querySelector("PEER-NAME").innerText = self.name;

    // Update all opened chat history
    for(let i = 0; i < xows_cli_cont.length; ++i)
      if(xows_cli_cont[i].live)
        xows_gui_hist_update(xows_cli_cont[i], self);

    for(let i = 0; i < xows_cli_room.length; ++i)
      if(xows_cli_room[i].live)
        xows_gui_hist_update(xows_cli_room[i], self);
  }

  // Copy self object to be later compared (to make selective updates)
  Object.assign(xows_gui_self_prev, self);
}

/* ---------------------------------------------------------------------------
 *
 * User Panel
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles User Panel click events.
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_self_fram_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(event.target.id === "self_acct") {
    // Open user porfile page
    xows_gui_page_acct_open();
    return; //< Do NOT open menu
  }

  if(event.target.closest("#self_bttn")) {
    // Open user show/presence level menu
    xows_doc_menu_toggle(xows_doc("self_bttn"), "drop_self",
                         xows_gui_self_menu_onclick);
  }
}

/* ---------------------------------------------------------------------------
 * User Panel - Presence/Profile menu
 * ---------------------------------------------------------------------------*/
/**
 * Handles User Presence-Menu click events.
 *
 * @param   {object}    event     Event object
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

/* ---------------------------------------------------------------------------
 * User Panel - Presence Status Input-Dialog
 * ---------------------------------------------------------------------------*/
/**
 * Handles User (own) Status Input Dialog validation (click on Valid button)
 *
 * @param   {string}    value     Input content
 */
function xows_gui_self_stat_ibox_onvalid(value)
{
  // If changed, inform of the new status
  if(value !== xows_cli_self.stat)
    xows_cli_pres_stat_set(value);

  return true;
}

/**
 * Handles User (own) Status Input Dialog character input events
 *
 * @param   {string}    value     Input content
 */
function xows_gui_self_stat_ibox_oninput(value)
{
  // Dummy function to allow to set empty status
}

/**
 * Opens User (own) Status Input Dialog
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

/* ---------------------------------------------------------------------------
 *
 * Chat Frame Interaction
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles Chat-Frame header click events
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_chat_head_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  switch(event.target.id)
  {
  case "chat_menu":
    //xows_gui_muc_room_menu_open(xows_gui_peer);
    // Open Room Options menu
    xows_doc_menu_toggle(event.target, "drop_room",
                         xows_gui_muc_room_menu_onclick,
                         xows_gui_muc_room_menu_onshow,
                         xows_gui_muc_room_menu_onclose);
    break;
  case "chat_bkad":
    // Open confirmation dialog
    xows_gui_muc_bkad_mbox_open(xows_gui_peer);
    break;
  case "chat_bkrm":
    // Open confirmation dialog
    xows_gui_muc_bkrm_mbox_open(xows_gui_peer);
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

/* ---------------------------------------------------------------------------
 *
 * File-Upload Interaction
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles File-Upload progression dialog click events
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_upld_onclick(event)
{
  if(event.target.id === "upld_exit")
    xows_gui_upld_close(xows_gui_peer);
}

/**
 * Closes File-Upload progression dialog.
 *
 * If an upload is currently processing, it is aborted.
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
 * Starts new File-Upload and opens progression dialog.
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
    xows_gui_hist_scrl_down(peer, false);

  // Send upload query
  xows_cli_upld_query(peer, file);
}

/**
 * Handles File-Upload progression events (forwarded from CLI Module)
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
 * Handles File Upload finished events (forwarded from CLI Module)
 *
 * The upload may finish on success, error or abort.
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
    // Send a message to current selected contact with URL as
    // body and Out Of Band Data
    xows_cli_msg_send(peer, data, null, null, null, data);
    break;

  default: //< XOWS_UPLD_ABRT
    xows_log(1,"gui_upld_onload","upload aborted");
    // Do nothing
    break;
  }

  // Close upload dialog
  xows_gui_upld_close(peer);
}

/* ---------------------------------------------------------------------------
 *
 * Contextual Pages
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Contextual Pages - Connection (wait) Page
 * ---------------------------------------------------------------------------*/
/**
 * Handles Connection (wait) Page click events
 *
 * @param   {element}   target    Event target Element
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
 * Opens the Connection (wait) Page.
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

/* ---------------------------------------------------------------------------
 * Contextual Pages - User Login (auth) Page
 * ---------------------------------------------------------------------------*/
/**
 * Handles User Login (auth) Page character input events
 *
 * @param   {element}   target    Event target Element
 */
function xows_gui_page_auth_oninput(target)
{
  // Enable or disable connect button
  xows_doc("auth_cnct").disabled = !(xows_doc("auth_user").value.length &&
                                     xows_doc("auth_pass").value.length);
}

/**
 * Handles User Login (auth) Page click events
 *
 * @param   {element}   target    Event target Element
 */
function xows_gui_page_auth_onclick(target)
{
  if(target.id === "auth_cnct") { //< Submit button

    if(!xows_doc("auth_cnct").disabled) {

      const user = xows_doc("auth_user").value.toLowerCase();
      const pass = xows_doc("auth_pass").value;
      const save = xows_doc("auth_save").checked;

      // erase password from intput
      xows_doc("auth_pass").value = "";

      // Try connect and login
      xows_gui_connect(user, pass, save, false);
    }

    return;
  }

  if(target.id === "auth_regi") //< Link for register new user
    xows_gui_page_regi_open(); //< display register screen
}

/**
 * Opens User Login (auth) Page
 */
function xows_gui_page_auth_open()
{
  // Reset inputs
  xows_doc("auth_user").value = xows_gui_auth ? xows_gui_auth.user : "";
  xows_doc("auth_pass").value = xows_gui_auth ? xows_gui_auth.pass : "";

  // Show or hide the automatic connection check box
  let auto_login = xows_gui_cred_support() || xows_options.login_sasl_store;
  xows_doc_show("auth_auto", auto_login);

  // Enable or disable connect button
  xows_doc("auth_cnct").disabled = !(xows_doc("auth_user").value.length &&
                                     xows_doc("auth_pass").value.length);

  // Show or hide register link
  xows_doc("auth_regi").hidden = !xows_options.gui_allow_register;

  // Open dialog page
  xows_doc_page_open("page_auth", false, null,
                     xows_gui_page_auth_oninput,
                     xows_gui_page_auth_onclick);
}

/* ---------------------------------------------------------------------------
 * Contextual Pages - User Register (regi) Page
 * ---------------------------------------------------------------------------*/
/**
 * Handles User Register (regi) Page character input events
 *
 * @param   {element}   target    Event target Element
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
 * Handles User Register (regi) Page click events
 *
 * @param   {element}   target    Event target Element
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

      const user = xows_doc("regi_user").value;
      const pass = xows_doc("regi_pass").value;

      if(!xows_cli_isnodeprep(user)) {
        xows_doc_popu_open(XOWS_STYL_WRN,"Username contains illegal character: '\"&;<>/:@");
        return;
      }

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
 * Opens User Register (regi) Page
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

/* ---------------------------------------------------------------------------
 * Contextual Pages - User Profile (user) Page
 * ---------------------------------------------------------------------------*/
/**
 * Handles User Profile (user) Page abortion (click on Popup Dialog Abort
 * button)
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
 * Handles User Profile (user) Page validation (click on Popup Dialog Valid
 * button)
 */
function xows_gui_page_user_onvalid()
{
  // Update user profile
  xows_cli_self_edit(xows_doc("user_name").value,
                     xows_doc("user_avat").data,
                     xows_doc("user_accs").checked?"open":"presence");
}

/**
 * Handles User Profile (user) Page character input events
 *
 * @param   {element}   target    Event target Element
 */
function xows_gui_page_user_oninput(target)
{
  let changed;

  switch(target.id)
  {
  case "user_accs": //< Checkbox for Data in open access
    changed = !xows_doc("user_accs").checked; break;
  case "user_name": //< Nickname input text field
    changed = (xows_doc("user_name").value !== xows_cli_self.name);
  }

  // Open Message Box dialog
  if(changed) xows_doc_popu_open_for_save(xows_gui_page_user_onvalid,
                                          xows_gui_page_user_onabort);
}

/**
 * Handles User Profile (user) Page click events
 *
 * @param   {element}   target    Event target Element
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
 * Handles User Profile (user) Page file element change events
 *
 * @param   {object}    event     Event object
 */
function xows_gui_page_user_onfile(event)
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
 * Handles User Profile (user) Page Close (user closed the page)
 */
function xows_gui_page_user_onclose()
{
  // remove "change" event listener to file input
  xows_doc_listener_rem(xows_doc("user_file"),"change",xows_gui_page_user_onfile);
}

/**
 * Opens User Profile (user) Page
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
  xows_doc_listener_add(xows_doc("user_file"),"change",xows_gui_page_user_onfile);
}


/* ---------------------------------------------------------------------------
 * Contextual Pages - Account Options (acct) Page
 * ---------------------------------------------------------------------------*/
/**
 * Handles Account Options (acct) Page abortion (click on Popup-Dialog Abort
 * button)
 *
 * (placeholder, not yet used)
 */
//function xows_gui_page_acct_onabort() {}

/**
 * Handles Account Options (acct) Page validation (click on Popup-Dialog Valid
 * button)
 *
 * (placeholder, not yet used)
 */
//function xows_gui_page_acct_onvalid() {}

/**
 * Handles Account Options (acct) Page character input events
 *
 * @param   {element}   target    Event target Element
 */
function xows_gui_page_acct_oninput(target)
{
  const acct_pass = xows_doc("acct_pass");
  const acct_pnew = xows_doc("acct_pnew");
  const acct_pcnf = xows_doc("acct_pcnf");

  xows_doc("acct_bt_pass").disabled = (!acct_pass.value || !acct_pnew.value || !acct_pcnf.value);
}

/**
 * Handles Account Options (acct) Page password change result
 *
 * This handles resceived password change query result to show the proper
 * success or error messages.
 *
 * @param   {string}    type    Result type ("result" or "error")
 * @param   {object}    error   Error data if any
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
 * Handles Account Options (acct) Page click events
 *
 * @param   {element}   target    Event target Element
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
 * Handles Account Options (acct) Page Close (user closed the page)
 */
function xows_gui_page_acct_onclose() {}

/**
 * Opens Account Options (acct) Page
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

/* ---------------------------------------------------------------------------
 * Account Deletion Message-Dialog (Account Options (acct) Page)
 * ---------------------------------------------------------------------------*/
/**
 * Handles Account Deletion Message-Dialog abortion (click on Abort button)
 *
 * (Dummy function, required to show 'Abort' button)
 */
function xows_gui_acct_unrg_mbox_onabort() {}

/**
 * Handles Account Deletion Message-Dialog validation (click on Valid button)
 */
function xows_gui_acct_unrg_mbox_onvalid()
{
  xows_cli_regi_remove(null, null, null);
}

/**
 * Opens Account Deletion Message-Dialog
 */
function xows_gui_acct_unrg_mbox_open()
{
  // Open Message Dialog-Box
  xows_doc_mbox_open(XOWS_STYL_ASK, "Account deletion",
                     "Are you sure you want to delete your XMPP/Jabber account on this server ? This action cannot be reversed.",
                     xows_gui_acct_unrg_mbox_onvalid, "Yes, farewell",
                     xows_gui_acct_unrg_mbox_onabort, "God damn, NO !");
}

/* ---------------------------------------------------------------------------
 *
 * Contact Profile Popup
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles Contact Profile Popup click events
 *
 * This only handle click on "Subscribe" button if present.
 *
 * @param   {object}    peer      Peer object
 * @param   {element}   target    Event target Element
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
 * Opens Contact Profile Popup
 *
 * @param   {object}   peer    Peer object (Occupant or Contact to show)
 */
function xows_gui_prof_open(peer)
{
  // Open Contact Profile popup
  xows_doc_prof_open(peer, xows_gui_prof_onclick);
}
