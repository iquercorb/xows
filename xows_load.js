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
 *                     Agnostic Loader Module
 *
 * ------------------------------------------------------------------ */
/**
 * Task bit identifier increment store
 */
let xows_load_next_bit = 0x1;

/**
 * Get valid task bit identifier
 */
function xows_load_task_bit()
{
  const bit = xows_load_next_bit;
  xows_load_next_bit = bit << 1;
  return bit;
}

/**
 * Map to store task callback functions
 */
const xows_load_task_db = new Map();

/**
 * Define function for task to perform
 */
function xows_load_task_set(task, ontask)
{
  xows_load_task_db.set(task, ontask);
}

/**
 * Loading process per-Item stack
 */
const xows_load_item_stk = new Map();

/**
 * Initialize loading process for item.
 *
 * @parma   {object}    item      Peer object to initialize Loading
 * @param   {number}    mask      Bitmask for loading tasks to initialize
 * @param   {function}  onload    Function to call once load finished
 * @param   {*}        [param]    Optional parameter to pass to Onload
 */
function xows_load_task_push(item, mask, onload, param)
{
  if(mask === 0) {
    onload(item, param);
    return;
  }

  let stack;

  // Check for double-init
  if(xows_load_item_stk.has(item)) {

    xows_log(2,"load_task_push","Updating tasks mask 0x"+item.load+"|0x"+mask, item.name);

    // Get existing stack
    stack = xows_load_item_stk.get(item);

  } else {

    xows_log(2,"load_task_push","Setting tasks mask 0x"+item.load+"|0x"+mask, item.name);

    // Create new load stack for this item
    stack = [];
    xows_load_item_stk.set(item, stack);
  }

  // Apply loading mask
  item.load |= mask;

  // Add entry to item's loading stack
  stack.push({"mask":mask,"onload":onload,"param":param});

  // Check every mask bits to lauch proper configured task
  let bit = 0x1;
  do {

    if(mask & bit) {

      // Get task function for this bit
      const ontask = xows_load_task_db.get(bit);

      if(xows_isfunc(ontask)) {
        ontask(item); //< Launch function
      } else {
        // Something is not correct, either provided mask is invalid
        // or loading tasks functions were not properly pre-configured.
        xows_log(1,"load_task_push","No task for bit 0x"+bit, item.name);
        // Set task as done already to prevent waiting infinitely
        xows_load_task_done(item, bit);
      }
    }

    bit = bit << 1;

  } while(bit != xows_load_next_bit);
}

/**
 * Set item loading task as done, if all tasks are done
 * trigger onload.
 *
 * @parma   {object}    item      Peer object to validate
 * @param   {number}    task      Loading task bit to validate
 */
function xows_load_task_done(item, task)
{
  xows_log(2,"load_task_done","Task 0x"+task+" done",item.name);

  // Remove load task bit
  item.load &= ~task;

  // Get item's loading stack
  const stack = xows_load_item_stk.get(item);
  if(!stack) {
   xows_log(1,"load_task_done","No stack for item",item.name);
   return;
  }

  let entry = null;

  // Search for completed item's loading entry
  for(let i = 0; i < stack.length; ++i) {
    if((stack[i].mask & item.load) === 0) {
      entry = stack[i];   //< Store stack entry
      stack.splice(i, 1); //< Remove entry from stack
      break;
    }
  }

  // Check if item finished loading
  if(entry !== null) {

    // Check whether item's loading stack is empty
    if(!stack.length)
      xows_load_item_stk.delete(item);

    // Call configured onload
    entry.onload(item, entry.param);

    // Check for firing of onempty function
    xows_load_onempty_check();
  }
}

/**
 * On-Empty trigger mechanism parameters
 */
const xows_load_onempty_def = {onempty:null,toid:null,param:null};

/**
 * Set an On-Empty trigger function to be called once load stack is
 * empty.
 *
 * In case of load error, the specified function is called anyway
 * after the specified timeout (in miliseconds).
 *
 * If timeout is set to 0, the timeout mechanism is disabled and the
 * function called ONLY once and if load stack is empty.
 *
 * @parma   {number}    timeout   Timeout for fallback trigger
 * @param   {function}  onempty   Callback function to call
 * @param   {*}        [param]    Optional parameter to pass to callback
 */
function xows_load_onempty_set(timeout, onempty, param)
{
  if(xows_load_item_stk.size === 0) {
    xows_log(2,"load_onempty_set","Stack already empty",onempty.name);
    // Loading stack allready empty, skip waiting
    onempty(param);
    return;
  }

  const def = xows_load_onempty_def;

  // Clear any pending timeout
  if(def.toid) {
    clearTimeout(def.toid);
    def.toid = null;
  }

  // Set callback and custom parameter
  def.param = param;
  def.onempty = onempty;

  // Fire new timeout
  if(timeout > 0)
    def.toid = setTimeout(onempty, timeout, param);

  xows_log(2,"load_onempty_set","Configured onempty",def.onempty.name);
}

/**
 * Check whether loading item stack is empty then fire the configured
 * onempty function if any.
 *
 * This function is for internal "load Module" usage and should not be
 * called
 */
function xows_load_onempty_check()
{
  // Check for empty stack to launch onempty
  if(xows_load_onempty_def.onempty && xows_load_item_stk.size === 0) {

    const def = xows_load_onempty_def;

    // Clear pending timeout
    if(def.toid) {
      clearTimeout(def.toid);
      def.toid = null;
    }

    xows_log(2,"load_onempty_check","Fireing onempty",def.onempty.name);

    // Call defined callback
    def.onempty(def.param);

    // Reset parameters
    def.onempty = null;
    def.param = null;
  }
}
