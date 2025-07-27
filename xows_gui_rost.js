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
 *                  User Roster Management Sub-Module
 *
 * ------------------------------------------------------------------ */
/* -------------------------------------------------------------------
 * Roster Interactions - Peers lists Routines
 * -------------------------------------------------------------------*/
/**
 * Handles ckick on Roster header
 *
 * @param   {object}    event     Event object
 */
function xows_gui_rost_head_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  switch(event.target.id)
  {
  case "cont_bt_add":
    // Open contact Add page
    xows_gui_rost_subs_ibox_open();
    break;
  case "room_bt_add":
    // Open Join Room page
    xows_gui_muc_join_ibox_open();
    break;
  case "room_bt_upd":
    // Refresh Room list
    xows_gui_rost_roomlst_reload();
    break;
  }
}

/**
 * Handles ckick on Roster Peer List
 *
 * @param   {object}    event     Event object
 */
function xows_gui_rost_list_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Search for <li-peer> parent element
  const li_peer = event.target.closest("LI-PEER");
  if(!li_peer) return;

  // Check for click on action Button
  if(event.target.tagName === "BUTTON") {
    switch(event.target.name)
    {
    case "cont_bt_rtry": //< Retry request subscribe permission
      // Send subscription request
      xows_gui_rost_subs_rqst_pupu(li_peer.dataset.id);
      return;
    case "cont_bt_unsb": //< Remove (Unsubscribe) contact
      // Open revoke subscription dialog-box
      xows_gui_rost_subs_revk_mbox_open(xows_cli_cont_get(li_peer.dataset.id));
      return;
    }
  }

  // Special case for pending subscription
  if(li_peer.classList.contains("PEER-PEND")) {
    // Open Subscription Allow/Deny dialog
    xows_gui_rost_subs_auth_mbox_open(li_peer.dataset.id);
  } else {
    // Select peer
    xows_gui_peer_switch_to(li_peer.dataset.id);
  }
}

/**
 * Find Roster's <li-peer> element of specified Peer object
 *
 * @param   {object}    addr      Peer address
 *
 * @return  (element}   A <li-peer> element or null/undefined if not found
 */
function xows_gui_rost_list_find(addr)
{
  return xows_doc("rost_fram").querySelector("LI-PEER[data-id='"+addr+"']");
}
/* -------------------------------------------------------------------
 * Roster Interactions - Peers Management : Contacts
 * -------------------------------------------------------------------*/
/**
 * Function to add or update item of the roster contact list
 *
 * @param   {object}    cont      Contact object to add or update
 * @param   {string}   [text]     Optional Error text
 */
function xows_gui_rost_cont_onpush(cont, text)
{
  // Null Contact mean we properly received Roster Contacts list
  // but it is empty (user doesn't have any Contact in roster).
  if(!cont) {
    // Remove the loadding spinner
    xows_doc_cls_rem("cont_list","LOADING");
    return;
  }

  // Search for existing contact <li-peer> element
  let li_peer = xows_gui_rost_list_find(cont.addr);
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
      xows_gui_doc_update(cont);
      // Update message history
      xows_gui_hist_update(cont, cont);
      // If contact goes offline, ensure chatstat resets
      if(cont.show < 1) xows_gui_edit_onchst(cont, 0);
    }
  }

  // Select proper destination list to add Contact/Subscription request
  const dst_ul = (cont.subs & XOWS_SUBS_TO) ? xows_doc("cont_budy") :
                                              xows_doc("cont_pend");

  if(!li_peer) {
    // This is a roster contact (with or without pending authorization)
    li_peer = xows_tpl_spawn_rost_cont(cont, text);
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Update Lists visibility
  xows_gui_rost_contlst_update();
}

/**
 * Function to remove item from the roster Contacts list
 *
 * @param   {object}    cont      Contact Object
 */
function xows_gui_rost_cont_onpull(cont)
{
  // Retreive <li_peer> element
  const li_peer = xows_gui_rost_list_find(cont.addr);
  if(li_peer) {

    // If current selected Peer is this one, switch to null
    if(xows_gui_peer === cont)
      xows_gui_peer_switch_to(null);

    // Remove <li_peer> element
    const src_ul = li_peer.parentNode;
    src_ul.removeChild(li_peer);
  }

  // Update Lists visibility
  xows_gui_rost_contlst_update();

  // We can delete this Contact from
  xows_cli_cont_rem(cont);
}

/* -------------------------------------------------------------------
 * Roster Interactions - Peers Management : Pending subscribe
 * -------------------------------------------------------------------*/
/**
 * Add subscription request to the roster
 *
 * This function add a new Subscription request element in the
 * roster.
 *
 * @param   {object}    cont      Contact Object
 */
function xows_gui_rost_subs_onpush(cont)
{
  const dst_ul = xows_doc("cont_pend");

  // Search for existing <li_peer> element
  let li_peer = xows_gui_rost_list_find(cont.addr);
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
  xows_gui_rost_contlst_update();
}

/* -------------------------------------------------------------------
 * Roster Interactions - Peers Management : Rooms
 * -------------------------------------------------------------------*/
const xows_gui_rost_room_qeu = [];

/**
 * Function to add or update item of the roster Room list
 *
 * The 'join' parameter indicate whether Room is about to be joined, meaning
 * that offscreen documents must be created to be updated and fulfilled during
 * join process.
 *
 * @param   {object}    room      Room object to add or update
 * @param   {boolean}   join      Indicate Room is about to be joined
 */
function xows_gui_rost_room_onpush(room, join)
{
  // Check for null object, meaning previous public room query response
  if(!room) {
    // disable loading animation
    xows_doc_cls_rem("room_list", "LOADING");
    // Update room list <ul> visibility
    xows_gui_rost_roomlst_update();
    return;
  }

  // Select destination <ul>
  const dst_ul = (room.publ) ? xows_doc("room_publ") :
                              (room.book) ? xows_doc("room_book") :
                                            xows_doc("room_priv");

  // The room is about to be joined, we create offscreen document
  if(join)
    xows_gui_doc_init(room);

  //let li_peer = document.getElementById(room.addr);
  let li_peer = xows_gui_rost_list_find(room.addr);
  if(li_peer) {
    // Update room <li_peer> element according template
    xows_tpl_update_rost_room(li_peer, room);
    // Update chat title bar
    xows_gui_doc_update(room);
  } else {
    // Append new instance of room <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_rost_room(room);
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Update room list <ul> visibility
  xows_gui_rost_roomlst_update();
}

/**
 * Function to add or update item of the roster Room list
 *
 * @param   {object}    room      Room Object
 */
function xows_gui_rost_room_onpull(room)
{
  // Search <li-peer> element
  //const li_peer = document.getElementById(room.addr);
  const li_peer = xows_gui_rost_list_find(room.addr);
  if(li_peer) {

    // switch peer if required
    if(xows_gui_peer && xows_gui_peer === room)
      xows_gui_peer_switch_to(null);

    // delete <li_peer> element
    li_peer.parentNode.removeChild(li_peer);
  }

  // Update room list <ul> visibility
  xows_gui_rost_roomlst_update();

  // Remove Room in client side
  xows_cli_room_rem(room);
}

/* -------------------------------------------------------------------
 * Roster Interactions - Peers Management : Occupants
 * -------------------------------------------------------------------*/
/**
 * Initialize Private Conversation with Occupant
 *
 * @param   {object}    occu      Occupant object
 */
function xows_gui_rost_occu_init(occu)
{
  // Check if occupant has a real-JID, then check if we can
  // found him in contacts, in this case, bring the contact
  // chat window instead of creating Private Conversation
  if(occu.jbar) {
    if(xows_cli_cont_get(occu.jbar)) {
      // Switch to Contact for chat
      xows_gui_peer_switch_to(occu.jbar);
      return;
    }
  }

  // Add Private Message session in client side
  xows_cli_priv_add(occu);

  // Create Occupant Private Message offscreen structure
  xows_gui_rost_occu_onpush(occu);

  // Switch to Occupant
  xows_gui_peer_switch_to(occu.addr);
}

/**
 * Function to add or update item of the roster Room list
 *
 * @param   {object}    occu      Occupant object to add or update
 * @param   {object}   [mucx]     Optional MUC x extra parameters
 */
function xows_gui_rost_occu_onpush(occu, mucx)
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
      xows_gui_doc_reassign(occu, mucx.prev);
    }
  }

  let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+occu.addr+"']");
  if(li_peer) {
    // Update occupant <li_peer> element according template
    xows_tpl_update_room_occu(li_peer, occu);
    // Update chat title bar
    xows_gui_doc_update(occu);
    // Update message history
    xows_gui_hist_update(occu, occu);

    // Except for nickname change, if Occupant is found offline, this mean
    // a Private Conversation is open and occupant joined again, so, we inform
    // Occupant is back
    if(occu.show === XOWS_SHOW_OFF) {
      // check for nicname change
      if(!(mucx && mucx.code.includes(303))) {
        // Add message to history
        const hist_ul = xows_gui_doc(occu, "hist_ul");
        hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("joined the conversation")));
      }
    }
  } else {
    // Append new instance of occupant <li_peer> from template to roster <ul>
    li_peer = xows_tpl_spawn_room_occu(occu, true); //< Special for Private Message
  }

  // Parent to proper <ul>
  if(li_peer.parentNode != dst_ul)
    dst_ul.appendChild(li_peer);

  // Show the Private Message tab
  xows_doc_show("tab_occu");
}

/**
 * Function to remove or update item of the roster Room list
 *
 * @param   {object}    occu      Occupant object to add or update
 */
function xows_gui_rost_occu_onpull(occu)
{
  const dst_ul = xows_doc("priv_occu");

  let li_peer = dst_ul.querySelector("LI-PEER[data-id='"+occu.addr+"']");
  if(li_peer) {

    // Update occupant <li_peer> element according template
    xows_tpl_update_room_occu(li_peer, occu);

    // Update chat title bar
    xows_gui_doc_update(occu);

    // Add message to history
    const hist_ul = xows_gui_doc(occu, "hist_ul");
    hist_ul.appendChild(xows_tpl_mesg_null_spawn(0,"internal",occu.name+" "+xows_l10n_get("has left the conversation")));
  }
}

/* -------------------------------------------------------------------
 * Roster Interactions - Contacts list Routines
 * -------------------------------------------------------------------*/
/**
 * Function to force query and refresh for Room list
 */
function xows_gui_rost_contlst_reload()
{
  xows_gui_peer_switch_to(null);
  // Empty the lists
  xows_doc("cont_pend").hidden = true;
  xows_doc("cont_pend").innerText = "";
  xows_doc("cont_budy").hidden = true;
  xows_doc("cont_budy").innerText = "";

  // Add loading spinner at top of list
  xows_doc_cls_add("cont_list","LOADING");

  // Query for roster content
  xows_cli_rost_fetch();
}

/**
 * Updates the Contact list according contacts presents
 */
function xows_gui_rost_contlst_update()
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
/* -------------------------------------------------------------------
 * Roster Interactions - Rooms list Routines
 * -------------------------------------------------------------------*/
/**
 * Function to force query and refresh for Room list
 */
function xows_gui_rost_roomlst_reload()
{
  // if current selected room is public, exit
  if(xows_gui_peer && xows_gui_peer.publ)
    xows_gui_peer_switch_to(null);

  // Add loading animation to Room list
  xows_doc_cls_add("room_list", "LOADING");

  // Empty the Public Room list
  xows_doc("room_publ").innerHTML = "";

  // Query to get public room list with delay
  setTimeout(xows_cli_muc_list_query, 500);
}

/**
 * Updates the Occupant list according occupants presents in room
 *
 * @param   {object}    room      Room object
 */
function xows_gui_rost_roomlst_update()
{
  // show and hide proper <ul> as required
  const room_publ = xows_doc("room_publ");
  room_publ.hidden = (room_publ.querySelector("LI-PEER") === null);

  const room_priv = xows_doc("room_priv");
  room_priv.hidden = (room_priv.querySelector("LI-PEER") === null);

  const room_book = xows_doc("room_book");
  room_book.hidden = (room_book.querySelector("LI-PEER") === null);
}

/* -------------------------------------------------------------------
 * Roster Interactions - Subscriptions routines
 * -------------------------------------------------------------------*/

/**
 * Send new subscription authorization request and show popup
 *
 * @param   {string}     addr     Contact JID to subscribes
 */
function xows_gui_rost_subs_rqst_pupu(addr)
{
  // Send subscribe request
  xows_cli_subs_request(addr);

  // Show message popup
  xows_doc_popu_open(XOWS_STYL_SCS,"New subscription authorization request was sent");
}

/* -------------------------------------------------------------------
 * Roster Interactions - Subscribe Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Add Contact Input Dialog-Box on-valid callback
 *
 * @param   {object}    value     Input content
 */
function xows_gui_rost_subs_ibox_oninput(value)
{
  xows_doc_ibox_allow(value.length && xows_isjid(value));
}

/**
 * Add Contact Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_rost_subs_ibox_onvalid(value)
{
  // Send a new subscription request
  xows_gui_rost_subs_rqst_pupu(value);
}

/**
 * Open Add Contact Input Dialog-Box
 */
function xows_gui_rost_subs_ibox_open()
{
  // Open the input box dialog
  xows_doc_ibox_open("Subscribes to contact",
    "A subscription authorization request will be sent to the specified address, you'll have to wait for contact to allow to that request.",
    "Enter contact XMPP address...", null,
    xows_gui_rost_subs_ibox_onvalid, "Add",
    null, null,
    xows_gui_rost_subs_ibox_oninput,
    true);
}

/* -------------------------------------------------------------------
 * Roster Interactions - Revoke subscription Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_rost_subs_revk_mbox = {peer:null};

/**
 * Contact (subscription) Add/Remove message box on-abort callback function
 */
function xows_gui_rost_subs_revk_mbox_onabort() {}

/**
 * Contact (subscription) Add/Remove message box on-valid callback function
 */
function xows_gui_rost_subs_revk_mbox_onvalid()
{
  // Revoke contact subscription
  xows_cli_subs_revoke(xows_gui_rost_subs_revk_mbox.cont);
}

/**
 * Revoking contact subscription Message-Box Dialog open
 *
 * @param   {object}    cont      Contact object to revoke
 */
function xows_gui_rost_subs_revk_mbox_open(cont)
{
  // Store Contact object
  xows_gui_rost_subs_revk_mbox.cont = cont;

  // Select proper text depending current state
  let text = "Do you really want to remove contact and ";
  if(cont.subs) {
    text += "revoke subscription authorization ?";
  } else {
    text += "abort subscription authorization request ?";
  }

  // Open message-box
  xows_doc_mbox_open(XOWS_STYL_WRN, "Revoke contact subscription", text,
                     xows_gui_rost_subs_revk_mbox_onvalid, "OK",
                     xows_gui_rost_subs_revk_mbox_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 * Roster Interactions - Subscription authorization Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_rost_subs_auth_mbox = {cont:null};

/**
 * Contact Subscription Allow/Deny message box on-abort callback function
 */
function xows_gui_rost_subs_auth_mbox_onabort()
{
  // deny contact subscribe
  xows_cli_subs_answer(xows_gui_rost_subs_auth_mbox.cont, false);
}

/**
 * Contact Subscription Allow/Deny message box on-valid callback function
 */
function xows_gui_rost_subs_auth_mbox_onvalid()
{
  // allow contact subscribe
  xows_cli_subs_answer(xows_gui_rost_subs_auth_mbox.cont, true);
}

/**
 * Contact Subscription Allow/Deny message box open
 *
 * @param   {string}    addr      Supplied JID address to allow or deny
 */
function xows_gui_rost_subs_auth_mbox_open(addr)
{
  // Store Contact object to allow/deny
  xows_gui_rost_subs_auth_mbox.cont = xows_cli_cont_get(addr);

  // Open message box
  xows_doc_mbox_open(XOWS_STYL_ASK, "Contact subscription request",
                     "A new contact is requesting subscription authorization. Would you like to grant authorization and add this contact ?",
                     xows_gui_rost_subs_auth_mbox_onvalid, "Allow",
                     xows_gui_rost_subs_auth_mbox_onabort, "Deny");
}
