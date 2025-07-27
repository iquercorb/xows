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
 *                         Client API Module
 *
 * ------------------------------------------------------------------ */
/**
 * List of discovered entities
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
 * External Service Discovery (XEP-0215) or supplied 'cli_extern_services' option.
 */
const xows_cli_extsvc_db = [];

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
function xows_cli_extsvc_has(type)
{
  const types = Array.from(arguments);

  let svcs;

  svcs = xows_options.cli_extern_services;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      return true;
  }

  svcs = xows_cli_extsvc_db;
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
function xows_cli_extsvc_get(type)
{
  const types = Array.from(arguments);

  let svcs;

  const result = [];

  svcs = xows_options.cli_extern_services;
  for(let i = 0; i < svcs.length; ++i) {
    if(types.includes(svcs[i].type))
      result.push(svcs[i]);
  }

  svcs = xows_cli_extsvc_db;
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
const XOWS_PEER_NONE  = 0x0;
const XOWS_PEER_CONT  = 0x1;
const XOWS_PEER_ROOM  = 0x2;
const XOWS_PEER_OCCU  = 0x4;
const XOWS_PEER_ANY   = 0x7;

/* -------------------------------------------------------------------
 * Client API - Internal data - Self PEER Object
 * -------------------------------------------------------------------*/
/**
 * Self PEER object
 */
let xows_cli_self = {
  "jful": null,   //< Full JID (user@domain/ressource)
  "jbar": null,   //< bare JID (user@domain)
  "addr": null,   //< Common Peer Address (User Bare JID)
  "name": null,   //< Nickname / display name
  "avat": null,   //< Avatar picture Hash
  "show": 0,      //< Presence level
  "stat": null,   //< Presence Status string
  "noti": false,  //< Dummy flag to sill compatible with cache
  "load": 0       //< Loading Mask
};
// Set constant values
xows_def_readonly(xows_cli_self,"type",XOWS_PEER_CONT);
xows_def_readonly(xows_cli_self,"self",xows_cli_self); // Object is current client
Object.seal(xows_cli_self); //< prevet structure modification

/**
 * Check wether the given full JID correspond to current user bare JID
 *
 * @param   {string}    addr      JID address to check
 *
 * @return  {boolean}   True if address is own JID, false otherwise
 */
function xows_cli_isself_addr(addr)
{
  return addr.startsWith(xows_cli_self.addr);
}

/**
 * Test function for Array.find() to search Peer per Bare
 *
 * @param   {object}   peer       Array element
 * @param   {number}   index      Array index
 * @param   {number}   array      Array object
 *
 * @return  {boolean}  True if bare matches the "this" value
 */
function xows_cli_test_addr(peer, index, array)
{
  return (peer.addr == this);
}

/**
 * Test function for Array.find() to search Peer with valid "self"
 *
 * @param   {object}   peer       Array element
 * @param   {number}   index      Array index
 * @param   {number}   array      Array object
 *
 * @return  {boolean}  True if bare matches the "this" value
 */
function xows_cli_test_self(peer, index, array)
{
  return (peer.self != null);
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
 * @param   {string}    addr      JID bare (user@service.domain)
 * @param   {string}    name      Displayed name
 * @param   {string}    subs      Current subscription
 * @param   {string}    avat      Avatar hash string
 *
 * @return  {object}  New Contact Peer object.
 */
function xows_cli_cont_new(addr, name, subs, avat)
{
  const cont = {
    "name": name?name:addr, //< Display name
    "subs": subs,           //< Subscription mask
    "avat": avat,           //< Avatar hash string.
    "show": 0,              //< Displayed presence show level
    "stat": "",             //< Displayed presence status string
    "noti": true,           //< Notification Enabled/Mute
    "chat": 0,              //< Chatstate level
    "jlck": addr,           //< Current Locked resource (user@domain/ressource)
    "jrpc": addr,           //< RPC Locked address (user@domain/ressource)
    // Peer state and loading process
    "live": false,          //< Peer has an open chat window
    "load": 0               //< Loading Mask
  };

  // set Constant properties
  xows_def_readonly(cont,"type",XOWS_PEER_CONT);  //< Peer type
  xows_def_readonly(cont,"addr",addr);            //< Peer Common Address (Usser Bare JID)
  xows_def_readonly(cont,"jbar",addr);            //< Bare JID (user@domain)
  xows_def_readonly(cont,"ress",new Map());       //< Resource list
  xows_def_readonly(cont,"self",null);            //< Object cannot be current client

  Object.seal(cont); //< prevet structure modification

  xows_cli_cont.push(cont);
  return cont;
}

/**
 * Remove Contact Peer object from Contacts List
 *
 * @param   {object}    cont      Contact Object
 */
function xows_cli_cont_rem(cont)
{
  const i = xows_cli_cont.indexOf(cont);
  xows_cli_cont.splice(i, 1);
}

/**
 * Returns Contact Peer object with the specified JID
 *
 * @param   {string}    addr      Contact JID to find
 *
 * @return  {object}    Contact object or null if not found
 */
function xows_cli_cont_get(addr)
{
  return xows_cli_cont.find(xows_cli_test_addr, xows_jid_bare(addr));
}

/**
 * Returns the contact most suitable full JID for peer to peer
 * application.
 *
 * If available, the function returns the last chat session locked JID,
 * if none exists, it returns the available JID with the best priority.
 * Eventually, if no full JID was found, the Bare JID is returned.
 *
 * @param   {object}    peer      Peer object
 *
 * @return  {string}    Contact best full JID or Bare JID if not found.
 */
function xows_cli_best_resource(peer)
{
  if(peer.type === XOWS_PEER_OCCU)
    //return peer.jbar ? peer.jbar : peer.addr;
    return peer.addr;

  // Check for chat session locked JID
  if(peer.jlck != peer.jbar) {

    return peer.jlck;

  } else {

    let res = null;

    // Try to find best suitable resource
    const ress = Array.from(peer.ress.values());

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
    return res ? peer.jbar+"/"+res : peer.jbar;
  }
}

/* -------------------------------------------------------------------
 * Client API - Internal data - Room PEER Objects
 * -------------------------------------------------------------------*/
/**
 * The Client Roster list of Rooms
 */
const xows_cli_room = [];

/**
 * Create a new Room Peer object
 *
 * @param   {string}    addr      Room JID (room@service.domain)
 * @param   {string}    name      Displayed name
 *
 * @return  {object}    New Room Peer object
 */
function xows_cli_room_new(addr, name)
{
  if(!name) {
    // Compose display name from JID
    const roomid = addr.split("@")[0];
    name = roomid[0].toUpperCase()+roomid.slice(1);
  }

  const room = {
    // Room basic informations
    "name": name,           //< Display name
    "desc": "",             //< Room description
    "subj": null,           //< Room subject (set to null for signal purpose)
    // Room features
    "publ": false,          //< Room is public
    "prot": false,          //< Room is protected by password
    "pass": null,           //< Romm saved password
    "modr": false,          //< Room is moderated
    "anon": true,           //< Room is Semi-Anonymous (true) Non-anonymous (false)
    "open": true,           //< Room is Open vs Members-Only (Registration required)
    "nocc": 0,              //< Room declared occupant count
    // Room session data
    "init": false,          //< Newly created Room, need configuration
    "join": null,           //< Self join JID (room@service.domain/nick)
    "role": 0,              //< Self Room Role (Level)
    "affi": 0,              //< Self Room Affiliation (Level)
    "nick": null,           //< Reserverd Nickname in Room
    "rcon": false,          //< Signal connect loss recover
    // Room Occupants list
    "occu": [],             //< Room occupant array
    "writ": [],             //< Chatstate writting occupants list
    // Misc options
    "noti": true,           //< Notification Enabled/Mute
    "book": false,          //< Room is Bookmarked
    // Peer state and loading process
    "live": false,          //< Peer has an open chat window
    "load": 0               //< Loading Mask
  };

  // set Constant properties
  xows_def_readonly(room,"type",XOWS_PEER_ROOM);  //< Peer type
  xows_def_readonly(room,"addr",addr);            //< Common Peer Address (Room JID: room@service.domain)
  xows_def_readonly(room,"jlck",addr);            //< Current Locked Resource (Room JID)
  xows_def_readonly(room,"self",null);            //< Object cannot be current client

  Object.seal(room); //< prevet structure modification

  xows_cli_room.push(room);
  return room;
}

/**
 * Remove Room Peer object from Rooms List
 *
 * @param   {object}    room      Room Object
 */
function xows_cli_room_rem(room)
{
  const i = xows_cli_room.indexOf(room);
  xows_cli_room.splice(i, 1);
}

/**
 * Returns the Room object with the specified JID
 *
 * @param   {string}    addr      Room JID to find
 *
 * @return  {object}    Room object or null if not found
 */
function xows_cli_room_get(addr)
{
  return xows_cli_room.find(xows_cli_test_addr, xows_jid_bare(addr));
}
/* -------------------------------------------------------------------
 * Client API - Internal data - Room occupant PEER Objects
 * -------------------------------------------------------------------*/
/**
 * Create a new room Occupant Peer object
 *
 * @param   {string}    room      Room object where to create Occupant
 * @param   {string}    addr      Occupant JID (room@domaine/nick)
 * @param   {string}   [ocid]     Occupant Anonymous UID
 * @param   {string}   [jful]     Real full JID if available
 * @param   {string}    avat      Avatar hash string
 * @param   {string}    self      Defines whether occupant is the current client
 *
 * @return  {object}    New room Occupant Peer object
 */
function xows_cli_occu_new(room, addr, ocid, jful, avat, self)
{
  const jbar = jful ? xows_jid_bare(jful) : null;
  const nick = xows_jid_resc(addr);

  const occu = {
    "name": nick,           //< Nickname
    // IMPORTANT !
    //   Occupant address/JID may change as its nickname change !
    //
    "addr": addr,           //< Common Peer Address (Occupant JID: room@service/nick)
    "jlck": addr,           //< Current Locked Resource (Occupant JID)
    "jrpc": addr,           //< RPC Locked address
    // Room Occupant attributes
    "affi": 0,              //< Room affiliation
    "role": 0,              //< Room role
    "jful": jful,           //< Occupant Real Full JID (user@domain/ressource)
    "jbar": jbar,           //< Occupant Real Bare JID (user@domain)
    "avat": avat,           //< Avatar hash string.
    // Standard presence values
    "show": 4,              //< Presence show level
    "stat": "",             //< Presence status string
    "chat": 0,              //< Chatstate level
    // Misc options
    "noti": true,           //< Notification Enabled/Mute
    // Peer state and loading process
    "live": false,          //< Peer has an open chat window
    "load": 0               //< Loading Mask
  };

  self = self ? xows_cli_self : null;

  // set Constant properties
  xows_def_readonly(occu,"type",XOWS_PEER_OCCU);  //< Peer type
  xows_def_readonly(occu,"room",room);            //< Occupant Room reference
  xows_def_readonly(occu,"ocid",ocid);            //< Identitfier, either Occupant JID or Anonymous UID
  xows_def_readonly(occu,"self",self);            //< Indicates Object refer to current client

  Object.seal(occu); //< prevet structure modification

  room.occu.push(occu);
  return occu;
}

/**
 * Remove Occupant Peer object from Room Occupants List
 *
 * @param   {object}    occu      Occupant Object
 */
function xows_cli_occu_rem(occu)
{
  const room = occu.room;
  const i = room.occu.indexOf(occu);
  room.occu.splice(i, 1);
}

/**
 * Returns the Occupant object with the specified JID
 *
 * @param   {string}    room      Room object
 * @param   {string}    addr      Occupant JID (room@service/nick)
 * @param   {string}   [ocid]     Occupant Anonymous UID
 *
 * @return  {object}    Occupant object or null if not found
 */
function xows_cli_occu_get(room, addr, ocid)
{
  let i = room.occu.length;
  while(i--) {
    if(room.occu[i].ocid === ocid || room.occu[i].addr === addr)
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
 * @param   {string}    addr      Occupant JID (room@service/nick)
 * @param   {string}   [ocid]     Occupant Anonymous UID
 *
 * @return  {object}    Occupant object
 */
function xows_cli_occu_get_or_new(room, addr, ocid)
{
  // Try to find existing/online Occupant
  let i = room.occu.length;
  while(i--) {
    if(room.occu[i].ocid === ocid || room.occu[i].addr === addr)
      return room.occu[i];
  }

  // Add Occupant in Room with available cached data
  const iden = ocid ? ocid : addr;
  const cach = xows_cach_peer_get(iden);
  const avat = cach ? cach.avat : null;

  return xows_cli_occu_new(room, addr, ocid, null, avat, false);
}

/**
 * Return sefl Occupant in the specified Room
 *
 * @param   {string}    room      Room object
 *
 * @return  {object}    Occupant object
 */
function xows_cli_occu_self(room)
{
  return room.occu.find(xows_cli_test_self);
}

/* -------------------------------------------------------------------
 * Client API - Internal data - MUC Private-Message Sessions
 * -------------------------------------------------------------------*/
/**
 * The Client Roster list of Private Conversations
 */
const xows_cli_priv = [];

/**
 * Remove Occupant from Private Conversation list
 *
 * @param   {object}    occu      Occupant Object
 */
function xows_cli_priv_rem(occu)
{
  const i = xows_cli_priv.indexOf(occu);
  xows_cli_priv.splice(i, 1);
}

/**
 * Checks whether Occupant Private Conversation exists
 *
 * @param   {string}    occu      Occupant object
 *
 * @return  {boolean}   True if exists, false otherwise
 */
function xows_cli_priv_has(occu)
{
  return xows_cli_priv.includes(occu);
}

/**
 * Add Occupant to Private Conversation list
 *
 * @param   {string}    occu      Occupant object
 *
 * @return  {boolean}   True if Occupant was added, false if already exists
 */
function xows_cli_priv_add(occu)
{
  const exists = xows_cli_priv.includes(occu);
  if(!exists) xows_cli_priv.push(occu);
  return !exists;
}

/* -------------------------------------------------------------------
 *
 * Client API - Peer management routines
 *
 * -------------------------------------------------------------------*/

/**
 * Returns the Room or Contact object with the specified JID
 *
 * @param   {string}    jid       Contact JID to find
 * @param   {number}    type      Bitmaks for Peer type to search
 *
 * @return  {object}    Peer object or null if not found
 */
function xows_cli_peer_get(jid, type)
{
  // If Null JID we return self
  if(!jid)
    return xows_cli_self;

  // Get the bare JID
  const bare = xows_jid_bare(jid);

  // Check for own JID
  if(bare == xows_cli_self.addr)
    return xows_cli_self;

  // Check for Contact
  if(type & XOWS_PEER_CONT) {
    const cont = xows_cli_cont.find(xows_cli_test_addr, bare);
    if(cont) return cont;
  }

  // Check Room
  if(type & (XOWS_PEER_ROOM|XOWS_PEER_OCCU)) {
    let room = xows_cli_room.find(xows_cli_test_addr, bare);
    if(room) {
      // Check for Occupant
      let occu;
      if(type & XOWS_PEER_OCCU && jid.includes("/")) {
        occu = room.occu.find(xows_cli_test_addr, jid);
        if(occu) {
          return occu;
        } else {
          return xows_cli_priv.find(xows_cli_test_addr, jid);
        }
      }
      return room;
    }
  }

  return null;
}

/**
 * Update (and cache) Peer or Self informations such as Nickname,
 * Avatar or Status
 *
 * @param   {object}    peer      Peer object to update
 * @param   {any}      [param]    Additional param to pass to callback
 */
function xows_cli_peer_push(peer, param)
{
  // Update Peer cached data
  xows_cach_peer_save(peer);

  switch(peer.type)
  {
    case XOWS_PEER_CONT: {
      if(peer.self) {
        // Forward user update
        xows_cli_fw_selfpush(peer, param);
      } else {
        // Forward Contact update
        xows_cli_fw_contpush(peer, param);
      }
    } break;

    case XOWS_PEER_OCCU: {
      // Forward Occupant update
      xows_cli_fw_mucpush(peer, param);
      // Forward update Private Conversation
      if(xows_cli_priv_has(peer))
        xows_cli_fw_occupush(peer, param);
    } break;

    case XOWS_PEER_ROOM: {
      // Forward Contact update
      xows_cli_fw_roompush(peer, param);
    } break;
  }
}

/**
 * Returns the most suitable identifier for Peer, it can be either Contact or
 * Occupant JID or Occupant Unique ID if available.
 *
 * @param   {object}    peer      Peer object to get most suitable ID
 *
 * @return  {string}    Peer identifier
 */
function xows_cli_peer_iden(peer)
{
  if(peer.type === XOWS_PEER_OCCU && peer.ocid)
    return peer.ocid;

  return peer.addr;
}

/**
 * Returns Peer subscription status, either None (0), Pending (1)
 * or Subscribed/Unavailable (2)
 *
 * @param   {string}     addr     Contact JID to subscribes
 *
 * @return  {number}    Peer subscription status.
 */
function xows_cli_peer_subsste(peer)
{
  if(peer.self)
    return 2; //< subscription unavailable

  let cont;

  switch(peer.type)
  {
  case XOWS_PEER_CONT:
    cont = peer;
    break;

  case XOWS_PEER_OCCU:
    if(peer.jbar !== null) {
      cont = xows_cli_cont.find(xows_cli_test_addr, peer.jbar);
    } else {
      return 2; //< no JID, subscription unavailable
    }
    break;
  }

  if(cont) {
    if(cont.subs === 0) {
      return 1; //< pending authorization
    } else {
      return 2; //< already subscribed
    }
  }

  return 0; //< candidate for subscription
}

/**
 * Returns the Contact or Occupant Peer object according specified Peer
 * object and from JID address.
 *
 * @param   {string}    peer      Peer object Room or Contact
 * @param   {string}    addr      User, Room or Occupant JID
 * @param   {string}   [ocid]     Occupant Anonymous UID
 *
 * @return  {object}    Contact or Occupant Peer object
 */
function xows_cli_author_get(peer, addr, ocid)
{
  switch(peer.type)
  {
  case XOWS_PEER_ROOM:
    if(addr === peer.join) {
      return peer.occu.find(xows_cli_test_self);
    } else {
      return xows_cli_occu_get_or_new(peer, addr, ocid);
    }

  case XOWS_PEER_CONT:
    if(addr.startsWith(xows_cli_self.addr)) {
      return xows_cli_self;
    } else {
      return xows_cli_cont.find(xows_cli_test_addr, xows_jid_bare(addr));
    }

  default:
    return xows_cli_peer_get(addr, XOWS_PEER_ANY);
  }
}

/* -------------------------------------------------------------------
 *
 * Client API - Module Initialization
 *
 * -------------------------------------------------------------------*/
/**
 * Loading process tasks bits
 */
const XOWS_FETCH_AVAT = xows_load_task_bit();
const XOWS_FETCH_NICK = xows_load_task_bit();
const XOWS_FETCH_INFO = xows_load_task_bit();
const XOWS_AWAIT_SUBJ = xows_load_task_bit();

/**
 * Initializes module
 */
function xows_cli_init()
{
  xows_log(2,"cli_init","client module initialized");

  // Set callback functions
  xows_xmp_set_callback("sessready",  xows_cli_xmp_onready);
  xows_xmp_set_callback("sessclose",  xows_cli_xmp_onclose);
  xows_xmp_set_callback("error",      xows_cli_xmp_onerror);
  xows_xmp_set_callback("rostpush",   xows_cli_rost_onpush);
  xows_xmp_set_callback("presrecv",   xows_cli_pres_onrecv);
  xows_xmp_set_callback("pressubs",   xows_cli_pres_onsubs);
  xows_xmp_set_callback("presfail",   xows_cli_pres_onfail);
  xows_xmp_set_callback("presmuco",   xows_cli_muc_onpres);
  xows_xmp_set_callback("msgrecv",    xows_cli_msg_onrecv);
  xows_xmp_set_callback("msgchst",    xows_cli_chst_onrecv);
  xows_xmp_set_callback("msgrecp",    xows_cli_msg_onrecp);
  xows_xmp_set_callback("msgretr",    xows_cli_msg_onretr);
  xows_xmp_set_callback("msgpubs",    xows_cli_msg_onpubs);
  xows_xmp_set_callback("mucsubj",    xows_cli_muc_onsubj);
  xows_xmp_set_callback("mucnoti",    xows_cli_muc_onnoti);
  xows_xmp_set_callback("jingrecv",   xows_cli_call_jing_onrecv);

  // Set event listener to handle page quit or reload
  xows_doc_listener_add(window, "beforeunload", xows_cli_onuload);
  xows_doc_listener_add(window, "unload",       xows_cli_onuload);

  // Setup Load taks callback functions
  xows_load_task_set(XOWS_FETCH_AVAT, xows_cli_pep_avat_fetch);
  xows_load_task_set(XOWS_FETCH_NICK, xows_cli_pep_nick_fetch);
  xows_load_task_set(XOWS_FETCH_INFO, xows_cli_muc_info_query);
  xows_load_task_set(XOWS_AWAIT_SUBJ, xows_load_await_task);
}

/**
 * Reset module to initial state
 */
function xows_cli_reset()
{
  xows_log(2,"cli_reset","reset client state");

  // Reset show level and send "unavailable" if suitable
  xows_cli_pres_show_set(XOWS_SHOW_OFF);

  // Reset client user entity
  xows_cli_self.addr = null;
  xows_cli_self.jful = null;
  xows_cli_self.jbar = null;
  xows_cli_self.name = null;
  xows_cli_self.avat = null;
  xows_cli_self.stat = null;

  // Clear databases
  xows_cli_entities.clear();
  xows_cli_services.clear();
  xows_cli_extsvc_db.length = 0;

  // Clean the client data
  xows_cli_cont.length = 0;
  xows_cli_room.length = 0;
  xows_cli_priv.length = 0;
}

/* -------------------------------------------------------------------
 *
 * Client API - API client interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for client connected
 */
let xows_cli_fw_onready = function() {};

/**
 * Callback function for client user status change
 */
let xows_cli_fw_selfpush = function() {};

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
 *  - ready     : Session ready (connected)
 *  - error     : Session error (unhandled query error)
 *  - close     : Session closed (disconected)
 *  - selfpush  : User (self) refresh
 *  - subspush  : Roster Subscription request Add or refresh
 *  - contpush  : Roster Contact Add or refresh
 *  - contpull  : Roster Contact Removed
 *  - roompush  : Roster Room Add or refresh
 *  - roompull  : Roster Room/Boolmark Removed
 *  - occupush  : Roster MUC-Occupant (Private message) Add or refresh
 *  - occupull  : Roster MUC-Occupant (Private message) Removed
 *  - mucjoin   : MUC Room Joined (initial MUC self presence)
 *  - mucexit   : MUC Room exit (terminal MUC self presence)
 *  - mucpush   : MUC Occupant Add or Refresh
 *  - mucpull   : MUC Occupant Removed
 *  - mucsubj   : MUC Room subject received
 *  - msgrecv   : Message (with body) received
 *  - msgrecp   : Message Receipt received
 *  - msgretr   : Message Retraction received
 *  - msgchst   : Message Chat-state received
 *  - upldprog  : HTTP-Upload progress
 *  - upldload  : HTTP-Upload finished (success, error or abort)
 *  - calloffer : Multimedia call offer from remote Peer
 *  - callanwse : Multimedia call answer from remote Peer
 *  - callstate : Multimedia call Session Established
 *  - calltermd : Multimedia call Session Terminated
 *  - callerror : Multimedia call Session errror

 *
 * @param   {string}    type      Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_cli_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase()) {
    case "ready":       xows_cli_fw_onready = callback; break;
    case "error":       xows_cli_fw_onerror = callback; break;
    case "close":       xows_cli_fw_onclose = callback; break;
    case "selfpush":    xows_cli_fw_selfpush = callback; break;
    case "subspush":    xows_cli_fw_subspush = callback; break;
    case "contpush":    xows_cli_fw_contpush = callback; break;
    case "contpull":    xows_cli_fw_contpull = callback; break;
    case "roompush":    xows_cli_fw_roompush = callback; break;
    case "roompull":    xows_cli_fw_roompull = callback; break;
    case "occupush":    xows_cli_fw_occupush = callback; break;
    case "occupull":    xows_cli_fw_occupull = callback; break;
    case "mucjoin":     xows_cli_fw_mucjoin = callback; break;
    case "mucexit":     xows_cli_fw_mucexit = callback; break;
    case "mucpush":     xows_cli_fw_mucpush = callback; break;
    case "mucpull":     xows_cli_fw_mucpull = callback; break;
    case "mucsubj":     xows_cli_fw_mucsubj = callback; break;
    case "msgrecv":     xows_cli_fw_msgrecv = callback; break;
    case "msgrecp":     xows_cli_fw_msgrecp = callback; break;
    case "msgretr":     xows_cli_fw_msgretr = callback; break;
    case "msgchst":     xows_cli_fw_msgchst = callback; break;
    case "upldprog":    xows_cli_fw_upldprog = callback; break;
    case "upldload":    xows_cli_fw_upldload = callback; break;
    case "calloffer":   xows_cli_fw_calloffer = callback; break;
    case "callanwse":   xows_cli_fw_callanwse = callback; break;
    case "callstate":   xows_cli_fw_callstate = callback; break;
    case "calltermd":   xows_cli_fw_calltermd = callback; break;
    case "callerror":   xows_cli_fw_callerror = callback; break;
  }
}

/**
 * Proceeds incoming XMPP error
 *
 * @parma   {string}    from      Error expeditor
 * @param   {object}    error     Error data object
 */
function xows_cli_xmp_onerror(from, error)
{
  // forward error
  xows_cli_fw_onerror(from, error);
}

/* -------------------------------------------------------------------
 *
 * Client API - Connect and Disconnect routines
 *
 * -------------------------------------------------------------------*/
/**
 * Global session connection signals
 */
const XOWS_SESS_EXIT = 0x000;
const XOWS_SESS_LOST = 0x001;
const XOWS_SESS_FAIL = 0x002;
const XOWS_SESS_ABRT = 0x004;

/* -------------------------------------------------------------------
 * Connect and Disconnect - Connection routines
 * -------------------------------------------------------------------*/
/**
 * Connecte client to the specified XMPP over WebSocket service
 * using the given auhentication data
 *
 * @param   {string}    url       XMPP over WebSocket service URL
 * @param   {string}    jid       User JID (username@domain)
 * @param   {string}    pass      Authentication password
 * @param   {boolean}   regi      Register a new account
 */
function xows_cli_cnx_login(url, jid, pass, regi)
{
  // Reset client state
  xows_cli_reset();

  // Open a new XMPP connection
  xows_xmp_connect(url, jid, pass, regi);
}

/**
 * Handle successfull connection and opened XMPP session
 *
 * This function is called by the xows_xmp_* API layer once XMPP
 * services and items discovery is completed.
 *
 * @param   {object}    bind      XMPP Session bind object
 * @param   {boolean}   resume    Indicate XMPP stream resumed
 */
function xows_cli_xmp_onready(bind, resume)
{
  if(xows_cli_cnx_resume_pnd) {

    // Recovery from connection loss, skip features & services discovery
    xows_cli_session_start(resume);

  } else {

    // Store the full JID for this session
    xows_cli_self.addr = bind.jbar;
    xows_cli_self.jbar = bind.jbar;
    xows_cli_self.jful = bind.jful;

    // Fetch available own data from cache
    xows_cach_peer_fetch(xows_cli_self);

    // If required set own default nickname
    if(!xows_cli_self.name) {
      const userid = bind.node;
      xows_cli_self.name = userid.charAt(0).toUpperCase()+userid.slice(1);
    }

    // Set empty own status if null or undefined
    if(xows_cli_self.stat === null || xows_cli_self.stat === undefined)
      xows_cli_self.stat = "";

    // Start features & services discovery
    xows_cli_warmup_start();
  }
}

/* -------------------------------------------------------------------
 * Connect and Disconnect - Disconnect and resume routines
 * -------------------------------------------------------------------*/
/**
 * Flag for client connexion loss
 */
let xows_cli_cnx_resume_pnd = null;

/**
 * Reconnect attempt timeout reference
 */
let xows_cli_cnx_resume_hnd = null;

/**
 * Try to resume XMPP session using previousely defined auhentication data
 *
 * @param   {boolean}   start      Start or continue resume process
 */
function xows_cli_cnx_resume(start = false)
{
  if(!start) {

    // Output log
    xows_log(2,"cli_resume","stop resume process");

    // Reset pending timeouts
    if(xows_cli_cnx_resume_pnd) {
      clearTimeout(xows_cli_cnx_resume_pnd);
      xows_cli_cnx_resume_pnd = null;
    }

    // Reset pending timeouts
    if(xows_cli_cnx_resume_hnd) {
      clearTimeout(xows_cli_cnx_resume_hnd);
      xows_cli_cnx_resume_hnd = null;
    }

    return;
  }

  if(!xows_cli_cnx_resume_pnd) {
    // Output log
    xows_log(2,"cli_resume","start resume process");
    xows_cli_cnx_resume_pnd = setTimeout(xows_cli_cnx_timeout, xows_options.resume_timeout*(1000*60));
  }

  // Output log
  xows_log(2,"cli_resume","attempt to reconnect in "+xows_options.resume_try_delay+" seconds");

  if(xows_cli_cnx_resume_hnd) clearTimeout(xows_cli_cnx_resume_hnd);
  xows_cli_cnx_resume_hnd = setTimeout(xows_xmp_resume, xows_options.resume_try_delay*1000);
}

/**
 * Close session due to connection recovert timeout
 */
function xows_cli_cnx_timeout()
{
  // Reset client state
  xows_cli_reset();

  xows_cli_fw_onclose(XOWS_SESS_ABRT,"unable to resume connection");
}

/**
 * Close the XMPP session and disconnect from server
 */
function xows_cli_cnx_close()
{
  xows_log(2,"cli_disconnect","prepare disconnect");

  // Terminate all call session
  for(const peer of xows_cli_call_db.keys()) {
    xows_cli_call_self_hangup(peer, "success");
  }

  // Send "Gone" chatstat to all active chats
  for(let i = 0; i < xows_cli_cont.length; ++i) {
    if(xows_cli_cont[i].jlck !== xows_cli_cont[i].addr)
      xows_cli_chst_set(xows_cli_cont[i], XOWS_CHAT_GONE);
  }

  // Send "Gone" chatstat to all joined rooms
  for(let i = 0; i < xows_cli_room.length; ++i) {
    if(xows_cli_room[i].join)
      xows_cli_chst_set(xows_cli_room[i], XOWS_CHAT_GONE);
  }

  // Say goodbye
  xows_cli_pres_show_set(XOWS_SHOW_OFF);

  // Close the connection
  xows_xmp_disconnect(0);
}

/**
 * Special function to close session and exit the quickest way
 * possible, used to terminate session when browser exit page
 */
function xows_cli_onuload()
{
  // Terminate any pending call
  for(const [peer, sess] of xows_cli_call_db.entries())
    xows_xmp_jing_terminate(peer.jrpc, sess.sid, "failed-application");

  // Disconnect XMPP session
  xows_xmp_onuload();
}

/**
 * Checks wether client is connected
 *
 * @return  {boolean}   True if client is connected, false otherwise
 */
function xows_cli_cnx_cntd()
{
  return (xows_cli_self.jful !== null);
}

/**
 * Handle XMPP stream closed
 *
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [text]     Optional information or error message
 */
function xows_cli_xmp_onclose(code, text)
{
  if(xows_cli_cnx_resume_pnd) {
    xows_cli_cnx_resume(true);
    return;
  }

  // Do we have an error code ?
  if(code) {

    xows_log(2,"cli_xmp_onclose","session error",text);

    // Check for established session
    if(xows_cli_self.jful) {

      // This is a connection lost
      code |= XOWS_SESS_LOST;

      // Output log
      xows_log(2,"cli_xmp_onclose","lost connection",text);

      // Start reconnect process with 5 attempts
      xows_cli_cnx_resume(true);

    } else {

      // This is a connection failure
      code |= XOWS_SESS_FAIL;
    }

  } else {

    // Reset client state
    xows_cli_reset();

    xows_log(2,"cli_xmp_onclose","session closed by user",text);
  }

  // Forward the connexion close code and message
  xows_cli_fw_onclose(code, text);
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
 * Client warming up, this function starts the initial features
 * and services discovery.
 */
function xows_cli_warmup_start()
{
  xows_log(2,"cli_warmup_start","ignition");

  // Query for own account infos/features
  xows_xmp_disco_info_query(xows_cli_self.addr, null, xows_cli_warmup_discnfo_self);
}

/**
 * Initial discovery - parse own account info
 *
 * @param   {string}    from      Query result sender JID
 * @param   {string}    node      Entity node
 * @param   {object[]}  idens     Array of parsed <identity> objects
 * @param   {string[]}  feats     Array of parsed feature strings
 * @param   {object}   [xform]    Optionnal x data form included in result
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_warmup_discnfo_self(from, node, idens, feats, xform, error)
{
  // Add account features
  xows_cli_entities.set(from, {"iden":idens,"feat":feats,"item":[]});

  // Query for host (server) infos/features
  xows_xmp_disco_info_query(xows_xmp_host, null, xows_cli_warmup_discnfo_host);
}

/**
 * Initial discovery - parse host info
 *
 * @param   {string}    from      Query result sender JID
 * @param   {string}    node      Entity node
 * @param   {object[]}  idens     Array of parsed <identity> objects
 * @param   {string[]}  feats     Array of parsed feature strings
 * @param   {object}   [xform]    Optionnal x data form included in result
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_warmup_discnfo_host(from, node, idens, feats, xform, error)
{
  // Add host features
  xows_cli_entities.set(from, {"iden":idens,"feat":feats,"item":[]});

  // Query for host (server) items/services
  xows_xmp_disco_items_query(xows_xmp_host, xows_cli_warmup_discitms_host);
}

/**
 * Stack for host item discovery
 */
const xows_cli_warmup_discitms_stk = [];

/**
 * Initial discovery - parse host item list.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  items     Array of parsed <item> objects
 * @param   {object}    error     Error data if any
 */
function xows_cli_warmup_discitms_host(from, items, error)
{
  if(items.length) {

    const entity = xows_cli_entities.get(from);

    for(let i = 0, n = items.length; i < n; ++i) {

      const jid = items[i].jid;

      xows_log(2,"cli_init_discoitems_host","discovered item", jid);

      // Add item to host item list and stack for disco#info
      entity.item.push(jid);
      xows_cli_warmup_discitms_stk.push(jid);
    }

    // Query infos for first item in stack
    xows_xmp_disco_info_query(xows_cli_warmup_discitms_stk.shift(), null, xows_cli_warmup_discnfo_item);

  } else {

    // No item, query for external services or finish discovery
    if(xows_cli_entity_has(xows_xmp_host, XOWS_NS_EXTDISCO)) {
      xows_xmp_extdisco_query(xows_xmp_host, null, xows_cli_warmup_extdisc_host);
    } else {
      xows_cli_warmup_config();
    }
  }
}

/**
 * Initial discovery - parse host item (service) infos
 *
 * @param   {string}    from      Query result sender JID
 * @param   {string}    node      Entity node
 * @param   {object[]}  idens     Array of parsed <identity> objects
 * @param   {string[]}  feats     Array of parsed feature strings
 * @param   {object}   [xform]    Optionnal x data form included in result
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_warmup_discnfo_item(from, node, idens, feats, xform, error)
{
  // Add item features
  xows_cli_entities.set(from,{"iden":idens,"feat":feats,"item":[]});

  if(xows_cli_warmup_discitms_stk.length) {

    // Query infos for next item in stack
    xows_xmp_disco_info_query(xows_cli_warmup_discitms_stk.shift(), null, xows_cli_warmup_discnfo_item);

  } else {

    // No more item in stack, query for external services or finish discovery
    if(xows_cli_entity_has(xows_xmp_host, XOWS_NS_EXTDISCO)) {
      xows_xmp_extdisco_query(xows_xmp_host, null, xows_cli_warmup_extdisc_host);
    } else {
      xows_cli_warmup_config();
    }
  }
}

/**
 * Initial discovery - parse host external services
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  svcs      Array of parsed <service> objects
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_warmup_extdisc_host(from, svcs, error)
{
  // Copy arrays
  for(let i = 0, n = svcs.length; i < n; ++i) {

    const type = svcs[i].type;

    // Output some logs
    xows_log(2,"cli_extdisco_parse","discovered external",type+" ("+svcs[i].host+":"+svcs[i].port+")");

    // Add external service to list
    xows_cli_extsvc_db.push(svcs[i]);
  }

  // Features and service discovery finished, now get user Roster
  xows_xmp_rost_get_query(xows_cli_warmup_roster);
}

/**
 * Initial user Roster parse after server discovery feature
 *
 * This function is called as callback to parse the initial roster
 * get query that follow the client services and features discovery.
 *
 * Once Roster parsed, the function fetch user own data, such as
 * avatar and nickname, then step forward to client configuration.
 *
 * @param   {object[]}  items     Array of parsed roster <item> objects
 * @param   {object}    error     Error data if any
 */
function xows_cli_warmup_roster(items, error)
{
  // Parse received roster items
  xows_cli_rost_parse(items, error);

  // Fetch own data from server and go configure client
  xows_load_task_push(xows_cli_self, XOWS_FETCH_AVAT|XOWS_FETCH_NICK, xows_cli_warmup_config);
}

/**
 * Configure client according discovered features and items.
 *
 * This function is called once initial discovery is finished to setup
 * availables common services such as MUC or HTTP File Upload.
 *
 * When setup job done, if MUC service is available, it lauch MUC room
 * discovery process then call the very last initialization function.
 */
function xows_cli_warmup_config()
{
  // Check for main XMPP server features
  const serv_infos = xows_cli_entities.get(xows_xmp_host);

  // Check for message carbons
  if(serv_infos.feat.includes(XOWS_NS_CARBONS)) {
    xows_log(2,"cli_warmup_config","Enable Messages Carbons");
    xows_xmp_carbons_query(true, null);
  }

  // Search in entity for MUC and HTTP_File_Upload services
  for(const [entity, infos] of xows_cli_entities) {

    // Check for MUC service
    if(infos.feat.includes(XOWS_NS_MUC)) {

      // Initialize service slot if required
      if(!xows_cli_services.has(XOWS_NS_MUC))
        xows_cli_services.set(XOWS_NS_MUC,[]);

      xows_log(2,"cli_warmup_config","Using Multi-User-Chat service",entity);

      // Add service address
      xows_cli_services.get(XOWS_NS_MUC).push(entity);
    }

    // Check for HTTP_File_Upload (XEP-0363) service
    if(infos.feat.includes(XOWS_NS_HTTPUPLOAD)) {

      // Initialize service slot if required
      if(!xows_cli_services.has(XOWS_NS_HTTPUPLOAD))
        xows_cli_services.set(XOWS_NS_HTTPUPLOAD,[]);

      xows_log(2,"cli_warmup_config","Using HTTP-File-Upload service",entity);

      // Add service address
      xows_cli_services.get(XOWS_NS_HTTPUPLOAD).push(entity);
    }
  }

  // If MUC service available, we take one more step to discover public
  // Rooms and fetching informations about all of them.
  if(xows_cli_services.has(XOWS_NS_MUC)) {

    // Query for MUC room list
    xows_cli_muc_list_query(xows_cli_warmup_finish);

  } else {

    // We finished warmup
    xows_cli_warmup_finish();
  }
}

/**
 * Final warmup function
 *
 * This function launch a loading timeout process to wait for everything to
 * be loaded, then start the session.
 */
function xows_cli_warmup_finish()
{
  // Wait for Room discovery to finish and Show Up !
  xows_load_onempty_set(2000, xows_cli_session_start);
}

/* -------------------------------------------------------------------
 * Client API - Client final initialization
 * -------------------------------------------------------------------*/
/**
 * Initial self presence declaration, this is very last initialization
 * function. The client is now ready and Online
 *
 * This function is called once per connection to send the initial presence
 * and send user updated data (avatar, nickname, etc..) to GUI module.
 *
 * @param   {boolean}   resume    Indicate XMPP stream resume
 */
function xows_cli_session_start(resume)
{
  // Initialization can be normal or following connection loss
  if(xows_cli_cnx_resume_pnd) {

    // This is a reconnect initilization
    xows_log(1,"cli_session_start","resume session");

    // Stop resume process
    xows_cli_cnx_resume(false);

    // If XMPP stream resumed, don't need to rejoin
    if(!resume) {

      // We must re-join joigned rooms after reconnect
      let i = xows_cli_room.length;
      while(i--) {
        if(xows_cli_room[i].live) {
          xows_cli_room[i].join = null; //< need to join room again
          // Await for Room subject to be received
          xows_load_task_push(xows_cli_room[i], XOWS_AWAIT_SUBJ, xows_cli_fw_mucjoin);
          // Start join process
          xows_cli_muc_join(xows_cli_room[i]);
        }
      }

    }

  } else {

    xows_log(2,"cli_session_start","takeoff");
  }

  // Send initial own presence (after Room rejoin on resume to prevent
  // sending invalid presence to non-joined room)
  if(!resume) //< If XMPP stream resumed, nothing to do
    xows_cli_pres_show_set(XOWS_SHOW_ON);

  // Call the configured callback (forward signal to GUI)
  //xows_cli_fw_onready(xows_cli_self, resume);

  // Wait for Room Join to finish and Show Up !
  xows_load_onempty_set(3000, xows_cli_fw_onready, xows_cli_self, resume);
}

/* -------------------------------------------------------------------
 *
 * Client API - User Roster routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Contact added or refreshed
 */
let xows_cli_fw_contpush = function() {};

/**
 * Callback function for Contact removed
 */
let xows_cli_fw_contpull = function() {};

/**
 * Proceeds incoming XMPP roster push
 *
 * @param   {string}    addr      Contact JID
 * @param   {string}    name      Contact Displayred name
 * @param   {number}    subs      Contact subscription
 * @param   {string}    group     Contact group (not used yet)
 */
function xows_cli_rost_onpush(addr, name, subs, group)
{
  let cont = xows_cli_cont_get(addr);

  if(subs === XOWS_SUBS_REM) {
    // Sepecial case if we receive a 'remove' subscription
    if(cont) xows_cli_fw_contpull(cont); //< Forward contact to remove
    return;
  }

  if(cont) {

    if(name) cont.name;
    cont.subs = subs;

  } else {

    // Create new contact
    cont = xows_cli_cont_new(addr, name, subs);

    // Check for stored data in cache (localStorage)
    xows_cach_peer_fetch(cont);
  }

  let load_mask = 0;

  if(cont.subs & XOWS_SUBS_TO)
    load_mask |= XOWS_FETCH_AVAT|XOWS_FETCH_NICK;

  // Fetch data and push Contact
  xows_load_task_push(cont, load_mask, xows_cli_peer_push);
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
    cont.show = XOWS_SHOW_OFF;

    // Forward "reseted" Contact
    xows_cli_fw_contpush(cont);
  }
}

/**
 * Function to handle parsed result of roster query
 *
 * @param   {object[]}  items     Array of parsed <item> objects
 * @param   {object}    error     Error data if any
 */
function xows_cli_rost_parse(items, error)
{
  if(items.length) {
    // Fill up the Roster with received contact
    for(let i = 0, n = items.length; i < n; ++i)
      // Create a contact into local roster
      xows_cli_rost_onpush(items[i].jid, items[i].name, items[i].subs, items[i].group);
  } else {
    // Push null contact, mean empty list
    xows_cli_fw_contpush(null);
  }
}

/**
 * Function to query client roster content (contact list)
 */
function xows_cli_rost_fetch()
{
  // Query to get roster content (list of contacts)
  xows_xmp_rost_get_query(xows_cli_rost_parse);
}

/**
 * Add, update or remove item (contact or room) to/from Roster
 *
 * To remove existing item, set the name parameter ot null.
 *
 * @param   {string}    addr      Item JID to add
 * @param   {string}    name      Displayed name for item or null
 */
function xows_cli_rost_set(addr, name)
{
  // Send roster Add/Remove request
  xows_xmp_rost_set_query(addr, name, null, null);
}

/* -------------------------------------------------------------------
 *
 * Client API - Presences and Subscription routines
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Subscription added
 */
let xows_cli_fw_subspush = function() {};

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
 * @param   {string}    phot      Vcard-Avatar Hash if any
 */
function xows_cli_pres_onrecv(from, show, prio, stat, node, phot)
{
  const cont = xows_cli_cont_get(from);
  if(!cont) {

    // prevent warning for own "unavailable" report
    if(!xows_cli_self.jful)
      return;

    // prevent warning for own presence report
    if(!xows_cli_isself_addr(from))
      xows_log(1,"cli_xmp_onpresence","unknown/unsubscribed Contact",from);

    return;
  }

  xows_log(2,"cli_xmp_onpresence","received presence",from);

  // Reset the locked resource as defined in XEP-0296
  cont.jlck = cont.jbar;

  // Get resource part from full JID
  let res = xows_jid_resc(from);

  // Updates presence of the specific resource, delete it if offline
  if(show > XOWS_SHOW_OFF) {
    if(!cont.ress.has(res)) { //< new ressource ? add it
      cont.ress.set(res,{"id":res,"show":show,"prio":prio,"stat":stat,"node":null});
      // Check for entity capabilities
      if(node) {
        const node_ver = node.node + "#" + node.ver;
        cont.ress.get(res).node = node_ver;
        // If we don't know this node, get features
        if(!xows_cach_caps_has(node_ver)) {
          xows_xmp_disco_info_query(from, node_ver, xows_cli_entity_caps_parse);
        }
      }
    } else { //< update existing ressource
      cont.ress.get(res).show = show;
      cont.ress.get(res).prio = prio;
      cont.ress.get(res).stat = stat;
    }
  } else {
    if(cont.ress.has(res)) {
      cont.ress.delete(res); //< ressource gone offline remove it
    }
    // If user goes unavailable, reset chatstate
    cont.chat = 0;
  }

  // Set default show level
  cont.show = XOWS_SHOW_OFF;

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

  let load_mask = 0;

  if(cont.show > XOWS_SHOW_OFF) {

    // We got Avatar hash in presence (probably via XEP-0398)
    if(typeof phot === "string") {
      if(phot.length > 0) { // Empty string mean no avatar
        if(xows_cach_avat_has(phot)) {
          cont.avat = phot; //< We already got this one
        } else {
          load_mask |= XOWS_FETCH_AVAT; //< Non-cached data, fetch it
        }
      } else {
        cont.avat = null;
      }
    } else if(!cont.avat) { //< If contact have no avatar, try to get one

      // Fetch for avatar only if PEP notify is disabled
      if(!xows_options.cli_pepnotify_avat)
        load_mask |= XOWS_FETCH_AVAT;
    }

    // Fetch for nickname only if PEP notify is disabled
    if(!xows_options.cli_pepnotify_nick)
      load_mask |= XOWS_FETCH_NICK;
  }

  // Fetch data and push Contact
  xows_load_task_push(cont, load_mask, xows_cli_peer_push);
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
 * @param   {string}    from      Sender JID
 * @param   {string}    type      Subscribe request/result type
 * @param   {string}   [nick]     Contact prefered nickname if available
 */
function xows_cli_pres_onsubs(from, type, nick)
{
  // Try to find the contact
  let cont = xows_cli_cont_get(from);

  switch(type)
  {
  case "subscribe": { // Somebody wishes to subscribe to us
      if(cont) {
        if(cont.subs & XOWS_SUBS_TO) {
          // We assume user want mutual subscription so if contact
          // already authorized our request, we automatically allow him.
          //
          // Some may say that this don't fully respects the subscription
          // process rules, but in the common USER's perspective, this is way
          // more logical than responding to an authorization request from a
          // contact which has ALREADY allowed us.
          xows_cli_subs_answer(cont, true);
        }
      } else {
        // This mean someone is adding us to its roster and request subscribe
        if(!nick) {
          // Compose display name from JID
          const user = from.split("@")[0];
          nick = user[0].toUpperCase()+user.slice(1);
        }
        // Create new contact
        cont = xows_cli_cont_new(xows_jid_bare(from), nick, XOWS_SUBS_NONE, null);
        // Forward add subscription request
        xows_gui_rost_subs_onpush(cont);
      }
    } break;

  case "unsubscribe": { //< Somebody revoked its subscription or has aborted its request
      if(cont) {
        // Update contact subscription
        cont.subs &= ~XOWS_SUBS_FROM;
        // Update Contact
        xows_gui_rost_cont_onpush(cont);
      } else {
        // This should not happen
        xows_log(1,"cli_xmp_onsubscribe","subscribe revoked from unknow contact",from);
      }
    } break;

  case "subscribed": { //< Contact ALLOWED our subscription request
      if(cont) {
        // Update contact subscription
        cont.subs |= XOWS_SUBS_FROM;
        // Forward to update Contact
        xows_gui_rost_cont_onpush(cont);
      } else {
        // This should not happen
        xows_log(1,"cli_xmp_onsubscribe","request allowed from unknow contact",from);
      }
    } break;

  default: //< Contact DENIED our subscription request
    // We do nothing, we let user hoping and unknowing the abominable
    // rejection from his fellow. He may lose hope and delete the pending
    // Contact, or send another authorization request.
    break;
  }
}

/**
 * Send presence subscribe request to contact
 *
 * @param   {string}    addr      Contact JID to send subsribe request
 */
function xows_cli_subs_request(addr)
{
  // Search for existing contact
  let cont = xows_cli_cont_get(addr);

  // Check if we must add Contact to Roster
  if(!cont) {

    // Compose display name from JID
    const user = addr.split("@")[0];
    const name = user[0].toUpperCase()+user.slice(1);

    // Create new Contact
    cont = xows_cli_cont_new(addr, name, XOWS_SUBS_FROM, null);
  }

  // Send or resend subscribe request to contact
  xows_xmp_presence_send(addr, "subscribe", null, null, xows_cli_self.name);
}

/**
 * Revoke Contact subscribtion and remove it from Roster
 *
 * @param   {object}    cont      Contact Object
 */
function xows_cli_subs_revoke(cont)
{
  /*
  // Revoke subscription to Contact
  if(cont.subs & XOWS_SUBS_FROM) {
    xows_xmp_presence_send(cont.addr, "unsubscribed");
  } else {
    xows_xmp_presence_send(cont.addr, "unsubscribe");
  }
  */
  // Remove item from roster
  xows_xmp_rost_set_query(cont.addr, null, null, null);
}

/**
 * Answer to Contact subscribtion request, either by allowing or denying.
 *
 * @param   {object}    cont      Contact Object
 * @param   {boolean}   allow     True to allow, false to deny
 */
function xows_cli_subs_answer(cont, allow)
{
  // Send an allow or deny subscription to contact
  xows_xmp_presence_send(cont.addr, allow ? "subscribed" : "unsubscribed");

  // If subscription is allowed, we add the contact
  if(allow) {

    // Add subscribe FROM (us)
    cont.subs |= XOWS_SUBS_FROM;

    // We assume user want a mutual subscription since it authorized
    // contact, so if user is not subscribed to contact we automatically
    // send a subscription request.
    //
    // Some may say that this don't fully respects the subscription
    // process rules, but in the common USER's perspective, this is way
    // more logical than allowing subscription to contact THEN asking for
    // contact authorization.
    if(cont.subs != XOWS_SUBS_BOTH)
      xows_cli_subs_request(cont.addr);

  } else {

    // Subscribe denied, we remove Contact
    xows_cli_fw_contpull(cont);
  }
}

/* -------------------------------------------------------------------
 *
 * Client API - Message semantics
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for sent or received Chat Message
 */
let xows_cli_fw_msgrecv = function() {};

/**
 * Callback function for new Private Message session
 */
let xows_cli_fw_occupush = function() {};

/**
 * Callback function for unavailable Private Message session
 */
let xows_cli_fw_occupull = function() {};

/**
 * Handles an incoming chat message with content
 *
 * @param   {object}      mesg       Message object
 * @param   {object}      error      Error data if any
 */
function xows_cli_msg_onrecv(mesg, error)
{
  const from = mesg.from;

  let peer;
  if(mesg.type == "groupchat") {
    // Peer must be the Room object, not Occupant
    peer = xows_cli_room_get(from);
  } else {
    // Peer can be Contact or Occupant (Private Message)
    peer = xows_cli_peer_get(xows_cli_isself_addr(from) ? mesg.to : from, XOWS_PEER_ANY);
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onmessage","unknown/unsubscribed JID",from);
    return;
  }

  if(peer.type === XOWS_PEER_CONT)
    peer.jlck = from; //< Update "locked" ressourceas as recommended in XEP-0296

  if(peer.type === XOWS_PEER_OCCU) {
    // This is Room Occupant private message, if no PM session exist
    // and was actually added in PM list, we Forward PM session creation
    if(xows_cli_priv_add(peer))
      xows_cli_fw_occupush(peer);
  }

  // If no time is specified set as current
  if(!mesg.time)
    mesg.time = new Date().getTime();

  // Forward received message
  xows_cli_fw_msgrecv(peer, mesg, false, false, error);
}

/**
 * Send a chat message to the specified recipient
 *
 * @param   {string}    peer      Recipient peer (Room or Contact)
 * @param   {string}    body      Message content
 * @param   {string}   [repl]     Optionnal message ID this one replace
 * @param   {string}   [rpid]     Optionnal replyed message ID
 * @param   {string}   [rpto]     Optionnal replyed message author JID
 */
function xows_cli_msg_send(peer, body, repl, rpid, rpto)
{
  let type, from, wait = true;

  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {

    type = "groupchat";
    from = peer.join;

  } else {

    type = "chat";

    if(peer.type === XOWS_PEER_OCCU) {

      from = peer.room.join;

    } else {
      from = xows_cli_self.addr;

      // If current peer client is online and support receipt, the
      // message should not be marked as "receip received"
      if(peer.jlck !== peer.addr) {
        // Get resource object of current locked
        const ress = peer.ress.get(xows_jid_resc(peer.jlck));
        // Check for receipt support
        if(ress) wait = xows_cli_entity_caps_test(ress.node,XOWS_NS_RECEIPTS);
      }
    }
  }

  const to = peer.jlck;

  // Send message with body
  const id = xows_xmp_message_body_send(type, to, body, wait, repl, rpid, rpto);

  // Create message object
  const mesg = xows_xmp_message_forge(id, to, from, type, body, null, null, null, repl, rpid, rpto, id);

  // Forward echo sent message
  xows_cli_fw_msgrecv(peer, mesg, wait, true);
}
/* -------------------------------------------------------------------
 * Client API - Message semantics - Message Receipt
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Receipt
 */
let xows_cli_fw_msgrecp = function() {};

/**
 * Handles an incoming message receipt
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    to        Recipient JID
 * @param   {string}    receipt   Receipt message ID
 */
function xows_cli_msg_onrecp(id, from, to, receipt)
{
  let peer;
  // Check whether message is a carbons copy of a message sent by
  // current user but from another connected client.
  if(xows_cli_isself_addr(from)) {
    return;
  } else {
    // Retreive related Peer (Contact or Occupant)
    peer = xows_cli_peer_get(from, XOWS_PEER_ANY);
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onreceipt","unknown/unsubscribed JID",from);
    return;
  }

  // Forward received Receipt
  xows_cli_fw_msgrecp(peer, receipt);
}

/* -------------------------------------------------------------------
 * Client API - Message semantics - Chat-Sates
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Chatstat notification
 */
let xows_cli_fw_msgchst = function() {};

/**
 * Handles an incoming chat state notification.
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    type      Message type
 * @param   {number}    state     Chat state
 * @param   {string}   [ocid]   Occumant Anonymous UID
 */
function xows_cli_chst_onrecv(id, from, type, state, ocid)
{
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    // Check whether message is a carbons copy of a message sent by
    // own account but from another connected client.
    if(xows_cli_isself_addr(from))
      return;
    peer = xows_cli_peer_get(from, XOWS_PEER_ANY);
  } else { // groupchat
    peer = xows_cli_room_get(from);
    // Check whether message is an echo send by own account
    if(peer.join === from)
      return;
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onchatstate","unknown/unsubscribed JID",from);
    return;
  }

  switch(peer.type)
  {
  case XOWS_PEER_ROOM: {
      // search room occupant (must exists)
      const occu = xows_cli_occu_get(peer, from, ocid);
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
    } break;
  case XOWS_PEER_OCCU: {
      peer.chat = state;
    } break;
  default: {
      peer.chat = state;
      if(state > 0) peer.jlck = from;  //< Update "locked" ressource as recommended in XEP-0296
    } break;
  }

  // Forward changed Chat State
  xows_cli_fw_msgchst(peer, state);
}

/**
 *  Composing chatsate setTimeout handle/reference
 */
let xows_cli_chst_hto = null;

/**
 * Set chat state to and send the proper notification to peer
 *
 * @param   {object}    peer      Peer object to send notification
 * @param   {object}    stat      New chat state to set
 */
function xows_cli_chst_set(peer, stat)
{
  // This may happen with Private Conversation
  if(peer.type === XOWS_PEER_OCCU && peer.show == 0)
    return;

  // Send message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  if(stat > XOWS_CHAT_PAUS) { //< composing

    if(xows_cli_chst_hto) {
      // Pending timeout running mean "composing" state already send
      clearTimeout(xows_cli_chst_hto);
    } else {
      // Send new "composing" state
      xows_xmp_message_chatstate_send(peer.jlck, type, stat);
    }

    // Create/reset a timeout to end typing state after delay
    xows_cli_chst_hto = setTimeout(xows_cli_chst_set,4000,peer,XOWS_CHAT_PAUS);

  } else {

    // Reset pending timeout
    clearTimeout(xows_cli_chst_hto);
    xows_cli_chst_hto = null;

    // Send new chat state
    xows_xmp_message_chatstate_send(peer.jlck, type, stat);
  }
}
/* -------------------------------------------------------------------
 * Client API - Message semantics - Message Retraction
 * -------------------------------------------------------------------*/
/**
 * Callback function for received Chatstat notification
 */
let xows_cli_fw_msgretr = function() {};

/**
 * Handles an incoming chat state notification.
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    usid      Unique and Stable ID of message to retract
 */
function xows_cli_msg_onretr(id, from, type, usid)
{
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    peer = xows_cli_peer_get(from, XOWS_PEER_ANY);
  } else {
    peer = xows_cli_room_get(from);
  }

  if(!peer) {
    xows_log(1,"cli_xmp_onretract","unknown/unsubscribed JID",from);
    return;
  }

  // Forward retracted message
  xows_cli_fw_msgretr(peer, usid);
}

/**
 * Retract previous Message
 *
 * @param   {object}    peer      Related Peer object
 * @param   {string}    usid      Unique and Stable ID of message to retract
 */
function xows_cli_msg_retr(peer, usid)
{
  // Store message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  // Send retract
  xows_xmp_message_retract_send(peer.jlck, type, usid);

  // If we are in one-to-one chat, discard own message now
  if(peer.type !== XOWS_PEER_ROOM)
    xows_cli_fw_msgretr(peer, usid);
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
function xows_cli_pres_update()
{
  // Define values as required
  let type, show = 0, stat, phot;

  if(xows_cli_self.show > XOWS_SHOW_OFF) {
    show = xows_cli_self.show;
    stat = xows_cli_self.stat;
    phot = xows_cli_self.avat;
  } else {
    type = "unavailable";
  }

  // Simple presence to server
  xows_xmp_presence_send(null, type, show, stat, null, null, phot);

  // Presence to all joined rooms
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].join) {

      // XEP-0045 says:
      //
      // "When a MUC service receives an <x/> tagged join stanza from an
      // already-joined client (as identified by the client's full JID),
      // the service should assume that the client lost its synchronization,
      // and therefore it SHOULD send exactly the same stanzas to the client
      // as if it actually just joined the MUC."
      //
      // Ok, so... what mean "lost its synchronization" ?

      xows_xmp_presence_send(xows_cli_room[i].join, type, show, stat, null, null, phot);

      // Unavailable client exited the room
      if(type) xows_cli_room[i].join = null;
    }
  }

  // Cache new data and Push changes to GUI
  xows_cli_peer_push(xows_cli_self);
}

/**
 * Set the client current presence status
 *
 * @param   {string}    stat      Status string to set
 */
function xows_cli_pres_stat_set(stat)
{
  // Do not send useless presence
  if(xows_cli_self.stat === stat)
    return;

  // Change the status and send to server
  xows_cli_self.stat = stat;

  // Send own-presence with updated values
  xows_cli_pres_update();
}

/**
 * Presence level as chosen by user
 */
let xows_cli_pres_show_sel = XOWS_SHOW_OFF;

/**
 * Activity sleep setTimeout handle/reference
 */
let xows_cli_pres_show_hto = null;

/**
 * Set the client current presence show level
 *
 * @param   {number}    level     Numerical show level to set (0 to 5)
 */
function xows_cli_pres_show_set(level)
{
  // Change the show level and send to server
  xows_cli_self.show = xows_cli_pres_show_sel = level;

  // Send own-presence with updated values
  if(xows_cli_self.addr)
    xows_cli_pres_update();

  // Stop pending auto-away timeout
  if(xows_cli_pres_show_hto)
    clearTimeout(xows_cli_pres_show_hto);

  // If suitable, start auto-away timeout
  if(level > XOWS_SHOW_XA) {
    xows_cli_pres_show_hto = setTimeout(xows_cli_pres_show_snooze, 600000); //< 10 min
  }
}

/**
 * Decrease the client presence level to away or xa
 */
function xows_cli_pres_show_snooze()
{
  if(xows_cli_pres_show_hto)
    clearTimeout(xows_cli_pres_show_hto);

  if(xows_cli_self.show > XOWS_SHOW_XA) {
    // Decrease the show level
    xows_cli_self.show--;
    xows_cli_pres_update();
    xows_cli_pres_show_hto = setTimeout(xows_cli_pres_show_snooze, 600000); //< 10 min
  }
}

/**
 * Set presence back to the user chosen one if it is greater than
 * the current "away" value and reset the timer for snooze (auto-away).
 */
function xows_cli_pres_show_back()
{
  if(xows_cli_pres_show_hto)
    clearTimeout(xows_cli_pres_show_hto);

  if(xows_cli_self.show < xows_cli_pres_show_sel) {
    // Back to chosen show level
    xows_cli_self.show = xows_cli_pres_show_sel;
    xows_cli_pres_update();
  }

  xows_cli_pres_show_hto = setTimeout(xows_cli_pres_show_snooze, 600000); //< 10 min
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
 * @param   {string}    access    Access Model for published data
 */
function xows_cli_self_edit(name, url, access)
{
  // Update user settings
  if(name) {
    xows_cli_self.name = name;
  }

  // Update user settings
  if(url) {

    // Create new avatar from supplied image
    xows_cli_self.avat = xows_cach_avat_save(url);

    // Publish new avatar
    xows_cli_pep_avat_publ(access);

  } else {

    // This is avatar suppression
    if(xows_cli_self.avat) {

      // Retract current avatar
      xows_cli_pep_avat_retr();
    }
  }

  // Publish user nickname
  xows_cli_pep_nick_publ();

  // Send presence with new avatar hash
  xows_cli_pres_update();
}

/* -------------------------------------------------------------------
 * Client API - Vcard-temp routines
 * -------------------------------------------------------------------*/
/**
 * Publish user own vcard-temp to store nickname and, most important, Avatar
 */
function xows_cli_vcardt_publish()
{
  // Array to store vcard Nodes
  const vcard = [];

  /* XEP-0292 vCard4 version
    // Add <nickname> node
    vcard.push(xows_xml_node("nickname",xows_xml_node("text",null,xows_cli_self.name));
    if(xows_cli_self.avat) {
      // Get avatar data-URL
      const data = xows_cach_avat_get(xows_cli_self.avat);
      // Add <photo> node
      vcard.push(xows_xml_node("photo",xows_xml_node("uri",null,data));
    }
  */

  // Add <NICKNAME> node
  vcard.push(xows_xml_node("NICKNAME",null,xows_cli_self.name));
  if(xows_cli_self.avat) {
    // Get avatar data-URL
    const data = xows_cach_avat_get(xows_cli_self.avat);
    const bin_type = xows_url_to_type(data);
    const bin_data = xows_url_to_data(data);
    // Add <PHOTO> node
    vcard.push(xows_xml_node("PHOTO",null,[xows_xml_node("TYPE",  null,bin_type),
                                           xows_xml_node("BINVAL",null,bin_data)]));
  }

  xows_log(2,"cli_vcard_publish","publish own vCard-temp");

  // Send query
  xows_xmp_vcardt_set_query(vcard);
}

/**
 * Function to handle parsed result of vcard query
 *
 * @param   {string}    from      Vcard Contact JID or null
 * @param   {object}    vcard     Vcard content
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_vcardt_parse(from, vcard, error)
{
  // Retreive Peer (Contact or Occupant) related to this query
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_OCCU);
  if(!peer) {
    xows_log(1,"cli_vcard_parse","unknown/unsubscribed JID",from);
    return;
  }

  if(error) {

    // No avatar available
    peer.avat = null;

    xows_log(1,"cli_vcard_parse","error parsing vcard",from);

  } else {

    // We are only interested in avatar
    const photo = vcard.querySelector("PHOTO");
    if(photo) {

      const type = xows_xml_innertext(photo.querySelector("TYPE"));
      const binval = xows_xml_innertext(photo.querySelector("BINVAL"));
      // create proper data-url string
      const data = "data:"+type+";base64,"+binval;

      // Save image in cache
      peer.avat = xows_cach_avat_save(data);

    } else {

      // No avatar available
      peer.avat = null;
    }
  }

  if(peer.load) {
    xows_load_task_done(peer, XOWS_FETCH_AVAT);
  } else {
    xows_cli_peer_push(peer);
  }

  // Allow new avatar fetch
  xows_cli_pep_avat_fetch_stk.delete(peer);
}

/**
 * Query Contact or Own vcard data
 *
 * @param   {string}    peer      Peer object to query vcard
 */
function xows_cli_vcardt_query(peer)
{
  // Query Vcard-temps (mainly for Avatar)
  xows_xmp_vcardt_get_query(peer.addr, xows_cli_vcardt_parse);
}

/* -------------------------------------------------------------------
 *
 * Client API - PubSub routines
 *
 * -------------------------------------------------------------------*/
/**
 * Handles an incoming PubSub event/notification
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    node      PubSub node
 * @param   {object[]}  items     Received items
 */
function xows_cli_msg_onpubs(from, node, items)
{
  xows_log(2,"cli_xmp_onpubsub","received notification",node);

  // Checks for vcard notification
  if(node === XOWS_NS_VCARD4) {
    if(items.length) {
      // Send to vcard handling function
      xows_cli_vcardt_parse(from, items[0].child);
    }
  }

  // Checks for avatar notification
  if(node === XOWS_NS_AVATAR_META) {
    if(items.length) {
      // Send to avatar metadata parsing function
      xows_cli_pep_avat_meta_parse(from, items[0].child);
    }
  }

  // Checks for nickname notification
  if(node === XOWS_NS_NICK) {
    if(items.length) {
      // Send to nickname parsing function
      xows_cli_pep_nick_parse(from, items[0].child);
    }
  }

  // Checks for bookmarks notification
  if(node === XOWS_NS_BOOKMARKS) {
    if(items.length) {
      // Send to bookmark parsing function
      xows_cli_pep_book_parse(from, items);
    }
  }
}

/**
 * PubSub node access change stack
 */
const xows_cli_pep_chmod_stk = new Map();

/**
 * Handle PubSub node access change query.
 *
 * @param   {string}    from      Sender address
 * @param   {string}    node      Pubsub node (xmlns)
 * @param   {string}    xform     x-data form to fulfill
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_pep_chmod_parse(from, node, xform, error)
{
  // Check whether we have this node in stack
  if(!xows_cli_pep_chmod_stk.has(node))
    return;

  // Get parameter for this node
  const param = xows_cli_pep_chmod_stk.get(node);

  // Can now delete the node from stack
  xows_cli_pep_chmod_stk.delete(node);

  // Forward error if happen at this stage
  if(error) {
    if(xows_isfunc(param.onresult))
      param.onresult(from, "error", error);
    return;
  }

  // Browse Form Data and modify access_model
  if(xform) {
    // Fulfill the form with proper informations
    for(let i = 0, n = xform.length; i <n; ++i) {
      if(xform[i]["var"] === "pubsub#access_model") xform[i].value = [param.access];
    }
  }

  // Submit modified Form Data
  xows_xmp_pubsub_conf_set_query(node, xform, param.onresult);
}

/**
 * Function to change Pubsub node access model (Shortcut routine)
 *
 * @param   {string}    node      Pubsub node (xmlns)
 * @param   {string}    access    Access model to define
 * @param   {function} [onresult] Optional callback to handle received result
 */
function xows_cli_pep_chmod(node, access, onresult)
{
  if(xows_cli_pep_chmod_stk.has(node))
    return;

  // Store parameters for this node
  xows_cli_pep_chmod_stk.set(node, {"access":access,"onresult":onresult});

  // Query for PubSub node configuration
  xows_xmp_pubsub_conf_get_query(node, xows_cli_pep_chmod_parse);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Nickname routines
 * -------------------------------------------------------------------*/
/**
 * Handle result or notification of XEP-0172 User Nickname
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {string}    item      Received PubSub item content (<nick> node)
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_pep_nick_parse(from, item, error)
{
  // Retreive Peer (Contact or Occupant) related to this query
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_OCCU);
  if(!peer) {
    xows_log(1,"cli_nick_parse","unknown/unsubscribed JID",from);
    return;
  }

  if(error) {
    xows_log(1,"cli_nick_parse","error parse nickname",from);
  } else {
    peer.name = xows_xml_innertext(item);
  }

  if(peer.load) {
    xows_load_task_done(peer, XOWS_FETCH_NICK);
  } else {
    xows_cli_peer_push(peer);
  }
}

/**
 * Query for XEP-0172 User Nickname
 *
 * @param   {string}    peer      Peer object to query Nickname
 */
function xows_cli_pep_nick_fetch(peer)
{
  // Send query
  xows_xmp_nick_get_query(peer.addr, xows_cli_pep_nick_parse);
}

/**
 * Publish new XEP-0172 User Nickname
 */
function xows_cli_pep_nick_publ()
{
  xows_xmp_nick_publish(xows_cli_self.name, null);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Avatar routines
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
 * Function to handle parsed result of avatar data query.
 *
 * @param   {string}    from      Avatar Contact JID.
 * @param   {object}    hash      Avtar ID (data SHA-1 hash)
 * @param   {object}    data      Avtar data or null to get cached
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_pep_avat_data_parse(from, hash, data, error)
{
  // Retreive Peer (Contact or Occupant) related to this query
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_OCCU);
  if(!peer) {
    xows_log(1,"cli_avat_data_parse","unknown/unsubscribed JID",from);
    return;
  }

  // get stack entry for this peer
  const info = xows_cli_avat_parse_stk.get(peer);

  // we can delete saved meta data from stack
  xows_cli_avat_parse_stk.delete(peer);

  // In case of error, DO NOT update Avatar
  if(error) {
    // As fallback, try to get avatar from Vcard
    xows_cli_vcardt_query(peer);
    return;
  }

  // Compose data-URL and add data to cache
  xows_cach_avat_save("data:"+info.type+";base64,"+ data, hash);

  // Set new avatar
  peer.avat = hash;

  if(peer.load) {
    xows_load_task_done(peer, XOWS_FETCH_AVAT);
  } else {
    xows_cli_peer_push(peer);
  }

  // Allow new avatar fetch
  xows_cli_pep_avat_fetch_stk.delete(peer);
}

/**
 * Handle received XEP-0084 avatar metadata notification
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {object}    item      Received PupSub item content (<metadata> Node)
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_pep_avat_meta_parse(from, item, error)
{
  // Retreive Peer (Contact or Occupant) related to this query
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_OCCU);
  if(!peer) {
    xows_log(1,"cli_avat_meta_parse","unknown/unsubscribed JID",from);
    return;
  }

  let info = null;
  if(item)
    // Notice, the <info> node may be missing if no Avatar available
    info = item.querySelector("info");

  if(error || !info) {

    // If option is set and if missing Avatar is ours
    // Generate a temporary Avatar and publish it
    if(xows_options.cli_avat_autopub && peer === xows_cli_self) {

      // Generate temporary avatar data
      const data = xows_cach_avat_temp_data(peer.addr, null);

      // Save temp avatar as real avatar and get proper hash value
      peer.avat = xows_cach_avat_save(data);

      // Publish this avatar
      xows_cli_pep_avat_publ("open");

      // Set Peer avatar as loaded
      xows_load_task_done(peer, XOWS_FETCH_AVAT);

      // Allow new avatar fetch
      xows_cli_pep_avat_fetch_stk.delete(peer);

      return;
    }

    // As fallback, try to get avatar from Vcard
    xows_cli_vcardt_query(peer);

    return;
  }

  // We only need id (data Hash) and type
  const hash = info.getAttribute("id");
  const type = info.getAttribute("type");

  // Check whether we need to donwload data
  if(xows_cach_avat_has(hash)) {

    // Set Peer avatar
    peer.avat = hash;

    if(peer.load) {
      xows_load_task_done(peer, XOWS_FETCH_AVAT);
    } else {
      xows_cli_peer_push(peer);
    }

  } else {
    // add new stack entry for this peer
    xows_cli_avat_parse_stk.set(peer, {"hash":hash,"type":type});
    // Query for Avatar Data
    xows_xmp_avat_data_get_query(from, hash, xows_cli_pep_avat_data_parse);
  }
}

/**
 * Query for XEP-0084 avatar metadata
 *
 * @param   {string}    peer     Peer to query avatar
 */
function xows_cli_pep_avat_meta_query(peer)
{
  // Query for Avatar Meta-Data
  xows_xmp_avat_meta_get_query(peer.addr, xows_cli_pep_avat_meta_parse);
}

/**
 * Stack for Avatar fetch cycle, to ensure only one query per Peer at a time.
 */
const xows_cli_pep_avat_fetch_stk = new Map();

/**
 * Fetch Peer Avatar, first by trying to retrieve avatar via PEP (XEP-0084),
 * then via vCard-Temp (XEP-0153)
 *
 * @param   {string}    peer     Peer to query avatar
 */
function xows_cli_pep_avat_fetch(peer)
{
  if(xows_cli_pep_avat_fetch_stk.has(peer)) {

    xows_log(1,"cli_avat_fetch","peer already in stack",peer.addr);

    if(peer.load)
      xows_load_task_done(peer, XOWS_FETCH_AVAT);

    return;
  }

  // Create dummy entry to prevent multiple query
  xows_cli_pep_avat_fetch_stk.set(peer, peer);

  // We start by querying XEP-0084 Avatar Meta-Data
  xows_xmp_avat_meta_get_query(peer.addr, xows_cli_pep_avat_meta_parse);
}

/**
 * Stores parameters for XEP-0084 avatar publication process
 */
const xows_cli_pep_avat_publ_param = {access:""};

/**
 * Publish new XEP-0084 avatar data then automatically send metadata
 * if data publication succeed
 *
 * This function take avatar data from the one currently cached and
 * used by client own account.
 *
 * @param   {boolean}   access    Access model for published Avatar
 */
function xows_cli_pep_avat_publ(access)
{
  const datauri = xows_cach_avat_get(xows_cli_self.avat);
  if(!datauri)
    return;

  // Store metadata params to be published after data upload
  xows_cli_pep_avat_publ_param.access = access;

  // Get avatar Base64 data and create binary hash value
  const data = xows_url_to_data(datauri);
  const hash = xows_bytes_to_hex(xows_hash_sha1(atob(data)));

  // Publish data, the onparse function is set to send metadata
  xows_xmp_avat_data_publish(hash, data, null, xows_cli_pep_avat_meta_publ);

  // If requested, change access model Avatar-Metadata
  if(access)
    xows_cli_pep_chmod(XOWS_NS_AVATAR_DATA, access);

  // Keep complient with XEP-0153, also publish vcard-temp
  xows_cli_vcardt_publish();
}

/**
 * Retract XEP-0084 Avatar data and metadata items from PubSub.
 *
 * This function has effect only if a avalid avatar hash is
 * available.
 */
function xows_cli_pep_avat_retr()
{
  if(xows_cli_self.avat !== null) {

    // We must retract data before metadata or we got item-not-found
    // error once it's time to retract data
    //xows_xmp_pubsub_retract(XOWS_NS_AVATAR_DATA, xows_cli_self.avat, null);
    xows_xmp_pubsub_retract(XOWS_NS_AVATAR_META, xows_cli_self.avat, null);

    // Annnd... it's gone.
    xows_cli_self.avat = null;

  } else {
    xows_log(1,"cli_avat_retract","No avatar Hash-ID to retract");
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
 * @param   {object}    error     Query error data if any
 */
function xows_cli_pep_avat_meta_publ(from, type, error)
{
  // If data publish succeed, follow by sending meta-data
  if(type != "result")
    return;

  const datauri = xows_cach_avat_get(xows_cli_self.avat);
  if(!datauri)
    return;

  // Get image binary data and create hash value
  const data = atob(xows_url_to_data(datauri));
  const hash = xows_bytes_to_hex(xows_hash_sha1(data));

  xows_xmp_avat_meta_publish(hash, xows_url_to_type(datauri), data.length,
                             XOWS_AVAT_SIZE, XOWS_AVAT_SIZE, null, null);

  const access = xows_cli_pep_avat_publ_param.access;

  // If requested, change access model Avatar-Data and Avatar-Metadata
  if(access)
    xows_cli_pep_chmod(XOWS_NS_AVATAR_META, access);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Boomark routines
 * -------------------------------------------------------------------*/
/**
 * Handle notification of XEP-0402 Bookmarks
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {object[]}  items     List of <item> nodes
 */
function xows_cli_pep_book_parse(from, items)
{
  for(let i = 0, n = items.length; i < n; ++i) {

    let addr = items[i].id;
    let name = items[i].child.getAttribute("name");
    let auto = items[i].child.getAttribute("autojoin");

    // TODO: What is that ?
    //const temp = items[i].child.querySelector("nick");
    //if(temp) nick = xows_xml_innertext(temp);

    // Check whether Room already exists
    let room = xows_cli_room_get(addr);
    if(room) {

      // Checks whether this is a public room, in this case we ignore
      // the bookmark, Room stay in 'PUBLIC ROOMS' section.
      if(room.publ) return;

    } else {

      // Create new Room object to reflect Bookmark
      room = xows_cli_room_new(addr, name);
    }

    // This room is bookmarked
    room.book = true;

    // Auto-join room
    if(auto) xows_cli_muc_join(room);

    // Fetch info and push Room
    xows_load_task_push(room, XOWS_FETCH_INFO, xows_cli_peer_push);
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
function xows_cli_pep_book_publ(room, auto, name, nick)
{
  const mrk_name = name ? name : room.name;
  const mrk_nick = nick ? nick : xows_jid_resc(room.join);

  xows_xmp_bookmark_publish(room.addr, mrk_name, auto, mrk_nick, null);
}

/* -------------------------------------------------------------------
 *
 * Client API - MAM routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Map to store per-peer MAM history fetch parameters
 */
const xows_cli_mam_fetch_param = new Map();

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
function xows_cli_mam_fetch_parse(from, bare, result, count, complete)
{
  // Retreive Peer related to this query
  const peer = xows_cli_peer_get(from ? from : bare, XOWS_PEER_ANY);
  if(!peer) {
    xows_log(1,"cli_mam_collect","unknown/unsubscribed JID",from ? from : bare);
    return;
  }

  // Store list of retracted message USID
  const retrac = [];
  let i = result.length;
  while(i--) if(result[i].retract) retrac.push(result[i].retract);

  // Notice for future implementation :
  //
  // It is important to NOT delete any received archive result, even
  // "invisibles" ones such as Chat States, Receipts and Retractions in order
  // to keep consistant sequence with precise timestamp to properly gather
  // next or previous archives.
  i = result.length;
  if(peer.type === XOWS_PEER_CONT) {
    while(i--) {
      //< Delete body of retracted message to exclude it from final counting
      if(retrac.includes(result[i].orid)) result[i].discard = true;
    }
  } else { //<  === XOWS_PEER_ROOM
    while(i--) {
      //< Delete body of retracted message to exclude it from final counting
      if(retrac.includes(result[i].szid)) result[i].discard = true;
    }
  }

  // Get history pull params
  const param = xows_cli_mam_fetch_param.get(peer);
  if(!param) {
    xows_log(1,"cli_mam_collect","unexpected MAM result",from ? from : bare);
    return;
  }

  // Depending query  we add result at front or back to pool
  if(param.start) {
    param.pool = param.pool.concat(result);
  } else {
    param.pool = result.concat(param.pool);
  }

  // Shortcut...
  const pool = param.pool;

  // Comput count of visible messages excluding replacements
  let visibles = 0;
  i = pool.length;
  while(i--)
    if(pool[i].body && !pool[i].discard && !pool[i].replace)
      visibles++;

  if(!complete) {

    // Send another query until we get enough message
    if(visibles < param.need) {

      // Shift time to get more message after/before the last/first
      // recevied with 25ms time shift to prevent doubling
      if(param.start) {
        param.start = pool[pool.length-1].time + 1;
      } else {
        param.end = pool[0].time - 1;
      }

      // Change the 'max' value to avoid querying too much, but
      // more than required since received messages may be invisible
      param.max = (param.need - visibles) * 2;

      // Send new query to collect more
      xows_cli_mam_fetch_query(peer);
      return;
    }
  }

  xows_log(2,"cli_mam_collect",visibles+" gathered messages for", peer.addr);

  if(xows_isfunc(param.onresult))
    param.onresult(peer, (param.start !== null), pool, visibles, complete);

  // Delete history pull params
  xows_cli_mam_fetch_param.delete(peer);
}

/**
 * Send MAM archive query for the specified history fetch, the
 * fetch must had been initialized by xows_cli_mam_fetch()
 *
 * This function is for private usage only.
 *
 * @param   {object}    peer      Peer to get archive
 */
function xows_cli_mam_fetch_query(peer)
{
  if(!xows_cli_mam_fetch_param.has(peer))
    return;

  // Get history pull parameters
  const param = xows_cli_mam_fetch_param.get(peer);

  // Send new query to XMPP interface
  if(peer.type === XOWS_PEER_ROOM) {
    xows_xmp_mam_query(peer.addr, param.max, null, param.start, param.end, null, xows_cli_mam_fetch_parse);
  } else {
    xows_xmp_mam_query(null, param.max, peer.addr, param.start, param.end, null, xows_cli_mam_fetch_parse);
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
  if(xows_cli_mam_fetch_param.has(peer))
    return;

  xows_log(2,"cli_mam_fetch","fetch history for", peer.addr);

  const param = {
    "peer":     peer,
    "need":     count,
    "max":      count,
    "start":    start,
    "end":      end,
    "onresult": onresult,
    "pool":     new Array()
  };

  // Initialize history pull parameters
  xows_cli_mam_fetch_param.set(peer,param);

  // Send first query
  xows_cli_mam_fetch_query(peer);
}

/* -------------------------------------------------------------------
 *
 * Client API - HTTP Files Upload routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Constants for HTTP-Upload load status
 */
const XOWS_UPLD_SUCC  = 1;
const XOWS_UPLD_ABRT  = 2;
const XOWS_UPLD_ERIQ  = 3; //< XMPP Query error
const XOWS_UPLD_ERHT  = 4; //< HTTP PUT error

/**
 * Callback function for sent or received Chat Message
 */
let xows_cli_fw_upldprog = function() {};

/**
 * Callback function for new Private Message session
 */
let xows_cli_fw_upldload = function() {};

/**
 * Object used to store Current Http Upload query related data
 */
const xows_cli_upld_stk = new Map();

/**
 * Returns whether an HTTP-Upload is processing for the specified Peer
 *
 * @param   {object}    peer        Peer object
 *
 * @return  {boolean}   True if HTTP-Upload processing, false otherwise
 */
function xows_cli_upld_has(peer)
{
  return xows_cli_upld_stk.has(peer);
}

/**
 * Function to query an Http upload slot
 *
 * @param   {object}    peer        Peer object
 * @param   {object}    file        File object to upload
 */
function xows_cli_upld_query(peer, file)
{
  // We allow only one upload per Peer at a time
  if(xows_cli_upld_stk.has(peer)) {
    xows_log(1,"cli_upld_query","Upload already pending",peer.name);
    return;
  }

  if(!xows_cli_services.has(XOWS_NS_HTTPUPLOAD)) {
    xows_log(1,"cli_upld_query","No suitable service unavailable");
    return;
  }

  // Create stack entry for Peer
  xows_cli_upld_stk.set(peer,{"file":file});

  // Since HTTP-Upload queries does not involve Peer, we need to generate
  // query Id from client side to be able to keep track of replied result
  const id = xows_gen_uuid();

  // Create stack entry for Upload-slot Query
  xows_cli_upld_stk.set(id, peer);

  // Query an upload slot to XMPP service
  xows_xmp_upld_query(xows_cli_services.get(XOWS_NS_HTTPUPLOAD)[0],
                      id, file.name, file.size, file.type,
                      xows_cli_upld_parse);
}

/**
 * Handes an Http Upload query result, then start upload if slot was given
 *
 * @param   {string}    id        Query Id
 * @param   {string}    puturl    URL for upload PUT HTTP request
 * @param   {object[]}  puthdr    Additional headers for PUT HTTP request
 * @param   {string}    geturl    URL to donwload file once uploaded
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_upld_parse(id, puturl, puthdr, geturl, error)
{
  // Get Upload-slot Query entry (giving us corresponding Peer)
  const peer = xows_cli_upld_stk.get(id);
  xows_cli_upld_stk.delete(id); //< We don't need it anymore

  // Get Peer stack entry
  const param = xows_cli_upld_stk.get(peer);

  // Check for error
  if(error) {
    // Try to compose readable errot message with what we got
    const text = xows_xml_beatify_tag(error.upld ? error.upld : error.name);
    // Forward error
    xows_cli_fw_upldload(peer, XOWS_UPLD_ERIQ, text);
    // Delete stack entry
    xows_cli_upld_stk.delete(peer);
    return;
  }

  // Add get URL to peer params
  param.url = geturl;

  // Create new XHR instance (and don't tell me about 'fetch()' API)
  const xhr = new XMLHttpRequest();
  param.xhr = xhr; //< Add XHR to peer params

  // Set proper callbacks to XHR object. We ignore the 'onload' callback since
  // it is not reliable in our context. Also, notice that all callbacks receive
  // the same ProgressEvent object, giving no clues about error, abort or
  // success status, so the 'onloadend' is also totally pointless.
  //
  // As usual, we use the 'closure' twilight-zone to pass locally declared
  // variables to callbacks via an 'arrow function' wormhole.
  xhr.upload.onprogress = (event) => {xows_cli_upld_onprogr(peer, event);};
  xhr.upload.onabort = (event) => {xows_cli_upld_onabort(peer, event);};
  xhr.upload.onerror = (event) => {xows_cli_upld_onerror(peer, event);};
  xhr.onreadystatechange = () => {xows_cli_upld_onstate(peer, xhr);};


  // Create PUT request with supplied headers
  xhr.open("PUT", puturl, true);
  xhr.setRequestHeader("Content-Type","main_menucation/octet-stream");
  for(let i = 0; i < puthdr.length; ++i)
    xhr.setRequestHeader(puthdr[i].name, puthdr[i].data);

  // Here we go...
  xhr.send(param.file);
}

/**
 * Abort the current progressing file upload if any
 *
 * @param   {string}     peer     Peer object
 */
function xows_cli_upld_abort(peer)
{
  // We allow only one upload per Peer at a time
  if(!xows_cli_upld_stk.has(peer)) {
    xows_log(1,"cli_upld_abort","No pending download",peer.name);
    return;
  }

  // Retreive peer parameters
  const param = xows_cli_upld_stk.get(peer);

  // Abort XHR instance
  param.xhr.abort();
}

/**
 * Http Upload query XMLHttpRequest.upload "progress" callback function
 *
 * @param   {object}    event     Event object (ProgressEvent)
 */
function xows_cli_upld_onprogr(peer, event)
{
  // Get Peer stack entry
  const param = xows_cli_upld_stk.get(peer);

  // Forward progression infos
  xows_cli_fw_upldprog(peer, param.file, (event.loaded / event.total) * 100);
}

/**
 * Http Upload query XMLHttpRequest onreadystatechange callback.
 *
 * @param   {object}    xhr       XMLHttpRequest instance
 */
function xows_cli_upld_onstate(peer, xhr)
{
  // Check for ready state
  if(xhr.readyState === 4) {

    // Get peer parameters
    const param = xows_cli_upld_stk.get(peer);

    // Check HTTP reponse code
    if(xhr.status === 201) {
      // Forward file download URL with some delay to let the HTTP server
      // to refresh and be able to provide correct GET access to file
      setTimeout(xows_cli_fw_upldload, 500, peer, XOWS_UPLD_SUCC, param.url);
    } else {
      const text = xhr.statusText + " (" + xhr.status + ")";
      // Some story here. I spend an entire day
      xows_cli_fw_upldload(peer, XOWS_UPLD_ERHT, text);
    }

    // Delete stack entry
    xows_cli_upld_stk.delete(peer);
  }
}

/**
 * Http Upload query XMLHttpRequest.upload "error" callback function
 *
 * @param   {object}    event     Event object (ProgressEvent)
 */
function xows_cli_upld_onerror(peer, event)
{
  // This would have been nice if the onerror's event embeds some actual error
  // clue, but our world is cruel and XMLHttpRequest was created in the image
  // of our world.
  //
  // Anyway, this callback is called only if XHR encountered what is considered
  // as "internal" error. This however include "network errors" in the broad
  // sense such as lookup errors but also CORS/Same-Origin policy errors or
  // anything that prevent XHR to transmit (us) a server reponse.

  xows_cli_fw_upldload(peer, XOWS_UPLD_ERHT, xows_l10n_get("HTTP server unreachable"));

  // Delete stack entry
  xows_cli_upld_stk.delete(peer);
}

/**
 * Http Upload query XMLHttpRequest.upload "abort" callback function
 *
 * @param   {object}    event     Error event object
 */
function xows_cli_upld_onabort(peer, event)
{
  xows_cli_fw_upldload(peer, XOWS_UPLD_ABRT, null);

  // Delete stack entry
  xows_cli_upld_stk.delete(peer);
}

/* -------------------------------------------------------------------
 *
 * Client API - MUC routines and interface
 *
 * -------------------------------------------------------------------*/
/**
 * Callback function for Room added or refreshed
 */
let xows_cli_fw_roompush = function() {};

/**
 * Callback function for Room removed
 */
let xows_cli_fw_roompull = function() {};

/**
 * Callback function for initial Room presence (Joined Room)
 */
let xows_cli_fw_mucjoin = function() {};

/**
 * Callback function for terminal Room presence (Exit Room)
 */
let xows_cli_fw_mucexit = function() {};

/**
 * Callback function for Room Occupant added or refreshed
 */
let xows_cli_fw_mucpush = function() {};

/**
 * Callback function for Room Occupant removed
 */
let xows_cli_fw_mucpull = function() {};

/**
 * Callback function for received Room Subject
 */
let xows_cli_fw_mucsubj = function() {};

/**
 * MUC Room list query parameters
 */
const xows_cli_muc_list_param = {stack:[],ondisco:null};

/**
 * Parse result (aka. Public Room list) of disco#items queries
 * to MUC available services.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_muc_list_parse(from, item)
{
  // Forward null to signal query response
  xows_cli_fw_roompush(null);

  for(let i = 0; i < item.length; ++i) {

    // Create new room in local list
    const room = xows_cli_room_new(item[i].jid);

    // Fetch infos and push Room
    xows_load_task_push(room, XOWS_FETCH_INFO, xows_cli_peer_push);
  }

  const param = xows_cli_muc_list_param;

  // Process ondisco job
  if(param.ondisco) {

    // Search for MUC service addres in stack
    for(let i = 0; i < param.stack.length; ++i) {
      if(param.stack[i] === from) {
        param.stack.splice(i, 1);
        break;
      }
    }

    // If all MUC services was discovered, fire ondisco
    if(!param.stack.length) {
      param.ondisco();
      param.ondisco = null;
    }
  }
}

/**
 * Query disco#items to MUC available services (if any) to gather list
 * of public Room (MUC Service's Items).
 *
 * @param   {function}    ondisco   Optional callback for discovery finished
 */
function xows_cli_muc_list_query(ondisco)
{
  // Verify the server provide MUC service
  if(!xows_cli_services.has(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_discoitems_query","aborted","no MUC service available");
    return;
  }

  const param = xows_cli_muc_list_param;

  if(xows_isfunc(ondisco))
    param.ondisco = ondisco;

  // Get array of available MUC services
  const muc = xows_cli_services.get(XOWS_NS_MUC);

  // Send Item discovery to all available MUC services
  for(let i = 0, n = muc.length; i < n; ++i) {
    if(param.ondisco) param.stack.push(muc[i]); //< Add muc service to stack
    xows_xmp_disco_items_query(muc[i], xows_cli_muc_list_parse);
  }
}

/**
 * Parse disco#info result as a MUC Room and store Peer
 * object in Room list.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {string}    node      Entity node
 * @param   {object[]}  idens     Array of parsed <identity> objects
 * @param   {string[]}  feats     Array of parsed feature strings
 * @param   {object}   [xform]    Optionnal x data form included in result
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_muc_info_parse(from, node, idens, feats, xform, error)
{
  let name = null;

  // Check for Room name supplied in identity
  if(idens.length > 0)
    name = idens[0].name;

  // Check whether this room already exists in local list
  let room = xows_cli_room_get(from);
  if(room) {
    if(name) room.name = name;
  } else {
    // Create new room in local list
    room = xows_cli_room_new(from, name);
  }

  // Check room features
  for(let i = 0; i < feats.length; ++i) {
    // Password protection
    if(feats[i] === "muc_passwordprotected") room.prot = true;
    if(feats[i] === "muc_unsecured") room.prot = false;
    // Public / Private
    if(feats[i] === "muc_public") room.publ = true;
    if(feats[i] === "muc_hidden") room.publ = false;
    // Members-Only
    if(feats[i] === "muc_membersonly") room.open = false;
    if(feats[i] === "muc_open") room.open = true;
    // Moderated
    if(feats[i] === "muc_moderated") room.modr = true;
    if(feats[i] === "muc_unmoderated") room.modr = false;
    // Semi/Non-anonymous
    if(feats[i] === "muc_semianonymous") room.anon = true;
    if(feats[i] === "muc_nonanonymous") room.anon = false;
  }

  // Get available informations
  if(xform) {
    for(let i = 0; i < xform.length; ++i) {
      if(xform[i]["var"] === "muc#roomconfig_roomname")
        if(xform[i].value) room.name = xform[i].value;

      if(xform[i]["var"] === "muc#roominfo_description")
        if(xform[i].value) room.desc = xform[i].value;

      if(xform[i]["var"] === "muc#roominfo_subject")
        if(xform[i].value) room.subj = xform[i].value;

      if(xform[i]["var"] == "muc#roominfo_occupants")
        if(xform[i].value) room.nocc = parseInt(xform[i].value); //< Number of occupants

      //if(xform[i]["var"] == "muc#roominfo_lang")  = xform[i].value;
      //if(xform[i]["var"] == "muc#roomconfig_allowinvites")  = xform[i].value;
      //if(xform[i]["var"] == "muc#roomconfig_changesubject")  = xform[i].value;
    }
  }

  if(room.load) {
    xows_load_task_done(room, XOWS_FETCH_INFO);
  } else {
    xows_cli_peer_push(room);
  }
}

/**
 * Query MUC Room infos
 *
 * @param   {object}    room      Room Peer object to query infos
 */
function xows_cli_muc_info_query(room)
{
  // Send query
  xows_xmp_disco_info_query(room.addr, null, xows_cli_muc_info_parse);
}


/**
 * Retry to join Room sending presence stanza to MUC room using
 * Room object parameters.
 *
 * This function should be used only when an initial join attempt failed,
 * otherwise, xows_cli_muc_join should be called first.
 *
 * @param   {object}    room      Room object to join
 */
/*
function xows_cli_muc_join_retry(room)
{
  // XEP-0045:
  //
  // "Even if a user has registered one room nickname, the service SHOULD
  // allow the user to specify a different nickname on entering the room
  // (e.g., in order to join from different client resources), although
  // the service MAY choose to "lock down" nicknames and therefore deny
  // entry to the user, including a <not-acceptable/> error."
  //
  // What a mess... How a registered user change its reserved nickname ?

  // Compose destination using Room JID and nickname
  let to = room.addr + "/";
  to += room.nick ? room.nick : xows_cli_self.name;

  // Content of MUC <x> node (Password)
  const mucx = {pass:room.pass};

  // Send initial presence to Room to join
  xows_xmp_presence_send(to, null, xows_cli_self.show, xows_cli_self.stat, null, mucx, xows_cli_self.avat);
}
*/

/**
 * Function to handle Room own reserved nickname query sent by Join
 * init function. This function also automatically try to join the Room.
 *
 * @param   {string}    from      Sender Room JID
 * @param   {string}    nick      Received reserved nickname or null
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_muc_join_nick(from, nick, error)
{
  // Get room object (should exist)
  let room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_join_nick_result","unknown/unsubscribed Room",from);
    return;
  }

  // Set own nickname for this Room
  room.nick = (nick !== null) ? nick : "";

  // Send presence to join
  xows_cli_muc_join(room);
}

/**
 * Atempt to join a Room, creating required stuff and checking for
 * reserved nickname.
 *
 * If no room object is supplied the function try to join (ie. create)
 * the room using the supplied room name.
 *
 * @param   {object|string}   [room]     Room object or Room identifier or JID
 * @param   {string}          [pass]     Optional password to join room
 */
function xows_cli_muc_join(room, pass)
{
  // Check whether we got String rather than Room object
  if(typeof room === "string") {

    let addr;

    // check whether name is identifier or JID
    if(xows_isjid(room)) {

      addr = room;

    } else {

      // Verify the server provide MUC service
      if(!xows_cli_services.has(XOWS_NS_MUC)) {
        xows_log(1,"cli_muc_join","aborted","no MUC service available");
        return;
      }

      // compose room JID for current server
      addr = room.toLowerCase()+"@"+xows_cli_services.get(XOWS_NS_MUC)[0];
    }

    // create new Room object
    room = xows_cli_room_new(addr);

  } else {

    if(room.join)
      return; // already joined room
  }

  // Set nickname and password if supplied
  room.pass = pass;

  // Check whether we must fetch reserved nickname
  if(room.nick === null) {

    // Query for own reserved nickname, then join room
    xows_xmp_muc_nick_query(room.addr, xows_cli_muc_join_nick);

  } else {

    // Forward Room about to be joined
    xows_cli_fw_roompush(room, true);

    // XEP-0045:
    //
    // "Even if a user has registered one room nickname, the service SHOULD
    // allow the user to specify a different nickname on entering the room
    // (e.g., in order to join from different client resources), although
    // the service MAY choose to "lock down" nicknames and therefore deny
    // entry to the user, including a <not-acceptable/> error."
    //
    // What a mess... How a registered user change its reserved nickname ?

    // Compose destination using Room JID and nickname
    let to = room.addr + "/";
    to += room.nick ? room.nick : xows_cli_self.name;

    // Content of MUC <x> node (Password)
    const mucx = {pass:room.pass};

    // Send initial presence to Room to join
    xows_xmp_presence_send(to, null, xows_cli_self.show, xows_cli_self.stat, null, mucx, xows_cli_self.avat);
  }
}

/**
 * Handles received occupant presence (<presence> stanza) status
 * from MUC room
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {number}    show      Optional show level if available
 * @param   {string}    stat      Optional status string if available
 * @param   {object}    mucx      Occupant MUC additional infos
 * @param   {string}    ocid      Occupant Unique ID (occupant-id)
 * @param   {string}    phot      Vcard-Avatar Hash if any
 */
function xows_cli_muc_onpres(from, show, stat, mucx, ocid, phot)
{
  // Get room object, if exists
  let room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_xmp_onoccupant","unknown/unsubscribed Room",from);
    return;
  }

  xows_log(2,"cli_xmp_onoccupant","received occupant",from);

  // MUC Status codes (most of them)
  //
  // 110: Inform user that presence refers to itself
  // 201: Inform user that a new room has been created
  // 210: Inform user that service has assigned or modified occupant's roomnick
  // 301: A user has been banned from the room
  // 303: Inform all occupants of new room nickname
  // 307: A user has been kicked from the room
  // 321: A user is being removed from the room because of an affiliation change
  // 322: A user is being removed from the room because the room has been changed to members-only
  // 333: A user was removed because of an error reply (server error)

  let self;

  // Handle Self presence
  if(mucx.code.includes(110)) {

    self = true;

    if(show > XOWS_SHOW_OFF) {

      if(room.join === null) {

        // This is initial onw presence, we joined the Room
        room.join = from;

        // Check for Room creation
        if(mucx.code.includes(201)) {

          // Room is awaiting configuration
          room.init = true;

          // Forward Room creation
          xows_cli_fw_roompush(room);

          // Forward Room joined
          xows_cli_fw_mucjoin(room);

        } else {

          // Await for Room subject to be received
          xows_load_task_push(room, XOWS_AWAIT_SUBJ, xows_cli_fw_mucjoin);
        }

      }

    } else {

      // Check whether this is nickname change rather than true departure
      if(!mucx.code.includes(303)) {

        // We leaved the Room for some reasons
        room.join = null;

        // Forward removed Private Conversation
        for(let i = 0; i < room.occu.length; ++i)
          if(xows_cli_priv_has(room.occu[i]))
            xows_cli_fw_occupull(room.occu[i]);

        // Reset Room occupant list
        room.occu.length = 0;

        // Forward Room exit signal
        xows_cli_fw_mucexit(room, mucx);

        return; //< nothing else to do
      }
    }
  }

  // Get occupant object if exists
  let occu = xows_cli_occu_get(room, from, ocid);

  // Check wheter the occupant is to be removed
  if(occu && show === XOWS_SHOW_OFF) {

    // Check whether this is nickname change rather than true departure
    if(mucx.code.includes(303)) {

      // We add an extra ad-hoc property in mucx object
      // to forward old occupant address to GUI allowing
      // to perform proper document id switch.
      mucx.prev = occu.addr;

      // Change occupant nickname
      occu.name = mucx.nick;

      // Update occupant address
      const addr = room.addr + "/" + occu.name;
      occu.addr = addr;
      occu.jlck = addr;

      // Change Room "join" address for own nick changes
      if(occu.self)
        room.join = addr;

    } else {

      // set show off for last update
      occu.show = show;

      // Forward removed Private Conversation
      if(xows_cli_priv_has(occu))
        xows_cli_fw_occupull(occu);

      // Forward removed Occupant
      xows_cli_fw_mucpull(occu);

      return; //< return now
    }
  }


  if(occu) {
    // Update Occupant
    occu.name = xows_jid_resc(from);
    occu.jful = mucx.jful; //< The real JID, may be unavailable
    occu.jbar = mucx.jful ? xows_jid_bare(mucx.jful) : null; //< Real bare JID;
  } else {
    // Create new Occupant object
    occu = xows_cli_occu_new(room, from, ocid, mucx.jful, null, self);
  }

  // Set or update Present and MucUser elements
  occu.show = show;
  occu.stat = stat;
  occu.affi = mucx.affi;
  occu.role = mucx.role;

  // Update self Role and Affiliation with Room
  if(self) {
    room.affi = mucx.affi;
    room.role = mucx.role;
  }

  let load_mask = 0;

  // We got Avatar hash in presence (probably via XEP-0398)
  if(typeof phot === "string") {
    if(phot.length > 0) { // Empty string mean no avatar
      if(xows_cach_avat_has(phot)) {
        occu.avat = phot; //< We already got this one
      } else {
        load_mask |= XOWS_FETCH_AVAT; //< Non-cached data, fetch it
      }
    } else {
      occu.avat = null;
    }
  } else if(!occu.avat) { //< If occupant  have no avatar, try to get one

    // PEP notify doesn't work in MUC context, so we fetch avatar anyway
    load_mask |= XOWS_FETCH_AVAT;
  }

  // Fetch data and push Occupant
  xows_load_task_push(occu, load_mask, xows_cli_peer_push, mucx);
}

/**
 * Handles received presence (<presence> stanza) error
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {object}    error     Error generic data
 */
function xows_cli_pres_onfail(from, error)
{
  // Retreive related Peer (Contact or Room)
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_ROOM);
  if(!peer) {
    xows_log(1,"cli_xmp_onpreserr","unknown/unsubscribed JID",from);
    return;
  }

  // Check for Romm join error
  if(peer.type === XOWS_PEER_ROOM) {

    // Forward join error
    xows_cli_fw_mucjoin(peer, null, error);

  } else if(peer.type === XOWS_PEER_CONT) {

    let text;
    switch(error.name)
    {
    case "remote-server-not-found":
      text = "Remote server not found";
      break;
    default:
      text = "Server error";
      break;
    }

    // Forward contact error
    xows_cli_fw_contpush(peer, text);
  }
}

/**
 * Handles an incoming room notification codes
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {number[]}  codes     Notification status codes
 */
function xows_cli_muc_onnoti(id, from, codes)
{
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_xmp_onsubject","unknown/unsubscribed JID",from);
    return;
  }

  for(let i = 0; i < codes.length; ++i) {
    switch(codes[i])
    {
    case 170: break; // Room logging is now enabled
    case 171: break; // Room logging is now disabled
    case 172: break; // Room is now non-anonymous
    case 173: break; // Room is now semi-anonymous
    }
  }

  // Room configuration changes notification
  if(codes.includes(104))
    xows_cli_muc_info_query(room);
}

/**
 * Handles an incoming message subject
 *
 * @param   {string}  id        Message ID
 * @param   {string}  from      Sender JID
 * @param   {string}  subj      Subject content
 */
function xows_cli_muc_onsubj(id, from, subj)
{
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_xmp_onsubject","unknown/unsubscribed JID",from);
    return;
  }

  room.subj = subj;

  // Forward received Room subject
  xows_cli_fw_mucsubj(room, subj);

  // Subject is the last thing sent after room join, we use it as
  // signal that we received all presences and history messages
  // following a newly joined room.
  xows_load_task_done(room, XOWS_AWAIT_SUBJ);
}

/**
 * Change own nickname in specified Room
 *
 * @param   {object}    room      Room object
 * @param   {string}    nick      New nickname
 */
function xows_cli_muc_nick_set(room, nick)
{
  // Compose destination using Room JID and nickname
  let to = room.addr + "/" + nick;

  // Send new presence with new Nickname
  xows_xmp_presence_send(to, null, xows_cli_self.show, xows_cli_self.stat, null, null, xows_cli_self.avat);
}

/**
 * Set subject for the specified room.
 *
 * @param   {object}    room      Recipient Room
 * @param   {string}    subj      Subject content
 */
function xows_cli_muc_subj_set(room, subj)
{
  // Send message with subject
  xows_xmp_muc_subject_send(room.addr, subj);
}

/**
 * Change room occupant affiliation
 *
 * @param   {object}    occu      Room occupant
 * @param   {number}    affi      Affiliation value to set
 */
function xows_cli_muc_affi_set(occu, affi)
{
  xows_xmp_muc_affi_set_query(occu.room.addr, {"jid":occu.jbar,"affi":affi}, null);
}

/**
 * Change room occupant role
 *
 * @param   {object}    occu      Room occupant
 * @param   {number}    role      Role value to set
 */
function xows_cli_muc_role_set(occu, role)
{
  xows_xmp_muc_role_set_query(occu.room.addr, {"nick":occu.name,"role":role}, null);
}

/**
 * Map object for user Room get config query result
 */
const xows_cli_muc_cfg_param = new Map();

/**
 * Parse result for MUC room configuration form query
 *
 * @param   {string}    from      Result sender JID
 * @param   {object[]}  xform     Array of x fata form
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_muc_cfg_get_parse(from, xform, error)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_get_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Retreive onresult callback
  const onresult = xows_cli_muc_cfg_param.get(room);

  // Forward Room Owner config form
  if(xows_isfunc(onresult))
    onresult(room, xform);

  // Allow new query
  xows_cli_muc_cfg_param.delete(room);
}

/**
 * Query MUC Room config form (current config)
 *
 * @param   {string}    room      Room object to query conf
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_cfg_get(room, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_cfg_param.has(room))
    return;

  xows_cli_muc_cfg_param.set(room, onresult);  //< set the onresult function
  xows_xmp_muc_cfg_get_guery(room.addr, xows_cli_muc_cfg_get_parse);
}

/**
 * Function to proceed result of MUC room configuration form submition
 *
 * @param   {string}    from      Result sender JID
 * @param   {string}    type      Result type
 * @param   {string}    error     Error data if any
 */
function xows_cli_muc_cfg_set_parse(from, type, error)
{
  if(type !== "result")
    return;

  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_set_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Retreive onresult callback
  const onresult = xows_cli_muc_cfg_param.get(room);

  // Forward submit result
  if(xows_isfunc(onresult))
    onresult(room, type);

  // Notice: room.init is set to false AFTER call to callback to
  // prevent double-cancel (that throw bad-request error) by GUI
  // during initial config procedure.

  // Room configured, no longer need init process.
  room.init = false;

  // Allow new query
  xows_cli_muc_cfg_param.delete(room);
}

/**
 * Cancel MUC room configuration form
 *
 * @param   {string}    room      Room object to query conf
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_cfg_set_cancel(room, onresult)
{
  xows_xmp_muc_cfg_set_cancel(room.addr, onresult);
}

/**
 * Submit MUC Room config form
 *
 * @param   {string}    room      Room object to query conf
 * @param   {object[]}  submit    Array of fulfilled x fata form to submit
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_cfg_set(room, form, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_cfg_param.has(room))
    return;

  xows_cli_muc_cfg_param.set(room, onresult); //< set the onresult function
  xows_xmp_muc_cfg_set_query(room.addr, form, xows_cli_muc_cfg_set_parse);
}

/**
 * Map for MUC Room registration parameters
 */
const xows_cli_muc_regi_param = new Map();

/**
 * Handle MUC Room registration request form submit result
 *
 * @param   {object}    from      Send JID or adress
 * @param   {object}    data      Replied registration data
 * @param   {object[]}  form      x:data form to be fulfilled
 * @param   {object}    error     Error data if any
 */
function xows_cli_muc_regi_set_result(from, type, error)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_register_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Get parameters
  const param = xows_cli_muc_regi_param.get(room);

  if(type !== "error")
    // Set room reserved nickname
    room.nick = param.nick;

  if(xows_isfunc(param.onresult))
    param.onresult(room, type, error);

  xows_cli_muc_regi_param.delete(room);
}

/**
 * Handle MUC Room registration request form query result
 *
 * @param   {object}    from      Send JID or adress
 * @param   {object}    data      Replied registration data
 * @param   {object[]}  form      x:data form to be fulfilled
 * @param   {object}    error     Error data if any
 */
function xows_cli_muc_regi_get_result(from, data, form, error)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_register_parse","unknown/unsubscribed Room",from);
    return;
  }

  // Get parameters
  const param = xows_cli_muc_regi_param.get(room);

  // Check if we got an error on trying to register already
  if(error) {
    if(xows_isfunc(param.onresult))
      param.onresult(room, "error", error);

    xows_cli_muc_regi_param.delete(room);
    return;
  }

  // Check if we got already-registered response
  if(data.registered) {

    // Set room reserved nickname
    room.nick = param.nick;

    if(xows_isfunc(param.onresult))
      param.onresult(room, "registered", null);

    xows_cli_muc_regi_param.delete(room);
    return;
  }

  if(form) {
    // Fulfill the form with proper informations
    for(let i = 0, n = form.length; i <n; ++i) {
      if(form[i]["var"] === "muc#register_roomnick") form[i].value = [param.nick];
    }
  }

  // Send room register fields and values
  xows_xmp_regi_set_query(from, null, form, xows_cli_muc_regi_set_result);
}

/**
 * Query for MUC Room registration request
 *
 * @param   {object}    room      Room object to join
 * @param   {object}    nick      Reserved nickname to register
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_regi_get_query(room, nick, onresult)
{
  if(xows_cli_muc_regi_param.has(room))
    return;

  xows_cli_muc_regi_param.set(room, {"onresult":onresult,"nick":nick});

  // Send request for Room register (will respond by xform)
  xows_xmp_regi_get_query(room.addr, xows_cli_muc_regi_get_result);
}

/* -------------------------------------------------------------------
 *
 * Client API - Self account management
 *
 * -------------------------------------------------------------------*/
/**
 * Change own account password temporary saved data
 */
const xows_cli_regi_chpas_data = {"onresult":null,"password":null,"attempt":0};

/**
 * Function to handle own account password query result.
 *
 * First attempt may fail with server requesting to fulfill informations, this
 * function automatically respond with fullfilled x-data form, including
 * username and old passord.
 *
 * If the second try with fulfilled x-data form also fail, the onparse function
 * is then called with error result.
 *
 * @param   {string}    type      Query result type
 * @param   {object[]}  xform     Parsed x-data form if any (or null)
 * @param   {object}   [error]    Error data if any
 */
function xows_cli_regi_chpas_parse(type, xform, error)
{
  const data = xows_cli_regi_chpas_data;

  // First query has good chances to be an error with x-data form to fulfill
  if(type === "error") {

    if(data.attempt > 0) {
      // forward error
      if(xows_isfunc(data.onparse))
        data.onparse(type, error);
    }

    if(xform) {
      // fulfill x-data form
      for(let i = 0; i < xform.length; ++i) {
        if(xform[i]["var"] === "username") xform[i].value = [xows_xmp_auth.user];
        if(xform[i]["var"] === "old_password") xform[i].value = [xows_xmp_auth.pass];
        if(xform[i]["var"] === "password") xform[i].value = [data.password];
      }
    }

    // increase attempt count
    data.attempt++;

    // Re-send query with fulfilled xform
    xows_xmp_regi_pass_set_query(null, null, xform, xows_cli_regi_chpas_parse);

  } else {

    // Change current session Password to allow proper connexion loss recover
    xows_xmp_auth.pass = data.password;

    // forward result
    if(xows_isfunc(data.onparse))
      data.onparse(type, null);

    // reset data
    data.password = null;
  }
}

/**
 * Change own account password
 *
 * @param   {string}    password  New password to set
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_cli_regi_chpas(password, onparse)
{
  const data = xows_cli_regi_chpas_data;

  data.onparse = onparse;
  data.password = password;
  data.attempt = 0;

  xows_xmp_regi_pass_set_query(password, null, xows_cli_regi_chpas_parse);
}

/**
 * Function to handle own account password query result.
 *
 * First attempt may fail with server requesting to fulfill informations, this
 * function automatically respond with fullfilled x-data form, including
 * username and old passord.
 *
 * If the second try with fulfilled x-data form also fail, the onparse function
 * is then called with error result.
 *
 * @param   {string}    type      Query result type
 * @param   {object[]}  form      Parsed x-data form if any (or null)
 * @param   {object}    error     Error data if any
 */
/*
function xows_cli_regi_remove_parse(type, form, error)
{
  const data = xows_cli_regi_chpass_data;

  // First query has good chances to be an error with x-data form to fulfill
  if(type === "error") {

    if(data.attempt > 0) {
      // forward error
      if(xows_isfunc(data.onparse))
        data.onparse(type, error);
    }

    if(form) {
      // fulfill x-data form
      for(let i = 0; i < form.length; ++i) {
        if(form[i]["var"] === "username") form[i].value = [xows_xmp_auth.user];
        if(form[i]["var"] === "password") form[i].value = [xows_xmp_auth.pass];
      }
    }

    // increase attempt count
    data.attempt++;

    // Re-send query with fulfilled form
    xows_xmp_regi_pass_set_query(null, null, form, xows_cli_regi_chpass_parse);

  } else {

    // Change current session Password to allow proper connexion loss recover
    xows_xmp_auth.pass = data.password;

    // forward result
    if(xows_isfunc(data.onparse))
      data.onparse(type, null);

    // reset data
    data.password = null;
  }
}
*/

/**
 * Cancel registration with server (account deletion)
 *
 * @param   {object[]} [xform]    Optional x-data form to submit
 * @param   {function} [onparse]  Optional callback to receive query result
 */
function xows_cli_regi_remove(xform, onparse)
{
  xows_xmp_regi_remove_query(xform, onparse);
}

/* -------------------------------------------------------------------
 *
 * Client API - Multimedia Calls
 *
 * -------------------------------------------------------------------*/
/* -------------------------------------------------------------------
 * Client API - Multimedia Calls - Client interface
 * -------------------------------------------------------------------*/
const XOWS_CALL_INBD = true;  //< inbound call
const XOWS_CALL_OUBD = false; //< outbound call

const XOWS_CALL_HGUP = 0;     //< hung up call (initial or final state)
const XOWS_CALL_RING = 1;     //< inbound ringing call
const XOWS_CALL_PEND = 2;     //< pending negotation (initiated or answered)
const XOWS_CALL_CNTD = 3;     //< connected

/**
 * Callback function for Multimedia Call offer from Remote Peer
 */
let xows_cli_fw_calloffer = function() {};

/**
 * Callback function for Multimedia Callee answer from Remote Peer
 */
let xows_cli_fw_callanwse = function() {};

/**
 * Callback function for Multimedia Call session established
 */
let xows_cli_fw_callstate = function() {};

/**
 * Callback function for Multimedia Call session Terminated
 */
let xows_cli_fw_calltermd = function() {};

/**
 * Callback function for Multimedia Call session Error
 */
let xows_cli_fw_callerror = function() {};

/**
 * Multimedia Call per-Peer sessions data storage map
 */
const xows_cli_call_db = new Map();

/**
 * Create new session data for Multimedia Call
 *
 * This function also create a new instance of RTCPeerConnection object
 * dedicated to that session.
 *
 * @param   {object}    peer    Peer object
 * @param   {number}    dir     Call direction (Inboud or Outbound)
 * @param   {number}    ste     Initial call state
 *
 * @return  {object}    Session data object
 */
function xows_cli_call_create(peer, dir, ste)
{
  // Create new RTC Peer Connection object
  const rpc = xows_wrtc_new(xows_cli_extsvc_get("stun","turn"),
                               xows_cli_wrtc_onsdesc,
                               xows_cli_wrtc_ontrack,
                               xows_cli_wrtc_onstate,
                               xows_cli_wrtc_onerror,
                               peer);

  // Create session data object
  const session =  {
    "sid" : null,   //< Jingle SID
    "ste" : ste     //< Call session state
  };

  xows_def_readonly(session,"dir",dir);
  xows_def_readonly(session,"rpc",rpc);
  xows_def_readonly(session,"loc",{"pnd":false, "sdp": null, "str":null});
  xows_def_readonly(session,"rmt",{"pnd":false, "sdp": null, "str":null});

  Object.seal(session); //< prevet structure modification

  // Add session object to database
  xows_cli_call_db.set(peer, session);

  return session;
}

/**
 * Returns whether call session with peer exists
 *
 * @return  {boolean}   True if session exists, false otherwise
 */
function xows_cli_call_exists(peer)
{
  return xows_cli_call_db.has(peer);
}

/**
 * Returns count of existing call sessions (active or not)
 *
 * @return  {number}    Count of call sessions
 */
function xows_cli_call_count()
{
  return xows_cli_call_db.size;
}

/**
 * Returns whether a call session exists, meaning call buzy.
 *
 * @return  {boolean}    True if buzy, false otherwise
 */
function xows_cli_call_buzy()
{
  for(const sess of xows_cli_call_db.values()) {
    if(sess.ste >= XOWS_CALL_PEND)
      return true;
  }

  return false;
}

/**
 * Returns whether a call session is a missed (not answered)
 * incomming call.
 *
 * @return  {boolean}    True if missed, false otherwise
 */
function xows_cli_call_misd(peer)
{
  const sess = xows_cli_call_db.get(peer);

  // Check for inbound terminated call
  if(sess.dir === XOWS_CALL_INBD && sess.ste === XOWS_CALL_HGUP) {
    // No local SDP mean we never answered the call
    return !sess.loc.sdp;
  }

  return false;
}

/**
 * Get Multimedia Call session media constraints
 *
 * Depending situation, the function will either returns local, remote or
 * best-possible media constraints for this session:
 *
 *    - If the remote SDP is the only one available (inbound call invite),
 *      the remote medias are returned.
 *
 *    - If the local SDP is the only one available (oubound call invite),
 *      the local medias are returned.
 *
 *    - If both local and remote SPD are available, constraints are crossed
 *      to selecte only those available on both sides.
 *
 * @param   {object}    peer    Peer object
 *
 * @return  {object}  Minimalist constraint description object
 */
function xows_cli_call_medias(peer)
{
  const sess = xows_cli_call_db.get(peer);

  let remot;
  if(sess.rmt.str) {
    remot = { audio : sess.rmt.str.getAudioTracks().length > 0,
              video : sess.rmt.str.getVideoTracks().length > 0 };
  } else
  if(sess.rmt.sdp) {
    remot = xows_sdp_get_medias(sess.rmt.sdp);
  }

  let local;
  if(sess.loc.str) {
    local = { audio : sess.loc.str.getAudioTracks().length > 0,
              video : sess.loc.str.getVideoTracks().length > 0 };
  } else
  if(sess.loc.sdp) {
    local = xows_sdp_get_medias(sess.loc.sdp);
  }

  let offer = (sess.dir === XOWS_CALL_INBD) ? remot : local;
  let answe = (sess.dir === XOWS_CALL_INBD) ? local : remot;

  // If answer is available, keep only the reciprocal.
  if(answe) {
    offer.audio = offer.audio && answe.audio;
    offer.video = offer.video && answe.video;
  }

  return offer;
}

/**
 * Returns whether session was initialized as an inbound call
 *
 * @param   {object}    peer    Peer object
 *
 * @return  {object}  True if sessession is an inbound call, false otherwise
 */
function xows_cli_call_is_inbd(peer)
{
  return (xows_cli_call_db.get(peer).dir === XOWS_CALL_INBD);
}

/**
 * Returns whether session is or was ever in connected state
 *
 * @param   {object}    peer    Peer object
 *
 * @return  {object}  True if sessession connected, false otherwise
 */
function xows_cli_call_is_cntd(peer)
{
  return (xows_cli_call_db.get(peer).ste === XOWS_CALL_CNTD);
}

/**
 * Returns Peer list of all open sessions
 *
 * @return  {object[]}    Array of Peer objects
 */
function xows_cli_call_peer_list()
{
  return Array.from(xows_cli_call_db.keys());
}

/**
 * Mute or unmute the specified local (self) media stream.
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    media   Media to mute, either audio or video
 * @param   {boolean}   mute    True ot mute, false ot unmute
 */
function xows_cli_call_self_mute(peer, media, mute)
{
  if(!xows_cli_call_db.has(peer))
    return;

  const sess = xows_cli_call_db.get(peer);

  // get local stream
  const stream = sess.loc.str;
  let tracks;

  // Get propers tracks
  switch(media)
  {
  case "video": tracks = stream.getVideoTracks(); break;
  case "audio": tracks = stream.getAudioTracks(); break;
  default: tracks = stream.getTracks(); break;
  }

  // Enable/disable tracks
  for(let i = 0; i < tracks.length; ++i)
    tracks[i].enabled = !mute;

  // Send "mute/unmute" session info to Peer
  const info = mute ? "mute" : "unmute";
  xows_xmp_jing_info(peer.jrpc, sess.sid, info, {name:media}, xows_cli_call_jing_parse);
}

/**
 * Hold or unhold the specified remote (peer) media stream.
 *
 * Holding a remote Peer actualy mute audio (but not video) stream and
 * sends hold/uhold session-info to Peer.
 *
 * @param   {object}    peer    Peer object
 * @param   {boolean}   mute    True ot mute, false ot unmute
 */
function xows_cli_call_self_hold(peer, media, mute)
{
  if(!xows_cli_call_db.has(peer))
    return;

  const sess = xows_cli_call_db.get(peer);

  // get local stream
  const stream = sess.rmt.str;
  const tracks = stream.getAudioTracks();

  // Enable/disable stracks
  for(let i = 0; i < tracks.length; ++i)
    tracks[i].enabled = !mute;

  // Send "mute/unmute" session info to Peer
  const info = mute ? "hold" : "unhold";
  xows_xmp_jing_info(peer.jrpc, sess.sid, info, xows_cli_call_jing_parse);
}

/**
 * Clear and delete session data for Multimedia Call
 *
 * This function properly delete resources and data related to Call session.
 *
 * @param   {object}    peer    Peer object
 */
function xows_cli_call_clear(peer)
{
  if(!xows_cli_call_db.has(peer))
    return;

  const sess = xows_cli_call_db.get(peer);

  // Stop streams
  if(sess.loc.str) {
    const tracks = sess.loc.str.getTracks();
    for(let i = 0; i < tracks.length; ++i)
      tracks[i].stop();
  }

  // Stop streams
  if(sess.rmt.str) {
    const tracks = sess.rmt.str.getTracks();
    for(let i = 0; i < tracks.length; ++i)
      tracks[i].stop();
  }

  // Close RTC connection
  if(sess.rpc)
    xows_wrtc_close(sess.rpc);

  // Delete sessions data
  xows_cli_call_db.delete(peer);

  // Reset Peer Locked JID
  peer.jrpc = null;
}

/**
 *
 * Offer (invite) Multimedia Call to the specified Peer
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    stream  Local input media stream
 */
function xows_cli_call_self_invite(peer, stream)
{
  // Select most suitable full JID
  peer.jrpc = xows_cli_best_resource(peer);

  // Create new (outbound) session dataset for Peer
  const sess = xows_cli_call_create(peer, XOWS_CALL_OUBD, XOWS_CALL_PEND);

  // Set session RPC and local stream
  sess.loc.str = stream;

  // Set RTC local stream, then wait for RTC to generate a local SDP
  // that will be passed to 'xows_cli_wrtc_onsdesc' callback
  xows_wrtc_set_local_stream(sess.rpc, stream);
}

/**
 * Answer (accept) Multimedia Call from the specified Peer
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    stream  Local input media stream
 */
function xows_cli_call_self_accept(peer, stream)
{
  if(!xows_cli_call_db.has(peer)) {
    xows_log(1,"cli_call_accept","No open session for",peer.addr);
    return;
  }

  // Get existing (inbound) session dataset for Peer
  const sess = xows_cli_call_db.get(peer);

  // Change call session state
  sess.ste = XOWS_CALL_PEND;

  // Set session local stream
  sess.loc.str = stream;

  // Set RTC remote SDP, then wait for RTC to generate remote Stream
  // that will be passed to 'xows_cli_wrtc_ontrack' callback
  xows_wrtc_set_local_stream(sess.rpc, stream);
}

/**
 * Hangup (terminate) Multimedia Call with the specified Peer
 *
 * The possibles values for the reason parameter are the following:
 *  - "success" : Normal termination of established call
 *  - "busy"    : Rejection of incoming call because already in call
 *  - "decline" : Rejection of incoming call because of user choice
 *
 * If the reason parameter is left to null or undefined, "success" is sent
 * by default.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}   [reason]   Reason string for call termination
 */
function xows_cli_call_self_hangup(peer, reason)
{
  if(!xows_cli_call_db.has(peer))
    return;

  // Get session data
  const sess = xows_cli_call_db.get(peer);

  // Send Jingle session terminate
  if(sess.sid) {
    if(!reason) reason = "success";
    xows_xmp_jing_terminate(peer.jrpc, sess.sid, reason);
  }

  // Clear call session
  xows_cli_call_clear(peer);
}

/**
 * Handle received Multimedia Call offer (invite) from the specified Peer
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    from    Peer full JID used for session initiate
 * @param   {string}    sid     Jingle session SID
 * @param   {string}    sdp     Received (parsed) SDP string
 */
function xows_cli_call_peer_invite(peer, from, sid, sdp)
{
  peer.jrpc = from;

  if(peer.type === XOWS_PEER_OCCU) {
    // This is Room Occupant private message, if no PM session exist
    // and was actually added in PM list, we Forward PM session creation
    if(xows_cli_priv_add(peer))
      xows_cli_fw_occupush(peer);
  }

  // Create new (inbound) session dataset for Peer
  const sess = xows_cli_call_create(peer, XOWS_CALL_INBD, XOWS_CALL_RING);

  // Set session SID and remote SDP
  sess.sid = sid;
  sess.rmt.sdp = sdp;

  // Set RTC remote SDP, then wait for RTC to generate remote Stream
  // that will be passed to 'xows_cli_wrtc_ontrack' callback
  xows_wrtc_set_remote_sdp(sess.rpc, sdp);
}

/**
 * Handle received Multimedia Call answer (accept) from the specified Peer
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    sdp     Received (parsed) SDP string
 */
function xows_cli_call_peer_accept(peer, sdp)
{
  // Get session data
  const sess = xows_cli_call_db.get(peer);

  // Set remote SDP
  sess.rmt.sdp = sdp;

  // Set RTC remote SDP, then wait for RTC to generate remote Stream
  // that will be passed to 'xows_cli_wrtc_ontrack' callback
  xows_wrtc_set_remote_sdp(sess.rpc, sdp);
}

/**
 * Handle received Multimedia Call termination from the specified Peer
 *
 * @param   {object}    peer    Peer object
 * @param   {string}    reason  Received termination reason
 */
function xows_cli_call_peer_hangup(peer, reason)
{
  // Set session as disconnected
  xows_cli_call_db.get(peer).ste = XOWS_CALL_HGUP;

  // Forward signaling (BEFORE destroying session)
  xows_cli_fw_calltermd(peer, reason);

  // Clear call session
  xows_cli_call_clear(peer);
}

/**
 * Terminate all living Multimedia Call and clear all data
 */
function xows_cli_call_hangup_all()
{
  for(const peer of xows_cli_call_db.keys()) {
    // Terminate all session
    xows_cli_call_self_hangup(peer, "success");
  }
}

/* -------------------------------------------------------------------
 * Client API - Multimedia Calls - Jingle routines
 * -------------------------------------------------------------------*/
/**
 * Handles an incoming Jingle session signaling
 *
 * The data parameter content depend on Jingle action type:
 *  - session-initiate  : Parsed SDP Offer string
 *  - session-accept    : Parsed SDP Answer string
 *  - session-terminate : Termination reason payload
 *  - session-info      : Information payload
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    id        XMPP Request id
 * @param   {string}    sid       Jingle session SID
 * @param   {string}    action    Jingle session Action
 * @param   {string}    data      Extracted data
 */
function xows_cli_call_jing_onrecv(from, id, sid, action, data)
{
  // Retreive related Peer
  const peer = xows_cli_peer_get(from, XOWS_PEER_ANY);
  if(!peer) {
    xows_log(1,"cli_xmp_onjingle","refused "+action,"from unknow peer: "+from);
    xows_xmp_iq_error_send(id, from, "cancel", "service-unavailable");
    return;
  }

  // Check for existing Peer session
  const sess = xows_cli_call_db.get(peer);

  // Check for correct SID
  if(sess && sess.sid && sess.sid !== sid) {
    xows_log(1,"cli_xmp_onjingle","Invalid SID from",from);
    xows_xmp_jing_error(id, from, "cancel", "unknown-session", "item-not-found");
    return;
  }

  if(action === "session-initiate") {
    if(sess && sess.dir === XOWS_CALL_OUBD) { //< We already send or preparing an offer
      // FIXME : https://xmpp.org/extensions/xep-0166.html#def-action-ties
      xows_log(1,"cli_xmp_onjingle","Unexpected offer from",from);
      xows_xmp_jing_error(id, from, "cancel", "tie-break", "conflict");
      return;
    }
  } else {
    if(!sess) {
      xows_log(1,"cli_xmp_onjingle","Unknow SID from",from);
      xows_xmp_jing_error(id, from, "cancel", "unknown-session", "item-not-found");
      return;
    }
    if(action === "session-accept") {
      if(sess.rmt.sdp || sess.dir === XOWS_CALL_INBD) {  //< We alread got an answer or an offer
        xows_log(1,"cli_xmp_onjingle","Unexpected offer from",from);
        xows_xmp_jing_error(id, from, "cancel", "out-of-order", "unexpected-request");
        return;
      }
    }
  }

  switch(action)
  {
  case "session-initiate": {
      // Handle received call Offer
      xows_cli_call_peer_invite(peer, from, sid, data);
    } break;

  case "session-accept": {
      // Handle received call Answer
      xows_cli_call_peer_accept(peer, data);
    } break;

  case "session-info": {
      switch(data)
      {
      case "ringing":
      case "active":
      case "hold":
      case "unhold":
      case "mute":
      case "unmute":
        // Do nothing, simply forward info
        break;
      default:
        // If the party that receives an informational message does not understand
        // the payload, it MUST return a <feature-not-implemented/> error with a
        // Jingle-specific error condition of <unsupported-info/>.
        xows_xmp_jing_error(id, from, "cancel", "unsupported-info", "feature-not-implemented");
        return;
      }
      // Forward signaling as state
      xows_cli_fw_callstate(peer, data);
    } break;

  case "session-terminate": {
      // Handle received call Terminate
      xows_cli_call_peer_hangup(peer, data);
    } break;

  default:
    xows_xmp_iq_error_send(id, from, "cancel", "bad-request"); //< Send back iq error
    break;
  }

  // Acknoledge reception (send back "result" type iq)
  xows_xmp_iq_result_send(id, from);
}

/**
 * Callback function for Jingle query result parsing
 *
 * @param   {string}    from      Sender JID
 * @param   {string}    type      Result type
 * @param   {object}    error     Error data if any
 */
function xows_cli_call_jing_parse(from, type, error)
{
  // Retreive related Peer
  const peer = xows_cli_peer_get(from, XOWS_PEER_ANY);
  if(!peer) {
    xows_log(1,"cli_jing_parse","unknown/unsubscribed JID",from);
    return;
  }

  if(type === "error") {

    // Forward error
    xows_cli_fw_callerror(peer, false, error);

    // Clear call session
    xows_cli_call_clear(peer);
  }
}

/* -------------------------------------------------------------------
 * Client API - Multimedia Call - WebRTC routines
 * -------------------------------------------------------------------*/
/**
 * Handle WebRTC available Session Description (SDP) for Multimedia Call
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {string}      sdp       SDP string, either Offer or Answer
 * @param   {object}      peer      Session related Peer object
 */
function xows_cli_wrtc_onsdesc(rpc, sdp, peer)
{
  // Retreive Peer session
  const sess = xows_cli_call_db.get(peer);

  // Set local SDP in session dataset
  sess.loc.sdp = sdp;

  // Check whether session is inbound or outbound
  if(sess.dir === XOWS_CALL_INBD) {
    // SDP is an Answer for remote caller
    xows_log(2,"cli_wrtc_onsdesc","Sending SPD answer to",peer.addr);

    // Send SDP answer via Jingle, then wait for remote peer RTC
    // to connect, final step handled in 'xows_cli_wrtc_onstate'
    xows_xmp_jing_accept_sdp(peer.jrpc, sess.sid, sdp, xows_cli_call_jing_parse);

  } else {
    // SDP is an Offer for remote callee
    xows_log(2,"cli_wrtc_onsdesc","Sending SPD offer to",peer.addr);

    // Send SDP offer via Jingle, then wait for remote peer Jingle
    // answer, either with session-accept or session-terminate.
    sess.sid = xows_xmp_jing_initiate_sdp(peer.jrpc, sdp, xows_cli_call_jing_parse);
  }
}

/**
 * Handle WebRTC available remote media stream track for Multimedia Call
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {obejct}      stream    Stream object
 * @param   {object}      peer      Session related Peer object
 */
function xows_cli_wrtc_ontrack(rpc, stream, peer)
{
  // Retreive Peer session
  const sess = xows_cli_call_db.get(peer);

  // Set remote Stream in session dataset
  sess.rmt.str = stream;

  if(sess.dir === XOWS_CALL_INBD) {
    xows_log(2,"cli_wrtc_ontrack","Received offer stream from",peer.addr);

    // Send "ringing" session info to Peer
    xows_xmp_jing_info(peer.jrpc, sess.sid, "ringing", xows_cli_call_jing_parse);

    // Stream follows remote Offer for local callee
    xows_cli_fw_calloffer(peer, stream);

  } else {
    xows_log(2,"cli_wrtc_ontrack","Received answer stream from",peer.addr);

    // Stream follows remote answer for local caller
    xows_cli_fw_callanwse(peer, stream);
  }
}

/**
 * Handle WebRTC state changes for Multimedia Call
 *
 * This callback receive mixed state changes from RPC connection and
 * ICE gathering process. Possible states are the following:
 *    - "gathering"  : ICE gathering in progress
 *    - "complete"   : ICE gargering finished
 *    - "connecting" : RPC connection in progress
 *    - "connected"  : RPC is connected
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {obejct}      stream    Stream object
 * @param   {object}      peer      Session related Peer object
 */
function xows_cli_wrtc_onstate(rpc, state, peer)
{
  if(state === "connected") {
    // Set session as connected
    xows_cli_call_db.get(peer).ste = XOWS_CALL_CNTD;
  }

  xows_cli_fw_callstate(peer, state);
}

/**
 * Handle WebRTC error for Multimedia Call
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {obejct}      error     Error object (DOMException)
 * @param   {object}      peer      Session related Peer object
 */
function xows_cli_wrtc_onerror(rpc, error, peer)
{
  // Presence of errorCode property mean error come from ICE gathering
  // process, typically STUN or TURN server is unreachable or returned
  // error.
  //
  // Otherwise, error is a DOMEception from the WebRTC API possibly caused
  // by (too) many different things.

  let reason;

  if(error.errorCode) {   //< ICE Gathering error
    // I am not sure failed-transport error is suitable in
    // such context, this may be corrected later.
    reason = "failed-transport";
  } else {                //< WebRTC API DOMException
    reason = "failed-application";
  }

  // Set session as disconnected
  xows_cli_call_db.get(peer).ste = XOWS_CALL_HGUP;

  // Forward error
  xows_cli_fw_callerror(peer, true, error);

  // Hang up with peer
  xows_cli_call_self_hangup(peer, reason);
}
