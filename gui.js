/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                        v0.9.0 - (Jan. 2021)
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
 *                 Copyright (c) 2020 - 2021 Eric M.
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
 * Get the DOM or Fragement element associated with the specified peer
 * either offscreen or in the current document.
 * 
 * @param   {object}  peer  Peer object to get element.
 * @param   {string}  id    Element ID to get.
 * 
 * @return  {object}  Element or null if not found.
 */
function xows_gui_peer_element(peer, id)
{
  if(peer === xows_gui_peer) {
    return xows_doc[id] ? xows_doc[id] : document.getElementById(id);
  } else {
    return xows_doc_frag_element(peer.bare, id);
  }
}

/**
 * Object that stores backed scroll values.
 */
const xows_gui_peer_scroll_db = {};

/**
 * Save the main chat scroll and client values for the specified peer.
 * 
 * @param   {string}  peer      Peer to save scroll value.
 */
function xows_gui_peer_scroll_backup(peer)
{
  if(!(peer.bare in xows_gui_peer_scroll_db)) 
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
 * @param   {string}  peer      Peer to restore scroll value.
 */
function xows_gui_peer_scroll_restore(peer)
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
 * @param   {string}  peer      Peer to get scroll value.
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
 * @param   {string}  peer      Peer to get scroll value.
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
 * @param   {string}  peer      Peer to get scroll value.
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
 * @param   {string}  peer      Peer to get scroll value.
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
 * @param   {string}  peer      Peer to get scroll value.
 * @param   {string}  offset    Offset value to move the scroll.
 */
function xows_gui_peer_scroll_seek(peer, offset)
{
  const obj = (peer !== xows_gui_peer) ?
            xows_gui_peer_scroll_db[peer.bare] :
            xows_doc.chat_main;

  obj.scrollTop = obj.scrollHeight - offset;
}


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
function xows_gui_nav_ev_popstate(event)
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
 * Function to force query and refresh for Room list
 */
function xows_gui_cont_list_reload()
{
  xows_gui_switch_peer(null);
  // Empty the list
  xows_doc.cont_ul.innerHTML = "";
  // Add loading spinner at top of list
  xows_doc_cls_add("cont_ul", XOWS_CLS_ROST_LOAD);
  // Query for roster content
  xows_cli_roster_get_query();
}

/**
 * Function to add or update item of the roster contact list
 * 
 * @param   {object}  cont      Contact object to add or update.
 */
function xows_gui_cli_oncontpush(cont)
{
  // Null room mean empty contact list
  if(cont === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_ul", XOWS_CLS_ROST_LOAD);
    return;
  }
  
  const li = document.getElementById(cont.bare);
  if(li) {
    // Update the existing contact <li> element according template
    xows_tpl_update_rost_cont(li, cont.name, cont.avat, 
                                cont.subs, cont.show, cont.stat);
    // If updated contact is current peer, alos update title bar
    if(cont === xows_gui_peer) xows_gui_chat_fram_update();
  } else {
    // Remove the potential loading spinner
    xows_doc_cls_rem("cont_ul", XOWS_CLS_ROST_LOAD);
    // Append new instance of contact <li> from template to roster <ul>
    xows_doc.cont_ul.appendChild(xows_tpl_spawn_rost_cont(cont.bare, cont.name, cont.avat,
                                                        cont.subs, cont.show, cont.stat));
    // Clone initial history to contact offscreen history
    xows_doc_frag_copy(cont.bare, "empty", "chat_hist");
    // Initial history scroll backup
    xows_gui_peer_scroll_backup(cont);
    // Clone initial empty occupant list
    xows_doc_frag_copy(cont.bare, "empty", "occu_list");
  }
}

/**
 * Function to remove item from the roster contact list
 * 
 * @param   {string}  bare    Contact bare JID to remove.
 */
function xows_gui_cli_oncontrem(bare)
{
  // Remove the DOM element
  const li = document.getElementById(bare);
  if(li) li.parentNode.removeChild(li);
}

/**
 * Function to force query and refresh for Room list
 */
function xows_gui_room_list_reload()
{
  xows_gui_switch_peer(null);
  // Empty the list
  xows_doc.room_ul.innerHTML = "";
  // Add loading spinner at top of list
  xows_doc_cls_add("room_ul", XOWS_CLS_ROST_LOAD);
  // Query to get public room list with delay
  setTimeout(xows_cli_muc_items_query, 500);
}

/**
 * Function to add or update item of the roster Room list
 * 
 * @param   {object}  room    Room object to add or update.
 */
function xows_gui_cli_onroompush(room)
{
  // Null room mean empty room list
  if(room === null) {
    // Remove the loadding spinner
    xows_doc_cls_rem("room_ul", XOWS_CLS_ROST_LOAD);
    return;
  }
  const li = document.getElementById(room.bare);
  if(li) {
    // Update room <li> element according template
    xows_tpl_update_rost_room(li, room.name, room.desc, room.lock);
    // If updated contact is current peer, alos update title bar
    if(room === xows_gui_peer) xows_gui_chat_fram_update();
  } else {
    // Remove the potential loading spinner
    xows_doc_cls_rem("room_ul", XOWS_CLS_ROST_LOAD);
    // Append new instance of contact <li> from template to roster <ul>
    xows_doc.room_ul.appendChild(xows_tpl_spawn_rost_room(room.bare, room.name, room.desc, room.lock));
    
    // Clone initial empty history to room offscreen history
    xows_doc_frag_copy(room.bare, "empty", "chat_hist");
    // Initial history scroll backup
    xows_gui_peer_scroll_backup(room);
    // Clone initial empty occupant list for room offscreen occupant list
    xows_doc_frag_copy(room.bare, "empty", "occu_list");
  }
}

/**
 * Function to handle click on roster add room
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_room_add_ev_clic(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Open Join Room dialog
  xows_gui_page_join_open();
}

/**
 * Handle the received occupant from MUC Room
 * 
 * @param   {object}    room      Room object.
 * @param   {object}    occu      Occupant object.
 * @param   {object}   [code]     Optionnal list of status code.
 */
function xows_gui_cli_onoccupush(room, occu, code)
{
  // checks whether we have a special status code with this occupant
  if(code && code.includes(110)) { //< initial own presence on Room join
    
    // Switch peer to newly joined room
    xows_gui_switch_peer(room.bare);
    
    // Close panel in case we are in narrow-screen with wide panel
    xows_gui_panel_close();
    
    if(code.includes(201)) { //< created Room initial config request
      
      // We are in a Room creation scenario, we then (re-)open the
      // Join Page with created room, this will ask user to configure
      // or use default
      xows_gui_page_join_open(room);
      
    } else {
      // Close potentially opened Join Page
      xows_doc_page_close();
    }
  }
  
  // Search for existing <li> element, either in the current document or
  // in an offscreen document fragment
  const li = xows_gui_peer_element(room, occu.jid);
              
  // Update existing or append new <li>
  if(li) {
    
    // Update the existing <li> ellement according template
    xows_tpl_update_room_occu(li, occu.name, occu.avat, 
                            occu.full, occu.show, occu.stat);
                            
    // Update message history
    xows_gui_hist_avat_upd(room, occu.jid, occu.avat);
    
  } else {
    
    // Select the proper role <ul> to put the occupant in
    let role_id = (occu.role === "moderator") ? "modo_ul" : "memb_ul";
    
    // If occupant is off-screen we get history <div> and <ul> of 
    // fragment history corresponding to contact
    const occu_ul = xows_gui_peer_element(room,role_id);
                    
    // Create and append new <li> element from template
    const inst = xows_tpl_spawn_room_occu(occu.jid, occu.name, occu.avat, 
                                        occu.full, occu.show, occu.stat);
    
    // Check whether we are this occupant
    if(occu.self) {
      // Hide the "Add Contact" button for self
      inst.querySelector("."+XOWS_CLS_OCCU_SUBS).classList.add(XOWS_CLS_HIDDEN);
      // If we are room owner, enable the room config button
      if(occu.affi === "owner") {
        xows_doc.menu_room.disabled = false;
      }
    }
    // Hide "Add Contact" button for Contacts already in roster
    if(occu.full) {
      if(xows_cli_get_cont(occu.full))
        inst.querySelector("."+XOWS_CLS_OCCU_SUBS).classList.add(XOWS_CLS_HIDDEN);
    }
    // Create and append new <li> element from template
    occu_ul.appendChild(inst);
  }
}

/**
 * Function to remove item from the room occupant list
 * 
 * @param   {object}  room    Room object to remove occupant from.
 * @param   {string}  full    Occupant full JID.
 */
function xows_gui_cli_onoccurem(room, full)
{
  // Search for existing <li> element, either in the current document or
  // in an offscreen document fragment
  const li = xows_gui_peer_element(room,full);
  if(li) li.parentNode.removeChild(li);
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
  
  // if we are in narro-screen, expand left panel
  if(!window.matchMedia("(min-width: 800px)").matches) {
    xows_gui_panel_open(xows_doc.main_tabs);
  }
  
  // Reset the Roster and Chat window
  xows_gui_peer = null;
  // Setup the lazy loader
  xows_doc_loader_setup(xows_doc.chat_main, XOWS_LAZY_SRC_ATTR);
  // Check whether file Upload is available
  if(xows_cli_service_exist(XOWS_NS_HTTPUPLOAD)) {
    xows_doc.chat_upld.disabled = false;
    // Add embeded download matching http upload service domain
    xows_tpl_embed_add_dwnl(xows_cli_service_url[XOWS_NS_HTTPUPLOAD]);
  }
  // Check whether MUC service is available
  if(xows_cli_service_exist(XOWS_NS_MUC)) {
    xows_doc.tab_room.disabled = false;
  }
  // Set the presence menu for current user
  xows_gui_cli_onselfchange(user);
  
  // Refresh public room list
  xows_gui_room_list_reload();
}

/**
 * Stack for currently wrinting Contact or Room Occupant
 */
const xows_gui_writing_list = [];

/**
 * Clear the currently writing stack and notification message.
 */
function xows_gui_writing_notif_clear()
{
  // Empty the typing stack
  if(xows_gui_writing_list.length !== 0)
    xows_gui_writing_list.length = 0;
  
  // Hide and clear the typing notification
  xows_doc_hide("chat_stat");
  xows_doc.chat_stat.innerHTML = "";
}

/**
 * Add or remove currently writing people to stack and 
 * compose the proper notification message.
 * 
 * @param   {string}  from     Wrinting full JID.
 * @param   {boolean} writing  Is currently writing value.
 */
function xows_gui_writing_notif_set(from, writing)
{
  // Simply get list reference
  const list = xows_gui_writing_list;
  
  // Get JID position in stack or -1
  const i = list.indexOf(from);
  
  if(writing) {
    // Add peer (contact or room occupant) to stack
    if(i < 0) list.push(from);
  } else {
    // Remove Peer (contact or room occupant) from stack
    if(i >= 0) list.splice(i,1);
  }
  
  const n = list.length;
  
  if(n > 0) {
    if(xows_gui_peer) {
      // Show the notification
      xows_doc_show("chat_stat");
      // Compose the notification string
      if(xows_gui_peer.type === XOWS_PEER_CONT) {
        // The easy part, peer is a single Contact
        xows_doc.chat_stat.innerHTML = "<b>"+xows_gui_peer.name+"</b> " + 
                                      xows_l10n_get("is currently writing");                            
      } else {
        // The hard part, peer is a chat room, we may have
        // several people typing the same time
        let str = "";
        if(n > 1) {
          // We display tow names maximum with the count of other 
          // typing people if needed
          const l = (n > 2) ? 2 : n - 1;
          // Add the first, or tow first name(s).
          for(let i = 0; i < l; ++i) {
            str += "<b>"+xows_jid_to_nick(list[i])+"</b>";
            if(i < (l-1)) str += ", ";
          }
          // Now append the last part
          str += " "+xows_l10n_get("and")+" <b>";
          // We add either the last name or the remaining count
          const r = (n - l);
          if(r > 1) {
            str += r + " " + xows_l10n_get("other(s)")+"</b> ";
          } else {
            str += xows_jid_to_nick(list[n-1])+"</b> ";
          }
          xows_doc.chat_stat.innerHTML = str + xows_l10n_get("are currently writing");
        } else {
          // The easy part, peer is alone
          xows_doc.chat_stat.innerHTML = "<b>"+xows_jid_to_nick(list[0])+"</b> " + 
                                        xows_l10n_get("is currently writing");
        }
      }
    }
  } else {
    // Clear the typing notification
    xows_gui_writing_notif_clear();
  }
}

/**
 * Update the presence menu according current own presence show level
 * and status
 * 
 * @param {object}  user    User object.
 */
function xows_gui_cli_onselfchange(user)
{
  // Compose status string
  xows_doc.user_stat.placeholder = user.stat?user.stat:xows_l10n_get("No status defined");
  // Reset the Status input value
  xows_doc.user_stat.value = "";
  xows_doc.user_stat.blur();
  // Change Show Status displays
  xows_doc.user_show.setAttribute("show", user.show);
  xows_doc.user_name.innerHTML = user.name;
  xows_doc.user_addr.innerHTML = "("+user.bare+")";
  
  // Update avatar
  xows_tpl_spawn_avat_cls(user.avat); //< Add avatar CSS class 
  xows_doc.user_avat.className = "h-"+user.avat;
}

/**
 * Update the window title bar according current selected contact
 */
function xows_gui_chat_fram_update()
{
  if(!xows_gui_peer) {
    // Reset to empty chat window
    xows_doc.chat_titl.innerHTML = "";
    xows_doc.chat_addr.innerHTML = "";
    xows_doc.head_meta.innerHTML = "";
    xows_doc.send_wrap.setAttribute("placeholder", "");
    xows_doc.chat_stat.innerHTML = "";
    xows_doc_hide("chat_show");
    return;
  }
  // Update chat title bar
  xows_doc.chat_titl.innerHTML = xows_gui_peer.name;
  if(xows_gui_peer.type === XOWS_PEER_CONT) {
    xows_doc_show("chat_show");
    xows_doc_show("chat_addr");
    xows_doc.chat_show.setAttribute("show", xows_gui_peer.show);
    xows_doc.chat_addr.innerHTML = "("+xows_gui_peer.bare+")";
    xows_doc.head_meta.innerHTML = xows_gui_peer.stat?xows_gui_peer.stat:"";
  } else {
    xows_doc_hide("chat_show");
    xows_doc_hide("chat_addr");
    xows_doc.head_meta.innerHTML = xows_gui_peer.subj;
  }
  // Hide or show the proper notification button
  if(xows_gui_peer.noti) {
    xows_doc_show("chat_noti");
    xows_doc_hide("chat_mute");
  } else {
    xows_doc_show("chat_mute");
    xows_doc_hide("chat_noti");
  }

  // Change the input placeholder text
  xows_doc.send_wrap.setAttribute("placeholder",xows_l10n_get("Send a message to")+" "+xows_gui_peer.name+" ...");
}

/**
 * Switch the current roster tab.
 * 
 * @param   {string}  tab   Tab ID to select.
 */
function xows_gui_rost_switch(tab)
{
  let list = null;
  
  if(tab === "tab_cont") {
    if(xows_doc_hidden("cont_list")) {
      xows_doc_show("cont_list");
      xows_doc_hide("room_list");
      xows_doc_cls_rem("tab_room", "tab-enabled");  //< unselect
      xows_doc_cls_add("tab_cont", "tab-enabled");  //< select
      // Set title bar text
      xows_doc.rost_titl.innerHTML = xows_l10n_get("Contacts");
      // show / hide and enable / disable actions buttons
      xows_doc_show("cont_add"); //xows_doc.cont_add.disabled = false;
      xows_doc_hide("room_add"); //xows_doc.room_add.disabled = true;
      xows_doc_hide("room_upd"); //xows_doc.room_upd.disabled = true;
      // Search selected peer in contact list
      list = xows_doc.cont_ul;
    }
  } else {
    if(xows_doc_hidden("room_list")) {
      xows_doc_show("room_list");
      xows_doc_hide("cont_list");
      xows_doc_cls_rem("tab_cont", "tab-enabled");  //< unselect
      xows_doc_cls_add("tab_room", "tab-enabled");  //< select
      // Set title bar text
      xows_doc.rost_titl.innerHTML = xows_l10n_get("Chat rooms");
      // show / hide and enable / disable actions buttons
      xows_doc_hide("cont_add"); //xows_doc.cont_add.disabled = true;
      xows_doc_show("room_add"); //xows_doc.room_add.disabled = false;
      xows_doc_show("room_upd"); //xows_doc.room_upd.disabled = false;
      // Search selected peer in room list
      list = xows_doc.room_ul;
    }
  }
  if(list) {
    const select = list.querySelector(".peer-selected");
    xows_gui_switch_peer(select ? select.id : null);
  }
}

/**
 * Callback function to handle click event on GUI Roster Tabs <li>.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_rost_tabs_ev_clic(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  const button = event.target.closest("button"); 
  if(button) xows_gui_rost_switch(button.getAttribute("id"));
}

/**
 * Switch the current active chat contact.
 * 
 * @param   {string}  jid   Peer JID to select.
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
  const next = jid ? xows_cli_get_peer(jid) : null;
  
  if(prev) {
    // Backup current history scroll position
    xows_gui_peer_scroll_backup(prev);
    // Backup current contact history in a document fragment
    xows_doc_frag_backup(prev.bare, "chat_hist");
    // Backup current occupant list in a document fragment
    xows_doc_frag_backup(prev.bare, "occu_list");
    // Remove "selected" class from <li> element
    if(next) {
      if(next.type === prev.type) {
        document.getElementById(prev.bare).classList.remove("peer-selected");
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
    document.getElementById(next.bare).classList.add("peer-selected");
    // Restore contact history from document fragment
    xows_doc_frag_restore(next.bare, "chat_hist");
    // Restore occupant list from document fragment
    xows_doc_frag_restore(next.bare, "occu_list");
    // Restore history scroll position
    xows_gui_peer_scroll_restore(next);
    // Open or close right panel
    xows_doc_cls_set("main_colr", "main-col-hide", (next.type !== XOWS_PEER_ROOM));
    // Set the current contact
    xows_gui_peer = next;
    // Join the room if required
    if(next.type === XOWS_PEER_ROOM) 
      if(!next.join) xows_cli_room_join(next);
    // Clear contact unread notification for next peer
    xows_gui_unread_reset(next);
    // Reset the lazy loader and force update
    xows_doc_loader_clear();
    xows_doc_loader_monitor(xows_doc.chat_main);
    xows_doc_loader_check();
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
      // Copy initial empty element to current document
      xows_doc_frag_copy(null, "empty", "chat_hist");
      xows_doc_frag_copy(null, "empty", "occu_list");
      // Close right panel
      xows_doc_cls_add("main_colr", "main-col-hide");
      push_nav = true; //< we can push nav
    }
  }
  
  // Reset the typing notification and stack
  xows_gui_writing_notif_clear();
  
  // Update chat controls and title bar
  xows_gui_chat_fram_update();
  
  // push navigation history
  if(push_nav) 
    xows_gui_nav_push("switch_peer", xows_gui_switch_peer, jid);
}

/**
 * Callback function to handle click event on GUI 
 * Contact or Room list <li> element.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_rost_ul_ev_clic(event)
{
  const li = event.target.closest("li");

  if(!li) return;
  
  if(event.target.tagName === "BUTTON") {
    switch(event.target.name)
    {
    case "subs":
        // Resend subscribe request & display message box
        xows_cli_subscribe_request(li.id);
        xows_doc_mbox_open(2, "New authorization request was sent");
      return;
    case "rem":
      // Display confirmation message box
      xows_gui_mbox_subs_edit_open(li.id);
      return;
    }
  } else {
    // Select peer
    xows_gui_switch_peer(li.id);
    
    // Close panel in case we are in narrow-screen with wide panel
    xows_gui_panel_close();
  }
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Callback function to handle click event on GUI 
 * subscription list <li> element.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_subs_ul_ev_clic(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  const li = event.target.closest("li");
  
  if(li) xows_gui_mbox_subs_auth_open(li.id, li.name);
}

/**
 * Function to add and/or increase an unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param   {object}  peer      Peer object, either Room or Contact.
 * @param   {string}  id        Message Id (not yet used).
 */
function xows_gui_unread_notify(peer, id)
{
  let n, cls, tab;
  // Select proper values depending peer type
  if(peer.type === XOWS_PEER_ROOM) {
    cls = "."+XOWS_CLS_PEER_UNRD;
    tab = xows_doc.room_unrd;
  } else {
    cls = "."+XOWS_CLS_PEER_UNRD;
    tab = xows_doc.cont_unrd;
  }
  // Add the unread for the roster tab
  n = tab.firstChild ? parseInt(tab.innerHTML) : 0;
  tab.innerHTML = n + 1;
  tab.classList.remove(XOWS_CLS_HIDDEN); //< show
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    // Inside the <li> search for the unread <div>
    const dv = li.querySelector(cls);
    // Increase the current unread count
    n = dv.firstChild ? parseInt(dv.innerHTML) : 0;
    dv.innerHTML = n + 1;
    dv.classList.remove(XOWS_CLS_HIDDEN); //< show
  }
}

/**
 * Function to clear any unread message notification on 
 * the displayed roster contact DOM element.
 * 
 * @param   {object} peer      Peer object, either Room or Contact.
 */
function xows_gui_unread_reset(peer)
{
  let n, cls, tab;
  // Select proper values depending peer type
  if(peer.type === XOWS_PEER_ROOM) {
    cls = "."+XOWS_CLS_PEER_UNRD;
    tab = xows_doc.room_unrd;
  } else {
    cls = "."+XOWS_CLS_PEER_UNRD;
    tab = xows_doc.cont_unrd;
  }
  // Store current tab total unread
  n = tab.firstChild ? parseInt(tab.innerHTML) : 0;
  // Get the corresponding peer <li> (room or contact) in roster 
  const li = document.getElementById(peer.bare);
  if(li) {
    // Inside the <li> search for the unread <div>
    const dv = li.querySelector(cls);
    // Subtract the element unread from tab total
    n -= dv.firstChild ? parseInt(dv.innerHTML) : 0;
    // Reset the unready div properties
    dv.innerHTML = "";
    dv.classList.add(XOWS_CLS_HIDDEN); //< hide
  }
  // Update the tab unread count, or disable it if suitable
  tab.innerHTML = (n > 0) ? n : "";
  if(n <= 0) tab.classList.add(XOWS_CLS_HIDDEN); //< hide
}

/**
 * Add subscription request to the roster.
 * 
 * This function add a new Subscription request element in the 
 * roster
 * 
 * @param   {string}    bare    Subscription request sender bare JID.
 * @param   {string}    [nick]  Prefered nickname (if available).
 */
function xows_gui_cli_onsubspush(bare, nick)
{
  // Ensure subscribe <li> does not already exists
  let i = xows_doc.subs_ul.childNodes.length;
  while(i--) if(xows_doc.subs_ul.childNodes[i].id === bare) return;
  // Create a new subcription <li> element from template
  xows_doc.subs_ul.appendChild(xows_tpl_spawn_rost_subs(bare, nick));
  // Enable the notification on roster Contact Tab button
  xows_doc_show("subs_unrd");
  xows_doc.subs_unrd.innerHTML = xows_doc.subs_ul.childNodes.length;
}

/**
 * Cleanup subscription request from roster.
 * 
 * This function remove a Subscription request element from the 
 * roster
 * 
 * @param   {string}    bare   Subscription request bare JID.
 */
function xows_gui_cli_onsubsrem(bare)
{
  // To ensure we don't remove the Contact <li> we manualy search
  // in subs_ul children
  let i = xows_doc.subs_ul.childNodes.length;
  while(i--) {
    if(xows_doc.subs_ul.childNodes[i].id === bare) {
      xows_doc.subs_ul.removeChild(xows_doc.subs_ul.childNodes[i]);
      break;
    }
  }
  // Update or disable the notification on roster Contact Tab button
  const n = xows_doc.subs_ul.childNodes.length;
  if(n) {
    xows_doc.subs_unrd.innerHTML = n;
  } else {
    xows_doc.subs_unrd.innerHTML = "";
    xows_doc_hide("subs_unrd");
  }
}


/**
 * Handle the received composing state from other contacts to display
 * it in the chat window.
 * 
 * @param   {object}    peer  Sender peer object.
 * @param   {string}    from  Sender full JID.
 * @param   {number}    chat  Chat state value.
 */
function xows_gui_cli_onchatstate(peer, from, chat)
{
  // Check whether incoming composing is the currently selected contact
  if(peer === xows_gui_peer) {
    // Check whether this is composing or another
    if(chat > XOWS_CHAT_PAUS) {
      xows_gui_writing_notif_set(from , true);
    } else {
      xows_gui_writing_notif_set(from , false);
    }
  }
}

/**
 * Create new message DOM object to be inserted in history.
 * 
 * @param   {object}    prev    Previous message of history.
 * @param   {string}    id      Message ID.
 * @param   {string}    from    Message sender JID.
 * @param   {string}    body    Message content.
 * @param   {string}    time    Message timestamp.
 * @param   {boolean}   sent    Marks message as sent by client.
 * @param   {boolean}   recp    Marks message as receipt received.
 * @param   {object}    sndr    Message sender Peer object.
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
 * Callback function to add sent or received message to the history 
 * window
 * 
 * @param   {object}    peer      Message Peer.
 * @param   {string}    id        Message ID.
 * @param   {string}    from      Message sender JID.
 * @param   {string}    body      Message content.
 * @param   {string}    time      Message timestamp
 * @param   {boolean}   sent      Marks message as sent by client.
 * @param   {boolean}   recp      Marks message as receipt received.
 * @param   {object}    sndr      Message sender Peer object.
 */
function xows_gui_cli_onmessage(peer, id, from, body, time, sent, recp, sndr)
{
  // Checks whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Add unread notification for this contact
  if(offscreen) xows_gui_unread_notify(peer, id);
  
  // Send browser notification popup
  if(!xows_gui_has_focus && !sent && peer.noti) 
    xows_gui_notify_new(sndr.name, body, sndr.avat);
  
  // Check whether end of history is croped, in this cas the new message
  // must not be appended, we will show it by querying archives
  if(!sent && !hist_end.classList.contains(XOWS_CLS_HIDDEN)) {
    // Show the "new messages" warning
    xows_gui_peer_element(peer,"hist_new").classList.remove(XOWS_CLS_HIDDEN);
    // Do not append any message, return now
    return;
  }
  
  // Required elements, offscreen or from document
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  
  // If message with id alread exists, return now to prevent double
  if(xows_doc_get_child(hist_ul, id))
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
    xows_gui_peer_element(peer,"hist_beg").innerHTML = ""; //< Allow query history
  }
  
  // If it is an incomming message and client is consulting top of
  // history, we don't scroll at bottom but display a warning message
  if(!sent && (scrl_bot > 100)) {
    // Show the "new messages" warning
    xows_gui_peer_element(peer,"hist_new").classList.remove(XOWS_CLS_HIDDEN); //< show
  } else {
    // scroll history down
    xows_gui_peer_scroll_down(peer);
  }
  
  if(!offscreen) {
    // Add message medias to be monitored by lazy loader
    xows_doc_loader_monitor(li);
    xows_doc_loader_check();
  }
}

/**
 * Update avatar for chat history messages. Should be used carefully
 * to preserve resources.
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    from    Message author JID to search.
 * @param   {string}    hash    Replacement avatar hash to set.
 */
function xows_gui_hist_avat_upd(peer, from, hash)
{
  if(!hash) return;

  // If incoming message is off-screen we get history <div> and <ul> of 
  // fragment history corresponding to contact
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  
  const cls = "h-"+hash;
  
  let figure, li, i = hist_ul.childNodes.length;
  while(i--) {
    li = hist_ul.childNodes[i];
    if(li.getAttribute("from") === from) {
      figure = li.querySelector("FIGURE");
      if(figure) figure.className = cls;
    }
  }
}

/**
 * Handle incomming receipts from the server to update history message
 * element style.
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    id      Receipt related message Id.
 */
function xows_gui_cli_onreceipt(peer, id)
{
  // Check whether message is from or to current chat contact
  const li = xows_gui_peer_element(peer,id);
  if(li) {
    li.querySelector("P").classList.add(XOWS_CLS_MESG_RECP);
  } else {
    xows_log(1,"gui_hist_set_receipt","message not found",id);
  }
}

/**
 * Handle incomming room subjec from MUC room
 * 
 * @param   {object}    peer    Peer object.
 * @param   {string}    subj    Subject string.
 */
function xows_gui_cli_onsubject(peer, subj)
{
  if(peer === xows_gui_peer) {
    xows_doc.head_meta.innerHTML = subj ? subj : "";
  }
}

/**
 * Reference to setTimeout sent fo temporize archive queries
 */
let xows_gui_mam_query_timeout = null;

/**
 * Query arvhived message for the current chat contact.
 * 
 * The 'after' parameter is used to choose to get either newers or 
 * older messages than the ones currently present in the history <div>
 * if 'after' parameter is true, the function will query for newer 
 * messages.
 * 
 * @param   {boolean}   after   Get archives beyond first of after last message.
 * @param   {number}    max     Maximum result to get, default is 20.
 * @param   {boolean}   delay   Delay to temporize query, default is 100 MS.
 */
function xows_gui_mam_query(after, max = 20, delay = 100)
{
  if(!xows_gui_mam_query_timeout) { //< One poll at a time...
    
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
      xows_doc_cls_add("hist_end", "hist-loading");
    } else {
      // Check whether we already reached the first archived message
      if(xows_doc.hist_beg.innerHTML.length)
        return;
      if(xows_doc.hist_ul.childNodes.length) 
        end = parseInt(xows_doc.hist_ul.firstChild.getAttribute("time"));
      xows_doc_cls_add("hist_beg", "hist-loading");
    }
    // To prevent flood and increase ergonomy the archive query is
    // temporised with a fake loading time.
    xows_gui_mam_query_timeout = setTimeout(xows_cli_mam_query,
                                            delay, xows_gui_peer, 
                                            max, start, end, 
                                            xows_gui_mam_handle);
  }
}

/**
 * Callback function to handle the received archives for a contacts.
 * 
 * @param   {object}    peer        Archive related peer (Contact or Room)
 * @param   {object[]}  result      Received archived messages
 * @param   {boolean}   complete    Indicate results are complete (no remain) 
 */
function xows_gui_mam_handle(peer, result, complete)
{
  // Check whether message is from or to current chat contact, 
  // otherwise the message must be added off-screen
  const offscreen = (peer !== xows_gui_peer);
  
  // Get elements we need to interact with
  const hist_ul = xows_gui_peer_element(peer,"hist_ul");
  const hist_beg = xows_gui_peer_element(peer,"hist_beg");
  const hist_end = xows_gui_peer_element(peer,"hist_end");
  
  // Disable all spin loader
  hist_beg.classList.remove("hist-loading"); //< Allow query history
  hist_end.classList.remove("hist-loading"); //< Allow query history

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
      hist_end.classList.remove(XOWS_CLS_HIDDEN); //< Allow query history
    } else {
      // Result are newer messages, we delete messages at top of history
      while(crop--) hist_ul.removeChild(hist_ul.firstChild);
      hist_beg.innerHTML = ""; //< Allow query history
    }
  }
  
  // Store scroll offset to restore it at its previous position
  const scroll_off = xows_gui_peer_scroll_off(peer);
    
  let new_li, pre_li;
  
  // Store the count of message actualy appended to the history <ul>
  let appended = 0;
  
  for(let i = 0, n = result.length; i < n; ++i) {
    
    // If message with id alread exists, skip to prevent double
    if(xows_doc_get_child(hist_ul, result[i].id))
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
      hist_beg.innerHTML = xows_l10n_get("Start of history");
    } else {
      hist_end.classList.add(XOWS_CLS_HIDDEN);
    }
  }

  if(!offscreen) {
    // Realign scroll to its previous position
    if(insert) xows_gui_peer_scroll_seek(peer,scroll_off);
    // For the first mam query, scroll down
    if(initial) xows_gui_peer_scroll_down(peer);
    // Launch lazy loader check routine
    xows_doc_loader_check();
  }
  
  xows_gui_mam_query_timeout = null; //< Allow a new archive query
}

/**
 * Callback function to handle click event on side panels.
 * 
 * @param   {object}  event   Event data
 */
function xows_gui_panel_ev_clic(event)
{
  // this behavior is reserved for narrow-screen mode
  if(!window.matchMedia("(min-width: 800px)").matches) {
    
    const wrap = xows_doc.main_wrap;
    
    xows_cli_activity_wakeup(); //< Wakeup presence
    
    // check whether a side panel is alread opened
    if(wrap.classList.length) {
      
      // check for click on any handle to close panel
      if(event.target === xows_doc.main_hndr || event.target === xows_doc.main_hndl) {
        xows_gui_main_open();
      }
    } else {
      // prevent to trigger other event listeners
      /*
      if(this !== xows_doc.main_tabs)
        event.stopPropagation();
      */
      
      // open clicked panel
      xows_gui_panel_open(this);
    }
  }
}

/**
 * User Presence (show) menu button/drop on-click callback
 * 
 * @param   {object}  event   Event object associated with trigger
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


/**
 * Chat Emoji menu button/drop on-click callback
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_menu_emoj_onclick(event)
{
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");
  
  // Check whether we got click from drop or button
  if(li) {
    //xows_doc.send_edit.innerHTML += ":"+li.getAttribute("name")+":";
    xows_doc.send_edit.innerHTML += "<emoj>"+li.childNodes[0].nodeValue+"</emoj>";
    // disable placeholder
    xows_doc.send_wrap.classList.remove("send-phld");
    xows_doc.send_edit.focus();// inp.select();
  } 
  
  // Toggle menu drop and focus button
  xows_doc_menu_toggle(xows_doc.menu_emoj, "drop_emoj");
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}


/**
 * Function to handle click on room occupant list
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_occu_list(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence
  
  // Check for click on <button> object
  if(event.target.tagName === "BUTTON") {
    
    const li = event.target.closest("li");
    
    if(li) {
      // get contact address
      const bare = xows_jid_to_bare(li.getAttribute("jid"));
      
      if(xows_is_jid(bare)) {
        
        // Compose display name from JID
        const userid = bare.split("@")[0];
        const name = userid[0].toUpperCase() + userid.slice(1);

        // Open confirmation dialog
        xows_gui_mbox_subs_edit_open(bare, name);
        
      }
    }
  }
}

/**
 * Function to handle chat file button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_upld(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Reset and enable Input value
  xows_doc.chat_file.value = "";

  // Open the file selector (emulate click)
  xows_doc.chat_file.click();
}

/**
 * Function to handle click on Room Config button or drop menu
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_room_menu(event)
{
  // Retreive the parent <li> element of the event target
  const li = event.target.closest("li");
  
  if(li) {
    // Get clicked menu name
    switch(li.getAttribute("name")) 
    {
    case "subject":
      // Set input value from current chat header element
      xows_doc.room_subj.value = xows_doc.head_meta.innerHTML;
      // Show the room page subject div, hide config
      xows_doc_hide("room_conf");
      xows_doc_show("room_edit");
      // Open the room page
      xows_doc_show("page_room");
      break;
    case "config":
      // Get current room config to be modified, this will trigger
      // a callback to handle the received config
      xows_cli_room_cfg_get(xows_gui_peer, xows_gui_page_room_open);
      break;
    }
  }
  
  // Toggle drop menu
  xows_doc_cls_tog("drop_room",XOWS_CLS_HIDDEN);
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Function to handle click on Chat Notify button
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_noti(event)
{
  if(event.target.id === "chat_noti") {
    xows_gui_notify_allow = 0;
    xows_doc_show("chat_mute");
    xows_doc_hide("chat_noti");
    xows_gui_peer.noti = false;
  } else {
    xows_gui_notify_allow_query();
  }
}

/**
 * Table to store current down key
 */
const xows_gui_evt_keydown = new Array(256);

/**
 * Callback function to handle keydown & keyup event on chat send 
 * editable div
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_keyud_send_edit(event)
{
  // Enable key down according received event
  xows_gui_evt_keydown[event.keyCode] = (event.type === "keydown");

  // Check for key down event
  if(event.type === "keydown") {

    // Check for prend Enter
    if(event.keyCode === 13) {
  
      // Check whether shift key is press, meaning escaping to
      // add new line in input instead of send message.
      if(xows_gui_evt_keydown[16])
        return;
    
      // Prevent browser to append the new-line in the text-area
      event.preventDefault();
      // Send message
      if(xows_gui_peer) {
        let content = xows_doc.send_edit.innerText;
        if(content.length) { 
          xows_cli_send_message(xows_gui_peer, content);
          // Add CSS class to show placeholder
          xows_doc_cls_add("send_wrap", "send-phld");
          // Erase and disable edit area until enter keyup
          xows_doc.send_edit.innerHTML = "";
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

  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Callback function to handle input event on chat send editable div
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_input_send_edit(event)
{
  // Check inner text content to show placeholder
  if(xows_doc.send_edit.innerText.length < 2) {
    if(xows_doc.send_edit.innerText.trim().length === 0) {
      // Add CSS class to show placeholder
      xows_doc_cls_add("send_wrap", "send-phld");
      xows_doc.send_edit.innerHTML = ""; //< empty any residual <br>
      // Return now
      return;
    }
  }
  
  // Hide the placeholder text
  if(xows_doc_cls_has("send_wrap", "send-phld"))
    xows_doc_cls_rem("send_wrap", "send-phld");
}

/**
 * Callback function to handle keypress event on status input
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_keyp_user_stat(event)
{
  if(event.keyCode === 13) { //< Return key 
    
    // Get and reset value
    const stat = xows_doc.user_stat.value;
    xows_doc.user_stat.value = "";
    
    // Inform XMPP server of the new status
    xows_cli_change_status(stat);
    
    // Unfocus and set the placeholder as current status
    xows_doc.user_stat.placeholder = stat.length ? stat : xows_l10n_get("No status defined");
    xows_doc.user_stat.blur();
  }
  
  xows_cli_activity_wakeup(); //< Wakeup presence
}

/**
 * Callback function to handle user scroll the chat history window.
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_scroll_chat_main(event)
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
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_evt_click_chat_main(event)
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
      xows_doc.hist_ul.innerHTML = "";
      xows_doc.hist_beg.innerHTML = "";
      xows_doc_hide("hist_end");
      
      // Query for the last archives, with no delay
      xows_gui_mam_query(false, XOWS_GUI_HIST_SIZE, 0);
    }
  }
}

/**
 * Function to handle upload dialog input change by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_chat_file_onchange(event)
{
  if(xows_gui_peer.bare && xows_doc.chat_file.files[0]) {
    xows_gui_upld_open(xows_doc.chat_file.files[0]);
  }
}

/**
 * Handle the client/Web page focus change.
 */
function xows_gui_wnd_ev_focus()
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
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_wnd_ev_unload(event)
{
  xows_log(2,"gui_evt_unload","Unload event from browser");
  xows_gui_disconnect();
}

/**
 * Store browser Notification authorization
 */
let xows_gui_notify_allow = 0;

/**
 * Store awaiting notification untile permission
 */
let xows_gui_notify_await = null;

/**
 * Handle received notification permission from user
 * 
 * @param   {string}  permit   Received permission
 */
function xows_gui_notify_allow_handle(permit)
{
  xows_gui_notify_allow = permit;
  
  if(permit === "granted") {
    
    if(xows_gui_peer) {
      xows_gui_peer.noti = true;
      xows_doc_hide("chat_mute");
      xows_doc_show("chat_noti");
    }
    
    // Send an reset awaiting notification
    if(xows_gui_notify_await) {
      xows_gui_notify_new(xows_gui_notify_await.title, 
                          xows_gui_notify_await.body, 
                          xows_gui_notify_await.avat);
      xows_gui_notify_await = null;
    }
  }
}

/**
 * Query user for notification permission
 */
function xows_gui_notify_allow_query()
{
  // Reset notification permission
  xows_gui_notify_allow = 0;
  // Request permission to user
  Notification.requestPermission().then(xows_gui_notify_allow_handle);
}
  
/**
 * Pop a new browser Notification
 * 
 * @param   {string}  title   Notification title (peer name)
 * @param   {string}  body    Notification body (message body)
 * @param   {string}  avat    Optional Avatar hash
 */
function xows_gui_notify_new(title, body, avat)
{
  switch(xows_gui_notify_allow)
  {
  case "denied":
    return;
  case "granted":
    {
      // Sound is slower than light...
      xows_gui_notify_sound.play();
      
      // Retrieve the cached, actual or temporary, avatar dataUrl
      const icon = xows_cach_avat_get(avat);
      let notif;
      if(icon) {
        notif = new Notification(title,{"body":body,"icon":icon});
      } else {
        notif = new Notification(title,{"body":body,"icon":"/" + xows_options.root + "/icon.svg"});
      }
    }
    break;
  default:
    xows_gui_notify_await = {"title":title,"body":body,"avat":avat};
    // Request permission to user for notifications
    xows_gui_notify_allow_query();
    break;
  }
}

/**
 * Reset the GUI to its initial state
 */
function xows_gui_reset()
{
  xows_log(2,"gui_reset","reset DOM states");
  
  // Clean and reset GUI elements
  xows_gui_switch_peer(null);
      
  // All element to hide
  const hide = ["scr_main", "scr_void", 
                "page_cont", "page_user", "page_join", "page_room", "page_regi", "page_auth", "page_wait", 
                "drop_show", "drop_emoj", 
                "chat_fram", "chat_stat",  "hist_end", "hist_new", 
                "room_list"];
  
  let i = hide.length;
  while(i--) xows_doc_hide(hide[i]);
  
  xows_doc.cont_ul.innerHTML = "";
  xows_doc.room_ul.innerHTML = "";
  xows_doc.favs_ul.innerHTML = "";
  xows_doc.hist_ul.innerHTML = "";
  xows_doc.modo_ul.innerHTML = "";
  xows_doc.memb_ul.innerHTML = "";
  xows_doc.hist_beg.innerHTML = "";

  // Reset roster tabs
  xows_doc_cls_add("tab_cont", "tab-enabled");
  xows_doc_cls_rem("tab_room", "tab-enabled");
  xows_doc_show("cont_list");
  
  // Reset columns setup
  xows_doc_cls_rem("main_coll", "main-col-thin");
  xows_doc_cls_rem("main_coll", "main-col-wide");
  xows_doc_cls_rem("main_coll", "main-col-hide");
  xows_doc_cls_rem("main_colr", "main-col-thin");
  xows_doc_cls_rem("main_colr", "main-col-wide");
  xows_doc_cls_add("main_colr", "main-col-hide");
  
  // Delete all peer's offscreen fragment
  for(const peer in xows_doc_frag_db) {
    // we keep the "empty" fragment
    if(peer !== "empty") delete xows_doc_frag_db[peer];
  }
  
  // The DOM is now to its default state
  xows_gui_clean = true;
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

/* -------------------------------------------------------------------
 * 
 *   NEW API SET
 * 
 * -------------------------------------------------------------------*/

/* -------------------------------------------------------------------
 * 
 * Main Screen Interface
 * 
 * -------------------------------------------------------------------*/

/* -------------------------------------------------------------------
 * Main screen : Main Screen mechanisms
 * -------------------------------------------------------------------*/
 
/**
 * Main screen application open
 */
function xows_gui_main_open()
{
  // Check for opened dialog
  if(!xows_doc_hidden("scr_page")) {
    // Close any opened page
    xows_doc_page_close(true);
    
    // hide page and menu 'screen'
    xows_doc_hide("scr_page");
    // show main 'screen'
    xows_doc_show("scr_main");
  }

  // close panel if any
  xows_gui_panel_close();

  // Add navigation history
  xows_gui_nav_push("main_open", xows_gui_main_open);
}

/* -------------------------------------------------------------------
 * Main screen : Side Panel Mechanisms
 * -------------------------------------------------------------------*/
 
/**
 * Main Screen close side panel.
 */
function xows_gui_panel_close()
{
  // Check for widened panel
  if(xows_doc.main_wrap.classList.length) {
    // restore normal stat
    xows_doc.main_wrap.classList = "";
    // enable Nav button again
    xows_doc.app_menu.disabled = false;
  }
}

/**
 * Main Screen open side panel.
 * 
 * @param   {object}  panel   Side column <div> object to open.
 */
function xows_gui_panel_open(panel)
{
  if(!xows_doc.main_wrap.classList.length) {
    
    // hide other panel and enable handle listener
    if(panel === xows_doc.main_colr) {
      xows_doc.main_wrap.classList = "main-colr-wide";
    } else {
      xows_doc.main_wrap.classList = "main-coll-wide";
    }
    
    // disable Nav button
    xows_doc.app_menu.disabled = true;
    
    // Add navigation history
    xows_gui_nav_push("panel_open", xows_gui_panel_open);
  }
}

/* -------------------------------------------------------------------
 * 
 * Main Screen Message Box Dialogs
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Main screen : Disconnect Confirmation dialog
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
  xows_doc_mbox_open(1, "Do you really want to disconnect current session ?",
                        xows_gui_mbox_exit_onvalid, "Yes",
                        xows_gui_mbox_exit_onabort, "No",
                        true);
}

/* -------------------------------------------------------------------
 * Main screen : Contact (subscription) Add/Remove dialog
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
  // query contact remove
  xows_cli_roster_edit(xows_gui_mbox_subs_edit.bare, 
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

  let mesg, code;
  
  // If name is defined, this mean this is for Contact add
  if(name) {
    xows_gui_mbox_subs_edit.name = name;
    code = 4;
    mesg = "Add contact and request authorisation ?";
  } else {
    code = 1;
    mesg = "Remove contact and revoke authorization ?";
  }
  
  // Open new MODAL Message Box with proper message
  xows_doc_mbox_open(code, mesg,
                        xows_gui_mbox_subs_edit_onvalid, "OK",
                        xows_gui_mbox_subs_edit_onabort, "Cancel",
                        true);
}

/* -------------------------------------------------------------------
 * Main screen : Contact Subscription Allow/Deny dialog
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
  xows_doc_mbox_open(4, "Allow contact subscription ?",
                        xows_gui_mbox_subs_auth_onvalid, "Allow",
                        xows_gui_mbox_subs_auth_onabort, "Deny",
                        true);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen File Upload Scenario
 * 
 * -------------------------------------------------------------------*/
/**
 * Function to handle file upload progression step
 * 
 * @param   {number}  percent   Data upload progression in percent
 */ 
function xows_gui_upld_onprogress(percent) 
{
  // Update progress bar
  xows_doc.upld_pbar.style.width = percent + "%";
}

/**
 * Function to handle Http Upload error
 * 
 * @param   {string}  mesg    Reported error message with code
 */
function xows_gui_upld_onerror(mesg) 
{
  // Set the upload dialog message
  xows_doc_cls_add("upld_text","text-err");
  xows_doc.upld_text.innerHTML = "<b>"+xows_l10n_get("Error")+"</b> : "+mesg;
}

/**
 * Function to handle file upload success
 * 
 * @param   {string}  url   Returned download URL of the uploaded file
 */
function xows_gui_upld_onsuccess(url) 
{
  // Hide the Upload page
  xows_doc_hide("hist_upld");

  // Send a message to current selected contact with URL to download
  // We use small delay to let the HTTP server refreching its cache
  setTimeout(xows_cli_send_message, 400, xows_gui_peer, url);
}


/**
 * Function to handle upload Abort button click by user
 * 
 * @param   {object}  event   Event object associated with trigger
 */
function xows_gui_upld_onabort()
{
  xows_gui_upld_onclose();
}

/**
 * File-Upload Frame on-close callback function.
 */
function xows_gui_upld_onclose()
{
  xows_doc_hide("hist_upld");
}

/**
 * File-Upload Frame open.
 * 
 * @param {object}  file    File object to upload.
 */
function xows_gui_upld_open(file)
{
  // Reset elements to initial state
  xows_doc.upld_text.classList = "";
  xows_doc.upld_pbar.style.width = "0%";

  // Set uploading file name
  xows_doc.upld_text.innerHTML = file.name;
  
  console.log(file.name);

  // Send upload query
  xows_cli_upld_query(file, xows_gui_upld_onerror, xows_gui_upld_onsuccess,
                            xows_gui_upld_onprogress, xows_gui_upld_onabort);
  
  // Show the upload frame
  xows_doc_show("hist_upld");
  
  // scroll history down
  xows_gui_peer_scroll_down(xows_gui_peer);
}

/* -------------------------------------------------------------------
 * 
 * Page Screen Dialogs
 * 
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Page Screen : Wait Screen Page
 * -------------------------------------------------------------------*/
 
/**
 * Wait Screen page open.
 * 
 * @param   {string}  text  Message to display.
 */
function xows_gui_page_wait_open(text)
{
  // Set wait message
  xows_doc.wait_text.innerHTML = xows_l10n_get(text);
  
  // Open wait page
  xows_doc_page_open("page_wait");
}

/* -------------------------------------------------------------------
 * Page Screen : User Login Page
 * -------------------------------------------------------------------*/

/**
 * User Login page on-unput event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
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
 * @param   {object}  target    Target object of the triggered Event
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
 * Page Screen : User Register Page
 * -------------------------------------------------------------------*/

/**
 * User Register page on-input event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
 */
function xows_gui_page_regi_oninput(target)
{
  let disable = true;

  if(xows_doc.regi_user.value.length && xows_doc.regi_pass.value.length)
    if(xows_doc_cls_has("regi_capt", "captcha-checked")) 
      disable = false;
  
  xows_doc.regi_subm.disabled = disable;
}

/**
 * User Register page on-click event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
 */
function xows_gui_page_regi_onclick(target)
{
  if(target.id === "regi_capt") { //< Robot Captcha div
    
    // Add check to captcha div
    xows_doc_cls_add("regi_capt", "captcha-checked");
    
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
  xows_doc_cls_rem("regi_capt", "captcha-checked"); 
                              
  // Open dialog page
  xows_doc_page_open("page_regi",false,null,xows_gui_page_regi_oninput,
                                            xows_gui_page_regi_onclick);
  // Add navigation history
  xows_gui_nav_push("regi_open", xows_gui_page_regi_open);
}


/* -------------------------------------------------------------------
 * Page Screen : User Profile Page
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
 * @param   {object}  target    Target object of the triggered Event
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
 * @param   {object}  target    Target object of the triggered Event
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
 * @param   {object}  event   Event object associated with trigger
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
 * Page Screen : Add Contact Page
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
  xows_cli_roster_edit(bare, name);
}

/**
 * Add Contact page on-input event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
 */
function xows_gui_page_cont_oninput(target)
{
  if(xows_doc.cont_bare.value.length && xows_is_jid(xows_doc.cont_bare.value)) {
    xows_doc_mbox_open(3, "Add contact and request authorisation",
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
 * Page Screen : Join/Create Room Page
 * -------------------------------------------------------------------*/

/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_page_join = {};

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
  if(room) xows_cli_room_cfg_set(room, null, xows_doc_page_close);
}

/**
 * Room Join page on-input event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
 */
function xows_gui_page_join_oninput(target)
{
  if(xows_doc.join_room.value.length) {
    xows_doc_mbox_open(3, "Join Room (create it if does not exist)",
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
 * Setting the room parameter with valid object enable the Room 
 * creation scenario where user is asked for Room initial 
 * configuration.
 * When a Room is created, the XMPP server reply with special code 201 
 * and this function is called again (while  page is already opened) 
 * from the xows_gui_cli_onoccupush() function.
 * 
 * @param {object}  room    Room object for initial config scenario.
 */
function xows_gui_page_join_open(room)
{
  // Check whether we are in a Room creation scenario
  if(room) {
    
    // This scenario occure after room creation confirmation, to ask
    // user for created Room initial configuration.
    
    xows_gui_page_join.room = room;
    
    // disable input 
    xows_doc.join_room.disabled = true;
    
    // Open new Message Box to confirm Room initial config process
    xows_doc_mbox_open(3, "The Room will be created, do you want to configure it ?",
                          xows_gui_page_join_onvalid, "Configure",
                          xows_gui_page_join_onabort, "Join now");
  } else {
    
    // Reset inputs
    xows_doc.join_room.disabled = false;
    xows_doc.join_room.value = "";
    
    // Open dialog page
    xows_doc_page_open("page_join",true,xows_gui_page_join_onclose,
                                        xows_gui_page_join_oninput);
                                
    // Add navigation history
    xows_gui_nav_push("join_open", xows_gui_page_join_open);
  }
}

/* -------------------------------------------------------------------
 * Page Screen : Room Config / Subject Page
 * -------------------------------------------------------------------*/

/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_doc_page_room = {};

/**
 * Room Configuration page on-valid callback function.
 */
function xows_gui_page_room_onvalid()
{
  const room = xows_doc_page_room.room;
  
  // Checks whether we are in Room config or subject change scenario
  if(xows_doc_page_room.form) {

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
    xows_cli_room_cfg_set(room, form, xows_doc_page_close);
    
  } else {
  
    // Send new Room subject
    xows_cli_send_subject(room, xows_doc.room_subj.value);
  }
}

/**
 * Room Configuration page on-abort callback function.
 */
function xows_gui_page_room_onabort()
{
  const room = xows_doc_page_room.room;
  
  // Checks whether we are in Room config or subject change scenario
  if(xows_doc_page_room.form) {
    
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
        xows_doc.room_pers.checked = form[i].value; break;
      case "muc#roomconfig_publicroom":
        xows_doc.room_publ.checked = form[i].value; break;
      //case "muc#roomconfig_roomsecret":
      //  xows_doc.room_priv.checked = form[i].value.length;
      //  xows_doc.room_pass.value = form[i].value; 
      //  break;
      //case "muc#roomconfig_allowmemberinvites":
      //  xows_doc.room_invt.checked = form[i].value; 
      //  break;
      case "muc#roomconfig_membersonly":
        xows_doc.room_mbon.checked = form[i].value; break;
      case "muc#roomconfig_changesubject":
      case "muc#roomconfig_moderatedroom":
        xows_doc.room_modo.checked = form[i].value; break;
      case "muc#roomconfig_whois":
        xows_doc.room_anon.value = form[i].value; break;
      case "muc#roomconfig_historylength":
        xows_doc.room_hmax.value = form[i].value; break;
      case "muc#roomconfig_defaulthistorymessages":
        xows_doc.room_hdef.value = form[i].value; break;
      case "muc#roomconfig_enablearchiving":
        xows_doc.room_arch.checked = form[i].value; break;
      }
    }
  } else { 
    
    // Reset input value
    xows_doc.room_subj.value = room.subj;
  }
}

/**
 * Room Configuration page on-input event callback function.
 * 
 * @param   {object}  target    Target object of the triggered Event
 */
function xows_gui_page_room_oninput(target) 
{
  let change = false;

  // Checks whether we are in Room config or subject change scenario
  if(xows_doc_page_room.form) {
    
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
        parseInt(form[i].value) !== xows_doc.room_pers.checked; change = true; break;
      case "muc#roomconfig_publicroom":
        parseInt(form[i].value) !== xows_doc.room_publ.checked; change = true; break;
      //case "muc#roomconfig_roomsecret":
      //  form[i].value = xows_doc.room_priv.checked ? xows_doc.room_pass.value : "";
      //  break;
      case "muc#roomconfig_membersonly":
        parseInt(form[i].value) !== xows_doc.room_mbon.checked; change = true; break;
      case "muc#roomconfig_moderatedroom":
        parseInt(form[i].value) !== xows_doc.room_modo.checked; change = true; break;
      case "muc#roomconfig_whois":
        form[i].value !== xows_doc.room_anon.value; change = true; break;
      case "muc#roomconfig_historylength":
        form[i].value !== xows_doc.room_hmax.value; change = true; break;
      case "muc#roomconfig_defaulthistorymessages":
        form[i].value !== xows_doc.room_hdef.value; change = true; break;
      case "muc#roomconfig_enablearchiving":
        parseInt(form[i].value) !== xows_doc.room_arch.checked; change = true; break;
      }
      
      if(change) break;
    }
  } else {
    
    if(xows_doc.room_subj.value !== xows_doc_page_room.room.subj)
      change = true;
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
  
  // Checks whether we are in Room config or subject change scenario
  if(xows_doc_page_room.form) {
    
    // Checks whether we are in Room initial config scenario, happening 
    // when user Join a non-existing Room that is created on the fly.
    if(room.init) {
      
      // Accept default config
      xows_cli_room_cfg_set(room, null, null);
      
    } else {
      
      // Cancel Room configuration
      xows_cli_room_cfg_cancel(room);
    }
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
 * @param   {object}   room    Room object to be configured
 * @param   {object}  [form]   Optional supplied form for config fields
 */
function xows_gui_page_room_open(room, form)
{
  // Store Room object
  xows_doc_page_room.room = room;
  
  // Checks whether a form is supplied, meaning this is a Room
  // configuration scenario
  if(form) {
    
    // Store the current config form
    xows_doc_page_room.form = form;
  
    // Setup page to show Room configuration
    xows_doc_show("room_conf");
    xows_doc_hide("room_edit");
    
  } else {
    
    // Setup page to show Room subject change
    xows_doc_hide("room_conf");
    xows_doc_show("room_edit");
  }
  
  // Set the Room ID in the page header frame
  xows_doc.room_jid.innerHTML = xows_jid_to_user(room.bare);
  
  // Initialize inputs
  xows_gui_page_room_onabort();
  
  // Open dialog page
  xows_doc_page_open("page_room",true,xows_gui_page_room_onclose, 
                                      xows_gui_page_room_oninput);
           
  // Push navigation history
  xows_gui_nav_push("room_open", xows_gui_page_room_open);
}
