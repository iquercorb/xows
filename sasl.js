/* ------------------------------------------------------------------
 * 
 *                         SASL API Module
 * 
 * ------------------------------------------------------------------ */
 
/**
 * Variable to store contextual data for SASL challenge process.
 */
let xows_sasl_data = null;

/**
 * Standard name of the current selected and initialized SASL 
 * mechanism.
 */
let xows_sasl_select = "";

/**
 * Get the SASL initial auth request string according the current
 * initialized mechanism. This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @return  {string}  Initial SASL auth request string
 */
let xows_sasl_get_request = function() {return "";};

/**
 * Get the SASL challenge response string according the current
 * initialized mechanism.This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @param   {string}  challenge    Received SASL challenge.
 * 
 * @return  {string}  SASL challenge response string
 */
let xows_sasl_get_response = function(challenge) {return "";};

/**
 * Checks the SASL integrity according the current
 * initialized mechanism. This function is intended to be replaced
 * by the proper SASL mechanism.
 * 
 * @param   {string}  signature    Received SASL signature.
 * 
 * @return  {string}  True if integrity check succeed, false otherwise
 */
let xows_sasl_chk_integrity = function(signature) {return true;};

/**
 * Custom callback function fired if SASL process fail.
 */
let xows_sasl_failure_cb = function() {};

/**
 * Custom callback function fired if SASL process succeed.
 */
let xows_sasl_success_cb = function() {};

/**
 * Return the standard name of the currently selected and initialized 
 * SASL mechanism.
 * 
 * @return  {string}  Selected SASL mechanism string
 */
function xows_sasl_get_selected()
{
  return xows_sasl_select;
}

/**
 * SASL auth PLAIN mechanism auth request function.
 * 
 * @return  {string}  Initial authentication request string
 */
function xows_sasl_plain_req()
{
  let req = xows_sasl_data.authz + "\0"; 
  req += xows_sasl_data.authc + "\0"; 
  req += xows_sasl_data.passw;
  
  // clear auth data
  xows_sasl_data = {};

  return req;
}

/**
 * SASL auth PLAIN mechanism challenge dummy function. 
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Nothing (PLAIN mechanism does not require challenge)
 */
function xows_sasl_plain_resp(challenge)
{
  return "";
}

/**
 * SASL auth PLAIN mechanism integrity check dummy function. 
 * 
 * @param   {string}  signature   Received SASL signature.
 * 
 * @return  {string}  Always true (PLAIN mechanism does not check integrity)
 */
function xows_sasl_plain_chk(signature)
{
  return true;
}

/**
 * SASL mechanism SCRAM-SHA-1 auth request function.
 * 
 * @return  {string}  Initial authentication request string
 */
function xows_sasl_sha1_req() 
{
  // Generate Nonce and base request
  xows_sasl_data.cnonce = xows_gen_nonce_asc(24);
  
  // Compose auth initial request
  let req = "n=" + xows_sasl_data.authc;
  req += ",r=" + xows_sasl_data.cnonce;
  
  // Store as "first-client-mesg-bare"
  xows_sasl_data.client_first_message_bare = req;
  
  // Finale request with GS2 header
  return "n,," + req;
}

/**
 * SASL mechanism SCRAM-SHA-1 challenge response function. 
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Computed response to server challenge
 */
function xows_sasl_sha1_resp(challenge) 
{
  let i, k, n, nonce, salt, iter;
  
  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(i = 0, n = attrib.length; i < n; ++i) {
    parse = attrib[i].match(/([a-z]+)=(.+)/); //< a=Value
    if(parse[1] === "r") nonce = parse[2];
    if(parse[1] === "s") salt  = parse[2];
    if(parse[1] === "i") iter  = parse[2];
  }

  // Verify the server nonce begins by our cnonce
  if(nonce.substr(0, 24) !== xows_sasl_data.cnonce) {
    xows_sasl_data = {}; //< clear auth data
    xows_log(0, "sasl_sha1_resp","SCRAM-SHA-1 challenge error",
                "missing cnonce in server nonce");
    if(xows_is_func(xows_sasl_failure_cb)) 
      xows_sasl_failure_cb();
    return "";
  }
  
  // Compose the auth message to compute reponse
  let response = "c=biws,r=" + nonce;
  let auth_mesg = xows_sasl_data.client_first_message_bare;
  auth_mesg += "," + challenge + "," + response;
  
  // Comptute salted password
  let slat_pass, tmp;
  slat_pass = tmp = xows_hmac_sha1(xows_sasl_data.passw, atob(salt)+"\x00\x00\x00\x01");
  for(i = 1; i < iter; ++i) {
    tmp = xows_hmac_sha1(xows_sasl_data.passw, tmp);
    for(k = 0; k < 20; ++k) slat_pass[k] ^= tmp[k];
  }
  
  // Create client and server keys
  let ckey = xows_hmac_sha1(slat_pass, "Client Key");                            
  const skey = xows_hmac_sha1(slat_pass, "Server Key");

  // Compute cproof : ckey XOR HMAC(H(ckey), Auth)
  const hkey = xows_hash_sha1(ckey);
  const csign = xows_hmac_sha1(hkey, auth_mesg);
  for(k = 0; k < 20; k++) ckey[k] ^= csign[k];

  // clear auth data
  xows_sasl_data = {};
  
  // Compute sproof : HMAC(skey, Auth)
  const ssign = xows_hmac_sha1(skey, auth_mesg);
  
  // Store sproof for further integrity check
  xows_sasl_data.sproof = xows_bytes_to_b64(ssign);

  // Finalize the response with computed cproof
  response += ",p=" + xows_bytes_to_b64(ckey);
  
  return response;
}

/**
 * SASL mechanism SCRAM-SHA-1 integrity check function. 
 * 
 * @param   {string}  signature   Received server signature string.
 * 
 * @return  {string}  True if supplied signature matches the computed  
 *                    one, false otherwise.
 */
function xows_sasl_sha1_chk(signature)
{ 
  // parse the server response
  const matches = signature.match(/(v)=(.+)/); //v=Signature
  
  // Get the stored server signature
  const sproof = xows_sasl_data.sproof;
  
  // clear auth data
  xows_sasl_data = {};
  
  // Check we got the right signature from server
  if(sproof !== matches[2]) {
    xows_log(0,"sasl_sha1_chk","SCRAM-SHA-1 integrity check failed",
                "supplied server signature mismatches the computed one");
    return false;
  }

  return true;
}

/**
 * SASL mechanism DIGEST-MD5 auth request function.
 * 
 * @return  {string} Nothing (DIGEST-MD5 auth is started by the server)
 */
function xows_sasl_md5_req() 
{
  return "";
}

/**
 * SASL mechanism DIGEST-MD5 challenge reponse function. 
 * 
 * Notice that this function was never tested live and may not work. 
 * Anyway DIGEST-MD5 seem to be deprecated almost everywhere.
 * 
 * @param   {string}  challenge   Received SASL challenge.
 * 
 * @return  {string}  Computed response to server challenge
 */
function xows_sasl_md5_resp(challenge) 
{
  let realm, nonce, qop, host, rspa;

  // Parse attributes of challenge string (comma separated attributes)
  let parse, attrib = challenge.split(",");
  for(let i = 0, n = attrib.length; i < n; ++i) {
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
  const authc = xows_sasl_data.authc;
  const authz = xows_sasl_data.authz;
  const passw = xows_sasl_data.passw;
  xows_sasl_data = {}; //< clean auth data
  
  // Create the digest-uri using the authz (JID) domain
  let digest_uri = "xmpp/" + authz.split("@")[1]; //< service domain
  if(host !== undefined) digest_uri += "/" + host;
  
  // Generate our cnonce 
  const cnonce = xows_gen_nonce_asc(24);
  
  // This is not used, 00000001 is the recommanded value
  const nc = "00000001";

  // Compute MD5 reponse digest
  const Y = xows_bytes_to_str(xows_hash_md5(authc+":"+realm+":"+passw));
  const HA1 = xows_bytes_to_hex(xows_hash_md5(Y+":"+nonce+":"+cnonce+":"+authz)); 
  const HA2 = xows_bytes_to_hex(xows_hash_md5("AUTHENTICATE:"+digest_uri));
  const HKD = xows_bytes_to_hex(xows_hash_md5(HA1+":"+nonce+":"+nc+"1:"+cnonce+":"+qop+":"+HA2));
  
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
 * SASL mechanism DIGEST-MD5 integrity check dummy function. 
 * 
 * @param   {string}  signature   Received SASL signature.
 * 
 * @return  {string}  Always true (DIGEST-MD5 mechanism does not check integrity)
 */
function xows_sasl_md5_chk(signature)
{
  return true;
}

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
 * Select and initialize the proper SASL mechanism according the
 * supplied available list with the given auth data.
 * 
 * @param   {string[]}  candidates   List of candidate mechanisms.
 * @param   {string}    authz        Authorization ID.
 * @param   {string}    authc        Authentication ID.
 * @param   {string}    passw        Authentication Password.
 * @param   {function}  onsuccess    Optional callback for SASL success.
 * @param   {function}  onfailure    Optional callback for SASL failure.
 * 
 * @return  {boolean} Ture if initialization succeed, false if no 
 *                    suitable implemented mechanism was found.
 */
function xows_sasl_init(candidates, authz, authc, passw, onsuccess, onfailure)
{
  // Try to find a suitable SASL mechanism
  let mech_idx = -1;
  for(let i = 0, n = xows_sasl_mechanisms.length; i < n; ++i) {
    if(candidates.includes(xows_sasl_mechanisms[i].name)) {
      xows_sasl_select = xows_sasl_mechanisms[i].name; 
      mech_idx = i;
      break;
    }
  }
  
  if(mech_idx !== -1) {
    
    // Set custom callbacks
    xows_sasl_failure_cb = onfailure;
    xows_sasl_success_cb = onsuccess;
    
    // Set the proper functions for start and challenge
    xows_sasl_get_request = xows_sasl_mechanisms[mech_idx].req;
    xows_sasl_get_response = xows_sasl_mechanisms[mech_idx].res;
    xows_sasl_chk_integrity = xows_sasl_mechanisms[mech_idx].chk;
    
    // Set initial auth data
    xows_sasl_data = {};
    xows_sasl_data.authz = xows_str_to_utf8(authz);
    xows_sasl_data.authc = xows_str_to_utf8(authc);
    xows_sasl_data.passw = xows_str_to_utf8(passw);
    
    return true;
  }
  return false;
}
