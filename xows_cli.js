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
 * Constants for peer/object type
 */
const XOWS_PEER_NONE  = 0;
const XOWS_PEER_CONT  = 1;
const XOWS_PEER_ROOM  = 2;
const XOWS_PEER_OCCU  = 3;

/**
 * Default size for generated avatars
 */
const XOWS_AVAT_SIZE  = 48;

/**
 * List of available own account feature
 */
const xows_cli_feat_own = [];

/**
 * List of available server feature
 */
const xows_cli_feat_srv = [];

/**
 * Check whether own account feature is available
 * 
 * @param   {string}    feat      Feature name to search
 * 
 * @return  {boolean}   True if feature was found, false otherwise
 */
function xows_cli_feat_own_has(feat) 
{
  return xows_cli_feat_own.includes(feat);
}

/**
 * Check whether feature is available, either in own account or
 * server
 * 
 * @param   {string}    feat      Feature name to search
 * 
 * @return  {boolean}   True if feature was found, false otherwise
 */
function xows_cli_feat_srv_has(feat) 
{
  return xows_cli_feat_srv.includes(feat);
}

/**
 * Store the URL of available server items such as Http Upload or MUC
 * services.
 */
const xows_cli_svc_url = {};

/**
 * Check whether server item (service) is available
 * 
 * @param   {string}    xmlns     XMLNS corresponding to service
 */
function xows_cli_svc_exist(xmlns)
{
  return (xmlns in xows_cli_svc_url);
}

/**
 * Callback function for client connected
 */
let xows_cli_fw_onconnect = function() {};

/**
 * Callback function for client user status change
 */
let xows_cli_fw_onselfchange = function() {};

/**
 * Callback function for Contact added or refreshed
 */
let xows_cli_fw_oncontpush = function() {};

/**
 * Callback function for Contact removed
 */
let xows_cli_fw_oncontrem = function() {};

/**
 * Callback function for Subscription added
 */
let xows_cli_fw_onsubspush = function() {};

/**
 * Callback function for Subscription removed
 */
let xows_cli_fw_onsubsrem = function() {};

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
 * Callback function for sent or received Chat Message
 */
let xows_cli_fw_onmessage = function() {};

/**
 * Callback function for received Chatstat notification
 */
let xows_cli_fw_onchatstate = function() {};

/**
 * Callback function for received Receipt
 */
let xows_cli_fw_onreceipt = function() {};

/**
 * Callback function for received Room Subject
 */
let xows_cli_fw_onsubject = function() {};

/**
 * Callback function for connection or login error
 */
let xows_cli_fw_onerror = function() {};

/**
 * Callback function for session closed
 */
let xows_cli_fw_onclose = function() {};

/**
 * Client current user object
 */
let xows_cli_self = {
  "jid" : null,   //< Full JID (user@domain/ressource)
  "bare": null,   //< bare JID (user@domain)
  "name": null,   //< Nickname / display name
  "avat": null,   //< Avatar picture Hash
  "show": -1,     //< Presence level
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
  return jid.includes(xows_cli_self.bare);
}

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
    "show": -1,                 //< Displayed presence show level
    "stat": "",                 //< Displayed presence status string
    "noti": true,               //< Notification Enabled/Mute
    "chat": 0                   //< Chatstate level
  };
  
  // set Constant properties
  xows_def_readonly(cont,"type",XOWS_PEER_CONT);  //< Peer type
  xows_def_readonly(cont,"bare",bare);            //< bare JID (user@domain)
  xows_def_readonly(cont,"ress",{});              //< Resource list
  
  Object.seal(cont); //< prevet structure modification
  
  xows_cli_cont.push(cont);
  return cont;
}


/**
 * Returns the contact object with the specified JID
 * 
 * @param   {string}    jid       Contact JID to find
 * 
 * @return  {object}    Contact object or null if not found
 */
function xows_cli_cont_get(jid)
{
  // Get the bare JID 
  const bare_jid = xows_jid_to_bare(jid);

  let i = xows_cli_cont.length;
  while(i--) {
    if(xows_cli_cont[i].bare === bare_jid) 
      return xows_cli_cont[i];
  }
  
  return null;
}

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
  const bare_jid = xows_jid_to_bare(jid);

  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].bare === bare_jid) 
      return xows_cli_room[i];
  }
  
  return null;
}

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
  const name = xows_jid_to_nick(jid);
  const bare = full?xows_jid_to_bare(full):null;
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
  const bare = xows_jid_to_bare(jid);
  
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
    xows_cli_fw_onselfchange(xows_cli_self);
    
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
 *  - uplder    : HTTP Upload error
 *  - upldok    : HTTP Upload success
 *  - upldpg    : HTTP Upload progress
 *  - upldab    : HTTP Upload Abort
 *  - error     : Client Error
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
    case "selfchange":  xows_cli_fw_onselfchange = callback; break;
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
    case "subject":     xows_cli_fw_onsubject = callback; break;
    case "error":       xows_cli_fw_onerror = callback; break;
    case "close":       xows_cli_fw_onclose = callback; break;
  }
}

/**
 * Indicate whether client must send the initial presence and call the
 * onconnect callback
 * 
 * This value must be set to true each time client initialize a new
 * session, and is set to false once the initial presence is sent
 * after the first query to roster content.
 */
let xows_cli_initialize = true;

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
  xows_cli_feat_own.length = 0;
  xows_cli_feat_srv.length = 0;
  for(const k in xows_cli_svc_url) 
    delete xows_cli_svc_url[k];
    
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
  xows_xmp_set_callback("roster", xows_cli_xmp_onroster);
  xows_xmp_set_callback("message", xows_cli_xmp_onmessage);
  xows_xmp_set_callback("chatstate", xows_cli_xmp_onchatstate);
  xows_xmp_set_callback("receipt", xows_cli_xmp_onreceipt);
  xows_xmp_set_callback("subject", xows_cli_xmp_onsubject);
  xows_xmp_set_callback("pubsub", xows_cli_xmp_onpubsub);
  xows_xmp_set_callback("error", xows_cli_xmp_onerror);
  xows_xmp_set_callback("close", xows_cli_xmp_onclose);
  
  // We are in initial state
  xows_cli_initialize = true;
  
  // Open a new XMPP connection
  return xows_xmp_connect(url, jid, password, register);
}

/**
 * Handle successfull connection and opened XMPP session
 * 
 * This function is called by the xows_xmp_* API layer once XMPP 
 * services and items discovery is completed.
 * 
 * @param   {string}    jid       Session full JID with resource
 */
function xows_cli_xmp_onsession(jid)
{
  // Store the full JID for this session
  xows_cli_self.jid = jid;
  xows_cli_self.bare = xows_jid_to_bare(jid);
  
  // Check for cached information about own account
  const cach = xows_cach_peer_get(xows_cli_self.bare);
  if(cach !== null) {
    if(cach.name) xows_cli_self.name = cach.name;
    if(cach.avat) xows_cli_self.avat = cach.avat;
    if(cach.desc) xows_cli_self.stat = cach.desc;
  }
  // Compose default name and nickname from JID
  if(xows_cli_self.name === null) {
    const userid = xows_xmp_bare.split("@")[0];
    xows_cli_self.name = userid[0].toUpperCase() + userid.slice(1);
  }
  // Create default avatar if needed
  if(!xows_cli_self.avat) xows_cli_self.avat = xows_cli_avat_temp(xows_cli_self.bare);
  
  // Start features & services discovery
  xows_xmp_discoinfo_query(xows_cli_self.bare, null, xows_cli_own_info_parse);
}

/**
 * Handle XMPP stream closed
 * 
 * @parma   {number}    code      Signal code for closing
 * @param   {string}   [mesg]     Optional information or error message
 */
function xows_cli_xmp_onclose(code, mesg)
{
  // Ignore if already closed
  if(xows_cli_self.jid) {

    // Clean the client
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
  
  // Forward the connexion close code and message
  xows_cli_fw_onclose(code, mesg);
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

/**
 * Handle disco#info query to own user JID
 * 
 * Called once the query result is received, continue the discovery
 * process by sending a disco#info to the server.
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 */
function xows_cli_own_info_parse(from, iden, feat)
{
  // Check for available features
  for(let i = 0, n = feat.length; i < n; ++i) {
    
    // Add to local feature list
    xows_cli_feat_own.push(feat[i]);
    
    // Search for MAM feature
    if(feat[i].includes(XOWS_NS_MAM)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
  }
  // Next discovery step with server features
  xows_xmp_discoinfo_query(xows_xmp_domain, null, xows_cli_srv_info_parse);
}

/**
 * Handle disco#info query to the current server
 * 
 * Called once the query result is received, continue the discovery
 * process by sending a disco#items to server.
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 */
function xows_cli_srv_info_parse(from, iden, feat)
{
  // Check for available features
  for(let i = 0, n = feat.length; i < n; ++i) {
    
    // Add to local feature list
    xows_cli_feat_srv.push(feat[i]);
    
    if(feat[i].includes(XOWS_NS_CARBONS)) {
      // Check and set the xmlns (version) to use for this session
      if(xows_xmp_use_xep(feat[i])) { 
        xows_xmp_carbons_query(true); //< enable carbons
      }
    }
    // Search for Http Upload feature
    if(feat[i].includes(XOWS_NS_HTTPUPLOAD)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
    // Search for MUC feature
    if(feat[i].includes(XOWS_NS_MUC)) {
      // Set XEP xmlns (version) to use for this session
      xows_xmp_use_xep(feat[i]);
    }
  }
  // Next discovery step with server items
  xows_xmp_discoitems_query(xows_xmp_domain, xows_cli_srv_items_parse);
}

/**
 * Stack used to fulfill the per server-item features discovery
 */
const xows_cli_srv_items_stack = [];

/**
 * Handle disco#items query to the current server
 * 
 * Called once the query result is received. If items are received, the
 * discovery process continue by sending disco#info to each item, 
 * otherwise the discovery is assumed completed and a query for roster 
 * is sent.
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_srv_items_parse(from, item)
{
  // If no item is reported we are ready right now
  if(!item.length) {
    // Server discovery finished, now query for roster
    xows_cli_rost_get_query();
    return;
  }
  // Ensure services stack is empty
  xows_cli_srv_items_stack.length = 0;
  // First, fill the services stack
  let i = item.length;
  while(i--) xows_cli_srv_items_stack.push(item[i].jid);
  // Then start query info for each services
  xows_xmp_discoinfo_query(xows_cli_srv_items_stack.pop(), null, xows_cli_srv_item_info_parse);
}

/**
 * Handle disco#info query to server item/service
 * 
 * Called for each received query result received from item disco#info, 
 * once result is received for each item the discovery is assumed 
 * completed and a query for roster.
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 */
function xows_cli_srv_item_info_parse(from, iden, feat)
{
  // prevent further crash
  if(iden.length) {

    // Get item identity
    const catg = iden[0].category;
    const type = iden[0].type;
    const name = iden[0].name;
    
    // Output log
    xows_log(2,"cli_srv_item_info_parse","discover service features", 
                from+": "+catg+", "+type+", \""+name+"\"");
    
    let i;
    // Check for Http-Upload service
    if(catg === "store" && type === "file") {
      // Search for the proper feature
      i = feat.length;
      while(i--) {
        if(feat[i].includes(XOWS_NS_HTTPUPLOAD)) {
          // Set XEP xmlns (version) to use for this session
          xows_xmp_use_xep(feat[i]);
          xows_cli_svc_url[XOWS_NS_HTTPUPLOAD] = from;
          xows_log(2,"cli_srv_item_info_parse","use service for Http-Upload",from);
        }
      }
    }
    // Check for MUC service
    if(catg === "conference" && type === "text") {
      // Search for the proper feature
      i = feat.length;
      while(i--) {
        if(feat[i] === XOWS_NS_MUC) {
          xows_cli_svc_url[XOWS_NS_MUC] = from;
          xows_log(2,"cli_srv_item_info_parse","use service for Multi-User Chat",from);
        }
      }
    }
    
  } else {
    xows_log(1,"cli_srv_item_info_parse","item without identity",from);
    return;
  }

  if(xows_cli_srv_items_stack.length) {
    // Query info for the next service
    xows_xmp_discoinfo_query(xows_cli_srv_items_stack.pop(), null, xows_cli_srv_item_info_parse);
  } else {
    // Server discovery finished, now query for roster
    xows_cli_rost_get_query();
  }
}

/**
 * Function to append or refresh contact in local roster
 * 
 * This function is used to localy reflect user roster, NOT to 
 * proceed to contact roster add query.
 * 
 * @param   {string}    bare      Contact bare JID
 * @param   {string}    name      Contact Displayred name
 * @param   {number}    subs      Contact subscription
 * @param   {string}    group     Contact group (not used yet)
 */
function xows_cli_rost_update(bare, name, subs, group)
{
  // Sepecial case if we receive a 'remove' subscription
  if(subs < 0) {
    xows_log(2,"cli_roster_update","Roster update",bare+" \""+name+"\" subscription: "+subs);
    // Remove contact from local list
    let i = xows_cli_cont.length;
    while(i--) {
      if(xows_cli_cont[i].bare === bare) {
        xows_log(2,"cli_roster_update","removing Contact",bare);
        xows_cli_cont.splice(i,1); 
        xows_cli_fw_oncontrem(bare); //< Forward contact to remove
        break;
      }
    }
    return;
  }
  
  xows_log(2,"cli_roster_update","update Contact",bare+" \""+name+"\" subscription: "+subs);
  
  let cont = xows_cli_cont_get(bare);
  if(cont !== null) {
    cont.name = name ? name : bare;
    cont.subs = subs;
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
 * Function to handle parsed result of roster query
 * 
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_rost_get_parse(item)
{
  // Empty the contact list
  xows_cli_cont.length = 0;
  
  if(item.length) {
    // Fill up the Roster with received contact
    for(let i = 0, n = item.length; i < n; ++i) {
      // Create a contact into local roster
      xows_cli_rost_update(item[i].bare, item[i].name, item[i].subs, item[i].group);
    }
  } else {
    // Push null contact, mean empty list
    xows_cli_fw_oncontpush(null);
  }
  
  // If we are in initialize state, we now send the initial presence
  if(xows_cli_initialize) {
    xows_cli_presence_init();
  }
}

/**
 * Function to query client roster content (contact list)
 */
function xows_cli_rost_get_query()
{
  // Query to get roster content (list of contacts)
  xows_xmp_roster_get_query(xows_cli_rost_get_parse);
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
  xows_xmp_roster_set_query(bare, name, null, null);
  
  if(name) {
    xows_log(2,"cli_roster_edit","request subscribe to",bare);
    // Send a subscription request to the contact
    xows_xmp_send_presence(bare, "subscribe");
  }
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
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_get_query(jid, xows_cli_vcard_parse);
  } else {
    xows_xmp_vcardt_get_query(jid, xows_cli_vcard_parse);
  }
}

/**
 * Local copy of received vCard raw data structure
 */
let xows_cli_vcard_own = null;

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
    if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
      // XEP-0292 vCard4 parsing
      if((node = vcard.querySelector("nickname"))) 
        nick = xows_xml_get_text(node.firstChild); //< <nickname><text>#text
      if((node = vcard.querySelector("note")))
        note = xows_xml_get_text(node.firstChild); //< <note><text>#text
      if((node = vcard.querySelector("photo"))) 
        phot = xows_xml_get_text(node.firstChild); //< <photo><uri>#text
    } else {
      // XEP-0054 vcard-temp parsing
      if((node = vcard.querySelector("NICKNAME"))) 
        nick = xows_xml_get_text(node);
      // first, try <NOTE> then <DESC> which is the legacy mapping
      if((node = vcard.querySelector("NOTE"))) {
        note = xows_xml_get_text(node);
      } else if((node = vcard.querySelector("DESC"))) {
        note = xows_xml_get_text(node);
      }
      if((node = vcard.querySelector("PHOTO"))) {
        const type = xows_xml_get_text(node.querySelector("TYPE"));
        const data = xows_xml_get_text(node.querySelector("BINVAL"));
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
  
  const vcard = xows_cli_self.vcrd;
  
  // Check if account supports Vcard4 or fallback to vcard-temp
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
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
  if(xows_cli_feat_own_has(XOWS_NS_IETF_VCARD4) && !xows_options.legacy_vcard) {
    xows_xmp_vcard4_publish(nodes, open ? "open" : "presence");
  } else {
    xows_xmp_vcardt_set_query(nodes);
  }

}

/**
 * Stores received XEP-0084 avatar metadata
 */
const xows_cli_avat_meta_queue = {};

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
    
    if(!(id in xows_cli_avat_meta_queue)) {
      xows_log(1,"cli_avat_data_handle","received Avatar-Data without Metadata",id);
      return;
    }
    
    // for now we only need type
    const type = xows_cli_avat_meta_queue[id].type;
    
    // Compose data-URL and add data to cache
    hash = xows_cach_avat_save("data:" + type + ";base64," + data, id);
    
    // we can delete saved meta data from temp queue
    delete xows_cli_avat_meta_queue[id];
    
  } else {
    
    xows_log(2,"cli_avat_data_handle","handle cached Avatar-Data",id);
    // Already cached avatar data, we only get id as hash
    hash = id;
  }
  
  // Update the proper Contact, Occupant, or own profile
  xows_cli_peer_update(from, null, hash, null);
}

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
      
      // Store image properties to temporary queue
      xows_cli_avat_meta_queue[id] = {
        "type"   : info.getAttribute("type"),
        "width"  : info.getAttribute("width"),
        "height" : info.getAttribute("height"),
        "bytes"  : info.getAttribute("bytes") };
        
      // Check whether we need to donwload data
      if(!xows_cach_avat_has(id)) {
        
        xows_log(2,"cli_avat_meta_parse","Avatar-Data unavailable",id);
        xows_xmp_avat_data_get_query(from, id, xows_cli_avat_data_parse);
        
      } else {
        
        xows_log(2,"cli_avat_meta_parse","Avatar-Data already cached",id);
        
        // parse with null data to update Own/Contact/Occupant with cached data
        xows_cli_avat_data_parse(from, id, null);
      }
    }
  }
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
let xows_cli_avat_publish_temp = null;

/**
 * Handle result of XEP-0084 avatar data publication to send back
 * corresponding metadata
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
    xows_log(2,"cli_avat_meta_publish","Avatar-Data publication succeed","now publish Metadata");
    // Verify we have data hash
    if(xows_cli_avat_publish_temp) {
      const open = xows_cli_avat_publish_temp.open;
      const hash = xows_cli_avat_publish_temp.hash;
      const type = xows_cli_avat_publish_temp.type;
      const bytes = xows_cli_avat_publish_temp.bytes;
      const size = XOWS_AVAT_SIZE;
      xows_xmp_avat_meta_publish(hash, type, bytes, size, size, 
                                  open ? "open" : "presence", null);
      xows_log(2,"cli_avat_meta_publish","publish Avatar-Metadata","id:"+hash+" bytes:"+bytes);
    } else {
      xows_log(1,"cli_avat_meta_publish","no temp Metadata stored");
    }
  }
  // rest params
  xows_cli_avat_publish_temp = null;
}

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
  const url = xows_cach_avat_get(xows_cli_self.avat);
  if(url) {
    const b64 = xows_url_to_data(url); 
    const type = xows_url_to_type(url); 
    const bin = atob(b64);
    const hash = xows_bytes_to_hex(xows_hash_sha1(bin));
    // Store metadata to be published after data publication
    xows_cli_avat_publish_temp = {"open":open,"hash":hash,
                                  "type":type,"bytes":bin.length};
    xows_log(2,"cli_avat_data_publish","publish Avatar-Data",hash);
    // Publish data, the onparse function is set to send metadata
    xows_xmp_avat_data_publish(hash, b64, open ? "open" : "presence", 
                                xows_cli_avat_meta_publish);
  } else {
    xows_log(1,"cli_avat_data_publish","no Data to publish");
  }
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
    seed = xows_jid_to_nick(from).toLowerCase();
  } else {
    seed = xows_jid_to_user(from);
  }
  
  // we generate new avatar image
  const data = xows_gen_avatar(XOWS_AVAT_SIZE,null,seed);
  
  // save data in live DB but not in Local Storage
  return xows_cach_avat_save(data, null, true);
}

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
  xows_cli_peer_update(from, xows_xml_get_text(nick), null, null);
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
    if(temp) nick = xows_xml_get_text(temp);
    
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
    if(auto) xows_cli_room_join(room);
    
    // Query info for Room
    xows_cli_room_discoinfo(room);
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
  const mrk_nick = nick ? nick : xows_jid_to_nick(room.join);
  
  xows_log(2,"cli_book_publish","add bookmark",mrk_name+" ("+room.bare+")");
  
  xows_xmp_bookmark_publish(room.bare, mrk_name, auto, mrk_nick);
}

/**
 * Proceeds incoming XMPP roster push
 * 
 * @param   {string}    bare      Contact bare JID
 * @param   {string}    name      Contact Displayred name
 * @param   {number}    subs      Contact subscription
 * @param   {string}    group     Contact group (not used yet)
 */
function xows_cli_xmp_onroster(bare, name, subs, group)
{
  // we simply forward
  xows_cli_rost_update(bare, name, subs, group);
}

/**
 * Handles received subscribe (<presence> stanza) request or result 
 * from orher contacts
 * 
 * This function is called by xows_xmp_recv_presence.
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
      xows_cli_fw_onsubspush(xows_jid_to_bare(from), nick);
    }
  }
}

/**
 * Handles received presence (<presence> stanza) status from 
 * other contacts
 * 
 * This function is called by xows_xmp_recv_presence.
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
    if(xows_jid_to_bare(from) !== xows_xmp_bare)
      xows_log(1,"cli_xmp_onpresence","unknown/unsubscribed Contact",from);
    return;
  }
  
  // Reset the locked resource as defined in XEP-0296
  cont.lock = cont.bare;

  // Get resource part from full JID
  let res = xows_jid_to_nick(from);
  // Updates presence of the specific resource, delete it if offline
  if(show >= 0) {
    if(!cont.ress[res]) { //< new ressource ? add it
      xows_log(2,"cli_xmp_onpresence","adding Resource for "+cont.bare, res);
      cont.ress[res] = {"show":show,"prio":prio,"stat":stat,"node":null};
      // Check for entity capabilities
      if(node) {
        const node_ver = node.node + "#" + node.ver;
        cont.ress[res].node = node_ver;
        // If we don't know this node, get features
        if(!xows_cach_caps_has(node_ver)) {
          xows_log(2,"cli_xmp_onpresence","query entity caps for "+cont.bare,node_ver);
          xows_xmp_discoinfo_query(from, node_ver, xows_cli_entity_caps_parse);
        }
      }
    } else { //< update existing ressource
      xows_log(2,"cli_xmp_onpresence","updating Resource for "+cont.bare, res);
      cont.ress[res].show = show;
      cont.ress[res].prio = prio;
      cont.ress[res].stat = stat;
    }
  } else {
    if(cont.ress[res]) {
      xows_log(2,"cli_xmp_onpresence","removing Resource for "+cont.bare, res);
      delete cont.ress[res]; //< ressource gone offline remove it
    }
  }
  // Set default show level and status
  cont.show = -1;
  cont.stat = null;
  // Select new displayed show level and status according current 
  // connected resources priority
  let p = -128;
  for(const k in cont.ress) {
    if(!cont.ress.hasOwnProperty(k)) continue;
    if(cont.ress[k].prio > p) {
      p = cont.ress[k].prio;
      cont.show = cont.ress[k].show;
      cont.stat = cont.ress[k].stat;
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
 * Handles received occupant presence (<presence> stanza) status 
 * from MUC room
 * 
 * This function is called by xows_xmp_recv_presence.
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
    const bare = xows_jid_to_bare(from);
    const name = xows_jid_to_user(bare);
    room = xows_cli_room_new(bare, name, "", false, false);
    xows_log(2,"cli_xmp_onoccupant","add unexisting Room",name+" ("+bare+")");
    xows_cli_fw_onroompush(room); //< Forward created Room
    xows_cli_room_discoinfo(room); //< Query info for new room
  }

  // Handle special case of room join and creation
  for(let i = 0, n = muc.code.length; i < n; ++i) {
    if(muc.code[i] === 110) { //< own presence in Room
      if(show >= 0) {
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
  if(show < 0) { //< Mean unavailable
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
  const nick = xows_jid_to_nick(from);
  const bare = muc.full ? xows_jid_to_bare(muc.full) : null; //< The real bare JID

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
  } else {
    xows_log(2,"cli_entity_caps_parse","node already cached",node);
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
  const feat = xows_cach_caps_get(node);
  return (feat && feat.includes(xmlns));
}

/**
 * Handles an incoming chat state notification.
 * 
 * @param   {string}    id        Message ID
 * @param   {string}    type      Message type
 * @param   {string}    from      Sender JID
 * @param   {string}    to        Recipient JID
 * @param   {string}    chat      Chat state
 * @param   {number}    time      Optional provided time (Unix epoch)
 */
function xows_cli_xmp_onchatstate(id, type, from, to, chat, time)
{
  if(type !== "chat" && type !== "groupchat") {
    xows_log(1,"cli_xmp_onchatstate","invalid message type",type);
    return;
  }
  
  // Retreive message peer and author
  let peer;
  if(type === "chat") {
    // Check whether message is a carbons copy of a message sent by  
    // own account but from another connected client.
    if(xows_cli_isself(from)) {
      xows_log(2,"cli_xmp_onchatstate","carbons chat state ignored",from);
      return;
    }
    peer = xows_cli_cont_get(from);
  } else {
    peer = xows_cli_room_get(from);
    // Check whether message is an echo send by own account
    if(peer.join === from) {
      xows_log(2,"cli_xmp_onchatstate","echo chat state ignored",from);
      return;
    }
  }
  
  if(!peer) {
    xows_log(1,"cli_xmp_onchatstate","unknown/unsubscribed JID",from);
    return;
  }
  
  // Update Contact, Peer and Room according received  chatstat
  if(peer.type === XOWS_PEER_CONT) {
    peer.lock = from;  //< Update "locked" ressourceas as recommended in XEP-0296
    peer.chat = chat;
  } else {
    // search room occupant (must exists)
    const occu = xows_cli_occu_get(peer, from);
    if(occu) {
      occu.chat = chat;
      // add or remove Occupant to/from Room "writing list"
      if(chat > XOWS_CHAT_PAUS) { //< Writing
        if(!peer.writ.includes(occu))
          peer.writ.push(occu);
      } else {                    //< Paused, Inactive, etc...
        const i = peer.writ.indexOf(occu);
        if(i >= 0) peer.writ.splice(i, 1);
      }
    }
  }

  xows_log(2,"cli_xmp_onchatstate","chat state",from+" "+chat);
  
  // Forward changed Chat State
  xows_cli_fw_onchatstate(peer, from, chat); 
}

/**
 * Handles an incoming chat message with content
 * 
 * @param   {string}    id        Message ID
 * @param   {string}    type      Message type
 * @param   {string}    from      Sender JID
 * @param   {string}    to        Recipient JID
 * @param   {string}    body      Message content
 * @param   {number}   [time]     Optional provided time (Unix epoch)
 */
function xows_cli_xmp_onmessage(id, type, from, to, body, time)
{
  if(type !== "chat" && type !== "groupchat") {
    xows_log(1,"cli_xmp_onmessage","invalid message type",type);
    return;
  }
  
  let sent, peer, sndr;
  
  // Retreive message peer and sender
  if(type === "chat") {
    sent = xows_cli_isself(from);
    peer = xows_cli_cont_get(sent ? to : from);
    sndr = sent ? xows_cli_self : peer;
  } else {
    peer = xows_cli_room_get(from);
    sent = (from === peer.join);
    // this is chat room, we return self or a Room Cccupant
    if(sent) {
      sndr = xows_cli_self;
    } else {
      // Find existing Occupant or create new from cached data
      sndr = xows_cli_occu_any(peer, from);
    }
  }
  
  if(!peer) {
    xows_log(1,"cli_xmp_onmessage","unknown/unsubscribed JID",from);
    return;
  }
  
  // If no time is specified set as current
  if(!time) time = new Date().getTime();
  
  // Update "locked" ressourceas as recommended in XEP-0296
  if(peer.type === XOWS_PEER_CONT) {
    if(!sent) peer.lock = from;
  }
  
  xows_log(2,"cli_xmp_onmessage","chat message",from+" \""+body+"\"");
  
  // Forward received message
  xows_cli_fw_onmessage(peer, id, from, body, time, sent, true, sndr);
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
  
  xows_log(2,"cli_xmp_onsubject","room subject",from+" \""+subj+"\"");
  
  // Forward received Room subject
  xows_cli_fw_onsubject(room, subj);
}

/**
 * Handles an incoming message receipt
 * 
 * @param   {string}    id        Message ID
 * @param   {string}    from      Sender JID
 * @param   {string}    to        Recipient JID
 * @param   {string}    rcid      Receipt message ID
 * @param   {number}   [time]     Optional provided time (Unix epoch)
 */
function xows_cli_xmp_onreceipt(id, from, to, rcid, time)
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
  xows_log(2,"cli_xmp_onreceipt","message receipt received",from+" "+rcid);
  // Forward received Receipt
  xows_cli_fw_onreceipt(peer, rcid);
}

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

/**
 * User callback to receive MAM query result
 */
let xows_cli_mam_cb = null;

/**
 * Handles the archive query parsed result
 * 
 * @param   {string}    from      Archives sender JID, may be Room or Null
 * @param   {string}    _with     With JID used as filter or Null
 * @param   {object[]}  result    Received archived messages
 * @param   {number}    count     Total result count
 * @param   {boolean}   complete  Current result set is complete
 */
function xows_cli_mam_parse(from, _with, result, count, complete)
{
  // Retreive the contact related to this query
  const peer = xows_cli_peer_get(from ? from : _with);
  if(!peer) {
    xows_log(1,"cli_mam_parse","unknown/unsubscribed JID",from ? from : _with);
    return;
  }
  
  // re-parse result to add peer, sender and other various parameters
  let i = result.length;
  
  if(peer.type === XOWS_PEER_CONT) {
      
    while(i--) {
      result[i].sent = xows_cli_isself(result[i].from);
      result[i].sndr = result[i].sent ? xows_cli_self : peer;
    }
    
  } else { //<  === XOWS_PEER_ROOM
    
    let from, sndr;
    
    while(i--) {
      from = result[i].from;
      result[i].sent = (from === peer.join);
      // this is chat room, we return self or a Room Cccupant
      if(result[i].sent) {
        sndr = xows_cli_self;
      } else {
        // Find existing Occupant or create new from cached data
        sndr = xows_cli_occu_any(peer, from);
      }
      // assing sender
      result[i].sndr = sndr;
    }
  }

  xows_log(2,"cli_mam_parse","received archives for",peer.bare);
  
  // Forward archive result
  if(xows_isfunc(xows_cli_mam_cb))  
    xows_cli_mam_cb(peer, result, complete);
}

/**
 * Query for archived messages with the specified JID
 *  
 * @param   {object}    peer      Peer to get archive
 * @param   {number}    max       Maximum count of message to get
 * @param   {number}    start     Archive start time parameter
 * @param   {number}    end       Archive end time parameter
 * @param   {object}    onresult  Callback to handle received result
 */
function xows_cli_mam_query(peer, max, start, end, onresult)
{
  if(peer.type === XOWS_PEER_CONT) {
    // Send new query to XMPP interface
    xows_xmp_mam_query(null, max, peer.bare, start, end, null, xows_cli_mam_parse);
  } else {
    // Send new query to XMPP interface
    xows_xmp_mam_query(peer.bare, max, null, start, end, null, xows_cli_mam_parse);
  }
  
  xows_cli_mam_cb = onresult;
}

/**
 * Send a chat message to the specified recipient
 * 
 * @param   {string}    peer      Recipient peer (Room or Contact)
 * @param   {string}    body      Message content
 */
function xows_cli_send_message(peer, body) 
{
  // Message with empty body are devil
  if(!body.length) {
    xows_log(1,"cli_user_send_message","message with empty body","who you gonna call ?");
    return;
  }
  
  let type, to, from, use_recp = false;
  
  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {
    
    type = "groupchat";
    to = peer.bare;
    from = peer.join;
    use_recp = true; //FIXME: Does MUC room always support receipt ?
    
  } else {
    
    type = "chat";
    to = peer.lock;
    from = xows_cli_self.bare;
    
    // If current peer client is online and support receipt, the 
    // message should not be marked as "receip received"
    if(peer.lock !== peer.bare) {
      // Get resource object of current locked
      const res = peer.ress[xows_jid_to_nick(peer.lock)];
      // Check for receipt support
      if(res) use_recp = xows_cli_entity_caps_test(res.node,XOWS_NS_RECEIPTS);
    }
  } 
  
  xows_log(2,"cli_user_send_message","send "+type+" message",to+" \""+body+"\"");
        
  // Send message with body
  const id = xows_xmp_send_message(type, to, body, use_recp);
  
  // Forward sent message
  xows_cli_fw_onmessage(peer, id, from, body, new Date().getTime(), true, !use_recp, xows_cli_self);
}

/**
 * Send a chat message to the specified recipient
 * 
 * @param   {string}    peer      Recipient peer (Room or Contact)
 * @param   {string}    chat      Chatstate value to send
 */
function xows_cli_send_chatstate(peer, chat) 
{
  let type, to;
  
  // Check whether peer is a MUC room or a subscribed Contact
  if(peer.type === XOWS_PEER_ROOM) {
    type = "groupchat";
    to = peer.bare;
  } else {
    type = "chat";
    to = peer.lock;
  }

  xows_log(2,"cli_send_chatstate","send chatstat",to+" \""+chat+"\"");

  // Send chatstat message
  xows_xmp_send_chatstate(to, type, chat);
}

/**
 * Send a subject to the specified room
 * 
 * @param   {string}    room      Recipient Room
 * @param   {string}    subj      Subject content
 */
function xows_cli_send_subject(room, subj) 
{
  xows_log(2,"cli_muc_subject_send","send subject",room.bare+" \""+subj+"\"");
  // Send message with subject
  xows_xmp_send_subject(room.bare, subj);
}

/**
 * Stack used to fulfill the per roominfos features discovery
 */
const xows_cli_muc_item_info_stack = [];

/**
 * Query disco#items to MUC service, to retrieve public room list
 */
function xows_cli_muc_items_query()
{
  // Verify the server provide MUC service
  if(!xows_cli_svc_exist(XOWS_NS_MUC)) {
    xows_log(1,"cli_muc_items_query","service not found",
                "the server does not provide "+XOWS_NS_MUC+" service");
    xows_cli_fw_onerror(XOWS_SIG_WRN,"multi-user chat (XEP-0045) service is unavailable");
    return;
  }

  // Send Item discovery to the MUC service URL
  xows_xmp_discoitems_query(xows_cli_svc_url[XOWS_NS_MUC], 
                        xows_cli_muc_items_parse);
}

/**
 * Handle disco#items query to MUC service for existing public rooms
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  item      Array of parsed <item> objects
 */
function xows_cli_muc_items_parse(from, item)
{
  // Remove all Public Rooms from list
  let i = xows_cli_room.length;
  while(i--) if(xows_cli_room[i].publ) xows_cli_room.splice(i,1);

  if(item.length) {
    // Ensure services stack is empty
    xows_cli_muc_item_info_stack.length = 0;
    // First, fill the services stack
    let i = item.length;
    while(i--) xows_cli_muc_item_info_stack.push(item[i].jid);
    // Then start query info for each services
    xows_xmp_discoinfo_query(xows_cli_muc_item_info_stack.pop(), null, xows_cli_muc_item_info_parse);
  }
  
  // Forward null object to signal query response
  xows_cli_fw_onroompush(null);
}

/**
 * Handle disco#info query to a MUC room
 * 
 * @param   {string}    from      Query result sender JID
 * @param   {object[]}  iden      Array of parsed <identity> objects
 * @param   {string[]}  feat      Array of parsed feature strings
 * @param   {object[]}  form      Array of parsed X-Data fields
 */
function xows_cli_muc_item_info_parse(from, iden, feat, form)
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
    xows_log(2,"cli_muc_item_info_parse","refresh Room",name+" ("+from+") :\""+desc+"\"");
  } else {
    // Create new room in local list
    room = xows_cli_room_new(from, name, desc, prot, publ);
    xows_log(2,"cli_muc_item_info_parse","adding Room",name+" ("+from+") :\""+desc+"\"");
  }

  // Forward added/updated Room
  xows_cli_fw_onroompush(room);
  
  // Proceed the next room in stack to get info
  if(xows_cli_muc_item_info_stack.length) {
    // Query info for the next service
    xows_xmp_discoinfo_query(xows_cli_muc_item_info_stack.pop(), null, xows_cli_muc_item_info_parse);
  }
}

/**
 * Query for MUC room informations
 * 
 * @param   {object}    room      Room object to query info
 */
function xows_cli_room_discoinfo(room)
{
  // Query info for room
  xows_xmp_discoinfo_query(room.bare, null, xows_cli_muc_item_info_parse);
}

/**
 * Callback for user Room get config query result
 */
let xows_cli_muc_cfg_cb = null;

/**
 * Parse result for MUC room configuration form query
 * 
 * @param   {string}    from      Result sender JID
 * @param   {object[]}  form      Array of x fata form
 */
function xows_cli_muc_cfg_get_parse(from, form)
{
  // Retreive the contact related to this query
  const room = xows_cli_room_get(from);
  if(!room) {
    xows_log(1,"cli_muc_cfg_get_parse","unknown/unsubscribed Room",from);
    return;
  }
  
  // Forward Room Owner config form
  if(xows_isfunc(xows_cli_muc_cfg_cb))
    xows_cli_muc_cfg_cb(room, form);
  
  // Allow new query
  xows_cli_muc_cfg_cb = null;
}

/**
 * Function to proceed result of MUC room configuration form submition
 * 
 * @param   {string}    from      Result sender JID
 * @param   {string}    type      Result type
 */
function xows_cli_muc_cfg_set_parse(from, type)
{
  if(type === "result") {
    
    // Retreive the contact related to this query
    const room = xows_cli_room_get(from);
    if(!room) {
      xows_log(1,"cli_muc_cfg_set_parse","unknown/unsubscribed Room",from);
      return;
    }

    // Query Room info
    xows_cli_room_discoinfo(room);
    
    // Forward submit result
    if(xows_isfunc(xows_cli_muc_cfg_cb))
      xows_cli_muc_cfg_cb(room, type);
      
    // Notice: room.init is set to false AFTER call to callback to
    // prevent double-cancel (that throw bad-request error) by GUI
    // during initial config procedure.
    
    // Room configured, no longer need init process.
    room.init = false;
  }
  
  // Allow new query
  xows_cli_muc_cfg_cb = null;
}

/**
 * Query MUC Room config form (current config)
 * 
 * @param   {string}    room      Room object to query conf
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_room_cfg_get(room, onresult)
{ 
  // Prevent concurrent queries
  if(!xows_cli_muc_cfg_cb) {
    xows_cli_muc_cfg_cb = onresult;  //< set the onresult function
    xows_xmp_muc_cfg_get_guery(room.bare, xows_cli_muc_cfg_get_parse);
  } else {
    xows_log(1,"cli_room_cfg_get","overlapping queries");
  }
}

/**
 * Submit MUC Room config form
 * 
 * @param   {string}    room      Room object to query conf
 * @param   {object[]}  submit    Array of fulfilled x fata form to submit
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_room_cfg_set(room, form, onresult)
{ 
  // Prevent concurrent queries
  if(!xows_cli_muc_cfg_cb) {
    xows_cli_muc_cfg_cb = onresult; //< set the onresult function
    xows_xmp_muc_cfg_set_query(room.bare, form, xows_cli_muc_cfg_set_parse);
  } else {
    xows_log(1,"cli_room_cfg_set","overlapping queries");
  }
}

/**
 * Cancel MUC room configuration form
 * 
 * @param   {string}    room      Room object to query conf
 * @param   {object}    onresult  Callback to parse received result
 */
function xows_cli_room_cfg_cancel(room, onresult)
{
  xows_xmp_muc_cfg_set_cancel(room.bare, onresult);
}

/**
 * Object used to store Current Http Upload query related data
 */
let xows_cli_upld_param = null;

/**
 * Callback function for HTTP Upload Rrror
 */
let xows_cli_upld_fw_error = function() {};

/**
 * Callback function for HTTP Upload Success
 */
let xows_cli_upld_fw_success = function() {};

/**
 * Callback function for HTTP Upload Progress
 */
let xows_cli_upld_fw_progress = function() {};

/**
 * Callback function for HTTP Upload Abort
 */
let xows_cli_upld_fw_abort = function() {};

/**
 * Function to query an Http upload slot
 * 
 * @param   {object}    file        File object to upload
 * @param   {object}    onerror     On upload error callback
 * @param   {object}    onsuccess   On upload success callback
 * @param   {object}    onprogress  On upload progress callback
 * @param   {object}    onabort     On upload aborted callback
 */
function xows_cli_upld_query(file, onerror, onsuccess, onprogress, onabort)
{
  // No upload until another is pending
  if(xows_cli_upld_param)
    return;

  if(!xows_cli_svc_exist(XOWS_NS_HTTPUPLOAD)) {
    xows_log(1,"cli_user_upload_query","service not found",
                "the server does not provide "+XOWS_NS_HTTPUPLOAD+"(:0) service");
    xows_cli_fw_onerror(XOWS_SIG_ERR,"HTTP File Upload (XEP-0363) service is unavailable");
    return;
  }

  xows_log(2,"cli_user_upload_query","Upload query for",file.name);

  // Create a new param object to store query data
  xows_cli_upld_param = {"file":file,"url":""};
  
  xows_cli_upld_fw_error = onerror;
  xows_cli_upld_fw_success = onsuccess;
  xows_cli_upld_fw_progress = onprogress;
  xows_cli_upld_fw_abort = onabort;

  // Query an upload slot to XMPP service
  xows_xmp_upload_query(xows_cli_svc_url[XOWS_NS_HTTPUPLOAD], 
                        file.name, file.size, file.type, xows_cli_upld_handle);
}

/**
 * Abort the current progressing file upload if any
 */
function xows_cli_upld_abort()
{
  xows_log(2,"cli_user_upload_abort","upload abort requested");
  if(xows_cli_upld_xhr) {
    xows_cli_upld_xhr.abort();
  }
}

/**
 * Reference to the XMLHttpRequest object created to upload file using
 * PUT request in Http upload context
 */
let xows_cli_upld_xhr = null;

/**
 * Http Upload query XMLHttpRequest.upload "progress" callback function
 * 
 * @param   {object}    event     Progress event object
 */
function xows_cli_upld_xhr_progress(event)
{
  // Forward loading percent
  if(xows_isfunc(xows_cli_upld_fw_progress))
    xows_cli_upld_fw_progress((event.loaded / event.total) * 100);
}

/**
 * Http Upload query XMLHttpRequest.upload "load" callback function
 */
function xows_cli_upld_xhr_success()
{ 
  // Forward file download URL
  if(xows_isfunc(xows_cli_upld_fw_success))
    xows_cli_upld_fw_success(xows_cli_upld_param.url);
    
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
}

/**
 * Http Upload query XMLHttpRequest.upload "error" callback function
 * 
 * @param   {object}    event     Error event object
 */
function xows_cli_upld_xhr_error(event)
{
  const err_msg = "HTTP PUT request failed";
  
  xows_log(1,"cli_upld_xhr_error",err_msg);
  
  // Forward the error event
  if(xows_isfunc(xows_cli_upld_fw_error))
    xows_cli_upld_fw_error(err_msg);
    
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
}

/**
 * Http Upload query XMLHttpRequest.upload "abort" callback function
 * 
 * @param   {object}    event     Error event object
 */
function xows_cli_upld_xhr_abort(event)
{
  xows_log(1,"cli_upld_xhr_error","http PUT request aborted by user");
  xows_cli_upld_param = null; //< Reset query data
  xows_cli_upld_xhr = null;
  // Forward Uploard aborted
  if(xows_isfunc(xows_cli_upld_fw_abort))
    xows_cli_upld_fw_abort();
}

/**
 * Function to handle an Http Upload query result, then start upload
 * if slot was given
 * 
 * @param   {string}    put_url   URL for HTTP PUT request or null if denied
 * @param   {string}    head_list Additionnal <header> elements list for PUT request
 * @param   {string}    get_url   URL to donwload file once uploaded
 * @param   {string}    error     Optional error message if denied
 */
function xows_cli_upld_handle(put_url, head_list, get_url, error)
{
  // Check if we got an error
  if(!put_url) {
    xows_cli_upld_param = null; //< Reset query data
    if(xows_isfunc(xows_cli_upld_fw_error))
      xows_cli_upld_fw_error(error);
    return;
  }
  // Store the URL to download the file once uploaded
  xows_cli_upld_param.url = get_url;
  // Retreive file object and create formdata
  const file = xows_cli_upld_param.file;
  const data = new FormData();
  data.append(file.name, file);
  // Open new HTTP request for PUT form-data
  const xhr = new XMLHttpRequest();
  // Set proper callbacks to Xhr object
  xhr.upload.addEventListener("progress", xows_cli_upld_xhr_progress, false);
  xhr.upload.addEventListener("load", xows_cli_upld_xhr_success, false);
  xhr.upload.addEventListener("error", xows_cli_upld_xhr_error, false);
  xhr.upload.addEventListener("abort", xows_cli_upld_xhr_abort, false);
  xhr.open("PUT", put_url, true);
  xhr.setRequestHeader("Content-Type","main_menucation/octet-stream");
  xows_log(2,"cli_upload_handle","send PUT http request",put_url);
  // Store reference to XMLHttpRequest
  xows_cli_upld_xhr = xhr;
  // Here we go...
  xhr.send(file);
}

/**
 * Query for MUC Room registration request
 * 
 * @param   {object}    room      Room object to join
 */
function xows_cli_muc_register_query(room)
{
  // Send request for Room register (will respond by xform)
  xows_xmp_register_get_query(room.bare, xows_cli_muc_register_parse);
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
function xows_cli_muc_register_parse(from, registered, user, pass, mail, form)
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
    xows_xmp_register_set_query(from, null, null, null, form, null);
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
  xows_xmp_send_presence(bare, "subscribe");
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
  xows_xmp_send_presence(bare, allow?"subscribed":"unsubscribed");
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

/**
 * Join existing room or create new one
 * 
 * If not room object is supplied the function try to join (ie. create) 
 * the room using the supplied room name.
 * 
 * @param   {object}    room      Room object to join, or null
 * @param   {string}    name      Optional room name to join or create
 * @param   {string}    nick      Optional nickname to join room
 * @param   {string}    pass      Optional password to join room (not implemented yet)
 */
function xows_cli_room_join(room, name, nick, pass)
{
  // Verify the server provide MUC service
  if(!xows_cli_svc_exist(XOWS_NS_MUC)) {
    xows_log(1,"cli_room_join","service not found",
                "the server does not provide "+XOWS_NS_MUC+" service");
    xows_cli_fw_onerror(XOWS_SIG_WRN,"Multi-User Chat (XEP-0045) service is unavailable");
    return;
  }

  let bare;
  
  // Check if we got a room object
  if(room) {
    if(room.join) return; // already joined room
    bare = room.bare; //< get room JID
  } else {
    // compose room JID
    bare = name.toLowerCase()+"@"+xows_cli_svc_url[XOWS_NS_MUC];
  }
  
  xows_log(2,"cli_room_join","request join",name+" ("+bare+")");
  
  // Compose destination using Room JID and our nickname
  const to = bare + "/" + (nick ? nick : xows_cli_self.name);
  
  // Send initial presence to Room to join
  xows_xmp_send_presence(to, null, xows_cli_self.show, xows_cli_self.stat, xows_cli_self.avat, true);
}

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
  xows_cli_fw_onselfchange(xows_cli_self);
}

/**
 * Presence level as chosen by user
 */
let xows_cli_chosen_show = -1;

/**
 * Setup and send initial presence
 * 
 * This function should be called only once after client properly 
 * retreived roster content.
 */
function xows_cli_presence_init()
{
  xows_cli_self.show = xows_cli_chosen_show = 3;
 
  xows_log(2,"cli_presence_init","send intial presence");
  
  // Send simple initial presence, without avatar advert
  xows_xmp_send_presence(null, null, 3, xows_cli_self.stat);
  
  // Do not initialize again for this session
  xows_cli_initialize = false;
  
  // Query for own vcard
  if(!xows_options.vcard4_notify) {
    xows_cli_vcard_query(xows_cli_self.bare);
  }

  // Query for own avatar
  if(!xows_options.avatar_notify) {
    xows_cli_avat_meta_query(xows_cli_self.bare);
  }
  
  // Query for own nickname
  xows_cli_nick_query(xows_cli_self.bare);
  
  // All discovery finished, client is ready
  xows_cli_fw_onconnect(xows_cli_self);
  
  // Update user parameters
  xows_cli_fw_onselfchange(xows_cli_self);
}

/**
 * Send and update presence to proper destination and modify internal
 * client data to reflect new user presence
 */
function xows_cli_presence_update()
{
  // Define values as required
  let type, show, stat, avat;
  
  if(xows_cli_self.show >= 0) { 
    show = xows_cli_self.show;
    stat = xows_cli_self.stat;
    avat = xows_cli_self.avat;
  } else { // XOWS_SHOW_OFF === -1
    type = "unavailable";
  }
  
  xows_log(2,"cli_presence_update","send updated presence");
  
  // Simple presence to server
  xows_xmp_send_presence(null, type, show, stat, avat);
  
  // Presence to all joined rooms
  let i = xows_cli_room.length;
  while(i--) {
    if(xows_cli_room[i].join) {
      xows_xmp_send_presence(xows_cli_room[i].join, type, show, stat, avat);
      // Unavailable client exited the room
      if(type) xows_cli_room[i].join = null;
    }
  }
}

/**
 * Set the client current presence show level
 * 
 * @param   {number}    level     Numerical show level to set (-1 to 4)
 */
function xows_cli_change_presence(level)
{
  // Change the show level and send to server
  xows_cli_self.show = xows_cli_chosen_show = level;
  // Send presence with updated values
  xows_cli_presence_update();
  // Forward user status upate
  xows_cli_fw_onselfchange(xows_cli_self);
}

/**
 * Set the client current presence status
 * 
 * @param   {string}    stat      Status string to set
 */
function xows_cli_change_status(stat)
{
  // Do not send useless presence
  if(xows_cli_self.stat === stat) return;
  // Change the status and send to server
  xows_cli_self.stat = stat;
  
  // Save current status to local storage
  xows_cach_peer_save(xows_cli_self.bare, null, null, stat, null);
  
  // Send presence only if there will be no wakeup
  if(xows_cli_self.show === xows_cli_chosen_show) {
    // Send presence with updated values
    xows_cli_presence_update();
  }
  // Forward user status upate
  xows_cli_fw_onselfchange(xows_cli_self);
}

/**
 * Current presence level for Auto Away
 */
let xows_cli_activity_timeout = null;

/**
 * Decrease the client presence level to away or xa
 */
function xows_cli_activity_sleep()
{
  if(xows_cli_activity_timeout) 
    clearTimeout(xows_cli_activity_timeout);
    
  if(xows_cli_self.show > 1) {
    xows_cli_activity_timeout = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min
    // Decrease the show level
    xows_cli_self.show--;
    // Send presence with updated values
    xows_cli_presence_update();
    // Forward user status upate
    xows_cli_fw_onselfchange(xows_cli_self);
  }
}

/**
 * Set presence back to the user chosen one if it is greater than
 * the current "away" value and reset the timer for auto-away.
 */
function xows_cli_activity_wakeup()
{
  if(xows_cli_activity_timeout) 
    clearTimeout(xows_cli_activity_timeout);
    
  xows_cli_activity_timeout = setTimeout(xows_cli_activity_sleep, 600000); //< 10 min
    
  if(xows_cli_self.show < xows_cli_chosen_show) {
    // Reset all to last chosen level
    xows_cli_self.show = xows_cli_chosen_show;
    // Send presence with updated values
    xows_cli_presence_update();
    // Forward user status upate
    xows_cli_fw_onselfchange(xows_cli_self);
  }
}

/**
 * Stops presence activity and auto-away process
 */
function xows_cli_activity_stop()
{
  if(xows_cli_activity_timeout) 
    clearTimeout(xows_cli_activity_timeout);
  
  xows_cli_chosen_show = -1;
  xows_cli_self.show = -1;
}

/**
 *  Reference to composing chatsate timeout thread
 */
let xows_cli_chatstate_timeout = null;

/**
 * Set chat state to and send the proper notification to peer
 * 
 * @param   {object}    peer      Peer object to send notification
 * @param   {object}    chat      New chat state to set
 */
function xows_cli_chatstate_set(peer, chat)
{
  if(chat > XOWS_CHAT_PAUS) { //< composing
    if(xows_cli_chatstate_timeout) {
      clearTimeout(xows_cli_chatstate_timeout);
    } else {
      xows_cli_send_chatstate(peer, chat);
    }
    // Create/reset a timeout to end typing state after delay
    xows_cli_chatstate_timeout = setTimeout(xows_cli_chatstate_set,4000,peer,XOWS_CHAT_PAUS);
  } else {
    clearTimeout(xows_cli_chatstate_timeout);
    xows_cli_send_chatstate(peer, chat);
    xows_cli_chatstate_timeout = null;
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

/**
 * Close the XMPP session and disconnect from server
 */
function xows_cli_disconnect()
{
  xows_log(2,"cli_disconnect","prepare disconnect");
  
  // do not disconnect not connected
  if(!xows_cli_self.jid)
    return;

  // Client is now Offline
  xows_cli_self.show = XOWS_SHOW_OFF;
  
  // Send presence with updated values
  xows_cli_presence_update();
  
  // Close the connection
  xows_xmp_send_close(3); //< Close without error
}
