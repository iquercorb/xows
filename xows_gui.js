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
 * Maximum count of message per history
 */
const XOWS_GUI_HIST_SIZE = 55; //< Size of the history "window"

/**
 * Current selected GUI locale code.
 */
let xows_gui_locale = "en-US";

/**
 * Object to temporarly store login user and password
 */
let xows_gui_auth = null;

/**
 * JID of the currently selected peer (room or contact) in Roster.
 */
let xows_gui_peer = null;

/**
 * Reference to notification sound.
 */
let xows_gui_notify_sound = null;

/**
 * Current state of browser focus.
 */
let xows_gui_has_focus = true;

/**
 * Indicate the DOM is in its default state
 */
let xows_gui_clean = true;

/**
 * Object that stores saved scroll values.
 */
const xows_gui_peer_scroll_db = {};

/**
 * Save the main chat scroll and client values for the specified peer.
 * 
 * @param {string}  peer      Peer to save scroll value.
 */
function xows_gui_peer_scroll_save(peer)
{
  if(!xows_gui_peer_scroll_db[peer.bare]) 
    xows_gui_peer_scroll_db[peer.bare] = {};
    
  xows_gui_peer_scroll_db[peer.bare] = {
    "scrollTop"  : xows_doc.chat_main.scrollTop,
    "scrollHeight"  : xows_doc.chat_main.scrollHeight,
    "clientHeight"  : xows_doc.chat_main.clientHeight
  };
}

/**
 * Restore the saved main chat scroll top position of the specified peer.
 * 
 * @param {string}  peer      Peer to restore scroll value.
 */
function xows_gui_peer_scroll_load(peer)
{
  if(peer.bare in xows_gui_peer_scroll_db) 
    xows_doc.chat_main.scrollTop = xows_gui_peer_scroll_db[peer.bare].scrollTop;
}

/**
 * Get the main chat scroll top position corresponding to the given
 * Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_top(peer)
{
  return (peer !== xows_gui_peer) ? 
          xows_gui_peer_scroll_db[peer.bare].scrollTop :
          xows_doc.chat_main.scrollTop;
}

/**
 * Get the main chat scroll bottom relative position corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_bot(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;
  
  return ((obj.scrollHeight - obj.scrollTop) - obj.clientHeight);
}

/**
 * Get the main chat scroll offset to top corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_off(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;
            
  return (obj.scrollHeight - obj.scrollTop);  
}

/**
 * Move to bottom the main chat scroll corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param {string}  peer      Peer to get scroll value.
 */
function xows_gui_peer_scroll_down(peer)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;

  obj.scrollTop = obj.scrollHeight;
}

/**
 * Move by offset the main chat scroll corresponding 
 * to the given Peer. 
 * 
 * If the specified Peer history is offscree, the function
 * return the last saved scroll values.
 * 
 * @param {string}  peer      Peer to get scroll value.
 * @param {string}  offset    Offset value to move the scroll.
 */
function xows_gui_peer_scroll_seek(peer, offset)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;

  obj.scrollTop = obj.scrollHeight - offset;
}

/**
 * Constant for initial offscreen slot identifier
 */
const XOWS_GUI_FRAG_INIT = "NULL";

/**
 * Create new Peer offscreen slot using initial DOM elements
 * 
 * @param {string}  peer      Peer object to initialize offscreen for.
 */
function xows_gui_peer_doc_init(peer)
{
  // clone elements from initial offscreen slot
  xows_doc_frag_clone(peer.bare, XOWS_GUI_FRAG_INIT, "chat_head");
  xows_doc_frag_clone(peer.bare, XOWS_GUI_FRAG_INIT, "chat_hist");
  xows_doc_frag_clone(peer.bare, XOWS_GUI_FRAG_INIT, "chat_panl");
  xows_doc_frag_clone(peer.bare, XOWS_GUI_FRAG_INIT, "occu_list");
  
  const is_room = (peer.type === XOWS_PEER_ROOM);
  
   // set chat title bar informations
  const chat_show = xows_doc_frag_element_find(peer.bare,"chat_head","chat_show");
  const chat_addr = xows_doc_frag_element_find(peer.bare,"chat_head","chat_addr");
  const chat_meta = xows_doc_frag_element_find(peer.bare,"chat_head","chat_meta");
  const chat_book = xows_doc_frag_element_find(peer.bare,"chat_head","chat_book");

  xows_doc_frag_element_find(peer.bare,"chat_head","chat_titl").innerText = peer.name;

  chat_show.classList.toggle("HIDDEN",is_room);
  chat_addr.classList.toggle("HIDDEN",is_room);
  xows_doc_frag_element_find(peer.bare,"chat_head","chat_occu").classList.toggle("HIDDEN",!is_room);

  if(is_room) {                               //< XOWS_PEER_ROOM
    chat_meta.innerText = peer.subj;
    // Cannot bookmark public rooms or already bookmarked
    chat_book.classList.toggle("HIDDEN", (peer.book || peer.publ));
  } else {                                    //< XOWS_PEER_CONT
    chat_meta.innerText = peer.stat ? peer.stat : "";
    chat_show.setAttribute("show", peer.show);
    chat_addr.innerText = "("+peer.bare+")";
    chat_book.classList.add("HIDDEN");
  }

  // set chat editor placeholder
  const edit_mesg = xows_doc_frag_element_find(peer.bare,"chat_panl","edit_mesg");
  edit_mesg.setAttribute("placeholder",xows_l10n_get("Send a message to")+" "+peer.name+" ...");
  
  // set notification button
  xows_gui_chat_noti_update(peer);
}

/**
 * Move and store current document Peer elements to offscreen
 * 
 * @param {string}  peer      Peer object.
 */
function xows_gui_peer_doc_export(peer)
{
  // export document elements to offscreen fragment
  xows_doc_frag_export(peer.bare, "chat_head");
  xows_doc_frag_export(peer.bare, "chat_hist");
  xows_doc_frag_export(peer.bare, "chat_panl");
  xows_doc_frag_export(peer.bare, "occu_list");
}

/**
 * Bring back saved Peer offscreen elements to current document
 * 
 * @param {string}  peer      Peer object or null to set initial.
 */
function xows_gui_peer_doc_import(peer)
{
  if(peer) {
    // import document elements from offscreen fragment
    xows_doc_frag_import(peer.bare, "occu_list");
    xows_doc_frag_import(peer.bare, "chat_panl");
    xows_doc_frag_import(peer.bare, "chat_hist");
    xows_doc_frag_import(peer.bare, "chat_head");
  } else {
    // restore (clone) from initial (empty) document elements
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_head", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_hist", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "chat_panl", true);
    xows_doc_frag_import(XOWS_GUI_FRAG_INIT, "occu_list", true);
  }
}

/**
 * Get Peer related element by id, either in current document or in 
 * offscreen fragment.
 * 
 * @param {object}  peer  Peer object.
 * @param {string}  id    Element id.
 * 
 * @return  {object}  Element or null if not found.
 */
function xows_gui_peer_doc(peer, id)
{
  return (peer === xows_gui_peer) ? document.getElementById(id) : 
                                    xows_doc_frag_find(peer.bare,id);
}

/**
 * Remove roster <li> element corresponding to specified JID.
 * 
 * @param {string}      jid    Peer JID to search roster <li>.
 */
function xows_gui_rost_li_remove(jid)
{
  const li = document.getElementById(jid);
  if(li) li.parentNode.removeChild(li);
}

/**
 * Find occupant <li> element corresponding to specified Occupant JID.
 * 
 * @param {object}    room      Room object.
 * @param {string}    jid       Occupant JID to search.
 */
function xows_gui_peer_occu_li(room, jid)
{
  if(room === xows_gui_peer) {
    return document.getElementById(jid);
  } else {
    return xows_doc_frag_element_find(room.bare,"occu_list",jid);
  }
}

/**
 * Find history message <li> element corresponding to specified ID.
 * 
 * @param {object}    peer      Peer object.
 * @param {string}    id        Message id.
 */
function xows_gui_peer_mesg_li(peer, id)
{
  if(peer === xows_gui_peer) {
    return document.getElementById(id);
  } else {
    return xows_doc_frag_element_find(peer.bare,"chat_hist",id);
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
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT, "occu_list", true);
  
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
 * @param {boolean} register  Register new account.
 */
function xows_gui_connect(register = false)
{
  // Close message box
  xows_doc_mbox_close();

  // Append domain if the option is set, otherwise it should be
  // set in the usename as typed by user.
  if(xows_options.domain) 
    xows_gui_auth.user += "@"+xows_options.domain;
                    
  // Configure client callbacks
  xows_cli_set_callback("connect", xows_gui_cli_onconnect);
  xows_cli_set_callback("selfchange", xows_gui_cli_onselfchange);
  xows_cli_set_callback("contpush", xows_gui_cli_oncontpush);
  xows_cli_set_callback("contrem", xows_gui_cli_oncontrem);
  xows_cli_set_callback("subspush", xows_gui_cli_onsubspush);
  xows_cli_set_callback("subsrem", xows_gui_cli_onsubsrem);
  xows_cli_set_callback("roompush", xows_gui_cli_onroompush);
  xows_cli_set_callback("roomrem", xows_gui_cli_onroomrem);
  xows_cli_set_callback("occupush", xows_gui_cli_onoccupush);
  xows_cli_set_callback("occurem", xows_gui_cli_onoccurem);
  xows_cli_set_callback("message", xows_gui_cli_onmessage);
  xows_cli_set_callback("chatstate", xows_gui_cli_onchatstate);
  xows_cli_set_callback("receipt", xows_gui_cli_onreceipt);
  xows_cli_set_callback("subject", xows_gui_cli_onsubject);
  xows_cli_set_callback("error", xows_gui_cli_onerror);
  xows_cli_set_callback("close", xows_gui_cli_onclose);

  // From now the DOM is no longer in its default state
  xows_gui_clean = false;
  
  // Launch the client connection
  xows_cli_connect( xows_options.url, 
                    xows_gui_auth.user,
                    xows_gui_auth.pass,
                    register);
}

/**
 * Function to handle client login success and ready.
 * 
 * @param {object}  user    User object.
 */
function xows_gui_cli_onconnect(user)
{ 
  // Check whether user asked to remember
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
            
  // Open main 'screen'
  xows_gui_main_open();
  
  // widen roster panel (only in narrow-screen)
  xows_gui_rost_widen();
  
  // Reset the Roster and Chat window
  xows_gui_peer = null;
  // Setup the lazy loader
  xows_doc_loader_setup(xows_doc.chat_main, "lazy_src");
  // Check whether file Upload is available
  if(xows_cli_svc_exist(XOWS_NS_HTTPUPLOAD)) {
    xows_doc.edit_upld.disabled = false;
    // Add embeded download matching http upload service domain
    xows_tpl_embed_add_upld(xows_cli_svc_url[XOWS_NS_HTTPUPLOAD]);
  }
  // Check whether MUC service is available
  if(xows_cli_svc_exist(XOWS_NS_MUC)) {
    xows_doc.tab_room.disabled = false;
    //xows_doc.tab_book.disabled = false; /* alternative Bookmarks implementation */
  }
  
  // Set the presence menu for current user
  //xows_gui_cli_onselfchange(user);
  
  // Refresh public room list
  xows_gui_room_list_reload();
}

/**
 * Function to disconnect.
 */
function xows_gui_disconnect()
{
  xows_log(2,"gui_disconnect","prepare to disconnect");
  
  // Send chat state to notify current user
  if(xows_gui_peer) 
    xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_GONE);

  // Disconnect client
  xows_cli_disconnect();
}

/**
 * Handle client connexion closed. 
 * 
 * @parma {number}  code    Signal code for closing.
 * @param {string}  [mesg]  Optional information or error message.
 */
function xows_gui_cli_onclose(code, mesg)
{
  // Present reset GUI multiple times
  if(!xows_gui_clean) {
    
    // reset GUI
    xows_gui_reset();
    
    // Display Login page
    xows_gui_page_auth_open();
  }
  
  // If message, display info popup
  if(mesg) {
    // Display popup message
    xows_doc_mbox_open(code, mesg);
  }
}

/**
 * Handle client incomming error.
 *  
 * @parma {number}  code    Signal code for message (error or warning).
 * @param {string}  mesg    Warning or error message.
 */
function xows_gui_cli_onerror(code, mesg)
{ 
  // Display popup error message
  xows_doc_mbox_open(code, mesg);
}

/* -------------------------------------------------------------------
 * 
 * Browser Window - Navigation history emulation
 * 
 * -------------------------------------------------------------------*/
 
/**
 * Navigation history stack to supersed browser history
 */
const xows_gui_nav_stack = [];

/**
 * Navigation history lock, to prevent new entry while back
 */
let xows_gui_nav_lock = false;

/**
 * Navigation history last popstate index
 */
let xows_gui_nav_pos = 0;

/**
 * Push item browser navigation history stack.
 */
function xows_gui_nav_push(page, func, ...args) 
{
  if(xows_gui_nav_lock || !xows_cli_connected())
    return;

  // Check whether current nav position is back compared to stack size
  if(xows_gui_nav_pos < xows_gui_nav_stack.length) {
    // user did some back, then started a new path, we erase the saved 
    // history from the current position and go ahead.
    xows_gui_nav_stack.splice(xows_gui_nav_pos+1);
  }
  // we take current stack length to reteive later
  const pos = xows_gui_nav_stack.length;
  // add nav history to browser
  history.pushState({"pos":pos,"page":page}, "", window.location.pathname+"#"+page);
  // store nav function and argument to be restored in case
  xows_gui_nav_stack.push({"func":func,"args":[...args]});
  // increment current nav position
  xows_gui_nav_pos++;
}

/**
 * Process Browser navigation history back
 */
function xows_gui_nav_onpopstate(event)
{
  if(event.state) {

    // get nav position from poped state by browser
    const pos = event.state.pos;
    // retreive corresponding saved nav data
    const nav = xows_gui_nav_stack[pos];

    if(nav && nav.func) {
      // proceed to history back or forward
      xows_gui_nav_lock = true;   //< prevent history push
      nav.func(...nav.args);    //< call function to open page/screen
      xows_gui_nav_lock = false;  //< can now push history
      // keep track of the current position in history
      xows_gui_nav_pos = pos;
      return; //< return now
    }
  }
  
  // Arriving here mean history is out
  if(xows_cli_connected() && !xows_doc_mbox_modal()) {
    // prevent to go back
    history.forward();
    // open confirmation dialog
    xows_gui_mbox_exit_open();
  }
}

/* -------------------------------------------------------------------
 * 
 * Browser Window - Events Handling
 * 
 * -------------------------------------------------------------------*/

/**
 * Handle the client/Web page focus change.
 */
function xows_gui_wnd_onfocus()
{
  const old_focus = xows_gui_has_focus;
  xows_gui_has_focus = document.hasFocus();
  
  // Wakeup client activity
  if(xows_gui_has_focus && !old_focus)
    xows_cli_activity_wakeup();
}

/**
 * Callback function to handle user close or exit web page
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_wnd_onunload(event)
{
  xows_log(2,"gui_evt_unload","Unload event from browser");
  xows_gui_disconnect();
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
 * @param {string}  permit   Received permission
 */
function xows_gui_notify_query_handle(permit)
{
  // update notify button for all opened peers
  let peer;
  for(const bare in xows_doc_frag_db) {
    peer = xows_cli_peer_get(bare);
    if(peer) xows_gui_chat_noti_update(peer); //< update notify button
  }

  // If user allowed notifications, then enable
  if(permit === "granted") {
    // Send an reset awaiting notification
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
 * @param   {string}    status  Permission status string to test.
 * 
 * @return  {boolean}   True if permission status matches, false otherwise.
 */
function xows_gui_notify_permi(status)
{
  return (Notification.permission === status);
}
  
/**
 * Pop a new browser Notification
 * 
 * @param {object}  peer    Peer object.
 * @param {string}  body    Notification body (message body).
 */
function xows_gui_notify_push(peer, body)
{
  xows_log(1,"gui_notify_push", peer.name, Notification.permission);

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
      xows_gui_notify_sound.play();
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
 * Main Interactive Elements
 * 
 * -------------------------------------------------------------------*/

/**
 * Reset the GUI to its initial state
 */
function xows_gui_reset()
{
  xows_log(2,"gui_reset","reset DOM states");
  
  // close any opened page or overlay element
  xows_doc_page_close(true);
  xows_doc_menu_close();
  xows_doc_view_close();
  xows_doc_mbox_close();
  
  // hide all screens
  xows_doc_hide("scr_page");
  xows_doc_hide("scr_main");
  
  // Reset Peer related elements
  xows_gui_switch_peer(null);
  
  // Reset chat editor
  xows_doc_cls_add("edit_mesg", "PLACEHOLD");
  xows_doc.edit_mesg.innerText = "";

  // clean roster lists
  xows_doc_list_clean("subs_ul");
  xows_doc_list_clean("cont_ul");
  xows_doc_list_clean("book_ul");
  xows_doc_list_clean("room_ul");
  xows_doc_list_clean("priv_ul");
  
  // clean user frame
  xows_doc.user_show.setAttribute("show",XOWS_SHOW_OFF);
  xows_doc.user_name.innerText = "";
  xows_doc.user_addr.innerText = "";
  xows_doc.user_stat.value = "";
  xows_doc.user_avat.className = "";
  
  // Reset roster tabs
  xows_gui_rost_switch("tab_cont");
  xows_doc.room_unrd.innerText = "";
  xows_doc_hide("room_unrd");
  xows_doc.cont_unrd.innerText = "";
  xows_doc_hide("cont_unrd");
  
  // Reset columns setup
  xows_doc_cls_rem("main_wrap", "COLR-WIDE");
  xows_doc_cls_rem("main_wrap", "COLL-WIDE");
  xows_doc_cls_add("main_colr", "COL-HIDE");
    
  // Clear all offscreen elements
  xows_doc_frag_clear();
  
  // Create intial offscreen slot from current document
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_head",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_hist",true);
  xows_doc_frag_export(XOWS_GUI_FRAG_INIT,"chat_panl",true);
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
 * Switch the current active chat contact.
 * 
 * @param {string}  jid   Peer JID to select.
 */
function xows_gui_switch_peer(jid)
{
  // Get previous (current) contact
  const prev = xows_gui_peer;
  
  if(prev) {
    // Do no switch to same contact
    if(jid === prev.bare) return;
    // Send chat state to notify current user
    xows_cli_chatstate_set(prev, XOWS_CHAT_GONE);
    // Abort any uploading file
    xows_gui_upld_onclose();
  }
  // Get the next (to be selected) contact
  const next = jid ? xows_cli_peer_get(jid) : null;
  
  if(prev) {
    // Save current history scroll position
    xows_gui_peer_scroll_save(prev);
    // export document elements to offscreen fragment
    xows_gui_peer_doc_export(prev);
    // Remove "selected" class from <li> element
    if(next) {
      if(next.type === prev.type) {
        document.getElementById(prev.bare).classList.remove("SELECTED");
      }
    }
  }
  
  // If next contact is valid, show the chat <div>
  (next === null) ? xows_doc_hide("chat_fram") 
                  : xows_doc_show("chat_fram");

  // flag to push navigation history
  let push_nav = false;
  
  if(next) {
    // Add highlight class to new <li> element
    document.getElementById(next.bare).classList.add("SELECTED");
    // Bring back Peer document elements from offscreen
    xows_gui_peer_doc_import(next);
    // Restore history scroll position
    xows_gui_peer_scroll_load(next);
    // Open or close right panel
    xows_doc_cls_set("main_colr", "COL-HIDE", (next.type !== XOWS_PEER_ROOM));
    // Set the current contact
    xows_gui_peer = next;
    if(next.type === XOWS_PEER_ROOM) {
      // Join the room if required
      if(!next.join) xows_cli_room_join(next);
    }
    // Clear contact unread notification for next peer
    xows_gui_unread_reset(next);
    // Reset the lazy loader and force update
    xows_doc_loader_clear();
    xows_doc_loader_monitor(xows_doc.chat_main);
    xows_doc_loader_check(true);
    // Check whether we should query some archived messages for this contact
    if(xows_doc.hist_ul.childNodes.length < 40) 
      xows_gui_mam_query(false, 40, 0);
    // If scroll is almost bottom, force it to bottom, because the 
    // browser seem to add some offset dans I don't want to spend houres
    // understanding why and how to prevent it...
    if(xows_gui_peer_scroll_bot(next) < 50) 
      xows_gui_peer_scroll_down(next);
    xows_log(2,"gui_switch_peer","peer \""+next.bare+"\"","selected");
    push_nav = true; //< we can push nav
  } else {
    if(xows_gui_peer) {
      xows_log(2,"gui_switch_peer","unselect peer");
      // Set the current contact
      xows_gui_peer = null;
      // Bring back initial document elements from offscreen
      xows_gui_peer_doc_import(null);
      // Close right panel
      xows_doc_cls_add("main_colr", "COL-HIDE");
      push_nav = true; //< we can push nav
    }
  }

  // push navigation history
  if(push_nav) 
    xows_gui_nav_push("switch_peer", xows_gui_switch_peer, jid);
}

/**
 * Main Screen close all side panel.
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

  // Add navigation history
  xows_gui_nav_push("main_open", xows_gui_main_open);
}

/* -------------------------------------------------------------------
 * 
 * Main Screen - Message Box
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Message Box - Disconnect confirmation dialog
 * -------------------------------------------------------------------*/
/**
 * Disconnect Confirmation message box on-abort callback function.
 */
function xows_gui_mbox_exit_onabort()
{
  //... dummy function
}

/**
 * Disconnect Confirmation message box on-valid callback function.
 */
function xows_gui_mbox_exit_onvalid()
{
  // Disconnect 
  xows_gui_disconnect();
  
  // Back nav history
  history.back();
}

/**
 * Disconnect Confirmation message box open.
 */
function xows_gui_mbox_exit_open()
{
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(XOWS_MBOX_WRN, "Do you really want to disconnect current session ?",
                        xows_gui_mbox_exit_onvalid, "Yes",
                        xows_gui_mbox_exit_onabort, "No",
                        true);
}

/* -------------------------------------------------------------------
 * Main screen - Message Box - Contact Subscription Add/Rem
 * -------------------------------------------------------------------*/
 
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_subs_edit = {};

/**
 * Contact (subscription) Add/Remove message box on-abort callback function.
 */
function xows_gui_mbox_subs_edit_onabort()
{
  xows_gui_mbox_subs_edit.bare = null;
  xows_gui_mbox_subs_edit.name = null;
}

/**
 * Contact (subscription) Add/Remove message box on-valid callback function.
 */
function xows_gui_mbox_subs_edit_onvalid()
{
  // query contact add/remove
  xows_cli_rost_edit(xows_gui_mbox_subs_edit.bare, 
                       xows_gui_mbox_subs_edit.name);
                       
  xows_gui_mbox_subs_edit.bare = null;
  xows_gui_mbox_subs_edit.name = null;
}

/**
 * Contact (subscription) Add/Remove message box open.
 * 
 * @param {string}  bare  Supplied JID address to add or remove.
 * @param {string}  name  Contact default name in case of contact add.
 */
function xows_gui_mbox_subs_edit_open(bare, name)
{
  // Store JID of contact to remove
  xows_gui_mbox_subs_edit.bare = bare;

  let mesg, style;
  
  // If name is defined, this mean this is for Contact add
  if(name) {
    xows_gui_mbox_subs_edit.name = name;
    style = XOWS_MBOX_ASK;
    mesg = "Add contact and request authorisation ?";
  } else {
    style = XOWS_MBOX_WRN;
    mesg = "Remove contact and revoke authorization ?";
  }
  
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(style, mesg,
                        xows_gui_mbox_subs_edit_onvalid, "OK",
                        xows_gui_mbox_subs_edit_onabort, "Cancel",
                        true);
}

/* -------------------------------------------------------------------
 * Main screen - Message Box - Contact Subscription Allow/Deny
 * -------------------------------------------------------------------*/

/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_mbox_subs_auth = {};

/**
 * Contact Subscription Allow/Deny message box on-abort callback function.
 */
function xows_gui_mbox_subs_auth_onabort()
{
  // deny contact subscribe
  xows_cli_subscribe_allow(xows_gui_mbox_subs_auth.bare, false);
  xows_gui_mbox_subs_auth.bare = null;
  xows_gui_mbox_subs_auth.name = null;
}

/**
 * Contact Subscription Allow/Deny message box on-valid callback function.
 */
function xows_gui_mbox_subs_auth_onvalid()
{
  // allow contact subscribe
  xows_cli_subscribe_allow(xows_gui_mbox_subs_auth.bare,true,xows_gui_mbox_subs_auth.name);
  xows_gui_mbox_subs_auth.bare = null;
  xows_gui_mbox_subs_auth.name = null;
}

/**
 * Contact Subscription Allow/Deny message box open.
 * 
 * @param {string}  bare  Supplied JID address to allow or deny.
 * @param {string}  name  Contact default name in case of contact allow.
 */
function xows_gui_mbox_subs_auth_open(bare, name)
{
  // Store JID and name of contact to allow/deny
  xows_gui_mbox_subs_auth.bare = bare;
  xows_gui_mbox_subs_auth.name = name;
    
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(XOWS_MBOX_ASK, "Allow contact subscription ?",
                        xows_gui_mbox_subs_auth_onvalid, "Allow",
                        xows_gui_mbox_subs_auth_onabort, "Deny",
                        true);
}

/* -------------------------------------------------------------------
 * Main screen - Message Box - Disconnect confirmation dialog
 * -------------------------------------------------------------------*/

/**
 * Object to store Page/Dialog temporary data and parameters
 */
let xows_gui_mbox_bookmark_room = null;

/**
 * Add Bookmark message box on-abort callback function.
 */
function xows_gui_mbox_bookmark_onabort()
{
  // reset parameters
  xows_gui_mbox_bookmark_room = null;
}

/**
 * Add Bookmark message box on-valid callback function.
 */
function xows_gui_mbox_bookmark_onvalid()
{
  // add bookmark
  xows_cli_book_publish(xows_gui_mbox_bookmark_room);
  xows_gui_mbox_bookmark_room = null;
}

/**
 * Add Bookmark message box open.
 * 
 * @param {object}  room  Room object to add Bookmark.
 */
function xows_gui_mbox_bookmark_open(room)
{
  // Store JID and name of contact to allow/deny
  xows_gui_mbox_bookmark_room = room;
    
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(XOWS_MBOX_ASK, "Add Room to bookmarks ?",
                        xows_gui_mbox_bookmark_onvalid, "Add Bookmark",
                        xows_gui_mbox_bookmark_onabort, "Cancel",
                        true);
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Roster
 * 
 * -------------------------------------------------------------------*/
 
/**
 * Main Screen widen Roster (right) panel.
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
      
      // Add navigation history
      xows_gui_nav_push("panel_open", xows_gui_rost_widen);
    }
  }
}

/**
 * Switch the current roster tab.
 * 
 * @param {string}  id    Tab ID to select.
 */
function xows_gui_rost_switch(id)
{
  let list, toggle = false;
  
  const tab_room = id === "tab_room";
  
  if(tab_room && !xows_doc_cls_has("tab_room","ENABLED")) {
    toggle = true;
    xows_doc.rost_titl.innerText = xows_l10n_get("Chatrooms");
    list = xows_doc.room_list;
  }
  
  const tab_cont = id === "tab_cont";
  
  if(tab_cont && !xows_doc_cls_has("tab_cont","ENABLED")) {
    toggle = true;
    xows_doc.rost_titl.innerText = xows_l10n_get("Contacts");
    list = xows_doc.cont_list;
  }

  // If nothing changed, return now
  if(!toggle)
    return;
  
  // Toggle enabled tab
  xows_doc_cls_set("tab_cont", "ENABLED", tab_cont);
  xows_doc_hidden_set("cont_list", !tab_cont);
  xows_doc_hidden_set("cont_add", !tab_cont);
  
  xows_doc_cls_set("tab_room", "ENABLED", tab_room);
  xows_doc_hidden_set("room_list", !tab_room);
  xows_doc_hidden_set("room_add", !tab_room);
  xows_doc_hidden_set("room_upd", !tab_room);
  
  // Search any SELECTED peer in the list to switch to
  let selected;
  if(list) selected = list.querySelector(".SELECTED");
  xows_gui_switch_peer(selected ? selected.id : null);
}

/**
 * Callback function to handle click event on GUI Roster Tabs <li>.
 * 
 * @param {object}  event   Event data
 */
function xows_gui_rost_tabs_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  const btn = event.target.closest("button"); 
  if(btn) xows_gui_rost_switch(btn.id);
}

/**
 * Roster Contact/Room/Subscribe List on-click callback function.
 * 
 * @param {object}  event   Event related object.
 */
function xows_gui_rost_list_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // get related <li> element where click occurred
  const li = event.target.closest("li");
  
  if(li) {
    
    // Checks whether user clicked on action button
    if(event.target.tagName === "BUTTON") {
      // Select action
      switch(event.target.name)
      {
      case "CONT_ASK": //< Request subscribe permission
        xows_cli_subscribe_request(li.id);
        xows_doc_mbox_open(XOWS_MBOX_SCS, "New authorization request was sent");
        return;
        
      case "CONT_REM": //< Remove contact
        xows_gui_mbox_subs_edit_open(li.id);
        return;
      }
    }
    
    switch(li.className)
    {
      case "ROST-SUBS": {
        // Open Subscription Allow/Deny dialog
        xows_gui_mbox_subs_auth_open(li.id, li.name);
        return;
      }

      default: {
        // Select peer
        xows_gui_switch_peer(li.id);
        // Close panel in case we are in narrow-screen with wide panel
        xows_gui_panel_close();
      }
    }
  }
}

/* -------------------------------------------------------------------
 * Main screen - Roster - Unread Notifications
 * -------------------------------------------------------------------*/
 
/**
 * Function to add and/or increase an unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param {object}  peer      Peer object, either Room or Contact.
 * @param {string}  id        Message Id (not yet used).
 */
function xows_gui_unread_add(peer, id)
{
  // Select proper element depending peer type
  const bt_spot = (peer.type === XOWS_PEER_ROOM) ? 
                              xows_doc.room_unrd : 
                              xows_doc.cont_unrd;
  
  // Add the unread for the roster tab
  let n = parseInt(bt_spot.innerText) || 0;
  bt_spot.innerText = n + 1;
  bt_spot.classList.remove("HIDDEN"); //< show
  
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    
    // Inside the <li> search for the unread <div>
    const li_spot = li.querySelector(".UNRD-SPOT");
    
    // Increase the current unread count
    n = parseInt(li_spot.innerText) || 0;
    li_spot.innerText = n + 1;
    li_spot.classList.remove("HIDDEN"); //< show
  }
}

/**
 * Function to clear any unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param {object} peer      Peer object, either Room or Contact.
 */
function xows_gui_unread_reset(peer)
{
  // Select proper element depending peer type
  const bt_spot = (peer.type === XOWS_PEER_ROOM) ? 
                              xows_doc.room_unrd : 
                              xows_doc.cont_unrd;
  
  // Store current tab total unread
  //let n = bt_spot.firstChild ? parseInt(bt_spot.innerText) : 0;
  let n = parseInt(bt_spot.innerText) || 0;
  
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    // Inside the <li> search for the unread <div>
    const li_spot = li.querySelector(".UNRD-SPOT");
    
    // Subtract the element unread from tab total
    n -= parseInt(li_spot.innerText) || 0;
    // Reset the unready div properties
    li_spot.innerText = "";
    li_spot.classList.add("HIDDEN"); //< hide
  }
  
  // Update the tab unread count, or disable it if suitable
  bt_spot.innerText = (n > 0) ? n : "";
  if(n <= 0) bt_spot.classList.add("HIDDEN"); //< hide
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Roster - Contacts List
 * 
 * -------------------------------------------------------------------*/

/**
 * Function to force query and refresh for Room list
 */
function xows_gui_cont_list_reload()
{
  xows_gui_switch_peer(null);
  // Empty the list
  xows_doc.cont_ul.innerText = "";
  // Add loading spinner at top of list
  xows_doc_cls_add("cont_list", "LOADING");
  // Query for roster content
  xows_cli_rost_get_query();
}

/**
 * Function to add or update item of the roster contact list
 * 
 * @param {object}  cont      Contact object to add or update.
 */
function xows_gui_cli_oncontpush(cont)
{
  // Null contact mean empty contact list
  if(cont === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_list", "LOADING");
    return;
  }

  // Search for existing contact <li> element
  const li = document.getElementById(cont.bare);
  if(li) {
    // Update the existing contact <li> element according template
    xows_tpl_update_rost_cont(li, cont.name, cont.avat, cont.subs, cont.show, cont.stat);
    // Update chat title bar
    xows_gui_chat_head_update(cont);
  } else {
    // Remove the potential loading spinner
    xows_doc_cls_rem("cont_ul", "LOADING");
    // Append new instance of contact <li> from template to roster <ul>
    xows_doc.cont_ul.appendChild(xows_tpl_spawn_rost_cont(cont.bare, cont.name, cont.avat,
                                             cont.subs, cont.show, cont.stat));
                                             
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(cont);
    xows_gui_peer_scroll_save(cont); //< Initial history scroll save
  }
  
  // Show or hide list depending content
  xows_doc_hidden_set("cont_ul", (xows_doc.cont_ul.childNodes.length < 2));
}

/**
 * Function to remove item from the roster contact list
 * 
 * @param {string}  bare    Contact bare JID to remove.
 */
function xows_gui_cli_oncontrem(bare)
{
  // Remove <li> element
  const li = document.getElementById(bare);
  if(li) {
    
    // switch peer if required
    if(xows_gui_peer && xows_gui_peer.bare === bare) 
      xows_gui_switch_peer(null);
    
    // delete <li> element
    li.parentNode.removeChild(li);
    
    // delete document fragment for this peer
    xows_doc_frag_delete(bare);
  }
  
  // Show or hide list depending content
  xows_doc_hidden_set("cont_ul", (xows_doc.cont_ul.childNodes.length < 2));
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Roster - Subscription List
 * 
 * -------------------------------------------------------------------*/
 
/**
 * Add subscription request to the roster.
 * 
 * This function add a new Subscription request element in the 
 * roster
 * 
 * @param {string}    bare    Subscription request sender bare JID.
 * @param {string}    [nick]  Prefered nickname (if available).
 */
function xows_gui_cli_onsubspush(bare, nick)
{
  // Ensure subscribe <li> does not already exists
  if(document.getElementById(bare))
    return;
  
  // Create a new subcription <li> element from template
  xows_doc.subs_ul.appendChild(xows_tpl_spawn_rost_subs(bare, nick));
  
  const n = xows_doc.subs_ul.childNodes.length - 1;
  
  // Enable or update notification spot
  xows_doc.subs_unrd.innerText = n;
  xows_doc_show("subs_unrd");
  
  // Show or hide list depending content
  xows_doc_hidden_set("subs_ul", (n < 1));
}

/**
 * Cleanup subscription request from roster.
 * 
 * This function remove a Subscription request element from the 
 * roster
 * 
 * @param {string}    bare   Subscription request bare JID.
 */
function xows_gui_cli_onsubsrem(bare)
{
  // Remove <li> element
  xows_gui_rost_li_remove(bare);

  const n = xows_doc.subs_ul.childNodes.length - 1;
  
  // Update or disable the notification spot
  if(n) {
    xows_doc.subs_unrd.innerText = n;
  } else {
    xows_doc.subs_unrd.innerText = "";
    xows_doc_hide("subs_unrd");
  }
  
  // Show or hide list depending content
  xows_doc_hidden_set("subs_ul", (n < 1));
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Roster - Rooms List
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
  
  // Empty and hide the Public Room list
  xows_doc_hide("room_ul");
  xows_doc_list_clean("room_ul");
  
  // Add loading animation to Room list
  xows_doc_cls_add("room_list", "LOADING");
  
  // Query to get public room list with delay
  setTimeout(xows_cli_muc_items_query, 500);
}

/**
 * Function to handle click on roster add room
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_room_add_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Open Join Room dialog
  xows_gui_page_join_open();
}

/**
 * Function to add or update item of the roster Room list
 * 
 * @param {object}  room      Room object to add or update.
 */
function xows_gui_cli_onroompush(room)
{
  // Check for null object, meaning previous public room query response
  if(!room) {
    // disable loading animation
    xows_doc_cls_rem("room_list", "LOADING");
    return;
  }
  
  // Select destination and source <ul>
  const dest_ul = (room.publ) ? xows_doc.room_ul : (room.book) ? xows_doc.book_ul : xows_doc.priv_ul;
  
  const li = document.getElementById(room.bare);
  if(li) {
    // Move existing <li> to proper destination if needed
    if(li.parentNode !== dest_ul) dest_ul.appendChild(li);
    // Update room <li> element according template
    xows_tpl_update_rost_room(li, room.name, room.desc, room.lock);
    // Update chat title bar
    xows_gui_chat_head_update(room);
  } else {
    // Append new instance of room <li> from template to roster <ul>
    dest_ul.appendChild(xows_tpl_spawn_rost_room(room.bare, room.name, room.desc, room.lock));
    
    // Create new Peer offscreen elements with initial state
    xows_gui_peer_doc_init(room);
    xows_gui_peer_scroll_save(room); //< Initial history scroll save
  }
  
  // Show or hide lists depending content
  xows_doc_hidden_set("book_ul", (xows_doc.book_ul.childNodes.length < 2));
  xows_doc_hidden_set("room_ul", (xows_doc.room_ul.childNodes.length < 2));
  xows_doc_hidden_set("priv_ul", (xows_doc.priv_ul.childNodes.length < 2));
}

/**
 * Function to add or update item of the roster Room list
 * 
 * @param {object}  bare      Room JID to remove.
 */
function xows_gui_cli_onroomrem(bare)
{
  // Search <li> element
  const li = document.getElementById(bare);
  if(li) {
    
    // switch peer if required
    if(xows_gui_peer.bare === bare) 
      xows_gui_switch_peer(null);
    
    // delete <li> element
    li.parentNode.removeChild(li);
    
    // delete document fragment for this peer
    xows_doc_frag_delete(bare);
  }
  
  // Show or hide lists depending content
  xows_doc_hidden_set("book_ul", (xows_doc.book_ul.childNodes.length < 2));
  xows_doc_hidden_set("room_ul", (xows_doc.room_ul.childNodes.length < 2));
  xows_doc_hidden_set("priv_ul", (xows_doc.priv_ul.childNodes.length < 2));
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
 * @param {object}  user    User Peer object.
 */
function xows_gui_cli_onselfchange(user)
{
  // Compose status string
  xows_doc.user_stat.value = user.stat ? user.stat : "";
  // Change Show Status displays
  xows_doc.user_show.setAttribute("show", user.show);
  xows_doc.user_name.innerText = user.name;
  xows_doc.user_addr.innerText = "("+user.bare+")";
  // Update avatar
  xows_tpl_spawn_avat_cls(user.avat); //< Add avatar CSS class 
  xows_doc.user_avat.className = "h-"+user.avat;
}

/**
 * User Presence (show) menu button/drop on-click callback
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_menu_show_onclick(event)
{  
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");

  // Set presence as selected level
  if(li) {
    const show = parseInt(li.getAttribute("name"));
    if(show >= 0) {
      xows_cli_change_presence(show);
    } else {
      // Reset login page
      xows_doc.auth_user.value = "";
      xows_doc.auth_pass.value = "";
      
      // Disable credentials (request again for login)
      if(navigator.credentials) 
        navigator.credentials.preventSilentAccess();
      
      // Disconnect
      xows_gui_disconnect();
      
      return;
    }
  }
  
  // Toggle menu drop and focus button
  xows_doc_menu_toggle(xows_doc.menu_show, "drop_show");
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/* -------------------------------------------------------------------
 * 
 * Main Screen - Chat Frame
 * 
 * -------------------------------------------------------------------*/

/**
 * Enable or disable UI elements according Room role and affiliation
 * 
 * @param   {object}    room    Room object.
 */
function xows_gui_chat_conf_update(room)
{
  /*
   * Privilege                  None      Visitor   Participant  Moderator
   * ---------------------------------------------------------------------
   * Present in Room                        x           x           x
   * Change Nickname                        x           x           x
   * Send Private Messages                  x           x           x
   * Invite Other Users                     x           x           x
   * Send Messages to All                   +           x           x
   * Modify Subject                                     x           x
   * Kick                                                           x
   * Grant Voice                                                    x
   * Revoke Voice                                                   x 
   * 
   * 
   * Privilege                Outcast   None    Member    Admin   Owner
   * ---------------------------------------------------------------------
   * Ban Members                                            x       x
   * Edit Member List                                       x       x
   * Assign / Remove Moderator Role                         !       !
   * Edit Admin List                                                x
   * Edit Owner List                                                x
   * Change Room Configuration                                      x
   * Destroy Room                                                   x
   */

  // Setup privilieges
  const topic = (room.role > XOWS_ROLE_PART);
  
  // Room topic edition
  const chat_meta = xows_gui_peer_doc(room,"chat_meta");
  chat_meta.classList.toggle("ENABLED", topic);
  chat_meta.setAttribute("contenteditable", topic);
  chat_meta.title = topic ? xows_l10n_get("Change Room topic") : "";
  
  // Room configuration button
  let chat_conf = xows_gui_peer_doc(room,"chat_conf");
  chat_conf.classList.toggle("HIDDEN",(room.affi < XOWS_AFFI_ADMN));
}

/**
 * Set chat notification elements according notification permission
 * 
 * @param   {object}    peer    Peer object.
 */
function xows_gui_chat_noti_update(peer)
{
  const chat_noti = xows_gui_peer_doc(peer,"chat_noti");
  
  const notify = (peer.noti && xows_gui_notify_permi("granted"));

  // Set notification mute or enable
  chat_noti.title = notify ? xows_l10n_get("Disable notifications") : 
                            xows_l10n_get("Enable notifications");

  // Toggle chat action button class
  chat_noti.classList.toggle("CHAT-MUTE", notify);
  chat_noti.classList.toggle("CHAT-NOTI", !notify);
}

/**
 * Chat header bar informations update.
 * 
 * @param   {object}    peer    Peer object, either Contact or Room.
 */
function xows_gui_chat_head_update(peer)
{
  // Update chat title bar
  xows_gui_peer_doc(peer,"chat_titl").innerText = peer.name;
  
  const chat_meta = xows_gui_peer_doc(peer,"chat_meta");
  
  if(peer.type === XOWS_PEER_CONT) {  //< XOWS_PEER_CONT
    chat_meta.innerText = peer.stat;
    xows_gui_peer_doc(peer,"chat_show").setAttribute("show",peer.show);
  } else {                            //< XOWS_PEER_ROOM
    chat_meta.innerText = peer.subj;
    xows_gui_peer_doc(peer,"chat_book").classList.toggle("HIDDEN",(peer.book || peer.publ));
  }
}

 /* -------------------------------------------------------------------
 * 
 * Main Screen - Chat Frame - Header
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Header - Actions Buttons
 * -------------------------------------------------------------------*/

/**
 * Chat Header on-click callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_head_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  switch(event.target.id) 
  {
    case "chat_book": {
      // Open confirmation dialog
      if(xows_gui_peer) xows_gui_mbox_bookmark_open(xows_gui_peer);
      break;
    }
    case "chat_noti": {
      // Set notification for this Peer
      xows_gui_peer.noti = event.target.classList.contains("CHAT-NOTI");
      // Save parameter in localstorage
      xows_cach_peer_save(xows_gui_peer.bare, null, null, null, xows_gui_peer.noti);
      // Check for browser notification permission
      if(xows_gui_notify_permi("granted")) {
        xows_gui_chat_noti_update(xows_gui_peer); //< update notify button
      } else {
        xows_gui_notify_query(); //< request permission
      }
      break;
    }
    case "chat_conf": {
      // Query for Room configuration, will open Room config page
      xows_cli_room_cfg_get(xows_gui_peer, xows_gui_page_room_open);
      break;
    }
    case "chat_occu": {
      // Checks whether we are in narrow-screen mode
      if(window.matchMedia("(max-width: 799px)").matches) {
        // Widen right panel
        xows_doc_cls_add("main_wrap", "COLR-WIDE");
      } else {
        // Toggle hide right pannel
        xows_doc_cls_tog("main_colr", "COL-HIDE");
      }
      break;
    }
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - Header - Room Subject
 * -------------------------------------------------------------------*/
 
/**
 * Chat Meta (Room Topic) on-focus(out) callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_head_onfocus(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Get content
  const subj = document.getElementById("chat_meta").innerText;
  
  // If changed, inform of the new room topic
  if(subj != xows_gui_peer.subj) 
    xows_cli_send_subject(xows_gui_peer, subj);
}

/**
 * Chat Meta (Room Topic) on-keypress callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_head_onkeyp(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  if(event.keyCode === 13)  //< Return key 
    // Unfocus input, this will throw blur event
    document.getElementById("chat_meta").blur();
}

/**
 * Handle incomming room subjec from MUC room
 * 
 * @param {object}    peer    Peer object.
 * @param {string}    subj    Subject string.
 */
function xows_gui_cli_onsubject(peer, subj)
{
  if(peer === xows_gui_peer)
    xows_gui_peer_doc(peer,"chat_meta").innerText = subj?subj:"";
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
 * Callback function to handle user scroll the chat history window.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_main_onscroll(event)
{ 
  // Shortcut to chat history <div>
  const dv = xows_doc.chat_main;
  
  // Switch from full to empty chat frame can generate a scroll equal 
  // to 0, the following condition prevent unwanted query triggering.
  if(dv.scrollHeight === dv.clientHeight) 
    return;

  // Check whether the scroll is a top of frame
  if(dv.scrollTop < 20) {
    // Query archive for current chat contact
    xows_gui_mam_query(false);
  }
  
  // Check whether the scroll is at bottom of frame
  if(((dv.scrollHeight - dv.scrollTop) - dv.clientHeight) < 20) {
    // Hide the "new messages" warning if displayed
    xows_doc_hide("hist_new");
    // Check whether we have cropped history
    if(!xows_doc_hidden("hist_end")) {
      // Query archive for current chat contact
      xows_gui_mam_query(true);
    }
  }
}

/**
 * Callback function to handle user click into the chat history.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_main_onclick(event)
{ 
  // Check for click on New Message notification banner
  if(event.target.id === "hist_new") {
    
    //Check whether last message is reachable
    if(xows_doc_hidden("hist_end")) {
      
      // Scroll chat history to bottom
      xows_doc.chat_main.scrollTop = xows_doc.chat_main.scrollHeight;
      
    } else {
      // Last message is beyond the current history "window", 
      // we must query last archived messages
      
      // Reset the chat history to initial stat
      xows_doc.hist_ul.innerText = "";
      xows_doc.hist_beg.innerText = "";
      xows_doc_hide("hist_end");
      
      // Query for the last archives, with no delay
      xows_gui_mam_query(false, XOWS_GUI_HIST_SIZE, 0);
    }
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Message Insertion
 * -------------------------------------------------------------------*/
 
/**
 * Create new message DOM object to be inserted in history.
 * 
 * @param {object}    prev    Previous message of history.
 * @param {string}    id      Message ID.
 * @param {string}    from    Message sender JID.
 * @param {string}    body    Message content.
 * @param {string}    time    Message timestamp.
 * @param {boolean}   sent    Marks message as sent by client.
 * @param {boolean}   recp    Marks message as receipt received.
 * @param {object}    sndr    Message sender Peer object.
 */
function xows_gui_hist_gen_mesg(prev, id, from, body, time, sent, recp, sndr)
{
  // Default is to add a simple aggregated message without author 
  // name and avatar
  let aggregate = true;
  
  // If previous message sender is different or if elapsed time is 
  // greater than 1 houre, we create a new full message block
  if(prev) {
    const d = time - prev.getAttribute("time");
    if(d > XOWS_MESG_AGGR_THRESHOLD || prev.getAttribute("from") !== from)
      aggregate = false;
  } else {
    aggregate = false;
  }
  
  // Create a simple aggregated message
  return xows_tpl_mesg_spawn(id, from, body, time, sent, recp, aggregate ? null : sndr);
}

/**
 * Update avatar for chat history messages. Should be used carefully
 * to preserve resources.
 * 
 * @param {object}    peer    Peer object.
 * @param {string}    from    Message author JID to search.
 * @param {string}    hash    Replacement avatar hash to set.
 */
function xows_gui_hist_avat_upd(peer, from, hash)
{
  if(!hash) return;

  // If incoming message is off-screen we get history <div> and <ul> of 
  // fragment history corresponding to contact
  const hist_ul = xows_gui_peer_doc(peer,"hist_ul");
  
  const cls = "h-"+hash;
  
  const mesg = hist_ul.querySelectorAll("LI[from='"+from+"']");
  let figure, i = mesg.length;
  while(i--) {
    if(figure = mesg[i].querySelector("FIGURE"))
      figure.className = cls;
  }
}

/**
 * Callback function to add sent or received message to the history 
 * window
 * 
 * @param {object}    peer      Message Peer.
 * @param {string}    id        Message ID.
 * @param {string}    from      Message sender JID.
 * @param {string}    body      Message content.
 * @param {string}    time      Message timestamp
 * @param {boolean}   sent      Marks message as sent by client.
 * @param {boolean}   recp      Marks message as receipt received.
 * @param {object}    sndr      Message sender Peer object.
 */
function xows_gui_cli_onmessage(peer, id, from, body, time, sent, recp, sndr)
{
  // Checks whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Add unread notification for this contact
  if(offscreen) xows_gui_unread_add(peer, id);
  
  // Send browser notification popup
  if(!xows_gui_has_focus && !sent && peer.noti) 
    xows_gui_notify_push(sndr, body);
  
  // Check whether end of history is croped, in this cas the new message
  // must not be appended, we will show it by querying archives
  if(!sent && !hist_end.classList.contains("HIDDEN")) {
    // Show the "new messages" warning
    xows_gui_peer_doc(peer,"hist_new").classList.remove("HIDDEN");
    // Do not append any message, return now
    return;
  }
  
  // Required elements, offscreen or from document
  const hist_ul = xows_gui_peer_doc(peer,"hist_ul");
  
  // If message with id alread exists, return now to prevent double
  if(xows_gui_peer_mesg_li(peer, id))
    return;

  // get scroll bottom relative position before message insertion
  const scrl_bot = xows_gui_peer_scroll_bot(peer);

  // Create new message
  const li = xows_gui_hist_gen_mesg(hist_ul.lastChild, id, from, body, time, sent, recp, sndr);

  // Append message to history <ul>
  hist_ul.appendChild(li);
  
  // To prevent history to inflate infinitely we keep it to a maximum 
  // count of message and let user ability to query for archives
  if(hist_ul.childNodes.length > XOWS_GUI_HIST_SIZE) {
    hist_ul.removeChild(hist_ul.firstChild);
    xows_gui_peer_doc(peer,"hist_beg").innerText = ""; //< Allow query history
  }
  
  // If it is an incomming message and client is consulting top of
  // history, we don't scroll at bottom but display a warning message
  if(!sent && (scrl_bot > 100)) {
    // Show the "new messages" warning
    xows_gui_peer_doc(peer,"hist_new").classList.remove("HIDDEN"); //< show
  } else {
    // scroll history down
    xows_gui_peer_scroll_down(peer);
  }
  
  if(!offscreen) {
    // Add message medias to be monitored by lazy loader
    xows_doc_loader_monitor(li);
    xows_doc_loader_check(true);
  }
}

/**
 * Handle incomming receipts from the server to update history message
 * element style.
 * 
 * @param {object}    peer    Peer object.
 * @param {string}    id      Receipt related message Id.
 */
function xows_gui_cli_onreceipt(peer, id)
{
  // Check whether message is from or to current chat contact
  const li = xows_gui_peer_mesg_li(peer, id);
  if(li) {
    li.classList.add("MESG-RECP");
  } else {
    xows_log(1,"gui_hist_set_receipt","message not found",id);
  }
}

/* -------------------------------------------------------------------
 * Main Screen - Chat Frame - History - Archive Management (MAM)
 * -------------------------------------------------------------------*/

/**
 * Reference to setTimeout sent fo temporize archive queries
 */
let xows_gui_mam_query_to = null;

/**
 * Query arvhived message for the current chat contact.
 * 
 * The 'after' parameter is used to choose to get either newers or 
 * older messages than the ones currently present in the history <div>
 * if 'after' parameter is true, the function will query for newer 
 * messages.
 * 
 * @param {boolean}   after   Get archives beyond first of after last message.
 * @param {number}    max     Maximum result to get, default is 20.
 * @param {boolean}   delay   Delay to temporize query, default is 100 MS.
 */
function xows_gui_mam_query(after, max = 20, delay = 100)
{
  if(!xows_gui_mam_query_to) { //< One poll at a time...
    
    let start, end;
    // Get start or end time depending after parameter, we get time
    // always 25 MS after or before to prevent received the last or
    // first message already in history.
    if(after) {
      // Check whether we already got the latest message
      if(xows_doc_hidden("hist_end"))
        return;
      if(xows_doc.hist_ul.childNodes.length) 
        start = parseInt(xows_doc.hist_ul.lastChild.getAttribute("time"));
      xows_doc_cls_add("hist_end", "LOADING");
    } else {
      // Check whether we already reached the first archived message
      if(xows_doc.hist_beg.innerText.length)
        return;
      if(xows_doc.hist_ul.childNodes.length) 
        end = parseInt(xows_doc.hist_ul.firstChild.getAttribute("time"));
      xows_doc_cls_add("hist_beg", "LOADING");
    }
    // To prevent flood and increase ergonomy the archive query is
    // temporised with a fake loading time.
    xows_gui_mam_query_to = setTimeout(xows_cli_mam_query,
                                            delay, xows_gui_peer, 
                                            max, start, end, 
                                            xows_gui_mam_parse);
  }
}

/**
 * Callback function to handle the received archives for a contacts.
 * 
 * @param {object}    peer        Archive related peer (Contact or Room)
 * @param {object[]}  result      Received archived messages
 * @param {boolean}   complete    Indicate results are complete (no remain) 
 */
function xows_gui_mam_parse(peer, result, complete)
{
  // Check whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Get elements we need to interact with
  const hist_ul = xows_gui_peer_doc(peer,"hist_ul");
  const hist_beg = xows_gui_peer_doc(peer,"hist_beg");
  const hist_end = xows_gui_peer_doc(peer,"hist_end");
  
  // Disable all spin loader
  hist_beg.classList.remove("LOADING"); //< Allow query history
  hist_end.classList.remove("LOADING"); //< Allow query history

  // Is this an initial query, with empty history ?
  const initial = (hist_ul.childNodes.length === 0);
  
  // Check whether we must append or prepend received archived messages
  let insert; 
  if(result.length && !initial) {
    // We compare time (unix epoch) to ensure last archived message is
    // older (or equal) than the first history message.
    if(hist_ul.firstChild.getAttribute("time") >= result[result.length-1].time) 
      insert = hist_ul.firstChild;
  }
  
  // To prevent history to inflate infinitely we keep it to a maximum 
  // count of message and let user ability to query for archives
  // Here we preventively cut the history as needed, either at top  
  // or bottom, depending the "direction" of the archive result.
  let crop = (hist_ul.childNodes.length-XOWS_GUI_HIST_SIZE)+result.length;
  if(crop > 0) {
    if(insert) {
      // Result are older messages, we delete messages at bottom of history
      while(crop--) hist_ul.removeChild(hist_ul.lastChild);
      hist_end.classList.remove("HIDDEN"); //< Allow query history
    } else {
      // Result are newer messages, we delete messages at top of history
      while(crop--) hist_ul.removeChild(hist_ul.firstChild);
      hist_beg.innerText = ""; //< Allow query history
    }
  }
  
  // Store scroll offset to restore it at its previous position
  const scroll_off = xows_gui_peer_scroll_off(peer);
    
  let new_li, pre_li;
  
  // Store the count of message actualy appended to the history <ul>
  let appended = 0;
  
  for(let i = 0, n = result.length; i < n; ++i) {
    
    // If message with id alread exists, skip to prevent double
    if(xows_gui_peer_mesg_li(peer, result[i].id))
      continue;

    // Create new message
    new_li = xows_gui_hist_gen_mesg(pre_li, result[i].id, result[i].from, 
                                            result[i].body, result[i].time, 
                                            result[i].sent, true, result[i].sndr);
    
    // Inserte or append, keep current as previous
    if(insert) {
      pre_li = hist_ul.insertBefore(new_li, insert);
    } else {
      pre_li = hist_ul.appendChild(new_li);
    }

    if(!offscreen) {
      // Add message medias to be monitored by lazy loader
      xows_doc_loader_monitor(new_li);
    }
    
    // Increase appended message
    appended++;
  }

  if(complete) {
    
    let beg = false;
  
    // If no message was appended, this mean query doubling or 
    // overlapped by already received messae (from MUC automatic 
    // history for example).
    // In this partiular case, we must ensure which  history bound 
    // was reached since "insert" will not necessarly be set
    if(result.length && appended === 0) {
      // compare id of the last result with the last history message
      if(result[0].id === hist_ul.firstChild.id) {
        beg = true;
      } else if (result[result.length-1].id !== hist_ul.lastChild.id) {
        // This is an unhandled situation
        xows_log(1,"gui_mam_handle","Complete MAM query exception",
                                    "bound messages ID mismatches");
      }
    } else {
      beg = (insert !== undefined || initial);
    }
    
    if(beg) {
      hist_beg.innerText = xows_l10n_get("Start of history");
    } else {
      hist_end.classList.add("HIDDEN");
    }
  }

  if(!offscreen) {
    // Realign scroll to its previous position
    if(insert) xows_gui_peer_scroll_seek(peer,scroll_off);
    // For the first mam query, scroll down
    if(initial) xows_gui_peer_scroll_down(peer);
    // Launch lazy loader check routine
    xows_doc_loader_check(true);
  }
  
  xows_gui_mam_query_to = null; //< Allow a new archive query
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Chat Frame - Foot Panel
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Message edition
 * -------------------------------------------------------------------*/
/**
 * Chat Editor table to store current pressed (down) key
 */
const xows_gui_edit_mesg_keyd = new Array(256);

/**
 * Chat Panel on-keydown / on-keyup callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_panl_onkeyp(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Enable key down according received event
  xows_gui_edit_mesg_keyd[event.keyCode] = (event.type === "keydown");

  // Check for key down event
  if(event.type === "keydown") {

    // Check for prend Enter
    if(event.keyCode === 13) {
  
      // Check whether shift key is press, meaning escaping to
      // add new line in input instead of send message.
      if(xows_gui_edit_mesg_keyd[16])
        return;
    
      // Prevent browser to append the new-line in the text-area
      event.preventDefault();
      
      // Send message
      if(xows_gui_peer) {
        
        const edit_mesg = document.getElementById("edit_mesg");
        
        if(edit_mesg.innerText.length) {
          
          // Send message
          xows_cli_send_message(xows_gui_peer, edit_mesg.innerText);
          
          // Add CSS class to show placeholder
          edit_mesg.classList.add("PLACEHOLD");
          edit_mesg.innerText = ""; //< Empty any residual <br>
        } 
        
        // Reset chatsate to active
        xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_ACTI);
      }
      
    } else {
      
      // Set composing
      if(xows_gui_peer) 
        xows_cli_chatstate_set(xows_gui_peer, XOWS_CHAT_COMP);
    }
  }
}

/**
 * Chat Editor reference to last selection Range object.
 */
let xows_gui_edit_mesg_rng = null;

/**
 * Chat Panel on-input callback function
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_panl_oninput(event)
{
  // Store selection range
  xows_gui_edit_mesg_rng = xows_doc_sel_rng(0);
  
  const edit_mesg = document.getElementById("edit_mesg");
  
  // Check inner text content to show placeholder
  if(edit_mesg.innerText.length < 2) {
    
    if(edit_mesg.innerText.trim().length === 0) {
      
      // Add CSS class to show placeholder
      edit_mesg.classList.add("PLACEHOLD");
      edit_mesg.innerText = ""; //< Empty any residual <br>

      return; //< Return now
    }
  }

  // Hide the placeholder text
  edit_mesg.classList.remove("PLACEHOLD");
}

/**
 * Chat Panel on-click callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_panl_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  switch(event.target.id) 
  {
    case "edit_mesg": {
      // Get selection range
      const rng = xows_doc_sel_rng(0);
      if(rng.collapsed) {
        const txt = rng.endContainer;
        // Checks whether current selection is within <emoj> node
        if(txt.parentNode.tagName === "EMOJ") {
          // Move caret before or after the <emoj> node
          xows_doc_caret_around(txt.parentNode, !rng.endOffset);
          return; //< return now
        }
      }
      // Store selection
      xows_gui_edit_mesg_rng = rng;
      break;
    }
    
    case "edit_upld": {
      // Reset file input
      xows_doc.chat_file.value = "";
      // Open the file selector (emulate click)
      xows_doc.chat_file.click();
      break;
    }
    
    case "edit_emoj": {
      // Toggle menu drop and focus button
      xows_doc_menu_toggle(xows_doc.edit_emoj, "drop_emoj");
      break;
    }
  }
}

/**
 * Chat Editor insert element at/within current/last selection.
 * 
 * @param {string}  text      Text to insert.
 * @param {string} [tagname]  Optional wrapper node tagname.
 */
function xows_gui_edit_mesg_insert(text, tagname)
{
  const edit_mesg = document.getElementById("edit_mesg");
 
  // set default carret position if none saved
  if(!xows_gui_edit_mesg_rng) {
    xows_doc_caret_at(edit_mesg, true);
    xows_gui_edit_mesg_rng = xows_doc_sel_rng(0);
  }

  // Get the last saved selection range (caret position)
  const rng = xows_gui_edit_mesg_rng;
  
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
  edit_mesg.classList.remove("PLACEHOLD");
  
  // Focus on input
  edit_mesg.focus();
    
  // Move caret after the created node
  xows_doc_caret_around(node);
  
  // Store selection
  xows_gui_edit_mesg_rng = xows_doc_sel_rng(0);
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - Emoji Menu Drop
 * -------------------------------------------------------------------*/
/**
 * Chat Emoji menu button/drop on-click callback
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_drop_emoj_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");
  
  // Check whether we got click from drop or button
  if(li) xows_gui_edit_mesg_insert(li.childNodes[0].nodeValue, "emoj"); //< Insert selected Emoji
}

/* -------------------------------------------------------------------
 * Main screen - Chat Frame - Foot Panel - File Upload
 * -------------------------------------------------------------------*/

/**
 * File Upload on-progress callback function
 * 
 * @param {number}  percent   Data upload progression in percent
 */ 
function xows_gui_upld_onprogress(percent) 
{
  // Update progress bar
  xows_doc.upld_pbar.style.width = percent + "%";
}

/**
 * File Upload on-error callback function.
 * 
 * @param {string}  mesg    Reported error message with code
 */
function xows_gui_upld_onerror(mesg) 
{
  // Set the upload dialog message
  xows_doc_cls_add("upld_text","TEXT-ERR");
  xows_doc.upld_text.innerHTML = "<b>"+xows_l10n_get("Error")+"</b> : "+mesg;
}

/**
 * File Upload on-success callback function.
 * 
 * @param {string}  url   Returned download URL of the uploaded file
 */
function xows_gui_upld_onsuccess(url) 
{
  // Hide the Upload page
  xows_doc_hide("hist_upld");

  // Send a message to current selected contact with URL to download
  // We use small delay to let the HTTP server to refresh cache
  setTimeout(xows_cli_send_message, 400, xows_gui_peer, url);
}

/**
 * File Upload on-abort callback function.
 */
function xows_gui_upld_onabort()
{
  xows_gui_upld_onclose();
}

/**
 * File Upload on-close callback function.
 */
function xows_gui_upld_onclose()
{
  xows_doc_hide("hist_upld");
}

/**
 * File Upload Frame open.
 * 
 * @param {object}  file    File object to upload.
 */
function xows_gui_upld_open(file)
{
  // Reset elements to initial state
  xows_doc.upld_text.classList = "";
  xows_doc.upld_pbar.style.width = "0%";

  // Set uploading file name
  xows_doc.upld_text.innerText = file.name;
  
  console.log(file.name);

  // Send upload query
  xows_cli_upld_query(file, xows_gui_upld_onerror, xows_gui_upld_onsuccess,
                            xows_gui_upld_onprogress, xows_gui_upld_onabort);
  
  // Show the upload frame
  xows_doc_show("hist_upld");
  
  // scroll history down
  xows_gui_peer_scroll_down(xows_gui_peer);
}

/**
 * File Upload file object on-change callback function
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_chat_file_onchange(event)
{
  const file = xows_doc.chat_file.files[0];
  
  // Check whether any peer is selected and file object is valid
  if(xows_gui_peer.bare && file) 
    xows_gui_upld_open(file);
}

/* -------------------------------------------------------------------
 * 
 * Main screen - Chat Frame - Foot Panel - Peer Writing notify
 * 
 * -------------------------------------------------------------------*/

/**
 * Handle the received composing state from other contacts to display
 * it in the chat window.
 * 
 * @param {object}    peer  Sender peer object.
 * @param {string}    from  Sender full JID.
 * @param {number}    chat  Chat state value.
 */
function xows_gui_cli_onchatstate(peer, from, chat)
{
  // get Peer chatstat object
  const chat_stat = xows_gui_peer_doc(peer,"chat_stat");
  
  if(peer.type === XOWS_PEER_CONT) {
    
    // If Contact stopped writing, empty chatstate
    if(peer.chat < XOWS_CHAT_COMP) {
      chat_stat.innerText = "";
      chat_stat.classList.add("HIDDEN");
      return;
    }
    
    // Wet writing string
    chat_stat.innerHTML = "<b>"+peer.name+"</b> "+xows_l10n_get("is currently writing");        

  } else {

    // Count of writting occupants
    const n = peer.writ.length;
    
    // If no Occupant is writing, empty chatsate
    if(n < 1) {
      chat_stat.innerText = "";
      chat_stat.classList.add("HIDDEN");
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
  }
  
  // Show the writing mention
  chat_stat.classList.remove("HIDDEN");
}

/* -------------------------------------------------------------------
 * 
 * Main Screen - Room Occupants
 * 
 * -------------------------------------------------------------------*/

/**
 * Handle the received occupant from MUC Room
 * 
 * @param {object}    room      Room object.
 * @param {object}    occu      Occupant object.
 * @param {object}   [code]     Optionnal list of status code.
 */
function xows_gui_cli_onoccupush(room, occu, code)
{
  // checks whether we have a special status code with this occupant
  if(code && code.includes(110)) { //< Self presence update
    // Code 201 mean initial room config
    xows_gui_page_join_onjoind(room, null, code.includes(201));
    // Update privileges related GUI elements
    xows_gui_chat_conf_update(room);
  }

  // Search for existing occupant <li> element for this Room
  const li = xows_gui_peer_occu_li(room, occu.jid);
  if(li) {
    
    // Update the existing <li> ellement according template
    xows_tpl_update_room_occu(li, occu.name, occu.avat, occu.full, occu.show, occu.stat);
    
    // Update message history
    xows_gui_hist_avat_upd(room, occu.jid, occu.avat);
    
  } else {
                    
    // Create and append new <li> element from template
    const inst = xows_tpl_spawn_room_occu(occu.jid, occu.name, occu.avat, occu.full, occu.show, occu.stat);
    
    // Hide the "Add Contact" button depending context
    const show_subs = (!occu.self && (occu.full && !xows_cli_cont_get(occu.full)));
    inst.querySelector(".OCCU-SUBS").classList.toggle("HIDDEN", !show_subs);
    
    // Select the proper role <ul> to put the occupant in
    const occu_ul = xows_gui_peer_doc(room,(occu.role===XOWS_ROLE_MODO)?"modo_ul":"memb_ul");
    
    // Create and append new <li> element from template
    occu_ul.appendChild(inst);
  }
}

/**
 * Function to remove item from the room occupant list
 * 
 * @param {object}  room    Room object to remove occupant from.
 * @param {string}  jid     Occupant JID or null for self.
 */
function xows_gui_cli_onoccurem(room, jid)
{  
  if(jid) {
    
    // Search and remove <li> in document or offscreen fragment
    const li = xows_gui_peer_occu_li(room, jid);
    if(li) li.parentNode.removeChild(li);
    
  } else { // null jid mean occumant is self: we leaved the room
    
    // Check whether current peer is the room
    if(room === xows_gui_peer) {
      xows_gui_switch_peer(null); //< Unselect peer
      const li = xows_doc.room_list.querySelector(".SELECTED");
      if(li) li.classList.remove("SELECTED");
    }
  }
}

/**
 * Function to handle click on room occupant list
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_occu_list_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // get related <li> element where click occurred
  const li = event.target.closest("li");
  
  if(li) {
    
    // Checks whether user clicked on action button
    if(event.target.tagName === "BUTTON") {
      
      // Select action
      switch(event.target.name)
      {
        case "OCCU_ADD": { //< Add contact
          // get contact address
          const bare = xows_jid_to_bare(li.getAttribute("jid"));
          // Compose display name from JID
          const user = bare.split("@")[0];
          const name = user[0].toUpperCase()+user.slice(1);
          // Open confirmation dialog
          xows_gui_mbox_subs_edit_open(bare, name);
          return;
        }
          
        default: 
          return;
          
      } //< switch
    }
  }
}

/* -------------------------------------------------------------------
 * 
 * Main Screen - User status Edition
 * 
 * -------------------------------------------------------------------*/

/**
 * User Presence Status on-blur callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_user_stat_onblur(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Get and reset value
  const stat = xows_doc.user_stat.value;
  
  // If changed, inform of the new status
  if(stat != xows_cli_self.stat) 
    xows_cli_change_status(stat);
}

/**
 * User Presence Status on-keypress callback function.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_user_stat_onkeyp(event)
{
  if(event.keyCode === 13)  //< Return key 
    // Unfocus input, this will throw blur event
    xows_doc.user_stat.blur();
}

/* -------------------------------------------------------------------
 * 
 * Page Screen Dialogs
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * 
 * Page Screen - Wait Screen Page
 * 
 * -------------------------------------------------------------------*/
 
/**
 * Wait Screen page open.
 * 
 * @param {string}  text  Message to display.
 */
function xows_gui_page_wait_open(text)
{
  // Set wait message
  xows_doc.wait_text.innerText = xows_l10n_get(text);
  
  // Open wait page
  xows_doc_page_open("page_wait");
}

/* -------------------------------------------------------------------
 * 
 * Page Screen - User Login Page
 * 
 * -------------------------------------------------------------------*/

/**
 * User Login page on-unput event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_auth_oninput(target)
{
  let disable = true;
  
  if(xows_doc.auth_user.value.length && xows_doc.auth_pass.value.length)
    disable = false;
  
  xows_doc.auth_cnct.disabled = disable;
}

/**
 * User Login page on-click event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_auth_onclick(target)
{
  if(target.id === "auth_cnct") { //< Submit button
    
    if(!xows_doc.auth_cnct.disabled) {
      
      // Display wait screen
      xows_gui_page_wait_open("Connecting...");
      
      // Get login parameters from DOM
      xows_gui_auth = {};
      xows_gui_auth.user = xows_doc.auth_user.value.toLowerCase();
      xows_gui_auth.pass = xows_doc.auth_pass.value;
      xows_gui_auth.cred = xows_doc.auth_cred.checked;
      
      // erase password from intput
      xows_doc.auth_pass.value = "";
      
      // Try connection
      xows_gui_connect(false);
    }
    
    return;
  }
  
  if(target.id === "auth_regi") //< Link for register new user
    xows_gui_page_regi_open(); //< display register screen
}

/**
 * User Login page open.
 */
function xows_gui_page_auth_open()
{  
  // Reset inputs
  xows_doc.auth_user.value = "";
  xows_doc.auth_pass.value = "";
  
  // Disable connect button
  xows_doc.auth_cnct.disabled = true;
  
  // Open dialog page
  xows_doc_page_open("page_auth",false,null,xows_gui_page_auth_oninput,
                                            xows_gui_page_auth_onclick);
                              
  // Add navigation history
  xows_gui_nav_push("auth_open", xows_gui_page_auth_open);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen - User Register Page
 * 
 * -------------------------------------------------------------------*/

/**
 * User Register page on-input event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_regi_oninput(target)
{
  let disable = true;

  if(xows_doc.regi_user.value.length && xows_doc.regi_pass.value.length)
    if(xows_doc_cls_has("regi_capt", "CAPTCHA-CHECKED")) 
      disable = false;
  
  xows_doc.regi_subm.disabled = disable;
}

/**
 * User Register page on-click event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
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
    
    if(!xows_doc.regi_subm.disabled) {
      
      // Display wait screen
      xows_gui_page_wait_open("Please wait...");
      
      // Get login parameters from DOM
      xows_gui_auth = {};
      xows_gui_auth.user = xows_doc.regi_user.value.toLowerCase();
      xows_gui_auth.pass = xows_doc.regi_pass.value;
      
      // erase password from intput
      xows_doc.regi_pass.value = "";
      
      // Try register
      xows_gui_connect(true);
    }
    
    return;
  }
  
  if(target.id === "regi_canc") //< Link for login with existing user
    xows_gui_page_auth_open(); //< Display login screen
}

/**
 * User Register page open.
 */
function xows_gui_page_regi_open()
{
  // Reset inputs
  xows_doc.regi_user.value = "";
  xows_doc.regi_pass.value = "";
  
  // Disable submit button
  xows_doc.regi_subm.disabled = true;
  
  // uncheck captcha
  xows_doc_cls_rem("regi_capt", "CAPTCHA-CHECKED"); 
                              
  // Open dialog page
  xows_doc_page_open("page_regi",false,null,xows_gui_page_regi_oninput,
                                            xows_gui_page_regi_onclick);
  // Add navigation history
  xows_gui_nav_push("regi_open", xows_gui_page_regi_open);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen - User Profile Page
 * 
 * -------------------------------------------------------------------*/
 
/**
 * User Profile page on-abort callback function.
 */
function xows_gui_page_user_onabort()
{
  // Reset inputs values
  //xows_doc.card_addr.value = xows_cli_self.bare;
  xows_doc.card_name.value = xows_cli_self.name;

  // Get temps or cached avatar
  const data = xows_cach_avat_get(xows_cli_self.avat);
  xows_doc.card_avat.style.backgroundImage = "url(\""+data+"\")";
  xows_doc.card_avat.data = data; //< had-oc property
  
  xows_doc.card_open.checked = true;
}

/**
 * User Profile page on-valid callback function.
 */
function xows_gui_page_user_onvalid()
{
  // Update user profile
  xows_cli_change_profile(  xows_doc.card_name.value, 
                            xows_doc.card_avat.data, 
                            xows_doc.card_open.checked);
}

/**
 * User Profile page on-input event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_user_oninput(target)
{
  let changed;
  
  switch(target.id) 
  {
  case "card_open": //< Checkbox for Data in open access
    changed = !xows_doc.card_open.checked; break;
  case "card_name": //< Nickname input text field
    changed = (xows_doc.card_name.value != xows_cli_self.name);
  }
  
  // Open Message Box dialog
  if(changed) xows_doc_mbox_open_for_save(  xows_gui_page_user_onvalid,
                                            xows_gui_page_user_onabort);
}

/**
 * User Profile page on-click event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_user_onclick(target)
{
  if(target.id === "card_avch") { //< Change avatar
    
    // Emulate click on file input
    xows_doc.card_file.click(); 
    
    return; 
  }
    
  if(target.id === "card_avrm") { //< Remove avatar
  
    // set null avatar data
    xows_doc.card_avat.data = null;
    
    // Generate default temp avatar
    const hash = xows_cli_avat_temp(xows_cli_self.bare);
    xows_doc.card_avat.style.backgroundImage = "url(\""+xows_cach_avat_get(hash)+"\")";
  
    // Open Message box dialog
    xows_doc_mbox_open_for_save(  xows_gui_page_user_onvalid,
                                  xows_gui_page_user_onabort);
  }
}

/**
 * User Profile page callback avatar file change event.
 * 
 * @param {object}  event   Event object associated with trigger
 */
function xows_gui_page_user_ev_file(event)
{
  if(xows_doc.card_file.files[0]) {
    // Create file reader to read image data
    const reader = new FileReader();
    reader.onload = function(e) {
      // Once data loaded, create new Image object
      const image = new Image();
      // Define onload function to handle loaded data
      image.onload = function(e) {
        // Set avatar data on background
        const url = xows_gen_avatar(XOWS_AVAT_SIZE, this);
        xows_doc.card_avat.data = url;
        xows_doc.card_avat.style.backgroundImage = "url(\""+url+"\")";
        // Open Message Box dialog
        xows_doc_mbox_open_for_save(  xows_gui_page_user_onvalid,
                                      xows_gui_page_user_onabort);
      };
      // Start image loading (should be quick)
      image.src = e.target.result;
    };
    // Launch file reading
    reader.readAsDataURL(xows_doc.card_file.files[0]);
  }
}

/**
 * User Profile page on-close callback function.
 */
function xows_gui_page_user_onclose()
{
  // remove "change" event listener to file input
  xows_doc_listener_rem(xows_doc.card_file,"change",xows_gui_page_user_ev_file);
}

/**
 * User Profile page open.
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
  xows_doc_listener_add(xows_doc.card_file,"change",xows_gui_page_user_ev_file);
  
  // Add navigation history
  xows_gui_nav_push("user_open", xows_gui_page_user_open);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen - Add Contact Page
 * 
 * -------------------------------------------------------------------*/

/**
 * Add Contact page on-valid callback function.
 */
function xows_gui_page_cont_onvalid()
{
  // Get parameters from DOM
  let bare = xows_doc.cont_bare.value;
  
  // Compose display name from JID
  const userid = bare.split("@")[0];
  const name = userid[0].toUpperCase() + userid.slice(1);
  
  // Request for roster add contact
  xows_cli_rost_edit(bare, name);
}

/**
 * Add Contact page on-input event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_cont_oninput(target)
{
  if(xows_doc.cont_bare.value.length && xows_isjid(xows_doc.cont_bare.value)) {
    xows_doc_mbox_open(null, "Add contact and request authorisation",
                          xows_gui_page_cont_onvalid, "Submit");
  } else {
    xows_doc_mbox_close();
  }
}

/**
 * Add Contact page open.
 */
function xows_gui_page_cont_open()
{
  // Reset inputs
  xows_doc.cont_bare.value = "";
  
  // Open dialog page
  xows_doc_page_open("page_cont",true,null,xows_gui_page_cont_oninput);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen - Join/Create Room Page
 * 
 * -------------------------------------------------------------------*/
 
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_page_join = {};

/**
 * Room Join page function to handle joined room.
 * 
 * @param {object}    room  Joined Room object
 * @param {string}    type  Query result type or null.
 * @param {boolean}   conf  Initial configuration proposale.
 */
function xows_gui_page_join_onjoind(room, type, conf)
{
  if(xows_doc_page_opened("page_join")) {
    
    // Switch peer to newly joined room
    xows_gui_switch_peer(room.bare);
    // Close panel in case we are in narrow-screen with wide panel
    xows_gui_panel_close();
      
    if(conf) {
      
      // This scenario occure after room creation confirmation, to ask
      // user for created Room initial configuration.
      xows_gui_page_join.room = room;
      
      // disable input 
      xows_doc.join_room.disabled = true;
      
      // Open new Message Box to confirm Room initial config process
      xows_doc_mbox_open(null, "The Room will be created, do you want to configure it ?",
                            xows_gui_page_join_onvalid, "Configure",
                            xows_gui_page_join_onabort, "Join now");
    } else {

      // Close Room Join Page
      xows_doc_page_close();
    }
  }
}

/**
 * Room Join page on-valid callback function.
 */
function xows_gui_page_join_onvalid()
{
  const room = xows_gui_page_join.room;
  
  // check whether we are in Room creation init process
  if(room) {
    
      xows_log(2,"gui_page_join_onvalid","request initial Room config",room.bare);
      
      // Send Room config form request, XMPP server will reply which 
      // will automatically opens the Room Configuration page.
      xows_cli_room_cfg_get(room, xows_gui_page_room_open);
      
  } else {
    
    const name = xows_doc.join_room.value;
    const nick = xows_cli_self.name; //< user nickname to join room with
    
    // Join or create room
    xows_cli_room_join(null, name, nick);
  }
}

/**
 * Room Join page on-abort callback function.
 * 
 * This function is normally used only within Room creation  
 * scenario, when user request join a non-existing Room that is 
 * created on-the-fly.
 */
function xows_gui_page_join_onabort()
{
  const room = xows_gui_page_join.room;
  
  // If we are in Room creation process, we accept the default config
  if(room) xows_cli_room_cfg_set(room, null, xows_gui_page_join_onjoind);
}

/**
 * Room Join page on-input event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_join_oninput(target)
{
  if(xows_doc.join_room.value.length) {
    xows_doc_mbox_open(null, "Join Room (create it if does not exist)",
                          xows_gui_page_join_onvalid, "Join");
  } else {
    xows_doc_mbox_close();
  }
}

/**
 * Room Join page on-close callback function.
 */
function xows_gui_page_join_onclose()
{
  // Reset temporary data
  xows_gui_page_join.room = null;
}

/**
 * Room Join page open.
 * 
 * @param {object}  room    Room object for initial config scenario.
 */
function xows_gui_page_join_open()
{
  // Reset inputs
  xows_doc.join_room.disabled = false;
  xows_doc.join_room.value = "";
  
  // Open dialog page
  xows_doc_page_open("page_join",true,xows_gui_page_join_onclose,
                                      xows_gui_page_join_oninput);
                              
  // Add navigation history
  xows_gui_nav_push("join_open", xows_gui_page_join_open);
}
/* -------------------------------------------------------------------
 * 
 * Page Screen - Room Configuration
 * 
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_doc_page_room = {};

/**
 * Room Configuration page query result callback function.
 */
function xows_gui_page_room_onresult(room, type)
{
  if(type === "result") 
    xows_doc_page_close();
}

/**
 * Room Configuration page on-valid callback function.
 */
function xows_gui_page_room_onvalid()
{
  const room = xows_doc_page_room.room;
  const form = xows_doc_page_room.form;
  
  // Fill configuration from with input values
  for(let i = 0, n = form.length; i < n; ++i) {
    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      form[i].value = xows_doc.room_titl.value; break;
    case "muc#roomconfig_roomdesc":
      form[i].value = xows_doc.room_desc.value; break;
    case "muc#roomconfig_persistentroom":
      form[i].value = xows_doc.room_pers.checked?"1":"0"; break;
    case "muc#roomconfig_publicroom":
      form[i].value = xows_doc.room_publ.checked?"1":"0"; break;
    //case "muc#roomconfig_roomsecret":
    //  form[i].value = xows_doc.room_priv.checked ? xows_doc.room_pass.value : "";
    //  break;
    case "muc#roomconfig_membersonly":
      form[i].value = xows_doc.room_mbon.checked?"1":"0"; break;
    case "muc#roomconfig_moderatedroom":
      form[i].value = xows_doc.room_modo.checked?"1":"0"; break;
    case "muc#roomconfig_whois":
      form[i].value = xows_doc.room_anon.value; break;
    case "muc#roomconfig_historylength":
      form[i].value = xows_doc.room_hmax.value; break;
    case "muc#roomconfig_defaulthistorymessages":
      form[i].value = xows_doc.room_hdef.value; break;
    case "muc#roomconfig_enablearchiving":
      form[i].value = xows_doc.room_arch.checked?"1":"0"; break;
    }
  }

  // Submit fulfilled configuration form
  xows_cli_room_cfg_set(room, form, xows_gui_page_room_onresult);
}

/**
 * Room Configuration page on-abort callback function.
 */
function xows_gui_page_room_onabort()
{
  const room = xows_doc_page_room.room;
  const form = xows_doc_page_room.form;
  
  // Setup page inputs according received config from
  for(let i = 0, n = form.length; i < n; ++i) {
    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      xows_doc.room_titl.value = form[i].value; break;
    case "muc#roomconfig_roomdesc":
      xows_doc.room_desc.value = form[i].value; break;
    case "muc#roomconfig_persistentroom":
      xows_doc.room_pers.checked = xows_asbool(form[i].value); break;
    case "muc#roomconfig_publicroom":
      xows_doc.room_publ.checked = xows_asbool(form[i].value); break;
    //case "muc#roomconfig_roomsecret":
    //  xows_doc.room_priv.checked = form[i].value.length;
    //  xows_doc.room_pass.value = form[i].value; 
    //  break;
    //case "muc#roomconfig_allowmemberinvites":
    //  xows_doc.room_invt.checked = form[i].value; 
    //  break;
    case "muc#roomconfig_membersonly":
      xows_doc.room_mbon.checked = xows_asbool(form[i].value); break;
    case "muc#roomconfig_changesubject":
    case "muc#roomconfig_moderatedroom":
      xows_doc.room_modo.checked = xows_asbool(form[i].value); break;
    case "muc#roomconfig_whois":
      xows_doc.room_anon.value = form[i].value; break;
    case "muc#roomconfig_historylength":
      xows_doc.room_hmax.value = form[i].value; break;
    case "muc#roomconfig_defaulthistorymessages":
      xows_doc.room_hdef.value = form[i].value; break;
    case "muc#roomconfig_enablearchiving":
      xows_doc.room_arch.checked = xows_asbool(form[i].value); break;
    }
  }
}

/**
 * Room Configuration page on-input event callback function.
 * 
 * @param {object}  target    Target object of the triggered Event
 */
function xows_gui_page_room_oninput(target) 
{
  let change = false;

  const form = xows_doc_page_room.form;
  
  // Compare page inputs and received form values
  for(let i = 0, n = form.length; i < n; ++i) {
    switch(form[i]["var"])
    {
    case "muc#roomconfig_roomname":
      form[i].value !== xows_doc.room_titl.value; change = true; break;
    case "muc#roomconfig_roomdesc":
      form[i].value !== xows_doc.room_desc.value; change = true; break;
    case "muc#roomconfig_persistentroom":
      xows_asbool(form[i].value) !== xows_doc.room_pers.checked; change = true; break;
    case "muc#roomconfig_publicroom":
      xows_asbool(form[i].value) !== xows_doc.room_publ.checked; change = true; break;
    //case "muc#roomconfig_roomsecret":
    //  form[i].value = xows_doc.room_priv.checked ? xows_doc.room_pass.value : "";
    //  break;
    case "muc#roomconfig_membersonly":
      xows_asbool(form[i].value) !== xows_doc.room_mbon.checked; change = true; break;
    case "muc#roomconfig_moderatedroom":
      xows_asbool(form[i].value) !== xows_doc.room_modo.checked; change = true; break;
    case "muc#roomconfig_whois":
      form[i].value !== xows_doc.room_anon.value; change = true; break;
    case "muc#roomconfig_historylength":
      form[i].value !== xows_doc.room_hmax.value; change = true; break;
    case "muc#roomconfig_defaulthistorymessages":
      form[i].value !== xows_doc.room_hdef.value; change = true; break;
    case "muc#roomconfig_enablearchiving":
      xows_asbool(form[i].value) !== xows_doc.room_arch.checked; change = true; break;
    }
    
    if(change) break;
  }

  // Open Message Box for save changes
  if(change) xows_doc_mbox_open_for_save( xows_gui_page_room_onvalid,
                                          xows_gui_page_room_onabort);
}

/**
 * Room Configuration page on-close callback function.
 */
function xows_gui_page_room_onclose()
{
  const room = xows_doc_page_room.room;
  
  // Checks whether we are in Room initial config scenario, happening 
  // when user Join a non-existing Room that is created on the fly.
  if(room.init) {
    
    // Accept default config
    xows_cli_room_cfg_set(room, null, null);
    
  } else {

    // Cancel Room configuration
    xows_cli_room_cfg_cancel(room);
  }

  // unreference data
  xows_doc_page_room.form = null;
  xows_doc_page_room.room = null;
}

/**
 * Room Configuration page open.
 * 
 * If the form parameter is not set, it is assumed this is room subject
 * changes scenario, otherwise, the Room Configuration scenario is 
 * enabled.
 * 
 * @param {object}   room    Room object to be configured
 * @param {object}  [form]   Optional supplied form for config fields
 */
function xows_gui_page_room_open(room, form)
{
  // Store Room object
  xows_doc_page_room.room = room;
    
  // Store the current config form
  xows_doc_page_room.form = form;
  
  // Set the Room ID in the page header frame
  xows_doc.room_bare.innerText = room.bare;
  
  // Initialize inputs
  xows_gui_page_room_onabort();
  
  // Open dialog page
  xows_doc_page_open("page_room",true,xows_gui_page_room_onclose, 
                                      xows_gui_page_room_oninput);
           
  // Push navigation history
  xows_gui_nav_push("room_open", xows_gui_page_room_open);
}
