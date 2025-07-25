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
 *                Multi-User-Chat Management Sub-Module
 *
 * ------------------------------------------------------------------ */
 /* -------------------------------------------------------------------
 * MUC interactions - Base functions
 * -------------------------------------------------------------------*/
/**
 * Joins a MUC Room, either already discovered, or using room name.
 *
 * If 'room' parameter is not null the 'name' parameter is ignored. The 'name'
 * parameter can be either a Room ID to join or create on the current
 * default MUC service, or a full JID address to join a Room on a custom
 * MUC service.
 *
 * @param   {object}   [room]     Room object
 * @param   {string}   [name]     Optional room ID or address to join or create
 */
function xows_gui_muc_join(room, name)
{
  // This is the important part, it is necessary to create
  // the Room documents before we attempt to join Room to be
  // able to properly add incoming occupants list and messages
  if(room)
    xows_gui_doc_init(room);

  // Join or create room
  xows_cli_muc_join_atempt(room, name);
}

/* -------------------------------------------------------------------
 * MUC interactions - Room Join conditions Handling
 * -------------------------------------------------------------------*/
/**
 * Handle the received MUC Room initial Own presence (Just Joinded Room)
 *
 * @param   {object}    room      Room object
 * @param   {object}   [code]     Optionnal list of status code
 * @param   {object}   [error]    Error data if any
 */
function xows_gui_muc_onjoin(room, code, error)
{
  // Handle error if any
  if(error) {

    if(error.type == "auth") {
      // User is banned
      if(error.name == "forbidden") { // banned user
        // Open error message dialog
        xows_gui_muc_fail_mbox_open("auth","You cannot join this Channel because you are banned.");
        return;
      }
      // Room require password
      if(error.name == "not-authorized") {
        // Open Room Password input dialog
        xows_gui_muc_pswd_ibox_open(room);
        return;
      }
      // Room require registration
      if(error.name == "registration-required") {
        // Open Room Registration input dialog
        xows_gui_muc_regi_ibox_open(room);
        return;
      }
    }

    if(error.type == "cancel") {
      // Room creation not allowed
      if(error.name == "not-allowed") {
        // Open error message dialog
        xows_gui_muc_fail_mbox_open("create","The specified Channel does not exists and Channel creation is restricted.");
        return;
      }
      // TODO: Nickname conflict
      if(error.name == "conflict") {
        // Open Room Nickname Conflict input dialog
        xows_gui_muc_cflt_ibox_open(room);
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
    xows_gui_muc_fail_mbox_open("","<"+error.name+"> "+error.text);

    return;
  }

  xows_gui_doc_init(room);

  // check if this is a re-join after connection loss
  if(room.rcon) {

    // We do NOT switch to room automatically
    room.rcon = false; //< reset flag

  } else {
    // Switch peer to newly joined room
    xows_gui_peer_switch_to(room.addr);
  }

  // Update privileges related GUI elements
  xows_gui_doc_update(room);

  // Check whether Room is awaiting initial configuration
  if(room.init)
    xows_gui_muc_init_mbox_open(room);
}
/**
 * Handle the received MUC Room terminal Own presence (Room exit)
 *
 * @param   {object}    room      Room object
 * @param   {object}   [mucx]     Optionnal MUC x extra parameters
 */
function xows_gui_muc_onexit(room, mucx)
{
  // Close chat window if Room is current peer
  if(room === xows_gui_peer)
    xows_gui_peer_switch_to(null);

  // Reset offscreen element for this Room
  xows_gui_doc_reset(room);

  // Possible MUC Status codes
  //
  // 301: A user has been banned from the room
  // 307: A user has been kicked from the room
  // 321: A user is being removed from the room because of an affiliation change
  // 322: A user is being removed from the room because the room has been changed to members-only
  // 333: A user was removed because of an error reply (server error)

  let text = null;

  if(mucx.code.includes(301))
    text = "You were banned from the Channel";

  if(mucx.code.includes(307))
    text ="You were kicked from the Channel";

  if(mucx.code.includes(321))
    text = "Rules changes caused you to leave the Channel";

  if(mucx.code.includes(321))
    text = "Server error caused you to leave the Channel";

  if(text) {
    text += " <b>"+room.name+"</b>";
    xows_doc_popu_open(XOWS_STYL_WRN,text);
  }
}

/**
 * Handle incomming room subjec from MUC room
 *
 * @param   {object}    room      Room object
 * @param   {string}    subj      Subject string
 */
function xows_gui_muc_onsubj(room, subj)
{
  xows_gui_doc_update(room, XOWS_UPDT_SUBJ);
}

/* -------------------------------------------------------------------
 * MUC interactions - Join Room Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Join Room Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_join_ibox_oninput(value)
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
function xows_gui_muc_join_ibox_onvalid(value)
{
  // Join or create room
  xows_gui_muc_join(null, value);
}

/**
 * Open Join Room Input Dialog-Box
 */
function xows_gui_muc_join_ibox_open()
{
  // Open the input box dialog
  xows_doc_ibox_open("Join or create a Channel",
    "If the specified Room does not exist and if server does not restrict rooms creation, a new Room will be created with you as owner.",
    "Enter Channel name or address...", null,
    xows_gui_muc_join_ibox_onvalid, "Join",
    null, null,
    xows_gui_muc_join_ibox_oninput,
    true);
}

/* -------------------------------------------------------------------
 * MUC interactions - Join Room failure Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Open an error message dialog-box for room join context
 *
 * @param   {string}    type      Error type
 * @param   {string}    text      Message to set
 */
function xows_gui_muc_fail_mbox_open(type, text)
{
  let head;

  switch(type)
  {
  case "auth": head = "Channel access";  break;
  case "create": head = "Channel creation"; break;
  default: head = "Channel join error";
  }

  // Open message dialog
  xows_doc_mbox_open(XOWS_STYL_ERR, head, text,
                     null, null,
                     null, null);
}

/* -------------------------------------------------------------------
 * MUC interactions - Room initialization Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room Initialization Dialog-Box parameters
 */
const xows_gui_muc_init_mbox = {room:null};

/**
 * Room Initialization Dialog-Box on-valid callback
 */
function xows_gui_muc_init_mbox_onvalid()
{
  const room = xows_gui_muc_init_mbox.room;

  xows_log(2,"gui_room_init_onvalid","request initial Room config",room.addr);

  // Send Room config form request, XMPP server will reply which
  // will automatically opens the Room Configuration page.
  xows_cli_muc_getcfg_query(room, xows_gui_page_mucc_open);
}

/**
 * Room Initialization Dialog-Box on-abort callback
 */
function xows_gui_muc_init_mbox_onabort()
{
  // If we are in Room creation process, we accept the default config
  xows_cli_muc_setcfg_query(xows_gui_muc_init_mbox.room, null);
}

/**
 * Room Initialization Dialog-Box
 *
 * @param   {object}    room      Joined Room object
 */
function xows_gui_muc_init_mbox_open(room)
{
  // This scenario occure after room creation confirmation, to ask
  // user for created Room initial configuration.
  xows_gui_muc_init_mbox.room = room;

  // Open new Message Box to confirm Room initial config process
  xows_doc_mbox_open(XOWS_STYL_ASK, "Channel initialization",
                     "You just created a new Channel, would you want to configure it right now ?",
                     xows_gui_muc_init_mbox_onvalid, "Configure",
                     xows_gui_muc_init_mbox_onabort, "Ignore");
}

/* -------------------------------------------------------------------
 * MUC interactions - Room register Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Register Room Input Dialog-Box parameters
 */
const xows_gui_muc_regi_ibox = {room:null};

/**
 * Register Room Input Dialog-Box register result callback
 *
 * @param   {object}    value     Room object
 * @param   {string}    type      Result type string
 * @param   {object}    error     Error data if any
 */
function xows_gui_muc_regi_ibox_onresult(room, type, error)
{
  if(type == "error") {
    if(error) {
      switch(error.name)
      {
      case "conflict": //< nickname conflict
        // Open register dialog again
        xows_gui_muc_regi_ibox_open(room);
        // Set dialog error
        xows_doc_ibox_error("Nickname is already reserved in this Room");
        return;
      case "not-allowed": //< not allowed to register
      case "registration-required": //< seem to be Prosody specific
        // Open error message dialog
        xows_gui_muc_fail_mbox_open("auth","You cannot join this Channel because its access is restricted to members only.");
        return;
      // User is banned
      case "forbidden": // banned user
        // Open error message dialog
        xows_gui_muc_fail_mbox_open("auth","You cannot join this Channel because you are banned.");
        return;
      }
    }
    // Default error message
    xows_gui_muc_fail_mbox_open("auth","Channel registration request failed.");
    return;
  }

  // Close the dialog box
  xows_doc_ibox_close();

  // Switch to joined room
  //xows_gui_switch_room(room.addr);
  xows_gui_peer_switch_to(room.addr);
}

/**
 * Register Room Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_regi_ibox_onvalid(value)
{
  const room = xows_gui_muc_regi_ibox.room;

  // Try register again
  xows_cli_muc_regi_query(room, value, xows_gui_muc_regi_ibox_onresult);
}

/**
 * Open Register Room Input Dialog-Box
 *
 * @param   {object}    room      Room object
 */
function xows_gui_muc_regi_ibox_open(room)
{
  xows_gui_muc_regi_ibox.room = room;

  // Open the input box dialog
  xows_doc_ibox_open("Channel registration",
                     "The nickname will be associated with your XMPP address and being reserved for you in this Room.",
                     "Enter nickname to register...", room.nick,
                     xows_gui_muc_regi_ibox_onvalid, "Register",
                     null, null,
                     null, true);
}

/* -------------------------------------------------------------------
 * MUC interactions - Join Room Password Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room Password Input Dialog-Box parameters
 */
const xows_gui_muc_pswd_ibox = {room:null};

/**
 * Room Password Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_pswd_ibox_onvalid(value)
{
  const room = xows_gui_muc_pswd_ibox.room;
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
function xows_gui_muc_pswd_ibox_open(room)
{
  xows_gui_muc_pswd_ibox.room = room;

  // Open the input box dialog
  xows_doc_ibox_open("Channel password",
                     "This Channel is password-protected, you must provide password in order to join it.",
                     "Enter a password...", room.pass,
                     xows_gui_muc_pswd_ibox_onvalid, "Join",
                     null, null,
                     null, true);

  // If room password is not empty, this mean previous try failed
  if(room.pass) xows_doc_ibox_error("The password you entered is incorrect");
}

/* -------------------------------------------------------------------
 *  MUC interactions - Join Room Conflict Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room Nickname Conflict Input Dialog-Box parameters
 */
const xows_gui_muc_cflt_ibox = {room:null};

/**
 * Room Nickname Conflict Input Dialog-Box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_cflt_ibox_onvalid(value)
{
  const room = xows_gui_muc_cflt_ibox.room;
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
function xows_gui_muc_cflt_ibox_open(room)
{
  xows_gui_muc_cflt_ibox.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Nickname conflict"),
    xows_l10n_get("Your nickname conflicts with another Channel's occupant, please choose another nickname."),
    xows_l10n_get("Enter a nickname..."), room.nick,
    xows_gui_muc_cflt_ibox_onvalid, "Join",
    null, null,
    null, true);
}

/* -------------------------------------------------------------------
 * MUC interactions - Room Subject Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room subject/topic input box param
 */
const xows_gui_muc_subj_ibox = {room:null};

/**
 * Room subject/topic input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_subj_ibox_onvalid(value)
{
  const room = xows_gui_muc_subj_ibox.room;

  // Get entered subject
  const subj = value.trimEnd();

  // If changed, inform of the new room topic
  if(subj != room.subj)
    xows_cli_muc_set_subject(room, subj);
}

/**
 * Open Room subject/topic input box
 */
function xows_gui_muc_subj_ibox_open(room)
{
  if(room.type !== XOWS_PEER_ROOM)
    return;

  xows_gui_muc_subj_ibox.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Set topic of")+" #"+room.name,
    "Set the message of the day, a welcome message or the discussion subject.",
    "Enter a topic...", room.subj,
    xows_gui_muc_subj_ibox_onvalid, null, null, null, null, true);
}

/* -------------------------------------------------------------------
 * MUC interactions - Room Nickname Input-Dialog
 * -------------------------------------------------------------------*/
/**
 * Room subject/topic input box param
 */
const xows_gui_muc_nick_ibox = {room:null};

/**
 * Room subject/topic input box on-valid callback
 *
 * @param   {string}    value     Input content
 */
function xows_gui_muc_nick_ibox_onvalid(value)
{
  const room = xows_gui_muc_nick_ibox.room;

  // Get entered subject
  const nick = value.trimEnd();

  // If changed, inform of the new room topic
  if(nick != xows_jid_resc(room.join))
    xows_cli_muc_set_nick(room, nick);
}

/**
 * Open Room subject/topic input box
 */
function xows_gui_muc_nick_ibox_open(room)
{
  if(room.type !== XOWS_PEER_ROOM)
    return;

  xows_gui_muc_nick_ibox.room = room;

  // Open the input box dialog
  xows_doc_ibox_open(xows_l10n_get("Nickname for")+" #"+room.name,
    "Specify your new nickname for this Channel.",
    "Enter a nickname...", xows_jid_resc(room.join),
    xows_gui_muc_nick_ibox_onvalid, null, null, null, null, true);
}

/* -------------------------------------------------------------------
 * MUC Interactions - Bookmark Popu-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_muc_book_popu = {room:null};

/**
 * Add Bookmark message box on-abort callback function
 */
function xows_gui_muc_book_popu_onabort()
{
  // reset parameters
  xows_gui_muc_book_popu.room = null;
}

/**
 * Add Bookmark message box on-valid callback function
 */
function xows_gui_muc_book_popu_onvalid()
{
  const param = xows_gui_muc_book_popu;
  // add bookmark
  xows_cli_book_publish(param.room);
  param.room = null;
}

/**
 * Add Bookmark message box open
 *
 * @param   {object}    room      Room object to add Bookmark
 */
function xows_gui_muc_book_popu_open(room)
{
  // Store JID and name of contact to allow/deny
  xows_gui_muc_book_popu.room = room;

  // Open new MODAL Message Box with proper message
  xows_doc_popu_open(XOWS_STYL_ASK, "Add Channel to bookmarks ?",
                     xows_gui_muc_book_popu_onvalid, "Add Bookmark",
                     xows_gui_muc_book_popu_onabort, "Cancel",
                     true);
}

/* -------------------------------------------------------------------
 * MUC interactions - Set Occupant Affiliation Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_muc_affi_mbox_param = {occu:null,affi:null};

/**
 * Room Occupant Affiliation change message box on-abort callback function
 */
function xows_gui_muc_affi_mbox_onabort() {}

/**
 * Room Occupant Affiliation change message box on-valid callback function
 */
function xows_gui_muc_affi_mbox_onvalid()
{
  const param = xows_gui_muc_affi_mbox_param;

  // query change affiliation for occupant
  xows_cli_muc_set_affi(param.occu, param.affi);
}

/**
 * Room Occupant Affiliation change message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    affi      Affiliation value to set
 */
function xows_gui_muc_affi_mbox_open(occu, affi)
{
  // Store room, occupant and affiliation setup
  const param = xows_gui_muc_affi_mbox_param;
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
                     xows_gui_muc_affi_mbox_onvalid, "OK",
                     xows_gui_muc_affi_mbox_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 * MUC interactions - Set Occupant Role Message-Dialog
 * -------------------------------------------------------------------*/
/**
 * Object to store Page/Dialog temporary data and parameters
 */
const xows_gui_muc_role_mbox_param = {occu:null,role:null};

/**
 * Room Occupant Role change message box on-abort callback function
 */
function xows_gui_muc_role_mbox_onabort() {}

/**
 * Room Occupant Role change message box on-valid callback function
 */
function xows_gui_muc_role_mbox_onvalid()
{
  const param = xows_gui_muc_role_mbox_param;

  // query change affiliation for occupant
  xows_cli_muc_set_role(param.occu, param.role);
}

/**
 * Room Occupant Role change message box open
 *
 * @param   {object}    occu      Occupant object
 * @param   {number}    role      Role value to set
 */
function xows_gui_muc_role_mbox_open(occu, role)
{
  // Store room, occupant and affiliation setup
  const param = xows_gui_muc_role_mbox_param;
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
                     xows_gui_muc_role_mbox_onvalid, "OK",
                     xows_gui_muc_role_mbox_onabort, "Cancel");
}

/* -------------------------------------------------------------------
 * MUC interactions - Occupants "Peer" management
 * -------------------------------------------------------------------*/
/**
 * Handle the received occupant from MUC Room
 *
 * @param   {object}    occu      Occupant object
 * @param   {object}   [mucx]     Optionnal MUX x extra parameters
 */
function xows_gui_muc_onpush(occu, mucx)
{
  // Get Occupant's Room
  const room = occu.room;

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
      const li_peer = xows_gui_mucl_list_find(occu.room, mucx.prev);
      // Change <li-peer> element id
      if(li_peer) li_peer.dataset.id = occu.addr;
    }

    // checks whether we have a special status code with this occupant
    if(mucx.code.includes(110)) { //< Self presence update

      // Update privileges related GUI elements
      xows_gui_doc_update(room);
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
  let li_peer = xows_gui_mucl_list_find(occu.room, occu.addr);
  if(li_peer) {

    // Update the existing <li-peer> ellement according template
    xows_tpl_update_room_occu(li_peer, occu);

  } else {

    // Create new <li-peer> element from template
    li_peer = xows_tpl_spawn_room_occu(occu);
  }

  // Parent <li-peer> to proper destination <ul>
  xows_gui_doc(room, dst_id).appendChild(li_peer);

  // Update occupant list
  xows_gui_mucl_list_update(room);

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
function xows_gui_muc_onpull(occu)
{
  // If Occupant is ourself, this mean we leaved the Room
  if(occu.self) {

    // Check whether current Peer is the Room we leaved
    if(occu.room === xows_gui_peer)
      xows_gui_peer_switch_to(null); //< Unselect Peer

  } else {

    // Search and remove <li_peer> in document
    const li_peer = xows_gui_mucl_list_find(occu.room, occu.addr);
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

/* -------------------------------------------------------------------
 * MUC interactions - Occupants list routines
 * -------------------------------------------------------------------*/
/**
 * Chat Header on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_mucl_head_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  if(xows_gui_peer.type != XOWS_PEER_ROOM)
    return;

  if(event.target.id == "muc_bt_admn")
    xows_gui_page_muca_open(xows_gui_peer);
}

/**
 * Function to handle click on room occupant list
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_mucl_list_onclick(event)
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
                         xows_gui_muc_occu_menu_onclick,
                         xows_gui_muc_occu_menu_onshow,
                         xows_gui_muc_occu_menu_onclose);
  }
}

/**
 * Find occupant <li-peer> element corresponding to specified Occupant
 *
 * @param   {object}    room      Room object
 * @param   {object}    addr      Occupant address
 */
function xows_gui_mucl_list_find(room, addr)
{
  return xows_gui_doc(room,"mucl_list").querySelector("LI-PEER[data-id='"+addr+"']");
}

/**
 * Updates the Occupant list according occupants presents in room
 *
 * @param   {object}    room      Room object
 */
function xows_gui_mucl_list_update(room)
{
  // show and hide proper <ul> as required
  const ownr_ul = xows_gui_doc(room, "ownr_ul");
  ownr_ul.hidden = (ownr_ul.querySelector("LI-PEER") === null);

  const admn_ul = xows_gui_doc(room, "admn_ul");
  admn_ul.hidden = (admn_ul.querySelector("LI-PEER") === null);

  const modo_ul = xows_gui_doc(room, "modo_ul");
  modo_ul.hidden = (modo_ul.querySelector("LI-PEER") === null);

  const part_ul = xows_gui_doc(room, "part_ul");
  part_ul.hidden = (part_ul.querySelector("LI-PEER") === null);

  const vist_ul = xows_gui_doc(room, "vist_ul");
  vist_ul.hidden = (vist_ul.querySelector("LI-PEER") === null);
}

/* -------------------------------------------------------------------
 * MUC Interactions - Occupant contextual Menu
 * -------------------------------------------------------------------*/
/**
 * Occupant drop menu on-close Callback function
 */
function xows_gui_muc_occu_menu_onclose()
{
  // Clear selected occupant
  const li_peer = xows_doc("mucl_list").querySelector(".SELECTED");
  li_peer.classList.remove("SELECTED");
}

/**
 * Occupant drop menu placement Callback function
 *
 * @param   {object}    button    Drop menu button
 * @param   {object}    drop      Drop menu object
 */
function xows_gui_muc_occu_menu_onshow(button, drop)
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
function xows_gui_muc_occu_menu_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Get related room occupant <li-peer> element
  const li_peer = xows_doc("mucl_list").querySelector(".SELECTED");

  // Close menu and unfocus button
  xows_doc_menu_close();

  // Get related menu item <li> element where click occurred
  const li = event.target.closest("LI");
  if(!li) return;

  // Retreive room occupant object
  const occu = xows_cli_occu_get(xows_gui_peer, li_peer.dataset.id);

  let affi = null;
  let role = null;

  switch(li.id)
  {
  case "occu_mi_info":
    xows_gui_prof_open(occu);
    return;
  case "occu_mi_priv":
    // Initialize Private Conversation
    xows_gui_rost_occu_init(occu);
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
      xows_gui_muc_affi_mbox_open(occu, affi);
    } else {
      xows_cli_muc_set_affi(occu, affi);
    }
  }

  if(role != null && role != occu.role) {
    // Asks for confirmation for Kick
    if(role === XOWS_ROLE_NONE) {
      xows_gui_muc_role_mbox_open(occu, role);
    } else {
      xows_cli_muc_set_role(occu, role);
    }
  }
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
