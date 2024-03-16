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
 *                         Client API Module
 *
 * ------------------------------------------------------------------ */

/**
 * List of available own account feature
 */
const xows_cli_feat_own = [];

/**
 * List of available server feature
 */
const xows_cli_entities = new Map();

/**
 * Check whether entity has the specified feature
 *
 * @param   {string}    entity    Entity (JID) to check
 * @param   {string}    feat      Feature name to search
 *
 * @return  {boolean}   True if feature was found, false otherwise
 */
function xows_cli_entity_has(entity, feat)
{
  if(xows_cli_entities.has(entity))
    return xows_cli_entities.get(entity).feat.includes(feat);

  return false;
}

/**
 * Map to store per-services (such as HTTP Upload, MUC, etc) availables
 * entities (JID)
 */
const xows_cli_services = new Map();

/**
 * Array to store availables external services gathered either via
 * External Service Discovery (XEP-0215) or supplied 'extern_services' option.
 */
const xows_cli_extservs = [];

/**
 * Check whether external service type is available.
 *
 * The function accept more than one parameter as type to check
 * against multiple types at once.
 *
 * @param   {string}    type      External service type to search
 *
 * @return  {boolean}   True if external service was found, false otherwise
 */
function xows_cli_external_has(type)
{
  const types = Array.from(arguments);

  let i, svcs;

  svcs = xows_options.extern_services;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      return true;
  }

  svcs = xows_cli_extservs;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      return true;
  }

  return false;
}

/**
 * Get external service list by type.
 *
 * The function accept more than one parameter as type to gather
 * multiple types at once.
 *
 * @param   {string}    type      External service type to gather
 *
 * @return  {object[]}  Array of external service objects.
 */
function xows_cli_external_get(type)
{
  const types = Array.from(arguments);

  let i, svcs;

  const result = [];

  svcs = xows_options.extern_services;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      result.push(svcs[i]);
  }

  svcs = xows_cli_extservs;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      result.push(svcs[i]);
  }

  return result;
}

/* -------------------------------------------------------------------
 *
 * Client API - Internal data structure and routines
 *
 * -------------------------------------------------------------------*/
/**
 * Constants for PEER object type
 */
const XOWS_PEER_NONE  = 0;
const XOWS_PEER_CONT  = 1;
const XOWS_PEER_ROOM  = 2;
const XOWS_PEER_OCCU  = 3;

/* -------------------------------------------------------------------
 * Client API - Internal data - Self PEER Object
 * -------------------------------------------------------------------*/
/**
 * Self PEER object
 */
let xows_cli_self = {
  "jid" : null,   //< Full JID (user@domain/ressource)
  "bare": null,   //< bare JID (user@domain)
  "name": null,   //< Nickname / display name
  "avat": null,   //< Avatar picture Hash
  "show": 0,      //< Presence level
  "stat": null,   //< Presence Status string
  "vcrd": null    //< vcard (raw data)
};
// set Peer type as constant
Object.defineProperty(xows_cli_self,"type",{value:XOWS_PEER_CONT,writable:false});
Object.seal(xows_cli_self); //< prevet structure modification

/**
 * Check wether the given full JID correspond to current user bare JID
 *
 * @param   {string}    jid       Contact JID to find
 *
 * @return  {object}    Contact object or null if not found
 */
function xows_cli_isself(jid)
{
  return jid.startsWith(xows_cli_self.bare);
}

/* -------------------------------------------------------------------
 * Client API - Internal data - Contact PEER Objects
 * -------------------------------------------------------------------*/
/**
 * The Client Roster list of contacts
 */
const xows_cli_cont = [];

/**
 * Create a new Contact Peer object
 *
 * @param   {string}    bare      JID (user@service.domain)
 * @param   {string}    name      Displayed name
 * @param   {string}    subs      Current subscription
 * @param   {string}    avat      Avatar hash string
 *
 * @return  {object}  New Contact Peer object.
 */
function xows_cli_cont_new(bare, name, subs, avat)
{
  const cont = {
    "lock": bare,               //< Current locked (user@domain/ressource)
    "name": name?name:bare,     //< Display name
    "subs": subs,               //< Subscription mask
    "avat": avat,               //< Avatar hash string.
    "show": 0,                  //< Displayed presence show level
    "stat": "",                 //< Displayed presence status string
    "noti": true,               //< Notification Enabled/Mute
    "chat": 0,                  //< Chatstate level
    "call": null                //< Jingle call SID
  };

  // set Constant properties
  xows_def_readonly(cont,"type",XOWS_PEER_CONT);  //< Peer type
  xows_def_readonly(cont,"bare",bare);            //< bare JID (user@domain)
  xows_def_readonly(cont,"ress",new Map());              //< Resource list

  Object.seal(cont); //< prevet structure modification

  xows_cli_cont.push(cont);
  return cont;
}

/**
 * Returns Contact Peer object with the specified JID
 *
 * @param   {string}    jid       Contact JID to find
 *
 * @return  {object}    Contact object or null if not found
 */
function xows_cli_cont_get(jid)
{
  // Get the bare JID
  const bare_jid = xows_jid_bare(jid);

  let i = xows_cli_cont.length;
  while(i--) {
    if(xows_cli_cont[i].bare === bare_jid)
      return xows_cli_cont[i];
  }

  return null;
}

/**
 * Returns the contact most suitable full JID for peer to peer
 * application.
 *
 * If available, the function returns the last chat session locked JID,
 * if none exists, it returns the available JID with the best priority.
 * Eventually, if no full JID was found, the Bare JID is returned.
 *
 * @param   {object}    cont      Contact Peer object
 *
 * @return  {string}    Contact best full JID or Bare JID if not found.
 */
function xows_cli_cont_best_jid(cont)
{
  // Check for chat session locked JID
  if(cont.lock != cont.bare) {
    return cont.lock;
  } else {

    let res = null;

    // Try to find best suitable resource
    const ress = Array.from(cont.ress.values());

    if(ress.length) {
      if(ress.length > 1) {
        // First sort by Show level
        ress.sort(function(a,b){return b.show - a.show;});
        // Then sort by Priority
        ress.sort(function(a,b){return b.prio - a.prio;});
      }
      res = ress[0].id;
    }

    // Select ressource according show level and priority
    return res ? cont.bare+"/"+res : cont.bare;
  }
}

/* -------------------------------------------------------------------
 * Client API - Internal data - Room PEER Objects
 * -------------------------------------------------------------------*/
/**
 * The Client Roster list of charooms
 */
const xows_cli_room = [];

/**
 * Create a new Chatroom Peer object
 *
 * @param   {string}    bare      Chatroom JID (room@service.domain)
 * @param   {string}    name      Displayed name
 * @param   {string}    desc      Description string
 * @param   {boolean}   prot      Password protected
 * @param   {boolean}   publ      Room is public
 *
 * @return  {object}    New Chatroom Peer object
 */
function xows_cli_room_new(bare, name, desc, prot, publ)
{
  const room = {
    "name": name,           //< Display name
    "desc": desc,           //< Room description
    "subj": "",             //< Room subject
    "publ": publ,           //< Room is public
    "prot": prot,           //< Room is protected by password
    "join": null,           //< Room join JID (room@service.domain/nick)
    "role": 0,              //< Self Room Role (Level)
    "affi": 0,              //< Self Room Affiliation (Level)
    "occu": [],             //< Room occupant array
    "noti": true,           //< Notification Enabled/Mute
    "init": false,          //< Newly created Room, need configuration
    "book": false,          //< Room is Bookmarked
    "writ": []              //< Chatstate writting occupants list
  };

  // set Constant properties
  xows_def_readonly(room,"type",XOWS_PEER_ROOM);  //< Peer type
  xows_def_readonly(room,"bare",bare);            //< bare JID (room@service.domain)
  xows_def_readonly(room,"lock",bare);            //< for inter-operability with contact

  Object.seal(room); //< prevet structure modification

  xows_cli_room.push(room);
  return room;
}

/**
 * Returns the Room object with the specified JID
 *
 * @param   {string}    jid       Room JID to find
 *
 * @return  {object}    Room object or null if not found
 */
function xows_cli_room_get(jid)
{
  // Get the bare JID
  const bare_jid = xows_jid_bare(jid);

  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].bare === bare_jid)
      return xows_cli_room[i];
  }

  return null;
}
/* -------------------------------------------------------------------
 * Client API - Internal data - Room occupant PEER Objects
 * -------------------------------------------------------------------*/
/**
 * Create a new room Occupant Peer object
 *
 * @param   {string}    room      Room object where to create Occupant
 * @param   {string}    jid       Full JID (room@domaine/nick)
 * @param   {number}    affi      Room affiliation (Level)
 * @param   {number}    role      Room role (Level)
 * @param   {string}    full      Real full JID if available
 * @param   {string}    avat      Avatar hash string
 * @param   {number}    show      Current show level
 * @param   {string}    stat      Current status string
 *
 * @return  {object}    New room Occupant Peer object
 */
function xows_cli_occu_new(room, jid, affi, role, full, avat, show, stat)
{
  const name = xows_jid_resc(jid);
  const bare = full?xows_jid_bare(full):null;
  const self = full?xows_cli_isself(full):false;

  const occu = {
    "name": name,             //< Nickname
    "affi": affi,             //< Room affiliation
    "role": role,             //< Room role
    "full": full,             //< Real full JID (user@domain/ressource)
    "bare": bare,             //< Real bare JID (user@domain)
    "avat": avat,             //< Avatar hash string.
    "show": show,             //< Presence show level
    "stat": stat,             //< Presence status string
    "chat": 0                 //< Chatstate level
  };

  // set Constant properties
  xows_def_readonly(occu,"type",XOWS_PEER_OCCU);  //< Peer type
  xows_def_readonly(occu,"room",room);            //< Occupant Room reference
  xows_def_readonly(occu,"jid",jid);              //< Occupant JID (room@domaine/nick)
  xows_def_readonly(occu,"self",self);            //< This occupant is the current client

  Object.seal(occu); //< prevet structure modification

  room.occu.push(occu);
  return occu;
}

/**
 * Returns the Occupant object with the specified JID
 *
 * @param   {string}    room      Room object
 * @param   {string}    jid       Occupant JID to find
 *
 * @return  {object}    Occupant object or null if not found
 */
function xows_cli_occu_get(room, jid)
{
  let i = room.occu.length;
  while(i--) {
    if(room.occu[i].jid === jid)
      return room.occu[i];
  }

  return null;
}

/**
 * Find existing or create new Occupant object with the specified JID
 *
 * If no matching Occupant object were found, a new Occupant is created
 * in the specified Room with available cached data.
 *
 * @param   {string}    room      Room object
 * @param   {string}    jid       Occupant JID to find or create
 *
 * @return  {object}    Occupant object
 */
function xows_cli_occu_any(room, jid)
{
  // Try to find existing/online Occupant
  let i = room.occu.length;
  while(i--) {
    if(room.occu[i].jid === jid)
      return room.occu[i];
  }

  // Add Occupant in Room with available cached data
  const cach = xows_cach_peer_get(jid);
  const avat = cach ? cach.avat : xows_cli_avat_temp(jid);
  return xows_cli_occu_new(room, jid, null, null, null, avat, 0, "");
}
/* -------------------------------------------------------------------
 *
 * Client API - General Peers management routines
 *
 * -------------------------------------------------------------------*/
/**
 * Returns the Room or Contact object with the specified JID
 *
 * @param   {string}    jid       Contact JID to find
 *
 * @return  {object}    Room object or null if not found
 */
function xows_cli_peer_get(jid)
{
  // Get the bare JID
  const bare = xows_jid_bare(jid);

  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].bare === bare)
      return xows_cli_room[i];
  }

  i = xows_cli_cont.length;
  while(i--) {
    if(xows_cli_cont[i].bare === bare)
      return xows_cli_cont[i];
  }

  return null;
}

/**
 * Update (and cache) Peer or Self informations such as Nickname,
 * Avatar or Status
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {string}    nick      Received Nickname (or null)
 * @param   {string}    avat      Received Avatar data hash (or null)
 * @param   {string}    stat      Received Saved status (or null)
 */
function xows_cli_peer_update(jid, nick, avat, stat)
{
  // Check whether this is own profile data
  if(!jid || xows_cli_isself(jid)) {

    xows_log(2,"cli_peer_update","received own profile data");

    // Add peer data to cache
    xows_cach_peer_save(xows_cli_self.bare, nick, avat, stat, null);

    if(nick) xows_cli_self.name = nick;
    if(avat) xows_cli_self.avat = avat;
    if(stat) xows_cli_self.stat = stat;

    // Forward user update
    xows_cli_fw_onselfpush(xows_cli_self);

    // Send presence update
    if(avat || stat) xows_cli_presence_update();

  } else {

    // This may be data from roster contact or room occupant
    const peer = xows_cli_peer_get(jid);

    if(!peer) {
      xows_log(1,"cli_peer_update","unknown/unsubscribed peer",jid);
      return;
    }

    xows_log(2,"cli_peer_update","received profile data for",jid);

    // We do not cache occupant unless available avatar data
    if(avat || peer.type === XOWS_PEER_CONT)
      xows_cach_peer_save(jid, nick, avat, stat, null);

    if(peer.type === XOWS_PEER_CONT) {
      if(nick) peer.name = nick;
      if(avat) peer.avat = avat;
      if(stat) peer.stat = stat;
      // Forward Contact update
      xows_cli_fw_oncontpush(peer);
    } else {
      const occu = xows_cli_occu_get(peer, jid);
      if(occu) {
        if(nick) occu.name = nick;
        if(avat) occu.avat = avat;
        // Forward Occupant update
        xows_cli_fw_onoccupush(peer, occu);
      }
    }
  }
}

/* -------------------------------------------------------------------
 *
 * Client API - API client interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for client connected
 */
let xows_cli_fw_onconnect = function() {};

/**
 * Callback function for client user status change
 */
let xows_cli_fw_onselfpush = function() {};

/**
 * Callback function for connection or login error
 */
let xows_cli_fw_onerror = function() {};

/**
 * Callback function for session closed
 */
let xows_cli_fw_onclose = function() {};

/**
 * Set callback functions for common client events
 *
 * Possibles slot parameter value are the following:
 *  - connect   : Client connected and ready
 *  - contpush  : Add or refresh Roster Contact
 *  - contrem   : Remove Contact from Roster
 *  - subspush  : Add or refresh Subscription Request
 *  - subsrem   : Remove Subscription Request
 *  - roompush  : Add or refresh Roster Room
 *  - roomrem   : Remove Room/Bookmark from Roster
 *  - occupush  : Add or refresh Room Occupant
 *  - occurem   : Remove Room Occupant
 *  - message   : Common chat messages
 *  - chatstate : Chat states messages
 *  - receipt   : Message receipts
 *  - subject   : Room subject
 *  - callerror : Received Multimedia call error
 *  - callinit  : Received Multimedia call initiate
 *  - callaccept: Received Multimedia call accept
 *  - callend   : Received Multimedia call terminate
 *  - error     : Client Error
 *  - timeout   : Connection timeout
 *  - close     : Session closed
 *
 * @param   {string}    type      Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_cli_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase()) {
    case "connect":     xows_cli_fw_onconnect = callback; break;
    case "selfchange":  xows_cli_fw_onselfpush = callback; break;
    case "contpush":    xows_cli_fw_oncontpush = callback; break;
    case "contrem":     xows_cli_fw_oncontrem = callback; break;
    case "subspush":    xows_cli_fw_onsubspush = callback; break;
    case "subsrem":     xows_cli_fw_onsubsrem = callback; break;
    case "roompush":    xows_cli_fw_onroompush = callback; break;
    case "roomrem":     xows_cli_fw_onroomrem = callback; break;
    case "occupush":    xows_cli_fw_onoccupush = callback; break;
    case "occurem":     xows_cli_fw_onoccurem = callback; break;
    case "message":     xows_cli_fw_onmessage = callback; break;
    case "chatstate":   xows_cli_fw_onchatstate = callback; break;
    case "receipt":     xows_cli_fw_onreceipt = callback; break;
    case "retract":     xows_cli_fw_onretract = callback; break;
    case "subject":     xows_cli_fw_onsubject = callback; break;
    case "callerror":   xows_cli_fw_oncallerror = callback; break;
    case "callinit":    xows_cli_fw_oncallinit = callback; break;
    case "callaccept":  xows_cli_fw_oncallaccept = callback; break;
    case "callend":     xows_cli_fw_oncallend = callback; break;
    case "error":       xows_cli_fw_onerror = callback; break;
    case "timeout":     xows_cli_fw_ontimeout = callback; break;
    case "close":       xows_cli_fw_onclose = callback; break;
  }
}

/**
 * Proceeds incoming XMPP error
 *
 * @parma   {number}    code      Signal code for message (error or warning)
 * @param   {string}    mesg      Warning or error message
 */
function xows_cli_xmp_onerror(code, mesg)
{
  // forward XMPP error
  xows_cli_fw_onerror(code, mesg);
}

/* -------------------------------------------------------------------
 *
 * Client API - XMPP Connection routines
 *
 * -------------------------------------------------------------------*/
/**
 * Connecte client to the specified XMPP over WebSocket service
 * using the given auhentication data
 *
 * @param   {string}    url       XMPP over WebSocket service URL
 * @param   {string}    jid       User JID (username@domain)
 * @param   {string}    password  Authentication password
 * @param   {boolean}   register  Register a new account
 */
function xows_cli_connect(url, jid, password, register)
{
  // Reset all stuff from previous session
  xows_cli_cont.length = 0;
  xows_cli_room.length = 0;
  xows_cli_services.clear();
  xows_cli_entities.clear();
  xows_cli_extservs.length = 0;

  // Store MAM parameter from options
  xows_cli_mam_max = xows_options.history_size / 2;

  // Reset client user entity
  xows_cli_self.jid  = null;
  xows_cli_self.bare = null;
  xows_cli_self.name = null;
  xows_cli_self.avat = null;
  xows_cli_self.stat = null;
  xows_cli_self.vcrd = null;

  // Reset presence activity
  xows_cli_activity_stop();

  // Set callback functions
  xows_xmp_set_callback("session", xows_cli_xmp_onsession);
  xows_xmp_set_callback("presence", xows_cli_xmp_onpresence);
  xows_xmp_set_callback("subscrib", xows_cli_xmp_onsubscribe);
  xows_xmp_set_callback("occupant", xows_cli_xmp_onoccupant);
  xows_xmp_set_callback("rostpush", xows_cli_xmp_onrostpush);
  xows_xmp_set_callback("message", xows_cli_xmp_onmessage);
  xows_xmp_set_callback("chatstate", xows_cli_xmp_onchatstate);
  xows_xmp_set_callback("receipt", xows_cli_xmp_onreceipt);
  xows_xmp_set_callback("retract", xows_cli_xmp_onretract);
  xows_xmp_set_callback("subject", xows_cli_xmp_onsubject);
  xows_xmp_set_callback("pubsub", xows_cli_xmp_onpubsub);
  xows_xmp_set_callback("jingle", xows_cli_xmp_onjingle);
  xows_xmp_set_callback("error", xows_cli_xmp_onerror);
  xows_xmp_set_callback("close", xows_cli_xmp_onclose);

  // Open a new XMPP connection
  return xows_xmp_connect(url, jid, password, register);
}

/**
 * Handle successfull connection and opened XMPP session
 *
 * This function is called by the xows_xmp_* API layer once XMPP
 * services and items discovery is completed.
 *
 * @param   {object}    bind      XMPP Session bind object
 */
function xows_cli_xmp_onsession(bind)
{
  // Store the full JID for this session
  xows_cli_self.jid = bind.full;
  xows_cli_self.bare = bind.bare;

  // Check for cached information about own account
  const cach = xows_cach_peer_get(xows_cli_self.bare);
  if(cach !== null) {
    if(cach.name) xows_cli_self.name = cach.name;
    if(cach.avat) xows_cli_self.avat = cach.avat;
    if(cach.desc) xows_cli_self.stat = cach.desc;
  }
  // Compose default name and nickname from JID
  if(xows_cli_self.name === null) {
    const userid = xows_xmp_bind.node;
    xows_cli_self.name = userid.charAt(0).toUpperCase() + userid.slice(1);
  }
  // Create default avatar if needed
  if(!xows_cli_self.avat) xows_cli_self.avat = xows_cli_avat_temp(xows_cli_self.bare);


  if(xows_cli_connect_loss) {

    // Recovery from connection loss, skip features & services discovery
    xows_xmp_rost_get_query(xows_cli_initialize);

  } else {
    // Start features & services discovery

    // Add own JID for discovery to get available account features
    xows_cli_disco_queue(xows_cli_self.bare);

    // Add server for discovery to get available features and services
    xows_cli_disco_queue(xows_xmp_host);

    // Here we go...
    xows_cli_disco_start(xows_cli_disco_finish, true);
  }
}

/**
 * Checks wether client is connected
 *
 * @return  {boolean}   True if client is connected, false otherwise
 */
function xows_cli_connected()
{
  return (xows_cli_self.jid !== null);
}

/* -------------------------------------------------------------------
 *
 * Client API - Client initialization routines
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Client API - Entities Discovery routines
 * -------------------------------------------------------------------*/
/**
 * Discovery session stack to track end fo discovery
 */
const xows_cli_disco_stk = [];

/**
 * Query disco#info for the specified entity
 *
 * @param   {string}    to        Entity JID to query disco#info to
 * @param   {string}   [node]     Optionnal node to query to
 */
function xows_cli_discoinfo_query(to, node = null)
{
  // Push entiy discovery
  xows_cli_disco_stk.push(to);

  // Send query
  xows_xmp_disco_info_query(to, node, xows_cli_discoinfo_parse);
}

/**
 * Handle disco#info query to entity
 *
 * Called once the query result is received, continue the discovery
 * process by sending a disco#items to server.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object}   [form]     Optionnal x data form included in result
 */
function xows_cli_discoinfo_parse(from, iden, feat, form)
{
  xows_log(2,"cli_discoinfo_parse","discovered entiy",from);

  xows_cli_entities.set(from, {"iden":iden,"feat":feat,"item":[]});

  if(iden.length) { //< let this check ! sever may respond without "<identity>"
    // Check whether entity is a MUC Room
    if(from.includes("@") && iden[0].category === "conference")
      xows_cli_muc_discoinfo_parse(from, iden, feat, form); //< Parse MUC Room
  }

  // Search whether entity has http://jabber.org/protocol/disco#items
  if(feat.includes(XOWS_NS_DISCOITEMS)) {

    // Push entiy discovery
    xows_cli_disco_stk.push(from);

    // Query for entity items
    xows_xmp_disco_items_query(from, xows_cli_discoitems_parse);
  }

  // Search whether entity has urn:xmpp:extdisco:2
  if(feat.includes(XOWS_NS_EXTDISCO)) {

    // Push entiy discovery
    xows_cli_disco_stk.push(from);

    // Query for external services (ftp, stun, etc.)
    xows_xmp_extdisco_query(from, null, xows_cli_extdisco_parse);
  }

  // Pop entiy discovery
  xows_cli_disco_ended(from);
}

/**
 * Handle disco#items query to entity
 *
 * Called once the query result is received. If items are received, the
 * discovery process continue by sending disco#info to each item,
 * otherwise the discovery is assumed completed and a query for roster
 * is sent.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_discoitems_parse(from, item)
{
  const entity = xows_cli_entities.get(from);

  // If this is MUC Service, Forward null to signal query response
  if(entity.iden[0].category === "conference")
    xows_cli_fw_onroompush(null);

  for(let i = 0, n = item.length; i < n; ++i) {

    // Add items to entity
    entity.item.push(item[i].jid);

    // Query disco#info for this item
    xows_cli_discoinfo_query(item[i].jid);
  }

  // Pop entiy discovery
  xows_cli_disco_ended(from);
}

/**
 * Function to handle parsed result of external services query
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  svcs      Array of parsed <service> objects
 */
function xows_cli_extdisco_parse(from, svcs)
{
  // Copy arrays
  for(let i = 0, n = svcs.length; i < n; ++i) {

    const type = svcs[i].type;

    // Output some logs
    xows_log(2,"cli_extdisco_parse","discovered external",type+" ("+svcs[i].host+":"+svcs[i].port+")");

    // Add external service to list
    xows_cli_extservs.push(svcs[i]);
  }

  // Pop entiy discovery
  xows_cli_disco_ended(from);
}

/* -------------------------------------------------------------------
 * Client API - Initialization Dicovery Cycle routines
 * -------------------------------------------------------------------*/
/**
 * Discovery session stack to track end fo discovery
 */
const xows_cli_disco_qeu = [];


/**
 * Stored callback function for discovery session
 */
let xows_cli_disco_onend = null;

/**
 * Add entity to discovery session queue
 *
 * @param   {string}    jid       Entity JID to discover infos
 */
function xows_cli_disco_queue(jid)
{
  xows_cli_disco_qeu.push(jid);
}

/**
 * Setup a new discovery session with callback function to be called once
 * discovery ended.
 *
 * @param   {string}    onend     Callback function to be called once discovery ended
 * @param   {boolean}  [clear]    Optionnal boolean to force clear discovered entities
 */
function xows_cli_disco_start(onend, clear = false)
{
  xows_log(2,"cli_discoinfo_start","start new discovery cycle");

  // Ensure we start from empty stack
  xows_cli_disco_stk.length;

  // Clear discovered entities if required
  if(clear) {
    xows_cli_entities.clear();
    xows_cli_services.clear();
    xows_cli_extservs.length = 0;
  }

  // Store the onend callback
  xows_cli_disco_onend = onend;

  // Send discoinfo queries
  for(let i = 0, n = xows_cli_disco_qeu.length; i < n; ++i)
    xows_cli_discoinfo_query(xows_cli_disco_qeu[i]);

  // empty queue
  xows_cli_disco_qeu.length = 0;
}

/**
 * "Private" function to specify discovery of entity ended. This function is
 * not to be used on its own
 *
 * @param   {string}    jid       Entity JID to remove from stack
 */
function xows_cli_disco_ended(jid)
{
  // Remove entity from discovery stack
  xows_cli_disco_stk.splice(xows_cli_disco_stk.indexOf(jid), 1);

  // Check for empty stack for callback
  if(!xows_cli_disco_stk.length) {
    if(xows_isfunc(xows_cli_disco_onend))
      xows_cli_disco_onend();

    // Reset callback
    xows_cli_disco_onend = null;
  }
}

/**
 * Initial discovery session final processing (callback function).
 *
 * This function is called once initial discovery is finished to setup
 * availables common services such as MUC or HTTP File Upload.
 *
 * When setup job done, the function send a query to get roster to
 * continue the client initialization.
 */
function xows_cli_disco_finish()
{
  // Check for main XMPP server features
  const serv_infos = xows_cli_entities.get(xows_xmp_host);

  // Check for message carbons
  if(serv_infos.feat.includes(XOWS_NS_CARBONS))
    xows_xmp_carbons_query(true);

  // Search in entity for MUC and HTTP_File_Upload services
  for(const [entity, infos] of xows_cli_entities) {

    // Check for MUC service
    if(infos.feat.includes(XOWS_NS_MUC)) {

      // Initialize service slot if required
      if(!xows_cli_services.has(XOWS_NS_MUC))
        xows_cli_services.set(XOWS_NS_MUC,[]);

      // Add service address
      xows_cli_services.get(XOWS_NS_MUC).push(entity);
    }

    // Check for HTTP_File_Upload (XEP-0363) service
    if(infos.feat.includes(XOWS_NS_HTTPUPLOAD)) {

      // Initialize service slot if required
      if(!xows_cli_services.has(XOWS_NS_HTTPUPLOAD))
        xows_cli_services.set(XOWS_NS_HTTPUPLOAD,[]);

      // Add service address
      xows_cli_services.get(XOWS_NS_HTTPUPLOAD).push(entity);
    }
  }

  // Server discovery finished, now query for roster
  xows_xmp_rost_get_query(xows_cli_initialize);
}

/* -------------------------------------------------------------------
 * Client API - Client final initialization
 * -------------------------------------------------------------------*/
/**
 * Client final initialization
 *
 * This function is called as callback to parse the initial roster
 * get query that follow the client services and features discovery.
 *
 * @param   {object[]}  item      Array of parsed roster <item> objects
 */
function xows_cli_initialize(item)
{
  // Parse received roster items
  xows_cli_rost_get_parse(item);

  // Initial presence value
  xows_cli_self.show = xows_cli_show_saved = XOWS_SHOW_ON;

  // Send simple initial presence, without avatar advert
  xows_xmp_presence_send(null, null, XOWS_SHOW_ON, xows_cli_self.stat);

  // Initialization can be normal or following connection loss
  if(xows_cli_connect_loss) {

    // This is a partial/reconnect initilization

    // Connexion is now ok
    xows_cli_connect_loss = false;

    // We must re-join joigned rooms after reconnect
    let i = xows_cli_room.length;
    while(i--) {
      if(xows_cli_room[i].join) {
        xows_cli_room[i].join = null;
        xows_cli_muc_join(xows_cli_room[i]);
      }
    }

  } else {

    // This is a full/normal initialization

    // Query for own vcard
    if(!xows_options.vcard4_notify)
      xows_cli_vcard_query(xows_cli_self.bare);

    // Query for own avatar
    if(!xows_options.avatar_notify)
      xows_cli_avat_meta_query(xows_cli_self.bare);

    // Query for own nickname
    xows_cli_nick_query(xows_cli_self.bare);

    // Update user parameters
    xows_cli_fw_onselfpush(xows_cli_self);
  }

  xows_log(2,"cli_initialize","client ready");

  // Forward to GUI
  xows_cli_fw_onconnect(xows_cli_self);
}

/* -------------------------------------------------------------------
 *
 * Client API - Client deconnection and reconnection routines
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for connect or reconnect timeout
 */
let xows_cli_fw_ontimeout = function() {};

/**
 * Flag for client connexion loss
 */
let xows_cli_connect_loss = false;

/**
 * Handle XMPP stream closed
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [mesg]     Optional information or error message
 */
function xows_cli_xmp_onclose(code, mesg)
{
  // Output log
  xows_log(2,"cli_xmp_onclose","connexion cloded","("+code+") "+mesg);

  if(xows_cli_connect_loss) {
    // Try reconnect
    xows_cli_reconnect();
    return;
  }

  // Check whether this is a connection loss
  if(code == XOWS_SIG_HUP) {

    // Output log
    xows_log(1,"cli_xmp_onclose","lost connection",mesg);

    // Set connexion loss
    xows_cli_connect_loss = true;
    // Clear all contact resources to prevent 'ghost'
    xows_cli_rost_reset();
    // Start reconnect process with 10 attempts
    xows_cli_reconnect(5);

  } else {

    // Ignore if already closed
    if(xows_cli_self.jid) {

      // Output log
      xows_log(1,"cli_xmp_onclose","session destroy",mesg);

      // Clean the client data
      xows_cli_cont.length = 0;
      xows_cli_room.length = 0;

      // Reset client user entity
      xows_cli_self.jid  = null;
      xows_cli_self.bare = null;
      xows_cli_self.name = null;
      xows_cli_self.avat = null;
      xows_cli_self.stat = null;
      xows_cli_self.vcrd = null;

      // Stop presence activity
      xows_cli_activity_stop();
    }
  }

  // Forward the connexion close code and message
  xows_cli_fw_onclose(code, mesg);
}

/**
 * Delay in miliseconds between reconnect attempts
 */
const XOWS_RECONN_DELAY = 5000;

/**
 * Reconnect attempt timeout reference
 */
let xows_cli_reconn_try_hto = null;

/**
 * Reconnect attempt timeout reference
 */
let xows_cli_reconn_try_cnt = 0;

/**
 * Attempt to reconnect client to XMPP server using previousely defined
 * auhentication data
 */
function xows_cli_reconn_try()
{
  // Try reconnect XMPP session
  if(xows_cli_connect_loss)
    xows_xmp_reconnect();

  // Another attempt can be initated
  xows_cli_reconn_try_hto = null;

  // Decrease left attempt count
  xows_cli_reconn_try_cnt--;
}

/**
 * Try to reconnect client to XMPP server using previousely defined
 * auhentication data
 *
 * @param   {number}    attempt    If positive number set left attempt count
 */
function xows_cli_reconnect(attempt)
{
  if(xows_cli_connect_loss) {

    if(attempt)
      xows_cli_reconn_try_cnt = attempt;

    // Output log
    xows_log(2,"cli_reconnect","attempt left",xows_cli_reconn_try_cnt);

    // Reset presence activity
    xows_cli_activity_stop();

    if(xows_cli_reconn_try_cnt) {
      // Try again after delay
      if(!xows_cli_reconn_try_hto)
        xows_cli_reconn_try_hto = setTimeout(xows_cli_reconn_try, XOWS_RECONN_DELAY);
    } else {
      // Give up reconnect, forward timeout
      xows_cli_fw_ontimeout();
    }
  }
}

/**
 * Close the XMPP session and disconnect from server
 */
function xows_cli_disconnect()
{
  // do not disconnect not connected
  if(!xows_cli_self.jid)
    return;

  xows_log(2,"cli_disconnect","prepare disconnect");

  // No more connection loss
  xows_cli_connect_loss = false;

  // Terminate call session if any
  xows_cli_call_terminate();

  // Client is now Offline
  xows_cli_show_saved(0);

  // Close the connection
  xows_xmp_fram_close_send(3); //< Close without error
}

/**
 * Special function to close session and exit the quickest way
 * possible, used to terminate session when browser exit page
 */
function xows_cli_flyyoufools()
{
  // Terminate any pending call
  if(xows_cli_jing_sid.size) {
    for(const [peer, sid] of xows_cli_jing_sid.entries())
      xows_xmp_jing_terminate(peer.call, sid, "failed-application");
  }

  // Disconnect XMPP session
  xows_xmp_flyyoufools();
}

/* -------------------------------------------------------------------
 *
 * Client API - User Roster routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Contact added or refreshed
 */
let xows_cli_fw_oncontpush = function() {};

/**
 * Callback function for Contact removed
 */
let xows_cli_fw_oncontrem = function() {};

/**
 * Proceeds incoming XMPP roster push
 *
 * @param   {string}    bare      Contact bare JID
 * @param   {string}    name      Contact Displayred name
 * @param   {number}    subs      Contact subscription
 * @param   {string}    group     Contact group (not used yet)
 */
function xows_cli_xmp_onrostpush(bare, name, subs, group)
{
  // Sepecial case if we receive a 'remove' subscription
  if(subs < 0) {
    xows_log(2,"cli_rost_update","Roster update",bare+" \""+name+"\" subscription: "+subs);
    // Remove contact from local list
    let i = xows_cli_cont.length;
    while(i--) {
      if(xows_cli_cont[i].bare === bare) {
        xows_log(2,"cli_rost_update","removing Contact",bare);
        xows_cli_cont.splice(i,1);
        xows_cli_fw_oncontrem(bare); //< Forward contact to remove
        break;
      }
    }
    return;
  }

  let cont = xows_cli_cont_get(bare);
  if(cont !== null) {
    cont.name = name ? name : bare;
    cont.subs = subs;

    xows_log(2,"cli_rost_update","update Contact",bare+" \""+name+"\" subscription: "+subs);
  } else {

    let avat = null;

    // Check for stored data un cache (localStorage)
    const cach = xows_cach_peer_get(bare);
    if(cach !== null) {
      name = cach.name;
      avat = cach.avat;
    }

    // If no avatar data was found, set default pseudo-random avatar
    if(!avat) avat = xows_cli_avat_temp(bare);

    // Create new contact
    cont = xows_cli_cont_new(bare, name, subs, avat);

    xows_log(2,"cli_rost_update","new Contact",bare+" \""+name+"\" subscription: "+subs);
  }

  // Query Avatar for the contact
  if(!xows_options.avatar_notify) {
    xows_cli_avat_meta_query(bare);
  }

  // Query Contact Nickname
  xows_cli_nick_query(bare);

  // Forward added Contact
  xows_cli_fw_oncontpush(cont);
}

/**
 * Resets all roster contacts referenced resources and set all to unavailable.
 *
 * This function is used to reset contacts resources to avoid ghost resources
 * that may stay available, for example, after a client connection loss.
 */
function xows_cli_rost_reset()
{
  let i = xows_cli_cont.length;
  while(i--) {
    const cont = xows_cli_cont[i];

    // Remove all resources and reset presence and status
    cont.ress.clear();
    cont.show = 0;
    cont.stat = "";

    // Forward "reseted" Contact
    xows_cli_fw_oncontpush(cont);
  }
}

/**
 * Function to handle parsed result of roster query
 *
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_rost_get_parse(item)
{
  if(item.length) {
    // Fill up the Roster with received contact
    for(let i = 0, n = item.length; i < n; ++i)
      // Create a contact into local roster
      xows_cli_xmp_onrostpush(item[i].bare, item[i].name, item[i].subs, item[i].group);
  } else {
    // Push null contact, mean empty list
    xows_cli_fw_oncontpush(null);
  }
}

/**
 * Function to query client roster content (contact list)
 */
function xows_cli_rost_get_query()
{
  // Query to get roster content (list of contacts)
  xows_xmp_rost_get_query(xows_cli_rost_get_parse);
}

/**
 * Add, update or remove item (contact or room) to/from Roster
 *
 * To remove existing item, set the name parameter ot null.
 *
 * @param   {string}    bare      Item bare JID to add
 * @param   {string}    name      Displayed name for item or null
 */
function xows_cli_rost_edit(bare, name)
{
  xows_log(2,"cli_roster_edit",(name?"add":"remove")+" contact",bare);

  // Send roster add request
  xows_xmp_rost_set_query(bare, name, null, null);

  if(name) {
    xows_log(2,"cli_roster_edit","request subscribe to",bare);
    // Send a subscription request to the contact
    xows_xmp_presence_send(bare, "subscribe");
  }
}

/* -------------------------------------------------------------------
 *
 * Client API - Presences and Subscription routines
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Subscription added
 */
let xows_cli_fw_onsubspush = function() {};

/**
 * Callback function for Subscription removed
 */
let xows_cli_fw_onsubsrem = function() {};

/**
 * Handles received presence (<presence> stanza) status from
 * other contacts
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {number}    show      Numerical show level, from -1 to 4
 * @param   {number}    prio      Priority level
 * @param   {string}    stat      Status string or null if none
 * @param   {object}    node      Entity node and ver strings or null
 * @param   {string}    photo     Vcard photo hash or null if none
 */
function xows_cli_xmp_onpresence(from, show, prio, stat, node, photo)
{
  const cont = xows_cli_cont_get(from);
  if(!cont) {
    // prevent warning for own presence report
    if(xows_jid_bare(from) !== xows_xmp_bind.bare)
      xows_log(1,"cli_xmp_onpresence","unknown/unsubscribed Contact",from);
    return;
  }

  // Reset the locked resource as defined in XEP-0296
  cont.lock = cont.bare;

  // Get resource part from full JID
  let res = xows_jid_resc(from);

  // Updates presence of the specific resource, delete it if offline
  if(show > 0) {
    if(!cont.ress.has(res)) { //< new ressource ? add it
      xows_log(2,"cli_xmp_onpresence","adding Resource for "+cont.bare, res);
      cont.ress.set(res,{"id":res,"show":show,"prio":prio,"stat":stat,"node":null});
      // Check for entity capabilities
      if(node) {
        const node_ver = node.node + "#" + node.ver;
        cont.ress.get(res).node = node_ver;
        // If we don't know this node, get features
        if(!xows_cach_caps_has(node_ver)) {
          xows_log(2,"cli_xmp_onpresence","query entity caps for "+cont.bare,node_ver);
          xows_xmp_disco_info_query(from, node_ver, xows_cli_entity_caps_parse);
        }
      }
    } else { //< update existing ressource
      xows_log(2,"cli_xmp_onpresence","updating Resource for "+cont.bare, res);
      cont.ress.get(res).show = show;
      cont.ress.get(res).prio = prio;
      cont.ress.get(res).stat = stat;
    }
  } else {
    if(cont.ress.has(res)) {
      xows_log(2,"cli_xmp_onpresence","removing Resource for "+cont.bare, res);
      cont.ress.delete(res); //< ressource gone offline remove it
    }
    // If user goes unavailable, reset chatstate
    cont.chat = 0;
  }
  // Set default show level and status
  cont.show = 0;
  cont.stat = null;

  // Select new displayed show level and status according current
  // connected resources priority
  let p = -128;
  for(const res of cont.ress.values()) {
    if(res.prio > p) {
      p = res.prio;
      cont.show = res.show;
      cont.stat = res.stat;
    }
  }

  xows_log(2,"cli_xmp_onpresence","updated Presence for "+cont.bare,
            "show:"+cont.show+" stat:"+cont.stat);

  // Update avatar and query for vcard if required
  if(photo) { //< do we got photo hash ?
    if(xows_cach_avat_has(photo)) {
      cont.avat = photo;
    } else {
      xows_cli_vcard_query(cont.bare);
    }

    // Update nickname in case changed
    xows_cli_nick_query(cont.bare);
  }

  // Save current peer status to local storage
  xows_cach_peer_save(cont.bare, null, null, cont.stat, null);

  // Forward updated Contact
  xows_cli_fw_oncontpush(cont);
}

/**
 * Parese received disco#info capabilities query result
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object[]}  form      Array of parsed X-Data fields
 * @param   {string}    node      Entity Node or null if unavailable
 */
function xows_cli_entity_caps_parse(from, iden, feat, form, node)
{
  if(!xows_cach_caps_has(node)) {
    xows_log(2,"cli_entity_caps_parse","caching entity caps",node);
    // Add entity feature list to cache
    xows_cach_caps_save(node, feat);
  }
}

/**
 * Check whether an entity has the specified capability
 *
 * @param   {string}    node      Entity identifier (node)
 * @param   {string}    xmlns     XMLNS corresponding to capability
 */
function xows_cli_entity_caps_test(node, xmlns)
{
  if(xows_cach_caps_has(node))
    return xows_cach_caps_get(node).includes(xmlns);

  return false;
}
/* -------------------------------------------------------------------
 * Client API - Contacts subscription routines
 * -------------------------------------------------------------------*/
/**
 * Handles received subscribe (<presence> stanza) request or result
 * from orher contacts
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    type      Subscribe request/result type
 * @param   {string}   [nick]     Contact prefered nickname if available
 */
function xows_cli_xmp_onsubscribe(from, type, nick)
{
  let log_str;

  switch(type)
  {
  // The sender wishes to subscribe to us
  case "subscribe": log_str = "request"; break;
  // The sender deny our subscribe request
  case "unsubscribed": log_str = "denied"; break;
  // The sender has allowed us to subscribe
  case "subscribed": log_str = "allowed"; break;
  // The sender is unsubscribing us
  case "unsubscribe": log_str = "removed"; break;
  }

  // Simply log output
  xows_log(2,"cli_xmp_onsubscribe","Subscription "+log_str+" by",from);

  if(type === "subscribe") {
    // Try to find the contact
    const cont = xows_cli_cont_get(from);
    if(cont) {
      xows_log(2,"cli_xmp_onsubscribe","request automatically allowed","Contact in Roster");
      // If we already have contact in roster we accept and allow
      xows_cli_subscribe_allow(cont.bare, true, nick);
    } else { // This mean someone is adding us to its roster
      // Forward add subscription request
      xows_cli_fw_onsubspush(xows_jid_bare(from), nick);
    }
  }
}

/**
 * Send presence subscribe request to contact
 *
 * @param   {object}    bare      Contact bare JID to send subsribe request
 */
function xows_cli_subscribe_request(bare)
{
  xows_log(2,"cli_subscribe_request","request subscribe to",bare);
  // Send or resent subscribe request to contact
  xows_xmp_presence_send(bare, "subscribe");
}

/**
 * Send presence subscribtion allow or deny to contact
 *
 * @param   {string}    bare      Contact JID bare
 * @param   {boolean}   allow     True to allow, false to deny
 * @param   {string}   [nick]     Preferend nickname if available
 */
function xows_cli_subscribe_allow(bare, allow, nick)
{
  // Send an allow or deny subscription to contact
  xows_xmp_presence_send(bare, allow?"subscribed":"unsubscribed");
  xows_log(2,"cli_subscribe_request",(allow?"allow":"deny")+" subscription from",bare);
  // If subscription is allowed, we add the contact
  if(allow) {
    // Check whether we must add this contact
    if(!xows_cli_cont_get(bare)) {
      // Compose displayed name from JID
      let name;
      if(nick) {
        name = nick;
      } else {
        const userid = bare.split("@")[0];
        name = userid[0].toUpperCase() + userid.slice(1);
      }
      // We add the contact to roster (and send back subscription request)
      xows_cli_rost_edit(bare, name);
    }
  }
  // Forward subscription request to be removed
  xows_cli_fw_onsubsrem(bare);
}

/* -------------------------------------------------------------------
 *
 * Client API - Message semantics
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for sent or received Chat Message
 */
let xows_cli_fw_onmessage = function() {};

/**
 * Handles an incoming chat message with content
 *
 * @param   {object}      mesg      Message object
 */
function xows_cli_xmp_onmessage(mesg)
{
  if(mesg.type !== "chat" && mesg.type !== "groupchat") {
    xows_log(1,"cli_xmp_onmessage","invalid message type",mesg.type);
    return;
  }

  // If no time is specified set as current
  if(!mesg.time)
    mesg.time = new Date().getTime();

  let peer, sndr, muc;

  // Retreive message peer and sender
  if(mesg.type === "chat") {

    if(xows_cli_isself(mesg.from)) {
      peer = xows_cli_cont_get(mesg.to);
      sndr = xows_cli_self;
    } else {
      sndr = peer = xows_cli_cont_get(mesg.from);
      // Update "locked" ressourceas as recommended in XEP-0296
      peer.lock = mesg.from;
    }

  } else {

    muc = true;
    peer = xows_cli_room_get(mesg.from);
    if(mesg.from === peer.join) {
      sndr = xows_cli_self;
    } else {
      sndr = xows_cli_occu_any(peer, mesg.from);
    }
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onmessage","unknown/unsubscribed JID",mesg.from);
    return;
  }

  xows_log(2,"cli_xmp_onmessage","chat message",mesg.from+" \""+mesg.body+"\"");

  // Forward received message
  xows_cli_fw_onmessage(peer, sndr, mesg, false, muc);
}

/**
 * Send a chat message to the specified recipient
 *
 * @param   {string}    peer      Recipient peer (Room or Contact)
 * @param   {string}    body      Message content
 * @param   {string}   [rpid]     Optionnal message ID this one replace
 */
function xows_cli_send_message(peer, body, rpid)
{
  let type, from, to = peer.lock, recp, muc;

  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {

    muc = true;
    type = "groupchat";
    from = peer.join;
    recp = true;

  } else {

    type = "chat";
    from = xows_cli_self.bare;

    // If current peer client is online and support receipt, the
    // message should not be marked as "receip received"
    if(peer.lock !== peer.bare) {
      // Get resource object of current locked
      const res = peer.ress.get(xows_jid_resc(peer.lock));
      // Check for receipt support
      if(res) recp = xows_cli_entity_caps_test(res.node,XOWS_NS_RECEIPTS);
    }
  }

  xows_log(2,"cli_user_send_message","send "+type+" message",to+" \""+body+"\"");

  // Send message with body
  const id = xows_xmp_message_body_send(type, to, body, recp, rpid);

  // Create message object
  const mesg = {"id":id, "from":from, "to":to,
                "type":type, "body":body, "time":new Date().getTime(),
                "uoid":id, "usid":null, "rpid":rpid};

  // Forward sent message
  xows_cli_fw_onmessage(peer, xows_cli_self, mesg, recp, muc);
}
/* -------------------------------------------------------------------
 * Client API - Message semantis - Message Receipt
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Receipt
 */
let xows_cli_fw_onreceipt = function() {};

/**
 * Handles an incoming message receipt
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    to        Recipient JID
 * @param   {string}    receipt   Receipt message ID
 */
function xows_cli_xmp_onreceipt(id, from, to, receipt)
{
  let peer;
  // Check whether message is a carbons copy of a message sent by
  // current user but from another connected client.
  if(xows_cli_isself(from)) {
    xows_log(2,"cli_xmp_onreceipt","receipt from other Resource ignored",from);
    return;
  } else {
    peer = xows_cli_peer_get(from);
  }
  if(!peer) {
    xows_log(1,"cli_xmp_onreceipt","unknown/unsubscribed JID",from);
    return;
  }

  xows_log(2,"cli_xmp_onreceipt","message receipt received",from+" "+receipt);

  // Forward received Receipt
  xows_cli_fw_onreceipt(peer, receipt);
}

/* -------------------------------------------------------------------
 * Client API - Message semantis - Chat Sate
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Chatstat notification
 */
let xows_cli_fw_onchatstate = function() {};

/**
 * Handles an incoming chat state notification.
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    type      Message type
 * @param   {number}    state     Chat state
 */
function xows_cli_xmp_onchatstate(id, from, type, state)
{
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    // Check whether message is a carbons copy of a message sent by
    // own account but from another connected client.
    if(xows_cli_isself(from))
      return;
    peer = xows_cli_cont_get(from);
  } else {
    peer = xows_cli_room_get(from);
    // Check whether message is an echo send by own account
    if(peer.join === from)
      return;
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onchatstate","unknown/unsubscribed JID",from);
    return;
  }

  // Update Contact, Peer and Room according received  chatstat
  if(peer.type === XOWS_PEER_CONT) {
    peer.chat = state;
    if(state > 0) peer.lock = from;  //< Update "locked" ressource as recommended in XEP-0296
  } else {
    // search room occupant (must exists)
    const occu = xows_cli_occu_get(peer, from);
    if(occu) {
      occu.chat = state;
      // add or remove Occupant to/from Room "writing list"
      if(state > XOWS_CHAT_PAUS) { //< Writing
        if(!peer.writ.includes(occu))
          peer.writ.push(occu);
      } else {                    //< Paused, Inactive, etc...
        const i = peer.writ.indexOf(occu);
        if(i >= 0) peer.writ.splice(i, 1);
      }
    }
  }

  xows_log(2,"cli_xmp_onchatstate","chat state",from+" "+state);

  // Forward changed Chat State
  xows_cli_fw_onchatstate(peer, state);
}

/**
 *  Composing chatsate setTimeout handle/reference
 */
let xows_cli_chatstate_hto = null;

/**
 * Set chat state to and send the proper notification to peer
 *
 * @param   {object}    peer      Peer object to send notification
 * @param   {object}    chat      New chat state to set
 */
function xows_cli_chatstate_define(peer, chat)
{
  // Store message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  if(chat > XOWS_CHAT_PAUS) { //< composing

    if(xows_cli_chatstate_hto) {
      // Pending timeout running mean "composing" state already send
      clearTimeout(xows_cli_chatstate_hto);
    } else {
      // Send new "composing" state
      xows_xmp_message_chatstate_send(peer.lock, type, chat);
    }

    // Create/reset a timeout to end typing state after delay
    xows_cli_chatstate_hto = setTimeout(xows_cli_chatstate_define,4000,peer,XOWS_CHAT_PAUS);

  } else {

    // Reset pending timeout
    clearTimeout(xows_cli_chatstate_hto);
    xows_cli_chatstate_hto = null;

    // Send new chat state
    xows_xmp_message_chatstate_send(peer.lock, type, chat);
  }
}
/* -------------------------------------------------------------------
 * Client API - Message semantis - Message Retraction
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Chatstat notification
 */
let xows_cli_fw_onretract = function() {};

/**
 * Handles an incoming chat state notification.
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    rtid      Retracted message ID
 */
function xows_cli_xmp_onretract(id, from, type, rtid)
{
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    peer = xows_cli_cont_get(from);
  } else {
    peer = xows_cli_room_get(from);
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onretract","unknown/unsubscribed JID",from);
    return;
  }

  // Forward retracted message
  xows_cli_fw_onretract(peer, rtid);
}

/**
 * Retract previous Message
 *
 * @param   {object}    peer      Related Peer object
 * @param   {string}    rtid      Message ID to retract
 */
function xows_cli_message_retract(peer, rtid)
{
  // Store message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  // Send retract
  xows_xmp_message_retract_send(peer.lock, type, rtid);
}

/* -------------------------------------------------------------------
 *
 * Client API - User profile management routines
 *
 * -------------------------------------------------------------------*/
/**
 * Change user name (nickname) and avatar picture
 *
 * @param   {string}    name      Prefered nickname
 * @param   {string}    url       Image Data-URL to set as avatar
 * @param   {boolean}   open      Publish data with Open Access
 */
function xows_cli_change_profile(name, url, open)
{
  // Update user settings
  if(name) {
    xows_cli_self.name = name;
    xows_log(2,"cli_change_profile","change nickname",name);
  }

  // Update user settings
  if(url) {
    xows_log(2,"cli_change_profile","change avatar");
    // Create new avatar from supplied image
    xows_cli_self.avat = xows_cach_avat_save(url);
  } else {
    xows_log(2,"cli_change_profile","set default avatar");
    // Generate or retreive pseudo-random avatar
    xows_cli_self.avat = xows_cli_avat_temp(xows_cli_self.bare);
  }

  // Update vcard with new avatar
  xows_cli_vcard_publish(open);

  // Publish user nickname
  xows_cli_nick_publish();

  // Publish new avatar
  xows_cli_avat_data_publish(open);

  // For legacy vcard-temps, send presence with new avatar hash
  xows_cli_presence_update();

  // Forward changes
  xows_cli_fw_onselfpush(xows_cli_self);
}

/* -------------------------------------------------------------------
 *
 * Client API - Self presence (show and status) routines
 *
 * -------------------------------------------------------------------*/
/**
 * Send and update presence to proper destination and modify internal
 * client data to reflect new user presence
 */
function xows_cli_presence_update()
{
  // Define values as required
  let type, show, stat, avat;

  if(xows_cli_self.show > 0) {
    show = xows_cli_self.show;
    stat = xows_cli_self.stat;
    avat = xows_cli_self.avat;
  } else {
    type = "unavailable";
  }

  xows_log(2,"cli_presence_update","send updated presence");

  // Simple presence to server
  xows_xmp_presence_send(null, type, show, stat, avat);

  // Presence to all joined rooms
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].join) {
      xows_xmp_presence_send(xows_cli_room[i].join, type, show, stat, avat);
      // Unavailable client exited the room
      if(type) xows_cli_room[i].join = null;
    }
  }

  // Forward user status upate
  xows_cli_fw_onselfpush(xows_cli_self);
}

/**
 * Presence level as chosen by user
 */
let xows_cli_show_saved = 0;

/**
 * Set the client current presence show level
 *
 * @param   {number}    level     Numerical show level to set (0 to 5)
 */
function xows_cli_show_select(level)
{
  // Change the show level and send to server
  xows_cli_self.show = xows_cli_show_saved = level;

  // Send presence with updated values
  xows_cli_presence_update();
}

/**
 * Set the client current presence status
 *
 * @param   {string}    stat      Status string to set
 */
function xows_cli_status_define(stat)
{
  // Do not send useless presence
  if(xows_cli_self.stat === stat)
    return;

  // Change the status and send to server
  xows_cli_self.stat = stat;

  // Save current status to local storage
  xows_cach_peer_save(xows_cli_self.bare, null, null, stat, null);

  // Send updated presence only if there will be no wakeup
  xows_cli_presence_update();
}
/* -------------------------------------------------------------------
 *
 * Client API - Self activity and auto-Away routines
 *
 * -------------------------------------------------------------------*/
/**
 * Activity sleep setTimeout handle/reference
 */
let xows_cli_activity_hto = null;

/**
 * Decrease the client presence level to away or xa
 */
function xows_cli_activity_sleep()
{
  if(xows_cli_activity_hto)
    clearTimeout(xows_cli_activity_hto);

  if(xows_cli_self.show > XOWS_SHOW_XA) {
    xows_cli_activity_hto = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min

    // Decrease the show level
    xows_cli_self.show--;

    // Send presence with updated values
    xows_cli_presence_update();
  }
}

/**
 * Set presence back to the user chosen one if it is greater than
 * the current "away" value and reset the timer for auto-away.
 */
function xows_cli_activity_wakeup()
{
  if(xows_cli_activity_hto)
    clearTimeout(xows_cli_activity_hto);

  xows_cli_activity_hto = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min

  if(xows_cli_self.show < xows_cli_show_saved) {

    // Reset all to last chosen level
    xows_cli_self.show = xows_cli_show_saved;

    // Send presence with updated values
    xows_cli_presence_update();
  }
}

/**
 * Stops presence activity and auto-away process
 */
function xows_cli_activity_stop()
{
  if(xows_cli_activity_hto)
    clearTimeout(xows_cli_activity_hto);

  xows_cli_self.show = xows_cli_show_saved = 0;
}

/* -------------------------------------------------------------------
 *
 * Client API - PubSub routines
 *
 * -------------------------------------------------------------------*/
/**
 * Handles an incoming PubSub event
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    node      PubSub node
 * @param   {object[]}  item      Received items
 */
function xows_cli_xmp_onpubsub(from, node, item)
{
  // Checks for vcard notification
  if(node === XOWS_NS_VCARD4) {
    if(item.length) {
      xows_log(2,"cli_xmp_onpubsub","received vCard notification",from);
      // Send vcard to handling function
      xows_cli_vcard_parse(from, item[0].data);
    }
  }

  // Checks for avatar notification
  if(node === XOWS_NS_AVATAR_META) {
    if(item.length) {
      xows_log(2,"cli_xmp_onpubsub","received Avatar notification",from);
      // Send vcard to handling function
      xows_cli_avat_meta_parse(from, item[0].data);
    }
  }

  // Checks for nickname notification
  if(node === XOWS_NS_NICK) {
    if(item.length) {
      xows_log(2,"cli_xmp_onpubsub","received Nickname notification",from);
      // Send vcard to handling function
      xows_cli_nick_parse(from, item[0].data);
    }
  }

  // Checks for bookmarks notification
  if(node === XOWS_NS_BOOKMARKS) {
    if(item.length) {
      xows_log(2,"cli_xmp_onpubsub","received Bookmarks notification",from);
      // Send vcard to handling function
      xows_cli_book_parse(from, item);
    }
  }
}
/* -------------------------------------------------------------------
 * Client API - PubSub - Vcard routines and interface
 * -------------------------------------------------------------------*/
/**
 * Publish user own vcard-temp to store formated name, nickname and
 * custom status as note
 *
 * @param   {boolean}   open      Publish data with Open Access
 */
function xows_cli_vcard_publish(open)
{
  // Get avatar data-URL
  const avat_data = xows_cach_avat_get(xows_cli_self.avat);

  // create new local copy of vcard if not exists
  if(!xows_cli_self.vcrd) xows_cli_self.vcrd = xows_xml_node("vcard");

  const has_vcard4 = xows_cli_entity_has(xows_cli_self.bare, XOWS_NS_VCARD4);

  const vcard = xows_cli_self.vcrd;

  // Check if account supports Vcard4 or fallback to vcard-temp
  if(has_vcard4 && !xows_options.legacy_vcard) {
    // XEP-0292 vCard4 edition
    xows_xml_edit(vcard,   "nickname", xows_xml_node("text",null,xows_cli_self.name));
    xows_xml_edit(vcard,   "note",     xows_xml_node("text",null,xows_cli_self.stat));
    if(avat_data)
      xows_xml_edit(vcard, "photo",    xows_xml_node("uri", null,avat_data));
  } else {
    // XEP-0054 vcard-temp edition
    xows_xml_edit(vcard,  "NICKNAME", xows_cli_self.name);
    xows_xml_edit(vcard,  "DESC",     xows_cli_self.stat);
    if(avat_data) {
      const bin_type = xows_url_to_type(avat_data);
      const bin_data = xows_url_to_data(avat_data);
      xows_xml_edit(vcard,"PHOTO",[ xows_xml_node("TYPE",  null,bin_type),
                                    xows_xml_node("BINVAL",null,bin_data)]);
    }
  }

  xows_log(2,"cli_vcard_publish","publish own vCard");

  // Clone modified vcard children to vcard data array
  const nodes = [];
  for(let i = 0, n = vcard.childNodes.length; i < n; ++i)
    nodes.push(vcard.childNodes[i].cloneNode(true));

  // Send query
  if(has_vcard4 && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_publish(nodes, open ? "open" : "presence");
  } else {
    xows_xmp_vcardt_set_query(nodes);
  }
}

/**
 * Function to handle parsed result of vcard query
 *
 * @param   {string}    from      Vcard Contact JID or null
 * @param   {object}    vcard     Vcard content
 */
function xows_cli_vcard_parse(from, vcard)
{
  let nick, note, phot;

  xows_log(2,"cli_vcard_handle","parse recevied vCard",from);

  if(vcard) {

    let node;

    // Store received vcard to local cache
    xows_cli_self.vcrd = vcard;

    // parse either legacy vcard-temp or vCard4 depending options
    if(xows_cli_entity_has(xows_cli_self.bare, XOWS_NS_VCARD4) && !xows_options.legacy_vcard) {
      // XEP-0292 vCard4 parsing
      if((node = vcard.querySelector("nickname")))
        nick = xows_xml_innertext(node.firstChild); //< <nickname><text>#text
      if((node = vcard.querySelector("note")))
        note = xows_xml_innertext(node.firstChild); //< <note><text>#text
      if((node = vcard.querySelector("photo")))
        phot = xows_xml_innertext(node.firstChild); //< <photo><uri>#text
    } else {
      // XEP-0054 vcard-temp parsing
      if((node = vcard.querySelector("NICKNAME")))
        nick = xows_xml_innertext(node);
      // first, try <NOTE> then <DESC> which is the legacy mapping
      if((node = vcard.querySelector("NOTE"))) {
        note = xows_xml_innertext(node);
      } else if((node = vcard.querySelector("DESC"))) {
        note = xows_xml_innertext(node);
      }
      if((node = vcard.querySelector("PHOTO"))) {
        const type = xows_xml_innertext(node.querySelector("TYPE"));
        const data = xows_xml_innertext(node.querySelector("BINVAL"));
        // create proper data-url string
        phot = "data:"+type+";base64,"+data;
      }
    }

    if(nick && !nick.length) nick = null;
    if(note && !note.length) note = null;
    if(phot && !phot.length) phot = null;
  }

  const avat = (phot) ? xows_cach_avat_save(phot) : null;

  // Update the proper Contact, Occupant, or own profile
  xows_cli_peer_update(from, nick, avat, note);
}

/**
 * Query Contact or Own vcard data
 *
 * @param   {string}    jid       Destination JID to query vcard
 */
function xows_cli_vcard_query(jid)
{
  xows_log(2,"cli_vcard_query","query vCard for",jid);

  // parse either legacy vcard-temp or vCard4 depending options
  if(xows_cli_entity_has(xows_cli_self.bare, XOWS_NS_VCARD4) && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_get_query(jid, xows_cli_vcard_parse);
  } else {
    xows_xmp_vcardt_get_query(jid, xows_cli_vcard_parse);
  }
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Nickname routines and interface
 * -------------------------------------------------------------------*/
/**
 * Handle result or notification of XEP-0172 User Nickname
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {string}    nick      Received <nick> child
 */
function xows_cli_nick_parse(from, nick)
{
  xows_log(2,"cli_nick_parse","parse received Nickname",from);

  // Update the proper Contact, Occupant, or own profile
  xows_cli_peer_update(from, xows_xml_innertext(nick), null, null);
}

/**
 * Query for XEP-0172 User Nickname
 *
 * @param   {string}    to        JID to query Nickname
 */
function xows_cli_nick_query(to)
{
  xows_log(2,"cli_nick_query","query nickname",to);
  xows_xmp_nick_get_query(to, xows_cli_nick_parse);
}

/**
 * Publish new XEP-0172 User Nickname
 */
function xows_cli_nick_publish()
{
  xows_log(2,"cli_nick_publish","publish own Nickname",xows_cli_self.name);
  xows_xmp_nick_publish(xows_cli_self.name);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Avatar routines and interface
 * -------------------------------------------------------------------*/
/**
 * Default size for generated avatars
 */
const XOWS_AVAT_SIZE  = 48;

/**
 * Stores received XEP-0084 avatar metadata
 */
const xows_cli_avat_parse_stk = new Map();

/**
 * Handle received XEP-0084 avatar metadata notification
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {object}    metadata  Received metadata
 */
function xows_cli_avat_meta_parse(from, metadata)
{
  if(metadata) {

    // Get the <info> child within <metadata>
    const info = metadata.querySelector("info");

    if(info) {
      // Get avatar data hash
      const id = info.getAttribute("id");

      // Store image properties to temporary stack
      xows_cli_avat_parse_stk.set(id, { "type"   :info.getAttribute("type"),
                                        "width"  :info.getAttribute("width"),
                                        "height" :info.getAttribute("height"),
                                        "bytes"  :info.getAttribute("bytes")});

      // Check whether we need to donwload data
      if(!xows_cach_avat_has(id)) {
        xows_xmp_avat_data_get_query(from, id, xows_cli_avat_data_parse);
      } else {
        // parse with null data to update Own/Contact/Occupant with cached data
        xows_cli_avat_data_parse(from, id, null);
      }
    }
  }
}

/**
 * Function to handle parsed result of avatar data query.
 *
 * @param   {string}    from      Avatar Contact JID.
 * @param   {object}    id        Avtar ID (data SHA-1 hash, theoretically...)
 * @param   {object}   [data]     Avtar data or null to get cached
 */
function xows_cli_avat_data_parse(from, id, data)
{
  let hash = null;

  // We may receive metadata for already cached data, in this case
  // we only process Own/Contact/Occupant avatar update
  if(data) {

    xows_log(2,"cli_avat_data_handle","handle received Avatar-Data",id);

    // Get stored (we hope so) received data type for this hash
    if(!xows_cli_avat_parse_stk.has(id)) {
      return;
    }

    // for now we only need type
    const type = xows_cli_avat_parse_stk.get(id).type;

    // Compose data-URL and add data to cache
    hash = xows_cach_avat_save("data:" + type + ";base64," + data, id);

    // we can delete saved meta data from temp queue
    xows_cli_avat_parse_stk.delete(id);

  } else {

    xows_log(2,"cli_avat_data_handle","handle cached Avatar-Data",id);
    // Already cached avatar data, we only get id as hash
    hash = id;
  }

  // Update the proper Contact, Occupant, or own profile
  xows_cli_peer_update(from, null, hash, null);
}

/**
 * Query for XEP-0084 avatar metadata
 *
 * @param   {string}    to        JID to query avatar metadata
 */
function xows_cli_avat_meta_query(to)
{
  xows_log(2,"cli_avat_meta_query","query Avatar-Metadata",to);
  xows_xmp_avat_meta_get_query(to, xows_cli_avat_meta_parse);
}

/**
 * Stores parameters for XEP-0084 avatar publication process
 */
let xows_cli_avat_publish_tmp = null;

/**
 * Publish new XEP-0084 avatar data then automatically send metadata
 * if data publication succeed
 *
 * This function take avatar data from the one currently cached and
 * used by client own account.
 *
 * @param   {boolean}   open      Publish data with Open Access
 */
function xows_cli_avat_data_publish(open)
{
  const datauri = xows_cach_avat_get(xows_cli_self.avat);
  if(datauri) {
    const b64 = xows_url_to_data(datauri);
    const type = xows_url_to_type(datauri);
    const bin = atob(b64);
    const hash = xows_bytes_to_hex(xows_hash_sha1(bin));
    // Store metadata to be published after data publication
    xows_cli_avat_publish_tmp = {"open":open,"hash":hash,"type":type,"bytes":bin.length};
    xows_log(2,"cli_avat_data_publish","publish new Avatar-Data",hash);
    // Publish data, the onparse function is set to send metadata
    xows_xmp_avat_data_publish(hash, b64, open ? "open" : "presence",
                                xows_cli_avat_meta_publish);
  }
}

/**
 * Handle result of XEP-0084 avatar data publication to publish updated
 * metadata
 *
 * This function is used as callback and should not be called on hitself.
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {string}    type      Query result type
 */
function xows_cli_avat_meta_publish(from = null, type = "result")
{
  // If data publish succeed, follow by sending meta-data
  if(type === "result") {
    xows_log(2,"cli_avat_meta_publish","publish updated Avatar-Metadata");
    // Verify we have data hash
    if(xows_cli_avat_publish_tmp) {
      const open = xows_cli_avat_publish_tmp.open;
      const hash = xows_cli_avat_publish_tmp.hash;
      const type = xows_cli_avat_publish_tmp.type;
      const bytes = xows_cli_avat_publish_tmp.bytes;
      const size = XOWS_AVAT_SIZE;
      xows_xmp_avat_meta_publish(hash, type, bytes, size, size,
                                  open ? "open" : "presence", null);
    }
  }

  // Reset temporary data
  xows_cli_avat_publish_tmp = null;
}

/**
 * Generate and/or retreive pseudo-random avatar data based on
 * current logged in username, assuming client is connected
 *
 * @param    {string}   from      Contact or Occupant JID to generate avatar data
 *
 * @return   {string}   Generated avatar data hash.
 */
function xows_cli_avat_temp(from)
{
  let seed;

  // checks whether address contain '/', meaning this is room Occupant
  if(from.includes('/')) {
    // we transform in lowercase in case nickname is simply the
    // username with caps, this maximise random color consistency
    seed = xows_jid_resc(from).toLowerCase();
  } else {
    seed = xows_jid_node(from);
  }

  // we generate new avatar image
  const data = xows_gen_avatar(XOWS_AVAT_SIZE,null,seed);

  // save data in live DB but not in Local Storage
  return xows_cach_avat_save(data, null, true);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Boomark routines and interface
 * -------------------------------------------------------------------*/
/**
 * Handle notification of XEP-0402 Bookmarks
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {object[]}  item      List of <item> nodes
 */
function xows_cli_book_parse(from, item)
{
  let room, bare, name, auto, nick;

  for(let i = 0, n = item.length; i < n; ++i) {
    bare = item[i].id;

    name = item[i].data.getAttribute("name");
    auto = item[i].data.getAttribute("autojoin");
    const temp = item[i].data.querySelector("nick");
    if(temp) nick = xows_xml_innertext(temp);

    // Check whether Room already exists
    room = xows_cli_room_get(bare);
    if(room) {

      // Checks whether this is a public room, in this case we ignore
      // the bookmark, Room stay in 'PUBLIC ROOMS' section.
      if(room.publ) return;

    } else {

      // Create new Room object to reflect Bookmark
      room = xows_cli_room_new(bare, name, "", false, false);
    }

    // This room is bookmarked
    room.book = true;

    // Auto-join room
    if(auto) xows_cli_muc_join(room);

    // Query info for Room
    xows_cli_discoinfo_query(room.bare);
  }
}

/**
 * Publish new XEP-0402 Bookmark
 *
 * @param   {object}    room      Room object to add bookmark
 * @param   {string}   [name]     Optional alternative bookmark name
 * @param   {string}   [auto]     Optional set auto-join to bookmark
 * @param   {string}   [nick]     Optional alternative preferend nickname
 */
function xows_cli_book_publish(room, auto, name, nick)
{
  const mrk_name = name ? name : room.name;
  const mrk_nick = nick ? nick : xows_jid_resc(room.join);

  xows_log(2,"cli_book_publish","add bookmark",mrk_name+" ("+room.bare+")");

  xows_xmp_bookmark_publish(room.bare, mrk_name, auto, mrk_nick);
}

/* -------------------------------------------------------------------
 *
 * Client API - MAM routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Maximum result to get from one MAM query (please set even number)
 */
let xows_cli_mam_max = 32;

/**
 * Map to store per-peer MAM history fetch parameters
 */
const xows_cli_mam_param = new Map();

/**
 * Callback function to collect MAM archived messages from a request in
 * the context of MAM history fetch.
 *
 * @param   {string}    from      Archives sender JID, may be Room or Null
 * @param   {string}    bare      With JID bare used as filter or Null
 * @param   {object[]}  mesg      Received archived messages
 * @param   {number}    count     Total result count
 * @param   {boolean}   complete  Current result set is complete
 */
function xows_cli_mam_collect(from, bare, mesg, count, complete)
{
  // Retreive the contact related to this query
  const peer = xows_cli_peer_get(from ? from : bare);
  if(!peer) {
    xows_log(1,"cli_mam_parse","unknown/unsubscribed JID",from ? from : bare);
    return;
  }

  const result = [];

  // re-parse result to add peer, sender and other various parameters
  let i = mesg.length;

  if(peer.type === XOWS_PEER_CONT) {

    //while(i--) {
    for(let i = 0; i < mesg.length; ++i) {
      const sndr = xows_cli_isself(mesg[i].from) ? xows_cli_self : peer;
      result.push({"sndr":sndr, "mesg":mesg[i]});
    }

  } else { //<  === XOWS_PEER_ROOM

    for(let i = 0; i < mesg.length; ++i) {
      const from = mesg[i].from;
      const sndr = (from === peer.join) ? xows_cli_self : xows_cli_occu_any(peer, from);
      result.push({"sndr":sndr, "mesg":mesg[i]});
    }
  }

  // Get history pull params
  const param = xows_cli_mam_param.get(peer);

  // Depending query  we add result at front or back to pool
  if(param.start) {
    param.pool = param.pool.concat(result);
  } else {
    param.pool = result.concat(param.pool);
  }

  // Shortcut...
  const pool = param.pool;

  // Comput count of visible messages excluding replacements
  let bodies = 0;
  i = pool.length;
  while(i--) if(pool[i].mesg.body && !pool[i].mesg.rpid) bodies++;

  if(!complete) {

    // Send another query until we get enough message
    if(bodies < param.count) {
      // Shift time to get more message after/before the last/first
      // recevied with 25ms time shift to prevent doubling
      if(param.start) {
        param.start = pool[pool.length-1].mesg.time + 1;
      } else {
        param.end = pool[0].mesg.time - 1;
      }

      // Change the 'max' value to avoid querying too much, but
      // more than needed since received messages can be receipts
      const need = (param.count - bodies) * 2;
      if(need < xows_cli_mam_max) param.max = need;

      // Send new request after little delay
      setTimeout(xows_cli_mam_request, 100, peer);
      return;
    }
  }

  xows_log(2,"cli_mam_parse",bodies+" gathered messages for",peer.bare);

  if(xows_isfunc(param.onresult))
    param.onresult(peer, pool, bodies, complete);

  // Delete history pull params
  xows_cli_mam_param.delete(peer);
}

/**
 * Send MAM archive query for the specified history fetch, the
 * fetch must had been initialized by xows_cli_mam_fetch()
 *
 * This function is for private usage only.
 *
 * @param   {object}    peer      Peer to get archive
 */
function xows_cli_mam_request(peer)
{
  if(!xows_cli_mam_param.has(peer))
    return;

  // Get history pull parameters
  const param = xows_cli_mam_param.get(peer);

  // Send new query to XMPP interface
  if(peer.type === XOWS_PEER_CONT) {
    xows_xmp_mam_query(null, param.max, peer.bare, param.start, param.end, null, xows_cli_mam_collect);
  } else {
    xows_xmp_mam_query(peer.bare, param.max, null, param.start, param.end, null, xows_cli_mam_collect);
  }
}

/**
 * Fetch archived messages for the specified peer
 *
 * @param   {object}    peer      Peer to get archive
 * @param   {number}    count     Desired minimum count of message to gather
 * @param   {number}    start     Archive start time parameter
 * @param   {number}    end       Archive end time parameter
 * @param   {object}    onresult  Callback to handle received result
 */
function xows_cli_mam_fetch(peer, count, start, end, onresult)
{
  if(xows_cli_mam_param.has(peer))
    return;

  xows_log(2,"cli_pull_history","pull history for",peer.bare);

  // Choose proper "max" value
  const max = (count > xows_cli_mam_max) ? xows_cli_mam_max : count;

  // Initialize history pull parameters
  xows_cli_mam_param.set(peer,{"peer":peer,"count":count,"max":max,"start":start,"end":end,"onresult":onresult,"pool":new Array()});

  // Send first request
  xows_cli_mam_request(peer);
}

/* -------------------------------------------------------------------
 *
 * Client API - HTTP Files Upload routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Object used to store Current Http Upload query related data
 */
const xows_cli_upld_param = new Map();

/**
 * Abort the current progressing file upload if any
 *
 * @param   {string}     name     Progress event object
 */
function xows_cli_upld_abort(name)
{
  xows_log(2,"cli_upld_abort","abort requested",name);

  // Retrieve initial query parameters
  const param = xows_cli_upld_param.get(name);
  if(param.xhr)
    param.xhr.abort();

  xows_cli_upld_param.delete(name);
}

/**
 * Http Upload query XMLHttpRequest.upload "progress" callback function
 *
 * @param   {object}    event     Progress event object
 */
function xows_cli_upld_put_progress(event)
{
  const name = event.target._name;
  // Retrieve initial query parameters
  const param = xows_cli_upld_param.get(name);
  if(xows_isfunc(param.onprogress))
    param.onprogress(name, (event.loaded / event.total) * 100);
}

/**
 * Http Upload query XMLHttpRequest.upload "error" callback function
 *
 * @param   {object}    event     Error event object
 */
function xows_cli_upld_put_error(event)
{
  const name = event.target._name;

  const mesg = "HTTP PUT failed";
  xows_log(1,"cli_upld_put_error",mesg,name);

  // Retrieve initial query parameters
  const param = xows_cli_upld_param.get(name);
  if(xows_isfunc(param.onerror))
    param.onerror(name, mesg);

  xows_cli_upld_param.delete(name);
}

/**
 * Http Upload query XMLHttpRequest.upload "abort" callback function
 *
 * @param   {object}    event     Error event object
 */
function xows_cli_upld_put_abort(event)
{
  const name = event.target._name;

  xows_log(1,"cli_upld_put_abort","HTTP PUT aborted by user",name);

  // Retrieve initial query parameters
  const param = xows_cli_upld_param.get(name);
  if(xows_isfunc(param.onabort))
    param.onabort(name);

  xows_cli_upld_param.delete(name);
}

/**
 * Http Upload query XMLHttpRequest onreadystatechange callback.
 *
 * @param   {object}    xhr       XMLHttpRequest instance
 */
function xows_cli_upld_xhr_state(xhr)
{
  // Check for ready state and status code
  if(xhr.readyState === 4) {

    // check for server error
    if(xhr.status !== 201) {
      xows_log(1,"cli_upld_xhr_state","server responded",xhr.status);
      return;
    }

    const name = xhr.upload._name;
    // Retrieve initial query parameters
    const param = xows_cli_upld_param.get(name);

    // Forward file download URL with some delay to let the HTTP server
    // to refresh and be able to provide correct GET access to file
    if(xows_isfunc(param.onload))
      setTimeout(param.onload, 500, name, param.url);

    xows_cli_upld_param.delete(name);
  }
}

/**
 * Function to handle an Http Upload query result, then start upload
 * if slot was given
 *
 * @param   {string}    name      Initial query file name
 * @param   {string}    puturl    URL for HTTP PUT request or null if denied
 * @param   {object[]}  headers   Additionnal <header> elements list for PUT request
 * @param   {string}    geturl    URL to donwload file once uploaded
 * @param   {string}    error     Optional error message if denied
 */
function xows_cli_upld_result(name, puturl, headers, geturl, error)
{
  // Retrieve initial query parameters
  const param = xows_cli_upld_param.get(name);

  // Check if we got an error
  if(!puturl) {
    const mesg = "upload denied: "+error;
    xows_log(1,"cli_upld_result",mesg,name);
    if(xows_isfunc(param.onerror))
      param.onerror(name, mesg);
    xows_cli_upld_param.delete(name);
    return;
  }

  // Store the URL to download the file once uploaded
  param.url = geturl;

  // Open new HTTP request for PUT form-data
  const xhr = new XMLHttpRequest();
  param.xhr = xhr;

  // Create PUT request with proper headers
  xhr.open("PUT", puturl, true);

  xhr.setRequestHeader("Content-Type","main_menucation/octet-stream");
  for(let i = 0; i < headers.length; ++i)
    xhr.setRequestHeader(headers[i].getAttribute("name"),headers[i].innerHTML);

  xows_log(2,"cli_upld_result","sending HTTP PUT request",puturl);

  xhr.upload._name = name; //< Custom parameter

  // Set proper callbacks to Xhr object
  xhr.upload.onprogress = xows_cli_upld_put_progress;
  xhr.upload.onerror = xows_cli_upld_put_error;
  xhr.upload.onabort = xows_cli_upld_put_abort;

  xhr.onreadystatechange = function(){xows_cli_upld_xhr_state(this);};
  //xhr.upload.onload = xows_cli_upld_put_load; //< this is not reliable

  // Here we go...
  xhr.send(param.file);
}

/**
 * Function to query an Http upload slot
 *
 * @param   {object}    file        File object to upload
 * @param   {object}    onerror     On upload error callback
 * @param   {object}    onload      On upload load callback
 * @param   {object}    onprogress  On upload progress callback
 * @param   {object}    onabort     On upload aborted callback
 */
function xows_cli_upld_query(file, onerror, onload, onprogress, onabort)
{
  if(xows_cli_upld_param.has(file.name))
    return;

  if(!xows_cli_services.has(XOWS_NS_HTTPUPLOAD)) {
    const mesg = "HTTP File Upload (XEP-0363) service is unavailable";
    xows_log(1,"cli_upld_query",mesg);
    xows_cli_fw_onerror(XOWS_SIG_ERR, mesg);
    return;
  }

  xows_log(2,"cli_upld_query","HTTP-Upload query",file.name);

  // Create a new param object to store query data
  xows_cli_upld_param.set(file.name,{ "file":file,
                                      "onerror":onerror,
                                      "onload":onload,
                                      "onprogress":onprogress,
                                      "onabort":onabort});

  // Query an upload slot to XMPP service
  xows_xmp_upld_query(xows_cli_services.get(XOWS_NS_HTTPUPLOAD)[0],
                      file.name, file.size, file.type, xows_cli_upld_result);
}

/* -------------------------------------------------------------------
 *
 * Client API - MUC routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Room added or refreshed
 */
let xows_cli_fw_onroompush = function() {};

/**
 * Callback function for Room removed
 */
let xows_cli_fw_onroomrem = function() {};

/**
 * Callback function for Room Occupant added or refreshed
 */
let xows_cli_fw_onoccupush = function() {};

/**
 * Callback function for Room Occupant removed
 */
let xows_cli_fw_onoccurem = function() {};

/**
 * Callback function for received Room Subject
 */
let xows_cli_fw_onsubject = function() {};

/**
 * Query disco#items to MUC available services (if any) to gather list
 * of public Room (MUC Service's Items).
 *
 * The result of this query will be parsed by the common discovery
 * routines that will then call the xows_cli_muc_discoinfo_parse as required.
 *
 * See also : xows_cli_muc_discoinfo_parse, xows_cli_discoinfo_parse
 */
function xows_cli_muc_discoitems_query()
{
  // Verify the server provide MUC service
  if(!xows_cli_services.has(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_discoitems_query","aborted","no MUC service available");
    return;
  }

  // Get array of available MUC services
  const muc = xows_cli_services.get(XOWS_NS_MUC);

  // Send Item discovery to all available MUC services
  for(let i = 0, n = muc.length; i < n; ++i)
    xows_xmp_disco_items_query(muc[i], xows_cli_discoitems_parse);
}

/**
 * Parse disco#info result as a MUC Room and store Peer
 * object in Room list.
 *
 * This function is called internally by the common discovery routines when
 * encountering MUC Service's Item (Room) to parse.
 *
 * See also : xows_cli_muc_discoitems_query, xows_cli_discoinfo_parse
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object[]}  form      Array of parsed X-Data fields
 */
function xows_cli_muc_discoinfo_parse(from, iden, feat, form)
{
  let i, n, name, subj = "", desc = "", prot = false, publ = false;

  // Retrieve or extract the name for this room
  if(iden.length) {
    name = iden[0].name;
  } else {
    name = from.split("@")[0];
  }
  // Check room features
  for(i = 0, n = feat.length; i < n; ++i) {
    if(feat[i] === "muc_passwordprotected") prot = true;
    if(feat[i] === "muc_public") publ = true;
    if(feat[i] === "muc_hidden") publ = false;
  }
  // Get available informations
  if(form) {
    for(i = 0, n = form.length; i < n; ++i) {
      if(form[i]["var"] == "muc#roominfo_description")  desc = form[i].value;
      if(form[i]["var"] == "muc#roominfo_subject") subj = form[i].value;
    }
  }
  // Check whether this room already exists in local list
  let room = xows_cli_room_get(from);
  // If romm already exists, we simply refresh infos, otherwise we
  // create and add a new room in list
  if(room) {
    room.name = name;
    room.desc = desc;
    room.prot = prot;
    room.publ = publ;
    xows_log(2,"cli_muc_room_parse","refresh Room",name+" ("+from+") :\""+desc+"\"");
  } else {
    // Create new room in local list
    room = xows_cli_room_new(from, name, desc, prot, publ);
    xows_log(2,"cli_muc_room_parse","adding Room",name+" ("+from+") :\""+desc+"\"");
  }

  // Forward added/updated Room
  xows_cli_fw_onroompush(room);
}

/**
 * Callback for user Room get config query result
 */
const xows_cli_muc_roomcfg_param = new Map();

/**
 * Parse result for MUC room configuration form query
 *
 * @param   {string}    from      Result sender JID
 * @param   {object[]}  form      Array of x fata form
 */
function xows_cli_muc_getcfg_result(from, form)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_get_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Retreive onresult callback
  const onresult = xows_cli_muc_roomcfg_param.get(room);

  // Forward Room Owner config form
  if(xows_isfunc(onresult))
    onresult(room, form);

  // Allow new query
  xows_cli_muc_roomcfg_param.delete(room);
}

/**
 * Query MUC Room config form (current config)
 *
 * @param   {string}    room      Room object to query conf
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_muc_getcfg_query(room, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_roomcfg_param.has(room))
    return;

  xows_cli_muc_roomcfg_param.set(room, onresult);  //< set the onresult function
  xows_xmp_muc_cfg_get_guery(room.bare, xows_cli_muc_getcfg_result);
}

/**
 * Function to proceed result of MUC room configuration form submition
 *
 * @param   {string}    from      Result sender JID
 * @param   {string}    type      Result type
 */
function xows_cli_muc_setcfg_result(from, type)
{
  if(type !== "result")
    return;

  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_set_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Update Room infos
  xows_cli_discoinfo_query(room.bare);

  // Retreive onresult callback
  const onresult = xows_cli_muc_roomcfg_param.get(room);

  // Forward submit result
  if(xows_isfunc(onresult))
    onresult(room, type);

  // Notice: room.init is set to false AFTER call to callback to
  // prevent double-cancel (that throw bad-request error) by GUI
  // during initial config procedure.

  // Room configured, no longer need init process.
  room.init = false;

  // Allow new query
  xows_cli_muc_roomcfg_param.delete(room);
}

/**
 * Cancel MUC room configuration form
 *
 * @param   {string}    room      Room object to query conf
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_muc_setcfg_cancel(room, onresult)
{
  xows_xmp_muc_cfg_set_cancel(room.bare, onresult);
}

/**
 * Submit MUC Room config form
 *
 * @param   {string}    room      Room object to query conf
 * @param   {object[]}  submit    Array of fulfilled x fata form to submit
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_muc_setcfg_query(room, form, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_roomcfg_param.has(room))
    return;

  xows_cli_muc_roomcfg_param.set(room, onresult); //< set the onresult function
  xows_xmp_muc_cfg_set_query(room.bare, form, xows_cli_muc_setcfg_result);
}

/**
 * Handle MUC Room registration request form submit
 *
 * @param   {object}    from      Send JID or adress
 * @param   {boolean}   registerd Boolean that indicate already registered
 * @param   {string}    user      Username string and/or request (not used)
 * @param   {string}    pass      password string and/or request (not used)
 * @param   {string}    mail      email string and/or request (not used)
 * @param   {object[]}  form      x:data form to be fulfilled
 */
function xows_cli_muc_register_result(from, registered, user, pass, mail, form)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_register_parse","unknown/unsubscribed Room",from);
    return;
  }
  // TODO: Maybe there is something to do here
  if(registered) {
    return;
  }
  if(form) {
    // Fulfill the form with proper informations
    for(let i = 0, n = form.length; i <n; ++i) {
      if(form[i]["var"] === "muc#register_roomnick") form[i].value = xows_cli_self.name;
    }
    // Send room register fields and values
    xows_xmp_regi_set_query(from, null, null, null, form, null);
  }
}

/**
 * Query for MUC Room registration request
 *
 * @param   {object}    room      Room object to join
 */
function xows_cli_muc_register_query(room)
{
  // Send request for Room register (will respond by xform)
  xows_xmp_regi_get_query(room.bare, xows_cli_muc_register_result);
}

/**
 * Join existing room or create new one
 *
 * If no room object is supplied the function try to join (ie. create)
 * the room using the supplied room name.
 *
 * @param   {object}    room      Room object to join, or null
 * @param   {string}    name      Optional room name to join or create
 * @param   {string}    nick      Optional nickname to join room
 * @param   {string}    pass      Optional password to join room (not implemented yet)
 */
function xows_cli_muc_join(room, name, nick, pass)
{
  // Verify the server provide MUC service
  if(!xows_cli_services.has(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_join","aborted","no MUC service available");
    return;
  }

  let bare;

  // Check if we got a room object
  if(room) {
    if(room.join) return; // already joined room
    bare = room.bare; //< get room JID
  } else {
    // compose room JID
    bare = name.toLowerCase()+"@"+xows_cli_services.get(XOWS_NS_MUC)[0];
  }

  xows_log(2,"cli_muc_join","request join",name+" ("+bare+")");

  // Compose destination using Room JID and our nickname
  const to = bare + "/" + (nick ? nick : xows_cli_self.name);

  // Send initial presence to Room to join
  xows_xmp_presence_send(to, null, xows_cli_self.show, xows_cli_self.stat, xows_cli_self.avat, true);
}

/**
 * Handles received occupant presence (<presence> stanza) status
 * from MUC room
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {number}   [show]     Optional show level if available
 * @param   {string}   [stat]     Optional status string if available
 * @param   {object}    muc       Occupant MUC additional infos
 * @param   {string}    photo     Occupant vcard photo hash
 */
function xows_cli_xmp_onoccupant(from, show, stat, muc, photo)
{
  // Get room object, if exists
  let room = xows_cli_room_get(from);
  if(!room) {
    // create new Room object, this should be a newly joined/created room
    const bare = xows_jid_bare(from);
    const name = xows_jid_node(bare);
    room = xows_cli_room_new(bare, name, "", false, false);
    xows_log(2,"cli_xmp_onoccupant","add unexisting Room",name+" ("+bare+")");
    xows_cli_fw_onroompush(room); //< Forward created Room
    xows_cli_discoinfo_query(room.bare); //< Query info for the newly created room
  }

  // Handle special case of room join and creation
  for(let i = 0, n = muc.code.length; i < n; ++i) {
    if(muc.code[i] === 110) { //< own presence in Room
      if(show > 0) {
        room.join = from; //< we joined the room
        // TODO: Try to register
        //xows_cli_muc_register_query(room);
      } else {
        room.join = null; //< we leaved the room
        xows_log(2,"cli_xmp_onoccupant","leaving Room",room.bare);
        // Forward removed Occupant
        xows_cli_fw_onoccurem(room, null); //< null occupant JID mean self
        return; //< return now
      }
      continue;
    }
    if(muc.code[i] === 201) { //< new Room need initial configuration
      room.init = true;
    }
    if(muc.code[i] === 210) { //< server changed our nickname
      //< TODO
    }
  }

  // Check wheter the occupant is to be removed
  if(show === 0) {
    // Remove occupant from room
    let i = room.occu.length;
    while(i--) {
      if(room.occu[i].jid === from) {
        // Remove occupant from list
        room.occu.splice(i,1);
        break;
      }
    }
    // Forward removed Occupant
    xows_cli_fw_onoccurem(room, from);
    return; //< return now
  }

  // Gather occupant data
  const nick = xows_jid_resc(from);
  const bare = muc.full ? xows_jid_bare(muc.full) : null; //< The real bare JID

  // Get occupant object if exists
  let occu = xows_cli_occu_get(room, from);
  if(occu) {
    // If occupant already exists in room we update data
    xows_log(2,"cli_xmp_onoccupant","refresh Occupant of "+room.bare, nick);
    occu.full = muc.full; //< The real JID, may be unavailable
    occu.bare = bare;
    occu.affi = muc.affi;
    occu.role = muc.role;
    occu.show = show;
    occu.stat = stat;
  } else {
    // Create new Room Occupant
    xows_log(2,"cli_xmp_onoccupant","adding Occupant to "+room.bare, nick);
    // Check for stored data in localStorage
    let cach = null;
    if(bare) cach = xows_cach_peer_get(bare);
    if(!cach) cach = xows_cach_peer_get(from);
    // Get cached avatar if available, or set default pseudo-random
    const avat = (cach && cach.avat) ? cach.avat : null;
    // Create new Occupant object
    occu = xows_cli_occu_new(room, from, muc.affi, muc.role, muc.full, avat, show, stat);
  }

  // Update self Role and Affiliation with Room
  if(occu.self) {
    room.affi = muc.affi;
    room.role = muc.role;
  }

  // Update avatar or query for vcard has required
  if(photo) { //< do we got photo hash ?
    if(xows_cach_avat_has(photo)) {
      occu.avat = photo;
    } else {
      xows_cli_vcard_query(from); //< Must update vcard
    }
  } else {
    // Try to reteive an avatar via
    if(!occu.avat) {
      xows_cli_avat_meta_query(from);
    }
  }

  // Cache Occupant as peer
  xows_cach_peer_save(from, occu.name, occu.avat, null, null);

  // Forward added or updated Room Occupant
  xows_cli_fw_onoccupush(room, occu, muc.code);
}

/**
 * Handles an incoming message subject
 *
 * @param   {string}  id        Message ID
 * @param   {string}  from      Sender JID
 * @param   {string}  subj      Subject content
 */
function xows_cli_xmp_onsubject(id, from, subj)
{
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_xmp_onsubject","unknown/unsubscribed JID",from);
    return;
  }

  room.subj = subj;

  // Forward received Room subject
  xows_cli_fw_onsubject(room, subj);
}

/**
 * Set subject for the specified room.
 *
 * @param   {string}    room      Recipient Room
 * @param   {string}    subj      Subject content
 */
function xows_cli_muc_set_subject(room, subj)
{
  xows_log(2,"cli_send_subject","send subject",room.bare+" \""+subj+"\"");

  // Send message with subject
  xows_xmp_muc_subject_send(room.bare, subj);
}

/* -------------------------------------------------------------------
 *
 * Client API - Multimedia Calls (Jingle) interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Media Call (WebRTC) error
 */
let xows_cli_fw_oncallerror = function() {};

/**
 * Callback function for Received Multimedia Call session initiate
 */
let xows_cli_fw_oncallinit = function() {};

/**
 * Callback function for Received Multimedia Call session accept
 */
let xows_cli_fw_oncallaccept = function() {};

/**
 * Callback function for Received Multimedia Call session terminate
 */
let xows_cli_fw_oncallend = function() {};

/**
 * Jingle session ID storage
 */
const xows_cli_jing_sid = new Map();

/**
 * Handles an incoming Jingle session signaling
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    id        XMPP Request id
 * @param   {string}    sid       Jingle session SID
 * @param   {string}    action    Jingle session Action
 * @param   {string}    mesg      SDP string or terminate Reason depending context
 */
function xows_cli_xmp_onjingle(from, id, sid, action, mesg)
{
  // Get peer
  const peer = xows_cli_peer_get(from);
  if(!peer) {
    xows_log(1,"cli_xmp_onjingle","refused "+action,"from unknow peer: "+from);
    // Send back iq error
    xows_xmp_iq_error_send(id, from, "cancel", "service-unavailable");
    return;
  }

  xows_log(2,"cli_xmp_onjingle",action,from);

  switch(action)
  {
  case "session-initiate":
    // Save Jingle session ID
    peer.call = from;
    xows_cli_jing_sid.set(peer, sid);
    // Forward signaling
    xows_cli_fw_oncallinit(peer, sid, mesg);
    break;
  case "session-accept":
    // Forward signaling
    xows_cli_fw_oncallaccept(peer, sid, mesg);
    break;
  case "session-terminate":
    // Delete Jingle session ID
    peer.call = null;
    xows_cli_jing_sid.delete(peer);
    // Forward signaling
    xows_cli_fw_oncallend(peer, sid, mesg);
    break;
  }
}

/**
 * Media Call XMPP/Jingle Query result callaback function
 *
 * @param   {number}      code    Error code
 * @param   {string}      mesg    Error message
 */
function xows_cli_jing_result(code, mesg)
{
  // We care only about error
  if(code <= XOWS_SIG_WRN) {
    xows_log(1,"cli_jing_result","jingle query error",mesg);
    // Forward error
    xows_cli_fw_oncallerror(XOWS_SIG_WRN, mesg);
  }
}

/**
 * Send Jingle session initiate from SDP description
 *
 * @param   {object}      peer    Contact Peer (not used yet)
 * @param   {string}      sdp     Session SDP description string
 */
function xows_cli_jing_initiate_sdp(peer, sdp)
{
  if(xows_cli_jing_sid.has(peer))
    return;

  // Select most suitable full JID
  peer.call = xows_cli_cont_best_jid(peer);

  // Send SDP offer via Jingle
  const sid = xows_xmp_jing_initiate_sdp(peer.call, sdp, xows_cli_jing_result);

  xows_cli_jing_sid.set(peer, sid);
}

/**
 * Send Jingle session accept from SDP description
 *
 * @param   {object}      peer    Contact Peer (not used yet)
 * @param   {string}      sdp     Session SDP description string
 */
function xows_cli_jing_accept_sdp(peer, sdp)
{
  if(!xows_cli_jing_sid.has(peer))
    return;

  const sid = xows_cli_jing_sid.get(peer);

  // Send SDP answer via Jingle
  xows_xmp_jing_accept_sdp(peer.call, sid, sdp, xows_cli_jing_result);
}

/**
 * Function to terminate current Call Session, either to hangup or
 * reject call
 *
 * @param   {object}      peer    Contact Peer (not used yet)
 * @param   {string}      reason  Session terminate reason string
 */
function xows_cli_jing_terminate(peer, reason)
{
  if(!xows_cli_jing_sid.has(peer))
    return;

  const sid = xows_cli_jing_sid.get(peer);

  // Send Jingle session terminate
  xows_xmp_jing_terminate(peer.call, sid, reason);

  peer.call = null;
  xows_cli_jing_sid.delete(peer);
}
