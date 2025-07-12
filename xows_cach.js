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
 *                  Local Storage Managment API Module
 *
 * ------------------------------------------------------------------ */
/**
 * Returns the most suitable identifier for Peer, it can be either Contact or
 * Occupant JID or Occupant Unique ID if available.
 *
 * @param   {object}    peer      Peer object to get most suitable ID
 *
 * @return  {string}    Peer identifier
 */
function xows_cach_peer_iden(peer)
{
  if(peer.type === XOWS_PEER_OCCU && peer.ocid)
    return peer.ocid;

  return peer.addr;
}

/**
 * Map for cached avatar data stored by SAH-1 hash
 */
const xows_cach_avat_db = new Map();

/**
 * Save avatar data-URL to localStorage and live DB
 *
 * @param   {string}    data      Image data-URL to save.
 * @param   {string}   [hash]     Optional precomputed hash to use as key
 * @param   {boolean}  [temp]     Avoid saving data in localStorage
 *
 * @return  {string}    Avatar data SHA-1 hash used as key
 */
function xows_cach_avat_save(data, hash, temp)
{
  // Use the supplied ID or compute SHA-1 hash of data
  const k = hash ? hash : xows_bytes_to_hex(xows_hash_sha1(xows_url_to_bytes(data)));

  // Store in live DB and localStorage
  xows_cach_avat_db.set(k, data);
  if(!temp) localStorage.setItem(k, data);

  return k;
}

/**
 * Check whether avatar hash exists in localStorage or live DB
 *
 * @param   {string}    hash      Avatar data hash to search
 *
 * @return  {boolean}   True if data exists, false otherwise
 */
function xows_cach_avat_has(hash)
{
  if(xows_cach_avat_db.has(hash)) {
    return true;
  } else if(localStorage.hasOwnProperty(hash)) {
    return true;
  }
  return false;
}

/**
 * Load avatar data-URL corresponding to the given hash
 *
 * @param   {string}    hash      Avatar data hash to search
 *
 * @return  {string}    Avatar data-URL
 */
function xows_cach_avat_get(hash)
{
  // Try in live DB
  if(xows_cach_avat_db.has(hash))
    return xows_cach_avat_db.get(hash);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(hash)) {
    xows_cach_avat_db.set(hash,localStorage.getItem(hash));
    return xows_cach_avat_db.get(hash);
  }

  return null;
}

/**
 * Load or generate temporary avatar data-URL corresponding to the
 * given seed
 *
 * @param   {string}   [seed]     Seed string to generate hash and image
 * @param   {string}   [hash]     Pre-computed hash to generate image
 *
 * @return  {string}    Avatar data-URL
 */
function xows_cach_avat_gen(seed, hash)
{
  // Generate DJB2 hash from seed
  if(seed) hash = xows_bytes_to_hex(xows_hash_djb2(seed));

  // Check whether temp avatar already exist
  if(xows_cach_avat_db.has(hash)) {

    return xows_cach_avat_db.get(hash);

  } else {

    // Generate dummy avatar image
    const data = xows_gen_avatar(XOWS_AVAT_SIZE, null, hash);

    // Store in live DB and localStorage
    xows_cach_avat_db.set(hash, data);

    return data;
  }
}

/**
 * Map for cached peer data stored by JID
 */
const xows_cach_peer_db = new Map();

/**
 * Save User, Room or Occupant data to localStorage and live DB
 *
 * @param   {object}    peer      Peer Object to save data
 */
function xows_cach_peer_save(peer)
{
  const iden = xows_cach_peer_iden(peer);

  let cach;

  // Get existing cached data (Local Storage)
  try {
    cach = JSON.parse(localStorage.getItem(iden));
  } catch(e) {
    xows_log(1,"cli_cache_peer_add","JSON parse error",iden);
  }

  if(cach !== null) {

    // Update cached data
    cach.name = peer.name;
    cach.avat = peer.avat;
    cach.noti = peer.noti;
    // Special behavior for status, null or undefined value
    // this mean it was set by client process.
    if(typeof peer.stat === "string") {
      cach.stat = peer.stat;
    }

  } else {

    // Create new cach data
    cach = {"name":peer.name,
            "avat":peer.avat,
            "stat":peer.stat,
            "noti":peer.noti};
  }

  // Store in live DB and localStorage
  xows_cach_peer_db.set(iden, cach);
  localStorage.setItem(iden, JSON.stringify(cach));
}

/**
 * Check whether peer JID exists in localStorage or live DB
 *
 * @param   {string}    iden      User, Room, Occupant JID or Anonymous UID
 *
 * @return  {string}    True if cached data exists, false otherwise
 */
function xows_cach_peer_has(iden)
{
  if(xows_cach_peer_db.has(iden)) {
    return true;
  } else if(localStorage.hasOwnProperty(iden)) {
    return true;
  }
  return false;
}

/**
 * Retreive User, Room or Occupant data stored in localStorage
 * or live DB.
 *
 * @param   {string}    iden      User, Room, Occupant JID or Anonymous UID
 *
 * @return  {object}    Peer data or null if not found
 */
function xows_cach_peer_get(iden)
{
  // Try in live DB
  if(xows_cach_peer_db.has(iden))
    return xows_cach_peer_db.get(iden);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(iden)) {
    try {
      xows_cach_peer_db.set(iden, JSON.parse(localStorage.getItem(iden)));
    } catch(e) {
      // malformed data
      xows_log(1,"cli_cache_peer_get","JSON parse error",e);
      localStorage.removeItem(iden);
      return null;
    }
    return xows_cach_peer_db.get(iden);
  }

  return null;
}

/**
 * Update Peer object with cached data if available
 *
 * @param   {object}    peer      Peer object to update
 */
function xows_cach_peer_fetch(peer)
{
  const cach = xows_cach_peer_get(xows_cach_peer_iden(peer));
  if(cach) {
    if(cach.name) peer.name = cach.name;
    if(cach.avat) peer.avat = cach.avat;
    if(cach.stat) peer.stat = cach.stat;
    if(cach.noti) peer.noti = cach.noti;
  }
}

/**
 * Array to store discovered entities's capabilities (XEP-0115)
 */
const xows_cach_caps_db = new Map();

/**
 * Save entity capabilities (features)
 *
 * @param   {string}    node      Entity caps node (url)
 * @param   {string[]}  feat      Entity caps feature list
 */
function xows_cach_caps_save(node, feat)
{
  // Store in live DB and localStorage
  xows_cach_caps_db.set(node, feat);
  localStorage.setItem(node, JSON.stringify(feat));
}

/**
 * Check whether entity capabilities (features) is available
 *
 * @param   {string}    node      Entity caps node (url) to check
 *
 * @return  {boolean}   True if entity was found, false otherwise
 */
function xows_cach_caps_has(node)
{
  if(xows_cach_caps_db.has(node)) {
    return true;
  } else if(localStorage.hasOwnProperty(node)) {
    return true;
  }
  return false;
}

/**
 * Retreive entity capabilities (features)
 *
 * @param   {string}    node      Entity caps node (url)
 *
 * @return  {string[]}  Entity caps feature list
 */
function xows_cach_caps_get(node)
{
  if(xows_cach_caps_db.has(node))
    return xows_cach_caps_db.get(node);

  // Try in localStorage (and load to live DB)
  if(localStorage.hasOwnProperty(node)) {
    try {
      xows_cach_caps_db.set(node,JSON.parse(localStorage.getItem(node)));
    } catch(e) {
      // malformed data
      xows_log(1,"cli_cache_caps_get","JSON parse error",e);
      localStorage.removeItem(node);
      return null;
    }
    return xows_cach_caps_db.get(node);
  }

  return null;
}
