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
 * SASL Module
 *
 * ---------------------------------------------------------------------------*/
/**
 * Storage for SASL authentication data
 */
let xows_sasl_auth = null;

/**
 * Storage for SASL password
 */
let xows_sasl_pass = null;

/**
 * Storage for SASL response data
 */
let xows_sasl_resp = null;

/**
 * Storage variable for currently selected SASL mechanism
 */
let xows_sasl_mechid = -1;

/* ---------------------------------------------------------------------------
 * Mechanism function placeholders
 * ---------------------------------------------------------------------------*/
/**
 * Returns the SASL initial auth request string according the current
 * selected mechanism.
 *
 * This is a placeholder intended to be replaced by the proper SASL mechanism
 * function.
 *
 * @return  {string}    Initial SASL auth request string
 */
function xows_sasl_get_request()
{
  if(xows_sasl_mechid < 0) {
    xows_log(1,"sasl_get_reques","no SASL mechanism selected");
    return null;
  }

  return xows_sasl_mechanisms[xows_sasl_mechid].req();
}

/**
 * Returns the SASL challenge response string according the current
 * selected mechanism.
 *
 * This is a placeholder intended to be replaced by the proper SASL mechanism
 * function.
 *
 * @param   {string}    challenge   Received SASL challenge
 *
 * @return  {string}    SASL challenge response string
 */
function xows_sasl_get_response(challenge)
{
  if(xows_sasl_mechid < 0) {
    xows_log(1,"sasl_get_response","no SASL mechanism selected");
    return null;
  }

  return xows_sasl_mechanisms[xows_sasl_mechid].res(challenge);
}

/**
 * Check SASL integrity according the current selected mechanism.
 *
 * This is a placeholder intended to be replaced by the proper SASL mechanism
 * function.
 *
 * @param   {string}    signature   Received SASL signature
 *
 * @return  {string}    True if integrity check succeed, false otherwise
 */
function xows_sasl_chk_integrity(signature)
{
  if(xows_sasl_mechid < 0) {
    xows_log(1,"sasl_chk_integrity","no SASL mechanism selected");
    return false;
  }

  return xows_sasl_mechanisms[xows_sasl_mechid].chk(signature);
}

/**
 * Returns the standard name of the currently selected and initialized
 * SASL mechanism.
 *
 * @return  {string}    Selected SASL mechanism string
 */
function xows_sasl_get_mechanism()
{
  return xows_sasl_mechid >= 0 ? xows_sasl_mechanisms[xows_sasl_mechid].name : null;
}

/**
 * Returns data of the last authentication attempts
 *
 * @return  {object}    Authentication data object
 */
function xows_sasl_get_data()
{
  return xows_sasl_auth;
}

/* ---------------------------------------------------------------------------
 * SASL auth PLAIN Mechanism functions
 * ---------------------------------------------------------------------------*/
/**
 * SASL auth PLAIN mechanism auth request function
 *
 * @return  {string}    Initial authentication request string
 */
function xows_sasl_plain_req()
{
  let req = xows_sasl_auth.z + "\0";
  req += xows_sasl_auth.c + "\0";
  req += xows_sasl_pass;

  // clear password
  xows_sasl_pass = null;

  return req;
}

/**
 * SASL auth PLAIN mechanism challenge dummy function
 *
 * @param   {string}    challenge   Received SASL challenge
 *
 * @return  {string}    Nothing (PLAIN mechanism does not require challenge)
 */
function xows_sasl_plain_resp(challenge)
{
  return "";
}

/**
 * SASL auth PLAIN mechanism integrity check dummy function
 *
 * @param   {string}    signature   Received SASL signature
 *
 * @return  {string}    Always true (PLAIN mechanism does not check integrity)
 */
function xows_sasl_plain_chk(signature)
{
  return true;
}

/* ---------------------------------------------------------------------------
 * SASL SCRAM-SHA-1 Mechanism functions
 * ---------------------------------------------------------------------------*/
/**
 * Storage for SASL mechanism SCRAM-SHA-1 client Nonce
 */
let xows_sasl_sha1_cnon = null;

/**
 * Storage for SASL mechanism SCRAM-SHA-1 client-first-message-bare
 */
let xows_sasl_sha1_cfmb = null;

/**
 * Storage for SASL mechanism SCRAM-SHA-1 server proof data
 */
let xows_sasl_sha1_proof = null;

/**
 * SASL mechanism SCRAM-SHA-1 auth request function
 *
 * @return  {string}    Initial authentication request string
 */
function xows_sasl_sha1_req()
{
  // Generate Nonce and base request
  xows_sasl_sha1_cnon = xows_gen_nonce_asc(24);

  // Compose auth initial request
  let req = "n=" + xows_sasl_auth.c;
  req += ",r=" + xows_sasl_sha1_cnon;

  // Store as "first-client-mesg-bare"
  xows_sasl_sha1_cfmb = req;

  // Finale request with GS2 header
  return "n,," + req;
}

/**
 * SASL mechanism SCRAM-SHA-1 challenge response function
 *
 * @param   {string}    challenge   Received SASL challenge
 * @param   {object}   [data]       Optional saved data to use
 *
 * @return  {string}    Computed response to server challenge
 */
function xows_sasl_sha1_resp(challenge)
{
  let nonce, salt, iter;

  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(let i = 0; i < attrib.length; ++i) {
    parse = attrib[i].match(/([a-z]+)=(.+)/); //< a=Value
    if(parse[1] === "r") nonce = parse[2];
    if(parse[1] === "s") salt  = parse[2];
    if(parse[1] === "i") iter  = parse[2];
  }

  // Verify the server nonce begins by our cnonce
  if(nonce.substring(0, 24) !== xows_sasl_sha1_cnon) {
    xows_sasl_pass = null; //< clear password
    xows_log(0, "sasl_sha1_resp","SCRAM-SHA-1 challenge error","missing cnonce in server nonce");
    return "";
  }

  // Compose the auth message to compute reponse
  let response = "c=biws,r=" + nonce;
  let auth_mesg = xows_sasl_sha1_cfmb;
  auth_mesg += "," + challenge + "," + response;

  let ckey, skey;

  // check for pre-filled authentication data
  if(!xows_sasl_pass) {

    if(xows_sasl_auth.salt !== salt || xows_sasl_auth.iter !== iter) {
      xows_sasl_pass = null; //< clear password
      xows_log(0, "sasl_sha1_resp","SCRAM-SHA-1 saved data error","Salt or Iteration does not match");
      return "";
    }

    ckey = Uint8Array.from(xows_sasl_auth.ckey);
    skey = Uint8Array.from(xows_sasl_auth.skey);

  } else {

    // Comptute salted password
    let salt_pass, tmp;
    salt_pass = tmp = xows_hmac_sha1(xows_sasl_pass, xows_scram_mksalt(salt));
    for(let i = 1; i < iter; ++i) {
      tmp = xows_hmac_sha1(xows_sasl_pass, tmp);
      for(let k = 0; k < 20; ++k) salt_pass[k] ^= tmp[k];
    }

    // Create client and server keys
    ckey = xows_hmac_sha1(salt_pass, "Client Key");
    skey = xows_hmac_sha1(salt_pass, "Server Key");

    // store keys in auth data (allowing to be saved)
    xows_sasl_auth.salt = salt;
    xows_sasl_auth.iter = iter;
    xows_sasl_auth.ckey = Array.from(ckey);
    xows_sasl_auth.skey = Array.from(skey);

    // clear password
    xows_sasl_pass = null;
  }

  // Compute cproof : ckey XOR HMAC(H(ckey), Auth)
  const hkey = xows_hash_sha1(ckey);
  const csign = xows_hmac_sha1(hkey, auth_mesg);
  for(let k = 0; k < 20; k++) ckey[k] ^= csign[k];

  // Compute sproof : HMAC(skey, Auth)
  const ssign = xows_hmac_sha1(skey, auth_mesg);

  // Store sproof for further integrity check
  xows_sasl_sha1_proof = xows_bytes_to_b64(ssign);

  // Finalize the response with computed cproof
  response += ",p=" + xows_bytes_to_b64(ckey);

  return response;
}

/**
 * SASL mechanism SCRAM-SHA-1 integrity check function.
 *
 * @param   {string}    signature Received server signature string
 *
 * @return  {string}    True if supplied signature matches the computed one, false otherwise.
 */
function xows_sasl_sha1_chk(signature)
{
  // parse the server response
  const matches = signature.match(/(v)=(.+)/); //v=Signature

  // Check we got the right signature from server
  if(xows_sasl_sha1_proof !== matches[2]) {
    xows_log(0,"sasl_sha1_chk","SCRAM-SHA-1 integrity check failed",
                "supplied server signature mismatches the computed one");
    return false;
  }

  return true;
}

/* ---------------------------------------------------------------------------
 * SASL DIGEST-MD5 Mechanism functions
 * ---------------------------------------------------------------------------*/
/**
 * SASL mechanism DIGEST-MD5 auth request function
 *
 * @return  {string}    Nothing (DIGEST-MD5 auth is started by the server)
 */
function xows_sasl_md5_req()
{
  return "";
}

/**
 * SASL mechanism DIGEST-MD5 challenge reponse function
 *
 * Notice that this function was never tested live and may not work.
 * Anyway DIGEST-MD5 seem to be deprecated almost everywhere.
 *
 * @param   {string}    challenge Received SASL challenge
 *
 * @return  {string}    Computed response to server challenge
 */
function xows_sasl_md5_resp(challenge)
{
  let realm, nonce, qop, host, rspa;

  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(let i = 0; i < attrib.length; ++i) {
    parse = attrib[i].match(/([a-z]+)="?([^"]+)/); //< attr=Value or attr="Value"
    if(parse[1] === "realm"  ) realm = parse[2];
    if(parse[1] === "nonce"  ) nonce = parse[2];
    if(parse[1] === "qop"    ) qop   = parse[2];
    if(parse[1] === "host"   ) host  = parse[2];
    if(parse[1] === "rspauth") rspa  = parse[2]; //< second challenge
  }

  // Check whether this is the 2nd (alias "rspauth") challenge, it is
  // sent by server in case of authenticiation success.
  if(rspa !== undefined) return ""; //< we ignore it, respond nothing

  // Store auth data localy
  const authc = xows_sasl_auth.c;
  const authz = xows_sasl_auth.z;

  // Create the digest-uri using the authz (JID) domain
  let digest_uri = "xmpp/" + authz.split("@")[1]; //< service domain
  if(host !== undefined) digest_uri += "/" + host;

  // Generate our cnonce
  const cnonce = xows_gen_nonce_asc(24);

  // Compute MD5 reponse digest
  let Y;
  if(!xows_sasl_pass) {

    if(xows_sasl_auth.realm !== realm) {
      xows_sasl_pass = null; //< clear password
      xows_log(0, "sasl_md5_resp","DIGEST-MD5 saved data error","Realm does not match");
      return "";
    }

    Y = xows_sasl_auth.y;

  } else {

    Y = xows_bytes_to_str(xows_hash_md5(authc+":"+realm+":"+xows_sasl_pass));

    // store auth data (allowing to be saved)
    xows_sasl_auth.realm = realm;
    xows_sasl_auth.y = Y;

    // clear password
    xows_sasl_pass = null;
  }

  // This is not used, 00000001 is the recommanded value
  const nc = "00000001";

  const HA1 = xows_bytes_to_hex(xows_hash_md5(Y+":"+nonce+":"+cnonce+":"+authz));
  const HA2 = xows_bytes_to_hex(xows_hash_md5("AUTHENTICATE:"+digest_uri));
  const HKD = xows_bytes_to_hex(xows_hash_md5(HA1+":"+nonce+":"+nc+":"+cnonce+":"+qop+":"+HA2));

  // Compose response string
  let response = "charset=utf-8,";
  response += "username=\""   + authc       + "\",";
  response += "realm=\""      + realm       + "\",";
  response += "nonce=\""      + nonce       + "\",";
  response += "cnonce=\""     + cnonce      + "\",";
  response += "nc="           + nc          + ",";
  response += "digest-uri=\"" + digest_uri  + "\",";
  response += "response=\""   + HKD         + "\",";
  response += "qop=auth";

  return response;
}

/**
 * SASL mechanism DIGEST-MD5 integrity check dummy function
 *
 * @param   {string}    signature Received SASL signature
 *
 * @return  {string}    Always true (DIGEST-MD5 mechanism does not check integrity)
 */
function xows_sasl_md5_chk(signature)
{
  return true;
}

/* ---------------------------------------------------------------------------
 * SASL main functions
 * ---------------------------------------------------------------------------*/
/**
 * List of implemented SASL mechanisms with corresponding
 * request and challenge function. Mechanisms are ordered by
 * preference.
 */
const xows_sasl_mechanisms = [
  { name: "SCRAM-SHA-1",
    req: xows_sasl_sha1_req,
    res: xows_sasl_sha1_resp,
    chk: xows_sasl_sha1_chk},
  { name: "DIGEST-MD5",
    req: xows_sasl_md5_req,
    res: xows_sasl_md5_resp,
    chk: xows_sasl_md5_chk},
  { name: "PLAIN",
    req: xows_sasl_plain_req,
    res: xows_sasl_plain_resp,
    chk: xows_sasl_plain_chk}
];

/**
 * Selects and initializes the proper SASL mechanism according the
 * supplied available list with the given auth data.
 *
 * @param   {string[]}  candidates  List of candidate mechanisms
 * @param   {string}    authz       Authorization ID
 * @param   {string}    authc       Authentication ID
 * @param   {string}    passw       Authentication Password
 *
 * @return  {boolean}   Ture if initialization succeed, false if no suitable implemented mechanism was found.
 */
function xows_sasl_select(candidates/*, authz, authc, passw*/)
{
  // Try to find a suitable SASL mechanism
  xows_sasl_mechid = -1;
  for(let i = 0; i < xows_sasl_mechanisms.length; ++i) {
    if(candidates.includes(xows_sasl_mechanisms[i].name)) {
      xows_sasl_mechid = i;
      return xows_sasl_mechanisms[i].name;
    }
  }

  return null;
}

/**
 * Prepares SASL mechanism with the given auth data.
 *
 * @param   {object}    data        Authentication Data to use or null
 * @param   {string}    authz       Authorization ID
 * @param   {string}    authc       Authentication ID
 * @param   {string}    passw       Authentication Password
 *
 * @return  {boolean}   Ture on success, false if no mechanism selected.
 */
function xows_sasl_prepare(data, authz, authc, passw)
{
  if(xows_sasl_mechid < 0) {
    xows_log(1,"sasl_prepare","No SASL mechanism selected");
    return false;
  }

  if(data) {

    // set saved auth data
    xows_sasl_auth = data;

  } else {

    // Set initial auth data
    xows_sasl_auth = {"mech"  : xows_sasl_get_mechanism(),
                      "z"     : xows_str_to_utf8(authz),
                      "c"     : xows_str_to_utf8(authc)};

    xows_sasl_pass = xows_str_to_utf8(passw);
  }

  return true;
}
