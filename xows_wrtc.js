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
 *                    WebRTC Interface API Module
 *
 * ------------------------------------------------------------------ */
/**
 * WebRTC instances list with parameters
 */
const xows_wrtc_db = new Map();

/**
 * Generate Turn server REST API credential from secret
 *
 * @param   {string}    name      Username to use for generation
 * @param   {string}    secret    TURN server static secret
 *
 * @return  {object}    Generated username and password
 */
function xows_wrtc_gen_credential(name, secret)
{
  const expire = parseInt(Date.now()/1000) + 24*3600;
  const username = expire+":"+name;
  const password = xows_bytes_to_b64(xows_hmac_sha1(username, secret));

  return {"username":username,"password":password};
}

/**
 * Callback function for WebRTC Peer Connection error
 *
 * @param   {object}      error    Error object
 */
function xows_wrtc_onerror(rpc, error)
{
  xows_log(1,"wrtc_onerror",error.message);

  const db = xows_wrtc_db.get(rpc);

  // Forward error
  if(xows_isfunc(db.onerror))
    db.onerror(rpc, error, db.param);
}

/**
 * Callback function for WebRTC Peer Connection connection state changed
 *
 * @param   {object}      event     Event object
 */
function xows_wrtc_oncnxstate(event)
{
  const rpc = event.target;

  xows_log(2,"wrtc_oncnxstate","Connection state",rpc.connectionState);

  const db = xows_wrtc_db.get(rpc);

  // Forward status
  if(xows_isfunc(db.onstate))
    db.onstate(rpc, rpc.connectionState, db.param);
}

/**
 * Callback function for WebRTC Peer Connection negotiation required
 *
 * @param   {object}      event     Event object
 */
function xows_wrtc_onneednego(event)
{
  const rpc = event.target;

  xows_log(2,"wrtc_onneednego","Create SDP offer");

  // Request to create an SDP Offer
  rpc.createOffer().then((rsd) => rpc.setLocalDescription(rsd))
                   .then(null, (err) => xows_wrtc_onerror(rpc, err));
}

/**
 * Callback function for WebRTC Peer Connection ICE gathering state changed
 *
 * @param   {object}      event    Event object
 */
function xows_wrtc_onicestate(event)
{
  const rpc = event.target;

  xows_log(2,"wrtc_onicestate","ICE gathering state",rpc.iceGatheringState);

  const db = xows_wrtc_db.get(rpc);

  // Forward ICE state
  if(xows_isfunc(db.onstate))
    db.onstate(rpc, rpc.iceGatheringState, db.param);

  if(rpc.iceGatheringState === "complete") {
    // Forward generated local SDP
    if(xows_isfunc(db.onsdesc))
      db.onsdesc(rpc, rpc.localDescription.sdp, db.param);
  }
}

/**
 * Callback function for WebRTC Peer Connection
 * ICE Candidate error
 *
 *@param   {object}      event    RTCPeerConnectionIceErrorEvent object
 */
function xows_wrtc_oniceerror(event)
{
  const rpc = event.target;

  xows_log(1,"wrtc_oniceerror",event.name);

  const db = xows_wrtc_db.get(rpc);

  // Forward error
  if(xows_isfunc(db.onerror))
    db.onerror(rpc, event, db.param);
}

/**
 * Callback function for WebRTC Peer Connection media stream available
 *
 * @param   {object}      event    RTCP Track event (RTCTrackEvent) object
 */
function xows_wrtc_ontrack(event)
{
  // Forward media stream
  if(event.streams.length) {

    const rpc = event.target;

    xows_log(2,"wrtc_ontrack","Remote stream available");

    const db = xows_wrtc_db.get(rpc);

    // Call onstream callback with custom parameter
    if(xows_isfunc(db.ontrack))
      db.ontrack(rpc, event.streams[0], db.param);
  }
}

/**
 * Close and delete WebRTC Peer Connection
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 */
function xows_wrtc_close(rpc)
{
  xows_log(2,"wrtc_close","Deleting RTC object");

  // Close RTC Peer Connection
  rpc.close();
  xows_wrtc_db.delete(rpc);
}

/**
 * Create new WebRTC Peer Connection using specified STUN and TURN server list
 *
 * The ICE server description object must follow the service shema as provided
 * by the XMPP External Service Discovery (XEP-0215).
 *
 * TURN servers must be provided with either REST API 'username' and 'password',
 * or a 'secret' propertie corresponding to server's static auth secret.
 *
 * @param   {object[]}    icelist  Array of ICE server description objects
 * @param   {function}    onsdesc  Callback function for session description
 * @param   {function}    ontrack  Callback function for connection state
 * @param   {function}    onstate  Callback function for connection state
 * @param   {function}    onerror  Callback function for error
 * @param   {function}   [param]   Optional extra parameter to pass to callbacks
 *
 * @return  {object}  New instance of RTCPeerConnection object
 */
function xows_wrtc_new(icelist, onsdesc, ontrack, onstate, onerror, param)
{
  // Build array for ICE Servers descriptor
  const iceservers = [];

  for(let i = 0; i < icelist.length; ++i) {
    const ice = {urls:icelist[i].type+":"+icelist[i].host};
    // Check whether we need to generate credentials
    if(icelist[i].secret) {
      const creds = xows_wrtc_gen_credential(xows_cli_self.addr, icelist[i].secret);
      ice.username = creds.username;
      ice.credential = creds.password;
    } else {
      if(icelist[i].username) ice.username = icelist[i].username;
      if(icelist[i].password) ice.credential = icelist[i].password;
    }
    iceservers.push(ice);
  }

  const rpc = new RTCPeerConnection({"iceServers":iceservers});

  // Set callback functions
  rpc.ontrack = xows_wrtc_ontrack;
  rpc.onnegotiationneeded = xows_wrtc_onneednego;
  rpc.onconnectionstatechange = xows_wrtc_oncnxstate;
  rpc.onicegatheringstatechange = xows_wrtc_onicestate;
  rpc.onicecandidateerror = xows_wrtc_oniceerror;

  xows_wrtc_db.set(rpc,{"onerror":onerror,"onstate":onstate,"onsdesc":onsdesc,"ontrack":ontrack,"param":param});

  return rpc;
}

/**
 * Set WebRTC Peer Connection local stream.
 *
 * If called in first after RPC creation, while no remote SDP available in RPC
 * object, it is assumed to be an outbound call initiation, an SDP Offer will
 * be generated.
 *
 * If called in a later time, while remote SDP do exists in RPC object, it is
 * assumed to be an inbound call accept, an SDP Answer will be generated.
 *
 * Once SDP description (either Offer or Answer) created, the configured
 * 'onsdesc' callback will be called.
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {object}      stream    Media Streams API MediaStream object.
 */
function xows_wrtc_set_local_stream(rpc, stream)
{
  // Add stream tracks to RTC Connection
  const tracks = stream.getTracks();
  for(let i = 0; i < tracks.length; ++i)
    rpc.addTrack(tracks[i]);

  xows_log(2,"wrtc_local_stream","Local stream added");

  // Already set remoteDescription mean call acceptance, we must create an
  // SDP Answer.
  if(rpc.remoteDescription) {

    xows_log(2,"wrtc_local_stream","Create SDP Answer");

    // Request to create an SDP Answer
    rpc.createAnswer().then((rsd) => rpc.setLocalDescription(rsd))
                      .then(null, (err) => xows_wrtc_onerror(rpc, err));
  }

  // An unset remoteDescription mean call initiation, the WebRTC interface
  // will call onnegotiationneeded callback to request creation of SDP Offer.
}

/**
 * Add Remote description to be supplied to WebRTC Peer Connection.
 *
 * If called in first after RPC creation, while no local SDP available in RPC
 * object, it is assumed to be an inbound call initiation, an SDP Offer will be
 * generated.
 *
 * If called in a later time, while local SDP do exists in RPC object, it is
 * assumed to be an outbound call accept, an SDP Answer will be generated.
 *
 * Once remote stream available, the configured 'ontrack' callback will be
 * called.
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 * @param   {string}      sdp       Received remote SDP Description string.
 */
function xows_wrtc_set_remote_sdp(rpc, sdp)
{
  // Already set localDescription mean we are initiator
  const type = rpc.localDescription ? "answer" : "offer";
  const rsd = new RTCSessionDescription({"type":type,"sdp":sdp});

  xows_log(2,"wrtc_set_remote_sdp","Setting remote SDP",type);

  rpc.setRemoteDescription(rsd).then(null, (err) => xows_wrtc_onerror(rpc, err));
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Local Description defined.
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 *
 * @return  {boolean}   True if Local Description is defined, false otherwise.
 */
function xows_wrtc_has_local(rpc)
{
  return (rpc.localDescription !== null);
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Remote Description defined.
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 *
 * @return  {boolean}   True if Remote Description is defined, false otherwise.
 */
function xows_wrtc_has_remote(rpc)
{
  return (rpc.remoteDescription !== null);
}

/**
 * Returns whether WebRTC Peer Connection currently have a valid
 * Local Description defined.
 *
 * @param   {object}      rpc       Instance of RTCPeerConnection object
 *
 * @return  {boolean}   True if Local Description is defined, false otherwise.
 */
function xows_wrtc_connected(rpc)
{
  return (rpc.connectionState === "connected");
}
