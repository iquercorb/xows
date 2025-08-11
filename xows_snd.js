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
 * Sound & Audio Module
 *
 * ---------------------------------------------------------------------------*/
/**
 * Globale reference to Web Audio API Context object
 */
let xows_snd_ctx = null;

/**
 * Globale reference to Master Output Gain node
 */
let xows_snd_out_mastr_vol = null;

/**
 * Storage for connected Output Audio sources
 */
const xows_snd_out_src_db = new Map();

/**
 * Storage for connected Input Audio sources
 */
const xows_snd_inp_src_db = new Map();

/**
 * Storage for loaded Sound files
 */
const xows_snd_lib = new Map();

/**
 * Constant value for VU-Meter process FFT size
 */
const XOWS_VUMTR_FFTSIZE = 2048;

/* ---------------------------------------------------------------------------
 *
 * Module Initialization
 *
 * ---------------------------------------------------------------------------*/
/**
 * Module initialization
 *
 * Notice that AudioContext node cannot be created before user interaction by
 * browser policy restriction.
 */
function xows_snd_init()
{
  // Global audio context
  xows_snd_ctx = new AudioContext();

  // Interfaces a Gain-node to audio destination to
  // have a 'master' output volume
  xows_snd_out_mastr_vol = xows_snd_ctx.createGain();
  xows_snd_out_mastr_vol.connect(xows_snd_ctx.destination);

  xows_snd_out_mastr_vol.gain.value = 1.0;

  // Check for loaded audio sample to be connected
  for(const entry of xows_snd_lib.values()) {

    if(entry.node === null) {

      if(entry.audio.readyState > 0) {

        // Create audio node to 'encapsulate' media element
        entry.node = xows_snd_ctx.createMediaElementSource(entry.audio);

        // Connect node to master output
        entry.node.connect(xows_snd_out_mastr_vol);
      }
    }
  }
}

/* ---------------------------------------------------------------------------
 *
 * Module Events Configuration
 *
 * ---------------------------------------------------------------------------*/
/**
 * Module Event-Forwarding callback for VU-Meter data
 */
let xows_snd_fw_onvmtr = function() {};

/**
 * Set callback functions for Module events.
 *
 * The possible events are the following:
 *
 *  - onvmtr     : Vu-Meter analysis
 *
 * @param   {string}    type      Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_snd_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase()) {
    case "onvmtr":      xows_snd_fw_onvmtr = callback; break;
  }
}

/* ---------------------------------------------------------------------------
 *
 * Output and Input gain control
 *
 * ---------------------------------------------------------------------------*/
/**
 * Set master output volume
 *
 * @param   {number}    value   Volume to set (0.0 to 1.0)
 */
function xows_snd_mastr_gain_set(value)
{
  xows_snd_out_mastr_vol.gain.value = value;
}

/**
 * Set global input volume
 *
 * @param   {number}    value   Volume to set (0.0 to 1.0)
 */
function xows_snd_input_gain_set(value)
{
  // It is not very convenient to use one gain node that gather all
  // possible input tracks to control volume of altogether.
  //
  // Instead, one gain node is created per-input stream and set gain
  // value for all at once.

  for(const input of xows_snd_inp_src_db.values()) {
    input.gain.gain.value = value;
  }
}

/* ---------------------------------------------------------------------------
 *
 * Output and Input sources
 *
 * ---------------------------------------------------------------------------*/
/**
 * Creates new output slot and connect audio source to master output
 * with intermediary volume control.
 *
 * @param   {*}         slot      Slot identifier
 * @param   {obejct}    stream    Stream element to plug (MediaStream)
 */
function xows_snd_outpt_new(slot, stream)
{
  // Create source and intermediary gain nodes
  const node = xows_snd_ctx.createMediaStreamSource(stream);
  const gain = xows_snd_ctx.createGain();

  // Create analyzer node for Vu-Meter
  const anal = xows_snd_ctx.createAnalyser();
  anal.fftSize = XOWS_VUMTR_FFTSIZE;

  // Add entry to input data base
  xows_snd_out_src_db.set(slot,{"strm":stream,
                                "node":node,"gain":gain,
                                "anal":anal});

  // Connect node to intermediary gain node
  node.connect(gain);

  // Connect intermediary gain node to 'master-output'
  gain.connect(xows_snd_out_mastr_vol);
}

/**
 * Enable or disable Vu-Meter for the specified output slot
 *
 * @param   {*}         slot      Slot identifier
 * @param   {boolean}   enable    Enable or disable Vu-Meter for source
 * @param   {*}        [param]    Optional parameter for Vu-Meter callback
 */
function xows_snd_outpt_vumtr(slot, enable, param)
{
  if(!xows_snd_out_src_db.has(slot))
    return null;

  // Get output slot data
  const outpt = xows_snd_out_src_db.get(slot);

  if(enable) {

    if(xows_snd_vumtr_has(outpt.anal))
      return;

    // Connect source to analyzer
    outpt.node.connect(outpt.anal);

    // Add entry for Vu-Meter process
    xows_snd_vumtr_add(outpt.anal, param);

  } else {

    if(!xows_snd_vumtr_has(outpt.anal))
      return;

    // Disconnect source from analyzer
    outpt.node.disconnect(outpt.anal);

    // Add entry for Vu-Meter process
    xows_snd_vumtr_rem(outpt.anal);
  }
}

/**
 * Disconnects audio source from master output and delete output slot.
 *
 * @param   {*}         slot      Slot identifier
 * @param   {boolean}   stop      Indicate to stops the related stream tracks
 */
function xows_snd_outpt_delete(slot, stop)
{
  if(!xows_snd_out_src_db.has(slot))
    return;

  // Get output slot data
  const outpt = xows_snd_out_src_db.get(slot);

  // Disconect intermediary gain node
  outpt.gain.disconnect();

  // Remove potential entry for vumeter
  if(xows_snd_vumtr_has(outpt.node))
    xows_snd_vumtr_rem(outpt.node);

  // Disconnect source node
  outpt.node.disconnect();

  if(stop) {
    for(const track of outpt.strm.getTracks())
      track.stop();
  }

  // Delete slot
  xows_snd_out_src_db.delete(slot);
}

/**
 * Set output source gain.
 *
 * @param   {*}         slot      Slot identifier
 * @param   {number}    value     Volume to set (0.0 to 1.0)
 */
function xows_snd_outpt_gain_set(slot, value)
{
  if(!xows_snd_out_src_db.has(slot))
    return;

  // Get output slot data
  xows_snd_out_src_db.get(slot).gain.gain.value = value;
}

/**
 * Creates input slot using specified audio source with intermediary
 * volume control and destination stream.
 *
 * @param   {*}         slot      Slot identifier
 * @param   {obejct}    stream    Stream element to plug (MediaStream)
 *
 * @return  {object}    Destination stream (MediaStream)
 */
function xows_snd_input_new(slot, stream)
{
  // Create source node
  const node = xows_snd_ctx.createMediaStreamSource(stream);
  const gain = xows_snd_ctx.createGain();
  const dest = xows_snd_ctx.createMediaStreamDestination();

  // Create analyzer node for Vu-Meter
  const anal = xows_snd_ctx.createAnalyser();
  anal.fftSize = XOWS_VUMTR_FFTSIZE;

  // Add entry to input data base
  xows_snd_inp_src_db.set(slot,{"strm":stream,
                                "node":node,"gain":gain,"dest":dest,
                                "anal":anal});

  // Connect node to intermediary gain node
  node.connect(gain);

  // Connect node to 'master-input'
  gain.connect(dest);

  return dest.stream;
}

/**
 * Enable or disable Vu-Meter for the specified output slot
 *
 * @param   {*}         slot      Slot identifier
 * @param   {boolean}   enable    Enable or disable Vu-Meter for source
 * @param   {*}        [param]    Optional parameter for Vu-Meter callback
 */
function xows_snd_input_vumtr(slot, enable, param)
{
  if(!xows_snd_inp_src_db.has(slot))
    return null;

  // Get output slot data
  const input = xows_snd_inp_src_db.get(slot);

  if(enable) {

    if(xows_snd_vumtr_has(input.anal))
      return;

    // Connect source to analyzer
    input.node.connect(input.anal);

    // Add entry for Vu-Meter process
    xows_snd_vumtr_add(input.anal, param);

  } else {

    if(!xows_snd_vumtr_has(input.anal))
      return;

    // Disconnect source from analyzer
    input.node.disconnect(input.anal);

    // Add entry for Vu-Meter process
    xows_snd_vumtr_rem(input.anal);
  }
}

/**
 * Returns audio source node of the specified input slot
 *
 * @param   {*}         slot      Slot identifier
 *
 * @return  {object}    Audio Context Node object (MediaStreamAudioSourceNode)
 */
function xows_snd_input_node(slot)
{
  if(!xows_snd_inp_src_db.has(slot))
    return null;

  return xows_snd_inp_src_db.get(slot).node;
}

/**
 * Returns input destination stream.
 *
 * The returned stream is the output processing result after gain control, to
 * be used as input source for other purposes.
 *
 * @param   {*}         slot      Slot identifier
 *
 * @return  {object}    End point of input source processing (MediaStream)
 */
function xows_snd_input_dest(slot)
{
  if(!xows_snd_inp_src_db.has(slot))
    return null;

  return xows_snd_inp_src_db.get(slot).dest.stream;
}

/**
 * Disconnects Media Stream source from master input

 * @param   {*}         slot      Slot identifier
 * @param   {boolean}   stop      Indicate to stops the related stream tracks
 */
function xows_snd_input_delete(slot, stop)
{
  if(!xows_snd_inp_src_db.has(slot))
    return;

  // Get input slot data
  const input = xows_snd_inp_src_db.get(slot);

  // Disconect intermediary gain node
  input.gain.disconnect();

  // Remove potential entry for vumeter
  if(xows_snd_vumtr_has(input.node))
    xows_snd_vumtr_rem(input.node);

  // Disconnect source node
  input.node.disconnect();

  if(stop) {
    for(const track of input.strm.getTracks())
      track.stop();
  }

  // Delete slot
  xows_snd_inp_src_db.delete(slot);
}

/* ---------------------------------------------------------------------------
 *
 * VU-Meter analyzer routines
 *
 * ---------------------------------------------------------------------------*/
/**
 * VU-Meter animation 'setInterval' handle
 */
let xows_snd_vumtr_hnd = null;

/**
 * VU-Meter buffer for audio analysis
 */
const xows_snd_vumtr_buf = new Float32Array(XOWS_VUMTR_FFTSIZE);

/**
 * VU-Meter stack
 */
const xows_snd_vumtr_stk = new Map();

/**
 * Add analyzer node to VU-Meter stack
 *
 * @param   {object}    anal      Analyzer audio node
 * @param   {*}         param     Optional parameter for VU-Meter callaback
 */
function xows_snd_vumtr_add(anal, param)
{
  xows_snd_vumtr_stk.set(anal, param);

  if(!xows_snd_vumtr_hnd)
    xows_snd_vumtr_hnd = setInterval(xows_snd_vumtr_proc, 25);
}

/**
 * Returns whether analyzer node is in VU-Meter stack
 *
 * @param   {object}    anal      Analyzer audio node
 */
function xows_snd_vumtr_has(anal)
{
  return xows_snd_vumtr_stk.has(anal);
}

/**
 * Remove analyzer node from VU-Meter stack
 *
 * @param   {object}    anal      Analyzer audio node
 */
function xows_snd_vumtr_rem(anal)
{
  xows_snd_vumtr_stk.delete(anal);

  // Automatically stop anim if empty stack
  if(xows_snd_vumtr_stk.size === 0) {
    clearInterval(xows_snd_vumtr_hnd);
    xows_snd_vumtr_hnd = null;
  }
}

/**
 * VU-Meter process animation function
 */
function xows_snd_vumtr_proc()
{
  for(const [anal, param] of xows_snd_vumtr_stk.entries()) {
    anal.getFloatTimeDomainData(xows_snd_vumtr_buf);
    // Get peak value for window
    let peak = 0.0;
    for(let i = 0; i < anal.frequencyBinCount; i++) {
      const value = Math.abs(xows_snd_vumtr_buf[i]); // raw data are between 1.0 and -1.0
      if(value > peak) peak = value;
    }
    // Forward vu-meter values
    xows_snd_fw_onvmtr(peak, param);
  }
}

/* ---------------------------------------------------------------------------
 *
 * Sound Samples functions
 *
 * ---------------------------------------------------------------------------*/
/**
 * Handles audio file loading error
 *
 * @param   {object}    event     Event object
 */
function xows_snd_sample_onfailed(event)
{
  const audio = event.target;
  xows_log(1,"snd_sample_onfailed","'"+audio.name+"' audio sample load failed",audio.src);
  xows_snd_lib.delete(audio.name);
}

/**
 * Handles audio file loading success
 *
 * @param   {object}    event     Event object
 */
function xows_snd_sample_onloaded(event)
{
  const entry = xows_snd_lib.get(event.target.name);

  if(xows_snd_ctx) {

    // Create audio node to 'encapsulate' media element
    entry.node = xows_snd_ctx.createMediaElementSource(entry.audio);

    // Connect node to master output
    entry.node.connect(xows_snd_out_mastr_vol);
  }

  xows_log(2,"snd_sample_onloaded","'"+event.target.name+"' audio sample available");
}

/**
 * Loads audio file to sound library at specified slot
 *
 * @param   {string}    name    Sound slot name
 * @param   {string}    file    Sound file name
 */
function xows_snd_sample_load(name, file)
{
  // Create new Audio object
  const audio = new Audio();
  audio.name = name;

  // Add entry to library
  xows_snd_lib.set(name,{"node":null,"audio":audio});

  // Creating path to sound
  const path = xows_options.lib_path+"sounds/"+file;

  xows_log(2,"aud_snd_load","loading '"+name+"' sound",path);

  // Set error callback and start loading
  audio.onerror = xows_snd_sample_onfailed;
  audio.canplay = xows_snd_sample_onloaded;

  // Start fetching data
  audio.src = path;
}

/**
 * Plays the specified sound from sound library
 *
 * @param   {string}    name    Sound slot name
 */
function xows_snd_sample_play(name)
{
  if(xows_snd_lib.has(name)) {
    const audio = xows_snd_lib.get(name).audio;
    audio.loop = false;
    audio.play();
  }
}

/**
 * Plays the specified sound from sound library
 *
 * @param   {string}    name    Sound slot name
 */
function xows_snd_sample_loop(name)
{
  if(xows_snd_lib.has(name)) {
    const audio = xows_snd_lib.get(name).audio;
    audio.loop = true;
    audio.play();
  }
}

/**
 * Stops the specified sound from sound library
 *
 * @param   {string}    name    Sound slot name
 */
function xows_snd_sample_stop(name)
{
  if(xows_snd_lib.has(name))
    xows_snd_lib.get(name).audio.pause();
}
