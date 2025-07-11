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

  let svcs;

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

  let svcs;

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
    "name": name?name:addr,     //< Display name
    "subs": subs,               //< Subscription mask
    "avat": avat,               //< Avatar hash string.
    "show": 0,                  //< Displayed presence show level
    "stat": "",                 //< Displayed presence status string
    "noti": true,               //< Notification Enabled/Mute
    "chat": 0,                  //< Chatstate level
    "jlck": addr,               //< Current Locked resource (user@domain/ressource)
    "call": null,               //< Jingle call SID
    // Peer loading process elements
    "load": 0                   //< Loading Mask
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
    return peer.jbar ? peer.jbar : peer.addr;

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
    "subj": "",             //< Room subject
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
    "nick": "",             //< Self Nickname in Room
    // Room Occupants list
    "occu": [],             //< Room occupant array
    "writ": [],             //< Chatstate writting occupants list
    // Misc options
    "noti": true,           //< Notification Enabled/Mute
    "book": false,          //< Room is Bookmarked
    // Peer loading process elements
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
    "name": nick,       //< Nickname
    "affi": 0,          //< Room affiliation
    "role": 0,          //< Room role
    "jful": jful,       //< Occupant Real Full JID (user@domain/ressource)
    "jbar": jbar,       //< Occupant Real Bare JID (user@domain)
    "avat": avat,       //< Avatar hash string.
    "show": 4,          //< Presence show level
    "stat": "",         //< Presence status string
    "chat": 0,          //< Chatstate level
    // Misc options
    "noti": true,       //< Notification Enabled/Mute
    // Peer loading process
    "load": 0           //< Loading Mask
  };

  self = self ? xows_cli_self : null;

  // set Constant properties
  xows_def_readonly(occu,"type",XOWS_PEER_OCCU);  //< Peer type
  xows_def_readonly(occu,"room",room);            //< Occupant Room reference
  xows_def_readonly(occu,"addr",addr);            //< Common Peer Address (Occupant JID: room@service/nick)
  xows_def_readonly(occu,"jlck",addr);            //< Current Locked Resource (Occupant JID)
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
  const key = ocid ? ocid : addr;
  const cach = xows_cach_peer_get(key);
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
 * Client API - Internal data - Private Message Occupants List
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
 * Client API - General Peers management routines
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
      if(type & XOWS_PEER_OCCU && jid.includes("/"))
          return room.occu.find(xows_cli_test_addr, jid);
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
        xows_cli_fw_onselfpush(peer, param);
      } else {
        // Forward Contact update
        xows_cli_fw_oncontpush(peer, param);
      }
    } break;

    case XOWS_PEER_OCCU: {
      // Forward Occupant update
      xows_cli_fw_onoccupush(peer, param);
    } break;

    case XOWS_PEER_ROOM: {
      // Forward Contact update
      xows_cli_fw_onroompush(peer, param);
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
 * Check whether user/client can subscribe or send sucribe request to the
 * specified peer.
 *
 * This function returns true if client is not already subscribed and
 * peer provide a valid contact JID.
 *
 * @param   {object}    peer      Peer object to check
 *
 * @return  {boolean}   True if user already subscribed to contact
 */
function xows_cli_can_subscribe(peer)
{
  if(peer.self)
    return false;

  switch(peer.type)
  {
  case XOWS_PEER_CONT:
    return !(peer.subs & XOWS_SUBS_TO);

  case XOWS_PEER_OCCU: {
      if(peer.jbar !== null) {
        const cont = xows_cli_cont.find(xows_cli_test_addr, peer.jbar);
        if(cont) {
          return !(cont.subs & XOWS_SUBS_TO);
        } else {
          return true;
        }
      }
    } break;
  }

  return false;
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
 * Client API - Initialization routines
 *
 * -------------------------------------------------------------------*/
/**
 * Loading process tasks bits
 */
const XOWS_LOAD_AVAT  =  xows_load_task_bit();
const XOWS_LOAD_NICK  =  xows_load_task_bit();
const XOWS_LOAD_INFO  =  xows_load_task_bit();

 /**
 * Global flag for client warmup function
 */
let xows_cli_warmed = false;

/**
 * Function that initialize some stuff for client to work properly
 */
function xows_cli_warmup()
{
  if(!xows_cli_warmed) {

    xows_load_task_set(XOWS_LOAD_AVAT, xows_cli_avat_fetch);
    xows_load_task_set(XOWS_LOAD_NICK, xows_cli_nick_query);
    xows_load_task_set(XOWS_LOAD_INFO, xows_cli_muc_roominfo_query);

    xows_cli_warmed = true;
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
 *  - roompush  : Add or refresh Roster Room
 *  - roomrem   : Remove Room/Bookmark from Roster
 *  - roomjoin  : Room Joined (initial Room's self presence)
 *  - roomexit  : Room exit (terminal Room's self presence)
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
    case "selfpush":    xows_cli_fw_onselfpush = callback; break;
    case "contpush":    xows_cli_fw_oncontpush = callback; break;
    case "contrem":     xows_cli_fw_oncontrem = callback; break;
    case "subspush":    xows_cli_fw_onsubspush = callback; break;
    case "roompush":    xows_cli_fw_onroompush = callback; break;
    case "roomrem":     xows_cli_fw_onroomrem = callback; break;
    case "roomjoin":    xows_cli_fw_onroomjoin = callback; break;
    case "roomexit":    xows_cli_fw_onroomexit = callback; break;
    case "occupush":    xows_cli_fw_onoccupush = callback; break;
    case "occurem":     xows_cli_fw_onoccurem = callback; break;
    case "privpush":    xows_cli_fw_onprivpush = callback; break;
    case "privrem":     xows_cli_fw_onprivrem = callback; break;
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
  xows_cli_priv.length = 0;
  xows_cli_services.clear();
  xows_cli_entities.clear();
  xows_cli_extservs.length = 0;

  // Store MAM parameter from options
  xows_cli_mam_max = xows_options.history_size / 2;

  // Reset client user entity
  xows_cli_self.addr = null;
  xows_cli_self.jbar = null;
  xows_cli_self.jful = null;
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
  xows_xmp_set_callback("presfail", xows_cli_xmp_onpreserr);
  xows_xmp_set_callback("rostpush", xows_cli_xmp_onrostpush);
  xows_xmp_set_callback("message", xows_cli_xmp_onmessage);
  xows_xmp_set_callback("chatstate", xows_cli_xmp_onchatstate);
  xows_xmp_set_callback("receipt", xows_cli_xmp_onreceipt);
  xows_xmp_set_callback("retract", xows_cli_xmp_onretract);
  xows_xmp_set_callback("subject", xows_cli_xmp_onsubject);
  xows_xmp_set_callback("mucnoti", xows_cli_xmp_onmucnoti);
  xows_xmp_set_callback("pubsub", xows_cli_xmp_onpubsub);
  xows_xmp_set_callback("jingle", xows_cli_xmp_onjingle);
  xows_xmp_set_callback("error", xows_cli_xmp_onerror);
  xows_xmp_set_callback("close", xows_cli_xmp_onclose);

  // Some final initialization
  xows_cli_warmup();

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
  xows_cli_self.addr = bind.jbar;
  xows_cli_self.jbar = bind.jbar;
  xows_cli_self.jful = bind.jful;

  // Check for cached information about own account
  const cach = xows_cach_peer_get(xows_cli_self.addr);
  if(cach) {
    if(cach.name) xows_cli_self.name = cach.name;
    if(cach.avat) xows_cli_self.avat = cach.avat;
    if(cach.stat) xows_cli_self.stat = cach.stat;
  }

  // Compose default name and nickname from JID
  if(xows_cli_self.name === null) {
    const userid = xows_xmp_bind.node;
    xows_cli_self.name = userid.charAt(0).toUpperCase() + userid.slice(1);
  }

  /*
  // Create default avatar if needed
  if(!xows_cli_self.avat)
    xows_cli_self.avat = xows_cli_avat_temp(xows_cli_self.addr);
  */

  if(xows_cli_connect_loss) {

    // Query for MUC room list
    xows_cli_muc_roomlist_query();

    // Recovery from connection loss, skip features & services discovery
    xows_xmp_rost_get_query(xows_cli_initialize);

  } else {

    // Start features & services discovery
    xows_cli_init_disco_start();
  }
}

/**
 * Checks wether client is connected
 *
 * @return  {boolean}   True if client is connected, false otherwise
 */
function xows_cli_connected()
{
  return (xows_cli_self.jful !== null);
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
 * Initial discovery - start discovery
 */
function xows_cli_init_disco_start()
{
  // Query for own account infos/features
  xows_xmp_disco_info_query(xows_cli_self.addr, null, xows_cli_init_discoinfo_self);
}

/**
 * Initial discovery - parse own account info
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object}   [form]     Optionnal x data form included in result
 */
function xows_cli_init_discoinfo_self(from, iden, feat, form)
{
  // Add account features
  xows_cli_entities.set(from, {"iden":iden,"feat":feat,"item":[]});

  // Query for host (server) infos/features
  xows_xmp_disco_info_query(xows_xmp_host, null, xows_cli_init_discoinfo_host);
}

/**
 * Initial discovery - parse host info
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object}   [form]     Optionnal x data form included in result
 */
function xows_cli_init_discoinfo_host(from, iden, feat, form)
{
  // Add host features
  xows_cli_entities.set(from, {"iden":iden,"feat":feat,"item":[]});

  // Query for host (server) items/services
  xows_xmp_disco_items_query(xows_xmp_host, xows_cli_init_discoitems_host);
}

/**
 * Stack for host item discovery
 */
const xows_cli_init_discoitems_stk = [];

/**
 * Initial discovery - parse host item list.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_init_discoitems_host(from, item)
{
  if(item.length) {

    const entity = xows_cli_entities.get(from);

    for(let i = 0, n = item.length; i < n; ++i) {

      const jid = item[i].jid;

      xows_log(2,"cli_init_discoitems_host","discovered item", jid);

      // Add item to host item list and stack for disco#info
      entity.item.push(jid);
      xows_cli_init_discoitems_stk.push(jid);
    }

    // Query infos for first item in stack
    xows_xmp_disco_info_query(xows_cli_init_discoitems_stk.shift(), null, xows_cli_init_discoinfo_item);

  } else {

    // No item, query for external services or finish discovery
    if(xows_cli_entity_has(xows_xmp_host, XOWS_NS_EXTDISCO)) {
      xows_xmp_extdisco_query(xows_xmp_host, null, xows_cli_init_extdisco_host);
    } else {
      xows_cli_init_disco_finish();
    }
  }
}

/**
 * Initial discovery - parse host item (service) infos
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object}   [form]     Optionnal x data form included in result
 */
function xows_cli_init_discoinfo_item(from, iden, feat, form)
{
  // Add item features
  xows_cli_entities.set(from, {"iden":iden,"feat":feat,"item":[]});

  if(xows_cli_init_discoitems_stk.length) {

    // Query infos for next item in stack
    xows_xmp_disco_info_query(xows_cli_init_discoitems_stk.shift(), null, xows_cli_init_discoinfo_item);

  } else {

    // No more item in stack, query for external services or finish discovery
    if(xows_cli_entity_has(xows_xmp_host, XOWS_NS_EXTDISCO)) {
      xows_xmp_extdisco_query(xows_xmp_host, null, xows_cli_init_extdisco_host);
    } else {
      xows_cli_init_disco_finish();
    }
  }
}

/**
 * Initial discovery - parse host external services
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  svcs      Array of parsed <service> objects
 */
function xows_cli_init_extdisco_host(from, svcs)
{
  // Copy arrays
  for(let i = 0, n = svcs.length; i < n; ++i) {

    const type = svcs[i].type;

    // Output some logs
    xows_log(2,"cli_extdisco_parse","discovered external",type+" ("+svcs[i].host+":"+svcs[i].port+")");

    // Add external service to list
    xows_cli_extservs.push(svcs[i]);
  }

  // finish discovery
  xows_cli_init_disco_finish();
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
function xows_cli_init_disco_finish()
{
  // Check for main XMPP server features
  const serv_infos = xows_cli_entities.get(xows_xmp_host);

  // Check for message carbons
  if(serv_infos.feat.includes(XOWS_NS_CARBONS))
    xows_xmp_carbons_query(true, null);

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

  // Query for MUC room list
  xows_cli_muc_roomlist_query();

  // Query for roster and finish initialization
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
        xows_cli_muc_join_retry(xows_cli_room[i]);
      }
    }

  } else {

    // This is a full/normal initialization

    // Fetch own data and push
    xows_load_init(xows_cli_self, XOWS_LOAD_AVAT|XOWS_LOAD_NICK, xows_cli_peer_push);
  }

  // Set On-Empty load stack trigger, so connection is validated
  // only once all resources/peer are fully loaded. We set a timeout
  // of 2 seconds in case something went wrong in loading process.
  xows_load_onempty_set(2000, xows_cli_fw_onconnect, xows_cli_self);
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
    if(xows_cli_self.jful) {

      // Output log
      xows_log(1,"cli_xmp_onclose","session destroy",mesg);

      // Clean the client data
      xows_cli_cont.length = 0;
      xows_cli_room.length = 0;

      // Reset client user entity
      xows_cli_self.jful = null;
      xows_cli_self.addr = null;
      xows_cli_self.jbar = null;
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
  if(!xows_cli_self.jful)
    return;

  xows_log(2,"cli_disconnect","prepare disconnect");

  // No more connection loss
  xows_cli_connect_loss = false;

  // Terminate call session if any
  xows_cli_jing_terminate();

  // Client is now Offline
  xows_cli_show_select(0);

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
 * @param   {string}    addr      Contact JID
 * @param   {string}    name      Contact Displayred name
 * @param   {number}    subs      Contact subscription
 * @param   {string}    group     Contact group (not used yet)
 */
function xows_cli_xmp_onrostpush(addr, name, subs, group)
{
  let cont = xows_cli_cont_get(addr);

  if(subs === XOWS_SUBS_REM) {
    // Sepecial case if we receive a 'remove' subscription
    if(cont) xows_cli_fw_oncontrem(cont); //< Forward contact to remove
    return;
  }

  if(cont) {

    cont.name = name ? name : addr;
    cont.subs = subs;

  } else {

    let avat = null;

    // Check for stored data in cache (localStorage)
    const cach = xows_cach_peer_get(addr);
    if(cach) {
      name = cach.name;
      avat = cach.avat;
    }

    // Create new contact
    cont = xows_cli_cont_new(addr, name, subs, avat);
  }

  let load_mask = 0;

  if(cont.subs & XOWS_SUBS_TO)
    load_mask |= XOWS_LOAD_AVAT|XOWS_LOAD_NICK;

  // Fetch data and push Contact
  xows_load_init(cont, load_mask, xows_cli_peer_push);
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
      xows_cli_xmp_onrostpush(item[i].jid, item[i].name, item[i].subs, item[i].group);
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
 * @param   {string}    addr      Item JID to add
 * @param   {string}    name      Displayed name for item or null
 */
function xows_cli_rost_edit(addr, name)
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
let xows_cli_fw_onsubspush = function() {};

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
function xows_cli_xmp_onpresence(from, show, prio, stat, node, phot)
{
  const cont = xows_cli_cont_get(from);
  if(!cont) {
    // prevent warning for own presence report
    if(!xows_cli_isself_addr(from))
      xows_log(1,"cli_xmp_onpresence","unknown/unsubscribed Contact",from);
    return;
  }

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
  // Set default show level and status
  cont.show = XOWS_SHOW_OFF;
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

  let load_mask = 0;

  if(cont.show > XOWS_SHOW_OFF) {

    // We got Avatar hash in presence (probably via XEP-0398)
    if(phot) {
      if(phot.length > 0) { // Empty string mean no avatar
        if(xows_cach_avat_has(phot)) {
          cont.avat = phot; //< We already got this one
        } else {
          //xows_cli_avat_fetch(cont); //< Non cached data, fetch it
          load_mask |= XOWS_LOAD_AVAT;
        }
      }
    } else if(!cont.avat) { //< If contact have no avatar, try to get one
      //xows_cli_avat_fetch(cont);
      load_mask |= XOWS_LOAD_AVAT;
    }

    // Update nickname in case changed
    //xows_cli_nick_query(cont);
    load_mask |= XOWS_LOAD_NICK;

    // Update Peer cached data
    xows_cach_peer_save(cont);
  }

  // Fetch data and push Contact
  xows_load_init(cont, load_mask, xows_cli_peer_push);
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
function xows_cli_xmp_onsubscribe(from, type, nick)
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
        xows_gui_cli_onsubspush(cont);
      }
    } break;

  case "unsubscribe": { //< Somebody revoked its subscription or has aborted its request
      if(cont) {
        // Update contact subscription
        cont.subs &= ~XOWS_SUBS_FROM;
        // Update Contact
        xows_gui_cli_oncontpush(cont);
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
        xows_gui_cli_oncontpush(cont);
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
    xows_cli_fw_oncontrem(cont);
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
let xows_cli_fw_onmessage = function() {};

/**
 * Callback function for new Private Message session
 */
let xows_cli_fw_onprivpush = function() {};

/**
 * Callback function for unavailable Private Message session
 */
let xows_cli_fw_onprivrem = function() {};

/**
 * Handles an incoming chat message with content
 *
 * @param   {object}      mesg       Message object
 * @param   {object}      error      Error data if any
 */
function xows_cli_xmp_onmessage(mesg, error)
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
    // Keep track of Occupants Private message
    if(xows_cli_priv_add(peer))
      xows_cli_fw_onprivpush(peer);
  }

  // If no time is specified set as current
  if(!mesg.time)
    mesg.time = new Date().getTime();

  // Forward received message
  xows_cli_fw_onmessage(peer, mesg, false, error);
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
function xows_cli_send_message(peer, body, repl, rpid, rpto)
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

  // Forward sent message
  xows_cli_fw_onmessage(peer, mesg, wait);
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
 * @param   {string}   [ocid]   Occumant Anonymous UID
 */
function xows_cli_xmp_onchatstate(id, from, type, state, ocid)
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
  // This may happen with Private Conversation
  if(peer.type === XOWS_PEER_OCCU && peer.show == 0)
    return;

  // Store message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  if(chat > XOWS_CHAT_PAUS) { //< composing

    if(xows_cli_chatstate_hto) {
      // Pending timeout running mean "composing" state already send
      clearTimeout(xows_cli_chatstate_hto);
    } else {
      // Send new "composing" state
      xows_xmp_message_chatstate_send(peer.jlck, type, chat);
    }

    // Create/reset a timeout to end typing state after delay
    xows_cli_chatstate_hto = setTimeout(xows_cli_chatstate_define,4000,peer,XOWS_CHAT_PAUS);

  } else {

    // Reset pending timeout
    clearTimeout(xows_cli_chatstate_hto);
    xows_cli_chatstate_hto = null;

    // Send new chat state
    xows_xmp_message_chatstate_send(peer.jlck, type, chat);
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
 * @param   {string}    usid      Unique and Stable ID of message to retract
 */
function xows_cli_xmp_onretract(id, from, type, usid)
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
  xows_cli_fw_onretract(peer, usid);
}

/**
 * Retract previous Message
 *
 * @param   {object}    peer      Related Peer object
 * @param   {string}    usid      Unique and Stable ID of message to retract
 */
function xows_cli_retract_send(peer, usid)
{
  // Store message stype according Peer type
  const type = (peer.type === XOWS_PEER_ROOM) ? "groupchat" : "chat";

  // Send retract
  xows_xmp_message_retract_send(peer.jlck, type, usid);

  // If we are in one-to-one chat, discard own message now
  if(peer.type !== XOWS_PEER_ROOM)
    xows_cli_fw_onretract(peer, usid);
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
  let type, show, stat;

  if(xows_cli_self.show > XOWS_SHOW_OFF) {
    show = xows_cli_self.show;
    stat = xows_cli_self.stat;
  } else {
    type = "unavailable";
  }

  // Simple presence to server
  xows_xmp_presence_send(null, type, show, stat);

  // Presence to all joined rooms
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].join) {
      xows_xmp_presence_send(xows_cli_room[i].join, type, show, stat);
      // Unavailable client exited the room
      if(type) xows_cli_room[i].join = null;
    }
  }

  // Cache new data and Push changes to GUI
  xows_cli_peer_push(xows_cli_self);
}

/**
 * Presence level as chosen by user
 */
let xows_cli_show_saved = XOWS_SHOW_OFF;

/**
 * Set the client current presence show level
 *
 * @param   {number}    level     Numerical show level to set (0 to 5)
 */
function xows_cli_show_select(level)
{
  // Change the show level and send to server
  xows_cli_self.show = xows_cli_show_saved = level;

  // Send own-presence with updated values
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

  // Send own-presence with updated values
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

    // Send own-presence with updated values
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

    // Send own-presence with updated values
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

  xows_cli_self.show = xows_cli_show_saved = XOWS_SHOW_OFF;
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
    xows_cli_avat_publish(access);

  } else {

    // This is avatar suppression
    if(xows_cli_self.avat) {

      // Retract previous avatar
      xows_cli_avat_retract(xows_cli_self.avat);

      // Set avatar to null
      xows_cli_self.avat = null;
    }
  }

  // Publish user nickname
  xows_cli_nick_publish();

  // Send presence with new avatar hash
  xows_cli_presence_update();
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
 * @param   {object[]}  items     Received items
 */
function xows_cli_xmp_onpubsub(from, node, items)
{
  // Checks for vcard notification
  if(node === XOWS_NS_VCARD4) {
    if(items.length) {
      // Send to vcard handling function
      xows_cli_vcard_parse(from, items[0].child);
    }
  }

  // Checks for avatar notification
  if(node === XOWS_NS_AVATAR_META) {
    if(items.length) {
      // Send to avatar metadata parsing function
      xows_cli_avat_meta_parse(from, items[0].child);
    }
  }

  // Checks for nickname notification
  if(node === XOWS_NS_NICK) {
    if(items.length) {
      // Send to nickname parsing function
      xows_cli_nick_parse(from, items[0].child);
    }
  }

  // Checks for bookmarks notification
  if(node === XOWS_NS_BOOKMARKS) {
    if(items.length) {
      // Send to bookmark parsing function
      xows_cli_book_parse(from, items);
    }
  }
}

/**
 * PubSub node access change stack
 *
 * @param   {string}    node      Pubsub node (xmlns)
 * @param   {string}    node      Access model to define
 */
const xows_cli_pubsub_chmod_stk = new Map();

/**
 * Handle PubSub node access change query.
 *
 * @param   {string}    node      Pubsub node (xmlns)
 * @param   {string}    node      Access model to define
 */
function xows_cli_pubsub_chmod_result(from, node, form, error)
{
  // Check whether we have this node in stack
  if(!xows_cli_pubsub_chmod_stk.has(node))
    return;

  // Get parameter for this node
  const param = xows_cli_pubsub_chmod_stk.get(node);

  // Can now delete the node from stack
  xows_cli_pubsub_chmod_stk.delete(node);

  // Forward error if happen at this stage
  if(error) {
    if(xows_isfunc(param.onresult))
      param.onresult(from, "error", error);
    return;
  }

  // Browse Form Data and modify access_model
  if(form) {
    // Fulfill the form with proper informations
    for(let i = 0, n = form.length; i <n; ++i) {
      if(form[i]["var"] === "pubsub#access_model") form[i].value = [param.access];
    }
  }

  // Submit modified Form Data
  xows_xmp_pubsub_conf_set_query(node, form, param.onresult);
}

/**
 * Function to change Pubsub node access model (Shortcut routine)
 *
 * @param   {string}    node      Pubsub node (xmlns)
 * @param   {string}    node      Access model to define
 * @param   {function} [onresult] Optional callback to handle received result
 */
function xows_cli_pubsub_chmod(node, access, onresult)
{
  if(xows_cli_pubsub_chmod_stk.has(node))
    return;

  // Store parameters for this node
  xows_cli_pubsub_chmod_stk.set(node, {"access":access,"onresult":onresult});

  // Query for PubSub node configuration
  xows_xmp_pubsub_conf_get_query(node, xows_cli_pubsub_chmod_result);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Nickname routines
 * -------------------------------------------------------------------*/
/**
 * Handle result or notification of XEP-0172 User Nickname
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {string}    item      Received PubSub item content (<nick> node)
 * @param   {object}    error     Error data if any
 */
function xows_cli_nick_parse(from, item, error)
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
    xows_load_task_done(peer, XOWS_LOAD_NICK);
  } else {
    xows_cli_peer_push(peer);
  }
}

/**
 * Query for XEP-0172 User Nickname
 *
 * @param   {string}    peer      Peer object to query Nickname
 */
function xows_cli_nick_query(peer)
{
  // Send query
  xows_xmp_nick_get_query(peer.addr, xows_cli_nick_parse);
}

/**
 * Publish new XEP-0172 User Nickname
 */
function xows_cli_nick_publish()
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
 * @param   {object}    error     Error data if any
 */
function xows_cli_avat_data_parse(from, hash, data, error)
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
    xows_cli_vcard_query(peer);
    return;
  }

  // Compose data-URL and add data to cache
  xows_cach_avat_save("data:"+info.type+";base64,"+ data, hash);

  // Set new avatar
  peer.avat = hash;

  if(peer.load) {
    xows_load_task_done(peer, XOWS_LOAD_AVAT);
  } else {
    xows_cli_peer_push(peer);
  }

  // Allow new query
  xows_cli_avat_fetch_stk.delete(peer);
}

/**
 * Handle received XEP-0084 avatar metadata notification
 *
 * @param   {string}    from      Query result Sender JID
 * @param   {object}    item      Received PupSub item content (<metadata> Node)
 * @param   {object}    error     Error data if any
 */
function xows_cli_avat_meta_parse(from, item, error)
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
    if(xows_options.avatar_autopub && peer === xows_cli_self) {

      // Generate DJB2 hash as seed for Avatar generation
      const seed = xows_bytes_to_hex(xows_hash_djb2(peer.addr));

      // Generate dummy avatar and save it as real
      peer.avat = xows_cach_avat_save(xows_gen_avatar(XOWS_AVAT_SIZE,null,seed));

      // Publish this avatar
      xows_cli_avat_publish("open");

      // Set Peer avatar as loaded
      xows_load_task_done(peer, XOWS_LOAD_AVAT);

      return;
    }

    // As fallback, try to get avatar from Vcard
    xows_cli_vcard_query(peer);

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
      xows_load_task_done(peer, XOWS_LOAD_AVAT);
    } else {
      xows_cli_peer_push(peer);
    }

  } else {
    // add new stack entry for this peer
    xows_cli_avat_parse_stk.set(peer, {"hash":hash,"type":type});
    // Query for Avatar Data
    xows_xmp_avat_data_get_query(from, hash, xows_cli_avat_data_parse);
  }
}

/**
 * Query for XEP-0084 avatar metadata
 *
 * @param   {string}    peer     Peer to query avatar
 */
function xows_cli_avat_meta_query(peer)
{
  // Query for Avatar Meta-Data
  xows_xmp_avat_meta_get_query(peer.addr, xows_cli_avat_meta_parse);
}

/**
 * Stack for Avatar fetch cycle, to ensure only one query per Peer at a time.
 */
const xows_cli_avat_fetch_stk = new Map();

/**
 * Fetch Peer Avatar, first by trying to retrieve avatar via PEP (XEP-0084),
 * then via vCard-Temp (XEP-0153)
 *
 * @param   {string}    peer     Peer to query avatar
 */
function xows_cli_avat_fetch(peer)
{
  if(xows_cli_avat_fetch_stk.has(peer))
    return;

  // Create dummy entry to prevent multiple query
  xows_cli_avat_fetch_stk.set(peer, peer);

  // We start by querying XEP-0084 Avatar Meta-Data
  xows_xmp_avat_meta_get_query(peer.addr, xows_cli_avat_meta_parse);
}

/**
 * Stores parameters for XEP-0084 avatar publication process
 */
const xows_cli_avat_publish_param = {access:""};

/**
 * Publish new XEP-0084 avatar data then automatically send metadata
 * if data publication succeed
 *
 * This function take avatar data from the one currently cached and
 * used by client own account.
 *
 * @param   {boolean}   access    Access model for published Avatar
 */
function xows_cli_avat_publish(access)
{
  const datauri = xows_cach_avat_get(xows_cli_self.avat);
  if(!datauri)
    return;

  // Store metadata params to be published after data upload
  xows_cli_avat_publish_param.access = access;

  // Get avatar Base64 data and create binary hash value
  const data = xows_url_to_data(datauri);
  const hash = xows_bytes_to_hex(xows_hash_sha1(atob(data)));

  // Publish data, the onparse function is set to send metadata
  xows_xmp_avat_data_publish(hash, data, null, xows_cli_avat_meta_publish);

  // If requested, change access model Avatar-Metadata
  if(access)
    xows_cli_pubsub_chmod(XOWS_NS_AVATAR_DATA, access);
}

/**
 * Delete XEP-0084 avatar data
 *
 * @param   {string}    hash      Avatar Hash to delete
 */
function xows_cli_avat_retract(hash)
{
  xows_xmp_pubsub_retract(XOWS_NS_AVATAR_META, hash, null);
  xows_xmp_pubsub_retract(XOWS_NS_AVATAR_DATA, hash, null);
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
function xows_cli_avat_meta_publish(from, type, error)
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

  const access = xows_cli_avat_publish_param.access;

  // If requested, change access model Avatar-Data and Avatar-Metadata
  if(access)
    xows_cli_pubsub_chmod(XOWS_NS_AVATAR_META, access);
}

/* -------------------------------------------------------------------
 * Client API - PubSub - Vcard routines
 * -------------------------------------------------------------------*/

/**
 * Function to handle parsed result of vcard query
 *
 * @param   {string}    from      Vcard Contact JID or null
 * @param   {object}    vcard     Vcard content
 * @param   {object}    error     Error data if any
 */
function xows_cli_vcard_parse(from, vcard, error)
{
  // Retreive Peer (Contact or Occupant) related to this query
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT|XOWS_PEER_OCCU);
  if(!peer) {
    xows_log(1,"cli_vcard_parse","unknown/unsubscribed JID",from);
    return;
  }

  if(error) {

    xows_log(1,"cli_vcard_parse","error parsing vcard",from);

  } else {

    // We are only interested in avatar
    if((node = vcard.querySelector("PHOTO"))) {

      const type = xows_xml_innertext(node.querySelector("TYPE"));
      const data = xows_xml_innertext(node.querySelector("BINVAL"));
      // create proper data-url string
      dataurl = "data:"+type+";base64,"+data;

      // Save image in cache
      peer.avat = xows_cach_avat_save(dataurl);
    }
  }

  if(peer.load) {
    xows_load_task_done(peer, XOWS_LOAD_AVAT);
  } else {
    xows_cli_peer_push(peer);
  }

  // Allow new query
  xows_cli_avat_fetch_stk.delete(peer);
}

/**
 * Query Contact or Own vcard data
 *
 * @param   {string}    peer      Peer object to query vcard
 */
function xows_cli_vcard_query(peer)
{
  // Query Vcard-temps (mainly for Avatar)
  xows_xmp_vcardt_get_query(peer.addr, xows_cli_vcard_parse);
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
function xows_cli_book_parse(from, items)
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
    if(auto) xows_cli_muc_join_atempt(room);

    // Fetch info and push Room
    xows_load_init(room, XOWS_LOAD_INFO, xows_cli_peer_push);
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

  xows_xmp_bookmark_publish(room.addr, mrk_name, auto, mrk_nick, null);
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
function xows_cli_mam_collect(from, bare, result, count, complete)
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
  const param = xows_cli_mam_param.get(peer);
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
    if(visibles < param.count) {
      // Shift time to get more message after/before the last/first
      // recevied with 25ms time shift to prevent doubling
      if(param.start) {
        param.start = pool[pool.length-1].time + 1;
      } else {
        param.end = pool[0].time - 1;
      }

      // Change the 'max' value to avoid querying too much, but
      // more than needed since received messages can be receipts
      const need = (param.count - visibles) * 2;
      if(need < xows_cli_mam_max) param.max = need;

      // Send new request after little delay
      setTimeout(xows_cli_mam_request, 100, peer);
      return;
    }
  }

  xows_log(2,"cli_mam_collect",visibles+" gathered messages for", peer.addr);

  if(xows_isfunc(param.onresult))
    param.onresult(peer, pool, visibles, complete);

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
  if(peer.type === XOWS_PEER_ROOM) {
    xows_xmp_mam_query(peer.addr, param.max, null, param.start, param.end, null, xows_cli_mam_collect);
  } else {
    xows_xmp_mam_query(null, param.max, peer.addr, param.start, param.end, null, xows_cli_mam_collect);
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

  xows_log(2,"cli_mam_fetch","fetch history for", peer.addr);

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
  xows_log(1,"cli_upld_abort","abort requested",name);

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
 * Callback function for initial Room presence (Joined Room)
 */
let xows_cli_fw_onroomjoin = function() {};

/**
 * Callback function for terminal Room presence (Exit Room)
 */
let xows_cli_fw_onroomexit = function() {};

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
 * Parse result (aka. Public Room list) of disco#items queries
 * to MUC available services.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_muc_roomlist_parse(from, item)
{
  // Forward null to signal query response
  xows_cli_fw_onroompush(null);

  for(let i = 0, n = item.length; i < n; ++i) {

    // Create new room in local list
    const room = xows_cli_room_new(item[i].jid);

    // Fetch infos and push Room
    xows_load_init(room, XOWS_LOAD_INFO, xows_cli_peer_push);
  }
}

/**
 * Query disco#items to MUC available services (if any) to gather list
 * of public Room (MUC Service's Items).
 */
function xows_cli_muc_roomlist_query()
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
    xows_xmp_disco_items_query(muc[i], xows_cli_muc_roomlist_parse);
}

/**
 * Parse disco#info result as a MUC Room and store Peer
 * object in Room list.
 *
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object[]}  form      Array of parsed X-Data fields
 */
function xows_cli_muc_roominfo_parse(from, iden, feat, form)
{
  let name = null;

  // Check for Room name supplied in identity
  if(iden.length > 0)
    name = iden[0].name;

  // Check whether this room already exists in local list
  let room = xows_cli_room_get(from);
  if(room) {
    if(name) room.name = name;
  } else {
    // Create new room in local list
    room = xows_cli_room_new(from, name);
  }

  // Check room features
  for(let i = 0; i < feat.length; ++i) {
    // Password protection
    if(feat[i] === "muc_passwordprotected") room.prot = true;
    if(feat[i] === "muc_unsecured") room.prot = false;
    // Public / Private
    if(feat[i] === "muc_public") room.publ = true;
    if(feat[i] === "muc_hidden") room.publ = false;
    // Members-Only
    if(feat[i] === "muc_membersonly") room.open = false;
    if(feat[i] === "muc_open") room.open = true;
    // Moderated
    if(feat[i] === "muc_moderated") room.modr = true;
    if(feat[i] === "muc_unmoderated") room.modr = false;
    // Semi/Non-anonymous
    if(feat[i] === "muc_semianonymous") room.anon = true;
    if(feat[i] === "muc_nonanonymous") room.anon = false;
  }

  // Get available informations
  if(form) {
    for(let i = 0; i < form.length; ++i) {
      if(form[i]["var"] === "muc#roomconfig_roomname")
        if(form[i].value) room.name = form[i].value;

      if(form[i]["var"] === "muc#roominfo_description")
        if(form[i].value) room.desc = form[i].value;

      if(form[i]["var"] === "muc#roominfo_subject")
        if(form[i].value) room.subj = form[i].value;

      if(form[i]["var"] == "muc#roominfo_occupants")
        if(form[i].value) room.nocc = parseInt(form[i].value); //< Number of occupants

      //if(form[i]["var"] == "muc#roominfo_lang")  = form[i].value;
      //if(form[i]["var"] == "muc#roomconfig_allowinvites")  = form[i].value;
      //if(form[i]["var"] == "muc#roomconfig_changesubject")  = form[i].value;
    }
  }

  if(room.load) {
    xows_load_task_done(room, XOWS_LOAD_INFO);
  } else {
    xows_cli_peer_push(room);
  }
}

/**
 * Query MUC Room infos
 *
 * @param   {object}    room      Room Peer object to query infos
 */
function xows_cli_muc_roominfo_query(room)
{
  // Send query
  xows_xmp_disco_info_query(room.addr, null, xows_cli_muc_roominfo_parse);
}

/**
 * Map object for user Room get config query result
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
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_getcfg_query(room, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_roomcfg_param.has(room))
    return;

  xows_cli_muc_roomcfg_param.set(room, onresult);  //< set the onresult function
  xows_xmp_muc_cfg_get_guery(room.addr, xows_cli_muc_getcfg_result);
}

/**
 * Function to proceed result of MUC room configuration form submition
 *
 * @param   {string}    from      Result sender JID
 * @param   {string}    type      Result type
 * @param   {string}    error     Error data if any
 */
function xows_cli_muc_setcfg_result(from, type, error)
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
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_setcfg_cancel(room, onresult)
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
function xows_cli_muc_setcfg_query(room, form, onresult)
{
  // Prevent concurrent queries
  if(xows_cli_muc_roomcfg_param.has(room))
    return;

  xows_cli_muc_roomcfg_param.set(room, onresult); //< set the onresult function
  xows_xmp_muc_cfg_set_query(room.addr, form, xows_cli_muc_setcfg_result);
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
 * @param   {function}  onresult  Callback to parse received result
 */
function xows_cli_muc_regi_query(room, onresult)
{
  if(xows_cli_muc_regi_param.has(room))
    return;

  xows_cli_muc_regi_param.set(room, {"onresult":onresult,"nick":room.nick});

  // Send request for Room register (will respond by xform)
  xows_xmp_regi_get_query(room.addr, xows_cli_muc_regi_get_result);
}

/**
 * Retry to join Room sending presence stanza to MUC room using
 * Room object parameters.
 *
 * This function should be used only when an initial join attempt failed,
 * otherwise, xows_cli_muc_join_atempt should be called first.
 *
 * @param   {object}    room      Room object to join
 */
function xows_cli_muc_join_retry(room)
{
  // Compose destination using Room JID and nickname
  const to = room.addr + "/" + room.nick;

  // Content of MUC <x> node (Password)
  const mucx = {pass:room.pass};

  // Send initial presence to Room to join
  xows_xmp_presence_send(to, null, xows_cli_self.show, xows_cli_self.stat, xows_cli_self.nick, mucx);
}

/**
 * Function to handle Room own reserved nickname query sent by Join
 * init function. This function also automatically try to join the Room.
 *
 * @param   {string}    from      Sender Room JID
 * @param   {string}    nick      Received reserved nickname or null
 */
function xows_cli_muc_join_nick(from, nick)
{
  // Get room object (should exist)
  let room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_join_nick_result","unknown/unsubscribed Room",from);
    return;
  }

  // Set own nickname for this Room
  if(!room.nick)
    room.nick = nick ? nick : xows_cli_self.name;

  // Send presence to join
  xows_cli_muc_join_retry(room);
}

/**
 * Atempt to join a Room, creating required stuff and checking for
 * reserved nickname.
 *
 * If no room object is supplied the function try to join (ie. create)
 * the room using the supplied room name.
 *
 * @param   {object}   [room]     Room object to join, or null
 * @param   {string}   [name]     Optional Room identifier or JID to join or create
 * @param   {string}   [nick]     Optional nickname to join room
 * @param   {string}   [pass]     Optional password to join room
 */
function xows_cli_muc_join_atempt(room, name, nick, pass)
{
  // Check if we got a room object
  if(room) {

    if(room.join)
      return; // already joined room

  } else {

    let addr;

    // check whether name is identifier or JID
    if(xows_isjid(name)) {

      addr = name;

    } else {

      // Verify the server provide MUC service
      if(!xows_cli_services.has(XOWS_NS_MUC)) {
        xows_log(1,"cli_muc_join","aborted","no MUC service available");
        return;
      }

      // compose room JID for current server
      addr = name.toLowerCase()+"@"+xows_cli_services.get(XOWS_NS_MUC)[0];
    }

    // create new Room object
    room = xows_cli_room_new(addr);
  }

  // Set nickname and password if supplied
  room.nick = nick;
  room.pass = pass;

  // Query for own reserved nickname, then join room
  xows_xmp_muc_nick_query(room.addr, xows_cli_muc_join_nick);
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
function xows_cli_xmp_onoccupant(from, show, stat, mucx, ocid, phot)
{
  // Get room object, if exists
  let room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_xmp_onoccupant","unknown/unsubscribed Room",from);
    return;
  }

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

  // Check for Room creation
  if(mucx.code.includes(201)) {

    // Room is awaiting configuration
    room.init = true;

    // Forward Room creation
    xows_cli_fw_onroompush(room);
  }

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
          xows_cli_fw_onroompush(room);

          // Forward Room joined
          xows_cli_fw_onroomjoin(room);

        } else {

          // Fetch latest Room info and forward joined
          xows_load_init(room, XOWS_LOAD_INFO, xows_cli_fw_onroomjoin);
        }
/*
        // Update infos for the newly joined room
        xows_cli_muc_roominfo_query(room);

        // Forward Room join signal
        xows_cli_fw_onroomjoin(room, mucx.code);
*/
      }

    } else {

      // We leaved the Room for some reasons
      room.join = null;

      // Forward removed Private Conversation
      for(let i = 0; i < room.occu.length; ++i)
        if(xows_cli_priv_has(room.occu[i]))
          xows_cli_fw_onprivrem(room.occu[i]);

      // Reset Room occupant list
      room.occu.length = 0;

      // Forward Room exit signal
      xows_cli_fw_onroomexit(room, mucx.code);

      return; //< nothing else to do
    }
  }

  // Get occupant object if exists
  let occu = xows_cli_occu_get(room, from, ocid);

  // Check wheter the occupant is to be removed
  if(occu && show === XOWS_SHOW_OFF) {

    // set show off for last update
    occu.show = show;

    // Forward removed Private Conversation
    if(xows_cli_priv_has(occu))
      xows_cli_fw_onprivrem(occu);

    // Forward removed Occupant
    xows_cli_fw_onoccurem(occu);

    return; //< return now
  }

  // Handle Nickname change
  if(mucx.code.includes(303)) {
    // TODO: Do we really have something to do here ?
    //const nick = mucx.nick;
  }

  if(occu) {
    // Update Occupant
    occu.name = xows_jid_resc(from);
    occu.ocid = ocid;
    occu.jful = mucx.jful; //< The real JID, may be unavailable
    occu.jbar = mucx.jful ? xows_jid_bare(mucx.jful) : null; //< Real bare JID;
    // If Occupant is found offline, this mean a Private Conversation
    // is open and occupant joined again, so, we inform Occupant is back
    if(occu.show === XOWS_SHOW_OFF) {
      // Forward update Private Conversation
      if(xows_cli_priv_has(occu))
        xows_cli_fw_onprivpush(occu);
    }
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
  if(phot) {
    if(phot.length > 0) { // Empty string mean no avatar
      if(xows_cach_avat_has(phot)) {
        occu.avat = phot; //< We already got this one
      } else {
        //xows_cli_avat_fetch(occu); //< Non cached data, fetch it
        load_mask |= XOWS_LOAD_AVAT;
      }
    }
  } else if(!occu.avat) { //< If occupant  have no avatar, try to get one
    //xows_cli_avat_fetch(occu);
    load_mask |= XOWS_LOAD_AVAT;
  }

  // Update Peer cached data
  xows_cach_peer_save(occu);

  // Forward update Private Conversation
  if(xows_cli_priv_has(occu))
    xows_cli_fw_onprivpush(occu);

  // Fetch data and push Occupant
  xows_load_init(occu, load_mask, xows_cli_peer_push, mucx.code);
}

/**
 * Handles received presence (<presence> stanza) error
 *
 * This function is called by xows_xmp_presence_recv.
 *
 * @param   {string}    from      Sender JID
 * @param   {object}    error     Error generic data
 */
function xows_cli_xmp_onpreserr(from, error)
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
    xows_cli_fw_onroomjoin(peer, null, error);

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
    xows_cli_fw_oncontpush(peer, text);
  }
}

/**
 * Handles an incoming room notification codes
 *
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {number[]}  codes     Notification status codes
 */
function xows_cli_xmp_onmucnoti(id, from, codes)
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
    xows_cli_muc_roominfo_query(room);
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
 * @param   {object}    room      Recipient Room
 * @param   {string}    subj      Subject content
 */
function xows_cli_muc_set_subject(room, subj)
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
function xows_cli_muc_set_affi(occu, affi)
{
  xows_xmp_muc_affi_set_query(occu.room.addr, {"jid":occu.jbar,"affi":affi}, null);
}

/**
 * Change room occupant role
 *
 * @param   {object}    occu      Room occupant
 * @param   {number}    role      Role value to set
 */
function xows_cli_muc_set_role(occu, role)
{
  xows_xmp_muc_role_set_query(occu.room.addr, {"nick":occu.name,"role":role}, null);
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
  // Retreive related Peer (Contact or ???)
  const peer = xows_cli_peer_get(from, XOWS_PEER_CONT);
  if(!peer) {
    xows_log(1,"cli_xmp_onjingle","refused "+action,"from unknow peer: "+from);
    // Send back iq error
    xows_xmp_iq_error_send(id, from, "cancel", "service-unavailable");
    return;
  }

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
  peer.call = xows_cli_best_resource(peer);

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
